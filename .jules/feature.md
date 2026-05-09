2024-05-09 - Dynamic Event Marker Layout
Learning: When visualizing overlapping event markers on a 2D field renderer, modifying inner child coordinates directly causes issues when later needing to cluster or process them globally.
Action: Apply layout transforms via Group (`translation`) instead of deep nested primitive shapes. For true overlap resolution, clustering must be done after all items are added to a collection, rather than in isolation.
