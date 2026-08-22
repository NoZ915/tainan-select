type RateLimitWindow = {
  count: number;
  windowStartedAt: number;
};

type FixedWindowRateLimiterOptions = {
  windowMs: number;
  maxRequests: number;
  maxSources: number;
};

export const createFixedWindowRateLimiter = ({
  windowMs,
  maxRequests,
  maxSources,
}: FixedWindowRateLimiterOptions) => {
  const windowsBySource = new Map<string, RateLimitWindow>();
  let nextCleanupAt = 0;

  const cleanupExpiredWindows = (now: number): void => {
    if (now < nextCleanupAt) return;

    for (const [source, window] of windowsBySource) {
      if (now - window.windowStartedAt >= windowMs) {
        windowsBySource.delete(source);
      }
    }
    nextCleanupAt = now + windowMs;
  };

  return (source: string, now = Date.now()): boolean => {
    cleanupExpiredWindows(now);

    const existingWindow = windowsBySource.get(source);
    if (!existingWindow) {
      if (windowsBySource.size >= maxSources) {
        const oldestSource = windowsBySource.keys().next().value;
        if (oldestSource) windowsBySource.delete(oldestSource);
      }
      windowsBySource.set(source, { count: 1, windowStartedAt: now });
      return false;
    }

    if (now - existingWindow.windowStartedAt >= windowMs) {
      windowsBySource.set(source, { count: 1, windowStartedAt: now });
      return false;
    }

    existingWindow.count += 1;
    return existingWindow.count > maxRequests;
  };
};
