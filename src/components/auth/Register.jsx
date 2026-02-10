import api from "../../service/Api.jsx";
export const registerUser = async (formData) => {
  try {
    console.log('registering..')
    const res = await api.post("/auth/signup", formData);
    return res.data;
  } catch (err) {
    throw err.response?.data?.message || "Registration failed";
  }
};
