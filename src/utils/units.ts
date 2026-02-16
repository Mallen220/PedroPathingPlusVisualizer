export type UnitSystem = "imperial" | "metric";

export const CM_PER_INCH = 2.54;

/**
 * Converts a value in inches to the target unit system.
 * @param valueInInches Value in inches
 * @param system Target unit system
 * @returns Value in inches or centimeters
 */
export function toDisplay(valueInInches: number, system: UnitSystem | string): number {
  if (system === "metric") {
    return valueInInches * CM_PER_INCH;
  }
  return valueInInches;
}

/**
 * Converts a displayed value back to inches.
 * @param displayValue Value in display units
 * @param system Current unit system
 * @returns Value in inches
 */
export function fromDisplay(displayValue: number, system: UnitSystem | string): number {
  if (system === "metric") {
    return displayValue / CM_PER_INCH;
  }
  return displayValue;
}

/**
 * Gets the unit label for the current system.
 * @param system Unit system
 * @returns "in" or "cm"
 */
export function getUnitLabel(system: UnitSystem | string): string {
  return system === "metric" ? "cm" : "in";
}

/**
 * Formats a distance value for display.
 * @param valueInInches Value in inches
 * @param system Unit system
 * @param decimals Number of decimal places
 * @returns Formatted string (e.g. "12.0 in" or "30.5 cm")
 */
export function formatDistance(valueInInches: number, system: UnitSystem | string, decimals: number = 2): string {
  const val = toDisplay(valueInInches, system);
  return `${val.toFixed(decimals)} ${getUnitLabel(system)}`;
}
