# Flowmark Repository Context

> This file captures the key facts discovered during codebase analysis so future sessions do not need to re-analyze the repository from scratch.

---

## Project overview

Flowmark is a framework-agnostic template language with modern control-flow syntax (`@if`, `@for`, `@switch`). It is built as:

- A Rust compiler (`flowmark-compiler`) that parses Flowmark templates and emits plain JavaScript.
- A tiny TypeScript runtime (`@flowmark/runtime`) that handles HTML escaping.
- A Vite plugin (`@flowmark/vite`) for standalone `.flow` files.
- An Astro integration (`@flowmark/astro`) for embedded `<template flowmark>` regions inside `.astro` files.

The demo app lives in `examples/astro-demo/` and currently renders an inventory dashboard using Flowmark syntax.

---

## Repository structure

```
flowmark/
├── crates/
│   ├── flowmark-cli/          # Rust CLI
│   └── flowmark-compiler/     # Rust compiler core
├── docs/
│   └── flowmark-spec.md       # Language specification
├── examples/
│   ├── astro-demo/            # Astro demo (target for landing page)
│   └── basic/                 # Basic standalone examples
├── packages/
│   ├── astro/                 # @flowmark/astro integration
│   ├── runtime/               # @flowmark/runtime
│   ├── vite/                  # @flowmark/vite plugin
│   └── vscode-flowmark/       # VS Code extension
├── .github/workflows/         # CI/CD
├── Cargo.toml                 # Rust workspace
├── package.json               # Node workspace root
└── pnpm-workspace.yaml
```

---

## Demo app: `examples/astro-demo/`

### Current pages
- `src/pages/index.astro` — main inventory dashboard.
- `src/pages/attention.astro` — low-stock filtered view.
- `src/pages/empty.astro` — empty state example.
- `src/pages/inline.astro` — minimal inline Flowmark example.
- `src/pages/security.astro` — HTML escaping/whitespace tests.

### Key files
- `src/components/DemoPage.astro` — large monolithic component (~224 lines) used by all pages.
- `src/components/CodeBlock.astro` — code display card.
- `src/layouts/Layout.astro` — base layout with navigation, footer, and web component registration.
- `src/data/context.ts` — demo data (products, store, notes).
- `src/scripts/web-components.ts` — registers Andersseen custom elements.
- `src/styles/global.css` — Tailwind CSS 4 + slate-amber theme + utilities.
- `e2e/demo.spec.ts` — Playwright E2E tests.
- `src/components/CodeBlock.test.ts` and `src/layouts/Layout.test.ts` — Astro Container tests.

### Dependencies
- `astro@^5.7.10`
- `@flowmark/astro` (workspace)
- `@flowmark/runtime` (workspace)
- `@andersseen/layout@^0.0.1`
- `@andersseen/motion@^0.1.1`
- `@andersseen/web-components@^0.0.8`
- `tailwindcss@^4.3.1` + `@tailwindcss/vite@^4.3.1`

### How Flowmark is used in the demo
Templates are written inside `.astro` files like this:

```astro
<!-- prettier-ignore -->
<template flowmark is:raw context={context}>
  <h1>{{ context.store.name }}</h1>
  @for (product of context.products; track product.id) {
    <article>
      <h2>{{ product.title }}</h2>
      @if (product.inStock) {
        <span>In stock</span>
      } @else {
        <span>Out of stock</span>
      }
    </article>
  } @empty {
    <p>No products found</p>
  }
</template>
```

The Astro integration:
1. Parses `.astro` files with `@astrojs/compiler`.
2. Finds `<template flowmark>` regions.
3. Extracts the Flowmark source and `context={...}` expression.
4. Generates a virtual module `virtual:flowmark-astro/<hash>/<index>-<hash>.js`.
5. Compiles the template using the Rust CLI via `@flowmark/vite`.
6. Replaces the `<template>` with:

```astro
<Fragment set:html={__flowmarkRender0(context)} />
```

---

## Compiler and CLI

### Input / Output
- **Input**: Flowmark template source (`.flow` file or inline region).
- **Output**: ES module JavaScript:

```js
import { renderValue } from '@flowmark/runtime';

export function render(context) {
  let output = '';
  // generated body
  return output;
}
```

### Supported syntax

| Construct | Syntax |
|-----------|--------|
| Text / HTML | `<main><h1>Title</h1></main>` |
| Interpolation | `{{ context.title }}` |
| Conditional | `@if (cond) { ... } @else if (cond) { ... } @else { ... }` |
| Iteration | `@for (item of items; track item.id) { ... } @empty { ... }` |
| Switch | `@switch (expr) { @case ('a') { ... } @default { ... } }` |
| Literal escape | `\@if`, `\{{`, `\}` |

### Compiler structure
- `crates/flowmark-compiler/src/lib.rs` — public API: `compile(source, options)`.
- `crates/flowmark-compiler/src/ast.rs` — AST definitions.
- `crates/flowmark-compiler/src/parser.rs` — recursive-descent parser.
- `crates/flowmark-compiler/src/codegen.rs` — JavaScript code generation.
- `crates/flowmark-compiler/src/javascript.rs` — JS expression validation with OXC.
- `crates/flowmark-compiler/src/cursor.rs` — source cursor.
- `crates/flowmark-compiler/src/diagnostics.rs` — diagnostics.
- `crates/flowmark-compiler/tests/compiler_tests.rs` — 55 integration tests.
- `crates/flowmark-cli/src/main.rs` — CLI with `clap`.

