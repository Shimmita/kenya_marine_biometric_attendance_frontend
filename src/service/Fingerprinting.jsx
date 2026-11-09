import FingerprintJS from '@fingerprintjs/fingerprintjs';

let deviceFingerprintPromise;
const DEVICE_INSTALLATION_ID_KEY = "kmfri_device_installation_id";
let deviceInstallationIdPromise;

export const getDeviceFingerprint = async () => {
  if (!deviceFingerprintPromise) {
    deviceFingerprintPromise = FingerprintJS.load()
      .then(fp => fp.get())
      .then(result => result.visitorId);
  }

  return deviceFingerprintPromise;
};

export const getDeviceInstallationId = async () => {
  if (!deviceInstallationIdPromise) {
    deviceInstallationIdPromise = Promise.resolve().then(() => {
      try {
        const existingId = window.localStorage.getItem(DEVICE_INSTALLATION_ID_KEY);
        if (existingId && /^[a-f0-9]{48}$/.test(existingId)) return existingId;

        const cryptoApi = window.crypto;
        if (!cryptoApi?.getRandomValues) {
          throw new Error("Secure random generation is unavailable.");
        }

        const randomBytes = new Uint8Array(24);
        cryptoApi.getRandomValues(randomBytes);
        const installationId = Array.from(randomBytes, (byte) =>
          byte.toString(16).padStart(2, "0")
        ).join("");

        window.localStorage.setItem(DEVICE_INSTALLATION_ID_KEY, installationId);
        return installationId;
      } catch (error) {
        console.warn(
          "Persistent device identity is unavailable; using legacy fingerprint matching for this session.",
          error
        );
        return "";
      }
    });
  }

  return deviceInstallationIdPromise;
};
