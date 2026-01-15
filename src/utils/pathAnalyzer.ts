// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.
import type { Line, Point, SequenceItem, Settings, Shape } from "../types";
import { PathOptimizer } from "./pathOptimizer";
import { calculatePathTime } from "./timeCalculator";

export interface AnalysisIssue {
  type: "error" | "warning" | "info";
  title: string;
  description: string;
  segmentIndex?: number; // Which path segment (line index)
  timestamp?: number;
  location?: { x: number; y: number };
}

export interface PathAnalysisReport {
  score: number;
  issues: AnalysisIssue[];
  metrics: {
    maxVelocityDetected: number;
    maxAccelerationDetected: number;
    minSafetyMargin: number; // Not easily available without expensive calc, maybe skip or implement simpler check
    totalTime: number;
  };
}

export function analyzePath(
  startPoint: Point,
  lines: Line[],
  settings: Settings,
  sequence: SequenceItem[],
  shapes: Shape[],
): PathAnalysisReport {
  const issues: AnalysisIssue[] = [];
  let score = 100;
  let maxVelDetected = 0;
  let maxAccelDetected = 0;

  // 1. Zero-Length Check
  let currentStart = startPoint;
  lines.forEach((line, index) => {
    const dx = line.endPoint.x - currentStart.x;
    const dy = line.endPoint.y - currentStart.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.001) {
      issues.push({
        type: "error",
        title: "Zero-Length Segment",
        description: `Path segment ${index + 1} has zero length.`,
        segmentIndex: index,
        location: { x: currentStart.x, y: currentStart.y },
      });
      score -= 20;
    }
    currentStart = line.endPoint;
  });

  // 2. Collision Detection
  const optimizer = new PathOptimizer(
    startPoint,
    lines,
    settings,
    sequence,
    shapes,
  );
  // Get collision markers (this runs simulation)
  const collisions = optimizer.getCollisions();

  if (collisions.length > 0) {
    // Group collisions by type
    const boundaryCollisions = collisions.filter((c) => c.type === "boundary");
    const obstacleCollisions = collisions.filter((c) => c.type === "obstacle");

    if (boundaryCollisions.length > 0) {
      issues.push({
        type: "error",
        title: "Field Boundary Violation",
        description: `Robot leaves the field boundary at ${boundaryCollisions.length} points.`,
        timestamp: boundaryCollisions[0].time,
        location: { x: boundaryCollisions[0].x, y: boundaryCollisions[0].y },
      });
      score -= 30; // Critical
    }

    if (obstacleCollisions.length > 0) {
      issues.push({
        type: "error",
        title: "Obstacle Collision",
        description: `Robot collides with obstacles at ${obstacleCollisions.length} points.`,
        timestamp: obstacleCollisions[0].time,
        location: { x: obstacleCollisions[0].x, y: obstacleCollisions[0].y },
      });
      score -= 40; // Critical
    }
  }

  // 3. Kinematics Analysis
  const timePrediction = calculatePathTime(
    startPoint,
    lines,
    settings,
    sequence,
  );

  if (timePrediction.timeline) {
    timePrediction.timeline.forEach((event) => {
      if (event.type === "travel" && event.velocityProfile) {
        // Check Max Velocity
        const maxV = Math.max(...event.velocityProfile);
        if (maxV > maxVelDetected) maxVelDetected = maxV;

        if (maxV > (settings.maxVelocity || 100) + 1) {
          // +1 buffer
          issues.push({
            type: "warning",
            title: "Velocity Limit Exceeded",
            description: `Path segment ${
              (event.lineIndex ?? 0) + 1
            } reaches ${maxV.toFixed(1)} in/s (Limit: ${
              settings.maxVelocity
            }).`,
            segmentIndex: event.lineIndex,
          });
          score -= 5;
        }

        // Check Acceleration (rough estimate from profile diffs)
        // velocityProfile is sampled. We need to check motionProfile for time delta
        if (event.motionProfile && event.motionProfile.length > 1) {
          for (let i = 0; i < event.velocityProfile.length - 1; i++) {
            const v1 = event.velocityProfile[i];
            const v2 = event.velocityProfile[i + 1];
            const t1 = event.motionProfile[i];
            const t2 = event.motionProfile[i + 1];
            const dt = t2 - t1;

            if (dt > 0.0001) {
              const accel = Math.abs((v2 - v1) / dt);
              if (accel > maxAccelDetected) maxAccelDetected = accel;
            }
          }
        }
      }
    });

    if (maxAccelDetected > (settings.maxAcceleration || 100) + 5) {
      issues.push({
        type: "warning",
        title: "Acceleration Limit Exceeded",
        description: `Detected acceleration of ${maxAccelDetected.toFixed(
          1,
        )} in/s² (Limit: ${settings.maxAcceleration}).`,
      });
      score -= 5;
    }
  }

  // 4. Missing Wait Times (Heuristic)
  // If we have stops (zero velocity) but no wait command, maybe warn?
  // Actually, stops are fine.

  // 5. Suggestions
  if (score < 100 && collisions.length > 0) {
    issues.push({
      type: "info",
      title: "Optimization Recommended",
      description:
        "Try using the 'Optimize' tool to automatically fix collisions.",
    });
  }

  return {
    score: Math.max(0, score),
    issues,
    metrics: {
      maxVelocityDetected: maxVelDetected,
      maxAccelerationDetected: maxAccelDetected,
      minSafetyMargin: 0, // Not implemented yet
      totalTime: timePrediction.totalTime,
    },
  };
}
