// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import type {
  Line,
  SequenceItem,
  TimePrediction,
  SequencePathItem,
  Point,
} from "../types";
import {
  splitBezier,
  easeInOutQuad,
  shortestRotation,
  getDistance,
} from "./math";
import { makeId } from "./nameGenerator";

export interface PathSplitResult {
  lines: Line[];
  sequence: SequenceItem[];
  splitIndex: number;
}

/**
 * Splits the path at the given global percentage.
 * Returns null if the current time does not correspond to a split-table path segment.
 */
export function splitPathAtPercent(
  percent: number,
  timePrediction: TimePrediction,
  lines: Line[],
  sequence: SequenceItem[],
): PathSplitResult | null {
  if (!timePrediction || timePrediction.totalTime <= 0) return null;

  const totalTime = timePrediction.totalTime;
  const globalTime = (percent / 100) * totalTime;

  // Find active event
  const timeline = timePrediction.timeline;
  const activeEvent = timeline.find(
    (e) => globalTime >= e.startTime && globalTime <= e.endTime,
  );

  if (!activeEvent || activeEvent.type !== "travel") return null;

  // Identify Line
  const lineIndex = activeEvent.lineIndex!;
  const originalLine = lines[lineIndex];
  if (!originalLine) return null;

  // Calculate local t
  let t = 0;
  if (activeEvent.motionProfile && activeEvent.motionProfile.length > 0) {
    // Inverse lookup in motion profile
    const relTime = globalTime - activeEvent.startTime;
    const profile = activeEvent.motionProfile;
    const steps = profile.length - 1;
    let i = 0;
    while (i < steps - 1 && relTime > profile[i + 1]) {
      i++;
    }
    const t0 = profile[i];
    const t1 = profile[i + 1];

    // Avoid division by zero
    if (t1 === t0) {
      t = i / steps;
    } else {
      const ratio = (relTime - t0) / (t1 - t0);
      t = (i + ratio) / steps;
    }
  } else {
    // Linear time mapping + easing fallback
    const duration = Math.max(0.001, activeEvent.duration);
    const progress = (globalTime - activeEvent.startTime) / duration;
    t = easeInOutQuad(Math.max(0, Math.min(1, progress)));
  }

  t = Math.max(0.001, Math.min(0.999, t)); // Clamp to avoid degenerate splits

  // Perform Split
  const prevPoint = (activeEvent as any).prevPoint;
  if (!prevPoint) return null;

  const curvePoints = [
    prevPoint,
    ...originalLine.controlPoints,
    originalLine.endPoint,
  ];
  const [leftPoints, rightPoints] = splitBezier(t, curvePoints);

  const splitPoint = leftPoints[leftPoints.length - 1];

  // Create Line 1 (The first half)
  const line1: Line = {
    ...originalLine,
    id: makeId(),
    endPoint: {
      x: splitPoint.x,
      y: splitPoint.y,
      heading: "tangential",
      reverse:
        originalLine.endPoint.heading === "tangential"
          ? originalLine.endPoint.reverse
          : false,
    },
    controlPoints: leftPoints.slice(1, -1),
    name: "",
    eventMarkers: [],
    waitBeforeMs: originalLine.waitBeforeMs,
    waitAfterMs: 0,
    waitBeforeName: originalLine.waitBeforeName,
    waitAfterName: "",
  };

  // Create Line 2 (The second half)

  const line2: Line = {
    ...originalLine,
    // Keep ID
    endPoint: { ...originalLine.endPoint }, // Clone to avoid mutation issues
    controlPoints: rightPoints.slice(1, -1),
    name: "",
    eventMarkers: [],
    waitBeforeMs: 0,
    waitAfterMs: originalLine.waitAfterMs,
    waitBeforeName: "",
    waitAfterName: originalLine.waitAfterName,
  };

  // Handle Heading Logic
  if (originalLine.endPoint.heading === "constant") {
    // Both segments maintain constant heading
    // line1 already set to tangential default above, override it
    line1.endPoint = {
      x: splitPoint.x,
      y: splitPoint.y,
      heading: "constant",
      degrees: originalLine.endPoint.degrees,
    };
    // line2 already has original properties (constant)
  } else if (originalLine.endPoint.heading === "linear") {
    const startDeg = originalLine.endPoint.startDeg;
    const endDeg = originalLine.endPoint.endDeg;

    // Interpolate heading at split point
    const midDeg = shortestRotation(startDeg, endDeg, t);

    // Update L1
    line1.endPoint = {
      x: splitPoint.x,
      y: splitPoint.y,
      heading: "linear",
      startDeg: startDeg,
      endDeg: midDeg,
    };

    // Update L2 — construct a fresh 'linear' endPoint to avoid carrying an incompatible 'degrees' property
    line2.endPoint = {
      x: line2.endPoint.x,
      y: line2.endPoint.y,
      // preserve optional metadata fields
      locked: line2.endPoint.locked,
      isMacroElement: line2.endPoint.isMacroElement,
      macroId: line2.endPoint.macroId,
      originalId: line2.endPoint.originalId,
      heading: "linear",
      startDeg: midDeg,
      endDeg: endDeg,
    };
  }
  // If tangential, line1 is tangential (smooth join), line2 is tangential (original end behavior).

  // Migrate Markers
  if (originalLine.eventMarkers) {
    originalLine.eventMarkers.forEach((m) => {
      if (m.position <= t) {
        // Move to L1
        line1.eventMarkers!.push({ ...m, position: m.position / t });
      } else {
        // Move to L2
        line2.eventMarkers!.push({
          ...m,
          position: (m.position - t) / (1 - t),
        });
      }
    });
  }

  // Construct new Arrays
  const newLines = [...lines];
  newLines.splice(lineIndex, 1, line1, line2);

  // Construct new Sequence
  const newSequence = [...sequence];

  // Insert line1 before every occurrence of line2 (originalLine)
  for (let i = 0; i < newSequence.length; i++) {
    const item = newSequence[i];
    if (
      item.kind === "path" &&
      (item as SequencePathItem).lineId === originalLine.id
    ) {
      const newItem: SequencePathItem = {
        kind: "path",
        lineId: line1.id!,
      };
      newSequence.splice(i, 0, newItem);
      i++; // Skip the item just pushed
    }
  }

  return {
    lines: newLines,
    sequence: newSequence,
    splitIndex: lineIndex,
  };
}

