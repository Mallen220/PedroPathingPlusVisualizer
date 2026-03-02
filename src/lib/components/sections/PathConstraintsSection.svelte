<!-- Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0. -->
<script lang="ts">
  import type { Line } from "../../../types/index";

  export let line: Line;
  export let lineIdx: number;
  export let collapsed: boolean;
  export let recordChange: () => void;

  function toggleCollapsed() {
    collapsed = !collapsed;
  }

  // Initialize constraints if it doesn't exist
  $: if (!line.constraints) {
    line.constraints = {};
  }

  function handleInput(
    e: Event,
    field: keyof NonNullable<Line["constraints"]>,
  ) {
    const target = e.target as HTMLInputElement;
    const val = target.value;

    if (!line.constraints) line.constraints = {};

    if (val === "") {
      delete line.constraints[field];
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        line.constraints[field] = num;
      }
    }

    // Trigger reactivity
    line = { ...line };
    recordChange();
  }
</script>

<div class="flex flex-col w-full justify-start items-start">
  <!-- Constraints header with toggle button -->
  <div class="flex items-center justify-between w-full py-1">
    <button
      on:click={toggleCollapsed}
      class="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide hover:text-neutral-800 dark:hover:text-neutral-300 transition-colors"
      title="{collapsed ? 'Show' : 'Hide'} constraints"
      aria-expanded={!collapsed}
      aria-controls="constraints-list-{lineIdx}"
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
      Constraints
    </button>
  </div>

  <!-- Constraints list (shown when expanded) -->
  {#if !collapsed}
    <div
      id="constraints-list-{lineIdx}"
      class="w-full mt-2 grid grid-cols-1 md:grid-cols-2 gap-2"
    >
      <!-- T-Value Constraint -->
      <div
        class="flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900/50"
      >
        <div class="flex-1 flex flex-col gap-1">
          <div class="flex justify-between items-center">
            <label
              for="constraint-tvalue-{lineIdx}"
              class="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1"
            >
              T-Value
              <span
                class="text-neutral-400 hover:text-blue-500 cursor-help"
                title="Sets the path's parametric end criteria (0.0 to 1.0). Decrease if the robot gets stuck at the end of a path."
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-3.5"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                  /></svg
                >
              </span>
            </label>
          </div>
          <input
            id="constraint-tvalue-{lineIdx}"
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={line.constraints?.tValue ?? ""}
            on:input={(e) => handleInput(e, "tValue")}
            disabled={line.locked}
            placeholder="Default (1.0)"
            class="w-full px-2 py-1 text-xs rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <!-- Velocity Constraint -->
      <div
        class="flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900/50"
      >
        <div class="flex-1 flex flex-col gap-1">
          <div class="flex justify-between items-center">
            <label
              for="constraint-velocity-{lineIdx}"
              class="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1"
            >
              Velocity
              <span
                class="text-neutral-400 hover:text-blue-500 cursor-help"
                title="Sets the velocity (in/s) the robot must be below for this path to be considered complete."
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-3.5"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                  /></svg
                >
              </span>
            </label>
          </div>
          <input
            id="constraint-velocity-{lineIdx}"
            type="number"
            min="0"
            step="0.1"
            value={line.constraints?.velocity ?? ""}
            on:input={(e) => handleInput(e, "velocity")}
            disabled={line.locked}
            placeholder="Default"
            class="w-full px-2 py-1 text-xs rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <!-- Timeout Constraint -->
      <div
        class="flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900/50"
      >
        <div class="flex-1 flex flex-col gap-1">
          <div class="flex justify-between items-center">
            <label
              for="constraint-timeout-{lineIdx}"
              class="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1"
            >
              Timeout (ms)
              <span
                class="text-neutral-400 hover:text-blue-500 cursor-help"
                title="Sets how long the follower has to correct after stopping. Increase to improve accuracy, decrease to reduce wait time between paths. Try decreasing if robot gets stuck."
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-3.5"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                  /></svg
                >
              </span>
            </label>
          </div>
          <input
            id="constraint-timeout-{lineIdx}"
            type="number"
            min="0"
            step="10"
            value={line.constraints?.timeout ?? ""}
            on:input={(e) => handleInput(e, "timeout")}
            disabled={line.locked}
            placeholder="Default"
            class="w-full px-2 py-1 text-xs rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <!-- Translational Constraint -->
      <div
        class="flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900/50"
      >
        <div class="flex-1 flex flex-col gap-1">
          <div class="flex justify-between items-center">
            <label
              for="constraint-translational-{lineIdx}"
              class="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1"
            >
              Translational
              <span
                class="text-neutral-400 hover:text-blue-500 cursor-help"
                title="Sets the maximum amount of translational error allowed for this path to be considered complete."
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-3.5"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                  /></svg
                >
              </span>
            </label>
          </div>
          <input
            id="constraint-translational-{lineIdx}"
            type="number"
            min="0"
            step="0.1"
            value={line.constraints?.translational ?? ""}
            on:input={(e) => handleInput(e, "translational")}
            disabled={line.locked}
            placeholder="Default"
            class="w-full px-2 py-1 text-xs rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <!-- Heading Constraint -->
      <div
        class="flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900/50"
      >
        <div class="flex-1 flex flex-col gap-1">
          <div class="flex justify-between items-center">
            <label
              for="constraint-heading-{lineIdx}"
              class="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1"
            >
              Heading
              <span
                class="text-neutral-400 hover:text-blue-500 cursor-help"
                title="Sets the maximum amount of heading error allowed for this path to be considered complete."
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-3.5"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                  /></svg
                >
              </span>
            </label>
          </div>
          <input
            id="constraint-heading-{lineIdx}"
            type="number"
            min="0"
            step="0.1"
            value={line.constraints?.heading ?? ""}
            on:input={(e) => handleInput(e, "heading")}
            disabled={line.locked}
            placeholder="Default"
            class="w-full px-2 py-1 text-xs rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  {/if}
</div>
