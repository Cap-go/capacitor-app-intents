# App Intents plugin

Route Siri, Shortcuts, Spotlight, and Home Screen quick actions into your Capacitor JavaScript with a durable pending queue for cold starts.

## Install

```bash
bun add @capgo/capacitor-app-intents
bunx cap sync
```

## iOS setup

1. Target iOS 16 or later.
2. Add an App Group if you use extensions and set `CapgoAppIntents.appGroupId` in `capacitor.config`.
3. Optional: add Swift files in your app target for custom `AppIntent` types. Import the plugin module and call `CapgoAppIntentsBridge.shared.enqueue(name:params:source:)`.

## Handle invocations

```ts
import { CapgoAppIntents, drainPendingInvocations } from '@capgo/capacitor-app-intents';

await drainPendingInvocations(async (invocation) => {
  if (invocation.name === 'orderDish') {
    // route in your app
  }
});

await CapgoAppIntents.addListener('appIntentInvoked', async (event) => {
  // same handler
  await CapgoAppIntents.removePendingInvocation({ id: event.invocation.id });
});
```

## Entity catalogs

```ts
await CapgoAppIntents.setEntityCatalog({
  type: 'dish',
  entries: [{ id: 'pasta', title: 'Pasta' }],
});
```

## Alpha Apple schemas

`performAppleSchemaTemplate` queues JavaScript handlers. Native Mail schema intents are not exposed to third party apps yet. See the plugin README for current templates.
