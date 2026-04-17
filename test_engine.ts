import { calculatePipelineTimePrediction } from "./src/utils/engine";

const startPoint = { x: 0, y: 0, heading: "linear", startDeg: 0, endDeg: 0 };
const lines = [
  { id: "l1", controlPoints: [], endPoint: { x: 100, y: 0, heading: "linear" }, isChain: false }
];
const settings = { maxVelocity: 60, maxAcceleration: 40 };

const pred = calculatePipelineTimePrediction(startPoint as any, lines as any, settings);
console.log("Prediction: ", {
  totalTime: pred.totalTime,
  timelineEvents: pred.timeline.length,
  continuousStates: pred.continuousTimeline.states.length
});
