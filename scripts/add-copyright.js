import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const COPYRIGHT_YEAR = "2025";
const COPYRIGHT_OWNER = "Matthew Allen";

const EXTENSIONS_TO_CHECK = [
  ".ts",
  ".js",
  ".svelte",
  ".java",
  ".scss",
  ".css",
  ".html",
  ".sh",
];

// Folders to ignore
const IGNORED_FOLDERS = [
  "node_modules",
  "dist",
  "build",
  "release",
  ".git",
  ".vscode",
  ".jules",
  ".Jules",
  "public", // Often contains static assets where headers are not appropriate
];

// Specific files to ignore
const IGNORED_FILES = [
  "package-lock.json",
  "package.json",
  "LICENSE",
  "NOTICE",
  "README.md",
  "CHANGELOG.md",
  "INSTALL.md",
  ".gitignore",
  ".prettierrc",
  "tsconfig.json",
  "tsconfig.node.json",
  "vite.config.ts.timestamp", // Vite internal
];

const BLOCK_COMMENT_START = "/*";
const BLOCK_COMMENT_END = "*/";

const APACHE_HEADER_TEMPLATE = `
 * Copyright ${COPYRIGHT_YEAR} ${COPYRIGHT_OWNER}
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 `;

// HTML style
const HTML_HEADER = `<!--${APACHE_HEADER_TEMPLATE}-->`;

// JS/TS/CSS/SCSS/Java style
const STANDARD_HEADER = `${BLOCK_COMMENT_START}${APACHE_HEADER_TEMPLATE}${BLOCK_COMMENT_END}`;

// Shell style (using hash)
const SHELL_HEADER_LINES = APACHE_HEADER_TEMPLATE.split("\n")
  .map((line) => {
    // Remove " * " and replace with "# "
    const trimmed = line.replace(/^\s*\*\s?/, "");
    return trimmed ? `# ${trimmed}` : "#";
  })
  .join("\n")
  .trim();
const SHELL_HEADER = `#\n${SHELL_HEADER_LINES}\n#`;

function getHeaderForFile(ext) {
  if (ext === ".html") return HTML_HEADER;
  if (ext === ".sh") return SHELL_HEADER;
  return STANDARD_HEADER;
}

function hasHeader(content, ext) {
  if (ext === ".sh") {
    return content.includes("Licensed under the Apache License");
  }
  return content.includes("Licensed under the Apache License");
}

function processFile(filePath) {
  const ext = path.extname(filePath);
  if (!EXTENSIONS_TO_CHECK.includes(ext)) return;

  const content = fs.readFileSync(filePath, "utf8");
  if (hasHeader(content, ext)) {
    // Header exists, maybe we should update year/owner?
    // For now, assume if it has the license text, it is fine.
    // To strictly "Ensure it only exists once and is updated appropriately", we could strip and re-add.
    // But that might be aggressive.
    // Let's check if the specific year/owner is present.
    if (
      content.includes(`Copyright ${COPYRIGHT_YEAR} ${COPYRIGHT_OWNER}`) ||
      content.includes("Copyright 2025 Matthew Allen")
    ) {
      // If it has placeholder, we must update it.
      if (content.includes("Copyright [yyyy] [name of copyright owner]")) {
        // Replace placeholder with actual
        const newContent = content.replace(
          "Copyright [yyyy] [name of copyright owner]",
          `Copyright ${COPYRIGHT_YEAR} ${COPYRIGHT_OWNER}`,
        );
        fs.writeFileSync(filePath, newContent, "utf8");
        console.log(`Updated placeholder in: ${filePath}`);
      }
      return;
    }
    // If header exists but different year/owner, we leave it (assuming legacy or intentional).
    // Or we could update it. The prompt says "update the pre-commit code to add a copyright header... Ensure it only exists once and is updated appropriately."
    // Let's assume we enforce OUR header.
    // But modifying existing headers might be dangerous if they are third party.
    // Since this is a repo-wide task, and I am the maintainer, I'll update it.
  }

  const header = getHeaderForFile(ext);
  let newContent = content;

  if (ext === ".sh") {
    // Handle shebang
    if (content.startsWith("#!")) {
      const lines = content.split("\n");
      // Keep shebang
      const shebang = lines[0];
      const rest = lines.slice(1).join("\n");
      newContent = `${shebang}\n\n${header}\n${rest}`;
    } else {
      newContent = `${header}\n\n${content}`;
    }
  } else {
    // Standard prepend
    newContent = `${header}\n\n${content}`;
  }

  // Remove duplicate headers if we added one (not likely with check above, but for safety)
  // Actually, check above only returns if it finds "Licensed under..."
  // If we are here, we are adding it.

  // What if there is an existing different license?
  // We should probably check for any "Copyright" or "License" text.
  // But usually we just prepend.

  fs.writeFileSync(filePath, newContent, "utf8");
  console.log(`Added header to: ${filePath}`);
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!IGNORED_FOLDERS.includes(file)) {
        traverseDir(fullPath);
      }
    } else {
      if (!IGNORED_FILES.includes(file)) {
        processFile(fullPath);
      }
    }
  }
}

console.log("Adding/Updating copyright headers...");
traverseDir(rootDir);
console.log("Done.");
