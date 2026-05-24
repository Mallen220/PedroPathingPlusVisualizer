// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/svelte";
import LeftSidebar from "../../lib/components/LeftSidebar.svelte";

import { settingsStore } from "../../lib/projectStore";

describe("LeftSidebar", () => {
  it("renders correctly", () => {
    settingsStore.set({} as any);
    const { container } = render(LeftSidebar, {
      props: { settings: {} as any } as any,
    });
    expect(container).toBeTruthy();
  });

  it("renders the Discord link in the sidebar", () => {
    const { getByLabelText } = render(LeftSidebar, {
      props: {
        settings: {
          sidebarItems: ["discord"],
          customSidebarItems: [],
          sidebarExpanded: true,
          sidebarWidth: 240,
        } as any,
      } as any,
    });

    const link = getByLabelText("Discord Server Invite");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://discord.gg/chHSzS4ewF");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders the GitHub link in the sidebar", () => {
    const { getByLabelText } = render(LeftSidebar, {
      props: {
        settings: {
          sidebarItems: ["github"],
          customSidebarItems: [],
          sidebarExpanded: true,
          sidebarWidth: 240,
        } as any,
      } as any,
    });

    const link = getByLabelText("GitHub Repository");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://github.com/Mallen220/TurtleTracer");
    expect(link).toHaveAttribute("target", "_blank");
  });
});
