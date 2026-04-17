import { KinematicIntegrator } from "./src/utils/engine/KinematicIntegrator";
import { TangentialStrategy } from "./src/utils/engine/HeadingInterpolator";

const steps = [];
for (let i = 0; i <= 10; i++) {
  steps.push({ x: i*10, y: 0, t: i/10, s: i*10, radius: Infinity, tangentRotation: 0, curvature: 0, lineIndex: 0 });
}
const cluster = { startPoint: { x:0, y:0 } as any, lines: [], totalLength: 100, steps, events: [] };
const integrator = new KinematicIntegrator(60, 40, 2, 2, 16);
const states = integrator.integrate(cluster, new TangentialStrategy());
console.log(states.map(s => ({s: s.spatialPercent*100, v: s.velocity, dt: s.time })));
