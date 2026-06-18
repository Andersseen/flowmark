# Security Policy

Flowmark is an early-stage compiler project. Please report security issues
privately before opening public issues.

## Supported Versions

The project has not reached a stable release yet. Security fixes target the
default branch until a release policy exists.

## Reporting a Vulnerability

Please include:

- A short description of the issue
- A minimal reproduction
- The affected package or crate
- Any known impact or workaround

Do not include exploit details in public issues until the vulnerability has
been reviewed.

## Template Trust Model

`.flow` templates are trusted source code. Flowmark preserves expressions as
JavaScript source strings in generated render functions. Do not compile
user-submitted templates unless you sandbox the generated code yourself.

Values interpolated from `ctx` are escaped by default through the runtime
helpers.
