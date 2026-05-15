<script lang="ts">
  import { slide } from "svelte/transition";

  export let line: any;
  export let locked = false;
  export let onchange: (() => void) | undefined = undefined;
  export let oncommit: (() => void) | undefined = undefined;

  let mode: "none" | "default" | "global" = "default";

  // Initialize mode based on line state
  if (line.globalNoDeceleration) {
    mode = "none";
  } else if (line.globalDeceleration) {
    mode = "global";
  } else {
    mode = "default";
  }

  function handleModeChange(newMode: "none" | "default" | "global") {
    mode = newMode;
    if (mode === "none") {
      line.globalNoDeceleration = true;
      line.globalDeceleration = false;
    } else if (mode === "global") {
      line.globalNoDeceleration = false;
      line.globalDeceleration = true;
      if (line.globalBrakingStrength === undefined)
        line.globalBrakingStrength = 1;
      if (line.globalBrakingStart === undefined) line.globalBrakingStart = 0.5;
    } else {
      // default
      line.globalNoDeceleration = false;
      line.globalDeceleration = false;
      if (line.globalBrakingStrength === undefined)
        line.globalBrakingStrength = 1;
    }

    if (onchange) onchange();
    if (oncommit) oncommit();
  }

  function handleInput() {
    if (onchange) onchange();
  }

  function handleBlur() {
    if (oncommit) oncommit();
  }
</script>

<div
  class="space-y-3 p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700/50"
>
  <div class="flex items-center justify-between">
    <span class="text-xs font-semibold text-neutral-600 dark:text-neutral-300"
      >Deceleration Mode</span
    >
    <select
      class="text-xs p-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-neutral-700 dark:text-neutral-300"
      bind:value={mode}
      onchange={() => handleModeChange(mode)}
      disabled={locked}
    >
      <option value="none">None (Full Speed)</option>
      <option value="default">Default</option>
      <option value="global">Global</option>
    </select>
  </div>

  {#if mode === "default" || mode === "global"}
    <div
      transition:slide={{ duration: 150 }}
      class="space-y-3 pt-1 border-t border-neutral-200 dark:border-neutral-700"
    >
      <div class="space-y-1">
        <div class="flex justify-between text-[11px] text-neutral-500">
          <span>Braking Strength</span>
          <span class="font-mono"
            >{line.globalBrakingStrength?.toFixed(2) ?? "1.00"}</span
          >
        </div>
        <div class="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            bind:value={line.globalBrakingStrength}
            oninput={handleInput}
            onchange={handleBlur}
            disabled={locked}
            class="flex-1 accent-purple-500"
          />
          <input
            type="number"
            min="0"
            step="0.1"
            bind:value={line.globalBrakingStrength}
            oninput={handleInput}
            onblur={handleBlur}
            disabled={locked}
            class="w-16 p-1 text-xs text-right bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-mono text-neutral-700 dark:text-neutral-300"
          />
        </div>
      </div>

      {#if mode === "global"}
        <div transition:slide={{ duration: 150 }} class="space-y-1">
          <div class="flex justify-between text-[11px] text-neutral-500">
            <span>Braking Start</span>
            <span class="font-mono"
              >{line.globalBrakingStart?.toFixed(2) ?? "0.50"}</span
            >
          </div>
          <div class="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              bind:value={line.globalBrakingStart}
              oninput={handleInput}
              onchange={handleBlur}
              disabled={locked}
              class="flex-1 accent-purple-500"
            />
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              bind:value={line.globalBrakingStart}
              oninput={handleInput}
              onblur={handleBlur}
              disabled={locked}
              class="w-16 p-1 text-xs text-right bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-mono text-neutral-700 dark:text-neutral-300"
            />
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
