// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.
import { describe, it, expect, beforeEach } from "vitest";
import { get } from "svelte/store";
import {
  normalizeLines,
  sanitizeSequence,
  renumberDefaultPathNames,
  loadProjectData,
  resetProject,
  ensureSequenceConsistency,
  startPointStore,
  linesStore,
  shapesStore,
  sequenceStore,
} from "../lib/projectStore";
import type { Line, SequenceItem, SequencePathItem } from "../types";
import { getDefaultStartPoint, getDefaultLines, getDefaultShapes } from "../config";

describe("projectStore Utilities", () => {
  // Before each test, reset the stores to a clean state
  beforeEach(() => {
    resetProject();
  });

  describe("normalizeLines", () => {
    it("should assign IDs if missing", () => {
      const input: Partial<Line>[] = [{ name: "Test" }];
      const output = normalizeLines(input as Line[]);
      expect(output[0].id).toBeDefined();
      expect(output[0].name).toBe("Test");
    });

    it("should initialize default properties", () => {
      const input: Partial<Line>[] = [{ id: "1" }];
      const output = normalizeLines(input as Line[]);
      expect(output[0].controlPoints).toEqual([]);
      expect(output[0].eventMarkers).toEqual([]);
      expect(output[0].color).toBeDefined();
    });

    it("should handle wait times", () => {
      const input: any[] = [
        { id: "1", waitBeforeMs: 100, waitAfterMs: 200 },
        {
          id: "2",
          waitBefore: { durationMs: 300 },
          waitAfter: { durationMs: 400 },
        },
      ];
      const output = normalizeLines(input);
      expect(output[0].waitBeforeMs).toBe(100);
      expect(output[0].waitAfterMs).toBe(200);
      expect(output[1].waitBeforeMs).toBe(300);
      expect(output[1].waitAfterMs).toBe(400);
    });
  });

  describe("sanitizeSequence", () => {
    const lines: Line[] = [
      { id: "l1", name: "Line 1" } as Line,
      { id: "l2", name: "Line 2" } as Line,
    ];

    it("should remove sequence items referring to non-existent lines", () => {
      const seq: SequenceItem[] = [
        { kind: "path", lineId: "l1" },
        { kind: "path", lineId: "missing" } as any,
      ];
      const result = sanitizeSequence(lines, seq);

      const ids = result.map((s: any) => s.lineId);
      expect(ids).toContain("l1");
      expect(ids).toContain("l2"); // l2 appended because it is missing from sequence
      expect(ids).not.toContain("missing");
    });

    it("should append missing lines to sequence", () => {
      const seq: SequenceItem[] = [{ kind: "path", lineId: "l1" }];
      const result = sanitizeSequence(lines, seq);
      expect(result).toHaveLength(2);
      expect((result[1] as SequencePathItem).lineId).toBe("l2");
    });

    it("should preserve wait items", () => {
      const seq: SequenceItem[] = [
        { kind: "path", lineId: "l1" },
        { kind: "wait", durationMs: 1000 } as any,
      ];
      const result = sanitizeSequence(lines, seq);
      expect(result).toHaveLength(3);
      expect(result[1].kind).toBe("wait");
    });
  });

  describe("renumberDefaultPathNames", () => {
    it("should renumber 'Path N' names", () => {
      const lines: Line[] = [
        { name: "Path 1" } as Line,
        { name: "Custom" } as Line,
        { name: "Path 5" } as Line,
      ];
      const result = renumberDefaultPathNames(lines);
      expect(result[0].name).toBe("Path 1");
      expect(result[1].name).toBe("Custom");
      expect(result[2].name).toBe("Path 3"); // Should be renumbered based on index + 1
    });

    it("should ignore custom names", () => {
      const lines: Line[] = [
        { name: "Start" } as Line,
        { name: "End" } as Line,
      ];
      const result = renumberDefaultPathNames(lines);
      expect(result[0].name).toBe("Start");
      expect(result[1].name).toBe("End");
    });
  });

  describe("resetProject", () => {
    it("should reset stores to default values", () => {
      // First modify stores
      startPointStore.set({ x: 100, y: 100, heading: "linear", reverse: true });
      linesStore.set([]);
      shapesStore.set([]);
      sequenceStore.set([]);

      resetProject();

      expect(get(startPointStore)).toEqual(getDefaultStartPoint());
      const defaultLines = getDefaultLines();
      const currentLines = get(linesStore);
      // Normalized lines have generated IDs, so we check length and some properties
      expect(currentLines.length).toBe(defaultLines.length);
      expect(get(shapesStore)).toEqual(getDefaultShapes());
      // Sequence should be initialized from lines
      const seq = get(sequenceStore);
      expect(seq.length).toBe(currentLines.length);
    });
  });

  describe("loadProjectData", () => {
    it("should load valid project data", () => {
      const projectData = {
        startPoint: { x: 50, y: 50, heading: "constant", reverse: false },
        lines: [
            { id: "l1", name: "Path 1", controlPoints: [], color: "red" },
            { id: "l2", name: "Custom", controlPoints: [], color: "blue" }
        ],
        shapes: [{ id: "s1", type: "circle" }],
        sequence: [
            { kind: "path", lineId: "l1" },
            { kind: "wait", durationMs: 500, name: "Wait 1" },
            { kind: "path", lineId: "l2" }
        ]
      };

      loadProjectData(projectData);

      expect(get(startPointStore)).toEqual(projectData.startPoint);
      const lines = get(linesStore);
      expect(lines).toHaveLength(2);
      expect(lines[0].id).toBe("l1");
      expect(lines[1].name).toBe("Custom");

      const shapes = get(shapesStore);
      expect(shapes).toHaveLength(1);
      expect(shapes[0].id).toBe("s1");

      const seq = get(sequenceStore);
      expect(seq).toHaveLength(3);
      expect(seq[1].kind).toBe("wait");
    });

    it("should handle missing optional fields", () => {
        const projectData = {
            lines: [{ name: "Path 1" }]
        };

        loadProjectData(projectData);

        // Start point should be default-ish (loaded from function fallback)
        const sp = get(startPointStore);
        expect(sp.x).toBe(72);
        expect(sp.y).toBe(72);

        const lines = get(linesStore);
        expect(lines).toHaveLength(1);
        expect(lines[0].id).toBeDefined(); // generated

        const seq = get(sequenceStore);
        expect(seq).toHaveLength(1); // Auto-generated from lines
        expect((seq[0] as SequencePathItem).lineId).toBe(lines[0].id);

        expect(get(shapesStore)).toEqual([]);
    });

    it("should sanitize sequence and names", () => {
         const projectData = {
            lines: [{ id: "l1", name: "Path 1 (1)" }],
            sequence: [{ kind: "path", lineId: "l1" }, {kind: "wait", name: "Wait (2)", durationMs: 100}]
         };

         loadProjectData(projectData);

         const lines = get(linesStore);
         expect(lines[0].name).toBe("Path 1"); // Suffix stripped

         const seq = get(sequenceStore);
         expect(seq[1].name).toBe("Wait"); // Suffix stripped
    });

    it("should renumber default path names on load", () => {
         const projectData = {
            lines: [
                { id: "l1", name: "Path 5" },
                { id: "l2", name: "Path 2" }
            ],
            sequence: [
                { kind: "path", lineId: "l1" },
                { kind: "path", lineId: "l2" }
            ]
         };

         loadProjectData(projectData);

         const lines = get(linesStore);
         // Order in sequence is l1, l2.
         // wait... normalizeLines doesn't reorder lines.
         // But renumberDefaultPathNames works on the lines array.
         // And loadProjectData sets linesStore with renumberDefaultPathNames(normLines).
         // It does NOT reorder the lines array itself based on sequence.

         // In loadProjectData:
         // normLines = [Path 5, Path 2] (id l1, l2)
         // renumberDefaultPathNames([Path 5, Path 2]) -> index 0: Path 1, index 1: Path 2.

         expect(lines[0].name).toBe("Path 1");
         expect(lines[1].name).toBe("Path 2");
    });
  });

  describe("ensureSequenceConsistency", () => {
      it("should update sequenceStore if inconsistent with lines", () => {
          // set up stores
          const l1 = { id: "l1", name: "L1" } as Line;
          linesStore.set([l1]);
          sequenceStore.set([]); // Empty sequence, missing l1

          ensureSequenceConsistency();

          const seq = get(sequenceStore);
          expect(seq).toHaveLength(1);
          expect((seq[0] as SequencePathItem).lineId).toBe("l1");
      });

      it("should update linesStore if names need renumbering", () => {
          const l1 = { id: "l1", name: "Path 5" } as Line;
          linesStore.set([l1]);
          sequenceStore.set([{ kind: "path", lineId: "l1" }]);

          ensureSequenceConsistency();

          const lines = get(linesStore);
          expect(lines[0].name).toBe("Path 1");
      });
  });

});
