// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import { writable, get } from "svelte/store";
import {
  startPointStore,
  linesStore,
  sequenceStore,
  shapesStore,
  settingsStore,
  normalizeLines,
} from "./projectStore";
import { currentFilePath } from "../stores";
import type {
  Line,
  Point,
  SequenceItem,
  Shape,
  Settings,
} from "../types/index";

// Compatible with ProjectData in diffStore.ts
export interface CheckpointData {
  startPoint: Point;
  lines: Line[];
  sequence: SequenceItem[];
  shapes: Shape[];
  settings: Settings;
}

export interface Checkpoint {
  id: string;
  name: string;
  timestamp: number;
  data: CheckpointData;
}

const STORAGE_KEY_PREFIX = "pedro_checkpoints_";

export const checkpoints = writable<Checkpoint[]>([]);

// Helper to get storage key based on file path
function getStorageKeyForPath(path: string | null): string | null {
  if (!path) return null;
  return STORAGE_KEY_PREFIX + path.replace(/[^a-zA-Z0-9]/g, "_");
}

function getStorageKey(): string | null {
  return getStorageKeyForPath(get(currentFilePath));
}

export function loadCheckpoints() {
  const key = getStorageKey();
  if (!key) {
    // If no key (unsaved), we keep the current in-memory checkpoints
    // (do not clear them, as user might be creating them in a new project)
    // However, if we just switched FROM a file TO a new project (Reset),
    // we should have cleared them.
    // Ideally, `resetProject` should clear checkpoints.
    // But `resetProject` is in `projectStore` or `App`.
    // Let's assume `resetProject` handles cleanup or we handle it via subscription.
    return;
  }

  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Normalize lines on load to ensure consistency
      const normalized = parsed.map((cp: Checkpoint) => ({
        ...cp,
        data: {
          ...cp.data,
          lines: normalizeLines(cp.data.lines || []),
        },
      }));
      checkpoints.set(normalized);
    } else {
      checkpoints.set([]);
    }
  } catch (e) {
    console.error("Failed to load checkpoints:", e);
    checkpoints.set([]);
  }
}

export function saveCheckpoints() {
  const key = getStorageKey();
  if (!key) return; // Don't persist for unsaved projects (keep in memory)

  const current = get(checkpoints);
  try {
    localStorage.setItem(key, JSON.stringify(current));
  } catch (e) {
    console.error("Failed to save checkpoints:", e);
  }
}

export function createCheckpoint(name: string) {
  const data: CheckpointData = {
    startPoint: JSON.parse(JSON.stringify(get(startPointStore))),
    lines: JSON.parse(JSON.stringify(get(linesStore))),
    sequence: JSON.parse(JSON.stringify(get(sequenceStore))),
    shapes: JSON.parse(JSON.stringify(get(shapesStore))),
    settings: JSON.parse(JSON.stringify(get(settingsStore))),
  };

  const newCheckpoint: Checkpoint = {
    id: Math.random().toString(36).substring(2, 11),
    name: name || `Checkpoint ${new Date().toLocaleTimeString()}`,
    timestamp: Date.now(),
    data,
  };

  checkpoints.update((list) => {
    const newList = [newCheckpoint, ...list];
    return newList;
  });

  saveCheckpoints();
}

export function restoreCheckpointData(data: CheckpointData) {
  startPointStore.set(JSON.parse(JSON.stringify(data.startPoint)));
  linesStore.set(normalizeLines(JSON.parse(JSON.stringify(data.lines))));
  sequenceStore.set(JSON.parse(JSON.stringify(data.sequence)));
  shapesStore.set(JSON.parse(JSON.stringify(data.shapes)));
  settingsStore.set(JSON.parse(JSON.stringify(data.settings)));
}

export function deleteCheckpoint(id: string) {
  checkpoints.update((list) => {
    const newList = list.filter((cp) => cp.id !== id);
    return newList;
  });
  saveCheckpoints();
}

export function renameCheckpoint(id: string, name: string) {
  checkpoints.update((list) => {
    const newList = list.map((cp) =>
      cp.id === id ? { ...cp, name } : cp
    );
    return newList;
  });
  saveCheckpoints();
}

// Track previous path to handle transition from Unsaved -> Saved
let lastFilePath: string | null = null;

// Subscribe to file path changes to load relevant checkpoints
currentFilePath.subscribe((path) => {
  // If transitioning from Unsaved (null) to Saved (string),
  // and we have in-memory checkpoints, persist them to the new key.
  if (lastFilePath === null && path !== null) {
    const current = get(checkpoints);
    if (current.length > 0) {
      const newKey = getStorageKeyForPath(path);
      if (newKey) {
        try {
          localStorage.setItem(newKey, JSON.stringify(current));
        } catch (e) {
          console.error("Failed to migrate checkpoints to new path:", e);
        }
      }
    }
  } else if (path === null && lastFilePath !== null) {
    // Transitioning from Saved to Unsaved (e.g. New Project).
    // We should clear checkpoints.
    // Note: If App.svelte calls `resetPath` then `currentFilePath.set(null)`,
    // we want to ensure we start with empty checkpoints for the new project.
    checkpoints.set([]);
  }

  lastFilePath = path;

  if (path) {
    loadCheckpoints();
  }
});
