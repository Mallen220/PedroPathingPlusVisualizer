// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.
import type { Line, Point } from "../types";

/**
 * Updates the end point of all lines that share the same name as the changed line.
 * This ensures that linked waypoints stay synchronized.
 *
 * @param lines The current list of lines.
 * @param changedLineId The ID of the line that was modified.
 * @return A new array of lines with synchronized points.
 */
export function syncLinkedPoints(lines: Line[], changedLineId: string): Line[] {
  const changedLine = lines.find((l) => l.id === changedLineId);
  if (!changedLine || !changedLine.name) {
    return lines;
  }

  const { x, y } = changedLine.endPoint;
  const targetName = changedLine.name;

  return lines.map((line) => {
    if (
      line.id !== changedLineId &&
      line.name === targetName
    ) {
        // Clone the point to avoid mutation issues, though we are returning a new array
        // We only update x and y, preserving other properties if any (though Point is discriminated union)
      return {
        ...line,
        endPoint: {
          ...line.endPoint,
          x,
          y,
        },
      };
    }
    return line;
  });
}

/**
 * Handles renaming of a line. If the new name matches an existing line's name,
 * the renamed line's end point "jumps" to the existing line's end point.
 *
 * @param lines The current list of lines.
 * @param renamedLineId The ID of the line that is being renamed.
 * @param newName The new name for the line.
 * @return A new array of lines.
 */
export function handlePointRename(
  lines: Line[],
  renamedLineId: string,
  newName: string,
): Line[] {
  // Find an existing line with the new name (excluding the one being renamed)
  const existingLine = lines.find(
    (l) => l.name === newName && l.id !== renamedLineId,
  );

  return lines.map((line) => {
    if (line.id === renamedLineId) {
      const updatedLine = { ...line, name: newName };
      if (existingLine) {
        // Jump to the existing point's location
        updatedLine.endPoint = {
          ...updatedLine.endPoint,
          x: existingLine.endPoint.x,
          y: existingLine.endPoint.y,
        };
      }
      return updatedLine;
    }
    return line;
  });
}

/**
 * Checks if a line is linked to any other line (shares a name).
 *
 * @param lines The list of all lines.
 * @param lineId The ID of the line to check.
 * @return True if the line shares a name with another line.
 */
export function isLinked(lines: Line[], lineId: string): boolean {
    const line = lines.find(l => l.id === lineId);
    if (!line || !line.name) return false;

    // Check if any *other* line has the same name
    return lines.some(l => l.id !== lineId && l.name === line.name);
}
