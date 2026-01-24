<!-- Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0. -->
<script lang="ts">
  import { onMount, tick } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import { commandRegistry } from "../../registries";
  import type { Command } from "../../registries";
  import { showCommandPalette } from "../../../stores";

  export let isOpen = false;

  let searchQuery = "";
  let searchInput: HTMLInputElement;
  let listContainer: HTMLDivElement;

  let commands: Command[] = [];
  let selectedIndex = 0;

  onMount(() => {
    return commandRegistry.subscribe(value => {
      commands = value;
    });
  });

  $: {
    // Reset selection when search changes
    if (searchQuery !== undefined) {
       selectedIndex = 0;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
          e.preventDefault();
          selectedIndex = (selectedIndex + 1) % flatList.length;
          scrollToSelected();
      } else if (e.key === "ArrowUp") {
          e.preventDefault();
          selectedIndex = (selectedIndex - 1 + flatList.length) % flatList.length;
          scrollToSelected();
      } else if (e.key === "Enter") {
          e.preventDefault();
          executeCommand(flatList[selectedIndex]);
      } else if (e.key === "Escape") {
          isOpen = false;
      }
  }

  function executeCommand(cmd: Command) {
      if (!cmd) return;
      isOpen = false;
      // Allow UI to update before executing
      setTimeout(() => {
        try {
            cmd.action();
        } catch (e) {
            console.error("Command execution failed:", e);
        }
      }, 50);
  }

  function scrollToSelected() {
      tick().then(() => {
          const selected = listContainer?.querySelector('.selected-command');
          selected?.scrollIntoView({ block: 'nearest' });
      });
  }

  $: filteredCommands = commands.filter(cmd => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.label.toLowerCase().includes(q) ||
      (cmd.description && cmd.description.toLowerCase().includes(q)) ||
      (cmd.keywords && cmd.keywords.some(k => k.toLowerCase().includes(q))) ||
      (cmd.category && cmd.category.toLowerCase().includes(q))
    );
  });

  // Group by category
  $: groupedCommands = filteredCommands.reduce((acc, cmd) => {
    const cat = cmd.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  // Sort categories (General first, then alphabetical)
  $: sortedCategories = Object.keys(groupedCommands).sort((a, b) => {
      if (a === "General") return -1;
      if (b === "General") return 1;
      return a.localeCompare(b);
  });

  // Flatten for keyboard navigation
  $: flatList = sortedCategories.reduce((acc, cat) => {
     return [...acc, ...groupedCommands[cat]];
  }, [] as Command[]);

  $: if (isOpen) {
    tick().then(() => {
      searchInput?.focus();
    });
  } else {
    searchQuery = "";
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div
    transition:fade={{ duration: 150, easing: cubicInOut }}
    class="fixed inset-0 z-[1007] flex items-start justify-center pt-[20vh] bg-black bg-opacity-50 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    on:click|self={() => (isOpen = false)}
  >
    <div
      transition:fly={{ duration: 200, y: -20, easing: cubicInOut }}
      class="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[60vh] flex flex-col border border-neutral-200 dark:border-neutral-800 overflow-hidden"
    >
      <div class="flex items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-5 text-neutral-400 mr-3"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          bind:this={searchInput}
          bind:value={searchQuery}
          type="text"
          placeholder="Type a command or search..."
          class="flex-1 bg-transparent border-none focus:ring-0 text-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 outline-none"
        />
        <div class="flex items-center gap-2">
            <kbd class="hidden sm:inline-block px-2 py-0.5 text-xs font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">ESC</kbd>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-2 scroll-smooth" bind:this={listContainer}>
          {#if flatList.length === 0}
            <div class="p-8 text-center text-neutral-500 dark:text-neutral-400">
               No commands found.
            </div>
          {:else}
              {#each sortedCategories as category}
                <div class="mb-2">
                    <div class="px-3 py-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider sticky top-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm z-10">
                        {category}
                    </div>
                    <div class="space-y-0.5">
                        {#each groupedCommands[category] as command}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <div
                                class="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer group transition-colors {flatList[selectedIndex] === command ? 'bg-indigo-100 dark:bg-indigo-900/30 selected-command' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}"
                                on:click={() => executeCommand(command)}
                            >
                                <div class="flex flex-col">
                                    <span class="text-sm font-medium text-neutral-900 dark:text-white {flatList[selectedIndex] === command ? 'text-indigo-900 dark:text-indigo-100' : ''}">
                                        {command.label}
                                    </span>
                                    {#if command.description}
                                        <span class="text-xs text-neutral-500 dark:text-neutral-400 {flatList[selectedIndex] === command ? 'text-indigo-700 dark:text-indigo-300' : ''}">
                                            {command.description}
                                        </span>
                                    {/if}
                                </div>
                                {#if command.shortcut}
                                    <kbd class="text-xs px-2 py-0.5 font-sans text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                                        {command.shortcut}
                                    </kbd>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>
              {/each}
          {/if}
      </div>

      <div class="px-4 py-2 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 flex justify-between">
          <div class="flex gap-4">
              <span><kbd class="font-mono bg-neutral-200 dark:bg-neutral-700 px-1 rounded">↑↓</kbd> to navigate</span>
              <span><kbd class="font-mono bg-neutral-200 dark:bg-neutral-700 px-1 rounded">↵</kbd> to select</span>
          </div>
          <div>
            <!-- Stats or extra info -->
          </div>
      </div>
    </div>
  </div>
{/if}
