// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.
import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { get } from "svelte/store";
import TransformDialog from "../lib/components/dialogs/TransformDialog.svelte";
// Import the stores we want to test (they will be mocked)
import { startPointStore, linesStore, shapesStore } from "../lib/projectStore";

vi.mock("../lib/projectStore", async () => {
  const { writable } = await import("svelte/store");
  return {
    startPointStore: writable({ x: 72, y: 72, heading: "tangential" }),
    linesStore: writable([]),
    shapesStore: writable([]),
  };
});

describe("TransformDialog", () => {
  beforeEach(() => {
    startPointStore.set({ x: 72, y: 72, heading: "tangential" });
    linesStore.set([]);
    shapesStore.set([]);
  });

  it("updates start point on translation", async () => {
    const recordChange = vi.fn();
    const { getByText, getByLabelText } = render(TransformDialog, {
      props: { isOpen: true, recordChange },
    });

    const inputX = getByLabelText("Delta X (in)");
    const inputY = getByLabelText("Delta Y (in)");

    await fireEvent.input(inputX, { target: { value: "10" } });
    await fireEvent.input(inputY, { target: { value: "-5" } });

    const applyBtn = getByText("Apply Translation");
    await fireEvent.click(applyBtn);

    expect(get(startPointStore)).toEqual(
      expect.objectContaining({ x: 82, y: 67 })
    );
    expect(recordChange).toHaveBeenCalledWith("Translate Path (10, -5)");
  });

  it("switches to rotate tab and applies rotation", async () => {
    const recordChange = vi.fn();
    const { getByText, getByLabelText } = render(TransformDialog, {
        props: { isOpen: true, recordChange },
    });

    // Switch tab
    const rotateTab = getByText("Rotate");
    await fireEvent.click(rotateTab);

    // Default angle is 90, Pivot is Field Center (72, 72)
    // Start point is (72, 72), so rotation by 90 around (72,72) should keep it at (72,72)

    const applyBtn = getByText("Apply Rotation");
    await fireEvent.click(applyBtn);

    expect(get(startPointStore)).toEqual(
        expect.objectContaining({ x: 72, y: 72 })
    );
    expect(recordChange).toHaveBeenCalledWith("Rotate Path (90 deg)");
  });

  it("rotates around origin correctly", async () => {
      startPointStore.set({ x: 10, y: 0, heading: "tangential" }); // Point at 10,0

      const recordChange = vi.fn();
      const { getByText, getByLabelText } = render(TransformDialog, {
          props: { isOpen: true, recordChange },
      });

      const rotateTab = getByText("Rotate");
      await fireEvent.click(rotateTab);

      // Set pivot to Origin
      const pivotSelect = getByLabelText("Pivot Point");
      await fireEvent.change(pivotSelect, { target: { value: "origin" } });

      // Set angle to 90
      const angleInput = getByLabelText("Angle (degrees, CCW)");
      await fireEvent.input(angleInput, { target: { value: "90" } });

      const applyBtn = getByText("Apply Rotation");
      await fireEvent.click(applyBtn);

      // (10, 0) rotated 90 deg around (0,0) should be (0, 10)
      const sp = get(startPointStore);
      expect(sp.x).toBeCloseTo(0);
      expect(sp.y).toBeCloseTo(10);
  });
});
