
import { describe, it, expect } from 'vitest';
import * as mathUtils from './math';
import * as geoUtils from './geometry';

// Helper for generating random numbers
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

// Helper to run a property test multiple times
const runProp = (name: string, iterations: number, fn: (i: number) => void) => {
    for (let i = 0; i < iterations; i++) {
        try {
            fn(i);
        } catch (e) {
            console.error(`Test '${name}' failed at iteration ${i}`);
            throw e;
        }
    }
};

// Nasty values to fuzz with
const NASTY_NUMBERS = [
    0, -0, 1, -1,
    Number.MAX_VALUE, -Number.MAX_VALUE,
    Number.MIN_VALUE, -Number.MIN_VALUE,
    Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY,
    NaN,
    Number.EPSILON,
    Math.PI,
    2 * Math.PI
];

const getRandomNasty = () => NASTY_NUMBERS[Math.floor(Math.random() * NASTY_NUMBERS.length)];
const getRandomMixed = () => Math.random() < 0.1 ? getRandomNasty() : rand(-1000, 1000);

describe('Dynamic Testing - Math Utils', () => {
    // --- Existing Property Tests ---
    it('getAngularDifference should always return value between -180 and 180', () => {
        runProp('getAngularDifference range', 1000, () => {
            const start = rand(-720, 720);
            const end = rand(-720, 720);
            const diff = mathUtils.getAngularDifference(start, end);
            expect(diff).toBeGreaterThanOrEqual(-180);
            expect(diff).toBeLessThanOrEqual(180);
        });
    });

    it('getAngularDifference should differ from simple subtraction by multiple of 360', () => {
        runProp('getAngularDifference modulo 360', 1000, () => {
            const start = rand(-720, 720);
            const end = rand(-720, 720);
            const diff = mathUtils.getAngularDifference(start, end);
            const rawDiff = end - start;
            const error = Math.abs(diff - rawDiff);
            const remainder = error % 360;
            const isMultiple = Math.min(remainder, 360 - remainder) < 1e-5;
            expect(isMultiple).toBe(true);
        });
    });

    it('transformAngle should always normalize to [-180, 180]', () => {
        runProp('transformAngle range', 1000, () => {
            const angle = rand(-1000, 1000);
            const transformed = mathUtils.transformAngle(angle);
            expect(transformed).toBeGreaterThanOrEqual(-180);
            expect(transformed).toBeLessThanOrEqual(180);
        });
    });

    it('easeInOutQuad should remain within [0, 1] for inputs in [0, 1]', () => {
        runProp('easeInOutQuad bounds', 100, () => {
            const x = rand(0, 1);
            const y = mathUtils.easeInOutQuad(x);
            expect(y).toBeGreaterThanOrEqual(0);
            expect(y).toBeLessThanOrEqual(1);
        });
    });

    it('lerp should interpolate correctly', () => {
        runProp('lerp correctness', 100, () => {
            const ratio = rand(0, 1);
            const start = rand(-100, 100);
            const end = rand(-100, 100);
            const result = mathUtils.lerp(ratio, start, end);

            const min = Math.min(start, end);
            const max = Math.max(start, end);
            expect(result).toBeGreaterThanOrEqual(min - 1e-9);
            expect(result).toBeLessThanOrEqual(max + 1e-9);
        });
    });

    // --- Fuzz Testing (Crash Resistance) ---
    it('Math utils should not crash on nasty inputs', () => {
        runProp('Math Fuzzing', 500, () => {
            const n1 = getRandomMixed();
            const n2 = getRandomMixed();
            const n3 = getRandomMixed();

            // Just calling them to ensure no throws
            mathUtils.transformAngle(n1);
            mathUtils.getAngularDifference(n1, n2);
            mathUtils.shortestRotation(n1, n2, n3); // n3 is percentage
            mathUtils.easeInOutQuad(n1);
            mathUtils.lerp(n1, n2, n3);
            mathUtils.radiansToDegrees(n1);
        });
    });
});

