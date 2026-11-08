#if canImport(AppIntents)
import AppIntents
import Foundation

@available(iOS 16.0, *)
public enum CapgoIntentResultSupport {
    @MainActor
    public static func fireAndForget(perform options: CapgoIntentPerformOptions) async throws -> some IntentResult {
        _ = try await CapgoIntentPerformExecutor.perform(options: options)
        return .result()
    }

    @MainActor
    public static func performReturningString(
        options: CapgoIntentPerformOptions
    ) async throws -> some IntentResult {
        _ = try await CapgoIntentPerformExecutor.perform(options: options)
        return .result()
    }

    @available(iOS 17.0, *)
    @MainActor
    public static func performReturningValue(
        options: CapgoIntentPerformOptions
    ) async throws -> some ReturnsValue<String> {
        let outcome = try await CapgoIntentPerformExecutor.perform(options: options)
        let text = outcome.valueSummary ?? outcome.dialogMessage ?? "Done"
        return .result(value: text)
    }
}
#endif
