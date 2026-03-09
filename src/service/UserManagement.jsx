import api from "./Api";

export const toggleUserActive = async (userId) => {
    try {
        const res = await api.put(`/admin/user/${userId}/toggle-active`);
        return res.data;
    } catch (err) {
        console.log(err);
        throw err.response?.data?.message;
    }
};

export const updateUserRank = async (userId, rank) => {
    try {
        const res = await api.put(`/admin/user/${userId}/update-rank`, {
            rank
        });
        return res.data;
    } catch (err) {
        console.log(err);
        throw err.response?.data?.message;
    }
};


export const updateUserRole = async (userId, role) => {
    try {
        const res = await api.put(`/admin/user/${userId}/update-role`, {
            role
        });
        return res.data;
    } catch (err) {
        console.log(err);
        throw err.response?.data?.message;
    }
};

export const getAllUsers = async () => {
    try {
        const res = await api.get(`/admin/users`);
        return res.data;
    } catch (err) {
        console.log(err);
        throw err.response?.data?.message;
    }
};


export const getAllUsersDepartment = async () => {
    try {
        const res = await api.get(`/supervisor/users`);
        return res.data;
    } catch (err) {
        console.log(err);
        throw err.response?.data?.message;
    }
};


export const updateUserDepartment = async (userId, department) => {
    try {
        const res = await api.put(`/admin/user/${userId}/update-department`, {
            department
        });
        return res.data;
    } catch (err) {
        console.log(err);
        throw err.response?.data?.message;
    }
};

export const updateUserStation = async (userId, station) => {
    try {
        const res = await api.put(`/admin/user/${userId}/update-station`, {
            station
        });
        return res.data;
    } catch (err) {
        console.log(err);
        throw err.response?.data?.message;
    }
};


export const getAllSupervisors = async () => {
    try {
        const res = await api.get(`/all/supervisors`);
        return res.data;
    } catch (err) {
        console.log(err);
        throw err.response?.data?.message;
    }
};


export const updateUserSupervisor = async (userId, supervisor) => {
    try {
        console.log('here try',supervisor)
        const res = await api.put(`/admin/user/${userId}/update-supervisor`, {
            supervisor
        });
        return res.data;
    } catch (err) {
        console.log('here',err)
        console.log(err);
        throw err.response?.data?.message;
    }
};

export const updateClockOutsideStatus = async (userId, clockingData) => {
    try {
        // This sends the startDate, endDate, and reason to the backend
        const res = await api.put(`/admin/user/${userId}/update-clock-outside`, {
            ...clockingData
        });
        return res.data;
    } catch (err) {
        console.error("Error updating clock outside status:", err);
        throw err.response?.data?.message || "Failed to update clocking status";
    }
};

export const revokeClockOutsideStatus = async (userId) => {
    try {
        const res = await api.put(`/admin/user/${userId}/revoke-clock-outside`);
        return res.data;
    } catch (err) {
        console.error("Error revoking clock outside status:", err);
        throw err.response?.data?.message || "Failed to revoke authorization";
    }
};