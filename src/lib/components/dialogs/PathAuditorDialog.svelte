<!-- Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0. -->
<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import { auditPath, type AuditIssue } from "../../../utils/pathAuditor";
  import type {
    Point,
    Line,
    SequenceItem,
    Shape,
    Settings,
  } from "../../../types";
  import { formatTime } from "../../../utils";

  export let isOpen = false;
  export let startPoint: Point;
  export let lines: Line[];
  export let sequence: SequenceItem[];
  export let shapes: Shape[];
  export let settings: Settings;
  export let seek: (percent: number) => void;
  export let totalTime: number; // in seconds

  let issues: AuditIssue[] = [];

  $: if (isOpen && lines && sequence && settings) {
    issues = auditPath(startPoint, lines, settings, sequence, shapes);
  }

  function handleSeek(issue: AuditIssue) {
    if (totalTime > 0 && issue.time !== undefined) {
      const percent = (issue.time / totalTime) * 100;
      seek(percent);
    }
  }

  function handleClose() {
    isOpen = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && isOpen) {
      handleClose();
    }
  }

  // Group issues by severity for summary
  $: errorCount = issues.filter((i) => i.severity === "error").length;
  $: warningCount = issues.filter((i) => i.severity === "warning").length;
  $: infoCount = issues.filter((i) => i.severity === "info").length;
  $: passed = errorCount === 0 && warningCount === 0;
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div
    transition:fade={{ duration: 200 }}
    class="fixed inset-0 z-[1005] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    role="dialog"
    aria-modal="true"
    aria-labelledby="auditor-title"
    on:click|self={handleClose}
  >
    <div
      transition:fly={{ y: 20, duration: 300 }}
      class="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col border border-neutral-200 dark:border-neutral-800 outline-none overflow-hidden max-h-[80vh]"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 shrink-0"
      >
        <div class="flex items-center gap-3">
          <div
            class={`flex items-center justify-center w-10 h-10 rounded-lg ${
              passed
                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                : errorCount > 0
                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
            }`}
          >
            {#if passed}
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
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            {:else if errorCount > 0}
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
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            {:else}
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
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            {/if}
          </div>
          <div>
            <h2
              id="auditor-title"
              class="text-lg font-bold text-neutral-900 dark:text-white"
            >
              Path Auditor
            </h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              {#if passed}
                All checks passed. Path is ready.
              {:else}
                Found {errorCount} errors, {warningCount} warnings.
              {/if}
            </p>
          </div>
        </div>
        <button
          on:click={handleClose}
          class="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Close"
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
      <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-neutral-50 dark:bg-neutral-900">
        {#if issues.length === 0}
          <div class="flex flex-col items-center justify-center py-12 text-center">
            <div
              class="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                class="size-8"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
              No Issues Found
            </h3>
            <p class="text-neutral-500 dark:text-neutral-400 max-w-xs mt-2">
              Your path passes all safety, kinematic, and logical checks.
            </p>
          </div>
        {:else}
          {#each issues as issue (issue.id)}
            <button
              class="w-full flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 text-left group
              {issue.severity === 'error'
                ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/20'
                : issue.severity === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/20'
                  : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/20'}"
              on:click={() => handleSeek(issue)}
            >
              <!-- Icon -->
              <div class="shrink-0 mt-0.5">
                {#if issue.severity === "error"}
                  <div
                    class="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"
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
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                      />
                    </svg>
                  </div>
                {:else if issue.severity === "warning"}
                  <div
                    class="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg"
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
                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                      />
                    </svg>
                  </div>
                {:else}
                  <div
                    class="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"
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
                        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                      />
                    </svg>
                  </div>
                {/if}
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <h4
                    class="text-sm font-bold text-neutral-900 dark:text-white truncate"
                  >
                    {issue.title}
                  </h4>
                  {#if issue.time > 0}
                    <span
                      class="text-xs font-mono text-neutral-500 dark:text-neutral-400 bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded"
                    >
                      {formatTime(issue.time)}
                    </span>
                  {/if}
                </div>
                <p
                  class="mt-1 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed"
                >
                  {issue.message}
                </p>
                <div class="mt-2 text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    Click to jump to time
                </div>
              </div>
            </button>
          {/each}
        {/if}
      </div>

      <div class="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0 flex justify-end">
          <button on:click={handleClose} class="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg transition-colors font-medium">
              Dismiss
          </button>
      </div>
    </div>
  </div>
{/if}
