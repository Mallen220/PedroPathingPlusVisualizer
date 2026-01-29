// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.
import { describe, it, expect } from "vitest";
import { DEFAULT_KEY_BINDINGS } from "../config/keybindings";

describe("New Keybindings", () => {
  it("should include add-macro", () => {
    const binding = DEFAULT_KEY_BINDINGS.find((b) => b.id === "add-macro");
    expect(binding).toBeDefined();
    expect(binding?.key).toBe("cmd+shift+a, ctrl+shift+a");
    expect(binding?.action).toBe("addMacro");
  });

  it("should include copy-table", () => {
    const binding = DEFAULT_KEY_BINDINGS.find((b) => b.id === "copy-table");
    expect(binding).toBeDefined();
    expect(binding?.key).toBe("cmd+shift+c, ctrl+shift+c");
    expect(binding?.action).toBe("copyTable");
  });

  it("should include toggle-telemetry", () => {
    const binding = DEFAULT_KEY_BINDINGS.find((b) => b.id === "toggle-telemetry");
    expect(binding).toBeDefined();
    expect(binding?.key).toBe("m");
    expect(binding?.action).toBe("toggleTelemetry");
  });

  it("should include toggle-telemetry-ghost", () => {
    const binding = DEFAULT_KEY_BINDINGS.find((b) => b.id === "toggle-telemetry-ghost");
    expect(binding).toBeDefined();
    expect(binding?.key).toBe("shift+m");
    expect(binding?.action).toBe("toggleTelemetryGhost");
  });
});
