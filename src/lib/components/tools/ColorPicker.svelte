<!-- Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0. -->
<script lang="ts">
  import { createBubbler } from "svelte/legacy";

  const bubble = createBubbler();

  interface Props {
    color: string;
    title?: string;
    disabled?: boolean;
    // Explicitly export tabindex to allow parent to control focusability
    tabindex?: number | undefined;
  }

  let {
    color = $bindable(),
    title = "Change Color",
    disabled = false,
    tabindex = undefined,
  }: Props = $props();
</script>

<div
  class="relative size-5 rounded-full overflow-hidden shadow-sm border border-neutral-300 dark:border-neutral-600 shrink-0 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 dark:focus-within:ring-offset-neutral-900"
  style="background-color: {color}"
>
  <input
    type="color"
    bind:value={color}
    class="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
    {title}
    aria-label={title}
    {disabled}
    {tabindex}
    oninput={bubble("input")}
    onchange={bubble("change")}
  />
</div>
