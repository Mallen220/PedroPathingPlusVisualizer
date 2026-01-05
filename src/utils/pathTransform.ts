// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.
import type {
  Point,
  Line,
  Shape,
  SequenceItem,
  SequencePathItem,
  SequenceWaitItem,
} from "../types";

/**
 * Mirrors a point's heading across the center line (horizontal mirror).
 * 0 degrees is right, 90 is down.
 * Mirroring across X means:
 * - Angles are reflected across the Y-axis (vertical line).
 * - 0 becomes 180.
 * - 90 stays 90 (if using standard math angle).
 *
 * But here we are mirroring across x = 72 (center of 144 field).
 * So (x, y) becomes (144 - x, y).
 * Heading logic:
 * If robot faces right (0), it now faces left (180).
 * If robot faces up (-90/270), it still faces up.
 * If robot faces down (90), it still faces down.
 * Formula: 180 - angle.
 */
export function mirrorPointHeading(point: Point): Point {
  if (point.heading === "linear") {
    return {
      ...point,
      startDeg: 180 - point.startDeg,
      endDeg: 180 - point.endDeg,
    };
  }
  if (point.heading === "constant") {
    return { ...point, degrees: 180 - point.degrees };
  }
  // Tangential reverse flag stays same because the path itself is mirrored physically
  return point;
}

export interface PathData {
  startPoint: Point;
  lines: Line[];
  shapes: Shape[];
  sequence?: SequenceItem[];
}

/**
 * Mirrors the entire path data across the center field line (x = 72).
 */
export function mirrorPathData(data: PathData): PathData {
  // Deep copy to avoid mutation
  const m = JSON.parse(JSON.stringify(data)) as PathData;

  if (m.startPoint) {
    m.startPoint.x = 144 - m.startPoint.x;
    m.startPoint = mirrorPointHeading(m.startPoint);
  }

  if (m.lines) {
    m.lines.forEach((line) => {
      if (line.endPoint) {
        line.endPoint.x = 144 - line.endPoint.x;
        line.endPoint = mirrorPointHeading(line.endPoint);
      }
      if (line.controlPoints) {
        line.controlPoints.forEach((cp) => (cp.x = 144 - cp.x));
      }
    });
  }

  if (m.shapes) {
    m.shapes.forEach((s) => s.vertices?.forEach((v) => (v.x = 144 - v.x)));
  }

  return m;
}

/**
 * Reverses the entire path direction.
 * - Swaps Start Point with End Point of the last line.
 * - Reverses the order of lines.
 * - Reverses the order of Sequence Items (path items only? Wait items need care).
 *
 * NOTE: This is complex because Path Lines are defined as "Segment to Point X".
 * Reversing means:
 * New Start = Old Last End Point.
 * New Line 1 End = Old Line (N-1) End (or Old Start if N=1).
 * Control points need to be reversed and potentially swapped if they belong to the segment.
 */
