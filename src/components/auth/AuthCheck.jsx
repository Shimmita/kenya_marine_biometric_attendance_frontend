import { Box, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { resetClearCurrentUserRedux } from "../../redux/CurrentUser";
import api from "../../service/Api";
import {
  clearSessionStarted,
  getSessionTimeRemaining,
  hasSessionTimedOut,
  markSessionStarted,
  SESSION_ACTIVITY_HEADER,
  SESSION_ACTIVITY_HEADER_VALUE,
  setSessionTimeoutMs,
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
      "wheel",
    ];
    const ACTIVITY_HEARTBEAT_MS = 5 * 60 * 1000; // send auth probe at most every 5 minutes on activity
    const SESSION_VALIDATION_INTERVAL_MS = 60 * 1000;

    let refreshTimeout = null;
    let validationInterval = null;
    let active = true;
    const lastHeartbeatAt = { current: 0 };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleUserActivity();
      }
    };

    const clearClientSession = () => {
      clearSessionStarted();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("persist:root");
      }
      dispatch(resetClearCurrentUserRedux());
    };

    const checkAuth = async ({ causedByActivity = false } = {}) => {
      try {
        const res = await api.get(
          "/valid",
          causedByActivity
            ? {
                headers: {
                  [SESSION_ACTIVITY_HEADER]: SESSION_ACTIVITY_HEADER_VALUE,
                },
              }
            : undefined
        );
        if (res.data.reason === "maintenance_mode" || res.data.code === "MAINTENANCE_MODE") {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(
              "kmfri_maintenance_status",
              JSON.stringify(res.data.maintenance || {})
            );
            window.location.assign("/maintenance");
          }
          return false;
        }

        if (!res.data.valid) {
          throw new Error("please login");
        }

        if (res.data.sessionTimeoutMs) {
          setSessionTimeoutMs(res.data.sessionTimeoutMs);
        }

        return true;
      } catch {
        clearClientSession();
        return false;
      }
    };

    const logoutForIdleSession = async () => {
      clearClientSession();
      try {
        await api.post("/user/signout");
      } catch {
        // ignore network issues during idle logout
      }

      if (typeof window !== "undefined") {
        if (window.location.pathname === "/") {
          window.location.reload();
        } else {
          window.location.assign("/");
        }
      }
    };

    const scheduleLogout = () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      const remainingMs = getSessionTimeRemaining({ initialize: false });

      if (remainingMs <= 0) {
        logoutForIdleSession();
        return;
      }

      refreshTimeout = window.setTimeout(async () => {
        if (getSessionTimeRemaining({ initialize: false }) > 1000) {
          scheduleLogout();
          return;
        }

        await logoutForIdleSession();
      }, remainingMs);
    };

    const startSessionValidation = () => {
      if (validationInterval) clearInterval(validationInterval);
      validationInterval = window.setInterval(async () => {
        if (!active) return;

        if (hasSessionTimedOut()) {
          await logoutForIdleSession();
          return;
        }

        if (!(await checkAuth())) {
          window.location.reload();
        }
      }, SESSION_VALIDATION_INTERVAL_MS);
    };

    const handleUserActivity = async () => {
      if (hasSessionTimedOut()) {
        await logoutForIdleSession();
        return;
      }

      markSessionStarted();
      scheduleLogout();

      const now = Date.now();
      if (now - lastHeartbeatAt.current > ACTIVITY_HEARTBEAT_MS) {
        lastHeartbeatAt.current = now;
        if (await checkAuth({ causedByActivity: true })) {
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
      window.addEventListener("focus", handleUserActivity);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    };

    const removeActivityListeners = () => {
      ACTIVITY_EVENTS.forEach((eventName) =>
        document.removeEventListener(eventName, handleUserActivity)
      );
      window.removeEventListener("focus", handleUserActivity);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };

    checkAuth({ causedByActivity: !hasSessionTimedOut() }).then((valid) => {
      if (!active) return;

      setLoading(false);

      if (!valid || redirectIfAuth) return;

      markSessionStarted();
      scheduleLogout();
      attachActivityListeners();
      startSessionValidation();
    });

    return () => {
      active = false;
      if (refreshTimeout) clearTimeout(refreshTimeout);
      if (validationInterval) clearInterval(validationInterval);
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
