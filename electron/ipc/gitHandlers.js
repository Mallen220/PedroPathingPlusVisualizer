// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import { ipcMain } from "electron";
import path from "path";
import fs from "fs";
import os from "os";
import simpleGit from "simple-git";

// Helper to recursively find files with extensions
async function findProjectFiles(dir) {
  let results = [];
  const list = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const dirent of list) {
    if (dirent.name === ".git") continue;
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      results = results.concat(await findProjectFiles(res));
    } else if (res.endsWith(".turt") || res.endsWith(".pp")) {
      results.push(res);
    }
  }
  return results;
}

export function registerGitHandlers() {
  ipcMain.handle("git:show", async (event, filePath) => {
    try {
      const git = simpleGit(path.dirname(filePath));
      const isRepo = await git.checkIsRepo();
      if (!isRepo) return null;

      const root = await git.revparse(["--show-toplevel"]);
      const relativePath = path
        .relative(root.trim(), filePath)
        .replace(/\\/g, "/");
      const content = await git.show([`HEAD:${relativePath}`]);
      return content;
    } catch (error) {
      console.warn("Error running git show:", error);
      return null;
    }
  });

  ipcMain.handle("git:status", async (event, directory) => {
    if (
      !directory ||
      typeof directory !== "string" ||
      directory.trim() === ""
    ) {
      return {};
    }
    let gitStatuses = {};
    try {
      const git = simpleGit(directory);
      if (await git.checkIsRepo()) {
        const status = await git.status();
        const rootDir = await git.revparse(["--show-toplevel"]);

        status.files.forEach((fileStatus) => {
          const absPath = path.resolve(rootDir.trim(), fileStatus.path);
          let statusStr = "clean";

          if (fileStatus.working_dir === "?" || fileStatus.working_dir === "U")
            statusStr = "untracked";
          else if (
            fileStatus.working_dir !== " " &&
            fileStatus.working_dir !== "?"
          )
            statusStr = "modified";
          else if (fileStatus.index !== " " && fileStatus.index !== "?")
            statusStr = "staged";

          gitStatuses[absPath] = statusStr;
        });
      }
    } catch (e) {
      console.warn("Error checking git status:", e);
    }
    return gitStatuses;
  });

  ipcMain.handle("git:list-github-folders", async (event, repoUrl) => {
    let tmpDir = null;
    try {
      // nosemgrep: codacy.tools-configs.javascript_pathtraversal_rule-non-literal-fs-filename
      tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "turtle-tracer-git-"));
      const git = simpleGit(tmpDir);

      // Clone the repo deeply, then we can look at it
      await git.clone(repoUrl, tmpDir);

      const projectFiles = await findProjectFiles(tmpDir);

      // Find all directories that contain at least one project file
      const folders = new Set();
      for (const file of projectFiles) {
        folders.add(path.dirname(file));
      }

      // Convert to paths relative to the temp directory root
      const relativeFolders = Array.from(folders).map(folder => {
        let rel = path.relative(tmpDir, folder).replace(/\\/g, "/");
        if (rel === "") rel = "/";
        return rel;
      });

      // Sort alphabetically, with root ("/") at the top
      relativeFolders.sort((a, b) => {
        if (a === "/") return -1;
        if (b === "/") return 1;
        return a.localeCompare(b);
      });

      return { success: true, folders: relativeFolders };
    } catch (e) {
      console.error("Error cloning github repo:", e);
      return { success: false, error: e.message };
    } finally {
      if (tmpDir) {
        try {
          // nosemgrep: codacy.tools-configs.javascript_pathtraversal_rule-non-literal-fs-filename
          await fs.promises.rm(tmpDir, { recursive: true, force: true });
        } catch (rmErr) {
          console.warn("Failed to clean up temp directory:", rmErr);
        }
      }
    }
  });

  ipcMain.handle(
    "git:pull-from-github",
    async (event, repoUrl, targetDir, baseRepoPath) => {
      let tmpDir = null;
      try {
        // nosemgrep: codacy.tools-configs.javascript_pathtraversal_rule-non-literal-fs-filename
        tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "turtle-tracer-git-"));
        const git = simpleGit(tmpDir);

        await git.clone(repoUrl, tmpDir);

        // Calculate absolute source directory
        const sourceDir = baseRepoPath === "/" ? tmpDir : path.join(tmpDir, baseRepoPath);

        const projectFiles = await findProjectFiles(sourceDir);

        // Copy files over
        for (const file of projectFiles) {
          const relativePath = path.relative(sourceDir, file);
          const destPath = path.join(targetDir, relativePath);
          const destDir = path.dirname(destPath);

          // Ensure directory exists
          // nosemgrep: codacy.tools-configs.javascript_pathtraversal_rule-non-literal-fs-filename
          await fs.promises.mkdir(destDir, { recursive: true });

          // Copy file
          // nosemgrep: codacy.tools-configs.javascript_pathtraversal_rule-non-literal-fs-filename
          await fs.promises.copyFile(file, destPath);
        }

        return { success: true };
      } catch (e) {
        console.error("Error pulling github repo:", e);
        return { success: false, error: e.message };
      } finally {
        if (tmpDir) {
          try {
            // nosemgrep: codacy.tools-configs.javascript_pathtraversal_rule-non-literal-fs-filename
            await fs.promises.rm(tmpDir, { recursive: true, force: true });
          } catch (rmErr) {
            console.warn("Failed to clean up temp directory:", rmErr);
          }
        }
      }
    },
  );
}
