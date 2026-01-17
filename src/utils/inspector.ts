// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.
import { PathOptimizer } from "./pathOptimizer";
import { calculatePathTime, analyzePathSegment } from "./timeCalculator";
import { getLineStartHeading } from "./math";
import type {
  Point,
  Line,
  Settings,
  SequenceItem,
  Shape,
  TimelineEvent,
  CollisionMarker,
} from "../types";

export interface InspectionIssue {
  id: string; // unique id for keying
  severity: "error" | "warning";
  type:
    | "collision"
    | "boundary"
    | "zero-length"
    | "acceleration"
    | "velocity"
    | "other";
  message: string;
  description?: string;
  time?: number; // timestamp in the path
  segmentIndex?: number; // index of the line
  point?: { x: number; y: number };
}

export function inspectPath(
  startPoint: Point,
  lines: Line[],
  settings: Settings,
  sequence: SequenceItem[],
  shapes: Shape[],
): InspectionIssue[] {
  const issues: InspectionIssue[] = [];

  // 1. Calculate Path Time & Timeline
  const timeResult = calculatePathTime(startPoint, lines, settings, sequence);
  const timeline = timeResult.timeline;

  // 2. Check for Collisions & Boundary Violations
  const optimizer = new PathOptimizer(
    startPoint,
    lines,
    settings,
    sequence,
    shapes,
  );

  const collisions = optimizer.getCollisions(timeline, lines);

  // Check for Zero-length segments (Manual check as optimizer doesn't do this)
  let currentStart = startPoint;
  lines.forEach((line, index) => {
    if (line.endPoint) {
      const dx = line.endPoint.x - currentStart.x;
      const dy = line.endPoint.y - currentStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.001) {
        collisions.push({
          x: currentStart.x,
          y: currentStart.y,
          time: 0, // Not easily mapped to time without iterating timeline, but 0 is safe placeholder or we find it
          segmentIndex: index,
          type: "zero-length" as any,
        });
      }
      currentStart = line.endPoint;
    }
  });

  // Group collisions to avoid spam (e.g., one per obstacle/boundary occurrence)
  // We can group by consecutive time steps or by type/segment
  // Simple approach: filter close timestamps for same type

  const uniqueCollisions: CollisionMarker[] = [];
  if (collisions.length > 0) {
    let lastMarker: CollisionMarker | null = null;
    collisions.forEach((m) => {
      if (!lastMarker) {
        uniqueCollisions.push(m);
        lastMarker = m;
      } else {
        // If same type and close in time (< 0.5s) and same segment, skip
        const timeDiff = m.time - lastMarker.time;
        if (
          m.type === lastMarker.type &&
          m.segmentIndex === lastMarker.segmentIndex &&
          timeDiff < 0.5
        ) {
          // skip
        } else {
          uniqueCollisions.push(m);
          lastMarker = m;
        }
      }
    });
  }

  uniqueCollisions.forEach((c, idx) => {
    if (c.type === "boundary") {
      issues.push({
        id: `boundary-${idx}`,
        severity: "error",
        type: "boundary",
        message: "Robot goes out of field bounds",
        description: "The robot chassis exceeds the defined field boundaries.",
        time: c.time,
        segmentIndex: c.segmentIndex,
        point: { x: c.x, y: c.y },
      });
    } else if (c.type === "obstacle") {
      issues.push({
        id: `obstacle-${idx}`,
        severity: "error",
        type: "collision",
        message: "Collision with obstacle",
        description:
          "The robot chassis collides with a defined field obstacle.",
        time: c.time,
        segmentIndex: c.segmentIndex,
        point: { x: c.x, y: c.y },
      });
    } else if (c.type === "zero-length") {
      issues.push({
        id: `zero-${idx}`,
        severity: "error",
        type: "zero-length",
        message: "Zero-length path segment",
        description:
          "This segment has start and end points at the same location.",
        time: c.time,
        segmentIndex: c.segmentIndex,
        point: { x: c.x, y: c.y },
      });
    }
  });

  // 3. Physics / Feasibility Checks
  // Check Centripetal Acceleration if friction isn't limiting it automatically
  // If kFriction > 0, the velocity profile is already capped.
  // But we can still warn if it's very high (e.g. > 1G) implying unstable motion even if "simulated" ok.
  // Or if kFriction == 0, check against a reasonable limit.

  const G_CONST = 386.22; // in/s^2 (approx gravity)
  const WARNING_G = 0.8;
  const ACCEL_THRESHOLD = WARNING_G * G_CONST;

  // We need to iterate timeline to find Travel events
  let currentHeading = 0;
  if (startPoint.heading === "linear") currentHeading = startPoint.startDeg;
  else if (startPoint.heading === "constant")
    currentHeading = startPoint.degrees;

  // Need to track heading through sequence to pass correct startHeading to analyzePathSegment
  // Actually calculatePathTime does this.
  // We can just rely on iterating lines and correlating?
  // No, `calculatePathTime` handles the sequence logic (repeats, waits, etc).
  // But `timeline` has `velocityProfile` and `lineIndex`.

  // We need to reconstruct the heading state to call analyzePathSegment correctly?
  // Or simpler: timeline events usually happen in order.

  timeline.forEach((event, eventIdx) => {
    if (
      event.type === "travel" &&
      typeof event.lineIndex === "number" &&
      event.velocityProfile
    ) {
      const line = lines[event.lineIndex];
      // We need the start point for this line.
      // It's the end point of the previous line (or startPoint).
      // But the sequence might have jumped?
      // calculatePathTime handles sequence.
      // Let's assume standard sequence for now or use the fact that `calculatePathTime` did the work.
      // We just need to know the start point coordinates.
      // The event doesn't store startPoint explicitly, but `atPoint` is usually the END point of the event?
      // Wait, `atPoint` in timeline seems to be used for waits.
      // For travel, we can infer start point from line structure IF simple sequence.
      // BUT if it's a complex sequence, it might be harder.

      // Actually, we can get the start point from the previous event's end state or startPoint store?
      // Let's assume lines are connected sequentially as per standard app usage (sequence is list of lines/waits).

      // Find the sequence item that generated this event?
      // Not strictly needed if we assume lines are chained.

      const prevLine = event.lineIndex > 0 ? lines[event.lineIndex - 1] : null;
      const pStart = prevLine ? prevLine.endPoint : startPoint;

      // We also need the startHeading. calculatePathTime tracks this but doesn't store it in 'travel' event easily?
      // Wait, timeline event HAS `headingProfile`. `headingProfile[0]` is the start heading!
      const startHeading =
        event.headingProfile && event.headingProfile.length > 0
          ? event.headingProfile[0]
          : 0; // fallback

      // Re-run analysis
      const analysis = analyzePathSegment(
        pStart,
        line.controlPoints,
        line.endPoint,
        100, // same samples as calculatePathTime
        startHeading,
      );

      const vProfile = event.velocityProfile;
      const steps = analysis.steps;

      // Check correspondence
      // vProfile length is samples + 1 usually. steps length is samples.
      // We iterate steps.

      let maxCentripetal = 0;
      let maxCentripetalTime = 0;

      for (let i = 0; i < steps.length; i++) {
        if (i >= vProfile.length) break;

        const v = vProfile[i];
        const r = steps[i].radius;

        if (r > 0.001) {
          const ac = (v * v) / r;
          if (ac > maxCentripetal) {
            maxCentripetal = ac;
            // Approximate time: startTime + (i/steps) * duration
            maxCentripetalTime =
              event.startTime + (i / steps.length) * event.duration;
          }
        }
      }

      if (maxCentripetal > ACCEL_THRESHOLD) {
        issues.push({
          id: `accel-${eventIdx}`,
          severity: "warning",
          type: "acceleration",
          message: "High lateral acceleration",
          description: `Centripetal acceleration reaches ${(maxCentripetal / G_CONST).toFixed(2)}G. This may cause wheel slip. Consider slowing down or widening the turn.`,
          time: maxCentripetalTime,
          segmentIndex: event.lineIndex,
          point: undefined, // Could calculate exact point if needed
        });
      }
    }
  });

  return issues;
}
