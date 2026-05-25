// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import { getCurvePoint } from "../utils/math";

const line = {
  startPoint: { x: 0, y: 0 },
  endPoint: { x: 100, y: 100 },
  controlPoints: [
    { x: 50, y: 0 },
    { x: 50, y: 100 },
  ],
};

const cps = [line.startPoint, ...line.controlPoints, line.endPoint];

const vProfile: number[] = [];
for (let i = 0; i < 100; i++) {
  if (i < 20) {
    vProfile.push(i * 5);
  } else if (i < 80) {
    vProfile.push(100);
  } else {
    vProfile.push(Math.max(0, 100 - (i - 80) * 5));
  }
}

const maxVel = 100;

function getColor(t: number) {
  const profileIndex = Math.floor(t * (vProfile.length - 1));
  const safeIndex = Math.min(vProfile.length - 1, Math.max(0, profileIndex));
  const vAvg = vProfile[safeIndex] || 0;
  const ratio = Math.min(1, Math.max(0, vAvg / maxVel));
  const hue = 120 - ratio * 120;
  return `hsl(${hue}, 100%, 40%)`;
}

function runBaseline() {
  let objectCount = 0;
  const samples = 100;

  getCurvePoint(0, cps);

  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    getCurvePoint(t, cps);
    objectCount++;
  }
  return objectCount;
}

function runOptimized() {
  let objectCount = 0;
  const samples = 100;

  let currentPoints: any[] = [];
  let currentColor: string | null = null;

  let prevPt = getCurvePoint(0, cps);

  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const currPt = getCurvePoint(t, cps);
    const color = getColor(t);

    if (color === currentColor) {
      currentPoints.push(currPt);
    } else {
      if (currentPoints.length > 0) {
        objectCount++;
      }

      currentPoints = [prevPt, currPt];
      currentColor = color;
    }

    prevPt = currPt;
  }

  if (currentPoints.length > 0) {
    objectCount++;
  }

  return objectCount;
}

runBaseline();
runOptimized();