### CLI usage
```sh
cargo run -p flowmark-cli -- compile examples/basic/for.flow
cargo run -p flowmark-cli -- compile - --runtime "@flowmark/runtime" --display-name inline.flow
```

Flags:
- `input`: `.flow` file or `-` for stdin.
- `--out`: output file.
- `--runtime`: runtime import path (default: `@flowmark/runtime`).
- `--display-name`: name shown in diagnostics.
- `--line-offset`: line offset for diagnostics.
- `--diagnostic-format`: `human` or `json`.

---

## Packages

### `@flowmark/runtime`
Location: `packages/runtime/src/`

- `index.ts` — re-exports + types `RenderContext`, `RenderFunction`.
- `escape-html.ts` — `escapeHtml(value: unknown): string`.
- `render-value.ts` — `renderValue(value: unknown): string`.

Behavior:
- Escapes `& < > " '`.
- `null`, `undefined`, `false` → `""`.
- Numbers, bigint, strings → `String(value)` escaped.

### `@flowmark/astro`
Location: `packages/astro/src/index.ts`

Default export `flowmark()` returns an Astro integration that registers two Vite plugins:
- `@flowmark/vite` — handles `.flow` imports.
- `@flowmark/astro:embedded` — handles inline `<template flowmark>` regions.

Key functions:
- `findEmbeddedTemplates()` — parses Astro AST for templates.
- `findMatchingTemplateClose()` — handles nesting, comments, `<script>`/`<style>`.
- `injectFrontmatter()` — adds imports to existing or new frontmatter.
- `transformAstroSource()` — generates a MagicString with source map.

### `@flowmark/vite`
Location: `packages/vite/src/`

Vite plugin that compiles `.flow` files. Uses a global `compileCache` Map keyed by source + options.

---

## Andersseen libraries usage

### `@andersseen/web-components@^0.0.8`
- Stencil-built web components.
- Imported via loader: `import { defineCustomElements } from "@andersseen/web-components/loader"`.
- Registered in `src/scripts/web-components.ts`.
- Components used: `<and-navbar>`, `<and-card>`, `<and-card-header>`, `<and-card-title>`, `<and-card-description>`, `<and-card-content>`, `<and-badge>`, `<and-button>`.
- Theme CSS imported in `global.css`: `@import "@andersseen/web-components/slate-amber"`.
- The components are prepared for dark and light themes.

### `@andersseen/layout@^0.0.1`
- Pure CSS/SCSS layout and typography library based on HTML attributes.
- Imported in `global.css`: `@import "@andersseen/layout"`.

### `@andersseen/motion@^0.1.1`
- Framework-agnostic animation library.
- Imported in `global.css`: `@import "@andersseen/motion/style.css"`.

Note: these libraries are installed under `examples/astro-demo/node_modules`, not the workspace root.

---

## Specification notes

`docs/flowmark-spec.md` defines:
- Framework-agnostic template language.
- Build-time compilation.
- Trusted template model (templates are authored, not user-generated).
- Supported formats: standalone `.flow` and embedded `<template flowmark>`.
- Roadmap and non-goals (no components, no hydration, no events, no binding, no VDOM).

The spec currently references older package names (`vite-plugin-flowmark`, `astro-flowmark`) and should be synced with the real packages `@flowmark/vite` and `@flowmark/astro`.

---

## Current quality assessment

### Strengths
- Clean architecture: Rust core + TS runtime + Vite/Astro plugins.
- Strong test coverage: 55 Rust tests, runtime/vite/astro tests, demo unit and E2E tests.
- Security by default: HTML escaping, no interpolation in unquoted attributes.
- Well-implemented Astro integration using the official compiler.
- Robust CLI with stdin/file, JSON/human diagnostics, and line offsets.
- Good parser handling of strings, comments, regex, template literals, and whitespace.
- CI/CD with GitHub Actions and Cloudflare Pages deploy.
- Clear README and detailed spec.

### Areas for improvement
- `renderValue` is essentially an alias for `escapeHtml`; names could be unified or `renderValue` extended for arrays/objects.
- `@flowmark/vite` uses a module-global `compileCache` Map; consider per-Vite-instance cache for monorepos.
- Vite tests duplicate escape logic instead of importing from runtime.
- Public APIs lack JSDoc.
- Some parser error messages are generic (`Unexpected token`).
- `DemoPage.astro` is too large and should be split.
- Demo frontmatter contains mixed data logic that should move to `src/data/context.ts`.
- Spec package names are out of sync with actual package names.
- Limited E2E coverage for compiler errors and HMR.

---

## Build and test commands

From the workspace root or `examples/astro-demo/`:

```sh
# Rust tests
cargo test --workspace

# Demo tests
pnpm test

# Demo E2E tests
pnpm run test:e2e

# Astro type check
pnpm run check

# Demo build
pnpm run build

# Compile a .flow file with the Rust CLI
cargo run -p flowmark-cli -- compile examples/basic/for.flow
```

---

## Theming decision

The landing page will support `dark` and `light` modes using the existing Andersseen web components theming support. The implementation should:
- Keep the current `slate-amber` theme import as a base.
- Add a `data-theme` attribute or class on `<html>`/`body>`.
- Use CSS custom properties exposed by `@andersseen/web-components`.
- Stay 100% static for now (no client-side theme toggle JS unless requested later).

---

## Constraints for the landing page

- Keep dependencies minimal.
- Do not add React, Vue, Svelte, or state libraries.
- Use Flowmark templates for all dynamic/static rendering possible.
- Maintain all existing tests and add new ones for new components.
