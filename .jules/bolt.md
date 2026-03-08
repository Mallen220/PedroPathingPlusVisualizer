## 2024-05-24 - Avoiding Array Allocations in High-Frequency Geometric Functions

**Learning:** `getRobotCorners` is called thousands of times per optimization iteration in `pathOptimizer.ts`. Allocating an intermediate array and calling `.map()` inside this function creates significant garbage collection overhead and is much slower (~4-5x slower) than explicitly returning the 4 points directly.
**Action:** Always inline small array transformations like `[{dx, dy}].map(...)` in heavily iterated hot paths (like geometric collision checks or path scoring).
