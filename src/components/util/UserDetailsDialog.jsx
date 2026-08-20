import {
    BadgeRounded,
    BusinessRounded,
    CloseRounded,
    DeleteRounded,
    EventAvailableRounded,
    FingerprintRounded,
    KeyRounded,
    LocationOnRounded,
    ManageAccountsRounded,
    PersonRounded,
    PowerSettingsNewRounded,
    SaveRounded,
    SecurityRounded,
    ShieldRounded,
    SupervisorAccountRounded,
    WorkRounded
} from "@mui/icons-material";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormHelperText,
    IconButton,
    MenuItem,
    Select,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateUserCurrentUserRedux } from "../../redux/CurrentUser";
import { revokeClockOutsideStatus, updateClockOutsideStatus } from "../../service/UserManagement";
import { getUserProfile } from "../../service/UserProfile";
import coreDataDetails from "../CoreDataDetails";
import { getLocalDateInputValue } from "./DateTimeFormater";

const { availableDepartments, AvailableStations, ROLE_OPTIONS, RANK_OPTIONS } = coreDataDetails;

const colors = {
    primary: "var(--kmfri-primary, #0A3D62)",
    secondary: "var(--kmfri-secondary, #005B96)",
    accent: "var(--kmfri-accent, #48C9B0)",
    surface: "var(--kmfri-surface, #f8fafd)",
    text: "var(--kmfri-text, #172033)",
    page: "#F5F8FC",
    muted: "#687386",
    line: "rgba(15, 23, 42, 0.08)",
    lineStrong: "rgba(15, 23, 42, 0.14)",
    softBlue: "rgba(17, 103, 232, 0.08)",
    success: "#16A34A",
    warning: "#D97706",
    danger: "#DC2626",
    purple: "#7C3AED"
};

const selectSx = {
    minHeight: 42,
    borderRadius: "8px",
    bgcolor: "#FFFFFF",
    color: colors.text,
    fontSize: "0.86rem",
    fontWeight: 700,
    "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.line },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(17,103,232,0.32)" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: colors.secondary },
    "&.Mui-disabled": { bgcolor: "rgba(248,250,252,0.72)" },
    "& .MuiSvgIcon-root": { color: colors.muted }
};

const textFieldSx = {
    "& .MuiOutlinedInput-root": {
        minHeight: 42,
        borderRadius: "8px",
        bgcolor: "#FFFFFF",
        fontSize: "0.86rem",
        fontWeight: 700,
        color: colors.text,
        "& fieldset": { borderColor: colors.line },
        "&:hover fieldset": { borderColor: "rgba(17,103,232,0.32)" },
        "&.Mui-focused fieldset": { borderColor: colors.secondary }
    },
    "& .MuiInputBase-input": { py: 1.15 }
};

const menuProps = {
    PaperProps: {
        sx: {
            borderRadius: "8px",
            border: `1px solid ${colors.line}`,
            boxShadow: "0 14px 34px rgba(15, 23, 42, 0.16)",
            "& .MuiMenuItem-root": { py: 0.9, fontSize: "0.86rem" },
            "& .MuiMenuItem-root:hover": { bgcolor: colors.softBlue },
            "& .MuiMenuItem-root.Mui-selected": { bgcolor: "rgba(17,103,232,0.12)", color: colors.secondary }
        }
    }
};

const normalizeDateInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
};

const formatDisplayDate = (value) => {
    if (!value) return "Not set";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const safeValue = (value) => {
    if (value === null || typeof value === "undefined" || value === "") return "Not provided";
    return value;
};

const getInitials = (name = "") => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "U";
    return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
};

const toTitle = (value) => {
    const text = String(value || "").trim();
    if (!text) return "Not assigned";
    return text.charAt(0).toUpperCase() + text.slice(1);
};

const statusTone = (tone) => {
    const map = {
        success: { bg: "rgba(22,163,74,0.10)", color: colors.success },
        warning: { bg: "rgba(217,119,6,0.11)", color: colors.warning },
        danger: { bg: "rgba(220,38,38,0.10)", color: colors.danger },
        blue: { bg: "rgba(17,103,232,0.10)", color: colors.secondary },
        purple: { bg: "rgba(124,58,237,0.10)", color: colors.purple },
        neutral: { bg: "rgba(100,116,139,0.10)", color: "#475569" }
    };
    return map[tone] || map.neutral;
};

