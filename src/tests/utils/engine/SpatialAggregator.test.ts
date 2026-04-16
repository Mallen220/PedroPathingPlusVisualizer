import { describe, it, expect } from "vitest";
import { SpatialAggregator } from "../../../utils/engine/SpatialAggregator";
import type { Line, Point } from "../../../types";
import type { PreprocessedItem } from "../../../utils/engine/SequencePreprocessor";

describe("SpatialAggregator", () => {
  it("groups chained paths into a single cluster", () => {
    const aggregator = new SpatialAggregator();
    const startPoint: Point = { x: 0, y: 0, heading: "tangential" } as any;
    const lines: Line[] = [
      { controlPoints: [], endPoint: { x: 10, y: 0 } as any, eventMarkers: [], color: "" },
      { controlPoints: [], endPoint: { x: 20, y: 0 } as any, eventMarkers: [], color: "" }
    ];
    const items: PreprocessedItem[] = [
      { type: "travel", lineIndices: [0], isChain: false } as any,
      { type: "travel", lineIndices: [1], isChain: true } as any
    ];
    const { clusters } = aggregator.aggregate(items, startPoint, lines);
    expect(clusters.length).toBe(1);
    expect(clusters[0].lines.length).toBe(2);
    expect(clusters[0].totalLength).toBeGreaterThan(15);
  });

  it("prunes zero length segments", () => {
    const aggregator = new SpatialAggregator();
    const startPoint: Point = { x: 0, y: 0, heading: "tangential" } as any;
    const lines: Line[] = [{ controlPoints: [], endPoint: { x: 0, y: 0 } as any, eventMarkers: [], color: "" }];
    const items: PreprocessedItem[] = [{ type: "travel", lineIndices: [0] } as any];
    const { clusters } = aggregator.aggregate(items, startPoint, lines);
    expect(clusters.length).toBe(0);
  });
});