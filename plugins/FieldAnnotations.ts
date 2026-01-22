/// <reference path="./pedro.d.ts" />

// Plugin: Field Annotations
// Version: 1.3
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

// Custom prompt implementation since window.prompt is disabled
function requestNoteText(callback) {
    // Check if dialog already exists
    if (document.getElementById('annotation-prompt')) return;

    const overlay = document.createElement('div');
    overlay.id = 'annotation-prompt';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    const dialog = document.createElement('div');
    dialog.style.backgroundColor = '#1f2937'; // gray-800
    dialog.style.padding = '1.5rem';
    dialog.style.borderRadius = '0.75rem';
    dialog.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
    dialog.style.width = '100%';
    dialog.style.maxWidth = '24rem';
    dialog.style.color = 'white';

    const title = document.createElement('h3');
    title.textContent = 'Add Sticky Note';
    title.style.fontSize = '1.125rem';
    title.style.fontWeight = '600';
    title.style.marginBottom = '1rem';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter note text...';
    input.style.width = '100%';
    input.style.padding = '0.5rem';
    input.style.marginBottom = '1.5rem';
    input.style.borderRadius = '0.375rem';
    input.style.backgroundColor = '#374151'; // gray-700
    input.style.border = '1px solid #4b5563'; // gray-600
    input.style.color = 'white';
    input.style.outline = 'none';

    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.justifyContent = 'flex-end';
    btnContainer.style.gap = '0.75rem';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.padding = '0.5rem 1rem';
    cancelBtn.style.borderRadius = '0.375rem';
    cancelBtn.style.color = '#d1d5db'; // gray-300
    cancelBtn.style.backgroundColor = 'transparent';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.onmouseover = () => cancelBtn.style.color = 'white';
    cancelBtn.onmouseout = () => cancelBtn.style.color = '#d1d5db';

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Add Note';
    confirmBtn.style.padding = '0.5rem 1rem';
    confirmBtn.style.borderRadius = '0.375rem';
    confirmBtn.style.backgroundColor = '#8b5cf6'; // violet-500
    confirmBtn.style.color = 'white';
    confirmBtn.style.fontWeight = '500';
    confirmBtn.style.cursor = 'pointer';
    confirmBtn.onmouseover = () => confirmBtn.style.backgroundColor = '#7c3aed'; // violet-600
    confirmBtn.onmouseout = () => confirmBtn.style.backgroundColor = '#8b5cf6';

    const close = () => document.body.removeChild(overlay);

    cancelBtn.onclick = close;
    confirmBtn.onclick = () => {
        const text = input.value.trim();
        if (text) {
            callback(text);
        }
        close();
    };

    input.onkeydown = (e) => {
        if (e.key === 'Enter') confirmBtn.click();
        if (e.key === 'Escape') close();
    };

    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(confirmBtn);
    dialog.appendChild(title);
    dialog.appendChild(input);
    dialog.appendChild(btnContainer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    setTimeout(() => input.focus(), 50);
}

function addNote(x, y) {
    try {
        requestNoteText((text) => {
            const colors = ["#fef08a", "#bae6fd", "#bbf7d0", "#fbcfe8", "#e9d5ff"];
            const color = colors[Math.floor(Math.random() * colors.length)];

            const newNote = {
            id: Math.random().toString(36).substring(2, 10),
            x: x,
            y: y,
            text: text,
            color: color
            };

            const list = getAnnotations();
            setAnnotations([...list, newNote]);
        });
    } catch (e) {
        console.error("[FieldAnnotations] Add Note failed:", e);
    }
}

// 1. Context Menu: Add Note (Alternative)
pedro.registries.contextMenuItems.register({
  id: "add-annotation",
  label: "Add Sticky Note",
  condition: (args) => {
    try {
        const list = getAnnotations();
        const hit = list.some(note =>
            Math.abs(args.x - note.x) < NOTE_SIZE_INCHES / 2 &&
            Math.abs(args.y - note.y) < NOTE_SIZE_INCHES / 2
        );
        return !hit;
    } catch (e) {
        console.error("[FieldAnnotations] condition failed:", e);
        return true;
    }
  },
  onClick: (args) => {
    addNote(args.x, args.y);
  }
});

// 2. Navbar Action: Add Note
pedro.registries.navbarActions.register({
    id: "add-annotation-btn",
    title: "Add Note",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
</svg>
`,
    location: "center",
    order: 10,
    onClick: () => {
        // Calculate center of view
        try {
            const fieldView = pedro.stores.get(pedro.stores.app.fieldViewStore);
            if (fieldView && fieldView.xScale && fieldView.xScale.invert) {
                const width = fieldView.width || 800;
                const height = fieldView.height || 600;

                const cx = width / 2;
                const cy = height / 2;

                const fx = fieldView.xScale.invert(cx);
                const fy = fieldView.yScale.invert(cy);

                const clampedX = Math.max(0, Math.min(144, fx));
                const clampedY = Math.max(0, Math.min(144, fy));

                addNote(clampedX, clampedY);
            } else {
                addNote(72, 72);
            }
        } catch(e) {
            console.error("Error calculating center:", e);
            addNote(72, 72);
        }
    }
});

// 3. Context Menu: Delete Note
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

        // Replace confirm with custom dialog or assume intention for now
        // Or implement a simple Confirm dialog similar to requestNoteText
        // For simplicity, let's just delete or use a safer non-blocking confirm if possible
        // But since prompt is blocked, confirm likely is too.
        // Let's implement a quick confirm dialog

        if (note) {
             const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.inset = '0';
            overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
            overlay.style.zIndex = '9999';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';

            const dialog = document.createElement('div');
            dialog.style.backgroundColor = '#1f2937';
            dialog.style.padding = '1.5rem';
            dialog.style.borderRadius = '0.75rem';
            dialog.style.color = 'white';
            dialog.style.maxWidth = '20rem';

            const msg = document.createElement('p');
            msg.textContent = `Delete note "${note.text}"?`;
            msg.style.marginBottom = '1.5rem';

            const btnContainer = document.createElement('div');
            btnContainer.style.display = 'flex';
            btnContainer.style.justifyContent = 'flex-end';
            btnContainer.style.gap = '0.75rem';

            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.style.padding = '0.5rem 1rem';
            cancelBtn.style.borderRadius = '0.375rem';
            cancelBtn.style.color = '#d1d5db';
            cancelBtn.style.backgroundColor = 'transparent';
            cancelBtn.onclick = () => document.body.removeChild(overlay);

            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = 'Delete';
            confirmBtn.style.padding = '0.5rem 1rem';
            confirmBtn.style.borderRadius = '0.375rem';
            confirmBtn.style.backgroundColor = '#ef4444'; // red-500
            confirmBtn.style.color = 'white';
            confirmBtn.onclick = () => {
                setAnnotations(list.filter(n => n.id !== note.id));
                document.body.removeChild(overlay);
            };

            btnContainer.appendChild(cancelBtn);
            btnContainer.appendChild(confirmBtn);
            dialog.appendChild(msg);
            dialog.appendChild(btnContainer);
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
        }
    } catch (e) {
        console.error("[FieldAnnotations] Delete Note failed:", e);
    }
  }
});

// 4. Render Notes
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
