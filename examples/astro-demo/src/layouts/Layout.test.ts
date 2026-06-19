import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Layout from "./Layout.astro";

describe("Layout", () => {
  it("renders document chrome and registers web components", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Layout, {
      props: {
        title: "Flowmark Test",
        description: "Unit test description",
      },
      slots: {
        default: "<main><h1>Page content</h1></main>",
      },
    });

    expect(html).toContain("<title>Flowmark Test</title>");
    expect(html).toContain(
      'name="description" content="Unit test description"',
    );
    expect(html).toContain("<and-navbar");
    expect(html).toContain("Flowmark");
    expect(html).toContain("Page content");
    expect(html).toContain("Built with Astro, Flowmark, Tailwind 4");
  });
});
