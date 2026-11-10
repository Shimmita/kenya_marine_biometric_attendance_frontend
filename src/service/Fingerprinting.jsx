import FingerprintJS from '@fingerprintjs/fingerprintjs';

let deviceFingerprintPromise;

/**
 * FingerprintJS visitorId. Deterministic hash of browser/hardware traits, so
 * look-alike devices (same model, OS and browser version) can share it.
 */
export const getDeviceFingerprint = async () => {
  if (!deviceFingerprintPromise) {
    deviceFingerprintPromise = FingerprintJS.load()
      .then(fp => fp.get())
      .then(result => result.visitorId);
  }

  return deviceFingerprintPromise;
};

// Survives logout: logout only removes "persist:root".
const DEVICE_INSTALL_ID_KEY = 'kmfri:device_install_id';
const DEVICE_INSTALL_ID_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

let cachedDeviceInstallId = '';

const generateDeviceInstallId = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();

  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Random ID created once per browser install and kept in localStorage.
 * Lets the server tell "same browser on another account" apart from a
 * different device that merely shares a fingerprint.
 * Never throws: returns '' if storage/crypto are unavailable (server then
 * falls back to its legacy fingerprint-only rule).
 */
export const getDeviceInstallId = () => {
  if (cachedDeviceInstallId) return cachedDeviceInstallId;

  try {
    const stored = window.localStorage.getItem(DEVICE_INSTALL_ID_KEY);
    if (stored && DEVICE_INSTALL_ID_PATTERN.test(stored)) {
      cachedDeviceInstallId = stored;
      return cachedDeviceInstallId;
    }
  } catch {
    // storage blocked: fall through and keep an in-memory ID for this session
  }

  try {
    cachedDeviceInstallId = generateDeviceInstallId();
  } catch {
    return '';
  }

  try {
    window.localStorage.setItem(DEVICE_INSTALL_ID_KEY, cachedDeviceInstallId);
  } catch {
    // ignore: ID still works for this session
  }

  return cachedDeviceInstallId;
};
