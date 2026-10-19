import Foundation

public struct CapgoShortcutDefinitionRecord: Codable, Equatable {
    public let actionName: String
    public let shortTitle: String
    public let systemImageName: String?
    public let phrases: [String]
}

public final class CapgoShortcutDefinitionStore {
    public static let shared = CapgoShortcutDefinitionStore()

    private let storageKey = "capgo_app_intents_shortcut_definitions_v1"
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

    public func setShortcuts(_ shortcuts: [CapgoShortcutDefinitionRecord]) {
        if let data = try? JSONEncoder().encode(shortcuts) {
            defaults.set(data, forKey: storageKey)
            defaults.synchronize()
        }
    }

    public func shortcuts() -> [CapgoShortcutDefinitionRecord] {
        guard let data = defaults.data(forKey: storageKey) else {
            return []
        }
        return (try? JSONDecoder().decode([CapgoShortcutDefinitionRecord].self, from: data)) ?? []
    }
}
