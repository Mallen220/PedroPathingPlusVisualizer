/// <reference path="./pedro.d.ts" />

// Plugin: Field Annotations
// Version: 1.1
// Description: Add sticky notes to the field for collaboration and planning.

console.log("[FieldAnnotations] Plugin loading...");

const NOTE_SIZE_INCHES = 12;

// Helper: Access the store for annotations
function getAnnotations() {
  try {
    const store = pedro.stores.project.extraDataStore;
    const data = pedro.stores.get(store);
    return (data && data.annotations) ? data.annotations : [];
  } catch (e) {
    console.error("[FieldAnnotations] getAnnotations failed:", e);
    return [];
  }
}

function setAnnotations(list) {
  try {
    const store = pedro.stores.project.extraDataStore;
    const data = pedro.stores.get(store);
    store.set({ ...data, annotations: list });
  } catch (e) {
    console.error("[FieldAnnotations] setAnnotations failed:", e);
  }
}

// 1. Context Menu: Add Note
pedro.registries.contextMenuItems.register({
  id: "add-annotation",
  label: "Add Sticky Note",
  condition: (args) => {
    try {
        const list = getAnnotations();
        // If we click on an existing note, don't show "Add Note"
        const hit = list.some(note =>
        Math.abs(args.x - note.x) < NOTE_SIZE_INCHES / 2 &&
        Math.abs(args.y - note.y) < NOTE_SIZE_INCHES / 2
        );
        return !hit;
    } catch (e) {
        console.error("[FieldAnnotations] condition failed:", e);
        return true; // Fallback to showing it
    }
  },
  onClick: (args) => {
    try {
        const text = prompt("Enter note text:");
        if (!text) return;

        const colors = ["#fef08a", "#bae6fd", "#bbf7d0", "#fbcfe8", "#e9d5ff"];
        const color = colors[Math.floor(Math.random() * colors.length)];

        const newNote = {
        id: Math.random().toString(36).substring(2, 10),
        x: args.x,
        y: args.y,
        text: text,
        color: color
        };

        const list = getAnnotations();
        setAnnotations([...list, newNote]);
    } catch (e) {
        console.error("[FieldAnnotations] Add Note failed:", e);
    }
  }
});

// 2. Context Menu: Delete Note
pedro.registries.contextMenuItems.register({
  id: "delete-annotation",
  label: "Delete Sticky Note",
  condition: (args) => {
    try {
        const list = getAnnotations();
        const hit = list.some(note =>
        Math.abs(args.x - note.x) < NOTE_SIZE_INCHES / 2 &&
        Math.abs(args.y - note.y) < NOTE_SIZE_INCHES / 2
        );
        return hit;
    } catch (e) {
        console.error("[FieldAnnotations] delete condition failed:", e);
        return false;
    }
  },
  onClick: (args) => {
    try {
        const list = getAnnotations();
        const note = list.find(note =>
        Math.abs(args.x - note.x) < NOTE_SIZE_INCHES / 2 &&
        Math.abs(args.y - note.y) < NOTE_SIZE_INCHES / 2
        );

        if (note && confirm(`Delete note "${note.text}"?`)) {
        setAnnotations(list.filter(n => n.id !== note.id));
        }
    } catch (e) {
        console.error("[FieldAnnotations] Delete Note failed:", e);
    }
  }
});

// Debug Item (Always Visible)
pedro.registries.contextMenuItems.register({
  id: "debug-annotation-check",
  label: "Field Annotations Active",
  condition: () => false, // Hidden by default, enable if needed for debugging by changing to true
  onClick: () => {
    alert("Plugin is active! Annotations: " + getAnnotations().length);
  }
});

// 3. Render Notes
pedro.registries.fieldRenderers.register({
  id: "annotation-renderer",
  fn: (two) => {
    try {
        const list = getAnnotations();
        if (list.length === 0) return;

        const fieldView = pedro.stores.get(pedro.stores.app.fieldViewStore);
        if (!fieldView || !fieldView.xScale || !fieldView.yScale) return;

        const { xScale, yScale } = fieldView;

        const container = two.makeGroup();

        list.forEach(note => {
            const cx = xScale(note.x);
            const cy = yScale(note.y);

            // Safety check for NaN
            if (isNaN(cx) || isNaN(cy)) return;

            const wPx = Math.abs(xScale(note.x + NOTE_SIZE_INCHES/2) - xScale(note.x - NOTE_SIZE_INCHES/2));
            const hPx = Math.abs(yScale(note.y + NOTE_SIZE_INCHES/2) - yScale(note.y - NOTE_SIZE_INCHES/2));

            const shadow = two.makeRectangle(cx + 4, cy + 4, wPx, hPx);
            shadow.fill = "rgba(0,0,0,0.2)";
            shadow.noStroke();

            const rect = two.makeRectangle(cx, cy, wPx, hPx);
            rect.fill = note.color;
            rect.stroke = "#6b7280";
            rect.linewidth = 1;

            const text = two.makeText(note.text, cx, cy);
            text.family = "ui-sans-serif, system-ui, sans-serif";
            text.size = wPx / 8;
            text.alignment = "center";
            text.baseline = "middle";
            text.fill = "#1f2937";
            text.weight = "500";

            container.add(shadow, rect, text);
        });
    } catch (e) {
        console.error("[FieldAnnotations] Renderer failed:", e);
    }
  }
});

console.log("[FieldAnnotations] Plugin loaded successfully.");
