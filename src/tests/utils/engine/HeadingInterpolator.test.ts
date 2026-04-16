import { describe, it, expect } from "vitest";
import { TangentialStrategy, LinearStrategy, ConstantStrategy, FacingPointStrategy, PiecewiseStrategy } from "../../../utils/engine/HeadingInterpolator";

describe("Heading Strategies", () => {
  it("TangentialStrategy caches heading on zero derivative", () => {
    const strat = new TangentialStrategy();
    const angle1 = strat.getHeading(0, 0, {x:0, y:0}, {dx: 1, dy: 1});
    expect(angle1).toBeCloseTo(45);
    const angle2 = strat.getHeading(0.1, 0.1, {x:0, y:0}, {dx: 0, dy: 0});
    expect(angle2).toBeCloseTo(45);
  });

  it("LinearStrategy interpolates shortest path", () => {
    const strat = new LinearStrategy(350, 10);
    const midAngle = strat.getHeading(0.5, 0.5);
    expect(midAngle).toBe(360);
  });

  it("FacingPointStrategy caches heading exactly on point", () => {
    const strat = new FacingPointStrategy();
    const angle1 = strat.getHeading(0, 0, {x:0, y:0}, {dx: 1, dy: 1}, {x: 10, y: 0});
    expect(angle1).toBe(0);
    const angle2 = strat.getHeading(0.5, 0.5, {x:10, y:0}, {dx: 1, dy: 1}, {x: 10, y: 0});
    expect(angle2).toBe(0);
  });

  it("PiecewiseStrategy correctly queries by spatial percent", () => {
    const s1 = new ConstantStrategy(10);
    const s2 = new ConstantStrategy(20);
    const strat = new PiecewiseStrategy([
      { threshold: 0.5, strategy: s1 },
      { threshold: 1.0, strategy: s2 }
    ]);
    expect(strat.getHeading(0.2, 0.2, {x:0,y:0}, {dx:0,dy:0})).toBe(10);
    expect(strat.getHeading(0.8, 0.8, {x:0,y:0}, {dx:0,dy:0})).toBe(20);
  });
});