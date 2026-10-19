# @capgo/capacitor-app-intents

Ship Siri phrases, Shortcuts, Spotlight search, Home Screen quick actions, and App Intents entity parameters in Capacitor apps without rebuilding your web layer for every action.

<a href="https://capgo.app/?ref=plugin_app_intents"><img src="https://capgo.app/readme-banner.svg?repo=Cap-go/capacitor-app-intents" alt="Capgo" /></a>

## Key features

- **JavaScript dispatch bridge**: `CapgoDispatchAppIntent` plus `CapgoAppIntentsBridge` for custom Swift intents.
- **Pending queue**: cold start safe storage with `getPendingInvocations()`, `removePendingInvocation()`, `appIntentInvoked`, cap 100.
- **Entity catalogs**: `setEntityCatalog()` powers `CapgoCatalogEntity` and `EntityQuery` for Siri parameters.
- **Spotlight**: `indexSpotlightEntities()` uses `CSSearchableItem` on iOS 16+. On iOS 18+ also donates `IndexedEntity` through `indexAppEntities`.
- **Quick actions**: `setHomeScreenShortcutItems()` maps to `UIApplicationShortcutItem`.
- **Siri phrases**: compile time literals only. Use the included codegen script (not JavaScript).
- **Platforms**: iOS 16 and later. Android and web reject with a clear error.

## Compatibility

| Plugin version | Capacitor | Maintained |
| -------------- | --------- | ---------- |
| v8.x           | v8.x      | Yes        |

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
    appGroupId: 'group.your.app', // optional
    spotlightDomainIdentifier: 'your.app.bundle', // optional
  },
},
```

## Handle invocations

```ts
import {
  CapgoAppIntents,
  drainPendingInvocations,
  useAppIntentsListener,
} from '@capgo/capacitor-app-intents';

const handleInvocation = async (invocation) => {
  console.log(invocation.name, invocation.params);
};

await useAppIntentsListener(handleInvocation);

// Or manually: register the listener before draining pending items.
const listener = await CapgoAppIntents.addListener('appIntentInvoked', async (event) => {
  await handleInvocation(event.invocation);
});

await drainPendingInvocations(handleInvocation);
```

## Siri phrases and shortcut icons (codegen)

`AppShortcut` phrases and `systemImageName` values must be **compile time literals** in Swift. JavaScript cannot change them at runtime.

1. Copy `app-shortcuts.config.example.json` to `app-shortcuts.config.json` in your app repo.
2. Edit `actionName`, `shortTitle`, `systemImageName`, and `phrases` (`{{applicationName}}` maps to `\(.applicationName)`).
3. Generate Swift and add it to your iOS app target:

```bash
node node_modules/@capgo/capacitor-app-intents/scripts/generate-app-shortcuts.mjs \
  --config app-shortcuts.config.json \
  --output ios/App/App/CapgoGeneratedAppShortcuts.swift
