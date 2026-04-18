<!-- Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0. -->
<script lang="ts">
  import {
    createBubbler,
    preventDefault,
    stopPropagation,
  } from "svelte/legacy";

  const bubble = createBubbler();
  import ChevronRightIcon from "../icons/ChevronRightIcon.svelte";
  import PlusIcon from "../icons/PlusIcon.svelte";
  import TrashIcon from "../icons/TrashIcon.svelte";
  import type { Line } from "../../../types/index";

  interface Props {
    line: Line;
    lineIdx: number;
    collapsed: boolean;
  }

  let {
    line = $bindable(),
    lineIdx,
    collapsed = $bindable(),
  }: Props = $props();

  function toggleCollapsed() {
    collapsed = !collapsed;
  }

  function addEventMarker() {
    if (!line.eventMarkers) {
      line.eventMarkers = [];
    }
    line.eventMarkers.push({
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      name: `Event_${lineIdx + 1}_${line.eventMarkers.length + 1}`,
      type: "parametric",
      position: 0.5,
      time: 500,
      poseX: 0,
      poseY: 0,
      poseHeading: 0,
      poseGuess: 0.5,
      lineIndex: lineIdx,
    });
    line = { ...line }; // Force reactivity
  }

  function removeEventMarker(eventIdx: number) {
    if (line.eventMarkers) {
      line.eventMarkers.splice(eventIdx, 1);
      line = { ...line };
    }
  }

  function handleInput(e: Event, event: any) {
    const target = e.target as HTMLInputElement;
    const value = Number.parseFloat(target.value);
    if (!Number.isNaN(value)) {
      event.position = value;
      line.eventMarkers = [...line.eventMarkers!];
    }
  }

  function handleBlur(e: Event, event: any) {
    const target = e.target as HTMLInputElement;
    const value = Number.parseFloat(target.value);
    if (Number.isNaN(value) || value < 0 || value > 1) {
      // Invalid - revert to current value
      target.value = event.position.toString();
      return;
    }
    // Valid - update
    event.position = value;
    line.eventMarkers = [...line.eventMarkers!];
  }

  function handleKeydown(e: KeyboardEvent, event: any) {
    if (e.key === "Enter") {
      const target = e.target as HTMLInputElement;
      const value = Number.parseFloat(target.value);
      if (Number.isNaN(value) || value < 0 || value > 1) {
        // Invalid - revert
        target.value = event.position.toString();
        e.preventDefault();
        return;
      }
      // Valid - update
      event.position = value;
      line.eventMarkers = [...line.eventMarkers!];
      target.blur(); // Trigger blur to update
    }
  }

  function handleTypeChange(e: Event, event: any) {
    const target = e.target as HTMLSelectElement;
    event.type = target.value;
    line.eventMarkers = [...line.eventMarkers!];
  }

  function handleNumberInput(e: Event, event: any, field: string) {
    const target = e.target as HTMLInputElement;
    const value = Number.parseFloat(target.value);
    if (!Number.isNaN(value)) {
      event[field] = value;
      line.eventMarkers = [...line.eventMarkers!];
    }
  }
</script>

