<!-- Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0. -->
<script lang="ts">
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import { showUpdateAvailableDialog, updateDataStore } from "../../../stores";

  export let show = false;

  let updateData: {
    version: string;
    releaseNotes: string;
    url: string;
  } | null = null;
  $: updateData = $updateDataStore;

  let isWindows = false;
  let isStore = false;

  onMount(async () => {
    const api = (window as any).electronAPI;
    if (api) {
      // Check platform
      const userAgent = window.navigator.userAgent;
      isWindows = userAgent.indexOf("Windows") !== -1;

      if (api.isWindowsStore) {
        isStore = await api.isWindowsStore();
      }
    }
  });

  function close() {
    showUpdateAvailableDialog.set(false);
  }

  function handleDownload() {
    const api = (window as any).electronAPI;
    if (api && updateData) {
      if (api.downloadUpdate) {
        // Pass version and url
        api.downloadUpdate(updateData.version, updateData.url);
      } else if (api.openExternal) {
        // Fallback
        api.openExternal(updateData.url);
      }
    }
    close();
  }

  function handleSkip() {
    const api = (window as any).electronAPI;
    if (api && updateData && api.skipUpdate) {
      api.skipUpdate(updateData.version);
    }
    close();
  }

  function handleSwitchToStore() {
    const api = (window as any).electronAPI;
    if (api && api.openExternal) {
      // URL from README
      api.openExternal(
        "https://www.microsoft.com/en-us/p/frc-pathplanner/9nqbkb5dw909?cid=storebadge&ocid=badge&rtc=1&activetab=pivot:overviewtab",
      );
    }
    close();
  }
</script>

{#if show && updateData}
  <div
    class="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    transition:fade={{ duration: 200 }}
  >
    <div
      class="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200 dark:border-neutral-800 flex flex-col"
      transition:fly={{ y: 20, duration: 300, easing: cubicInOut }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-title"
    >
      <!-- Header -->
      <div
        class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-start gap-4"
      >
        <div class="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <div>
          <h2 id="update-title" class="text-2xl font-bold">
            Update Available!
          </h2>
          <p class="text-blue-100 mt-1">
            Version {updateData.version} is ready to install.
          </p>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- MS Store Recommendation -->
        {#if isWindows && !isStore}
          <div
            class="bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 flex gap-4"
          >
            <div class="flex-shrink-0 pt-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="w-8 h-8 text-blue-500"
              >
                <path
                  d="M2 3h9v9H2V3zm9 18H2v-9h9v9zm2-18v9h9V3h-9zm9 18h-9v-9h9v9z"
                />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-white">
                Get Automatic Updates
              </h3>
              <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Switch to the Microsoft Store version for a seamless,
                auto-updating experience.
              </p>
              <button
                on:click={handleSwitchToStore}
                class="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Get it on Microsoft Store
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3 w-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        {/if}

        <!-- Release Notes Preview -->
        <div>
          <h3
            class="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2"
          >
            What's New
          </h3>
          <div
            class="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4 max-h-48 overflow-y-auto text-sm text-neutral-700 dark:text-neutral-300 prose prose-sm dark:prose-invert"
          >
            <!-- Render simplified text or handle markdown if possible, for now just text -->
            <p class="whitespace-pre-wrap">{updateData.releaseNotes}</p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div
        class="bg-neutral-50 dark:bg-neutral-950 p-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row gap-3 justify-end"
      >
        <button
          on:click={handleSkip}
          class="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          Skip This Version
        </button>
        <button
          on:click={close}
          class="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          Remind Me Later
        </button>
        <button
          on:click={handleDownload}
          class="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download & Install
        </button>
      </div>
    </div>
  </div>
{/if}
