import { vi } from "vitest";

export const mockExporters = () => {
  vi.mock("../lib/exporters", async (importOriginal) => {
    const actual: any = await importOriginal();
    return {
      ...actual,
      exporterRegistry: {
        subscribe: vi.fn((fn) => {
          fn({
            points: {
              id: "points",
              name: "Points",
              exportCode: vi.fn(() => "apple\nbanana\napple\ncherry\napple"),
            },
          });
          return () => {};
        }),
        register: vi.fn(),
      },
    };
  });
};
