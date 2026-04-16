import { describe, it, expect } from "vitest";
import { SequencePreprocessor } from "../../../utils/engine/SequencePreprocessor";
import type { SequenceItem, TurtleData } from "../../../types";

describe("SequencePreprocessor", () => {
  it("flattens basic sequence", () => {
    const seq: SequenceItem[] = [
      { type: "travel", id: "1" } as any,
      { type: "wait", id: "2" } as any
    ];
    const preprocessor = new SequencePreprocessor();
    const result = preprocessor.process(seq);
    expect(result.length).toBe(2);
    expect((result[0] as any).type).toBe("travel");
    expect((result[1] as any).type).toBe("wait");
  });

  it("recursively expands macros and avoids infinite loops", () => {
    const macros = new Map<string, TurtleData>();
    macros.set("m1.turt", {
      startPoint: { x: 0, y: 0 } as any,
      lines: [],
      shapes: [],
      sequence: [
        { type: "wait", id: "w1" } as any,
        { type: "macro", filePath: "m1.turt", id: "loop" } as any
      ]
    });
    const seq: SequenceItem[] = [{ type: "macro", filePath: "m1.turt", id: "m" } as any];
    const preprocessor = new SequencePreprocessor(macros);
    const result = preprocessor.process(seq);
    expect(result.length).toBe(1);
    expect((result[0] as any).type).toBe("wait");
  });

  it("resolves global and local reverse XOR flags", () => {
    const seq: SequenceItem[] = [
      { type: "travel", reverse: true, id: "1" } as any,
      { type: "travel", reverse: false, id: "2" } as any
    ];
    const preprocessor = new SequencePreprocessor();
    const result = preprocessor.process(seq, true);
    expect((result[0] as any).reverse).toBe(false);
    expect((result[1] as any).reverse).toBe(true);
  });
});