// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import { get } from "svelte/store";
import {
  currentFilePath,
  isUnsaved,
  notification,
  projectMetadataStore,
  currentDirectoryStore,
} from "../stores";
import { scanEventsInDirectory } from "./eventScanner";
import {
  startPointStore,
  linesStore,
  shapesStore,
  sequenceStore,
  settingsStore,
  extraDataStore,
  macrosStore,
  updateMacroContent,
  loadProjectData,
} from "../lib/projectStore";
import { loadTrajectoryFromFile, downloadTrajectory } from "./index";
import { exporterRegistry } from "../lib/exporters";
import type { Line, Point, SequenceItem, Settings, Shape } from "../types";
import { makeId } from "./nameGenerator";
import { getLineStartHeading, getLineEndHeading } from "./math";
import {
  DEFAULT_PROJECT_EXTENSION,
  LEGACY_PROJECT_EXTENSION,
  ensureDefaultProjectExtension,
  isLegacyProjectFileName,
  isSupportedProjectFileName,
  stripProjectExtension,
} from "./fileExtensions";
import pkg from "../../package.json";

interface ExtendedElectronAPI {
  writeFile: (filePath: string, content: string) => Promise<boolean>;
  writeFileBase64?: (
    filePath: string,
    base64Content: string,
  ) => Promise<boolean>;
  showSaveDialog?: (options: any) => Promise<string | null>;
  getDirectory?: () => Promise<string | null>;
  getSavedDirectory?: () => Promise<string>;
  fileExists?: (filePath: string) => Promise<boolean>;
  readFile?: (filePath: string) => Promise<string>;
  onMenuAction?: (callback: (action: string) => void) => void;
  copyFile?: (src: string, dest: string) => Promise<boolean>;
  saveFile?: (
    content: string,
    path?: string,
  ) => Promise<{ success: boolean; filepath: string; error?: string }>;
  makeRelativePath?: (base: string, target: string) => Promise<string>;
  resolvePath?: (base: string, relative: string) => Promise<string>;
  createDirectory?: (dirPath: string) => Promise<boolean>;
}

function getElectronAPI(): ExtendedElectronAPI | undefined {
  return (globalThis as any).electronAPI as ExtendedElectronAPI | undefined;
}

function calculateStartPointHeadings(startPoint: Point, lines: Line[]): Point {
  if (!lines || lines.length === 0) return startPoint;

  const startHeading = getLineStartHeading(lines[0], startPoint);
  const endHeading = getLineEndHeading(
    lines[lines.length - 1],
    lines.length > 1 ? lines[lines.length - 2].endPoint : startPoint,
  );

  const { degrees: _degrees, ...rest } = startPoint as any;
  return {
    ...rest,
    heading: "linear",
    startDeg: startHeading,
    endDeg: endHeading,
  };
}

function addToRecentFiles(path: string, settings?: Settings) {
  const currentSettings = settings || get(settingsStore);
  let recent = currentSettings.recentFiles || [];

  recent = recent.filter((f) => f !== path);
  recent.unshift(path);
  if (recent.length > 10) recent = recent.slice(0, 10);

  settingsStore.update((s) => ({ ...s, recentFiles: recent }));
}

async function performAutoSaveOnClose() {
  const settings = get(settingsStore);
  if (
    settings.autosaveMode === "close" &&
    get(isUnsaved) &&
    get(currentFilePath)
  ) {
    await saveProject(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      false,
      undefined,
      { quiet: true },
    );
  }
}

async function triggerAutoExportWithStores(data: any, path: string) {
  await handleAutoExport(
    get(startPointStore),
    get(linesStore),
    get(sequenceStore),
    get(settingsStore),
    get(shapesStore),
    data,
    path,
  );
}

function createProjectData(
  startPoint: Point,
  lines: Line[],
  shapes: Shape[],
  sequence: SequenceItem[],
  extraData: Record<string, any>,
) {
  return {
    version: pkg.version,
    header: {
      info: "Created with Turtle Tracer",
      copyright:
        "Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.",
      link: "https://github.com/Mallen220/TurtleTracer",
    },
    startPoint,
    lines,
    sequence,
    shapes,
    extraData,
  };
}

