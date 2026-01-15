<!-- Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0. -->
<script lang="ts">
  import { slide, fade } from "svelte/transition";
  import type {
    PathAnalysisReport,
    AnalysisIssue,
  } from "../../utils/pathAnalyzer";

  export let isOpen: boolean = false;
  export let report: PathAnalysisReport | null = null;
  export let onClose: () => void;

  // Compute color based on score
  $: scoreColor =
    report && report.score >= 90
      ? "text-green-600 dark:text-green-400"
      : report && report.score >= 70
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-600 dark:text-red-400";

  $: scoreBg =
    report && report.score >= 90
      ? "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800"
      : report && report.score >= 70
        ? "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800"
        : "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800";

  function getIssueIcon(type: AnalysisIssue["type"]) {
    switch (type) {
      case "error":
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5 text-red-500"><path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd" /></svg>`;
      case "warning":
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5 text-yellow-500"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd" /></svg>`;
      case "info":
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5 text-blue-500"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.963-2.333c.312-1.637 2.126-2.616 3.522-1.9 1.4.717 1.583 2.686.357 3.65l-.995.776a3.753 3.753 0 0 0-1.258 2.052v.805a.75.75 0 0 1-1.5 0v-.855c0-1.334.62-2.576 1.66-3.386l.995-.776c.466-.364.397-1.115-.138-1.39-.536-.274-1.228.102-1.347.728a.75.75 0 0 1-1.472-.28ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd" /></svg>`;
    }
  }
</script>

{#if isOpen && report}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    transition:fade={{ duration: 150 }}
    on:click|self={onClose}
    role="button"
    tabindex="0"
    on:keydown={(e) => e.key === "Escape" && onClose()}
  >
    <!-- Dialog Panel -->
    <div
      class="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-700"
      transition:slide={{ duration: 200, axis: "y" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="analysis-title"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50"
      >
        <div class="flex items-center gap-3">
          <h2
            id="analysis-title"
            class="text-xl font-bold text-neutral-900 dark:text-white"
          >
            Path Health Report
          </h2>
          <!-- Score Badge -->
          <div
            class={`px-3 py-1 rounded-full border text-sm font-bold flex items-center gap-1 ${scoreBg} ${scoreColor}`}
          >
            <span>{Math.round(report.score)}/100</span>
          </div>
        </div>

        <button
          on:click={onClose}
          class="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            class="size-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="overflow-y-auto flex-1 p-5 space-y-6">
        <!-- Summary Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            class="bg-neutral-100 dark:bg-neutral-700/50 p-3 rounded-lg flex flex-col items-center justify-center text-center"
          >
            <span
              class="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide"
              >Total Time</span
            >
            <span
              class="text-lg font-bold text-neutral-900 dark:text-white mt-1"
            >
              {report.metrics.totalTime.toFixed(2)}s
            </span>
          </div>
          <div
            class="bg-neutral-100 dark:bg-neutral-700/50 p-3 rounded-lg flex flex-col items-center justify-center text-center"
          >
            <span
              class="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide"
              >Max Velocity</span
            >
            <span
              class={`text-lg font-bold mt-1 ${
                report.metrics.maxVelocityDetected > 100
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-neutral-900 dark:text-white"
              }`}
            >
              {report.metrics.maxVelocityDetected.toFixed(1)}
            </span>
          </div>
          <div
            class="bg-neutral-100 dark:bg-neutral-700/50 p-3 rounded-lg flex flex-col items-center justify-center text-center"
          >
            <span
              class="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide"
              >Max Accel</span
            >
            <span
              class={`text-lg font-bold mt-1 ${
                report.metrics.maxAccelerationDetected > 100
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-neutral-900 dark:text-white"
              }`}
            >
              {report.metrics.maxAccelerationDetected.toFixed(1)}
            </span>
          </div>
          <div
            class="bg-neutral-100 dark:bg-neutral-700/50 p-3 rounded-lg flex flex-col items-center justify-center text-center"
          >
            <span
              class="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide"
              >Issues</span
            >
            <span
              class={`text-lg font-bold mt-1 ${
                report.issues.length > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {report.issues.length}
            </span>
          </div>
        </div>

        <!-- Issues List -->
        {#if report.issues.length > 0}
          <div class="space-y-3">
            <h3
              class="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider"
            >
              Detected Issues
            </h3>
            {#each report.issues as issue}
              <div
                class="flex gap-4 p-4 rounded-lg border bg-white dark:bg-neutral-800 transition-colors
                  {issue.type === 'error'
                  ? 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10'
                  : issue.type === 'warning'
                    ? 'border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/10'
                    : 'border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/10'}"
              >
                <div class="flex-none mt-0.5">
                  {@html getIssueIcon(issue.type)}
                </div>
                <div class="flex-1">
                  <h4
                    class="font-semibold text-neutral-900 dark:text-neutral-100"
                  >
                    {issue.title}
                  </h4>
                  <p
                    class="text-sm text-neutral-600 dark:text-neutral-400 mt-1"
                  >
                    {issue.description}
                  </p>
                  {#if issue.timestamp !== undefined}
                    <div
                      class="mt-2 text-xs font-mono text-neutral-500 dark:text-neutral-500"
                    >
                      Time: {issue.timestamp.toFixed(2)}s
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <!-- Empty State / Success -->
          <div
            class="flex flex-col items-center justify-center py-12 text-center"
          >
            <div
              class="p-4 bg-green-100 dark:bg-green-900/30 rounded-full mb-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="size-12 text-green-600 dark:text-green-400"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
              No Issues Detected!
            </h3>
            <p class="text-neutral-500 dark:text-neutral-400 max-w-xs mt-2">
              Your path looks healthy and ready for the field. Good luck!
            </p>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div
        class="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 flex justify-end"
      >
        <button
          on:click={onClose}
          class="px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm"
        >
          Done
        </button>
      </div>
    </div>
  </div>
{/if}

<svelte:window on:keydown={(e) => isOpen && e.key === "Escape" && onClose()} />
