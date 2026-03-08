2026-02-28 - [Discoverability of Hidden Commands]
Learning: [While powerful commands like `splitPath` can exist via keyboard shortcuts (e.g. CommandPalette), they are often undiscoverable by average users. The request to add a simple visual scissors button in the timeline playback demonstrates the importance of exposing key functionality directly in relevant context areas.]
Action: [When building new powerful editor features, always ensure they are exposed in the core UI near related functionality, rather than burying them entirely in shortcuts or context menus.]

2024-05-24 - [Digital Strategy Notes]
Learning: Replacing static printed lines with an editable textarea linked to the project store allows users to draft their strategy before printing or exporting. This reduces manual work and ensures notes persist with the file.
Action: Look for opportunities to upgrade read-only or print-only dialogs with active state management that adds tangible user value.

2024-10-24 - [Contextualizing Sequence Statistics]
Learning: Users often need to see the time/distance impact of individual segments without opening global dialogs. Extracting the `timePrediction.timeline` data and displaying it inline within the sequence list (`WaypointTable`) provides immediate feedback.
Action: When building complex sequences, expose the derived/simulated data (like start/end times) directly alongside the editable items to tighten the feedback loop.

2026-03-01 - [Reverse Path Generation]
Learning: Teams frequently design 'out-and-back' autonomous routines. Manually recreating a Bezier curve in reverse is tedious and error-prone. Providing a single-click 'Duplicate & Reverse' action for path segments directly solves a common workflow bottleneck.
Action: Identify repetitive drafting tasks in CAD/pathing workflows and automate the tedious geometry inversions.
