import { Box, Typography, Stack, Button, Chip } from "@mui/material";
import { Smartphone, Android, Apple, Download } from "@mui/icons-material";
import { motion } from "framer-motion";
import coreDataDetails from "../CoreDataDetails";

const { colorPalette } = coreDataDetails;

/* Glass surface — matching dashboard style */
const glassSurface = {
  background: "rgba(255,255,255,0.07)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.13)",
  boxShadow:
    "0 4px 20px rgba(6,28,50,0.22), inset 0 1px 0 rgba(255,255,255,0.10)",
};

const DownloadMobileAppSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Box
        sx={{
          ...glassSurface,
          borderRadius: "24px",
          p: { xs: 3, md: 5 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle decorative glow */}
        <Box
          sx={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(0,185,175,0.08)",
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />

        <Stack spacing={4}>
          {/* Header Section */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Box
              component={motion.div}
              whileHover={{ scale: 1.05 }}
              sx={{
                width: 90,
                height: 90,
                borderRadius: "22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: colorPalette.oceanGradient,
                boxShadow: "0 8px 28px rgba(0,0,0,0.25)",
              }}
            >
              <Smartphone sx={{ fontSize: 42, color: "#fff" }} />
            </Box>

            <Box>
              <Typography
                variant="h5"
                fontWeight={900}
                sx={{
                  background: colorPalette.oceanGradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                KMFRI Mobile Application
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  color: "rgba(20,40,60,0.70)",
                  maxWidth: 600,
                  lineHeight: 1.7,
                }}
              >
                To ensure uninterrupted attendance tracking, staff can now
                clock in using either the Web Portal or the KMFRI Android
                Mobile App. This dual-access system guarantees operational
                continuity even in cases of browser restrictions or temporary
                portal access challenges.
              </Typography>
            </Box>
          </Stack>

          {/* Availability Section */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Chip
              icon={<Android />}
              label="Android Supported"
              sx={{
                fontWeight: 700,
                bgcolor: "rgba(34,197,94,0.12)",
                color: "#16a34a",
                border: "1px solid rgba(34,197,94,0.28)",
              }}
            />

            <Chip
              icon={<Apple />}
              label="iOS Coming Soon"
              sx={{
                fontWeight: 700,
                bgcolor: "rgba(148,163,184,0.12)",
                color: "#64748b",
                border: "1px solid rgba(148,163,184,0.28)",
              }}
            />
          </Stack>

          {/* Redundancy Explanation */}
          <Box>
            <Typography
              variant="body2"
              sx={{ color: "rgba(20,40,60,0.75)", lineHeight: 1.7 }}
            >
              Clocking can now be performed through:
            </Typography>

            <Stack spacing={1.2} sx={{ mt: 1.5 }}>
              <Typography variant="body2">
                • 🌐 Web Portal (Primary Access Method)
              </Typography>
              <Typography variant="body2">
                • 📱 Android Mobile Application (Alternative Method)
              </Typography>
            </Stack>
          </Box>

          {/* Download Button */}
          <Box>
            <Button
              variant="contained"
              startIcon={<Download />}
              sx={{
                borderRadius: "14px",
                textTransform: "none",
                fontWeight: 800,
                px: 3,
                py: 1.2,
                background: colorPalette.oceanGradient,
                boxShadow: "0 8px 24px rgba(0,110,155,0.35)",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 30px rgba(0,110,155,0.45)",
                },
                transition: "all 0.2s ease",
              }}
            >
              Download for Android
            </Button>
          </Box>
        </Stack>
      </Box>
    </motion.div>
  );
};

export default DownloadMobileAppSection;
