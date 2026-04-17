const fs = require('fs');

function fixSpatialAggregator() {
  const p = 'src/utils/engine/SpatialAggregator.ts';
  let s = fs.readFileSync(p, 'utf8');
  s = `import type { Line, Point, EventMarker } from "../../types";
import { analyzePathSegment } from "../timeCalculator";
import { getCurvePoint } from "../math";
import type { PreprocessedItem } from "./SequencePreprocessor";

export interface PathChainCluster {
  lines: Line[];
  startPoint: Point;
  totalLength: number;
  steps: Array<{
    x: number;
    y: number;
    t: number;
    s: number;
    radius: number;
    tangentRotation: number;
    curvature: number;
    lineIndex: number;
  }>;
  events: Array<{
    t: number;
    marker: EventMarker;
    lineIndex: number;
  }>;
}

export class SpatialAggregator {
  public aggregate(
    items: PreprocessedItem[],
    startPoint: Point,
    lines: Line[]
  ): { clusters: PathChainCluster[], waitRotateItems: PreprocessedItem[] } {
    const clusters: PathChainCluster[] = [];
    const waitRotateItems: PreprocessedItem[] = [];
    let currentCluster: PathChainCluster | null = null;
    for (const item of items) {
      if ((item as any).type === "travel") {
        if (!(item as any).lineIndices || (item as any).lineIndices.length === 0) continue;
        let localStartPoint = startPoint;
        let startHeading = startPoint.startDeg || 0;
        for (const lineIdx of (item as any).lineIndices) {
          const line = lines[lineIdx];
          if (!line) continue;
          if (lineIdx > 0) localStartPoint = lines[lineIdx - 1].endPoint;
          const analysis: any = analyzePathSegment(
            localStartPoint,
            line.controlPoints,
            line.endPoint,
            50,
            startHeading
          );
          if (analysis.length < 0.001) continue;
          const clusterStart = currentCluster ? currentCluster.startPoint : localStartPoint;
          if (!currentCluster || (!(item as any).isChain && !line.isChain)) {
            if (currentCluster) clusters.push(currentCluster);
            currentCluster = { lines: [], startPoint: localStartPoint, totalLength: 0, steps: [], events: [] };
          }
          currentCluster.lines.push(line);

          let accDist = 0;
          for (let i = 0; i < analysis.steps.length; i++) {
            const step = analysis.steps[i];
            const t = (i + 1) / analysis.steps.length;
            const curvePoints = [localStartPoint, ...(line.controlPoints || []), line.endPoint];
            const coords = getCurvePoint(t, curvePoints);
            accDist += step.deltaLength;
            currentCluster.steps.push({
               x: coords.x, y: coords.y, t: t,
               s: currentCluster.totalLength + accDist,
               radius: step.radius, tangentRotation: step.heading * (Math.PI / 180),
               curvature: 1 / step.radius, lineIndex: lineIdx
            });
          }
          currentCluster.totalLength += analysis.length;
          if (line.eventMarkers) {
             for (const marker of line.eventMarkers) {
                currentCluster.events.push({ t: (marker as any).t, marker, lineIndex: lineIdx });
             }
          }
        }
      } else {
        if (currentCluster) { clusters.push(currentCluster); currentCluster = null; }
        waitRotateItems.push(item);
      }
    }
    if (currentCluster) clusters.push(currentCluster);
    return { clusters, waitRotateItems };
  }
}
`;
  fs.writeFileSync(p, s);
}

fixSpatialAggregator();
