<!-- src/lib/components/filemanager/DiffView.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition";
  import * as d3 from "d3";
  import { getCurvePoint } from "../../../utils/math";

  export let isOpen = false;
  export let fileName = "";
  export let originalContentStr = "";
  export let newContentStr = "";
  export let fieldImage: string | null = null;

  const dispatch = createEventDispatcher();

  let oldData: any = null;
  let newData: any = null;

  $: if (originalContentStr) {
    try {
      oldData = JSON.parse(originalContentStr);
    } catch (e) {
      console.error("Failed to parse original content", e);
      oldData = null;
    }
  }

  $: if (newContentStr) {
    try {
      newData = JSON.parse(newContentStr);
    } catch (e) {
      console.error("Failed to parse new content", e);
      newData = null;
    }
  }

  // Visualization logic
  let width = 600;
  let height = 600;
  const FIELD_SIZE = 144;

  // Scales
  $: iconSize = Math.min(width, height);
  $: offsetX = Math.max(0, Math.round((width - iconSize) / 2));
  $: offsetY = Math.max(0, Math.round((height - iconSize) / 2));

  $: _scale = d3.scaleLinear().domain([0, FIELD_SIZE]).range([0, iconSize]);
  $: scaleX = (v: number) => _scale(v) + offsetX;
  $: scaleY = (v: number) => offsetY + (iconSize - _scale(v)); // Invert Y

  function getPathD(start: any, lines: any[]): string {
    if (!start || !lines) return "";

    let d = `M ${scaleX(start.x)} ${scaleY(start.y)}`;
    let current = { x: start.x, y: start.y };

    for (const line of lines) {
      if (!line || !line.endPoint) continue;
      const end = line.endPoint;
      const cps = (line.controlPoints || []).filter(
        (p: any) => p && typeof p.x === "number",
      );

      if (cps.length === 0) {
        d += ` L ${scaleX(end.x)} ${scaleY(end.y)}`;
        current = { x: end.x, y: end.y };
        continue;
      }

      const bezierControls = [current, ...cps, end];
      const samples = 40; // Higher quality for diff view

      for (let s = 1; s <= samples; s++) {
        const t = s / samples;
        const pt = getCurvePoint(t, bezierControls);
        d += ` L ${scaleX(pt.x)} ${scaleY(pt.y)}`;
      }
      current = { x: end.x, y: end.y };
    }
    return d;
  }

  // Stats Logic
  function calculateTotalDistance(start: any, lines: any[]): number {
    if (!start || !lines) return 0;
    let total = 0;
    let current = start;
    for (const line of lines) {
      // Approximate distance
      const cps = [current, ...(line.controlPoints || []), line.endPoint];
      let prev = current;
      const samples = 20;
      for (let s = 1; s <= samples; s++) {
        const t = s / samples;
        const pt = getCurvePoint(t, cps);
        total += Math.hypot(pt.x - prev.x, pt.y - prev.y);
        prev = pt;
      }
      current = line.endPoint;
    }
    return total;
  }

  function getEventMarkers(lines: any[]): any[] {
    if (!lines) return [];
    let markers: any[] = [];
    lines.forEach((line, idx) => {
      if (line.eventMarkers) {
        line.eventMarkers.forEach((m: any) =>
          markers.push({ ...m, lineIndex: idx }),
        );
      }
    });
    return markers;
  }

  $: oldDist = calculateTotalDistance(oldData?.startPoint, oldData?.lines);
  $: newDist = calculateTotalDistance(newData?.startPoint, newData?.lines);

  $: oldMarkers = getEventMarkers(oldData?.lines);
  $: newMarkers = getEventMarkers(newData?.lines);

  // Marker Diff
  $: addedMarkers = newMarkers.filter(
    (nm) =>
      !oldMarkers.some(
        (om) =>
          om.name === nm.name &&
          Math.abs(om.position - nm.position) < 0.001 &&
          om.lineIndex === nm.lineIndex,
      ),
  );
  $: removedMarkers = oldMarkers.filter(
    (om) =>
      !newMarkers.some(
        (nm) =>
          nm.name === om.name &&
          Math.abs(nm.position - om.position) < 0.001 &&
          nm.lineIndex === om.lineIndex,
      ),
  );

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") dispatch("close");
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div
    class="fixed inset-0 z-[1300] flex items-center justify-center bg-black/50 backdrop-blur-sm"
    transition:fade
    role="dialog"
    aria-modal="true"
  >
    <div
      class="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl w-[90vw] h-[90vh] flex flex-col overflow-hidden"
    >
      <!-- Header -->
      <div
        class="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900"
      >
        <div>
          <h2 class="text-lg font-bold flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="size-5 text-blue-500"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            Diff: {fileName}
          </h2>
          <div class="flex gap-4 text-xs mt-1">
            <div class="flex items-center gap-1 text-red-500 font-medium">
              <div
                class="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"
              ></div>
              HEAD (Original)
            </div>
            <div class="flex items-center gap-1 text-green-500 font-medium">
              <div
                class="w-3 h-3 rounded-full bg-green-500/20 border border-green-500"
              ></div>
              Working Copy (New)
            </div>
          </div>
        </div>
        <button
          on:click={() => dispatch("close")}
          class="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="flex-1 flex overflow-hidden">
        <!-- Canvas -->
        <div
          class="flex-1 bg-neutral-100 dark:bg-neutral-800 relative flex items-center justify-center p-4"
          bind:clientWidth={width}
          bind:clientHeight={height}
        >
          <div
            class="relative aspect-square h-full max-h-[80vh] border shadow-sm bg-white"
          >
            <svg viewBox="0 0 {width} {height}" class="w-full h-full">
              {#if fieldImage}
                <image
                  href={fieldImage}
                  x={offsetX}
                  y={offsetY}
                  width={iconSize}
                  height={iconSize}
                  preserveAspectRatio="xMidYMid meet"
                />
              {/if}

              <!-- Grid/Background -->
              <rect
                x={offsetX}
                y={offsetY}
                width={iconSize}
                height={iconSize}
                fill="none"
                stroke="#ccc"
                stroke-opacity="0.3"
              />

              <!-- Old Path -->
              {#if oldData}
                <path
                  d={getPathD(oldData.startPoint, oldData.lines)}
                  fill="none"
                  stroke="#ef4444"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-opacity="0.6"
                />
                {#if oldData.startPoint}
                  <circle
                    cx={scaleX(oldData.startPoint.x)}
                    cy={scaleY(oldData.startPoint.y)}
                    r="4"
                    fill="#ef4444"
                    fill-opacity="0.6"
                  />
                {/if}
              {/if}

              <!-- New Path -->
              {#if newData}
                <path
                  d={getPathD(newData.startPoint, newData.lines)}
                  fill="none"
                  stroke="#22c55e"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-opacity="0.8"
                />
                {#if newData.startPoint}
                  <circle
                    cx={scaleX(newData.startPoint.x)}
                    cy={scaleY(newData.startPoint.y)}
                    r="4"
                    fill="#22c55e"
                  />
                {/if}
              {/if}
            </svg>
          </div>
        </div>

        <!-- Sidebar Stats -->
        <div
          class="w-80 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 p-4 overflow-y-auto"
        >
          <h3 class="font-bold text-sm mb-4">Changes</h3>

          <!-- Path Stats -->
          <div class="mb-6">
            <h4 class="text-xs uppercase text-neutral-500 font-bold mb-2">
              Path Statistics
            </h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Distance</span>
                <div class="flex flex-col items-end">
                  <span class="text-neutral-400 text-xs line-through"
                    >{oldDist.toFixed(1)}"</span
                  >
                  <span class={oldDist !== newDist ? "text-blue-500" : ""}
                    >{newDist.toFixed(1)}"</span
                  >
                </div>
              </div>
              <div class="flex justify-between">
                <span>Segments</span>
                <div class="flex flex-col items-end">
                  <span class="text-neutral-400 text-xs line-through"
                    >{oldData?.lines?.length ?? 0}</span
                  >
                  <span
                    class={oldData?.lines?.length !== newData?.lines?.length
                      ? "text-blue-500"
                      : ""}>{newData?.lines?.length ?? 0}</span
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Event Markers -->
          <div>
            <h4 class="text-xs uppercase text-neutral-500 font-bold mb-2">
              Event Markers
            </h4>
            {#if addedMarkers.length === 0 && removedMarkers.length === 0}
              <div class="text-neutral-400 text-xs italic">
                No changes in markers
              </div>
            {/if}

            {#if addedMarkers.length > 0}
              <div class="mb-2">
                <div class="text-xs text-green-600 font-bold mb-1">Added</div>
                {#each addedMarkers as m}
                  <div
                    class="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-1 rounded mb-1 border border-green-100 dark:border-green-800"
                  >
                    {m.name} @ {(m.position * 100).toFixed(0)}%
                  </div>
                {/each}
              </div>
            {/if}

            {#if removedMarkers.length > 0}
              <div>
                <div class="text-xs text-red-600 font-bold mb-1">Removed</div>
                {#each removedMarkers as m}
                  <div
                    class="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-1 rounded mb-1 border border-red-100 dark:border-red-800 line-through"
                  >
                    {m.name} @ {(m.position * 100).toFixed(0)}%
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
