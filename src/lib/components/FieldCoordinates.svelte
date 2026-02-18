<!-- Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0. -->
<script lang="ts">
  export let x: number;
  export let y: number;
  export let visible: boolean = true;
  export let isObstructed: boolean = false;
  export let isSnapping: boolean = true;

  $: positionClass = isObstructed ? "top-2 right-2" : "bottom-2 left-2";
</script>

{#if visible}
  <div
    class="absolute {positionClass} bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-sm border border-neutral-200 dark:border-neutral-700 z-50 pointer-events-none select-none transition-opacity duration-200 flex flex-col gap-1 items-start"
    role="status"
    aria-label="Field Coordinates"
  >
    <div
      class="flex flex-row gap-3 text-xs font-mono text-neutral-600 dark:text-neutral-400"
    >
      <span class="flex gap-1">
        <span class="font-bold text-neutral-800 dark:text-neutral-200">X:</span>
        <span>{(x || 0).toFixed(1)}"</span>
      </span>
      <span class="flex gap-1">
        <span class="font-bold text-neutral-800 dark:text-neutral-200">Y:</span>
        <span>{(y || 0).toFixed(1)}"</span>
      </span>
    </div>

    <!-- Snapping Indicator -->
    <div
      class="flex items-center gap-1.5 text-[10px] font-medium transition-colors {isSnapping
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-neutral-400 dark:text-neutral-500'}"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="size-3"
      >
        <path
          fill-rule="evenodd"
          d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436h.684a.75.75 0 0 1 0 1.5h-2.25a.75.75 0 0 1-.75-.75v-2.25a.75.75 0 0 1 1.5 0v.684a12.427 12.427 0 0 0 4.603-6.417c-2.191-.06-4.226.34-6.046 1.103-.13.054-.257.11-.386.164a7.5 7.5 0 0 1-4.293 0c-.122-.052-.243-.105-.366-.156a12.434 12.434 0 0 0-6.053-1.108c3.068 3.793 4.135 8.8 2.879 13.314a.75.75 0 0 1-1.442-.42c1.077-3.871.166-8.152-2.455-11.408a.75.75 0 0 1 .533-1.229 12.433 12.433 0 0 1 6.052 1.108c.12.05.237.102.353.151a9.003 9.003 0 0 0 5.153 0c.119-.05.239-.104.363-.156Z"
          clip-rule="evenodd"
        />
      </svg>
      <span>{isSnapping ? "Smart Snap On" : "Smart Snap Off"}</span>
    </div>
  </div>
{/if}
