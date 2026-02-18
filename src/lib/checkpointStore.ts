// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import { writable, get } from "svelte/store";
import { currentFilePath, notification } from "../stores";
import {
  linesStore,
  startPointStore,
  sequenceStore,
  shapesStore,
  settingsStore,
  sanitizeSequence,
  normalizeLines,
} from "./projectStore";
import type { ProjectData } from "./diffStore";

export interface Checkpoint {
  id: string;
  name: string;
  timestamp: number;
  data: ProjectData;
}

const STORAGE_PREFIX = "pedro_checkpoint_";

function getStorageKey(path: string) {
  return STORAGE_PREFIX + path;
}

// In-memory store
export const checkpoints = writable<Checkpoint[]>([]);

// Subscribe to file path changes to load relevant checkpoints
currentFilePath.subscribe((path) => {
  loadCheckpoints(path);
});

function getStoredCheckpoints(path: string): Checkpoint[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const item = localStorage.getItem(getStorageKey(path));
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.warn("Failed to load checkpoints from localStorage", e);
    return [];
  }
}

function saveStoredCheckpoints(path: string, items: Checkpoint[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(path), JSON.stringify(items));
  } catch (e) {
    console.warn("Failed to save checkpoints to localStorage", e);
  }
}

export function loadCheckpoints(path: string | null) {
  if (!path) {
    checkpoints.set([]);
    return;
  }
  checkpoints.set(getStoredCheckpoints(path));
}

export function saveCheckpointsToPath(path: string) {
  const current = get(checkpoints);
  saveStoredCheckpoints(path, current);
}

export function createCheckpoint(name: string) {
  const path = get(currentFilePath);

  // Create project data snapshot
  const data: ProjectData = {
    startPoint: structuredClone(get(startPointStore)),
    lines: structuredClone(get(linesStore)),
    sequence: structuredClone(get(sequenceStore)),
    shapes: structuredClone(get(shapesStore)),
    settings: structuredClone(get(settingsStore)),
  };

  const newCheckpoint: Checkpoint = {
    id: crypto.randomUUID(),
    name: name || `Checkpoint ${new Date().toLocaleTimeString()}`,
    timestamp: Date.now(),
    data,
  };

  checkpoints.update((current) => {
    const updated = [newCheckpoint, ...current];

    // Persist if we have a file path
    if (path) {
      saveStoredCheckpoints(path, updated);
    }

    return updated;
  });

  notification.set({
    message: `Checkpoint "${newCheckpoint.name}" created`,
    type: "success",
  });
}

export function restoreCheckpoint(checkpoint: Checkpoint) {
  const { data } = checkpoint;

  // Restore stores
  startPointStore.set(structuredClone(data.startPoint));
  linesStore.set(normalizeLines(structuredClone(data.lines)));
  shapesStore.set(structuredClone(data.shapes));
  settingsStore.set(structuredClone(data.settings));

  // Ensure sequence is valid
  const sanitized = sanitizeSequence(get(linesStore), structuredClone(data.sequence));
  sequenceStore.set(sanitized);

  notification.set({
    message: `Restored checkpoint "${checkpoint.name}"`,
    type: "info",
  });
}

export function deleteCheckpoint(id: string) {
  const path = get(currentFilePath);

  checkpoints.update((current) => {
    const updated = current.filter((c) => c.id !== id);

    if (path) {
      saveStoredCheckpoints(path, updated);
    }

    return updated;
  });
}

export function renameCheckpoint(id: string, newName: string) {
  const path = get(currentFilePath);

  checkpoints.update((current) => {
    const updated = current.map((c) =>
      c.id === id ? { ...c, name: newName } : c
    );

    if (path) {
      saveStoredCheckpoints(path, updated);
    }

    return updated;
  });
}
