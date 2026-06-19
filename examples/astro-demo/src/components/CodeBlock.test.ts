import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import CodeBlock from "./CodeBlock.astro";

describe("CodeBlock", () => {
  it("renders a titled code panel with the requested language", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CodeBlock, {
      props: {
        title: "src/templates/index.flow",
        language: "flow",
      },
      slots: {
        default: "<main>{{ ctx.title }}</main>",
      },
    });

    expect(html).toContain("<and-card");
    expect(html).toContain("src/templates/index.flow");
    expect(html).toContain("flow");
    expect(html).toContain("<main>{{ ctx.title }}</main>");
  });
});
