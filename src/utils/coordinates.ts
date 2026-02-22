// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.

export type CoordinateSystem = "Pedro" | "FTC";

export function toUserCoordinate(
  fieldValue: number,
  system: CoordinateSystem = "Pedro",
): number {
  if (system === "FTC") {
    return fieldValue - 72;
  }
  return fieldValue;
}

export function toFieldCoordinate(
  userValue: number,
  system: CoordinateSystem = "Pedro",
): number {
  if (system === "FTC") {
    return userValue + 72;
  }
  return userValue;
}
