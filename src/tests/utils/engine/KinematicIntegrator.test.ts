import { describe, it, expect } from "vitest";
import { KinematicIntegrator } from "../../../utils/engine/KinematicIntegrator";
import { TangentialStrategy } from "../../../utils/engine/HeadingInterpolator";
import type { PathChainCluster } from "../../../utils/engine/SpatialAggregator";

describe("KinematicIntegrator", () => {
  it("generates a trapezoidal profile with velocity clamping", () => {
    const integrator = new KinematicIntegrator(60, 40, 2, 2, 16);
    const heading = new TangentialStrategy();
    const cluster: PathChainCluster = {
      startPoint: { x: 0, y: 0 } as any,
      lines: [],
      totalLength: 100,
      events: [],
      steps: [
        { x: 0, y: 0, t: 0, s: 0, radius: Infinity, tangentRotation: 0, curvature: 0, lineIndex: 0 },
        { x: 25, y: 0, t: 0.25, s: 25, radius: Infinity, tangentRotation: 0, curvature: 0, lineIndex: 0 },
        { x: 50, y: 0, t: 0.50, s: 50, radius: Infinity, tangentRotation: 0, curvature: 0, lineIndex: 0 },
        { x: 75, y: 0, t: 0.75, s: 75, radius: Infinity, tangentRotation: 0, curvature: 0, lineIndex: 0 },
        { x: 100, y: 0, t: 1.0, s: 100, radius: Infinity, tangentRotation: 0, curvature: 0, lineIndex: 0 },
      ]
    };
    const states = integrator.integrate(cluster, heading);
    expect(states.length).toBe(5);
    expect(states[0].velocity).toBe(0);
    expect(states[1].velocity).toBeGreaterThan(0);
    expect(states[4].velocity).toBe(0);
    for (const state of states) {
       expect(state.velocity).toBeLessThanOrEqual(60);
    }
  });
});