<script lang="ts">
  import { cubicInOut } from "svelte/easing";
  import { fade, fly } from "svelte/transition";
  import { resetSettings } from "../../utils/settingsPersistence";

  export let isOpen = false;
  export let settings: Settings;

  // Display value for angular velocity (user inputs this, gets multiplied by PI)
  $: angularVelocityDisplay = settings ? settings.aVelocity / Math.PI : 1;

  function handleAngularVelocityInput(e: Event) {
    const target = e.target as HTMLInputElement;
    settings.aVelocity = parseFloat(target.value) * Math.PI;
  }

  async function handleReset() {
    if (
      confirm(
        "Are you sure you want to reset all settings to defaults? This cannot be undone.",
      )
    ) {
      const defaultSettings = await resetSettings();
      // Update the bound settings object
      Object.keys(defaultSettings).forEach((key) => {
        settings[key] = defaultSettings[key];
      });
    }
  }
</script>

{#if isOpen}
  <div
    transition:fade={{ duration: 500, easing: cubicInOut }}
    class="bg-black bg-opacity-25 flex flex-col justify-center items-center absolute top-0 left-0 w-full h-full z-[1005]"
    role="dialog"
    aria-modal="true"
    aria-labelledby="settings-title"
  >
    <div
      transition:fly={{ duration: 500, easing: cubicInOut, y: 20 }}
      class="flex flex-col justify-start items-start p-6 bg-white dark:bg-neutral-900 rounded-lg w-full max-w-md gap-4"
    >
      <div class="flex flex-row justify-between items-center w-full">
        <h2 id="settings-title" class="sr-only">Settings</h2>
        <button on:click={() => (isOpen = false)} aria-label="Close settings">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="size-6 text-neutral-700 dark:text-neutral-400"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="relative w-full">
        <div
          class="flex flex-col w-full justify-start items-start gap-4 text-base"
        >
          <div class="font-semibold text-lg">Settings</div>

          <div class="flex flex-row justify-between items-center w-full">
            <div class="font-light">X Velocity (in/s):</div>
            <input
              class="px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-950 dark:border-neutral-700 border focus:outline-none focus:ring-2 focus:ring-blue-500 w-24 text-base"
              step="0.1"
              type="number"
              min="0"
              bind:value={settings.xVelocity}
            />
          </div>

          <div class="flex flex-row justify-between items-center w-full">
            <div class="font-light">Y Velocity (in/s):</div>
            <input
              class="px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-950 dark:border-neutral-700 border focus:outline-none focus:ring-2 focus:ring-blue-500 w-24 text-base"
              step="0.1"
              type="number"
              min="0"
              bind:value={settings.yVelocity}
            />
          </div>

          <div class="flex flex-col justify-start items-start w-full gap-1">
            <div class="flex flex-row justify-between items-center w-full">
              <div class="font-light">Angular Velocity:</div>
              <input
                class="px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-950 dark:border-neutral-700 border focus:outline-none focus:ring-2 focus:ring-blue-500 w-24 text-base"
                step="0.1"
                type="number"
                min="0"
                value={angularVelocityDisplay}
                on:input={handleAngularVelocityInput}
              />
            </div>
            <div
              class="text-sm text-neutral-500 dark:text-neutral-400 self-end"
            >
              (× π rad/s)
            </div>
          </div>

          <div class="flex flex-row justify-between items-center w-full">
            <div class="font-light">Max Velocity (in/s):</div>
            <input
              class="px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-950 dark:border-neutral-700 border focus:outline-none focus:ring-2 focus:ring-blue-500 w-24 text-base"
              step="1"
              type="number"
              min="0"
              bind:value={settings.maxVelocity}
            />
          </div>

          <div class="flex flex-row justify-between items-center w-full">
            <div class="font-light">Max Acceleration (in/s²):</div>
            <input
              class="px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-950 dark:border-neutral-700 border focus:outline-none focus:ring-2 focus:ring-blue-500 w-24 text-base"
              step="1"
              type="number"
              min="0"
              bind:value={settings.maxAcceleration}
            />
          </div>

          <div class="flex flex-row justify-between items-center w-full">
            <div class="font-light">Max Deceleration (in/s²):</div>
            <input
              class="px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-950 dark:border-neutral-700 border focus:outline-none focus:ring-2 focus:ring-blue-500 w-24 text-base"
              step="1"
              type="number"
              min="0"
              bind:value={settings.maxDeceleration}
              on:input={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                  settings.maxDeceleration = value;
                }
              }}
              on:focus={() => {
                if (settings.maxDeceleration === undefined) {
                  settings.maxDeceleration = settings.maxAcceleration;
                }
              }}
            />
          </div>

          <div class="flex flex-row justify-between items-center w-full">
            <div class="font-light">Friction Coefficient:</div>
            <input
              class="px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-950 dark:border-neutral-700 border focus:outline-none focus:ring-2 focus:ring-blue-500 w-24 text-base"
              step="0.1"
              type="number"
              min="0"
              bind:value={settings.kFriction}
            />
          </div>

          <!-- Safety Margin Field -->
          <div class="flex flex-row justify-between items-center w-full">
            <div class="font-light">Safety Margin (in):</div>
            <input
              class="px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-950 dark:border-neutral-700 border focus:outline-none focus:ring-2 focus:ring-blue-500 w-24 text-base"
              step="0.5"
              type="number"
              min="0"
              max="24"
              bind:value={settings.safetyMargin}
            />
          </div>

          <!-- <div class="flex flex-row justify-between items-center w-full">
            <div class="font-light">Optimization Quality:</div>
            <select
              class="px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-950 dark:border-neutral-700 border focus:outline-none focus:ring-2 focus:ring-blue-500 w-24 text-base"
              bind:value={settings.optimizationQuality}
            >
              <option value={1}>Fast</option>
              <option value={3}>Balanced</option>
              <option value={5}>High</option>
            </select>
          </div> -->
        </div>

        <div
          class="flex justify-between items-center w-full pt-4 border-t border-neutral-200 dark:border-neutral-700"
        >
          <button
            on:click={handleReset}
            class="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors flex items-center gap-2"
            title="Reset all settings to default values"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width={2}
              stroke="currentColor"
              class="size-4"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            Reset to Defaults
          </button>

          <button
            on:click={() => (isOpen = false)}
            class="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
