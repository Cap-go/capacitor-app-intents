import CoreSpotlight
import Foundation
import UniformTypeIdentifiers

#if canImport(AppIntents)
import AppIntents
#endif

public struct CapgoSpotlightEntityRecord: Codable, Equatable {
    public let id: String
    public let title: String
    public let description: String?
    public let keywords: [String]?
    public let actionName: String
    public let params: [String: CapgoJSONValue]?
}

public final class CapgoSpotlightIndexer {
    public static let shared = CapgoSpotlightIndexer()

    private var domainIdentifier: String = Bundle.main.bundleIdentifier ?? "capgo.appintents"

    private init() {}

    public func configure(domainIdentifier: String?) {
        if let domainIdentifier, !domainIdentifier.isEmpty {
            self.domainIdentifier = domainIdentifier
        }
    }

    public func index(entities: [CapgoSpotlightEntityRecord], completion: @escaping (Error?) -> Void) {
        let items = entities.map { entity -> CSSearchableItem in
            CapgoSpotlightMappingStore.shared.setMapping(
                id: entity.id,
                actionName: entity.actionName,
                params: entity.params
            )
            var attributes = CSSearchableItemAttributeSet(contentType: UTType.data)
            attributes.title = entity.title
            attributes.contentDescription = entity.description
            attributes.keywords = entity.keywords
            attributes.relatedUniqueIdentifier = entity.id

            #if canImport(AppIntents)
            if #available(iOS 18.0, *) {
                let indexed = CapgoSpotlightIndexedEntity(record: entity)
                var item = CSSearchableItem(
                    uniqueIdentifier: entity.id,
                    domainIdentifier: domainIdentifier,
                    attributeSet: attributes
                )
                item.associateAppEntity(indexed, priority: 0)
                return item
            }
            #endif

            return CSSearchableItem(
                uniqueIdentifier: entity.id,
                domainIdentifier: domainIdentifier,
                attributeSet: attributes
            )
        }

        CSSearchableIndex.default().indexSearchableItems(items) { error in
            if let error {
                completion(error)
                return
            }

            #if canImport(AppIntents)
            if #available(iOS 18.0, *) {
                Task {
                    do {
                        let indexedEntities = entities.map { CapgoSpotlightIndexedEntity(record: $0) }
                        try await CSSearchableIndex.default().indexAppEntities(indexedEntities)
                        completion(nil)
                    } catch {
                        completion(error)
                    }
                }
                return
            }
            #endif

            completion(nil)
        }
    }

    public func remove(ids: [String], completion: @escaping (Error?) -> Void) {
        CSSearchableIndex.default().deleteSearchableItems(withIdentifiers: ids) { error in
            if let error {
                completion(error)
                return
            }

            #if canImport(AppIntents)
            if #available(iOS 18.0, *) {
                Task {
                    do {
                        try await CSSearchableIndex.default().deleteAppEntities(
                            identifiedBy: ids,
                            ofType: CapgoSpotlightIndexedEntity.self
                        )
                        completion(nil)
                    } catch {
                        completion(error)
                    }
                }
                return
            }
            #endif

            completion(nil)
        }
    }

    public func handleUserActivity(_ userActivity: NSUserActivity) -> CapgoInvocationRecord? {
        guard userActivity.activityType == CSSearchableItemActionType,
              let identifier = userActivity.userInfo?[CSSearchableItemActivityIdentifier] as? String else {
            return nil
        }

        let mapping = CapgoSpotlightMappingStore.shared.mapping(for: identifier)
        let name = mapping?.actionName ?? "spotlightOpen"
        var params: [String: Any] = ["spotlightId": identifier]
        if let metadata = mapping?.params {
            params["spotlightParams"] = CapgoJSONValue.encodeObject(metadata)
        }

        return CapgoAppIntentsBridge.shared.enqueue(name: name, params: params, source: .spotlight)
    }
}
