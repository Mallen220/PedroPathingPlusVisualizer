# Exporting Code

One of the most powerful features of Pedro Pathing Visualizer is generating Java code for your robot.

## How to Export

1. Open the path you want to export.
2. Click the **Export** button in the top navigation bar (or press `Cmd/Ctrl+E`).
3. Select your export format.

## Export Formats

### 1. Java Class (Standard)
Generates a complete Java class for your OpMode.
- Includes imports, class definition, and path construction.
- Uses the `pedroPathing` library syntax.

### 2. Sequential Command Group
Generates code compatible with the FTC SDK's `SequentialCommandGroup`.
- Integrates `FollowPath` commands with other subsystem commands.
- Useful for command-based robot frameworks.

### 3. Raw Points
Exports a JSON or text list of the path's control points. useful for custom path followers or debugging.

## Custom Templates

For advanced users, the "Advanced Exporter" allows you to define custom Jinja-like templates.

### Template Syntax
- Variables: `{{ variable_name }}`
- Loops: `{% for item in list %} ... {% endfor %}`
- Logic: `{% if condition %} ... {% endif %}`

### Available Variables
- `paths`: List of path segments.
- `markers`: List of event markers.
- `sequence`: The ordered list of operations (paths and waits).

**Example Template Snippet:**
```java
// Generated Path
{% for line in paths %}
    pathBuilder.addPath(new BezierCurve(
        new Point({{ line.start.x }}, {{ line.start.y }}),
        new Point({{ line.end.x }}, {{ line.end.y }})
    ));
{% endfor %}
```
