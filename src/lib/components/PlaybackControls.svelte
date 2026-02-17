<!-- Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0. -->
<script lang="ts">
  export let playing: boolean;
  export let play: () => any;
  export let pause: () => any;
  export let percent: number;
  export let handleSeek: (percent: number) => void;
  export let loopAnimation: boolean;
  // New prop for timeline items (markers, waits, rotates)
  export let timelineItems: {
    type: "marker" | "wait" | "rotate" | "dot" | "macro";
    percent: number;
    durationPercent?: number;
    color?: string;
    name: string;
    explicit?: boolean; // true = user-defined action, false = implicit pathing behavior
    fromWait?: boolean; // true when the marker comes from a wait/rotate event
    id?: string;
    parentId?: string;
  }[] = [];
  export let playbackSpeed: number = 1.0;
  export let setPlaybackSpeed: (factor: number, autoPlay?: boolean) => void;
  export let totalSeconds: number = 0;
  export let settings: Settings | undefined;

  import type { Settings } from "../../types";
  import { fade, fly } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import { menuNavigation } from "../actions/menuNavigation";
  import { formatTime, getShortcutFromSettings } from "../../utils";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  // Speed dropdown state & helpers
  let showSpeedMenu = false;
  const speedOptions = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];

  // Drag State
  let draggingMarkerIndex: number | null = null;
  let draggingMarkerId: string | null = null;
  let draggingMarkerPercent: number = 0;
  let wasPlayingBeforeDrag: boolean = false;
  let timelineRect: DOMRect | null = null;
  let timelineContainer: HTMLElement;
  let ignoreClick = false;

  $: currentTime =
    (draggingMarkerIndex !== null
      ? draggingMarkerPercent / 100
      : percent / 100) * totalSeconds;

  function toggleSpeedMenu() {
    showSpeedMenu = !showSpeedMenu;
  }

  function selectSpeed(s: number) {
    setPlaybackSpeed(s, true);
    showSpeedMenu = false;
  }

  function handleMenuKey(e: KeyboardEvent) {
    if (e.key === "Escape") showSpeedMenu = false;
  }

  function handleSeekInput(e: Event) {
    if (draggingMarkerIndex !== null) return;
    const target = e.target as HTMLInputElement;
    handleSeek(parseFloat(target.value));
  }

  function handleSliderKeydown(e: KeyboardEvent) {
    const step = 5;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handleSeek(Math.max(0, percent - step));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleSeek(Math.min(100, percent + step));
    } else if (e.key === "Home") {
      e.preventDefault();
      handleSeek(0);
    } else if (e.key === "End") {
      e.preventDefault();
      handleSeek(100);
    }
  }

  // Drag Handlers
  function handleMarkerDragStart(
    e: MouseEvent,
    index: number,
    item: (typeof timelineItems)[0],
  ) {
    e.preventDefault();
    e.stopPropagation();

    // Only allow dragging markers
    if (item.type !== "marker") return;
    if (!(item as any).id) return; // Must have ID

    draggingMarkerIndex = index;
    draggingMarkerId = (item as any).id;
    draggingMarkerPercent = item.percent;

    wasPlayingBeforeDrag = playing;
    if (playing) pause();

    // Cache rect
    if (timelineContainer) {
      timelineRect = timelineContainer.getBoundingClientRect();
    }

    // Add window listeners
    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
  }

  function handleWindowMouseMove(e: MouseEvent) {
    if (draggingMarkerIndex === null || !timelineRect) return;

    let x = e.clientX - timelineRect.left;
    let pct = (x / timelineRect.width) * 100;
    pct = Math.max(0, Math.min(100, pct));

    draggingMarkerPercent = pct;
  }

  function handleWindowMouseUp(e: MouseEvent) {
    if (draggingMarkerIndex !== null) {
      // Commit change
      if (draggingMarkerId) {
        dispatch("markerChange", {
          id: draggingMarkerId,
          percent: draggingMarkerPercent,
        });
      }

      ignoreClick = true;
      setTimeout(() => (ignoreClick = false), 50);
    }

    draggingMarkerIndex = null;
    draggingMarkerId = null;
    window.removeEventListener("mousemove", handleWindowMouseMove);
    window.removeEventListener("mouseup", handleWindowMouseUp);
  }
</script>

<div
  id="playback-controls"
  class="w-full bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3 pb-2 flex flex-col justify-start items-center gap-2 shadow-lg"