export async function loadRecentFile(path: string) {
  await performAutoSaveOnClose();

  const electronAPI = getElectronAPI();
  if (!electronAPI?.readFile) {
    alert("Cannot load files in this environment");
    return;
  }
  try {
    if (electronAPI.fileExists && !(await electronAPI.fileExists(path))) {
      if (
        confirm(
          `File not found: ${path}\nDo you want to remove it from recent files?`,
        )
      ) {
        const settings = get(settingsStore);
        settings.recentFiles = settings.recentFiles?.filter((p) => p !== path);
        settingsStore.set({ ...settings });
      }
      return;
    }
    const content = await electronAPI.readFile(path);
    const data = JSON.parse(content);
    await loadProjectData(data, path);
    currentFilePath.set(path);
    projectMetadataStore.set({ filepath: path, lastSaved: new Date() });
    addToRecentFiles(path);

    await triggerAutoExportWithStores(data, path);
  } catch (err) {
    console.error("Error loading recent file:", err);
    alert("Failed to load file: " + (err as Error).message);
  }
}

async function performSave(
  startPoint: Point,
  lines: Line[],
  settings: Settings,
  sequence: SequenceItem[],
  shapes: Shape[],
  targetPath: string | undefined,
  options: { quiet?: boolean } = {},
) {
  const electronAPI = getElectronAPI();
  const extraData = get(extraDataStore);
  try {
    if (!sequence || sequence.length === 0) {
      sequence = lines.map((l) => ({ kind: "path", lineId: l.id! }));
    }

    lines.forEach((l) => {
      if (!l.id) l.id = makeId();
    });
    sequence.forEach((s) => {
      if (s.kind === "wait" && !s.id) s.id = makeId();
    });

    const linesToSave = structuredClone(lines);
    const sequenceToSave = structuredClone(sequence);

    const nameGroups = new Map<string, Array<Line | any>>();

    const collectItems = (items: Array<Line | any>, _type: "line" | "wait") => {
      items.forEach((item) => {
        const name = item.name?.trim();
        if (name) {
          if (!nameGroups.has(name)) {
            nameGroups.set(name, []);
          }
          nameGroups.get(name)!.push(item);
        }
      });
    };

    collectItems(linesToSave, "line");
    const waits = sequenceToSave.filter((s) => s.kind === "wait");
    collectItems(waits, "wait");

    nameGroups.forEach((group, name) => {
      if (group.length > 1) {
        group.forEach((item, index) => {
          item._linkedName = name;
          item.name = `${name} (${index + 1})`;
        });
      }
    });

    if (!targetPath && electronAPI) {
      if (electronAPI.showSaveDialog) {
        const filePath = await electronAPI.showSaveDialog({
          title: "Save Project",
          defaultPath: `trajectory${DEFAULT_PROJECT_EXTENSION}`,
          filters: [
            {
              name: "Turtle Tracer Project",
              extensions: ["turt"],
            },
          ],
        });
        if (!filePath) return false;
        targetPath = filePath;
      } else {
        return false;
      }
    }

    let convertedFromLegacy = false;
    if (targetPath) {
      convertedFromLegacy = isLegacyProjectFileName(targetPath);
      targetPath = ensureDefaultProjectExtension(targetPath);
    }

    if (targetPath && electronAPI?.makeRelativePath) {
      for (const item of sequenceToSave) {
        if (item.kind === "macro") {
          item.filePath = await electronAPI.makeRelativePath(
            targetPath,
            item.filePath,
          );
        }
      }
    }

    const updatedStartPoint = calculateStartPointHeadings(
      startPoint,
      linesToSave,
    );

    const projectData = createProjectData(
      updatedStartPoint,
      linesToSave,
      shapes,
      sequenceToSave,
      extraData,
    );

    const jsonString = JSON.stringify(projectData, null, 2);

    if (electronAPI?.saveFile) {
      const result = await electronAPI.saveFile(jsonString, targetPath);
      if (result.success) {
        projectMetadataStore.update((m) => ({
          ...m,
          filepath: result.filepath,
        }));
        currentFilePath.set(result.filepath);
        addToRecentFiles(result.filepath, settings);
        isUnsaved.set(false);
        if (!options.quiet) {
          if (convertedFromLegacy) {
            notification.set({
              message:
                "Legacy .pp file detected. Saved as .turt. Use the .turt file going forward.",
              type: "warning",
              timeout: 6000,
            });
          } else {
            notification.set({
              message: `Project saved to ${result.filepath}`,
              type: "success",
              timeout: 3000,
            });
          }
        }

        const macros = get(macrosStore);
        if (result.filepath && macros.has(result.filepath)) {
          updateMacroContent(result.filepath, projectData as any);
        }

        const dir = get(currentDirectoryStore);
        if (dir) scanEventsInDirectory(dir);

        await handleAutoExport(
          startPoint,
          lines,
          sequence,
          settings,
          shapes,
          projectData,
          result.filepath,
        );
        return true;
      } else {
        if (result.error !== "canceled") {
          notification.set({
            message: `Failed to save: ${result.error}`,
            type: "error",
            timeout: 5000,
          });
        }
        return false;
      }
    } else if (electronAPI?.writeFile) {
      if (!targetPath) return false;

      await electronAPI.writeFile(targetPath, jsonString);
      projectMetadataStore.update((m) => ({ ...m, filepath: targetPath! }));
      currentFilePath.set(targetPath);
      addToRecentFiles(targetPath, settings);
      isUnsaved.set(false);
      if (!options.quiet) {
        if (convertedFromLegacy) {
          notification.set({
            message:
              "Legacy .pp file detected. Saved as .turt. Use the .turt file going forward.",
            type: "warning",
            timeout: 6000,
          });
        } else {
          notification.set({
            message: `Project saved to ${targetPath}`,
            type: "success",
            timeout: 3000,
          });
        }
      }

      const macros = get(macrosStore);
      if (targetPath && macros.has(targetPath)) {
        updateMacroContent(targetPath, projectData as any);
      }

      const dir = get(currentDirectoryStore);
      if (dir) scanEventsInDirectory(dir);

      await handleAutoExport(
        startPoint,
        lines,
        sequence,
        settings,
        shapes,
        projectData,
        targetPath,
      );
      return true;
    }

    return false;
  } catch (err: any) {
    console.error("Save error:", err);
    notification.set({
      message: `Save failed: ${err.message}`,
      type: "error",
    });
    return false;
  }
}

