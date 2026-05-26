export const sharedTimeCalcStartPoint = { x: 0, y: 0, heading: "tangential" as const, reverse: false };
export const sharedTimeCalcSettings = {
  xVelocity: 50,
  yVelocity: 50,
  aVelocity: 180,
  kFriction: 0.5,
  rLength: 10,
  rWidth: 10,
  safetyMargin: 2,
  maxVelocity: 50,
  maxAcceleration: 20,
  maxDeceleration: 20,
} as any;
export const createTestLine = (headingConfig: any) => ({
  endPoint: { x: 10, y: 0, ...headingConfig },
  controlPoints: [],
  color: "red",
  id: "l1",
});
