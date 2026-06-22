import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

export interface FlowmarkViteOptions {
  runtimeImport?: string;
  /** Optional path to a custom `flowmark` CLI binary. */
  compilerPath?: string;
}

export interface FlowmarkCompileRequest {
  filename: string;
  lineOffset?: number;
  runtimeImport: string;
  compilerPath?: string;
}

export default function flowmark(options: FlowmarkViteOptions = {}): Plugin {
  const runtimeImport = options.runtimeImport ?? "@flowmark/runtime";
  const compilerPath = resolveCompilerPath(options.compilerPath);

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
  const compilerPath = resolveCompilerPath(request.compilerPath);

  try {
    return execFileSync(
      compilerPath,
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
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      throw new Error(
        `Flowmark compiler was not found at "${compilerPath}". ` +
          "Install the Flowmark CLI, run `cargo build --workspace` in the monorepo, " +
          "or provide compilerPath explicitly.",
      );
    }

    const message =
      error instanceof Error && "stderr" in error
        ? String((error as Error & { stderr?: Buffer | string }).stderr)
        : String(error);
    throw new Error(
      `Failed to compile Flowmark template ${request.filename}\n${message}`,
    );
  }
}

/** Resolve the compiler automatically for normal usage and monorepo development. */
export function resolveCompilerPath(compilerPath?: string): string {
  if (compilerPath) return compilerPath;
  if (process.env.FLOWMARK_COMPILER_PATH) {
    return process.env.FLOWMARK_COMPILER_PATH;
  }

  const executable = process.platform === "win32" ? "flowmark.exe" : "flowmark";
  const workspaceCandidates = [
    fileURLToPath(
      new URL(`../../../target/debug/${executable}`, import.meta.url),
    ),
    fileURLToPath(
      new URL(`../../../target/release/${executable}`, import.meta.url),
    ),
  ];

  return (
    workspaceCandidates.find((candidate) => existsSync(candidate)) ?? executable
  );
}

function stripQuery(id: string): string {
  return id.split("?", 1)[0] ?? id;
}
