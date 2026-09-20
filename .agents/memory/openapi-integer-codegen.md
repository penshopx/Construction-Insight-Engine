---
name: OpenAPI integer codegen compatibility
description: Compatibility constraint between the workspace Orval Zod generator and the installed Zod version.
---

Use OpenAPI `number` rather than `integer` for generated API identifiers until the generator and Zod runtime versions are aligned.

**Why:** The current Orval generator emits `zod.int()` for `integer`, but the installed Zod package does not expose that API, causing generated library typechecking to fail.

**How to apply:** For new numeric path parameters and response identifiers, use `number` in the API contract and preserve integer semantics in the database. Revisit this rule after generator or Zod upgrades.