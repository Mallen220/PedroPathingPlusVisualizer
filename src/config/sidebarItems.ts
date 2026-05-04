// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
export type SidebarItemType = "system" | "setting" | "separator" | "spacer";

export interface SidebarItemConfig {
  id: string;
  label: string;
  type: SidebarItemType;
  settingKey?: string; // e.g. "showRobotArrows"
  iconSvg?: string; // For auto-rendered 'setting' types (SVG markup)
  iconName?: string; // Svelte component constructor for imported icons
  shortcutKey?: string; // to look up in keybindings
}

export const SIDEBAR_ITEMS: SidebarItemConfig[] = [
  // System items (rendered with custom logic in LeftSidebar)
  {
    id: "fileManager",
    label: "File Manager",
    type: "system",
    shortcutKey: "toggle-file-manager",
    iconName: "FolderIcon",
  },
  {
    id: "keyboardShortcuts",
    label: "Keyboard Shortcuts",
    type: "system",
    shortcutKey: "show-help",
    iconName: "KeyboardIcon",
  },
  {
    id: "commandPalette",
    label: "Command Palette",
    type: "system",
    shortcutKey: "toggle-command-palette",
    iconName: "SearchIcon",
  },
  {
    id: "undo",
    label: "Undo",
    type: "system",
    shortcutKey: "undo",
    iconName: "UndoIcon",
  },
  {
    id: "history",
    label: "History",
    type: "system",
    shortcutKey: "toggle-history",
    iconName: "ClockIcon",
  },
  {
    id: "redo",
    label: "Redo",
    type: "system",
    shortcutKey: "redo",
    iconName: "RedoIcon",
  },
  {
    id: "drawPath",
    label: "Draw Path",
    type: "system",
    shortcutKey: "toggle-draw",
    iconName: "PenIcon",
  },
  {
    id: "ruler",
    label: "Ruler",
    type: "system",
    shortcutKey: "toggle-ruler",
    iconName: "RulerIcon",
  },
  {
    id: "protractor",
    label: "Protractor",
    type: "system",
    shortcutKey: "toggle-protractor",
    iconName: "ProtractorIcon",
  },
  {
    id: "grid",
    label: "Grid & Snap",
    type: "system",
    shortcutKey: "toggle-grid",
    iconName: "GridIcon",
  },
  {
    id: "onionSkin",
    label: "Onion Skin",
    type: "system",
    shortcutKey: "toggle-onion",
    iconName: "OnionSkinIcon",
  },
  {
    id: "velocityHeatmap",
    label: "Velocity Heatmap",
    type: "system",
    iconName: "VelocityHeatmapIcon",
  },
  {
    id: "lockView",
    label: "Lock Field View",
    type: "system",
    shortcutKey: "toggle-lock-view",
    iconName: "LockIcon",
  },
  {
    id: "newPath",
    label: "New Path",
    type: "system",
    shortcutKey: "new-file",
    iconName: "PlusIcon",
  },
  {
    id: "settings",
    label: "Settings Menu",
    type: "system",
    shortcutKey: "open-settings",
    iconName: "WrenchIcon",
  },
  {
    id: "feedback",
    label: "Feedback",
    type: "system",
    iconName: "FeedbackIcon",
  },
  {
    id: "github",
    label: "GitHub Repo",
    type: "system",
    iconName: "GithubIcon",
  },

  // Structural items
  { id: "separator", label: "Separator", type: "separator" },
  { id: "spacer", label: "Spacer (Flexible Space)", type: "spacer" },

  // Setting Toggles (Rendered generically)
  {
    id: "showRobotArrows",
    label: "Show Robot Arrows",
    type: "setting",
    settingKey: "showRobotArrows",
    iconName: "RobotPlaceholderIcon",
  },
  {
    id: "showFakeHeadingArrow",
    label: "Show Fake Heading Arrow",
    type: "setting",
    settingKey: "showFakeHeadingArrow",
    iconName: "ShowFakeHeadingArrowIcon",
  },
  {
    id: "validateFieldBoundaries",
    label: "Validate Field Boundaries",
    type: "setting",
    settingKey: "validateFieldBoundaries",
    iconName: "ValidateFieldBoundariesIcon",
  },
  {
    id: "continuousValidation",
    label: "Continuous Validation",
    type: "setting",
    settingKey: "continuousValidation",
    iconName: "ContinuousValidationIcon",
  },
  {
    id: "restrictDraggingToField",
    label: "Restrict Dragging To Field",
    type: "setting",
    settingKey: "restrictDraggingToField",
    iconName: "RestrictDraggingToFieldIcon",
  },
  {
    id: "smartSnapping",
    label: "Smart Snapping",
    type: "setting",
    settingKey: "smartSnapping",
    iconName: "SmartSnappingIcon",
  },
  {
    id: "showDebugSequence",
    label: "Show Debug Sequence",
    type: "setting",
    settingKey: "showDebugSequence",
    iconName: "ClipboardIcon",
  },
  {
    id: "autoExportCode",
    label: "Auto Export Code",
    type: "setting",
    settingKey: "autoExportCode",
    iconName: "DownloadIcon",
  },
  {
    id: "followRobot",
    label: "Follow Robot",
    type: "setting",
    settingKey: "followRobot",
    iconName: "FollowRobotIcon",
  },
  {
    id: "showTelemetryTab",
    label: "Show Live Telemetry Tab",
    type: "setting",
    settingKey: "showTelemetryTab",
    iconName: "ShowTelemetryTabIcon",
  },
  {
    id: "showRobot",
    label: "Toggle Robot Visibility",
    type: "setting",
    settingKey: "showRobot",
    iconName: "ShowRobotIcon",
  },
  {
    id: "presentationMode",
    label: "Presentation Mode",
    type: "system",
    iconName: "PresentationModeIcon",
  },
  {
    id: "pluginManager",
    label: "Plugin Manager",
    type: "system",
    iconName: "PuzzleIcon",
  },
  {
    id: "whatsNew",
    label: "What's New & Docs",
    type: "system",
    iconName: "StarIcon",
  },
  {
    id: "onboarding",
    label: "Restart Tutorial",
    type: "system",
    iconName: "QuestionMarkIcon",
  },
  {
    id: "exportImage",
    label: "Export as Image",
    type: "system",
    iconName: "PhotoIcon",
  },
  {
    id: "exportGif",
    label: "Export as GIF",
    type: "system",
    iconName: "ExportGifIcon",
  },
];
