// src/utils/timeCalculator.ts
import type { Point, Line, FPASettings, TimePrediction } from "../types";
import { getCurvePoint } from "./math";

/**
 * Format time in seconds to a human-readable string
 */
export function formatTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0.000s";

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(3).padStart(6, "0")}s`;
  }

  return `${seconds.toFixed(3)}s`;
}

/**
 * Calculate the length of a curve by sampling points
 */
function calculateCurveLength(
  start: Point,
  controlPoints: Point[],
  end: Point,
  samples: number = 100,
): number {
  let length = 0;
  let prevPoint = start;

  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const point = getCurvePoint(t, [start, ...controlPoints, end]);
    const dx = point.x - prevPoint.x;
    const dy = point.y - prevPoint.y;
    length += Math.sqrt(dx * dx + dy * dy);
    prevPoint = point;
  }

  return length;
}

/**
 * Calculate time for a motion profile (trapezoidal or triangular)
 */
function calculateMotionProfileTime(
  distance: number,
  maxVel: number,
  maxAcc: number,
  maxDec?: number,
): number {
  const deceleration = maxDec || maxAcc;

  // Calculate acceleration and deceleration distances
  const accDist = (maxVel * maxVel) / (2 * maxAcc);
  const decDist = (maxVel * maxVel) / (2 * deceleration);

  // Check if we can reach max velocity (trapezoidal profile)
  if (distance >= accDist + decDist) {
    const accTime = maxVel / maxAcc;
    const decTime = maxVel / deceleration;
    const constDist = distance - accDist - decDist;
    const constTime = constDist / maxVel;

    return accTime + constTime + decTime;
  } else {
    // Triangular profile
    const vPeak = Math.sqrt(
      (2 * distance * maxAcc * deceleration) / (maxAcc + deceleration),
    );
    const accTime = vPeak / maxAcc;
    const decTime = vPeak / deceleration;

    return accTime + decTime;
  }
}

/**
 * Calculate path time with motion profile (more accurate)
 */
export function calculatePathTime(
  startPoint: Point,
  lines: Line[],
  settings: FPASettings,
): TimePrediction {
  // Check if new motion profile fields exist, otherwise use old method
  const useMotionProfile =
    settings.maxVelocity !== undefined &&
    settings.maxAcceleration !== undefined;

  const segmentLengths: number[] = [];
  const segmentTimes: number[] = [];

  // Calculate length of each segment
  lines.forEach((line, idx) => {
    const start = idx === 0 ? startPoint : lines[idx - 1].endPoint;
    const length = calculateCurveLength(
      start,
      line.controlPoints,
      line.endPoint,
    );
    segmentLengths.push(length);
  });

  if (useMotionProfile) {
    // Use motion profile calculation
    const { maxVelocity, maxAcceleration, maxDeceleration } = settings;
    segmentLengths.forEach((length) => {
      const segmentTime = calculateMotionProfileTime(
        length,
        maxVelocity!,
        maxAcceleration!,
        maxDeceleration,
      );
      segmentTimes.push(segmentTime);
    });
  } else {
    // Fallback to simple velocity-based calculation
    const avgVelocity = (settings.xVelocity + settings.yVelocity) / 2;
    segmentLengths.forEach((length) => {
      const segmentTime = length / avgVelocity;
      segmentTimes.push(segmentTime);
    });
  }

  const totalTime = segmentTimes.reduce((sum, time) => sum + time, 0);
  const totalDistance = segmentLengths.reduce((sum, length) => sum + length, 0);

  return {
    totalTime,
    segmentTimes,
    totalDistance,
  };
}

/**
 * Calculate animation duration (with optional speed factor)
 */
export function getAnimationDuration(
  totalTime: number,
  speedFactor: number = 1.0,
): number {
  return (totalTime * 1000) / speedFactor;
}
