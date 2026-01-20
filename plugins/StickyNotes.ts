/// <reference path="./pedro.d.ts" />

// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.

const DEFAULT_WIDTH = 160;
const MIN_WIDTH = 100;
const MIN_HEIGHT = 60;

interface StickyNote {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  softLocked?: boolean;
}

const DEFAULT_COLOR = "#fef3c7"; // yellow

let overlayContainer: HTMLElement | null = null;
let notesMap = new Map<string, HTMLElement>();
let currentNotes: StickyNote[] = [];
let fieldView = { xScale: (v: number) => v, yScale: (v: number) => v, width: 0, height: 0 };
let isDragging = false;
let isResizing = false;

// Initialize
pedro.registries.hooks.register("fieldOverlayInit", (container: HTMLElement) => {
  overlayContainer = container;
  renderNotes();
});

// Context Menu
pedro.registries.contextMenuItems.register({
  id: "add-sticky-note",
  label: "Add Note",
  icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>`,
  onClick: ({ x, y }) => {
    addNote(x, y);
  },
});

// Store Subscriptions
pedro.stores.project.extraDataStore.subscribe((data) => {
  currentNotes = data.stickyNotes || [];
  renderNotes();
});

pedro.stores.app.fieldViewStore.subscribe((view) => {
  fieldView = view;
  if (!isDragging && !isResizing) updatePositions();
});

function addNote(x: number, y: number) {
  const note: StickyNote = {
    id: Math.random().toString(36).slice(2),
    x,
    y,
    width: DEFAULT_WIDTH,
    height: 120, // Default height
    text: "",
    color: DEFAULT_COLOR,
    softLocked: false
  };

  pedro.stores.project.extraDataStore.update((data) => ({
    ...data,
    stickyNotes: [...(data.stickyNotes || []), note],
  }));
}

function updateNote(id: string, updates: Partial<StickyNote>) {
  pedro.stores.project.extraDataStore.update((data) => ({
    ...data,
    stickyNotes: (data.stickyNotes || []).map((n: StickyNote) =>
      n.id === id ? { ...n, ...updates } : n
    ),
  }));
}

function deleteNote(id: string) {
  pedro.stores.project.extraDataStore.update((data) => ({
    ...data,
    stickyNotes: (data.stickyNotes || []).filter((n: StickyNote) => n.id !== id),
  }));
}

function renderNotes() {
  if (!overlayContainer) return;

  // Remove deleted notes
  const currentIds = new Set(currentNotes.map((n) => n.id));
  for (const [id, el] of notesMap) {
    if (!currentIds.has(id)) {
      el.remove();
      notesMap.delete(id);
    }
  }

  // Add/Update notes
  currentNotes.forEach((note) => {
    let el = notesMap.get(note.id);
    if (!el) {
      el = createNoteElement(note);
      overlayContainer!.appendChild(el);
      notesMap.set(note.id, el);
    }

    updateNoteElement(el, note);
  });

  if (!isDragging && !isResizing) updatePositions();
}

function createNoteElement(note: StickyNote) {
  const div = document.createElement("div");
  // Force text-neutral-800 to ensure dark text on light sticky notes regardless of theme
  div.className =
    "absolute shadow-lg rounded flex flex-col overflow-hidden pointer-events-auto transition-shadow hover:shadow-xl border border-black/10";
  div.style.color = "#1f2937"; // text-neutral-800

  // Apply saved dimensions or defaults
  const w = note.width || DEFAULT_WIDTH;
  const h = note.height || 120;
  div.style.width = `${w}px`;
  div.style.height = `${h}px`;

  // --- Header ---
  const header = document.createElement("div");
  header.className =
    "flex items-center justify-between px-2 py-1 cursor-move select-none bg-black/5 border-b border-black/10 transition-all duration-200 flex-none";
  header.style.height = "28px"; // Fixed height for calculation
  (div as any)._header = header;

  const controls = document.createElement("div");
  controls.className = "flex items-center gap-1.5";

  // Color picker container
  const colorContainer = document.createElement("div");
  colorContainer.className = "relative flex items-center justify-center";

  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.className = "absolute opacity-0 w-full h-full cursor-pointer top-0 left-0";
  colorInput.value = note.color;
  colorInput.oninput = (e) => {
    // Live preview
    div.style.backgroundColor = (e.target as HTMLInputElement).value;
  };
  colorInput.onchange = (e) => {
    updateNote(note.id, { color: (e.target as HTMLInputElement).value });
  };
  colorInput.onmousedown = (e) => e.stopPropagation();

  const colorBtn = document.createElement("div");
  colorBtn.className = "w-3 h-3 rounded-full border border-black/20 hover:scale-110 transition-transform";
  colorBtn.style.backgroundColor = note.color;

  colorContainer.appendChild(colorBtn);
  colorContainer.appendChild(colorInput);

  // Soft Lock (Minimize) Button
  // Replaced Lock icon with Minimize-style icon (Minus)
  const lockBtn = document.createElement("button");
  lockBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3"><path fill-rule="evenodd" d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z" clip-rule="evenodd" /></svg>`;
  lockBtn.className =
    "text-xs w-4 h-4 flex items-center justify-center hover:bg-black/10 rounded text-black/70";
  lockBtn.style.color = "#374151";
  lockBtn.title = "Compact Mode (Hide Header)";
  lockBtn.onmousedown = (e) => e.stopPropagation();
  lockBtn.onclick = (e) => {
    e.stopPropagation();
    updateNote(note.id, { softLocked: true });
  };

  // Close Button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "×";
  closeBtn.className =
    "text-xs font-bold w-4 h-4 flex items-center justify-center hover:bg-red-500 hover:text-white rounded text-black/70";
  closeBtn.style.color = "#374151";
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    if (confirm("Delete this note?")) {
      deleteNote(note.id);
    }
  };

  controls.appendChild(colorContainer);
  controls.appendChild(lockBtn);
  controls.appendChild(closeBtn);

  const title = document.createElement("span");
  title.textContent = "Note";
  title.className = "text-xs font-semibold text-black/60 uppercase tracking-wider";
  title.style.color = "rgba(0,0,0,0.6)";

  header.appendChild(title);
  header.appendChild(controls);

  div.appendChild(header);

  // --- Compact/Soft-Lock Handle ---
  // A small handle in the top-right corner, visible only when softLocked
  const compactHandle = document.createElement("div");
  // Position it absolute in top right
  compactHandle.className = "absolute top-0 right-0 p-1 cursor-move hidden z-10 opacity-50 hover:opacity-100 transition-opacity";
  compactHandle.title = "Drag to move";

  const unlockBtn = document.createElement("button");
  // Expand/Maximize icon (Arrows out or Plus) - Using simple chevron/expand icon
  // Revert icon to something indicating "Show Header"
  unlockBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3"><path fill-rule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-1.5 0V3.75A.75.75 0 0 1 10 3Z" clip-rule="evenodd" /><path fill-rule="evenodd" d="M3.75 10a.75.75 0 0 1 .75-.75h11.5a.75.75 0 0 1 0 1.5H4.5A.75.75 0 0 1 3.75 10Z" clip-rule="evenodd" /></svg>`; // Plus sign

  unlockBtn.className = "w-5 h-5 flex items-center justify-center bg-black/10 hover:bg-black/20 rounded shadow-sm backdrop-blur-sm text-black/80";
  unlockBtn.style.color = "#1f2937";
  unlockBtn.title = "Show Header";

  unlockBtn.onmousedown = (e) => e.stopPropagation();
  unlockBtn.onclick = (e) => {
    e.stopPropagation();
    updateNote(note.id, { softLocked: false });
  };
  compactHandle.appendChild(unlockBtn);

  (div as any)._compactHandle = compactHandle;
  div.appendChild(compactHandle);


  // --- Content ---
  const textarea = document.createElement("textarea");
  textarea.className =
    "w-full h-full p-2 resize-none bg-transparent border-none outline-none text-sm font-sans placeholder-neutral-500/50 flex-1";
  // Force text color
  textarea.style.color = "#1f2937";
  textarea.placeholder = "Type here...";
  textarea.value = note.text;

  textarea.onchange = (e) => {
    updateNote(note.id, { text: (e.target as HTMLTextAreaElement).value });
  };
  textarea.onmousedown = (e) => e.stopPropagation();

  div.appendChild(textarea);

  // --- Resize Handle ---
  const resizeHandle = document.createElement("div");
  resizeHandle.className = "absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 hover:bg-black/10 rounded-tl";
  // Visual indicator (triangle lines)
  resizeHandle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-full h-full opacity-30"><path d="M22 22H20V20H22V22ZM22 18H18V22H22V18ZM18 18H16V20H18V18ZM14 20H16V22H14V20ZM22 14H14V18H22V14Z"/></svg>`;

  resizeHandle.onmousedown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    isResizing = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = parseFloat(div.style.width);
    const startH = parseFloat(div.style.height);

    const onResizeMove = (me: MouseEvent) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;
      const newW = Math.max(MIN_WIDTH, startW + dx);
      const newH = Math.max(MIN_HEIGHT, startH + dy);

      div.style.width = `${newW}px`;
      div.style.height = `${newH}px`;
    };

    const onResizeUp = () => {
      document.removeEventListener("mousemove", onResizeMove);
      document.removeEventListener("mouseup", onResizeUp);
      isResizing = false;
      const finalW = parseFloat(div.style.width);
      const finalH = parseFloat(div.style.height);
      updateNote(note.id, { width: finalW, height: finalH });
    };

    document.addEventListener("mousemove", onResizeMove);
    document.addEventListener("mouseup", onResizeUp);
  };

  div.appendChild(resizeHandle);

  // --- Drag Logic ---
  const startDrag = (e: MouseEvent) => {
    e.preventDefault();
    isDragging = true;
    let startX = e.clientX;
    let startY = e.clientY;

    const onMove = (me: MouseEvent) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;

      const currentLeft = parseFloat(div.style.left);
      const currentTop = parseFloat(div.style.top);
      div.style.left = `${currentLeft + dx}px`;
      div.style.top = `${currentTop + dy}px`;

      startX = me.clientX;
      startY = me.clientY;
    };

    const onUp = (me: MouseEvent) => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      isDragging = false;

      const left = parseFloat(div.style.left);
      const top = parseFloat(div.style.top);

      let newX = 0,
        newY = 0;

      if ("invert" in fieldView.xScale) {
        newX = (fieldView.xScale as any).invert(left);
        newY = (fieldView.yScale as any).invert(top);
      } else {
        // Fallback
        const scale = (fieldView.xScale(1) - fieldView.xScale(0));
        newX = (left - fieldView.xScale(0)) / scale;
        newY = (top - fieldView.yScale(0)) / (fieldView.yScale(1) - fieldView.yScale(0));
      }

      updateNote(note.id, { x: newX, y: newY });
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  header.onmousedown = startDrag;
  compactHandle.onmousedown = startDrag;

  return div;
}

