import api from "./Api";

export const fetchUserNotifications = async () => {
    try {
        const { data } = await api.get("/user/notification");
        return data;
    } catch (err) {
        console.error("Fetching user notifications failed:", err);
        throw err?.response?.data?.message || "Failed to fetch user notifications";
    }
};


export const fetchAdminNotifications = async () => {
    try {
        const { data } = await api.get("/admin/notification");
        return data;
    } catch (err) {
        console.error("Fetching admin notifications failed:", err);
        throw err?.response?.data?.message || "Failed to fetch admin notifications";
    }
};


export const deleteUserNotification = async (id) => {
    try {
        await api.delete(`/user/notification/${id}`);
        return true;
    } catch (err) {
        console.error("Delete failed:", err);
        throw err?.response?.data?.message || "Delete failed";
    }
};

