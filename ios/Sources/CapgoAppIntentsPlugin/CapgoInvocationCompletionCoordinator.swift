import Foundation

public enum CapgoInvocationCompletionError: Error, Equatable, LocalizedError {
    case timedOut
    case failed(message: String)
    case notAwaiting(id: String)

    public var errorDescription: String? {
        switch self {
        case .timedOut:
            return "App intent invocation timed out before JavaScript completed."
        case .failed(let message):
            return message
        case .notAwaiting(let id):
            return "No invocation is awaiting completion for id \(id)."
        }
    }
}

public struct CapgoInvocationCompletion: Equatable {
    public let result: [String: CapgoJSONValue]
    public let dialog: String?

    public init(result: [String: CapgoJSONValue], dialog: String? = nil) {
        self.result = result
        self.dialog = dialog
    }
}

public final class CapgoInvocationCompletionCoordinator {
    public static let shared = CapgoInvocationCompletionCoordinator()
    public static let defaultTimeoutSeconds: TimeInterval = 30
    public static let maxTimeoutSeconds: TimeInterval = 600

    private struct AwaitState {
        let continuation: CheckedContinuation<CapgoInvocationCompletion, Error>
        let timeoutWorkItem: DispatchWorkItem
    }

    private let queue = DispatchQueue(label: "capgo.appintents.invocation.completion")
    private var awaiting: [String: AwaitState] = [:]

    private init() {}

    public func registerAwaiting(id: String, timeoutSeconds: TimeInterval) async throws -> CapgoInvocationCompletion {
        let cappedTimeout = Self.cappedTimeout(timeoutSeconds)
        return try await withCheckedThrowingContinuation { continuation in
            queue.sync {
                let workItem = DispatchWorkItem { [weak self] in
                    self?.timeout(id: id)
                }
                DispatchQueue.global().asyncAfter(deadline: .now() + cappedTimeout, execute: workItem)
                self.awaiting[id] = AwaitState(continuation: continuation, timeoutWorkItem: workItem)
            }
        }
    }

    private static func cappedTimeout(_ timeoutSeconds: TimeInterval) -> TimeInterval {
        return min(max(timeoutSeconds, 1), maxTimeoutSeconds)
    }

    public func complete(id: String, result: [String: Any], dialog: String?) {
        queue.async {
            guard let state = self.awaiting.removeValue(forKey: id) else {
                return
            }
            state.timeoutWorkItem.cancel()

            var encoded: [String: CapgoJSONValue] = [:]
            for (key, value) in result {
                encoded[key] = CapgoJSONValue.fromAny(value)
            }
            let completion = CapgoInvocationCompletion(result: encoded, dialog: dialog)
            state.continuation.resume(returning: completion)
        }
    }

    public func fail(id: String, message: String) {
        queue.async {
            guard let state = self.awaiting.removeValue(forKey: id) else {
                return
            }
            state.timeoutWorkItem.cancel()
            state.continuation.resume(throwing: CapgoInvocationCompletionError.failed(message: message))
        }
    }

    public func cancelAwaiting(id: String) {
        queue.async {
            guard let state = self.awaiting.removeValue(forKey: id) else {
                return
            }
            state.timeoutWorkItem.cancel()
            state.continuation.resume(throwing: CapgoInvocationCompletionError.notAwaiting(id: id))
        }
    }

    public func cancelAwaitingAndRemovePending(id: String) {
        queue.async {
            if let state = self.awaiting.removeValue(forKey: id) {
                state.timeoutWorkItem.cancel()
                state.continuation.resume(throwing: CapgoInvocationCompletionError.notAwaiting(id: id))
            }
            CapgoInvocationStore.shared.remove(id: id)
        }
    }

    private func timeout(id: String) {
        queue.async {
            guard let state = self.awaiting.removeValue(forKey: id) else {
                return
            }
            CapgoInvocationStore.shared.remove(id: id)
            state.continuation.resume(throwing: CapgoInvocationCompletionError.timedOut)
        }
    }
}
