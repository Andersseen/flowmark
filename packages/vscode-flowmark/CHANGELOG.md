# Change Log

## 0.1.0

- Initial release.
- Syntax highlighting for Flowmark templates (`.flow`).
- Highlighting for interpolations (`{{ ... }}`), control flow (`@if`, `@else if`, `@else`, `@for`, `@empty`, `@switch`, `@case`, `@default`) and JavaScript expressions inside parentheses.
- Support for escaped markers (`\@`, `\{`, `\}`, `\\`).
- Grammar injection for inline Flowmark inside Astro `<template flowmark>` blocks.
- Legacy grammar injection for inline Flowmark inside Astro `<Flowmark is:raw>` blocks.
- Snippets for Flowmark and Astro usage.
