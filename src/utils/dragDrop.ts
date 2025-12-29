
export type DragPosition = "top" | "bottom";

export function calculateDragPosition(
  e: DragEvent,
  currentTarget: HTMLElement
): DragPosition {
  const rect = currentTarget.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  return e.clientY < midY ? "top" : "bottom";
}

export function reorderSequence<T>(
  sequence: T[],
  fromIndex: number,
  toIndex: number,
  position: DragPosition,
): T[] {
  // Target index logic:
  // If 'top', we want to insert at toIndex.
  // If 'bottom', we want to insert at toIndex + 1.
  let targetInsertionIndex = position === "top" ? toIndex : toIndex + 1;

  // If we are moving the item 'down' (from < target), the target index
  // will shift down by 1 when we remove the item.
  // Note: We use < because if fromIndex == targetInsertionIndex, it's a no-op
  // (inserting right back where it was).
  if (fromIndex < targetInsertionIndex) {
    targetInsertionIndex--;
  }

  const newSequence = [...sequence];
  const [item] = newSequence.splice(fromIndex, 1);
  newSequence.splice(targetInsertionIndex, 0, item);

  return newSequence;
}
