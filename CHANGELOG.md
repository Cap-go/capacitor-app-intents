# Changelog

## Unreleased

- Typed intent codegen: use `Summary { \.$param }` for the Xcode 26 SDK; in a mixed config (iOS 16 `CapgoDispatchAppIntent` shortcuts plus iOS 17 tool intents), the generator keeps one `AppShortcutsProvider` at iOS 16 with dispatch phrases only, prints a CLI warning, and emits `#warning` for omitted tool Siri phrases (raise deployment target to iOS 17 or use a dispatch shortcut for the phrase).

## 8.0.0

- Align plugin version with Capacitor 8.
- Early app group configuration for App Intent cold starts.
- Capacitor 8 SceneDelegate lifecycle helpers.
- Spotlight mapping batching and removal fixes.

## 0.1.0

- Initial release with iOS App Intents bridge, pending queue, entity catalogs, Spotlight, quick actions, and alpha Apple schema template hook.
