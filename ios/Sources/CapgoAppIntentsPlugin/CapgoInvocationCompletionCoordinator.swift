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

    private enum AwaitSlot {
        case armed(timeoutWorkItem: DispatchWorkItem)
        case waiting(
            continuation: CheckedContinuation<CapgoInvocationCompletion, Error>,
            timeoutWorkItem: DispatchWorkItem
        )
        case settled(Result<CapgoInvocationCompletion, Error>)
    }

    private let queue = DispatchQueue(label: "capgo.appintents.invocation.completion")
    private var awaiting: [String: AwaitSlot] = [:]

    private init() {}

  public func armAwaiting(id: String, timeoutSeconds: TimeInterval) throws {
        let cappedTimeout = Self.cappedTimeout(timeoutSeconds)
        try queue.sync {
            guard awaiting[id] == nil else {
                throw CapgoInvocationCompletionError.failed(message: "Invocation \(id) is already awaiting completion.")
            }
            let workItem = DispatchWorkItem { [weak self] in
                self?.timeout(id: id)
            }
            DispatchQueue.global().asyncAfter(deadline: .now() + cappedTimeout, execute: workItem)
            awaiting[id] = .armed(timeoutWorkItem: workItem)
        }
    }

    public func awaitCompletion(id: String) async throws -> CapgoInvocationCompletion {
        return try await withCheckedThrowingContinuation { continuation in
            queue.sync {
                guard let slot = awaiting[id] else {
                    continuation.resume(throwing: CapgoInvocationCompletionError.notAwaiting(id: id))
                    return
                }
                switch slot {
                case .settled(let result):
                    awaiting.removeValue(forKey: id)
                    continuation.resume(with: result)
                case .armed(let timeoutWorkItem):
                    awaiting[id] = .waiting(continuation: continuation, timeoutWorkItem: timeoutWorkItem)
                case .waiting:
                    continuation.resume(throwing: CapgoInvocationCompletionError.notAwaiting(id: id))
                }
            }
        }
    }

    public func registerAwaiting(id: String, timeoutSeconds: TimeInterval) async throws -> CapgoInvocationCompletion {
        try armAwaiting(id: id, timeoutSeconds: timeoutSeconds)
        return try await awaitCompletion(id: id)
    }

    private static func cappedTimeout(_ timeoutSeconds: TimeInterval) -> TimeInterval {
        return min(max(timeoutSeconds, 1), maxTimeoutSeconds)
    }

    public func complete(id: String, result: [String: Any], dialog: String?) {
        queue.async {
            guard let slot = self.awaiting[id] else {
                return
            }

            var encoded: [String: CapgoJSONValue] = [:]
            for (key, value) in result {
                encoded[key] = CapgoJSONValue.fromAny(value)
            }
            let completion = CapgoInvocationCompletion(result: encoded, dialog: dialog)
            let settled = Result<CapgoInvocationCompletion, Error>.success(completion)

            switch slot {
            case .waiting(let continuation, let timeoutWorkItem):
                self.awaiting.removeValue(forKey: id)
                timeoutWorkItem.cancel()
                continuation.resume(returning: completion)
            case .armed(let timeoutWorkItem):
                timeoutWorkItem.cancel()
                self.awaiting[id] = .settled(settled)
            case .settled:
                break
            }
        }
    }

    public func fail(id: String, message: String) {
        queue.async {
            guard let slot = self.awaiting[id] else {
                return
            }
            let error = CapgoInvocationCompletionError.failed(message: message)
            let settled = Result<CapgoInvocationCompletion, Error>.failure(error)
            switch slot {
            case .waiting(let continuation, let timeoutWorkItem):
                self.awaiting.removeValue(forKey: id)
                timeoutWorkItem.cancel()
                continuation.resume(throwing: error)
            case .armed(let timeoutWorkItem):
                timeoutWorkItem.cancel()
                self.awaiting[id] = .settled(settled)
            case .settled:
                break
            }
        }
    }

    public func cancelAwaiting(id: String) {
        queue.async {
            self.resumeAwaiting(id: id, result: .failure(CapgoInvocationCompletionError.notAwaiting(id: id)))
        }
    }

    public func cancelAwaitingAndRemovePending(id: String) {
        queue.async {
            self.resumeAwaiting(id: id, result: .failure(CapgoInvocationCompletionError.notAwaiting(id: id)))
            CapgoInvocationStore.shared.remove(id: id)
        }
    }

    private func timeout(id: String) {
        queue.async {
            CapgoInvocationStore.shared.remove(id: id)
            self.resumeAwaiting(id: id, result: .failure(CapgoInvocationCompletionError.timedOut))
        }
    }

    private func resumeAwaiting(id: String, result: Result<CapgoInvocationCompletion, Error>) {
        guard let slot = awaiting[id] else {
            return
        }
        switch slot {
        case .waiting(let continuation, let timeoutWorkItem):
            awaiting.removeValue(forKey: id)
            timeoutWorkItem.cancel()
            continuation.resume(with: result)
        case .armed(let timeoutWorkItem):
            timeoutWorkItem.cancel()
            awaiting[id] = .settled(result)
        case .settled:
            break
        }
    }
}
