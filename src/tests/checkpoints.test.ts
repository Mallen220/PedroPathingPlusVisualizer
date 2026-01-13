import { describe, it, expect, beforeEach, vi } from "vitest";
import { get } from "svelte/store";
import {
  checkpointsStore,
  createCheckpoint,
  restoreCheckpoint,
  deleteCheckpoint,
  startPointStore,
  linesStore,
  shapesStore,
  sequenceStore,
  settingsStore,
  resetProject,
} from "../lib/projectStore";
import type { Line, Point, SequenceItem, Shape, Settings } from "../types";

describe("Project Checkpoints", () => {
  beforeEach(() => {
    resetProject();
    // Mock the start state
    startPointStore.set({ x: 10, y: 10, heading: "tangential", reverse: false });
    linesStore.set([
      {
        id: "line-1",
        endPoint: { x: 50, y: 50, heading: "tangential", reverse: false },
        controlPoints: [],
        color: "#ffffff",
        name: "Test Path",
      },
    ]);
    checkpointsStore.set([]);
  });

  it("should create a checkpoint", () => {
    createCheckpoint("Test Checkpoint");
    const checkpoints = get(checkpointsStore);
    expect(checkpoints.length).toBe(1);
    expect(checkpoints[0].name).toBe("Test Checkpoint");
    expect(checkpoints[0].data.lines[0].id).toBe("line-1");
  });

  it("should restore a checkpoint", () => {
    createCheckpoint("Original State");
    const originalCheckpoints = get(checkpointsStore);
    const cpId = originalCheckpoints[0].id;

    // Modify state
    startPointStore.set({ x: 99, y: 99, heading: "tangential", reverse: false });
    linesStore.set([]);

    expect(get(startPointStore).x).toBe(99);
    expect(get(linesStore).length).toBe(0);

    // Restore
    restoreCheckpoint(cpId);

    expect(get(startPointStore).x).toBe(10);
    expect(get(linesStore).length).toBe(1);
    expect(get(linesStore)[0].id).toBe("line-1");
  });

  it("should delete a checkpoint", () => {
    createCheckpoint("To Delete");
    const checkpoints = get(checkpointsStore);
    const cpId = checkpoints[0].id;

    expect(checkpoints.length).toBe(1);

    deleteCheckpoint(cpId);

    expect(get(checkpointsStore).length).toBe(0);
  });

  it("should not crash if restoring invalid id", () => {
    createCheckpoint("Valid");
    restoreCheckpoint("invalid-id");
    // Should still have current state
    expect(get(linesStore).length).toBe(1);
  });
});
