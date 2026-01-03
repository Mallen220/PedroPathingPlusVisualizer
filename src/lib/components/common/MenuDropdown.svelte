<script lang="ts">
  import { onMount, onDestroy, setContext } from "svelte";
  import { writable } from "svelte/store";

  export let label: string;
  export let title: string = "";

  let isOpen = false;
  let menuRef: HTMLDivElement;
  let buttonRef: HTMLButtonElement;

  // Create a context for child items to close the menu
  const closeContext = writable(() => {});
  setContext("menu-close", closeContext);

  function toggle() {
    isOpen = !isOpen;
  }

  function close() {
    isOpen = false;
  }

  // Update the context function whenever close changes (it won't really change, but good practice)
  $: closeContext.set(close);

  function handleClickOutside(event: MouseEvent) {
    if (
      isOpen &&
      menuRef &&
      !menuRef.contains(event.target as Node) &&
      buttonRef &&
      !buttonRef.contains(event.target as Node)
    ) {
      close();
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (isOpen && event.key === "Escape") {
      close();
    }
  }

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
  });

  onDestroy(() => {
    if (typeof document !== "undefined") {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    }
  });
</script>

<div class="relative inline-block text-left">
  <button
    bind:this={buttonRef}
    on:click={toggle}
    class="inline-flex justify-center w-full px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
    aria-expanded={isOpen}
    aria-haspopup="true"
    {title}
  >
    {label}
  </button>

  {#if isOpen}
    <div
      bind:this={menuRef}
      class="origin-top-left absolute left-0 mt-1 w-56 rounded-md shadow-lg bg-white dark:bg-neutral-900 ring-1 ring-black ring-opacity-5 focus:outline-none z-[100]"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="menu-button"
    >
      <div class="py-1" role="none">
        <slot />
      </div>
    </div>
  {/if}
</div>
