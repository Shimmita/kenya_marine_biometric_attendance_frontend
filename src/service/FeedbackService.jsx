import api from "./Api";

// submit feedback
export const submitFeedback = async (payload) => {
    try {
        const res = await api.post("/feedback",payload);
        return res.data;
    } catch (err) {
        console.log(err)
        throw err.response?.data?.message;
    }
};

// get all the analysed/stats feebacks from backend
export const getFeedbackAnalytics = async () => {
  try {
    const res = await api.get("/admin/feedback/analytics");
    return res.data;
  } catch (err) {
    throw err.response?.data?.message;
  }
};