<!-- Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0. -->
<script lang="ts">
  import { get } from "svelte/store";
  import {
    collisionMarkers,
    fieldViewStore,
    fieldPan,
    fieldZoom,
    selectedLineId,
    selectedPointId,
  } from "../../../stores";
  import { settingsStore } from "../../projectStore";
  import type {
    CollisionMarker,
    Line,
    Point,
    SequenceItem,
    Settings,
    Shape,
  } from "../../../types/index";
  import { validatePath } from "../../../utils/validation";
  import { FIELD_SIZE } from "../../../config";

  export let startPoint: Point;
  export let lines: Line[];
  export let sequence: SequenceItem[];
  export let shapes: Shape[];
  export let settings: Settings;
  export let isActive: boolean = false;

  // Re-run validation manually
  function handleValidate() {
    validatePath(startPoint, lines, settings, sequence, shapes);
  }

  function focusIssue(marker: CollisionMarker) {
    // 1. Select the segment
    if (marker.segmentIndex !== undefined) {
      const line = lines[marker.segmentIndex];
      if (line && line.id) {
        selectedLineId.set(line.id);
        // Maybe select the end point as a default focus
        selectedPointId.set(`point-${marker.segmentIndex + 1}-0`);
      } else if (marker.segmentIndex === -1) {
        // Start point issue?
        selectedLineId.set(null);
        selectedPointId.set("point-0-0");
      }
    }

    // 2. Pan and Zoom to the issue
    // We want to center the view on marker.x, marker.y
    // Logic adapted from FieldRenderer.svelte panToField
    const view = get(fieldViewStore);
    if (view.width > 0 && view.height > 0) {
      // Zoom in a bit if too far out, or stay if already zoomed in?
      // Let's ensure at least 1.5x zoom so the user can see details
      let currentZoom = get(fieldZoom);
      if (currentZoom < 1.5) {
        fieldZoom.set(1.5);
        currentZoom = 1.5;
      }

      const baseSize = Math.min(view.width, view.height);
      const factor = currentZoom;

      // Calculate required pan to center the point
      // x(v) = center + pan + (v/SIZE - 0.5)*baseSize*zoom
      // target x(v) = center => pan = - (v/SIZE - 0.5)*baseSize*zoom
      const px = baseSize * factor * (0.5 - marker.x / FIELD_SIZE);
      const py = baseSize * factor * (marker.y / FIELD_SIZE - 0.5);

      fieldPan.set({ x: px, y: py });
    }
  }

  $: markers = $collisionMarkers;
  $: issueCount = markers.length;
  $: obstacleCount = markers.filter((m) => m.type === "obstacle").length;
  $: boundaryCount = markers.filter((m) => m.type === "boundary").length;
  $: keepInCount = markers.filter((m) => m.type === "keep-in").length;
  $: zeroLengthCount = markers.filter((m) => m.type === "zero-length").length;

  $: statusColor =
    issueCount === 0
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
  $: statusBg =
    issueCount === 0
      ? "bg-green-100 dark:bg-green-900/20"
      : "bg-red-100 dark:bg-red-900/20";
  $: statusBorder =
    issueCount === 0
      ? "border-green-200 dark:border-green-800"
      : "border-red-200 dark:border-red-800";
</script>

<div class="flex flex-col h-full w-full">
  <!-- Header / Summary -->
  <div
    class="p-4 flex-none border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 z-10 sticky top-0"
  >
    <div
      class={`p-4 rounded-xl border ${statusBg} ${statusBorder} flex items-center justify-between mb-4`}
    >
      <div class="flex items-center gap-3">
        {#if issueCount === 0}
          <div
            class="p-2 bg-green-200 dark:bg-green-800 rounded-full text-green-700 dark:text-green-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h3 class="font-bold text-lg text-green-800 dark:text-green-100">
              All Good!
            </h3>
            <p class="text-sm text-green-700 dark:text-green-200">
              No issues detected.
            </p>
          </div>
        {:else}
          <div
            class="p-2 bg-red-200 dark:bg-red-800 rounded-full text-red-700 dark:text-red-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 class="font-bold text-lg text-red-800 dark:text-red-100">
              {issueCount} Issues Found
            </h3>
            <div
              class="flex gap-2 text-xs font-medium text-red-700 dark:text-red-200 mt-0.5"
            >
              {#if obstacleCount > 0}<span>{obstacleCount} Obstacle</span>{/if}
              {#if boundaryCount > 0}<span>{boundaryCount} Boundary</span>{/if}
              {#if keepInCount > 0}<span>{keepInCount} Keep-In</span>{/if}
              {#if zeroLengthCount > 0}<span>{zeroLengthCount} Zero-Length</span
                >{/if}
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="flex items-center justify-between">
      <label
        class="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 cursor-pointer select-none"
      >
        <input
          type="checkbox"
          bind:checked={settings.continuousValidation}
          class="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
        />
        Continuous Validation
      </label>

      <button
        on:click={handleValidate}
        class="px-3 py-1.5 text-sm font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Re-Check
      </button>
    </div>
  </div>

  <!-- Issues List -->
  <div class="flex-1 overflow-y-auto p-4 space-y-3">
    {#each markers as marker, i}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 hover:border-purple-400 dark:hover:border-purple-500 cursor-pointer transition-all shadow-sm group"
        on:click={() => focusIssue(marker)}
      >
        <div class="flex items-start gap-3">
          <!-- Icon based on type -->
          <div class="flex-none mt-0.5">
            {#if marker.type === "obstacle"}
              <div
                class="text-red-500 bg-red-100 dark:bg-red-900/30 p-1.5 rounded-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            {:else if marker.type === "boundary"}
              <div
                class="text-orange-500 bg-orange-100 dark:bg-orange-900/30 p-1.5 rounded-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            {:else if marker.type === "keep-in"}
              <div
                class="text-blue-500 bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            {:else}
              <div
                class="text-purple-500 bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            {/if}
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <h4
                class="text-sm font-semibold text-neutral-900 dark:text-neutral-100"
              >
                {#if marker.type === "obstacle"}
                  Collision with {marker.obstacleName || "Obstacle"}
                {:else if marker.type === "boundary"}
                  Field Boundary Violation
                {:else if marker.type === "keep-in"}
                  Keep-In Zone Violation
                {:else if marker.type === "zero-length"}
                  Zero-Length Segment
                {:else}
                  Validation Issue
                {/if}
              </h4>
            </div>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {#if typeof marker.segmentIndex === "number" && marker.segmentIndex >= 0}
                Segment {marker.segmentIndex + 1}
              {:else}
                Unknown Location
              {/if}
              &bull; Time: {marker.time.toFixed(2)}s
            </p>
            <p
              class="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 font-mono"
            >
              X: {marker.x.toFixed(1)}", Y: {marker.y.toFixed(1)}"
            </p>
          </div>

          <div
            class="self-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <span
              class="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded"
            >
              Focus
            </span>
          </div>
        </div>
      </div>
    {/each}

    {#if markers.length > 0}
      <div
        class="text-center text-xs text-neutral-400 dark:text-neutral-600 pt-4 pb-2"
      >
        Click an issue to locate it on the field.
      </div>
    {/if}
  </div>
</div>
