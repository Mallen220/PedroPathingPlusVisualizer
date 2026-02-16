// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import { describe, it, expect } from "vitest";
import { DEFAULT_KEY_BINDINGS } from "../config/keybindings";

describe("Keybindings", () => {
  it("should include select-next-sequence and select-prev-sequence", () => {
    const selectNext = DEFAULT_KEY_BINDINGS.find(
      (b) => b.id === "select-next-sequence",
    );
    const selectPrev = DEFAULT_KEY_BINDINGS.find(
      (b) => b.id === "select-prev-sequence",
    );

    expect(selectNext).toBeDefined();
    expect(selectNext?.key).toBe("ctrl+down, cmd+down, tab");

    expect(selectPrev).toBeDefined();
    expect(selectPrev?.key).toBe("ctrl+up, cmd+up, shift+tab");
  });

  it("should include select-next-element and select-prev-element", () => {
    const selectNext = DEFAULT_KEY_BINDINGS.find(
      (b) => b.id === "select-next-element",
    );
    const selectPrev = DEFAULT_KEY_BINDINGS.find(
      (b) => b.id === "select-prev-element",
    );

    expect(selectNext).toBeDefined();
    expect(selectNext?.key).toBe("alt+right");

    expect(selectPrev).toBeDefined();
    expect(selectPrev?.key).toBe("alt+left");
  });

  it("should include cycle-path-color", () => {
    const binding = DEFAULT_KEY_BINDINGS.find(
      (b) => b.id === "cycle-path-color",
    );
    expect(binding).toBeDefined();
    expect(binding?.key).toBe("shift+k, alt+c");
    expect(binding?.action).toBe("cyclePathColor");
  });

  it("should include toggle-robot-visibility", () => {
    const binding = DEFAULT_KEY_BINDINGS.find(
      (b) => b.id === "toggle-robot-visibility",
    );
    expect(binding).toBeDefined();
    expect(binding?.key).toBe("alt+i");
    expect(binding?.action).toBe("toggleRobotVisibility");
  });
});
