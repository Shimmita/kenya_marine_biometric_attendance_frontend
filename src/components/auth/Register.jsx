import api from "../../service/Api.jsx";

// register a single user
export const registerUser = async (formData) => {
  try {
    const res = await api.post("/auth/signup", formData);
    return res.data;
  } catch (err) {
    throw err.response?.data?.message || "Registration failed";
  }
};


// register multiple users in batch
export const registerBatchUsers = async (users) => {
  try {
    const res = await api.post("/admin/batch-register", { users });
    return res.data;
  } catch (err) {
    // Throwing the message allows the component's catch block to capture it
    throw err.response?.data?.message || "Batch registration failed";
  }
};