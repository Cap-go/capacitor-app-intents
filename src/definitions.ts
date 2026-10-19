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
 * Shortcut phrase registration for the built in dispatch intent.
 *
 * @since 0.1.0
 */
export interface AppShortcutDefinition {
  /**
   * Action name forwarded to JavaScript when the shortcut runs.
   *
   * @since 0.1.0
   */
  actionName: string;

  /**
   * Short title in the Shortcuts app.
   *
   * @since 0.1.0
   */
  shortTitle: string;

  /**
   * SF Symbol name.
   *
   * @since 0.1.0
   */
  systemImageName?: string;

  /**
   * Siri phrase templates. Use `{{applicationName}}` for the app name.
   *
   * @since 0.1.0
   */
  phrases: string[];
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
   * Persist an entity catalog for a given type string.
   *
   * Powers Siri and Shortcuts entity parameters without new Swift per row.
   *
   * @since 0.1.0
   */
  setEntityCatalog(options: { type: string; entries: EntityCatalogEntry[] }): Promise<void>;

  /**
   * Register Siri shortcut phrases for the built in dispatch intent.
   *
   * Changing phrases requires a native rebuild for full Siri coverage.
   * Call `refreshShortcuts()` after updates.
   *
   * @since 0.1.0
   */
  setShortcutDefinitions(options: { shortcuts: AppShortcutDefinition[] }): Promise<void>;

  /**
   * Ask the system to refresh donated shortcuts after `setShortcutDefinitions`.
   *
   * @since 0.1.0
   */
  refreshShortcuts(): Promise<void>;

  /**
   * Replace Home Screen quick actions (UIApplicationShortcutItems).
   *
   * @since 0.1.0
   */
  setHomeScreenShortcutItems(options: { items: HomeScreenShortcutItem[] }): Promise<void>;

  /**
   * Index Spotlight items for your app domain.
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
   * Run an opt in Apple schema template when the OS exposes a public API.
   *
   * Alpha. See README for supported templates and gaps.
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
