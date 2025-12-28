import type { Line, Point, SequenceItem } from "../types";

/**
 * Reverses the order and direction of the given path data.
 * The new start point becomes the end point of the last line.
 * The lines are reversed in order.
 * Each line's geometry is reversed (start <-> end, control points reversed).
 *
 * @param startPoint - The original start point
 * @param lines - The original lines array
 * @param sequence - The original sequence array
 * @returns An object containing the new startPoint, lines, and sequence
 */
export function reversePath(
  startPoint: Point,
  lines: Line[],
  sequence: SequenceItem[],
): { startPoint: Point; lines: Line[]; sequence: SequenceItem[] } {
  // If no lines, nothing to reverse
  if (lines.length === 0) {
    return { startPoint, lines, sequence };
  }

  // Deep clone to avoid mutating inputs
  const newLines: Line[] = JSON.parse(JSON.stringify(lines));
  let newSequence: SequenceItem[] = JSON.parse(JSON.stringify(sequence));
  const oldStart = JSON.parse(JSON.stringify(startPoint));

  // Determine the new start point: it's the end point of the last path segment in the sequence
  // We need to traverse the sequence to find the effective end point.
  // Actually, lines are stored in order they were created or listed in `lines` array,
  // but `sequence` determines the execution order.
  // Reversing the path means reversing the execution order.

  // 1. Reverse the sequence items
  newSequence = newSequence.reverse();

  // 2. The new start point is the end point of the line that was executed last.
  // Let's find the last path item in the original sequence
  let lastPathItemIndex = -1;
  for (let i = sequence.length - 1; i >= 0; i--) {
    if (sequence[i].kind === "path") {
      lastPathItemIndex = i;
      break;
    }
  }

  let newStartPoint: Point;

  if (lastPathItemIndex !== -1) {
    const lastLineId = sequence[lastPathItemIndex].lineId;
    const lastLine = lines.find((l) => l.id === lastLineId);
    if (lastLine) {
      // The new start point takes the coordinates of the last line's end point
      // For heading, if we simply reverse traversal, the heading might need adjustment depending on robot logic.
      // Usually, reversing a path means "driving backwards" along the same curve?
      // Or "driving from B to A" (which is what we want here).
      // If original was A -> B (tangent), B -> A (tangent) will have start heading = tangent of curve at B (reversed).
      // We can inherit properties from the last line's endPoint settings.
      newStartPoint = {
        ...lastLine.endPoint,
        // We might want to keep the original start point's heading type if it makes sense,
        // but usually the end point's heading properties are what matters for the end state.
        // However, `Point` (Start) has `degrees` or `heading` type.
        // `EndPoint` also has these.
        // Let's copy them.
      };
    } else {
      newStartPoint = oldStart;
    }
  } else {
    // No path items?
    newStartPoint = oldStart;
  }

  // 3. Process each sequence item
  // If it's a path, we need to modify the corresponding line to be reversed.
  // Note: a line might be used multiple times? The app seems to assume 1-to-1 mapping usually,
  // but the data model allows re-use. If 1-to-1, we can just modify the lines.
  // If re-used, we might have conflict. Assuming 1-to-1 for now as per `addNewLine`.

  // We need to determine the "start point" for each segment in the NEW sequence.
  // The first segment starts at `newStartPoint`.
  // Its end point will be the start point of the segment in the OLD sequence.

  // Let's reconstruct the chain of points from the original sequence.
  // Original: Start -> (Line1) -> P1 -> (Line2) -> P2 ...
  // Reversed: P_last -> (Line_last reversed) -> ... -> P1 -> (Line1 reversed) -> Start

  // We need to map which line corresponds to which reversed segment.
  // Since we reversed the sequence, `newSequence` has the items in reverse order.
  // A wait item just stays a wait item (maybe shift duration? No, wait at P2 becomes wait at P2...
  // Wait. If sequence is: Path1 -> Wait -> Path2.
  // Robot: Drives Path1, Waits, Drives Path2.
  // Reverse: Drives Path2 (rev), Waits??, Drives Path1 (rev).
  // The wait was "after Path1". In reverse, should it be "after Path2 (rev)"?
  // Original: A -> B, Wait, B -> C.
  // Reverse: C -> B, Wait, B -> A.
  // So simply reversing the sequence array preserves the logic "Drive C->B, then Wait, then Drive B->A".
  // Yes, reversing the sequence array is correct for waits too.

  // Now, for the Lines.
  // For each Path item in the reversed sequence, we need to flip the geometry of the referenced line.
  // But wait, if we just modify the line object in `newLines`, we need to be careful if we have multiple references.
  // But standard usage is unique lines.

  // We need to know the "start point" of the line in the original sequence to set it as the "end point" in the new sequence.
  // Original chain points: [Start, Line1.End, Line2.End, ...] (in execution order)
  // Let's build this array of points.

  const originalPoints: Point[] = [oldStart];
  sequence.forEach((item) => {
    if (item.kind === "path") {
      const line = lines.find((l) => l.id === item.lineId);
      if (line) {
        originalPoints.push(line.endPoint);
      }
    }
  });

  // Now process new sequence
  // We need to track which 'original point' corresponds to the end of the current reversed segment.
  // In reversed sequence:
  // Item 0 (was last item): connects P_last to P_{last-1}.
  // Item 1: connects P_{last-1} to P_{last-2}.
  // ...
  // Item last (was first): connects P1 to Start.

  // We only care about Path items.
  let pathItemCount = 0;
  // Count total path items to help indexing
  const totalPathItems = sequence.filter((i) => i.kind === "path").length;

  newSequence.forEach((item) => {
    if (item.kind === "path") {
      const line = newLines.find((l) => l.id === item.lineId);
      if (line) {
        // This line originally went from P_{k-1} to P_k.
        // Now it goes from P_k to P_{k-1}.
        // The "End Point" of this new line should be P_{k-1}.

        // Which index in `originalPoints` is P_{k-1}?
        // In original sequence, this was the (k)-th path item (1-based index).
        // So it connected originalPoints[k-1] to originalPoints[k].
        // We want new EndPoint = originalPoints[k-1].

        // We need to find the index `k` of this line in the ORIGINAL path sequence.
        // Since we are iterating the REVERSED sequence, this is easy.
        // The current path item is the `m`-th path item in reversed sequence.
        // It corresponds to the `(total - 1 - m)`-th path item in original sequence.
        // Let `originalIndex` = totalPathItems - 1 - pathItemCount.
        // This item connected originalPoints[originalIndex] -> originalPoints[originalIndex + 1].
        // New line connects ... -> originalPoints[originalIndex].

        const originalIndex = totalPathItems - 1 - pathItemCount;
        const targetPoint = originalPoints[originalIndex];

        // Update line geometry
        // 1. Control points: reverse them.
        line.controlPoints = line.controlPoints.reverse();

        // 2. End Point: becomes the target point (start of original segment)
        // We copy coordinates.
        // What about heading?
        // If original was "tangent", new should likely be "tangent".
        // If original was "constant", new should be "constant" with same degrees?
        // If original was "linear", new should be "linear"?
        // Actually, the heading properties at the endpoint dictate the robot's heading ARRIVING at that point.
        // If we arrive at A from B (reverse), we want the heading to match A's original properties?
        // A (Start) had heading properties.
        // If A was linear/constant, we probably want to arrive there matching that.
        // If A was tangent, we arrive tangent.

        // So we copy the heading properties from the `targetPoint` (which is A in B->A).
        // But `targetPoint` comes from `originalPoints` array.
        // `originalPoints[0]` is the original StartPoint. It has `heading`, `degrees`, etc.
        // `originalPoints[k]` (k>0) are Line EndPoints.

        // Wait, `Point` type has specific fields.
        // StartPoint: x, y, heading (enum), degrees, startDeg, endDeg...
        // Line.EndPoint: x, y, heading (enum), degrees, startDeg, endDeg, reverse...

        // Let's construct the new end point based on targetPoint.
        // We need to handle the `reverse` flag (driving backwards).
        // If original segment was `reverse: true` (driving backwards A->B),
        // then B->A should also be `reverse: true`?
        // Yes, if I drove backward to get there, I drive backward to return.

        const wasReverse = line.endPoint.reverse;

        line.endPoint = {
          x: targetPoint.x,
          y: targetPoint.y,
          heading: targetPoint.heading,
          // Copy other potential fields
          degrees: (targetPoint as any).degrees,
          startDeg: (targetPoint as any).startDeg,
          endDeg: (targetPoint as any).endDeg,
          reverse: wasReverse, // Keep the reverse flag of the segment
        } as Point;

        // If the target point was the original StartPoint, it might not have 'reverse' property.
        // But the line segment itself determines 'reverse' driving.
        // So we preserve `line.endPoint.reverse` from the original line object?
        // Yes, `line` is the cloned object from original. `line.endPoint` is currently the OLD end point.
        // We just overwrote `line.endPoint`. We should have saved `wasReverse` first.
        // Done above.

        pathItemCount++;
      }
    }
  });

  return {
    startPoint: newStartPoint,
    lines: newLines,
    sequence: newSequence,
  };
}
