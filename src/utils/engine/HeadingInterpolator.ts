import type { Point } from "../../types";

export abstract class HeadingInterpolator {
  abstract getHeading(
    spatialPercent: number,
    parametricT: number,
    currentPos: { x: number; y: number },
    derivative: { dx: number; dy: number },
    targetPoint?: any
  ): number;
}

export class TangentialStrategy extends HeadingInterpolator {
  private lastHeading: number = 0;
  private hasCached: boolean = false;

  constructor(private reversed: boolean = false) {
    super();
  }

  getHeading(spatialPercent: number, parametricT: number, currentPos: { x: number; y: number }, derivative: { dx: number; dy: number }): number {
    if (Math.abs(derivative.dx) < 1e-6 && Math.abs(derivative.dy) < 1e-6) {
      return this.hasCached ? this.lastHeading : 0;
    }
    let angle = Math.atan2(derivative.dy, derivative.dx) * (180 / Math.PI);
    if (this.reversed) angle += 180;

    this.lastHeading = angle;
    this.hasCached = true;
    return angle;
  }
}

export class LinearStrategy extends HeadingInterpolator {
  constructor(private startDeg: number, private endDeg: number) {
    super();
  }

  getHeading(spatialPercent: number, parametricT: number): number {
    const startDeg = this.startDeg;
    const endDeg = this.endDeg;
    let diff = (endDeg - startDeg) % 360;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return startDeg + diff * spatialPercent;
  }
}

export class ConstantStrategy extends HeadingInterpolator {
  constructor(private degrees: number) {
    super();
  }
  getHeading(): number {
    return this.degrees;
  }
}

export class FacingPointStrategy extends HeadingInterpolator {
  private lastHeading: number = 0;
  private hasCached: boolean = false;
  constructor(private reversed: boolean = false) {
    super();
  }
  getHeading(spatialPercent: number, parametricT: number, currentPos: { x: number; y: number }, derivative: { dx: number; dy: number }, targetPoint?: { x: number; y: number }): number {
    if (!targetPoint) {
      return this.hasCached ? this.lastHeading : 0;
    }
    const dx = targetPoint.x - currentPos.x;
    const dy = targetPoint.y - currentPos.y;
    if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) {
      return this.hasCached ? this.lastHeading : 0;
    }
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (this.reversed) angle += 180;
    this.lastHeading = angle;
    this.hasCached = true;
    return angle;
  }
}

export class PiecewiseStrategy extends HeadingInterpolator {
  constructor(private thresholds: Array<{ threshold: number; strategy: HeadingInterpolator }>) {
    super();
    this.thresholds.sort((a, b) => a.threshold - b.threshold);
  }
  getHeading(spatialPercent: number, parametricT: number, currentPos: { x: number; y: number }, derivative: { dx: number; dy: number }, targetPoint?: any): number {
    let activeStrategy = this.thresholds[this.thresholds.length - 1].strategy;
    for (const t of this.thresholds) {
      if (spatialPercent <= t.threshold) {
        activeStrategy = t.strategy;
        break;
      }
    }
    return activeStrategy.getHeading(spatialPercent, parametricT, currentPos, derivative, targetPoint);
  }
}