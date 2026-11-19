# App Intents example app

Capacitor example for `@capgo/capacitor-app-intents` with generated shortcuts, typed tool intents, and `Skills.skillsbundle` wired into the committed iOS target.

## Setup

```bash
cd example-app
bun install
bun run build
```

`prebuild` builds the parent plugin package so Vite can resolve `@capgo/capacitor-app-intents`.

## Regenerate App Intents (optional)

After editing `app-intents.codegen.json`:

```bash
bun run generate:ios-app-intents
bun run sync:ios
```

This writes Swift and `Skills.skillsbundle` under `ios/App/App/`, enforces iOS 16 deployment targets, and refreshes the Xcode project references.

## iOS lifecycle

Forward SceneDelegate events with `CapgoAppIntentsLifecycle`. See `../docs/ios-scene-integration.md`.

## Run

```bash
bunx cap run ios --target "iPhone 16"
bunx cap run android
```

On a Mac, build the example app directly:

```bash
xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  CODE_SIGNING_ALLOWED=NO \
  IPHONEOS_DEPLOYMENT_TARGET=16.0 \
  build
```

Test Siri shortcuts, the pending invocation log, and tool results on Simulator (iOS 16+). App skills validation still requires iOS 27.3 beta hardware with Apple Intelligence.