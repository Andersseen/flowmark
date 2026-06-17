import { describe, expect, it } from "vitest";
import { renderValue } from "./render-value";

describe("renderValue", () => {
  it("escapes HTML by default", () => {
    expect(renderValue("<b>bold</b>")).toBe("&lt;b&gt;bold&lt;/b&gt;");
  });

  it("renders null as empty string", () => {
    expect(renderValue(null)).toBe("");
  });

  it("renders undefined as empty string", () => {
    expect(renderValue(undefined)).toBe("");
  });

  it("renders primitive values", () => {
    expect(renderValue(123)).toBe("123");
  });
});