/**
 * Generates path lines from an array of raw drawn points.
 */
function perpendicularDistance(
  pt: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number },
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  const magSq = dx * dx + dy * dy;
  if (magSq > 0.0) {
    // Numerator is the absolute value of the cross product of the vector from lineStart to lineEnd
    // and the vector from lineStart to pt. This gives the area of the parallelogram formed by the two vectors.
    // Dividing by the magnitude of the line segment gives the height of the parallelogram,
    // which is the perpendicular distance.
    const numerator = Math.abs(
      dx * (lineStart.y - pt.y) - (lineStart.x - pt.x) * dy,
    );
    return numerator / Math.sqrt(magSq);
  } else {
    return getDistance(pt, lineStart);
  }
}

// --- Curve Fitting Helpers ---

// Normalizes a vector
function normalize(v: { dx: number; dy: number }) {
  const len = Math.sqrt(v.dx * v.dx + v.dy * v.dy);
  if (len === 0) return { dx: 0, dy: 0 };
  return { dx: v.dx / len, dy: v.dy / len };
}

// Compute the length of the point string
function chordLength(points: { x: number; y: number }[]) {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += getDistance(points[i - 1], points[i]);
  }
  return len;
}

// Evaluate a cubic bezier at parameter t
function bezierEval(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

// Calculate max error between drawn points and a generated bezier curve
function computeMaxError(
  points: { x: number; y: number }[],
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
): { error: number; splitIndex: number } {
  let maxError = 0;
  let splitIndex = 0;

  // Create a parameterization to compare against points
  const totalLen = chordLength(points);
  if (totalLen === 0) return { error: 0, splitIndex: 0 };

  let currentLen = 0;
  for (let i = 0; i < points.length; i++) {
    if (i > 0) currentLen += getDistance(points[i - 1], points[i]);
    const u = currentLen / totalLen;
    const bezPt = bezierEval(u, p0, p1, p2, p3);
    const dist = getDistance(bezPt, points[i]);

    if (dist > maxError) {
      maxError = dist;
      splitIndex = i;
    }
  }

  return { error: maxError, splitIndex };
}

/**
 * Fits a series of points to one or more bezier curves using a recursive approach
 * inspired by Philip J. Schneider's algorithm, but simplified.
 */
function fitCurve(
  points: { x: number; y: number }[],
  errorTolerance: number,
  tangentStart: { dx: number; dy: number },
  tangentEnd: { dx: number; dy: number },
  depth: number = 0,
): {
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  p3: { x: number; y: number };
}[] {
  if (points.length < 2) return [];

  const p0 = points[0];
  const p3 = points[points.length - 1];

  // If there are exactly 2 points, they form a straight line
  if (points.length === 2) {
    const dist = getDistance(p0, p3) / 3.0;
    return [
      {
        p0,
        p1: {
          x: p0.x + tangentStart.dx * dist,
          y: p0.y + tangentStart.dy * dist,
        },
        p2: { x: p3.x + tangentEnd.dx * dist, y: p3.y + tangentEnd.dy * dist },
        p3,
      },
    ];
  }

  // Calculate a simplified Bezier curve for the current segment
  // The distance parameter 'alpha' represents how far out the control points stretch
  // We approximate this by using the chord length of the curve.
  const chordLen = chordLength(points);

  // Start with a generic tension factor based on the path length
  const alpha = chordLen / 3.0;

  const p1 = {
    x: p0.x + tangentStart.dx * alpha,
    y: p0.y + tangentStart.dy * alpha,
  };

  const p2 = {
    x: p3.x + tangentEnd.dx * alpha,
    y: p3.y + tangentEnd.dy * alpha,
  };

  // Check the maximum error of this single curve against all drawn points
  const { error, splitIndex } = computeMaxError(points, p0, p1, p2, p3);

  // If the error is acceptable (or if we hit a max depth to prevent stack overflows), return the single curve
  // We don't want to split too deeply and create many segments if the user drew inconsistently.
  if (error < errorTolerance || depth > 3) {
    return [{ p0, p1, p2, p3 }];
  }

  // If the error is too high, we split the segment at the point of highest error and recursively fit two curves.
  // We need to calculate the tangent at the split point to ensure C1 continuity.

  // Approximate the tangent at the split point using neighboring points
  let splitTangent = { dx: 0, dy: 0 };
  const splitPt = points[splitIndex];

  // Use a central difference for the split tangent if possible
  if (splitIndex > 0 && splitIndex < points.length - 1) {
    splitTangent = normalize({
      dx: points[splitIndex + 1].x - points[splitIndex - 1].x,
      dy: points[splitIndex + 1].y - points[splitIndex - 1].y,
    });
  } else {
    // Fallback if split point is at edges
    splitTangent = normalize({
      dx: points[points.length - 1].x - points[0].x,
      dy: points[points.length - 1].y - points[0].y,
    });
  }

  // Recursive calls:
  // The first curve goes from start tangent to split tangent.
  const leftCurve = fitCurve(
    points.slice(0, splitIndex + 1),
    errorTolerance,
    tangentStart,
    { dx: -splitTangent.dx, dy: -splitTangent.dy }, // Reverse the split tangent for the first segment's end
    depth + 1,
  );

  // The second curve goes from split tangent to end tangent.
  const rightCurve = fitCurve(
    points.slice(splitIndex),
    errorTolerance,
    splitTangent,
    tangentEnd,
    depth + 1,
  );

  return leftCurve.concat(rightCurve);
}

/**
 * Generates path lines from an array of raw drawn points.
 */
export function generateLinesFromDrawing(
  drawnPoints: { x: number; y: number }[],
  startPoint: Point,
  lines: Line[],
  sequence: SequenceItem[],
): { startPoint: Point; lines: Line[]; sequence: SequenceItem[] } | null {
  if (drawnPoints.length < 2) return null;

  let currentLines = [...lines];
  let currentSequence = [...sequence];
  let currentStartPoint = { ...startPoint };

  let isFirstLine = currentLines.length === 0;

  // Filter raw points to omit extremely close duplicates before fitting
  const filteredPoints = [drawnPoints[0]];
  for (let i = 1; i < drawnPoints.length; i++) {
    if (
      getDistance(filteredPoints[filteredPoints.length - 1], drawnPoints[i]) >
      0.5
    ) {
      filteredPoints.push(drawnPoints[i]);
    }
  }

  // Determine starting context and connection
  let connectionPt = isFirstLine
    ? { x: filteredPoints[0].x, y: filteredPoints[0].y }
    : currentLines[currentLines.length - 1].endPoint;

  let initialTangent = null;
  let activePointsToFit = [...filteredPoints];

  if (isFirstLine) {
    currentStartPoint = {
      ...currentStartPoint,
      x: filteredPoints[0].x,
      y: filteredPoints[0].y,
    };
    if (filteredPoints.length < 2) return null;
  } else {
    // If not first line, we need to decide if we connect to the existing endPoint
    // If drawing started very close to the end point, just replace the first drawn point
    // with the end point to ensure continuous curve fitting.
    if (getDistance(connectionPt, filteredPoints[0]) < 2.0) {
      activePointsToFit[0] = { ...connectionPt };
    } else {
      // Started drawing far away, inject connection segment
      activePointsToFit.unshift({ ...connectionPt });
    }

    // Attempt to maintain G1 tangency with previous line
    const lastLine = currentLines[currentLines.length - 1];
    if (lastLine.controlPoints.length > 0) {
      const lastCp = lastLine.controlPoints[lastLine.controlPoints.length - 1];
      initialTangent = normalize({
        dx: lastLine.endPoint.x - lastCp.x,
        dy: lastLine.endPoint.y - lastCp.y,
      });
    } else {
      const pPrev =
        currentLines.length > 1
          ? currentLines[currentLines.length - 2].endPoint
          : currentStartPoint;
      initialTangent = normalize({
        dx: lastLine.endPoint.x - pPrev.x,
        dy: lastLine.endPoint.y - pPrev.y,
      });
    }
  }

  // Calculate tangents for the curve fitting algorithm
  let tangentStart =
    initialTangent ||
    normalize({
      dx: activePointsToFit[1].x - activePointsToFit[0].x,
      dy: activePointsToFit[1].y - activePointsToFit[0].y,
    });

  let tangentEnd = normalize({
    dx:
      activePointsToFit[activePointsToFit.length - 2].x -
      activePointsToFit[activePointsToFit.length - 1].x,
    dy:
      activePointsToFit[activePointsToFit.length - 2].y -
      activePointsToFit[activePointsToFit.length - 1].y,
  });

  // Fit the curves!
  // We use an error tolerance of roughly 4.0 inches. This allows for very smooth approximation
  // without creating a ton of segments. Max depth limits us to ~8 segments max if they draw an absolute mess.
  const fittedCurves = fitCurve(
    activePointsToFit,
    4.0,
    tangentStart,
    tangentEnd,
    0,
  );

  // Convert the fitted bezier curves into Line objects
  fittedCurves.forEach((curve) => {
    // Check if the curve is actually a straight line (control points are collinear with endpoints)
    let maxDev = 0;
    maxDev = Math.max(
      maxDev,
      perpendicularDistance(curve.p1, curve.p0, curve.p3),
    );
    maxDev = Math.max(
      maxDev,
      perpendicularDistance(curve.p2, curve.p0, curve.p3),
    );

    const isStraight = maxDev < 1.0;

    const newLine: Line = {
      id: makeId(),
      name: "",
      endPoint: {
        x: curve.p3.x,
        y: curve.p3.y,
        heading: "tangential",
        reverse: false,
      },
      controlPoints: isStraight ? [] : [curve.p1, curve.p2],
      color: "#60a5fa", // Default blue
      locked: false,
      eventMarkers: [],
      waitBeforeMs: 0,
      waitAfterMs: 0,
      waitBeforeName: "",
      waitAfterName: "",
    };

    currentLines.push(newLine);
    currentSequence.push({ kind: "path", lineId: newLine.id! });
  });

  return {
    startPoint: currentStartPoint,
    lines: currentLines,
    sequence: currentSequence,
  };
}
