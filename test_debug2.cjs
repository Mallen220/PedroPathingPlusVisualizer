const fs = require('fs');
const p = 'src/utils/engine/index.ts';
let s = fs.readFileSync(p, 'utf8');

// I am computing `totalTime = timeline.states[timeline.states.length - 1].time * 1000`.
// Let's check `TimelineGenerator.generate` returning `timeline.states`.