const Section = ({ icon, title, description, children }) => (
    <Box
        sx={{
            bgcolor: "#FFFFFF",
            border: `1px solid ${colors.line}`,
            borderRadius: "8px",
            boxShadow: "0 10px 26px rgba(15, 23, 42, 0.07)",
            overflow: "hidden"
        }}
    >
        <Stack
            direction="row"
            spacing={1.5}
            alignItems="flex-start"
            sx={{
                px: { xs: 2, sm: 2.25 },
                py: 1.75,
                borderBottom: `1px solid ${colors.line}`,
                bgcolor: "rgba(248,250,252,0.72)"
            }}
        >
            <Box
                sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "8px",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: colors.softBlue,
                    color: colors.secondary,
                    flex: "0 0 auto"
                }}
            >
                {icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 850, color: colors.text, fontSize: "0.95rem" }}>
                    {title}
                </Typography>
                {description && (
                    <Typography sx={{ color: colors.muted, fontSize: "0.78rem", mt: 0.2, lineHeight: 1.45 }}>
                        {description}
                    </Typography>
                )}
            </Box>
        </Stack>
        <Box sx={{ p: { xs: 2, sm: 2.25 } }}>
            {children}
        </Box>
    </Box>
);

const DetailItem = ({ label, value, icon }) => (
    <Stack
        direction="row"
        spacing={1.25}
        alignItems="flex-start"
        sx={{
            minHeight: 58,
            p: 1.35,
            borderRadius: "8px",
            border: `1px solid ${colors.line}`,
            bgcolor: "#FFFFFF"
        }}
    >
        {icon && (
            <Box sx={{ color: colors.secondary, display: "grid", placeItems: "center", mt: 0.15 }}>
                {icon}
            </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: colors.muted, fontSize: "0.72rem", fontWeight: 750 }}>
                {label}
            </Typography>
            <Typography
                sx={{
                    color: colors.text,
                    fontSize: "0.88rem",
                    fontWeight: 800,
                    lineHeight: 1.35,
                    wordBreak: "break-word"
                }}
            >
                {safeValue(value)}
            </Typography>
        </Box>
    </Stack>
);

const StatusChip = ({ label, tone = "neutral" }) => {
    const toneSx = statusTone(tone);
    return (
        <Chip
            label={label}
            size="small"
            sx={{
                height: 26,
                borderRadius: "8px",
                bgcolor: toneSx.bg,
                color: toneSx.color,
                fontWeight: 850,
                fontSize: "0.72rem",
                border: `1px solid ${toneSx.color}22`
            }}
        />
    );
};

const FieldBlock = ({ label, helper, disabled, children }) => (
    <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 0.8 }}>
            <Typography sx={{ color: colors.text, fontSize: "0.78rem", fontWeight: 800 }}>
                {label}
            </Typography>
            {disabled && (
                <Typography sx={{ color: colors.muted, fontSize: "0.7rem", fontWeight: 700 }}>
                    Locked
                </Typography>
            )}
        </Stack>
        {children}
        {helper && (
            <FormHelperText sx={{ mx: 0, mt: 0.8, color: colors.muted, fontSize: "0.72rem", lineHeight: 1.4 }}>
                {helper}
            </FormHelperText>
        )}
    </Box>
);

const MetricTile = ({ label, value, tone = "blue", icon }) => {
    const toneSx = statusTone(tone);
    return (
        <Box
            sx={{
                p: 1.45,
                borderRadius: "8px",
                border: `1px solid ${colors.line}`,
                bgcolor: "#FFFFFF",
                minHeight: 78
            }}
        >
            <Stack direction="row" spacing={1.1} alignItems="center">
                <Box
                    sx={{
                        width: 34,
                        height: 34,
                        borderRadius: "8px",
                        bgcolor: toneSx.bg,
                        color: toneSx.color,
                        display: "grid",
                        placeItems: "center",
                        flex: "0 0 auto"
                    }}
                >
                    {icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: colors.muted, fontSize: "0.7rem", fontWeight: 800 }}>
                        {label}
                    </Typography>
                    <Typography sx={{ color: colors.text, fontSize: "0.95rem", fontWeight: 900, lineHeight: 1.25 }}>
                        {value}
                    </Typography>
                </Box>
            </Stack>
        </Box>
    );
};

const ActionButton = ({ children, tone = "blue", sx, ...props }) => {
    const toneSx = statusTone(tone);
    return (
        <Button
            fullWidth
            variant="outlined"
            {...props}
            sx={{
                justifyContent: "flex-start",
                minHeight: 46,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 850,
                borderColor: `${toneSx.color}35`,
                color: toneSx.color,
                bgcolor: toneSx.bg,
                "&:hover": {
                    borderColor: `${toneSx.color}66`,
                    bgcolor: toneSx.bg
                },
                "&.Mui-disabled": {
                    borderColor: colors.line,
                    bgcolor: "rgba(248,250,252,0.78)"
                },
                ...sx
            }}
        >
            {children}
        </Button>
    );
};

