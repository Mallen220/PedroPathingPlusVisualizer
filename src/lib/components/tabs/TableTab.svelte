<!-- Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0. -->
<script lang="ts">
  import type {
    Point,
    Line,
    SequenceItem,
    Shape,
    Settings,
  } from "../../../types/index";
  // Fixed incorrect relative import: WaypointTable is one level up from the tabs folder
  import WaypointTable from "../WaypointTable.svelte";
  import { validatePath } from "../../../utils/validation";

  export let startPoint: Point;
  export let lines: Line[];
  export let sequence: SequenceItem[];
  export let recordChange: () => void;
  export let onPreviewChange: ((lines: Line[] | null) => void) | null = null;
  export let shapes: Shape[];
  export let settings: Settings;
  export let isActive: boolean = false;

  let waypointTableRef: any = null;

  let collapsedObstacles = shapes.map(() => true);
  $: if (shapes.length !== collapsedObstacles.length) {
    collapsedObstacles = shapes.map(() => true);
  }

  function handleValidate() {
    validatePath(startPoint, lines, settings, sequence, shapes);
  }

  // Exported methods
  export function copyTable() {
    if (waypointTableRef && waypointTableRef.copyTableToClipboard) {
      waypointTableRef.copyTableToClipboard();
    }
  }
</script>

<div class="p-4 w-full">
  <WaypointTable
    bind:this={waypointTableRef}
    {isActive}
    bind:startPoint
    bind:lines
    bind:sequence
    {recordChange}
    onValidate={handleValidate}
    onPreviewChange={onPreviewChange || (() => {})}
    bind:shapes
    bind:collapsedObstacles
    {settings}
  />
</div>
