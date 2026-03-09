import { Close } from "@mui/icons-material";
import {
    Alert,
    Avatar,
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
    Typography
} from "@mui/material";
import { motion } from "framer-motion";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateUserCurrentUserRedux } from "../../redux/CurrentUser";
import { revokeClockOutsideStatus, updateClockOutsideStatus } from "../../service/UserManagement";
import { getUserProfile } from "../../service/UserProfile";
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


const textFieldSx = {
    "& .MuiOutlinedInput-root": {
        color: colorPalette.textPrimary,
        background: "rgba(0,91,150,0.2)",
        borderRadius: "10px",
        "& fieldset": { borderColor: "rgba(0,229,255,0.22)" },
        "&:hover fieldset": { borderColor: colorPalette.aquaVibrant },
        "&.Mui-focused fieldset": { borderColor: colorPalette.seafoamGreen },
    },
    "& .MuiInputLabel-root": { color: colorPalette.textMuted },
    "& .MuiInputLabel-root.Mui-focused": { color: colorPalette.seafoamGreen },
    "& .MuiSvgIcon-root": { color: colorPalette.cyanFresh },
};



/* ─────────────────────────────────────────────
   USER CARD
───────────────────────────────────────────── */
const UserCardDepart = ({
    user, supervisors, onRoleChange, onDepartmentSave,
    onSupervisorChange,
    isMobile, index, onStationSave
}) => {
    const [hovered, setHovered] = useState(false);
    const rankColor = RANK_ACCENT[user.rank] || colorPalette.cyanFresh;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const dispatch = useDispatch();
    const { user: currentUser } = useSelector(s => s.currentUser);

    const isCurrentUser = currentUser?._id === user._id


    // updated info about clocking out outside the station premises
    const [clockOutside, setClockOutside] = useState(user.canClockOutside ? "yes" : "no");
    const [openModal, setOpenModal] = useState(false);

    const today = new Date().toISOString().split("T")[0];


    const [formData, setFormData] = useState({
        startDate: "",
        endDate: "",
        reason: ""
    });

    const handleClockOutsideChange = async (e) => {
        const val = e.target.value;

        // If selecting "yes", just open the modal as before
        if (val === "yes") {
            setClockOutside("yes");
            setOpenModal(true);
            return;
        }

        // If selecting "no" and they previously had permission, revoke it
        if (val === "no" && user.canClockOutside) {
            const confirmRevoke = window.confirm(`Are you sure you want to revoke clock-outside permission for ${user.name}?`);

            if (confirmRevoke) {
                try {
                    setIsLoading(true);
                    await revokeClockOutsideStatus(user._id);

                    // Update local state and Redux
                    setClockOutside("no");
                    const updatedUser = await getUserProfile();
                    dispatch(updateUserCurrentUserRedux(updatedUser));
                } catch (err) {
                    setError(err || "Failed to revoke permission");
                    // Revert dropdown if API fails
                    setClockOutside("yes");
                } finally {
                    setIsLoading(false);
                }
            } else {
                // If user cancels the prompt, keep the dropdown at "yes"
                setClockOutside("yes");
            }
        } else {
            // Just updating the local UI state if no DB change is needed
            setClockOutside("no");
        }
    };


    const handleClose = () => {
        setOpenModal(false);
        setClockOutside("no");
    };

    const handleSubmit = async () => {
        const clockingData = {
            startDate: formData.startDate,
            endDate: formData.endDate,
            reason: formData.reason
        };

        // dates validations
        if (new Date(formData.endDate) <= new Date(formData.startDate)) {
            setError("The End Date must be a date after the Start Date.");
            return;
        }


        try {
            // update loading state
            setIsLoading(true);
            await updateClockOutsideStatus(user._id, clockingData);

            // refresh current user data in the redux 
            const updatedUser = await getUserProfile()
            dispatch(updateUserCurrentUserRedux(updatedUser))

            // Add a success notification here if you have one
            setOpenModal(false);
        } catch (error) {
            // Handle error (e.g., show an alert)
            setError(error || "Failed to update authorization");

            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };


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
                            <Avatar src={user?.avatar} sx={{
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

                                {isCurrentUser && (
                                    <Chip label={"You"} size="small" sx={{
                                        height: 22,
                                        fontSize: "0.68rem",
                                        background: "rgba(135,206,235,0.18)",
                                        color: colorPalette.softGray,
                                        border: `1px solid ${colorPalette.warmSand}48`,
                                    }} />
                                )}


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



                    {/* Role */}
                    <Box>
                        <FieldLabel>Role</FieldLabel>
                        <FormControl disabled size="small" sx={{ minWidth: 155 }}>
                            <Select value={user.role} onChange={(e) => onRoleChange(user._id, e.target.value)} sx={selectSx} MenuProps={menuProps}>
                                {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Department */}
                    <Box>
                        <FieldLabel>Department</FieldLabel>
                        <FormControl disabled={isCurrentUser} size="small" sx={{ minWidth: 185 }}>
                            <Select value={user.department || ""} displayEmpty onChange={(e) => onDepartmentSave(user._id, e.target.value)} sx={selectSx} MenuProps={menuProps}>
                                <MenuItem value="" sx={{ color: colorPalette.textMuted }}><em>Select Dept.</em></MenuItem>
                                {availableDepartments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* station */}
                    <Box>
                        <FieldLabel>Station</FieldLabel>
                        <FormControl disabled={isCurrentUser} size="small" sx={{ minWidth: 185 }}>
                            <Select value={user?.station || "none"} onChange={(e) => onStationSave(user?._id, e.target.value)} displayEmpty sx={selectSx} MenuProps={menuProps}>
                                <MenuItem value={user?.station} sx={{ color: colorPalette.textMuted }}>{user?.station}</MenuItem>
                                {AvailableStations.map((s) => (
                                    <MenuItem key={s?.name} value={s.name}>{s?.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Supervisor */}
                    <Box>
                        <FieldLabel>Supervisor</FieldLabel>
                        <FormControl disabled={isCurrentUser} size="small" sx={{ minWidth: 185 }}>
                            <Select value={user?.supervisor || "none"} displayEmpty onChange={(e) => onSupervisorChange(user._id, e.target.value)} sx={selectSx} MenuProps={menuProps}>
                                <MenuItem value={user?.supervisor} sx={{ color: colorPalette.textMuted }}>{user?.supervisor}</MenuItem>
                                {supervisors?.filter((supervisor) => supervisor?.email !== user?.email).map((supervisor) => (
                                    <MenuItem key={supervisor._id} value={supervisor}>{supervisor?.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>


                    {/* clock outside */}

                    <Box>
                        <FieldLabel>Clock Outside</FieldLabel>
                        <FormControl disabled={isLoading} size="small" sx={{ minWidth: 140 }}>
                            <Select
                                value={clockOutside}
                                onChange={handleClockOutsideChange}
                                sx={selectSx}
                                MenuProps={menuProps}
                            >
                                <MenuItem value="no">No</MenuItem>
                                <MenuItem value="yes">Yes</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Stack>

                {/* MODAL FOR CLOCK OUTSIDE DETAILS */}
                <Modal
                    open={openModal}
                    onClose={!isLoading && handleClose}
                    closeAfterTransition
                >
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: { xs: '90%', sm: 450 },
                        bgcolor: '#05253D',
                        border: `1px solid ${colorPalette.aquaVibrant}40`,
                        borderRadius: '20px',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.8)',
                        p: 4,
                        outline: 'none'
                    }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography sx={{ color: colorPalette.aquaVibrant, fontWeight: 800, fontFamily: "'Exo 2', sans-serif" }}>
                                CLOCK OUTSIDE AUTHORIZATION
                            </Typography>
                            <IconButton disabled={isLoading || error} onClick={handleClose} sx={{ color: colorPalette.textMuted }}>
                                <Close />
                            </IconButton>
                        </Stack>

                        {/* Error Message Display */}
                        {error && (
                            <Alert severity="error" sx={{
                                mb: 2,
                                bgcolor: "rgba(255, 92, 74, 0.1)",
                                color: colorPalette.coralSunset,
                                border: `1px solid ${colorPalette.coralSunset}40`,
                                "& .MuiAlert-icon": { color: colorPalette.coralSunset }
                            }}>
                                {error}
                            </Alert>
                        )}

                        <Stack spacing={3}>
                            <Box>
                                <FieldLabel>Start Date</FieldLabel>
                                <TextField
                                    type="date"
                                    fullWidth
                                    variant="outlined"
                                    inputProps={{ min: today }}
                                    size="small"
                                    sx={textFieldSx}
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </Box>

                            <Box>
                                <FieldLabel>End Date</FieldLabel>
                                <TextField
                                    type="date"
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    inputProps={{ min: formData.startDate || today }}
                                    sx={textFieldSx}
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </Box>

                            <Box>
                                <FieldLabel>Reason for Outside Premises</FieldLabel>
                                <FormControl fullWidth size="small">
                                    <Select
                                        sx={selectSx}
                                        MenuProps={menuProps}
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    >
                                        {coreDataDetails.REASONS.map(r => (
                                            <MenuItem key={r} value={r}>{r}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            <FormHelperText sx={{ color: 'whitesmoke' }}>
                                User will be allowed to clock out outside the station premises for the specified date range, with the provided reason. This is typically used for field work, official assignments, or remote work situations.
                            </FormHelperText>

                            <Button
                                onClick={handleSubmit}
                                startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : null}
                                disabled={isLoading || !formData.startDate || !formData.endDate || !formData.reason}
                                sx={{
                                    mt: 2,
                                    background: `linear-gradient(45deg, ${colorPalette.oceanBlue}, ${colorPalette.seafoamGreen})`,
                                    color: 'white',
                                    fontWeight: 700,
                                    borderRadius: '10px',
                                    py: 1.2,
                                    '&:hover': {
                                        boxShadow: `0 0 15px ${colorPalette.aquaVibrant}60`
                                    }
                                }}
                            >
                                Submit Authorization
                            </Button>
                        </Stack>
                    </Box>
                </Modal>

                {/* short description if user is allowed to clock outside */}
                {user.canClockOutside && (
                    <Alert severity="info" sx={{
                        mt: 3,
                        textTransform: 'capitalize',
                        bgcolor: "rgba(72, 201, 176, 0.1)",
                        color: colorPalette.seafoamGreen,
                        border: `1px solid ${colorPalette.seafoamGreen}40`,
                        "& .MuiAlert-icon": { color: colorPalette.seafoamGreen }
                    }}>
                        User is currently authorized to clock out outside the station premises. Authorised by: {user?.outsideClockingDetails?.authorizedBy || 'N/A'}{"---"}{user?.outsideClockingDetails?.authorizedByRole?.toUpperCase() || 'N/A'}. Reason: {user?.outsideClockingDetails?.reason || 'N/A'}. Valid from {user?.outsideClockingDetails?.startDate ? new Date(user.outsideClockingDetails.startDate).toLocaleDateString() : 'N/A'} to {user.outsideClockingDetails?.endDate ? new Date(user.outsideClockingDetails.endDate).toLocaleDateString() : 'N/A'}.
                    </Alert>
                )}

            </Box>
        </motion.div>
    );
};

export default UserCardDepart;