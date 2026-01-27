import { describe, it, expect } from "vitest";
import { parseShortcut, getShortcutFromSettings } from "../utils/shortcutFormatter";

describe("shortcutFormatter", () => {
    it("parses single keys correctly", () => {
        expect(parseShortcut("s")).toEqual(["S"]);
        expect(parseShortcut("S")).toEqual(["S"]);
        expect(parseShortcut("enter")).toEqual(["Enter"]);
    });

    it("parses modifier combinations correctly", () => {
        const res = parseShortcut("ctrl+s");
        expect(res.length).toBe(2);
        // We know it should contain 'S' at the end
        expect(res[res.length-1]).toBe("S");
    });

    it("handles multiple keys (comma separated) by picking best match", () => {
        const res = parseShortcut("ctrl+s, cmd+s");
        // On any platform, it should be parsed to something valid.
        expect(res.length).toBe(2);
        expect(res[1]).toBe("S");
    });

    it("handles empty input", () => {
        expect(parseShortcut("")).toEqual([]);
    });

    it("getShortcutFromSettings returns formatted string", () => {
        const settings = {
            keyBindings: [
                { id: "test-action", key: "ctrl+s", description: "Save", category: "File", action: "save" }
            ]
        };
        // @ts-ignore
        const shortcut = getShortcutFromSettings(settings, "test-action");
        expect(shortcut).toContain("S");
        expect(shortcut.startsWith(" (")).toBe(true);
        expect(shortcut.endsWith(")")).toBe(true);
    });
});
