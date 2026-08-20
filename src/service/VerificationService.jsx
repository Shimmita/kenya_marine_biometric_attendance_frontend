import api from "./Api";

/**
 * CREATE VERIFICATION TOKEN
 */
export const createVerification = async (data) => {
  const res = await api.post("/verify/create", { data });
  return res.data; // now returns { token, dataHash }
};

export const createExportVerification = async (data) => {
  const res = await api.post("/verify/export/create", data);
  return res.data;
};

export const updateExportVerificationContent = async (token, data) => {
  const res = await api.put(`/verify/export/${token}/content`, data);
  return res.data;
};

/**
 * VERIFY DOCUMENT
 */
export const verifyDocument = async (token, dataHash = null) => {
  let url = `/verify/${token}`;
  if (dataHash) {
    url += `?hash=${encodeURIComponent(dataHash)}`;
  }
  const res = await api.get(url);
  return res.data;
};
