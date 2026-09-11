import {
  CheckCircleRounded,
  ConstructionRounded,
  EventAvailableRounded,
  LockRounded,
  ScheduleRounded,
  VerifiedUserRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { getMaintenanceStatus } from "../service/SuperadminService";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const readCachedMaintenance = () => {
  try {
    return JSON.parse(
      window.sessionStorage.getItem("kmfri_maintenance_status") || "null"
    );
  } catch {
    return null;
  }
};

const formatDateTime = (
  value,
  fallback = "To be confirmed"
) => {
  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleString("en-KE", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Nairobi",
  });
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

const MaintenanceModePage = () => {
  const navigate = useNavigate();

  const [status, setStatus] = useState(() =>
    readCachedMaintenance()
  );

  const [loading, setLoading] = useState(true);

  const isActive = Boolean(status?.active);
  const isScheduled = Boolean(status?.scheduled);

  const branding = useMemo(
    () => status?.branding || {},
    [status?.branding]
  );

  const organizationName =
    branding?.organizationName ||
    "Kenya Marine and Fisheries Research Institute";

  const shortName = branding?.shortName || "KMFRI";

  const title = isActive
    ? "System Maintenance"
    : isScheduled
      ? "Scheduled Maintenance"
      : "Services Restored";

  const statusLabel = isActive
    ? "Maintenance in progress"
    : isScheduled
      ? "Maintenance scheduled"
      : "System operational";

  const message =
    isActive || isScheduled
      ? status?.message ||
        "The KMFRI Attendance System is temporarily unavailable while scheduled maintenance is being completed."
      : "The KMFRI Attendance System is available again. You may continue using the platform.";

  /* ------------------------------------------------------------------------ */
  /* Status                                                                   */
  /* ------------------------------------------------------------------------ */

  const loadStatus = useCallback(
    async ({ redirectWhenRestored = false } = {}) => {
      try {
        const maintenance =
          await getMaintenanceStatus();

        setStatus(maintenance);

        window.sessionStorage.setItem(
          "kmfri_maintenance_status",
          JSON.stringify(maintenance)
        );

        if (
          redirectWhenRestored &&
          !maintenance.active &&
          !maintenance.scheduled
        ) {
          navigate("/", {
            replace: true,
          });
        }
      } catch (error) {
        console.error(
          "Maintenance status unavailable:",
          error
        );
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    document.title = `${title} | KMFRI Attendance`;
  }, [title]);

  useEffect(() => {
    loadStatus();

    const interval = window.setInterval(() => {
      loadStatus({
        redirectWhenRestored: true,
      });
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadStatus]);

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <Box
      sx={{
        minHeight: "100vh",

        display: "flex",
        alignItems: "center",

        py: {
          xs: 2,
          sm: 3,
          md: 4,
        },

        px: {
          xs: 1,
          sm: 2,
        },

        background:
          "linear-gradient(135deg, #F4F8FB 0%, #EDF5F7 100%)",
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            overflow: "hidden",

            borderRadius: {
              xs: 2.5,
              md: 3,
            },

            border:
              "1px solid rgba(10,61,98,0.10)",

            boxShadow:
              "0 20px 55px rgba(10,61,98,0.10)",
          }}
        >
          {/* ============================================================ */}
          {/* Header                                                       */}
          {/* ============================================================ */}

          <Box
            sx={{
              px: {
                xs: 2.5,
                sm: 4,
              },

              py: {
                xs: 2.5,
                sm: 3,
              },

              color: "#fff",

              background:
                "linear-gradient(135deg, #062848 0%, #0A3D62 100%)",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,

                  borderRadius: 2,

                  display: "grid",
                  placeItems: "center",

                  flexShrink: 0,

                  bgcolor:
                    "rgba(255,255,255,0.10)",

                  border:
                    "1px solid rgba(255,255,255,0.15)",

                  overflow: "hidden",
                }}
              >
                {branding?.logoUrl ? (
                  <Box
                    component="img"
                    src={branding.logoUrl}
                    alt={shortName}
                    sx={{
                      width: "78%",
                      height: "78%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <VerifiedUserRounded />
                )}
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontWeight: 900,

                    fontSize: {
                      xs: "0.9rem",
                      sm: "1rem",
                    },
                  }}
                >
                  {shortName} Attendance
                </Typography>

                <Typography
                  sx={{
                    mt: 0.2,

                    color:
                      "rgba(255,255,255,0.70)",

                    fontSize: {
                      xs: "0.72rem",
                      sm: "0.78rem",
                    },

                    lineHeight: 1.4,
                  }}
                >
                  {organizationName}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* ============================================================ */}
          {/* Content                                                      */}
          {/* ============================================================ */}

          <Box
            sx={{
              p: {
                xs: 2.5,
                sm: 4,
                md: 5,
              },

              bgcolor: "#fff",
            }}
          >
            {loading && !status ? (
              <Stack
                alignItems="center"
                spacing={1.5}
                sx={{
                  py: 6,
                }}
              >
                <CircularProgress size={28} />

                <Typography
                  color="text.secondary"
                  variant="body2"
                >
                  Checking service status...
                </Typography>
              </Stack>
            ) : (
              <>
                {/* Status */}

                <Chip
                  icon={
                    isActive || isScheduled ? (
                      <ConstructionRounded />
                    ) : (
                      <CheckCircleRounded />
                    )
                  }
                  label={statusLabel}
                  sx={{
                    mb: 2,

                    borderRadius: 1.5,

                    fontWeight: 800,

                    color: isActive
                      ? "#9A6700"
                      : isScheduled
                        ? "#005B96"
                        : "#147D64",

                    bgcolor: isActive
                      ? "#FFF7E0"
                      : isScheduled
                        ? "#EAF5FB"
                        : "#EAF8F4",

                    "& .MuiChip-icon": {
                      color: "inherit",
                    },
                  }}
                />

                {/* Title */}

                <Typography
                  component="h1"
                  sx={{
                    color: "#05253D",

                    fontWeight: 900,

                    fontSize: {
                      xs: "1.9rem",
                      sm: "2.5rem",
                      md: "2.8rem",
                    },

                    lineHeight: 1.1,

                    letterSpacing: "-0.035em",
                  }}
                >
                  {title}
                </Typography>

                {/* Message */}

                <Typography
                  sx={{
                    mt: 1.5,

                    maxWidth: 650,

                    color: "#64748B",

                    fontSize: {
                      xs: "0.92rem",
                      sm: "1rem",
                    },

                    lineHeight: 1.7,
                  }}
                >
                  {message}
                </Typography>

                {/* ====================================================== */}
                {/* Maintenance Window                                     */}
                {/* ====================================================== */}

                {(isActive || isScheduled) && (
                  <Box
                    sx={{
                      mt: 3.5,

                      display: "grid",

                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "1fr 1fr",
                      },

                      gap: 1.5,
                    }}
                  >
                    <ScheduleCard
                      icon={<ScheduleRounded />}
                      label="Starts"
                      value={formatDateTime(
                        status?.startAt
                      )}
                    />

                    <ScheduleCard
                      icon={
                        <EventAvailableRounded />
                      }
                      label="Expected Restoration"
                      value={formatDateTime(
                        status?.endAt
                      )}
                    />
                  </Box>
                )}

                {/* ====================================================== */}
                {/* Action                                                 */}
                {/* ====================================================== */}

                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                  }}
                  alignItems={{
                    xs: "stretch",
                    sm: "center",
                  }}
                  justifyContent="space-between"
                  spacing={2}
                  sx={{
                    mt: 4,
                    pt: 3,

                    borderTop:
                      "1px solid #E8EEF7",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#64748B",

                      fontSize: "0.78rem",

                      lineHeight: 1.5,
                    }}
                  >
                    Service status is checked
                    automatically.
                  </Typography>

                  <Button
                    variant="contained"
                    startIcon={<LockRounded />}
                    onClick={() =>
                      navigate(
                        "/?superadmin=1",
                        {
                          replace: true,
                        }
                      )
                    }
                    sx={{
                      minHeight: 44,

                      px: 2.5,

                      borderRadius: 1.7,

                      textTransform: "none",

                      fontWeight: 800,

                      bgcolor: "#0A3D62",

                      boxShadow: "none",

                      "&:hover": {
                        bgcolor: "#062848",
                        boxShadow: "none",
                      },
                    }}
                  >
                    Superadmin Access
                  </Button>
                </Stack>
              </>
            )}
          </Box>
        </Paper>

        {/* Footer */}

        <Typography
          align="center"
          sx={{
            mt: 2,

            color: "#94A3B8",

            fontSize: "0.7rem",
          }}
        >
          {shortName} Attendance Management System
        </Typography>
      </Container>
    </Box>
  );
};

/* -------------------------------------------------------------------------- */
/* Schedule Card                                                              */
/* -------------------------------------------------------------------------- */

const ScheduleCard = ({
  icon,
  label,
  value,
}) => (
  <Box
    sx={{
      p: 2,

      borderRadius: 2,

      bgcolor: "#F8FAFC",

      border:
        "1px solid #E8EEF7",
    }}
  >
    <Stack
      direction="row"
      spacing={1.4}
      alignItems="center"
    >
      <Box
        sx={{
          width: 38,
          height: 38,

          flexShrink: 0,

          borderRadius: 1.5,

          display: "grid",
          placeItems: "center",

          color: "#0A3D62",

          bgcolor:
            "rgba(10,61,98,0.07)",

          "& .MuiSvgIcon-root": {
            fontSize: 20,
          },
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: "#64748B",

            fontSize: "0.68rem",

            fontWeight: 800,

            textTransform: "uppercase",

            letterSpacing: "0.04em",
          }}
        >
          {label}
        </Typography>

        <Typography
          sx={{
            mt: 0.25,

            color: "#05253D",

            fontSize: "0.82rem",

            fontWeight: 800,

            lineHeight: 1.4,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  </Box>
);

export default MaintenanceModePage;