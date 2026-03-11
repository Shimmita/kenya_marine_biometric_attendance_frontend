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

export const fetchAllLeavesAdmin = async () => {
    try {
        const { data } = await api.get("admin/all/leaves");
        return data;
    } catch (err) {
        console.error("Fetching leaves failed:", err);
        throw err?.response?.data?.message || "Failed to fetch leaves";
    }
};

// fetch department leaves for supervisor
export const fetchDepartmentLeaves = async () => {
    try {
        const { data } = await api.get("supervisor/leaves");
        return data;
    } catch (err) {
        console.error("Fetching department leaves failed:", err);
        throw err?.response?.data?.message || "Failed to fetch department leaves";
    }
};

export const updateLeaveAdmin = async (id, payload) => {
    try {
        const { data } = await api.put(`admin/leave/${id}`, payload);
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

// Fetch colleagues in the same station and department
export const fetchColleagues = async () => {
    try {
        const { data } = await api.get("user/colleagues");
        return data;
    } catch (err) {
        console.error("Fetching colleagues failed:", err);
        throw err?.response?.data?.message || "Failed to fetch colleagues";
    }
};

