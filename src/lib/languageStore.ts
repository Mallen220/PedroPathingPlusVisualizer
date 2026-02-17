// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import { writable, derived, get } from "svelte/store";
import { settingsStore } from "./projectStore";

export interface LanguageData {
  [key: string]: string;
}

export interface AvailableLanguage {
  code: string;
  name: string;
}

// Internal store for translations
const translations = writable<Record<string, LanguageData>>({
  "en-US": {
    // App.svelte
    "app.dropToOpen": "Drop to Open",
    "app.releaseFile": "Release the file to open project",

    // Navbar
    "navbar.file": "File",
    "navbar.edit": "Edit",
    "navbar.view": "View",
    "navbar.help": "Help",

    // SettingsDialog
    "settings.title": "Settings",
    "settings.general": "General",
    "settings.robot": "Robot",
    "settings.motion": "Motion",
    "settings.interface": "Interface",
    "settings.codeExport": "Code Export",
    "settings.advanced": "Advanced",
    "settings.about": "About",
    "settings.searchPlaceholder": "Search settings...",
    "settings.version": "Version",
    "settings.downloads": "Downloads",
    "settings.resetDefaults": "Reset Defaults",
    "settings.save": "Save",
    "settings.uiSettingsOnly": "UI Settings Only",
    "settings.uiSettingsWarning":
      "These settings only affect the visualizer interface. Make sure your robot code matches these values.",

    // Settings - General
    "settings.general.keyboardShortcuts": "Keyboard Shortcuts",
    "settings.general.keyboardShortcutsDesc":
      "View and customize keyboard shortcuts",
    "settings.general.openEditor": "Open Editor",
    "settings.general.welcomeTutorial": "Welcome Tutorial",
    "settings.general.welcomeTutorialDesc": "Learn how to use the application",
    "settings.general.startTutorial": "Start Tutorial",
    "settings.general.pluginManager": "Plugin Manager",
    "settings.general.pluginManagerDesc": "Manage installed plugins",
    "settings.general.openManager": "Open Manager",

    // Settings - Interface
    "settings.interface.language": "Language",
    "settings.interface.languageDesc": "Select the application language",
    "settings.interface.theme": "Theme",
    "settings.interface.themeDesc": "Interface color scheme",
    "settings.interface.programFontSize": "Program Font Size",
    "settings.interface.programFontSizeDesc":
      "Adjust the scale of the user interface",
  },
});

// Available languages list
export const availableLanguages = writable<AvailableLanguage[]>([
  { code: "en-US", name: "English (US)" },
]);

// Derived store to get the current language code from settings
// If settings are not yet loaded, default to "en-US"
export const currentLanguage = derived(settingsStore, ($settings) => {
  return $settings?.language || "en-US";
});

// Derived store for the translation function
export const t = derived(
  [currentLanguage, translations],
  ([$currentLanguage, $translations]) => {
    return (key: string, params?: Record<string, string | number>) => {
      const langData =
        $translations[$currentLanguage] || $translations["en-US"];
      let text = langData?.[key] || key;

      if (params) {
        Object.entries(params).forEach(([param, value]) => {
          text = text.replace(`{${param}}`, String(value));
        });
      }

      return text;
    };
  },
);

// Function to register new translations
export function registerLanguage(
  code: string,
  name: string,
  data: LanguageData,
) {
  translations.update((current) => {
    // Merge with existing translations for this language if any
    const existing = current[code] || {};
    return {
      ...current,
      [code]: { ...existing, ...data },
    };
  });

  availableLanguages.update((langs) => {
    if (!langs.find((l) => l.code === code)) {
      return [...langs, { code, name }];
    }
    return langs;
  });
}
