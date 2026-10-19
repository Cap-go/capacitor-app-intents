# App Intents plugin

Route Siri, Shortcuts, Spotlight, and Home Screen quick actions into your Capacitor JavaScript with a durable pending queue for cold starts.

## Install

```bash
bun add @capgo/capacitor-app-intents
bunx cap sync
```

## Siri phrases

Phrases and shortcut icons are compile time Swift literals. Use `npm run generate:shortcuts` with `app-shortcuts.config.json`. See the plugin README.

## Spotlight

`indexSpotlightEntities` uses Core Spotlight on iOS 16+. On iOS 18+ it also donates `IndexedEntity` values.

## Mail schema

`performAppleSchemaTemplate` with `mail_create_draft` only queues `appleSchemaMailCreateDraft` for JavaScript. It does not call Mail APIs. The mail template path requires iOS 18 or later when Apple exposes the underlying schema APIs; on earlier iOS versions use your own compose UI.
