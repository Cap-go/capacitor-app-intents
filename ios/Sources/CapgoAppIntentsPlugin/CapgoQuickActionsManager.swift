import UIKit

public struct CapgoHomeScreenShortcutRecord: Codable, Equatable {
    public let type: String
    public let title: String
    public let subtitle: String?
    public let iconName: String?
    public let params: [String: CapgoJSONValue]?
}

public final class CapgoQuickActionsManager {
    public static let shared = CapgoQuickActionsManager()

    private let storageKey = "capgo_app_intents_quick_actions_v1"
    private var suiteName: String?

    private init() {}

    public func configure(suiteName: String?) {
        self.suiteName = suiteName
    }

    private var defaults: UserDefaults {
        if let suiteName, let suite = UserDefaults(suiteName: suiteName) {
            return suite
        }
        return .standard
    }

    public func apply(items: [CapgoHomeScreenShortcutRecord]) {
        if let data = try? JSONEncoder().encode(items) {
            defaults.set(data, forKey: storageKey)
            defaults.synchronize()
        }

        let shortcutItems = items.map { item -> UIApplicationShortcutItem in
            let icon = item.iconName.map { UIApplicationShortcutIcon(systemImageName: $0) }
            return UIApplicationShortcutItem(
                type: item.type,
                localizedTitle: item.title,
                localizedSubtitle: item.subtitle,
                icon: icon,
                userInfo: nil
            )
        }

        DispatchQueue.main.async {
            UIApplication.shared.shortcutItems = shortcutItems
        }
    }

    public func storedItems() -> [CapgoHomeScreenShortcutRecord] {
        guard let data = defaults.data(forKey: storageKey) else {
            return []
        }
        return (try? JSONDecoder().decode([CapgoHomeScreenShortcutRecord].self, from: data)) ?? []
    }

    public func handle(shortcutItem: UIApplicationShortcutItem) -> CapgoInvocationRecord? {
        guard let record = storedItems().first(where: { $0.type == shortcutItem.type }) else {
            return CapgoAppIntentsBridge.shared.enqueue(
                name: shortcutItem.type,
                params: [:],
                source: .quickAction
            )
        }

        var params: [String: Any] = ["quickActionType": record.type]
        if let metadata = record.params {
            params["quickActionParams"] = CapgoJSONValue.encodeObject(metadata)
        }

        return CapgoAppIntentsBridge.shared.enqueue(name: record.type, params: params, source: .quickAction)
    }
}
