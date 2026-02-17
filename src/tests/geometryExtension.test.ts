
import { describe, it, expect } from "vitest";
import { getRobotExtensionCorners } from "../utils/geometry";
import type { RobotExtension } from "../types";

describe("getRobotExtensionCorners", () => {
  const extension: RobotExtension = {
    id: "ext1",
    name: "Intake",
    length: 10,
    width: 4,
    xOffset: 8, // 8 inches forward from robot center
    yOffset: 0, // centered horizontally
  };

  it("should calculate corners correctly for 0 degree heading", () => {
    // Robot at 100, 100
    // Extension center relative to robot center (unrotated): (8, 0)
    // Extension size 10x4 -> Half length 5, Half width 2
    // Corners relative to extension center:
    // 0: (-5, -2) -> (-5 + 8, -2 + 0) = (3, -2) relative to robot
    // 1: (5, -2)  -> (5 + 8, -2 + 0)  = (13, -2)
    // 2: (5, 2)   -> (5 + 8, 2 + 0)   = (13, 2)
    // 3: (-5, 2)  -> (-5 + 8, 2 + 0)  = (3, 2)

    // Absolute position (Robot at 100, 100, Heading 0):
    // x' = x + dx, y' = y + dy
    // 0: (103, 98)
    // 1: (113, 98)
    // 2: (113, 102)
    // 3: (103, 102)

    const corners = getRobotExtensionCorners(100, 100, 0, extension);

    expect(corners[0].x).toBeCloseTo(103);
    expect(corners[0].y).toBeCloseTo(98);
    expect(corners[1].x).toBeCloseTo(113);
    expect(corners[1].y).toBeCloseTo(98);
    expect(corners[2].x).toBeCloseTo(113);
    expect(corners[2].y).toBeCloseTo(102);
    expect(corners[3].x).toBeCloseTo(103);
    expect(corners[3].y).toBeCloseTo(102);
  });

  it("should calculate corners correctly for 90 degree heading", () => {
    // Robot at 100, 100, Heading 90 (Down)
    // Cos(90) = 0, Sin(90) = 1
    // x' = 100 + dx*0 - dy*1 = 100 - dy
    // y' = 100 + dx*1 + dy*0 = 100 + dx

    // 0: dx=3, dy=-2 -> x'=102, y'=103
    // 1: dx=13, dy=-2 -> x'=102, y'=113
    // 2: dx=13, dy=2  -> x'=98,  y'=113
    // 3: dx=3, dy=2   -> x'=98,  y'=103

    const corners = getRobotExtensionCorners(100, 100, 90, extension);

    expect(corners[0].x).toBeCloseTo(102);
    expect(corners[0].y).toBeCloseTo(103);
    expect(corners[1].x).toBeCloseTo(102);
    expect(corners[1].y).toBeCloseTo(113);
    expect(corners[2].x).toBeCloseTo(98);
    expect(corners[2].y).toBeCloseTo(113);
    expect(corners[3].x).toBeCloseTo(98);
    expect(corners[3].y).toBeCloseTo(103);
  });
});
