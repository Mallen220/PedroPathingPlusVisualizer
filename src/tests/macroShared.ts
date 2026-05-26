export const mStartPoint = { x: 0, y: 0, heading: "tangential" as const, reverse: false };
export const mPrevPoint = { x: 10, y: 10, heading: "tangential" as const, reverse: false };
export const createMacroLine = (id: string, endX: number, endY: number) => ({
  id,
  endPoint: { x: endX, y: endY, heading: "tangential" as const, reverse: false },
  controlPoints: [],
  color: "red",
});
