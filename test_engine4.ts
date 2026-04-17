import { KinematicIntegrator } from "./src/utils/engine/KinematicIntegrator";
import { TangentialStrategy } from "./src/utils/engine/HeadingInterpolator";
import { SpatialAggregator } from "./src/utils/engine/SpatialAggregator";
import { analyzePathSegment } from "./src/utils/timeCalculator";

const line = { id: "l1", controlPoints: [], endPoint: { x: 100, y: 0, heading: "linear" }, isChain: false };
const aggregator = new SpatialAggregator();
const res = aggregator.aggregate([{ type: "travel", lineIndices: [0] } as any], {x: 0, y: 0} as any, [line as any]);
const integrator = new KinematicIntegrator(60, 40, 2, 2, 16);
const states = integrator.integrate(res.clusters[0], new TangentialStrategy());

console.log(states.map(s => ({s: s.spatialPercent*100, v: s.velocity, dt: s.time })));
