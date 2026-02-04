// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.
import { componentRegistry, fieldContextMenuRegistry } from "./registries";
import Navbar from "./Navbar.svelte";
import FieldRenderer from "./components/FieldRenderer.svelte";
import ControlTab, { registerDefaultControlTabs } from "./ControlTab.svelte";
import { actionRegistry } from "./actionRegistry";
import { WaitAction } from "./actions/WaitAction";
import { RotateAction } from "./actions/RotateAction";
import { MacroAction } from "./actions/MacroAction";
import { PathAction } from "./actions/PathAction";
import { poiStore, showPOIManager } from "../stores";

// Registers built-in components and tabs. Safe to call multiple times; registries dedupe by id.
export const registerCoreUI = () => {
  componentRegistry.register("Navbar", Navbar);
  componentRegistry.register("FieldRenderer", FieldRenderer);
  componentRegistry.register("ControlTab", ControlTab);

  // Tabs live inside ControlTab; ensure defaults are present after registry resets.
  registerDefaultControlTabs();

  // Register Core Actions
  actionRegistry.register(PathAction);
  actionRegistry.register(WaitAction);
  actionRegistry.register(RotateAction);
  actionRegistry.register(MacroAction);

  // Register Context Menu Items
  fieldContextMenuRegistry.register({
    id: "add-poi",
    label: "Add POI Here",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>`,
    onClick: ({ x, y }) => {
      const id = `poi-${Math.random().toString(36).slice(2)}`;
      const name = `Point (${Math.round(x)}, ${Math.round(y)})`;
      poiStore.update((pois) => [
        ...pois,
        {
          id,
          name,
          x: Number(x.toFixed(1)),
          y: Number(y.toFixed(1)),
          color: "#facc15",
          visible: true,
        },
      ]);
      showPOIManager.set(true);
    },
  });
};
