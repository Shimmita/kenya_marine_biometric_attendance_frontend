import api from "./Api.jsx";

// get user profile
export const getUserProfile = async () => {
    try {
        const res = await api.get("/user/profile");
        return res.data;
    } catch (err) {
        console.log(err)
        throw err.response?.data?.message;
    }
};


// logout
export const userSignOut = async () => {
    try {
        await api.post("/user/signout");
        
    } catch (err) {
        console.log(err)
        throw err.response?.data?.message;
    }
};