function updateNoteElement(div: HTMLElement, note: StickyNote) {
  div.style.backgroundColor = note.color;

  const textarea = div.querySelector("textarea") as HTMLTextAreaElement;
  const header = (div as any)._header as HTMLElement;
  const compactHandle = (div as any)._compactHandle as HTMLElement;

  const colorBtn = header.querySelector(".rounded-full") as HTMLElement;
  const colorInput = header.querySelector("input[type=color]") as HTMLInputElement;

  // Resize
  if (note.width) div.style.width = `${note.width}px`;
  if (note.height) div.style.height = `${note.height}px`;

  // Soft Lock State
  if (note.softLocked) {
    header.style.display = "none";
    compactHandle.style.display = "block";
    div.style.borderTop = "1px solid rgba(0,0,0,0.1)"; // Keep border look
  } else {
    header.style.display = "flex";
    compactHandle.style.display = "none";
    div.style.borderTop = "none";
  }

  // Update controls
  if (colorBtn) colorBtn.style.backgroundColor = note.color;
  if (colorInput && colorInput.value !== note.color) {
      colorInput.value = note.color;
  }

  // Update text only if not focused
  if (textarea && document.activeElement !== textarea) {
    textarea.value = note.text;
  }
}

function updatePositions() {
  currentNotes.forEach((note) => {
    const el = notesMap.get(note.id);
    if (el) {
      el.style.left = `${fieldView.xScale(note.x)}px`;
      el.style.top = `${fieldView.yScale(note.y)}px`;
    }
  });
}
