import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import SyntaxShowcase from "./SyntaxShowcase.astro";

describe("SyntaxShowcase", () => {
  it("renders syntax examples and switch badges", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SyntaxShowcase, {
      props: {
        context: {
          examples: [
            {
              id: "for",
              label: "Iteration",
              code: "@for (item of items) { ... }",
              description: "Loop over iterables.",
            },
            {
              id: "if",
              label: "Conditional",
              code: "@if (condition) { ... }",
              description: "Branch on conditions.",
            },
            {
              id: "switch",
              label: "Switch",
              code: "@switch (expr) { ... }",
              description: "Match expressions.",
            },
          ],
        },
      },
    });

    expect(html).toContain("Iteration");
    expect(html).toContain("@for (item of items) { ... }");
    expect(html).toContain("Loop over iterables.");
    expect(html).toContain("Conditional");
    expect(html).toContain("@if (condition) { ... }");
    expect(html).toContain("Switch");
    expect(html).toContain("@switch (expr) { ... }");
    expect(html).toContain("loop");
    expect(html).toContain("branch");
    expect(html).toContain("match");
  });
});
