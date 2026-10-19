import Foundation

#if canImport(AppIntents)
import AppIntents
#endif

public enum CapgoAppleSchemaTemplate: String {
    case mailCreateDraft = "mail_create_draft"
}

public final class CapgoAppleSchemaTemplates {
    public static let shared = CapgoAppleSchemaTemplates()

    private init() {}

    public func perform(
        template: CapgoAppleSchemaTemplate,
        params: [String: Any]
    ) throws -> CapgoInvocationRecord {
        switch template {
        case .mailCreateDraft:
            return try performMailCreateDraft(params: params)
        }
    }

    private func performMailCreateDraft(params: [String: Any]) throws -> CapgoInvocationRecord {
        #if canImport(AppIntents)
        if #available(iOS 18.0, *) {
            // Alpha: queue a JavaScript handler. Native Mail schema intents are not exposed as stable public API for third party apps.
            let record = CapgoAppIntentsBridge.shared.enqueue(
                name: "appleSchemaMailCreateDraft",
                params: params,
                source: .appleSchema
            )
            return record
        }
        #endif
        throw NSError(
            domain: "CapgoAppIntents",
            code: 1,
            userInfo: [
                NSLocalizedDescriptionKey:
                    "mail_create_draft is alpha and requires iOS 18 or later. Native Mail schema intents are not available to third party apps yet."
            ]
        )
    }
}
