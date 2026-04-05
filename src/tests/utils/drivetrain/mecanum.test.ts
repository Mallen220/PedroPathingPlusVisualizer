// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import { describe, it, expect } from "vitest";
import {
  calculateFieldCentricMecanum,
  calculateMecanumWheelSpeeds,
} from "../../../utils/drivetrain/mecanum";

describe("calculateMecanumWheelSpeeds", () => {
  it("should calculate correct wheel speeds when going straight forward", () => {
    // vx = 1, vy = 0, omega = 0
    const speeds = calculateMecanumWheelSpeeds(1, 0, 0, 10, 10);
    expect(speeds.frontLeft).toBeCloseTo(1);
    expect(speeds.backLeft).toBeCloseTo(1);
    expect(speeds.frontRight).toBeCloseTo(1);
    expect(speeds.backRight).toBeCloseTo(1);
  });

  it("should calculate correct wheel speeds when strafing right", () => {
    // vx = 0, vy = 1, omega = 0
    const speeds = calculateMecanumWheelSpeeds(0, 1, 0, 10, 10);
    expect(speeds.frontLeft).toBeCloseTo(1);
    expect(speeds.backLeft).toBeCloseTo(-1);
    expect(speeds.frontRight).toBeCloseTo(-1);
    expect(speeds.backRight).toBeCloseTo(1);
  });

  it("should calculate correct wheel speeds when rotating right", () => {
    // vx = 0, vy = 0, omega = 1, trackWidth=10, wheelBase=10 -> r=10
    // Rotating right (clockwise) means left wheels forward (+), right wheels backward (-)
    const speeds = calculateMecanumWheelSpeeds(0, 0, 1, 10, 10);
    expect(speeds.frontLeft).toBeCloseTo(10);
    expect(speeds.backLeft).toBeCloseTo(10);
    expect(speeds.frontRight).toBeCloseTo(-10);
    expect(speeds.backRight).toBeCloseTo(-10);
  });

  it("should handle mixed inputs appropriately", () => {
    // vx = 1, vy = 1, omega = 1, r=10
    // FL: 1 + 1 + 10 = 12
    // FR: 1 - 1 - 10 = -10
    // BL: 1 - 1 + 10 = 10
    // BR: 1 + 1 - 10 = -8
    const speeds = calculateMecanumWheelSpeeds(1, 1, 1, 10, 10);
    expect(speeds.frontLeft).toBeCloseTo(12);
    expect(speeds.backLeft).toBeCloseTo(10);
    expect(speeds.frontRight).toBeCloseTo(-10);
    expect(speeds.backRight).toBeCloseTo(-8);
  });
});

describe("calculateFieldCentricMecanum", () => {
  it("should calculate correct wheel speeds when going straight forward (0 heading)", () => {
    const speeds = calculateFieldCentricMecanum(1, 0, 0, 0);
    expect(speeds.frontLeft).toBeCloseTo(1);
    expect(speeds.backLeft).toBeCloseTo(1);
    expect(speeds.frontRight).toBeCloseTo(1);
    expect(speeds.backRight).toBeCloseTo(1);
  });

  it("should calculate correct wheel speeds when strafing right (0 heading)", () => {
    const speeds = calculateFieldCentricMecanum(0, 1, 0, 0);
    // Adjusted strafe is 1 * 1.1 = 1.1. Denominator is 1.1.
    // FL: 1.1/1.1=1, BL: -1.1/1.1=-1, FR: -1.1/1.1=-1, BR: 1.1/1.1=1
    expect(speeds.frontLeft).toBeCloseTo(1);
    expect(speeds.backLeft).toBeCloseTo(-1);
    expect(speeds.frontRight).toBeCloseTo(-1);
    expect(speeds.backRight).toBeCloseTo(1);
  });

  it("should calculate correct wheel speeds when rotating right (0 heading)", () => {
    const speeds = calculateFieldCentricMecanum(0, 0, 1, 0);
    expect(speeds.frontLeft).toBeCloseTo(1);
    expect(speeds.backLeft).toBeCloseTo(-1);
    expect(speeds.frontRight).toBeCloseTo(1);
    expect(speeds.backRight).toBeCloseTo(-1);
  });

  it("should calculate correct wheel speeds going forward but facing 90 degrees left (heading pi/2)", () => {
    // If bot heading is pi/2 (facing left), pushing forward stick means moving 'up' on the field.
    // Bot needs to strafe right relative to itself to go 'up'.
    const speeds = calculateFieldCentricMecanum(1, 0, 0, Math.PI / 2);
    // When heading is pi/2, rotStrafe = 0*cos(-pi/2) - 1*sin(-pi/2) = -1*(-1) = 1
    // rotForward = 0*sin(-pi/2) + 1*cos(-pi/2) = 0
    // Adjusted strafe = 1.1. FL: 1.1/1.1=1, BL: -1.1/1.1=-1, FR: -1.1/1.1=-1, BR: 1.1/1.1=1
    expect(speeds.frontLeft).toBeCloseTo(1);
    expect(speeds.backLeft).toBeCloseTo(-1);
    expect(speeds.frontRight).toBeCloseTo(-1);
    expect(speeds.backRight).toBeCloseTo(1);
  });
});
