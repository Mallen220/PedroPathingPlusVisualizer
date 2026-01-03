<!-- Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0. -->
<script lang="ts">
  import type {
    Point,
    Line,
    BasePoint,
    Settings,
    Shape,
    SequenceItem,
  } from "../types";
  import _ from "lodash";
  import {
    calculateDragPosition,
    reorderSequence,
    getClosestTarget,
    type DragPosition,
  } from "../utils/dragDrop";
  import { getRandomColor } from "../utils";
  import ObstaclesSection from "./components/ObstaclesSection.svelte";
  import RobotPositionDisplay from "./components/RobotPositionDisplay.svelte";
  import StartingPointSection from "./components/StartingPointSection.svelte";
  import PathLineSection from "./components/PathLineSection.svelte";
  import PlaybackControls from "./components/PlaybackControls.svelte";
  import WaitRow from "./components/WaitRow.svelte";
  import WaitMarkersSection from "./components/WaitMarkersSection.svelte";
  import OptimizationDialog from "./components/OptimizationDialog.svelte";
  import WaypointTable from "./components/WaypointTable.svelte";
  import { calculatePathTime } from "../utils";
  import { validatePath } from "../utils/validation";
  import { selectedLineId, selectedPointId } from "../stores";
  import { tick } from "svelte";

  export let percent: number;
  export let playing: boolean;
  export let play: () => any;
  export let pause: () => any;
  export let startPoint: Point;
  export let lines: Line[];
  export let sequence: SequenceItem[];
  export let robotLength: number = 16;
  export let robotWidth: number = 16;
  export let robotXY: BasePoint;
  export let robotHeading: number;
  export let x: d3.ScaleLinear<number, number, number>;
  export let y: d3.ScaleLinear<number, number, number>;
  export let settings: Settings;
  export let handleSeek: (percent: number) => void;
  export let loopAnimation: boolean;
  export let playbackSpeed: number = 1.0;
  export let changePlaybackSpeedBy: (delta: number) => void;
  export let resetPlaybackSpeed: () => void;
  export let setPlaybackSpeed: (factor: number, autoPlay?: boolean) => void;

  export const resetAnimation = undefined as unknown as () => void;

  export let shapes: Shape[];
  export let recordChange: () => void;
  export let onPreviewChange: ((lines: Line[] | null) => void) | null = null;

  let optimizationOpen = false;
  let waypointTableRef: any = null;

  // Field panel optimizer reference and bound runtime state
  let optDialogRef: any = null;
  let optIsRunning: boolean = false;
  let optOptimizedLines: Line[] | null = null;
  let optFailed: boolean = false;

  export async function openAndStartOptimization() {
    // Prefer table dialog when table is active
    if (
      activeTab === "table" &&
      waypointTableRef &&
      waypointTableRef.openAndStartOptimization
    ) {
      return waypointTableRef.openAndStartOptimization();
    }

    // If we're on the field tab, open the field dialog and start it
    if (activeTab === "field") {
      try {
        optimizationOpen = true;
        await tick();
        if (optDialogRef && optDialogRef.startOptimization)
          await optDialogRef.startOptimization();
      } catch (e) {
        console.error("Error opening/starting field optimizer:", e);
        optimizationOpen = false;
      }
      return;
    }

    // Fallback: try table dialog
    if (waypointTableRef && waypointTableRef.openAndStartOptimization) {
      return waypointTableRef.openAndStartOptimization();
    }

    optimizationOpen = true;
  }

  export function stopOptimization() {
    if (
      activeTab === "table" &&
      waypointTableRef &&
      waypointTableRef.stopOptimization
    ) {
      waypointTableRef.stopOptimization();
      return;
    }
    if (
      activeTab === "field" &&
      optDialogRef &&
      optDialogRef.stopOptimization
    ) {
      try {
        optDialogRef.stopOptimization();
      } catch (e) {
        console.error("Error stopping field optimizer:", e);
      }
      return;
    }

    if (waypointTableRef && waypointTableRef.stopOptimization)
      waypointTableRef.stopOptimization();
  }

  export function applyOptimization() {
    if (
      activeTab === "table" &&
      waypointTableRef &&
      waypointTableRef.applyOptimization
    ) {
      waypointTableRef.applyOptimization();
      return;
    }
    if (activeTab === "field" && optDialogRef && optDialogRef.handleApply) {
      try {
        optDialogRef.handleApply();
      } catch (e) {
        console.error("Error applying field optimizer result:", e);
      }
      return;
    }

    if (waypointTableRef && waypointTableRef.applyOptimization)
      waypointTableRef.applyOptimization();
  }

  export function discardOptimization() {
    if (
      activeTab === "table" &&
      waypointTableRef &&
      waypointTableRef.discardOptimization
    ) {
      waypointTableRef.discardOptimization();
      return;
    }
    if (activeTab === "field" && optDialogRef && optDialogRef.handleClose) {
      try {
        optDialogRef.handleClose();
      } catch (e) {
        console.error("Error discarding/closing field optimizer:", e);
      }
      return;
    }

    if (waypointTableRef && waypointTableRef.discardOptimization)
      waypointTableRef.discardOptimization();
  }

  export function retryOptimization() {
    if (
      activeTab === "table" &&
      waypointTableRef &&
      waypointTableRef.retryOptimization
    ) {
      waypointTableRef.retryOptimization();
      return;
    }
    if (
      activeTab === "field" &&
      optDialogRef &&
      optDialogRef.startOptimization
    ) {
      try {
        optDialogRef.startOptimization();
      } catch (e) {
        console.error("Error retrying field optimizer:", e);
      }
      return;
    }

    if (waypointTableRef && waypointTableRef.retryOptimization)
      waypointTableRef.retryOptimization();
  }

  export function getOptimizationStatus() {
    if (
      activeTab === "table" &&
      waypointTableRef &&
      waypointTableRef.getOptimizationStatus
    ) {
      return waypointTableRef.getOptimizationStatus();
    }
    if (activeTab === "field") {
      return {
        isOpen: optimizationOpen,
        isRunning: optIsRunning,
        optimizedLines: optOptimizedLines,
        optimizationFailed: optFailed,
      };
    }

    // fallback to table status
    if (waypointTableRef && waypointTableRef.getOptimizationStatus) {
      return waypointTableRef.getOptimizationStatus();
    }

    return {
      isOpen: optimizationOpen,
      isRunning: false,
      optimizedLines: null,
      optimizationFailed: false,
    };
  }

  function handleValidate() {
    validatePath(startPoint, lines, settings, sequence, shapes);
  }

  export let activeTab: "path" | "field" | "table" = "path";

  // Reference exported but unused props to silence Svelte unused-export warnings
  $: robotLength;
  $: robotWidth;

  // Compute timeline markers for the UI (start of each travel segment)
  $: timePrediction = calculatePathTime(startPoint, lines, settings, sequence);
  $: markers = (() => {
    const _markers: { percent: number; color: string; name: string }[] = [];
    if (
      !timePrediction ||
      !timePrediction.timeline ||
      timePrediction.totalTime <= 0
    )
      return _markers;

    timePrediction.timeline.forEach((ev) => {
      if ((ev as any).type === "travel") {
        const start = (ev as any).startTime as number;
        const pct = (start / timePrediction.totalTime) * 100;
        const lineIndex = (ev as any).lineIndex as number;
        const line = lines[lineIndex];
        const color = line?.color || "#ffffff";
        const name = line?.name || `Path ${lineIndex + 1}`;
        _markers.push({ percent: pct, color, name });
      }
    });

    return _markers;
  })();

  let collapsedEventMarkers: boolean[] = lines.map(() => false);

  // State for collapsed sections
  let collapsedSections = {
    obstacles: shapes.map(() => true),
    lines: lines.map(() => false),
    controlPoints: lines.map(() => true), // Start with control points collapsed
  };

  // Debug helpers
  $: debugLinesIds = Array.isArray(lines) ? lines.map((l) => l.id) : [];
  $: debugSequenceIds = Array.isArray(sequence)
    ? sequence.filter((s) => s.kind === "path").map((s: any) => s.lineId)
    : [];
  $: debugMissing = debugLinesIds.filter(
    (id) => !debugSequenceIds.includes(id),
  );
  $: debugInvalidRefs = debugSequenceIds.filter(
    (id) => !debugLinesIds.includes(id),
  );

  let repairedSequenceOnce = false;

  $: if (
    Array.isArray(lines) &&
    Array.isArray(sequence) &&
    !repairedSequenceOnce
  ) {
    const lineIds = new Set(lines.map((l) => l.id));
    const pruned = sequence.filter(
      (s) => s.kind !== "path" || lineIds.has((s as any).lineId),
    );
    const presentIds = new Set(
      pruned.filter((s) => s.kind === "path").map((s) => (s as any).lineId),
    );
    const missing = lines.filter((l) => !presentIds.has(l.id));

    if (missing.length || pruned.length !== sequence.length) {
      sequence = [
        ...pruned,
        ...missing.map((l) => ({ kind: "path", lineId: l.id })),
      ];
      repairedSequenceOnce = true;
      recordChange?.();
    }
  }

  $: if (lines.length !== collapsedSections.lines.length) {
    collapsedEventMarkers = lines.map(() => false);
    const wasAllCollapsed =
      collapsedSections &&
      collapsedSections.lines &&
      collapsedSections.lines.length > 0 &&
      collapsedSections.lines.every((v) => v === true);
    collapsedSections = {
      obstacles: shapes.map(() => true),
      lines: lines.map(() => (wasAllCollapsed ? true : false)),
      controlPoints: lines.map(() => true),
    };
  }

  import { toggleCollapseAllTrigger } from "../stores";
  let _lastToggleCollapse = $toggleCollapseAllTrigger;
  $: if ($toggleCollapseAllTrigger !== _lastToggleCollapse) {
    _lastToggleCollapse = $toggleCollapseAllTrigger;
    toggleCollapseAll();
  }

  $: if (shapes.length !== collapsedSections.obstacles.length) {
    collapsedSections.obstacles = shapes.map(() => true);
  }

  const makeId = () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  // Drag and drop state
  let draggingIndex: number | null = null;
  let dragOverIndex: number | null = null;
  let dragPosition: DragPosition | null = null;

  function handleDragStart(e: DragEvent, index: number) {
    const originElem = document.elementFromPoint(
      e.clientX,
      e.clientY,
    ) as HTMLElement | null;
    if (originElem?.closest("[data-event-marker-slider]")) {
      e.preventDefault();
      return;
    }

    const item = sequence[index];
    let isLocked = false;
    if (item.kind === "path") {
      const line = lines.find((l) => l.id === item.lineId);
      isLocked = line?.locked ?? false;
    } else {
      isLocked = item.locked ?? false;
    }

    if (isLocked) {
      e.preventDefault();
      return;
    }

    draggingIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
  }

  function handleWindowDragOver(e: DragEvent) {
    if (draggingIndex === null || activeTab !== "path") return;
    e.preventDefault();

    const target = getClosestTarget(e, '[role="listitem"]', document.body);

    if (!target) return;

    const index = parseInt(target.element.getAttribute("data-index") || "-1");
    if (index === -1) return;

    if (dragOverIndex !== index || dragPosition !== target.position) {
      dragOverIndex = index;
      dragPosition = target.position;
    }
  }

  function handleWindowDrop(e: DragEvent) {
    if (draggingIndex === null || activeTab !== "path") return;
    e.preventDefault();

    if (
      dragOverIndex === null ||
      dragPosition === null ||
      draggingIndex === dragOverIndex
    ) {
      handleDragEnd();
      return;
    }

    const newSequence = reorderSequence(
      sequence,
      draggingIndex,
      dragOverIndex,
      dragPosition,
    );
    sequence = newSequence;
    syncLinesToSequence(newSequence);
    recordChange?.();

    handleDragEnd();
  }

  function handleDragEnd() {
    draggingIndex = null;
    dragOverIndex = null;
    dragPosition = null;
  }

  function renumberDefaultPathNames() {
    const renamed = lines.map((l, idx) => {
      if (/^Path \d+$/.test(l.name)) {
        return { ...l, name: `Path ${idx + 1}` };
      }
      return l;
    });
    lines = renamed;
  }

  function getWait(i: any) {
    return i as any;
  }

  function insertLineAfter(seqIndex: number) {
    const seqItem = sequence[seqIndex];
    if (!seqItem || seqItem.kind !== "path") return;
    const lineIndex = lines.findIndex((l) => l.id === seqItem.lineId);
    const currentLine = lines[lineIndex];

    let newPoint: Point;
    if (currentLine.endPoint.heading === "linear") {
      newPoint = {
        x: _.random(36, 108),
        y: _.random(36, 108),
        heading: "linear",
        startDeg: currentLine.endPoint.startDeg,
        endDeg: currentLine.endPoint.endDeg,
      };
    } else if (currentLine.endPoint.heading === "constant") {
      newPoint = {
        x: _.random(36, 108),
        y: _.random(36, 108),
        heading: "constant",
        degrees: currentLine.endPoint.degrees,
      };
    } else {
      newPoint = {
        x: _.random(36, 108),
        y: _.random(36, 108),
        heading: "tangential",
        reverse: currentLine.endPoint.reverse,
      };
    }

    const newLine = {
      id: makeId(),
      endPoint: newPoint,
      controlPoints: [],
      color: getRandomColor(),
      name: "",
      eventMarkers: [],
      waitBeforeMs: 0,
      waitAfterMs: 0,
      waitBeforeName: "",
      waitAfterName: "",
    };

    const newLines = [...lines];
    newLines.splice(lineIndex + 1, 0, newLine);
    lines = newLines;

    const newSeq = [...sequence];
    newSeq.splice(seqIndex + 1, 0, { kind: "path", lineId: newLine.id! });
    sequence = newSeq;

    collapsedSections.lines.splice(
      lineIndex + 1,
      0,
      allCollapsed ? true : false,
    );
    collapsedSections.controlPoints.splice(lineIndex + 1, 0, true);
    collapsedEventMarkers.splice(lineIndex + 1, 0, false);

    collapsedSections = { ...collapsedSections };
    collapsedEventMarkers = [...collapsedEventMarkers];
  }

  function removeLine(idx: number) {
    if (lines.length <= 1) return;

    const removedId = lines[idx]?.id;
    const newLines = [...lines];
    newLines.splice(idx, 1);
    lines = newLines;

    if (removedId) {
      sequence = sequence.filter(
        (item) => !(item.kind === "path" && item.lineId === removedId),
      );
      if ($selectedLineId === removedId) selectedLineId.set(null);
    }

    collapsedSections.lines.splice(idx, 1);
    collapsedSections.controlPoints.splice(idx, 1);
    collapsedEventMarkers.splice(idx, 1);
    recordChange();
  }

  function addLine() {
    const newLine: Line = {
      id: makeId(),
      name: "",
      endPoint: {
        x: _.random(0, 144),
        y: _.random(0, 144),
        heading: "tangential",
        reverse: false,
      },
      controlPoints: [],
      color: getRandomColor(),
      waitBeforeMs: 0,
      waitAfterMs: 0,
      waitBeforeName: "",
      waitAfterName: "",
    };
    lines = [...lines, newLine];
    sequence = [...sequence, { kind: "path", lineId: newLine.id! }];
    collapsedSections.lines.push(allCollapsed ? true : false);
    collapsedSections.controlPoints.push(true);
    selectedLineId.set(newLine.id!);
    const newIndex = lines.findIndex((l) => l.id === newLine.id!);
    selectedPointId.set(`point-${newIndex + 1}-0`);
    recordChange();
  }

  function collapseAll() {
    collapsedSections.lines = lines.map(() => true);
    collapsedSections.controlPoints = lines.map(() => true);
    collapsedEventMarkers = lines.map(() => true);
    collapsedSections.obstacles = shapes.map(() => true);
    collapsedSections = { ...collapsedSections };
    collapsedEventMarkers = [...collapsedEventMarkers];
  }

  function expandAll() {
    collapsedSections.lines = lines.map(() => false);
    collapsedSections.controlPoints = lines.map(() => false);
    collapsedEventMarkers = lines.map(() => false);
    collapsedSections.obstacles = shapes.map(() => false);
    collapsedSections = { ...collapsedSections };
    collapsedEventMarkers = [...collapsedEventMarkers];
  }

  $: allCollapsed =
    collapsedSections.lines.length > 0 &&
    collapsedSections.lines.every((v) => v) &&
    collapsedSections.controlPoints.every((v) => v) &&
    collapsedEventMarkers.every((v) => v) &&
    collapsedSections.obstacles.every((v) => v);

  function toggleCollapseAll() {
    if (allCollapsed) expandAll();
    else collapseAll();
  }

  function addWait() {
    const wait = {
      kind: "wait",
      id: makeId(),
      name: "Wait",
      durationMs: 1000,
      locked: false,
    } as SequenceItem;
    sequence = [...sequence, wait];
    selectedPointId.set(`wait-${wait.id}`);
    selectedLineId.set(null);
    recordChange();
  }

  function addWaitAtStart() {
    const wait = {
      kind: "wait",
      id: makeId(),
      name: "Wait",
      durationMs: 1000,
      locked: false,
    } as SequenceItem;
    sequence = [wait, ...sequence];
    selectedPointId.set(`wait-${wait.id}`);
    selectedLineId.set(null);
    recordChange();
  }

  function addPathAtStart() {
    const newLine: Line = {
      id: makeId(),
      name: "",
      endPoint: {
        x: _.random(0, 144),
        y: _.random(0, 144),
        heading: "tangential",
        reverse: false,
      },
      controlPoints: [],
      color: getRandomColor(),
      eventMarkers: [],
      waitBeforeMs: 0,
      waitAfterMs: 0,
      waitBeforeName: "",
      waitAfterName: "",
    };
    lines = [newLine, ...lines];
    renumberDefaultPathNames();
    sequence = [{ kind: "path", lineId: newLine.id! }, ...sequence];
    collapsedSections.lines = [
      allCollapsed ? true : false,
      ...collapsedSections.lines,
    ];
    collapsedSections.controlPoints = [
      true,
      ...collapsedSections.controlPoints,
    ];
    collapsedEventMarkers = [
      allCollapsed ? true : false,
      ...collapsedEventMarkers,
    ];
    selectedLineId.set(newLine.id!);
    recordChange();
  }

  function handleOptimizationApply(newLines: Line[]) {
    lines = newLines;
    recordChange?.();
  }

  function insertWaitAfter(seqIndex: number) {
    const newSeq = [...sequence];
    newSeq.splice(seqIndex + 1, 0, {
      kind: "wait",
      id: makeId(),
      name: "Wait",
      durationMs: 0,
      locked: false,
    });
    sequence = newSeq;
  }

  function insertPathAfter(seqIndex: number) {
    const newLine: Line = {
      id: makeId(),
      name: "",
      endPoint: {
        x: _.random(36, 108),
        y: _.random(36, 108),
        heading: "tangential",
        reverse: false,
      },
      controlPoints: [],
      color: getRandomColor(),
      eventMarkers: [],
      waitBeforeMs: 0,
      waitAfterMs: 0,
      waitBeforeName: "",
      waitAfterName: "",
    };

    lines = [...lines, newLine];
    renumberDefaultPathNames();

    const newSeq = [...sequence];
    newSeq.splice(seqIndex + 1, 0, { kind: "path", lineId: newLine.id! });
    sequence = newSeq;

    collapsedSections.lines.push(allCollapsed ? true : false);
    collapsedSections.controlPoints.push(true);
    collapsedEventMarkers.push(false);

    collapsedSections = { ...collapsedSections };
    collapsedEventMarkers = [...collapsedEventMarkers];
    recordChange();
  }

  function syncLinesToSequence(newSeq: SequenceItem[]) {
    const pathOrder = newSeq
      .filter((item) => item.kind === "path")
      .map((item) => item.lineId);

    const indexedLines = lines.map((line, idx) => ({
      line,
      collapsed: collapsedSections.lines[idx],
      control: collapsedSections.controlPoints[idx],
      markers: collapsedEventMarkers[idx],
    }));

    const byId = new Map(indexedLines.map((entry) => [entry.line.id, entry]));
    const reordered: typeof indexedLines = [];

    pathOrder.forEach((id) => {
      const entry = byId.get(id);
      if (entry) {
        reordered.push(entry);
        byId.delete(id);
      }
    });

    reordered.push(...byId.values());

    lines = reordered.map((entry) => entry.line);
    const renamed = lines.map((l, idx) => {
      if (/^Path \d+$/.test(l.name)) return { ...l, name: `Path ${idx + 1}` };
      return l;
    });
    lines = renamed;

    collapsedSections = {
      ...collapsedSections,
      lines: reordered.map((entry) => entry.collapsed ?? false),
      controlPoints: reordered.map((entry) => entry.control ?? true),
    };
    collapsedEventMarkers = reordered.map((entry) => entry.markers ?? false);
  }

  function moveSequenceItem(seqIndex: number, delta: number) {
    const targetIndex = seqIndex + delta;
    if (targetIndex < 0 || targetIndex >= sequence.length) return;

    const isLockedSequenceItem = (index: number) => {
      const it = sequence[index];
      if (!it) return false;
      if (it.kind === "path") {
        const ln = lines.find((l) => l.id === it.lineId);
        return ln?.locked ?? false;
      }
      if (it.kind === "wait") {
        return (it as any).locked ?? false;
      }
      return false;
    };

    if (isLockedSequenceItem(seqIndex) || isLockedSequenceItem(targetIndex))
      return;

    const newSeq = [...sequence];
    const [item] = newSeq.splice(seqIndex, 1);
    newSeq.splice(targetIndex, 0, item);
    sequence = newSeq;

    syncLinesToSequence(newSeq);
    recordChange?.();
  }
