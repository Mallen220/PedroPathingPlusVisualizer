<!-- Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0. -->
<!-- src/lib/components/tabs/ValidationTab.svelte -->
<script lang="ts">
  import { get } from "svelte/store";
  import {
    collisionMarkers,
    fieldPan,
    fieldZoom,
    fieldViewStore,
    selectedLineId,
    selectedPointId,
  } from "../../../stores";
  import type {
    Point,
    Line,
    SequenceItem,
    Shape,
    Settings,
    CollisionMarker,
  } from "../../../types/index";
  import { validatePath } from "../../../utils/validation";
  import { FIELD_SIZE } from "../../../config";

  export let startPoint: Point;
  export let lines: Line[];
  export let sequence: SequenceItem[];
  export let shapes: Shape[];
  export let settings: Settings;
  export let recordChange: (action?: string) => void;
  // Other props required by ControlTab but maybe not used here
  export let onPreviewChange: ((lines: Line[] | null) => void) | null = null;
  export let isActive: boolean = false;
  export let robotXY: any;
  export let robotHeading: any;

  // Group markers by type
  $: obstacles = $collisionMarkers.filter((m) => m.type === "obstacle");
  $: boundaries = $collisionMarkers.filter((m) => m.type === "boundary");
  $: keepIns = $collisionMarkers.filter((m) => m.type === "keep-in");
  $: zeroLengths = $collisionMarkers.filter((m) => m.type === "zero-length");

  $: totalIssues = $collisionMarkers.length;
  $: isValid = totalIssues === 0;

  function handleValidate() {
    validatePath(startPoint, lines, settings, sequence, shapes);
  }

  function focusMarker(marker: CollisionMarker) {
    // 1. Select the segment
    if (marker.segmentIndex !== undefined && lines[marker.segmentIndex]) {
      selectedLineId.set(lines[marker.segmentIndex].id!);
      // Maybe select the point too?
      // selectedPointId.set(`point-${marker.segmentIndex+1}-0`);
    }

    // 2. Pan/Zoom to location
    const fx = marker.x;
    const fy = marker.y;
    const view = $fieldViewStore;
    const factor = 2.5; // Zoom level

    // Logic from FieldRenderer.panToField
    // const factor = get(fieldZoom); // We want to set zoom
    const baseSize = Math.min(view.width, view.height);

    // Set Zoom first
    fieldZoom.set(factor);

    // Calculate Pan
    // px = baseSize * factor * (0.5 - fx / FIELD_SIZE)
    const px = baseSize * factor * (0.5 - fx / FIELD_SIZE);
    const py = baseSize * factor * (fy / FIELD_SIZE - 0.5);

    fieldPan.set({ x: px, y: py });
  }

  function formatTime(t: number) {
    return t.toFixed(2) + "s";
  }
</script>

