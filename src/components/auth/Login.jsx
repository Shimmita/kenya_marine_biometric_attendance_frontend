import api from "../../service/Api.jsx";

// Login for Staff using User ID and LDAP
export const loginStaff = async (userId, password) => {
  try {
    const res = await api.post("/auth/signin-staff", {
      userId,
      password,
    });
    return res.data;
  } catch (err) {
    console.log(err)
    throw err.response?.data?.message ;
  }
};

// Login for Intern/Attache using Email
export const loginUser = async (email, password) => {
  try {
    const res = await api.post("/auth/signin", {
      email,
      password,
    });
    return res.data;
  } catch (err) {
    console.log(err)
    throw err.response?.data?.message ;
  }
};
