export const SESSION_TTL_MS = 20 * 60 * 1000;
const LEGACY_SESSION_LOGIN_AT_KEY = "kmfri_session_login_at";
export const SESSION_LAST_ACTIVITY_AT_KEY = "kmfri_session_last_activity_at";
export const SESSION_TIMEOUT_MS_KEY = "kmfri_session_timeout_ms";
export const SESSION_LOGIN_AT_KEY = SESSION_LAST_ACTIVITY_AT_KEY;

const parsePositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const setSessionTimeoutMs = (timeoutMs) => {
  if (typeof window === "undefined") return;

  const normalizedTimeoutMs = parsePositiveNumber(timeoutMs, SESSION_TTL_MS);
  sessionStorage.setItem(SESSION_TIMEOUT_MS_KEY, String(normalizedTimeoutMs));
};

export const getSessionTimeoutMs = () => {
  if (typeof window === "undefined") return SESSION_TTL_MS;

  return parsePositiveNumber(
    sessionStorage.getItem(SESSION_TIMEOUT_MS_KEY),
    SESSION_TTL_MS
  );
};

export const markSessionStarted = () => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_LAST_ACTIVITY_AT_KEY, String(Date.now()));
};

export const markSessionActive = markSessionStarted;

export const clearSessionStarted = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_LAST_ACTIVITY_AT_KEY);
  sessionStorage.removeItem(LEGACY_SESSION_LOGIN_AT_KEY);
  sessionStorage.removeItem(SESSION_TIMEOUT_MS_KEY);
};

export const getSessionTimeRemaining = () => {
  if (typeof window === "undefined") return SESSION_TTL_MS;

  const timeoutMs = getSessionTimeoutMs();
  const lastActivityAt = Number(sessionStorage.getItem(SESSION_LAST_ACTIVITY_AT_KEY));

  if (!Number.isFinite(lastActivityAt) || lastActivityAt <= 0) {
    markSessionStarted();
    return timeoutMs;
  }

  return Math.max(0, timeoutMs - (Date.now() - lastActivityAt));
};
