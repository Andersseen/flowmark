import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import type { Plugin } from "vite";

export interface FlowmarkAstroOptions {
  runtimeImport?: string;
}

interface EmbeddedTemplate {
  source: string;
  contextExpression: string;
  start: number;
  end: number;
}

const VIRTUAL_PREFIX = "virtual:flowmark-astro/";
const RESOLVED_VIRTUAL_PREFIX = "\0" + VIRTUAL_PREFIX;
const workspaceRoot = fileURLToPath(new URL("../../..", import.meta.url));

export default function flowmark(
  options: FlowmarkAstroOptions = {},
): AstroIntegration {
  return {
    name: "@flowmark/astro",
    hooks: {
      "astro:config:setup": ({ updateConfig }) => {
        updateConfig({
          vite: {
            plugins: [flowmarkVitePlugin(options)],
          },
        });
      },
    },
  };
}

function flowmarkVitePlugin(options: FlowmarkAstroOptions): Plugin {
  const runtimeImport = options.runtimeImport ?? "@flowmark/runtime";
  const virtualModules = new Map<string, string>();

  return {
    name: "@flowmark/astro:vite",
    enforce: "pre",

    configResolved(config) {
      const plugins = config.plugins as Plugin[];
      const ownIndex = plugins.findIndex(
        (plugin) => plugin.name === "@flowmark/astro:vite",
      );
      const astroIndex = plugins.findIndex(
        (plugin) => plugin.name === "astro:build",
      );

      if (ownIndex > astroIndex && astroIndex !== -1) {
        const [plugin] = plugins.splice(ownIndex, 1);
        if (plugin) {
          plugins.splice(astroIndex, 0, plugin);
        }
      }
    },

    resolveId(id) {
      if (id.startsWith(VIRTUAL_PREFIX)) {
        return RESOLVED_VIRTUAL_PREFIX + id.slice(VIRTUAL_PREFIX.length);
      }

      return null;
    },

    load(id) {
      if (!id.startsWith(RESOLVED_VIRTUAL_PREFIX)) {
        return null;
      }

      const publicId =
        VIRTUAL_PREFIX + id.slice(RESOLVED_VIRTUAL_PREFIX.length);
      const source = virtualModules.get(publicId);

      if (source === undefined) {
        throw new Error(`Missing Flowmark virtual module: ${publicId}`);
      }

      return compileFlowmark(source, {
        filename: publicId,
        runtimeImport,
      });
    },

    transform(code, id) {
      const cleanId = stripQuery(id);

      if (cleanId.endsWith(".flow")) {
        return {
          code: compileFlowmark(code, {
            filename: cleanId,
            runtimeImport,
          }),
          map: null,
        };
      }

      if (!cleanId.endsWith(".astro") || !code.includes("flowmark")) {
        return null;
      }

      const result = transformAstroSource(code, cleanId, virtualModules);
      if (result === null) {
        return null;
      }

      return {
        code: result,
        map: null,
      };
    },
  };
}

function transformAstroSource(
  code: string,
  filename: string,
  virtualModules: Map<string, string>,
): string | null {
  const templates = findEmbeddedTemplates(code);

  if (templates.length === 0) {
    return null;
  }

  const hash = createHash("sha256").update(filename).digest("hex").slice(0, 12);
  const imports: string[] = [];
  let transformed = "";
  let cursor = 0;

  templates.forEach((template, index) => {
    const renderName = `__flowmarkRender${index}`;
    const virtualId = `${VIRTUAL_PREFIX}${hash}/${index}.js`;
    virtualModules.set(virtualId, template.source);
    imports.push(`import { render as ${renderName} } from "${virtualId}";`);

    transformed += code.slice(cursor, template.start);
    transformed += `<Fragment set:html={${renderName}(${template.contextExpression})} />`;
    cursor = template.end;
  });

  transformed += code.slice(cursor);

  return injectFrontmatter(transformed, imports.join("\n"));
}

