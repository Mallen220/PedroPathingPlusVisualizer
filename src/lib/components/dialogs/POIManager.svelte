<!-- src/lib/components/dialogs/POIManager.svelte -->
<script lang="ts">
  import { cubicInOut } from "svelte/easing";
  import { fade, fly } from "svelte/transition";
  import { poiStore, showPOIManager } from "../../../stores";
  import { robotXYStore } from "../../projectStore";
  import type { POI } from "../../../types";

  export let isOpen = false;

  let newPOIName = "";
  let newPOIX = 72;
  let newPOIY = 72;
  let newPOIColor = "#facc15"; // Yellow-400

  function addPOI() {
    const id = `poi-${Math.random().toString(36).slice(2)}`;
    const newPOI: POI = {
      id,
      name: newPOIName || "New Point",
      x: newPOIX,
      y: newPOIY,
      color: newPOIColor,
      visible: true,
    };
    poiStore.update((pois) => [...pois, newPOI]);
    newPOIName = "";
    // Keep last coordinates or reset? Let's keep them for quick adding nearby
  }

  function deletePOI(id: string) {
    poiStore.update((pois) => pois.filter((p) => p.id !== id));
  }

  function updatePOI(id: string, updates: Partial<POI>) {
    poiStore.update((pois) =>
      pois.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
  }

  function useRobotPos() {
    if ($robotXYStore) {
      newPOIX = Number($robotXYStore.x.toFixed(2));
      newPOIY = Number($robotXYStore.y.toFixed(2));
    }
  }

  function close() {
    showPOIManager.set(false);
  }
</script>

{#if isOpen}
  <div
    transition:fade={{ duration: 300, easing: cubicInOut }}
    class="bg-black bg-opacity-40 flex flex-col justify-center items-center fixed top-0 left-0 w-full h-full z-[1005] backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
  >
    <div
      transition:fly={{ duration: 300, easing: cubicInOut, y: 20 }}
      class="flex flex-col bg-white dark:bg-neutral-900 rounded-xl w-full max-w-2xl max-h-[80vh] shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800"
    >
      <!-- Header -->
      <div
        class="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900"
      >
        <h2 class="text-xl font-bold text-neutral-900 dark:text-white">
          Points of Interest
        </h2>
        <button
          on:click={close}
          class="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="size-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Add New -->
        <div
          class="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700"
        >
          <h3
            class="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide mb-3"
          >
            Add New Point
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-neutral-500">Name</label>
              <input
                type="text"
                bind:value={newPOIName}
                placeholder="e.g. Blue Source"
                class="px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-neutral-500">Color</label>
              <div class="flex gap-2">
                <input
                  type="color"
                  bind:value={newPOIColor}
                  class="h-9 w-12 cursor-pointer rounded border border-neutral-300 dark:border-neutral-600"
                />
                <input
                  type="text"
                  bind:value={newPOIColor}
                  class="flex-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm"
                />
              </div>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-neutral-500"
                >X (inches)</label
              >
              <input
                type="number"
                bind:value={newPOIX}
                step="0.1"
                class="px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-neutral-500"
                >Y (inches)</label
              >
              <input
                type="number"
                bind:value={newPOIY}
                step="0.1"
                class="px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm"
              />
            </div>
          </div>
          <div class="flex justify-between items-center">
            <button
              on:click={useRobotPos}
              class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >Use Current Robot Position</button
            >
            <button
              on:click={addPOI}
              disabled={!newPOIName}
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
              >Add Point</button
            >
          </div>
        </div>

        <!-- List -->
        <div class="space-y-2">
          {#each $poiStore as poi (poi.id)}
            <div
              class="flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg group hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <div
                class="w-4 h-4 rounded-full border border-neutral-300 dark:border-neutral-600"
                style="background-color: {poi.color};"
              ></div>
              <div class="flex-1">
                <input
                  type="text"
                  value={poi.name}
                  on:change={(e) =>
                    updatePOI(poi.id, { name: e.currentTarget.value })}
                  class="font-medium bg-transparent border-none p-0 focus:ring-0 w-full text-neutral-900 dark:text-white"
                />
                <div class="flex gap-2 text-xs text-neutral-500">
                  <span
                    >X: <input
                      type="number"
                      value={poi.x}
                      on:change={(e) =>
                        updatePOI(poi.id, { x: Number(e.currentTarget.value) })}
                      class="bg-transparent w-12 border-b border-neutral-300 focus:border-blue-500 text-center"
                    /></span
                  >
                  <span
                    >Y: <input
                      type="number"
                      value={poi.y}
                      on:change={(e) =>
                        updatePOI(poi.id, { y: Number(e.currentTarget.value) })}
                      class="bg-transparent w-12 border-b border-neutral-300 focus:border-blue-500 text-center"
                    /></span
                  >
                </div>
              </div>
              <div
                class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <input
                  type="color"
                  value={poi.color}
                  on:change={(e) =>
                    updatePOI(poi.id, { color: e.currentTarget.value })}
                  class="h-6 w-6 cursor-pointer rounded border border-neutral-300 dark:border-neutral-600 overflow-hidden"
                />
                <button
                  on:click={() => updatePOI(poi.id, { visible: !poi.visible })}
                  class="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
                  title={poi.visible ? "Hide" : "Show"}
                >
                  {#if poi.visible}
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
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  {:else}
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
                        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  {/if}
                </button>
                <button
                  on:click={() => deletePOI(poi.id)}
                  class="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                  title="Delete"
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
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </button>
              </div>
            </div>
          {/each}
          {#if $poiStore.length === 0}
            <div
              class="text-center text-neutral-500 dark:text-neutral-400 py-8 text-sm italic"
            >
              No points of interest defined. Add one above!
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