export async function saveProject(
  startPoint?: Point,
  lines?: Line[],
  settings?: Settings,
  sequence?: SequenceItem[],
  shapes?: Shape[],
  saveAs: boolean = false,
  specificPath?: string,
  options: { quiet?: boolean } = {},
) {
  const electronAPI = getElectronAPI();
  const sp = startPoint || get(startPointStore);
  const ln = lines || get(linesStore);
  const st = settings || get(settingsStore);
  const seq = sequence || get(sequenceStore);
  const sh = shapes || get(shapesStore);

  let targetPath = specificPath || get(currentFilePath) || undefined;
  if (saveAs) {
    targetPath = undefined;
  }

  if (!electronAPI) {
    saveFileAs();
    return true;
  }

  return await performSave(sp, ln, st, seq, sh, targetPath, options);
}

export function saveFileAs() {
  const filePath = get(currentFilePath);
  let filename = "trajectory";
  if (filePath) {
    const baseName = filePath.split(/[\\/]/).pop() || "";
    filename = stripProjectExtension(baseName);
  }

  if (filePath && isLegacyProjectFileName(filePath)) {
    notification.set({
      message:
        "Legacy .pp file detected. Save As will create a .turt file. Use the .turt file going forward.",
      type: "warning",
      timeout: 6000,
    });
  }

  downloadTrajectory(
    get(startPointStore),
    get(linesStore),
    get(shapesStore),
    get(sequenceStore),
    get(extraDataStore),
    `${filename}${DEFAULT_PROJECT_EXTENSION}`,
  );
}

