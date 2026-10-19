import { WebPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

import type { AppIntentInvocation, AppIntentInvokedEvent, CapgoAppIntentsPlugin } from './definitions';

const UNIMPLEMENTED =
  'CapgoAppIntents is only implemented on iOS. App Intents, Siri, Shortcuts, and Spotlight are not available on web.';

export class CapgoAppIntentsWeb extends WebPlugin implements CapgoAppIntentsPlugin {
  private reject(): Promise<never> {
    return Promise.reject(new Error(UNIMPLEMENTED));
  }

  async getPendingInvocations(): Promise<{
    invocations: AppIntentInvocation[];
  }> {
    return this.reject();
  }

  async removePendingInvocation(): Promise<void> {
    return this.reject();
  }

  async setEntityCatalog(): Promise<void> {
    return this.reject();
  }

  async setHomeScreenShortcutItems(): Promise<void> {
    return this.reject();
  }

  async indexSpotlightEntities(): Promise<void> {
    return this.reject();
  }

  async removeSpotlightEntities(): Promise<void> {
    return this.reject();
  }

  async performAppleSchemaTemplate(): Promise<{ queuedInvocationId?: string }> {
    return this.reject();
  }

  async addListener(
    _eventName: 'appIntentInvoked',
    _listenerFunc: (event: AppIntentInvokedEvent) => void,
  ): Promise<PluginListenerHandle> {
    return this.reject();
  }

  async getPluginVersion(): Promise<{ version: string }> {
    return { version: 'web' };
  }
}
