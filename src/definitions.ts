import type { PluginListenerHandle } from '@capacitor/core';

/**
 * Where an invocation originated.
 *
 * @since 0.1.0
 */
export type AppIntentInvocationSource = 'app_intent' | 'spotlight' | 'quick_action' | 'apple_schema';

/**
 * A pending App Intent style invocation waiting for JavaScript.
 *
 * @since 0.1.0
 */
/**
 * Result payload returned to Siri after JavaScript completes an awaiting invocation.
 *
 * Typed codegen intents on iOS 17+ surface `value` and optional `message`/`summary` as a
 * `ReturnsValue<String>` string to Siri. The generic `CapgoDispatchAppIntent` path still
 * completes JavaScript but does not return that string to Siri on iOS 16.
 *
 * @since 8.2.0
 */
export interface AppIntentInvocationResult {
  /**
   * Primary string Siri can speak or chain on.
   *
   * @since 8.2.0
   */
  value?: string;

  /**
   * Optional dialog Siri speaks to the user.
   *
   * @since 8.2.0
   */
  message?: string;

  /**
   * Optional summary used when `value` is omitted.
   *
   * @since 8.2.0
   */
  summary?: string;

  /**
   * Arbitrary JSON-safe fields for chained tool intents.
   *
   * @since 8.2.0
   */
  [key: string]: unknown;
}

/**
 * Optional on-screen entity hint for Siri disambiguation.
 *
 * This complements native SwiftUI entity annotations. Use it from JavaScript when
 * your web UI shows catalog items Siri should prefer.
 *
 * @since 8.2.0
 */
export interface OnscreenEntityReference {
  catalogType: string;
  entityId: string;
  title?: string;
}

export interface AppIntentInvocation {
  /**
   * Stable id for this queued invocation.
   *
   * @since 0.1.0
   */
  id: string;

  /**
   * Handler name your JavaScript listens for.
   *
   * @since 0.1.0
   */
  name: string;

  /**
   * Parameters passed from Siri, Shortcuts, Spotlight, or quick actions.
   *
   * @since 0.1.0
   */
  params: Record<string, unknown>;

  /**
   * Origin of the invocation.
   *
   * @since 0.1.0
   */
  source: AppIntentInvocationSource;

  /**
   * Unix timestamp in milliseconds when the invocation was queued.
   *
   * @since 0.1.0
   */
  createdAt: number;

  /**
   * When true, the native side is waiting for `completeInvocation` or `failInvocation`.
   *
   * @since 8.2.0
   */
  awaitingResult?: boolean;
}

/**
 * One row in a runtime entity catalog used by Siri and Shortcuts parameters.
 *
 * @since 0.1.0
 */
export interface EntityCatalogEntry {
  /**
   * Unique id within the catalog type.
   *
   * @since 0.1.0
   */
  id: string;

  /**
   * Primary label shown in Shortcuts and Siri.
   *
   * @since 0.1.0
   */
  title: string;

  /**
   * Optional subtitle.
   *
   * @since 0.1.0
   */
  subtitle?: string;

  /**
   * Optional extra metadata forwarded to JavaScript when the entity is chosen.
   *
   * @since 0.1.0
   */
  metadata?: Record<string, unknown>;
}

/**
 * Home Screen quick action item.
 *
 * @since 0.1.0
 */
export interface HomeScreenShortcutItem {
  /**
   * Stable type string delivered to JavaScript.
   *
   * @since 0.1.0
   */
  type: string;

  /**
   * Visible title under the icon.
   *
   * @since 0.1.0
   */
  title: string;

  /**
   * Optional subtitle.
   *
   * @since 0.1.0
   */
  subtitle?: string;

  /**
   * Optional SF Symbol name.
   *
   * @since 0.1.0
   */
  iconName?: string;

  /**
   * Optional params merged into the invocation.
   *
   * @since 0.1.0
   */
  params?: Record<string, unknown>;
}

/**
 * Spotlight searchable entity.
 *
 * Indexed on iOS 16 with Core Spotlight. On iOS 18 and later the plugin also
 * donates an `IndexedEntity` for semantic Spotlight search.
 *
 * @since 0.1.0
 */
export interface SpotlightEntity {
  /**
   * Unique id within your app domain.
   *
   * @since 0.1.0
   */
  id: string;

  /**
   * Title shown in Spotlight.
   *
   * @since 0.1.0
   */
  title: string;

  /**
   * Optional description.
   *
   * @since 0.1.0
   */
  description?: string;

