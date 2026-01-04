# Getting Started

This guide will walk you through creating your first autonomous path with Pedro Pathing Visualizer.

## 1. Launch the Application

Open the application. You will be greeted by the main interface, featuring the field view on the left and the control panel on the right.

## 2. Initial Configuration

Before creating a path, ensure your settings match your robot.

1. Click the **Settings** gear icon in the top navigation bar.
2. **Robot Dimensions**: Enter your robot's Length and Width in inches.
   - *Note: `rLength` is the front-to-back dimension, `rWidth` is left-to-right.*
3. **Field Map**: Select "CenterStage" (or the current season's field) from the dropdown.
4. Close the Settings dialog.

## 3. Creating Your First Path

### Add a Starting Point
1. In the **Paths** tab (right panel), you will see a "Start" section.
2. Enter the starting coordinates (X, Y) and Heading (in degrees).
   - *Tip: You can also drag the blue "Start" robot on the field to position it.*

### Create a Line
1. Click the **Add Path** button.
2. A new line segment will appear.
3. Drag the **End Point** (circle) to where you want the robot to go.
4. Drag the **Control Point** (square) to curve the path. This creates a Bezier curve.
   - *Tip: Hold `Shift` while dragging to snap to grid points.*

### Adjust Heading
1. In the path list, look for the **Heading** dropdown for your new segment.
2. Select a mode:
   - **Tangential**: The robot faces the direction of travel.
   - **Constant**: The robot maintains a specific heading relative to the field.
   - **Linear**: The robot smoothly rotates from the start heading to the end heading over the duration of the path.

## 4. Adding Waits and Events

Complex autos often require the robot to stop and perform an action (e.g., score a pixel).

1. Click **Add Wait** in the path list.
2. This inserts a "Wait" command after the currently selected path.
3. Set the **Duration** (in milliseconds).
4. You can reorder items in the list by dragging them using the handle on the left.

## 5. Simulation

1. Press the **Spacebar** or click the Play button at the bottom of the screen.
2. Watch the robot follow your path.
3. The timeline shows the progression. You can scrub back and forth to analyze specific movements.
4. Check for collisions—the path will turn red if the robot hits a defined obstacle.

## 6. Saving Your Project

1. Press `Cmd+S` (Mac) or `Ctrl+S` (Windows/Linux).
2. Choose a directory to save your `.pp` project files.
3. Give your file a name.

## Next Steps

- Learn about [Features](Features) in detail.
- Export your path to code using the [Export Guide](Exporting-Code).
