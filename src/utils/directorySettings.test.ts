// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  saveDirectorySettings,
  loadDirectorySettings,
  getSavedAutoPathsDirectory,
  saveAutoPathsDirectory,
} from "./directorySettings";

describe("directorySettings", () => {
  const mockElectronAPI = {
    getAppDataPath: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    fileExists: vi.fn(),
  };

  beforeEach(() => {
    vi.stubGlobal("window", { electronAPI: mockElectronAPI });
    mockElectronAPI.getAppDataPath.mockResolvedValue("/mock/appData");
    mockElectronAPI.writeFile.mockResolvedValue(undefined);
    mockElectronAPI.readFile.mockResolvedValue("{}");
    mockElectronAPI.fileExists.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("loadDirectorySettings", () => {
    it("returns default settings if API fails or file doesn't exist", async () => {
      mockElectronAPI.fileExists.mockResolvedValue(false);
      const settings = await loadDirectorySettings();
      expect(settings.autoPathsDirectory).toBe("");
    });

    it("loads settings from file", async () => {
      mockElectronAPI.readFile.mockResolvedValue(
        JSON.stringify({ autoPathsDirectory: "/custom/path" }),
      );
      const settings = await loadDirectorySettings();
      expect(settings.autoPathsDirectory).toBe("/custom/path");
    });

    it("merges saved settings with defaults", async () => {
      mockElectronAPI.readFile.mockResolvedValue(JSON.stringify({}));
      const settings = await loadDirectorySettings();
      expect(settings.autoPathsDirectory).toBe(""); // Default
    });
  });

  describe("saveDirectorySettings", () => {
    it("writes settings to file", async () => {
      const settings = { autoPathsDirectory: "/new/path" };
      await saveDirectorySettings(settings);

      expect(mockElectronAPI.getAppDataPath).toHaveBeenCalled();
      expect(mockElectronAPI.writeFile).toHaveBeenCalledWith(
        "/mock/appData/directory-settings.json",
        JSON.stringify(settings, null, 2),
      );
    });
  });

  describe("getSavedAutoPathsDirectory", () => {
    it("returns the directory from loaded settings", async () => {
      mockElectronAPI.readFile.mockResolvedValue(
        JSON.stringify({ autoPathsDirectory: "/saved/dir" }),
      );
      const dir = await getSavedAutoPathsDirectory();
      expect(dir).toBe("/saved/dir");
    });
  });

  describe("saveAutoPathsDirectory", () => {
    it("updates and saves the directory", async () => {
      // Setup initial state
      mockElectronAPI.readFile.mockResolvedValue(
        JSON.stringify({ autoPathsDirectory: "/old/dir" }),
      );

      await saveAutoPathsDirectory("/new/dir");

      // Verify save call
      expect(mockElectronAPI.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("directory-settings.json"),
        expect.stringContaining('"/new/dir"'),
      );
    });
  });
});
