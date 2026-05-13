export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
}

/**
 * Retries an async operation with exponential backoff.
 * Default: 3 attempts, 1 s base delay (1 s → 2 s → 4 s).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 3, baseDelayMs = 1000 }: RetryOptions = {}
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await sleep(baseDelayMs * 2 ** i);
      }
    }
  }
  throw lastError;
}

/** Returns a human-readable message from any thrown value. */
export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
