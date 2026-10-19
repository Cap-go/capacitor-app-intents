import Foundation

public enum CapgoInvocationSource: String, Codable {
    case appIntent = "app_intent"
    case spotlight = "spotlight"
    case quickAction = "quick_action"
    case appleSchema = "apple_schema"
}

public struct CapgoInvocationRecord: Codable, Equatable {
    public let id: String
    public let name: String
    public let params: [String: CapgoJSONValue]
    public let source: CapgoInvocationSource
    public let createdAt: TimeInterval

    public func toJSObject() -> [String: Any] {
        return [
            "id": id,
            "name": name,
            "params": CapgoJSONValue.encodeObject(params),
            "source": source.rawValue,
            "createdAt": Int(createdAt)
        ]
    }
}

public enum CapgoJSONValue: Codable, Equatable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case object([String: CapgoJSONValue])
    case array([CapgoJSONValue])
    case null

    public static func fromAny(_ value: Any?) -> CapgoJSONValue {
        switch value {
        case let string as String:
            return .string(string)
        case let int as Int:
            return .number(Double(int))
        case let number as NSNumber:
            if CFGetTypeID(number) == CFBooleanGetTypeID() {
                return .bool(number.boolValue)
            }
            return .number(number.doubleValue)
        case let dict as [String: Any]:
            var object: [String: CapgoJSONValue] = [:]
            for (key, nested) in dict {
                object[key] = fromAny(nested)
            }
            return .object(object)
        case let array as [Any]:
            return .array(array.map { fromAny($0) })
        default:
            return .null
        }
    }

    public func toAny() -> Any {
        switch self {
        case .string(let value):
            return value
        case .number(let value):
            return value
        case .bool(let value):
            return value
        case .object(let value):
            return CapgoJSONValue.encodeObject(value)
        case .array(let value):
            return value.map { $0.toAny() }
        case .null:
            return NSNull()
        }
    }

    public static func encodeObject(_ object: [String: CapgoJSONValue]) -> [String: Any] {
        var encoded: [String: Any] = [:]
        for (key, value) in object {
            encoded[key] = value.toAny()
        }
        return encoded
    }
}

public final class CapgoInvocationStore {
    public static let shared = CapgoInvocationStore()
    public static let maxEntries = 100

    private let storageKey = "capgo_app_intents_pending_queue_v1"
    private var suiteName: String?

    private init() {}

    public func configure(suiteName: String?) {
        self.suiteName = suiteName
    }

    private var defaults: UserDefaults {
        if let suiteName, let suite = UserDefaults(suiteName: suiteName) {
            return suite
        }
        return .standard
    }

    public func all() -> [CapgoInvocationRecord] {
        guard let data = defaults.data(forKey: storageKey) else {
            return []
        }
        return (try? JSONDecoder().decode([CapgoInvocationRecord].self, from: data)) ?? []
    }

    public func enqueue(
        name: String,
        params: [String: Any],
        source: CapgoInvocationSource
    ) -> CapgoInvocationRecord {
        var encodedParams: [String: CapgoJSONValue] = [:]
        for (key, value) in params {
            encodedParams[key] = CapgoJSONValue.fromAny(value)
        }

        let record = CapgoInvocationRecord(
            id: UUID().uuidString,
            name: name,
            params: encodedParams,
            source: source,
            createdAt: Date().timeIntervalSince1970 * 1000
        )

        var queue = all()
        queue.append(record)
        if queue.count > CapgoInvocationStore.maxEntries {
            queue.removeFirst(queue.count - CapgoInvocationStore.maxEntries)
        }
        persist(queue)
        return record
    }

    public func remove(id: String) {
        let queue = all().filter { $0.id != id }
        persist(queue)
    }

    private func persist(_ queue: [CapgoInvocationRecord]) {
        if let data = try? JSONEncoder().encode(queue) {
            defaults.set(data, forKey: storageKey)
            defaults.synchronize()
        }
    }
}
