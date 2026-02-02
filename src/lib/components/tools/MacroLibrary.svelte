<script lang="ts">
  import { onMount } from "svelte";
  import { currentDirectoryStore } from "../../../stores";
  import type { FileInfo } from "../../../types";

  // State
  let files: FileInfo[] = [];
  let filteredFiles: FileInfo[] = [];
  let searchQuery = "";
  let loading = false;
  let errorMessage = "";

  const supportedFileTypes = [".pp"];
  const electronAPI = (window as any).electronAPI;

  async function loadFiles() {
    if (!$currentDirectoryStore) {
      files = [];
      return;
    }

    loading = true;
    errorMessage = "";
    try {
      const allFiles = await electronAPI.listFiles($currentDirectoryStore);
      // Filter for .pp files
      files = allFiles.filter(
        (f: any) => f.name.endsWith(".pp") && !f.name.startsWith("."),
      );
      // Sort by name
      files.sort((a: any, b: any) => a.name.localeCompare(b.name));
    } catch (err: any) {
      errorMessage = err.message || "Failed to load files";
    } finally {
      loading = false;
    }
  }

  // Reactive filtering
  $: {
    if (!searchQuery) {
      filteredFiles = files;
    } else {
      const q = searchQuery.toLowerCase();
      filteredFiles = files.filter((f) => f.name.toLowerCase().includes(q));
    }
  }

  // Reload when directory changes
  $: if ($currentDirectoryStore) {
    loadFiles();
  }

  function handleDragStart(e: DragEvent, file: FileInfo) {
    if (!e.dataTransfer) return;
    e.dataTransfer.setData("application/x-pedro-macro", file.path);
    e.dataTransfer.setData("text/plain", file.path);
    e.dataTransfer.effectAllowed = "copy";
  }

  onMount(() => {
    loadFiles();
  });
</script>

<div
  class="flex flex-col h-full bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700 shadow-lg"
>
  <div
    class="p-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50"
  >
    <div class="flex items-center justify-between mb-2">
      <h3
        class="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="size-4 text-blue-500"
        >
          <path
            d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z"
          />
          <path
            d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z"
          />
        </svg>
        Macro Library
      </h3>
      <button
        on:click={loadFiles}
        class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
        title="Refresh"
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
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </button>
    </div>
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search macros..."
      class="w-full px-2 py-1.5 text-xs bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    />
  </div>

  <div class="flex-1 overflow-y-auto p-2 space-y-1">
    {#if loading}
      <div class="text-xs text-center text-neutral-500 py-4">Loading...</div>
    {:else if errorMessage}
      <div class="text-xs text-red-500 py-2 px-1">{errorMessage}</div>
    {:else if filteredFiles.length === 0}
      <div class="text-xs text-center text-neutral-500 py-8">
        {#if searchQuery}
          No matches found.
        {:else}
          No macros found in project.
        {/if}
      </div>
    {:else}
      {#each filteredFiles as file (file.path)}
        <div
          class="group flex items-center gap-2 p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-grab active:cursor-grabbing border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 transition-all"
          draggable="true"
          on:dragstart={(e) => handleDragStart(e, file)}
          role="listitem"
        >
          <div
            class="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0 group-hover:bg-white dark:group-hover:bg-neutral-700 shadow-sm transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-4"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
          </div>
          <div class="min-w-0">
            <div
              class="text-xs font-medium text-neutral-700 dark:text-neutral-200 truncate"
              title={file.name}
            >
              {file.name.replace(/\.pp$/, "")}
            </div>
            <div class="text-[10px] text-neutral-400 truncate">
              Drag to insert
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <div
    class="p-2 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-[10px] text-neutral-400 text-center"
  >
    {filteredFiles.length} macro{filteredFiles.length !== 1 ? "s" : ""}
  </div>
</div>
