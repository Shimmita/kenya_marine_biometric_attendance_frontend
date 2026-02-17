import api from "./Api";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";

/**
 * Register fingerprint — run ONCE per user device.
 * On success the credential is stored in the DB linked to their account.
 */
export const registerFingerprint = async () => {
  try {
    const { data: options } = await api.get("/biometric/register/challenge");
    const credential = await startRegistration(options);
    await api.post("/biometric/register/verify", credential);
    return true;
  } catch (err) {
    console.error("Fingerprint registration failed:", err);
    // Surface the server's error message when available
    throw err?.response?.data?.message || "Fingerprint registration failed";
  }
};

/**
 * Verify fingerprint — run before every clock-in / clock-out.
 * On success the session is marked as biometrically verified for 2 minutes.
 */
export const verifyFingerprint = async (selectedStation) => {
  try {
    const { data: options } = await api.get("/biometric/auth/challenge");
    const authResponse = await startAuthentication(options);
    await api.post("/biometric/auth/verify", { ...authResponse, selectedStation });
    return true;
  } catch (err) {
    console.error("Fingerprint verification failed:", err);
    throw err?.response?.data?.message || "clockin/clockout failed, try again";
  }
};