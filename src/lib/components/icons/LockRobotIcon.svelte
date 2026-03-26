<!-- Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0. -->
<script lang="ts">
  export let className: string = "size-5";
  export let locked: boolean = false;
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
  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
  {#if locked}
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  {:else}
    <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
  {/if}
</svg>