<div class="flex flex-col w-full justify-start items-start mt-2">
  <div class="flex items-center justify-between w-full">
    <button
      onclick={toggleCollapsed}
      aria-label="Toggle Path Event Markers"
      class="flex items-center gap-2 font-light hover:bg-neutral-200 dark:hover:bg-neutral-800 px-2 py-1 rounded transition-colors text-sm"
      title="{collapsed ? 'Show' : 'Hide'} event markers"
    >
      <ChevronRightIcon
        className="size-3 transition-transform {collapsed
          ? 'rotate-0'
          : 'rotate-90'}"
        strokeWidth={2}
      />
      Event Markers ({line.eventMarkers?.length || 0})
    </button>
    <button
      onclick={addEventMarker}
      aria-label="Add Event Marker"
      class="text-sm text-purple-500 hover:text-purple-600 flex items-center gap-1 px-2 py-1"
      title="Add Event Marker"
      disabled={line.locked}
    >
      <PlusIcon className="size-4" strokeWidth={2} />
      Add Marker
    </button>
  </div>

  {#if !collapsed && line.eventMarkers && line.eventMarkers.length > 0}
    <div class="w-full mt-2 space-y-2">
      {#each line.eventMarkers as event, eventIdx}
        <div
          class="flex flex-col p-2 border border-purple-300 dark:border-purple-700 rounded-md bg-purple-50 dark:bg-purple-900/20"
        >
          <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div class="flex items-center gap-2 flex-1 min-w-[150px]">
              <div class="w-3 h-3 rounded-full bg-purple-500 shrink-0"></div>
              <input
                bind:value={event.name}
                class="pl-1.5 rounded-md bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm w-full min-w-[100px]"
                placeholder="Event name"
                aria-label="Event name"
                disabled={line.locked}
                onchange={() => {
                  // Update the array to trigger reactivity
                  if (line.eventMarkers)
                    line.eventMarkers = [...line.eventMarkers];
                }}
              />
            </div>

            <select
              class="rounded-md bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs py-1 px-2"
              value={event.type || "parametric"}
              onchange={(e) => handleTypeChange(e, event)}
              disabled={line.locked}
            >
              <option value="parametric">Parametric</option>
              <option value="temporal">Temporal</option>
              <option value="pose">Pose</option>
            </select>

            <!-- Event delete Button -->

            <button
              onclick={() => removeEventMarker(eventIdx)}
              class="text-red-500 hover:text-red-600 ml-auto"
              title="Remove Event Marker"
              aria-label="Remove Event Marker"
              disabled={line.locked}
            >
              <TrashIcon className="size-4" strokeWidth={2} />
            </button>
          </div>

          <!-- Type-specific Configuration -->
          {#if !event.type || event.type === 'parametric'}
            <div class="flex items-center gap-2 flex-wrap w-full">
              <span class="text-xs text-neutral-600 dark:text-neutral-400"
                >Position:</span
              >
              <div class="flex flex-1 items-center gap-2 min-w-[200px]">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={event.position}
                  class="flex-1 slider"
                  aria-label="Event position"
                  data-event-marker-slider
                  disabled={line.locked}
                  ondragstart={stopPropagation(
                    preventDefault(bubble("dragstart")),
                  )}
                  oninput={(e) => handleInput(e, event)}
                />
                <input
                  type="number"
                  value={event.position}
                  aria-label="Event position value"
                  disabled={line.locked}
                  min="0"
                  max="1"
                  step="0.01"
                  class="w-16 px-2 py-1 text-xs rounded-md bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  oninput={(e) => {}}
                  onblur={(e) => handleBlur(e, event)}
                  onkeydown={(e) => handleKeydown(e, event)}
                />
              </div>
            </div>
            <div class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Line {lineIdx + 1}, Position: {event.position.toFixed(2)}
            </div>
          {:else if event.type === 'temporal'}
            <div class="flex items-center gap-2 flex-wrap w-full mt-1">
              <span class="text-xs text-neutral-600 dark:text-neutral-400 min-w-[40px]"
                >Time (ms):</span
              >
              <input
                type="number"
                value={event.time ?? 500}
                aria-label="Event time in milliseconds"
                disabled={line.locked}
                min="0"
                step="1"
                class="flex-1 px-2 py-1 text-xs rounded-md bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                onchange={(e) => handleNumberInput(e, event, "time")}
              />
            </div>
          {:else if event.type === 'pose'}
            <div class="grid grid-cols-2 gap-2 w-full mt-1">
              <div class="flex items-center gap-2">
                <span class="text-xs text-neutral-600 dark:text-neutral-400 w-4">X:</span>
                <input
                  type="number"
                  value={event.poseX ?? 0}
                  aria-label="Event Pose X"
                  disabled={line.locked}
                  step="0.1"
                  class="w-full px-2 py-1 text-xs rounded-md bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  onchange={(e) => handleNumberInput(e, event, "poseX")}
                />
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-neutral-600 dark:text-neutral-400 w-4">Y:</span>
                <input
                  type="number"
                  value={event.poseY ?? 0}
                  aria-label="Event Pose Y"
                  disabled={line.locked}
                  step="0.1"
                  class="w-full px-2 py-1 text-xs rounded-md bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  onchange={(e) => handleNumberInput(e, event, "poseY")}
                />
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-neutral-600 dark:text-neutral-400 w-4" title="Heading (deg)">H:</span>
                <input
                  type="number"
                  value={event.poseHeading ?? 0}
                  aria-label="Event Pose Heading"
                  disabled={line.locked}
                  step="1"
                  class="w-full px-2 py-1 text-xs rounded-md bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  onchange={(e) => handleNumberInput(e, event, "poseHeading")}
                />
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-neutral-600 dark:text-neutral-400 w-4" title="Guess (0-1)">G:</span>
                <input
                  type="number"
                  value={event.poseGuess ?? 0.5}
                  aria-label="Event Pose Guess"
                  disabled={line.locked}
                  min="0"
                  max="1"
                  step="0.01"
                  class="w-full px-2 py-1 text-xs rounded-md bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  onchange={(e) => handleNumberInput(e, event, "poseGuess")}
                />
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
