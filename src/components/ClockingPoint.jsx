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
import clockingImage from "../images/clocking_image_1.png";
import ClockingPointChrome from "./ClockingPointChrome";
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

const workflowSteps = [
  { value: 1, label: "Account" },
  { value: 2, label: "Identifier" },
  { value: 3, label: "OTP" },
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
  const activeStep = employee.challenge ? 3 : employee.accountType ? 2 : 1;
  const isOtpStep = Boolean(employee.challenge);

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
            <Typography sx={headlineSx(false)}>Preparing device</Typography>
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
            <Typography sx={bodyTextSx(false)}>{error}</Typography>
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
              <Typography sx={{ ...headlineSx(false), fontSize: { xs: 38, sm: 52 } }}>
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
              <Typography sx={bodyTextSx(false)}>{employee.success.station}</Typography>
              <Typography sx={{ ...bodyTextSx(false), color: "#0A3D62" }}>{employee.success.pointName}</Typography>
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
        <Box sx={mainContentCardSx(isOtpStep)}>
          <Stack spacing={isOtpStep ? { xs: 1.6, sm: 2 } : { xs: 2.3, sm: 3 }} sx={{ width: "100%" }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={isOtpStep ? 1.4 : 2} alignItems={{ xs: "stretch", md: "flex-start" }} justifyContent="space-between">
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={eyebrowSx}>KMFRI CLOCKING POINT</Typography>
                <Typography sx={headlineSx(isOtpStep)}>
                  {employee.challenge
                    ? `Verify ${getActionLabel(employee.challenge.action)}`
                    : employee.accountType
                      ? identifierLabel
                      : "Select account"}
                </Typography>
                <Typography sx={bodyTextSx(isOtpStep)}>
                  {employee.challenge
                    ? `Code sent to your registered phone ending in ${employee.challenge.phoneMasked}`
                    : employee.accountType
                      ? `Enter the ${selectedAccount?.caption?.toLowerCase()} linked to this account.`
                      : "Choose the account category before OTP verification."}
                </Typography>
              </Box>

              <Box sx={stepStripSx} aria-label="Clocking point progress">
                {workflowSteps.map((step) => {
                  const isActive = activeStep === step.value;
                  const isComplete = activeStep > step.value;
                  return (
                    <Box key={step.value} sx={stepItemSx(isActive, isComplete)}>
                      <Box sx={stepDotSx(isActive, isComplete)}>
                        {isComplete ? <CheckCircleRounded sx={{ fontSize: 16 }} /> : step.value}
                      </Box>
                      <Typography sx={stepLabelSx(isActive)}>{step.label}</Typography>
                    </Box>
                  );
                })}
              </Box>
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
              <Stack spacing={{ xs: 1.4, sm: 1.7 }}>
                <Box sx={accountGridSx}>
                  {accountTypes.map((type) => (
                    <Button
                      key={type.value}
                      variant="outlined"
                      onClick={() => setEmployee((previous) => ({ ...previous, accountType: type.value }))}
                      sx={accountButtonSx}
                    >
                      <Box className="account-icon" sx={accountIconSx}>{type.icon}</Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={accountLabelSx}>{type.label}</Typography>
                        <Typography sx={accountCaptionSx}>{type.caption}</Typography>
                      </Box>
                      <Box className="account-action" sx={accountArrowSx}>Continue</Box>
                    </Button>
                  ))}
                </Box>

                <Box sx={visionStatementSx}>
                  <Box sx={visionAccentSx} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography mt={3} sx={visionLabelSx}>KMFRI Vision</Typography>
                    <Typography sx={visionTextSx}>
                      A World Class Centre of Excellence in Innovative Research for Sustainable Blue Economy and Fisheries Development.
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            )}

            {employee.accountType && !employee.challenge && (
              <Box sx={formPanelSx}>
                <Stack spacing={2.2}>
                  <Stack direction="row" spacing={1.4} alignItems="center" justifyContent="space-between">
                    <Box sx={selectedAccountSx}>
                      <Box sx={selectedAccountIconSx}>{selectedAccount?.icon}</Box>
                      <Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 950, color: "#64748B" }}>Selected Account</Typography>
                        <Typography sx={{ fontSize: 17, fontWeight: 950, color: "#102033" }}>{selectedAccount?.label}</Typography>
                      </Box>
                    </Box>
                    <Button startIcon={<KeyboardArrowLeftRounded />} onClick={clearEmployeeState} sx={backButtonSx}>
                      Back
                    </Button>
                  </Stack>

                  <TextField
                    autoFocus
                    label={identifierLabel}
                    type="password"
                    value={employee.identifier}
                    onChange={(event) => setEmployee((previous) => ({ ...previous, identifier: event.target.value }))}
                    fullWidth
                    inputProps={{
                      inputMode: employee.accountType === "staff" ? "text" : "numeric",
                      autoComplete: "off",
                    }}
                    sx={inputSx}
                  />
                  <Button
                    variant="contained"
                    disabled={busy || !employee.identifier.trim()}
                    onClick={() => requestOtp(false)}
                    sx={primaryButtonSx}
                  >
                    {busy ? <CircularProgress color="inherit" size={24} /> : "Send OTP"}
                  </Button>
                </Stack>
              </Box>
            )}

            {employee.challenge && (
              <Box sx={otpShellSx}>
                <Stack spacing={{ xs: 1.4, sm: 1.7 }} alignItems="center">
                  <Box sx={otpIconSx}>
                    <PhoneIphoneRounded sx={{ fontSize: 28 }} />
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 950, color: "#64748B", textTransform: "uppercase" }}>
                      One-time code
                    </Typography>
                    <Typography sx={otpUserNameSx}>
                      {employee.userName || "Registered user"}
                    </Typography>
                  </Box>
                  <TextField
                    autoFocus
                    type="password"
                    value={otpDigits}
                    onChange={(event) => setEmployee((previous) => ({ ...previous, otp: event.target.value }))}
                    inputProps={{
                      inputMode: "numeric",
                      maxLength: 8,
                      autoComplete: "one-time-code",
                      style: {
                        textAlign: "center",
                        letterSpacing: 7,
                        fontSize: 28,
                        fontWeight: 950,
                      },
                    }}
                    sx={otpInputSx}
                  />

                  <Box sx={timerPanelSx}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 950, color: "#64748B" }}>Code timer</Typography>
                      <Typography sx={{ fontSize: 14, fontWeight: 950, color: expiresIn <= 5 ? "#DC2626" : "#005B96" }}>
                        {expiresIn > 0 ? formatMinuteSeconds(expiresIn) : "CODE EXPIRED"}
                      </Typography>
                    </Stack>
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
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: "100%" }}>
                    <Button variant="outlined" onClick={clearEmployeeState} sx={rowSecondaryButtonSx}>Cancel</Button>
                    <Button variant="contained" disabled={busy || expiresIn <= 0 || !otpDigits} onClick={verifyOtp} sx={rowPrimaryButtonSx}>
                      {busy ? <CircularProgress color="inherit" size={24} /> : "Verify Attendance"}
                    </Button>
                  </Stack>
                  {expiresIn <= 0 && (
                    <Button disabled={busy} onClick={() => requestOtp(true)} sx={{ alignSelf: "center", fontWeight: 950 }}>
                      Resend Code
                    </Button>
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>
      </MainPanel>
    </Shell>
  );
}

