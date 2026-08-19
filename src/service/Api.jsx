import axios from "axios";

const DEFAULT_API_BASE_ROUTE = "/kmfri/attendance/api/v1";
const DEFAULT_API_TIMEOUT_MS = 60000;

const parsePositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const isLocalHostname = (hostname = "") =>
  ["localhost", "127.0.0.1", "::1"].includes(hostname);

const resolveApiBaseUrl = () => {
  const configured = trimTrailingSlash(import.meta.env.VITE_BACKEND_BASE_ROUTE);

  if (typeof window === "undefined") {
    return configured || DEFAULT_API_BASE_ROUTE;
  }

  const { hostname, protocol } = window.location;
  const configuredIsLocalBackend = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?/i.test(configured);
  const configuredIsInsecureAbsolute = /^http:\/\//i.test(configured);

  if (
    configured &&
    !isLocalHostname(hostname) &&
    (configuredIsLocalBackend || (protocol === "https:" && configuredIsInsecureAbsolute))
  ) {
    return DEFAULT_API_BASE_ROUTE;
  }

  return configured || DEFAULT_API_BASE_ROUTE;
};

export const BIOMETRIC_REQUEST_TIMEOUT_MS = parsePositiveNumber(
  import.meta.env.VITE_BIOMETRIC_REQUEST_TIMEOUT_MS,
  120000
);

export const biometricRequestConfig = {
  timeout: BIOMETRIC_REQUEST_TIMEOUT_MS,
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  timeout: parsePositiveNumber(
    import.meta.env.VITE_API_TIMEOUT_MS,
    DEFAULT_API_TIMEOUT_MS
  ),
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      error.response = error.response || {
        data: {
          message: "Request timed out. Please try again.",
        },
      };
    }

    return Promise.reject(error);
  }
);

export default api;
