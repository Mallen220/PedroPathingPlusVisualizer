<!-- Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0. -->
<script lang="ts">
  import { tooltipState } from "../../stores";
  import { fade } from "svelte/transition";

  let x = 0;
  let y = 0;
  let text = "";
  let visible = false;

  $: if ($tooltipState) {
    x = $tooltipState.x;
    y = $tooltipState.y;
    text = $tooltipState.text;
    visible = $tooltipState.visible;
  } else {
    visible = false;
  }
</script>

{#if visible}
  <div
    class="fixed z-[9999] px-2 py-1 text-xs text-white bg-neutral-800 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-6px] whitespace-nowrap border border-neutral-700"
    style="left: {x}px; top: {y}px;"
    transition:fade={{ duration: 150 }}
  >
    {text}
  </div>
{/if}