const Shell = ({ children }) => (
  <ClockingPointChrome>
    <Box sx={shellSx}>
      <Box sx={appFrameSx}>{children}</Box>
    </Box>
  </ClockingPointChrome>
);

const MainPanel = ({ children }) => (
  <Box component="main" sx={mainPanelSx}>
    {children}
  </Box>
);

const getTerminalStatus = (tone) => {
  if (tone === "blocked") {
    return {
      label: "Terminal offline",
      caption: "Enrollment is required before this device can record attendance.",
      icon: WarningAmberRounded,
    };
  }
  if (tone === "loading") {
    return {
      label: "Checking terminal",
      caption: "Validating the registered clocking point.",
      icon: ShieldRounded,
    };
  }
  if (tone === "success") {
    return {
      label: "Attendance recorded",
      caption: "Ready for the next user after the confirmation clears.",
      icon: CheckCircleRounded,
    };
  }
  return {
    label: "Terminal ready",
    caption: "OTP attendance verification is active.",
    icon: ShieldRounded,
  };
};

const StatusPanel = ({ clockingPoint, now, tone }) => {
  const terminalStatus = getTerminalStatus(tone);
  const StatusIcon = terminalStatus.icon;

  return (
    <Box component="aside" sx={statusPanelSx}>
      <Box sx={statusPhotoSx} />
      <Box sx={statusOverlaySx} />
      <Stack spacing={2.2} sx={{ position: "relative", zIndex: 1, height: "100%" }}>
        <Box>
          <Typography sx={terminalTitleSx}>Clocking Point</Typography>
          <Typography sx={terminalSubtitleSx}>Fast attendance capture for station users.</Typography>
        </Box>

        <Box sx={timeCardSx}>
          <Typography sx={timeTextSx}>{formatClockTime(now)}</Typography>
          <Typography sx={dateTextSx}>{formatDateLabel(now)}</Typography>
        </Box>

        <Box sx={terminalStatusSx}>
          <Stack direction="row" spacing={1.1} alignItems="center">
            <Box sx={statusIconSx}>
              <StatusIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 950, color: "#fff" }}>
                {terminalStatus.label}
              </Typography>
              <Typography sx={{ mt: 0.25, fontSize: 12.5, fontWeight: 750, color: "rgba(255,255,255,0.70)" }}>
                {terminalStatus.caption}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack spacing={1.1} sx={{ mt: "auto" }}>
          <Box sx={terminalInfoCardSx}>
            <LocationOnRounded sx={{ fontSize: 20, color: "rgba(255,255,255,0.82)" }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={infoLabelSx}>Station</Typography>
              <Typography sx={infoValueSx}>{clockingPoint?.station || "Not assigned"}</Typography>
            </Box>
          </Box>

          <Box sx={terminalInfoCardSx}>
            <ShieldRounded sx={{ fontSize: 20, color: "rgba(255,255,255,0.82)" }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={infoLabelSx}>Terminal</Typography>
              <Typography sx={infoValueSx}>{clockingPoint?.name || "Device verification"}</Typography>
            </Box>
          </Box>

        </Stack>
      </Stack>
    </Box>
  );
};

