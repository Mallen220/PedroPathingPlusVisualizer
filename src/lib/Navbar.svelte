<!-- Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0. -->
<script lang="ts">
  import type { Point, Line, Shape, Settings, SequenceItem } from "../types";
  import { onMount, onDestroy } from "svelte";
  import {
    showRuler,
    showProtractor,
    showGrid,
    protractorLockToRobot,
    gridSize,
    currentFilePath,
    isUnsaved,
    snapToGrid,
    showSettings,
    exportDialogState,
    showFileManager,
    gitStatusStore,
    showPluginManager,
    startTutorial,
  } from "../stores";
  import { getRandomColor } from "../utils";
  import {
    SaveIcon,
    MenuIcon,
    GitModifiedIcon,
    GitStagedIcon,
    GitUntrackedIcon,
    UndoIcon,
    RedoIcon,
    SidebarLeftIcon,
    SidebarBottomIcon,
    SidebarHiddenIcon,
    ViewOptionsIcon,
    RulerIcon,
    ProtractorIcon,
    RobotLockIcon,
    RobotUnlockIcon,
    GridIcon,
    SnapIcon,
    ChevronDownIcon,
    NewFileIcon,
    TelemetryIcon,
    SettingsIcon,
    TutorialIcon,
    GitHubIcon,
  } from "../icons";
  import { calculatePathTime, formatTime } from "../utils";
  import { showShortcuts } from "../stores";
  import { customExportersStore } from "./pluginsStore";
  import { navbarActionRegistry } from "./registries";
  import { menuNavigation } from "./actions/menuNavigation";
  import TelemetryDialog from "./components/dialogs/TelemetryDialog.svelte";
  export let startPoint: Point;
  export let lines: Line[];
  export let sequence: SequenceItem[];
  export let robotLength: number;
  export let robotWidth: number;
  export let settings: Settings;

  export let showSidebar = true;
  export let isLargeScreen = true;

  export let saveProject: () => any;
  export let resetProject: () => any;
  export let saveFileAs: () => any;
  export let exportGif: () => any;
  export let undoAction: () => any;
  export let redoAction: () => any;
  export const recordChange: () => any = () => {};
  export let canUndo: boolean;
  export let canRedo: boolean;

  let shortcutsOpen = false;
  let exportMenuOpen = false;
  let showTelemetryDialog = false;

  let saveDropdownOpen = false;
  let saveDropdownRef: HTMLElement;
  let saveButtonRef: HTMLElement;
  let exportMenuRef: HTMLElement;
  let exportButtonRef: HTMLElement;

  let selectedGridSize = 12;
  const gridSizeOptions = [1, 3, 6, 12, 24];

  $: timePrediction = calculatePathTime(startPoint, lines, settings, sequence);

  onMount(() => {
    const unsubscribeGridSize = gridSize.subscribe((value) => {
      selectedGridSize = value;
    });

    return () => {
      unsubscribeGridSize();
    };
  });

  // Sync local state with global store for shortcuts
  onMount(() => {
    const unsubscribeShortcuts = showShortcuts.subscribe((value) => {
      shortcutsOpen = value;
    });

    return () => {
      unsubscribeShortcuts();
    };
  });

  // Update store when local state changes (from closing dialog)
  $: showShortcuts.set(shortcutsOpen);

  function handleGridSizeChange(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    selectedGridSize = value;
    gridSize.set(value);
  }

  function handleExport(
    format: "java" | "points" | "sequential" | "json" | "custom",
    exporterName?: string,
  ) {
    exportMenuOpen = false;
    exportDialogState.set({ isOpen: true, format, exporterName });
  }

  $: if (settings) {
    settings.rWidth = robotWidth;
    settings.rLength = robotLength;
  }

  function handleClickOutside(event: MouseEvent) {
    if (
      saveDropdownOpen &&
      saveDropdownRef &&
      !saveDropdownRef.contains(event.target as Node) &&
      saveButtonRef &&
      !saveButtonRef.contains(event.target as Node)
    ) {
      saveDropdownOpen = false;
    }

    if (
      exportMenuOpen &&
      exportMenuRef &&
      !exportMenuRef.contains(event.target as Node) &&
      exportButtonRef &&
      !exportButtonRef.contains(event.target as Node)
    ) {
      exportMenuOpen = false;
    }

    if (
      viewOptionsOpen &&
      viewOptionsRef &&
      !viewOptionsRef.contains(event.target as Node) &&
      viewOptionsButtonRef &&
      !viewOptionsButtonRef.contains(event.target as Node)
    ) {
      viewOptionsOpen = false;
    }
  }

  // Handle Escape key to close dropdown
  function handleKeyDown(event: KeyboardEvent) {
    if (saveDropdownOpen && event.key === "Escape") {
      saveDropdownOpen = false;
    }
    if (exportMenuOpen && event.key === "Escape") {
      exportMenuOpen = false;
    }
  }

  let viewOptionsOpen = false;
  let viewOptionsRef: HTMLElement;
  let viewOptionsButtonRef: HTMLElement;

  $: leftActions = $navbarActionRegistry
    .filter((a) => a.location === "left")
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  $: centerActions = $navbarActionRegistry
    .filter((a) => a.location === "center")
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  $: rightActions = $navbarActionRegistry
    .filter((a) => !a.location || a.location === "right")
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
  });

  onDestroy(() => {
    document.removeEventListener("click", handleClickOutside);
    document.removeEventListener("keydown", handleKeyDown);
  });
