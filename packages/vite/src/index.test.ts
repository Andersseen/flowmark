import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compileFlowmark } from "./index";

const compilerPath = fileURLToPath(
  new URL("../../../target/debug/flowmark", import.meta.url),
);

describe("compileFlowmark", () => {
  it("compiles stdin without temporary files", () => {
    const code = compileFlowmark("<p>Hello {{ ctx.name }}</p>", {
      filename: "greeting.flow",
      runtimeImport: "@flowmark/runtime",
      compilerPath,
    });

    expect(code).toContain("output += '<p>Hello ';");
    expect(code).toContain("renderValue(ctx.name)");
  });

  it("preserves display filenames and line offsets in diagnostics", () => {
    expect(() =>
      compileFlowmark("@if () { <p>Invalid</p> }", {
        filename: "component.astro",
        lineOffset: 11,
        runtimeImport: "@flowmark/runtime",
        compilerPath,
      }),
    ).toThrow(/component\.astro:12:\d+: error: Expression cannot be empty/);
  });
});
