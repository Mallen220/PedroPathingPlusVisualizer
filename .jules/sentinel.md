## 2026-02-04 - Unvalidated Electron IPC URL Opening
**Vulnerability:** The `app:open-external` IPC handler blindly passed user-provided URLs to `shell.openExternal`, allowing execution of arbitrary protocols (e.g., `file://`, `javascript:`).
**Learning:** IPC handlers acting as bridges to powerful native APIs often lack sufficient validation of the payload, assuming trust in the renderer process which can be compromised or buggy.
**Prevention:** Always validate inputs in the Main process before passing them to sensitive APIs like `shell.openExternal`, specifically whitelisting allowed protocols (`http:`, `https:`).
