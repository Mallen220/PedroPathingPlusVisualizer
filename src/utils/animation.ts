// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import {
  getCurvePoint,
  easeInOutQuad,
  shortestRotation,
  radiansToDegrees,
} from "./math";
import { getRobotCorners } from "./geometry";
import type { Point, Line, TimelineEvent, BasePoint } from "../types";
import type { ScaleLinear } from "d3";

export interface RobotState {
  x: number;
  y: number;
  heading: number;
}

type AnimationState = {
  playing: boolean;
  percent: number;
  accumulatedSeconds: number;
  lastTimestamp: number | null;
  animationFrameId: number | null;
  totalDuration: number;
  loop: boolean;
  loopRangeActive: boolean;
  loopMinPercent: number;
  loopMaxPercent: number;
};

/**
 * Calculate the robot position and heading based on the Timeline
 */

/**
 * Calculate the robot position and heading using a strict absolute elapsed time binary search
 * against the high-resolution pre-calculated ContinuousTimeline.
 */
export function calculateRobotState(
  percent: number,
  timeline: any, // Now takes ContinuousTimeline natively if possible, or fallback
  lines: Line[],
  startPoint: Point,
  xScale: ScaleLinear<number, number>,
  yScale: ScaleLinear<number, number>,
): RobotState {
  // Graceful fallback if still using old types or timeline missing
  const states = timeline && timeline.states ? timeline.states : timeline;

  if (!states || states.length === 0 || !states[0].position) {
    return { x: xScale(startPoint.x), y: yScale(startPoint.y), heading: 0 };
  }

  // Calculate current time in seconds based on percent (0-100)
  const totalDuration = states[states.length - 1].time;
  const currentSeconds = (percent / 100) * totalDuration;

  // Strict binary search exclusively against the new ContinuousTimeline's fixed-interval array
  let left = 0;
  let right = states.length - 1;
  let matched = states[right];

  while (left <= right) {
    const mid = (left + right) >> 1;
    const st = states[mid];

    if (Math.abs(st.time - currentSeconds) < 0.01) {
      matched = st;
      break;
    } else if (currentSeconds < st.time) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  // If exact match not found, we fallback to nearest left index
  if (left > right && right >= 0 && right < states.length) {
    matched = states[right];
  }

  return {
    x: xScale(matched.position.x),
    y: yScale(matched.position.y),
    // Scale heading mathematically; continuous timeline natively emits forward facing math
    heading: matched.heading,
  };
}

export function createAnimationController(
  totalDuration: number,
  onPercentChange: (percent: number) => void,
  onComplete?: () => void,
) {
  const state: AnimationState = {
    playing: false,
    percent: 0,
    accumulatedSeconds: 0, // total elapsed seconds (not tied to a single startTime)
    lastTimestamp: null, // last rAF timestamp seen while playing
    animationFrameId: null,
    totalDuration,
    loop: true,
    loopRangeActive: false,
    loopMinPercent: 0,
    loopMaxPercent: 100,
  };

  let isExternalChange = false;
  let absoluteStartTime: number | null = null; // Used for perfect time tracking

  function updatePercentFromAccumulated() {
    if (state.totalDuration > 0) {
      const rawPercent = (state.accumulatedSeconds / state.totalDuration) * 100;
      // clamp between 0 and 100 for non-looping; for looping we'll handle wrapping separately
      state.percent = Math.max(0, Math.min(100, rawPercent));
    } else {
      state.percent = 0;
    }
  }

  function animate(timestamp: number) {
    if (!state.playing) {
      state.lastTimestamp = null;
      absoluteStartTime = null;
      state.animationFrameId = null;
      return;
    }

    // Initialize lastTimestamp on first tick after play
    if (state.lastTimestamp === null || absoluteStartTime === null) {
      state.lastTimestamp = timestamp;
      absoluteStartTime = timestamp - state.accumulatedSeconds * 1000;
      state.animationFrameId = requestAnimationFrame(animate);
      return;
    }

    state.lastTimestamp = timestamp;

    // Calculate elapsed time from the absolute start time, ensures perfect time accuracy
    state.accumulatedSeconds = (timestamp - absoluteStartTime) / 1000;

    if (state.totalDuration > 0) {
      let startSec = isExternalChange
        ? 0
        : state.loopRangeActive
          ? (state.loopMinPercent / 100) * state.totalDuration
          : 0;
      let endSec = state.loopRangeActive
        ? (state.loopMaxPercent / 100) * state.totalDuration
        : state.totalDuration;
      if (endSec <= startSec) endSec = state.totalDuration;

      if (state.loop) {
        if (state.accumulatedSeconds > endSec) {
          state.accumulatedSeconds =
            startSec +
            ((state.accumulatedSeconds - endSec) % (endSec - startSec));
          // Reset absolute start time when looping
          absoluteStartTime = timestamp - state.accumulatedSeconds * 1000;
        } else if (state.accumulatedSeconds < startSec) {
          state.accumulatedSeconds = startSec;
          absoluteStartTime = timestamp - state.accumulatedSeconds * 1000;
        }
        updatePercentFromAccumulated();
        if (!isExternalChange) onPercentChange(state.percent);
        // keep animating
        state.animationFrameId = requestAnimationFrame(animate);
      } else if (state.accumulatedSeconds >= endSec) {
        // Not looping: clamp to duration and stop when done
        state.accumulatedSeconds = endSec;
        updatePercentFromAccumulated();
        if (!isExternalChange)
          onPercentChange(state.loopRangeActive ? state.loopMaxPercent : 100);
        state.playing = false;
        state.lastTimestamp = null;
        absoluteStartTime = null;
        if (state.animationFrameId) {
          cancelAnimationFrame(state.animationFrameId);
          state.animationFrameId = null;
        }
        if (onComplete) onComplete();
        return;
      } else {
        updatePercentFromAccumulated();
        if (!isExternalChange) onPercentChange(state.percent);
        state.animationFrameId = requestAnimationFrame(animate);
      }
    } else {
      // duration is zero or invalid
      state.percent = 0;
      if (!isExternalChange) onPercentChange(state.percent);
      state.animationFrameId = requestAnimationFrame(animate);
    }
  }

  function play() {
    // If already playing, nothing to do
    if (state.playing) return;

    let startSec = state.loopRangeActive
      ? (state.loopMinPercent / 100) * state.totalDuration
      : 0;
    let endSec = state.loopRangeActive
      ? (state.loopMaxPercent / 100) * state.totalDuration
      : state.totalDuration;
    if (endSec <= startSec) endSec = state.totalDuration;

    // If at the very end and not looping, reset to start so play restarts
    if (
      !state.loop &&
      state.totalDuration > 0 &&
      state.accumulatedSeconds >= endSec
    ) {
      state.accumulatedSeconds = startSec;
      updatePercentFromAccumulated();
      if (!isExternalChange) onPercentChange(state.percent);
    } else if (state.totalDuration > 0 && state.loopRangeActive) {
      if (
        state.accumulatedSeconds < startSec ||
        state.accumulatedSeconds >= endSec
      ) {
        state.accumulatedSeconds = startSec;
        updatePercentFromAccumulated();
        if (!isExternalChange) onPercentChange(state.percent);
      }
    }

    state.playing = true;
    // schedule the loop if not already scheduled
    if (state.animationFrameId === null) {
      state.lastTimestamp = performance.now(); // ensure animate initializes its timestamp properly
      state.animationFrameId = requestAnimationFrame(animate);
    }
  }

  function pause() {
    if (!state.playing) return;
    state.playing = false;
    // cancel outstanding rAF if any
    if (state.animationFrameId !== null) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }
    state.lastTimestamp = null;
    absoluteStartTime = null;
  }

  function reset() {
    state.accumulatedSeconds = 0;
    state.percent = 0;
    state.lastTimestamp = null;
    absoluteStartTime = null;
    if (!isExternalChange) onPercentChange(0);
  }

  return {
    play,
    pause,
    reset() {
      pause();
      reset();
    },
    seekToPercent(targetPercent: number) {
      isExternalChange = true;
      const clamped = Math.max(0, Math.min(100, targetPercent));
      if (state.totalDuration > 0) {
        state.accumulatedSeconds = (clamped / 100) * state.totalDuration;
      } else {
        state.accumulatedSeconds = 0;
      }

      // Update absolute start time if currently playing
      if (absoluteStartTime !== null && state.lastTimestamp !== null) {
        absoluteStartTime =
          state.lastTimestamp - state.accumulatedSeconds * 1000;
      }

      updatePercentFromAccumulated();
      onPercentChange(clamped);

      setTimeout(() => {
        isExternalChange = false;
      }, 0);
    },
    setDuration(duration: number) {
      // If duration changes, keep current progress proportionally if possible
      const oldDuration = state.totalDuration;
      if (oldDuration > 0) {
        const progress = state.accumulatedSeconds / oldDuration;
        state.totalDuration = duration;
        state.accumulatedSeconds = progress * Math.max(0, duration);
      } else {
        state.totalDuration = duration;
        state.accumulatedSeconds = Math.min(
          state.accumulatedSeconds,
          Math.max(0, duration),
        );
      }

      // Update absolute start time if currently playing
      if (absoluteStartTime !== null && state.lastTimestamp !== null) {
        absoluteStartTime =
          state.lastTimestamp - state.accumulatedSeconds * 1000;
      }

      updatePercentFromAccumulated();
      if (!isExternalChange) onPercentChange(state.percent);
    },
    setLoop(loop: boolean) {
      state.loop = loop;
    },
    setPlaybackRange(minPercent: number, maxPercent: number, active: boolean) {
      state.loopRangeActive = active;
      state.loopMinPercent = Math.max(0, Math.min(100, minPercent));
      state.loopMaxPercent = Math.max(0, Math.min(100, maxPercent));
      if (state.loopMaxPercent <= state.loopMinPercent)
        state.loopMaxPercent = 100;
    },
    isPlaying() {
      return state.playing;
    },
    getPercent() {
      updatePercentFromAccumulated();
      return state.percent;
    },
    getDuration() {
      return state.totalDuration;
    },
    isLooping() {
      return state.loop;
    },
  };
}

