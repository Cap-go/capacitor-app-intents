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
  const seen = new Set<string>();

  const processInvocation = async (invocation: AppIntentInvocation) => {
    if (seen.has(invocation.id)) {
      return;
    }
    seen.add(invocation.id);
    try {
      await handler(invocation);
      await CapgoAppIntents.removePendingInvocation({ id: invocation.id });
    } catch {
      seen.delete(invocation.id);
    }
  };

  const { invocations } = await CapgoAppIntents.getPendingInvocations();
  for (const invocation of invocations) {
    await processInvocation(invocation);
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
  const seen = new Set<string>();

  const processInvocation = async (invocation: AppIntentInvocation) => {
    if (seen.has(invocation.id)) {
      return;
    }
    seen.add(invocation.id);
    try {
      await handler(invocation);
      await CapgoAppIntents.removePendingInvocation({ id: invocation.id });
    } catch {
      seen.delete(invocation.id);
    }
  };

  const listener = await CapgoAppIntents.addListener('appIntentInvoked', async (event) => {
    await processInvocation(event.invocation);
  });

  await drainPendingInvocations(processInvocation);

  return listener;
}
