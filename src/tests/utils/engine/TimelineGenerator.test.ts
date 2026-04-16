import { describe, it, expect } from "vitest";
import { TimelineGenerator } from "../../../utils/engine/TimelineGenerator";
import type { IntegratedState } from "../../../utils/engine/KinematicIntegrator";

describe("TimelineGenerator", () => {
  it("samples timeline at fixed intervals", () => {
    const gen = new TimelineGenerator(10);
    const states: IntegratedState[] = [
      { time: 0.0, x: 0, y: 0, heading: 0, velocity: 0, acceleration: 0, angularVelocity: 0, spatialPercent: 0, lineIndex: 0 },
      { time: 0.5, x: 5, y: 0, heading: 0, velocity: 10, acceleration: 0, angularVelocity: 0, spatialPercent: 0.5, lineIndex: 0 },
      { time: 1.0, x: 10, y: 0, heading: 0, velocity: 0, acceleration: 0, angularVelocity: 0, spatialPercent: 1.0, lineIndex: 0 }
    ];
    const timeline = gen.generate([{ states, events: [] }], []);
    expect(timeline.states.length).toBeGreaterThanOrEqual(100);
    expect(timeline.states[0].time).toBe(0);
    const diff = Math.abs(timeline.states[timeline.states.length - 1].time - 1.0);
    expect(diff).toBeLessThan(0.02);
  });
});