const shellSx = {
  minHeight: "100svh",
  p: { xs: 1.4, sm: 2.2, lg: 3 },
  pt: { xs: 10.5, sm: 12, lg: 12.5 },
  bgcolor: "#ECF4F7",
  backgroundImage:
    "linear-gradient(135deg, rgba(10,61,98,0.08) 0%, rgba(72,201,176,0.12) 44%, rgba(255,255,255,0.86) 100%)",
  color: "#172033",
};

const appFrameSx = {
  width: "100%",
  minHeight: { xs: "calc(100svh - 96px)", sm: "calc(100svh - 112px)", lg: "calc(100svh - 124px)" },
  display: "grid",
  gridTemplateColumns: { xs: "1fr", lg: "360px minmax(0, 1fr)" },
  gap: { xs: 1.4, sm: 2 },
};

const statusPanelSx = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "8px",
  minHeight: { xs: 430, sm: 390, lg: "auto" },
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
    "linear-gradient(155deg, rgba(4,31,52,0.96) 0%, rgba(10,61,98,0.90) 50%, rgba(0,91,150,0.72) 100%)",
};

const terminalTitleSx = {
  fontSize: { xs: 30, sm: 36, lg: 40 },
  lineHeight: 1.02,
  fontWeight: 950,
  color: "#fff",
  letterSpacing: 0,
};

const terminalSubtitleSx = {
  mt: 1,
  maxWidth: 280,
  fontSize: 14,
  lineHeight: 1.55,
  fontWeight: 800,
  color: "rgba(255,255,255,0.74)",
};

const timeCardSx = {
  p: { xs: 1.6, sm: 1.9 },
  borderRadius: "8px",
  bgcolor: "rgba(255,255,255,0.13)",
  border: "1px solid rgba(255,255,255,0.20)",
  backdropFilter: "blur(14px)",
};

const timeTextSx = {
  fontSize: { xs: 40, md: 50 },
  lineHeight: 1,
  fontWeight: 950,
  color: "#fff",
  fontVariantNumeric: "tabular-nums",
};

const dateTextSx = {
  mt: 0.9,
  fontSize: 13.5,
  fontWeight: 850,
  color: "rgba(255,255,255,0.76)",
};

const terminalStatusSx = {
  p: 1.45,
  borderRadius: "8px",
  bgcolor: "rgba(72,201,176,0.13)",
  border: "1px solid rgba(72,201,176,0.24)",
  backdropFilter: "blur(12px)",
};

const statusIconSx = {
  width: 40,
  height: 40,
  borderRadius: "8px",
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
  bgcolor: "rgba(255,255,255,0.14)",
  color: "#fff",
};

const terminalInfoCardSx = {
  display: "flex",
  alignItems: "center",
  gap: 1.2,
  p: 1.35,
  borderRadius: "8px",
  bgcolor: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.16)",
};

const infoLabelSx = {
  fontSize: 11.5,
  fontWeight: 950,
  color: "rgba(255,255,255,0.58)",
  textTransform: "uppercase",
  letterSpacing: 0.7,
};

