<!-- Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0. -->
<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import { get } from "svelte/store";
  import { startPointStore, linesStore, shapesStore } from "../../projectStore";
  import { FIELD_SIZE } from "../../../config";

  export let isOpen = false;
  export let recordChange: (action?: string) => void;

  let activeTab: "translate" | "rotate" = "translate";

  // Translate State
  let deltaX = 0;
  let deltaY = 0;

  // Rotate State
  let rotateAngle = 90;
  let rotatePivot: "center" | "origin" | "start" = "center";

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && isOpen) {
      isOpen = false;
    }
  }

  function applyTranslate() {
    if (deltaX === 0 && deltaY === 0) return;

    const startPoint = get(startPointStore);
    const lines = get(linesStore);
    const shapes = get(shapesStore);

    // Update Start Point
    startPointStore.update((sp) => ({
      ...sp,
      x: sp.x + deltaX,
      y: sp.y + deltaY,
    }));

    // Update Lines
    linesStore.update((ls) =>
      ls.map((l) => ({
        ...l,
        endPoint: {
          ...l.endPoint,
          x: l.endPoint.x + deltaX,
          y: l.endPoint.y + deltaY,
        },
        controlPoints: l.controlPoints.map((cp) => ({
          ...cp,
          x: cp.x + deltaX,
          y: cp.y + deltaY,
        })),
      })),
    );

    // Update Shapes
    shapesStore.update((ss) =>
      ss.map((s) => ({
        ...s,
        vertices: s.vertices.map((v) => ({
          ...v,
          x: v.x + deltaX,
          y: v.y + deltaY,
        })),
      })),
    );

    recordChange(`Translate Path (${deltaX}, ${deltaY})`);
    isOpen = false;
    deltaX = 0;
    deltaY = 0;
  }

  function applyRotate() {
    if (rotateAngle === 0) return;

    const startPoint = get(startPointStore);
    const lines = get(linesStore);
    const shapes = get(shapesStore);

    let pivotX = 0;
    let pivotY = 0;

    if (rotatePivot === "center") {
      pivotX = FIELD_SIZE / 2;
      pivotY = FIELD_SIZE / 2;
    } else if (rotatePivot === "start") {
      pivotX = startPoint.x;
      pivotY = startPoint.y;
    }
    // origin is 0,0

    const rad = (rotateAngle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const rotatePoint = (x: number, y: number) => {
      const dx = x - pivotX;
      const dy = y - pivotY;
      return {
        x: pivotX + dx * cos - dy * sin,
        y: pivotY + dx * sin + dy * cos,
      };
    };

    // Update Start Point
    const newSp = rotatePoint(startPoint.x, startPoint.y);
    let newHeading = startPoint.heading;
    let newDegrees = startPoint.degrees;
    let newStartDeg = startPoint.startDeg;
    let newEndDeg = startPoint.endDeg;

    // Adjust heading
    if (
      startPoint.heading === "constant" &&
      typeof startPoint.degrees === "number"
    ) {
      newDegrees = (startPoint.degrees + rotateAngle) % 360;
    } else if (
      startPoint.heading === "linear" &&
      typeof startPoint.startDeg === "number" &&
      typeof startPoint.endDeg === "number"
    ) {
      newStartDeg = (startPoint.startDeg + rotateAngle) % 360;
      newEndDeg = (startPoint.endDeg + rotateAngle) % 360;
    }
    // Tangential headings are relative to path derivative, so they rotate automatically if control points rotate?
    // Tangential means "follow the path". If the path rotates, the tangent rotates. So no extra param change needed for tangential.

    startPointStore.update((sp) => ({
      ...sp,
      x: newSp.x,
      y: newSp.y,
      degrees: newDegrees,
      startDeg: newStartDeg,
      endDeg: newEndDeg,
    }));

    // Update Lines
    linesStore.update((ls) =>
      ls.map((l) => {
        const newEp = rotatePoint(l.endPoint.x, l.endPoint.y);
        const newCps = l.controlPoints.map((cp) => {
          const p = rotatePoint(cp.x, cp.y);
          return { ...cp, x: p.x, y: p.y };
        });

        // Update line heading properties if necessary
        let lDegrees = l.endPoint.degrees;
        let lStartDeg = l.endPoint.startDeg;
        let lEndDeg = l.endPoint.endDeg;

        if (
          l.endPoint.heading === "constant" &&
          typeof l.endPoint.degrees === "number"
        ) {
          lDegrees = (l.endPoint.degrees + rotateAngle) % 360;
        } else if (
          l.endPoint.heading === "linear" &&
          typeof l.endPoint.startDeg === "number" &&
          typeof l.endPoint.endDeg === "number"
        ) {
          lStartDeg = (l.endPoint.startDeg + rotateAngle) % 360;
          lEndDeg = (l.endPoint.endDeg + rotateAngle) % 360;
        }

        return {
          ...l,
          endPoint: {
            ...l.endPoint,
            x: newEp.x,
            y: newEp.y,
            degrees: lDegrees,
            startDeg: lStartDeg,
            endDeg: lEndDeg,
          },
          controlPoints: newCps,
        };
      }),
    );

    // Update Shapes
    shapesStore.update((ss) =>
      ss.map((s) => ({
        ...s,
        vertices: s.vertices.map((v) => {
          const p = rotatePoint(v.x, v.y);
          return { ...v, x: p.x, y: p.y };
        }),
      })),
    );

    recordChange(`Rotate Path (${rotateAngle} deg)`);
    isOpen = false;
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div
    transition:fade={{ duration: 200, easing: cubicInOut }}
    class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
  >
    <div
      transition:fly={{ y: 20, duration: 300, easing: cubicInOut }}
      class="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-md overflow-hidden"
    >
      <!-- Header -->
      <div
        class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50"
      >
        <h2 class="text-lg font-bold text-neutral-900 dark:text-white">
          Transform Path
        </h2>
        <button
          on:click={() => (isOpen = false)}
          class="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="size-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-neutral-200 dark:border-neutral-800">
        <button
          class="flex-1 py-3 text-sm font-medium transition-colors border-b-2 {activeTab ===
          'translate'
            ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10'
            : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'}"
          on:click={() => (activeTab = "translate")}
        >
          Translate
        </button>
        <button
          class="flex-1 py-3 text-sm font-medium transition-colors border-b-2 {activeTab ===
          'rotate'
            ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10'
            : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'}"
          on:click={() => (activeTab = "rotate")}
        >
          Rotate
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        {#if activeTab === "translate"}
          <div class="space-y-4">
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Shift the entire path and all obstacles by a set amount.
            </p>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  for="delta-x"
                  class="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1"
                  >Delta X (in)</label
                >
                <input
                  id="delta-x"
                  type="number"
                  bind:value={deltaX}
                  class="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label
                  for="delta-y"
                  class="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1"
                  >Delta Y (in)</label
                >
                <input
                  id="delta-y"
                  type="number"
                  bind:value={deltaY}
                  class="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        {:else}
          <div class="space-y-4">
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Rotate the entire path and obstacles around a pivot point.
            </p>

            <div>
              <label
                for="rotate-angle"
                class="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1"
                >Angle (degrees, CCW)</label
              >
              <input
                id="rotate-angle"
                type="number"
                bind:value={rotateAngle}
                class="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div class="flex gap-2 mt-2">
                {#each [90, 180, 270, -90] as ang}
                  <button
                    class="px-2 py-1 text-xs rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    on:click={() => (rotateAngle = ang)}
                  >
                    {ang}°
                  </button>
                {/each}
              </div>
            </div>

            <div>
              <label
                for="rotate-pivot"
                class="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1"
                >Pivot Point</label
              >
              <select
                id="rotate-pivot"
                bind:value={rotatePivot}
                class="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="center">Field Center (72, 72)</option>
                <option value="origin">Origin (0, 0)</option>
                <option value="start">Start Point</option>
              </select>
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div
        class="px-6 py-4 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3"
      >
        <button
          on:click={() => (isOpen = false)}
          class="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          on:click={activeTab === "translate" ? applyTranslate : applyRotate}
          class="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
        >
          Apply {activeTab === "translate" ? "Translation" : "Rotation"}
        </button>
      </div>
    </div>
  </div>
{/if}
