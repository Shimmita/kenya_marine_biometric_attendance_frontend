import {
  AccessTimeRounded,
  BadgeRounded,
  CheckCircleRounded,
  GroupsRounded,
  KeyboardArrowLeftRounded,
  LocationOnRounded,
  PhoneIphoneRounded,
  SchoolRounded,
  ShieldRounded,
  WarningAmberRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import kmfriLogo from "../images/kmfri_logo.png";
import clockingImage from "../images/clocking_image_1.png";
import {
  getClockingPointStatus,
  requestClockingPointOtp,
  verifyClockingPointOtp,
} from "../service/ClockingPointService";
import { getDeviceFingerprint } from "../service/Fingerprinting";

const accountTypes = [
  { value: "staff", label: "STAFF", caption: "Staff Number", icon: <BadgeRounded /> },
  { value: "intern", label: "INTERN", caption: "ID Number", icon: <SchoolRounded /> },
  { value: "attachee", label: "ATTACHEE", caption: "ID Number", icon: <GroupsRounded /> },
];

const formatClockTime = (date = new Date()) =>
  date.toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Africa/Nairobi",
  });

const formatDateLabel = (date = new Date()) =>
  date.toLocaleDateString("en-KE", {
    weekday: "long",
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  });

const formatMinuteSeconds = (seconds) => {
  const value = Math.max(0, Number(seconds || 0));
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
};

const getActionLabel = (action = "") => (action === "clock_out" ? "CLOCK-OUT" : "CLOCK-IN");

const initialEmployeeState = {
  accountType: "",
  identifier: "",
  otp: "",
  challenge: null,
  userName: "",
  success: null,
};

