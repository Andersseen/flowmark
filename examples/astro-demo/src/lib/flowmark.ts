import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

type RenderFunction = (ctx: Record<string, unknown>) => string;

export interface CompiledFlowmarkTemplate {
  code: string;
  render: RenderFunction;
}

const runtimeSource = `
export function escapeHtml(value) {
  if (value === null || value === undefined || value === false) return "";
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

export function renderValue(value) {
  return escapeHtml(value);
}
`;

const runtimeImport = `data:text/javascript,${encodeURIComponent(runtimeSource)}`;
const workspaceRoot = fileURLToPath(new URL("../../../..", import.meta.url));
const cache = new Map<string, Promise<CompiledFlowmarkTemplate>>();

export function compileFlowmarkTemplate(
  template: string,
): Promise<CompiledFlowmarkTemplate> {
  const key = createHash("sha256").update(template).digest("hex");
  const cached = cache.get(key);

  if (cached) {
    return cached;
  }

  const compilation = compileTemplate(key, template);
  cache.set(key, compilation);
  return compilation;
}

export async function renderInlineFlowmark(
  template: string,
  context: Record<string, unknown>,
): Promise<string> {
  const { render } = await compileFlowmarkTemplate(template);
  return render(context);
}

async function compileTemplate(
  key: string,
  template: string,
): Promise<CompiledFlowmarkTemplate> {
  const templatePath = writeTemplateFile(key, template);
  const code = execFileSync(
    "cargo",
    [
      "run",
      "-p",
      "flowmark-cli",
      "--quiet",
      "--",
      "compile",
      templatePath,
      "--runtime",
      runtimeImport,
    ],
    {
      cwd: workspaceRoot,
      encoding: "utf8",
    },
  );

  const moduleUrl = `data:text/javascript,${encodeURIComponent(code)}`;
  const module = (await import(moduleUrl)) as { render: RenderFunction };

  return {
    code,
    render: module.render,
  };
}

function writeTemplateFile(key: string, template: string): string {
  const directory = join(tmpdir(), "flowmark-astro-demo", key);
  mkdirSync(directory, { recursive: true });

  const templatePath = join(directory, "template.flow");
  writeFileSync(templatePath, template);

  return templatePath;
}
