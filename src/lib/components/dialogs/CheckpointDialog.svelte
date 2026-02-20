<!-- Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0. -->
<script lang="ts">
  import { slide } from "svelte/transition";
  import { showCheckpoints } from "../../../stores";
  import {
    checkpoints,
    createCheckpoint,
    deleteCheckpoint,
    renameCheckpoint,
    restoreCheckpointData,
    type Checkpoint,
  } from "../../checkpointStore";
  import { startDiffWith } from "../../diffStore";

  export let recordChange: (action?: string) => void;

  let newName = "";
  let editingId: string | null = null;
  let editName = "";

  function handleCreate() {
    createCheckpoint(newName);
    newName = "";
  }

  function handleRestore(checkpoint: Checkpoint) {
    if (
      confirm(
        `Are you sure you want to restore "${checkpoint.name}"? Current unsaved changes will be lost (unless you undo).`,
      )
    ) {
      restoreCheckpointData(checkpoint);
      recordChange(`Restore Checkpoint: ${checkpoint.name}`);
      showCheckpoints.set(false);
    }
  }

  function handleCompare(checkpoint: Checkpoint) {
    startDiffWith(checkpoint.data);
    showCheckpoints.set(false);
  }

  function startEdit(checkpoint: Checkpoint) {
    editingId = checkpoint.id;
    editName = checkpoint.name;
  }

  function saveEdit(id: string) {
    if (editName.trim()) {
      renameCheckpoint(id, editName);
    }
    editingId = null;
  }

  function handleDelete(checkpoint: Checkpoint) {
    if (confirm(`Delete checkpoint "${checkpoint.name}"?`)) {
      deleteCheckpoint(checkpoint.id);
    }
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleString();
  }
</script>

{#if $showCheckpoints}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    transition:slide
  >
    <div
      class="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-neutral-200 dark:border-neutral-700"
    >
      <!-- Header -->
      <div
        class="p-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center"
      >
        <h2
          class="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="size-6 text-purple-600"
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
          on:click={() => showCheckpoints.set(false)}
          class="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="size-6 text-neutral-500"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Create New -->
      <div
        class="p-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50"
      >
        <form on:submit|preventDefault={handleCreate} class="flex gap-2">
          <input
            type="text"
            bind:value={newName}
            placeholder="New Checkpoint Name (optional)"
            class="flex-1 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          <button
            type="submit"
            class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="size-5"
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
      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        {#if $checkpoints.length === 0}
          <div class="text-center py-12 text-neutral-500 dark:text-neutral-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-16 mx-auto mb-4 opacity-50"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
              />
            </svg>
            <p class="text-lg font-medium">No checkpoints yet</p>
            <p class="text-sm">
              Create a checkpoint to save your current state.
            </p>
          </div>
        {/if}

        {#each $checkpoints as cp (cp.id)}
          <div
            class="group bg-neutral-50 dark:bg-neutral-700/30 border border-neutral-200 dark:border-neutral-700 p-4 rounded-xl hover:border-purple-300 dark:hover:border-purple-700/50 transition-all"
          >
            <div class="flex justify-between items-start mb-2">
              <div class="flex-1">
                {#if editingId === cp.id}
                  <form
                    on:submit|preventDefault={() => saveEdit(cp.id)}
                    class="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      bind:value={editName}
                      class="w-full px-2 py-1 text-sm rounded border border-purple-500 bg-white dark:bg-neutral-800 focus:outline-none"
                      autoFocus
                      on:blur={() => saveEdit(cp.id)}
                    />
                  </form>
                {:else}
                  <div class="flex items-center gap-2">
                    <h3 class="font-semibold text-neutral-900 dark:text-white">
                      {cp.name}
                    </h3>
                    <button
                      on:click={() => startEdit(cp)}
                      class="text-neutral-400 hover:text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Rename"
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
                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                        />
                      </svg>
                    </button>
                  </div>
                {/if}
                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {formatTime(cp.timestamp)}
                </p>
              </div>
              <div class="flex items-center gap-1">
                <button
                  on:click={() => handleDelete(cp)}
                  class="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    class="size-5"
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

            <div class="flex gap-2 mt-2">
              <button
                on:click={() => handleRestore(cp)}
                class="flex-1 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
                    d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                  />
                </svg>
                Restore
              </button>
              <button
                on:click={() => handleCompare(cp)}
                class="flex-1 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"
                  />
                </svg>
                Compare
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}
