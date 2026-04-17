const fs = require('fs');

function fixIntegrator() {
  const p = 'src/utils/engine/KinematicIntegrator.ts';
  let s = fs.readFileSync(p, 'utf8');
  // When velocity is 0, dt falls back to 0.001 but wait...
  // if avgV is 0 and we move ds=10 inches, dt=0.001 implies insane acceleration/instant jump!
  // If v + prevVelocity = 0, they are at rest. If ds > 0, they can't be at rest, they must accelerate.
  // We need to properly compute trapezoidal dt when starting from rest (v=0).
  // t = sqrt(2 * ds / a) or similar if v0=0.
  // Actually, we calculated v in Pass 3.
  // Let's print out the vFinal array in the node test
  fs.writeFileSync(p, s);
}
fixIntegrator();
