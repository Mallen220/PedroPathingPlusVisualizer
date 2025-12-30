# Feature Development Journal

## 2024-05-24 - Project Initialization
**Learning:** Initialized the journal.
**Action:** Use this file to record critical feature development insights.

## 2024-12-30 - WaypointTable Statistics
**Learning:** The `WaypointTable` component lacked immediate visibility into the total path length and estimated time, requiring users to rely on the Optimization dialog or simulation.
**Action:** Added a dedicated statistics footer to `WaypointTable` that displays `Total Length` and `Estimated Time` using `calculatePathTime`. This improves the feedback loop for path planning.
