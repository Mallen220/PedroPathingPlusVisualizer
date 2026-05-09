// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import Two from "two.js";
import type { Line, Point, SequenceItem } from "../../../types";
import {
  getCurvePoint,
  findClosestT,
  interpolateTFromProfile,
  easeInOutQuad,
} from "../../../utils/math";

import { type RenderContext } from "./GeneratorUtils";

export function generateEventMarkerElements(
  lines: Line[],
  startPoint: Point,
  sequence: SequenceItem[],
  ctx: RenderContext,
) {
  let twoMarkers: InstanceType<typeof Two.Group>[] = [];
  const {
    x,
    y,
    uiLength,
    hoveredMarkerId,
    multiSelectedPointIds,
    timePrediction,
    settings,
    selectedLineId,
    selectedPointId,
    actionRegistry,
  } = ctx;
  const multiSelectedSet = new Set(multiSelectedPointIds);

  // Build a map of lineId -> startPoint from timePrediction if available
  // This handles cases where lines are out of order in the array (e.g. mixed with macros)
  const startPointMap = new Map<string, Point>();
  if (timePrediction?.timeline) {
    timePrediction.timeline.forEach((ev: any) => {
      if (ev.type === "travel" && ev.line && ev.prevPoint) {
        startPointMap.set(ev.line.id, ev.prevPoint);
      }
    });
  }

  lines.forEach((line, idx) => {
    if (!line?.endPoint || line.hidden) return;

    let _startPoint = startPointMap.get(line.id!);
    if (!_startPoint) {
      // Fallback for lines not in timeline or if timeline missing
      _startPoint = idx === 0 ? startPoint : lines[idx - 1]?.endPoint || null;
    }

    if (!_startPoint) return;
    if (!line.eventMarkers || line.eventMarkers.length === 0) return;

    line.eventMarkers.forEach((ev, evIdx) => {
      const isHovered =
        hoveredMarkerId === ev.id ||
        multiSelectedSet.has(`event-${idx}-${evIdx}`);
      const radius = isHovered ? 1.8 : 0.9;
      const color = isHovered ? "#a78bfa" : "#c4b5fd";

      let t = 0;
      if (ev.type === "temporal") {
        const markerTime = ev.endTime ?? ev.time ?? 500;
        const lineDuration = 2000;
        t = Math.max(0, Math.min(1, markerTime / lineDuration));

        // Use timePrediction if available for absolute positioning
        if (timePrediction?.timeline) {
          const matchingEvent = timePrediction.timeline.find(
            (e: any) => e.type === "travel" && e.line?.id === line.id,
          );
          if (matchingEvent?.duration) {
            // Calculate relative time within the segment
            const relTime = Math.max(
              0,
              markerTime / 1000 - matchingEvent.startTime,
            );

            if (
              matchingEvent.motionProfile &&
              matchingEvent.motionProfile.length > 0
            ) {
              t = interpolateTFromProfile(relTime, matchingEvent.motionProfile);
            } else {
              // Fallback to quadratic easing to match robot playback
              const timeProgress = Math.max(
                0,
                Math.min(1, relTime / matchingEvent.duration),
              );
              t = easeInOutQuad(timeProgress);
            }
          }
        }
      } else if (ev.type === "pose") {
        if (ev.poseGuess === undefined) {
          // Auto-calculate best guess
          const cps = [_startPoint, ...line.controlPoints, line.endPoint];
          t = findClosestT({ x: ev.poseX ?? 0, y: ev.poseY ?? 0 }, cps);
        } else {
          t = Math.max(0, Math.min(1, ev.poseGuess));
        }
      } else {
        t = Math.max(0, Math.min(1, ev.position ?? 0.5));
      }

      let pos = { x: 0, y: 0 };

      if (ev.type === "pose") {
        // Just render at the pose coordinates
        pos.x = ev.poseX ?? 0;
        pos.y = ev.poseY ?? 0;
      } else if (line.controlPoints.length > 0) {
        const cps = [_startPoint, ...line.controlPoints, line.endPoint];
        const pt = getCurvePoint(t, cps);
        pos.x = pt.x;
        pos.y = pt.y;
      } else {
        pos.x = _startPoint.x + (line.endPoint.x - _startPoint.x) * t;
        pos.y = _startPoint.y + (line.endPoint.y - _startPoint.y) * t;
      }

      const px = x(pos.x);
      const py = y(pos.y);
      let grp = new Two.Group();
      grp.id = `event-${idx}-${evIdx}`;
      grp.translation.set(px, py);

      let circle = new Two.Circle(0, 0, uiLength(radius));
      circle.id = `event-circle-${idx}-${evIdx}`;
      circle.fill = color;
      circle.noStroke();
      grp.add(circle);
      twoMarkers.push(grp);
    });
  });

  if (timePrediction?.timeline && sequence && sequence.length > 0) {
    // Use Registry for registered actions (e.g. Wait)
    sequence.forEach((item) => {
      if ((item as any).hidden) return;
      const action = actionRegistry.get(item.kind);
      if (action?.renderField) {
        const elems = action.renderField(item, {
          x,
          y,
          uiLength,
          settings,
          hoveredId: hoveredMarkerId,
          selectedId: selectedLineId,
          selectedPointId: selectedPointId,
          timePrediction,
        });
        if (elems) {
          elems.forEach((el: any) => twoMarkers.push(el));
        }
      }
    });
  }
  // Post-process to fan out overlapping markers
  const clusters: InstanceType<typeof Two.Group>[][] = [];
  const overlapThreshold = uiLength(3.6); // About 2 * max radius

  twoMarkers.forEach((marker) => {
    let placed = false;
    for (const cluster of clusters) {
      const root = cluster[0];
      const dx = marker.translation.x - root.translation.x;
      const dy = marker.translation.y - root.translation.y;
      if (Math.sqrt(dx * dx + dy * dy) < overlapThreshold) {
        cluster.push(marker);
        placed = true;
        break;
      }
    }
    if (!placed) {
      clusters.push([marker]);
    }
  });

  clusters.forEach((cluster) => {
    if (cluster.length > 1) {
      // Fan out in a circle
      // Average center (though they should all be roughly the same)
      let cx = 0,
        cy = 0;
      cluster.forEach((m) => {
        cx += m.translation.x;
        cy += m.translation.y;
      });
      cx /= cluster.length;
      cy /= cluster.length;

      const fanRadius = uiLength(2) + cluster.length * uiLength(0.5);
      const angleStep = (Math.PI * 2) / cluster.length;

      cluster.forEach((marker, i) => {
        const angle = i * angleStep;
        const newX = cx + Math.cos(angle) * fanRadius;
        const newY = cy + Math.sin(angle) * fanRadius;

        marker.translation.set(newX, newY);

        // Add a leader line
        const dx = cx - newX;
        const dy = cy - newY;
        const leader = new Two.Line(0, 0, dx, dy);
        leader.stroke = "#a3a3a3"; // neutral-400
        leader.linewidth = uiLength(0.2);
        // Put line behind other children
        marker.children.unshift(leader);
      });
    }
  });

  return twoMarkers;
}
