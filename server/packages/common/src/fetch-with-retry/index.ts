import { logger } from "../logger";

/**
 * Configuration options for the fetch retry mechanism.
 */
interface RetryOptions {
  /** Maximum number of retry attempts before throwing an error. @default 3 */
  retries?: number;
  /** Initial delay in milliseconds before the first retry attempt. @default 1000 */
  initialDelayMs?: number;
  /** Multiplier applied to the delay after each failed attempt. @default 2 */
  backoffFactor?: number;
  /** HTTP status codes that trigger a retry attempt. @default [429, 503, 504] */
  retryableStatuses?: number[];
}

/**
 * Wraps the native `fetch` API with automatic retry capabilities and exponential backoff.
 * Automatically injects headers to prevent rate-limit blocks from external APIs like Jikan/MAL.
 *
 * @param url - The resource URL to fetch.
 * @param options - Standard native `fetch` request options (`RequestInit`).
 * @param retryOptions - Custom settings to control retry counts, delay, and backoff behavior.
 * @returns A Promise resolving to the successful `Response` object.
 * @throws {Error} The last encountered network error or generic failure message if all retries fail.
 *
 * @example
 * ```typescript
 * const response = await fetchWithRetry(
 *   'https://api.jikan.moe/v4/anime/21/videos/episodes?page=1',
 *   {},
 *   { retries: 3, initialDelayMs: 1200 }
 * );
 * ```
 */
export const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {},
): Promise<Response> => {
  const {
    retries = 3,
    initialDelayMs = 1000, // Start with 1 second
    backoffFactor = 2, // Double the delay on each attempt (1s -> 2s -> 4s)
    retryableStatuses = [429, 503, 504], // Rate-limit or gateway timeout errors
  } = retryOptions;

  let lastError: Error | null = null;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Always inject a valid User-Agent to bypass blocking
      const response = await fetch(url, {
        ...options,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
          ...options.headers,
        },
      });

      // If response is OK or status is not retryable, return it immediately
      if (response.ok || !retryableStatuses.includes(response.status)) {
        return response;
      }

      logger.warn(
        `[Attempt ${attempt + 1}/${retries + 1}] Received status ${response.status}. Retrying in ${delay}ms...`,
      );
    } catch (err) {
      lastError = err as Error;
      logger.warn(
        `[Attempt ${attempt + 1}/${retries + 1}] Network error: ${lastError.message}. Retrying in ${delay}ms...`,
      );
    }

    // If we've exhausted all retries, break out of the loop
    if (attempt === retries) break;

    // Wait for the current delay (plus a small random jitter to prevent thundering herd)
    const jitter = Math.random() * 200;
    await new Promise((resolve) => setTimeout(resolve, delay + jitter));

    // Increase delay exponentially
    delay *= backoffFactor;
  }

  throw lastError || new Error(`Failed to fetch after ${retries + 1} attempts`);
};