>
  <!-- Top: Timeline -->
  <div
    bind:this={timelineContainer}
    class="w-full relative h-10 flex items-center group/timeline"
  >
    <!-- Track Background -->
    <div
      class="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700"
    ></div>

    <!-- Timeline Highlights Layer -->
    <div
      class="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
    >
      {#each timelineItems as item}
        {#if item.type === "wait"}
          <!-- Wait: Amber highlight -->
          <div
            class="absolute top-1/2 -translate-y-1/2 h-3 bg-amber-500/70 shadow-sm"
            style="left: {item.percent}%; width: {item.durationPercent}%; border-radius: 2px;"
            aria-hidden="true"
          ></div>
        {:else if item.type === "rotate"}
          <!-- Rotate -->
          <div
            class={item.explicit === true
              ? "absolute top-1/2 -translate-y-1/2 h-3 bg-pink-500/70 shadow-sm"
              : "absolute top-1/2 -translate-y-1/2 h-3 bg-pink-200/40"}
            style="left: {item.percent}%; width: {item.durationPercent}%; border-radius: 2px;"
            aria-hidden="true"
          ></div>
        {:else if item.type === "macro"}
          <!-- Macro -->
          <div
            class="absolute top-1/2 -translate-y-1/2 h-3 bg-blue-500/50 shadow-sm"
            style="left: {item.percent}%; width: {item.durationPercent}%; border-radius: 2px;"
            aria-hidden="true"
          ></div>
        {/if}
      {/each}
    </div>

    <!-- Rotate Icons Overlay -->
    <div class="absolute inset-0 w-full h-full pointer-events-none">
      {#each timelineItems as item}
        {#if item.type === "rotate" && item.explicit === true}
          <div
            class="absolute"
            style="left: {item.percent +
              (item.durationPercent || 0) /
                2}%; top: 50%; transform: translate(-50%, -50%); pointer-events: none;"
            aria-hidden="true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="w-4 h-4 rounded-full bg-white dark:bg-neutral-900 shadow-sm"
              style="color: rgb(236 72 153)"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        {/if}
      {/each}
    </div>

    <!-- The Slider -->
    <input
      id="timeline-slider"
      bind:value={percent}
      type="range"
      min="0"
      max="100"
      step="0.000001"
      aria-label="Animation progress"
      class="w-full appearance-none slider focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 rounded-full bg-transparent dark:bg-transparent relative z-10 timeline-slider cursor-pointer"
      style={draggingMarkerIndex !== null ? "pointer-events: none;" : ""}
      on:input={handleSeekInput}
      on:keydown={handleSliderKeydown}
    />

    <!-- Dots (Travel Start Points) -->
    <!-- Rendered after slider so they are visible -->
    {#each timelineItems as item, index}
      {#if item.type === "dot"}
        <div
          class="absolute z-20 group ring-2 ring-white dark:ring-neutral-800 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          role="button"
          tabindex="0"
          on:click|stopPropagation={() => handleSeek(item.percent)}
          on:keydown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleSeek(item.percent);
          }}
          style={`left: ${item.percent}%; top: 50%; transform: translate(-50%, -50%); width: 10px; height: 10px; background: ${item.color}; cursor: pointer;`}
          aria-label={item.name}
        >
          <!-- Tooltip (CSS Hover) -->
          <div
            class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded shadow-lg text-xs text-neutral-800 dark:text-neutral-100 z-[100] pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            {item.name}
          </div>
        </div>
      {:else if item.type === "marker"}
        <!-- Markers -->
        <div
          class="absolute z-30 group rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          role="button"
          tabindex="0"
          on:mousedown={(e) => handleMarkerDragStart(e, index, item)}
          on:click|stopPropagation={(e) => {
            if (ignoreClick) return;
            if (draggingMarkerIndex === null) handleSeek(item.percent);
          }}
          on:keydown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleSeek(item.percent);
          }}
          style="left: {draggingMarkerIndex === index
            ? draggingMarkerPercent
            : item.percent}%; top: -10px; transform: translateX(-50%); cursor: {draggingMarkerIndex ===
          index
            ? 'grabbing'
            : 'grab'}; pointer-events: auto;"
          aria-label={item.name}
        >
          <!-- Tooltip (CSS Hover) -->
          <div
            class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded shadow-lg text-xs text-neutral-800 dark:text-neutral-100 z-[100] pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            {item.name}
          </div>

          <!-- Map Pin Icon -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke-width="1.5"
            class={item.fromWait
              ? "w-5 h-5 drop-shadow-md transition-transform group-hover:scale-125 text-black dark:text-white stroke-white dark:stroke-neutral-900"
              : "w-5 h-5 text-purple-500 drop-shadow-md transition-transform group-hover:scale-125 stroke-white dark:stroke-neutral-900"}
            style={item.fromWait ? "" : `color: ${item.color || "#a855f7"}`}
          >
            <path
              fill-rule="evenodd"
              d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      {/if}
    {/each}
  </div>

  <!-- Bottom: Controls -->
  <div class="flex items-center justify-between w-full px-1">
    <!-- Left: Time -->
    <div
      class="font-mono text-xs font-medium text-neutral-600 dark:text-neutral-400 select-none whitespace-nowrap min-w-[80px]"
    >
      <span class="text-neutral-900 dark:text-neutral-200"
        >{formatTime(currentTime)}</span
      >
      <span class="opacity-50 mx-1">/</span>
      <span>{formatTime(totalSeconds)}</span>
    </div>

    <!-- Center: Transport -->
    <div class="flex items-center justify-center gap-2">
      <!-- Skip to Start -->
      <button
        title="Skip to Start"
        aria-label="Skip to start"
        on:click={() => handleSeek(0)}
        class="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="size-5"
        >
          <path
            fill-rule="evenodd"
            d="M13.28 3.97a.75.75 0 0 1 0 1.06L6.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Zm6 0a.75.75 0 0 1 0 1.06L12.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <!-- Play/Pause -->
      <button
        id="play-pause-btn"
        title={`Play/Pause${getShortcutFromSettings(settings, "play-pause")}`}
        aria-label={playing ? "Pause" : "Play"}
        on:click={() => (playing ? pause() : play())}
        class="p-2 rounded-full bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-green-600 dark:text-green-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        {#if !playing}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="size-8"
          >
            <path
              fill-rule="evenodd"
              d="M4.5 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 0 1 0 1.971l-11.54 6.347a1.125 1.125 0 0 1-1.667-.985V5.653Z"
              clip-rule="evenodd"
            />
          </svg>
        {:else}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="size-8"
          >
            <path
              fill-rule="evenodd"
              d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z"
              clip-rule="evenodd"
            />
          </svg>
        {/if}
      </button>

      <!-- Skip to End -->
      <button
        title="Skip to End"
        aria-label="Skip to end"
        on:click={() => handleSeek(100)}
        class="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="size-5"
        >
          <path
            fill-rule="evenodd"
            d="M10.72 20.03a.75.75 0 0 1 0-1.06L17.69 12l-6.97-6.97a.75.75 0 1 1 1.06-1.06l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06 0Zm-6 0a.75.75 0 0 1 0-1.06L11.69 12 4.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06 0Z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <!-- Loop Toggle -->
      <button
        title={loopAnimation ? "Disable Loop" : "Enable Loop"}
        aria-label="Loop animation"
        aria-pressed={loopAnimation}
        on:click={() => (loopAnimation = !loopAnimation)}
        class="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        class:text-blue-500={loopAnimation}
        class:text-neutral-400={!loopAnimation}
        class:dark:text-neutral-500={!loopAnimation}
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
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </button>
    </div>

    <!-- Right: Speed -->
    <div class="relative min-w-[80px] flex justify-end">
      <button
        title="Open playback speed menu"
        aria-label="Playback speed options"
        aria-haspopup="menu"
        aria-expanded={showSpeedMenu}
        on:click|stopPropagation={toggleSpeedMenu}
        class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors border border-neutral-200 dark:border-neutral-700"
      >
        <span>{(playbackSpeed ?? 1).toFixed(2)}x</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          class="size-3 text-neutral-400"
          class:rotate-180={showSpeedMenu}
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {#if showSpeedMenu}
        <ul
          role="menu"
          class="absolute right-0 bottom-full mb-2 w-32 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xl z-50 overflow-hidden"
          on:click|stopPropagation
          on:keydown|stopPropagation
          use:menuNavigation
          on:close={() => (showSpeedMenu = false)}
          in:fly={{ y: 8, duration: 160, easing: cubicInOut }}
          out:fly={{ y: 8, duration: 120, easing: cubicInOut }}
        >
          {#each speedOptions as s}
            <li role="menuitem">
              <button
                on:click={() => selectSpeed(s)}
                class="w-full text-left px-3 py-2 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700/50 flex items-center justify-between transition-colors dark:text-neutral-200"
              >
                <span>{s.toFixed(2)}x</span>
                {#if Math.abs(s - (playbackSpeed || 1)) < 1e-6}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="size-3 text-green-500"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                {/if}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</div>

<svelte:window
  on:click={() => (showSpeedMenu = false)}
  on:keydown={(e) => e.key === "Escape" && (showSpeedMenu = false)}
/>

<style>
  /* Make the timeline slider track transparent so the underlying highlights layer is visible */
  .timeline-slider::-webkit-slider-runnable-track {
    background-color: transparent !important;
    box-shadow: none !important;
  }
  :global(.dark) .timeline-slider::-webkit-slider-runnable-track {
    background-color: transparent !important;
    box-shadow: none !important;
  }
</style>
