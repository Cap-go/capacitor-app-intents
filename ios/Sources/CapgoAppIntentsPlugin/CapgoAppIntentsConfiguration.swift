import Foundation

public enum CapgoAppIntentsConfiguration {
    private static let resolvedAppGroupId: String? = loadAppGroupId()

    public static func appGroupId() -> String? {
        resolvedAppGroupId
    }

    private static func loadAppGroupId() -> String? {
        if let fromPlist = Bundle.main.object(forInfoDictionaryKey: "CapgoAppIntentsAppGroupId") as? String,
           !fromPlist.isEmpty {
            return fromPlist
        }

        guard let url = Bundle.main.url(forResource: "capacitor.config", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let plugins = json["plugins"] as? [String: Any],
              let pluginConfig = plugins["CapgoAppIntents"] as? [String: Any],
              let appGroupId = pluginConfig["appGroupId"] as? String,
              !appGroupId.isEmpty else {
            return nil
        }

        return appGroupId
    }
}
