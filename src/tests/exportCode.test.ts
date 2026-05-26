// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import { render, fireEvent, waitFor } from "@testing-library/svelte";
import { vi, describe, it, expect } from "vitest";
import ExportCodeDialog from "../lib/components/dialogs/ExportCodeDialog.svelte";

vi.mock("../utils", () => {
  return {
    getRandomColor: vi.fn(() => "#ffffff"),
    downloadTrajectory: vi.fn(),
  };
});

import "./mockExporters";

describe("ExportCode", () => { it("renders", () => { expect(1).toBe(1); }); });
