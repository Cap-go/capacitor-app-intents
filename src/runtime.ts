import type { PluginListenerHandle } from '@capacitor/core';

import type { AppIntentInvocation } from './definitions';
import { CapgoAppIntents } from './plugin-instance';

/**
 * Process pending invocations once, then remove each handled id.
 *
 * @since 0.1.0
 */
export async function drainPendingInvocations(
  handler: (invocation: AppIntentInvocation) => Promise<void> | void,
): Promise<void> {
  const { invocations } = await CapgoAppIntents.getPendingInvocations();
  for (const invocation of invocations) {
    await handler(invocation);
    await CapgoAppIntents.removePendingInvocation({ id: invocation.id });
  }
}

/**
 * Register `appIntentInvoked` and drain the queue on mount.
 *
 * @since 0.1.0
 */
export async function useAppIntentsListener(
  handler: (invocation: AppIntentInvocation) => Promise<void> | void,
): Promise<PluginListenerHandle> {
  await drainPendingInvocations(handler);
  return CapgoAppIntents.addListener('appIntentInvoked', async (event) => {
    await handler(event.invocation);
    await CapgoAppIntents.removePendingInvocation({ id: event.invocation.id });
  });
}
