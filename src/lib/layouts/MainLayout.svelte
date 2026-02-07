<!-- Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0. -->
<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export let showSidebar: boolean = true;
  export let isPresentationMode: boolean = false;
  export let isLargeScreen: boolean = true;
  export let innerWidth: number = 0;
  export let innerHeight: number = 0;
  export let controlTabContainer: HTMLDivElement | null = null;
  export let leftPaneWidth: number = 0;
  export let fieldDrawSize: number = 0;
  export let controlTabHidden: boolean = false;
  export let fieldContainerTargetHeight: string = "100%";
  export let mainContentHeight: number = 0;
  export let mainContentWidth: number = 0;
  export let sidebarClass: string = "";

  // Resizing State
  let mainContentDiv: HTMLDivElement;
  let userFieldLimit: number | null = null;
  let userFieldHeightLimit: number | null = null;
  let resizeMode: "horizontal" | "vertical" | null = null;

  const MIN_SIDEBAR_WIDTH = 320;
  const MIN_FIELD_PANE_WIDTH = 300;

  $: effectiveShowSidebar = isPresentationMode ? false : showSidebar;

  // Control Tab visibility logic
  let hideControlTabTimeout: ReturnType<typeof setTimeout> | null = null;

  $: if (!isLargeScreen) {
    if (!effectiveShowSidebar) {
      if (hideControlTabTimeout) clearTimeout(hideControlTabTimeout);
      hideControlTabTimeout = setTimeout(() => {
        controlTabHidden = true;
      }, 320);
    } else {
      if (hideControlTabTimeout) {
        clearTimeout(hideControlTabTimeout);
        hideControlTabTimeout = null;
      }
      controlTabHidden = false;
    }
  } else {
    controlTabHidden = false;
    if (hideControlTabTimeout) {
      clearTimeout(hideControlTabTimeout);
      hideControlTabTimeout = null;
    }
  }

  // Initial sizing defaults
  $: if (userFieldLimit === null && mainContentWidth > 0 && isLargeScreen) {
    userFieldLimit = mainContentWidth * 0.49;
  }
  $: if (
    userFieldHeightLimit === null &&
    mainContentHeight > 0 &&
    !isLargeScreen
  ) {
    userFieldHeightLimit = mainContentHeight * 0.6;
  }

  // Calculated Dimensions
  $: leftPaneWidth = (() => {
    if (!isLargeScreen) return mainContentWidth;
    if (!effectiveShowSidebar) return mainContentWidth;
    let target = userFieldLimit ?? mainContentWidth * 0.55;
    const max = mainContentWidth - MIN_SIDEBAR_WIDTH;
    const min = MIN_FIELD_PANE_WIDTH;
    if (max < min) return mainContentWidth * 0.5;
    return Math.max(min, Math.min(target, max));
  })();

  $: fieldDrawSize = (() => {
    if (!isLargeScreen) {
      const h = userFieldHeightLimit ?? mainContentHeight * 0.6;
      return Math.min(innerWidth - 32, h - 16);
    }
    const avW = leftPaneWidth - 16;
    const avH = mainContentHeight - 16;
    return Math.max(100, Math.min(avW, avH));
  })();

  $: fieldContainerTargetHeight = (() => {
    if (isLargeScreen) return "100%";
    if (effectiveShowSidebar) {
      const h = userFieldHeightLimit ?? mainContentHeight * 0.6;
      const target = Math.min(h, mainContentHeight);
      return `${Math.max(120, Math.floor(target))}px`;
    } else {
      return `${mainContentHeight}px`;
    }
  })();

  function startResize(mode: "horizontal" | "vertical") {
    if (
      (mode === "horizontal" && (!isLargeScreen || !effectiveShowSidebar)) ||
      (mode === "vertical" && (isLargeScreen || !effectiveShowSidebar))
    )
      return;
    resizeMode = mode;
  }

  function handleResize(cx: number, cy: number) {
    if (!resizeMode) return;
    if (resizeMode === "horizontal") userFieldLimit = cx;
    else if (resizeMode === "vertical" && mainContentDiv) {
      const rect = mainContentDiv.getBoundingClientRect();
      const nh = cy - rect.top;
      const max = rect.height - 100;
      userFieldHeightLimit = Math.max(200, Math.min(nh, max));
    }
  }

  function stopResize() {
    resizeMode = null;
  }
