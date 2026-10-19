import Foundation

public final class CapgoSpotlightMappingStore {
    public static let shared = CapgoSpotlightMappingStore()

    private let storageKey = "capgo_app_intents_spotlight_map_v1"
    private var suiteName: String?

    struct Mapping: Codable {
        let actionName: String
        let title: String
        let description: String?
        let keywords: [String]?
        let params: [String: CapgoJSONValue]?
    }

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

    private func load() -> [String: Mapping] {
        guard let data = defaults.data(forKey: storageKey) else {
            return [:]
        }
        return (try? JSONDecoder().decode([String: Mapping].self, from: data)) ?? [:]
    }

    private func persist(_ map: [String: Mapping]) {
        if let data = try? JSONEncoder().encode(map) {
            defaults.set(data, forKey: storageKey)
            defaults.synchronize()
        }
    }

    public func setMappings(_ entities: [CapgoSpotlightEntityRecord]) {
        var map = load()
        for entity in entities {
            map[entity.id] = Mapping(
                actionName: entity.actionName,
                title: entity.title,
                description: entity.description,
                keywords: entity.keywords,
                params: entity.params
            )
        }
        persist(map)
    }

    public func removeMappings(for ids: [String]) {
        guard !ids.isEmpty else {
            return
        }
        var map = load()
        for id in ids {
            map.removeValue(forKey: id)
        }
        persist(map)
    }

    public func mapping(for id: String) -> Mapping? {
        load()[id]
    }
}
