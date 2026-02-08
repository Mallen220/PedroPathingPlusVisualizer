// src/tests/pathAuditor.test.ts
import { describe, it, expect } from "vitest";
import { auditPath } from "../utils/pathAuditor";
import type { Line, Point, Settings, Shape } from "../types";
import { DEFAULT_SETTINGS } from "../config/defaults";

describe("auditPath", () => {
  const startPoint: Point = {
    x: 10,
    y: 10,
    heading: "constant",
    degrees: 0,
    startDeg: 0,
    endDeg: 0,
    reverse: false
  };

  // Set limits higher than the default 30 to ensure we don't flag the default profile
  const settings: Settings = {
      ...DEFAULT_SETTINGS,
      maxVelocity: 50,
      maxAcceleration: 40, // 40 > 30 (default seems to be persistent)
      rWidth: 12,
      rLength: 12,
      safetyMargin: 0,
      validateFieldBoundaries: true
  };

  it("should return empty issues for a safe path", () => {
    const lines: Line[] = [
      {
        id: "line1",
        endPoint: {
          x: 50,
          y: 10,
          heading: "constant",
          degrees: 0,
          startDeg: 0,
          endDeg: 0,
          reverse: false
        },
        controlPoints: [],
        color: "#000000",
        locked: false,
        visible: true,
        type: "line"
      }
    ];

    const issues = auditPath(startPoint, lines, settings, [], []);
    // Filter out info/optimization messages if any
    const errors = issues.filter(i => i.severity === 'error' || i.severity === 'warning');

    if (errors.length > 0) {
        console.log("Safe path errors:", JSON.stringify(errors, null, 2));
    }
    expect(errors).toHaveLength(0);
  });

  it("should detect collision with obstacle", () => {
    const lines: Line[] = [
      {
        id: "line1",
        endPoint: {
          x: 100,
          y: 10,
          heading: "constant",
          degrees: 0,
          startDeg: 0,
          endDeg: 0,
          reverse: false
        },
        controlPoints: [],
        color: "#000000",
        locked: false,
        visible: true,
        type: "line"
      }
    ];

    const obstacle: Shape = {
      id: "obs1",
      type: "obstacle",
      vertices: [{x: 40, y: 0}, {x: 60, y: 0}, {x: 60, y: 20}, {x: 40, y: 20}],
      color: "red",
      fillColor: "red",
      locked: false,
      visible: true,
      name: "Wall"
    };

    const issues = auditPath(startPoint, lines, settings, [], [obstacle]);

    // Expect at least one collision error
    const collision = issues.find(i => i.title === "Collision Detected");
    expect(collision).toBeDefined();
    expect(collision?.severity).toBe("error");
  });

  it("should detect boundary violation", () => {
    const lines: Line[] = [
      {
        id: "line1",
        endPoint: {
          x: 160, // Out of bounds
          y: 10,
          heading: "constant",
          degrees: 0,
          startDeg: 0,
          endDeg: 0,
          reverse: false
        },
        controlPoints: [],
        color: "#000000",
        locked: false,
        visible: true,
        type: "line"
      }
    ];

    const issues = auditPath(startPoint, lines, settings, [], []);

    const boundary = issues.find(i => i.title === "Field Boundary Violation");
    expect(boundary).toBeDefined();
    expect(boundary?.severity).toBe("error");
  });
});
