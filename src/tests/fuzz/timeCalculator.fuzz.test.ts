// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.
import { describe, it, expect } from "vitest";
import { createRequire } from "module";

import { analyzePathSegment, calculateRotationTime } from "../../utils/timeCalculator";
import { basePointArbitrary } from "../generators";
import type { BasePoint, Settings } from "../../types";

const require = createRequire(import.meta.url);
let fc: any;

try {
  fc = require("fast-check");
} catch (e) {
  // fast-check not installed
}

if (!fc) {
  describe("Time Calculator Fuzz Tests (skipped)", () => {
    it("skipped because fast-check is not installed", () => {
      expect(true).toBe(true);
    });
  });
} else {
  describe("Time Calculator Fuzz Tests", () => {

    // Generator for Settings
    const settingsArbitrary = fc.record({
        xVelocity: fc.float({ min: 1, max: 200, noNaN: true }),
        yVelocity: fc.float({ min: 1, max: 200, noNaN: true }),
        aVelocity: fc.float({ min: 1, max: 360, noNaN: true }),
        kFriction: fc.float({ min: 0, max: 1, noNaN: true }),
        rLength: fc.float({ min: 1, max: 20, noNaN: true }),
        rWidth: fc.float({ min: 1, max: 20, noNaN: true }),
        safetyMargin: fc.float({ min: 0, max: 10, noNaN: true }),
        maxVelocity: fc.float({ min: 1, max: 200, noNaN: true }),
        maxAcceleration: fc.float({ min: 1, max: 200, noNaN: true }),
        maxDeceleration: fc.float({ min: 1, max: 200, noNaN: true }),
        maxAngularAcceleration: fc.float({ min: 1, max: 360, noNaN: true }),
        fieldMap: fc.string(),
        theme: fc.constant("dark"),
    }, { withDeletedKeys: true });

    describe("analyzePathSegment", () => {
      it("should return valid analysis for any valid path segment", () => {
        fc.assert(
          fc.property(
            basePointArbitrary,
            fc.array(basePointArbitrary, { maxLength: 3 }),
            basePointArbitrary,
            fc.integer({ min: 1, max: 200 }),
            fc.float({ noNaN: true, noDefaultInfinity: true }),
            (start: BasePoint, controlPoints: BasePoint[], end: BasePoint, samples: number, initialHeading: number) => {

              const analysis = analyzePathSegment(start, controlPoints, end, samples, initialHeading);

              expect(analysis).toBeDefined();
              expect(analysis.length).toBeGreaterThanOrEqual(0);
              expect(analysis.minRadius).toBeGreaterThanOrEqual(0);
              expect(analysis.steps).toBeDefined();
              expect(analysis.steps.length).toBe(samples); // Steps are generated for i > 0 up to samples

              // Verify monotonicity of length accumulation if we were to check steps
              let totalStepLength = 0;
              for (const step of analysis.steps) {
                  expect(step.deltaLength).toBeGreaterThanOrEqual(0);
                  totalStepLength += step.deltaLength;
              }
              expect(Math.abs(totalStepLength - analysis.length)).toBeLessThan(1e-4);
            }
          )
        );
      });
    });

    describe("calculateRotationTime", () => {
        it("should return non-negative time", () => {
            fc.assert(
                fc.property(
                    fc.float({ min: 0, max: 720, noNaN: true }),
                    settingsArbitrary,
                    (angleDiff: number, settings: Settings) => {
                        const time = calculateRotationTime(angleDiff, settings);
                        expect(time).toBeGreaterThanOrEqual(0);
                        expect(Number.isFinite(time)).toBe(true);
                    }
                )
            );
        });

        it("should be monotonic with respect to angle difference (ignoring floating point noise)", () => {
            fc.assert(
                fc.property(
                    fc.float({ min: 0, max: 360, noNaN: true }),
                    fc.float({ min: 0, max: 360, noNaN: true }),
                    settingsArbitrary,
                    (angle1: number, angle2: number, settings: Settings) => {
                        const t1 = calculateRotationTime(angle1, settings);
                        const t2 = calculateRotationTime(angle2, settings);
                        if (angle1 < angle2) {
                            expect(t1).toBeLessThanOrEqual(t2);
                        } else if (angle1 > angle2) {
                            expect(t1).toBeGreaterThanOrEqual(t2);
                        }
                    }
                )
            );
        });
    });
  });
}
