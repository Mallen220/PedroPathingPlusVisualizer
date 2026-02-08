// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.
import type {
  Line,
  Point,
  SequenceItem,
  Settings,
  Shape,
  TimelineEvent,
  CollisionMarker,
} from "../types";
import { PathOptimizer } from "./pathOptimizer";
import { calculatePathTime, analyzePathSegment } from "./timeCalculator";
import { getAngularDifference } from "./math";

export type AuditSeverity = "error" | "warning" | "info";

export interface AuditIssue {
  id: string;
  severity: AuditSeverity;
  title: string;
  message: string;
  time: number; // Timestamp for seeking
  duration?: number;
  segmentIndex?: number;
}

export function auditPath(
  startPoint: Point,
  lines: Line[],
  settings: Settings,
  sequence: SequenceItem[],
  shapes: Shape[],
): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // 1. Basic Continuity Checks
  if (!lines || lines.length === 0) {
    issues.push({
      id: "empty-path",
      severity: "warning",
      title: "Empty Path",
      message: "The path contains no segments.",
      time: 0,
    });
    return issues;
  }

  // 2. Timeline & Simulation
  // We use calculatePathTime to get the full timeline including waits and rotations
  const timePrediction = calculatePathTime(
    startPoint,
    lines,
    settings,
    sequence,
  );
  const timeline = timePrediction.timeline;

  if (!timeline || timeline.length === 0) {
    return issues;
  }

  // 3. Collision & Boundary Checks (Using PathOptimizer logic)
  const optimizer = new PathOptimizer(
    startPoint,
    lines,
    settings,
    sequence,
    shapes,
  );

  // Use the timeline we just calculated to ensure consistency
  const collisionMarkers = optimizer.getCollisions(timeline, lines);

  collisionMarkers.forEach((marker, idx) => {
    let title = "Collision Detected";
    let message = "Robot collides with an obstacle.";
    let severity: AuditSeverity = "error";

    if (marker.type === "boundary") {
      title = "Field Boundary Violation";
      message = "Robot extends outside the field perimeter (0-144 inches).";
    } else if (marker.type === "keep-in") {
        title = "Keep-In Zone Violation";
        message = "Robot is outside the required Keep-In Zone.";
    }

    issues.push({
      id: `collision-${idx}-${marker.time}`,
      severity,
      title,
      message,
      time: marker.time,
      segmentIndex: marker.segmentIndex,
    });
  });

  // 4. Kinematic Checks (Velocity, Acceleration, Centripetal)
  // We iterate through the sequence/timeline to analyze motion profiles

  // Constants
  const maxVel = settings.maxVelocity || 100;
  const maxAccel = settings.maxAcceleration || 30;
  const kFriction = settings.kFriction || 0;
  const gravity = 386.22; // in/s^2
  const frictionLimitAccel = kFriction > 0 ? kFriction * gravity : Infinity;
  // Angular velocity limit (rad/s)
  const maxAngVel = settings.aVelocity || Math.PI; // Default 180 deg/s

  timeline.forEach((event) => {
    if (event.type === "travel") {
        if (!event.motionProfile || !event.velocityProfile) {
            // No profile? Maybe it's a zero length or issue?
            // Or maybe maxVel/maxAccel not set?
            // Skip check if no profile
            return;
        }

        const profile = event.motionProfile;
        const velProfile = event.velocityProfile;
        const headingProfile = event.headingProfile;

        // Analyze path geometry for curvature
        // We need the line to analyze
        const line = event.line || lines[event.lineIndex!];
        // We need previous point
        // If event.prevPoint is set, use it. Else find it.
        const prevPoint = event.prevPoint || (event.lineIndex === 0 ? startPoint : lines[event.lineIndex! - 1].endPoint);

        // Determine start heading for analysis (approximate)
        let startH = 0;
        if(headingProfile && headingProfile.length > 0) startH = headingProfile[0];

        const analysis = analyzePathSegment(
            prevPoint,
            line.controlPoints as any,
            line.endPoint as any,
            profile.length - 1, // Match resolution
            startH
        );

        // Iterate steps
        const len = Math.min(profile.length - 1, analysis.steps.length);

        let maxV = 0;
        let maxA = 0;
        let maxCentripetal = 0;
        let maxAngV = 0;

        let vIssueTime: number | null = null;
        let aIssueTime: number | null = null;
        let fIssueTime: number | null = null;
        let angVIssueTime: number | null = null;

        for(let i=0; i < len; i++) {
            const t = event.startTime + profile[i];
            const v = velProfile[i];

            // Linear Velocity Check
            if (v > maxVel * 1.01) { // 1% tolerance
                if (vIssueTime === null) vIssueTime = t;
                maxV = Math.max(maxV, v);
            }

            // Acceleration Check (Finite Difference)
            // a = (v_next - v) / dt
            const dt = profile[i+1] - profile[i];
            if (dt > 1e-5) {
                const vNext = velProfile[i+1];
                const a = Math.abs((vNext - v) / dt);

                if (a > maxAccel * 1.05) { // 5% tolerance for numerical noise
                    if (aIssueTime === null) aIssueTime = t;
                    maxA = Math.max(maxA, a);
                }

                // Centripetal Acceleration Check: v^2 / r
                if (analysis.steps[i].radius > 0.001) {
                    const ac = (v * v) / analysis.steps[i].radius;
                    if (ac > frictionLimitAccel) {
                        if (fIssueTime === null) fIssueTime = t;
                        maxCentripetal = Math.max(maxCentripetal, ac);
                    }
                }

                // Angular Velocity Check
                // diff / dt
                if (headingProfile && headingProfile.length > i+1) {
                    const h1 = headingProfile[i];
                    const h2 = headingProfile[i+1];
                    const diff = Math.abs(getAngularDifference(h1, h2)) * (Math.PI / 180);
                    const angV = diff / dt;

                    if (angV > maxAngVel * 1.05) {
                        if (angVIssueTime === null) angVIssueTime = t;
                        maxAngV = Math.max(maxAngV, angV);
                    }
                }
            }
        }

        if (vIssueTime !== null) {
            issues.push({
                id: `vel-${line.id}`,
                severity: "warning",
                title: "Max Velocity Exceeded",
                message: `Robot reaches ${maxV.toFixed(1)} in/s (Limit: ${maxVel} in/s) during ${line.name || "Path segment"}.`,
                time: vIssueTime,
                segmentIndex: event.lineIndex
            });
        }

        if (aIssueTime !== null) {
             // Acceleration noise is common at start/end, check if sustained?
             // For now report it.
             issues.push({
                id: `accel-${line.id}`,
                severity: "warning",
                title: "Max Acceleration Exceeded",
                message: `Robot reaches ${maxA.toFixed(1)} in/s² (Limit: ${maxAccel} in/s²) during ${line.name || "Path segment"}.`,
                time: aIssueTime,
                segmentIndex: event.lineIndex
            });
        }

        if (fIssueTime !== null) {
            issues.push({
               id: `friction-${line.id}`,
               severity: "error",
               title: "Traction Loss Risk",
               message: `Centripetal acceleration ${maxCentripetal.toFixed(1)} in/s² exceeds friction limit (${frictionLimitAccel.toFixed(1)} in/s²). The robot will likely slip.`,
               time: fIssueTime,
               segmentIndex: event.lineIndex
           });
       }

       if (angVIssueTime !== null) {
           issues.push({
               id: `angvel-${line.id}`,
               severity: "warning",
               title: "Max Angular Velocity Exceeded",
               message: `Robot rotates at ${maxAngV.toFixed(1)} rad/s (Limit: ${maxAngVel.toFixed(1)} rad/s).`,
               time: angVIssueTime,
               segmentIndex: event.lineIndex
           });
       }

    } else if (event.type === "wait") {
        // Check for wait duration 0
        if (event.duration <= 0) {
             // It might be a rotation wait which is valid to be short, but 0 is suspicious if it was meant to be a wait
             // But if it's a pure rotation, duration > 0 usually.
             // If duration is 0, it does nothing.
             // Skip for now as 0 waits are harmless usually.
        } else {
            // Check rotation speed in wait (spin in place)
            const diff = Math.abs(getAngularDifference(event.startHeading || 0, event.targetHeading || 0));
            if (diff > 0.1) {
                const diffRad = diff * (Math.PI / 180);
                // Average speed check
                const avgSpeed = diffRad / event.duration;
                // If trapezoidal, max speed is higher (up to 2x for triangle profile)
                // We don't have the exact profile here easily without recalculating
                // But generally avgSpeed > maxVel is impossible
                if (avgSpeed > maxAngVel) {
                    issues.push({
                        id: `wait-rot-${event.startTime}`,
                        severity: "warning",
                        title: "Fast Rotation",
                        message: `Rotation during wait exceeds max angular velocity.`,
                        time: event.startTime + event.duration/2
                    });
                }
            }
        }
    }
  });

  // 5. Logical/Sanity Checks

  // Check 5.1: Duplicate Event Names
  const eventNames = new Set<string>();
  lines.forEach(l => {
      l.eventMarkers?.forEach(m => {
          if (eventNames.has(m.name)) {
              issues.push({
                  id: `dup-event-${m.id}`,
                  severity: "warning",
                  title: "Duplicate Event Name",
                  message: `Event "${m.name}" is used multiple times. This may cause ambiguous behavior in robot code.`,
                  time: 0, // Hard to map to time without simulation lookup
                  segmentIndex: lines.indexOf(l)
              });
          }
          eventNames.add(m.name);
      });
  });

  // Check 5.2: Optimization Status (heuristic)
  // If we have obstacles but no control points on lines, it's likely unoptimized
  if (shapes.some(s => s.type === "obstacle")) {
      const complexLines = lines.filter(l => l.controlPoints.length > 0).length;
      if (complexLines === 0 && lines.length > 0) {
          issues.push({
              id: "unoptimized",
              severity: "info",
              title: "Path Not Optimized",
              message: "Obstacles are present but path segments are simple lines. Consider running the optimizer.",
              time: 0
          });
      }
  }

  // Sort issues by time, then severity
  issues.sort((a, b) => a.time - b.time);

  return issues;
}
