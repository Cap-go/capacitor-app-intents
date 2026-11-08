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
        CapgoAppIntentsBootstrap.ensureConfigured()
        let onscreen = CapgoOnscreenEntityContextStore.shared.entities()
        var prioritized: [CapgoCatalogEntity] = []
        var seenPrioritized = Set<String>()
        for reference in onscreen {
            if let entry = CapgoEntityCatalogStore.shared.entry(
                catalogType: reference.catalogType,
                entityId: reference.entityId
            ) {
                let entity = CapgoCatalogEntity(
                    catalogType: reference.catalogType,
                    entityId: entry.id,
                    title: entry.title,
                    subtitle: entry.subtitle,
                    metadata: entry.metadata
                )
                if seenPrioritized.insert(entity.id).inserted {
                    prioritized.append(entity)
                }
            }
        }
        let all = try await allCatalogEntities()
        guard !prioritized.isEmpty else {
            return all
        }
        let prioritizedIds = Set(prioritized.map(\.id))
        let remainder = all.filter { !prioritizedIds.contains($0.id) }
        return prioritized + remainder
    }

    public func entities(matching string: String) async throws -> [CapgoCatalogEntity] {
        let needle = string.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !needle.isEmpty else {
            return []
        }
        return try await allCatalogEntities().filter { entity in
            entity.title.lowercased().contains(needle)
                || (entity.subtitle?.lowercased().contains(needle) ?? false)
                || metadataMatches(entity: entity, needle: needle)
        }
    }

    public func entities(forProperty property: String, equalTo value: String) async throws -> [CapgoCatalogEntity] {
        let propertyKey = property.trimmingCharacters(in: .whitespacesAndNewlines)
        let expected = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !propertyKey.isEmpty, !expected.isEmpty else {
            return []
        }
        return try await allCatalogEntities().filter { entity in
            guard let metadata = entity.metadata,
                  let entry = metadata[propertyKey] else {
                return false
            }
            switch entry {
            case .string(let stringValue):
                return stringValue == expected
            case .number(let numberValue):
                if let parsed = Double(expected) {
                    return numberValue == parsed
                }
                return String(numberValue) == expected
            case .bool(let boolValue):
                return String(boolValue) == expected.lowercased()
            default:
                return false
            }
        }
    }

    @available(iOS 17.0, *)
    public func displayRepresentations(matching string: String) async throws -> [CapgoCatalogEntity.ID: DisplayRepresentation] {
        let matches = try await entities(matching: string)
        var map: [CapgoCatalogEntity.ID: DisplayRepresentation] = [:]
        for entity in matches {
            map[entity.id] = entity.displayRepresentation
        }
        return map
    }

    private func allCatalogEntities() async throws -> [CapgoCatalogEntity] {
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

    private func metadataMatches(entity: CapgoCatalogEntity, needle: String) -> Bool {
        guard let metadata = entity.metadata else { return false }
        for (_, value) in metadata {
            if let text = value.toAny() as? String, text.lowercased().contains(needle) {
                return true
            }
        }
        return false
    }
}

@available(iOS 17.0, *)
extension CapgoCatalogEntityQuery: EntityStringQuery {}
#endif
