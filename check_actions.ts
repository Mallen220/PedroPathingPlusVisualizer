import { DEFAULT_KEY_BINDINGS } from './src/config/keybindings';
import fs from 'fs';

const shortcutsFile = fs.readFileSync('src/lib/components/KeyboardShortcuts.svelte', 'utf-8');

// Extract keys from actions object
const actionsRegex = /$: actions = \{([\s\S]*?)\};/;
const match = shortcutsFile.match(actionsRegex);

if (match) {
    const actionsBlock = match[1];
    const definedActions = new Set();
    const lines = actionsBlock.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.includes(':')) {
            const actionName = trimmed.split(':')[0].trim();
            definedActions.add(actionName);
        }
    }

    // Check for missing actions
    const missingActions = [];
    for (const binding of DEFAULT_KEY_BINDINGS) {
        if (!definedActions.has(binding.action)) {
            missingActions.push(binding);
        }
    }

    if (missingActions.length > 0) {
        console.log("Missing actions:", missingActions.map(b => b.action));
    } else {
        console.log("All actions in DEFAULT_KEY_BINDINGS are defined in KeyboardShortcuts.svelte");
    }
} else {
    console.error("Could not find actions object in KeyboardShortcuts.svelte");
}
