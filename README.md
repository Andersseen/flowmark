# Flowmark

A small experimental compiler toolkit for standalone HTML-like templates with modern control-flow syntax.

The long-term idea is to compile templates such as `{{ expression }}`, `@if`, `@for`, and `@switch` into JavaScript render functions with safe HTML escaping by default. It is inspired by Angular's modern control flow syntax, but it is independent from Angular and does not depend on any UI framework.

## What This Is

- A Rust template compiler crate.
- A Rust CLI for compiling template files.
- A tiny TypeScript runtime package for HTML escaping and render-value helpers.
- A monorepo foundation that is intentionally small and easy to extend.

## What This Is Not

- Not a framework.
- Not an Angular, React, Astro, or Hono integration.
- Not a hydration runtime.
- Not a directive, DI, signals, pipes, or event compiler.

## Current Scope

The compiler currently exposes:

```rust
compile(source: &str) -> Result<CompileOutput, Vec<Diagnostic>>
```

For now it parses into a placeholder template node and emits a minimal JavaScript render function. The files are split into `ast`, `parser`, `codegen`, and `diagnostics` modules so the real compiler can grow in place.

The TypeScript runtime exports:

```ts
escapeHtml(value: unknown): string
renderValue(value: unknown): string
```

## Future Scope

- HTML-like template parsing.
- `{{ expression }}` interpolation.
- `@if`, `@else if`, and `@else`.
- `@for` and `@empty`.
- `@switch`, `@case`, and `@default`.
- Safe HTML escaping by default.
- JavaScript render-function output.

## Run The CLI

Build the Rust workspace:

```sh
pnpm run build:rust
```

Compile the example template:

```sh
cargo run -p flowmark-cli -- examples/basic/products.view
```

## Build

Build everything:

```sh
pnpm run build
```

Build Rust only:

```sh
pnpm run build:rust
```

Build the TypeScript runtime only:

```sh
pnpm run build:runtime
```

Run Rust tests:

```sh
pnpm run test:rust
```

Format Rust code:

```sh
pnpm run format
```
