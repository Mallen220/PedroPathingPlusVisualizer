<!-- src/lib/components/ContextMenu.svelte -->
<script lang="ts">
  import { onMount, tick } from "svelte";
  import { fade } from "svelte/transition";
  import { portal } from "../actions/portal";

  export let x: number;
  export let y: number;
  export let items: {
    label: string;
    action: () => void;
    icon?: string;
    destructive?: boolean;
  }[];
  export let onClose: () => void;

  let menuRef: HTMLDivElement;
  let adjustedX = x;
  let adjustedY = y;

  async function adjustPosition() {
    await tick();
    if (!menuRef) return;
    const rect = menuRef.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (x + rect.width > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 8;
    } else {
      adjustedX = x;
    }

    if (y + rect.height > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 8;
    } else {
      adjustedY = y;
    }
  }

  $: {
    if (x || y) adjustPosition();
  }

  function handleClickOutside(event: MouseEvent) {
    if (menuRef && !menuRef.contains(event.target as Node)) {
      onClose();
    }
  }

  onMount(() => {
    adjustPosition();
    // Slight delay to prevent immediate closing if triggered by click
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("contextmenu", handleClickOutside);
      window.addEventListener("scroll", onClose, true);
      window.addEventListener("resize", onClose);
    }, 50);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("contextmenu", handleClickOutside);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
    };
  });
</script>

<div
  bind:this={menuRef}
  use:portal
  class="fixed z-[9999] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl py-1 min-w-[160px] flex flex-col"
  style="left: {adjustedX}px; top: {adjustedY}px;"
  transition:fade={{ duration: 100 }}
  on:contextmenu|preventDefault
  role="menu"
  tabindex="-1"
>
  {#each items as item}
    <button
      class="px-4 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors
      {item.destructive
        ? 'text-red-600 dark:text-red-400'
        : 'text-neutral-700 dark:text-neutral-200'}"
      on:click={(e) => {
        e.stopPropagation();
        item.action();
        onClose();
      }}
    >
      {#if item.icon}
        {@html item.icon}
      {/if}
      {item.label}
    </button>
  {/each}
</div>
