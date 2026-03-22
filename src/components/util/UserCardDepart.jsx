import { Close, LocationOnRounded, ShieldRounded, WorkRounded } from "@mui/icons-material";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    FormHelperText,
    IconButton,
    MenuItem,
    Modal,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography,
    Avatar,
    Alert,
} from "@mui/material";
import { motion } from "framer-motion";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateUserCurrentUserRedux } from "../../redux/CurrentUser";
import { revokeClockOutsideStatus, updateClockOutsideStatus } from "../../service/UserManagement";
import { getUserProfile } from "../../service/UserProfile";
import coreDataDetails from "../CoreDataDetails";

/* ─────────────────────────────────────────────
   DESIGN TOKENS (identical to UserCard)
───────────────────────────────────────────── */
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

const RANK_ACCENT = {
    admin: C.warmSand,
    hr: "#C97DFF",
    supervisor: C.seafoamGreen,
    ceo: C.coralSunset,
    user: C.cyanFresh,
};

const ROLES = ["employee", "intern", "attachee", "employee-contract"];
const { availableDepartments, AvailableStations } = coreDataDetails;

/* ─────────────────────────────────────────────
   SHARED STYLE HELPERS
───────────────────────────────────────────── */
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

/* ─── Reusable sub-components ── */
export const FieldLabel = ({ children }) => (
    <Typography sx={{
        fontSize: "0.58rem",
        fontWeight: 800,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: C.cyanFresh,
        mb: 0.6,
        fontFamily: "'Exo 2', sans-serif",
    }}>
        {children}
    </Typography>
);

const Divider = () => (
    <Box sx={{
        height: "1px",
        background: `linear-gradient(90deg, transparent, ${C.aquaVibrant}28, transparent)`,
        my: 2,
    }} />
);

const ControlField = ({ label, minWidth = 140, children, disabled }) => (
    <Box sx={{ flex: `0 0 ${minWidth}px`, opacity: disabled ? 0.45 : 1 }}>
        <FieldLabel>{label}</FieldLabel>
        {children}
    </Box>
);

/* ─────────────────────────────────────────────
   CLOCK OUTSIDE MODAL
───────────────────────────────────────────── */
const ClockOutsideModal = ({ open, onClose, isLoading, error, formData, setFormData, onSubmit }) => {
    const today = new Date().toISOString().split("T")[0];

    return (
        <Modal open={open} onClose={!isLoading ? onClose : undefined} closeAfterTransition>
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
                        {error}
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
        </Modal>
    );
};

