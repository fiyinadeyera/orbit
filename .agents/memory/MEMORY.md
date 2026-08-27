# Memory Index

- [Orbit capture architecture](orbit-capture-architecture.md) — two-step extract/confirm capture split and voice-first UI; keep future capture changes consistent with this shape.
- [pnpm workspace lib importing react directly](pnpm-lib-needs-react-devdep.md) — a lib package with only `react` as peerDependency fails `tsc --build` with "Cannot find module 'react'" if it imports react directly.
- [Expo artifact package installs](expo-artifact-pnpm-install.md) — add deps directly to the artifact's package.json + `pnpm install --filter <pkg>`; the generic package installer errors on this monorepo layout.
- [react-native-web Alert.alert is a no-op](rn-web-alert-noop.md) — confirm dialogs silently do nothing on the Expo web target; branch on `Platform.OS === 'web'` to use `window.confirm`.
