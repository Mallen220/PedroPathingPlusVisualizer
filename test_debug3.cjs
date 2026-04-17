// Is timePrediction even populated correctly?
// We patched calculatePipelineTimePrediction to return the same shape object as TimePrediction.
// Let's create a minimal test script that actually calls calculatePipelineTimePrediction
const fs = require('fs');

const { calculatePipelineTimePrediction } = require('./dist_test/utils/engine/index.js');
// wait we need to compile it to commonjs to test in node easily
