export const SESSION_TTL_MS = 20 * 60 * 1000;
export const SESSION_LOGIN_AT_KEY = "kmfri_session_login_at";

export const markSessionStarted = () => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_LOGIN_AT_KEY, String(Date.now()));
};

export const clearSessionStarted = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_LOGIN_AT_KEY);
};

export const getSessionTimeRemaining = () => {
  if (typeof window === "undefined") return SESSION_TTL_MS;

  const loginAt = Number(sessionStorage.getItem(SESSION_LOGIN_AT_KEY));

  if (!Number.isFinite(loginAt) || loginAt <= 0) {
    markSessionStarted();
    return SESSION_TTL_MS;
  }

  return Math.max(0, SESSION_TTL_MS - (Date.now() - loginAt));
};
