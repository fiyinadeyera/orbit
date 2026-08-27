# Memory Index

- [Orbit capture architecture](orbit-capture-architecture.md) — two-step extract/confirm capture split and voice-first UI; keep future capture changes consistent with this shape.
- [pnpm workspace lib importing react directly](pnpm-lib-needs-react-devdep.md) — a lib package with only `react` as peerDependency fails `tsc --build` with "Cannot find module 'react'" if it imports react directly.
