import api from "./Api";

/**
 * CREATE VERIFICATION TOKEN
 */
export const createVerification = async (data) => {
  const res = await api.post("/verify/create", { data });
  return res.data; // now returns { token, dataHash }
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