</script>

<div class="flex-1 flex flex-col justify-start items-center gap-2 h-full">
  <!-- Tab Switcher -->
  <div class="w-full px-4 pt-2">
    <div
      class="flex flex-row w-full bg-neutral-200 dark:bg-neutral-800 rounded-lg p-1 gap-1"
      role="tablist"
      aria-label="Editor View Selection"
    >
      {#each ["path", "field", "table"] as tab}
        <button
          role="tab"
          aria-selected={activeTab === tab}
          aria-controls="{tab}-panel"
          id="{tab}-tab"
          class="flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 capitalize {activeTab ===
          tab
            ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
            : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}"
          on:click={() => (activeTab = tab)}
        >
          {tab === "field"
            ? "Field & Tools"
            : tab === "path"
              ? "Paths"
              : "Table"}
        </button>
      {/each}
    </div>
  </div>

  <div
    class="flex flex-col justify-start items-start w-full rounded-lg bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200 dark:border-neutral-800 p-4 overflow-y-auto overflow-x-hidden h-full gap-6 relative"
    role="tabpanel"
    id={activeTab === "path"
      ? "path-panel"
      : activeTab === "field"
        ? "field-panel"
        : "table-panel"}
    aria-labelledby={activeTab === "path"
      ? "path-tab"
      : activeTab === "field"
        ? "field-tab"
        : "table-tab"}
  >
    {#if activeTab === "table"}
      <WaypointTable
        bind:this={waypointTableRef}
        bind:startPoint
        bind:lines
        bind:sequence
        {recordChange}
        onToggleOptimization={() => (optimizationOpen = !optimizationOpen)}
        onValidate={handleValidate}
        {optimizationOpen}
        {handleOptimizationApply}
        {onPreviewChange}
        bind:shapes
        bind:collapsedObstacles={collapsedSections.obstacles}
        {settings}
      />
    {/if}

    {#if activeTab === "field"}
      <RobotPositionDisplay
        {robotXY}
        {robotHeading}
        {x}
        {y}
        onToggleOptimization={() => (optimizationOpen = !optimizationOpen)}
        onValidate={handleValidate}
      />

      {#if optimizationOpen}
        <div
          class="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-100 dark:bg-neutral-800 p-4"
        >
          <OptimizationDialog
            bind:this={optDialogRef}
            bind:isRunning={optIsRunning}
            bind:optimizedLines={optOptimizedLines}
            bind:optimizationFailed={optFailed}
            isOpen={true}
            useModal={false}
            {startPoint}
            {lines}
            {settings}
            {sequence}
            {shapes}
            onApply={handleOptimizationApply}
            {onPreviewChange}
            onClose={() => (optimizationOpen = false)}
          />
        </div>
      {/if}

      <ObstaclesSection
        bind:shapes
        bind:collapsedObstacles={collapsedSections.obstacles}
      />
    {/if}

    {#if activeTab === "path"}
      <div class="flex items-center justify-between gap-4 w-full mb-2">
        <StartingPointSection
          bind:startPoint
          {addPathAtStart}
          {addWaitAtStart}
          {toggleCollapseAll}
          {allCollapsed}
        />
      </div>

      {#if settings?.showDebugSequence}
        <div class="p-2 text-xs text-neutral-500">
          <div>
            <strong>DEBUG (ControlTab)</strong> — lines: {lines.length},
            sequence: {(sequence || []).length}
          </div>
          <div>
            Missing: {JSON.stringify(debugMissing)}
          </div>
          <div>
            Invalid refs: {JSON.stringify(debugInvalidRefs)}
          </div>
        </div>
      {/if}

      <!-- Unified sequence render: paths and waits -->
      <div class="flex flex-col w-full gap-2 pb-16">
        {#each sequence as item, sIdx}
          {@const isLocked =
            item.kind === "path"
              ? (lines.find((l) => l.id === item.lineId)?.locked ?? false)
              : (item.locked ?? false)}
          <div
            role="listitem"
            data-index={sIdx}
            class="w-full transition-all duration-200 rounded-lg"
            draggable={!isLocked}
            on:dragstart={(e) => handleDragStart(e, sIdx)}
            on:dragend={handleDragEnd}
            class:border-t-4={dragOverIndex === sIdx && dragPosition === "top"}
            class:border-b-4={dragOverIndex === sIdx &&
              dragPosition === "bottom"}
            class:border-blue-500={dragOverIndex === sIdx}
            class:dark:border-blue-400={dragOverIndex === sIdx}
            class:opacity-50={draggingIndex === sIdx}
          >
            {#if item.kind === "path"}
              {#each lines.filter((l) => l.id === item.lineId) as ln (ln.id)}
                <PathLineSection
                  bind:line={ln}
                  idx={lines.findIndex((l) => l.id === ln.id)}
                  bind:lines
                  bind:collapsed={
                    collapsedSections.lines[
                      lines.findIndex((l) => l.id === ln.id)
                    ]
                  }
                  bind:collapsedEventMarkers={
                    collapsedEventMarkers[
                      lines.findIndex((l) => l.id === ln.id)
                    ]
                  }
                  bind:collapsedControlPoints={
                    collapsedSections.controlPoints[
                      lines.findIndex((l) => l.id === ln.id)
                    ]
                  }
                  onRemove={() =>
                    removeLine(lines.findIndex((l) => l.id === ln.id))}
                  onInsertAfter={() => insertLineAfter(sIdx)}
                  onAddWaitAfter={() => insertWaitAfter(sIdx)}
                  onMoveUp={() => moveSequenceItem(sIdx, -1)}
                  onMoveDown={() => moveSequenceItem(sIdx, 1)}
                  canMoveUp={sIdx !== 0}
                  canMoveDown={sIdx !== sequence.length - 1}
                  {recordChange}
                />
              {/each}
            {:else}
              <WaitRow
                id={getWait(item).id}
                name={getWait(item).name}
                durationMs={getWait(item).durationMs}
                locked={getWait(item).locked ?? false}
                onToggleLock={() => {
                  const newSeq = [...sequence];
                  newSeq[sIdx] = {
                    ...getWait(item),
                    locked: !(getWait(item).locked ?? false),
                  };
                  sequence = newSeq;
                  recordChange?.();
                }}
                onChange={(newName, newDuration) => {
                  const newSeq = [...sequence];
                  newSeq[sIdx] = {
                    ...getWait(item),
                    name: newName,
                    durationMs: Math.max(0, Number(newDuration) || 0),
                  };
                  sequence = newSeq;
                }}
                onRemove={() => {
                  const newSeq = [...sequence];
                  newSeq.splice(sIdx, 1);
                  sequence = newSeq;
                }}
                onInsertAfter={() => {
                  const newSeq = [...sequence];
                  newSeq.splice(sIdx + 1, 0, {
                    kind: "wait",
                    id: makeId(),
                    name: "Wait",
                    durationMs: 0,
                    locked: false,
                  });
                  sequence = newSeq;
                }}
                onAddPathAfter={() => insertPathAfter(sIdx)}
                onMoveUp={() => moveSequenceItem(sIdx, -1)}
                onMoveDown={() => moveSequenceItem(sIdx, 1)}
                canMoveUp={sIdx !== 0}
                canMoveDown={sIdx !== sequence.length - 1}
              />
              <WaitMarkersSection wait={getWait(item)} />
            {/if}
          </div>
        {/each}
      </div>

      <!-- Add Line Buttons (Sticky Bottom) -->
      <div class="absolute bottom-4 right-4 flex flex-col gap-2">
        <!-- These could be floating action buttons if we wanted,
              but for now keeping them accessible at the end of list is fine too.
              Actually, making them sticky at the bottom of the container is better.
         -->
      </div>

      <!-- Static buttons at the end of the list -->
      <div
        class="flex flex-row items-center gap-4 justify-center w-full mt-4 pb-4"
      >
        <button
          on:click={addLine}
          class="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors shadow-sm font-medium"
          aria-label="Add new path segment"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width={2}
            stroke="currentColor"
            class="size-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add Path
        </button>

        <button
          on:click={addWait}
          class="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors shadow-sm font-medium"
          aria-label="Add wait command"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="size-5"
          >
            <circle cx="12" cy="12" r="9" />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 7v5l3 2"
            />
          </svg>
          Add Wait
        </button>
      </div>
    {/if}
  </div>

  <PlaybackControls
    bind:playing
    {play}
    {pause}
    bind:percent
    {handleSeek}
    bind:loopAnimation
    {markers}
    {playbackSpeed}
    {changePlaybackSpeedBy}
    {resetPlaybackSpeed}
    {setPlaybackSpeed}
  />
</div>

<svelte:window on:dragover={handleWindowDragOver} on:drop={handleWindowDrop} />
