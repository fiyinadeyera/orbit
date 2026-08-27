---
name: react-native-web Alert.alert is a no-op
description: Why confirm/destructive-action dialogs silently do nothing when an Expo app's web build is tested, and how to fix it.
---

React Native's `Alert.alert(...)` (e.g. for a delete confirmation) does nothing on the Expo web target: `react-native-web`'s `Alert` export is a stub (`class Alert { static alert() {} }`). It works fine on native iOS/Android.

**Why:** react-native-web ships no web implementation of the native modal alert; there is no polyfill by default. A destructive-action button wired only to `Alert.alert` will appear completely broken when tested through a browser/e2e tool, even though it's correct on-device.

**How to apply:** for any confirm-before-destructive-action flow in an Expo app, branch on `Platform.OS === 'web'` and use `window.confirm(...)` (or a custom modal component) there, keeping `Alert.alert` with its button array for native. Worth checking for this proactively before running web-based e2e tests against an Expo app's delete/destroy flows.
