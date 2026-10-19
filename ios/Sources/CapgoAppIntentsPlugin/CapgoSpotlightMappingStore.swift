import Foundation

public final class CapgoSpotlightMappingStore {
    public static let shared = CapgoSpotlightMappingStore()

    private let storageKey = "capgo_app_intents_spotlight_map_v1"
    private var suiteName: String?

    private struct Mapping: Codable {
        let actionName: String
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

    public func setMapping(
        id: String,
        actionName: String,
        params: [String: CapgoJSONValue]?
    ) {
        var map = load()
        map[id] = Mapping(actionName: actionName, params: params)
        if let data = try? JSONEncoder().encode(map) {
            defaults.set(data, forKey: storageKey)
            defaults.synchronize()
        }
    }

    public func mapping(for id: String) -> (actionName: String, params: [String: CapgoJSONValue]?)? {
        guard let mapping = load()[id] else {
            return nil
        }
        return (mapping.actionName, mapping.params)
    }
}