</script>

<div
  class="w-full z-50 bg-neutral-50 dark:bg-neutral-900 shadow-md flex flex-wrap justify-between items-center px-4 md:px-6 py-3 border-b border-neutral-200 dark:border-neutral-800"
>
  <!-- Left: Brand & File -->
  <div class="flex items-center gap-4">
    <!-- Menu Button (Mobile/Sidebar toggle for consistency if desired, or just File Manager) -->
    <button
      id="file-manager-btn"
      title="Open File Manager"
      aria-label="Open File Manager"
      on:click={() => showFileManager.set(true)}
      class="text-neutral-700 dark:text-neutral-200 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
    >
      <MenuIcon className="size-6" />
    </button>

    <div class="flex flex-col">
      <span
        class="font-bold text-lg leading-tight tracking-tight text-neutral-900 dark:text-neutral-100"
        >Pedro Pathing Visualizer</span
      >
      {#if $currentFilePath}
        <div
          class="flex items-center text-xs text-neutral-500 dark:text-neutral-400"
        >
          <span class="truncate max-w-[200px]"
            >{$currentFilePath.split(/[\\/]/).pop()}</span
          >
          {#if settings.gitIntegration && $gitStatusStore[$currentFilePath] && $gitStatusStore[$currentFilePath] !== "clean"}
            <div
              class="ml-2 text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 whitespace-nowrap
                {$gitStatusStore[$currentFilePath] === 'modified'
                ? 'bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-900/50 dark:border-amber-700 dark:text-amber-300'
                : $gitStatusStore[$currentFilePath] === 'staged'
                  ? 'bg-green-100 border-green-200 text-green-700 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-300'}"
              title={$gitStatusStore[$currentFilePath] === "modified"
                ? "Git: Modified (Unstaged Changes)"
                : $gitStatusStore[$currentFilePath] === "staged"
                  ? "Git: Staged (Ready to Commit)"
                  : "Git: Untracked (New File)"}
            >
              {#if $gitStatusStore[$currentFilePath] === "modified"}
                <GitModifiedIcon className="size-3 flex-shrink-0" />
                <span>Modified</span>
              {:else if $gitStatusStore[$currentFilePath] === "staged"}
                <GitStagedIcon className="size-3 flex-shrink-0" />
                <span>Staged</span>
              {:else}
                <GitUntrackedIcon className="size-3 flex-shrink-0" />
                <span>Untracked</span>
              {/if}
            </div>
          {/if}
          {#if $isUnsaved}
            <span class="text-amber-500 font-bold ml-1" title="Unsaved changes"
              >*</span
            >
          {/if}
        </div>
      {:else}
        <span class="text-xs text-neutral-500 dark:text-neutral-400"
          >Untitled Project</span
        >
      {/if}
    </div>

    {#each leftActions as action (action.id)}
      <button
        title={action.title}
        aria-label={action.title}
        on:click={action.onClick}
        class="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
      >
        {@html action.icon}
      </button>
    {/each}
  </div>

  <!-- Center: Contextual Info (Desktop only usually) -->
  {#if true}
    <!-- Always show stats, perhaps stacked or abbreviated on mobile via CSS if needed -->
    <div class="flex items-center gap-6 text-sm hidden md:flex">
      <div class="flex flex-col items-center">
        <span
          class="text-xs text-neutral-400 font-medium uppercase tracking-wider"
          >Est. Time</span
        >
        <span class="font-semibold text-neutral-800 dark:text-neutral-200"
          >{formatTime(timePrediction.totalTime)}</span
        >
      </div>
      <div class="w-px h-6 bg-neutral-200 dark:bg-neutral-700"></div>
      <div class="flex flex-col items-center">
        <span
          class="text-xs text-neutral-400 font-medium uppercase tracking-wider"
          >Distance</span
        >
        <span class="font-semibold text-neutral-800 dark:text-neutral-200"
          >{(timePrediction?.totalDistance ?? 0).toFixed(0)} in</span
        >
      </div>
    </div>
    <!-- Mobile version of stats -->
    <div
      class="flex flex-col md:hidden text-xs text-neutral-600 dark:text-neutral-300"
    >
      <span>{formatTime(timePrediction?.totalTime ?? 0)}</span>
      <span>{(timePrediction?.totalDistance ?? 0).toFixed(0)} in</span>
    </div>

    {#each centerActions as action (action.id)}
      <button
        title={action.title}
        aria-label={action.title}
        on:click={action.onClick}
        class="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors hidden md:block"
      >
        {@html action.icon}
      </button>
    {/each}
  {/if}

  <!-- Right: Toolbar Actions -->
  <div class="flex items-center gap-2 md:gap-3">
    <!-- Undo/Redo Group -->
    <div class="flex items-center gap-1">
      <button
        title="Undo"
        aria-label="Undo"
        on:click={undoAction}
        disabled={!canUndo}
        class="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <UndoIcon className="size-5" />
      </button>
      <button
        title="Redo"
        aria-label="Redo"
        on:click={redoAction}
        disabled={!canRedo}
        class="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <RedoIcon className="size-5" />
      </button>
    </div>

    <div
      class="w-px h-6 bg-neutral-200 dark:bg-neutral-700 hidden md:block"
    ></div>

    <!-- Sidebar Toggle -->
    <button
      id="sidebar-toggle-btn"
      title={showSidebar ? "Hide Sidebar" : "Show Sidebar"}
      aria-label={showSidebar ? "Hide Sidebar" : "Show Sidebar"}
      on:click={() => (showSidebar = !showSidebar)}
      class="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
    >
      {#if showSidebar && isLargeScreen}
        <!-- Sidebar visible: show icon with left pane -->
        <SidebarLeftIcon className="size-5" />
      {:else if showSidebar && !isLargeScreen}
        <!-- Shown on vertical: icon with bottom pane -->
        <SidebarBottomIcon className="size-5" />
      {:else}
        <!-- Hidden: Empty Box -->
        <SidebarHiddenIcon className="size-5" />
      {/if}
    </button>

    <!-- View Options: compact dropdown -->
    <div class="relative">
      <button
        bind:this={viewOptionsButtonRef}
        title="View Options"
        aria-haspopup="true"
        aria-expanded={viewOptionsOpen}
        on:click={() => (viewOptionsOpen = !viewOptionsOpen)}
        class="p-1.5 rounded-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-neutral-500 dark:text-neutral-400"
      >
        <!-- compact grid icon -->
        <ViewOptionsIcon className="size-5" />
      </button>

      {#if viewOptionsOpen}
        <div
          bind:this={viewOptionsRef}
          on:click|stopPropagation
          on:keydown|stopPropagation
          use:menuNavigation
          on:close={() => (viewOptionsOpen = false)}
          role="menu"
          tabindex="0"
          class="absolute right-0 mt-2 w-44 bg-white dark:bg-neutral-800 rounded-lg shadow-xl py-2 z-50 border border-neutral-200 dark:border-neutral-700 animate-in fade-in zoom-in-95 duration-100"
        >
          <!-- <div class="px-3 py-1 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-blue-500"></div>
              <div class="text-sm font-medium">View Options</div>
            </div>
            <button
              class="text-xs text-neutral-500"
              on:click={() => (viewOptionsOpen = false)}>Close</button
            >
          </div>-->

          <div class="px-2 py-2 grid grid-cols-1 gap-1">
            <button
              title="Toggle Ruler"
              aria-label="Toggle Ruler"
              role="menuitemcheckbox"
              aria-checked={$showRuler}
              on:click={() => showRuler.update((v) => !v)}
              class="flex items-center gap-3 w-full px-2 py-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors group text-left"
            >
              <div
                class="p-0.5 rounded-sm group-hover:bg-white dark:group-hover:bg-neutral-600 transition-colors {$showRuler
                  ? 'text-blue-500'
                  : 'text-neutral-500 dark:text-neutral-400'}"
              >
                <RulerIcon size="20" />
              </div>
              <span class="text-sm text-neutral-700 dark:text-neutral-200"
                >Ruler</span
              >
            </button>

            <button
              title="Toggle Protractor"
              aria-label="Toggle Protractor"
              role="menuitemcheckbox"
              aria-checked={$showProtractor}
              on:click={() => showProtractor.update((v) => !v)}
              class="flex items-center gap-3 w-full px-2 py-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors group text-left"
            >
              <div
                class="p-0.5 rounded-sm group-hover:bg-white dark:group-hover:bg-neutral-600 transition-colors {$showProtractor
                  ? 'text-blue-500'
                  : 'text-neutral-500 dark:text-neutral-400'}"
              >
                <ProtractorIcon size="20" />
              </div>
              <span class="text-sm text-neutral-700 dark:text-neutral-200"
                >Protractor</span
              >
            </button>

            {#if $showProtractor}
              <button
                title={$protractorLockToRobot
                  ? "Unlock Protractor from Robot"
                  : "Lock Protractor to Robot"}
                aria-label={$protractorLockToRobot
                  ? "Unlock Protractor from Robot"
                  : "Lock Protractor to Robot"}
                role="menuitemcheckbox"
                aria-checked={$protractorLockToRobot}
                on:click={() => protractorLockToRobot.update((v) => !v)}
                class="flex items-center gap-3 w-full px-2 py-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors group text-left"
              >
                <div
                  class="p-0.5 rounded-sm group-hover:bg-white dark:group-hover:bg-neutral-600 transition-colors {$protractorLockToRobot
                    ? 'text-amber-500'
                    : 'text-neutral-500 dark:text-neutral-400'}"
                >
                  {#if $protractorLockToRobot}
                    <RobotLockIcon size="20" />
                  {:else}
                    <RobotUnlockIcon size="20" />
                  {/if}
                </div>
                <span class="text-sm text-neutral-700 dark:text-neutral-200"
                  >Lock to Robot</span
                >
              </button>
            {/if}

            <button
              title="Toggle Grid"
              aria-label="Toggle Grid"
              role="menuitemcheckbox"
              aria-checked={$showGrid}
              on:click={() => showGrid.update((v) => !v)}
              class="flex items-center gap-3 w-full px-2 py-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors group text-left"
            >
              <div
                class="p-0.5 rounded-sm group-hover:bg-white dark:group-hover:bg-neutral-600 transition-colors {$showGrid
                  ? 'text-blue-500'
                  : 'text-neutral-500 dark:text-neutral-400'}"
              >
                <GridIcon size="20" />
              </div>
              <span class="text-sm text-neutral-700 dark:text-neutral-200"
                >Grid</span
              >
            </button>

            {#if $showGrid}
              <div class="flex items-center justify-between px-2 py-1.5">
                <div class="flex items-center gap-2 w-full">
                  <button
                    title={$snapToGrid ? "Disable Snap" : "Enable Snap"}
                    aria-label={$snapToGrid ? "Disable Snap" : "Enable Snap"}
                    role="menuitemcheckbox"
                    aria-checked={$snapToGrid}
                    on:click={() => snapToGrid.update((v) => !v)}
                    class="flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md py-1 px-2 -ml-2 transition-colors group"
                  >
                    <div
                      class="p-0.5 rounded-sm group-hover:bg-white dark:group-hover:bg-neutral-600 transition-colors {$snapToGrid
                        ? 'text-green-500'
                        : 'text-neutral-400'}"
                    >
                      <SnapIcon size="20" />
                    </div>
                    <span class="text-sm text-neutral-700 dark:text-neutral-200"
                      >Snap</span
                    >
                  </button>
                  <div class="ml-auto">
                    <select
                      class="bg-transparent text-sm text-neutral-600 dark:text-neutral-300 focus:outline-none cursor-pointer pl-1 pr-3 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
                      bind:value={selectedGridSize}
                      on:change={handleGridSizeChange}
                      aria-label="Select grid spacing"
                    >
                      {#each gridSizeOptions as option}
                        <option value={option}>{option}"</option>
                      {/each}
                    </select>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <div
      class="w-px h-6 bg-neutral-200 dark:bg-neutral-700 hidden md:block"
    ></div>

    <!-- Main Actions -->
    <div class="flex items-center gap-2">
      <!-- Save -->
      <div class="relative">
        <button
          id="save-project-btn"
          bind:this={saveButtonRef}
          on:click={() => (saveDropdownOpen = !saveDropdownOpen)}
          class="flex items-center gap-1 p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
          title="Save Options"
          aria-label="Save Options"
        >
          <SaveIcon className="size-5" />
          <ChevronDownIcon
            className="size-3 transition-transform {saveDropdownOpen
              ? 'rotate-180'
              : ''}"
          />
        </button>

        {#if saveDropdownOpen}
          <div
            bind:this={saveDropdownRef}
            use:menuNavigation
            on:close={() => (saveDropdownOpen = false)}
            class="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl py-1 z-50 border border-neutral-200 dark:border-neutral-700 animate-in fade-in zoom-in-95 duration-100"
          >
            <button
              on:click={() => {
                saveProject();
                saveDropdownOpen = false;
              }}
              class="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              <span class="font-medium">Save</span>
            </button>
            <button
              on:click={() => {
                saveFileAs();
                saveDropdownOpen = false;
              }}
              class="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              <span class="font-medium">Save As...</span>
            </button>
          </div>
        {/if}
      </div>

      <!-- Export -->
      <div class="relative">
        <button
          id="export-project-btn"
          bind:this={exportButtonRef}
          on:click={() => (exportMenuOpen = !exportMenuOpen)}
          class="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md shadow-sm transition-colors text-sm font-medium"
        >
          <span>Export</span>
          <ChevronDownIcon
            className="size-3 transition-transform {exportMenuOpen
              ? 'rotate-180'
              : ''}"
          />
        </button>
        {#if exportMenuOpen}
          <div
            bind:this={exportMenuRef}
            use:menuNavigation
            on:close={() => (exportMenuOpen = false)}
            class="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded-lg shadow-xl py-1 z-50 border border-neutral-200 dark:border-neutral-700 animate-in fade-in zoom-in-95 duration-100"
          >
            <button
              on:click={() => handleExport("java")}
              class="block w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >Java Code</button
            >
            <button
              on:click={() => handleExport("points")}
              class="block w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >Points Array</button
            >
            <button
              on:click={() => handleExport("sequential")}
              class="block w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >Sequential Command</button
            >
            <button
              on:click={() => handleExport("json")}
              class="block w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >.pp File</button
            >

            <div class="h-px bg-neutral-200 dark:bg-neutral-700 my-1"></div>
            <button
              on:click={() => {
                exportMenuOpen = false;
                exportGif && exportGif();
              }}
              class="block w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >Export Animated</button
            >

            {#if $customExportersStore.length > 0}
              <div class="h-px bg-neutral-200 dark:bg-neutral-700 my-1"></div>
              <div
                class="px-4 py-1 text-xs font-semibold text-neutral-500 uppercase tracking-wider"
              >
                Plugins
              </div>
              {#each $customExportersStore as exporter}
                <button
                  on:click={() => handleExport("custom", exporter.name)}
                  class="block w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  {exporter.name}
                </button>
              {/each}
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <!-- More Options -->
    <div class="flex items-center gap-1 ml-2">
      {#each rightActions as action (action.id)}
        <button
          title={action.title}
          aria-label={action.title}
          on:click={action.onClick}
          class="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
        >
          {@html action.icon}
        </button>
      {/each}

      <div
        class="h-6 border-l border-neutral-300 dark:border-neutral-700 mx-4"
        aria-hidden="true"
      ></div>

      <!-- New Project -->
      <button
        id="new-project-btn"
        title="New Project"
        aria-label="New Project"
        on:click={() => resetProject()}
        class="relative group p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
      >
        <NewFileIcon className="size-6" />
      </button>

      <!-- Telemetry Button -->
      <button
        title="Telemetry"
        aria-label="Telemetry"
        on:click={() => (showTelemetryDialog = true)}
        class="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
      >
        <TelemetryIcon className="size-5" />
      </button>

      <!-- Settings Button -->
      <button
        id="settings-btn"
        title="Settings"
        aria-label="Settings"
        on:click={() => showSettings.set(true)}
        class="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
      >
        <SettingsIcon className="size-5" />
      </button>

      <!-- Tutorial Button -->
      <button
        title="Start Tutorial"
        aria-label="Start Tutorial"
        on:click={() => startTutorial.set(true)}
        class="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
      >
        <TutorialIcon className="size-5" />
      </button>

      <!-- GitHub Repo Link -->
      <a
        target="_blank"
        rel="norefferer"
        title="GitHub Repo"
        aria-label="GitHub Repository"
        href="https://github.com/Mallen220/PedroPathingVisualizer"
        class="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
      >
        <GitHubIcon className="size-5 dark:fill-white" />
      </a>
    </div>
  </div>
</div>

<TelemetryDialog bind:isOpen={showTelemetryDialog} />
