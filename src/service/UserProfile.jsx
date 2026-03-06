import imageCompression from "browser-image-compression";
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



export const updateUserProfile = async ({ phone, newPassword, avatarFile }) => {
    try {
        const formData = new FormData();
        formData.append("phone", phone);

        if (newPassword) formData.append("newPassword", newPassword);

        if (avatarFile) {
            const compressedBlob = await imageCompression(avatarFile, {
                maxSizeMB: 0.3,
                maxWidthOrHeight: 512,
                useWebWorker: true,
            });
            const compressedFile = new File([compressedBlob], avatarFile.name, { type: compressedBlob.type });
            formData.append("avatar", compressedFile);
        }

        const res = await api.put("/user/update-profile", formData);

        return res.data.user;
    } catch (err) {
        console.log(err);
        throw err.response?.data?.message || "Profile update failed";
    }
};