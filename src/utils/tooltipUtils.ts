// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.

/**
 * Generates a tooltip for Move Up/Down buttons, explaining why they might be disabled.
 * @param direction "up" or "down"
 * @param isLocked Whether the item is locked
 * @param canMove Whether the item can move in that direction (e.g., not at top/bottom)
 * @param label The label of the item (e.g. "Path", "Wait")
 */
export function getMoveTooltip(
  direction: "up" | "down",
  isLocked: boolean,
  canMove: boolean,
  label: string = "Item",
): string {
  if (isLocked) return `${label} is locked`;
  if (!canMove)
    return direction === "up" ? "Already at top" : "Already at bottom";
  return direction === "up" ? "Move Up" : "Move Down";
}

/**
 * Generates a tooltip for Delete buttons, explaining if locked.
 * @param isLocked Whether the item is locked
 * @param label The label of the item (e.g. "Path", "Wait")
 * @param actionVerb The action verb (e.g. "Delete", "Remove")
 */
export function getDeleteTooltip(
  isLocked: boolean,
  label: string = "Item",
  actionVerb: string = "Delete",
): string {
  if (isLocked) return `${label} is locked`;
  return `${actionVerb} ${label}`;
}
