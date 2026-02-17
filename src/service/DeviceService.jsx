import api from "./Api";

// submit lost device 
export const submitLostDeviceRequest = async (payload) => {
    try {
        const res = await api.post("/device/lost/request", payload);
        return res.data;
    } catch (err) {
        throw err.response?.data?.message || "Failed to submit lost device request";
    }
};


// get all lost device request (HR/ADMIN/SUPERVISOR)
export const fetchAllLostDevices = async () => {
    try {
        const res = await api.get("/device/lost/all");
        return res.data;
    } catch (err) {
        throw err.response?.data?.message || "Failed to fetch lost device requests";
    }
};


// respond to the lost device
export const respondToLostDevice = async (requestId, action) => {
    try {
        const res = await api.post("/device/lost/respond", {
            requestId,
            action, // "granted" or "rejected"
        });
        return res.data;
    } catch (err) {
        throw err.response?.data?.message || "Failed to respond to request";
    }
};


// add new device for multiple clocking
export const addNewDevice = async (payload) => {
    try {
        const res = await api.post("/device/add", payload);
        return res.data;
    } catch (err) {
        throw err.response?.data?.message || "Failed to add device";
    }
};


// user fetches their devices
export const fetchMyDevices = async () => {
    try {
        const res = await api.get("/device/my-devices");
        return res.data;
    } catch (err) {
        throw err.response?.data?.message || "Failed to fetch devices";
    }
};


//fetch my lost device requests
export const fetchMyLostRequests = async () => {
  try {
    const res = await api.get("/device/lost/my-requests");
    return res.data;
  } catch (err) {
    throw err.response?.data?.message || "Failed to fetch your lost requests";
  }
};


