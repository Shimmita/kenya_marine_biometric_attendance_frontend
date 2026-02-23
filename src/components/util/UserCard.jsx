import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    MenuItem,
    Select,
    Stack,
    Typography
} from "@mui/material";
import { motion } from "framer-motion";
import { useState } from "react";
import coreDataDetails from "../CoreDataDetails";

/* ─────────────────────────────────────────────
   COLORS & SHARED STYLES
───────────────────────────────────────────── */
const colorPalette = {
    deepNavy: "#0A3D62",
    oceanBlue: "#005B96",
    marineBlue: "#1a237e",
    aquaVibrant: "#00e5ff",
    cyanFresh: "#3FC1FF",
    skyBlue: "#87CEEB",
    coralSunset: "#FF5C4A",
    warmSand: "#FFB400",
    seafoamGreen: "#48C9B0",
    cloudWhite: "#f8fafd",
    softGray: "#E8EEF7",
    charcoal: "#424242",

    glassBg: "rgba(10,61,98,0.68)",
    glassBgElevated: "rgba(0,91,150,0.48)",
    glassBorder: "rgba(0,229,255,0.28)",
    glassBorderHover: "rgba(0,229,255,0.58)",

    textPrimary: "#E6F4FA",
    textSecondary: "rgba(190,228,245,0.85)",
    textMuted: "rgba(190,228,245,0.55)",
};

const glassCard = (elevated = false) => ({
    background: colorPalette.glassBg,
    borderRadius: "16px",
    boxShadow: elevated
        ? "0 12px 36px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.1)"
        : "0 6px 22px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.07)",
});

const selectSx = {
    color: colorPalette.textPrimary,
    fontSize: "0.83rem",
    borderRadius: "10px",
    background: "rgba(0,91,150,0.32)",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,229,255,0.22)" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: colorPalette.aquaVibrant },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: colorPalette.seafoamGreen },
    "& .MuiSvgIcon-root": { color: colorPalette.cyanFresh },
};

const menuProps = {
    PaperProps: {
        sx: {
            background: "#05253D",
            borderRadius: "12px",
            color: colorPalette.textPrimary,
            willChange: 'transform',
            boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
            "& .MuiMenuItem-root": { fontSize: "0.83rem", py: 0.8 },
            "& .MuiMenuItem-root:hover": { background: "rgba(0,229,255,0.1)", color: colorPalette.aquaVibrant },
            "& .MuiMenuItem-root.Mui-selected": { background: "rgba(72,201,176,0.14)", color: colorPalette.seafoamGreen },
        },
    },
};

const RANK_ACCENT = {
    admin: colorPalette.warmSand,
    hr: "#C97DFF",
    supervisor: colorPalette.seafoamGreen,
    ceo: colorPalette.coralSunset,
    user: colorPalette.cyanFresh,
};

const RANKS = ["admin", "hr", "supervisor", "ceo", "user"];
const ROLES = ["employee", "intern", "attachee", "employee-contract"];
const { availableDepartments, AvailableStations } = coreDataDetails;

/* ─────────────────────────────────────────────
   SMALL REUSABLES
───────────────────────────────────────────── */
export const FieldLabel = ({ children }) => (
    <Typography sx={{
        fontSize: "0.62rem",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: colorPalette.cyanFresh,
        mb: 0.5,
        fontFamily: "'Exo 2', sans-serif",
    }}>{children}</Typography>
);

const GradientDivider = () => (
    <Box sx={{
        height: "1px",
        background: `linear-gradient(90deg, transparent, ${colorPalette.aquaVibrant}30, transparent)`,
        my: 1.5,
    }} />
);

