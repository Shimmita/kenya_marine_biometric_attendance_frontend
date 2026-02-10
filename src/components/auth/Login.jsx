import api from "../../service/Api.jsx";
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
