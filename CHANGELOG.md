# Changelog

All notable changes to Flowmark will be documented in this file.

This project does not have a stable release yet.

## Unreleased

- Preserved template whitespace exactly instead of collapsing individual text nodes.
- Hardened interpolation escaping for unquoted HTML attributes and documented
  context-specific security limits.
- Added validation for loop bindings and empty expressions.
- Added stdin compilation and display-name/line-offset diagnostics to the CLI.
- Removed `cargo run` and temporary-file compilation from the Astro integration.
- Added content-addressed virtual modules for reliable Astro development updates.
- Added the `@flowmark/vite` package and a tested standalone `.flow` import path.
- Added a Rust compiler crate for `.flow` templates.
- Added a CLI for compiling templates to JavaScript render functions.
- Added a small TypeScript runtime for escaped interpolation.
- Added support for `@if`, `@else if`, `@else`, `@for`, `@empty`, and `@switch`.
- Added an Astro demo using Andersseen Web Components and Tailwind CSS.