/* ─────────────────────────────────────────────
   USER CARD
───────────────────────────────────────────── */
const UserCard = ({
    user, supervisors, updatingId,
    onRankChange, onRoleChange, onDepartmentSave,
    onSupervisorChange, onToggleActive,
    isMobile, index, onStationSave
}) => {
    const [hovered, setHovered] = useState(false);
    const rankColor = RANK_ACCENT[user.rank] || colorPalette.cyanFresh;
    const isUpdating = updatingId === user._id;


    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.28) }}
        >
            <Box
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                sx={{
                    ...glassCard(),
                    p: { xs: 2, md: 2.5 },
                    borderColor: hovered ? colorPalette.glassBorderHover : colorPalette.glassBorder,
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    willChange: 'transform',
                    boxShadow: hovered
                        ? `0 8px 28px rgba(0,0,0,0.4), 0 0 0 1px ${colorPalette.aquaVibrant}28`
                        : "0 4px 22px rgba(0,0,0,0.32)",
                }}
            >
                {/* HEADER */}
                <Stack
                    direction={isMobile ? "column" : "row"}
                    spacing={2}
                    alignItems={isMobile ? "flex-start" : "center"}
                    justifyContent="space-between"
                    mb={0}
                >
                    <Stack direction="row" spacing={1.8} alignItems="center">
                        <Box sx={{ position: "relative", flexShrink: 0 }}>
                            <Avatar sx={{
                                width: 46,
                                height: 46,
                                background: `linear-gradient(135deg, ${rankColor}40, ${rankColor}15)`,
                                color: rankColor,
                                fontWeight: 800,
                                fontSize: "1.05rem",
                                border: `2px solid ${rankColor}55`,
                                fontFamily: "'Exo 2', sans-serif",
                            }}>{user?.name?.charAt(0).toUpperCase()}</Avatar>

                            <Box sx={{
                                position: "absolute",
                                bottom: 1, right: 1,
                                width: 11, height: 11,
                                borderRadius: "50%",
                                background: user.isAccountActive ? colorPalette.seafoamGreen : colorPalette.coralSunset,
                                border: "2px solid #051C2E",
                                boxShadow: user.isAccountActive
                                    ? `0 0 5px ${colorPalette.seafoamGreen}AA`
                                    : `0 0 5px ${colorPalette.coralSunset}AA`,
                            }} />
                        </Box>

                        <Box>
                            <Typography sx={{ fontWeight: 'bold', color: colorPalette.textPrimary, lineHeight: 1.25 }}>
                                {user.name?.toUpperCase()}
                            </Typography>
                            <Typography variant="body2" sx={{ color: colorPalette.textSecondary, mb: 0.7, }}>
                                {user.email}
                            </Typography>
                            <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
                                <Chip label={user.rank} size="small" sx={{
                                    height: 22,
                                    fontSize: "0.68rem",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    background: `${rankColor}30`,
                                    color: rankColor,
                                    border: `1px solid ${rankColor}55`,
                                }} />
                                <Chip label={user.role} size="small" sx={{
                                    height: 22,
                                    fontSize: "0.68rem",
                                    background: "rgba(0,229,255,0.18)",
                                    color: colorPalette.aquaVibrant,
                                    border: `1px solid ${colorPalette.aquaVibrant}48`,
                                }} />
                                <Chip label={user.department || "No Dept"} size="small" sx={{
                                    height: 22,
                                    fontSize: "0.68rem",
                                    background: "rgba(135,206,235,0.18)",
                                    color: colorPalette.skyBlue,
                                    border: `1px solid ${colorPalette.skyBlue}48`,
                                }} />

                                {/* <Chip label={user.station?.name || "No Dept"} size="small" sx={{
                                    height: 22,
                                    fontSize: "0.68rem",
                                    background: "rgba(135,206,235,0.18)",
                                    color: C.skyBlue,
                                    border: `1px solid ${C.cloudWhite}48`,
                                }} /> */}
                            </Stack>
                        </Box>
                    </Stack>

                    <Stack
                        direction={isMobile ? "row" : "column"}
                        spacing={0.8}
                        alignItems={isMobile ? "center" : "flex-end"}
                        mt={isMobile ? 1 : 0}
                        flexShrink={0}
                    >
                        <Box sx={{
                            px: 1.3, py: 0.5,
                            borderRadius: "8px",
                            background: "rgba(0,91,150,0.42)",
                            border: `1px solid ${colorPalette.glassBorder}`,
                            textAlign: isMobile ? "left" : "right",
                        }}>
                            <Typography sx={{ fontSize: "0.57rem", color: colorPalette.textMuted, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                Supervisor
                            </Typography>
                            <Typography sx={{ fontSize: "0.7rem", color: colorPalette.seafoamGreen, fontWeight: 800, fontFamily: "'Exo 2', sans-serif" }}>
                                {user.supervisor?.name || "none"}
                            </Typography>
                        </Box>

                        <Box sx={{
                            px: 1.2, py: 0.4,
                            borderRadius: "8px",
                            background: user.isAccountActive ? "rgba(72,201,176,0.12)" : "rgba(255,111,97,0.12)",
                            border: `1px solid ${user.isAccountActive ? colorPalette.seafoamGreen : colorPalette.coralSunset}42`,
                        }}>
                            <Typography sx={{
                                fontSize: "0.72rem",
                                fontWeight: 'bold',
                                letterSpacing: "0.04em",
                                color: user.isAccountActive ? colorPalette.seafoamGreen : colorPalette.coralSunset,
                            }}>
                                {user.isAccountActive ? "● Active" : "● Inactive"}
                            </Typography>
                        </Box>
                    </Stack>
                </Stack>

                <GradientDivider />

                {/* CONTROLS */}
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap alignItems="flex-end">

                    {/* Rank */}
                    <Box>
                        <FieldLabel>Rank</FieldLabel>
                        <FormControl size="small" sx={{ minWidth: 128 }}>
                            <Select value={user.rank} onChange={(e) => onRankChange(user._id, e.target.value)} sx={selectSx} MenuProps={menuProps}>
                                {RANKS.map((r) => (
                                    <MenuItem key={r} value={r}>
                                        <Box component="span" sx={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: RANK_ACCENT[r] || colorPalette.cyanFresh, mr: 1 }} />
                                        {r}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Role */}
                    <Box>
                        <FieldLabel>Role</FieldLabel>
                        <FormControl size="small" sx={{ minWidth: 155 }}>
                            <Select value={user.role} onChange={(e) => onRoleChange(user._id, e.target.value)} sx={selectSx} MenuProps={menuProps}>
                                {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Department */}
                    <Box>
                        <FieldLabel>Department</FieldLabel>
                        <FormControl size="small" sx={{ minWidth: 185 }}>
                            <Select value={user.department || ""} displayEmpty onChange={(e) => onDepartmentSave(user._id, e.target.value)} sx={selectSx} MenuProps={menuProps}>
                                <MenuItem value="" sx={{ color: colorPalette.textMuted }}><em>Select Dept.</em></MenuItem>
                                {availableDepartments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Supervisor */}
                    <Box>
                        <FieldLabel>Supervisor</FieldLabel>
                        <FormControl size="small" sx={{ minWidth: 185 }}>
                            <Select value={user?.supervisor || "none"} displayEmpty onChange={(e) => onSupervisorChange(user._id, e.target.value)} sx={selectSx} MenuProps={menuProps}>
                                <MenuItem value={user?.supervisor} sx={{ color: colorPalette.textMuted }}>{user?.supervisor}</MenuItem>
                                {supervisors?.filter((supervisor) => supervisor?.email!== user?.email).map((supervisor) => (
                                    <MenuItem key={supervisor._id} value={supervisor}>{supervisor?.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    

                    {/* station */}
                    <Box>
                        <FieldLabel>Station</FieldLabel>
                        <FormControl size="small" sx={{ minWidth: 185 }}>
                            <Select value={user?.station || "none"} onChange={(e) => onStationSave(user?._id, e.target.value)} displayEmpty sx={selectSx} MenuProps={menuProps}>
                                <MenuItem value={user?.station} sx={{ color: colorPalette.textMuted }}>{user?.station}</MenuItem>
                                {AvailableStations.map((s) => (
                                    <MenuItem key={s?.name} value={s.name}>{s?.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Action */}
                    <Box>
                        <FieldLabel>Action</FieldLabel>
                        <Button
                            size="small"
                            variant="contained"
                            disabled={isUpdating}
                            onClick={() => onToggleActive(user._id)}
                            sx={{
                                height: 38,
                                px: 2.5,
                                borderRadius: "12px",
                                fontWeight: 700,
                                fontSize: "0.76rem",
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                                minWidth: 112,
                                background: user.isAccountActive
                                    ? `linear-gradient(135deg, ${colorPalette.coralSunset}, #e74c3c)`
                                    : `linear-gradient(135deg, ${colorPalette.seafoamGreen}, #1abc9c)`,
                                color: "#fff",
                                boxShadow: user.isAccountActive
                                    ? `0 4px 16px rgba(255,92,74,0.45)`
                                    : `0 4px 16px rgba(72,201,176,0.45)`,
                                "&:hover": {
                                    transform: "translateY(-1px)",
                                    boxShadow: user.isAccountActive
                                        ? `0 6px 20px rgba(255,92,74,0.65)`
                                        : `0 6px 20px rgba(72,201,176,0.65)`,
                                    background: user.isAccountActive
                                        ? `linear-gradient(135deg, #e74c3c, #c0392b)`
                                        : `linear-gradient(135deg, #3dd9b5, #16a085)`,
                                },
                                "&:disabled": { opacity: 0.44 },
                                transition: "all 0.2s ease",
                            }}
                        >
                            {isUpdating
                                ? <CircularProgress size={14} sx={{ color: "#fff" }} />
                                : user.isAccountActive ? "Deactivate" : "Activate"}
                        </Button>
                    </Box>

                </Stack>
            </Box>
        </motion.div>
    );
};

export default UserCard;