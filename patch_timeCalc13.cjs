const fs = require('fs');

function fixEngineIndex() {
  const p = 'src/utils/engine/index.ts';
  let s = fs.readFileSync(p, 'utf8');
  // the states array is [1] so time must be 0? why?
  // Let's check KinematicIntegrator
  fs.writeFileSync(p, s);
}

fixEngineIndex();