async function exportProjectFileWithExtension(
  extension: string,
  title: string,
  filterName: string,
  filterExtensions: string[],
) {
  const electronAPI = getElectronAPI();
  const filePath = get(currentFilePath);
  let filename = "trajectory";
  if (filePath) {
    const baseName = filePath.split(/[\\\/]/).pop() || "";
    filename = stripProjectExtension(baseName);
  }
  const defaultName = `${filename}${extension}`;

  if (electronAPI && !(electronAPI as any).isVirtual) {
    if (electronAPI.showSaveDialog && electronAPI.writeFile) {
      const targetFilePath = await electronAPI.showSaveDialog({
        title,
        defaultPath: defaultName,
        filters: [{ name: filterName, extensions: filterExtensions }],
      });
      if (!targetFilePath) return;

      const resolvedPath =
        extension === DEFAULT_PROJECT_EXTENSION
          ? ensureDefaultProjectExtension(targetFilePath)
          : targetFilePath;

      const sequence = structuredClone(get(sequenceStore));
      if (electronAPI.makeRelativePath) {
        for (const item of sequence) {
          if (item.kind === "macro") {
            item.filePath = await electronAPI.makeRelativePath(
              resolvedPath,
              item.filePath,
            );
          }
        }
      }

      const projectData = createProjectData(
        calculateStartPointHeadings(get(startPointStore), get(linesStore)),
        get(linesStore),
        get(shapesStore),
        sequence,
        get(extraDataStore),
      );
      const jsonString = JSON.stringify(projectData, null, 2);

      await electronAPI.writeFile(resolvedPath, jsonString);
      return;
    }
  }

  downloadTrajectory(
    get(startPointStore),
    get(linesStore),
    get(shapesStore),
    get(sequenceStore),
    get(extraDataStore),
    defaultName,
  );
}

export async function exportAsProjectFile() {
  return exportProjectFileWithExtension(
    DEFAULT_PROJECT_EXTENSION,
    "Export .turt File",
    "Turtle Tracer Project",
    ["turt"],
  );
}

export async function exportAsPP() {
  return exportProjectFileWithExtension(
    LEGACY_PROJECT_EXTENSION,
    "Export .pp File (Legacy)",
    "Turtle Tracer Project (Legacy)",
    ["pp"],
  );
}

export async function handleExternalFileOpen(filePath: string) {
  await performAutoSaveOnClose();

  const electronAPI = getElectronAPI();
  if (!electronAPI?.readFile) return;

  try {
    const content = await electronAPI.readFile(filePath);
    const data = JSON.parse(content);

    const savedDir = await electronAPI.getSavedDirectory?.();
    const fileName =
      filePath.split(/[\\/]/).pop() || `unknown${DEFAULT_PROJECT_EXTENSION}`;

    if (!savedDir) {
      await loadProjectData(data, filePath);
      currentFilePath.set(filePath);
      addToRecentFiles(filePath);
      await triggerAutoExportWithStores(data, filePath);
      return;
    }

    const normFilePath = filePath.replaceAll(`\\`, "/").toLowerCase();
    let normSavedDir = savedDir.replaceAll(`\\`, "/").toLowerCase();
    if (!normSavedDir.endsWith("/")) normSavedDir += "/";

    if (normFilePath.startsWith(normSavedDir)) {
      await loadProjectData(data, filePath);
      currentFilePath.set(filePath);
      addToRecentFiles(filePath);
      await triggerAutoExportWithStores(data, filePath);
    } else if (
      confirm(
        `The file "${fileName}" is not in your configured AutoPaths directory.\nWould you like to copy it there?`,
      )
    ) {
      const separator = savedDir.includes("\\") ? "\\" : "/";
      const cleanSavedDir = savedDir.endsWith(separator)
        ? savedDir.slice(0, -1)
        : savedDir;
      const destPath = cleanSavedDir + separator + fileName;

      if (electronAPI.fileExists && (await electronAPI.fileExists(destPath))) {
        if (
          !confirm(
            `File "${fileName}" already exists in the destination. Overwrite?`,
          )
        ) {
          await loadProjectData(data, filePath);
          currentFilePath.set(filePath);
          addToRecentFiles(filePath);
          return;
        }
      }

      if (electronAPI.copyFile) {
        await electronAPI.copyFile(filePath, destPath);
        await loadProjectData(data, destPath);
        currentFilePath.set(destPath);
        addToRecentFiles(destPath);
        await triggerAutoExportWithStores(data, destPath);
      } else {
        await electronAPI.writeFile(destPath, content);
        await loadProjectData(data, destPath);
        currentFilePath.set(destPath);
        addToRecentFiles(destPath);
        await triggerAutoExportWithStores(data, destPath);
      }
    } else {
      await loadProjectData(data, filePath);
      currentFilePath.set(filePath);
      addToRecentFiles(filePath);
      await triggerAutoExportWithStores(data, filePath);
    }
  } catch (err) {
    console.error("Error handling external file open:", err);
    alert("Failed to load file: " + (err as Error).message);
  }
}

