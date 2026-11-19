import Foundation

public final class CapgoAppIntentsBridge {
    public static let shared = CapgoAppIntentsBridge()

    public var onInvocationQueued: ((CapgoInvocationRecord) -> Void)?

    private init() {}

    public func configure(appGroupId: String?) {
        let suite = appGroupId?.isEmpty == false ? appGroupId : nil
        CapgoInvocationStore.shared.configure(suiteName: suite)
        CapgoEntityCatalogStore.shared.configure(suiteName: suite)
        CapgoSpotlightMappingStore.shared.configure(suiteName: suite)
        CapgoOnscreenEntityContextStore.shared.configure(suiteName: suite)
    }

    func deliverInvocation(_ record: CapgoInvocationRecord) {
        onInvocationQueued?(record)
    }

    @discardableResult
    public func enqueue(
        name: String,
        params: [String: Any] = [:],
        source: CapgoInvocationSource,
        id: String? = nil
    ) -> CapgoInvocationRecord {
        CapgoAppIntentsBootstrap.ensureConfigured()
        let record = CapgoInvocationStore.shared.enqueue(name: name, params: params, source: source, id: id)
        deliverInvocation(record)
        return record
    }
}
