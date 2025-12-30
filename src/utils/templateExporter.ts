import type { Point, Line, SequenceItem, Shape } from "../types";
import { renderTemplate } from "./templateEngine";
export { validateTemplate } from "./templateEngine";

interface TemplateContext {
  packageName: string;
  className: string;
  startPoint: {
    x: number;
    y: number;
    heading: number;
    headingRad: number;
  };
  paths: Array<any>;
  markers: Array<{ name: string }>;
  sequence: Array<any>;
}

export function generateCustomCode(
  startPoint: Point,
  lines: Line[],
  sequence: SequenceItem[] | undefined,
  template: string,
  mode: "full" | "class-body" = "full",
  packageName: string = "com.example",
  className: string = "AutoPath",
): string {
  const context = prepareTemplateContext(
    startPoint,
    lines,
    sequence,
    packageName,
    className,
  );

  // If mode is "class-body", we might want to wrap it,
  // BUT the user prompt says: "Users will provide a Java template... The choice between these two modes must be explicitly togglable... The program will then... Render the final Java file by evaluating the template"
  // It implies the user provides the WHOLE template for that mode.
  // Wait, if "Only a class body" is selected, the user provides just the body. The system MUST wrap it.

  let finalTemplate = template;
  if (mode === "class-body") {
    finalTemplate = `package {{ packageName }};

import com.pedropathing.follower.Follower;
import com.pedropathing.geometry.Pose;
import com.pedropathing.pathing.PathChain;
import com.qualcomm.robotcore.eventloop.opmode.Autonomous;
import com.qualcomm.robotcore.eventloop.opmode.OpMode;

@Autonomous(name = "{{ className }}", group = "Autonomous")
public class {{ className }} extends OpMode {

${template}

}
`;
  }

  return renderTemplate(finalTemplate, context);
}

function prepareTemplateContext(
  startPoint: Point,
  lines: Line[],
  sequence: SequenceItem[] | undefined,
  packageName: string,
  className: string,
): TemplateContext {
  const formattedStartPoint = {
    x: startPoint.x,
    y: startPoint.y,
    heading: (startPoint as any).startDeg ?? 0, // Simplified, assume linear/constant provides startDeg
    headingRad: (Math.PI / 180) * ((startPoint as any).startDeg ?? 0),
  };

  // Process Paths
  const paths = lines.map((line, idx) => {
    const name = line.name || `path${idx + 1}`;
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, "");

    return {
      name: cleanName,
      index: idx,
      startPoint: idx === 0 ? formattedStartPoint : lines[idx - 1].endPoint, // Crude approximation, real start is prev end
      endPoint: {
        x: line.endPoint.x,
        y: line.endPoint.y,
        heading:
          (line.endPoint as any).endDeg ?? (line.endPoint as any).degrees ?? 0,
      },
      controlPoints: line.controlPoints,
      eventMarkers: line.eventMarkers || [],
      reversed: !!line.endPoint.reverse,
    };
  });

  // Unique Markers
  const markersSet = new Set<string>();
  paths.forEach((p) =>
    p.eventMarkers.forEach((m: any) => markersSet.add(m.name)),
  );
  const markers = Array.from(markersSet).map((name) => ({ name }));

  // Sequence
  const defaultSequence = lines.map((ln, idx) => ({
    kind: "path",
    lineId: ln.id || `line-${idx + 1}`,
  }));

  const seqSource = sequence && sequence.length ? sequence : defaultSequence;

  const processedSequence = seqSource.map((item, idx) => {
    const isLast = idx === seqSource.length - 1;
    if ((item as any).kind === "wait") {
      return {
        type: "wait",
        duration: (item as any).durationMs || 0,
        waitSeconds: ((item as any).durationMs || 0) / 1000.0,
        hasNext: !isLast,
      };
    } else {
      // Find path name
      const line = lines.find((l) => l.id === (item as any).lineId);
      const name = line
        ? (line.name || `path${lines.indexOf(line) + 1}`).replace(
            /[^a-zA-Z0-9]/g,
            "",
          )
        : "unknown";

      let nextPathName = "";
      if (!isLast) {
        const nextItem = seqSource[idx + 1];
        if ((nextItem as any).kind === "path") {
          const nextLine = lines.find((l) => l.id === (nextItem as any).lineId);
          nextPathName = nextLine
            ? (nextLine.name || `path${lines.indexOf(nextLine) + 1}`).replace(
                /[^a-zA-Z0-9]/g,
                "",
              )
            : "";
        }
      }

      return {
        type: "path",
        name: name,
        hasNext: !isLast,
        nextPathName: nextPathName,
      };
    }
  });

  return {
    packageName,
    className,
    startPoint: formattedStartPoint,
    paths,
    markers,
    sequence: processedSequence,
  };
}
