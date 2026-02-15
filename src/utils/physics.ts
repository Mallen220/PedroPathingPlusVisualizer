// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import type { PathStats, Settings } from "../types";

export interface MotorSpecs {
  freeSpeed: number; // RPM
  stallTorque: number; // kg.cm
  stallCurrent: number; // Amps
  freeCurrent: number; // Amps
}

export const MOTOR_OPTIONS = [
  {
    value: "gobilda-5203-312",
    label: "GoBilda 5203 Yellow Jacket (312 RPM)",
    specs: {
      freeSpeed: 312,
      stallTorque: 24.3,
      stallCurrent: 8.5,
      freeCurrent: 0.25,
    },
  },
  {
    value: "gobilda-5203-435",
    label: "GoBilda 5203 Yellow Jacket (435 RPM)",
    specs: {
      freeSpeed: 435,
      stallTorque: 18.7,
      stallCurrent: 8.5,
      freeCurrent: 0.25,
    },
  },
  {
    value: "gobilda-5203-223",
    label: "GoBilda 5203 Yellow Jacket (223 RPM)",
    specs: {
      freeSpeed: 223,
      stallTorque: 34.3,
      stallCurrent: 8.5,
      freeCurrent: 0.25,
    },
  },
  {
    value: "gobilda-5203-117",
    label: "GoBilda 5203 Yellow Jacket (117 RPM)",
    specs: {
      freeSpeed: 117,
      stallTorque: 67.9,
      stallCurrent: 8.5,
      freeCurrent: 0.25,
    },
  },
  {
    value: "rev-hd-hex-300",
    label: "REV HD Hex Motor (20:1, 300 RPM)",
    specs: {
      freeSpeed: 300,
      stallTorque: 18.5,
      stallCurrent: 9.2,
      freeCurrent: 0.25,
    },
  },
  {
    value: "rev-core-hex",
    label: "REV Core Hex Motor",
    specs: {
      freeSpeed: 125,
      stallTorque: 6.5,
      stallCurrent: 4.4,
      freeCurrent: 0.3,
    },
  },
  {
    value: "neverest-classic-40",
    label: "NeveRest Classic 40 (160 RPM)",
    specs: {
      freeSpeed: 160,
      stallTorque: 25.0,
      stallCurrent: 11.5,
      freeCurrent: 0.4,
    },
  },
  {
    value: "neverest-classic-60",
    label: "NeveRest Classic 60 (105 RPM)",
    specs: {
      freeSpeed: 105,
      stallTorque: 37.5,
      stallCurrent: 11.5,
      freeCurrent: 0.4,
    },
  },
];

export interface EnergyStats {
  totalEnergyJoules: number;
  capacityUsedmAh: number;
  batteryPercentageUsed: number;
  currentData: { time: number; value: number }[];
  powerData: { time: number; value: number }[];
}

export function calculateEnergyUsage(
  stats: PathStats,
  settings: Settings,
): EnergyStats {
  // 1. Get Motor Specs
  const motorId = settings.driveMotorType || "gobilda-5203-312";
  const motorOption =
    MOTOR_OPTIONS.find((m) => m.value === motorId) || MOTOR_OPTIONS[0];
  const specs = motorOption.specs;

  // 2. Constants
  const numMotors = 4; // Assume 4 motor drive
  const massKg = (settings.robotMass || 30) * 0.453592;
  const wheelDiameterIn = settings.driveWheelDiameter || 3.78;
  const wheelRadiusM = (wheelDiameterIn / 2) * 0.0254;
  const gearRatio = settings.driveGearRatio || 1.0;
  const gravity = 9.81;
  const frictionCoeff = 0.15; // Baseline rolling resistance + mechanical loss
  const voltage = 12.0; // Nominal

  // Motor Constants
  // Stall Torque in N.m (1 kg.cm = 0.0980665 N.m)
  const stallTorqueNm = specs.stallTorque * 0.0980665;

  // kT = T_stall / (I_stall - I_free)
  const kT = stallTorqueNm / (specs.stallCurrent - specs.freeCurrent);

  let totalEnergyJ = 0;
  let totalCapacityAh = 0;

  const currentData: { time: number; value: number }[] = [];
  const powerData: { time: number; value: number }[] = [];

  // Iterate through profile
  // stats.velocityData and stats.accelerationData are aligned by time in PathStatisticsDialog
  const len = Math.min(
    stats.velocityData.length,
    stats.accelerationData.length,
  );

  for (let i = 0; i < len; i++) {
    const t = stats.velocityData[i].time;
    // in/s -> m/s
    const v = Math.abs(stats.velocityData[i].value) * 0.0254;
    // in/s^2 -> m/s^2
    const a = Math.abs(stats.accelerationData[i].value) * 0.0254;

    // Force Required (Linear)
    // F = ma + F_friction
    // F_friction (rolling resistance) = mu * N = mu * mg
    // Also include rotational inertia multiplier (approx 1.2x for drivetrain mass)
    const effectiveMass = massKg * 1.2;
    const forceFriction = frictionCoeff * massKg * gravity;
    const forceTraction = effectiveMass * a + forceFriction;

    // Torque at Wheel
    // T_wheel = F * r
    const torqueWheel = forceTraction * wheelRadiusM;

    // Torque per Motor
    // T_motor = (T_wheel / GearRatio) / NumMotors
    // Assume 85% mechanical efficiency
    const efficiency = 0.85;
    const torqueMotor = torqueWheel / gearRatio / numMotors / efficiency;

    // Motor Speed
    // w_motor = (v / r) * GearRatio
    const wMotor = (v / wheelRadiusM) * gearRatio;

    // Current Calculation
    // I = (T / kT) + I_free
    let current = torqueMotor / kT + specs.freeCurrent;

    // Voltage Limit Check
    // V_applied = I * R + V_bemf
    // R approx V_nominal / I_stall
    const motorResistance = 12.0 / specs.stallCurrent;
    const backEMF = wMotor * kT; // kE approx kT in SI

    // Max current possible at this speed: (12 - BackEMF) / R
    // If BackEMF > 12, max current is 0 (regenerative braking ignored for simplicity or treated as 0 draw)
    const maxCurrentAtSpeed = Math.max(
      0,
      (voltage - backEMF) / motorResistance,
    );

    if (current > maxCurrentAtSpeed) {
      current = maxCurrentAtSpeed;
    }
    if (current < 0) current = 0; // Ignore regen for consumption calc

    // Total Current
    const totalCurrent = current * numMotors;

    // Power
    const power = voltage * totalCurrent;

    // Integrate
    if (i > 0) {
      const dt = t - stats.velocityData[i - 1].time;
      if (dt > 0) {
        totalEnergyJ += power * dt;
        totalCapacityAh += totalCurrent * (dt / 3600);
      }
    }

    currentData.push({ time: t, value: totalCurrent });
    powerData.push({ time: t, value: power });
  }

  const capacityUsedmAh = totalCapacityAh * 1000;
  const batteryCap = settings.batteryCapacity || 3000;
  const percentage = batteryCap > 0 ? (capacityUsedmAh / batteryCap) * 100 : 0;

  return {
    totalEnergyJoules: totalEnergyJ,
    capacityUsedmAh,
    batteryPercentageUsed: percentage,
    currentData,
    powerData,
  };
}
