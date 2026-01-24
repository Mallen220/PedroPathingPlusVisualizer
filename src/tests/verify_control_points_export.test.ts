
import { describe, it, expect } from "vitest";
import { generateSequentialCommandCode } from "../utils/codeExporter";
import type { Line, Point, SequenceItem } from "../types";

describe("generateSequentialCommandCode Control Points", () => {
  it("should hardcode control points and not use pp.get for them", async () => {
    const startPoint: Point = { x: 0, y: 0, heading: "constant", degrees: 0 };
    const lines: Line[] = [
      {
        id: "line1",
        startPoint: { x: 0, y: 0, heading: "constant", degrees: 0 },
        endPoint: { x: 24, y: 24, heading: "constant", degrees: 0 },
        controlPoints: [
          { x: 10, y: 0 },
          { x: 24, y: 10 }
        ],
        name: "TestLine"
      }
    ];

    const code = await generateSequentialCommandCode(startPoint, lines, "TestPath.pp");

    // Check that we DO NOT have declarations/initializations for control points
    // The previous buggy code would generate variables like "TestLine_line0_control1" or similar
    // and call pp.get("TestLine_control1")
    expect(code).not.toContain('pp.get("TestLine_control1")');
    expect(code).not.toContain('pp.get("TestLine_control2")');

    // Check that we DO have hardcoded Poses in the path builder
    // Expected: new BezierCurve(startPoint, new Pose(10.000, 0.000), new Pose(24.000, 10.000), TestLine)
    // Note: The exporter uses .toFixed(3)
    expect(code).toContain("new Pose(10.000, 0.000)");
    expect(code).toContain("new Pose(24.000, 10.000)");
  });
});
