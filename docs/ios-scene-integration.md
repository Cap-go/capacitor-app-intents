# iOS scene integration (Capacitor 8)

Capacitor 8 uses a scene-based iOS template. Home Screen quick actions and Spotlight open events are not delivered through `CAPPlugin` `UIApplicationDelegate` methods.

Call `CapgoAppIntentsLifecycle` from your host app `SceneDelegate`.

## Cold start

```swift
import CapgoCapacitorAppIntents

func scene(
  _ scene: UIScene,
  willConnectTo session: UISceneSession,
  options connectionOptions: UIScene.ConnectionOptions
) {
  CapgoAppIntentsLifecycle.scene(scene, willConnectTo: session, options: connectionOptions)
  // ... existing Capacitor SceneDelegate wiring
}
```

## Warm quick action

```swift
func windowScene(
  _ windowScene: UIWindowScene,
  performActionFor shortcutItem: UIApplicationShortcutItem,
  completionHandler: @escaping (Bool) -> Void
) {
  if CapgoAppIntentsLifecycle.windowScene(
    windowScene,
    performActionFor: shortcutItem,
    completionHandler: completionHandler
  ) {
    return
  }
  completionHandler(false)
}
```

Pending invocations are still available through `getPendingInvocations()` when JavaScript loads later.
