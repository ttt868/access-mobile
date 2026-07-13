---
name: react-native Alert.alert is a no-op on web
description: Confirmation dialogs (e.g. sign-out) silently do nothing when the same Expo app is previewed/run on web.
---

`Alert.alert(...)` from `react-native` never shows anything on web (react-native-web has no native
dialog host) — its buttons/callbacks simply never fire. Any confirm-before-action flow (sign out,
delete, discard changes) must branch on `Platform.OS === 'web'` and use `window.confirm(...)` there,
falling back to `Alert.alert` on native.

**Why:** a real bug report ("the sign-out button does nothing") traced back to this — the actual
`logout()` call was correct, it was just wrapped in an `Alert.alert` confirmation that never
resolved on the web preview.

**How to apply:** any Expo/React Native app that is also tested through the web preview needs a
tiny platform-aware confirm helper instead of calling `Alert.alert` directly for destructive/confirm
actions.
