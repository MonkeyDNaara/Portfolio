// The free-tier API on Render sleeps when idle and needs about 30-50 s to start again.
// These helpers decide when to retry and how the wake-up pill shows the progress.

export const SHOW_AFTER_MS = 1500; // a warm API answers faster, so no pill at all
export const READY_MS = 1000; // how long "Ready" stays before the pill goes away
export const MAX_WAIT_MS = 90_000; // stop retrying after this and show the normal error

const DELAYS_MS = [2000, 4000, 8000];
const RETRY_EVERY_MS = 10_000;

/** Pause before retry number `attempt` (0 = first retry): 2 s, 4 s, 8 s, then every 10 s. */
export function retryDelay(attempt) {
  return DELAYS_MS[attempt] ?? RETRY_EVERY_MS;
}

/** No connection (status 0) or the proxy answering while the server still starts. */
export function isRetryable(error) {
  return [0, 502, 503, 504].includes(error?.status);
}

/** Percent for the progress bar: fast at first, then slower, never above 90 until the data is there. */
export function wakeProgress(seconds) {
  return Math.round(90 * (1 - Math.exp(-seconds / 15)));
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
