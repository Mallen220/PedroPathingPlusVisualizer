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
    showShortcuts,
  } from "../stores";
  import {
    getDefaultStartPoint,
    getDefaultLines,
    getDefaultShapes,
  } from "../config";
  import FileManager from "./FileManager.svelte";
  import SettingsDialog from "./components/SettingsDialog.svelte";
  import KeyboardShortcutsDialog from "./components/KeyboardShortcutsDialog.svelte";
  import ExportCodeDialog from "./components/ExportCodeDialog.svelte";
  import { calculatePathTime, formatTime } from "../utils";
  import MenuDropdown from "./components/common/MenuDropdown.svelte";
  import MenuItem from "./components/common/MenuItem.svelte";

  export let loadFile: (evt: any) => any;

  export let startPoint: Point;
  export let lines: Line[];
  export let shapes: Shape[];
  export let sequence: SequenceItem[];
  export let robotLength: number;
  export let robotWidth: number;
  export let settings: Settings;

  export let showSidebar = true;
  export let isLargeScreen = true;

  export let saveProject: () => any;
  export let saveFileAs: () => any;
  export let exportGif: () => any;
  export let undoAction: () => any;
  export let redoAction: () => any;
  export let recordChange: () => any;
  export let canUndo: boolean;
  export let canRedo: boolean;

  let fileManagerOpen = false;
  let shortcutsOpen = false;
  let exportDialog: ExportCodeDialog;

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

  // Update store when local state changes
  $: showShortcuts.set(shortcutsOpen);

  // Sync export dialog state
  $: if ($exportDialogState.isOpen && exportDialog) {
    exportDialog.openWithFormat($exportDialogState.format);
  }

  function handleGridSizeChange(size: number) {
    selectedGridSize = size;
    gridSize.set(size);
  }

  function handleExport(format: "java" | "points" | "sequential" | "json") {
    exportDialogState.set({ isOpen: true, format });
  }

  function resetPath() {
    startPoint = getDefaultStartPoint();
    lines = getDefaultLines();
    sequence = lines.map((ln) => ({
      kind: "path",
      lineId: ln.id || `line-${Math.random().toString(36).slice(2)}`,
    }));
    shapes = getDefaultShapes();
  }

  function handleResetPathWithConfirmation() {
    const hasChanges = $isUnsaved || lines.length > 1 || shapes.length > 0;
    let message = "Are you sure you want to reset the path?\n\n";

    if (hasChanges) {
      if ($currentFilePath) {
        message += `This will reset "${$currentFilePath.split(/[\\/]/).pop()}" to the default path.`;
      } else {
        message += "This will reset your current work to the default path.";
      }
      if ($isUnsaved) {
        message += "\n\n⚠ WARNING: You have unsaved changes that will be lost!";
      }
    } else {
      message += "This will reset to the default starting path.";
    }

    message += "\n\nClick OK to reset, or Cancel to keep your current path.";

    if (confirm(message)) {
      resetPath();
      if (recordChange) recordChange();
    }
  }

  $: if (settings) {
    settings.rWidth = robotWidth;
    settings.rLength = robotLength;
  }
</script>