  /**
   * Optional keywords.
   *
   * @since 0.1.0
   */
  keywords?: string[];

  /**
   * Action name delivered when the result is opened.
   *
   * @since 0.1.0
   */
  actionName: string;

  /**
   * Optional params merged into the invocation.
   *
   * @since 0.1.0
   */
  params?: Record<string, unknown>;
}

/**
 * Alpha Apple schema template identifiers shipped by the plugin.
 *
 * @since 0.1.0
 */
export type AppleSchemaTemplate = 'mail_create_draft';

/**
 * @since 0.1.0
 */
export interface AppIntentInvokedEvent {
  /**
   * The invocation that was just queued or replayed to listeners.
   *
   * @since 0.1.0
   */
  invocation: AppIntentInvocation;
}

/**
 * Capgo App Intents plugin interface.
 *
 * Bridges Swift App Intents, Siri, Shortcuts, Spotlight, and Home Screen quick actions
 * to JavaScript with a durable pending queue for cold starts.
 *
 * iOS 16 and later. Android and web reject calls with a clear unimplemented error.
 *
 * @since 0.1.0
 */
export interface CapgoAppIntentsPlugin {
  /**
   * Return invocations queued before JavaScript was ready.
   *
   * @since 0.1.0
   */
  getPendingInvocations(): Promise<{ invocations: AppIntentInvocation[] }>;

  /**
   * Remove one pending invocation after your handler processes it.
   *
   * @since 0.1.0
   */
  removePendingInvocation(options: { id: string }): Promise<void>;

  /**
   * Resolve an invocation that is awaiting a JavaScript result for Siri.
   *
   * @since 8.2.0
   */
  completeInvocation(options: { id: string; result: AppIntentInvocationResult; dialog?: string }): Promise<void>;

  /**
   * Fail an invocation that is awaiting a JavaScript result.
   *
   * @since 8.2.0
   */
  failInvocation(options: { id: string; error: string }): Promise<void>;

  /**
   * Publish optional on-screen entity context for catalog queries.
   *
   * @since 8.2.0
   */
  setOnscreenEntityContext(options: { entities: OnscreenEntityReference[] }): Promise<void>;

  /**
   * Clear on-screen entity hints when your UI no longer shows those rows.
   *
   * @since 8.2.0
   */
  clearOnscreenEntityContext(): Promise<void>;

  /**
   * Persist an entity catalog for a given type string.
   *
   * Powers Siri and Shortcuts entity parameters without new Swift per row.
   *
   * @since 0.1.0
   */
  setEntityCatalog(options: { type: string; entries: EntityCatalogEntry[] }): Promise<void>;

  /**
   * Replace Home Screen quick actions (UIApplicationShortcutItems).
   *
   * @since 0.1.0
   */
  setHomeScreenShortcutItems(options: { items: HomeScreenShortcutItem[] }): Promise<void>;

  /**
   * Index Spotlight items for your app domain.
   *
   * Uses `CSSearchableItem` on iOS 16 and later. On iOS 18 and later also donates
   * `IndexedEntity` values through `indexAppEntities` and `associateAppEntity`.
   *
   * @since 0.1.0
   */
  indexSpotlightEntities(options: { entities: SpotlightEntity[] }): Promise<void>;

  /**
   * Remove Spotlight items by id.
   *
   * @since 0.1.0
   */
  removeSpotlightEntities(options: { ids: string[] }): Promise<void>;

  /**
   * Queue a JavaScript handler for an alpha Apple schema template.
   *
   * This does not call private Mail or system schema APIs. It only enqueues an
   * invocation (for example `appleSchemaMailCreateDraft`) for your app code to handle.
   *
   * @since 0.1.0
   */
  performAppleSchemaTemplate(options: {
    template: AppleSchemaTemplate;
    params: Record<string, unknown>;
  }): Promise<{ queuedInvocationId?: string }>;

  /**
   * Listen for `appIntentInvoked` when a new invocation is queued.
   *
   * @since 0.1.0
   */
  addListener(
    eventName: 'appIntentInvoked',
    listenerFunc: (event: AppIntentInvokedEvent) => void,
  ): Promise<PluginListenerHandle>;

  /**
   * Remove all listeners for this plugin.
   *
   * @since 0.1.0
   */
  removeAllListeners(): Promise<void>;

  /**
   * Native plugin version string.
   *
   * @since 0.1.0
   */
  getPluginVersion(): Promise<{ version: string }>;
}
