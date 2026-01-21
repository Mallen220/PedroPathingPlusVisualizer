<!-- Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0. -->
<script lang="ts">
  import { cubicInOut } from "svelte/easing";
  import { fade, fly } from "svelte/transition";
  import { PluginManager } from "../../pluginManager";
  import { pluginsStore, type PluginInfo } from "../../pluginsStore";
  import {
    PluginIcon,
    CloseIcon,
    SearchIcon,
    FolderIcon,
    RefreshIcon,
    CheckIcon,
    TrashIcon,
    AlertIcon,
  } from "../../../icons";

  export let isOpen = false;

  let searchQuery = "";
  let pluginToDelete: PluginInfo | null = null;

  // Derived status for better UI
  $: filteredPlugins = $pluginsStore.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  $: loadedPlugins = filteredPlugins.filter((p) => p.loaded);
  $: errorPlugins = filteredPlugins.filter((p) => !p.loaded);

  async function confirmDelete() {
    if (pluginToDelete) {
      await PluginManager.deletePlugin(pluginToDelete.name);
      pluginToDelete = null;
    }
  }
</script>

{#if isOpen}
  <div
    transition:fade={{ duration: 500, easing: cubicInOut }}
    class="bg-black bg-opacity-25 flex flex-col justify-center items-center fixed top-0 left-0 w-full h-full z-[1005]"
    role="dialog"
    aria-modal="true"
    aria-labelledby="plugin-manager-title"
  >
    <div
      transition:fly={{ duration: 500, easing: cubicInOut, y: 20 }}
      class="flex flex-col justify-start items-start p-6 bg-white dark:bg-neutral-900 rounded-lg w-full max-w-2xl max-h-[92vh] shadow-2xl border border-neutral-200 dark:border-neutral-800 relative"
    >
      <!-- Header -->
      <div class="flex flex-col w-full mb-6 gap-4">
        <div class="flex flex-row justify-between items-center w-full">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <PluginIcon
                className="size-6 text-purple-600 dark:text-purple-400"
                strokeWidth={1.5}
              />
            </div>
            <div>
              <h2
                id="plugin-manager-title"
                class="text-xl font-bold text-neutral-900 dark:text-white"
              >
                Plugin Manager
              </h2>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                Extend functionality with custom plugins
              </p>
            </div>
          </div>
          <button
            on:click={() => (isOpen = false)}
            aria-label="Close plugin manager"
            class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
          >
            <CloseIcon className="size-6" />
          </button>
        </div>

        <!-- Search Bar -->
        <div class="relative w-full">
          <div
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
          >
            <SearchIcon className="size-5 text-neutral-400" strokeWidth={1.5} />
          </div>
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search plugins..."
            class="w-full pl-10 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 border-none rounded-lg text-neutral-900 dark:text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
          />
        </div>
      </div>

      <!-- Main Content -->
      <div class="w-full flex-1 overflow-y-auto mb-6 pr-1">
        {#if $pluginsStore.length === 0}
          <div
            class="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800/30"
          >
            <div
              class="p-4 bg-white dark:bg-neutral-800 rounded-full shadow-sm mb-4"
            >
              <FolderIcon className="size-8 text-neutral-400" strokeWidth={1.5} />
            </div>
            <h3 class="text-lg font-medium text-neutral-900 dark:text-white">
              No Plugins Installed
            </h3>
            <p
              class="text-neutral-500 dark:text-neutral-400 max-w-sm mt-2 mb-6"
            >
              Add Javascript (.js) or TypeScript (.ts) plugin files to your
              plugins folder to extend the visualizer's capabilities.
            </p>
            <button
              on:click={() => PluginManager.openPluginsFolder()}
              class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors font-medium shadow-sm hover:shadow"
            >
              Open Plugins Folder
            </button>
          </div>
        {:else if filteredPlugins.length === 0}
          <div
            class="flex flex-col items-center justify-center py-12 text-center"
          >
            <p class="text-neutral-500 dark:text-neutral-400">
              No plugins match "{searchQuery}"
            </p>
          </div>
        {:else}
          <div class="space-y-4">
            <!-- Loaded Plugins -->
            {#if loadedPlugins.length > 0}
              <div>
                <h3
                  class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3 ml-1"
                >
                  Installed Plugins ({loadedPlugins.length})
                </h3>
                <div class="space-y-3">
                  {#each loadedPlugins as plugin (plugin.name)}
                    <div
                      class="flex items-start justify-between p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm transition-all hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md"
                    >
                      <div class="flex items-start gap-4 flex-1 min-w-0">
                        <div
                          class="mt-1 p-2 rounded-lg {plugin.enabled
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500'}"
                        >
                          <PluginIcon className="size-5" />
                        </div>
                        <div class="min-w-0">
                          <div
                            class="font-medium text-neutral-900 dark:text-white truncate"
                            title={plugin.name}
                          >
                            {plugin.name}
                          </div>
                          <div
                            class="text-xs mt-1 {plugin.enabled
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-neutral-500 dark:text-neutral-400'}"
                          >
                            {plugin.enabled ? "Active" : "Disabled"}
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center gap-4 ml-4">
                        <label
                          class="relative inline-flex items-center cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={plugin.enabled}
                            on:change={(e) =>
                              PluginManager.togglePlugin(
                                plugin.name,
                                e.currentTarget.checked,
                              )}
                            class="sr-only peer"
                          />
                          <div
                            class="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-purple-600"
                          ></div>
                        </label>

                        <button
                          on:click={() => (pluginToDelete = plugin)}
                          class="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          aria-label="Delete plugin"
                        >
                          <TrashIcon className="size-5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Failed Plugins -->
            {#if errorPlugins.length > 0}
              <div>
                <h3
                  class="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3 ml-1 mt-6"
                >
                  Failed to Load ({errorPlugins.length})
                </h3>
                <div class="space-y-3">
                  {#each errorPlugins as plugin (plugin.name)}
                    <div
                      class="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800/50"
                    >
                      <div class="flex items-start justify-between">
                        <div class="flex items-start gap-4 flex-1 min-w-0">
                          <div
                            class="mt-1 p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                          >
                            <AlertIcon className="size-5" />
                          </div>
                          <div class="flex-1 min-w-0">
                            <div
                              class="font-medium text-red-900 dark:text-red-200 truncate"
                              title={plugin.name}
                            >
                              {plugin.name}
                            </div>
                            <div
                              class="text-sm mt-1 text-red-700 dark:text-red-300 break-words font-mono bg-red-100 dark:bg-red-900/20 p-2 rounded"
                            >
                              {plugin.error || "Unknown error"}
                            </div>
                          </div>
                        </div>
                        <button
                          on:click={() => (pluginToDelete = plugin)}
                          class="ml-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          aria-label="Delete plugin"
                        >
                          <TrashIcon className="size-5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div
        class="flex justify-between items-center w-full pt-4 border-t border-neutral-200 dark:border-neutral-800"
      >
        <div class="flex gap-3">
          <button
            on:click={() => PluginManager.openPluginsFolder()}
            class="px-4 py-2 text-sm bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-md transition-colors flex items-center gap-2 font-medium"
          >
            <FolderIcon className="size-4" />
            Open Folder
          </button>
          <button
            on:click={() => PluginManager.reloadPlugins()}
            class="px-4 py-2 text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md transition-colors flex items-center gap-2 font-medium"
          >
            <RefreshIcon className="size-4" />
            Reload Plugins
          </button>
        </div>

        <button
          on:click={() => (isOpen = false)}
          class="px-5 py-2 text-sm bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-md transition-colors font-medium shadow-sm"
        >
          Done
        </button>
      </div>

      <!-- Delete Confirmation Dialog -->
      {#if pluginToDelete}
        <div
          transition:fade={{ duration: 200 }}
          class="absolute inset-0 bg-white/95 dark:bg-neutral-900/95 z-10 rounded-lg flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm"
        >
          <div class="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mb-4">
            <TrashIcon
              className="size-8 text-red-600 dark:text-red-400"
              strokeWidth={2}
            />
          </div>
          <h3 class="text-xl font-bold text-neutral-900 dark:text-white mb-2">
            Delete Plugin?
          </h3>
          <p class="text-neutral-500 dark:text-neutral-400 mb-6">
            Are you sure you want to delete <span
              class="font-bold text-neutral-900 dark:text-neutral-300"
              >{pluginToDelete.name}</span
            >? This action cannot be undone.
          </p>
          <div class="flex gap-3 w-full max-w-xs">
            <button
              on:click={() => (pluginToDelete = null)}
              class="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              on:click={confirmDelete}
              class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              Delete
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* Custom Scrollbar for the list */
  ::-webkit-scrollbar {
    width: 8px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  :global(.dark) ::-webkit-scrollbar-thumb {
    background: #475569;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  :global(.dark) ::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }
</style>
