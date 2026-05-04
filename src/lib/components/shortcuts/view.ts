// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import { get } from "svelte/store";
import { startPointStore, linesStore, settingsStore } from "../../projectStore";
import {
  gridSize,
  fieldZoom,
  fieldPan,
  selectedPointId,
  selectedLineId,
} from "../../../stores";
import { computeZoomStep } from "../../zoomHelpers";
import { getDefaultStartPoint, FIELD_SIZE } from "../../../config";
import { isUIElementFocused } from "./utils";

export function cycleGridSize() {
  const options = [0.5, 1, 3, 6, 12, 24];
  const current = (get(gridSize) as number) || options[0];
  const idx = options.indexOf(current);
  const next = options[(idx + 1) % options.length];
  gridSize.set(next);
}

export function cycleGridSizeReverse() {
  const options = [0.5, 1, 3, 6, 12, 24];
  const current = (get(gridSize) as number) || options[0];
  const idx = options.indexOf(current);
  const prev = options[(idx - 1 + options.length) % options.length];
  gridSize.set(prev);
}

export function modifyZoom(delta: number) {
  if (isUIElementFocused() || get(settingsStore).lockFieldView) return;
  fieldZoom.update((z) => {
    // Use adaptive step: when zooming in past 1x, speed up
    const step = computeZoomStep(z, Math.sign(delta));
    const change = Math.sign(delta) * step;
    return Math.max(0.1, Math.min(5, Number((z + change).toFixed(2))));
  });
}

export function resetZoom() {
  if (isUIElementFocused() || get(settingsStore).lockFieldView) return;
  fieldZoom.set(1);
  fieldPan.set({ x: 0, y: 0 });
}

export function snapSelection(recordChange: (action?: string) => void) {
  const sel = get(selectedPointId);
  const gridStep = (get(gridSize) as number) || 1;
  const startPoint = get(startPointStore);
  const lines = get(linesStore);

  if (!sel?.startsWith("point-")) return;

  const snap = (v: number) => Math.round(v / gridStep) * gridStep;

  const parts = sel.split("-");
  const lineNum = Number(parts[1]);
  const ptIdx = Number(parts[2]);

  if (lineNum === 0 && ptIdx === 0) {
    if (startPoint.locked) return;
    startPointStore.update((p) => ({
      ...p,
      x: snap(p.x),
      y: snap(p.y),
    }));
    recordChange("Snap Selection");
    return;
  }

  const lineIdx = lineNum - 1;
  const line = lines[lineIdx];
  if (!line || line.locked) return;

  if (ptIdx === 0) {
    linesStore.update((l) => {
      const newLines = [...l];
      newLines[lineIdx].endPoint.x = snap(newLines[lineIdx].endPoint.x);
      newLines[lineIdx].endPoint.y = snap(newLines[lineIdx].endPoint.y);
      return newLines;
    });
    recordChange("Snap Selection");
  } else {
    const cpIdx = ptIdx - 1;
    if (line.controlPoints[cpIdx]) {
      linesStore.update((l) => {
        const newLines = [...l];
        newLines[lineIdx].controlPoints[cpIdx].x = snap(
          newLines[lineIdx].controlPoints[cpIdx].x,
        );
        newLines[lineIdx].controlPoints[cpIdx].y = snap(
          newLines[lineIdx].controlPoints[cpIdx].y,
        );
        return newLines;
      });
      recordChange("Snap Selection");
    }
  }
}

export function resetStartPoint(recordChange: (action?: string) => void) {
  const startPoint = get(startPointStore);
  if (startPoint.locked) return;
  const def = getDefaultStartPoint();
  startPointStore.set(def);
  recordChange("Reset Start Point");
}

export function panToStart(fieldRenderer: any) {
  const startPoint = get(startPointStore);
  if (fieldRenderer?.panToField) {
    fieldRenderer.panToField(startPoint.x, startPoint.y);
  } else {
    // Fallback
    resetZoom();
  }
}

export function panToEnd(fieldRenderer: any) {
  const lines = get(linesStore);
  if (lines.length > 0) {
    const lastLineIdx = lines.length - 1;
    const endPoint = lines[lastLineIdx].endPoint;
    if (fieldRenderer?.panToField) {
      fieldRenderer.panToField(endPoint.x, endPoint.y);
    } else {
      // Fallback
      selectedPointId.set(`point-${lastLineIdx + 1}-0`);
      selectedLineId.set(lines[lastLineIdx].id!);
    }
  }
}

export function panView(dx: number, dy: number) {
  if (isUIElementFocused() || get(settingsStore).lockFieldView) return;
  fieldPan.update((p) => ({ x: p.x + dx, y: p.y + dy }));
}


export function zoomToFit(fieldRenderer: any) {
  if (isUIElementFocused() || get(settingsStore).lockFieldView) return;
  const startPoint = get(startPointStore);
  const lines = get(linesStore);

  let minX = startPoint.x;
  let maxX = startPoint.x;
  let minY = startPoint.y;
  let maxY = startPoint.y;

  lines.forEach((line) => {
    minX = Math.min(minX, line.endPoint.x);
    maxX = Math.max(maxX, line.endPoint.x);
    minY = Math.min(minY, line.endPoint.y);
    maxY = Math.max(maxY, line.endPoint.y);
  });

  const padding = FIELD_SIZE * 0.1;
  minX -= padding;
  maxX += padding;
  minY -= padding;
  maxY += padding;

  const width = maxX - minX;
  const height = maxY - minY;

  if (width <= 0 || height <= 0) {
    resetZoom();
    return;
  }

  const scaleX = FIELD_SIZE / width;
  const scaleY = FIELD_SIZE / height;
  let newZoom = Math.min(scaleX, scaleY);
  newZoom = Math.max(0.1, Math.min(5, newZoom));

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  if (fieldRenderer && fieldRenderer.panToField) {
    fieldZoom.set(Number(newZoom.toFixed(2)));
    fieldRenderer.panToField(centerX, centerY);
  } else {
    resetZoom();
  }
}