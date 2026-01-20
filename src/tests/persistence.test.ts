import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveProject, loadProjectData } from "../utils/fileHandlers";
import { extraDataStore, startPointStore, linesStore, shapesStore, sequenceStore, settingsStore } from "../lib/projectStore";
import { get } from "svelte/store";

describe("Persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    extraDataStore.set({});
    startPointStore.set({ x: 0, y: 0, heading: "constant", degrees: 0 });
    linesStore.set([]);
    shapesStore.set([]);
    sequenceStore.set([]);
    settingsStore.set({} as any);
  });

  it("should save extraData to the file", async () => {
    const mockWriteFile = vi.fn().mockResolvedValue(true);
    const mockSaveFile = vi.fn().mockResolvedValue({ success: true, filepath: "test.pp" });

    (window as any).electronAPI = {
      writeFile: mockWriteFile,
      saveFile: mockSaveFile,
    };

    // 1. Add data to extraDataStore
    const testNote = { id: "note1", text: "Test persistence", x: 10, y: 10 };
    extraDataStore.set({ stickyNotes: [testNote] });

    // 2. Save
    await saveProject(undefined, undefined, undefined, undefined, undefined, false, "test.pp");

    // 3. Verify
    expect(mockSaveFile).toHaveBeenCalled();
    const callArgs = mockSaveFile.mock.calls[0];
    const jsonContent = callArgs[0];
    const parsed = JSON.parse(jsonContent);

    expect(parsed.extraData).toBeDefined();
    expect(parsed.extraData.stickyNotes).toHaveLength(1);
    expect(parsed.extraData.stickyNotes[0].text).toBe("Test persistence");
  });

  it("should load extraData from file", async () => {
      const loadData = {
          version: 1,
          extraData: {
              stickyNotes: [{ id: "loaded", text: "Loaded Note" }]
          }
      };

      loadProjectData(loadData);

      const currentExtra = get(extraDataStore);
      expect(currentExtra.stickyNotes).toHaveLength(1);
      expect(currentExtra.stickyNotes[0].text).toBe("Loaded Note");
  });
});
