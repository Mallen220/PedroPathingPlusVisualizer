// German Language Pack for Pedro Pathing Plus Visualizer
// This plugin adds German translation support to the interface.

pedro.registerMetadata({
  name: "German Language Pack",
  description: "Adds German (Deutsch) language support to the user interface.",
  author: "Jules (Example)",
  version: "1.0.0",
});

pedro.registerLanguage("de-DE", "Deutsch", {
  // App.svelte
  "app.dropToOpen": "Zum Öffnen hier ablegen",
  "app.releaseFile": "Datei loslassen, um Projekt zu öffnen",

  // Navbar
  "navbar.file": "Datei",
  "navbar.edit": "Bearbeiten",
  "navbar.view": "Ansicht",
  "navbar.help": "Hilfe",

  // SettingsDialog
  "settings.title": "Einstellungen",
  "settings.general": "Allgemein",
  "settings.robot": "Roboter",
  "settings.motion": "Bewegung",
  "settings.interface": "Oberfläche",
  "settings.codeExport": "Code-Export",
  "settings.advanced": "Erweitert",
  "settings.about": "Über",
  "settings.searchPlaceholder": "Einstellungen suchen...",
  "settings.version": "Version",
  "settings.downloads": "Downloads",
  "settings.resetDefaults": "Standard zurücksetzen",
  "settings.save": "Speichern",
  "settings.uiSettingsOnly": "Nur UI-Einstellungen",
  "settings.uiSettingsWarning":
    "Diese Einstellungen betreffen nur die Visualizer-Oberfläche. Stellen Sie sicher, dass Ihr Robotercode mit diesen Werten übereinstimmt.",

  // Settings - General
  "settings.general.keyboardShortcuts": "Tastenkombinationen",
  "settings.general.keyboardShortcutsDesc":
    "Tastenkombinationen anzeigen und anpassen",
  "settings.general.openEditor": "Editor öffnen",
  "settings.general.welcomeTutorial": "Willkommens-Tutorial",
  "settings.general.welcomeTutorialDesc":
    "Lernen Sie, wie man die Anwendung benutzt",
  "settings.general.startTutorial": "Tutorial starten",
  "settings.general.pluginManager": "Plugin-Manager",
  "settings.general.pluginManagerDesc": "Installierte Plugins verwalten",
  "settings.general.openManager": "Manager öffnen",

  // Settings - Interface
  "settings.interface.language": "Sprache",
  "settings.interface.languageDesc": "Wählen Sie die Anwendungssprache",
  "settings.interface.theme": "Design",
  "settings.interface.themeDesc": "Farbschema der Oberfläche",
  "settings.interface.programFontSize": "Programmschriftgröße",
  "settings.interface.programFontSizeDesc":
    "Skalierung der Benutzeroberfläche anpassen",
});
