import type { PathChainCluster } from "./SpatialAggregator";
import type { HeadingInterpolator } from "./HeadingInterpolator";

export interface IntegratedState {
  x: number;
  y: number;
  heading: number;
  velocity: number;
  acceleration: number;
  angularVelocity: number;
  time: number;
  spatialPercent: number;
  lineIndex: number;
}

export class KinematicIntegrator {
  constructor(
    private maxVelocity: number,
    private maxAcceleration: number,
    private maxAngularVelocity: number,
    private maxAngularAcceleration: number,
    private trackWidth: number,
    private friction: number = 1.0,
    private gravity: number = 386.09
  ) {}

  public integrate(
    cluster: PathChainCluster,
    headingStrategy: HeadingInterpolator,
    initialVelocity: number = 0,
    finalVelocity: number = 0
  ): IntegratedState[] {
    const states: IntegratedState[] = [];
    const steps = cluster.steps;
    const n = steps.length;
    if (n === 0) return [];
    const vMaxArray = new Float64Array(n);
    const vForward = new Float64Array(n);
    const vBackward = new Float64Array(n);
    const vFinal = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const R = steps[i].radius;
      let vMaxCurve = this.maxVelocity;
      if (Number.isFinite(R) && R > 0.001) {
        vMaxCurve = Math.sqrt(this.friction * this.gravity * R);
      }
      vMaxArray[i] = Math.min(this.maxVelocity, vMaxCurve);
    }
    vForward[0] = initialVelocity;
    for (let i = 1; i < n; i++) {
      const ds = steps[i].s - steps[i-1].s;
      const vLimit = Math.sqrt(vForward[i-1] * vForward[i-1] + 2 * this.maxAcceleration * ds);
      vForward[i] = Math.min(vLimit, vMaxArray[i]);
    }
    vBackward[n-1] = finalVelocity;
    for (let i = n - 2; i >= 0; i--) {
      const ds = steps[i+1].s - steps[i].s;
      const vLimit = Math.sqrt(vBackward[i+1] * vBackward[i+1] + 2 * this.maxAcceleration * ds);
      vBackward[i] = Math.min(vLimit, vForward[i]);
    }
    for (let i = 0; i < n; i++) {
      vFinal[i] = vBackward[i];
    }
    let currentTime = 0;
    let currentHeading = 0;
    let prevHeading = 0;
    let prevVelocity = vFinal[0];
    for (let i = 0; i < n; i++) {
      const step = steps[i];
      let v = vFinal[i];
      const spatialPercent = cluster.totalLength > 0 ? step.s / cluster.totalLength : 0;
      const dx = i < n - 1 ? steps[i+1].x - step.x : Math.cos(step.tangentRotation);
      const dy = i < n - 1 ? steps[i+1].y - step.y : Math.sin(step.tangentRotation);
      const rawHeading = headingStrategy.getHeading(
        spatialPercent,
        step.t,
        { x: step.x, y: step.y },
        { dx, dy },
        null
      );
      let ds = 0;
      let dt = 0;
      if (i > 0) {
        ds = step.s - steps[i-1].s;
        const avgV = (v + prevVelocity) / 2;
        dt = avgV > 0.1 ? ds / avgV : 0.001;
        let dHeading = rawHeading - prevHeading;
        if (dHeading > 180) dHeading -= 360;
        if (dHeading < -180) dHeading += 360;
        const dHeadingRad = dHeading * (Math.PI / 180);
        let angV = dHeadingRad / dt;
        if (Math.abs(angV) > this.maxAngularVelocity) {
           dt = Math.abs(dHeadingRad) / this.maxAngularVelocity;
           v = ds / dt;
        }
      }
      currentTime += dt;
      currentHeading = rawHeading;
      let a = 0;
      if (dt > 0) {
        a = (v - prevVelocity) / dt;
      }
      states.push({
        x: step.x,
        y: step.y,
        heading: currentHeading,
        velocity: v,
        acceleration: a,
        angularVelocity: dt > 0 ? (currentHeading - prevHeading) / dt : 0,
        time: currentTime,
        spatialPercent,
        lineIndex: step.lineIndex
      });
      prevVelocity = v;
      prevHeading = currentHeading;
    }
    return states;
  }
}