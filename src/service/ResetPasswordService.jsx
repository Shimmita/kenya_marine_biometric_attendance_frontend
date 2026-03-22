import api from "./Api.jsx";

// request password reset
export const requestPasswordReset = async (email) => {
    try {
        const response = await api.post("/auth/request-password-reset", { email });
        return response.data;
    } catch (err) {
        console.log(err);
        throw (err.response?.data?.message || "Password reset request failed").toString();
    }
};

// allow user to reset password by admin by updating the isPasswordReset field to true
export const allowPasswordReset = async (email) => {
    try {
        const response = await api.post("/auth/allow-password-reset", { email });
        return response.data;
    } catch (err) {
        console.log(err);
        throw (err.response?.data?.message || "Allowing password reset failed").toString();
    }
};

// fetch password reset requests for admin
export const fetchPasswordResetRequests = async () => {
    try {
        const response = await api.get("/auth/password-reset-requests");
        return response.data;
    } catch (err) {
        console.log(err);
        throw (err.response?.data?.message || "Failed to fetch password reset requests").toString();
    }
};

// reset password
export const resetPassword = async (email, newPassword) => {
    try {
        const response = await api.post("/auth/reset-password", { email, newPassword });
        return response.data;
    } catch (err) {
        console.log(err);
        throw (err.response?.data?.message || "Password reset failed").toString();
    }
}; 
