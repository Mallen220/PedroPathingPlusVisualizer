// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
export type CoordinateSystem = "Pedro" | "FTC";
type Point = { x: number; y: number };
type SettingsWithUnits = { visualizerUnits?: "imperial" | "metric" };

export function toUser(
  point: Point,
  system: CoordinateSystem = "Pedro",
): Point {
  if (system === "FTC") {
    return {
      x: 72 - point.y,
      y: point.x - 72,
    };
  }
  return { x: point.x, y: point.y };
}

export function toField(
  point: Point,
  system: CoordinateSystem = "Pedro",
): Point {
  if (system === "FTC") {
    return {
      x: point.y + 72,
      y: 72 - point.x,
    };
  }
  return { x: point.x, y: point.y };
}

export function toUserHeading(
  fieldHeading: number,
  _system: CoordinateSystem = "Pedro",
): number {
  return fieldHeading;
}

export function toFieldHeading(
  userHeading: number,
  _system: CoordinateSystem = "Pedro",
): number {
  return userHeading;
}

export function toUserCoordinate(
  val: number,
  _system: CoordinateSystem,
): number {
  return val;
}

export function toFieldCoordinate(
  val: number,
  _system: CoordinateSystem,
): number {
  return val;
}

export function inchToCm(inches: number): number {
  return inches * 2.54;
}

export function cmToInch(cm: number): number {
  return cm / 2.54;
}

export function formatDisplayCoordinate(
  val: number,
  settings: SettingsWithUnits,
  fractionDigits: number = 2,
): string {
  if (settings?.visualizerUnits === "metric") {
    return inchToCm(val).toFixed(fractionDigits);
  }
  return val.toFixed(fractionDigits);
}

export function formatDisplayDistance(
  val: number,
  settings: SettingsWithUnits,
  fractionDigits: number = 2,
): string {
  if (settings?.visualizerUnits === "metric") {
    return `${inchToCm(val).toFixed(fractionDigits)} cm`;
  }
  return `${val.toFixed(fractionDigits)} in`;
}
