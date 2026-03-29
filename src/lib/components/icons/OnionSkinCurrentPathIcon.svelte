<!-- Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0. -->
<script lang="ts">
  export let className: string = "size-4";
  export let isActive: boolean = false;
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={className}
>
  {#if isActive}
    <!-- Show a single highlighted layer -->
    <rect x="4" y="6" width="16" height="4" rx="1" fill="currentColor" />
    <rect
      x="4"
      y="11"
      width="16"
      height="4"
      rx="1"
      stroke="currentColor"
      fill="none"
    />
    <rect
      x="4"
      y="16"
      width="16"
      height="4"
      rx="1"
      stroke="currentColor"
      fill="none"
    />
  {:else}
    <!-- Show multiple layers equally -->
    <rect
      x="4"
      y="6"
      width="16"
      height="4"
      rx="1"
      stroke="currentColor"
      fill="none"
    />
    <rect
      x="4"
      y="11"
      width="16"
      height="4"
      rx="1"
      stroke="currentColor"
      fill="none"
    />
    <rect
      x="4"
      y="16"
      width="16"
      height="4"
      rx="1"
      stroke="currentColor"
      fill="none"
    />
  {/if}
</svg>