export async function loadFile(evt: Event) {
  await performAutoSaveOnClose();

  const electronAPI = getElectronAPI();
  const elem = evt.target as HTMLInputElement;
  const file = elem.files?.[0];
  if (!file) return;

  if (!isSupportedProjectFileName(file.name)) {
    alert("Please select a .turt or .pp file");
    elem.value = "";
    return;
  }

  const currPath = get(currentFilePath);

  if (electronAPI && currPath) {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        let data;
        try {
          data = JSON.parse(content);
        } catch (parseError) {
          alert("Error parsing file: " + (parseError as Error).message);
          return;
        }
        const currentDir = currPath.slice(
          0,
          Math.max(0, currPath.lastIndexOf("/")),
        );
        const destPath = currentDir + "/" + file.name;

        const exists = await electronAPI.fileExists?.(destPath);
        if (exists) {
          if (
            !confirm(
              `File "${file.name}" already exists in the current directory. Overwrite?`,
            )
          ) {
            await loadProjectData(data);
            return;
          }
        }
        await electronAPI.writeFile(destPath, content);
        await loadProjectData(data, destPath);
        currentFilePath.set(destPath);
        addToRecentFiles(destPath);
        await triggerAutoExportWithStores(data, destPath);
      };
      reader.readAsText(file);
    } catch (error) {
      alert("Error loading file: " + (error as Error).message);
    }
  } else {
    loadTrajectoryFromFile(evt, async (data) => {
      let path = undefined;
      if ((file as any).path) {
        path = (file as any).path;
        addToRecentFiles(path);
        currentFilePath.set(path);
      }
      await loadProjectData(data, path);
      isUnsaved.set(false);
    });
  }
  elem.value = "";
}

export async function handleAutoExport(
  startPoint: Point,
  lines: Line[],
  sequence: SequenceItem[],
  settings: Settings,
  shapes: Shape[],
  projectData: any,
  targetPath: string,
) {
  const electronAPI = getElectronAPI();
  if (!settings.autoExportCode || !electronAPI?.resolvePath) return;

  try {
    const exportDirName = settings.autoExportPath || "GeneratedCode";
    const exportDir = await electronAPI.resolvePath(targetPath, exportDirName);

    if (electronAPI.createDirectory) {
      await electronAPI.createDirectory(exportDir);
    }

    let content = "";
    let extension = "txt";
    const baseName =
      stripProjectExtension(targetPath.split(/[\\/]/).pop() || "") ||
      "AutoPath";

    if (settings.autoExportFormat === "json") {
      content = JSON.stringify(projectData, null, 2);
      extension = "json";
    } else {
      const registry = get(exporterRegistry);
      const exporter = registry[settings.autoExportFormat as string];
      if (exporter) {
        const settingsObj = {
          ...settings,
          fileName: baseName,
          exportFullCode: settings.autoExportFullClass ?? true,
          packageName: settings.javaPackageName,
          telemetryImpl: settings.telemetryImplementation,
          hardcodeValues: settings.autoExportEmbedPoseData,
          targetLibrary: settings.autoExportTargetLibrary ?? "SolversLib",
        };
        content = await exporter.exportCode(
          { startPoint, lines, shapes: projectData.shapes, sequence },
          settingsObj,
        );
        extension = settings.autoExportFormat === "points" ? "txt" : "java";
      } else {
        throw new Error(
          `Auto export format ${settings.autoExportFormat} not found.`,
        );
      }
    }

    const filename = `${baseName}.${extension}`;
    const relativePath = `${exportDirName}/${filename}`;
    const finalPath = await electronAPI.resolvePath(targetPath, relativePath);

    await electronAPI.writeFile(finalPath, content);

    notification.set({
      message: `Code auto-exported to ${filename}`,
      type: "success",
      timeout: 2000,
    });
  } catch (err: any) {
    console.error("Auto Export Failed:", err);
    notification.set({
      message: `Auto Export Failed: ${err.message}`,
      type: "warning",
      timeout: 5000,
    });
  }
}

export { loadProjectData } from "../lib/projectStore";
