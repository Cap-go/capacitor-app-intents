# App Intents example app

Capacitor example for `@capgo/capacitor-app-intents`.

## Setup

```bash
bun install
bun run build
bunx cap sync
```

## Siri shortcuts

1. Edit `app-shortcuts.config.json`.
2. From the example app directory:

```bash
bun run generate:shortcuts
```

3. Copy `ios-shortcuts/CapgoGeneratedAppShortcuts.swift` into `ios/App/App/` and add it to the **App** target in Xcode.
4. Rebuild the iOS app.

## iOS lifecycle

Forward SceneDelegate events with `CapgoAppIntentsLifecycle`. See `../docs/ios-scene-integration.md`.

## Run

```bash
bunx cap run ios
bunx cap run android
```

Test Siri, Shortcuts, Spotlight, and Home Screen quick actions on a physical device or simulator with iOS 16+.
