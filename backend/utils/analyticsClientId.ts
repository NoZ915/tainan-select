const ANALYTICS_CLIENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const normalizeAnalyticsClientId = (value: unknown): string | null => {
  if (typeof value !== "string" || !ANALYTICS_CLIENT_ID_PATTERN.test(value)) return null;
  return value.toLowerCase();
};
