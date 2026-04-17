const fs = require('fs');

function fixSpatialAggregator() {
  const p = 'src/utils/engine/SpatialAggregator.ts';
  let s = fs.readFileSync(p, 'utf8');
  // `analyzePathSegment` in `timeCalculator.ts` returns `PathStep` which has NO `x`, `y`, or `t`.
  // Wait... the original timeCalculator.ts analyzePathSegment didn't return x/y/t!
  // It only returned `deltaLength`, `radius`, `rotation`, `heading`.
  // If it didn't return x, y, t, we need to generate it inside SpatialAggregator directly using `getCurvePoint`!!
  s = s.replace(
      '          for (const step of analysis.steps) {',
      `          let accDist = 0;
          for (let i = 0; i < analysis.steps.length; i++) {
            const step = analysis.steps[i];
            const t = (i + 1) / analysis.steps.length;
            const pt = import("../math").then(m => m.getCurvePoint(t, [localStartPoint, ...line.controlPoints, line.endPoint]));
            accDist += step.deltaLength;
            currentCluster.steps.push({
               x: 0, y: 0, t: t,
               s: currentCluster.totalLength + accDist,
               radius: step.radius, tangentRotation: step.heading * (Math.PI / 180),
               curvature: 1 / step.radius, lineIndex: lineIdx
            });
            // Natively synchronous call
            const curvePoints = [localStartPoint, ...(line.controlPoints || []), line.endPoint];
            const m = require("../math");
            const coords = m.getCurvePoint(t, curvePoints);
            currentCluster.steps[currentCluster.steps.length - 1].x = coords.x;
            currentCluster.steps[currentCluster.steps.length - 1].y = coords.y;
          }`
  );
  // remove the original loop body
  s = s.replace(/currentCluster\.steps\.push\(\{\n\s*x: step\.x, y: step\.y, t: step\.t,\n\s*s: currentCluster\.totalLength \+ step\.distance,\n\s*radius: step\.radius, tangentRotation: step\.tangentRotation,\n\s*curvature: step\.curvature, lineIndex: lineIdx\n\s*\}\);\n\s*\}/g, '');
  fs.writeFileSync(p, s);
}

fixSpatialAggregator();
