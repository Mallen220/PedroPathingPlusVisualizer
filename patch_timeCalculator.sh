cat << 'DIFF' | patch -p1
--- a/src/utils/timeCalculator.ts
+++ b/src/utils/timeCalculator.ts
@@ -514,12 +514,9 @@
 function calculateMotionProfileDetailed(
   steps: PathStep[],
   settings: Settings,
-  velocityConstraint?: number
+  velocityConstraint?: number,
+  tValueConstraint?: number
 ): { totalTime: number; profile: number[]; velocityProfile: number[] } {
-  let maxVelGlobal = settings.maxVelocity || 100;
-  if (velocityConstraint !== undefined && velocityConstraint > 0) {
-    maxVelGlobal = Math.min(maxVelGlobal, velocityConstraint);
-  }
+  const maxVelGlobal = settings.maxVelocity || 100;
   const maxAcc = settings.maxAcceleration || 30;
   const maxDec = settings.maxDeceleration || maxAcc;
   const kFriction = settings.kFriction || 0;
@@ -542,7 +539,13 @@
   }

   // 2. Backward Pass
-  vAtPoints[n] = 0;
+  let endVelocity = 0;
+  if (velocityConstraint !== undefined && velocityConstraint >= 0) {
+    endVelocity = velocityConstraint;
+  } else if (tValueConstraint !== undefined && tValueConstraint < 1.0) {
+    endVelocity = maxVelGlobal;
+  }
+  vAtPoints[n] = endVelocity;
   for (let i = n - 1; i >= 0; i--) {
     const dist = steps[i].deltaLength;
     const maxReachable = Math.sqrt(
@@ -791,7 +794,8 @@
         const result = calculateMotionProfileDetailed(
           analysis.steps,
           safeSettings,
-          velocityConstraint
+          velocityConstraint,
+          tValue
         );
         translationTime = result.totalTime;
         motionProfile = result.profile;
DIFF
