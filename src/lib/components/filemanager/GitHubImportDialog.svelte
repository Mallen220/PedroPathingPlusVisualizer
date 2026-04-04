<!-- Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0. -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { CloseIcon, CloudArrowDownIcon, FolderIcon } from "../icons";

  interface Props {
    isOpen: boolean;
    initialUrl?: string;
    targetDirectory: string;
  }

  let { isOpen = $bindable(false), initialUrl = "", targetDirectory }: Props = $props();

  const dispatch = createEventDispatcher<{ imported: void }>();

  let repoUrl = $state("");
  let loadingFolders = $state(false);

  // Keep repoUrl in sync if initialUrl changes
  $effect(() => {
    if (initialUrl !== undefined && initialUrl !== repoUrl) {
      repoUrl = initialUrl;
    }
  });
  let errorMsg = $state("");
  let folders: string[] = $state([]);
  let selectedFolder = $state("");
  let pulling = $state(false);

  async function handleFindFolders() {
    if (!repoUrl) return;
    loadingFolders = true;
    errorMsg = "";
    folders = [];
    selectedFolder = "";

    try {
      if (!window.electronAPI || !window.electronAPI.gitListGithubFolders) {
        throw new Error("GitHub import is only available in the desktop app");
      }

      // Add https:// if missing
      let urlToUse = repoUrl;
      if (urlToUse.startsWith("github.com")) {
        urlToUse = "https://" + urlToUse;
      }

      const res = await window.electronAPI.gitListGithubFolders(urlToUse);
      if (res.success && res.folders) {
        folders = res.folders;
        if (folders.length === 0) {
          errorMsg = "No .turt or .pp files found in this repository";
        } else {
          selectedFolder = folders[0];
        }
      } else {
        errorMsg = res.error || "Failed to find folders";
      }
    } catch (e: any) {
      errorMsg = e.message;
    } finally {
      loadingFolders = false;
    }
  }

  async function handlePull() {
    if (!repoUrl || !selectedFolder) return;
    pulling = true;
    errorMsg = "";

    try {
      if (!window.electronAPI || !window.electronAPI.gitPullFromGithub) {
        throw new Error("GitHub import is only available in the desktop app");
      }

      let urlToUse = repoUrl;
      if (urlToUse.startsWith("github.com")) {
        urlToUse = "https://" + urlToUse;
      }

      const res = await window.electronAPI.gitPullFromGithub(urlToUse, targetDirectory, selectedFolder);
      if (res.success) {
        dispatch("imported");
        isOpen = false;
      } else {
        errorMsg = res.error || "Failed to pull files";
      }
    } catch (e: any) {
      errorMsg = e.message;
    } finally {
      pulling = false;
    }
  }

  // If initialUrl is provided on mount, automatically start finding folders
  $effect(() => {
    if (initialUrl && initialUrl.trim() !== "" && folders.length === 0 && !loadingFolders) {
      handleFindFolders();
    }
  });

</script>

{#if isOpen}
  <div class="fixed inset-0 z-[1100] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/50 backdrop-blur-sm"
      onclick={() => (isOpen = false)}
      role="button"
      tabindex="0"
      aria-label="Close dialog"
      onkeydown={(e) => {
        if (e.key === "Escape") isOpen = false;
      }}
    ></div>

    <!-- Dialog -->
    <div class="relative bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-md flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
        <h2 class="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <CloudArrowDownIcon className="size-5 text-sky-500" />
          Pull from GitHub
        </h2>
        <button
          onclick={() => (isOpen = false)}
          class="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          aria-label="Close"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-4 flex flex-col gap-4">
        {#if errorMsg}
          <div class="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded border border-red-200 dark:border-red-900/30">
            {errorMsg}
          </div>
        {/if}

        <div class="flex flex-col gap-1">
          <label for="github-url" class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            GitHub Repository URL
          </label>
          <div class="flex gap-2">
            <input
              id="github-url"
              type="text"
              bind:value={repoUrl}
              placeholder="https://github.com/user/repo"
              class="flex-1 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              onkeydown={(e) => e.key === "Enter" && handleFindFolders()}
              disabled={loadingFolders || pulling}
            />
            <button
              onclick={handleFindFolders}
              disabled={loadingFolders || pulling || !repoUrl}
              class="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-sm rounded font-medium hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if loadingFolders}
                Searching...
              {:else}
                Find Folders
              {/if}
            </button>
          </div>
        </div>

        {#if folders.length > 0}
          <div class="flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <label for="folder-select" class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Select Base Directory
            </label>
            <div class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              Select the directory in the repository containing the project files.
            </div>
            <select
              id="folder-select"
              bind:value={selectedFolder}
              class="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={pulling}
            >
              {#each folders as folder}
                <option value={folder}>
                  {folder === "/" ? "Root Directory (/)" : folder}
                </option>
              {/each}
            </select>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 flex justify-end gap-2">
        <button
          onclick={() => (isOpen = false)}
          disabled={pulling}
          class="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onclick={handlePull}
          disabled={pulling || folders.length === 0 || !selectedFolder}
          class="px-4 py-2 text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 rounded transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if pulling}
            <div class="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Pulling...
          {:else}
            Pull Files
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
