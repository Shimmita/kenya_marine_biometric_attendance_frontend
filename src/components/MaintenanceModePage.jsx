import {
  CheckCircleRounded,
  ConstructionRounded,
  EventAvailableRounded,
  RefreshRounded,
  ScheduleRounded,
  SupportAgentRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMaintenanceStatus, getPlatformConfig } from "../service/SuperadminService";
import { applyPlatformConfigToCoreData } from "./CoreDataDetails";

const readCachedMaintenance = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem("kmfri_maintenance_status") || "null");
  } catch {
    return null;
  }
};

const formatDateTime = (value, fallback = "To be confirmed") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleString("en-KE", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MaintenanceModePage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState(() => readCachedMaintenance());
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const isActive = !!status?.active;
  const isScheduled = !!status?.scheduled;
  const title = isActive
    ? "Scheduled Maintenance In Progress"
    : isScheduled
      ? "Maintenance Scheduled"
      : "Services Restored";

  const message = status?.message || "KMFRI Attendance is temporarily unavailable while maintenance is completed. Please be patient and try again shortly.";
  const supportText = useMemo(() => {
    const email = branding?.supportEmail;
    const phone = branding?.supportPhone;
    if (email && phone) return `${email} | ${phone}`;
    return email || phone || "Contact ICT or HR if you need urgent assistance.";
  }, [branding]);

  const loadStatus = useCallback(async ({ redirectWhenRestored = false } = {}) => {
    try {
      setChecking(true);
      const [maintenance, cfg] = await Promise.all([
        getMaintenanceStatus(),
        getPlatformConfig(),
      ]);

      setStatus(maintenance);
      window.sessionStorage.setItem("kmfri_maintenance_status", JSON.stringify(maintenance));

      if (cfg) {
        applyPlatformConfigToCoreData(cfg);
        setBranding({ ...(cfg.branding || {}), logoUrl: cfg.logoUrl });
      }

      if (redirectWhenRestored && !maintenance.active && !maintenance.scheduled) {
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Maintenance status unavailable:", error);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }, [navigate]);

  useEffect(() => {
    document.title = `${title} | KMFRI Attendance`;
  }, [title]);

  useEffect(() => {
    loadStatus();
    const interval = window.setInterval(() => {
      loadStatus({ redirectWhenRestored: true });
    }, 30000);

    return () => window.clearInterval(interval);
  }, [loadStatus]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        py: { xs: 4, md: 6 },
        background: `
          linear-gradient(135deg, rgba(10,61,98,0.94), rgba(0,137,123,0.88)),
          radial-gradient(circle at 80% 10%, rgba(255,255,255,0.24), transparent 34%),
          #0A3D62
        `,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            p: { xs: 2.5, sm: 4 },
            border: "1px solid rgba(255,255,255,0.36)",
            bgcolor: "rgba(255,255,255,0.94)",
            boxShadow: "0 28px 70px rgba(15,23,42,0.22)",
          }}
        >
          <Stack spacing={3}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 54,
                    height: 54,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: isActive ? "rgba(194,65,12,0.12)" : "rgba(0,137,123,0.12)",
                    color: isActive ? "#C2410C" : "#00897B",
                  }}
                >
                  {isActive || isScheduled ? <ConstructionRounded /> : <CheckCircleRounded />}
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={950} sx={{ lineHeight: 1.15, letterSpacing: 0 }}>
                    {title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {branding?.organizationName || "Kenya Marine and Fisheries Research Institute"}
                  </Typography>
                </Box>
              </Stack>

              <Chip
                label={isActive ? "Unavailable" : isScheduled ? "Scheduled" : "Online"}
                color={isActive ? "warning" : isScheduled ? "info" : "success"}
                sx={{ borderRadius: 1.5, fontWeight: 900 }}
              />
            </Stack>

            {loading ? (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">Checking system status...</Typography>
              </Stack>
            ) : (
              <Alert severity={isActive ? "warning" : isScheduled ? "info" : "success"} sx={{ borderRadius: 2 }}>
                {message}
              </Alert>
            )}

            <GridLikeSchedule start={status?.startAt} end={status?.endAt} />

            <Divider />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }}>
              <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                <SupportAgentRounded fontSize="small" />
                <Typography variant="body2">{supportText}</Typography>
              </Stack>
              <Button
                variant="contained"
                startIcon={checking ? <CircularProgress size={16} color="inherit" /> : <RefreshRounded />}
                onClick={() => loadStatus({ redirectWhenRestored: true })}
                disabled={checking}
                sx={{ borderRadius: 2, minHeight: 44 }}
              >
                Check Again
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

const GridLikeSchedule = ({ start, end }) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    spacing={1.5}
    sx={{
      display: "grid",
      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
    }}
  >
    <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#f8fbfc", border: "1px solid rgba(148,163,184,0.24)" }}>
      <Stack direction="row" spacing={1.3} alignItems="center">
        <ScheduleRounded color="primary" />
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={800}>Starts</Typography>
          <Typography variant="body2" fontWeight={900}>{formatDateTime(start)}</Typography>
        </Box>
      </Stack>
    </Box>
    <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#f8fbfc", border: "1px solid rgba(148,163,184,0.24)" }}>
      <Stack direction="row" spacing={1.3} alignItems="center">
        <EventAvailableRounded color="success" />
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={800}>Expected Restore</Typography>
          <Typography variant="body2" fontWeight={900}>{formatDateTime(end)}</Typography>
        </Box>
      </Stack>
    </Box>
  </Stack>
);

export default MaintenanceModePage;
