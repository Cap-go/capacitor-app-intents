# Changelog

## Unreleased

- Typed intent codegen: use `Summary { \.$param }` for the Xcode 26 SDK; mixed configs default to one `AppShortcutsProvider` at iOS 16 with dispatch phrases only (CLI warning and `#warning` for omitted tool Siri phrases). Set `minimumIOSVersion` to `17` in `app-intents.codegen.json` to emit one `@available(iOS 17.0, *)` provider with every shortcut, or use a dispatch shortcut for the phrase.

## 8.0.0

- Align plugin version with Capacitor 8.
- Early app group configuration for App Intent cold starts.
- Capacitor 8 SceneDelegate lifecycle helpers.
- Spotlight mapping batching and removal fixes.

## 0.1.0

- Initial release with iOS App Intents bridge, pending queue, entity catalogs, Spotlight, quick actions, and alpha Apple schema template hook.
