<!-- Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0. -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let variant: "primary" | "secondary" | "ghost" | "danger" | "outline" | "custom" =
    "primary";
  export let size: "sm" | "md" | "lg" | "icon" = "md";
  export let disabled: boolean = false;
  export let fullWidth: boolean = false;
  export let href: string | undefined = undefined;
  export let title: string | undefined = undefined;
  export let className: string = "";
  export let type: "button" | "submit" | "reset" = "button";

  const dispatch = createEventDispatcher();

  $: baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:pointer-events-none disabled:opacity-50 select-none";

  $: variantClasses = {
    primary: "bg-purple-600 text-white hover:bg-purple-700 shadow-sm",
    secondary:
      "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700",
    ghost:
      "hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 text-neutral-600 dark:text-neutral-400",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
    outline:
      "border border-neutral-200 bg-white hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
    custom: "",
  }[variant];

  $: sizeClasses = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 py-2 text-sm",
    lg: "h-10 px-8 text-base",
    icon: "h-9 w-9 p-0",
  }[size];

  $: widthClass = fullWidth ? "w-full" : "";

  $: classes = `${baseClasses} ${variantClasses} ${sizeClasses} ${widthClass} ${className}`;
</script>

{#if href}
  <a
    {href}
    class={classes}
    {title}
    aria-label={title}
    on:click={(e) => dispatch("click", e)}
    {...$$restProps}
  >
    <slot />
  </a>
{:else}
  <button
    {type}
    class={classes}
    {disabled}
    {title}
    aria-label={title}
    on:click={(e) => dispatch("click", e)}
    {...$$restProps}
  >
    <slot />
  </button>
{/if}
