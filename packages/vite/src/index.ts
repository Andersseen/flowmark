import { execFileSync } from "node:child_process";
import type { Plugin } from "vite";

export interface FlowmarkViteOptions {
  runtimeImport?: string;
  /** Path to the prebuilt `flowmark` CLI. Defaults to `flowmark` on PATH. */
  compilerPath?: string;
}

export interface FlowmarkCompileRequest {
  filename: string;
  lineOffset?: number;
  runtimeImport: string;
  compilerPath: string;
}

export default function flowmark(options: FlowmarkViteOptions = {}): Plugin {
  const runtimeImport = options.runtimeImport ?? "@flowmark/runtime";
  const compilerPath = options.compilerPath ?? "flowmark";

  return {
    name: "@flowmark/vite",
    enforce: "pre",

    transform(code, id) {
      const filename = stripQuery(id);
      if (!filename.endsWith(".flow")) return null;

      return {
        code: compileFlowmark(code, {
          filename,
          runtimeImport,
          compilerPath,
        }),
        map: null,
      };
    },
  };
}

export function compileFlowmark(
  source: string,
  request: FlowmarkCompileRequest,
): string {
  try {
    return execFileSync(
      request.compilerPath,
      [
        "compile",
        "-",
        "--runtime",
        request.runtimeImport,
        "--display-name",
        request.filename,
        "--line-offset",
        String(request.lineOffset ?? 0),
      ],
      {
        encoding: "utf8",
        input: source,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
  } catch (error) {
    const message =
      error instanceof Error && "stderr" in error
        ? String((error as Error & { stderr?: Buffer | string }).stderr)
        : String(error);
    throw new Error(
      `Failed to compile Flowmark template ${request.filename}\n${message}`,
    );
  }
}

function stripQuery(id: string): string {
  return id.split("?", 1)[0] ?? id;
}