function findEmbeddedTemplates(code: string): EmbeddedTemplate[] {
  const templates: EmbeddedTemplate[] = [];
  let cursor = 0;

  while (cursor < code.length) {
    const openStart = code.indexOf("<template", cursor);
    if (openStart === -1) {
      break;
    }

    const openEnd = findTagEnd(code, openStart);
    if (openEnd === -1) {
      break;
    }

    const openTag = code.slice(openStart, openEnd + 1);
    if (!hasBooleanAttribute(openTag, "flowmark")) {
      cursor = openEnd + 1;
      continue;
    }

    const contextExpression = readBracedAttribute(openTag, "context");
    if (contextExpression === null) {
      throw new Error(
        "Flowmark embedded templates require a context={...} attribute.",
      );
    }

    const closeStart = code.indexOf("</template>", openEnd + 1);
    if (closeStart === -1) {
      throw new Error("Flowmark embedded template is missing </template>.");
    }

    const closeEnd = closeStart + "</template>".length;
    templates.push({
      source: code.slice(openEnd + 1, closeStart),
      contextExpression,
      start: openStart,
      end: closeEnd,
    });
    cursor = closeEnd;
  }

  return templates;
}

function findTagEnd(code: string, start: number): number {
  let quote: string | null = null;
  let braceDepth = 0;

  for (let index = start; index < code.length; index += 1) {
    const character = code[index];

    if (quote !== null) {
      if (character === "\\") {
        index += 1;
        continue;
      }

      if (character === quote) {
        quote = null;
      }

      continue;
    }

    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }

    if (character === "{") {
      braceDepth += 1;
      continue;
    }

    if (character === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }

    if (character === ">" && braceDepth === 0) {
      return index;
    }
  }

  return -1;
}

function hasBooleanAttribute(tag: string, name: string): boolean {
  const pattern = new RegExp(`(?:^|\\s)${name}(?:\\s|=|>|$)`);
  return pattern.test(tag);
}

function readBracedAttribute(tag: string, name: string): string | null {
  const attributeStart = tag.search(new RegExp(`(?:^|\\s)${name}\\s*=\\s*\\{`));
  if (attributeStart === -1) {
    return null;
  }

  const equalsIndex = tag.indexOf("=", attributeStart);
  const braceStart = tag.indexOf("{", equalsIndex);
  let depth = 0;
  let quote: string | null = null;

  for (let index = braceStart; index < tag.length; index += 1) {
    const character = tag[index];

    if (quote !== null) {
      if (character === "\\") {
        index += 1;
        continue;
      }

      if (character === quote) {
        quote = null;
      }

      continue;
    }

    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }

    if (character === "{") {
      depth += 1;
      continue;
    }

    if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return tag.slice(braceStart + 1, index).trim();
      }
    }
  }

  throw new Error(`Unclosed ${name}={...} attribute in Flowmark template.`);
}

function injectFrontmatter(code: string, content: string): string {
  if (code.startsWith("---")) {
    const closingFence = code.indexOf("\n---", 3);

    if (closingFence !== -1) {
      return `${code.slice(0, closingFence)}\n${content}${code.slice(closingFence)}`;
    }
  }

  return `---\n${content}\n---\n\n${code}`;
}

function compileFlowmark(
  source: string,
  options: { filename: string; runtimeImport: string },
): string {
  const templatePath = writeTemplateFile(options.filename, source);

  try {
    return execFileSync(
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
        options.runtimeImport,
      ],
      {
        cwd: workspaceRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
  } catch (error) {
    const message =
      error instanceof Error && "stderr" in error
        ? String((error as Error & { stderr?: Buffer | string }).stderr)
        : String(error);
    throw new Error(
      `Failed to compile Flowmark template ${options.filename}\n${message}`,
    );
  }
}

function writeTemplateFile(filename: string, source: string): string {
  const key = createHash("sha256")
    .update(filename)
    .update(source)
    .digest("hex");
  const directory = join(tmpdir(), "flowmark-astro", key);
  mkdirSync(directory, { recursive: true });

  const extension = extname(filename) || ".flow";
  const templatePath = join(directory, `${basename(filename, extension)}.flow`);
  writeFileSync(templatePath, source);

  return templatePath;
}

function stripQuery(id: string): string {
  return id.split("?", 1)[0] ?? id;
}
