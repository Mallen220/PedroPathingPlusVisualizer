import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const typesPath = path.join(__dirname, "../src/types.ts");
const outputPath = path.join(__dirname, "../plugins/pedro.d.ts");

const extraDefinitions = `
export interface PedroData {
  startPoint: Point;
  lines: Line[];
  shapes: Shape[];
  sequence: SequenceItem[];
}

// Registry Interfaces
export interface Registry<T> {
  subscribe: (run: (value: any) => void) => () => void;
  register: (item: T) => void;
  unregister?: (id: string) => void;
  get?: (name: string) => any;
  reset: () => void;
}

export interface ComponentRegistryState {
  [key: string]: any;
}

export interface TabDefinition {
  id: string;
  label: string;
  component: any;
  icon?: string;
  order?: number;
}

export interface NavbarAction {
  id: string;
  icon: string; // SVG string
  title?: string;
  onClick: () => void;
  location?: "left" | "right" | "center"; // Where to place it (default right)
  order?: number;
}

export type HookCallback = (...args: any[]) => void | Promise<void>;

export interface HookRegistry {
  register: (hookName: string, callback: HookCallback) => void;
  run: (hookName: string, ...args: any[]) => Promise<void>;
  clear: () => void;
}

// Writable Store Interface (simplified from Svelte)
export interface Writable<T> {
  set: (value: T) => void;
  update: (updater: (value: T) => T) => void;
  subscribe: (run: (value: T) => void) => () => void;
}

// Project Store Interface
export interface ProjectStore {
  startPointStore: Writable<Point>;
  linesStore: Writable<Line[]>;
  shapesStore: Writable<Shape[]>;
  sequenceStore: Writable<SequenceItem[]>;
  settingsStore: Writable<any>; // Using any for Settings to avoid circular or huge types for now
  // ... other stores
}

export interface PedroAPI {
  /**
   * Register a custom code exporter.
   * @param name The display name of the exporter.
   * @param handler A function that takes the current project data and returns a string (code).
   */
  registerExporter(name: string, handler: (data: PedroData) => string): void;

  /**
   * Register a custom theme.
   * @param name The name of the theme.
   * @param css The CSS string for the theme.
   */
  registerTheme(name: string, css: string): void;

  /**
   * Get the current snapshot of the project data.
   */
  getData(): PedroData;

  /**
   * Access internal registries to extend the UI.
   */
  registries: {
    components: any; // ComponentRegistry
    tabs: Registry<TabDefinition>;
    navbarActions: Registry<NavbarAction>;
    hooks: HookRegistry;
  };

  /**
   * Access internal Svelte stores.
   */
  stores: {
    project: ProjectStore;
    app: any; // App stores
    get: (store: Writable<any>) => any;
  };
}

// Global variable exposed to plugins
declare global {
  const pedro: PedroAPI;
}
`;

function generate() {
  console.log("Generating plugin types...");
  try {
    let content = fs.readFileSync(typesPath, "utf-8");

    // Remove imports/exports to make types global
    // 1. Remove import statements (assuming they are at the top)
    content = content.replace(/^import .*$/gm, "");

    // 2. Remove 'export' keyword from declarations
    // Matches "export interface", "export type", "export const" etc.
    content = content.replace(/^export /gm, "");

    const finalContent = `// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.

/**
 * Type definitions for Pedro Pathing Visualizer Plugins.
 * These types are automatically available in your .ts plugins.
 *
 * AUTO-GENERATED - DO NOT EDIT MANUALLY
 */

${content}

${extraDefinitions}
`;

    fs.writeFileSync(outputPath, finalContent);
    console.log(`Plugin types generated at ${outputPath}`);
  } catch (error) {
    console.error("Failed to generate plugin types:", error);
    process.exit(1);
  }
}

generate();
