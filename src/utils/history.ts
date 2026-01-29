import { writable, derived, type Writable } from "svelte/store";
import type { Point, Line, Shape, SequenceItem, Settings } from "../types";

export interface HistoryItem {
  id: string;
  state: string;
  description: string;
  timestamp: number;
}

export interface History {
  undoStack: HistoryItem[];
  redoStack: HistoryItem[];
}

export interface AppState {
  startPoint: Point;
  lines: Line[];
  shapes: Shape[];
  sequence: SequenceItem[];
  settings: Settings;
}

export function createHistory(initialState: any, maxSize: number = 200) {
  const store = writable<History>({
    undoStack: [
      {
        id: crypto.randomUUID(),
        state: JSON.stringify(initialState),
        description: "Initial State",
        timestamp: Date.now(),
      },
    ],
    redoStack: [],
  });

  const { subscribe, update, set } = store;

  const canUndoStore = derived(store, ($history) => $history.undoStack.length > 1);
  const canRedoStore = derived(store, ($history) => $history.redoStack.length > 0);

  return {
    subscribe,
    canUndoStore,
    canRedoStore,
    add: (state: any, description: string = "Change") =>
      update((h) => {
        const newState = JSON.stringify(state);
        // Check for duplicate state (compare with current state at top of undoStack)
        if (h.undoStack.length > 0) {
          const currentState = h.undoStack[h.undoStack.length - 1].state;
          if (currentState === newState) {
            return h;
          }
        }

        const newItem: HistoryItem = {
          id: crypto.randomUUID(),
          state: newState,
          description,
          timestamp: Date.now(),
        };

        const newUndoStack = [...h.undoStack, newItem];
        if (newUndoStack.length > maxSize) {
          newUndoStack.shift(); // Remove oldest
        }

        return {
          undoStack: newUndoStack,
          redoStack: [], // Clear redo stack on new change
        };
      }),
    undo: () =>
      update((h) => {
        if (h.undoStack.length <= 1) return h;
        const current = h.undoStack[h.undoStack.length - 1];
        // Move current state to redo stack
        return {
          undoStack: h.undoStack.slice(0, -1),
          redoStack: [current, ...h.redoStack],
        };
      }),
    redo: () =>
      update((h) => {
        if (h.redoStack.length === 0) return h;
        const next = h.redoStack[0];
        // Move next state to undo stack
        return {
          undoStack: [...h.undoStack, next],
          redoStack: h.redoStack.slice(1),
        };
      }),
    jumpTo: (targetItem: HistoryItem) =>
      update((h) => {
        // 1. Check if item is in undoStack (Past/Current)
        const undoIndex = h.undoStack.findIndex((i) => i.id === targetItem.id);
        if (undoIndex !== -1) {
          // If it's the current state (last in undoStack), do nothing
          if (undoIndex === h.undoStack.length - 1) return h;

          // We are moving back in time.
          // All items AFTER the target must move to Redo Stack.
          // Example: Undo=[A, B, C]. Jump to A (idx 0).
          // Items to move: [B, C].
          // New Undo: [A].
          // New Redo: [B, C] + oldRedo.
          // Order: [B, C] implies B is next, then C. (LIFO from front).
          const toMove = h.undoStack.slice(undoIndex + 1);
          return {
            undoStack: h.undoStack.slice(0, undoIndex + 1),
            redoStack: [...toMove, ...h.redoStack],
          };
        }

        // 2. Check if item is in redoStack (Future)
        const redoIndex = h.redoStack.findIndex((i) => i.id === targetItem.id);
        if (redoIndex !== -1) {
          // We are moving forward in time.
          // Items UP TO and INCLUDING target must move to Undo Stack.
          // Example: Redo=[B, C]. Jump to C (idx 1).
          // Items to move: [B, C].
          // New Undo: oldUndo + [B, C].
          // New Redo: [] (after C).
          const toMove = h.redoStack.slice(0, redoIndex + 1);
          return {
            undoStack: [...h.undoStack, ...toMove],
            redoStack: h.redoStack.slice(redoIndex + 1),
          };
        }

        // Target not found
        return h;
      }),
    reset: (state: any) =>
      set({
        undoStack: [
          {
            id: crypto.randomUUID(),
            state: JSON.stringify(state),
            description: "Initial State",
            timestamp: Date.now(),
          },
        ],
        redoStack: [],
      }),
  };
}
