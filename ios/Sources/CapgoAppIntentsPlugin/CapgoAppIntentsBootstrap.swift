import Foundation

enum CapgoAppIntentsBootstrap {
    private static let lock = NSLock()
    private static var didConfigure = false

    static func ensureConfigured() {
        lock.lock()
        defer { lock.unlock() }
        if didConfigure {
            return
        }

        let appGroupId = CapgoAppIntentsConfiguration.appGroupId()
        CapgoAppIntentsBridge.shared.configure(appGroupId: appGroupId)
        CapgoQuickActionsManager.shared.configure(suiteName: appGroupId)
        CapgoSpotlightMappingStore.shared.configure(suiteName: appGroupId)

        didConfigure = true
    }
}
