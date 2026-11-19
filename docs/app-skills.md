# Siri app skills and tool intents (iOS 27.3 Developer Preview)

Apple documents app skills under [Orchestrating complex actions with app skills](https://developer.apple.com/documentation/appintents/orchestrating-complex-actions-with-app-skills/).

This plugin keeps the generic `CapgoDispatchAppIntent` path for backward compatibility and adds:

- Typed intent codegen with parameters, entity properties, and string results for Siri chaining.
- `Skills.skillsbundle` generation from `SKILL.md` frontmatter in your app repo.
- `completeInvocation()` / `failInvocation()` so tool intents await JavaScript and return real values.
- Optional `setOnscreenEntityContext()` when your web UI cannot adopt SwiftUI entity annotations.

## Codegen

Copy `app-intents.codegen.example.json` and edit `intents`, `shortcuts`, and `skills`.

```bash
node node_modules/@capgo/capacitor-app-intents/scripts/generate-typed-intents.mjs \
  --config app-intents.codegen.json \
  --output-dir ios/App/App/GeneratedAppIntents

node node_modules/@capgo/capacitor-app-intents/scripts/generate-skills-bundle.mjs \
  --config app-intents.codegen.json \
  --output ios/App/App/Skills.skillsbundle
```

Add generated Swift files and `Skills.skillsbundle` to your iOS **app** target. Ensure `Skills.skillsbundle` appears in **Copy Bundle Resources**.

`@AppIntent(.tool)` and `ToolIntent` require the iOS 27.3 SDK (Xcode 27.3 beta). Generated intents compile on iOS 16+ without the tool trait. Uncomment or add `@AppIntent(.tool)` in generated files when your SDK supports it.

## JavaScript results for Siri

```ts
import {
  useAppIntentsListener,
  withInvocationCompletion,
  isAwaitingResult,
} from '@capgo/capacitor-app-intents';

await useAppIntentsListener(
  withInvocationCompletion(async (invocation) => {
    if (invocation.name === 'orderDish') {
      return { value: 'Ordered pasta', message: 'Your pasta order is in.' };
    }
  }),
);
```

## Native handlers (no webview)

Register in your iOS app `AppDelegate` or early bootstrap:

```swift
CapgoNativeIntentHandlerRegistry.shared.register(actionName: "pingNative") { _ in
    return ["value": "pong", "message": "Handled in Swift"]
}
```

Set `execution: "native"` on a generated intent to prefer the registry over JavaScript.

## On-screen entity context

When your UI is web-only, publish visible catalog rows:

```ts
await CapgoAppIntents.setOnscreenEntityContext({
  entities: [{ catalogType: 'dish', entityId: 'pasta', title: 'Pasta' }],
});
```

`CapgoCatalogEntityQuery` prioritizes these entities in `suggestedEntities()` and still returns the rest of the catalog. Call `clearOnscreenEntityContext()` when the UI hides those rows. Native SwiftUI `appEntityIdentifier` annotations remain the full onscreen awareness path when you embed native views.

## Real device Siri evaluation

Apple's preview requires an Apple Intelligence device on iOS 27.3 beta (not Simulator for skills verification).

1. Build and run on device. Install a dev build or TestFlight internal build.
2. Confirm `Skills.skillsc` exists under `MyApp.app/Metadata.appintents/` after install.
3. Bring the app to the foreground once.
4. Try phrases from each skill `description`, then rephrase them.
5. Run tool intents that set `awaitJavaScriptResult: true` and confirm Siri speaks the JavaScript `value` or `message`.
6. Chain two tool intents in one request using an app skill body that references both tools.
7. For automated checks, see [SiriEvaluations](https://developer.apple.com/documentation/SiriEvaluations) on the Apple Developer site.

Guarded APIs:

- `ToolIntent` / `@AppIntent(.tool)` are not declared in the plugin package so CI keeps building on current Xcode. Add the trait in app-owned generated Swift when ready.
- Full onscreen awareness (`appEntityIdentifier`, `AppEntityUIElementsContext`) is documented by Apple but not wrapped by this plugin yet.
