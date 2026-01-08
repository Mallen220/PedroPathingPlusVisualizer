// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.
import { app, BrowserWindow, ipcMain, dialog, Menu, shell, protocol, net } from "electron";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import fs from "fs/promises";
import AppUpdater from "./updater.js";

// Handle __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Replace single mainWindow with a Set of windows
const windows = new Set();
let appUpdater;

// Track if we've already cleared the default session storage/cache once
let sessionCleared = false;

// Variable to store the pending file path if opened before renderer is ready
let pendingFilePath = null;

// Register custom protocol privileges
protocol.registerSchemesAsPrivileged([
  {
    scheme: "pedro",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

// Handle macOS open-file event (triggered when app is launching or running)
app.on("open-file", (event, path) => {
  event.preventDefault();
  handleOpenedFile(path);
});

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance. Prefer focusing an existing window
    // to avoid racing with the local server or creating orphan windows.
    try {
      const focused = BrowserWindow.getFocusedWindow();
      if (focused) {
        if (focused.isMinimized()) focused.restore();
        focused.focus();
      } else if (windows.size > 0) {
        const arr = Array.from(windows);
        const last = arr[arr.length - 1];
        if (last) {
          if (last.isMinimized()) last.restore();
          last.focus();
        } else {
          createWindow();
        }
      } else {
        createWindow();
      }

      // Check for file arguments in the second instance command line
      // Windows/Linux: The file path is usually the last argument or specifically passed
      const lastArg = commandLine[commandLine.length - 1];
      if (lastArg && lastArg.endsWith(".pp")) {
        handleOpenedFile(lastArg);
      }
    } catch (err) {
      console.error("Error in second-instance handler:", err);
      createWindow();
    }
  });

  // App initialization
  app.on("ready", async () => {
    // Setup protocol handler
    protocol.handle("pedro", (request) => {
      const url = request.url.replace(/^pedro:\/\/app\/?/, "");

      let distPath;
      if (app.isPackaged) {
        distPath = path.join(process.resourcesPath, "app.asar", "dist");
      } else {
        distPath = path.join(__dirname, "../dist");
      }

      // Default to index.html if empty
      const filePath = url ? path.join(distPath, url) : path.join(distPath, "index.html");

      return net.fetch(pathToFileURL(filePath).toString());
    });

    // Check for file arguments on initial launch (Windows/Linux)
    if (process.platform !== "darwin" && process.argv.length >= 2) {
      const lastArg = process.argv[process.argv.length - 1];
      if (lastArg && lastArg.endsWith(".pp")) {
        pendingFilePath = lastArg;
      }
    }

    createWindow();
    createMenu();
    updateDockMenu();
    updateJumpList();

    // Check for updates (only once)
    setTimeout(() => {
      if (windows.size > 0) {
        // Use the first available window
        const firstWindow = windows.values().next().value;
        if (!appUpdater) {
          appUpdater = new AppUpdater(firstWindow);
        }
        appUpdater.checkForUpdates();
      }
    }, 3000);
  });
}

/**
 * Handle a file path opened from OS
 */
function handleOpenedFile(filePath) {
  if (!filePath) return;

  // If we have windows, send to the focused one or the first one
  const win = BrowserWindow.getFocusedWindow() || windows.values().next().value;
  if (win) {
    pendingFilePath = filePath;
    win.webContents.send("open-file-path", filePath);

    // Focus the window
    if (win.isMinimized()) win.restore();
    win.focus();
  } else {
    // No window yet, store it
    pendingFilePath = filePath;
  }
}

const createWindow = async () => {
  let newWindow = new BrowserWindow({
    width: 1360,
    height: 800,
    title: "Pedro Pathing Visualizer",
    webPreferences: {
      nodeIntegration: false, // Security: Sandbox the web code
      contextIsolation: true, // Security: Sandbox the web code
      preload: path.join(__dirname, "preload.js"),
    },
  });

  windows.add(newWindow);

  // Only clear cache/storage once
  if (!sessionCleared) {
    try {
      await newWindow.webContents.session.clearCache();
      await newWindow.webContents.session.clearStorageData();
      sessionCleared = true;
    } catch (err) {
      console.warn("Failed to clear session data for new window:", err);
    }
  }

  // Load the app from the custom protocol
  newWindow.loadURL("pedro://app/index.html");

  // Handle "Save As" dialog native behavior
  newWindow.webContents.session.on(
    "will-download",
    (event, item, webContents) => {
      item.on("updated", (event, state) => {
        if (state === "interrupted") {
          console.log("Download is interrupted but can be resumed");
        }
      });
    },
  );

  newWindow.on("closed", () => {
    windows.delete(newWindow);
    newWindow = null;
  });
};

