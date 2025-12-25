<script lang="ts">
  import { cubicInOut } from "svelte/easing";
  import { fade, fly } from "svelte/transition";

  export let isOpen = false;

  const shortcuts = [
    { key: "W", description: "Add new path" },
    { key: "A", description: "Add control point" },
    { key: "S", description: "Remove control point" },
    { key: "Space", description: "Play / Pause animation" },
    { key: "Cmd/Ctrl + S", description: "Save project" },
    { key: "Cmd/Ctrl + Z", description: "Undo" },
    { key: "Cmd/Ctrl + Shift + Z", description: "Redo" },
  ];
</script>

{#if isOpen}
  <div
    transition:fade={{ duration: 500, easing: cubicInOut }}
    class="bg-black bg-opacity-25 flex flex-col justify-center items-center absolute top-0 left-0 w-full h-full z-[1005]"
    role="dialog"
    aria-modal="true"
    aria-labelledby="shortcuts-title"
    on:click|self={() => (isOpen = false)}
    on:keydown={(e) => {
      if (e.key === "Escape") isOpen = false;
    }}
  >
    <div
      transition:fly={{ duration: 500, easing: cubicInOut, y: 20 }}
      class="flex flex-col justify-start items-start p-6 bg-white dark:bg-neutral-900 rounded-lg w-full max-w-md max-h-[80vh] shadow-xl"
    >
      <!-- Header -->
      <div class="flex flex-row justify-between items-center w-full mb-6">
        <h2
          id="shortcuts-title"
          class="text-xl font-semibold text-neutral-900 dark:text-white"
        >
          Keyboard Shortcuts
        </h2>
        <button
          on:click={() => (isOpen = false)}
          aria-label="Close shortcuts"
          class="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width={2}
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

      <!-- Shortcuts List -->
      <div class="w-full flex flex-col gap-3 overflow-y-auto">
        {#each shortcuts as shortcut}
          <div
            class="flex flex-row justify-between items-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800"
          >
            <span class="text-neutral-700 dark:text-neutral-300 font-medium">
              {shortcut.description}
            </span>
            <kbd
              class="px-2 py-1 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded text-sm font-mono text-neutral-600 dark:text-neutral-200 shadow-sm"
            >
              {shortcut.key}
            </kbd>
          </div>
        {/each}
      </div>

      <!-- Footer -->
      <div class="w-full mt-6 flex justify-end">
        <button
          on:click={() => (isOpen = false)}
          class="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors font-medium"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}
