// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.
/// <reference path="./pedro.d.ts" />

interface StickyNote {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  collapsed: boolean;
}

(function () {
  const { extraDataStore, settingsStore } = pedro.stores.project;
  const { fieldViewStore } = pedro.stores.app;
  const { requestRedraw } = pedro.graphics;
  const { prompt, confirm } = pedro.ui;

  let isDragging = false;
  let dragStart = { x: 0, y: 0 }; // Field coordinates
  let initialNotePos = { x: 0, y: 0 }; // Field coordinates
  let activeNoteId: string | null = null;
  // Constants
  const NOTE_WIDTH = 15; // inches
  const NOTE_HEIGHT_EXPANDED = 10; // inches
  const NOTE_HEIGHT_COLLAPSED = 2; // inches
  const HEADER_HEIGHT = 2; // inches

  function getNotes(): StickyNote[] {
    const data = pedro.stores.get(extraDataStore);
    return (data.stickyNotes as StickyNote[]) || [];
  }

  function saveNotes(notes: StickyNote[]) {
    const cleanNotes = notes.map(n => ({...n}));
    pedro.stores.project.extraDataStore.update((data) => ({
      ...data,
      stickyNotes: cleanNotes,
    }));
    requestRedraw();
  }

  function getFieldCoordinates(
    clientX: number,
    clientY: number,
    domElement: Element
  ): { x: number; y: number } {
    const rect = domElement.getBoundingClientRect();
    const settings = pedro.stores.get(settingsStore);
    const rotation = settings.fieldRotation || 0;

    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    const cx = px - w / 2;
    const cy = py - h / 2;
    const rad = (-rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const nx = cx * cos - cy * sin;
    const ny = cx * sin + cy * cos;
    const newPx = nx + w / 2;
    const newPy = ny + h / 2;

    const fieldView = pedro.stores.get(fieldViewStore);
    return {
      x: fieldView.xScale.invert(newPx),
      y: fieldView.yScale.invert(newPy),
    };
  }

  function isPointInNote(note: StickyNote, x: number, y: number): boolean {
    const height = note.collapsed ? NOTE_HEIGHT_COLLAPSED : NOTE_HEIGHT_EXPANDED;
    const halfWidth = NOTE_WIDTH / 2;
    const halfHeight = height / 2;
    return (
      x >= note.x - halfWidth &&
      x <= note.x + halfWidth &&
      y >= note.y - halfHeight &&
      y <= note.y + halfHeight
    );
  }

  function getNoteAt(x: number, y: number): StickyNote | undefined {
    // Iterate in reverse render order (topmost first)
    const notes = getNotes();
    for (let i = notes.length - 1; i >= 0; i--) {
      if (isPointInNote(notes[i], x, y)) {
        return notes[i];
      }
    }
    return undefined;
  }

  // --- Render ---
  pedro.registerFeature({
    name: "Sticky Notes",
    render: (ctx) => {
      // Attach listeners once per element
      if (ctx.two.renderer.domElement) {
        const el = ctx.two.renderer.domElement as HTMLElement;
        if (!el.dataset.stickyNotesAttached) {
            el.addEventListener("mousedown", handleMouseDown, { capture: true });
            el.addEventListener("mousemove", handleMouseMove, { capture: true });
            el.addEventListener("mouseup", handleMouseUp, { capture: true });
            el.dataset.stickyNotesAttached = "true";
        }
      }

      const notes = getNotes();
      const fieldView = pedro.stores.get(fieldViewStore);
      const ppI = Math.abs(fieldView.xScale(1) - fieldView.xScale(0));

      notes.forEach((note) => {
        const height = note.collapsed ? NOTE_HEIGHT_COLLAPSED : NOTE_HEIGHT_EXPANDED;

        const px = fieldView.xScale(note.x);
        const py = fieldView.yScale(note.y);

        const wPx = NOTE_WIDTH * ppI;
        const hPx = height * ppI;
        const headerHPx = HEADER_HEIGHT * ppI;

        const group = new ctx.two.constructor.Group();
        group.id = `sticky-note-group-${note.id}`;

        // Header (centered vertically relative to total height)
        // Note center is (0,0) in group.
        // Top of note is -hPx/2.
        const headerCenterY = -hPx / 2 + headerHPx / 2;

        const headerRect = new ctx.two.constructor.Rectangle(0, headerCenterY, wPx, headerHPx);
        headerRect.fill = "#d1d5db"; // Gray-300
        headerRect.stroke = "#000000";
        headerRect.linewidth = 1;
        headerRect.id = `sticky-note-${note.id}-header`;
        group.add(headerRect);

        // Collapse Indicator
        const indicator = new ctx.two.constructor.Text(
            note.collapsed ? "+" : "-",
            wPx / 2 - ppI,
            headerCenterY
        );
        indicator.size = ppI * 1.0;
        indicator.alignment = "center";
        indicator.baseline = "middle";
        indicator.fill = "#000000";
        indicator.weight = 700;
        group.add(indicator);

        // Body
        if (!note.collapsed) {
            const bodyHeight = hPx - headerHPx;
            const bodyCenterY = headerCenterY + headerHPx / 2 + bodyHeight / 2;

            const bodyRect = new ctx.two.constructor.Rectangle(0, bodyCenterY, wPx, bodyHeight);
            bodyRect.fill = note.color;
            bodyRect.stroke = "#000000";
            bodyRect.linewidth = 1;
            bodyRect.id = `sticky-note-${note.id}-body`;
            group.add(bodyRect);

            // Text
            const text = new ctx.two.constructor.Text(note.text, 0, bodyCenterY);
            text.size = ppI * 0.8;
            text.alignment = "center";
            text.baseline = "middle";
            text.fill = "#000000";
            group.add(text);
        } else {
            // Show snippet in header if collapsed?
            const text = new ctx.two.constructor.Text(note.text.substring(0, 10) + (note.text.length > 10 ? "..." : ""), 0, headerCenterY);
            text.size = ppI * 0.8;
            text.alignment = "center";
            text.baseline = "middle";
            text.fill = "#000000";
            group.add(text);
        }

        group.translation.set(px, py);
        ctx.two.add(group);
      });
    }
  });

  // --- Interaction ---
  function handleMouseDown(e: MouseEvent) {
    // Only handle left click for drag
    if (e.button !== 0) return;

    const coords = getFieldCoordinates(e.clientX, e.clientY, e.currentTarget as Element);
    const note = getNoteAt(coords.x, coords.y);

    if (note) {
      e.stopPropagation();

      // Check if collapse button clicked (top right of header)
      const height = note.collapsed ? NOTE_HEIGHT_COLLAPSED : NOTE_HEIGHT_EXPANDED;
      const top = note.y - height / 2;
      const right = note.x + NOTE_WIDTH / 2;

      // Header area
      if (coords.y < top + HEADER_HEIGHT) {
         // Collapse button area (rightmost 2 inches)
         if (coords.x > right - 2) {
             const notes = getNotes();
             const idx = notes.findIndex(n => n.id === note.id);
             if (idx !== -1) {
                 const newNotes = [...notes];
                 newNotes[idx] = { ...newNotes[idx], collapsed: !newNotes[idx].collapsed };
                 saveNotes(newNotes);
             }
             return;
         }
      }

      isDragging = true;
      activeNoteId = note.id;
      initialNotePos = { x: note.x, y: note.y };
      dragStart = { x: coords.x, y: coords.y };
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging || !activeNoteId) return;

    e.stopPropagation();
    e.preventDefault(); // Prevent text selection etc

    const coords = getFieldCoordinates(e.clientX, e.clientY, e.currentTarget as Element);
    const dx = coords.x - dragStart.x;
    const dy = coords.y - dragStart.y;

    const notes = getNotes();
    const idx = notes.findIndex(n => n.id === activeNoteId);
    if (idx !== -1) {
        const newNotes = [...notes];
        newNotes[idx] = {
            ...newNotes[idx],
            x: initialNotePos.x + dx,
            y: initialNotePos.y + dy
        };
        saveNotes(newNotes);
    }
  }

  function handleMouseUp(e: MouseEvent) {
    if (isDragging) {
      isDragging = false;
      activeNoteId = null;
      e.stopPropagation();
    }
  }

  // --- Context Menu ---
  pedro.registries.contextMenuItems.register({
    id: "add-sticky-note",
    label: "Add Sticky Note",
    onClick: ({ x, y }) => {
       const notes = getNotes();
       const newNotes = [...notes, {
         id: Math.random().toString(36).slice(2),
         x,
         y,
         text: "New Note",
         color: "#fef3c7", // Amber-100
         collapsed: false
       }];
       saveNotes(newNotes);
    },
    condition: ({ x, y }) => !getNoteAt(x, y)
  });

  pedro.registries.contextMenuItems.register({
    id: "edit-sticky-note-text",
    label: "Edit Text",
    onClick: async ({ x, y }) => {
       const note = getNoteAt(x, y);
       if (note) {
           const newText = await prompt({
               title: "Edit Note",
               message: "Enter new text:",
               defaultText: note.text
           });
           if (newText !== null) {
               const notes = getNotes();
               const idx = notes.findIndex(n => n.id === note.id);
               if (idx !== -1) {
                   const newNotes = [...notes];
                   newNotes[idx] = { ...newNotes[idx], text: newText };
                   saveNotes(newNotes);
               }
           }
       }
    },
    condition: ({ x, y }) => !!getNoteAt(x, y)
  });

  pedro.registries.contextMenuItems.register({
    id: "edit-sticky-note-color",
    label: "Change Color",
    onClick: async ({ x, y }) => {
       const note = getNoteAt(x, y);
       if (note) {
           const newColor = await prompt({
               title: "Change Color",
               message: "Enter hex color or name:",
               defaultText: note.color
           });
           if (newColor !== null) {
               const notes = getNotes();
               const idx = notes.findIndex(n => n.id === note.id);
               if (idx !== -1) {
                   const newNotes = [...notes];
                   newNotes[idx] = { ...newNotes[idx], color: newColor };
                   saveNotes(newNotes);
               }
           }
       }
    },
    condition: ({ x, y }) => !!getNoteAt(x, y)
  });

  pedro.registries.contextMenuItems.register({
    id: "delete-sticky-note",
    label: "Delete Note",
    onClick: async ({ x, y }) => {
       const note = getNoteAt(x, y);
       if (note) {
           if (await confirm({ title: "Delete Note", message: "Are you sure?" })) {
               const notes = getNotes().filter(n => n.id !== note.id);
               saveNotes(notes);
           }
       }
    },
    condition: ({ x, y }) => !!getNoteAt(x, y)
  });

})();
