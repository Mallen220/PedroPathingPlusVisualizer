// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzePath } from "../utils/pathAnalyzer";
import type {
  Line,
  Point,
  SequenceItem,
  Settings,
  Shape,
  CollisionMarker,
  TimePrediction,
} from "../types";

const mocks = vi.hoisted(() => ({
  getCollisions: vi.fn(() => [] as CollisionMarker[]),
  calculatePathTime: vi.fn(() => ({} as TimePrediction)),
}));

vi.mock("../utils/pathOptimizer", () => {
  return {
    PathOptimizer: class {
      constructor() {}
      getCollisions() {
        return mocks.getCollisions();
      }
    },
  };
});

vi.mock("../utils/timeCalculator", () => ({
  calculatePathTime: mocks.calculatePathTime,
}));

describe("Path Analyzer", () => {
  const dummySettings: Settings = {
    maxVelocity: 50,
    maxAcceleration: 30,
  } as Settings;
  const dummySequence = [] as SequenceItem[];
  const dummyShapes = [] as Shape[];
  const startPoint: Point = {
    x: 0,
    y: 0,
    heading: "tangential",
    reverse: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCollisions.mockReturnValue([]);
    mocks.calculatePathTime.mockReturnValue({
      totalTime: 5,
      timeline: [],
    } as any);
  });

  it("should return perfect score for good path", () => {
    const lines: Line[] = [
      {
        id: "1",
        endPoint: { x: 10, y: 10, heading: "tangential", reverse: false },
        controlPoints: [],
        color: "",
      },
    ];

    const report = analyzePath(
      startPoint,
      lines,
      dummySettings,
      dummySequence,
      dummyShapes,
    );
    expect(report.score).toBe(100);
    expect(report.issues).toHaveLength(0);
  });

  it("should detect collision", () => {
    const lines: Line[] = [
      {
        id: "1",
        endPoint: { x: 10, y: 10, heading: "tangential", reverse: false },
        controlPoints: [],
        color: "",
      },
    ];
    mocks.getCollisions.mockReturnValue([
      { x: 5, y: 5, time: 1, segmentIndex: 0, type: "obstacle" },
    ]);

    const report = analyzePath(
      startPoint,
      lines,
      dummySettings,
      dummySequence,
      dummyShapes,
    );
    expect(report.score).toBeLessThan(100);
    expect(
      report.issues.some(
        (i) => i.type === "error" && i.title === "Obstacle Collision",
      ),
    ).toBe(true);
  });

  it("should detect velocity limit", () => {
    const lines: Line[] = [
      {
        id: "1",
        endPoint: { x: 10, y: 10, heading: "tangential", reverse: false },
        controlPoints: [],
        color: "",
      },
    ];
    mocks.calculatePathTime.mockReturnValue({
      totalTime: 1,
      timeline: [
        {
          type: "travel",
          lineIndex: 0,
          velocityProfile: [0, 40, 60, 40, 0], // Max 60 > 50
          motionProfile: [0, 0.1, 0.2, 0.3, 0.4],
        },
      ],
    } as any);

    const report = analyzePath(
      startPoint,
      lines,
      dummySettings,
      dummySequence,
      dummyShapes,
    );
    expect(report.score).toBeLessThan(100);
    expect(
      report.issues.some(
        (i) => i.type === "warning" && i.title === "Velocity Limit Exceeded",
      ),
    ).toBe(true);
  });
});
