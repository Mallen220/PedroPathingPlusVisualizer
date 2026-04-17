import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import PathStatisticsDialog from "./PathStatisticsDialog.svelte";
import { notification } from "../../../stores";

vi.mock("../../../stores", () => ({
  notification: { show: vi.fn() },
}));

describe("PathStatisticsDialog", () => {
  it("renders when isOpen is true", () => {
    const { getByText } = render(PathStatisticsDialog, {
      isOpen: true,
      startPoint: { x: 0, y: 0, heading: 0 },
      lines: [],
      sequence: [],
      settings: {
        robot: {
            maxVelocity: 1,
            maxAcceleration: 1,
            maxAngularVelocity: 1,
            maxAngularAcceleration: 1,
            trackWidth: 1
        },
        export: { format: "" }
      },
      onClose: vi.fn()
    });

    expect(getByText("Path Statistics")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", async () => {
    const onClose = vi.fn();
    const { getByRole } = render(PathStatisticsDialog, {
      isOpen: true,
      startPoint: { x: 0, y: 0, heading: 0 },
      lines: [],
      sequence: [],
      settings: {
        robot: {
            maxVelocity: 1,
            maxAcceleration: 1,
            maxAngularVelocity: 1,
            maxAngularAcceleration: 1,
            trackWidth: 1
        },
        export: { format: "" }
      },
      onClose
    });

    const closeBtn = getByRole("button", { name: "Close" });
    await fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
