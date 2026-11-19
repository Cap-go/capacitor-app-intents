import Foundation
#if canImport(UIKit)
import UIKit
#endif

@available(iOS 16.0, *)
public enum CapgoIntentForegroundGuard {
    public static func isForegroundReady(foregroundOnly: Bool) -> Bool {
        guard foregroundOnly else {
            return true
        }
        #if canImport(UIKit)
        return UIApplication.shared.applicationState == .active
        #else
        return true
        #endif
    }
}
