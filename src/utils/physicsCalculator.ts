// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.

export interface PhysicsParams {
  robotMass: number; // lbs
  motorStallTorque: number; // N-m
  motorStallCurrent: number; // A
  wheelDiameter: number; // inches
  gearRatio: number; // 1.0 if direct, >1 for reduction
  numMotors: number; // typically 4
  kFriction: number; // coefficient of friction
  driveType: "mecanum" | "tank" | "swerve"; // For future refinements
}

export interface PhysicsResult {
  torqueData: { time: number; value: number }[];
  currentData: { time: number; value: number }[];
  forceData: { time: number; value: number }[]; // Total Force Magnitude
  frictionLimitData: { time: number; value: number }[]; // Friction Limit Force
  insights: {
    startTime: number;
    endTime?: number;
    type: "warning" | "error" | "info";
    message: string;
    value: number;
  }[];
  peakTorque: number;
  peakCurrent: number;
  peakForce: number;
  stallRiskCount: number;
  slipRiskCount: number;
}

/**
 * Calculates physics metrics based on velocity and acceleration profiles.
 */
export function calculatePhysics(
  velocityData: { time: number; value: number }[],
  accelerationData: { time: number; value: number }[],
  centripetalData: { time: number; value: number }[],
  params: PhysicsParams,
): PhysicsResult {
  const torqueData: { time: number; value: number }[] = [];
  const currentData: { time: number; value: number }[] = [];
  const forceData: { time: number; value: number }[] = [];
  const frictionLimitData: { time: number; value: number }[] = [];
  const insights: any[] = [];

  let peakTorque = 0;
  let peakCurrent = 0;
  let peakForce = 0;
  let stallRiskCount = 0;
  let slipRiskCount = 0;

  // Constants
  const GRAVITY = 386.22; // in/s^2 (approx 9.81 m/s^2)
  const LBS_TO_KG = 0.453592;
  const IN_TO_M = 0.0254;
  const NM_TO_OZIN = 141.612;

  // Mass in kg for F=ma (if using metric) or slugs (if using imperial)
  // Let's stick to SI for internal calcs where possible, but convert back for display?
  // Actually, mixing units is painful. Let's use SI internally.
  const massKg = params.robotMass * LBS_TO_KG;
  const wheelRadiusM = (params.wheelDiameter / 2) * IN_TO_M;
  const gearRatio = params.gearRatio || 1;
  const numMotors = params.numMotors || 4;

  // Friction Force Limit (N) = mu * m * g
  // g in m/s^2 is ~9.81
  const gravityM = 9.81;
  const normalForceN = massKg * gravityM;
  const frictionLimitN = params.kFriction * normalForceN;

  // Motor Constants
  // Kt (Torque Constant) = Stall Torque / Stall Current (approx)
  // This assumes linear relationship (DC motor model)
  const kt =
    params.motorStallCurrent > 0
      ? params.motorStallTorque / params.motorStallCurrent
      : 0;

  // Effective Stall Torque at Wheel = Motor Torque * Gear Ratio
  // (Assuming no efficiency loss for now, or bake it into gear ratio)
  const wheelStallTorque = params.motorStallTorque * gearRatio;

  // Iterate through time points
  // Assuming velocityData, accelerationData, centripetalData are aligned in time steps
  // or share the same length and indices corresponding to the same time.
  // They are generated in the same loop in PathStatisticsDialog, so they should be.

  const len = Math.min(
    velocityData.length,
    accelerationData.length,
    centripetalData.length,
  );

  let activeStallWarning: any = null;
  let activeSlipWarning: any = null;

  for (let i = 0; i < len; i++) {
    const t = velocityData[i].time;
    // Linear Acceleration (in/s^2) -> Convert to m/s^2
    const accLinIn = accelerationData[i].value;
    const accLinM = accLinIn * IN_TO_M;

    // Centripetal Acceleration (in/s^2) -> Convert to m/s^2
    const accCentIn = centripetalData[i].value;
    const accCentM = accCentIn * IN_TO_M;

    // Force = Mass * Acceleration
    // Linear Force (Tangential)
    const forceLinN = massKg * accLinM;

    // Centripetal Force (Radial)
    const forceCentN = massKg * accCentM;

    // Total Force Vector Magnitude
    // F_total = sqrt(F_lin^2 + F_cent^2)
    // Note: This is the force the TIRES must exert on the ground (friction).
    const forceTotalN = Math.sqrt(
      forceLinN * forceLinN + forceCentN * forceCentN,
    );

    // Force per wheel (Average) - simplified
    // In reality, weight transfer and mecanum vectors make this complex.
    // For Mecanum: Forward force is shared by 4 wheels. Strafe is less efficient (sqrt(2)?).
    // Let's assume ideal forward motion for torque calculation (conservative for stalling?).
    // Actually, stalling happens when torque demand is high.
    // Torque demand comes from Linear Force + Friction (Rolling Resistance, etc).
    // Let's ignore rolling resistance for now, just F=ma.

    // Torque required per motor (assuming equal distribution)
    // T = (F_lin / numMotors) * r_wheel
    // We only care about Linear Force for Motor Torque (Centripetal is provided by lateral friction, not motor torque usually, unless steering)
    // For non-swerve, lateral force is friction.
    const forcePerMotorN = Math.abs(forceLinN) / numMotors;
    const torqueReqNm = forcePerMotorN * wheelRadiusM;

    // Adjust for Gear Ratio (Motor Torque = Wheel Torque / Ratio)
    const motorTorqueReqNm = torqueReqNm / gearRatio;

    // Estimate Current
    // I = T / Kt
    const currentReqA = kt > 0 ? motorTorqueReqNm / kt : 0;
    // Add a base current? (Free current). Let's ignore for now.

    // Store Data
    // Torque (at Motor Shaft)
    torqueData.push({ time: t, value: motorTorqueReqNm });
    if (motorTorqueReqNm > peakTorque) peakTorque = motorTorqueReqNm;

    // Current (Total for all motors)
    const totalCurrent = currentReqA * numMotors;
    currentData.push({ time: t, value: totalCurrent });
    if (totalCurrent > peakCurrent) peakCurrent = totalCurrent;

    // Force (Total Friction Demand on Floor)
    // Convert N to lbf for display? Or keep N?
    // Let's use lbf for display since Mass is in lbs in settings usually.
    const N_TO_LBF = 0.224809;
    const forceTotalLbf = forceTotalN * N_TO_LBF;
    const limitLbf = frictionLimitN * N_TO_LBF;

    forceData.push({ time: t, value: forceTotalLbf });
    frictionLimitData.push({ time: t, value: limitLbf });
    if (forceTotalLbf > peakForce) peakForce = forceTotalLbf;

    // --- Insights ---

    // 1. Stall Risk
    // If required torque > stall torque * safety factor (e.g. 0.8)
    if (motorTorqueReqNm > params.motorStallTorque * 0.9) {
      if (!activeStallWarning) {
        activeStallWarning = {
          startTime: t,
          type: "error",
          message: "High Motor Load (Stall Risk)",
          value: motorTorqueReqNm,
        };
      } else {
        if (motorTorqueReqNm > activeStallWarning.value)
          activeStallWarning.value = motorTorqueReqNm;
      }
      stallRiskCount++;
    } else {
      if (activeStallWarning) {
        insights.push({ ...activeStallWarning, endTime: t });
        activeStallWarning = null;
      }
    }

    // 2. Slip Risk
    // If Total Force > Friction Limit
    if (forceTotalN > frictionLimitN * 0.95) {
      if (!activeSlipWarning) {
        activeSlipWarning = {
          startTime: t,
          type: "warning",
          message: "Traction Limit Reached (Slip Risk)",
          value: forceTotalLbf,
        };
      } else {
        if (forceTotalLbf > activeSlipWarning.value)
          activeSlipWarning.value = forceTotalLbf;
      }
      slipRiskCount++;
    } else {
      if (activeSlipWarning) {
        insights.push({ ...activeSlipWarning, endTime: t });
        activeSlipWarning = null;
      }
    }
  }

  // Close open warnings
  const endTime = velocityData[velocityData.length - 1]?.time || 0;
  if (activeStallWarning)
    insights.push({ ...activeStallWarning, endTime: endTime });
  if (activeSlipWarning)
    insights.push({ ...activeSlipWarning, endTime: endTime });

  return {
    torqueData,
    currentData,
    forceData,
    frictionLimitData,
    insights,
    peakTorque,
    peakCurrent,
    peakForce,
    stallRiskCount,
    slipRiskCount,
  };
}
