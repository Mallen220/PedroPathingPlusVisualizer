# Feature Development Journal

This journal tracks critical learnings during feature development.
It is NOT a changelog. It is for recording constraints, failures, and anti-patterns.

## Format

YYYY-MM-DD - [Title]
Learning: [Insight]
Action: [How to apply next time]

2024-05-22 - [Playwright Interactions with Overlays]
Learning: The application renders a `driver-overlay` (Onboarding) that intercepts pointer events on startup. Standard Playwright `page.click()` fails because the target elements are obscured, even if visually underneath.
Action: In future E2E tests for this app, either programmatically dismiss the overlay via `localStorage` flags before page load, or use `page.evaluate()` to click elements directly via JS if strictly testing UI logic behind the overlay.
