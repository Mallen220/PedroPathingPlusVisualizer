import { describe, it, expect } from "vitest";
import { reversePath } from "./pathTools";
import type { Line, Point, SequenceItem } from "../types";

describe("reversePath", () => {
  it("should reverse a simple path", () => {
    const startPoint: Point = {
      x: 0,
      y: 0,
      heading: "tangential",
      reverse: false,
    };
    const lines: Line[] = [
      {
        id: "line-1",
        endPoint: { x: 10, y: 10, heading: "tangential", reverse: false },
        controlPoints: [],
        color: "#fff",
        locked: false,
        waitBeforeMs: 0,
        waitAfterMs: 0,
        waitBeforeName: "",
        waitAfterName: "",
      },
    ];
    const sequence: SequenceItem[] = [{ kind: "path", lineId: "line-1" }];

    const result = reversePath(startPoint, lines, sequence);

    // New start point should be old end point
    expect(result.startPoint.x).toBe(10);
    expect(result.startPoint.y).toBe(10);

    // New line should end at old start point
    expect(result.lines.length).toBe(1);
    expect(result.lines[0].endPoint.x).toBe(0);
    expect(result.lines[0].endPoint.y).toBe(0);
    expect(result.sequence.length).toBe(1);
  });

  it("should reverse a path with control points", () => {
    const startPoint: Point = {
      x: 0,
      y: 0,
      heading: "tangential",
      reverse: false,
    };
    const lines: Line[] = [
      {
        id: "line-1",
        endPoint: { x: 10, y: 10, heading: "tangential", reverse: false },
        controlPoints: [{ x: 5, y: 0 }],
        color: "#fff",
        locked: false,
        waitBeforeMs: 0,
        waitAfterMs: 0,
        waitBeforeName: "",
        waitAfterName: "",
      },
    ];
    const sequence: SequenceItem[] = [{ kind: "path", lineId: "line-1" }];

    const result = reversePath(startPoint, lines, sequence);

    // Control points should be reversed (though array of 1 is same reversed)
    // Let's try 2 control points
    const lines2: Line[] = [
      {
        id: "line-2",
        endPoint: { x: 20, y: 20, heading: "tangential", reverse: false },
        controlPoints: [
          { x: 5, y: 0 },
          { x: 15, y: 20 },
        ],
        color: "#fff",
        locked: false,
        waitBeforeMs: 0,
        waitAfterMs: 0,
        waitBeforeName: "",
        waitAfterName: "",
      },
    ];
    const result2 = reversePath(startPoint, lines2, [
      { kind: "path", lineId: "line-2" },
    ]);
    expect(result2.lines[0].controlPoints[0].x).toBe(15);
    expect(result2.lines[0].controlPoints[1].x).toBe(5);
  });

  it("should reverse a multi-segment path", () => {
    const startPoint: Point = {
      x: 0,
      y: 0,
      heading: "tangential",
      reverse: false,
    };
    const lines: Line[] = [
      {
        id: "line-1",
        endPoint: { x: 10, y: 0, heading: "tangential", reverse: false },
        controlPoints: [],
        color: "#fff",
        locked: false,
        waitBeforeMs: 0,
        waitAfterMs: 0,
        waitBeforeName: "",
        waitAfterName: "",
      },
      {
        id: "line-2",
        endPoint: { x: 10, y: 10, heading: "tangential", reverse: false },
        controlPoints: [],
        color: "#fff",
        locked: false,
        waitBeforeMs: 0,
        waitAfterMs: 0,
        waitBeforeName: "",
        waitAfterName: "",
      },
    ];
    const sequence: SequenceItem[] = [
      { kind: "path", lineId: "line-1" },
      { kind: "path", lineId: "line-2" },
    ];

    const result = reversePath(startPoint, lines, sequence);

    // New Start should be (10, 10)
    expect(result.startPoint.x).toBe(10);
    expect(result.startPoint.y).toBe(10);

    // Sequence reversed: Line-2 then Line-1
    expect(result.sequence[0].lineId).toBe("line-2");
    expect(result.sequence[1].lineId).toBe("line-1");

    // Line-2 (now first) should go from (10,10) to (10,0)
    const newLine2 = result.lines.find((l) => l.id === "line-2");
    expect(newLine2?.endPoint.x).toBe(10);
    expect(newLine2?.endPoint.y).toBe(0);

    // Line-1 (now second) should go from (10,0) to (0,0)
    const newLine1 = result.lines.find((l) => l.id === "line-1");
    expect(newLine1?.endPoint.x).toBe(0);
    expect(newLine1?.endPoint.y).toBe(0);
  });

  it("should handle wait items", () => {
    const startPoint: Point = {
      x: 0,
      y: 0,
      heading: "tangential",
      reverse: false,
    };
    const lines: Line[] = [
      {
        id: "line-1",
        endPoint: { x: 10, y: 10, heading: "tangential", reverse: false },
        controlPoints: [],
        color: "#fff",
        locked: false,
        waitBeforeMs: 0,
        waitAfterMs: 0,
        waitBeforeName: "",
        waitAfterName: "",
      },
    ];
    const sequence: SequenceItem[] = [
      { kind: "path", lineId: "line-1" },
      { kind: "wait", id: "wait-1", durationMs: 1000, name: "Wait" },
    ];

    const result = reversePath(startPoint, lines, sequence);

    // Sequence reversed: Wait then Line-1
    expect(result.sequence[0].kind).toBe("wait");
    expect(result.sequence[1].kind).toBe("path");
  });
});
