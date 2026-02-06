<!-- Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0. -->
<script lang="ts">
  import type {
    Point,
    Line,
    SequenceItem,
    Shape,
    Settings,
    BasePoint,
  } from "../../../types/index";
  import { tick } from "svelte";
  import { slide } from "svelte/transition";
  import RobotPositionDisplay from "../RobotPositionDisplay.svelte";
  import CollapseAllButton from "../tools/CollapseAllButton.svelte";
  import GlobalEventMarkers from "../GlobalEventMarkers.svelte";
  import ObstaclesSection from "../sections/ObstaclesSection.svelte";
  import { showOptimizationDialog } from "../../../stores";
  import { validatePath } from "../../../utils/validation";

  export let robotXY: BasePoint;
  export let robotHeading: number;
  export let startPoint: Point;
  export let lines: Line[];
  export let sequence: SequenceItem[];
  export let shapes: Shape[];
  export let settings: Settings;
  export let recordChange: () => void;
  export let onPreviewChange: ((lines: Line[] | null) => void) | null = null;
  export let isActive: boolean = false;

  let globalMarkersRef: GlobalEventMarkers;

  // Collapsed state
  let collapsedSections = {
    obstacles: shapes.map(() => true),
    obstaclesSection: false,
    globalMarkers: false,
  };

  $: if (shapes.length !== collapsedSections.obstacles.length) {
    collapsedSections.obstacles = shapes.map(() => true);
  }

  $: allCollapsed =
    collapsedSections.obstacles.every((v) => v) &&
    collapsedSections.globalMarkers;

  function toggleCollapseAll() {
    if (allCollapsed) {
      collapsedSections.obstacles = shapes.map(() => false);
      collapsedSections.obstaclesSection = false;
      collapsedSections.globalMarkers = false;
    } else {
      collapsedSections.obstacles = shapes.map(() => true);
      collapsedSections.obstaclesSection = true;
      collapsedSections.globalMarkers = true;
    }
    collapsedSections = { ...collapsedSections };
  }

  function handleValidate() {
    validatePath(startPoint, lines, settings, sequence, shapes);
  }

  export async function scrollToMarker(markerId: string) {
    if (globalMarkersRef) {
      await globalMarkersRef.scrollToMarker(markerId);
    }
  }
</script>

<div class="p-4 w-full flex flex-col gap-6">
  <div class="flex items-center justify-between w-full gap-4">
    <RobotPositionDisplay
      {robotXY}
      {robotHeading}
      {settings}
      onToggleOptimization={() => showOptimizationDialog.set(true)}
      onValidate={handleValidate}
    />

    <div class="flex items-center justify-end">
      <CollapseAllButton {allCollapsed} onToggle={toggleCollapseAll} />
    </div>
  </div>

  <GlobalEventMarkers
    bind:this={globalMarkersRef}
    bind:sequence
    bind:lines
    bind:collapsedMarkers={collapsedSections.globalMarkers}
  />

  <ObstaclesSection
    bind:shapes
    bind:collapsedObstacles={collapsedSections.obstacles}
    bind:collapsed={collapsedSections.obstaclesSection}
    {isActive}
  />
</div>