{#if fileManagerOpen}
  <FileManager
    bind:isOpen={fileManagerOpen}
    bind:startPoint
    bind:lines
    bind:shapes
    bind:sequence
    bind:settings
  />
{/if}

<ExportCodeDialog
  bind:this={exportDialog}
  bind:startPoint
  bind:lines
  bind:sequence
  bind:shapes
  bind:settings
/>

<SettingsDialog bind:isOpen={$showSettings} bind:settings />
<KeyboardShortcutsDialog bind:isOpen={shortcutsOpen} bind:settings />

<div
  class="w-full z-50 bg-white dark:bg-neutral-900 shadow-sm border-b border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between px-4 py-2 gap-2"
>
  <!-- Left Section: Title & Menu -->
  <div class="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
    <!-- Branding -->
    <div class="flex items-center gap-2 select-none">
      <!-- Icon/Logo Placeholder -->
      <div
        class="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm"
      >
        P
      </div>
      <div class="flex flex-col leading-tight">
        <span
          class="font-bold text-neutral-800 dark:text-neutral-100 tracking-tight"
          >Pedro Pathing</span
        >
        {#if $currentFilePath}
          <span
            class="text-xs text-neutral-500 dark:text-neutral-400 max-w-[150px] truncate"
            title={$currentFilePath}
          >
            {$currentFilePath.split(/[\\/]/).pop()}
            {#if $isUnsaved}
              <span class="text-amber-500 font-bold ml-0.5">*</span>
            {/if}
          </span>
        {:else}
          <span class="text-xs text-neutral-500 dark:text-neutral-400"
            >Untitled Project</span
          >
        {/if}
      </div>
    </div>

    <!-- Divider -->
    <div
      class="hidden md:block w-px h-8 bg-neutral-200 dark:bg-neutral-700"
    ></div>

    <!-- Menu Bar -->
    <div class="flex items-center gap-1 w-full md:w-auto overflow-x-auto">
      <MenuDropdown label="File">
        <MenuItem
          onClick={handleResetPathWithConfirmation}
          title="Reset to default path">New Project</MenuItem
        >
        <div class="h-px bg-neutral-200 dark:bg-neutral-700 my-1"></div>
        <MenuItem onClick={() => (fileManagerOpen = true)} title="Manage files"
          >Open File Manager</MenuItem
        >
        <MenuItem
          onClick={() => document.getElementById("file-upload")?.click()}
          title="Load .pp file from disk">Open External File...</MenuItem
        >
        <div class="h-px bg-neutral-200 dark:bg-neutral-700 my-1"></div>
        <MenuItem onClick={saveProject} title="Save current project"
          >Save</MenuItem
        >
        <MenuItem onClick={saveFileAs} title="Save as new file"
          >Save As...</MenuItem
        >
      </MenuDropdown>

      <MenuDropdown label="Edit">
        <MenuItem
          onClick={undoAction}
          disabled={!canUndo}
          title="Undo last action"
        >
          Undo
          <span slot="icon" class="text-xs text-neutral-400">Ctrl+Z</span>
        </MenuItem>
        <MenuItem
          onClick={redoAction}
          disabled={!canRedo}
          title="Redo last action"
        >
          Redo
          <span slot="icon" class="text-xs text-neutral-400">Ctrl+Y</span>
        </MenuItem>
        <div class="h-px bg-neutral-200 dark:bg-neutral-700 my-1"></div>
        <MenuItem onClick={() => showSettings.set(true)}>Settings</MenuItem>
      </MenuDropdown>

      <MenuDropdown label="View">
        <MenuItem
          onClick={() => (showSidebar = !showSidebar)}
          checked={showSidebar}
        >
          {isLargeScreen ? "Show Sidebar" : "Show Tab Panel"}
        </MenuItem>
        <div class="h-px bg-neutral-200 dark:bg-neutral-700 my-1"></div>
        <MenuItem onClick={() => showGrid.update((v) => !v)} checked={$showGrid}
          >Show Grid</MenuItem
        >
        <MenuItem
          onClick={() => snapToGrid.update((v) => !v)}
          checked={$snapToGrid}>Snap to Grid</MenuItem
        >
        <div
          class="px-4 py-1 text-xs text-neutral-500 font-semibold uppercase tracking-wider"
        >
          Grid Size
        </div>
        {#each gridSizeOptions as size}
          <MenuItem
            onClick={() => handleGridSizeChange(size)}
            checked={$gridSize === size && $showGrid}
            disabled={!$showGrid}
          >
            {size} inches
          </MenuItem>
        {/each}
        <div class="h-px bg-neutral-200 dark:bg-neutral-700 my-1"></div>
        <MenuItem
          onClick={() => showRuler.update((v) => !v)}
          checked={$showRuler}>Show Ruler</MenuItem
        >
        <MenuItem
          onClick={() => showProtractor.update((v) => !v)}
          checked={$showProtractor}>Show Protractor</MenuItem
        >
        <MenuItem
          onClick={() => protractorLockToRobot.update((v) => !v)}
          checked={$protractorLockToRobot}
          disabled={!$showProtractor}>Lock Protractor to Robot</MenuItem
        >
      </MenuDropdown>

      <MenuDropdown label="Export">
        <MenuItem onClick={() => handleExport("java")}>Java Code</MenuItem>
        <MenuItem onClick={() => handleExport("sequential")}
          >Sequential Command</MenuItem
        >
        <div class="h-px bg-neutral-200 dark:bg-neutral-700 my-1"></div>
        <MenuItem onClick={() => handleExport("points")}>Points Array</MenuItem>
        <MenuItem onClick={() => handleExport("json")}
          >Project File (.pp)</MenuItem
        >
        <MenuItem onClick={() => exportGif && exportGif()}>Export GIF</MenuItem>
      </MenuDropdown>

      <MenuDropdown label="Help">
        <MenuItem onClick={() => (shortcutsOpen = true)}
          >Keyboard Shortcuts</MenuItem
        >
        <MenuItem
          onClick={() =>
            window.open(
              "https://github.com/Mallen220/PedroPathingVisualizer",
              "_blank",
            )}>GitHub Repository</MenuItem
        >
      </MenuDropdown>
    </div>
  </div>

  <!-- Right Section: Toolbar & Status -->
  <div class="flex items-center gap-4">
    <!-- Quick Actions Toolbar -->
    <div
      class="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 gap-1"
    >
      <button
        on:click={undoAction}
        disabled={!canUndo}
        class="p-1.5 rounded-md hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-30 text-neutral-600 dark:text-neutral-300 transition-all shadow-sm disabled:shadow-none"
        title="Undo"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          class="w-4 h-4"
        >
          <path
            fill-rule="evenodd"
            d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.06.025z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
      <button
        on:click={redoAction}
        disabled={!canRedo}
        class="p-1.5 rounded-md hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-30 text-neutral-600 dark:text-neutral-300 transition-all shadow-sm disabled:shadow-none"
        title="Redo"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          class="w-4 h-4"
        >
          <path
            fill-rule="evenodd"
            d="M12.207 2.232a.75.75 0 00.025 1.06l4.146 3.958H6.375a5.375 5.375 0 000 10.75H9.25a.75.75 0 000-1.5H6.375a3.875 3.875 0 010-7.75h10.003l-4.146 3.957a.75.75 0 001.036 1.085l5.5-5.25a.75.75 0 000-1.085l-5.5-5.25a.75.75 0 00-1.06-.025z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>

    <!-- Time Estimate -->
    <div class="hidden md:flex flex-col items-end text-xs">
      <span class="font-semibold text-neutral-700 dark:text-neutral-200"
        >{formatTime(timePrediction.totalTime)}</span
      >
      <span class="text-neutral-500 dark:text-neutral-400"
        >{timePrediction.totalDistance.toFixed(1)} inches</span
      >
    </div>

    <!-- Hidden File Input -->
    <input
      id="file-upload"
      type="file"
      accept=".pp"
      on:change={loadFile}
      class="hidden"
    />
  </div>
</div>
