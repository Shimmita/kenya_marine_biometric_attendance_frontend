import api, { biometricRequestConfig } from "./Api";
import {
  startAuthentication,
  startRegistration,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";

/**
 * Ensure browser/device supports WebAuthn
 */
const ensureWebAuthnSupport = async () => {
  if (!window.isSecureContext) {
    throw new Error(
      "Biometric authentication requires HTTPS or localhost"
    );
  }

  if (!browserSupportsWebAuthn()) {
    throw new Error(
      "This device or browser does not support biometric authentication"
    );
  }

  const platformAuthenticatorAvailable =
    await platformAuthenticatorIsAvailable().catch(() => false);

  if (!platformAuthenticatorAvailable) {
    throw new Error(
      "No device biometric or screen-lock authenticator is available in this browser"
    );
  }
};

const getBiometricErrorMessage = (err, fallback) => {
  if (err?.code === "ERR_NETWORK" || err?.message === "Network Error") {
    return "Network connection failed. Please refresh and try again.";
  }

  if (err?.code === "ECONNABORTED") {
    return "Biometric request timed out. Please try again.";
  }

  return err?.response?.data?.message || err?.message || fallback;
};

export const fetchBiometricStatus = async (device_fingerprint) => {
  try {
    const { data } = await api.get("/biometric/status", {
      params: { device_fingerprint },
      ...biometricRequestConfig,
    });

    return data;
  } catch (err) {
    throw getBiometricErrorMessage(err, "Failed to check biometric status");
  }
};

/**
 * Register fingerprint/device biometric
 * Runs once per device enrollment
 */
export const registerFingerprint = async (device = {}) => {
  try {
    await ensureWebAuthnSupport();

    // fetch registration challenge/options
    const { data: options } = await api.get(
      "/biometric/register/challenge",
      {
        params: { device_fingerprint: device.device_fingerprint },
        ...biometricRequestConfig,
      }
    );

    if (options?.registered || options?.alreadyRegistered) {
      return options;
    }

    // trigger WebAuthn registration
    const credential = await startRegistration({ optionsJSON: options });

    // verify + persist credential
    const { data } = await api.post(
      "/biometric/register/verify",
      {
        credential,
        device,
      },
      biometricRequestConfig
    );

    return data;
  } catch (err) {
    console.error("Fingerprint registration failed:", err);

    // user manually cancelled biometric prompt
    if (err?.name === "AbortError") {
      throw "Biometric registration was cancelled";
    }

    // timeout exceeded
    if (err?.name === "NotAllowedError") {
      throw "Biometric request timed out or was denied";
    }

    // browser/device incompatibility
    if (err?.name === "NotSupportedError") {
      throw "This device does not support biometric authentication";
    }

    // duplicate / invalid credential
    if (err?.name === "InvalidStateError") {
      const status = await fetchBiometricStatus(device.device_fingerprint).catch(() => null);
      if (status?.registered) {
        return {
          registered: true,
          alreadyRegistered: true,
          currentDeviceRegistered: status.currentDeviceRegistered,
        };
      }

      throw "This biometric credential is already registered";
    }

    // server error
    throw getBiometricErrorMessage(err, "Fingerprint registration failed");
  }
};

/**
 * Verify biometric before clock-in / clock-out
 */
export const verifyFingerprint = async (
  selectedStation,
  userCoords,
  device_fingerprint,
  outsideLocation = null,
  isWithinGeofence = null,
  expectedAction = null
) => {
  try {
    await ensureWebAuthnSupport();

    // fetch authentication challenge/options
    const { data: options } = await api.get(
      "/biometric/auth/challenge",
      {
        params: { device_fingerprint },
        ...biometricRequestConfig,
      }
    );

    // trigger WebAuthn auth flow
    const authResponse = await startAuthentication({ optionsJSON: options });

    // verify authentication
    const { data } = await api.post(
      "/biometric/auth/verify",
      {
        ...authResponse,
        selectedStation,
        userCoords,
        device_fingerprint,
        outsideLocation,
        isWithinGeofence,
        expectedAction,
      },
      biometricRequestConfig
    );

    return data;
  } catch (err) {
    console.error("Fingerprint verification failed:", err);

    // user cancelled prompt
    if (err?.name === "AbortError") {
      throw "Biometric verification cancelled";
    }

    // timeout / denied / dismissed
    if (err?.name === "NotAllowedError") {
      throw "Biometric verification timed out or was denied";
    }

    // browser incompatibility
    if (err?.name === "NotSupportedError") {
      throw "This device does not support biometric verification";
    }

    // authenticator mismatch
    if (err?.name === "InvalidStateError") {
      throw "Biometric credential mismatch detected";
    }

    // server-side error
    throw getBiometricErrorMessage(err, "Clock-in / clock-out failed, try again");
  }
};
