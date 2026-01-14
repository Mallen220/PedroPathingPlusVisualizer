<!-- Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0. -->
<script lang="ts">
  import type { EventMarker } from "../../types";
  import TrashIcon from "./icons/TrashIcon.svelte";

  export let markers: EventMarker[] | undefined = [];
  export let collapsed: boolean = false;
  export let recordChange: () => void;
  export let locked: boolean = false;

  function toggleCollapsed() {
    collapsed = !collapsed;
  }

  function addMarker() {
    if (locked) return;
    const newMarker: EventMarker = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: "New Event",
      position: 0.5,
      type: "default",
    };
    if (!markers) markers = [];
    markers = [...markers, newMarker];
    recordChange();
    collapsed = false; // Auto-expand when adding
  }

  function removeMarker(index: number) {
    if (locked || !markers) return;
    const newMarkers = [...markers];
    newMarkers.splice(index, 1);
    markers = newMarkers;
    recordChange();
  }

  function updateMarker(index: number, updates: Partial<EventMarker>) {
    if (locked || !markers) return;
    const newMarkers = [...markers];
    newMarkers[index] = { ...newMarkers[index], ...updates };
    markers = newMarkers;
    recordChange();
  }

  function handleTypeChange(index: number, event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    updateMarker(index, {
      type: select.value as "default" | "intake" | "score" | "custom",
    });
  }
</script>

<div class="flex flex-col w-full justify-start items-start">
  <!-- Header -->
  <div class="flex items-center justify-between w-full py-1">
    <button
      on:click={toggleCollapsed}
      class="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide hover:text-neutral-800 dark:hover:text-neutral-300 transition-colors"
      title="{collapsed ? 'Show' : 'Hide'} event markers"
      aria-expanded={!collapsed}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width={2.5}
        stroke="currentColor"
        class="size-3 transition-transform duration-200 {collapsed
          ? '-rotate-90'
          : 'rotate-0'}"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="m19.5 8.25-7.5 7.5-7.5-7.5"
        />
      </svg>
      Event Markers ({markers?.length || 0})
    </button>

    <button
      on:click={addMarker}
      class="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded transition-colors"
      title="Add Event Marker"
      disabled={locked}
      aria-label="Add Event Marker"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width={2.5}
        stroke="currentColor"
        class="size-3"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 4.5v15m7.5-7.5h-15"
        />
      </svg>
      Add
    </button>
  </div>

  <!-- List -->
  {#if !collapsed && markers && markers.length > 0}
    <div class="w-full mt-2 space-y-2">
      {#each markers as marker, idx (marker.id)}
        <div
          class="flex flex-col gap-2 p-2 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50/50 dark:bg-purple-900/10 transition-all duration-200"
        >
          <!-- Top Row: Name, Type, Delete -->
          <div class="flex items-center gap-2">
            <!-- Type Indicator / Selector -->
            <div class="relative group">
              <div
                class="w-3 h-3 rounded-full cursor-pointer transition-colors"
                style={marker.type === "intake"
                  ? "background-color: #22c55e"
                  : marker.type === "score"
                    ? "background-color: #eab308"
                    : marker.type === "custom"
                      ? "background-color: #3b82f6"
                      : "background-color: #a855f7"}
                title="Change Type"
              ></div>
              <select
                class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                value={marker.type || "default"}
                on:change={(e) => handleTypeChange(idx, e)}
                disabled={locked}
                aria-label="Marker type"
              >
                <option value="default">Default (Purple)</option>
                <option value="intake">Intake (Green)</option>
                <option value="score">Score (Gold)</option>
                <option value="custom">Custom (Blue)</option>
              </select>
            </div>

            <!-- Name Input -->
            <input
              type="text"
              value={marker.name}
              placeholder="Event Name"
              class="flex-1 min-w-0 text-sm bg-transparent border-b border-transparent hover:border-purple-300 focus:border-purple-500 outline-none transition-colors px-1"
              on:change={(e) =>
                updateMarker(idx, { name: e.currentTarget.value })}
              disabled={locked}
              aria-label="Marker name"
            />

            <!-- Delete Button -->
            <button
              on:click={() => removeMarker(idx)}
              class="text-neutral-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Remove Marker"
              aria-label="Remove Marker"
              disabled={locked}
            >
              <TrashIcon className="size-3.5" strokeWidth={2} />
            </button>
          </div>

          <!-- Bottom Row: Position Slider & Input -->
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold text-neutral-400 select-none"
              >Pos</span
            >
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={marker.position}
              class="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              on:input={(e) =>
                updateMarker(idx, {
                  position: parseFloat(e.currentTarget.value),
                })}
              disabled={locked}
              aria-label="Marker position slider"
            />
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={parseFloat(marker.position.toFixed(2))}
              class="w-12 px-1 py-0.5 text-xs text-center rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
              on:change={(e) =>
                updateMarker(idx, {
                  position: parseFloat(e.currentTarget.value),
                })}
              disabled={locked}
              aria-label="Marker position value"
            />
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
