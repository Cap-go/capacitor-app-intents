import Foundation

public struct CapgoEntityCatalogEntry: Codable, Equatable {
    public let id: String
    public let title: String
    public let subtitle: String?
    public let metadata: [String: CapgoJSONValue]?
}

public final class CapgoEntityCatalogStore {
    public static let shared = CapgoEntityCatalogStore()

    private let storageKey = "capgo_app_intents_entity_catalog_v1"
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

    private func loadAll() -> [String: [CapgoEntityCatalogEntry]] {
        guard let data = defaults.data(forKey: storageKey) else {
            return [:]
        }
        return (try? JSONDecoder().decode([String: [CapgoEntityCatalogEntry]].self, from: data)) ?? [:]
    }

    public func setCatalog(type: String, entries: [CapgoEntityCatalogEntry]) {
        var catalogs = loadAll()
        catalogs[type] = entries
        if let data = try? JSONEncoder().encode(catalogs) {
            defaults.set(data, forKey: storageKey)
            defaults.synchronize()
        }
    }

    public func entries(for type: String) -> [CapgoEntityCatalogEntry] {
        return loadAll()[type] ?? []
    }

    public func entry(catalogType: String, entityId: String) -> CapgoEntityCatalogEntry? {
        return entries(for: catalogType).first { $0.id == entityId }
    }

    public func catalogTypes() -> [String] {
        return Array(loadAll().keys).sorted()
    }
}