```

Add the generated file to your iOS **App** target (not the plugin package). Link the plugin SPM package to the app so `CapgoDispatchAppIntent` resolves.

On Capacitor 8, forward SceneDelegate quick actions and continued Spotlight activities using `CapgoAppIntentsLifecycle`. See `docs/ios-scene-integration.md`.

4. Rebuild the iOS app. Siri and Shortcuts read the generated `AppShortcutsProvider`.

Custom intents can still call `CapgoAppIntentsBridge.shared.enqueue(...)` from Swift. See `docs/ExampleCustomIntent.swift`.

## Entity catalog

```ts
await CapgoAppIntents.setEntityCatalog({
  type: 'dish',
  entries: [{ id: 'pasta', title: 'Pasta' }],
});
```

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

On iOS 18 and later the plugin also indexes `CapgoSpotlightIndexedEntity` for semantic search.

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

## Apple schema (alpha, JavaScript queue only)

`performAppleSchemaTemplate({ template: 'mail_create_draft', params })` **does not** open Mail or call Apple Mail schema APIs. Third party apps do not get a supported native Mail draft App Intent API.

The plugin only enqueues a pending invocation named `appleSchemaMailCreateDraft` so your JavaScript can implement compose UI or deep links.

## Example app

```bash
npm run example:build
cd example-app
bunx cap sync ios
```

Copy `example-app/ios-shortcuts/CapgoGeneratedAppShortcuts.swift` into the Xcode app target after `cap add ios`.

## Docs

- `docs/app-intents.md`
- `docs/ExampleCustomIntent.swift`

## API

<docgen-index>

* [`getPendingInvocations()`](#getpendinginvocations)
* [`removePendingInvocation(...)`](#removependinginvocation)
* [`setEntityCatalog(...)`](#setentitycatalog)
* [`setHomeScreenShortcutItems(...)`](#sethomescreenshortcutitems)
* [`indexSpotlightEntities(...)`](#indexspotlightentities)
* [`removeSpotlightEntities(...)`](#removespotlightentities)
* [`performAppleSchemaTemplate(...)`](#performappleschematemplate)
* [`addListener('appIntentInvoked', ...)`](#addlistenerappintentinvoked-)
* [`removeAllListeners()`](#removealllisteners)
* [`getPluginVersion()`](#getpluginversion)
* [Interfaces](#interfaces)
* [Type Aliases](#type-aliases)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

Capgo App Intents plugin interface.

Bridges Swift App Intents, Siri, Shortcuts, Spotlight, and Home Screen quick actions
to JavaScript with a durable pending queue for cold starts.

iOS 16 and later. Android and web reject calls with a clear unimplemented error.

### getPendingInvocations()

```typescript
getPendingInvocations() => Promise<{ invocations: AppIntentInvocation[]; }>
```

Return invocations queued before JavaScript was ready.

**Returns:** <code>Promise&lt;{ invocations: AppIntentInvocation[]; }&gt;</code>

**Since:** 0.1.0

--------------------


### removePendingInvocation(...)

```typescript
removePendingInvocation(options: { id: string; }) => Promise<void>
```

Remove one pending invocation after your handler processes it.

| Param         | Type                         |
| ------------- | ---------------------------- |
| **`options`** | <code>{ id: string; }</code> |

**Since:** 0.1.0

--------------------


### setEntityCatalog(...)

```typescript
setEntityCatalog(options: { type: string; entries: EntityCatalogEntry[]; }) => Promise<void>
```

Persist an entity catalog for a given type string.

Powers Siri and Shortcuts entity parameters without new Swift per row.

| Param         | Type                                                          |
| ------------- | ------------------------------------------------------------- |
| **`options`** | <code>{ type: string; entries: EntityCatalogEntry[]; }</code> |

**Since:** 0.1.0

--------------------


### setHomeScreenShortcutItems(...)

```typescript
setHomeScreenShortcutItems(options: { items: HomeScreenShortcutItem[]; }) => Promise<void>
```

Replace Home Screen quick actions (UIApplicationShortcutItems).

| Param         | Type                                              |
| ------------- | ------------------------------------------------- |
| **`options`** | <code>{ items: HomeScreenShortcutItem[]; }</code> |

**Since:** 0.1.0

--------------------


### indexSpotlightEntities(...)

```typescript
indexSpotlightEntities(options: { entities: SpotlightEntity[]; }) => Promise<void>
```

Index Spotlight items for your app domain.

Uses `CSSearchableItem` on iOS 16 and later. On iOS 18 and later also donates
`IndexedEntity` values through `indexAppEntities` and `associateAppEntity`.

| Param         | Type                                          |
| ------------- | --------------------------------------------- |
| **`options`** | <code>{ entities: SpotlightEntity[]; }</code> |

**Since:** 0.1.0

--------------------


### removeSpotlightEntities(...)

```typescript
removeSpotlightEntities(options: { ids: string[]; }) => Promise<void>
```

Remove Spotlight items by id.

| Param         | Type                            |
| ------------- | ------------------------------- |
| **`options`** | <code>{ ids: string[]; }</code> |

**Since:** 0.1.0

--------------------


### performAppleSchemaTemplate(...)

```typescript
performAppleSchemaTemplate(options: { template: AppleSchemaTemplate; params: Record<string, unknown>; }) => Promise<{ queuedInvocationId?: string; }>
```

Queue a JavaScript handler for an alpha Apple schema template.

This does not call private Mail or system schema APIs. It only enqueues an
invocation (for example `appleSchemaMailCreateDraft`) for your app code to handle.

| Param         | Type                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| **`options`** | <code>{ template: 'mail_create_draft'; params: <a href="#record">Record</a>&lt;string, unknown&gt;; }</code> |

**Returns:** <code>Promise&lt;{ queuedInvocationId?: string; }&gt;</code>

**Since:** 0.1.0

--------------------


### addListener('appIntentInvoked', ...)

```typescript
addListener(eventName: 'appIntentInvoked', listenerFunc: (event: AppIntentInvokedEvent) => void) => Promise<PluginListenerHandle>
```

Listen for `appIntentInvoked` when a new invocation is queued.

| Param              | Type                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------- |
| **`eventName`**    | <code>'appIntentInvoked'</code>                                                             |
| **`listenerFunc`** | <code>(event: <a href="#appintentinvokedevent">AppIntentInvokedEvent</a>) =&gt; void</code> |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt;</code>

**Since:** 0.1.0

--------------------


### removeAllListeners()

```typescript
removeAllListeners() => Promise<void>
```

Remove all listeners for this plugin.

**Since:** 0.1.0

--------------------


### getPluginVersion()

```typescript
getPluginVersion() => Promise<{ version: string; }>
```

Native plugin version string.

**Returns:** <code>Promise&lt;{ version: string; }&gt;</code>

**Since:** 0.1.0

--------------------


### Interfaces


#### AppIntentInvocation

A pending App Intent style invocation waiting for JavaScript.

| Prop            | Type                                                                            | Description                                                          | Since |
| --------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----- |
| **`id`**        | <code>string</code>                                                             | Stable id for this queued invocation.                                | 0.1.0 |
| **`name`**      | <code>string</code>                                                             | Handler name your JavaScript listens for.                            | 0.1.0 |
| **`params`**    | <code><a href="#record">Record</a>&lt;string, unknown&gt;</code>                | Parameters passed from Siri, Shortcuts, Spotlight, or quick actions. | 0.1.0 |
| **`source`**    | <code><a href="#appintentinvocationsource">AppIntentInvocationSource</a></code> | Origin of the invocation.                                            | 0.1.0 |
| **`createdAt`** | <code>number</code>                                                             | Unix timestamp in milliseconds when the invocation was queued.       | 0.1.0 |


#### EntityCatalogEntry

One row in a runtime entity catalog used by Siri and Shortcuts parameters.

| Prop           | Type                                                             | Description                                                                | Since |
| -------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- | ----- |
| **`id`**       | <code>string</code>                                              | Unique id within the catalog type.                                         | 0.1.0 |
| **`title`**    | <code>string</code>                                              | Primary label shown in Shortcuts and Siri.                                 | 0.1.0 |
| **`subtitle`** | <code>string</code>                                              | Optional subtitle.                                                         | 0.1.0 |
| **`metadata`** | <code><a href="#record">Record</a>&lt;string, unknown&gt;</code> | Optional extra metadata forwarded to JavaScript when the entity is chosen. | 0.1.0 |


#### HomeScreenShortcutItem

Home Screen quick action item.

| Prop           | Type                                                             | Description                                 | Since |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------- | ----- |
| **`type`**     | <code>string</code>                                              | Stable type string delivered to JavaScript. | 0.1.0 |
| **`title`**    | <code>string</code>                                              | Visible title under the icon.               | 0.1.0 |
| **`subtitle`** | <code>string</code>                                              | Optional subtitle.                          | 0.1.0 |
| **`iconName`** | <code>string</code>                                              | Optional SF Symbol name.                    | 0.1.0 |
| **`params`**   | <code><a href="#record">Record</a>&lt;string, unknown&gt;</code> | Optional params merged into the invocation. | 0.1.0 |


#### SpotlightEntity

Spotlight searchable entity.

Indexed on iOS 16 with Core Spotlight. On iOS 18 and later the plugin also
donates an `IndexedEntity` for semantic Spotlight search.

| Prop              | Type                                                             | Description                                      | Since |
| ----------------- | ---------------------------------------------------------------- | ------------------------------------------------ | ----- |
| **`id`**          | <code>string</code>                                              | Unique id within your app domain.                | 0.1.0 |
| **`title`**       | <code>string</code>                                              | Title shown in Spotlight.                        | 0.1.0 |
| **`description`** | <code>string</code>                                              | Optional description.                            | 0.1.0 |
| **`keywords`**    | <code>string[]</code>                                            | Optional keywords.                               | 0.1.0 |
| **`actionName`**  | <code>string</code>                                              | Action name delivered when the result is opened. | 0.1.0 |
| **`params`**      | <code><a href="#record">Record</a>&lt;string, unknown&gt;</code> | Optional params merged into the invocation.      | 0.1.0 |


#### PluginListenerHandle

| Prop         | Type                                      |
| ------------ | ----------------------------------------- |
| **`remove`** | <code>() =&gt; Promise&lt;void&gt;</code> |


#### AppIntentInvokedEvent

| Prop             | Type                                                                | Description                                                   | Since |
| ---------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- | ----- |
| **`invocation`** | <code><a href="#appintentinvocation">AppIntentInvocation</a></code> | The invocation that was just queued or replayed to listeners. | 0.1.0 |


### Type Aliases


#### Record

Construct a type with a set of properties K of type T

<code>{ [P in K]: T; }</code>


#### AppIntentInvocationSource

Where an invocation originated.

<code>'app_intent' | 'spotlight' | 'quick_action' | 'apple_schema'</code>


#### AppleSchemaTemplate

Alpha Apple schema template identifiers shipped by the plugin.

<code>'mail_create_draft'</code>

</docgen-api>

## License

MPL-2.0
