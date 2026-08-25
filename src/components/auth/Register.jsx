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

// register a single staff member
export const registerStaff = async (formData) => {
  try {
    const res = await api.post("/auth/staffsignup", formData);
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
    // Preserve row-level validation details for the editable batch preview.
    throw err.response?.data || "Batch registration failed";
  }
};
