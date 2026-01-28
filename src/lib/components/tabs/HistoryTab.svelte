<!-- Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0. -->
<script lang="ts">
  import { onMount, tick } from "svelte";
  import type { Writable } from "svelte/store";
  import type { HistoryEntry } from "../../../utils/history";

  export let historyStore: Writable<{
    undoStack: HistoryEntry[];
    redoStack: HistoryEntry[];
  }>;
  export let onJumpTo: (entry: HistoryEntry) => void;

  // Formatting helper
  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  let listContainer: HTMLDivElement;

  // Scroll to bottom when history changes
  $: if ($historyStore && listContainer) {
    tick().then(() => {
      // We want to keep the current state visible.
      // The current state is the last item in undoStack.
      // So we scroll to that element.
      const current = document.getElementById("history-current");
      if (current) {
        current.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });
  }
</script>

<div class="w-full h-full flex flex-col bg-white dark:bg-neutral-900">
  <div class="p-4 border-b border-neutral-200 dark:border-neutral-800">
    <h3 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
      History
    </h3>
    <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
      Click a state to restore it.
    </p>
  </div>

  <div class="flex-1 overflow-y-auto p-2 space-y-1" bind:this={listContainer}>
    <!-- Initial State Placeholder -->
    <!-- We can treat the first item of undoStack as initial if we want, or just show list -->
    <!-- Ideally, undoStack[0] is the oldest state. -->

    {#if $historyStore}
      <!-- PAST (Undo Stack) -->
      {#each $historyStore.undoStack as entry, i}
        {@const isCurrent =
          i === $historyStore.undoStack.length - 1 &&
          $historyStore.redoStack.length === 0}
        {@const isActive = i === $historyStore.undoStack.length - 1}

        <button
          id={isActive ? "history-current" : undefined}
          class={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between group transition-colors ${
            isActive
              ? "bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800"
              : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-transparent"
          }`}
          on:click={() => onJumpTo(entry)}
        >
          <div class="flex flex-col truncate">
            <span class="font-medium truncate">{entry.description}</span>
            <span class="text-xs opacity-60">{formatTime(entry.timestamp)}</span
            >
          </div>
          {#if isActive}
            <div
              class="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400"
            ></div>
          {/if}
        </button>
      {/each}

      <!-- FUTURE (Redo Stack) -->
      <!-- Redo stack is LIFO (top is most recent undo), so we should reverse it to show chronological order? -->
      <!-- Trace: Undo C. Undo B. RedoStack: [C, B] (top is B). -->
      <!-- Chronological: A -> B -> C. -->
      <!-- We are at A. Next is B (top of redo), then C. -->
      <!-- So we iterate redoStack from end to start to show B then C. -->

      {#each [...$historyStore.redoStack].reverse() as entry}
        <button
          class="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between group transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 dark:text-neutral-500 border border-transparent"
          on:click={() => onJumpTo(entry)}
        >
          <div class="flex flex-col truncate">
            <span class="font-medium truncate">{entry.description}</span>
            <span class="text-xs opacity-60">{formatTime(entry.timestamp)}</span
            >
          </div>
        </button>
      {/each}
    {/if}

    {#if $historyStore && $historyStore.undoStack.length === 0}
      <div class="p-4 text-center text-neutral-400 text-sm italic">
        No history yet.
      </div>
    {/if}
  </div>
</div>