export default function ClockingPoint() {
  const navigate = useNavigate();
  const resetTimerRef = useRef(null);
  const [deviceFingerprint, setDeviceFingerprint] = useState("");
  const [clockingPoint, setClockingPoint] = useState(null);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [employee, setEmployee] = useState(initialEmployeeState);
  const [expiresIn, setExpiresIn] = useState(0);

  const selectedAccount = accountTypes.find((type) => type.value === employee.accountType);
  const identifierLabel = employee.accountType === "staff" ? "Staff Number" : "ID Number";
  const otpDigits = useMemo(() => employee.otp.replace(/\D/g, "").slice(0, 8), [employee.otp]);
  const progressValue = employee.challenge?.expiresInSeconds
    ? Math.max(0, Math.min(100, (expiresIn / employee.challenge.expiresInSeconds) * 100))
    : 0;

  const clearEmployeeState = useCallback(() => {
    setEmployee(initialEmployeeState);
    setExpiresIn(0);
    setError("");
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const fingerprint = await getDeviceFingerprint();
      setDeviceFingerprint(fingerprint);
      const data = await getClockingPointStatus(fingerprint);
      setClockingPoint(data.clockingPoint);
    } catch (err) {
      setClockingPoint(null);
      setError(err?.response?.data?.message || err?.message || "This device is not registered as an active KMFRI Clocking Point.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!employee.challenge?.expiresAt) return undefined;
    const timer = setInterval(() => {
      const remaining = Math.ceil((new Date(employee.challenge.expiresAt).getTime() - Date.now()) / 1000);
      setExpiresIn(Math.max(0, remaining));
    }, 250);
    return () => clearInterval(timer);
  }, [employee.challenge?.expiresAt]);

  useEffect(() => {
    if (!employee.success) return undefined;
    resetTimerRef.current = setTimeout(clearEmployeeState, 3000);
    return () => clearTimeout(resetTimerRef.current);
  }, [clearEmployeeState, employee.success]);

  const requestOtp = async (resend = false) => {
    if (!employee.accountType || !employee.identifier.trim()) return;
    try {
      setBusy(true);
      setError("");
      const data = await requestClockingPointOtp({
        deviceFingerprint,
        accountType: employee.accountType,
        identifier: employee.identifier.trim(),
        resendChallengeId: resend ? employee.challenge?.challengeId : undefined,
      });
      setEmployee((previous) => ({
        ...previous,
        otp: "",
        userName: data.user?.name || "",
        challenge: data,
      }));
      setExpiresIn(Number(data.expiresInSeconds || 0));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Could not send OTP.");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    if (!employee.challenge?.challengeId || !otpDigits) return;
    try {
      setBusy(true);
      setError("");
      const data = await verifyClockingPointOtp({
        deviceFingerprint,
        challengeId: employee.challenge.challengeId,
        otp: otpDigits,
      });
      setEmployee((previous) => ({
        ...previous,
        success: {
          action: data.meta?.action,
          name: data.user?.name || previous.userName,
          time: data.timestamp?.time,
          station: data.meta?.clockingPoint?.station || clockingPoint?.station,
          pointName: data.meta?.clockingPoint?.name || clockingPoint?.name,
        },
      }));
    } catch (err) {
      setEmployee((previous) => ({ ...previous, otp: "" }));
      setError(err?.response?.data?.message || err?.message || "OTP verification failed.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <StatusPanel clockingPoint={null} now={now} tone="loading" />
        <MainPanel>
          <Stack spacing={2.2} alignItems="center" justifyContent="center" sx={{ minHeight: 360 }}>
            <CircularProgress size={42} thickness={4.5} />
            <Typography sx={eyebrowSx}>KMFRI CLOCKING POINT</Typography>
            <Typography sx={headlineSx}>Preparing device</Typography>
          </Stack>
        </MainPanel>
      </Shell>
    );
  }

  if (!clockingPoint) {
    return (
      <Shell>
        <StatusPanel clockingPoint={null} now={now} tone="blocked" />
        <MainPanel>
          <Stack spacing={2.5} alignItems="center" justifyContent="center" sx={{ minHeight: 420, textAlign: "center" }}>
            <Box sx={dangerIconSx}>
              <WarningAmberRounded sx={{ fontSize: 54 }} />
            </Box>
            <Box>
              <Typography sx={eyebrowSx}>CLOCKING POINT UNAVAILABLE</Typography>
              <Typography sx={errorHeadlineSx}>Device not enrolled</Typography>
            </Box>
            <Typography sx={bodyTextSx}>{error}</Typography>
            <Button variant="contained" onClick={() => navigate("/")} sx={singleButtonSx}>OK</Button>
          </Stack>
        </MainPanel>
      </Shell>
    );
  }

  if (employee.success) {
    return (
      <Shell>
        <StatusPanel clockingPoint={clockingPoint} now={now} tone="success" />
        <MainPanel>
          <Stack spacing={2.3} alignItems="center" justifyContent="center" sx={{ minHeight: 500, textAlign: "center" }}>
            <Box sx={successIconSx}>
              <CheckCircleRounded sx={{ fontSize: 72 }} />
            </Box>
            <Box>
              <Typography sx={eyebrowSx}>ATTENDANCE RECORDED</Typography>
              <Typography sx={{ ...headlineSx, fontSize: { xs: 38, sm: 52 } }}>
                {employee.success.action === "clock_out" ? "CLOCKED OUT" : "CLOCKED IN"}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: { xs: 26, sm: 34 }, fontWeight: 950, color: "#102033" }}>
              {employee.success.name}
            </Typography>
            <Box sx={successMetaSx}>
              <AccessTimeRounded />
              <Typography sx={{ fontWeight: 950 }}>{employee.success.time}</Typography>
            </Box>
            <Stack spacing={0.4} alignItems="center">
              <Typography sx={bodyTextSx}>{employee.success.station}</Typography>
              <Typography sx={{ ...bodyTextSx, color: "#0A3D62" }}>{employee.success.pointName}</Typography>
            </Stack>
          </Stack>
        </MainPanel>
      </Shell>
    );
  }

  return (
    <Shell>
      <StatusPanel clockingPoint={clockingPoint} now={now} tone="ready" />
      <MainPanel>
        <Stack spacing={{ xs: 2.2, sm: 3 }} sx={{ width: "100%" }}>
          <Stack spacing={1.2}>
            <Typography sx={eyebrowSx}>KMFRI CLOCKING POINT</Typography>
            <Typography sx={headlineSx}>
              {employee.challenge
                ? `Verify ${getActionLabel(employee.challenge.action)}`
                : employee.accountType
                  ? identifierLabel
                  : "Select account type"}
            </Typography>
            <Typography sx={bodyTextSx}>
              {employee.challenge
                ? `Code sent to your registered phone ending in ${employee.challenge.phoneMasked}`
                : employee.accountType
                  ? selectedAccount?.caption
                  : "Use the option that matches your KMFRI account."}
            </Typography>
          </Stack>

          {error && (
            <Alert
              severity="warning"
              sx={{
                borderRadius: "8px",
                border: "1px solid rgba(217,119,6,0.24)",
                fontWeight: 800,
              }}
            >
              {error}
            </Alert>
          )}

          {!employee.accountType && (
            <Box sx={accountGridSx}>
              {accountTypes.map((type) => (
                <Button
                  key={type.value}
                  variant="outlined"
                  onClick={() => setEmployee((previous) => ({ ...previous, accountType: type.value }))}
                  sx={accountButtonSx}
                >
                  <Box sx={accountIconSx}>{type.icon}</Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: { xs: 22, md: 25 }, fontWeight: 950 }}>{type.label}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 850, color: "#64748B" }}>{type.caption}</Typography>
                  </Box>
                </Button>
              ))}
            </Box>
          )}

          {employee.accountType && !employee.challenge && (
            <Stack spacing={2.4} sx={{ width: "100%", maxWidth: 560 }}>
              <Button startIcon={<KeyboardArrowLeftRounded />} onClick={clearEmployeeState} sx={backButtonSx}>
                Back
              </Button>
              <TextField
                autoFocus
                label={identifierLabel}
                value={employee.identifier}
                onChange={(event) => setEmployee((previous) => ({ ...previous, identifier: event.target.value }))}
                fullWidth
                inputProps={{ inputMode: employee.accountType === "staff" ? "text" : "numeric" }}
                sx={inputSx}
              />
              <Button
                variant="contained"
                disabled={busy || !employee.identifier.trim()}
                onClick={() => requestOtp(false)}
                sx={primaryButtonSx}
              >
                {busy ? <CircularProgress color="inherit" size={24} /> : "Continue"}
              </Button>
            </Stack>
          )}

          {employee.challenge && (
            <Stack spacing={2.4} sx={{ width: "100%", maxWidth: 600 }}>
              <Box sx={otpPanelSx}>
                <Stack spacing={1.4} alignItems="center">
                  <PhoneIphoneRounded sx={{ color: "#005B96", fontSize: 36 }} />
                  <TextField
                    autoFocus
                    value={otpDigits}
                    onChange={(event) => setEmployee((previous) => ({ ...previous, otp: event.target.value }))}
                    inputProps={{
                      inputMode: "numeric",
                      maxLength: 8,
                      style: {
                        textAlign: "center",
                        letterSpacing: 10,
                        fontSize: 32,
                        fontWeight: 950,
                      },
                    }}
                    sx={otpInputSx}
                  />
                  <Box sx={{ width: "100%", maxWidth: 360 }}>
                    <LinearProgress
                      variant="determinate"
                      value={progressValue}
                      sx={{
                        height: 8,
                        borderRadius: 999,
                        bgcolor: "rgba(148,163,184,0.18)",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 999,
                          bgcolor: expiresIn <= 5 ? "#DC2626" : "#005B96",
                        },
                      }}
                    />
                    <Typography sx={{ mt: 1, fontWeight: 950, color: expiresIn <= 5 ? "#DC2626" : "#005B96" }}>
                      {expiresIn > 0 ? formatMinuteSeconds(expiresIn) : "CODE EXPIRED"}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button variant="outlined" onClick={clearEmployeeState} sx={rowSecondaryButtonSx}>Cancel</Button>
                <Button variant="contained" disabled={busy || expiresIn <= 0 || !otpDigits} onClick={verifyOtp} sx={rowPrimaryButtonSx}>
                  {busy ? <CircularProgress color="inherit" size={24} /> : "Verify"}
                </Button>
              </Stack>
              {expiresIn <= 0 && (
                <Button disabled={busy} onClick={() => requestOtp(true)} sx={{ alignSelf: "center", fontWeight: 950 }}>
                  Resend Code
                </Button>
              )}
            </Stack>
          )}
        </Stack>
      </MainPanel>
    </Shell>
  );
}

