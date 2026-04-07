import api from "./Api.jsx";

export const fetchAuditLogs = async (params = {}) => {
    try {
        const response = await api.get("/audit/logs", { params });
        return response.data;
    } catch (err) {
        console.error("Fetching audit logs failed:", err);
        throw err?.response?.data?.message || "Failed to fetch audit logs";
    }
};

export const trackClientAuditEvent = async (action, metadata = {}) => {
    try {
        const response = await api.post("/audit/logs/client-event", { action, metadata });
        return response.data;
    } catch (err) {
        console.error("Tracking audit event failed:", err);
        throw err?.response?.data?.message || "Failed to track audit event";
    }
};
