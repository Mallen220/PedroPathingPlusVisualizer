export const CM_PER_INCH = 2.54;

export function toUserUnit(inches: number, unit: "imperial" | "metric" = "imperial"): number {
  if (unit === "metric") {
    return inches * CM_PER_INCH;
  }
  return inches;
}

export function fromUserUnit(value: number, unit: "imperial" | "metric" = "imperial"): number {
  if (unit === "metric") {
    return value / CM_PER_INCH;
  }
  return value;
}

export function getUnitLabel(unit: "imperial" | "metric" = "imperial"): string {
  return unit === "metric" ? "cm" : "in";
}

export function formatDistance(inches: number, unit: "imperial" | "metric" = "imperial", decimals: number = 2): string {
  const value = toUserUnit(inches, unit);
  return `${value.toFixed(decimals)}${getUnitLabel(unit)}`;
}
