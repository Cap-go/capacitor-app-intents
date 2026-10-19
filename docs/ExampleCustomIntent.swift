#if canImport(AppIntents)
import AppIntents
import CapgoCapacitorAppIntents

@available(iOS 16.0, *)
struct IncreaseCounterIntent: AppIntent {
    static var title: LocalizedStringResource = "Increase Counter"
    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult {
        _ = CapgoAppIntentsBridge.shared.enqueue(
            name: "increaseCounter",
            params: [:],
            source: .appIntent
        )
        return .result()
    }
}

@available(iOS 16.0, *)
struct ExampleAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: IncreaseCounterIntent(),
            phrases: [
                "Increase the counter in \(.applicationName)"
            ],
            shortTitle: "Increase Counter",
            systemImageName: "plus.circle"
        )
    }
}
#endif
