const fs = require('fs');

const fixConsole = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/it\('handles failed fetch', async \(\) => {/g, "it('handles failed fetch', async () => {\n      const cSpy = vi.spyOn(console, 'error').mockImplementation(() => {});");
  content = content.replace(/expect\(result\.error\)\.toContain\('404'\);\n    }\);/g, "expect(result.error).toContain('404');\n      cSpy.mockRestore();\n    });");

  content = content.replace(/it\('throws on manual failed fetch', async \(\) => {/g, "it('throws on manual failed fetch', async () => {\n      const cSpy = vi.spyOn(console, 'error').mockImplementation(() => {});");
  content = content.replace(/await expect\(updater\.checkForUpdates\(true\)\)\.rejects\.toThrow\('500'\);\n    }\);/g, "await expect(updater.checkForUpdates(true)).rejects.toThrow('500');\n      cSpy.mockRestore();\n    });");

  content = content.replace(/it\('loads skipped versions failure', \(\) => {/g, "it('loads skipped versions failure', () => {\n          const cSpy = vi.spyOn(console, 'error').mockImplementation(() => {});");
  content = content.replace(/expect\(versions\)\.toEqual\(\[\]\);\n      }\);/g, "expect(versions).toEqual([]);\n          cSpy.mockRestore();\n      });");

  content = content.replace(/it\('saves skipped versions failure', \(\) => {/g, "it('saves skipped versions failure', () => {\n          const cSpy = vi.spyOn(console, 'error').mockImplementation(() => {});");
  content = content.replace(/updater\.saveSkippedVersions\(\['1\.1\.0'\]\);\n      }\);/g, "updater.saveSkippedVersions(['1.1.0']);\n          cSpy.mockRestore();\n      });");

  content = content.replace(/it\('handles exception during download', \(\) => {/g, "it('handles exception during download', () => {\n      const cSpy = vi.spyOn(console, 'error').mockImplementation(() => {});");
  content = content.replace(/expect\(shell\.openExternal\)\.toHaveBeenCalledWith\('fallback_url'\);\n    }\);/g, "expect(shell.openExternal).toHaveBeenCalledWith('fallback_url');\n      cSpy.mockRestore();\n    });");

  fs.writeFileSync(file, content);
}

fixConsole('electron/updater.test.js');

const fixConsoleUtils = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/it\('returns false on error', async \(\) => {/g, "it('returns false on error', async () => {\n      const cSpy = vi.spyOn(console, 'error').mockImplementation(() => {});");
  content = content.replace(/expect\(result\)\.toBe\(false\);\n    }\);/g, "expect(result).toBe(false);\n      cSpy.mockRestore();\n    });");
  fs.writeFileSync(file, content);
}

fixConsoleUtils('electron/utils.test.js');
