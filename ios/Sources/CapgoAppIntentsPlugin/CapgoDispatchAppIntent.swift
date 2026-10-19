#if canImport(AppIntents)
import AppIntents
import Foundation

@available(iOS 16.0, *)
public struct CapgoDispatchAppIntent: AppIntent {
    public static var title: LocalizedStringResource = "Run App Action"
    public static var description = IntentDescription("Runs a Capgo App Intents action in your Capacitor app.")
    public static var openAppWhenRun: Bool = true

    @Parameter(title: "Action name")
    public var actionName: String

    @Parameter(title: "Parameters JSON")
    public var parametersJSON: String?

    @Parameter(title: "Catalog item")
    public var catalogItem: CapgoCatalogEntity?

    public init() {
        self.actionName = ""
    }

    public init(actionName: String, parametersJSON: String? = nil, catalogItem: CapgoCatalogEntity? = nil) {
        self.actionName = actionName
        self.parametersJSON = parametersJSON
        self.catalogItem = catalogItem
    }

    @MainActor
    public func perform() async throws -> some IntentResult {
        var params: [String: Any] = [:]

        if let parametersJSON, let data = parametersJSON.data(using: .utf8),
           let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            params.merge(object) { _, new in new }
        }

        if let catalogItem {
            params["catalogType"] = catalogItem.catalogType
            params["entityId"] = catalogItem.entityId
            params["entityTitle"] = catalogItem.title
            if let metadata = catalogItem.metadata {
                params["entityMetadata"] = CapgoJSONValue.encodeObject(metadata)
            }
        }

        _ = CapgoAppIntentsBridge.shared.enqueue(name: actionName, params: params, source: .appIntent)
        return .result()
    }
}
#endif