/**
 * Generate onion layer robot bodies at regular intervals along the path
 * Returns an array of robot states (position, heading, and corner points) for drawing
 * @param startPoint - The starting point of the path
 * @param lines - The path lines to trace
 * @param robotLength - Robot length in inches
 * @param robotWidth - Robot width in inches
 * @param spacing - Distance in inches between each robot trace (default 6)
 * @returns Array of robot states with corner points for rendering
 */
export function generateOnionLayers(
  startPoint: Point,
  lines: Line[],
  robotLength: number,
  robotWidth: number,
  spacing: number = 6,
): Array<{ x: number; y: number; heading: number; corners: BasePoint[] }> {
  if (lines.length === 0) return [];

  const layers: Array<{
    x: number;
    y: number;
    heading: number;
    corners: BasePoint[];
  }> = [];

  // Calculate total path length
  let totalLength = 0;
  let currentLineStart = startPoint;

  for (const line of lines) {
    const curvePoints = [
      currentLineStart,
      ...line.controlPoints,
      line.endPoint,
    ];

    // Approximate line length by sampling
    const samples = 100;
    let lineLength = 0;
    let prevPos = curvePoints[0];

    for (let i = 1; i <= samples; i++) {
      const t = i / samples;
      const pos = getCurvePoint(t, curvePoints);
      const dx = pos.x - prevPos.x;
      const dy = pos.y - prevPos.y;
      lineLength += Math.sqrt(dx * dx + dy * dy);
      prevPos = pos;
    }

    totalLength += lineLength;
    currentLineStart = line.endPoint;
  }

  // Calculate number of layers based on spacing
  const numLayers = Math.max(1, Math.floor(totalLength / spacing));

  // Sample robot positions at regular intervals
  currentLineStart = startPoint;
  let accumulatedLength = 0;
  let nextLayerDistance = spacing;

  for (const line of lines) {
    const curvePoints = [
      currentLineStart,
      ...line.controlPoints,
      line.endPoint,
    ];
    const samples = 100;
    let prevPos = curvePoints[0];
    let prevT = 0;

    for (let i = 1; i <= samples; i++) {
      const t = i / samples;
      const pos = getCurvePoint(t, curvePoints);
      const dx = pos.x - prevPos.x;
      const dy = pos.y - prevPos.y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);

      accumulatedLength += segmentLength;

      // Check if we've reached the next layer position
      while (
        accumulatedLength >= nextLayerDistance &&
        nextLayerDistance <= totalLength
      ) {
        // Interpolate exact position for this layer
        const overshoot = accumulatedLength - nextLayerDistance;
        const interpolationT = 1 - overshoot / segmentLength;
        const layerT = prevT + (t - prevT) * interpolationT;
        const robotPosInches = getCurvePoint(layerT, curvePoints);

        // Calculate heading for this position
        let heading = 0;
        if (line.endPoint.heading === "linear") {
          heading = shortestRotation(
            line.endPoint.startDeg,
            line.endPoint.endDeg,
            layerT,
          );
        } else if (line.endPoint.heading === "constant") {
          heading = -line.endPoint.degrees;
        } else if (line.endPoint.heading === "tangential") {
          // Calculate tangent direction
          const nextT = Math.min(
            layerT + (line.endPoint.reverse ? -0.01 : 0.01),
            1,
          );
          const nextPos = getCurvePoint(nextT, curvePoints);
          const tdx = nextPos.x - robotPosInches.x;
          const tdy = nextPos.y - robotPosInches.y;
          if (tdx !== 0 || tdy !== 0) {
            heading = radiansToDegrees(Math.atan2(tdy, tdx));
          }
        } else if (line.endPoint.heading === "facingPoint") {
          const targetX = (line.endPoint as any).targetX || 0;
          const targetY = (line.endPoint as any).targetY || 0;
          const tdx = targetX - robotPosInches.x;
          const tdy = targetY - robotPosInches.y;
          if (tdx !== 0 || tdy !== 0) {
            let angle = radiansToDegrees(Math.atan2(tdy, tdx));
            if ((line.endPoint as any).reverse) angle += 180;
            heading = angle;
          }
        }

        // Get robot corners for this position
        const corners = getRobotCorners(
          robotPosInches.x,
          robotPosInches.y,
          heading,
          robotLength,
          robotWidth,
        );

        layers.push({
          x: robotPosInches.x,
          y: robotPosInches.y,
          heading: heading,
          corners: corners,
        });

        nextLayerDistance += spacing;
      }

      prevPos = pos;
      prevT = t;
    }

    currentLineStart = line.endPoint;
  }

  return layers;
}
