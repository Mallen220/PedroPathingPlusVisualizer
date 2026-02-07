<!-- Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0. -->
<script lang="ts">
  export let title: string | undefined = undefined;
  export let className: string = "";
</script>

<div
  class={`rounded-xl border border-neutral-200 bg-white text-neutral-950 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 ${className}`}
>
  {#if title || $$slots.header}
    <div class="flex flex-col space-y-1.5 p-6 pb-2">
      {#if title}
        <h3 class="font-semibold leading-none tracking-tight">{title}</h3>
      {/if}
      <slot name="header" />
    </div>
  {/if}
  <div class="p-6 pt-2">
    <slot />
  </div>
  {#if $$slots.footer}
    <div class="flex items-center p-6 pt-0">
      <slot name="footer" />
    </div>
  {/if}
</div>
