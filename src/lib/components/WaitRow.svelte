<script lang="ts">
  export let name: string;
  export let durationMs: number;
  export let onChange: (newName: string, newDuration: number) => void;
  export let onRemove: () => void;
  export let onInsertAfter: () => void;

  function handleNameChange(e: Event) {
    const target = e.currentTarget as HTMLInputElement;
    onChange(target?.value ?? "", durationMs);
  }

  function handleDurationChange(e: Event) {
    const target = e.currentTarget as HTMLInputElement;
    const v = Number(target?.value ?? 0);
    onChange(name, Math.max(0, Number.isFinite(v) ? v : 0));
  }
</script>

<div class="flex w-full items-center justify-between gap-2 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900">
  <div class="flex items-center gap-2">
    <span class="px-1.5 py-0.5 text-xs rounded bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Wait</span>
    <input
      class="pl-1.5 rounded-md bg-neutral-50 dark:bg-neutral-950 dark:border-neutral-700 border-[0.5px] focus:outline-none w-40"
      type="text"
      placeholder="Name"
      bind:value={name}
      on:change={handleNameChange}
    />
    <input
      class="pl-1.5 rounded-md bg-neutral-50 dark:bg-neutral-950 dark:border-neutral-700 border-[0.5px] focus:outline-none w-28"
      type="number"
      min="0"
      step="50"
      bind:value={durationMs}
      on:change={handleDurationChange}
    />
    <span>ms</span>
  </div>
  <div class="flex items-center gap-2">
    <button title="Insert after" on:click={onInsertAfter} class="text-blue-500 hover:text-blue-600">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" class="size-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </button>
    <button title="Remove" on:click={onRemove} class="text-red-500 hover:text-red-600">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" class="size-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    </button>
  </div>
</div>