const infoValueSx = {
  mt: 0.25,
  fontSize: 14,
  lineHeight: 1.3,
  fontWeight: 950,
  color: "#fff",
};


const mainPanelSx = {
  minHeight: { xs: 500, lg: "auto" },
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  p: { xs: 1.4, sm: 2.2, md: 2.7 },
  borderRadius: "8px",
  bgcolor: "rgba(255,255,255,0.94)",
  border: "1px solid rgba(148,163,184,0.22)",
  boxShadow: "0 22px 48px rgba(15, 23, 42, 0.10)",
  overflow: "hidden",
};

const mainContentCardSx = (compact = false) => ({
  width: "100%",
  maxWidth: compact ? 880 : 980,
  p: compact ? { xs: 1.35, sm: 1.7, md: 2 } : { xs: 1.6, sm: 2.2, md: 3 },
  borderRadius: "8px",
  bgcolor: "#FFFFFF",
  border: "1px solid rgba(148,163,184,0.20)",
  boxShadow: "0 18px 44px rgba(15,23,42,0.08)",
  maxHeight: compact ? "100%" : "none",
});

const stepStripSx = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 0.8,
  width: { xs: "100%", md: 330 },
  p: 0.65,
  borderRadius: "8px",
  bgcolor: "#F4F8FA",
  border: "1px solid rgba(148,163,184,0.22)",
};

const stepItemSx = (isActive, isComplete) => ({
  minHeight: 46,
  px: 0.8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 0.8,
  borderRadius: "8px",
  bgcolor: isActive ? "#FFFFFF" : "transparent",
  color: isActive || isComplete ? "#0A3D62" : "#64748B",
  border: isActive ? "1px solid rgba(0,91,150,0.16)" : "1px solid transparent",
  boxShadow: isActive ? "0 8px 18px rgba(15,23,42,0.07)" : "none",
});

const stepDotSx = (isActive, isComplete) => ({
  width: 24,
  height: 24,
  borderRadius: "8px",
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
  bgcolor: isComplete ? "#16A34A" : isActive ? "#005B96" : "rgba(100,116,139,0.12)",
  color: isActive || isComplete ? "#fff" : "#64748B",
  fontSize: 12,
  fontWeight: 950,
});

const stepLabelSx = (isActive) => ({
  fontSize: { xs: 11, sm: 12 },
  fontWeight: isActive ? 950 : 850,
  whiteSpace: "nowrap",
});

const eyebrowSx = {
  fontSize: 12,
  fontWeight: 950,
  color: "#005B96",
  textTransform: "uppercase",
};

const headlineSx = (compact = false) => ({
  fontSize: compact ? { xs: 28, sm: 36, md: 40 } : { xs: 34, sm: 42, md: 48 },
  lineHeight: 1.02,
  fontWeight: 950,
  color: "#0A3D62",
  letterSpacing: 0,
});

const errorHeadlineSx = {
  ...headlineSx(false),
  fontSize: { xs: 31, sm: 44, md: 52 },
};

const bodyTextSx = (compact = false) => ({
  fontSize: compact ? { xs: 14.5, sm: 15.5 } : { xs: 16, sm: 17 },
  lineHeight: compact ? 1.35 : 1.45,
  fontWeight: 800,
  color: "#64748B",
});

const accountGridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
  gap: 1.6,
  width: "100%",
};

const accountButtonSx = {
  position: "relative",
  overflow: "hidden",
  minHeight: { xs: 108, sm: 132 },
  justifyContent: "flex-start",
  gap: 1.35,
  p: { xs: 1.6, sm: 1.9 },
  borderRadius: "8px",
  borderWidth: 1,
  borderColor: "rgba(10,61,98,0.16)",
  bgcolor: "#FFFFFF",
  color: "#102033",
  textAlign: "left",
  textTransform: "none",
  boxShadow: "0 12px 26px rgba(15,23,42,0.06)",
  transition: "transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease",
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    borderRadius: "8px",
    background: "linear-gradient(135deg, rgba(0,91,150,0.10), rgba(72,201,176,0.10))",
    opacity: 0,
    transition: "opacity 180ms ease",
    pointerEvents: "none",
  },
  "&:hover": {
    transform: "translateY(-3px)",
    borderColor: "#005B96",
    bgcolor: "#FFFFFF",
    boxShadow: "0 18px 34px rgba(0,91,150,0.16)",
    "&::before": { opacity: 1 },
    "& .account-icon": {
      bgcolor: "#005B96",
      color: "#fff",
      boxShadow: "0 10px 20px rgba(0,91,150,0.22)",
    },
    "& .account-action": {
      bgcolor: "#005B96",
      color: "#fff",
    },
  },
  "&:focus-visible": {
    outline: "3px solid rgba(72,201,176,0.45)",
    outlineOffset: 3,
  },
};

