import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  checkpoints,
  createCheckpoint,
  restoreCheckpoint,
  deleteCheckpoint,
  renameCheckpoint,
  loadCheckpoints,
  saveCheckpointsToPath
} from '../lib/checkpointStore';
import { currentFilePath } from '../stores';
import { startPointStore, linesStore } from '../lib/projectStore';

// Mock localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Checkpoint Store', () => {
  beforeEach(() => {
    localStorage.clear();
    checkpoints.set([]);
    currentFilePath.set(null);
    startPointStore.set({ x: 0, y: 0, heading: "tangential", reverse: false });
    linesStore.set([]);
  });

  it('should create a checkpoint', () => {
    createCheckpoint('Test Checkpoint');
    const items = get(checkpoints);
    expect(items.length).toBe(1);
    expect(items[0].name).toBe('Test Checkpoint');
    expect(items[0].data.startPoint.x).toBe(0);
  });

  it('should persist checkpoints when path is set', () => {
    currentFilePath.set('/test/project.pp');
    createCheckpoint('Persistent Checkpoint');

    // Key format: pedro_checkpoint_{path}
    const stored = localStorage.getItem('pedro_checkpoint_/test/project.pp');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('Persistent Checkpoint');
  });

  it('should restore a checkpoint', () => {
    startPointStore.set({ x: 10, y: 10, heading: "tangential", reverse: false });
    createCheckpoint('State 1');

    startPointStore.set({ x: 20, y: 20, heading: "tangential", reverse: false });

    const items = get(checkpoints);
    restoreCheckpoint(items[0]);

    const sp = get(startPointStore);
    expect(sp.x).toBe(10);
    expect(sp.y).toBe(10);
  });

  it('should delete a checkpoint', () => {
    createCheckpoint('To Delete');
    const items = get(checkpoints);
    const id = items[0].id;

    deleteCheckpoint(id);
    expect(get(checkpoints)).toHaveLength(0);
  });

  it('should rename a checkpoint', () => {
    createCheckpoint('Old Name');
    const items = get(checkpoints);
    const id = items[0].id;

    renameCheckpoint(id, 'New Name');

    const newItems = get(checkpoints);
    expect(newItems[0].name).toBe('New Name');
  });

  it('should save checkpoints to path manually', () => {
     createCheckpoint('Manual Save');
     saveCheckpointsToPath('/new/path.pp');

     const stored = localStorage.getItem('pedro_checkpoint_/new/path.pp');
     const parsed = JSON.parse(stored!);
     expect(parsed).toHaveLength(1);
  });
});
