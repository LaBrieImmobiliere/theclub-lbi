/**
 * Log errors with context. Falls back to console if Sentry not configured.
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  console.error("[error]", error, context);

  // Dynamically import Sentry only if available
  try {
    // @ts-expect-error - Sentry may not be installed yet
    import("@sentry/nextjs").then((Sentry) => {
      Sentry.captureException(error, { extra: context });
    }).catch(() => {});
  } catch { /* ignore */ }
}
