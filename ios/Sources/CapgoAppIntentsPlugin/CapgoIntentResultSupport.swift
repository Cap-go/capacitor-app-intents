#if canImport(AppIntents)
import AppIntents
import Foundation

@available(iOS 16.0, *)
public enum CapgoIntentResultSupport {
    @MainActor
    public static func perform(options: CapgoIntentPerformOptions) async throws -> some IntentResult {
        _ = try await CapgoIntentPerformExecutor.perform(options: options)
        return .result()
    }

    @available(iOS 17.0, *)
    @MainActor
    public static func performReturningValue(
        options: CapgoIntentPerformOptions
    ) async throws -> some ReturnsValue<String> & ProvidesDialog {
        let outcome = try await CapgoIntentPerformExecutor.perform(options: options)
        let value = outcome.valueSummary ?? "Done"
        let dialogText = outcome.dialogMessage ?? value
        return .result(value: value, dialog: IntentDialog(stringLiteral: dialogText))
    }

}
#endif