/* ─────────────────────────────────────────────
   MAIN USER CARD (Supervisor / Department)
───────────────────────────────────────────── */
const UserCardDepart = ({
    user, supervisors, onRoleChange, onDepartmentSave,
    onSupervisorChange, isMobile, index, onStationSave
}) => {
    const [hovered, setHovered] = useState(false);
    const rankColor = RANK_ACCENT[user.rank] || C.cyanFresh;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const dispatch = useDispatch();
    const { user: currentUser } = useSelector(s => s.currentUser);
    const isCurrentUser = currentUser?._id === user._id;

    const [clockOutside, setClockOutside] = useState(user.canClockOutside ? "yes" : "no");
    const [openModal, setOpenModal] = useState(false);
    const [formData, setFormData] = useState({ startDate: "", endDate: "", reason: "" });

    const handleClockOutsideChange = async (e) => {
        const val = e.target.value;
        if (val === "yes") {
            setClockOutside("yes");
            setOpenModal(true);
            return;
        }
        if (val === "no" && user.canClockOutside) {
            const confirmRevoke = window.confirm(`Revoke clock-outside permission for ${user.name}?`);
            if (confirmRevoke) {
                try {
                    setIsLoading(true);
                    await revokeClockOutsideStatus(user._id);
                    setClockOutside("no");
                    const updatedUser = await getUserProfile();
                    dispatch(updateUserCurrentUserRedux(updatedUser));
                } catch (err) {
                    setError(err || "Failed to revoke permission");
                    setClockOutside("yes");
                } finally {
                    setIsLoading(false);
                }
            } else {
                setClockOutside("yes");
            }
        } else {
            setClockOutside("no");
        }
    };

    const handleClose = () => {
        setOpenModal(false);
        setClockOutside("no");
        setError("");
    };

    const handleSubmit = async () => {
        if (new Date(formData.endDate) <= new Date(formData.startDate)) {
            setError("End date must be after start date.");
            return;
        }
        try {
            setIsLoading(true);
            await updateClockOutsideStatus(user._id, formData);
            const updatedUser = await getUserProfile();
            dispatch(updateUserCurrentUserRedux(updatedUser));
            setOpenModal(false);
            setError("");
        } catch (err) {
            setError(err || "Failed to update authorization");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.24, delay: Math.min(index * 0.04, 0.3) }}
        >
            <Box
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                sx={{
                    background: C.glassBg,
                    borderRadius: "18px",
                    border: `1px solid ${hovered ? C.glassBorderHover : C.glassBorder}`,
                    boxShadow: hovered
                        ? `0 12px 36px rgba(0,0,0,0.5), 0 0 0 1px ${C.aquaVibrant}22`
                        : "0 4px 20px rgba(0,0,0,0.35)",
                    transition: "border-color 0.22s, box-shadow 0.22s",
                    overflow: "hidden",
                    willChange: "transform",
                }}
            >
                {/* ── Rank accent line ── */}
                <Box sx={{ height: 3, background: `linear-gradient(90deg, ${rankColor}cc, ${rankColor}22, transparent)` }} />

                <Box sx={{ p: { xs: 2, md: 2.5 } }}>
                    {/* ── Header ── */}
                    <Stack
                        direction={isMobile ? "column" : "row"}
                        justifyContent="space-between"
                        alignItems={isMobile ? "flex-start" : "center"}
                        spacing={1.5}
                    >
                        <Stack direction="row" spacing={1.8} alignItems="center" sx={{ minWidth: 0 }}>
                            <Box sx={{ position: "relative", flexShrink: 0 }}>
                                <Avatar
                                    src={user?.avatar}
                                    sx={{
                                        width: 48, height: 48,
                                        background: `linear-gradient(135deg, ${rankColor}38, ${rankColor}12)`,
                                        color: rankColor,
                                        fontWeight: 800,
                                        fontSize: "1.1rem",
                                        border: `2px solid ${rankColor}44`,
                                        fontFamily: "'Exo 2', sans-serif",
                                    }}
                                >
                                    {user?.name?.charAt(0).toUpperCase()}
                                </Avatar>
                                <Tooltip title={user.isAccountActive ? "Active" : "Inactive"}>
                                    <Box sx={{
                                        position: "absolute", bottom: 1, right: 1,
                                        width: 11, height: 11, borderRadius: "50%",
                                        background: user.isAccountActive ? C.seafoamGreen : C.coralSunset,
                                        border: "2px solid #051C2E",
                                        boxShadow: user.isAccountActive
                                            ? `0 0 6px ${C.seafoamGreen}99`
                                            : `0 0 6px ${C.coralSunset}99`,
                                    }} />
                                </Tooltip>
                            </Box>

                            <Box sx={{ minWidth: 0 }}>
                                <Stack direction="row" spacing={0.75} alignItems="center">
                                    <Typography sx={{ fontWeight: 800, color: C.textPrimary, fontSize: "0.92rem", letterSpacing: "0.02em", lineHeight: 1.2 }}>
                                        {user.name?.toUpperCase()}
                                    </Typography>
                                    {isCurrentUser && (
                                        <Chip label="You" size="small" sx={{
                                            height: 18, fontSize: "0.58rem", fontWeight: 800,
                                            background: `${C.warmSand}22`, color: C.warmSand,
                                            border: `1px solid ${C.warmSand}44`,
                                        }} />
                                    )}
                                </Stack>
                                <Typography sx={{ color: C.textSecondary, fontSize: "0.72rem", mb: 0.7 }}>
                                    {user.email}
                                </Typography>
                                <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
                                    <Chip label={user.rank} size="small" sx={{
                                        height: 20, fontSize: "0.62rem", fontWeight: 800,
                                        textTransform: "uppercase", letterSpacing: "0.04em",
                                        background: `${rankColor}28`, color: rankColor, border: `1px solid ${rankColor}44`,
                                    }} />
                                    <Chip
                                        icon={<WorkRounded sx={{ fontSize: "0.7rem !important" }} />}
                                        label={user.role} size="small"
                                        sx={{
                                            height: 20, fontSize: "0.62rem",
                                            background: "rgba(0,229,255,0.12)", color: C.aquaVibrant,
                                            border: `1px solid ${C.aquaVibrant}38`,
                                            "& .MuiChip-icon": { color: C.aquaVibrant },
                                        }}
                                    />
                                    {user.department && (
                                        <Chip
                                            icon={<LocationOnRounded sx={{ fontSize: "0.7rem !important" }} />}
                                            label={user.department} size="small"
                                            sx={{
                                                height: 20, fontSize: "0.62rem",
                                                background: "rgba(135,206,235,0.12)", color: C.skyBlue,
                                                border: `1px solid ${C.skyBlue}38`,
                                                "& .MuiChip-icon": { color: C.skyBlue },
                                            }}
                                        />
                                    )}
                                </Stack>
                            </Box>
                        </Stack>

                        {/* Meta badges */}
                        <Stack
                            direction={isMobile ? "row" : "column"}
                            spacing={0.8}
                            alignItems={isMobile ? "center" : "flex-end"}
                            mt={isMobile ? 1 : 0}
                            flexShrink={0}
                        >


                            <Box sx={{
                                px: 1.2, py: 0.4, borderRadius: "8px",
                                background: user.isAccountActive ? "rgba(72,201,176,0.1)" : "rgba(255,92,74,0.1)",
                                border: `1px solid ${user.isAccountActive ? C.seafoamGreen : C.coralSunset}38`,
                            }}>
                                <Typography sx={{
                                    fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.04em",
                                    color: user.isAccountActive ? C.seafoamGreen : C.coralSunset,
                                }}>
                                    {user.isAccountActive ? "● Active" : "● Inactive"}
                                </Typography>
                            </Box>
                        </Stack>
                    </Stack>

                    <Divider />

                    {/* ── Controls — supervisor has limited permissions ── */}
                    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap alignItems="flex-end">

                        {/* Role — read-only for supervisor */}
                        <ControlField label="Role" minWidth={155} disabled>
                            <FormControl size="small" fullWidth disabled>
                                <Select value={user.role} onChange={(e) => onRoleChange(user._id, e.target.value)} sx={selectSx} MenuProps={menuProps}>
                                    {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </ControlField>

                        <ControlField label="Department" minWidth={185} disabled={isCurrentUser}>
                            <FormControl size="small" fullWidth disabled={isCurrentUser}>
                                <Select value={user.department || ""} displayEmpty onChange={(e) => onDepartmentSave(user._id, e.target.value)} sx={selectSx} MenuProps={menuProps}>
                                    <MenuItem value="" sx={{ color: C.textMuted }}><em>Select dept.</em></MenuItem>
                                    {availableDepartments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </ControlField>

                        <ControlField label="Station" minWidth={175} disabled={isCurrentUser}>
                            <FormControl size="small" fullWidth disabled={isCurrentUser}>
                                <Select value={user?.station || "none"} onChange={(e) => onStationSave(user?._id, e.target.value)} displayEmpty sx={selectSx} MenuProps={menuProps}>
                                    <MenuItem value={user?.station} sx={{ color: C.textMuted }}>{user?.station || "—"}</MenuItem>
                                    {AvailableStations.map((s) => (
                                        <MenuItem key={s?.name} value={s.name}>{s?.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </ControlField>

                        <ControlField label="Supervisor" minWidth={185} disabled={isCurrentUser}>
                            <FormControl size="small" fullWidth disabled={isCurrentUser || currentUser?.rank !== 'hr'}>
                                <Select value={user?.supervisor || "none"} displayEmpty onChange={(e) => onSupervisorChange(user._id, e.target.value)} sx={selectSx} MenuProps={menuProps}>
                                    <MenuItem value={user?.supervisor} sx={{ color: C.textMuted }}>{user?.supervisor || "—"}</MenuItem>
                                    {supervisors?.filter((s) => s?.email !== user?.email).map((s) => (
                                        <MenuItem key={s._id} value={s}>{s?.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </ControlField>

                        <ControlField label="Clock Outside" minWidth={132}>
                            <FormControl size="small" fullWidth disabled={isLoading}>
                                <Select value={clockOutside} onChange={handleClockOutsideChange} sx={{
                                    ...selectSx,
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: clockOutside === "yes" ? `${C.seafoamGreen}60` : C.glassBorder,
                                    },
                                }} MenuProps={menuProps}>
                                    <MenuItem value="no" sx={{ color: C.coralSunset }}>No</MenuItem>
                                    <MenuItem value="yes" sx={{ color: C.seafoamGreen }}>Yes</MenuItem>
                                </Select>
                            </FormControl>
                        </ControlField>
                    </Stack>

                    {/* ── Clock outside banner ── */}
                    {user.canClockOutside && (
                        <Box sx={{
                            mt: 2.5, p: 1.5, borderRadius: "12px",
                            background: "rgba(72,201,176,0.07)",
                            border: `1px solid ${C.seafoamGreen}38`,
                            borderLeft: `3px solid ${C.seafoamGreen}`,
                        }}>
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                                <ShieldRounded sx={{ color: C.seafoamGreen, fontSize: "0.95rem", mt: 0.15, flexShrink: 0 }} />
                                <Box>
                                    <Typography sx={{ color: C.seafoamGreen, fontWeight: 800, fontSize: "0.7rem", letterSpacing: "0.04em", mb: 0.4 }}>
                                        OUTSIDE-STATION ACCESS ACTIVE
                                    </Typography>
                                    <Typography sx={{ color: C.textSecondary, fontSize: "0.72rem", lineHeight: 1.6 }}>
                                        Authorised by <strong style={{ color: C.textPrimary }}>{user?.outsideClockingDetails?.authorizedBy || "N/A"}</strong>
                                        {" "}({user?.outsideClockingDetails?.authorizedByRole?.toUpperCase() || "N/A"}) · Reason: <strong style={{ color: C.textPrimary }}>{user?.outsideClockingDetails?.reason || "N/A"}</strong>
                                        {" "}· Valid <strong style={{ color: C.cyanFresh }}>{user?.outsideClockingDetails?.startDate ? new Date(user.outsideClockingDetails.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}</strong>
                                        {" "}→ <strong style={{ color: C.cyanFresh }}>{user?.outsideClockingDetails?.endDate ? new Date(user.outsideClockingDetails.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}</strong>
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    )}
                </Box>
            </Box>

            <ClockOutsideModal
                open={openModal}
                onClose={handleClose}
                isLoading={isLoading}
                error={error}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
            />
        </motion.div>
    );
};

export default UserCardDepart;