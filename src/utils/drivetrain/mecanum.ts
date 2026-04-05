// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
export interface WheelSpeeds {
  frontLeft: number;
  backLeft: number;
  frontRight: number;
  backRight: number;
}

export function calculateMecanumWheelSpeeds(
  vx: number,
  vy: number,
  omega: number,
  trackWidth: number,
  wheelBase: number,
): WheelSpeeds {
  // Standard mecanum kinematics
  // vx = forward (+), vy = strafe right (+), omega = clockwise rotation (+)
  // To rotate right (clockwise), left wheels must move forward (+) and right wheels backward (-)
  const r = (trackWidth + wheelBase) / 2;

  return {
    frontLeft: vx + vy + omega * r,
    frontRight: vx - vy - omega * r,
    backLeft: vx - vy + omega * r,
    backRight: vx + vy - omega * r,
  };
}

export function calculateFieldCentricMecanum(
  forward: number,
  strafe: number,
  rotate: number,
  botHeading: number,
): WheelSpeeds {
  // Rotate the movement direction counter to the bot's rotation
  const rotStrafe =
    strafe * Math.cos(-botHeading) - forward * Math.sin(-botHeading);
  const rotForward =
    strafe * Math.sin(-botHeading) + forward * Math.cos(-botHeading);

  // Counteract imperfect strafing on the rotated vector
  const adjustedRotStrafe = rotStrafe * 1.1;

  // Normalize speeds
  const denominator = Math.max(
    Math.abs(rotForward) + Math.abs(adjustedRotStrafe) + Math.abs(rotate),
    1.0,
  );

  return {
    frontLeft: (rotForward + adjustedRotStrafe + rotate) / denominator,
    backLeft: (rotForward - adjustedRotStrafe - rotate) / denominator,
    frontRight: (rotForward - adjustedRotStrafe + rotate) / denominator,
    backRight: (rotForward + adjustedRotStrafe - rotate) / denominator,
  };
}