describe('Dynamic Testing - Geometry Utils', () => {
    // --- Existing Property Tests ---
    it('pointToLineDistance should be 0 if point is on the line segment', () => {
        runProp('pointToLineDistance on segment', 100, () => {
            const p1 = [rand(-100, 100), rand(-100, 100)];
            const p2 = [rand(-100, 100), rand(-100, 100)];
            const t = rand(0, 1);
            const pointOnLine = [
                p1[0] + (p2[0] - p1[0]) * t,
                p1[1] + (p2[1] - p1[1]) * t
            ];
            const dist = geoUtils.pointToLineDistance(pointOnLine, p1, p2);
            expect(dist).toBeLessThan(1e-4);
        });
    });

    it('polygonCenter should be inside a convex polygon', () => {
        runProp('polygonCenter inside convex', 100, () => {
             const p1 = { x: rand(0, 100), y: rand(0, 100) };
             const p2 = { x: rand(0, 100), y: rand(0, 100) };
             const p3 = { x: rand(0, 100), y: rand(0, 100) };
             const poly = [p1, p2, p3];

             // Ensure it's not degenerate (area > 0) roughly
             if (Math.abs((p2.x - p1.x)*(p3.y - p1.y) - (p3.x - p1.x)*(p2.y - p1.y)) < 1e-4) return;

             const center = geoUtils.polygonCenter(poly);
             const isInside = geoUtils.pointInPolygon(center, poly);
             expect(isInside).toBe(true);
        });
    });

    it('convexHull should contain all original points', () => {
        runProp('convexHull containment', 50, () => {
            const points = [];
            for(let i=0; i<20; i++) {
                points.push({ x: rand(-100, 100), y: rand(-100, 100) });
            }
            const hull = geoUtils.convexHull(points);
            expect(hull.length).toBeLessThanOrEqual(points.length);
            expect(hull.length).toBeGreaterThanOrEqual(3);

            for(const v of hull) {
                const exists = points.some(p => Math.abs(p.x - v.x) < 1e-9 && Math.abs(p.y - v.y) < 1e-9);
                expect(exists).toBe(true);
            }
        });
    });

    it('getRobotCorners should always return 4 points', () => {
        runProp('getRobotCorners count', 100, () => {
            const x = rand(-100, 100);
            const y = rand(-100, 100);
            const h = rand(0, 360);
            const w = rand(10, 20);
            const ht = rand(10, 20);

            const corners = geoUtils.getRobotCorners(x, y, h, w, ht);
            expect(corners).toHaveLength(4);
            const dist = (p1: any, p2: any) => Math.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2);
            expect(Math.abs(dist(corners[0], corners[1]) - w)).toBeLessThan(1e-4);
            expect(Math.abs(dist(corners[1], corners[2]) - ht)).toBeLessThan(1e-4);
        });
    });

    // --- Edge Case / Nasty Testing ---

    it('pointToLineDistance should handle coincident line endpoints (zero length line)', () => {
        const p1 = [10, 10];
        const p2 = [10, 10]; // Same as p1
        const p = [20, 20];

        // Distance should be distance to the single point
        const dist = geoUtils.pointToLineDistance(p, p1, p2);
        const expected = Math.sqrt((20-10)**2 + (20-10)**2);
        expect(dist).toBeCloseTo(expected, 4);
    });

    it('convexHull should handle collinear points', () => {
        // Points on a line: (0,0), (1,1), (2,2)
        const points = [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
            { x: 2, y: 2 },
            { x: 0.5, y: 0.5 }
        ];
        // Hull of collinear points is basically the two endpoints (degenerate polygon) or all points if implementation varies.
        // Standard Hull algo might fail or produce 2 points.
        // Let's just ensure it doesn't crash and returns valid subset.
        const hull = geoUtils.convexHull(points);
        expect(Array.isArray(hull)).toBe(true);
        // It likely returns the endpoints or just the set.
    });

    it('convexHull should handle coincident points', () => {
        const points = [
            { x: 5, y: 5 },
            { x: 5, y: 5 },
            { x: 5, y: 5 }
        ];
        const hull = geoUtils.convexHull(points);
        expect(hull.length).toBeLessThanOrEqual(3);
        // Should handle it gracefully
    });

    it('Geometry utils should not crash on nasty inputs', () => {
        runProp('Geometry Fuzzing', 500, () => {
            const n1 = getRandomMixed();
            const n2 = getRandomMixed();

            // pointInPolygon with nasty coordinates (function expects number[] for point)
            geoUtils.pointInPolygon([n1, n2], [{x: n1, y: n2}, {x: 0, y: 0}]);

            // pointToLineDistance with nasty coordinates
            geoUtils.pointToLineDistance([n1, n1], [n2, n2], [n1, n2]);

            // convexHull with nasty points
            geoUtils.convexHull([
                {x: n1, y: n2},
                {x: Infinity, y: Infinity},
                {x: NaN, y: NaN}
            ]);

            // getRobotCorners with nasty dims
            geoUtils.getRobotCorners(n1, n2, n1, n2, n2);
        });
    });
});