const accountIconSx = {
  position: "relative",
  zIndex: 1,
  width: 52,
  height: 52,
  borderRadius: "8px",
  display: "grid",
  placeItems: "center",
  bgcolor: "rgba(0,91,150,0.10)",
  color: "#005B96",
  flexShrink: 0,
  transition: "background-color 180ms ease, color 180ms ease, box-shadow 180ms ease",
  "& .MuiSvgIcon-root": { fontSize: 30 },
};

const accountLabelSx = {
  fontSize: { xs: 20, md: 23 },
  lineHeight: 1.1,
  fontWeight: 950,
  color: "#102033",
};

const accountCaptionSx = {
  mt: 0.45,
  fontSize: 13,
  fontWeight: 850,
  color: "#64748B",
};

const accountArrowSx = {
  position: "relative",
  zIndex: 1,
  display: { xs: "none", sm: "inline-flex" },
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "flex-end",
  px: 1,
  py: 0.55,
  borderRadius: "8px",
  bgcolor: "rgba(0,91,150,0.08)",
  color: "#005B96",
  fontSize: 11.5,
  fontWeight: 950,
  transition: "background-color 180ms ease, color 180ms ease",
};

const visionStatementSx = {
  display: "flex",
  alignItems: "stretch",
  gap: 1.2,
  p: { xs: 1.15, sm: 1.25 },
  borderRadius: "8px",
  bgcolor: "#F8FBFC",
  border: "1px solid rgba(0,91,150,0.14)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.86)",
};

const visionAccentSx = {
  width: 4,
  borderRadius: 999,
  flexShrink: 0,
  bgcolor: "#005B96",
};

const visionLabelSx = {
  fontSize: 11,
  lineHeight: 1.1,
  fontWeight: 950,
  color: "#005B96",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const visionTextSx = {
  mt: 0.45,
  minWidth: 0,
  fontSize: { xs: 12.5, sm: 13, md: 13.5 },
  lineHeight: 1.32,
  fontWeight: 850,
  color: "#1F3346",
  maxWidth: 780,
};

const formPanelSx = {
  width: "100%",
  maxWidth: 620,
  p: { xs: 1.5, sm: 2 },
  borderRadius: "8px",
  bgcolor: "#F8FBFC",
  border: "1px solid rgba(0,91,150,0.12)",
};

const selectedAccountSx = {
  display: "inline-flex",
  alignItems: "center",
  gap: 1.2,
  minWidth: 0,
};

const selectedAccountIconSx = {
  width: 48,
  height: 48,
  borderRadius: "8px",
  display: "grid",
  placeItems: "center",
  bgcolor: "rgba(0,91,150,0.10)",
  color: "#005B96",
  flexShrink: 0,
  "& .MuiSvgIcon-root": { fontSize: 27 },
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
  maxWidth: 340,
  "& .MuiOutlinedInput-root": {
    minHeight: { xs: 62, sm: 66 },
    borderRadius: "8px",
    bgcolor: "#FFFFFF",
    color: "#0A3D62",
  },
};

const otpShellSx = {
  width: "100%",
  maxWidth: 540,
  p: { xs: 1.4, sm: 1.8, md: 2 },
  borderRadius: "8px",
  border: "1px solid rgba(0,91,150,0.14)",
  bgcolor: "#F8FBFC",
  boxShadow: "0 14px 34px rgba(15,23,42,0.06)",
};

const otpIconSx = {
  width: 52,
  height: 52,
  borderRadius: "8px",
  display: "grid",
  placeItems: "center",
  bgcolor: "rgba(0,91,150,0.10)",
  color: "#005B96",
  border: "1px solid rgba(0,91,150,0.16)",
};

const otpUserNameSx = {
  mt: 0.35,
  maxWidth: 420,
  fontSize: { xs: 18, sm: 21 },
  lineHeight: 1.18,
  fontWeight: 950,
  color: "#102033",
  overflowWrap: "anywhere",
};

const timerPanelSx = {
  width: "100%",
  maxWidth: 360,
  p: 1,
  borderRadius: "8px",
  bgcolor: "#FFFFFF",
  border: "1px solid rgba(148,163,184,0.20)",
};

const primaryButtonSx = {
  width: "100%",
  minHeight: 56,
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
  minHeight: 56,
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
