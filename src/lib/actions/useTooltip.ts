import { tooltipState } from "../../stores";

export function tooltip(node: HTMLElement, text: string) {
  let timer: any;

  function handleMouseEnter() {
    timer = setTimeout(() => {
      const rect = node.getBoundingClientRect();
      tooltipState.set({
        text,
        x: rect.left + rect.width / 2,
        y: rect.top,
        visible: true,
      });
    }, 1000);
  }

  function handleMouseLeave() {
    clearTimeout(timer);
    tooltipState.set(null);
  }

  function handleClick() {
    clearTimeout(timer);
    tooltipState.set(null);
  }

  node.addEventListener("mouseenter", handleMouseEnter);
  node.addEventListener("mouseleave", handleMouseLeave);
  node.addEventListener("click", handleClick);

  return {
    update(newText: string) {
      text = newText;
    },
    destroy() {
      node.removeEventListener("mouseenter", handleMouseEnter);
      node.removeEventListener("mouseleave", handleMouseLeave);
      node.removeEventListener("click", handleClick);
      clearTimeout(timer);
    },
  };
}
