import api from "./Api.jsx";

export const requestPasswordReset = async (email) => {
    try {
        const response = await api.post("/auth/request-password-reset", { email });
        return response.data;
    } catch (err) {
        console.log(err);
        const msg = err?.response?.data?.message || err?.message || "Password reset request failed";
        throw msg;
    }
};