const updateDockMenu = () => {
  if (process.platform === "darwin") {
    app.dock.setMenu(
      Menu.buildFromTemplate([
        {
          label: "New Window",
          click() {
            createWindow();
          },
        },
      ]),
    );
  }
};

const updateJumpList = () => {
  if (process.platform === "win32") {
    app.setUserTasks([
      {
        program: process.execPath,
        arguments: "", // Just launching again triggers second-instance -> createWindow
        iconPath: process.execPath,
        iconIndex: 0,
        title: "New Window",
        description: "Create a new window",
      },
    ]);
  }
};

// Helper to send menu action to the focused window
const sendToFocusedWindow = (channel, ...args) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.webContents.send(channel, ...args);
  } else {
    if (windows.size === 1) {
      const first = windows.values().next().value;
      if (first) first.webContents.send(channel, ...args);
    }
  }
};

const createMenu = () => {
  const isMac = process.platform === "darwin";

  const template = [
    // App Menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    // File Menu
    {
      label: "File",
      submenu: [
        {
          label: "New Path",
          accelerator: "CmdOrCtrl+N",
          click: () => sendToFocusedWindow("menu-action", "new-path"),
        },
        {
          label: "New Window",
          accelerator: "CmdOrCtrl+Shift+N",
          click: () => createWindow(),
        },
        {
          label: "Open...",
          accelerator: "CmdOrCtrl+O",
          click: () => sendToFocusedWindow("menu-action", "open-file"),
        },
        { type: "separator" },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          click: () => sendToFocusedWindow("menu-action", "save-project"),
        },
        {
          label: "Save As...",
          accelerator: "CmdOrCtrl+Shift+S",
          click: () => sendToFocusedWindow("menu-action", "save-as"),
        },
        { type: "separator" },
        {
          label: "Export",
          submenu: [
            {
              label: "Export as Java Code...",
              click: () => sendToFocusedWindow("menu-action", "export-java"),
            },
            {
              label: "Export as Points Array...",
              click: () => sendToFocusedWindow("menu-action", "export-points"),
            },
            {
              label: "Export as Sequential Command...",
              click: () =>
                sendToFocusedWindow("menu-action", "export-sequential"),
            },
            {
              label: "Export as .pp File...",
              click: () => sendToFocusedWindow("menu-action", "export-pp"),
            },
            { type: "separator" },
            {
              label: "Export GIF...",
              click: () => sendToFocusedWindow("menu-action", "export-gif"),
            },
          ],
        },
        { type: "separator" },
        { role: isMac ? "close" : "quit" },
      ],
    },
    // Edit Menu
    {
      label: "Edit",
      submenu: [
        {
          label: "Undo",
          accelerator: "CmdOrCtrl+Z",
          click: () => sendToFocusedWindow("menu-action", "undo"),
        },
        {
          label: "Redo",
          accelerator: "CmdOrCtrl+Y", // or Cmd+Shift+Z depending on OS preference, but Y is common
          click: () => sendToFocusedWindow("menu-action", "redo"),
        },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    // View Menu
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { type: "separator" },
        { role: "togglefullscreen" },
        { type: "separator" },
        {
          label: "Settings",
          accelerator: "CmdOrCtrl+,",
          click: () => sendToFocusedWindow("menu-action", "open-settings"),
        },
      ],
    },
    // Window Menu
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [
              { type: "separator" },
              { role: "front" },
              { type: "separator" },
              { role: "window" },
            ]
          : [{ role: "close" }]),
      ],
    },
    // Help Menu
    {
      role: "help",
      submenu: [
        {
          label: "Keyboard Shortcuts",
          accelerator: "CmdOrCtrl+/",
          click: () => sendToFocusedWindow("menu-action", "open-shortcuts"),
        },
        { type: "separator" },
        {
          label: "See Project on GitHub",
          click: async () => {
            await shell.openExternal(
              "https://github.com/Mallen220/PedroPathingVisualizer",
            );
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// CRITICAL: Satisfies "when the project closes it should auto close"
app.on("window-all-closed", () => {
  app.quit();
});

// Add these functions at the top, after the imports
const getDirectorySettingsPath = () => {
  return path.join(app.getPath("userData"), "directory-settings.json");
};

const loadDirectorySettings = async () => {
  const settingsPath = getDirectorySettingsPath();
  try {
    const data = await fs.readFile(settingsPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // Return default settings if file doesn't exist
    return { autoPathsDirectory: "" };
  }
};

const saveDirectorySettings = async (settings) => {
  const settingsPath = getDirectorySettingsPath();
  try {
    await fs.writeFile(
      settingsPath,
      JSON.stringify(settings, null, 2),
      "utf-8",
    );
    return true;
  } catch (error) {
    console.error("Error saving directory settings:", error);
    return false;
  }
};

// IPC Handlers

// Add handler for renderer ready signal
ipcMain.handle("renderer-ready", async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (pendingFilePath) {
    win.webContents.send("open-file-path", pendingFilePath);
    pendingFilePath = null;
  }
  return true;
});

// Add handler for file copy
ipcMain.handle("file:copy", async (event, srcPath, destPath) => {
  try {
    // Check if new path already exists
    // (Using fs.copyFile triggers overwrite by default, so we might want to check existence if we want to prompt,
    // but the prompt logic is likely in the renderer. The renderer asks user, then calls this.)

    await fs.copyFile(srcPath, destPath);
    return true;
  } catch (error) {
    console.error("Error copying file:", error);
    throw error;
  }
});

// Update the existing ipcMain.handle for "file:get-directory"
ipcMain.handle("file:get-directory", async () => {
  // Load saved directory settings
  const settings = await loadDirectorySettings();

  // If we have a saved directory, use it
  if (
    settings.autoPathsDirectory &&
    settings.autoPathsDirectory.trim() !== ""
  ) {
    try {
      await fs.access(settings.autoPathsDirectory);
      return settings.autoPathsDirectory;
    } catch (error) {
      console.log(
        "Saved directory no longer accessible, falling back to default",
      );
    }
  }

  // Fallback to default directory
  const defaultDir = path.join(
    process.env.HOME,
    "Documents",
    "GitHub",
    "BBots2025-26",
    "TeamCode",
    "src",
    "main",
    "assets",
    "AutoPaths",
  );

  try {
    await fs.access(defaultDir);
    return defaultDir;
  } catch {
    // Create directory if it doesn't exist
    await fs.mkdir(defaultDir, { recursive: true });
    return defaultDir;
  }
});

// Update the existing ipcMain.handle for "file:set-directory"
ipcMain.handle("file:set-directory", async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win, {
    properties: ["openDirectory"],
    title: "Select AutoPaths Directory",
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedDir = result.filePaths[0];

    // Save the directory to settings
    const settings = await loadDirectorySettings();
    settings.autoPathsDirectory = selectedDir;
    await saveDirectorySettings(settings);

    return selectedDir;
  }
  return null;
});

// Add new IPC handlers for directory settings
ipcMain.handle("directory:get-settings", async () => {
  return await loadDirectorySettings();
});

ipcMain.handle("directory:save-settings", async (event, settings) => {
  return await saveDirectorySettings(settings);
});

// Add a handler to get the saved directory directly
ipcMain.handle("directory:get-saved-directory", async () => {
  const settings = await loadDirectorySettings();
  return settings.autoPathsDirectory || "";
});

// Add to existing IPC handlers
ipcMain.handle("file:create-directory", async (event, dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return true;
  } catch (error) {
    console.error("Error creating directory:", error);
    throw error;
  }
});

ipcMain.handle("file:get-directory-stats", async (event, dirPath) => {
  // Validate input
  if (!dirPath || typeof dirPath !== "string" || dirPath.trim() === "") {
    console.warn(
      "file:get-directory-stats called with empty or invalid dirPath:",
      JSON.stringify(dirPath),
    );
    return {
      totalFiles: 0,
      totalSize: 0,
      lastModified: new Date(0),
    };
  }

  try {
    // Ensure directory exists and is accessible
    await fs.access(dirPath);
  } catch (err) {
    console.warn(
      "Directory not accessible in file:get-directory-stats:",
      dirPath,
      err && err.code,
    );
    return {
      totalFiles: 0,
      totalSize: 0,
      lastModified: new Date(0),
    };
  }

  try {
    const files = await fs.readdir(dirPath);
    const ppFiles = files.filter((file) => file.endsWith(".pp"));

    let totalSize = 0;
    let latestModified = new Date(0);

    for (const file of ppFiles) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
      if (stats.mtime > latestModified) {
        latestModified = stats.mtime;
      }
    }

    return {
      totalFiles: ppFiles.length,
      totalSize,
      lastModified: latestModified,
    };
  } catch (error) {
    console.error("Error getting directory stats for path", dirPath, error);
    return {
      totalFiles: 0,
      totalSize: 0,
      lastModified: new Date(0),
    };
  }
});

ipcMain.handle("app:get-app-data-path", () => {
  return app.getPath("userData");
});

ipcMain.handle("app:get-version", () => {
  return app.getVersion();
});

// Add to existing IPC handlers
ipcMain.handle("file:rename", async (event, oldPath, newPath) => {
  try {
    // Check if new path already exists
    const exists = await fs
      .access(newPath)
      .then(() => true)
      .catch(() => false);
    if (exists) {
      throw new Error(`File "${path.basename(newPath)}" already exists`);
    }

    await fs.rename(oldPath, newPath);
    return { success: true, newPath };
  } catch (error) {
    console.error("Error renaming file:", error);
    throw error;
  }
});

ipcMain.handle("file:list", async (event, directory) => {
  // Validate input
  if (!directory || typeof directory !== "string" || directory.trim() === "") {
    console.warn(
      "file:list called with empty or invalid directory:",
      JSON.stringify(directory),
    );
    return [];
  }

  try {
    // Ensure directory exists
    await fs.access(directory);
  } catch (err) {
    console.warn(
      "Directory not accessible in file:list:",
      directory,
      err && err.code,
    );
    return [];
  }

  try {
    const files = await fs.readdir(directory);
    const ppFiles = files.filter((file) => file.endsWith(".pp"));

    const fileDetails = await Promise.all(
      ppFiles.map(async (file) => {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          modified: stats.mtime,
        };
      }),
    );

    return fileDetails;
  } catch (error) {
    console.error("Error reading directory:", directory, error);
    return [];
  }
});

