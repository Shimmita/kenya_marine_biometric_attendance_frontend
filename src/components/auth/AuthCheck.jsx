import { Box, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { resetClearCurrentUserRedux } from "../../redux/CurrentUser";
import api from "../../service/Api";
import {
  clearSessionStarted,
  getSessionTimeRemaining,
} from "../../service/SessionTimeout";
import coreDataDetails from "../CoreDataDetails";

const { colorPalette } = coreDataDetails;

const AuthCheck = ({ children, redirectIfAuth = false }) => {
  const dispatch = useDispatch();
  const { isOnline } = useSelector((state) => state.currentUser);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const POLL_INTERVAL_MS = 60 * 1000; // 1 minute

    let refreshTimeout = null;
    let pollInterval = null;
    let active = true;

    const clearClientSession = () => {
      clearSessionStarted();
      dispatch(resetClearCurrentUserRedux());
    };

    const checkAuth = async () => {
      try {
        const res = await api.get("/valid");
        if (!res.data.valid) {
          throw new Error("please login");
        }

        return true;
      } catch {
        clearClientSession();
        return false;
      }
    };

    checkAuth().then((valid) => {
      if (!active) return;

      setLoading(false);

      if (!valid || redirectIfAuth) return;

      refreshTimeout = setTimeout(() => {
        clearClientSession();
        window.location.reload();
      }, getSessionTimeRemaining());

      pollInterval = setInterval(async () => {
        if (!(await checkAuth())) {
          window.location.reload();
        }
      }, POLL_INTERVAL_MS);
    });

    return () => {
      active = false;
      if (refreshTimeout) clearTimeout(refreshTimeout);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [dispatch, redirectIfAuth]);

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
