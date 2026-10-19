#if canImport(AppIntents)
import AppIntents
import Foundation

@available(iOS 16.0, *)
public struct CapgoAppShortcutsProvider: AppShortcutsProvider {
    public static var appShortcuts: [AppShortcut] {
        let definitions = CapgoShortcutDefinitionStore.shared.shortcuts()
        if definitions.isEmpty {
            return [
                AppShortcut(
                    intent: CapgoDispatchAppIntent(actionName: "openApp"),
                    phrases: [
                        "Open \(.applicationName)"
                    ],
                    shortTitle: "Open App",
                    systemImageName: "app"
                )
            ]
        }

        return definitions.map { definition in
            AppShortcut(
                intent: CapgoDispatchAppIntent(actionName: definition.actionName),
                phrases: [
                    "Run in \(.applicationName)"
                ],
                shortTitle: "\(definition.shortTitle)",
                systemImageName: definition.systemImageName ?? "bolt"
            )
        }
    }
}
#endif
