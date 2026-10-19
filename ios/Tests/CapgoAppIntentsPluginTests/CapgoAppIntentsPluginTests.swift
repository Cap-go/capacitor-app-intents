import XCTest
@testable import CapgoAppIntentsPlugin

final class CapgoAppIntentsPluginTests: XCTestCase {
    private func isolatedSuite() -> String {
        let suite = "group.capgo.appintents.tests.\(UUID().uuidString)"
        UserDefaults(suiteName: suite)?.removePersistentDomain(forName: suite)
        return suite
    }

    func testInvocationQueueCap() {
        let suite = isolatedSuite()
        CapgoInvocationStore.shared.configure(suiteName: suite)

        for index in 0..<105 {
            _ = CapgoInvocationStore.shared.enqueue(
                name: "action",
                params: ["index": index],
                source: .appIntent
            )
        }

        let all = CapgoInvocationStore.shared.all()
        XCTAssertEqual(all.count, CapgoInvocationStore.maxEntries)
        XCTAssertEqual(all.first?.params["index"]?.toAny() as? Double, 5)
    }

    func testRemoveInvocation() {
        let suite = isolatedSuite()
        CapgoInvocationStore.shared.configure(suiteName: suite)

        let record = CapgoInvocationStore.shared.enqueue(
            name: "test",
            params: [:],
            source: .quickAction
        )
        CapgoInvocationStore.shared.remove(id: record.id)
        XCTAssertTrue(CapgoInvocationStore.shared.all().isEmpty)
    }

    func testEntityCatalogRoundTrip() {
        let suite = isolatedSuite()
        CapgoEntityCatalogStore.shared.configure(suiteName: suite)
        CapgoEntityCatalogStore.shared.setCatalog(
            type: "dish",
            entries: [
                CapgoEntityCatalogEntry(id: "1", title: "Pasta", subtitle: "Main", metadata: nil)
            ]
        )
        XCTAssertEqual(CapgoEntityCatalogStore.shared.entries(for: "dish").count, 1)
        XCTAssertEqual(CapgoEntityCatalogStore.shared.entry(catalogType: "dish", entityId: "1")?.title, "Pasta")
    }
}
