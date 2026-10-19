import Foundation
import UIKit

/// Host app integration for Capacitor 8 scene-based lifecycle.
///
/// Forward `UIScene.ConnectionOptions` on cold start and quick-action callbacks on warm start.
/// Capacitor does not route Spotlight or Home Screen quick actions into `CAPPlugin` delegate methods.
public enum CapgoAppIntentsLifecycle {
    public static func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        CapgoAppIntentsBootstrap.ensureConfigured()

        if let shortcutItem = connectionOptions.shortcutItem {
            handleShortcutItem(shortcutItem)
        }

        for userActivity in connectionOptions.userActivities {
            handleContinueUserActivity(userActivity)
        }
    }

    @discardableResult
    public static func windowScene(
        _ windowScene: UIWindowScene,
        performActionFor shortcutItem: UIApplicationShortcutItem,
        completionHandler: @escaping (Bool) -> Void
    ) -> Bool {
        let handled = handleShortcutItem(shortcutItem)
        completionHandler(handled)
        return handled
    }

    @discardableResult
    public static func handleContinueUserActivity(_ userActivity: NSUserActivity) -> Bool {
        CapgoAppIntentsBootstrap.ensureConfigured()
        guard let record = CapgoSpotlightIndexer.shared.handleUserActivity(userActivity) else {
            return false
        }
        CapgoAppIntentsBridge.shared.deliverInvocation(record)
        return true
    }

    @discardableResult
    public static func handleShortcutItem(_ shortcutItem: UIApplicationShortcutItem) -> Bool {
        CapgoAppIntentsBootstrap.ensureConfigured()
        guard let record = CapgoQuickActionsManager.shared.handle(shortcutItem: shortcutItem) else {
            return false
        }
        CapgoAppIntentsBridge.shared.deliverInvocation(record)
        return true
    }
}
