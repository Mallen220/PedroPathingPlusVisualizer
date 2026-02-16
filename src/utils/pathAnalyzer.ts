// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import type {
  Point,
  Line,
  SequenceItem,
  Settings,
  Shape,
  TimePrediction,
} from "../types";
import { PathOptimizer } from "./pathOptimizer";
import { formatTime } from "./timeCalculator";

export interface PathIssue {
  id: string;
  severity: "error" | "warning" | "info";
  title: string;
  message: string;
  startTime?: number;
  endTime?: number;
  coordinates?: { x: number; y: number };
  relatedId?: string; // ID of the sequence item or line
}

/**
 * Analyzes the path for potential issues, safety risks, and logic errors.
 */
export function analyzePath(
  startPoint: Point,
  lines: Line[],
  sequence: SequenceItem[],
  settings: Settings,
  shapes: Shape[],
  timePrediction: TimePrediction,
  centripetalData?: { time: number; value: number }[],
): PathIssue[] {
  const issues: PathIssue[] = [];

  // 1. Collision & Boundary Checks using PathOptimizer logic
  // We instantiate a throwaway optimizer just to use its collision detection
  // This reuses the robust logic already present in the codebase.
  const optimizer = new PathOptimizer(
    startPoint,
    lines,
    settings,
    sequence,
    shapes,
  );
  // Pass explicit timeline to ensure we check the simulated path
  const collisions = optimizer.getCollisions(timePrediction.timeline, lines);

  collisions.forEach((c, idx) => {
    let title = "Collision Detected";
    let msg = "Robot collides with an obstacle.";
    let severity: "error" | "warning" = "error";

    if (c.type === "boundary") {
      title = "Boundary Violation";
      msg = "Robot goes out of field bounds.";
    } else if (c.type === "keep-in") {
      title = "Keep-In Zone Violation";
      msg = "Robot leaves the designated keep-in zone.";
    } else if (c.type === "zero-length") {
      title = "Zero-Length Segment";
      msg = "Path segment has zero length.";
      severity = "warning";
    }

    issues.push({
      id: `collision-${idx}`,
      severity,
      title,
      message: msg,
      startTime: c.time,
      endTime: c.endTime,
      coordinates: { x: c.x, y: c.y },
    });
  });

  // 2. Kinematic Checks (Velocity, Acceleration, Centripetal)
  // We iterate through the timeline to find peaks
  // This logic mirrors the chart generation but focuses on finding violations
  const maxVel = settings.maxVelocity || 100;
  const kFriction = settings.kFriction || 0;
  const gravity = 386.22; // in/s^2
  const frictionLimitAccel = kFriction * gravity;

  let activeVelocityWarning: PathIssue | null = null;
  let activeFrictionWarning: PathIssue | null = null;

  const timeline = timePrediction.timeline || [];

  // Helper to close open warnings
  const closeWarning = (warning: PathIssue | null, endTime: number) => {
    if (warning) {
      warning.endTime = endTime;
      issues.push(warning);
    }
    return null;
  };

  timeline.forEach((event) => {
    if (event.type === "travel" && event.velocityProfile) {
      const profile = event.motionProfile || [];
      const vProfile = event.velocityProfile || [];
      const steps = vProfile.length;

      // Check steps
      for (let i = 0; i < steps; i++) {
        const t = event.startTime + (profile[i] || 0);
        const v = vProfile[i];

        // Velocity Check
        if (v >= maxVel * 0.99) {
          if (!activeVelocityWarning) {
            activeVelocityWarning = {
              id: `vel-${event.lineIndex}-${i}`,
              severity: "info",
              title: "Max Velocity Reached",
              message: `Robot reaches max velocity (${v.toFixed(1)} in/s).`,
              startTime: t,
              // End time will be updated
            };
          }
        } else {
          activeVelocityWarning = closeWarning(activeVelocityWarning, t);
        }

        // Centripetal Friction Check
        // We need radius at this step. Ideally we would have stored it in the event or recalculated it.
        // Re-calculating full analysis here is expensive.
        // However, we can approximate or skip if performance is key.
        // BUT, `calculatePathTime` does not expose `steps` with radius in the event directly.
        // It exposes `motionProfile`.
        // If we want high-fidelity centripetal checks, we might need to re-analyze the segment OR
        // assume the user relies on the graph for deep detail and we only check gross violations if data available.
        // Wait, `PathStatisticsDialog` re-analyzes segments to get radius.
        // To avoid code duplication and performance hit, we can accept that we might need to re-analyze here
        // OR we can trust that `PathStatisticsDialog` calls this function.
        // Since `analyzePath` is now the source of truth, it SHOULD do the work.
        // We can optimize by only re-analyzing if we strictly need to.
      }
      // Close at end of event
      activeVelocityWarning = closeWarning(
        activeVelocityWarning,
        event.endTime,
      );
    }
  });

  // Centripetal Acceleration Check (if data provided)
  if (centripetalData && kFriction > 0) {
    if (!activeFrictionWarning) {
      // Find peak violation
      let peakVal = 0;
      let startTime: number | null = null;
      let endTime: number | null = null;

      centripetalData.forEach((pt) => {
        if (pt.value > frictionLimitAccel) {
          if (pt.value > peakVal) peakVal = pt.value;
          if (startTime === null) startTime = pt.time;
          endTime = pt.time;
        } else {
          if (startTime !== null) {
            issues.push({
              id: `friction-${startTime}`,
              severity: "error",
              title: "Risk of Wheel Slip",
              message: `Centripetal acceleration (${peakVal.toFixed(1)} in/s²) exceeds friction limit.`,
              startTime,
              endTime: endTime || startTime,
            });
            startTime = null;
            peakVal = 0;
          }
        }
      });

      if (startTime !== null) {
        issues.push({
          id: `friction-${startTime}`,
          severity: "error",
          title: "Risk of Wheel Slip",
          message: `Centripetal acceleration (${peakVal.toFixed(1)} in/s²) exceeds friction limit.`,
          startTime,
          endTime: endTime || startTime,
        });
      }
    }
  }

  // 3. Sequence Logic Checks
  sequence.forEach((item, idx) => {
    // Check 1: Zero Duration Wait
    if (item.kind === "wait") {
      if (item.durationMs <= 0) {
        issues.push({
          id: `seq-wait-${item.id}`,
          severity: "warning",
          title: "Zero Duration Wait",
          message: `Wait command "${item.name}" has 0ms duration.`,
          relatedId: item.id,
        });
      }
    }

    // Check 2: Zero Degree Rotate
    if (item.kind === "rotate") {
      // We can't easily check if it's "no change" without knowing previous heading,
      // but we can check if the user set it to something trivial if that makes sense?
      // Actually, rotating to 0 degrees is valid.
      // But a rotation that results in 0 change might be redundant.
      // We can check the timeline for "wait" events that correspond to this rotate item
      // and see if duration is near 0.
      const event = timeline.find(
        (e) =>
          e.type === "wait" &&
          (e as any).waitId === item.id &&
          e.duration < 0.05,
      );
      if (event) {
        issues.push({
          id: `seq-rotate-${item.id}`,
          severity: "info",
          title: "Redundant Rotation",
          message: `Rotation "${item.name}" results in negligible heading change.`,
          startTime: event.startTime,
          endTime: event.endTime,
          relatedId: item.id,
        });
      }
    }
  });

  // 4. Event Marker Checks
  const allMarkers: { name: string; id: string }[] = [];
  const checkMarker = (m: any, parentName: string) => {
    if (!m.name || m.name.trim() === "") {
      issues.push({
        id: `marker-empty-${m.id}`,
        severity: "warning",
        title: "Unnamed Event Marker",
        message: `Event marker in ${parentName} has no name.`,
        relatedId: m.id,
      });
    } else {
      if (allMarkers.some((existing) => existing.name === m.name)) {
        issues.push({
          id: `marker-dup-${m.id}`,
          severity: "warning", // Info or Warning? Warning because code generation might conflict
          title: "Duplicate Event Name",
          message: `Event marker name "${m.name}" is used multiple times.`,
          relatedId: m.id,
        });
      }
      allMarkers.push({ name: m.name, id: m.id });
    }
  };

  lines.forEach((l, i) =>
    l.eventMarkers?.forEach((m) => checkMarker(m, l.name || `Path ${i + 1}`)),
  );
  sequence.forEach((s) => {
    if ((s.kind === "wait" || s.kind === "rotate") && s.eventMarkers) {
      s.eventMarkers.forEach((m) =>
        checkMarker(m, s.name || (s.kind === "wait" ? "Wait" : "Rotate")),
      );
    }
  });

  // Sort issues by time
  issues.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

  return issues;
}
