import type { AppIntentInvocation } from './definitions';
import { isAwaitingResult } from './invocation-completion';

const defaultTimeoutSeconds = 30;
const maxTimeoutSeconds = 600;

function awaitingTimeoutMs(invocation: AppIntentInvocation): number {
  const raw = invocation.params['__capgoTimeoutSeconds'];
  const seconds = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : defaultTimeoutSeconds;
  const capped = Math.min(Math.max(seconds, 1), maxTimeoutSeconds);
  return capped * 1000;
}

/**
 * Pending awaiting invocations whose native coordinator likely already timed out.
 *
 * @since 8.2.0
 */
export function isExpiredAwaitingInvocation(invocation: AppIntentInvocation, now = Date.now()): boolean {
  if (!isAwaitingResult(invocation)) {
    return false;
  }
  const ageMs = now - invocation.createdAt;
  return ageMs > awaitingTimeoutMs(invocation);
}
