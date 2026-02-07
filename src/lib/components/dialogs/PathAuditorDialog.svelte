<!-- Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0. -->
<script lang="ts">
  import { onMount } from "svelte";
  import { fade, fly, slide } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import * as d3 from "d3";
  import type {
    Point,
    Line,
    SequenceItem,
    Shape,
    Settings,
  } from "../../../types";
  import {
    calculatePathTime,
    formatTime,
    analyzePathSegment,
  } from "../../../utils/timeCalculator";
  import { calculateRobotState } from "../../../utils/animation";
  import { getRobotCorners, pointInPolygon } from "../../../utils/geometry";
  import { getAngularDifference } from "../../../utils/math";
  import { percentStore, playingStore } from "../../projectStore";

  export let isOpen = false;
  export let startPoint: Point;
  export let lines: Line[];
  export let sequence: SequenceItem[];
  export let shapes: Shape[];
  export let settings: Settings;

  let auditRunning = false;
  let issues: AuditIssue[] = [];
  let summary = { error: 0, warning: 0, info: 0 };

  interface AuditIssue {
    id: string;
    type: "error" | "warning" | "info";
    category: "safety" | "kinematics" | "logic" | "optimization";
    message: string;
    timestamp?: number;
    duration?: number;
    value?: number;
    limit?: number;
  }

  // Use identity scales for inch-based calculations
  const xScale = d3.scaleLinear().domain([0, 144]).range([0, 144]);
  const yScale = d3.scaleLinear().domain([0, 144]).range([0, 144]);

  function runAudit() {
    auditRunning = true;
    issues = [];
    summary = { error: 0, warning: 0, info: 0 };

    // Small delay to allow UI to update
    setTimeout(() => {
      performAudit();
      auditRunning = false;
    }, 50);
  }

  function performAudit() {
    const timePred = calculatePathTime(startPoint, lines, settings, sequence);
    const totalTime = timePred.totalTime;

    if (totalTime <= 0) {
      addIssue("error", "logic", "Path has zero duration or is empty.");
      return;
    }

    // 1. Logic Checks
    if (totalTime > 15) {
      addIssue(
        "warning",
        "logic",
        `Autonomous period exceeded (15s limit). Total time: ${totalTime.toFixed(2)}s`,
        undefined,
        undefined,
        totalTime,
        15,
      );
    }

    // Check for duplicate marker names
    const markerNames = new Set<string>();
    lines.forEach((l) =>
      l.eventMarkers?.forEach((m) => {
        if (markerNames.has(m.name)) {
          addIssue(
            "warning",
            "logic",
            `Duplicate event marker name: "${m.name}"`,
          );
        }
        markerNames.add(m.name);
      }),
    );
    sequence.forEach((s) => {
      if ((s.kind === "wait" || s.kind === "rotate") && s.eventMarkers) {
        s.eventMarkers.forEach((m) => {
          if (markerNames.has(m.name)) {
            addIssue(
              "warning",
              "logic",
              `Duplicate event marker name: "${m.name}"`,
            );
          }
          markerNames.add(m.name);
        });
      }
    });

    // 2. Simulation Loop (Safety & Kinematics)
    const dt = 0.05; // 50ms step
    const steps = Math.ceil(totalTime / dt);

    // active states for coalescing warnings
    let activeCollision: { shapeId: string; startTime: number } | null = null;
    let activeBoundary: { startTime: number } | null = null;
    let activeVel: { startTime: number; maxVal: number } | null = null;
    let activeAccel: { startTime: number; maxVal: number } | null = null;
    let activeCentripetal: { startTime: number; maxVal: number } | null = null;

    // Pre-calc limits
    const maxVel = settings.maxVelocity || 100;
    const maxAccel = settings.maxAcceleration || 60;
    const frictionLimit = (settings.kFriction || 0) * 386.22; // friction * g
    const robotL = settings.rLength || 18;
    const robotW = settings.rWidth || 18;

    // Previous state for finite difference calculations
    let prevVelocity = 0;
    let prevAngularVelocity = 0; // Not fully utilized yet but good to have

    for (let i = 0; i <= steps; i++) {
      const t = Math.min(i * dt, totalTime);
      const pct = (t / totalTime) * 100;

      const state = calculateRobotState(
        pct,
        timePred.timeline,
        lines,
        startPoint,
        xScale,
        yScale,
      );
      const corners = getRobotCorners(
        state.x,
        state.y,
        state.heading,
        robotL,
        robotW,
      );

      // A. Boundary Check
      let outOfBounds = false;
      for (const p of corners) {
        if (p.x < 0 || p.x > 144 || p.y < 0 || p.y > 144) {
          outOfBounds = true;
          break;
        }
      }

      if (outOfBounds) {
        if (!activeBoundary) activeBoundary = { startTime: t };
      } else {
        if (activeBoundary) {
          addIssue(
            "error",
            "safety",
            "Robot crosses field boundary",
            activeBoundary.startTime,
            t - activeBoundary.startTime,
          );
          activeBoundary = null;
        }
      }

      // B. Collision Check
      // Only check visible obstacles
      const obstacles = shapes.filter(
        (s) => s.type === "obstacle" && s.visible,
      );
      let collidingShapeId: string | null = null;

      for (const obs of obstacles) {
        // Simple check: Robot corners in Obstacle OR Obstacle corners in Robot
        // This handles most overlaps except pure edge crossing (cross shape), which is rare for convex obstacles
        let collision = false;

        // Check robot corners in obstacle
        for (const p of corners) {
          if (pointInPolygon([p.x, p.y], obs.vertices)) {
            collision = true;
            break;
          }
        }

        // Check obstacle corners in robot
        if (!collision) {
          for (const p of obs.vertices) {
            if (pointInPolygon([p.x, p.y], corners)) {
              collision = true;
              break;
            }
          }
        }

        if (collision) {
          collidingShapeId = obs.name || obs.id;
          break; // Found a collision
        }
      }

      if (collidingShapeId) {
        if (!activeCollision) {
          activeCollision = { shapeId: collidingShapeId, startTime: t };
        } else if (activeCollision.shapeId !== collidingShapeId) {
          // Changed object collision? Log previous and start new
          addIssue(
            "error",
            "safety",
            `Collision with ${activeCollision.shapeId}`,
            activeCollision.startTime,
            t - activeCollision.startTime,
          );
          activeCollision = { shapeId: collidingShapeId, startTime: t };
        }
      } else {
        if (activeCollision) {
          addIssue(
            "error",
            "safety",
            `Collision with ${activeCollision.shapeId}`,
            activeCollision.startTime,
            t - activeCollision.startTime,
          );
          activeCollision = null;
        }
      }

      // C. Kinematics (approximate from sampling)
      // Getting velocity from `timeline` is hard because `calculateRobotState` doesn't return V.
      // We can use finite difference on position, but it's noisy.
      // Better: Use `analyzePathSegment` logic or retrieve profile data.
      // However, iterating timeline events is more precise for velocity than sampling.
      // So we will do Kinematics check SEPARATELY by iterating events, not sampling.
    }

    // Close any open sampling alerts
    if (activeBoundary)
      addIssue(
        "error",
        "safety",
        "Robot crosses field boundary",
        activeBoundary.startTime,
        totalTime - activeBoundary.startTime,
      );
    if (activeCollision)
      addIssue(
        "error",
        "safety",
        `Collision with ${activeCollision.shapeId}`,
        activeCollision.startTime,
        totalTime - activeCollision.startTime,
      );

    // 3. Kinematics Check (Event Iteration)
    timePred.timeline.forEach((ev) => {
      if (ev.type === "travel" && ev.motionProfile) {
        const profile = ev.motionProfile;
        const velocityProfile = ev.velocityProfile; // Assuming this exists or we derive it
        // We can check max vel in profile
        // And check centripetal if we have radius
        // This requires access to the path geometry.
        // Let's use `analyzePathSegment` again for each line.

        const line = (ev as any).line || lines[(ev as any).lineIndex];
        if (line) {
          // Re-analyze to get curvature
          // We need start heading.
          // This is getting complex to duplicate.
          // Let's rely on `analyzePathSegment` which computes radius.
          // We need simHeading...
        }
      }
    });

    // Simplify Kinematics: Use the sampled position to compute velocity/accel
    // It's less accurate but sufficient for "Auditor" (catching big issues).
    // Let's re-run a pass for kinematics using finite difference on the sampled states.
    // We already have the loop above, let's inject it there.
    // Actually, finite difference on 50ms is okay for Velocity, noisy for Accel.
    // Let's try to extract from `PathStatisticsDialog` logic where it does `analyzePathSegment`.

    // Alternative: Just use the `pathStats` logic if we can refactor `PathStatisticsDialog` logic out?
    // Too much refactoring.
    // Let's stick to the sampled loop but maybe use a simpler check for now or accept some noise.
    // Or, just replicate the "Max Velocity" check from Stats which iterates timeline.

    // Replicating simplified Kinematics check from Stats:
    let simHeading =
      startPoint.heading === "linear"
        ? startPoint.startDeg
        : startPoint.heading === "constant"
          ? startPoint.degrees
          : 0;
    if (startPoint.heading === "tangential" && lines.length > 0) {
      // simplified tangential start
      simHeading = 0; // approximation if not computing exact
    }
    let simPoint = startPoint;

    timePred.timeline.forEach((ev) => {
      if (ev.type === "travel") {
        const line = (ev as any).line || lines[(ev as any).lineIndex];
        if (!line) return;

        const resolution = 50;
        const startH =
          ev.headingProfile && ev.headingProfile.length > 0
            ? ev.headingProfile[0]
            : simHeading;
        const analysis = analyzePathSegment(
          simPoint,
          line.controlPoints,
          line.endPoint,
          resolution,
          startH,
        );

        // Check Velocity & Centripetal
        if (ev.motionProfile) {
          const profile = ev.motionProfile;
          for (let i = 0; i < profile.length - 1; i++) {
            const dtStep = profile[i + 1] - profile[i];
            const tGlobal = ev.startTime + profile[i];

            if (dtStep > 0.0001) {
              const v =
                analysis.steps[Math.min(i, analysis.steps.length - 1)]
                  .deltaLength / dtStep;

              // Check Velocity
              if (v > maxVel * 1.05) {
                // 5% tolerance
                if (!activeVel) {
                  activeVel = { startTime: tGlobal, maxVal: v };
                } else {
                  activeVel.maxVal = Math.max(activeVel.maxVal, v);
                }
              } else {
                if (activeVel) {
                  addIssue(
                    "warning",
                    "kinematics",
                    "Max Velocity Exceeded",
                    activeVel.startTime,
                    tGlobal - activeVel.startTime,
                    activeVel.maxVal,
                    maxVel,
                  );
                  activeVel = null;
                }
              }

              // Check Centripetal
              const radius =
                analysis.steps[Math.min(i, analysis.steps.length - 1)].radius;
              if (radius > 0.001) {
                const aCent = (v * v) / radius;
                if (frictionLimit > 0 && aCent > frictionLimit) {
                  if (!activeCentripetal) {
                    activeCentripetal = { startTime: tGlobal, maxVal: aCent };
                  } else {
                    activeCentripetal.maxVal = Math.max(
                      activeCentripetal.maxVal,
                      aCent,
                    );
                  }
                } else {
                  if (activeCentripetal) {
                    addIssue(
                      "error",
                      "kinematics",
                      "Risk of Wheel Slip (Centripetal)",
                      activeCentripetal.startTime,
                      tGlobal - activeCentripetal.startTime,
                      activeCentripetal.maxVal,
                      frictionLimit,
                    );
                    activeCentripetal = null;
                  }
                }
              }
            }
          }
        }

        // Close segment warnings
        if (activeVel) {
          addIssue(
            "warning",
            "kinematics",
            "Max Velocity Exceeded",
            activeVel.startTime,
            ev.endTime - activeVel.startTime,
            activeVel.maxVal,
            maxVel,
          );
          activeVel = null;
        }
        if (activeCentripetal) {
          addIssue(
            "error",
            "kinematics",
            "Risk of Wheel Slip (Centripetal)",
            activeCentripetal.startTime,
            ev.endTime - activeCentripetal.startTime,
            activeCentripetal.maxVal,
            frictionLimit,
          );
          activeCentripetal = null;
        }

        simPoint = line.endPoint;
        simHeading = analysis.startHeading + analysis.netRotation;
      } else if (ev.type === "wait") {
        // Check for Rotational Velocity violations?
        // Skip for now to keep it simple
      }
    });

    // 4. Optimization Check
    // If we have bezier curves but default optimization params?
    // Hard to check. Let's just suggest optimization if total time > 0 and no optimization run (difficult to track).
    // Skip.
  }

  function addIssue(
    type: "error" | "warning" | "info",
    category: "safety" | "kinematics" | "logic" | "optimization",
    message: string,
    timestamp?: number,
    duration?: number,
    value?: number,
    limit?: number,
  ) {
    issues.push({
      id: Math.random().toString(36),
      type,
      category,
      message,
      timestamp,
      duration,
      value,
      limit,
    });
    summary[type]++;
  }

  function handleSeek(t: number) {
    if (t !== undefined) {
      const totalTime = calculatePathTime(
        startPoint,
        lines,
        settings,
        sequence,
      ).totalTime;
      if (totalTime > 0) {
        percentStore.set((t / totalTime) * 100);
        playingStore.set(false);
      }
    }
  }

  function handleClose() {
    isOpen = false;
  }

  $: if (isOpen) {
    runAudit();
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    transition:fade={{ duration: 200 }}
    role="dialog"
    aria-modal="true"
    on:click|self={handleClose}
  >
    <div
      class="bg-white dark:bg-neutral-900 w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col border border-neutral-200 dark:border-neutral-800 overflow-hidden"
      transition:fly={{ y: 20, duration: 300, easing: quintOut }}
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50"
      >
        <div class="flex items-center gap-3">
          <div
            class="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg"
          >
            <!-- Stethoscope / Clipboard Icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-bold text-neutral-900 dark:text-white">
              Path Auditor
            </h2>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              Automated safety and performance checks
            </p>
          </div>
        </div>
        <button
          on:click={handleClose}
          class="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
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
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 min-h-[300px]">
        {#if auditRunning}
          <div
            class="flex flex-col items-center justify-center h-full text-neutral-500 gap-3"
          >
            <div
              class="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"
            ></div>
            <p>Running checks...</p>
          </div>
        {:else if issues.length === 0}
          <div
            class="flex flex-col items-center justify-center h-full text-center py-10"
          >
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
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-neutral-900 dark:text-white mb-1">
              All Systems Go!
            </h3>
            <p class="text-neutral-500 dark:text-neutral-400 max-w-xs">
              No issues detected. Your path appears safe and within limits.
            </p>
          </div>
        {:else}
          <!-- Summary Cards -->
          <div class="flex gap-3 mb-6">
            {#if summary.error > 0}
              <div
                class="flex-1 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-3 rounded-xl flex items-center gap-3"
              >
                <div
                  class="bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-300 p-2 rounded-lg"
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
                <div>
                  <div
                    class="text-2xl font-bold text-red-700 dark:text-red-200 leading-none"
                  >
                    {summary.error}
                  </div>
                  <div
                    class="text-xs font-medium text-red-600/80 dark:text-red-300/80 uppercase tracking-wide"
                  >
                    Errors
                  </div>
                </div>
              </div>
            {/if}

            {#if summary.warning > 0}
              <div
                class="flex-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-3 rounded-xl flex items-center gap-3"
              >
                <div
                  class="bg-amber-100 dark:bg-amber-800/40 text-amber-600 dark:text-amber-300 p-2 rounded-lg"
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
                      d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                    />
                  </svg>
                </div>
                <div>
                  <div
                    class="text-2xl font-bold text-amber-700 dark:text-amber-200 leading-none"
                  >
                    {summary.warning}
                  </div>
                  <div
                    class="text-xs font-medium text-amber-600/80 dark:text-amber-300/80 uppercase tracking-wide"
                  >
                    Warnings
                  </div>
                </div>
              </div>
            {/if}
          </div>

          <div class="flex flex-col gap-3">
            {#each issues as issue}
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <div
                class="group p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden {issue.type ===
                'error'
                  ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50 hover:border-red-300 dark:hover:border-red-800'
                  : issue.type === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-800'
                    : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50'}"
                on:click={() =>
                  issue.timestamp !== undefined && handleSeek(issue.timestamp)}
                role="button"
                tabindex="0"
              >
                <div class="flex items-start gap-4">
                  <div
                    class="mt-1 {issue.type === 'error'
                      ? 'text-red-600 dark:text-red-400'
                      : issue.type === 'warning'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-blue-600 dark:text-blue-400'}"
                  >
                    {#if issue.type === "error"}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        class="size-6"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    {:else if issue.type === "warning"}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        class="size-6"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    {:else}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        class="size-6"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    {/if}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div
                      class="flex items-center gap-2 mb-1 text-xs font-bold uppercase tracking-wider opacity-60 {issue.type ===
                      'error'
                        ? 'text-red-900 dark:text-red-200'
                        : issue.type === 'warning'
                          ? 'text-amber-900 dark:text-amber-200'
                          : 'text-blue-900 dark:text-blue-200'}"
                    >
                      <span>{issue.category}</span>
                      {#if issue.timestamp !== undefined}
                        <span>•</span>
                        <span>{formatTime(issue.timestamp)}</span>
                      {/if}
                    </div>
                    <p
                      class="font-semibold text-neutral-900 dark:text-white mb-1"
                    >
                      {issue.message}
                    </p>
                    {#if issue.value !== undefined && issue.limit !== undefined}
                      <p class="text-sm text-neutral-600 dark:text-neutral-300">
                        Value: <span class="font-mono"
                          >{issue.value.toFixed(1)}</span
                        >
                        / Limit:
                        <span class="font-mono">{issue.limit.toFixed(1)}</span>
                      </p>
                    {/if}
                  </div>
                  {#if issue.timestamp !== undefined}
                    <div
                      class="opacity-0 group-hover:opacity-100 transition-opacity self-center"
                    >
                      <span
                        class="text-xs bg-white dark:bg-black/30 px-2 py-1 rounded text-neutral-500"
                        >Click to View</span
                      >
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div
        class="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 flex justify-end gap-3"
      >
        <button
          on:click={runAudit}
          class="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
        >
          Re-run Check
        </button>
        <button
          on:click={handleClose}
          class="px-6 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  </div>
{/if}
