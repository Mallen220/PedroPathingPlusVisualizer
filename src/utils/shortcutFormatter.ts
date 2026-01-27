// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.
import type { Settings } from "../types";
import { isMac } from "./platform";

export function parseShortcut(key: string): string[] {
  if (!key) return [];

  // Split by comma to get alternatives
  const alternatives = key
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k);

  if (alternatives.length === 0) return [];

  let bestKey = alternatives[0];

  if (isMac) {
    // Prefer shortcuts with 'cmd' or 'command'
    const macMatch = alternatives.find((p) => /\b(cmd|command)\b/i.test(p));
    if (macMatch) bestKey = macMatch;
  } else {
    // Prefer shortcuts without 'cmd'/'command' (likely Windows/Linux friendly)
    // If all have cmd (unlikely), we fall back to the first one and map cmd->ctrl
    const nonMacMatch = alternatives.find((p) => !/\b(cmd|command)\b/i.test(p));
    if (nonMacMatch) bestKey = nonMacMatch;
  }

  const parts = bestKey.split("+");

  const formattedParts = parts.map((part) => {
    const p = part.toLowerCase().trim();

    if (isMac) {
      if (p === "cmd" || p === "command") return "⌘";
      if (p === "shift") return "⇧";
      if (p === "alt" || p === "option" || p === "opt") return "⌥";
      if (p === "ctrl" || p === "control") return "⌃";
    } else {
      if (p === "cmd" || p === "command") return "Ctrl";
      if (p === "shift") return "Shift";
      if (p === "alt" || p === "option" || p === "opt") return "Alt";
      if (p === "ctrl" || p === "control") return "Ctrl";
    }

    // Key content
    if (p.length === 1) return p.toUpperCase();
    // Special keys like 'space', 'enter', 'up' -> Capitalize
    return p.charAt(0).toUpperCase() + p.slice(1);
  });

  return formattedParts;
}

export function getShortcutFromSettings(
  settings: Settings | undefined,
  actionId: string,
): string {
  if (!settings || !settings.keyBindings) return "";

  const binding = settings.keyBindings.find((b) => b.id === actionId);
  if (!binding) return "";

  const formattedParts = parseShortcut(binding.key);

  if (formattedParts.length === 0) return "";

  if (isMac) {
    // Mac style: usually no pluses, but space between logic?
    // Standard macOS menus: ⇧⌘S (no space).
    return ` (${formattedParts.join("")})`;
  } else {
    return ` (${formattedParts.join("+")})`;
  }
}
