---
name: Expo artifact package installs in the pnpm monorepo
description: How to add an npm dependency to an Expo artifact when the generic package installer tool fails.
---

Adding a dependency (e.g. a Google Fonts package) to an Expo artifact via the generic `installLanguagePackages`-style tool can fail with `ERR_PNPM_ADDING_TO_ROOT` in this monorepo layout.

**Why:** the installer sometimes resolves against the workspace root instead of the artifact's own package, which pnpm workspaces reject.

**How to apply:** add the dependency directly to `artifacts/<slug>/package.json`, then run `pnpm install --filter @workspace/<slug>` from the workspace root. Verify the exact export names you need (e.g. font weight constants) by checking the installed package's `dist`/type declarations before using them, since font/icon packages often use verbose weight-suffixed export names.
