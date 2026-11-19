import Foundation

enum CapgoUserDefaultsSuiteSupport {
    /// Apply a non-empty suite name without clearing a previously configured suite.
    static func applySuiteName(_ suiteName: inout String?, candidate: String?) {
        guard let candidate, !candidate.isEmpty else {
            return
        }
        suiteName = candidate
    }
}
