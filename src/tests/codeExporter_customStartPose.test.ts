import { describe, it, expect, vi } from "vitest";
import { generateJavaCode, calculateStartPose } from "../utils/codeExporter";
import type { Point, Line } from "../types";

// Mock prettier
vi.mock("prettier", () => ({
  default: {
    format: vi.fn().mockImplementation((code) => Promise.resolve(code)),
  },
}));

vi.mock("prettier-plugin-java", () => ({
  default: {},
}));

describe("codeExporter - Custom Start Pose", () => {
  const startPoint: Point = {
    x: 10,
    y: 10,
    heading: "constant",
    degrees: 45,
  };

  const lines: Line[] = [
    {
      id: "line1",
      name: "line1",
      controlPoints: [],
      endPoint: {
        x: 20,
        y: 20,
        heading: "constant",
        degrees: 90,
      },
      color: "#000000",
    },
  ];

  it("should use calculated start pose by default if no custom pose is provided", async () => {
    const code = await generateJavaCode(startPoint, lines, true);
    // calculateStartPose uses getLineStartHeading(line0, startPoint)
    // line1 endPoint is constant 90.
    // So getLineStartHeading returns 90.

    const pose = calculateStartPose(startPoint, lines);
    expect(pose.x).toBe(10);
    expect(pose.y).toBe(10);
    expect(pose.heading).toBe(90);

    expect(code).toContain("new Pose(10.000, 10.000, Math.toRadians(90.000))");
  });

  it("should use custom start pose when provided", async () => {
    const customPose = { x: 50, y: 50, heading: 180 };
    const code = await generateJavaCode(startPoint, lines, true, undefined, undefined, undefined, {
      customStartPose: customPose
    });

    expect(code).toContain("new Pose(50.000, 50.000, Math.toRadians(180.000))");
  });

  it("should use custom class name and opmode settings", async () => {
    const code = await generateJavaCode(startPoint, lines, true, undefined, undefined, undefined, {
      className: "MyCustomAuto",
      opModeName: "My Custom Auto",
      groupName: "My Group"
    });

    expect(code).toContain("public class MyCustomAuto extends OpMode");
    expect(code).toContain('@Autonomous(name = "My Custom Auto", group = "My Group")');
  });
});
