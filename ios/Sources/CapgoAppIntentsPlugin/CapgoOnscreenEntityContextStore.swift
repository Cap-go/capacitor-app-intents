import Foundation

public struct CapgoOnscreenEntityReference: Codable, Equatable {
    public let catalogType: String
    public let entityId: String
    public let title: String?

    public init(catalogType: String, entityId: String, title: String? = nil) {
        self.catalogType = catalogType
        self.entityId = entityId
        self.title = title
    }
}

public final class CapgoOnscreenEntityContextStore {
    public static let shared = CapgoOnscreenEntityContextStore()

    private let storageKey = "capgo_app_intents_onscreen_entities_v1"
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

    public func setEntities(_ entities: [CapgoOnscreenEntityReference]) {
        if let data = try? JSONEncoder().encode(entities) {
            defaults.set(data, forKey: storageKey)
            defaults.synchronize()
        }
    }

    public func entities() -> [CapgoOnscreenEntityReference] {
        guard let data = defaults.data(forKey: storageKey) else {
            return []
        }
        return (try? JSONDecoder().decode([CapgoOnscreenEntityReference].self, from: data)) ?? []
    }

    public func clear() {
        defaults.removeObject(forKey: storageKey)
        defaults.synchronize()
    }
}
