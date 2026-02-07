<!-- Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0. -->
<script lang="ts">
  export let text: string;
  export let position: "top" | "bottom" | "left" | "right" = "top";

  let show = false;

  const positionClasses = {
    top: "-top-1 left-1/2 -translate-x-1/2 -translate-y-full mb-2",
    bottom: "-bottom-1 left-1/2 -translate-x-1/2 translate-y-full mt-2",
    left: "-left-1 top-1/2 -translate-y-1/2 -translate-x-full mr-2",
    right: "-right-1 top-1/2 -translate-y-1/2 translate-x-full ml-2",
  };
</script>

<div
  class="relative inline-block"
  on:mouseenter={() => (show = true)}
  on:mouseleave={() => (show = false)}
  role="tooltip"
>
  <slot />
  {#if show && text}
    <div
      class={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-neutral-900 rounded shadow-sm whitespace-nowrap pointer-events-none dark:bg-neutral-50 dark:text-neutral-900 ${positionClasses[position]}`}
    >
      {text}
    </div>
  {/if}
</div>