</script>

<svelte:window
  on:mouseup={stopResize}
  on:mousemove={(e) => {
    if (resizeMode) {
      e.preventDefault();
      handleResize(e.clientX, e.clientY);
    }
  }}
  on:touchend={stopResize}
  on:touchmove={(e) => {
    if (resizeMode) {
      const t = e.touches[0];
      handleResize(t.clientX, t.clientY);
    }
  }}
/>

<div
  class="h-screen w-full flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-sans"
>
  {#if !isPresentationMode}
    <div class="flex-none z-50">
      <slot name="navbar" />
    </div>
  {/if}

  <div
    class="flex-1 min-h-0 flex flex-col lg:flex-row items-stretch lg:overflow-hidden relative gap-0"
    bind:clientHeight={mainContentHeight}
    bind:clientWidth={mainContentWidth}
    bind:this={mainContentDiv}
  >
    <!-- Field Container -->
    <div
      id="field-container"
      class="flex-none flex justify-center items-center relative transition-all duration-300 ease-in-out bg-white dark:bg-black lg:dark:bg-black/40 overflow-hidden"
      style={`
        width: ${isLargeScreen && effectiveShowSidebar ? leftPaneWidth + "px" : "100%"};
        height: ${isLargeScreen ? "100%" : fieldContainerTargetHeight};
        min-height: ${!isLargeScreen ? (userFieldHeightLimit ? "0" : "60vh") : "0"};
      `}
    >
      <slot name="field" />
    </div>

    <!-- Resizer Handle (Desktop) -->
    {#if isLargeScreen && effectiveShowSidebar && !isPresentationMode}
      <button
        class="w-3 cursor-col-resize flex justify-center items-center hover:bg-purple-500/10 active:bg-purple-500/20 transition-colors select-none z-40 border-none bg-neutral-200 dark:bg-neutral-800 p-0 m-0 border-l border-r border-neutral-300 dark:border-neutral-700"
        on:mousedown={() => startResize("horizontal")}
        on:dblclick={() => {
          userFieldLimit = null;
        }}
        aria-label="Resize Sidebar"
        title="Drag to resize. Double-click to reset to default width"
      >
        <div
          class="w-1 h-8 bg-neutral-400 dark:bg-neutral-600 rounded-full"
        ></div>
      </button>
    {/if}

    <!-- Resizer Handle (Mobile) -->
    {#if !isLargeScreen && effectiveShowSidebar && !isPresentationMode}
      <button
        class="h-3 w-full cursor-row-resize flex justify-center items-center hover:bg-purple-500/10 active:bg-purple-500/20 transition-colors select-none z-40 border-none bg-neutral-200 dark:bg-neutral-800 p-0 m-0 border-t border-b border-neutral-300 dark:border-neutral-700 touch-none"
        on:mousedown={() => startResize("vertical")}
        on:touchstart={(e) => {
          e.preventDefault();
          startResize("vertical");
        }}
        on:dblclick={() => {
          userFieldHeightLimit = null;
        }}
        aria-label="Resize Tab"
        title="Drag to resize. Double-click to reset to default height"
      >
        <div
          class="h-1 w-8 bg-neutral-400 dark:bg-neutral-600 rounded-full"
        ></div>
      </button>
    {/if}

    <!-- Control Tab -->
    <div
      bind:this={controlTabContainer}
      class="relative flex-1 h-auto lg:h-full min-h-0 min-w-0 transition-transform duration-300 ease-in-out transform bg-neutral-50 dark:bg-neutral-900 {sidebarClass}"
      class:translate-x-full={!effectiveShowSidebar && isLargeScreen}
      class:translate-y-full={!effectiveShowSidebar && !isLargeScreen}
      class:overflow-hidden={!effectiveShowSidebar}
      class:hidden={controlTabHidden}
    >
      <slot name="sidebar" />
    </div>
  </div>
</div>
