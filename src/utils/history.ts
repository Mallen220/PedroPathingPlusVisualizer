// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.
import { writable, type Writable } from "svelte/store";
import type { AppState } from "../types";

export interface HistoryEntry {
  state: AppState;
  description: string;
  timestamp: number;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function createHistory(maxSize = 200) {
  let undoStack: HistoryEntry[] = [];
  let redoStack: HistoryEntry[] = [];
  let lastHash = "";

  // Create writable stores to trigger reactivity
  const canUndoStore = writable(false);
  const canRedoStore = writable(false);

  // Store exposing the stacks for UI
  const historyStore: Writable<{
    undoStack: HistoryEntry[];
    redoStack: HistoryEntry[];
  }> = writable({ undoStack: [], redoStack: [] });

  function updateStores() {
    canUndoStore.set(undoStack.length > 1);
    canRedoStore.set(redoStack.length > 0);
    historyStore.set({
      undoStack: [...undoStack],
      redoStack: [...redoStack],
    });
  }

  function hash(state: AppState): string {
    // Stable hash via JSON string; sufficient for change detection here
    return JSON.stringify(state);
  }

  function record(state: AppState, description: string = "Change") {
    const snapshot = deepClone(state);
    const currentHash = hash(snapshot);
    if (currentHash === lastHash && undoStack.length > 0) {
      // No meaningful change
      return;
    }

    const entry: HistoryEntry = {
      state: snapshot,
      description,
      timestamp: Date.now(),
    };

    undoStack.push(entry);
    lastHash = currentHash;
    // Cap stack size
    if (undoStack.length > maxSize) {
      undoStack.shift();
    }
    // Clear redo on new action
    redoStack = [];
    updateStores();
  }

  function canUndo() {
    return undoStack.length > 1; // keep initial state; require at least one prior state
  }

  function canRedo() {
    return redoStack.length > 0;
  }

  function undo(): AppState | null {
    if (!canUndo()) return null;
    const current = undoStack.pop()!; // current state to redo (now moving to redo stack)
    const prev = undoStack[undoStack.length - 1]; // state to restore
    redoStack.push(current);
    lastHash = hash(prev.state);
    updateStores();
    return deepClone(prev.state);
  }

  function redo(): AppState | null {
    if (!canRedo()) return null;
    const next = redoStack.pop()!;
    undoStack.push(next);
    lastHash = hash(next.state);
    updateStores();
    return deepClone(next.state);
  }

  function peek(): AppState | null {
    if (undoStack.length === 0) return null;
    return deepClone(undoStack[undoStack.length - 1].state);
  }

  function jumpTo(entry: HistoryEntry): AppState | null {
    // Determine if the entry is in undo stack or redo stack
    const undoIndex = undoStack.indexOf(entry);
    const redoIndex = redoStack.indexOf(entry);

    if (undoIndex !== -1) {
      // It's in the past (or current).
      // If it is the current tip, do nothing.
      if (undoIndex === undoStack.length - 1) return null;

      // We need to move items from undoStack to redoStack until entry is the tip.
      // We want entry to be the last item in undoStack.
      while (undoStack.length > undoIndex + 1) {
        const popped = undoStack.pop()!;
        redoStack.push(popped);
      }

      const target = undoStack[undoStack.length - 1];
      lastHash = hash(target.state);
      updateStores();
      return deepClone(target.state);
    } else if (redoIndex !== -1) {
      // It's in the future.
      const targetIndex = redoIndex; // index in redoStack

      let found = false;
      while (redoStack.length > 0) {
        const popped = redoStack.pop()!;
        undoStack.push(popped);
        if (popped === entry) {
          found = true;
          break;
        }
      }

      if (found) {
        lastHash = hash(entry.state);
        updateStores();
        return deepClone(entry.state);
      }
    }

    return null;
  }

  return {
    record,
    undo,
    redo,
    canUndo,
    canRedo,
    peek,
    jumpTo,
    canUndoStore,
    canRedoStore,
    historyStore,
  };
}
