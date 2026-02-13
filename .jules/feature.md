# Feature Journal

2024-05-23 - [Configurable Telemetry Export]
Learning: Hardcoded dependencies in generated code significantly limit the "out of the box" usability for teams with different software stacks.
Action: Always provide configuration options for external library dependencies in code generators.

2024-05-24 - [Smart Object Snapping]
Learning: When validating UI changes with Playwright, standard click actions on overlay elements (like Settings tabs) may be intercepted by the underlying field canvas layer.
Action: Use `{ force: true }` for clicks on dialog elements that overlay the canvas, or explicitly assert pointer-events status before interacting.

2025-05-27 - [Compare with File]
Learning: When extending a toggle-based feature (Diff View) to support multiple sources (Git vs File), it's crucial to explicitly track the source in the state store. Relying solely on the "mode" boolean can lead to ambiguous states where the UI doesn't know which source to display or how to switch between them correctly.
Action: Implement explicit state tracking (e.g., `diffSource`) alongside mode flags when a feature can be activated from multiple contexts.
