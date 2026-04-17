const fs = require('fs');

function fixIntegratorNaN() {
  const p = 'src/utils/engine/SpatialAggregator.ts';
  let s = fs.readFileSync(p, 'utf8');
  // `analyzePathSegment` returns `analysis.steps` with `distance` NOT `s` in the original timeCalculator.ts
  s = s.replace('step.s', 'step.distance');
  fs.writeFileSync(p, s);
}

fixIntegratorNaN();
