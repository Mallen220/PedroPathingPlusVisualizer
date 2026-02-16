import { describe, it, expect } from "vitest";
import { toUserUnit, fromUserUnit, getUnitLabel, formatDistance } from "./units";

describe("units utility", () => {
  it("converts to imperial correctly", () => {
    expect(toUserUnit(10, "imperial")).toBe(10);
    expect(toUserUnit(0, "imperial")).toBe(0);
  });

  it("converts to metric correctly", () => {
    expect(toUserUnit(10, "metric")).toBeCloseTo(25.4);
    expect(toUserUnit(1, "metric")).toBeCloseTo(2.54);
  });

  it("converts from imperial correctly", () => {
    expect(fromUserUnit(10, "imperial")).toBe(10);
  });

  it("converts from metric correctly", () => {
    expect(fromUserUnit(25.4, "metric")).toBeCloseTo(10);
    expect(fromUserUnit(2.54, "metric")).toBeCloseTo(1);
  });

  it("gets correct unit label", () => {
    expect(getUnitLabel("imperial")).toBe("in");
    expect(getUnitLabel("metric")).toBe("cm");
    expect(getUnitLabel(undefined)).toBe("in");
  });

  it("formats distance correctly", () => {
    expect(formatDistance(10, "imperial")).toBe("10.00in");
    expect(formatDistance(10, "metric")).toBe("25.40cm");
    expect(formatDistance(10, "metric", 1)).toBe("25.4cm");
  });
});
