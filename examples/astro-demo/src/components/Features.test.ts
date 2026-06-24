import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Features from "./Features.astro";

describe("Features", () => {
  it("renders feature cards", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Features, {
      props: {
        context: {
          items: [
            {
              id: "a",
              title: "Modern control flow",
              description: "Write @if and @for blocks.",
              badge: "@if @for",
            },
            {
              id: "b",
              title: "Rust compiler",
              description: "Compiled to plain JavaScript.",
            },
          ],
        },
      },
    });

    expect(html).toContain("Modern control flow");
    expect(html).toContain("Write @if and @for blocks.");
    expect(html).toContain("@if @for");
    expect(html).toContain("Rust compiler");
    expect(html).toContain("Compiled to plain JavaScript.");
  });

  it("escapes interpolated HTML in feature content", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Features, {
      props: {
        context: {
          items: [
            {
              id: "xss",
              title: "Safe by default",
              description: '<script>alert("xss")</script>',
            },
          ],
        },
      },
    });

    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain('<script>alert("xss")</script>');
  });
});
