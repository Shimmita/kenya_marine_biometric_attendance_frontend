import api from "./Api";

export const createLeave = async (payload) => {
    try {
        const { data } = await api.post("/leave", payload);
        return data;
    } catch (err) {
        console.error("Creating leave failed:", err);
        throw err?.response?.data?.message || "Failed to create leave";
    }
};


export const fetchAllLeaves = async () => {
    try {
        const { data } = await api.get("user/all/leaves");
        return data;
    } catch (err) {
        console.error("Fetching leaves failed:", err);
        throw err?.response?.data?.message || "Failed to fetch leaves";
    }
};

export const updateLeave = async (id, payload) => {
    try {
        const { data } = await api.put(`/leave/${id}`, payload);
        return data;
    } catch (err) {
        console.error("Updating leave failed:", err);
        throw err?.response?.data?.message || "Failed to update leave";
    }
};

export const deleteLeave = async (id) => {
    try {
        const { data } = await api.delete(`/leave/${id}`);
        return data;
    } catch (err) {
        console.error("Deleting leave failed:", err);
        throw err?.response?.data?.message || "Failed to delete leave";
    }
};