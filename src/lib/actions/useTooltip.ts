import { tooltipState } from "../../stores";

export function tooltip(node: Element, text: string | undefined | null) {
  let timeout: ReturnType<typeof setTimeout>;
  let currentText = text;

  function handleMouseEnter() {
    if (!currentText) return;
    timeout = setTimeout(() => {
      const rect = node.getBoundingClientRect();
      tooltipState.set({
        content: currentText!,
        x: rect.left + rect.width / 2,
        y: rect.bottom + 5,
        visible: true,
      });
    }, 1000);
  }

  function handleMouseLeave() {
    clearTimeout(timeout);
    tooltipState.set(null);
  }

  function handleClick() {
    clearTimeout(timeout);
    tooltipState.set(null);
  }

  node.addEventListener("mouseenter", handleMouseEnter);
  node.addEventListener("mouseleave", handleMouseLeave);
  node.addEventListener("click", handleClick);
  // Also handle focus/blur for accessibility if possible, but tooltip usually hover.
  // For SVG elements, focus might not work same way.

  return {
    update(newText: string | undefined | null) {
      currentText = newText;
      if (!currentText) {
        handleMouseLeave();
      } else {
        // If currently visible, maybe update content immediately?
        // But store is global. We don't know if *we* are the active one easily without tracking.
        // For simplicity, just update local state.
      }
    },
    destroy() {
      node.removeEventListener("mouseenter", handleMouseEnter);
      node.removeEventListener("mouseleave", handleMouseLeave);
      node.removeEventListener("click", handleClick);
      clearTimeout(timeout);
    },
  };
}
