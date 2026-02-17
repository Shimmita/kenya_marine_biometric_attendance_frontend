import { Box, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { resetClearCurrentUserRedux } from "../../redux/CurrentUser";
import api from "../../service/Api";
import coreDataDetails from "../CoreDataDetails";

const { colorPalette } = coreDataDetails;

const AuthCheck = ({ children, redirectIfAuth = false }) => {
  const dispatch = useDispatch();
  const { user, isOnline } = useSelector((state) => state.currentUser);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // ✅ If Redux already knows user is logged in
      if (isOnline && user) {
        setLoading(false);
        return;
      }

      // 🔄 Only check backend if Redux says no user
      try {
        const res = await api.get("/valid");
        if (!res.data.valid) {
          throw new Error("please login")
        }
      } catch {
        dispatch(resetClearCurrentUserRedux());
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        width="100%"
        height="100vh"
        sx={{ bgcolor: colorPalette.deepNavy }}
        justifyContent="center"
        alignItems="center"
      >
        <CircularProgress size={24} />
      </Box>
    );
  }

  // 🔁 Homepage redirect if already logged in
  if (redirectIfAuth && isOnline) {
    return <Navigate to="/dashboard" replace />;
  }

  // 🔐 Protected route redirect if not logged in
  if (!redirectIfAuth && !isOnline) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AuthCheck;
