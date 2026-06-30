import { Alert, Box, Button, CircularProgress, FormControl, FormHelperText, IconButton, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import coreDataDetails from "../CoreDataDetails";
import { FieldLabel } from "./UserCard";
import { Close } from "@mui/icons-material";
const C = {
    deepNavy: "#0A3D62",
    oceanBlue: "#005B96",
    aquaVibrant: "#00e5ff",
    cyanFresh: "#3FC1FF",
    skyBlue: "#87CEEB",
    coralSunset: "#FF5C4A",
    warmSand: "#FFB400",
    seafoamGreen: "#48C9B0",
    softGray: "#E8EEF7",
    glassBg: "rgba(10,61,98,0.72)",
    glassBorder: "rgba(0,229,255,0.22)",
    glassBorderHover: "rgba(0,229,255,0.52)",
    glassInput: "rgba(0,91,150,0.28)",
    textPrimary: "#E6F4FA",
    textSecondary: "rgba(190,228,245,0.80)",
    textMuted: "rgba(190,228,245,0.48)",
    dark: "#05253D",
};

const textFieldSx = {
    "& .MuiOutlinedInput-root": {
        color: C.textPrimary,
        background: C.glassInput,
        borderRadius: "10px",
        "& fieldset": { borderColor: C.glassBorder },
        "&:hover fieldset": { borderColor: C.aquaVibrant },
        "&.Mui-focused fieldset": { borderColor: C.seafoamGreen },
    },
    "& .MuiInputLabel-root": { color: C.textMuted },
    "& .MuiInputLabel-root.Mui-focused": { color: C.seafoamGreen },
};

const selectSx = {
    color: C.textPrimary,
    fontSize: "0.8rem",
    borderRadius: "10px",
    background: C.glassInput,
    "& .MuiOutlinedInput-notchedOutline": { borderColor: C.glassBorder },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: C.aquaVibrant },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: C.seafoamGreen },
    "& .MuiSvgIcon-root": { color: C.cyanFresh },
};

const menuProps = {
    PaperProps: {
        sx: {
            background: C.dark,
            borderRadius: "12px",
            border: `1px solid ${C.glassBorder}`,
            color: C.textPrimary,
            willChange: "transform",
            boxShadow: "0 12px 40px rgba(0,0,0,0.65)",
            "& .MuiMenuItem-root": { fontSize: "0.8rem", py: 0.9 },
            "& .MuiMenuItem-root:hover": { background: "rgba(0,229,255,0.08)", color: C.aquaVibrant },
            "& .MuiMenuItem-root.Mui-selected": { background: "rgba(72,201,176,0.12)", color: C.seafoamGreen },
        },
    },
};
/* ─────────────────────────────────────────────
   CLOCK OUTSIDE MODAL (shared)
───────────────────────────────────────────── */
const ClockOutsideModal = ({ open, onClose, isLoading, error, formData, setFormData, onSubmit }) => {
    const today = new Date().toISOString().split("T")[0];

    return (
        <Box sx={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "92%", sm: 460 },
            bgcolor: C.dark,
            border: `1px solid ${C.aquaVibrant}38`,
            borderRadius: "20px",
            boxShadow: "0 28px 64px rgba(0,0,0,0.85)",
            p: { xs: 3, sm: 4 },
            outline: "none",
        }}>
            {/* Modal header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography sx={{
                        color: C.aquaVibrant, fontWeight: 900, fontSize: "0.75rem",
                        letterSpacing: "0.12em", textTransform: "uppercase",
                        fontFamily: "'Exo 2', sans-serif", mb: 0.3,
                    }}>
                        Clock Outside Authorization
                    </Typography>
                    <Typography sx={{ color: C.textMuted, fontSize: "0.72rem" }}>
                        Grant temporary outside-station clocking access
                    </Typography>
                </Box>
                <IconButton
                    disabled={isLoading}
                    onClick={onClose}
                    size="small"
                    sx={{
                        color: C.textMuted,
                        border: `1px solid ${C.glassBorder}`,
                        borderRadius: "8px",
                        width: 32, height: 32,
                        "&:hover": { color: C.coralSunset, borderColor: C.coralSunset, bgcolor: "rgba(255,92,74,0.08)" },
                    }}
                >
                    <Close fontSize="small" />
                </IconButton>
            </Stack>

            {error && (
                <Alert severity="error" sx={{
                    mb: 2.5, borderRadius: "10px",
                    bgcolor: "rgba(255,92,74,0.08)",
                    color: C.coralSunset,
                    border: `1px solid ${C.coralSunset}38`,
                    "& .MuiAlert-icon": { color: C.coralSunset },
                    fontSize: "0.78rem",
                }}>
                    {typeof error === "string"
                        ? error
                        : error?.message || "Something went wrong."}

                </Alert>
            )}

            <Stack spacing={2.5}>
                <Box>
                    <FieldLabel>Start Date</FieldLabel>
                    <TextField type="date" fullWidth size="small" sx={textFieldSx}
                        inputProps={{ min: today }}
                        value={formData.startDate}
                        onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))}
                    />
                </Box>
                <Box>
                    <FieldLabel>End Date</FieldLabel>
                    <TextField type="date" fullWidth size="small" sx={textFieldSx}
                        inputProps={{ min: formData.startDate || today }}
                        value={formData.endDate}
                        onChange={(e) => setFormData(p => ({ ...p, endDate: e.target.value }))}
                    />
                </Box>
                <Box>
                    <FieldLabel>Reason</FieldLabel>
                    <FormControl fullWidth size="small">
                        <Select sx={selectSx} MenuProps={menuProps}
                            value={formData.reason}
                            onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))}
                            displayEmpty
                        >
                            <MenuItem value="" disabled sx={{ color: C.textMuted }}><em>Select reason…</em></MenuItem>
                            {coreDataDetails.REASONS.map(r => (
                                <MenuItem key={r} value={r}>{r}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box sx={{
                    p: 1.5, borderRadius: "10px",
                    bgcolor: "rgba(0,229,255,0.04)",
                    border: `1px solid ${C.glassBorder}`,
                }}>
                    <FormHelperText sx={{ color: C.textMuted, fontSize: "0.72rem", m: 0 }}>
                        This grants the user permission to clock out from outside the station premises for the specified period.
                        Typically used for field work, official travel, or remote assignments.
                    </FormHelperText>
                </Box>

                <Button
                    fullWidth
                    onClick={onSubmit}
                    disabled={isLoading || !formData.startDate || !formData.endDate || !formData.reason}
                    startIcon={isLoading ? <CircularProgress size={15} color="inherit" /> : null}
                    sx={{
                        py: 1.2, borderRadius: "12px", fontWeight: 800,
                        fontSize: "0.8rem", letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        background: `linear-gradient(135deg, ${C.oceanBlue}, ${C.seafoamGreen})`,
                        color: "#fff",
                        "&:hover": { boxShadow: `0 0 24px ${C.aquaVibrant}50`, filter: "brightness(1.08)" },
                        "&:disabled": { opacity: 0.38, background: `linear-gradient(135deg, ${C.oceanBlue}, ${C.seafoamGreen})` },
                    }}
                >
                    {isLoading ? "Submitting…" : "Submit Authorization"}
                </Button>
            </Stack>
        </Box>
    );
};


export default ClockOutsideModal;