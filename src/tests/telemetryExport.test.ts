// Copyright 2026 Matthew Allen. Licensed under the Apache License, Version 2.0.
import { describe, it, expect } from "vitest";
import {
  generateJavaCode,
  generateSequentialCommandCode,
} from "../utils/codeExporter";
import type { Point, Line } from "../types";

describe("generateJavaCode Telemetry Logic", () => {
  const startPoint: Point = {
    x: 0,
    y: 0,
    heading: "constant",
    degrees: 0,
  };
  const lines: Line[] = [
    {
      endPoint: { x: 10, y: 10, heading: "constant", degrees: 0 },
      controlPoints: [],
      color: "#000000",
    },
  ];

  it("should generate Panels telemetry by default", async () => {
    const code = await generateJavaCode(startPoint, lines, true, []);
    expect(code).toContain(
      "import com.bylazar.telemetry.TelemetryManager;",
    );
    expect(code).toContain("panelsTelemetry.update(telemetry);");
  });

  it("should generate Panels telemetry when explicitly requested", async () => {
    const code = await generateJavaCode(
      startPoint,
      lines,
      true,
      [],
      "org.test",
      "Panels",
    );
    expect(code).toContain(
      "import com.bylazar.telemetry.TelemetryManager;",
    );
    expect(code).toContain("panelsTelemetry.update(telemetry);");
  });

  it("should generate Dashboard telemetry when requested", async () => {
    const code = await generateJavaCode(
      startPoint,
      lines,
      true,
      [],
      "org.test",
      "Dashboard",
    );
    expect(code).toContain("import com.acmerobotics.dashboard.FtcDashboard;");
    expect(code).toContain("telemetryA = new MultipleTelemetry(");
    expect(code).toContain("this.telemetry");
    expect(code).toContain("FtcDashboard.getInstance().getTelemetry()");
    expect(code).toContain("telemetryA.update();");
    expect(code).not.toContain("panelsTelemetry");
  });

  it("should generate Standard telemetry when requested", async () => {
    const code = await generateJavaCode(
      startPoint,
      lines,
      true,
      [],
      "org.test",
      "Standard",
    );
    expect(code).toContain('telemetry.addData("Status", "Initialized");');
    expect(code).toContain("telemetry.update();");
    expect(code).not.toContain("panelsTelemetry");
    expect(code).not.toContain("FtcDashboard");
  });

  it("should generate no telemetry when requested", async () => {
    const code = await generateJavaCode(
      startPoint,
      lines,
      true,
      [],
      "org.test",
      "None",
    );
    expect(code).not.toContain("panelsTelemetry");
    expect(code).not.toContain("FtcDashboard");
    expect(code).not.toContain('telemetry.addData("Status"');
  });
});

describe("generateSequentialCommandCode Telemetry Logic", () => {
  const startPoint: Point = {
    x: 0,
    y: 0,
    heading: "constant",
    degrees: 0,
  };
  const lines: Line[] = [];

  it("should generate Panels telemetry (proxy) by default", async () => {
    const code = await generateSequentialCommandCode(
      startPoint,
      lines,
      null,
      [],
      "SolversLib",
    );
    expect(code).toContain("import com.bylazar.telemetry.TelemetryManager;");
    expect(code).toContain("import java.lang.reflect.Proxy;");
    expect(code).toContain("Proxy.newProxyInstance");
    expect(code).toContain("PanelsTelemetry.INSTANCE.getTelemetry().debug");
  });

  it("should generate Dashboard telemetry (MultipleTelemetry) when requested", async () => {
    const code = await generateSequentialCommandCode(
      startPoint,
      lines,
      null,
      [],
      "SolversLib",
      "org.test",
      "Dashboard",
    );
    expect(code).toContain("import com.acmerobotics.dashboard.FtcDashboard;");
    expect(code).toContain("Telemetry telemetryToUse = new MultipleTelemetry(");
    expect(code).toContain("FtcDashboard.getInstance().getTelemetry()");
  });

  it("should generate Standard telemetry (no wrapper) when requested", async () => {
    const code = await generateSequentialCommandCode(
      startPoint,
      lines,
      null,
      [],
      "SolversLib",
      "org.test",
      "Standard",
    );
    expect(code).toContain("Telemetry telemetryToUse = telemetry;");
    expect(code).not.toContain("PanelsTelemetry");
    expect(code).not.toContain("MultipleTelemetry");
  });

  it("should generate no special telemetry when 'None' is requested (same as standard/default fallback behavior in sequential)", async () => {
    // Note: Sequential currently treats 'None' same as Standard in the wrapper variable,
    // as it just passes 'telemetry' through.
    const code = await generateSequentialCommandCode(
      startPoint,
      lines,
      null,
      [],
      "SolversLib",
      "org.test",
      "None",
    );
    expect(code).toContain("Telemetry telemetryToUse = telemetry;");
    expect(code).not.toContain("PanelsTelemetry");
    expect(code).not.toContain("MultipleTelemetry");
  });
});
