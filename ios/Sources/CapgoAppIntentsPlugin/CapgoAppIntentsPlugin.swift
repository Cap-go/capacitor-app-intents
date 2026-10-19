import Capacitor
import Foundation
import UIKit

#if canImport(AppIntents)
import AppIntents
#endif

@objc(CapgoAppIntentsPlugin)
public class CapgoAppIntentsPlugin: CAPPlugin, CAPBridgedPlugin {
    private let pluginVersion: String = "8.0.0"
    public let identifier = "CapgoAppIntentsPlugin"
    public let jsName = "CapgoAppIntents"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getPendingInvocations", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removePendingInvocation", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setEntityCatalog", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setHomeScreenShortcutItems", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "indexSpotlightEntities", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeSpotlightEntities", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "performAppleSchemaTemplate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPluginVersion", returnType: CAPPluginReturnPromise)
    ]

    override public func load() {
        super.load()

        CapgoAppIntentsBootstrap.ensureConfigured()

        let appGroupId = getConfig().getString("appGroupId") ?? CapgoAppIntentsConfiguration.appGroupId()
        let spotlightDomain = getConfig().getString("spotlightDomainIdentifier")

        CapgoAppIntentsBridge.shared.configure(appGroupId: appGroupId)
        CapgoQuickActionsManager.shared.configure(suiteName: appGroupId)
        CapgoSpotlightMappingStore.shared.configure(suiteName: appGroupId)
        CapgoSpotlightIndexer.shared.configure(domainIdentifier: spotlightDomain)

        CapgoAppIntentsBridge.shared.onInvocationQueued = { [weak self] record in
            self?.emitInvocation(record)
        }

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    @objc private func handleDidBecomeActive() {
        replayPendingToListeners()
    }

    private func replayPendingToListeners() {
        for record in CapgoInvocationStore.shared.all() {
            emitInvocation(record, retainUntilConsumed: false)
        }
    }

    private func emitInvocation(_ record: CapgoInvocationRecord, retainUntilConsumed: Bool = true) {
        notifyListeners(
            "appIntentInvoked",
            data: ["invocation": record.toJSObject()],
            retainUntilConsumed: retainUntilConsumed
        )
    }

    @objc func getPendingInvocations(_ call: CAPPluginCall) {
        let invocations = CapgoInvocationStore.shared.all().map { $0.toJSObject() }
        call.resolve(["invocations": invocations])
    }

    @objc func removePendingInvocation(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject("id is required")
            return
        }
        CapgoInvocationStore.shared.remove(id: id)
        call.resolve()
    }

    @objc func setEntityCatalog(_ call: CAPPluginCall) {
        guard let type = call.getString("type") else {
            call.reject("type is required")
            return
        }
        guard let rawEntries = call.getArray("entries") else {
            call.reject("entries is required")
            return
        }

        let entries: [CapgoEntityCatalogEntry] = rawEntries.compactMap { value in
            guard let dict = value as? [String: Any],
                  let id = dict["id"] as? String,
                  let title = dict["title"] as? String else {
                return nil
            }
            let subtitle = dict["subtitle"] as? String
            let metadata = dict["metadata"] as? [String: Any]
            let encodedMetadata = metadata?.mapValues { CapgoJSONValue.fromAny($0) }
            return CapgoEntityCatalogEntry(
                id: id,
                title: title,
                subtitle: subtitle,
                metadata: encodedMetadata
            )
        }

        CapgoEntityCatalogStore.shared.setCatalog(type: type, entries: entries)
        call.resolve()
    }

    @objc func setHomeScreenShortcutItems(_ call: CAPPluginCall) {
        guard let rawItems = call.getArray("items") else {
            call.reject("items is required")
            return
        }

        let items: [CapgoHomeScreenShortcutRecord] = rawItems.compactMap { value in
            guard let dict = value as? [String: Any],
                  let type = dict["type"] as? String,
                  let title = dict["title"] as? String else {
                return nil
            }
            let subtitle = dict["subtitle"] as? String
            let iconName = dict["iconName"] as? String
            let params = dict["params"] as? [String: Any]
            let encodedParams = params?.mapValues { CapgoJSONValue.fromAny($0) }
            return CapgoHomeScreenShortcutRecord(
                type: type,
                title: title,
                subtitle: subtitle,
                iconName: iconName,
                params: encodedParams
            )
        }

        CapgoQuickActionsManager.shared.apply(items: items)
        call.resolve()
    }

    @objc func indexSpotlightEntities(_ call: CAPPluginCall) {
        guard let rawEntities = call.getArray("entities") else {
            call.reject("entities is required")
            return
        }

        let entities: [CapgoSpotlightEntityRecord] = rawEntities.compactMap { value in
            guard let dict = value as? [String: Any],
                  let id = dict["id"] as? String,
                  let title = dict["title"] as? String,
                  let actionName = dict["actionName"] as? String else {
                return nil
            }
            let description = dict["description"] as? String
            let keywords = dict["keywords"] as? [String]
            let params = dict["params"] as? [String: Any]
            let encodedParams = params?.mapValues { CapgoJSONValue.fromAny($0) }
            return CapgoSpotlightEntityRecord(
                id: id,
                title: title,
                description: description,
                keywords: keywords,
                actionName: actionName,
                params: encodedParams
            )
        }

        CapgoSpotlightIndexer.shared.index(entities: entities) { error in
            if let error {
                call.reject("Spotlight indexing failed", nil, error)
            } else {
                call.resolve()
            }
        }
    }

    @objc func removeSpotlightEntities(_ call: CAPPluginCall) {
        guard let ids = call.options["ids"] as? [String], !ids.isEmpty else {
            call.reject("ids is required")
            return
        }

        CapgoSpotlightIndexer.shared.remove(ids: ids) { error in
            if let error {
                call.reject("Spotlight removal failed", nil, error)
            } else {
                call.resolve()
            }
        }
    }

    @objc func performAppleSchemaTemplate(_ call: CAPPluginCall) {
        guard let templateRaw = call.getString("template"),
              let template = CapgoAppleSchemaTemplate(rawValue: templateRaw) else {
            call.reject("template is required")
            return
        }
        let params = call.getObject("params") ?? [:]

        do {
            let record = try CapgoAppleSchemaTemplates.shared.perform(template: template, params: params)
            call.resolve(["queuedInvocationId": record.id])
        } catch {
            call.reject(error.localizedDescription)
        }
    }

    @objc func getPluginVersion(_ call: CAPPluginCall) {
        call.resolve(["version": pluginVersion])
    }
}
