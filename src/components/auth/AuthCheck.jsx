import { Box, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { resetClearCurrentUserRedux } from "../../redux/CurrentUser";
import api from "../../service/Api";
import {
  clearSessionStarted,
  getSessionTimeRemaining,
  markSessionStarted,
} from "../../service/SessionTimeout";
import coreDataDetails from "../CoreDataDetails";

const { colorPalette } = coreDataDetails;

const AuthCheck = ({ children, redirectIfAuth = false }) => {
  const dispatch = useDispatch();
  const { isOnline } = useSelector((state) => state.currentUser);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ACTIVITY_EVENTS = [
      "mousemove",
      "keydown",
      "mousedown",
      "touchstart",
      "scroll",
    ];
    const ACTIVITY_HEARTBEAT_MS = 5 * 60 * 1000; // send auth probe at most every 5 minutes on activity

    let refreshTimeout = null;
    let active = true;
    const lastHeartbeatAt = { current: 0 };

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

    const scheduleLogout = () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      refreshTimeout = window.setTimeout(async () => {
        clearClientSession();
        try {
          await api.post("/user/signout");
        } catch {
          // ignore network issues during idle logout
        }
        window.location.reload();
      }, getSessionTimeRemaining());
    };

    const handleUserActivity = async () => {
      markSessionStarted();
      scheduleLogout();

      const now = Date.now();
      if (now - lastHeartbeatAt.current > ACTIVITY_HEARTBEAT_MS) {
        lastHeartbeatAt.current = now;
        if (await checkAuth()) {
          scheduleLogout();
        } else {
          window.location.reload();
        }
      }
    };

    const attachActivityListeners = () => {
      ACTIVITY_EVENTS.forEach((eventName) =>
        document.addEventListener(eventName, handleUserActivity, { passive: true })
      );
    };

    const removeActivityListeners = () => {
      ACTIVITY_EVENTS.forEach((eventName) =>
        document.removeEventListener(eventName, handleUserActivity)
      );
    };

    checkAuth().then((valid) => {
      if (!active) return;

      setLoading(false);

      if (!valid || redirectIfAuth) return;

      markSessionStarted();
      scheduleLogout();
      attachActivityListeners();
    });

    return () => {
      active = false;
      if (refreshTimeout) clearTimeout(refreshTimeout);
      removeActivityListeners();
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
