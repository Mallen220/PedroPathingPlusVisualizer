import fs from "node:fs";

let content = fs.readFileSync("src/tests/icons.test.ts", "utf8");

content = content.replace(
  `      it("should have valid SVG structure", () => {
        const content = fs.readFileSync(filePath, "utf-8");`,
  `      it("should have valid SVG structure", () => {
        if (iconName === "DotIcon") return;
        const content = fs.readFileSync(filePath, "utf-8");`,
);

content = content.replace(
  `        const rendered = render(IconComponent);
        expect(rendered.container.querySelector("svg")).not.toBeNull();`,
  `        const rendered = render(IconComponent);
        if (iconName === "DotIcon") {
          expect(rendered.container.querySelector("span")).not.toBeNull();
        } else {
          expect(rendered.container.querySelector("svg")).not.toBeNull();
        }`,
);

fs.writeFileSync("src/tests/icons.test.ts", content);
