# @capgo/capacitor-app-intents

Ship Siri phrases, Shortcuts, Spotlight search, Home Screen quick actions, and App Intents backed entity parameters in Capacitor apps without rebuilding your web layer for every action.

<a href="https://capgo.app/?ref=plugin_app_intents"><img src="https://capgo.app/readme-banner.svg?repo=Cap-go/capacitor-app-intents" alt="Capgo" /></a>

## Key features

- **JavaScript dispatch bridge**: generic `CapgoDispatchAppIntent` plus `CapgoAppIntentsBridge` for custom Swift intents.
- **Pending queue**: cold start safe storage with `getPendingInvocations()`, `removePendingInvocation()`, `appIntentInvoked`, cap 100.
- **Entity catalogs**: `setEntityCatalog()` powers `CapgoCatalogEntity` and `EntityQuery` for Siri parameters.
- **Spotlight**: `indexSpotlightEntities()` and `removeSpotlightEntities()` using `CSSearchableItem`.
- **Quick actions**: `setHomeScreenShortcutItems()` maps to `UIApplicationShortcutItem`.
- **Apple schemas (alpha)**: `performAppleSchemaTemplate()` queues JS handlers. Native Mail schema intents are not available to third party apps yet.
- **Platforms**: iOS 16 and later. Android and web reject with a clear error.

## Compatibility

| Plugin version | Capacitor | Maintained |
| -------------- | --------- | ---------- |
| v0.x           | v8.x      | Yes        |

## Install

```bash
bun add @capgo/capacitor-app-intents
bunx cap sync
```

## Configuration

```ts
// capacitor.config.ts
plugins: {
  CapgoAppIntents: {
    appGroupId: 'group.your.app', // optional, shared with extensions
    spotlightDomainIdentifier: 'your.app.bundle', // optional
  },
},
```

## Handle invocations

```ts
import {
  CapgoAppIntents,
  drainPendingInvocations,
} from '@capgo/capacitor-app-intents';

await drainPendingInvocations(async (invocation) => {
  console.log(invocation.name, invocation.params);
});

await CapgoAppIntents.addListener('appIntentInvoked', async (event) => {
  await CapgoAppIntents.removePendingInvocation({ id: event.invocation.id });
});
```

## Custom Swift intents

Add Swift files to your iOS app target (see `docs/ExampleCustomIntent.swift`). Call `CapgoAppIntentsBridge.shared.enqueue(name:params:source:)` from `perform()`.

The plugin ships `CapgoAppShortcutsProvider` and `CapgoDispatchAppIntent`. Register phrases from JavaScript with `setShortcutDefinitions()` then `refreshShortcuts()`.

## Entity catalog

```ts
await CapgoAppIntents.setEntityCatalog({
  type: 'dish',
  entries: [
    { id: 'pasta', title: 'Pasta', subtitle: 'Special' },
  ],
});
```

Use `CapgoCatalogEntity` in custom intents or the built in dispatch intent `catalogItem` parameter.

## Spotlight

```ts
await CapgoAppIntents.indexSpotlightEntities({
  entities: [
    {
      id: 'dish-pasta',
      title: 'Pasta',
      actionName: 'openDish',
      params: { dishId: 'pasta' },
    },
  ],
});
```

Taps enqueue the same pending queue with `source: 'spotlight'`.

## Home Screen quick actions

```ts
await CapgoAppIntents.setHomeScreenShortcutItems({
  items: [
    {
      type: 'lastOrder',
      title: 'Last order',
      iconName: 'clock',
      params: { screen: 'orders' },
    },
  ],
});
```

## Apple schemas (alpha)

| Template            | Status | Notes |
| ------------------- | ------ | ----- |
| `mail_create_draft` | Alpha  | Queues `appleSchemaMailCreateDraft` in JS. No public native Mail schema API for third party apps. |

Skipped: schemas that cannot be built with public APIs only (App Store 2.5.2 safe).

## API

See `dist/docs.json` from `npm run docgen` or the TypeScript definitions in `src/definitions.ts`.

| Method | Description |
| ------ | ----------- |
| `getPendingInvocations()` | Read the native queue |
| `removePendingInvocation({ id })` | Acknowledge one invocation |
| `setEntityCatalog({ type, entries })` | Persist catalog rows |
| `setShortcutDefinitions({ shortcuts })` | Store shortcut metadata |
| `refreshShortcuts()` | Refresh donated shortcuts (iOS 16.4+) |
| `setHomeScreenShortcutItems({ items })` | Apply quick actions |
| `indexSpotlightEntities({ entities })` | Index Spotlight |
| `removeSpotlightEntities({ ids })` | Delete Spotlight ids |
| `performAppleSchemaTemplate({ template, params })` | Alpha schema helper |
| `addListener('appIntentInvoked', ...)` | Live invocations |
| `getPluginVersion()` | Native version |

## Example app

```bash
npm run example:build
cd example-app
bunx cap sync ios
```

## Docs

Website page draft: `docs/app-intents.md`

## License

MPL-2.0
