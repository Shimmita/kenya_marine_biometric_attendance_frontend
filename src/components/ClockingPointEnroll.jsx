import {
  AddLocationAltRounded,
  CheckCircleRounded,
  DevicesRounded,
  LoginRounded,
  LocationOnRounded,
  PersonRounded,
  SecurityRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { loginStaff } from "./auth/Login";
import kmfriLogo from "../images/kmfri_logo.png";
import clockingImage from "../images/clocking_image_1.png";
import {
  enrollClockingPoint,
  getClockingPointEnrollmentOptions,
} from "../service/ClockingPointService";
import { getDeviceFingerprint } from "../service/Fingerprinting";

export default function ClockingPointEnroll() {
  const [loginForm, setLoginForm] = useState({ staffNumber: "", password: "" });
  const [options, setOptions] = useState(null);
  const [form, setForm] = useState({ station: "", name: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadOptions = async () => {
    const data = await getClockingPointEnrollmentOptions();
    setOptions(data);
    setForm((previous) => ({
      ...previous,
      station: previous.station || data.stations?.[0]?.name || "",
    }));
  };

  useEffect(() => {
    loadOptions().catch(() => undefined);
  }, []);

  const handleSignIn = async () => {
    try {
      setBusy(true);
      setError("");
      await loginStaff(loginForm.staffNumber, loginForm.password);
      await loadOptions();
    } catch (err) {
      setError(typeof err === "string" ? err : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setBusy(true);
      setError("");
      setSuccess("");
      const deviceFingerprint = await getDeviceFingerprint();
      const data = await enrollClockingPoint({
        deviceFingerprint,
        station: form.station,
        name: form.name,
      });
      setSuccess(data.message || "Clocking Point enrolled successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Enrollment failed.");
    } finally {
      setBusy(false);
    }
  };

  const isSignedIn = Boolean(options?.officer);

  return (
    <Box sx={pageSx}>
      <Box sx={frameSx}>
        <Box sx={visualPanelSx}>
          <Box sx={visualImageSx} />
          <Box sx={visualOverlaySx} />
          <Stack spacing={2.2} sx={{ position: "relative", zIndex: 1, height: "100%" }}>
            <Stack direction="row" spacing={1.4} alignItems="center">
              <Box sx={logoWrapSx}>
                <img src={kmfriLogo} alt="KMFRI" style={{ width: 48, height: 48, objectFit: "contain" }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 950, color: "rgba(255,255,255,0.72)" }}>KMFRI</Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 950, color: "#fff" }}>Clocking Point</Typography>
              </Box>
            </Stack>

            <Box sx={{ mt: "auto" }}>
              <Typography sx={{ fontSize: { xs: 34, md: 46 }, lineHeight: 1.04, fontWeight: 950, color: "#fff" }}>
                {isSignedIn ? "Enroll trusted device" : "Secure enrollment"}
              </Typography>
              <Typography sx={{ mt: 1.2, fontSize: 15, lineHeight: 1.55, fontWeight: 800, color: "rgba(255,255,255,0.78)" }}>
                {isSignedIn
                  ? "Bind this browser profile to an approved station and physical Clocking Point."
                  : "Authorised KMFRI officers sign in before registering a shared device."}
              </Typography>
            </Box>

            <Box sx={statusCardSx}>
              <Stack direction="row" spacing={1.1} alignItems="center">
                {isSignedIn ? <DevicesRounded /> : <SecurityRounded />}
                <Typography sx={{ fontWeight: 950 }}>{isSignedIn ? "Device Setup" : "Officer Access"}</Typography>
              </Stack>
              <Typography sx={{ mt: 0.8, fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.74)" }}>
                {isSignedIn ? "FingerprintJS identity will be hashed on the server." : "Use your existing staff credentials."}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Paper elevation={0} sx={panelSx}>
          <Stack spacing={2.5}>
            <Stack spacing={0.7}>
              <Typography sx={eyebrowSx}>{isSignedIn ? "Enrollment" : "Sign In"}</Typography>
              <Typography sx={headlineSx}>
                {isSignedIn ? "Enroll Clocking Point" : "Clocking Point Enrollment"}
              </Typography>
              <Typography sx={bodyTextSx}>
                {isSignedIn ? "Choose the official station and name this physical location." : "Only authorised officers can enroll KMFRI-owned devices."}
              </Typography>
            </Stack>

            {error && <Alert severity="error" sx={alertSx}>{error}</Alert>}
            {success && <Alert severity="success" icon={<CheckCircleRounded />} sx={alertSx}>{success}</Alert>}

            {!isSignedIn ? (
              <Stack spacing={2}>
                <TextField
                  label="Staff Number"
                  value={loginForm.staffNumber}
                  onChange={(event) => setLoginForm((previous) => ({ ...previous, staffNumber: event.target.value }))}
                  fullWidth
                  sx={fieldSx}
                />
                <TextField
                  label="Password"
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((previous) => ({ ...previous, password: event.target.value }))}
                  fullWidth
                  sx={fieldSx}
                />
                <Button
                  variant="contained"
                  startIcon={busy ? <CircularProgress color="inherit" size={18} /> : <LoginRounded />}
                  onClick={handleSignIn}
                  disabled={busy || !loginForm.staffNumber || !loginForm.password}
                  sx={primaryButtonSx}
                >
                  Sign In
                </Button>
              </Stack>
            ) : (
              <Stack spacing={2}>
                <TextField
                  select
                  label="Clocking Station"
                  value={form.station}
                  onChange={(event) => setForm((previous) => ({ ...previous, station: event.target.value }))}
                  fullWidth
                  sx={fieldSx}
                >
                  {(options.stations || []).map((station) => (
                    <MenuItem key={station.name} value={station.name}>{station.name}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Clocking Point Name"
                  value={form.name}
                  onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                  placeholder="Main Entrance"
                  fullWidth
                  sx={fieldSx}
                />
                <Box sx={officerCardSx}>
                  <Stack direction="row" spacing={1.3} alignItems="center">
                    <Box sx={officerIconSx}><PersonRounded /></Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 950, color: "#64748B" }}>Enrolling Officer</Typography>
                      <Typography sx={{ fontWeight: 950, color: "#102033" }}>{options.officer.name}</Typography>
                      <Typography sx={{ fontWeight: 850, color: "#64748B", textTransform: "capitalize" }}>{options.officer.rank}</Typography>
                    </Box>
                  </Stack>
                </Box>
                <Button
                  variant="contained"
                  startIcon={busy ? <CircularProgress color="inherit" size={18} /> : <AddLocationAltRounded />}
                  onClick={handleEnroll}
                  disabled={busy || !form.station || !form.name.trim()}
                  sx={primaryButtonSx}
                >
                  Enroll Clocking Point
                </Button>
              </Stack>
            )}

            {isSignedIn && (
              <Box sx={stationHintSx}>
                <LocationOnRounded sx={{ fontSize: 20 }} />
                <Typography sx={{ fontSize: 13, fontWeight: 850 }}>
                  {form.station || "Select station"}
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}

const pageSx = {
  minHeight: "100svh",
  display: "grid",
  placeItems: "center",
  px: { xs: 1.5, sm: 2.5 },
  py: { xs: 2, sm: 3 },
  bgcolor: "#ECF4F7",
  backgroundImage:
    "linear-gradient(135deg, rgba(10,61,98,0.08) 0%, rgba(72,201,176,0.12) 44%, rgba(255,255,255,0.86) 100%)",
};

const frameSx = {
  width: "100%",
  maxWidth: 1040,
  minHeight: { xs: "calc(100svh - 32px)", md: 640 },
  display: "grid",
  gridTemplateColumns: { xs: "1fr", md: "0.92fr 1fr" },
  gap: { xs: 1.5, md: 2 },
};

const visualPanelSx = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "8px",
  minHeight: { xs: 260, md: "auto" },
  p: { xs: 2.2, sm: 3 },
  boxShadow: "0 22px 48px rgba(15,23,42,0.16)",
};

const visualImageSx = {
  position: "absolute",
  inset: 0,
  backgroundImage: `url(${clockingImage})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  filter: "saturate(0.88)",
};

const visualOverlaySx = {
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
};

const statusCardSx = {
  p: 1.7,
  borderRadius: "8px",
  bgcolor: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.22)",
  color: "#fff",
  backdropFilter: "blur(12px)",
};

const panelSx = {
  display: "flex",
  alignItems: "center",
  p: { xs: 2.2, sm: 3, md: 4 },
  borderRadius: "8px",
  border: "1px solid rgba(148,163,184,0.22)",
  boxShadow: "0 22px 48px rgba(15,23,42,0.10)",
};

const eyebrowSx = {
  fontSize: 12,
  fontWeight: 950,
  color: "#005B96",
  textTransform: "uppercase",
};

const headlineSx = {
  fontSize: { xs: 31, sm: 40 },
  lineHeight: 1.05,
  fontWeight: 950,
  color: "#0A3D62",
  letterSpacing: 0,
};

const bodyTextSx = {
  fontSize: 16,
  lineHeight: 1.5,
  fontWeight: 800,
  color: "#64748B",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 58,
    borderRadius: "8px",
    bgcolor: "#fff",
    fontWeight: 850,
  },
  "& .MuiInputLabel-root": { fontWeight: 850 },
};

const primaryButtonSx = {
  minHeight: 58,
  borderRadius: "8px",
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

const alertSx = {
  borderRadius: "8px",
  fontWeight: 800,
};

const officerCardSx = {
  p: 1.5,
  borderRadius: "8px",
  bgcolor: "#F8FBFC",
  border: "1px solid rgba(148,163,184,0.24)",
};

const officerIconSx = {
  width: 44,
  height: 44,
  borderRadius: "8px",
  display: "grid",
  placeItems: "center",
  bgcolor: "rgba(0,91,150,0.10)",
  color: "#005B96",
};

const stationHintSx = {
  display: "inline-flex",
  alignItems: "center",
  gap: 1,
  px: 1.3,
  py: 1,
  borderRadius: "8px",
  bgcolor: "rgba(0,91,150,0.08)",
  color: "#0A3D62",
  width: "fit-content",
};
