// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import { describe, it, expect, vi } from "vitest";
import { POTATO_THEME_CSS, firePotatoConfetti, getThemeColors, darkColors, lightColors } from "../../utils/potatoTheme";

describe("potatoTheme", () => {
  describe("getThemeColors", () => {
    it("should return dark colors when isDark is true", () => {
      expect(getThemeColors(true)).toBe(darkColors);
    });

    it("should return light colors when isDark is false", () => {
      expect(getThemeColors(false)).toBe(lightColors);
    });
  });

  it("should export CSS string with all theme values", () => {
    expect(POTATO_THEME_CSS).toContain("--potato-flesh: #F9F3D8");
    expect(POTATO_THEME_CSS).toContain("--potato-skin: #D4B483");
    expect(POTATO_THEME_CSS).toContain("--potato-dark: #6D4C41");
    expect(POTATO_THEME_CSS).toContain("--potato-shadow: #8D6E63");
    expect(POTATO_THEME_CSS).toContain("--potato-accent: #8B4513");
    expect(POTATO_THEME_CSS).toContain("--potato-text-dark: #3E2723");
  });

  it("should fire potato confetti by appending to DOM and removing later", () => {
    vi.useFakeTimers();

    // Check initial state
    expect(
      document.body.querySelectorAll("img[src='/Potato.png']").length,
    ).toBe(0);

    firePotatoConfetti(100, 100);

    // It creates 10 particles
    const particles = document.body.querySelectorAll("img[src='/Potato.png']");
    expect(particles.length).toBe(10);

    // Run timers to trigger the removal
    vi.runAllTimers();

    // Should be cleaned up
    expect(
      document.body.querySelectorAll("img[src='/Potato.png']").length,
    ).toBe(0);

    vi.useRealTimers();
  });
});