<div class="w-full h-full flex flex-col bg-white dark:bg-neutral-900">
  <!-- Header / Summary -->
  <div
    class="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col gap-3"
  >
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold flex items-center gap-2">
        {#if isValid}
          <div class="w-2 h-2 rounded-full bg-green-500"></div>
          Path Valid
        {:else}
          <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          {totalIssues} Issues Found
        {/if}
      </h2>
      <button
        class="px-3 py-1.5 text-sm font-semibold rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition-colors"
        on:click={handleValidate}
      >
        Re-Validate
      </button>
    </div>

    <!-- Continuous Validation Toggle -->
    <label
      class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer"
    >
      <input
        type="checkbox"
        class="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 bg-neutral-100 dark:bg-neutral-800 dark:border-neutral-700"
        checked={settings.continuousValidation}
        on:change={(e) => {
          settings.continuousValidation = e.currentTarget.checked;
          recordChange("Toggle Continuous Validation");
        }}
      />
      Continuous Validation
    </label>
  </div>

  <!-- Issues List -->
  <div class="flex-1 overflow-y-auto p-4 space-y-6">
    {#if isValid}
      <div
        class="flex flex-col items-center justify-center h-full text-neutral-400 gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-12 opacity-50"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        <p>No issues detected.</p>
      </div>
    {:else}
      <!-- Obstacles -->
      {#if obstacles.length > 0}
        <div class="space-y-2">
          <h3
            class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
          >
            Obstacles ({obstacles.length})
          </h3>
          {#each obstacles as marker}
            <button
              class="w-full text-left p-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all group"
              on:click={() => focusMarker(marker)}
            >
              <div class="flex items-start gap-3">
                <div
                  class="mt-0.5 text-red-500 bg-white dark:bg-neutral-800 p-1 rounded-lg border border-red-100 dark:border-red-900/50 shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    class="size-4"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <div class="font-semibold text-red-900 dark:text-red-200">
                    Collision with {marker.obstacleName || "Unknown Obstacle"}
                  </div>
                  <div
                    class="text-xs text-red-700 dark:text-red-400 mt-1 flex gap-2"
                  >
                    <span
                      class="bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded"
                    >
                      Segment {marker.segmentIndex !== undefined
                        ? marker.segmentIndex + 1
                        : "?"}
                    </span>
                    <span
                      class="bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded"
                    >
                      {formatTime(marker.time)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}

      <!-- Boundaries -->
      {#if boundaries.length > 0}
        <div class="space-y-2">
          <h3
            class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
          >
            Field Boundaries ({boundaries.length})
          </h3>
          {#each boundaries as marker}
            <button
              class="w-full text-left p-3 rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-all group"
              on:click={() => focusMarker(marker)}
            >
              <div class="flex items-start gap-3">
                <div
                  class="mt-0.5 text-orange-500 bg-white dark:bg-neutral-800 p-1 rounded-lg border border-orange-100 dark:border-orange-900/50 shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    class="size-4"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <div
                    class="font-semibold text-orange-900 dark:text-orange-200"
                  >
                    Field Boundary Violation
                  </div>
                  <div
                    class="text-xs text-orange-700 dark:text-orange-400 mt-1 flex gap-2"
                  >
                    <span
                      class="bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded"
                    >
                      Segment {marker.segmentIndex !== undefined
                        ? marker.segmentIndex + 1
                        : "?"}
                    </span>
                    <span
                      class="bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded"
                    >
                      {formatTime(marker.time)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}

      <!-- Keep In Zones -->
      {#if keepIns.length > 0}
        <div class="space-y-2">
          <h3
            class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
          >
            Keep-In Zones ({keepIns.length})
          </h3>
          {#each keepIns as marker}
            <button
              class="w-full text-left p-3 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all group"
              on:click={() => focusMarker(marker)}
            >
              <div class="flex items-start gap-3">
                <div
                  class="mt-0.5 text-blue-500 bg-white dark:bg-neutral-800 p-1 rounded-lg border border-blue-100 dark:border-blue-900/50 shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    class="size-4"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <div class="font-semibold text-blue-900 dark:text-blue-200">
                    Outside Keep-In Zone
                  </div>
                  <div
                    class="text-xs text-blue-700 dark:text-blue-400 mt-1 flex gap-2"
                  >
                    <span
                      class="bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded"
                    >
                      Segment {marker.segmentIndex !== undefined
                        ? marker.segmentIndex + 1
                        : "?"}
                    </span>
                    <span
                      class="bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded"
                    >
                      {formatTime(marker.time)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}

      <!-- Zero Length -->
      {#if zeroLengths.length > 0}
        <div class="space-y-2">
          <h3
            class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
          >
            Warnings ({zeroLengths.length})
          </h3>
          {#each zeroLengths as marker}
            <button
              class="w-full text-left p-3 rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all group"
              on:click={() => focusMarker(marker)}
            >
              <div class="flex items-start gap-3">
                <div
                  class="mt-0.5 text-purple-500 bg-white dark:bg-neutral-800 p-1 rounded-lg border border-purple-100 dark:border-purple-900/50 shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    class="size-4"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <div
                    class="font-semibold text-purple-900 dark:text-purple-200"
                  >
                    Zero-Length Path
                  </div>
                  <div
                    class="text-xs text-purple-700 dark:text-purple-400 mt-1 flex gap-2"
                  >
                    <span
                      class="bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded"
                    >
                      Segment {marker.segmentIndex !== undefined
                        ? marker.segmentIndex + 1
                        : "?"}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>
