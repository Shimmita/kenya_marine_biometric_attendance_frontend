import FingerprintJS from '@fingerprintjs/fingerprintjs';

let deviceFingerprintPromise;

export const getDeviceFingerprint = async () => {
  if (!deviceFingerprintPromise) {
    deviceFingerprintPromise = FingerprintJS.load()
      .then(fp => fp.get())
      .then(result => result.visitorId);
  }

  return deviceFingerprintPromise;
};
