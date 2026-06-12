import { Box, Typography } from "@mui/material";

const StatChip = ({ label, value, icon, color }) => (
  <Box
    sx={{
      background: "rgba(255,255,255,0.1)",
      backdropFilter: "blur(4px)",
      borderRadius: "20px",
      px: 1.5,
      py: 0.8,
      display: "flex",
      alignItems: "center",
      gap: 1,
      width: "100%",
    }}
  >
    {icon && <Box sx={{ color: color || "white", opacity: 0.9 }}>{icon}</Box>}
    <Box>
      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2, color: "white" }}>
        {value}
      </Typography>
    </Box>
  </Box>
);
export default StatChip;