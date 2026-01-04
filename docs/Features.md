# Features Guide

## Path Editing

The core of the visualizer is the path editor. It supports standard Bezier curves used in the Pedro Pathing library.

### Control Points
- **Standard Bezier**: Each path segment has a start point, end point, and one or more control points.
- **Manipulation**: Drag points on the field to adjust the curve.
- **Snapping**: Toggle "Snap to Grid" in the View menu (or press `Shift+N`) to align points to the grid.

### Heading Modes
The visualizer supports three heading interpolation modes:

1. **Tangential**: The robot's heading is locked to the path's tangent. It always faces forward.
2. **Constant**: The robot maintains a fixed field-centric heading throughout the segment.
3. **Linear**: The robot rotates linearly from the start heading to a target end heading.

## Sequences & Logic

Autonomous routines are built as a **Sequence**.

### Wait Commands
- Insert a **Wait** to pause the robot's movement.
- Useful for simulating intake/outtake times.
- Note: In the generated code, this corresponds to a delay or a specific command duration.

### Event Markers
- **Event Markers** allow you to trigger actions at specific points along a path (e.g., "Open Claw" at 50% of the path).
- Add markers in the "Event Markers" section of a path segment.
- Define the parameter (0.0 to 1.0) where the event occurs.

## Field Tools

### Obstacles
- Define obstacles to represent game elements or trusses.
- **Collision Detection**: If the robot's bounding box intersects an obstacle, the visualizer alerts you.
- **Custom Shapes**: You can draw custom polygons to represent non-standard field elements.

### Measurement
- **Ruler**: Measure distance between two points.
- **Protractor**: Measure angles.
- **Grid**: Adjustable grid sizes (6" to 48") to help with alignment.

## File Management

The built-in File Manager allows you to:
- Browse `.pp` files in your project directory.
- **Search**: Quickly find paths by name.
- **Duplicate**: Clone a path to try variations.
- **Mirror**: Automatically create a mirrored version of a path (Red vs. Blue alliance).
