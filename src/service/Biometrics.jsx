import api from "./Api";
import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";

/**
 * 🔐 Register fingerprint (ONE TIME)
 */
export const registerFingerprint = async () => {
  try {
    // 1️⃣ Get registration challenge
    const { data: options } = await api.get(
      "/biometric/register/challenge"
    );

    console.log("reg options", options);

    // 2️⃣ Trigger OS fingerprint prompt
    const credential = await startRegistration(options);

    console.log(credential)

    // 3️⃣ Verify registration
    await api.post(
      "/biometric/register/verify",
      credential
    );

    return true;
  } catch (err) {
    console.error("Fingerprint registration failed:", err);
    throw "Fingerprint registration failed";
  }
};

/**
 * 🔐 Verify fingerprint (EVERY CLOCK-IN)
 */
export const verifyFingerprint = async () => {
  try {
    // 1️⃣ Get authentication challenge
    const { data: options } = await api.get(
      "/biometric/auth/challenge"
    );

    console.log('auth options',options)

    // 2️⃣ Trigger fingerprint scan
    const authResponse = await startAuthentication(options);

    console.log("authresponseStartAuth: ",authResponse)

    // 3️⃣ Verify with backend
    await api.post(
      "/biometric/auth/verify",
      authResponse
    );

    return true;
  } catch (err) {
    console.log(err)
    console.error("Fingerprint verification failed:", err);
    throw "Fingerprint verification failed";
  }
};
