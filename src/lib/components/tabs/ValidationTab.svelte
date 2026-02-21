<!-- Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0. -->
<script lang="ts">
  import { get } from "svelte/store";
  import {
    collisionMarkers,
    fieldZoom,
    fieldPan,
    fieldViewStore,
    selectedLineId,
    selectedPointId,
  } from "../../../stores";
  import { settingsStore } from "../../projectStore";
  import { validatePath } from "../../../utils/validation";
  import type {
    Line,
    Point,
    SequenceItem,
    Shape,
    Settings,
    CollisionMarker,
  } from "../../../types/index";
  import { FIELD_SIZE } from "../../../config";

  export let startPoint: Point;
  export let lines: Line[];
  export let sequence: SequenceItem[];
  export let shapes: Shape[];
  export let settings: Settings;

  $: markers = $collisionMarkers;
  $: issueCount = markers.length;

  function handleValidate() {
    validatePath(startPoint, lines, settings, sequence, shapes);
  }

  function toggleContinuous() {
    settings.continuousValidation = !settings.continuousValidation;
    // recordChange("Toggle Continuous Validation"); // Maybe overkill?
  }

  function focusIssue(marker: CollisionMarker) {
    // 1. Zoom to location
    const factor = 2.0; // Zoom level
    const width = $fieldViewStore.width;
    const height = $fieldViewStore.height;
    const baseSize = Math.min(width, height);

    // Calculate required pan to center the point (logic from FieldRenderer.panToField)
    // x(v) = center + pan + (v/SIZE - 0.5)*baseSize*zoom
    // target x(v) = center => pan = - (v/SIZE - 0.5)*baseSize*zoom
    const px = baseSize * factor * (0.5 - marker.x / FIELD_SIZE);
    const py = baseSize * factor * (marker.y / FIELD_SIZE - 0.5);

    fieldZoom.set(factor);
    fieldPan.set({ x: px, y: py });

    // 2. Select Segment
    if (marker.segmentIndex !== undefined && lines[marker.segmentIndex]) {
      const line = lines[marker.segmentIndex];
      if (line.id) {
        selectedLineId.set(line.id);
        // Maybe select point?
        // selectedPointId.set(...)
      }
    } else if (marker.segmentIndex === undefined && lines.length > 0) {
      // Start point issue?
      selectedLineId.set(null);
      selectedPointId.set("point-0-0");
    }
  }

  function getIssueTitle(marker: CollisionMarker): string {
    switch (marker.type) {
      case "obstacle":
        return marker.obstacleName
          ? `Collision with "${marker.obstacleName}"`
          : "Obstacle Collision";
      case "boundary":
        return "Field Boundary Violation";
      case "keep-in":
        return "Outside Keep-In Zone";
      case "zero-length":
        return "Zero-Length Path Segment";
      default:
        return "Unknown Issue";
    }
  }

  function getIssueDescription(marker: CollisionMarker): string {
    let parts = [];
    if (marker.segmentIndex !== undefined) {
      const line = lines[marker.segmentIndex];
      const name = line?.name || `Path ${marker.segmentIndex + 1}`;
      parts.push(`Segment: ${name}`);
    } else {
      parts.push("Start Position");
    }

    const timeStr = marker.time.toFixed(2) + "s";
    if (marker.endTime && marker.endTime > marker.time) {
      parts.push(`Time: ${timeStr} - ${marker.endTime.toFixed(2)}s`);
    } else {
      parts.push(`Time: ${timeStr}`);
    }

    return parts.join(" • ");
  }

  function getIcon(type?: string) {
    switch (type) {
      case "obstacle":
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-5 h-5 text-red-500"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;
      case "boundary":
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-5 h-5 text-orange-500"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4l16 16M20 4L4 20"/></svg>`;
      case "keep-in":
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-5 h-5 text-blue-500"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
      case "zero-length":
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-5 h-5 text-purple-500"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
      default:
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-5 h-5 text-gray-500"><circle cx="12" cy="12" r="10" stroke-width="2"/></svg>`;
    }
  }
</script>

<div class="w-full h-full flex flex-col bg-neutral-50 dark:bg-neutral-900">
  <!-- Header / Summary -->
  <div
    class="flex-none p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800"
  >
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-lg font-bold text-neutral-800 dark:text-neutral-100">
        Validation Report
      </h2>
      <div class="flex items-center gap-2">
        <label
          class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer select-none"
        >
          <input
            type="checkbox"
            bind:checked={settings.continuousValidation}
            class="rounded border-neutral-300 text-purple-600 focus:ring-purple-500"
          />
          Auto-Check
        </label>
        {#if !settings.continuousValidation}
          <button
            on:click={handleValidate}
            class="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Check Now
          </button>
        {/if}
      </div>
    </div>

    {#if issueCount === 0}
      <div
        class="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          class="w-5 h-5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span class="font-semibold">No issues found. Path is valid!</span>
      </div>
    {:else}
      <div
        class="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          class="w-5 h-5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span class="font-semibold"
          >{issueCount} Issue{issueCount === 1 ? "" : "s"} Found</span
        >
      </div>
    {/if}
  </div>

  <!-- Issues List -->
  <div class="flex-1 overflow-y-auto p-4 space-y-3">
    {#each markers as marker}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer group"
        on:click={() => focusIssue(marker)}
      >
        <div class="flex items-start gap-3">
          <div
            class="flex-none p-2 bg-neutral-100 dark:bg-neutral-900 rounded-full"
          >
            {@html getIcon(marker.type)}
          </div>
          <div class="flex-1 min-w-0">
            <h3
              class="font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
            >
              {getIssueTitle(marker)}
            </h3>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {getIssueDescription(marker)}
            </p>
            {#if marker.type === "obstacle" || marker.type === "boundary" || marker.type === "keep-in"}
              <div
                class="mt-2 text-xs text-neutral-400 flex items-center gap-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  class="w-3 h-3"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                Click to Focus
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
