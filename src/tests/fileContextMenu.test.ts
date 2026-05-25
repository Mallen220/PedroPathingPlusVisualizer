// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/svelte";
import FileContextMenu from "../lib/components/filemanager/FileContextMenu.svelte";
import { tick } from "svelte";
import { setupUIViewport } from "./testUtils";

describe("FileContextMenu", () => {
  beforeEach(() => {
    setupUIViewport();
  });

  it("updates fileName correctly", async () => {
    const { rerender } = render(FileContextMenu as any, {
      x: 0,
      y: 0,
      fileName: "file1.txt",
      isDirectory: false,
    });

    expect(screen.getByText("file1.txt")).toBeTruthy();

    await rerender({
      x: 0,
      y: 0,
      fileName: "file2.txt",
      isDirectory: false,
    });

    expect(screen.getByText("file2.txt")).toBeTruthy();
  });

  it("updates position correctly when going off screen", async () => {
    const { testMenuOffScreenPositioning } = await import("./testUtils");
    await testMenuOffScreenPositioning(
      { x: 900, y: 900, fileName: "file1.txt", isDirectory: false },
      { x: 100, y: 100, fileName: "file1.txt", isDirectory: false },
      tick,
      screen,
      expect,
      (props: any) => render(FileContextMenu as any, props),
    );
  });
});
