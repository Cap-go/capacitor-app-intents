#if canImport(AppIntents)
import AppIntents
import CoreSpotlight
import Foundation
import UniformTypeIdentifiers

@available(iOS 18.0, *)
public struct CapgoSpotlightIndexedEntity: IndexedEntity {
    public static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Spotlight Item")
    public static var defaultQuery = CapgoSpotlightIndexedEntityQuery()

    public var id: String
    public var title: String
    public var entityDescription: String?
    public var keywords: [String]?

    public var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(title)")
    }

    public var attributeSet: CSSearchableItemAttributeSet {
        let attributes = CSSearchableItemAttributeSet(contentType: UTType.data)
        attributes.title = title
        attributes.contentDescription = entityDescription
        attributes.keywords = keywords
        return attributes
    }

    public init(record: CapgoSpotlightEntityRecord) {
        self.id = record.id
        self.title = record.title
        self.entityDescription = record.description
        self.keywords = record.keywords
    }
}

@available(iOS 18.0, *)
public struct CapgoSpotlightIndexedEntityQuery: EntityQuery {
    public init() {}

    public func entities(for identifiers: [CapgoSpotlightIndexedEntity.ID]) async throws -> [CapgoSpotlightIndexedEntity] {
        return identifiers.compactMap { identifier in
            guard let mapping = CapgoSpotlightMappingStore.shared.mapping(for: identifier) else {
                return nil
            }
            return CapgoSpotlightIndexedEntity(
                record: CapgoSpotlightEntityRecord(
                    id: identifier,
                    title: mapping.title,
                    description: mapping.description,
                    keywords: mapping.keywords,
                    actionName: mapping.actionName,
                    params: mapping.params
                )
            )
        }
    }
}
#endif
