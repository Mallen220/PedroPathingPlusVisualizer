// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.

import { describe, it, expect } from "vitest";
import {
  calculatePhysics,
  type PhysicsParams,
} from "../utils/physicsCalculator";

describe("physicsCalculator", () => {
  const defaultParams: PhysicsParams = {
    robotMass: 28, // lbs
    motorStallTorque: 2.1, // N-m
    motorStallCurrent: 9.2, // A
    wheelDiameter: 3.78, // in
    gearRatio: 1,
    numMotors: 4,
    kFriction: 0.6,
    driveType: "mecanum",
  };

  it("should calculate zero torque/force for stationary robot", () => {
    const velocityData = [{ time: 0, value: 0 }];
    const accelerationData = [{ time: 0, value: 0 }];
    const centripetalData = [{ time: 0, value: 0 }];

    const result = calculatePhysics(
      velocityData,
      accelerationData,
      centripetalData,
      defaultParams,
    );

    expect(result.peakTorque).toBe(0);
    expect(result.peakForce).toBe(0);
    expect(result.peakCurrent).toBe(0);
    expect(result.torqueData[0].value).toBe(0);
  });

  it("should calculate force correctly for linear acceleration", () => {
    // 100 in/s^2 linear acceleration
    // Mass = 28 lbs = 12.7 kg
    // F = ma = 12.7 * (100 * 0.0254) = 12.7 * 2.54 = 32.258 N
    const accIn = 100;
    const accelerationData = [{ time: 1, value: accIn }];
    const velocityData = [{ time: 1, value: 10 }]; // Arbitrary non-zero velocity
    const centripetalData = [{ time: 1, value: 0 }];

    const result = calculatePhysics(
      velocityData,
      accelerationData,
      centripetalData,
      defaultParams,
    );

    const massKg = 28 * 0.453592;
    const accM = 100 * 0.0254;
    const expectedForceN = massKg * accM;
    const expectedForceLbf = expectedForceN * 0.224809;

    expect(result.forceData[0].value).toBeCloseTo(expectedForceLbf, 1);
  });

  it("should detect stall risk", () => {
    // High acceleration to cause high torque demand
    // T = (F/4) * r
    // We need T > 2.1 * 0.9 = 1.89 Nm
    // F = T * 4 / r
    // r = 3.78/2 * 0.0254 = 0.048 m
    // F = 1.89 * 4 / 0.048 = 157.5 N
    // a = F / m = 157.5 / 12.7 = 12.4 m/s^2
    // a_in = 12.4 / 0.0254 = 488 in/s^2

    const accelerationData = [{ time: 1, value: 600 }];
    const velocityData = [{ time: 1, value: 10 }];
    const centripetalData = [{ time: 1, value: 0 }];

    const result = calculatePhysics(
      velocityData,
      accelerationData,
      centripetalData,
      defaultParams,
    );

    expect(result.stallRiskCount).toBeGreaterThan(0);
    expect(result.insights.some((i) => i.type === "error")).toBe(true);
  });

  it("should detect slip risk", () => {
    // High acceleration to exceed friction
    // F_friction = mu * m * g = 0.6 * 12.7 * 9.81 = 74.7 N
    // F_req > 74.7 * 0.95 = 71 N
    // a = F/m = 71 / 12.7 = 5.6 m/s^2
    // a_in = 5.6 / 0.0254 = 220 in/s^2

    const accelerationData = [{ time: 1, value: 300 }];
    const velocityData = [{ time: 1, value: 10 }];
    const centripetalData = [{ time: 1, value: 0 }];

    const result = calculatePhysics(
      velocityData,
      accelerationData,
      centripetalData,
      defaultParams,
    );

    expect(result.slipRiskCount).toBeGreaterThan(0);
    expect(result.insights.some((i) => i.type === "warning")).toBe(true);
  });
});
