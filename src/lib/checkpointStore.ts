// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import { writable, get } from "svelte/store";
import { currentFilePath } from "../stores";
import type { ProjectData } from "./diffStore";
import {
  startPointStore,
  linesStore,
  sequenceStore,
  shapesStore,
  settingsStore,
} from "./projectStore";

export interface Checkpoint {
  id: string;
  name: string;
  timestamp: number;
  data: ProjectData;
}

const makeId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const checkpoints = writable<Checkpoint[]>([]);

// Internal helper to save
function saveToStorage(val: Checkpoint[]) {
  const path = get(currentFilePath);
  if (path) {
    try {
      const key = `pp_checkpoints_${path}`;
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error("Failed to save checkpoints", e);
    }
  }
}

// Subscribe to file path changes to load relevant checkpoints
currentFilePath.subscribe((path) => {
  if (path) {
    try {
      const key = `pp_checkpoints_${path}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        checkpoints.set(JSON.parse(stored));
      } else {
        checkpoints.set([]);
      }
    } catch (e) {
      console.error("Failed to load checkpoints", e);
      checkpoints.set([]);
    }
  } else {
    // Clear checkpoints for new/unsaved project
    checkpoints.set([]);
  }
});

export function createCheckpoint(name: string) {
  const data: ProjectData = {
    startPoint: get(startPointStore),
    lines: get(linesStore),
    sequence: get(sequenceStore),
    shapes: get(shapesStore),
    settings: get(settingsStore),
  };

  const newCheckpoint: Checkpoint = {
    id: makeId(),
    name: name || `Checkpoint ${new Date().toLocaleTimeString()}`,
    timestamp: Date.now(),
    data,
  };

  checkpoints.update((n) => {
    const newVal = [newCheckpoint, ...n];
    saveToStorage(newVal);
    return newVal;
  });
}

export function deleteCheckpoint(id: string) {
  checkpoints.update((n) => {
    const newVal = n.filter((c) => c.id !== id);
    saveToStorage(newVal);
    return newVal;
  });
}

export function renameCheckpoint(id: string, name: string) {
  checkpoints.update((n) => {
    const newVal = n.map((c) => (c.id === id ? { ...c, name } : c));
    saveToStorage(newVal);
    return newVal;
  });
}

export function restoreCheckpointData(checkpoint: Checkpoint) {
  startPointStore.set(checkpoint.data.startPoint);
  linesStore.set(checkpoint.data.lines);
  sequenceStore.set(checkpoint.data.sequence);
  shapesStore.set(checkpoint.data.shapes);
  settingsStore.set(checkpoint.data.settings);
}
