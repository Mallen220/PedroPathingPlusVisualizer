<!-- Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0. -->
<script lang="ts">
  import { cubicInOut } from "svelte/easing";
  import { fade, fly } from "svelte/transition";
  import { showCheckpoints } from "../../../stores";
  import {
    checkpoints,
    createCheckpoint,
    deleteCheckpoint,
    renameCheckpoint,
    restoreCheckpointData,
    type Checkpoint,
  } from "../../checkpointStore";
  import { toggleDiff } from "../../diffStore";

  export let isOpen = false;
  // Function to record change in history (passed from App)
  export let recordChange: (action: string) => void;

  let newCheckpointName = "";
  let editingId: string | null = null;
  let editingName = "";

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && isOpen) {
      isOpen = false;
    }
  }

  function handleCreate() {
    createCheckpoint(newCheckpointName.trim());
    newCheckpointName = "";
  }

  function handleRestore(cp: Checkpoint) {
    if (
      confirm(
        `Are you sure you want to restore checkpoint "${cp.name}"? Current unsaved changes will be added to undo history.`,
      )
    ) {
      restoreCheckpointData(cp.data);
      recordChange(`Restored Checkpoint: ${cp.name}`);
      isOpen = false;
    }
  }

  function handleCompare(cp: Checkpoint) {
    toggleDiff(cp.data);
    isOpen = false;
  }

  function handleDelete(cp: Checkpoint) {
    if (confirm(`Delete checkpoint "${cp.name}"?`)) {
      deleteCheckpoint(cp.id);
    }
  }

  function startEditing(cp: Checkpoint) {
    editingId = cp.id;
    editingName = cp.name;
  }

  function saveEditing(cp: Checkpoint) {
    if (editingName.trim()) {
      renameCheckpoint(cp.id, editingName.trim());
    }
    editingId = null;
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleString();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div
    transition:fade={{ duration: 200, easing: cubicInOut }}
    class="bg-black bg-opacity-40 flex flex-col justify-center items-center fixed top-0 left-0 w-full h-full z-[1005] backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-labelledby="checkpoint-title"
  >
    <div
      transition:fly={{ duration: 300, easing: cubicInOut, y: 20 }}
      class="flex flex-col bg-white dark:bg-neutral-900 rounded-xl w-full max-w-2xl max-h-[80vh] shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800"
    >
      <!-- Header -->
      <div
        class="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50"
      >
        <h2
          id="checkpoint-title"
          class="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="size-5 text-purple-600 dark:text-purple-400"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
            />
          </svg>
          Checkpoints
        </h2>
        <button
          on:click={() => (isOpen = false)}
          aria-label="Close"
          class="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors text-neutral-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="size-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Create New -->
      <div class="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <form
          on:submit|preventDefault={handleCreate}
          class="flex items-center gap-2"
        >
          <input
            type="text"
            bind:value={newCheckpointName}
            placeholder="New checkpoint name (optional)..."
            class="flex-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
          <button
            type="submit"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors shadow-sm flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="size-4"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Create
          </button>
        </form>
      </div>

      <!-- List -->
      <div class="flex-1 overflow-y-auto p-0 bg-neutral-50 dark:bg-neutral-950">
        {#if $checkpoints.length === 0}
          <div
            class="flex flex-col items-center justify-center h-48 text-neutral-500 dark:text-neutral-400"
          >
            <p class="text-sm">No checkpoints created yet.</p>
            <p class="text-xs mt-1 opacity-70">
              Create a checkpoint to save the current state.
            </p>
          </div>
        {:else}
          <div class="divide-y divide-neutral-200 dark:divide-neutral-800">
            {#each $checkpoints as cp (cp.id)}
              <div
                class="group flex items-center justify-between p-4 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <div class="flex-1 min-w-0 pr-4">
                  {#if editingId === cp.id}
                    <form
                      on:submit|preventDefault={() => saveEditing(cp)}
                      class="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        bind:value={editingName}
                        class="w-full px-2 py-1 text-sm rounded border border-purple-500 bg-white dark:bg-neutral-800 focus:outline-none"
                        autofocus
                        on:blur={() => saveEditing(cp)}
                      />
                    </form>
                  {:else}
                    <div class="flex items-baseline gap-2">
                      <h3
                        class="text-sm font-semibold text-neutral-900 dark:text-white truncate cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                        on:click={() => startEditing(cp)}
                        title="Click to rename"
                      >
                        {cp.name}
                      </h3>
                      <span
                        class="text-xs text-neutral-400 dark:text-neutral-500 flex-shrink-0"
                      >
                        {formatTime(cp.timestamp)}
                      </span>
                    </div>
                    <!-- Optional: show basic stats diff preview? Too complex for list view. -->
                  {/if}
                </div>

                <div class="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    on:click={() => handleCompare(cp)}
                    class="px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors flex items-center gap-1"
                    title="Compare with current state"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="size-3.5"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184 48.208 48.208 0 011.927.184 2.423 2.423 0 011.907 2.185v6.75L12 11.25l4.151-2.491"
                      />
                    </svg>
                    Compare
                  </button>

                  <button
                    on:click={() => handleRestore(cp)}
                    class="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-sm flex items-center gap-1"
                    title="Restore this state"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="size-3.5"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                      />
                    </svg>
                    Restore
                  </button>

                  <div class="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-1"></div>

                  <button
                    on:click={() => handleDelete(cp)}
                    class="p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete checkpoint"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                      stroke="currentColor"
                      class="size-4"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
