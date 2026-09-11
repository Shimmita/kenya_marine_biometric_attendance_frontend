import api from "./Api";

export const getClockingPointEnrollmentOptions = async () => {
  const res = await api.get("/clocking-point/enrollment-options");
  return res.data;
};

export const enrollClockingPoint = async (payload) => {
  const res = await api.post("/clocking-point/enroll", payload);
  return res.data;
};

export const getClockingPoints = async () => {
  const res = await api.get("/clocking-points");
  return res.data;
};

export const updateClockingPoint = async (id, payload) => {
  const res = await api.patch(`/clocking-points/${id}`, payload);
  return res.data;
};

export const getClockingPointStatus = async (deviceFingerprint) => {
  const res = await api.post("/clocking-point/status", { deviceFingerprint });
  return res.data;
};

export const requestClockingPointOtp = async (payload) => {
  const res = await api.post("/clocking-point/challenge/request", payload);
  return res.data;
};

export const verifyClockingPointOtp = async (payload) => {
  const res = await api.post("/clocking-point/challenge/verify", payload);
  return res.data;
};

export default {
  getClockingPointEnrollmentOptions,
  enrollClockingPoint,
  getClockingPoints,
  updateClockingPoint,
  getClockingPointStatus,
  requestClockingPointOtp,
  verifyClockingPointOtp,
};
