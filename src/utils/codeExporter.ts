// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.
import prettier from "prettier";
import prettierJavaPlugin from "prettier-plugin-java";
import type { Point, Line, BasePoint, SequenceItem } from "../types";
import { getCurvePoint } from "./math";
import pkg from "../../package.json";

/**
 * Generate Java code from path data
 */

const AUTO_GENERATED_FILE_WARNING_MESSAGE: string = `
/* ============================================================= *
 *           Pedro Pathing Visualizer — Auto-Generated           *
 *                                                               *
 *  Version: ${pkg.version}.                                              *
 *  Copyright (c) ${new Date().getFullYear()} Matthew Allen                             *
 *                                                               *
 *  THIS FILE IS AUTO-GENERATED — DO NOT EDIT MANUALLY.          *
 *  Changes will be overwritten when regenerated.                *
 * ============================================================= */
`;

function sanitizeName(name: string | undefined, defaultName: string): string {
  if (!name) return defaultName;
  const sanitized = name.replace(/[^a-zA-Z0-9]/g, "");
  return sanitized || defaultName;
}

export async function generateJavaCode(
  startPoint: Point,
  lines: Line[],
  exportFullCode: boolean,
  sequence?: SequenceItem[],
  packageName: string = "org.firstinspires.ftc.teamcode.Commands.AutoCommands",
): Promise<string> {
  const headingTypeToFunctionName = {
    constant: "setConstantHeadingInterpolation",
    linear: "setLinearHeadingInterpolation",
    tangential: "setTangentHeadingInterpolation",
  };

  // Collect all unique event marker names
  const eventMarkerNames = new Set<string>();
  lines.forEach((line) => {
    line.eventMarkers?.forEach((event) => {
      eventMarkerNames.add(event.name);
    });
  });
  if (sequence) {
    sequence.forEach((item) => {
      if ((item as any).kind === "wait" && (item as any).eventMarkers) {
        (item as any).eventMarkers.forEach((event: any) => {
          eventMarkerNames.add(event.name);
        });
      }
    });
  }

  // Map generated variable names to ensure uniqueness for PathChains
  const variableNames = new Map<string, number>();

  const getUniqueName = (baseName: string) => {
    const count = variableNames.get(baseName) || 0;
    variableNames.set(baseName, count + 1);
    return count === 0 ? baseName : `${baseName}${count + 1}`;
  };

  // Pre-calculate line variable names to ensure consistency
  const lineVariableNames = lines.map((line, idx) => {
    const baseName = sanitizeName(line.name, `line${idx + 1}`);
    return getUniqueName(baseName);
  });

  let pathsClass = `
  public static class Paths {
    ${lineVariableNames.map((name) => `public PathChain ${name};`).join("\n")}
    
    public Paths(Follower follower) {
      ${lines
        .map((line, idx) => {
          const variableName = lineVariableNames[idx];
          const start =
            idx === 0
              ? `new Pose(${startPoint.x.toFixed(3)}, ${startPoint.y.toFixed(3)})`
              : `new Pose(${lines[idx - 1].endPoint.x.toFixed(3)}, ${lines[idx - 1].endPoint.y.toFixed(3)})`;

          const controlPoints =
            line.controlPoints.length > 0
              ? `${line.controlPoints
                  .map(
                    (point) =>
                      `new Pose(${point.x.toFixed(3)}, ${point.y.toFixed(3)})`,
                  )
                  .join(",\n")},`
              : "";

          const curveType =
            line.controlPoints.length === 0
              ? `new BezierLine`
              : `new BezierCurve`;

          const headingConfig =
            line.endPoint.heading === "constant"
              ? `Math.toRadians(${line.endPoint.degrees})`
              : line.endPoint.heading === "linear"
                ? `Math.toRadians(${line.endPoint.startDeg}), Math.toRadians(${line.endPoint.endDeg})`
                : "";

          const reverseConfig = line.endPoint.reverse
            ? ".setReversed(true)"
            : "";

          // Add event markers to the path builder
          let eventMarkerCode = "";
          if (line.eventMarkers && line.eventMarkers.length > 0) {
            eventMarkerCode = line.eventMarkers
              .map(
                (event) =>
                  `\n        .addEventMarker(${event.position.toFixed(3)}, "${event.name}")`,
              )
              .join("");
          }

          return `${variableName} = follower.pathBuilder().addPath(
          ${curveType}(
            ${start},
            ${controlPoints}
            new Pose(${line.endPoint.x.toFixed(3)}, ${line.endPoint.y.toFixed(3)})
          )
        ).${headingTypeToFunctionName[line.endPoint.heading]}(${headingConfig})
        ${reverseConfig}${eventMarkerCode}
        .build();`;
        })
        .join("\n\n")}
    }
  }
  `;

  // Add NamedCommands registration instructions
  let namedCommandsSection = "";
  if (eventMarkerNames.size > 0) {
    namedCommandsSection = `
    
    // ===== NAMED COMMANDS REGISTRATION =====
    // In your RobotContainer class, register named commands like this:
    // 
    // NamedCommands.registerCommand("CommandName", yourCommand);
    // 
    // Example for the event markers in this path:
    ${Array.from(eventMarkerNames)
      .map(
        (name) =>
          `// NamedCommands.registerCommand("${name}", your${name.replace(/_/g, "")}Command);`,
      )
      .join("\n    ")}
    
    // Make sure to register all named commands BEFORE creating any paths or autos.
    `;
  }

  let file = "";
  if (!exportFullCode) {
    file =
      AUTO_GENERATED_FILE_WARNING_MESSAGE + pathsClass + namedCommandsSection;
  } else {
    file = `
    ${AUTO_GENERATED_FILE_WARNING_MESSAGE}

    package ${packageName};
    import com.qualcomm.robotcore.eventloop.opmode.OpMode;
    import com.qualcomm.robotcore.eventloop.opmode.Autonomous;
    import com.bylazar.configurables.annotations.Configurable;
    import com.bylazar.telemetry.TelemetryManager;
    import com.bylazar.telemetry.PanelsTelemetry;
    import org.firstinspires.ftc.teamcode.pedroPathing.Constants;
    import com.pedropathing.geometry.BezierCurve;
    import com.pedropathing.geometry.BezierLine;
    import com.pedropathing.follower.Follower;
    import com.pedropathing.paths.PathChain;
    import com.pedropathing.geometry.Pose;
    ${eventMarkerNames.size > 0 ? "import com.pedropathing.NamedCommands;" : ""}
    
    @Autonomous(name = "Pedro Pathing Autonomous", group = "Autonomous")
    @Configurable // Panels
    public class PedroAutonomous extends OpMode {
      private TelemetryManager panelsTelemetry; // Panels Telemetry instance
      public Follower follower; // Pedro Pathing follower instance
      private int pathState; // Current autonomous path state (state machine)
      private Paths paths; // Paths defined in the Paths class
      
      @Override
      public void init() {
        panelsTelemetry = PanelsTelemetry.INSTANCE.getTelemetry();

        follower = Constants.createFollower(hardwareMap);
        follower.setStartingPose(new Pose(72, 8, Math.toRadians(90)));

        paths = new Paths(follower); // Build paths

        panelsTelemetry.debug("Status", "Initialized");
        panelsTelemetry.update(telemetry);
      }
      
      @Override
      public void loop() {
        follower.update(); // Update Pedro Pathing
        pathState = autonomousPathUpdate(); // Update autonomous state machine

        // Log values to Panels and Driver Station
        panelsTelemetry.debug("Path State", pathState);
        panelsTelemetry.debug("X", follower.getPose().getX());
        panelsTelemetry.debug("Y", follower.getPose().getY());
        panelsTelemetry.debug("Heading", follower.getPose().getHeading());
        panelsTelemetry.update(telemetry);
      }

      ${pathsClass}

      public int autonomousPathUpdate() {
          // Event markers will automatically trigger at their positions
          // Make sure to register NamedCommands in your RobotContainer
          return pathState;
      }
      
      ${namedCommandsSection}
    }
    `;
  }

  try {
    const formattedCode = await prettier.format(file, {
      parser: "java",
      plugins: [prettierJavaPlugin],
    });
    return formattedCode;
  } catch (error) {
    console.error("Code formatting error:", error);
    return file;
  }
}

/**
 * Generate an array of waypoints (not sampled points) along the path
 */
export function generatePointsArray(startPoint: Point, lines: Line[]): string {
  const points: BasePoint[] = [];

  // Add start point
  points.push(startPoint);

  // Add all waypoints (end points and control points)
  lines.forEach((line) => {
    // Add control points for this line
    line.controlPoints.forEach((controlPoint) => {
      points.push(controlPoint);
    });

    // Add end point of this line
    points.push(line.endPoint);
  });

  // Format as string array, removing decimal places for whole numbers
  const pointsString = points
    .map((point) => {
      const x = Number.isInteger(point.x)
        ? point.x.toFixed(1)
        : point.x.toFixed(3);
      const y = Number.isInteger(point.y)
        ? point.y.toFixed(1)
        : point.y.toFixed(3);
      return `(${x}, ${y})`;
    })
    .join(", ");

  return `[${pointsString}]`;
}

/**
 * Generate Sequential Command code
 */
export async function generateSequentialCommandCode(
  startPoint: Point,
  lines: Line[],
  fileName: string | null = null,
  sequence?: SequenceItem[],
  targetLibrary: "SolversLib" | "NextFTC" = "SolversLib", // - Added parameter
  packageName: string = "org.firstinspires.ftc.teamcode.Commands.AutoCommands",
): Promise<string> {
  // Determine class name from file name or use default
  let className = "AutoPath";
  if (fileName) {
    const baseName = fileName.split(/[\\/]/).pop() || "";
    className = baseName.replace(".pp", "").replace(/[^a-zA-Z0-9]/g, "_");
    if (!className) className = "AutoPath";
  }

  const isNextFTC = targetLibrary === "NextFTC";

  // Generate ProgressTracker field
  const progressTrackerField = `    private final ProgressTracker progressTracker;`;

  // Define library-specific names
  const SequentialGroupClass = isNextFTC
    ? "SequentialGroup"
    : "SequentialCommandGroup";
  const ParallelRaceClass = isNextFTC
    ? "ParallelRaceGroup"
    : "ParallelRaceGroup";
  const WaitCmdClass = isNextFTC ? "Delay" : "WaitCommand";
  const InstantCmdClass = "InstantCommand";
  const WaitUntilCmdClass = isNextFTC ? "WaitUntil" : "WaitUntilCommand"; // Assuming NextFTC has similar or user maps it
  const FollowPathCmdClass = isNextFTC ? "FollowPath" : "FollowPathCommand";

  // Collect all pose names including control points
  const allPoseDeclarations: string[] = [];
  const allPoseInitializations: string[] = [];

  // Track all pose variable names map<variableName, variableName>
  // To avoid re-declaring variables that are identical
  const poseVariableNames: Map<string, string> = new Map();
  // Map <PoseName, PoseName> to handle duplicates correctly for declarations
  const declaredPoses = new Set<string>();

  // Helper to register pose
  // If a pose with same name exists, it returns existing name.
  // Wait, the requirement says: "For poses the variable is the same so it's ok if they have a shared name as long as it is not initialized many times."
  // So if we have two points named "Score", we declare `private Pose Score;` once.
  // And initialize `Score = pp.get("Score");` once.
  const registerPose = (name: string, ppKey: string) => {
    if (declaredPoses.has(name)) return;
    declaredPoses.add(name);
    allPoseDeclarations.push(`    private Pose ${name};`);
    allPoseInitializations.push(`        ${name} = pp.get("${ppKey}");`);
  };

  // Add start point
  registerPose("startPoint", "startPoint");

  // Arrays to hold the resolved variable names for each line
  const lineStartPoseNames: string[] = [];
  const lineEndPoseNames: string[] = [];
  // Map line index to array of control point variable names
  const lineControlPointNames: Map<number, string[]> = new Map();

  // 1. First Pass: Generate unique PathChain variable names for all lines
  // We need these to prefix control points to ensure uniqueness
  const pathChainVariableNames: Map<string, number> = new Map();
  const getUniquePathName = (baseName: string) => {
    const count = pathChainVariableNames.get(baseName) || 0;
    pathChainVariableNames.set(baseName, count + 1);
    return count === 0 ? baseName : `${baseName}${count + 1}`;
  };

  const linePathVariableNames = lines.map(() => "");

  // 2. Second Pass: Register Poses and resolve names
  lines.forEach((line, lineIdx) => {
    const endPointName = sanitizeName(line.name, `point${lineIdx + 1}`);

    // Register end point
    registerPose(endPointName, endPointName);
    lineEndPoseNames.push(endPointName);

    // Determine start pose name for this line
    if (lineIdx === 0) {
      lineStartPoseNames.push("startPoint");
    } else {
      // Previous line's end point
      const prevLine = lines[lineIdx - 1];
      const prevName = sanitizeName(prevLine.name, `point${lineIdx}`);
      lineStartPoseNames.push(prevName);
    }

    // Resolve Path Variable Name
    // Always use startPoseTOendPose format as requested, but ensure uniqueness
    const startPoseName = lineStartPoseNames[lineIdx];
    const endPoseName = endPointName; // Current line end
    const pathName = `${startPoseName}TO${endPoseName}`;
    linePathVariableNames[lineIdx] = getUniquePathName(pathName);

    // Register control points if they exist
    // Use the unique PathChain variable name as prefix to ensure independence
    // e.g. scorePath_control1, scorePath2_control1
    const controlPointVars: string[] = [];
    if (line.controlPoints && line.controlPoints.length > 0) {
      const uniquePathVar = linePathVariableNames[lineIdx];
      line.controlPoints.forEach((_, controlIdx) => {
        const controlPointName = `${uniquePathVar}Control${controlIdx + 1}`;
        allPoseDeclarations.push(`    private Pose ${controlPointName};`);
        const pt = line.controlPoints[controlIdx];
        allPoseInitializations.push(`        ${controlPointName} = new Pose(${pt.x.toFixed(3)}, ${pt.y.toFixed(3)}, "geometric"); // Control point for ${uniquePathVar}`);
        controlPointVars.push(controlPointName);
      });
    }
    lineControlPointNames.set(lineIdx, controlPointVars);
  });

  // Generate path chain declarations
  const pathChainDeclarations = lines
    .map((line, idx) => {
      const uniquePathName = linePathVariableNames[idx];
      return `    private PathChain ${uniquePathName};`;
    })
    .join("\n");

  // Generate path building
  const pathBuilders = lines
    .map((line, idx) => {
      const startPoseName = lineStartPoseNames[idx];
      const endPoseName = lineEndPoseNames[idx];
      const pathName = linePathVariableNames[idx];

      const isCurve = line.controlPoints.length > 0;
      const curveType = isCurve ? "BezierCurve" : "BezierLine";

      // Build control points string using the unique variables
      let controlPointsStr = "";
      if (isCurve) {
        const cpVars = lineControlPointNames.get(idx) || [];
        controlPointsStr = cpVars.join(", ") + ", ";
      }

      // Determine heading interpolation
      let headingConfig = "";
      if (line.endPoint.heading === "constant") {
        headingConfig = `setConstantHeadingInterpolation(${endPoseName}.getHeading())`;
      } else if (line.endPoint.heading === "linear") {
        headingConfig = `setLinearHeadingInterpolation(${startPoseName}.getHeading(), ${endPoseName}.getHeading())`;
      } else {
        headingConfig = `setTangentHeadingInterpolation()`;
      }

      // Build reverse config
      const reverseConfig = line.endPoint.reverse
        ? "\n                .setReversed(true)"
        : "";

      return `        ${pathName} = follower.pathBuilder()
            .addPath(new ${curveType}(${startPoseName}, ${controlPointsStr}${endPoseName}))
            .${headingConfig}${reverseConfig}
            .build();`;
    })
    .join("\n\n        ");

  // Generate imports based on library
  let imports = "";
  if (isNextFTC) {
    imports = `
import dev.nextftc.core.command.groups.SequentialGroup;
import dev.nextftc.core.command.groups.ParallelRaceGroup;
import dev.nextftc.core.command.Delay;
import dev.nextftc.core.command.WaitUntil;
import dev.nextftc.core.command.InstantCommand;
import dev.nextftc.extensions.pedro.command.FollowPath;
`;
  } else {
    imports = `
import com.seattlesolvers.solverslib.command.SequentialCommandGroup;
import com.seattlesolvers.solverslib.command.ParallelRaceGroup;
import com.seattlesolvers.solverslib.command.WaitUntilCommand;
import com.seattlesolvers.solverslib.command.WaitCommand;
import com.seattlesolvers.solverslib.command.InstantCommand;
import com.seattlesolvers.solverslib.pedroCommand.FollowPathCommand;
`;
  }

  // Generate addCommands calls with event handling; iterate sequence if provided
  const commands: string[] = [];

  const defaultSequence: SequenceItem[] = lines.map((ln, idx) => ({
    kind: "path",
    lineId: ln.id || `line-${idx + 1}`,
  }));

  const seq = sequence && sequence.length ? sequence : defaultSequence;

  seq.forEach((item, idx) => {
    if (item.kind === "wait") {
      const waitItem: any = item as any;
      const waitDuration = waitItem.durationMs || 0;

      const markers: any[] = Array.isArray(waitItem.eventMarkers)
        ? [...waitItem.eventMarkers]
        : [];

      // Determine wait value and formatting
      // NextFTC Delay uses seconds, SolversLib WaitCommand uses ms (or whatever SolversLib expects, assumed ms)
      const getWaitValue = (ms: number) =>
        isNextFTC ? (ms / 1000.0).toFixed(3) : ms.toFixed(0);

      if (markers.length === 0) {
        commands.push(
          `                new ${WaitCmdClass}(${getWaitValue(waitDuration)})`,
        );
        return;
      }

      // Sort markers by position (0-1) to schedule in order
      markers.sort((a, b) => (a.position || 0) - (b.position || 0));

      let scheduled = 0;
      const markerCommandParts: string[] = [];

      markers.forEach((marker) => {
        const targetMs =
          Math.max(0, Math.min(1, marker.position || 0)) * waitDuration;
        const delta = Math.max(0, targetMs - scheduled);
        scheduled = targetMs;

        markerCommandParts.push(
          `new ${WaitCmdClass}(${getWaitValue(delta)}), new ${InstantCmdClass}(() -> progressTracker.executeEvent("${marker.name}"))`,
        );
      });

      const remaining = Math.max(0, waitDuration - scheduled);
      markerCommandParts.push(
        `new ${WaitCmdClass}(${getWaitValue(remaining)})`,
      );

      commands.push(
        `                new ${ParallelRaceClass}(
                    new ${WaitCmdClass}(${getWaitValue(waitDuration)}),
                    new ${SequentialGroupClass}(${markerCommandParts.join(",")})
                )`,
      );
      return;
    }

    const lineIdx = lines.findIndex((l) => l.id === (item as any).lineId);
    if (lineIdx < 0) {
      return; // skip if sequence references a missing line
    }
    const line = lines[lineIdx];
    if (!line) {
      return;
    }

    // Use the resolved unique path variable name
    const pathName = linePathVariableNames[lineIdx];
    // Display name can be the same as unique name or the original logic
    const pathDisplayName = pathName;

    // Construct FollowPath instantiation
    const followPathInstance = isNextFTC
      ? `new ${FollowPathCmdClass}(${pathName})`
      : `new ${FollowPathCmdClass}(follower, ${pathName})`;

    if (line.eventMarkers && line.eventMarkers.length > 0) {
      // Path has event markers

      // First: InstantCommand to set up tracker
      commands.push(
        `                new ${InstantCmdClass}(
                    () -> {
                        progressTracker.setCurrentChain(${pathName});
                        progressTracker.setCurrentPathName("${pathDisplayName}");`,
      );

      // Add event registrations
      line.eventMarkers.forEach((event) => {
        commands[commands.length - 1] += `
                        progressTracker.registerEvent("${event.name}", ${event.position.toFixed(3)});`;
      });

      commands[commands.length - 1] += `
                    })`;

      // Second: ParallelRaceGroup for following path with event handling
      commands.push(`                new ${ParallelRaceClass}(
                    ${followPathInstance},
                    new ${SequentialGroupClass}(`);

      // Add WaitUntilCommand for each event
      line.eventMarkers.forEach((event, eventIdx) => {
        if (eventIdx > 0) commands[commands.length - 1] += ",";
        commands[commands.length - 1] += `
                        new ${WaitUntilCmdClass}(() -> progressTracker.shouldTriggerEvent("${event.name}")),
                        new ${InstantCmdClass}(
                            () -> {
                                progressTracker.executeEvent("${event.name}");
                            })`;
      });

      commands[commands.length - 1] += `
                    ))`;
    } else {
      // No event markers - simple InstantCommand + FollowPathCommand
      commands.push(
        `                new ${InstantCmdClass}(
                    () -> {
                        progressTracker.setCurrentChain(${pathName});
                        progressTracker.setCurrentPathName("${pathDisplayName}");
                    }),
                ${followPathInstance}`,
      );
    }
  });

  const sequentialCommandCode = `
${AUTO_GENERATED_FILE_WARNING_MESSAGE}

package ${packageName};
    
import com.pedropathing.follower.Follower;
import com.pedropathing.geometry.BezierCurve;
import com.pedropathing.geometry.BezierLine;
import com.pedropathing.geometry.Pose;
import com.pedropathing.paths.PathChain;
import com.qualcomm.robotcore.hardware.HardwareMap;
${imports}
import org.firstinspires.ftc.robotcore.external.Telemetry;
import com.pedropathingplus.PedroPathReader;
import com.pedropathingplus.pathing.ProgressTracker;
import com.pedropathingplus.pathing.NamedCommands;
import java.io.IOException;
import ${packageName.split(".").slice(0, 4).join(".")}.Subsystems.Drivetrain;

public class ${className} extends ${SequentialGroupClass} {

    private final Follower follower;
${progressTrackerField}

    // Poses
${allPoseDeclarations.join("\n")}

    // Path chains
${pathChainDeclarations}

    public ${className}(final Drivetrain drive, HardwareMap hw, Telemetry telemetry) throws IOException {
        this.follower = drive.getFollower();
        this.progressTracker = new ProgressTracker(follower, telemetry);

        PedroPathReader pp = new PedroPathReader("${fileName ? fileName.split(/[\\/]/).pop() || "AutoPath.pp" : "AutoPath.pp"}", hw.appContext);

        // Load poses
${allPoseInitializations.join("\n")}

        follower.setStartingPose(startPoint);

        buildPaths();

        addCommands(
${commands.join(",\n")}
        );
    }

    public void buildPaths() {
        ${pathBuilders}
    }
}
`;

  try {
    const formattedCode = await prettier.format(sequentialCommandCode, {
      parser: "java",
      plugins: [prettierJavaPlugin],
    });
    return formattedCode;
  } catch (error) {
    console.error("Code formatting error:", error);
    return sequentialCommandCode;
  }
}
