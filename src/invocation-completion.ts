import type { AppIntentInvocation, AppIntentInvocationResult } from './definitions';
import { CapgoAppIntents } from './plugin-instance';

/**
 * @since 8.2.0
 */
export function isAwaitingResult(invocation: AppIntentInvocation): boolean {
  if (invocation.awaitingResult === true) {
    return true;
  }
  return invocation.params['__capgoAwaitingResult'] === true;
}

/**
 * @since 8.2.0
 */
export async function completeInvocationWithResult(
  id: string,
  result: AppIntentInvocationResult,
  dialog?: string,
): Promise<void> {
  await CapgoAppIntents.completeInvocation({ id, result, dialog });
}

/**
 * @since 8.2.0
 */
export async function failInvocationWithError(id: string, error: string): Promise<void> {
  await CapgoAppIntents.failInvocation({ id, error });
}

/**
 * Wrap a handler so awaiting invocations are completed or failed for Siri.
 *
 * @since 8.2.0
 */
export type AppIntentResultHandler = (
  invocation: AppIntentInvocation,
) => Promise<AppIntentInvocationResult | void> | AppIntentInvocationResult | void;

export function withInvocationCompletion(
  handler: AppIntentResultHandler,
): (invocation: AppIntentInvocation) => Promise<void> {
  return async (invocation) => {
    if (!isAwaitingResult(invocation)) {
      await handler(invocation);
      return;
    }

    try {
      const result = await handler(invocation);
      if (result) {
        await completeInvocationWithResult(invocation.id, result);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await failInvocationWithError(invocation.id, message);
      throw error;
    }
  };
}
