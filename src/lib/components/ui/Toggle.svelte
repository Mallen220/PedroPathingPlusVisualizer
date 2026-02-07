<!-- Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0. -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let checked: boolean = false;
  export let label: string | undefined = undefined;
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher();

  function handleChange(event: Event) {
    checked = (event.target as HTMLInputElement).checked;
    dispatch("change", checked);
  }
</script>

<label
  class="inline-flex items-center cursor-pointer {disabled
    ? 'opacity-50 cursor-not-allowed'
    : ''}"
>
  <input
    type="checkbox"
    class="sr-only peer"
    bind:checked
    {disabled}
    on:change={handleChange}
  />
  <div
    class="relative w-9 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"
  ></div>
  {#if label}
    <span
      class="ms-3 text-sm font-medium text-neutral-900 dark:text-neutral-300 select-none"
    >
      {label}
    </span>
  {/if}
</label>
