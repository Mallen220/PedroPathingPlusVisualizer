<script lang="ts">
  import { tooltipState } from "../../stores";
  import { fade } from "svelte/transition";

  let clientWidth: number;
  let clientHeight: number;
  let tooltipWidth: number;
  let tooltipHeight: number;

  $: state = $tooltipState;

  $: left = (() => {
    if (!state) return 0;
    // Center horizontally
    let l = state.x - tooltipWidth / 2;
    // Clamp to screen
    l = Math.max(8, Math.min(l, clientWidth - tooltipWidth - 8));
    return l;
  })();

  $: top = (() => {
    if (!state) return 0;
    // Position below
    let t = state.y;
    // Check if it fits below, otherwise put above
    if (t + tooltipHeight + 8 > clientHeight) {
      // Put above: state.y is usually bottom of element + gap.
      // We might need rect info, but we only have x,y.
      // Assuming y passed is "bottom of element".
      // We'll just shift up by height + some gap if we assume y is the target y.
      // But action sets y = rect.bottom + 5.
      // So t is bottom.
      // If we want to flip, we need rect.top.
      // For simplicity, we just clamp or shift up by tooltip height.
      t = t - tooltipHeight - 10;
    }
    return t;
  })();
</script>

<svelte:window bind:innerWidth={clientWidth} bind:innerHeight={clientHeight} />

{#if state && state.visible}
  <div
    transition:fade={{ duration: 150 }}
    class="fixed z-[10000] pointer-events-none px-2 py-1 bg-neutral-800 text-white text-xs rounded shadow-lg border border-neutral-700 whitespace-nowrap max-w-xs overflow-hidden text-ellipsis"
    style="left: {left}px; top: {top}px;"
    bind:clientWidth={tooltipWidth}
    bind:clientHeight={tooltipHeight}
  >
    {state.content}
  </div>
{/if}
