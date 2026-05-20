// Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0.
import { get } from "svelte/store";
import { selectedPointId, selectedLineId } from "../../../stores";
import { sequenceStore } from "../../projectStore";
import { actionRegistry } from "../../actionRegistry";

export function isInputFocused(): boolean {
  const el = document.activeElement as HTMLInputElement | null;
  if (!el) return false;
  const tag = el.tagName;

  if (tag === "INPUT") {
    const type = el.type ? el.type.toLowerCase() : "text";
    const nonTextTypes = [
      "checkbox",
      "radio",
      "range",
      "button",
      "submit",
      "reset",
      "color",
      "file",
      "image",
    ];
    if (nonTextTypes.includes(type)) {
      return false;
    }
    return true;
  }

  return ["TEXTAREA", "SELECT"].includes(tag) || (el as any).isContentEditable;
}

export function isUIElementFocused(): boolean {
  return isInputFocused();
}

export function isButtonFocused(): boolean {
  const el = document.activeElement as HTMLInputElement | null;
  if (!el) return false;
  const tag = el.tagName;

  if (tag === "INPUT") {
    const type = el.type ? el.type.toLowerCase() : "text";
    const buttonTypes = [
      "checkbox",
      "radio",
      "range",
      "button",
      "submit",
      "reset",
    ];
    if (buttonTypes.includes(type)) return true;
  }

  const role = el.getAttribute("role");
  const buttonRoles = ["button", "slider", "switch", "checkbox", "radio"];

  return tag === "BUTTON" || (role !== null && buttonRoles.includes(role));
}

export function shouldBlockShortcut(
  e: KeyboardEvent,
  actionId?: string,
): boolean {
  // Whitelist specific actions that should work even when input is focused
  if (
    actionId === "toggle-command-palette" ||
    actionId === "cycle-tabs-next" ||
    actionId === "cycle-tabs-prev" ||
    actionId === "select-code-tab" ||
    actionId === "select-paths-tab" ||
    actionId === "select-field-tab" ||
    actionId === "select-table-tab" ||
    actionId === "save-project" ||
    actionId === "save-file-as" ||
    actionId === "open-settings" ||
    actionId === "toggle-sidebar" ||
    actionId === "zoom-in" ||
    actionId === "zoom-out" ||
    actionId === "zoom-reset" ||
    actionId === "toggle-lock-view" ||
    actionId === "pan-view-up" ||
    actionId === "pan-view-down" ||
    actionId === "pan-view-left" ||
    actionId === "pan-view-right" ||
    actionId === "toggle-lock-field-view" ||
    actionId === "toggle-continuous-validation" ||
    actionId === "new-file" ||
    actionId === "open-file" ||
    actionId === "export-java" ||
    actionId === "export-points" ||
    actionId === "export-sequential" ||
    actionId === "export-pp" ||
    actionId === "export-gif" ||
    actionId === "export-image" ||
    actionId === "download-java" ||
    actionId === "copy-code" ||
    actionId === "copy-table" ||
    actionId === "docs" ||
    actionId === "focus-name" ||
    actionId === "confirm-dialog" ||
    // Allow Undo/Redo even when text inputs are focused so users can undo accidental text deletions
    // or sequence changes without losing form focus.
    actionId === "undo" ||
    actionId === "redo"
  )
    return false;
  if (e.key === "Escape") return false;
  if (isInputFocused()) return true;
  if (isButtonFocused()) {
    // If focused on a button, only block interaction keys (Space, Enter)
    // BUT allow them if modifiers are present (e.g. Shift+Enter)
    if (
      (e.key === " " || e.key === "Enter") &&
      !e.shiftKey &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      return true;
    }
  }
  return false;
}

// Helper: get the sequence index corresponding to the current selection
export function getSelectedSequenceIndex(): number | null {
  const sel = get(selectedPointId);
  const seq = get(sequenceStore);
  if (!sel) return null;

  // Selected item is a wait
  if (sel.startsWith("wait-")) {
    const wid = sel.slice(5);
    const idx = seq.findIndex(
      (s) => actionRegistry.get(s.kind)?.isWait && (s as any).id === wid,
    );
    return idx >= 0 ? idx : null;
  }

  // Selected item is a rotate
  if (sel.startsWith("rotate-")) {
    const rid = sel.slice(7);
    const idx = seq.findIndex(
      (s) => actionRegistry.get(s.kind)?.isRotate && (s as any).id === rid,
    );
    return idx >= 0 ? idx : null;
  }

  // Selected item is a point/control point; map to the selected line id
  if (sel.startsWith("point-")) {
    const targetId = get(selectedLineId) || null;
    if (!targetId) return null;
    const idx = seq.findIndex(
      (s) =>
        actionRegistry.get(s.kind)?.isPath && (s as any).lineId === targetId,
    );
    return idx >= 0 ? idx : null;
  }

  return null;
}
