<script lang="ts">
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";

  export let onClick: (() => void) | undefined = undefined;
  export let disabled = false;
  export let title = "";
  export let checked: boolean | undefined = undefined;

  // Get the close function from the parent MenuDropdown
  const closeContext = getContext<Writable<() => void>>("menu-close");

  function handleClick() {
    if (!disabled) {
      if (onClick) onClick();
      if ($closeContext) $closeContext();
    }
  }
</script>

<button
  on:click={handleClick}
  class="group flex items-center justify-between w-full px-4 py-2 text-sm text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
  role="menuitem"
  {disabled}
  {title}
>
  <div class="flex items-center gap-2">
    {#if checked !== undefined}
      <div class="w-4 flex items-center justify-center">
        {#if checked}
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-purple-600">
             <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
           </svg>
        {/if}
      </div>
    {/if}
    <span><slot /></span>
  </div>
  <slot name="icon" />
</button>
