#if canImport(AppIntents)
import AppIntents
import Foundation

@available(iOS 16.0, *)
public struct CapgoCatalogEntity: AppEntity {
    public static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Catalog Item")
    public static var defaultQuery = CapgoCatalogEntityQuery()

    public var id: String
    public var catalogType: String
    public var entityId: String
    public var title: String
    public var subtitle: String?
    public var metadata: [String: CapgoJSONValue]?

    public var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(title)", subtitle: subtitle.map { "\($0)" })
    }

    public init(
        catalogType: String,
        entityId: String,
        title: String,
        subtitle: String? = nil,
        metadata: [String: CapgoJSONValue]? = nil
    ) {
        self.catalogType = catalogType
        self.entityId = entityId
        self.id = "\(catalogType)|\(entityId)"
        self.title = title
        self.subtitle = subtitle
        self.metadata = metadata
    }
}

@available(iOS 16.0, *)
public struct CapgoCatalogEntityQuery: EntityQuery {
    public init() {}

    public func entities(for identifiers: [CapgoCatalogEntity.ID]) async throws -> [CapgoCatalogEntity] {
        var results: [CapgoCatalogEntity] = []
        for identifier in identifiers {
            let parts = identifier.split(separator: "|", maxSplits: 1).map(String.init)
            guard parts.count == 2 else { continue }
            let catalogType = parts[0]
            let entityId = parts[1]
            if let entry = CapgoEntityCatalogStore.shared.entry(catalogType: catalogType, entityId: entityId) {
                results.append(
                    CapgoCatalogEntity(
                        catalogType: catalogType,
                        entityId: entry.id,
                        title: entry.title,
                        subtitle: entry.subtitle,
                        metadata: entry.metadata
                    )
                )
            }
        }
        return results
    }

    public func suggestedEntities() async throws -> [CapgoCatalogEntity] {
        let catalogs = CapgoEntityCatalogStore.shared
        var all: [CapgoCatalogEntity] = []
        for type in catalogs.catalogTypes() {
            for entry in catalogs.entries(for: type) {
                all.append(
                    CapgoCatalogEntity(
                        catalogType: type,
                        entityId: entry.id,
                        title: entry.title,
                        subtitle: entry.subtitle,
                        metadata: entry.metadata
                    )
                )
            }
        }
        return all
    }
}
#endif
