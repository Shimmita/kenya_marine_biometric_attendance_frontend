import api from "./Api";


// clocking in
export const clockInUser = async () => {
  try {
    const res = await api.post("/attendance/clockin");
    return res.data;
  } catch (err) {
    throw err.response?.data?.message || "Clock-in failed";
  }
};


// clocking out
export const clockOutUser = async () => {
  try {
    const res = await api.post("/attendance/clockout");
    return res.data;
  } catch (err) {
    throw err.response?.data?.message || "Clock-out failed";
  }
};
