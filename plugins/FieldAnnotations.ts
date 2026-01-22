/// <reference path="./pedro.d.ts" />

// Plugin: Field Annotations
// Version: 1.0
// Description: Add sticky notes to the field for collaboration and planning.

const NOTE_SIZE_INCHES = 12;

// Helper: Access the store for annotations
function getAnnotations() {
  const store = pedro.stores.project.extraDataStore;
  const data = pedro.stores.get(store);
  return (data.annotations || []);
}

function setAnnotations(list) {
  const store = pedro.stores.project.extraDataStore;
  const data = pedro.stores.get(store);
  store.set({ ...data, annotations: list });
}

// 1. Context Menu: Add Note
pedro.registries.contextMenuItems.register({
  id: "add-annotation",
  label: "Add Sticky Note",
  // Show when clicking on empty space (or rather, when NOT clicking on an existing note)
  condition: (args) => {
    const list = getAnnotations();
    const hit = list.some(note =>
      Math.abs(args.x - note.x) < NOTE_SIZE_INCHES / 2 &&
      Math.abs(args.y - note.y) < NOTE_SIZE_INCHES / 2
    );
    return !hit;
  },
  onClick: (args) => {
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
  }
});

// 2. Context Menu: Delete Note
pedro.registries.contextMenuItems.register({
  id: "delete-annotation",
  label: "Delete Sticky Note",
  condition: (args) => {
    const list = getAnnotations();
    const hit = list.some(note =>
      Math.abs(args.x - note.x) < NOTE_SIZE_INCHES / 2 &&
      Math.abs(args.y - note.y) < NOTE_SIZE_INCHES / 2
    );
    return hit;
  },
  onClick: (args) => {
    const list = getAnnotations();
    const note = list.find(note =>
      Math.abs(args.x - note.x) < NOTE_SIZE_INCHES / 2 &&
      Math.abs(args.y - note.y) < NOTE_SIZE_INCHES / 2
    );

    if (note && confirm(`Delete note "${note.text}"?`)) {
      setAnnotations(list.filter(n => n.id !== note.id));
    }
  }
});

// 3. Render Notes
pedro.registries.fieldRenderers.register({
  id: "annotation-renderer",
  fn: (two) => {
    const list = getAnnotations();
    if (list.length === 0) return;

    const fieldView = pedro.stores.get(pedro.stores.app.fieldViewStore);
    if (!fieldView.xScale || !fieldView.yScale) return;

    const { xScale, yScale } = fieldView;

    // Create a group for all notes to keep things organized
    // Note: two.makeGroup adds it to the scene automatically
    const container = two.makeGroup();

    list.forEach(note => {
        // Calculate screen coordinates
        const cx = xScale(note.x);
        const cy = yScale(note.y);

        // Calculate dimensions in pixels (handling zoom)
        const wPx = Math.abs(xScale(note.x + NOTE_SIZE_INCHES/2) - xScale(note.x - NOTE_SIZE_INCHES/2));
        const hPx = Math.abs(yScale(note.y + NOTE_SIZE_INCHES/2) - yScale(note.y - NOTE_SIZE_INCHES/2));

        // Shadow
        const shadow = two.makeRectangle(cx + 4, cy + 4, wPx, hPx);
        shadow.fill = "rgba(0,0,0,0.2)";
        shadow.noStroke();

        // Background
        const rect = two.makeRectangle(cx, cy, wPx, hPx);
        rect.fill = note.color;
        rect.stroke = "#6b7280"; // gray-500
        rect.linewidth = 1;

        // Text
        const text = two.makeText(note.text, cx, cy);
        text.family = "ui-sans-serif, system-ui, sans-serif";
        // Scale text size roughly with the box
        text.size = wPx / 8;
        text.alignment = "center";
        text.baseline = "middle";
        text.fill = "#1f2937"; // gray-800
        text.weight = "500";

        // Add to container
        container.add(shadow, rect, text);
    });
  }
});