export function reversePathData(data: PathData): PathData {
  if (!data.lines || data.lines.length === 0) return data;

  const originalLines = data.lines;
  const originalSequence = data.sequence || [];

  // Deep copy
  const newData = JSON.parse(JSON.stringify(data)) as PathData;

  // 1. Determine new Start Point
  // The new start point is the end point of the last line in the path chain.
  // Note: We need to respect the heading type.
  const lastLine = originalLines[originalLines.length - 1];
  const oldStart = data.startPoint;

  // We need to reconstruct the path segments in reverse order.
  // Original: Start -> Line1 -> Line2 -> ... -> LineN
  // Reverse: LineN_End -> LineN_Reverse -> ... -> Line1_Reverse -> Start

  // New Start Point geometry
  const newStartPoint: Point = {
    x: lastLine.endPoint.x,
    y: lastLine.endPoint.y,
    // Heading logic needs to be swapped.
    // If it was Tangential, it stays Tangential but might need "reverse" flag flipped?
    // If we travel A->B tangential, returning B->A tangential implies 180 flip relative to path?
    // Actually, "reverse" flag in Pedro Pathing means "robot drives backwards".
    // If we reverse the path, do we want to drive backwards?
    // Usually "Reverse Path" means "drive back to start".
    // If I drove forward A->B, I probably want to drive forward B->A.
    // So reverse flag stays same?
    // Let's assume we keep the motion direction (forward/reverse) relative to the robot's front.
    heading: lastLine.endPoint.heading,
  } as Point;

  if (lastLine.endPoint.heading === "constant") {
    (newStartPoint as any).degrees = lastLine.endPoint.degrees;
  } else if (lastLine.endPoint.heading === "linear") {
    // Swap start/end degrees
    (newStartPoint as any).startDeg = lastLine.endPoint.endDeg;
    (newStartPoint as any).endDeg = lastLine.endPoint.startDeg;
  } else if (lastLine.endPoint.heading === "tangential") {
    (newStartPoint as any).reverse = lastLine.endPoint.reverse;
  }

  // 2. Build reversed lines
  const newLines: Line[] = [];

  // We iterate backwards from the last line down to the first.
  // The segment connecting Line(i-1) to Line(i) becomes the segment connecting NewLine(j) to NewLine(j+1).
  // Actually, Line(i) connects Point(i-1) to Point(i).
  // Reversed: Segment(i) connects Point(i) to Point(i-1).
  for (let i = originalLines.length - 1; i >= 0; i--) {
    const originalLine = originalLines[i];
    const prevPoint = i === 0 ? oldStart : originalLines[i - 1].endPoint;

    // The target for this new line is `prevPoint`.
    const newEndPoint: Point = {
      x: prevPoint.x,
      y: prevPoint.y,
      heading: "tangential", // default
    } as Point;

    // Restore heading properties from the *original segment source*?
    // No, heading is a property of the *segment* execution usually, or the *target* point?
    // In this app, `endPoint` defines the heading behavior for the segment ending at `endPoint`.
    // So if we reverse Line i (P_{i-1} -> P_i), we are now going P_i -> P_{i-1}.
    // We should take the heading config from the original line (which governed that segment)
    // and apply it to the new endpoint (which is P_{i-1}).

    // However, for Linear heading, we must swap start/end.
    if (originalLine.endPoint.heading === "linear") {
      (newEndPoint as any).heading = "linear";
      (newEndPoint as any).startDeg = originalLine.endPoint.endDeg;
      (newEndPoint as any).endDeg = originalLine.endPoint.startDeg;
    } else if (originalLine.endPoint.heading === "constant") {
      (newEndPoint as any).heading = "constant";
      (newEndPoint as any).degrees = originalLine.endPoint.degrees;
    } else {
      (newEndPoint as any).heading = "tangential";
      (newEndPoint as any).reverse = originalLine.endPoint.reverse;
    }

    // Control points: reverse the array of control points and deep copy them
    const newControlPoints = [...originalLine.controlPoints]
      .reverse()
      .map((cp) => ({ ...cp }));

    // Preserve other properties
    const newLine: Line = {
      ...originalLine, // copy ID, color, etc?
      // ID should probably be preserved to keep sequence references valid if possible?
      // But we are reordering lines, so sequence references MUST change.
      // If we keep IDs, `sequence` items referring to line X will now refer to the reversed segment X.
      // This is probably desired.
      endPoint: newEndPoint,
      controlPoints: newControlPoints,
      // Swap wait times?
      waitBeforeMs: originalLine.waitAfterMs || 0,
      waitAfterMs: originalLine.waitBeforeMs || 0,
      waitBeforeName: originalLine.waitAfterName || "",
      waitAfterName: originalLine.waitBeforeName || "",
    };

    newLines.push(newLine);
  }

  // 3. Reconstruct Sequence
  // We need to reverse the sequence items.
  // If we kept Line IDs attached to the specific geometric segment (which we did),
  // then reversing the sequence array should mostly work,
  // BUT we need to be careful about Waits.
  // Original: [Path A], [Wait 1], [Path B]
  // Execution: Do A, then Wait 1, then Do B.
  // Reverse: Do B (rev), then Wait 1?, then Do A (rev).
  // Yes, simply reversing the sequence array works for the logic "drive back".
  let newSequence: SequenceItem[] = [];

  if (originalSequence.length > 0) {
    // Reverse the array
    newSequence = [...originalSequence].reverse();
  } else {
    // If no sequence defined (implicit), build one from new lines
    newSequence = newLines.map((l) => ({ kind: "path", lineId: l.id! }));
  }

  newData.startPoint = newStartPoint;
  newData.lines = newLines;
  newData.sequence = newSequence;

  return newData;
}
