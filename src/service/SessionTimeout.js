export const SESSION_TTL_MS = 20 * 60 * 1000;
const LEGACY_SESSION_LOGIN_AT_KEY = "kmfri_session_login_at";
export const SESSION_LAST_ACTIVITY_AT_KEY = "kmfri_session_last_activity_at";
export const SESSION_TIMEOUT_MS_KEY = "kmfri_session_timeout_ms";
export const SESSION_LOGIN_AT_KEY = SESSION_LAST_ACTIVITY_AT_KEY;
export const SESSION_ACTIVITY_HEADER = "X-KMFRI-User-Activity";
export const SESSION_ACTIVITY_HEADER_VALUE = "1";
export const SESSION_REQUEST_ACTIVITY_WINDOW_MS = 15 * 1000;

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

export const getSessionLastActivityAt = () => {
  if (typeof window === "undefined") return 0;

  const lastActivityAt = Number(
    sessionStorage.getItem(SESSION_LAST_ACTIVITY_AT_KEY)
  );

  if (Number.isFinite(lastActivityAt) && lastActivityAt > 0) {
    return lastActivityAt;
  }

  const legacyLoginAt = Number(
    sessionStorage.getItem(LEGACY_SESSION_LOGIN_AT_KEY)
  );

  if (Number.isFinite(legacyLoginAt) && legacyLoginAt > 0) {
    sessionStorage.setItem(SESSION_LAST_ACTIVITY_AT_KEY, String(legacyLoginAt));
    sessionStorage.removeItem(LEGACY_SESSION_LOGIN_AT_KEY);
    return legacyLoginAt;
  }

  return 0;
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

export const getSessionTimeRemaining = ({ initialize = true } = {}) => {
  if (typeof window === "undefined") return SESSION_TTL_MS;

  const timeoutMs = getSessionTimeoutMs();
  const lastActivityAt = getSessionLastActivityAt();

  if (!Number.isFinite(lastActivityAt) || lastActivityAt <= 0) {
    if (initialize) markSessionStarted();
    return timeoutMs;
  }

  return Math.max(0, timeoutMs - (Date.now() - lastActivityAt));
};

export const hasSessionTimedOut = () => {
  const lastActivityAt = getSessionLastActivityAt();
  return lastActivityAt > 0 && getSessionTimeRemaining({ initialize: false }) <= 0;
};

export const wasSessionActiveRecently = (
  activityWindowMs = SESSION_REQUEST_ACTIVITY_WINDOW_MS
) => {
  const lastActivityAt = getSessionLastActivityAt();
  return lastActivityAt > 0 && Date.now() - lastActivityAt <= activityWindowMs;
};
