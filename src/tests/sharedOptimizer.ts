export const sharedOptimizerSettings = {
  xVelocity: 50,
  yVelocity: 50,
  aVelocity: 180,
  kFriction: 0.5,
  rLength: 10,
  rWidth: 10,
  safetyMargin: 2,
};

export const sharedOptimizerStartPoint = {
  x: 10,
  y: 10,
  heading: "tangential" as const,
  reverse: false,
};

export const createKeepInZone = (id: string, xMin: number, xMax: number, yMin: number, yMax: number) => ({
  id,
  vertices: [
    { x: xMin, y: yMin },
    { x: xMax, y: yMin },
    { x: xMax, y: yMax },
    { x: xMin, y: yMax },
  ],
  color: "green",
  fillColor: "green",
  type: "keep-in" as any,
  visible: true,
});
