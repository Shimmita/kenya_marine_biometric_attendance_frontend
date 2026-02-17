import { Box, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../../service/Api";
import coreDataDetails from "../CoreDataDetails";

const { colorPalette } = coreDataDetails;

const AuthCheck = ({ children, redirectIfAuth = false }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get("/valid");
        setIsAuthenticated(res.data.valid);
      } catch (err) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // ⏳ Loading
  if (isAuthenticated === null) {
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

  // 🔁 If homepage and already logged in → go dashboard
  if (redirectIfAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // 🔐 If protected route and NOT logged in → go home
  if (!redirectIfAuth && !isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AuthCheck;
