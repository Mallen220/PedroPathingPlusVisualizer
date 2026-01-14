// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.

export const EVENT_MARKER_COLORS = {
  default: "#a855f7", // Purple-500
  intake: "#22c55e", // Green-500
  score: "#eab308", // Yellow-500 (Gold)
  custom: "#3b82f6", // Blue-500
};

export const MARKER_TYPE_OPTIONS = [
  {
    value: "default",
    label: "Default (Purple)",
    color: EVENT_MARKER_COLORS.default,
  },
  {
    value: "intake",
    label: "Intake (Green)",
    color: EVENT_MARKER_COLORS.intake,
  },
  { value: "score", label: "Score (Gold)", color: EVENT_MARKER_COLORS.score },
  {
    value: "custom",
    label: "Custom (Blue)",
    color: EVENT_MARKER_COLORS.custom,
  },
];
