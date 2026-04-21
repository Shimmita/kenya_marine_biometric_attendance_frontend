import api from "./Api.jsx";

export const requestPasswordReset = async (email) => {
    try {
        const response = await api.post("/auth/request-password-reset", { email });
        return response.data;
    } catch (err) {
        console.log(err);
        throw ("Password reset request failed").toString();
    }
};

export const resetPassword = async (email, code, newPassword) => {
    try {
        const response = await api.post("/auth/reset-password", { email, code, newPassword });
        return response.data;
    } catch (err) {
        console.log(err);
        throw ("Password reset failed").toString();
    }
};
