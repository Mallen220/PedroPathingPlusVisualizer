// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.
import { describe, it, expect } from "vitest";
import { getRandomColor } from "./draw";

describe("getRandomColor", () => {
  it("returns a string starting with #", () => {
    const color = getRandomColor();
    expect(color.startsWith("#")).toBe(true);
  });

  it("returns a string of length 7", () => {
    const color = getRandomColor();
    expect(color.length).toBe(7);
  });

  it("contains only valid characters from the defined set", () => {
    const color = getRandomColor();
    const validChars = "56789ABCD";
    const hexPart = color.substring(1);
    for (const char of hexPart) {
      expect(validChars).toContain(char);
    }
  });

  it("generates different colors", () => {
    const colors = new Set();
    for (let i = 0; i < 100; i++) {
      colors.add(getRandomColor());
    }
    // We expect almost all to be unique, but let's just say we expect more than 1 unique color.
    expect(colors.size).toBeGreaterThan(1);
  });
});
