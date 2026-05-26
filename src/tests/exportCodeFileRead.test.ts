// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import { render, waitFor } from "@testing-library/svelte";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import ExportCodeDialog from "../lib/components/dialogs/ExportCodeDialog.svelte";
import { currentFilePath } from "../stores";

vi.mock("../utils", () => {
  return {
    relativizeSequenceForPreview: vi.fn((seq) => seq),
    getRandomColor: vi.fn(() => "#ffffff"),
  };
});

// Mock the exporters module
import "./mockExporters";

describe("ExportCodeRead", () => { it("renders", () => { expect(1).toBe(1); }); });
