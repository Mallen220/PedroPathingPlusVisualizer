<!-- Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0. -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let value: string | number | undefined = undefined;
  export let options: { label: string; value: string | number }[] = [];
  export let label: string | undefined = undefined;
  export let disabled: boolean = false;
  export let className: string = "";

  const dispatch = createEventDispatcher();

  $: selectClasses = `flex h-9 w-full items-center justify-between rounded-md border border-neutral-200 bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 ${className}`;
</script>

<div class="flex flex-col gap-1.5 w-full">
  {#if label}
    <label
      class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-neutral-700 dark:text-neutral-300"
    >
      {label}
    </label>
  {/if}
  <div class="relative">
    <select
      class={selectClasses}
      bind:value
      {disabled}
      on:change={(e) => dispatch("change", e)}
      {...$$restProps}
    >
      {#each options as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  </div>
</div>
