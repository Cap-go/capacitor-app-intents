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
        let cappedTimeout = min(max(options.timeoutSeconds, 1), CapgoInvocationCompletionCoordinator.maxTimeoutSeconds)

        if #available(iOS 16.0, *),
           options.foregroundOnly,
           !CapgoIntentForegroundGuard.isForegroundReady(foregroundOnly: options.foregroundOnly) {
            throw CapgoInvocationCompletionError.failed(message: "App must be in the foreground for this action.")
        }

        if options.preferNativeHandler,
           let handler = CapgoNativeIntentHandlerRegistry.shared.handler(for: options.actionName) {
            let result = try await withTimeout(seconds: cappedTimeout) {
                try await handler(options.params)
            }
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
        mergedParams["__capgoTimeoutSeconds"] = cappedTimeout

        guard options.awaitsJavaScriptResult else {
            let record = CapgoAppIntentsBridge.shared.enqueue(
                name: options.actionName,
                params: mergedParams,
                source: .appIntent
            )
            return CapgoIntentPerformOutcome(
                record: record,
                nativeResult: nil,
                completion: nil,
                usedNativeHandler: false
            )
        }

        let invocationId = UUID().uuidString
        do {
            try CapgoInvocationCompletionCoordinator.shared.armAwaiting(
                id: invocationId,
                timeoutSeconds: cappedTimeout
            )
        } catch {
            throw error
        }

        let record = CapgoAppIntentsBridge.shared.enqueue(
            name: options.actionName,
            params: mergedParams,
            source: .appIntent,
            id: invocationId
        )

        let completion: CapgoInvocationCompletion
        do {
            completion = try await withTaskCancellationHandler {
                try await CapgoInvocationCompletionCoordinator.shared.awaitCompletion(id: invocationId)
            } onCancel: {
                CapgoInvocationCompletionCoordinator.shared.cancelAwaitingAndRemovePending(id: invocationId)
            }
        } catch {
            CapgoInvocationStore.shared.remove(id: invocationId)
            throw error
        }
        CapgoInvocationStore.shared.remove(id: record.id)

        return CapgoIntentPerformOutcome(
            record: record,
            nativeResult: nil,
            completion: completion,
            usedNativeHandler: false
        )
    }

    private static func withTimeout<T>(
        seconds: TimeInterval,
        operation: @escaping () async throws -> T
    ) async throws -> T {
        try await withThrowingTaskGroup(of: T.self) { group in
            group.addTask {
                try await operation()
            }
            group.addTask {
                try await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
                throw CapgoInvocationCompletionError.timedOut
            }
            guard let value = try await group.next() else {
                throw CapgoInvocationCompletionError.timedOut
            }
            group.cancelAll()
            return value
        }
    }
}