const Shell = ({ children }) => (
  <Box sx={shellSx}>
    <Box sx={appFrameSx}>{children}</Box>
  </Box>
);

const MainPanel = ({ children }) => (
  <Box component="main" sx={mainPanelSx}>
    {children}
  </Box>
);

const StatusPanel = ({ clockingPoint, now, tone }) => (
  <Box component="aside" sx={statusPanelSx}>
    <Box sx={statusPhotoSx} />
    <Box sx={statusOverlaySx} />
    <Stack spacing={2.6} sx={{ position: "relative", zIndex: 1, height: "100%" }}>
      <Stack direction="row" spacing={1.4} alignItems="center">
        <Box sx={logoWrapSx}>
          <img src={kmfriLogo} alt="KMFRI" style={{ width: 48, height: 48, objectFit: "contain" }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 950, color: "rgba(255,255,255,0.72)" }}>KMFRI</Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 950, color: "#fff" }}>Attendance</Typography>
        </Box>
      </Stack>

      <Box sx={{ mt: "auto" }}>
        <Typography sx={{ fontSize: { xs: 42, md: 56 }, lineHeight: 1, fontWeight: 950, color: "#fff" }}>
          {formatClockTime(now)}
        </Typography>
        <Typography sx={{ mt: 1, fontSize: 14, fontWeight: 850, color: "rgba(255,255,255,0.78)" }}>
          {formatDateLabel(now)}
        </Typography>
      </Box>

      <Box sx={stationBlockSx}>
        <Stack direction="row" spacing={1.1} alignItems="center">
          {tone === "blocked" ? <WarningAmberRounded /> : tone === "success" ? <CheckCircleRounded /> : <ShieldRounded />}
          <Typography sx={{ fontWeight: 950 }}>
            {tone === "blocked" ? "Not Ready" : tone === "loading" ? "Checking Device" : "Ready"}
          </Typography>
        </Stack>
        <Stack spacing={0.8} sx={{ mt: 1.4 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <LocationOnRounded sx={{ fontSize: 20, color: "rgba(255,255,255,0.78)" }} />
            <Typography sx={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>
              {clockingPoint?.station || "Clocking Point"}
            </Typography>
          </Stack>
          <Typography sx={{ pl: 3.8, fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.74)" }}>
            {clockingPoint?.name || "Device verification"}
          </Typography>
        </Stack>
      </Box>
    </Stack>
  </Box>
);

const shellSx = {
  minHeight: "100svh",
  p: { xs: 1.4, sm: 2.2, lg: 3 },
  bgcolor: "#ECF4F7",
  backgroundImage:
    "linear-gradient(135deg, rgba(10,61,98,0.08) 0%, rgba(72,201,176,0.12) 44%, rgba(255,255,255,0.86) 100%)",
  color: "#172033",
};

const appFrameSx = {
  width: "100%",
  minHeight: { xs: "calc(100svh - 22px)", sm: "calc(100svh - 36px)", lg: "calc(100svh - 48px)" },
  display: "grid",
  gridTemplateColumns: { xs: "1fr", lg: "360px minmax(0, 1fr)" },
  gap: { xs: 1.4, sm: 2 },
};

const statusPanelSx = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "8px",
  minHeight: { xs: 210, lg: "auto" },
  p: { xs: 2, sm: 2.5, lg: 3 },
  boxShadow: "0 22px 48px rgba(15, 23, 42, 0.16)",
};

const statusPhotoSx = {
  position: "absolute",
  inset: 0,
  backgroundImage: `url(${clockingImage})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  filter: "saturate(0.88)",
};

const statusOverlaySx = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(155deg, rgba(4,31,52,0.94) 0%, rgba(10,61,98,0.86) 54%, rgba(0,91,150,0.72) 100%)",
};

const logoWrapSx = {
  width: 62,
  height: 62,
  borderRadius: "8px",
  display: "grid",
  placeItems: "center",
  bgcolor: "rgba(255,255,255,0.94)",
  border: "1px solid rgba(255,255,255,0.36)",
};

const stationBlockSx = {
  p: 1.7,
  borderRadius: "8px",
  bgcolor: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.22)",
  color: "#fff",
  backdropFilter: "blur(12px)",
};

const mainPanelSx = {
  minHeight: { xs: 500, lg: "auto" },
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  p: { xs: 2, sm: 3, md: 5 },
  borderRadius: "8px",
  bgcolor: "rgba(255,255,255,0.94)",
  border: "1px solid rgba(148,163,184,0.22)",
  boxShadow: "0 22px 48px rgba(15, 23, 42, 0.10)",
};

const eyebrowSx = {
  fontSize: 12,
  fontWeight: 950,
  color: "#005B96",
  textTransform: "uppercase",
};

const headlineSx = {
  fontSize: { xs: 34, sm: 44, md: 52 },
  lineHeight: 1.02,
  fontWeight: 950,
  color: "#0A3D62",
  letterSpacing: 0,
};

const errorHeadlineSx = {
  ...headlineSx,
  fontSize: { xs: 31, sm: 44, md: 52 },
};

const bodyTextSx = {
  fontSize: { xs: 16, sm: 18 },
  lineHeight: 1.5,
  fontWeight: 800,
  color: "#64748B",
};

const accountGridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
  gap: 1.6,
  width: "100%",
};

const accountButtonSx = {
  minHeight: { xs: 116, sm: 138 },
  justifyContent: "flex-start",
  gap: 1.8,
  p: 2,
  borderRadius: "8px",
  borderWidth: 1,
  borderColor: "rgba(10,61,98,0.16)",
  bgcolor: "#FFFFFF",
  color: "#102033",
  textAlign: "left",
  textTransform: "none",
  boxShadow: "0 12px 26px rgba(15,23,42,0.06)",
  "&:hover": {
    borderColor: "#005B96",
    bgcolor: "#F7FBFD",
    boxShadow: "0 16px 32px rgba(0,91,150,0.12)",
  },
};

const accountIconSx = {
  width: 54,
  height: 54,
  borderRadius: "8px",
  display: "grid",
  placeItems: "center",
  bgcolor: "rgba(0,91,150,0.10)",
  color: "#005B96",
  flexShrink: 0,
  "& .MuiSvgIcon-root": { fontSize: 30 },
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 68,
    borderRadius: "8px",
    bgcolor: "#FFFFFF",
    fontWeight: 900,
    fontSize: 24,
  },
  "& .MuiInputLabel-root": {
    fontWeight: 850,
  },
};

const otpInputSx = {
  width: "100%",
  maxWidth: 360,
  "& .MuiOutlinedInput-root": {
    minHeight: 76,
    borderRadius: "8px",
    bgcolor: "#FFFFFF",
    color: "#0A3D62",
  },
};

const otpPanelSx = {
  p: { xs: 2, sm: 3 },
  borderRadius: "8px",
  border: "1px solid rgba(0,91,150,0.14)",
  bgcolor: "#F8FBFC",
};

const primaryButtonSx = {
  width: "100%",
  minHeight: 62,
  borderRadius: "8px",
  px: 3,
  fontSize: 16,
  fontWeight: 950,
  textTransform: "none",
  bgcolor: "#005B96",
  boxShadow: "0 14px 28px rgba(0,91,150,0.22)",
  "&:hover": { bgcolor: "#0A3D62" },
  "&.Mui-disabled": {
    bgcolor: "#D8E2EA",
    color: "#64748B",
    boxShadow: "none",
  },
};

const secondaryButtonSx = {
  width: "100%",
  minHeight: 62,
  borderRadius: "8px",
  px: 3,
  fontSize: 16,
  fontWeight: 950,
  textTransform: "none",
  borderColor: "rgba(10,61,98,0.22)",
  color: "#0A3D62",
};

const rowPrimaryButtonSx = {
  ...primaryButtonSx,
  flex: 1,
};

const rowSecondaryButtonSx = {
  ...secondaryButtonSx,
  flex: 1,
};

const singleButtonSx = {
  ...primaryButtonSx,
  width: "auto",
  minWidth: 148,
  px: 4,
};

const backButtonSx = {
  alignSelf: "flex-start",
  minHeight: 44,
  borderRadius: "8px",
  fontWeight: 950,
  textTransform: "none",
  color: "#0A3D62",
};

const successIconSx = {
  width: 118,
  height: 118,
  borderRadius: "8px",
  display: "grid",
  placeItems: "center",
  bgcolor: "rgba(22,163,74,0.10)",
  color: "#16A34A",
  border: "1px solid rgba(22,163,74,0.24)",
};

const dangerIconSx = {
  width: 98,
  height: 98,
  borderRadius: "8px",
  display: "grid",
  placeItems: "center",
  bgcolor: "rgba(220,38,38,0.10)",
  color: "#DC2626",
  border: "1px solid rgba(220,38,38,0.24)",
};

const successMetaSx = {
  px: 2,
  py: 1.1,
  borderRadius: "8px",
  display: "inline-flex",
  gap: 1,
  alignItems: "center",
  bgcolor: "rgba(0,91,150,0.08)",
  color: "#005B96",
};
