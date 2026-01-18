<!-- src/lib/components/AnnotationOverlay.svelte -->
<script lang="ts">
  import { annotationsStore } from "../projectStore";
  import type { Annotation } from "../../types";
  import type * as d3 from "d3";

  export let x: d3.ScaleLinear<number, number, number>;
  export let y: d3.ScaleLinear<number, number, number>;
  export let onRecordChange: () => void;

  let draggingId: string | null = null;
  let editingId: string | null = null;

  function handleMouseDown(e: MouseEvent, id: string) {
    if (editingId === id) return; // Allow interaction with textarea
    e.stopPropagation(); // Prevent map dragging
    if (e.button !== 0) return; // Only left click

    draggingId = id;
  }

  function handleWindowMouseMove(e: MouseEvent) {
    if (!draggingId) return;

    // Calculate scale (pixels per inch)
    const ppiX = x(1) - x(0);
    const ppiY = y(1) - y(0);

    const dx = e.movementX / ppiX;
    const dy = e.movementY / ppiY;

    annotationsStore.update((notes) =>
      notes.map((n) => {
        if (n.id === draggingId) {
          // Clamp to field? Optional.
          return { ...n, x: n.x + dx, y: n.y + dy };
        }
        return n;
      }),
    );
  }

  function handleWindowMouseUp() {
    if (draggingId) {
      draggingId = null;
      onRecordChange();
    }
  }

  function deleteNote(id: string) {
    if (confirm("Delete this note?")) {
      annotationsStore.update((notes) => notes.filter((n) => n.id !== id));
      onRecordChange();
    }
  }

  function toggleMinimize(id: string) {
    annotationsStore.update((notes) =>
      notes.map((n) => {
        if (n.id === id) {
          return { ...n, minimized: !n.minimized };
        }
        return n;
      }),
    );
    onRecordChange();
  }

  function updateColor(id: string, color: string) {
    annotationsStore.update((notes) =>
      notes.map((n) => {
        if (n.id === id) {
          return { ...n, color };
        }
        return n;
      }),
    );
    onRecordChange();
  }
</script>

<svelte:window
  on:mousemove={handleWindowMouseMove}
  on:mouseup={handleWindowMouseUp}
/>

<div class="absolute inset-0 pointer-events-none overflow-hidden z-20">
  {#each $annotationsStore as note (note.id)}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="absolute pointer-events-auto shadow-md rounded-md flex flex-col transition-shadow duration-200"
      style="
        left: {x(note.x)}px;
        top: {y(note.y)}px;
        background-color: {note.color || '#fef3c7'};
        width: {note.minimized ? 'auto' : '180px'};
        min-height: {note.minimized ? 'auto' : '100px'};
        transform: translate(-10px, -10px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      "
      on:mousedown={(e) => handleMouseDown(e, note.id)}
      class:ring-2={draggingId === note.id}
      class:ring-blue-400={draggingId === note.id}
    >
      <!-- Header -->
      <div
        class="flex justify-between items-center px-2 py-1 bg-black/5 rounded-t-md cursor-grab active:cursor-grabbing border-b border-black/5"
      >
        <div class="flex gap-1">
          <!-- Minimize Button -->
          <button
            class="text-neutral-500 hover:text-neutral-800"
            on:click|stopPropagation={() => toggleMinimize(note.id)}
            title={note.minimized ? "Expand" : "Minimize"}
          >
            {#if note.minimized}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="w-3 h-3"
              >
                <path
                  d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"
                />
              </svg>
            {:else}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="w-3 h-3"
              >
                <path
                  fill-rule="evenodd"
                  d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z"
                  clip-rule="evenodd"
                />
              </svg>
            {/if}
          </button>

          <!-- Color Picker (Tiny circles) -->
          {#if !note.minimized}
            <div class="flex gap-0.5 items-center ml-1">
              {#each ["#fef3c7", "#dcfce7", "#dbeafe", "#fee2e2"] as c}
                <button
                  class="w-2.5 h-2.5 rounded-full border border-black/10 hover:scale-110 transition-transform"
                  style="background-color: {c}"
                  on:click|stopPropagation={() => updateColor(note.id, c)}
                  aria-label="Set color"
                ></button>
              {/each}
            </div>
          {/if}
        </div>

        <button
          class="text-neutral-400 hover:text-red-500"
          on:mousedown|stopPropagation
          on:click|stopPropagation={() => deleteNote(note.id)}
          title="Delete Note"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            class="w-3 h-3"
          >
            <path
              fill-rule="evenodd"
              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      <!-- Body -->
      {#if !note.minimized}
        <textarea
          class="flex-1 w-full bg-transparent p-2 text-xs text-neutral-800 resize-none focus:outline-none placeholder-neutral-400/70 font-sans"
          bind:value={note.text}
          on:mousedown|stopPropagation={() => (editingId = note.id)}
          on:blur={() => {
            editingId = null;
            onRecordChange();
          }}
          placeholder="Add a note..."
        ></textarea>
      {:else}
        <div
          class="px-2 py-1 text-xs font-medium text-neutral-600 truncate max-w-[100px]"
        >
          {note.text || "Note"}
        </div>
      {/if}
    </div>
  {/each}
</div>