ipcMain.handle("file:read", async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error("Error reading file:", error);
    throw error;
  }
});

ipcMain.handle("file:write", async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing file:", error);
    throw error;
  }
});

// Save dialog (returns file path or null if cancelled)
ipcMain.handle("file:show-save-dialog", async (event, options) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showSaveDialog(win, options || {});
    if (result.canceled) return null;
    return result.filePath;
  } catch (error) {
    console.error("Error showing save dialog:", error);
    throw error;
  }
});

// Write base64-encoded content to disk (binary)
ipcMain.handle("file:write-base64", async (event, filePath, base64Content) => {
  try {
    const buffer = Buffer.from(base64Content, "base64");
    await fs.writeFile(filePath, buffer);
    return true;
  } catch (error) {
    console.error("Error writing base64 file:", error);
    throw error;
  }
});

// Export a .pp file using native save dialog and write via main process
ipcMain.handle(
  "export:pp",
  async (event, { content, defaultName = "trajectory.pp" } = {}) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      const options = {
        title: "Export .pp File",
        defaultPath:
          defaultName && defaultName.endsWith(".pp")
            ? defaultName
            : `${defaultName}.pp`,
        filters: [{ name: "Pedro Path", extensions: ["pp"] }],
      };
      const result = await dialog.showSaveDialog(win, options);
      if (result.canceled || !result.filePath) return null;
      await fs.writeFile(result.filePath, content, "utf-8");
      return result.filePath;
    } catch (error) {
      console.error("Error exporting .pp file:", error);
      throw error;
    }
  },
);
ipcMain.handle("file:delete", async (event, filePath) => {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
});

ipcMain.handle("file:exists", async (event, filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
});
