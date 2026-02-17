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


// fetch clocking history for user
export const fetchClockingHistory = async (limit) => {
  try {
    const res = await api.get(`user/attendance/history?limit=${limit}`);
    return res.data;
  } catch (err) {
    throw err.response?.data?.message || "Failed to fetch clocking history";
  }
};

// for user
export const fetchAttendanceStats = async () => {
  try {
    const res = await api.get("/user/attendance/stats");
    return res.data;
  } catch (err) {
    throw err.response?.data?.message || "Failed to fetch statistics";
  }
};

//for overall org
export const fetchOverallOrgStats = async () => {
  try {
    const res = await api.get("/overall/attendance/stats");
    return res.data;
  } catch (err) {
    throw err.response?.data?.message || "Failed to fetch statistics";
  }
};
