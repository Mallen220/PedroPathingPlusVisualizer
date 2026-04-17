import { KinematicIntegrator } from "./src/utils/engine/KinematicIntegrator";
import { TangentialStrategy } from "./src/utils/engine/HeadingInterpolator";
import { SpatialAggregator } from "./src/utils/engine/SpatialAggregator";
import { analyzePathSegment } from "./src/utils/timeCalculator";

// See what the analysis returns
const line = { id: "l1", controlPoints: [], endPoint: { x: 100, y: 0, heading: "linear" }, isChain: false };
const analysis = analyzePathSegment({x:0, y:0} as any, [], {x: 100, y: 0} as any, 50, 0);

console.log("Analysis steps: ", analysis.steps.length);
console.log("Analysis length: ", analysis.length);

const aggregator = new SpatialAggregator();
const res = aggregator.aggregate([
  { type: "travel", lineIndices: [0] } as any
], {x: 0, y: 0} as any, [line as any]);

console.log("Cluster steps: ", res.clusters[0]?.steps.length);

const integrator = new KinematicIntegrator(60, 40, 2, 2, 16);
const states = integrator.integrate(res.clusters[0], new TangentialStrategy());

console.log("Integrated states: ", states.length);
console.log("States end time: ", states[states.length - 1]?.time);
