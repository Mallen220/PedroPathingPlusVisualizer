<!-- Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0. -->
<script lang="ts">
  import {
    checkpoints,
    createCheckpoint,
    restoreCheckpoint,
    deleteCheckpoint,
    renameCheckpoint,
  } from "../../../lib/checkpointStore";
  import { showCheckpoints, notification } from "../../../stores";
  import { startDiffWith } from "../../../lib/diffStore";
  import { fade, slide, scale } from "svelte/transition";
  import TrashIcon from "../icons/TrashIcon.svelte";

  // New checkpoint name input
  let newName = "";
  // Editing state
  let editingId: string | null = null;
  let editName = "";

  function handleCreate() {
    createCheckpoint(newName);
    newName = "";
  }

  function handleRestore(checkpoint: any) {
    if (confirm(`Are you sure you want to restore checkpoint "${checkpoint.name}"? Unsaved changes since the last checkpoint will be lost.`)) {
        restoreCheckpoint(checkpoint);
        showCheckpoints.set(false);
    }
  }

  function handleCompare(checkpoint: any) {
    startDiffWith(checkpoint.data);
    showCheckpoints.set(false);
    notification.set({
        message: `Comparing with "${checkpoint.name}". Check Diff tab.`,
        type: "info",
        timeout: 3000
    });
  }

  function startEdit(checkpoint: any) {
    editingId = checkpoint.id;
    editName = checkpoint.name;
  }

  function saveEdit() {
    if (editingId && editName.trim()) {
      renameCheckpoint(editingId, editName);
    }
    editingId = null;
  }

  function cancelEdit() {
    editingId = null;
  }

  function formatTime(ts: number) {
      return new Date(ts).toLocaleString();
  }
</script>

{#if $showCheckpoints}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/50 backdrop-blur-sm"
      transition:fade={{ duration: 200 }}
      on:click={() => showCheckpoints.set(false)}
    ></div>

    <!-- Dialog -->
    <div
      class="relative bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-700"
      transition:scale={{ duration: 200, start: 0.95 }}
    >
      <!-- Header -->
      <div class="p-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
        <div>
            <h2 class="text-lg font-bold text-neutral-900 dark:text-white">Checkpoints</h2>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">Save states to experiment safely without losing work.</p>
        </div>
        <button
          on:click={() => showCheckpoints.set(false)}
          class="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full transition-colors text-neutral-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="size-5" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Create Section -->
      <div class="p-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        <form on:submit|preventDefault={handleCreate} class="flex gap-2">
            <input
                type="text"
                bind:value={newName}
                placeholder="Checkpoint Name (optional)"
                class="flex-1 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none dark:text-white"
            />
            <button
                type="submit"
                class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="size-4" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Create
            </button>
        </form>
      </div>

      <!-- List -->
      <div class="overflow-y-auto flex-1 p-2 bg-neutral-50 dark:bg-neutral-900/30">
        {#if $checkpoints.length === 0}
            <div class="flex flex-col items-center justify-center py-12 text-neutral-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-12 mb-2 opacity-50">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                </svg>
                <p>No checkpoints yet.</p>
                <p class="text-xs mt-1">Create one to save your current progress.</p>
            </div>
        {:else}
            <div class="flex flex-col gap-2">
                {#each $checkpoints as cp (cp.id)}
                    <div class="bg-white dark:bg-neutral-800 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center justify-between gap-4 group" transition:slide|local>
                        <div class="flex-1 min-w-0">
                            {#if editingId === cp.id}
                                <div class="flex items-center gap-2">
                                    <input
                                        type="text"
                                        bind:value={editName}
                                        class="w-full px-2 py-1 rounded border border-purple-500 bg-white dark:bg-neutral-900 text-sm dark:text-white"
                                        autoFocus
                                        on:keydown={(e) => {
                                            if(e.key === 'Enter') saveEdit();
                                            if(e.key === 'Escape') cancelEdit();
                                        }}
                                    />
                                    <button on:click={saveEdit} class="text-green-600 hover:text-green-700"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="size-4" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg></button>
                                    <button on:click={cancelEdit} class="text-red-600 hover:text-red-700"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="size-4" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                </div>
                            {:else}
                                <div class="flex items-baseline gap-2">
                                    <h3 class="font-medium text-neutral-900 dark:text-neutral-100 truncate" title={cp.name}>{cp.name}</h3>
                                    <button on:click={() => startEdit(cp)} class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" title="Rename">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="size-3" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                                    </button>
                                </div>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400">{formatTime(cp.timestamp)}</p>
                            {/if}
                        </div>

                        <div class="flex items-center gap-2">
                            <button
                                on:click={() => handleCompare(cp)}
                                class="px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-md transition-colors"
                                title="Compare with current state"
                            >
                                Compare
                            </button>
                            <button
                                on:click={() => handleRestore(cp)}
                                class="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
                                title="Restore this checkpoint"
                            >
                                Restore
                            </button>
                            <button
                                on:click={() => deleteCheckpoint(cp.id)}
                                class="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                title="Delete"
                            >
                                <TrashIcon className="size-4" strokeWidth={2} />
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
