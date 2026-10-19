import Foundation

public final class CapgoAppIntentsBridge {
    public static let shared = CapgoAppIntentsBridge()

    public var onInvocationQueued: ((CapgoInvocationRecord) -> Void)?

    private init() {}

    public func configure(appGroupId: String?) {
        let suite = appGroupId?.isEmpty == false ? appGroupId : nil
        CapgoInvocationStore.shared.configure(suiteName: suite)
        CapgoEntityCatalogStore.shared.configure(suiteName: suite)
        CapgoShortcutDefinitionStore.shared.configure(suiteName: suite)
        CapgoSpotlightMappingStore.shared.configure(suiteName: suite)
    }

    @discardableResult
    public func enqueue(
        name: String,
        params: [String: Any] = [:],
        source: CapgoInvocationSource
    ) -> CapgoInvocationRecord {
        let record = CapgoInvocationStore.shared.enqueue(name: name, params: params, source: source)
        onInvocationQueued?(record)
        return record
    }
}
