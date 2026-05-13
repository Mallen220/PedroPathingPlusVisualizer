# Feature Development Journal

2024-05-24 - Contextual Velocity Tooltip
Learning: When adding hover interactions over WebGL/Canvas elements wrapped in standard DOM overlays (like Two.js), standard Playwright `page.mouse.move` might be intercepted or ignored due to `pointer-events: none` on overlaid container elements.
Action: To reliably test internal container coordinates or synthetic hovering, extract the bounding box coordinates via `locator.bounding_box()` and dispatch custom `MouseEvent`s directly to the underlying listening node in `page.evaluate`.
