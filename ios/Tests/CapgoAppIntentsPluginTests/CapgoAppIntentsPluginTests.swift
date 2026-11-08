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

    func testCompletionSuccess() async {
        let id = UUID().uuidString
        Task {
            try? await Task.sleep(nanoseconds: 50_000_000)
            CapgoInvocationCompletionCoordinator.shared.complete(id: id, result: ["value": "ok"], dialog: "Done")
        }
        let completion = try? await CapgoInvocationCompletionCoordinator.shared.registerAwaiting(
            id: id,
            timeoutSeconds: 2
        )
        XCTAssertEqual(completion?.result["value"]?.toAny() as? String, "ok")
        XCTAssertEqual(completion?.dialog, "Done")
    }

    func testCompletionTimeout() async {
        let id = UUID().uuidString
        do {
            _ = try await CapgoInvocationCompletionCoordinator.shared.registerAwaiting(
                id: id,
                timeoutSeconds: 0.05
            )
            XCTFail("expected timeout")
        } catch let error as CapgoInvocationCompletionError {
            XCTAssertEqual(error, .timedOut)
        } catch {
            XCTFail("unexpected error \(error)")
        }
    }

    func testCompletionFail() async {
        let id = UUID().uuidString
        Task {
            try? await Task.sleep(nanoseconds: 20_000_000)
            CapgoInvocationCompletionCoordinator.shared.fail(id: id, message: "nope")
        }
        do {
            _ = try await CapgoInvocationCompletionCoordinator.shared.registerAwaiting(
                id: id,
                timeoutSeconds: 2
            )
            XCTFail("expected failure")
        } catch let error as CapgoInvocationCompletionError {
            if case .failed(let message) = error {
                XCTAssertEqual(message, "nope")
            } else {
                XCTFail("unexpected case")
            }
        } catch {
            XCTFail("unexpected error \(error)")
        }
    }

    func testOnscreenEntityContextPrioritizedInQuery() async throws {
        let suite = isolatedSuite()
        CapgoEntityCatalogStore.shared.configure(suiteName: suite)
        CapgoOnscreenEntityContextStore.shared.configure(suiteName: suite)
        CapgoEntityCatalogStore.shared.setCatalog(
            type: "dish",
            entries: [
                CapgoEntityCatalogEntry(id: "1", title: "Pasta", subtitle: nil, metadata: nil),
                CapgoEntityCatalogEntry(id: "2", title: "Soup", subtitle: nil, metadata: nil)
            ]
        )
        CapgoOnscreenEntityContextStore.shared.setEntities([
            CapgoOnscreenEntityReference(catalogType: "dish", entityId: "2", title: "Soup")
        ])

        #if canImport(AppIntents)
        if #available(iOS 16.0, *) {
            let query = CapgoCatalogEntityQuery()
            let suggested = try await query.suggestedEntities()
            XCTAssertEqual(suggested.first?.entityId, "2")
        }
        #endif
    }

    func testChainedAwaitingCompletions() async {
        let firstId = UUID().uuidString
        let secondId = UUID().uuidString

        Task {
            try? await Task.sleep(nanoseconds: 20_000_000)
            CapgoInvocationCompletionCoordinator.shared.complete(
                id: firstId,
                result: ["value": "first"],
                dialog: nil
            )
            try? await Task.sleep(nanoseconds: 20_000_000)
            CapgoInvocationCompletionCoordinator.shared.complete(
                id: secondId,
                result: ["value": "second"],
                dialog: nil
            )
        }

        let first = try? await CapgoInvocationCompletionCoordinator.shared.registerAwaiting(
            id: firstId,
            timeoutSeconds: 2
        )
        let second = try? await CapgoInvocationCompletionCoordinator.shared.registerAwaiting(
            id: secondId,
            timeoutSeconds: 2
        )
        XCTAssertEqual(first?.result["value"]?.toAny() as? String, "first")
        XCTAssertEqual(second?.result["value"]?.toAny() as? String, "second")
    }

    func testInvocationRecordAwaitingFlag() {
        let record = CapgoInvocationRecord(
            id: "x",
            name: "action",
            params: ["__capgoAwaitingResult": .bool(true)],
            source: .appIntent,
            createdAt: 0
        )
        XCTAssertEqual(record.toJSObject()["awaitingResult"] as? Bool, true)
    }
}
