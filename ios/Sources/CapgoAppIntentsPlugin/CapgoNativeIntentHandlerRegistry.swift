import Foundation

public typealias CapgoNativeIntentHandler = ([String: Any]) async throws -> [String: Any]

public final class CapgoNativeIntentHandlerRegistry {
    public static let shared = CapgoNativeIntentHandlerRegistry()

    private var handlers: [String: CapgoNativeIntentHandler] = [:]
    private let queue = DispatchQueue(label: "capgo.appintents.native.handlers")

    private init() {}

    public func register(actionName: String, handler: @escaping CapgoNativeIntentHandler) {
        queue.sync {
            handlers[actionName] = handler
        }
    }

    public func unregister(actionName: String) {
        queue.sync {
            handlers.removeValue(forKey: actionName)
        }
    }

    public func handler(for actionName: String) -> CapgoNativeIntentHandler? {
        queue.sync {
            handlers[actionName]
        }
    }
}
