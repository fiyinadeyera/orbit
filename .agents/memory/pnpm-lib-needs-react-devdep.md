---
name: pnpm workspace lib needs react as devDependency to typecheck
description: A workspace lib package that imports "react" directly (not just its types) fails tsc project-reference builds unless react is also a devDependency, even with a peerDependency declared.
---

A `lib/*` package whose `package.json` only lists `react` under `peerDependencies` (the correct choice for a library consumed by an app) will fail `pnpm -w run typecheck:libs` / `tsc --build` with `error TS2307: Cannot find module 'react'` if any of its own source files `import ... from "react"` directly.

**Why:** pnpm's isolated `node_modules` only resolves packages that are actual dependencies (or devDependencies) of that specific package — a peerDependency alone isn't installed into the package's own resolution scope, so TypeScript can't find it when typechecking that package in isolation (project references build each package independently).

**How to apply:** when a workspace lib both declares `react` as a peerDependency (for the real app to satisfy) *and* imports `react` directly in its own source (e.g. a hooks package), also add `"react": "catalog:"` and `"@types/react": "catalog:"` under `devDependencies` in that package's `package.json`, then `pnpm install`. Packages that only re-export from something like `@tanstack/react-query` without importing `react` themselves don't hit this.