export default function UserDetailsDialog({
    open,
    onClose,
    user,
    supervisors = [],
    updatingId,
    readOnly = false,
    onRankChange,
    onRoleChange,
    onDepartmentSave,
    onStationSave,
    onSupervisorChange,
    onOnLeaveChange,
    onToggleActive,
    onDeleteUser,
    onResetBiometrics,
    onResetPassword,
    hideActionsTab = false,
    hideRoleRankManagement = false
}) {
    const dispatch = useDispatch();
    const currentUser = useSelector((state) => state.currentUser.user);
    const currentUserRank = String(currentUser?.rank || "").toLowerCase();

    const [tab, setTab] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [clockOutside, setClockOutside] = useState("no");
    const [formData, setFormData] = useState({
        startDate: "",
        endDate: "",
        reason: ""
    });

    const today = getLocalDateInputValue();
    const isUpdatingUser = Boolean(isLoading || (user?._id && updatingId === user._id));

    const selectedSupervisor = useMemo(() => {
        if (!user?.supervisor) return "";
        return supervisors.find((supervisor) => {
            const name = String(supervisor?.name || "").trim().toLowerCase();
            const email = String(supervisor?.email || "").trim().toLowerCase();
            const value = String(user.supervisor || "").trim().toLowerCase();
            return value && (value === name || value === email);
        }) || "";
    }, [supervisors, user?.supervisor]);

    const canManageLeaveStatus = ["hr", "supervisor", "superadmin"].includes(currentUserRank);
    const canManageAssignments = ["hr", "supervisor", "superadmin"].includes(currentUserRank);
    const canManageClockOutside = ["admin", "hr", "supervisor", "superadmin"].includes(currentUserRank);
    const canManageRole = ["admin", "hr", "ceo", "superadmin"].includes(currentUserRank);
    const canManageRank = ["admin", "hr", "superadmin"].includes(currentUserRank) && String(currentUser?.role || "").toLowerCase() === "employee";
    const canAssignSupervisor = ["admin", "hr", "ceo", "superadmin"].includes(currentUserRank);
    const canManageLifecycle = ["hr", "superadmin", "admin"].includes(currentUserRank);
    const canResetBiometrics = ["admin", "hr", "superadmin"].includes(currentUserRank);
    const canResetPassword = ["admin", "superadmin"].includes(currentUserRank);

    useEffect(() => {
        if (!open || !user) return;
        setTab(0);
        setClockOutside(user.canClockOutside ? "yes" : "no");
        setFormData({
            startDate: normalizeDateInput(user.outsideClockingDetails?.startDate),
            endDate: normalizeDateInput(user.outsideClockingDetails?.endDate),
            reason: user.outsideClockingDetails?.reason || ""
        });
        setError("");
    }, [open, user?._id]);

    useEffect(() => {
        if (!user) return;
        setClockOutside(user.canClockOutside ? "yes" : "no");
        setFormData((previous) => ({
            startDate: normalizeDateInput(user.outsideClockingDetails?.startDate) || previous.startDate,
            endDate: normalizeDateInput(user.outsideClockingDetails?.endDate) || previous.endDate,
            reason: user.outsideClockingDetails?.reason || previous.reason
        }));
    }, [
        user?.canClockOutside,
        user?.outsideClockingDetails?.startDate,
        user?.outsideClockingDetails?.endDate,
        user?.outsideClockingDetails?.reason
    ]);

    useEffect(() => {
        if (hideActionsTab && tab === 3) setTab(0);
    }, [hideActionsTab, tab]);

    if (!user) return null;

    const disabledBase = readOnly || isUpdatingUser;
    const accountTone = user.isAccountActive ? "success" : "danger";
    const biometricTone = user.doneBiometric || user.hasDevices ? "success" : "warning";
    const leaveTone = user.isOnLeave ? "warning" : "success";
    const clockTone = user.canClockOutside ? "purple" : "neutral";

    const refreshSignedInUser = async () => {
        try {
            const updatedUser = await getUserProfile();
            dispatch(updateUserCurrentUserRedux(updatedUser));
        } catch (err) {
            console.warn("Unable to refresh signed-in user profile", err);
        }
    };

    const normalizeError = (err, fallback) => {
        if (!err) return fallback;
        if (typeof err === "string") return err;
        return err?.message || fallback;
    };

    const handleClockOutsideChange = async (event) => {
        const value = event.target.value;
        setError("");

        if (value === "yes") {
            setClockOutside("yes");
            return;
        }

        if (value === "no" && user.canClockOutside) {
            const confirmed = window.confirm(`Revoke clock-outside permission for ${user.name}?`);
            if (!confirmed) {
                setClockOutside("yes");
                return;
            }

            try {
                setIsLoading(true);
                await revokeClockOutsideStatus(user._id);
                setClockOutside("no");
                setFormData({ startDate: "", endDate: "", reason: "" });
                await refreshSignedInUser();
            } catch (err) {
                setClockOutside("yes");
                setError(normalizeError(err, "Failed to revoke clock-outside access."));
            } finally {
                setIsLoading(false);
            }
            return;
        }

        setClockOutside("no");
    };

    const handleClockOutsideSubmit = async () => {
        setError("");
        if (!formData.startDate || !formData.endDate || !formData.reason) {
            setError("Start date, end date, and reason are required.");
            return;
        }
        if (new Date(formData.endDate) < new Date(formData.startDate)) {
            setError("End date cannot be before start date.");
            return;
        }

        try {
            setIsLoading(true);
            await updateClockOutsideStatus(user._id, formData);
            setClockOutside("yes");
            await refreshSignedInUser();
        } catch (err) {
            setError(normalizeError(err, "Failed to update clock-outside access."));
        } finally {
            setIsLoading(false);
        }
    };

    const assignmentDisabled = disabledBase || !canManageAssignments;
    const tabs = [
        { label: "Overview", icon: <PersonRounded fontSize="small" /> },
        { label: "Access", icon: <SecurityRounded fontSize="small" /> },
        { label: "Attendance", icon: <EventAvailableRounded fontSize="small" /> },
        ...(!hideActionsTab ? [{ label: "Actions", icon: <ManageAccountsRounded fontSize="small" /> }] : [])
    ];

    return (
        <Dialog
            open={open}
            onClose={isUpdatingUser ? undefined : onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: { xs: 0, sm: "12px" },
                    overflow: "hidden",
                    bgcolor: colors.page,
                    boxShadow: "0 24px 70px rgba(15, 23, 42, 0.22)",
                    maxHeight: { xs: "100%", sm: "92vh" },
                    m: { xs: 0, sm: 2 }
                }
            }}
        >
            <DialogTitle
                sx={{
                    p: 0,
                    bgcolor: "#FFFFFF",
                    borderBottom: `1px solid ${colors.line}`
                }}
            >
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    justifyContent="space-between"
                    spacing={2}
                    sx={{ p: { xs: 2, sm: 2.5 } }}
                >
                    <Stack direction="row" spacing={1.6} alignItems="center" sx={{ minWidth: 0 }}>
                        <Avatar
                            src={user.avatar}
                            sx={{
                                width: { xs: 54, sm: 64 },
                                height: { xs: 54, sm: 64 },
                                bgcolor: colors.secondary,
                                color: "#FFFFFF",
                                fontWeight: 900,
                                fontSize: "1rem",
                                boxShadow: "0 10px 24px rgba(0,91,150,0.22)"
                            }}
                        >
                            {getInitials(user.name)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                sx={{
                                    color: colors.text,
                                    fontWeight: 900,
                                    fontSize: { xs: "1.15rem", sm: "1.35rem" },
                                    lineHeight: 1.15,
                                    wordBreak: "break-word"
                                }}
                            >
                                {safeValue(user.name)}
                            </Typography>
                            <Typography
                                sx={{
                                    color: colors.muted,
                                    fontSize: "0.84rem",
                                    mt: 0.35,
                                    wordBreak: "break-word"
                                }}
                            >
                                {safeValue(user.email)}
                            </Typography>
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                                <StatusChip label={toTitle(user.role)} tone="blue" />
                                <StatusChip label={toTitle(user.rank)} tone="purple" />
                                <StatusChip label={user.isAccountActive ? "Active" : "Inactive"} tone={accountTone} />
                            </Stack>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-end", sm: "center" }}>
                        <Tooltip title="Close" arrow>
                            <IconButton
                                onClick={onClose}
                                disabled={isUpdatingUser}
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: "8px",
                                    border: `1px solid ${colors.line}`,
                                    color: colors.muted,
                                    bgcolor: "#FFFFFF",
                                    "&:hover": { color: colors.danger, borderColor: "rgba(220,38,38,0.25)", bgcolor: "rgba(220,38,38,0.04)" }
                                }}
                            >
                                <CloseRounded fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>

                <Box sx={{ px: { xs: 1.25, sm: 2 }, pb: 1.25 }}>
                    <Tabs
                        value={tab}
                        onChange={(event, value) => setTab(value)}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        sx={{
                            minHeight: 44,
                            "& .MuiTabs-indicator": { display: "none" },
                            "& .MuiTabs-flexContainer": { gap: 0.75 },
                            "& .MuiTab-root": {
                                minHeight: 40,
                                borderRadius: "8px",
                                px: 1.5,
                                textTransform: "none",
                                fontWeight: 850,
                                color: colors.muted,
                                border: `1px solid transparent`
                            },
                            "& .MuiTab-root.Mui-selected": {
                                bgcolor: colors.softBlue,
                                color: colors.secondary,
                                borderColor: "rgba(17,103,232,0.18)"
                            }
                        }}
                    >
                        {tabs.map((item) => (
                            <Tab key={item.label} icon={item.icon} iconPosition="start" label={item.label} />
                        ))}
                    </Tabs>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: { xs: 2, sm: 2.5 }, bgcolor: colors.page }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>
                        {error}
                    </Alert>
                )}

                {tab === 0 && (
                    <Stack spacing={2}>
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
                                gap: 1.5
                            }}
                        >
                            <MetricTile label="Account" value={user.isAccountActive ? "Active" : "Inactive"} tone={accountTone} icon={<ShieldRounded fontSize="small" />} />
                            <MetricTile label="Biometrics" value={user.doneBiometric || user.hasDevices ? "Registered" : "Pending"} tone={biometricTone} icon={<FingerprintRounded fontSize="small" />} />
                            <MetricTile label="Leave Status" value={user.isOnLeave ? "On leave" : "Available"} tone={leaveTone} icon={<EventAvailableRounded fontSize="small" />} />
                            <MetricTile label="Outside Clocking" value={user.canClockOutside ? "Allowed" : "Standard"} tone={clockTone} icon={<LocationOnRounded fontSize="small" />} />
                        </Box>

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                                gap: 2
                            }}
                        >
                            <Section
                                icon={<BadgeRounded fontSize="small" />}
                                title="Profile Details"
                                description="Core staff identity and contact information."
                            >
                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.25 }}>
                                    <DetailItem label="Staff Number" value={user.employeeId} icon={<BadgeRounded fontSize="small" />} />
                                    <DetailItem label="Phone" value={user.phone} icon={<PersonRounded fontSize="small" />} />
                                    <DetailItem label="Email" value={user.email} icon={<SecurityRounded fontSize="small" />} />
                                    <DetailItem label="Email Verification" value={user.email_verified ? "Verified" : "Not verified"} icon={<ShieldRounded fontSize="small" />} />
                                </Box>
                            </Section>

                            <Section
                                icon={<WorkRounded fontSize="small" />}
                                title="Placement"
                                description="Current organisational posting for attendance reporting."
                            >
                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.25 }}>
                                    <DetailItem label="Department" value={user.department} icon={<BusinessRounded fontSize="small" />} />
                                    <DetailItem label="Station" value={user.station} icon={<LocationOnRounded fontSize="small" />} />
                                    <DetailItem label="Supervisor" value={user.supervisor} icon={<SupervisorAccountRounded fontSize="small" />} />
                                    <DetailItem label="Role / Rank" value={`${toTitle(user.role)} / ${toTitle(user.rank)}`} icon={<WorkRounded fontSize="small" />} />
                                </Box>
                            </Section>
                        </Box>
                    </Stack>
                )}

                {tab === 1 && (
                    <Stack spacing={2}>
                        {!hideRoleRankManagement && (
                            <Section
                                icon={<SecurityRounded fontSize="small" />}
                                title="Role And Rank"
                                description="Controls the user's access level and staff category."
                            >
                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                                    <FieldBlock
                                        label="Role"
                                        helper={!canManageRole ? "Only authorised HR, admin, CEO, or superadmin ranks can change roles." : "Choose the user's employment category."}
                                        disabled={disabledBase || !canManageRole || !onRoleChange}
                                    >
                                        <FormControl fullWidth size="small">
                                            <Select
                                                value={user.role || ""}
                                                onChange={(event) => onRoleChange?.(user._id, event.target.value)}
                                                disabled={disabledBase || !canManageRole || !onRoleChange}
                                                sx={selectSx}
                                                MenuProps={menuProps}
                                                displayEmpty
                                            >
                                                <MenuItem value="" disabled>Select role</MenuItem>
                                                {ROLE_OPTIONS.map((role) => (
                                                    <MenuItem key={role} value={role}>{role}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </FieldBlock>

                                    <FieldBlock
                                        label="Rank"
                                        helper={!canManageRank ? "Rank changes are limited to authorised employee administrators." : "Rank determines dashboard permissions."}
                                        disabled={disabledBase || !canManageRank || !onRankChange}
                                    >
                                        <FormControl fullWidth size="small">
                                            <Select
                                                value={user.rank || ""}
                                                onChange={(event) => onRankChange?.(user._id, event.target.value)}
                                                disabled={disabledBase || !canManageRank || !onRankChange}
                                                sx={selectSx}
                                                MenuProps={menuProps}
                                                displayEmpty
                                            >
                                                <MenuItem value="" disabled>Select rank</MenuItem>
                                                {RANK_OPTIONS.map((rank) => (
                                                    <MenuItem key={rank} value={rank}>{rank}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </FieldBlock>

                                </Box>
                            </Section>
                        )}

                        <Section
                            icon={<BusinessRounded fontSize="small" />}
                            title="Assignment"
                            description="Department, station, and reporting line used in attendance and leave workflows."
                        >
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                                <FieldBlock
                                    label="Department"
                                    helper={!canManageAssignments ? "Your current access does not allow department updates." : "Changing this affects supervisor and department reports."}
                                    disabled={assignmentDisabled || !onDepartmentSave}
                                >
                                    <FormControl fullWidth size="small">
                                        <Select
                                            value={user.department || ""}
                                            onChange={(event) => onDepartmentSave?.(user._id, event.target.value)}
                                            disabled={assignmentDisabled || !onDepartmentSave}
                                            sx={selectSx}
                                            MenuProps={menuProps}
                                            displayEmpty
                                        >
                                            <MenuItem value="" disabled>Select department</MenuItem>
                                            {availableDepartments.map((department) => (
                                                <MenuItem key={department} value={department}>{department}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </FieldBlock>

                                <FieldBlock
                                    label="Station"
                                    helper={!canManageAssignments ? "Your current access does not allow station updates." : "Station is used for geofence and attendance grouping."}
                                    disabled={assignmentDisabled || !onStationSave}
                                >
                                    <FormControl fullWidth size="small">
                                        <Select
                                            value={user.station || ""}
                                            onChange={(event) => onStationSave?.(user._id, event.target.value)}
                                            disabled={assignmentDisabled || !onStationSave}
                                            sx={selectSx}
                                            MenuProps={menuProps}
                                            displayEmpty
                                        >
                                            <MenuItem value="" disabled>Select station</MenuItem>
                                            {AvailableStations.map((station) => (
                                                <MenuItem key={station.name} value={station.name}>{station.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </FieldBlock>

                                <FieldBlock
                                    label="Supervisor"
                                    helper={!canAssignSupervisor ? "Supervisor assignment is restricted to HR, admin, CEO, or superadmin ranks." : "Assign the reporting supervisor stored against this user."}
                                    disabled={disabledBase || !canAssignSupervisor || !onSupervisorChange}
                                >
                                    <FormControl fullWidth size="small">
                                        <Select
                                            value={selectedSupervisor}
                                            onChange={(event) => onSupervisorChange?.(user._id, event.target.value)}
                                            disabled={disabledBase || !canAssignSupervisor || !onSupervisorChange}
                                            sx={selectSx}
                                            MenuProps={menuProps}
                                            displayEmpty
                                            renderValue={(selected) => selected?.name || user.supervisor || "Select supervisor"}
                                        >
                                            <MenuItem value="" disabled>Select supervisor</MenuItem>
                                            {supervisors
                                                ?.filter((supervisor) => supervisor?.email !== user.email)
                                                .map((supervisor) => (
                                                    <MenuItem key={supervisor._id || supervisor.email} value={supervisor}>
                                                        {supervisor.name} {supervisor.station ? `- ${supervisor.station}` : ""}
                                                    </MenuItem>
                                                ))}
                                        </Select>
                                    </FormControl>
                                </FieldBlock>

                                <FieldBlock
                                    label="Leave Status"
                                    helper={!canManageLeaveStatus ? "Leave status can be updated by HR, supervisors, and superadmin only." : "Manual leave status affects clocking availability and attendance summaries."}
                                    disabled={disabledBase || !canManageLeaveStatus || !onOnLeaveChange}
                                >
                                    <FormControl fullWidth size="small">
                                        <Select
                                            value={user.isOnLeave ? "yes" : "no"}
                                            onChange={(event) => onOnLeaveChange?.(user._id, event.target.value)}
                                            disabled={disabledBase || !canManageLeaveStatus || !onOnLeaveChange}
                                            sx={selectSx}
                                            MenuProps={menuProps}
                                        >
                                            <MenuItem value="no">No</MenuItem>
                                            <MenuItem value="yes">Yes</MenuItem>
                                        </Select>
                                    </FormControl>
                                </FieldBlock>
                            </Box>
                        </Section>
                    </Stack>
                )}

                {tab === 2 && (
                    <Stack spacing={2}>
                        <Section
                            icon={<FingerprintRounded fontSize="small" />}
                            title="Authentication Status"
                            description="Biometric and password signals used when staff clock in or access the system."
                        >
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 1.25 }}>
                                <MetricTile label="Biometric Enrolment" value={user.doneBiometric ? "Registered" : "Pending"} tone={user.doneBiometric ? "success" : "warning"} icon={<FingerprintRounded fontSize="small" />} />
                                <MetricTile label="Registered Devices" value={user.hasDevices ? "Available" : "None"} tone={user.hasDevices ? "success" : "neutral"} icon={<ShieldRounded fontSize="small" />} />
                                <MetricTile label="Password Status" value={user.isPasswordReset ? "Reset required" : "Normal"} tone={user.isPasswordReset ? "warning" : "success"} icon={<KeyRounded fontSize="small" />} />
                            </Box>
                        </Section>

                        <Section
                            icon={<LocationOnRounded fontSize="small" />}
                            title="Clock Outside Access"
                            description="Temporary permission for official off-premise clocking. Standard geofence checks still determine whether a clock record is inside or outside the premise."
                        >
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "280px 1fr" }, gap: 2, alignItems: "start" }}>
                                <FieldBlock
                                    label="Permission"
                                    helper={!canManageClockOutside ? "Your current access cannot update outside clocking." : "Set to yes only for field work, official travel, or approved remote duty."}
                                    disabled={disabledBase || !canManageClockOutside}
                                >
                                    <FormControl fullWidth size="small">
                                        <Select
                                            value={clockOutside}
                                            onChange={handleClockOutsideChange}
                                            disabled={disabledBase || !canManageClockOutside}
                                            sx={selectSx}
                                            MenuProps={menuProps}
                                        >
                                            <MenuItem value="no">No</MenuItem>
                                            <MenuItem value="yes">Yes</MenuItem>
                                        </Select>
                                    </FormControl>
                                </FieldBlock>

                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.25 }}>
                                    <DetailItem label="Current Status" value={user.canClockOutside ? "Allowed" : "Standard premise clocking"} icon={<LocationOnRounded fontSize="small" />} />
                                    <DetailItem label="Authorised By" value={user.outsideClockingDetails?.authorizedBy} icon={<ShieldRounded fontSize="small" />} />
                                    <DetailItem label="Valid From" value={formatDisplayDate(user.outsideClockingDetails?.startDate)} icon={<EventAvailableRounded fontSize="small" />} />
                                    <DetailItem label="Valid To" value={formatDisplayDate(user.outsideClockingDetails?.endDate)} icon={<EventAvailableRounded fontSize="small" />} />
                                </Box>
                            </Box>

                            {clockOutside === "yes" && (
                                <Box
                                    sx={{
                                        mt: 2,
                                        p: 1.5,
                                        borderRadius: "8px",
                                        border: `1px solid ${colors.line}`,
                                        bgcolor: "rgba(248,250,252,0.78)"
                                    }}
                                >
                                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1.2fr" }, gap: 1.5 }}>
                                        <FieldBlock label="Start Date">
                                            <TextField
                                                fullWidth
                                                type="date"
                                                size="small"
                                                value={formData.startDate}
                                                onChange={(event) => setFormData((previous) => ({ ...previous, startDate: event.target.value }))}
                                                inputProps={{ min: today }}
                                                disabled={disabledBase || !canManageClockOutside}
                                                sx={textFieldSx}
                                            />
                                        </FieldBlock>

                                        <FieldBlock label="End Date">
                                            <TextField
                                                fullWidth
                                                type="date"
                                                size="small"
                                                value={formData.endDate}
                                                onChange={(event) => setFormData((previous) => ({ ...previous, endDate: event.target.value }))}
                                                inputProps={{ min: formData.startDate || today }}
                                                disabled={disabledBase || !canManageClockOutside}
                                                sx={textFieldSx}
                                            />
                                        </FieldBlock>

                                        <FieldBlock label="Reason">
                                            <FormControl fullWidth size="small">
                                                <Select
                                                    value={formData.reason}
                                                    onChange={(event) => setFormData((previous) => ({ ...previous, reason: event.target.value }))}
                                                    disabled={disabledBase || !canManageClockOutside}
                                                    sx={selectSx}
                                                    MenuProps={menuProps}
                                                    displayEmpty
                                                >
                                                    <MenuItem value="" disabled>Select reason</MenuItem>
                                                    {coreDataDetails.REASONS.map((reason) => (
                                                        <MenuItem key={reason} value={reason}>{reason}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </FieldBlock>
                                    </Box>

                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" sx={{ mt: 1.5 }}>
                                        <Typography sx={{ color: colors.muted, fontSize: "0.76rem", lineHeight: 1.45 }}>
                                            Saving this permission notifies the staff member and updates their attendance profile immediately.
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            startIcon={isUpdatingUser ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />}
                                            onClick={handleClockOutsideSubmit}
                                            disabled={disabledBase || !canManageClockOutside || !formData.startDate || !formData.endDate || !formData.reason}
                                            sx={{
                                                minHeight: 42,
                                                px: 2,
                                                borderRadius: "8px",
                                                textTransform: "none",
                                                fontWeight: 850,
                                                bgcolor: colors.secondary,
                                                boxShadow: "0 10px 20px rgba(0,91,150,0.18)",
                                                "&:hover": { bgcolor: colors.primary }
                                            }}
                                        >
                                            Save Permission
                                        </Button>
                                    </Stack>
                                </Box>
                            )}
                        </Section>
                    </Stack>
                )}

                {!hideActionsTab && tab === 3 && (
                    <Stack spacing={2}>
                        <Section
                            icon={<ShieldRounded fontSize="small" />}
                            title="Security Actions"
                            description="Use these actions when a device, biometric profile, or password needs controlled recovery."
                        >
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
                                <ActionButton
                                    tone="warning"
                                    startIcon={<FingerprintRounded />}
                                    onClick={() => onResetBiometrics?.(user._id)}
                                    disabled={disabledBase || !canResetBiometrics || !onResetBiometrics}
                                >
                                    Reset User Biometrics
                                </ActionButton>
                                <ActionButton
                                    tone="blue"
                                    startIcon={<KeyRounded />}
                                    onClick={() => onResetPassword?.(user._id)}
                                    disabled={disabledBase || !canResetPassword || !onResetPassword}
                                >
                                    Reset User Password
                                </ActionButton>
                            </Box>
                        </Section>

                        <Section
                            icon={<ManageAccountsRounded fontSize="small" />}
                            title="Account Lifecycle"
                            description="Lifecycle actions affect whether the user can access attendance services."
                        >
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
                                <ActionButton
                                    tone={user.isAccountActive ? "warning" : "success"}
                                    startIcon={<PowerSettingsNewRounded />}
                                    onClick={() => onToggleActive?.(user._id)}
                                    disabled={disabledBase || !canManageLifecycle || !onToggleActive}
                                >
                                    {user.isAccountActive ? "Deactivate Account" : "Activate Account"}
                                </ActionButton>
                                <ActionButton
                                    tone="danger"
                                    startIcon={<DeleteRounded />}
                                    onClick={() => onDeleteUser?.(user._id)}
                                    disabled={disabledBase || !canManageLifecycle || !onDeleteUser}
                                >
                                    Delete User Permanently
                                </ActionButton>
                            </Box>
                        </Section>
                    </Stack>
                )}
            </DialogContent>

            <DialogActions
                sx={{
                    px: { xs: 2, sm: 2.5 },
                    py: 1.5,
                    bgcolor: "#FFFFFF",
                    borderTop: `1px solid ${colors.line}`,
                    justifyContent: "space-between"
                }}
            >
                <Typography sx={{ color: colors.muted, fontSize: "0.76rem", fontWeight: 700 }}>
                    {readOnly ? "Read-only view" : "Changes are saved through the active management action."}
                </Typography>
                <Button
                    onClick={onClose}
                    disabled={isUpdatingUser}
                    variant="outlined"
                    sx={{
                        borderRadius: "8px",
                        textTransform: "none",
                        fontWeight: 850,
                        borderColor: colors.lineStrong,
                        color: colors.text,
                        minWidth: 92
                    }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
