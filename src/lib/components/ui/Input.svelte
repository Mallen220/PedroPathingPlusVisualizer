<!-- Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0. -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let value: string | number | undefined = undefined;
  export let type: string = "text";
  export let placeholder: string = "";
  export let label: string | undefined = undefined;
  export let error: string | undefined = undefined;
  export let disabled: boolean = false;
  export let className: string = "";
  export let min: number | string | undefined = undefined;
  export let max: number | string | undefined = undefined;
  export let step: number | string | undefined = undefined;
  export let autofocus: boolean = false;

  const dispatch = createEventDispatcher();

  $: inputClasses = `flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:placeholder:text-neutral-400 ${error ? "border-red-500 focus-visible:ring-red-500" : ""} ${className}`;
</script>

<div class="flex flex-col gap-1.5 w-full">
  {#if label}
    <label
      class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-neutral-700 dark:text-neutral-300"
    >
      {label}
    </label>
  {/if}

  {#if type === "number"}
    <input
      type="number"
      class={inputClasses}
      {placeholder}
      {disabled}
      {min}
      {max}
      {step}
      {autofocus}
      bind:value
      on:input={(e) => dispatch("input", e)}
      on:change={(e) => dispatch("change", e)}
      on:keydown
      on:focus
      on:blur
      {...$$restProps}
    />
  {:else}
    <input
      type="text"
      class={inputClasses}
      {placeholder}
      {disabled}
      {min}
      {max}
      {step}
      {autofocus}
      bind:value
      on:input={(e) => dispatch("input", e)}
      on:change={(e) => dispatch("change", e)}
      on:keydown
      on:focus
      on:blur
      {...$$restProps}
    />
  {/if}

  {#if error}
    <p class="text-xs text-red-500 font-medium">{error}</p>
  {/if}
</div>
