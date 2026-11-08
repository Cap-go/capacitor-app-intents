import Foundation

public struct CapgoIntentPerformOptions {
    public let actionName: String
    public let params: [String: Any]
    public let awaitsJavaScriptResult: Bool
    public let foregroundOnly: Bool
    public let timeoutSeconds: TimeInterval
    public let preferNativeHandler: Bool

    public init(
        actionName: String,
        params: [String: Any] = [:],
        awaitsJavaScriptResult: Bool = false,
        foregroundOnly: Bool = true,
        timeoutSeconds: TimeInterval = CapgoInvocationCompletionCoordinator.defaultTimeoutSeconds,
        preferNativeHandler: Bool = true
    ) {
        self.actionName = actionName
        self.params = params
        self.awaitsJavaScriptResult = awaitsJavaScriptResult
        self.foregroundOnly = foregroundOnly
        self.timeoutSeconds = timeoutSeconds
        self.preferNativeHandler = preferNativeHandler
    }
}

public struct CapgoIntentPerformOutcome {
    public let record: CapgoInvocationRecord?
    public let nativeResult: [String: Any]?
    public let completion: CapgoInvocationCompletion?
    public let usedNativeHandler: Bool

    public var dialogMessage: String? {
        if let completion {
            return completion.dialog ?? completion.result["message"]?.toAny() as? String
        }
        if let nativeResult {
            return nativeResult["message"] as? String
        }
        return nil
    }

    public var valueSummary: String? {
        if let completion {
            return completion.result["value"]?.toAny() as? String
                ?? completion.result["summary"]?.toAny() as? String
                ?? completion.dialog
        }
        if let nativeResult {
            return nativeResult["value"] as? String ?? nativeResult["summary"] as? String
        }
        return nil
    }
}

public enum CapgoIntentPerformExecutor {
    @MainActor
    public static func perform(options: CapgoIntentPerformOptions) async throws -> CapgoIntentPerformOutcome {
        if options.preferNativeHandler,
           let handler = CapgoNativeIntentHandlerRegistry.shared.handler(for: options.actionName) {
            let result = try await handler(options.params)
            return CapgoIntentPerformOutcome(
                record: nil,
                nativeResult: result,
                completion: nil,
                usedNativeHandler: true
            )
        }

        var mergedParams = options.params
        mergedParams["__capgoAwaitingResult"] = options.awaitsJavaScriptResult
        mergedParams["__capgoForegroundOnly"] = options.foregroundOnly

        let record = CapgoAppIntentsBridge.shared.enqueue(
            name: options.actionName,
            params: mergedParams,
            source: .appIntent
        )

        guard options.awaitsJavaScriptResult else {
            return CapgoIntentPerformOutcome(
                record: record,
                nativeResult: nil,
                completion: nil,
                usedNativeHandler: false
            )
        }

        let completion = try await CapgoInvocationCompletionCoordinator.shared.registerAwaiting(
            id: record.id,
            timeoutSeconds: options.timeoutSeconds
        )
        CapgoInvocationStore.shared.remove(id: record.id)

        return CapgoIntentPerformOutcome(
            record: record,
            nativeResult: nil,
            completion: completion,
            usedNativeHandler: false
        )
    }
}
