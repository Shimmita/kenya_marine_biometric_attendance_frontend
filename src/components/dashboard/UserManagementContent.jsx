import {
    BadgeRounded,
    CheckCircleRounded,
    GroupsRounded,
    RestartAltRounded,
    SchoolRounded,
    SearchRounded,
    SupervisorAccountRounded,
} from "@mui/icons-material";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    FormControl,
    InputAdornment,
    MenuItem,
    Select,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
    useMediaQuery,
    useTheme
} from "@mui/material";
import { motion as Motion } from "framer-motion";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateUserCurrentUserRedux } from "../../redux/CurrentUser";
import {
    deleteUser,
    getAllSupervisors,
    getAllUsers,
    resetUserBiometrics,
    resetUserPassword,
    toggleUserActive,
    updateUserDepartment,
    updateUserOnLeave,
    updateUserRank,
    updateUserRole,
    updateUserStation,
    updateUserSupervisor
} from "../../service/UserManagement";
import { getUserProfile } from "../../service/UserProfile";
import coreDataDetails from "../CoreDataDetails";
import UserDetailsDialog from "../util/UserDetailsDialog";
import UserTable from "../util/UserTable";

/* ─────────────────────────────────────────────
   UPDATED COLOR PALETTE
───────────────────────────────────────────── */
export const C = {
    deepNavy: "#0A3D62",
    oceanBlue: "#005B96",
    brightBlue: "#1167E8",
    marineBlue: "#1a237e",
    aquaVibrant: "#00e5ff",
    cyanFresh: "#3FC1FF",     // brighter
    skyBlue: "#87CEEB",
    coralSunset: "#FF5C4A",     // sharper
    warmSand: "#FFB400",
    seafoamGreen: "#48C9B0",
    cloudWhite: "#f8fafd",
    softGray: "#E8EEF7",
    charcoal: "#424242",
    ink: "#172033",
    muted: "#687386",
    pageBg: "#F5F8FC",
    line: "rgba(15, 23, 42, 0.08)",
    cardShadow: "0 10px 26px rgba(15, 23, 42, 0.08)",

    // Surface / glass tokens
    glassBg: "rgba(10,61,98,0.68)",   // less transparent for readability
    glassBgElevated: "rgba(0,91,150,0.48)",
    glassBorder: "rgba(0,229,255,0.28)",
    glassBorderHover: "rgba(0,229,255,0.58)",

    textPrimary: "#E6F4FA",
    textSecondary: "rgba(190,228,245,0.85)", // sharper
    textMuted: "rgba(190,228,245,0.55)", // slightly more visible
};

/* ─────────────────────────────────────────────
   SHARED STYLE HELPERS
───────────────────────────────────────────── */
const selectSx = {
    color: C.ink,
    willChange: 'transform',
    fontSize: "0.86rem",
    fontWeight: 700,
    borderRadius: "8px",
    background: "#FFFFFF",
    minHeight: 42,
    "& .MuiOutlinedInput-notchedOutline": { borderColor: C.line },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(17,103,232,0.32)" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: C.brightBlue },
    "& .MuiSvgIcon-root": { color: C.muted },
};

const menuProps = {
    PaperProps: {
        sx: {
            background: "#FFFFFF",
            border: `1px solid ${C.line}`,
            borderRadius: "8px",
            willChange: 'transform',
            color: C.ink,
            boxShadow: "0 12px 30px rgba(15,23,42,0.14)",
            "& .MuiMenuItem-root": { fontSize: "0.86rem", py: 0.9 },
            "& .MuiMenuItem-root:hover": { background: "rgba(17,103,232,0.08)" },
            "& .MuiMenuItem-root.Mui-selected": { background: "rgba(17,103,232,0.12)", color: C.brightBlue },
        },
    },
};

const RANK_ACCENT = {
    admin: C.warmSand,
    hr: "#C97DFF",
    supervisor: C.cloudWhite,
    ceo: C.seafoamGreen,
    user: C.cyanFresh,
    superadmin: C.coralSunset,
};

const { availableDepartments, AvailableStations, ROLE_OPTIONS, RANK_OPTIONS } = coreDataDetails;

const normalizeStationName = (value = "") =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/\bcenter\b/g, "centre");




const USER_GROUP_TABS = [
    { value: "employee", label: "Staff", idColumnLabel: "Staff No", icon: BadgeRounded },
    { value: "intern", label: "Interns", idColumnLabel: "ID No", icon: SchoolRounded },
    { value: "attachee", label: "Attaches", idColumnLabel: "ID No", icon: GroupsRounded },
];

const normalizeUserRole = (role = "") => String(role || "").trim().toLowerCase();

const getUserGroupValue = (user) => {
    const role = normalizeUserRole(user?.role);
    if (role === "intern") return "intern";
    if (role === "attachee") return "attachee";
    return "employee";
};

const getUserGroupMeta = (value) =>
    USER_GROUP_TABS.find((tab) => tab.value === value) || USER_GROUP_TABS[0];

export const UserGroupTabs = ({ value, onChange, users = [] }) => {
    const themeVars = {
        primary: "var(--kmfri-primary, #0A3D62)",
        secondary: "var(--kmfri-secondary, #005B96)",
        gradient: "var(--kmfri-gradient, linear-gradient(135deg, #0A3D62 0%, #005B96 58%, #48C9B0 100%))",
        primarySoft: "var(--kmfri-primary-soft, rgba(10, 61, 98, 0.10))",
        secondarySoft: "var(--kmfri-secondary-soft, rgba(0, 91, 150, 0.14))",
        accentSoft: "var(--kmfri-accent-soft, rgba(72, 201, 176, 0.18))",
    };
    const counts = useMemo(() => {
        const next = USER_GROUP_TABS.reduce((acc, tab) => ({ ...acc, [tab.value]: 0 }), {});
        users.forEach((user) => {
            const group = getUserGroupValue(user);
            next[group] = (next[group] || 0) + 1;
        });
        return next;
    }, [users]);

    return (
        <Box
            sx={{
                p: 0.8,
                borderRadius: "8px",
                bgcolor: "rgba(255,255,255,0.88)",
                border: "1px solid var(--kmfri-secondary-soft, rgba(0,91,150,0.14))",
                boxShadow: "0 10px 26px rgba(15, 23, 42, 0.07)",
                position: "relative",
                overflow: "hidden",
                "&:before": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background: "linear-gradient(90deg, var(--kmfri-primary-soft, rgba(10,61,98,0.10)), transparent 46%, var(--kmfri-accent-soft, rgba(72,201,176,0.18)))",
                    opacity: 0.55,
                },
            }}
        >
            <Tabs
                value={value}
                onChange={(_, nextValue) => onChange(nextValue)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                    position: "relative",
                    zIndex: 1,
                    minHeight: 44,
                    "& .MuiTabs-indicator": { height: 0 },
                    "& .MuiTabs-flexContainer": {
                        gap: 0.7,
                    },
                    "& .MuiTab-root": {
                        minHeight: 48,
                        flex: { md: 1 },
                        borderRadius: "8px",
                        px: { xs: 1.3, sm: 1.8 },
                        color: C.muted,
                        border: "1px solid transparent",
                        bgcolor: "rgba(255,255,255,0.72)",
                        textTransform: "none",
                        fontSize: "0.86rem",
                        fontWeight: 900,
                        transition: "background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
                        "&:hover": {
                            color: themeVars.secondary,
                            bgcolor: "rgba(255,255,255,0.94)",
                            borderColor: themeVars.secondarySoft,
                        },
                    },
                    "& .MuiTab-root.Mui-selected": {
                        color: "#FFFFFF",
                        bgcolor: themeVars.secondary,
                        background: themeVars.gradient,
                        borderColor: "rgba(255,255,255,0.22)",
                        boxShadow: "0 12px 26px var(--kmfri-secondary-soft, rgba(0,91,150,0.24))",
                    },
                }}
            >
                {USER_GROUP_TABS.map((tab) => {
                    const selected = value === tab.value;
                    const TabIcon = tab.icon;
                    return (
                        <Tab
                            key={tab.value}
                            value={tab.value}
                            label={
                                <Stack direction="row" spacing={1.1} alignItems="center" sx={{ minWidth: 0 }}>
                                    <Box
                                        sx={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: "8px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                            bgcolor: selected ? "rgba(255,255,255,0.18)" : themeVars.primarySoft,
                                            color: selected ? "#FFFFFF" : themeVars.primary,
                                        }}
                                    >
                                        <TabIcon sx={{ fontSize: 17 }} />
                                    </Box>
                                    <Typography
                                        component="span"
                                        color={selected ? "#FFFFFF" : themeVars.primary}
                                        sx={{
                                            minWidth: 0,
                                            fontSize: "inherit",
                                            fontWeight: "inherit",
                                            lineHeight: 1,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {tab.label}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={counts[tab.value] || 0}
                                        sx={{
                                            height: 22,
                                            minWidth: 30,
                                            borderRadius: "8px",
                                            bgcolor: selected ? "rgba(255,255,255,0.22)" : themeVars.accentSoft,
                                            color: selected ? "#FFFFFF" : themeVars.secondary,
                                            fontSize: 11,
                                            fontWeight: 900,
                                            border: selected ? "1px solid rgba(255,255,255,0.26)" : `1px solid ${themeVars.secondarySoft}`,
                                            "& .MuiChip-label": { px: 0.9 },
                                        }}
                                    />
                                </Stack>
                            }
                        />
                    );
                })}
            </Tabs>
        </Box>
    );
};

export const FilterBar = ({
    searchTerm, setSearchTerm,
    rankFilter, setRankFilter,
    roleFilter, setRoleFilter,
    statusFilter, setStatusFilter,
    departmentFilter, setDepartmentFilter,
    stationFilter, setStationFilter,
    totalCount, filteredCount,
    isStationScopedHr = false,
    currentStation = "",
    showRankFilter = false,
    showRoleFilter = false,
    showDepartmentFilter = true,
    showStationFilter = true,
}) => {
    const visibleFilterCount = 1
        + (showRankFilter ? 1 : 0)
        + (showRoleFilter ? 1 : 0)
        + (showDepartmentFilter ? 1 : 0)
        + (showStationFilter ? 1 : 0);
    const searchTerms = [
        "ID",
        "name",
        "email",
        showRoleFilter ? "role" : null,
        showDepartmentFilter ? "department" : null,
        showStationFilter ? "station" : null,
    ].filter(Boolean);
    const fieldLabelSx = {
        mb: 0.7,
        fontSize: 11,
        fontWeight: 900,
        color: C.muted,
        letterSpacing: 0,
    };

    return (
        <Box
            sx={{
                p: { xs: 1.5, md: 2 },
                borderRadius: "8px",
                background: "#FFFFFF",
                border: `1px solid ${C.line}`,
                boxShadow: C.cardShadow,
            }}
        >

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(190px, 1fr))",
                        lg: `minmax(280px, 1.65fr) repeat(${visibleFilterCount}, minmax(128px, 0.75fr))`,
                    },
                    gap: 1,
                    alignItems: "end",
                }}
            >

                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ ml: 2, fontSize: 11, color: C.muted, fontWeight: 700 }}>
                        Showing {filteredCount} of {totalCount} users
                    </Typography>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder={`Search ${searchTerms.join(", ")}`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchRounded sx={{ fontSize: 18, color: C.muted }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                height: 42,
                                color: C.ink,
                                fontSize: "0.86rem",
                                fontWeight: 700,
                                borderRadius: "8px",
                                background: "#FFFFFF",
                                "& fieldset": { borderColor: C.line },
                                "&:hover fieldset": { borderColor: "rgba(17,103,232,0.32)" },
                                "&.Mui-focused fieldset": { borderColor: C.brightBlue },
                            },
                            "& input::placeholder": { color: C.muted, opacity: 0.72 },
                        }}
                    />
                </Box>

                {showRankFilter && (
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={fieldLabelSx}>Rank</Typography>
                        <FormControl fullWidth size="small" >
                            <Select value={rankFilter} onChange={(e) => setRankFilter(e.target.value)} displayEmpty renderValue={(selected) => selected || "All"} sx={selectSx} MenuProps={menuProps}>
                                <MenuItem value="">All</MenuItem>
                                {RANK_OPTIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>
                )}

                {showRoleFilter && (
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={fieldLabelSx}>Role</Typography>
                        <FormControl size="small" fullWidth >
                            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} displayEmpty renderValue={(selected) => selected || "All"} sx={selectSx} MenuProps={menuProps}>
                                <MenuItem value="">All</MenuItem>
                                {ROLE_OPTIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>
                )}

                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={fieldLabelSx}>Status</Typography>
                    <FormControl fullWidth size="small" >
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            displayEmpty
                            renderValue={(selected) => selected === "active" ? "Active" : selected === "inactive" ? "Inactive" : selected === "clockoutside" ? "Clock Outside" : "All"}
                            sx={selectSx}
                            MenuProps={menuProps}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="inactive">Inactive</MenuItem>
                            <MenuItem value="clockoutside">Clock Outside</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {showDepartmentFilter && (
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={fieldLabelSx}>Department</Typography>
                        <FormControl fullWidth size="small" >
                            <Select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} displayEmpty renderValue={(selected) => selected || "All"} sx={selectSx} MenuProps={menuProps}>
                                <MenuItem value="">All</MenuItem>
                                {availableDepartments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>
                )}

                {showStationFilter && (
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={fieldLabelSx}>{isStationScopedHr ? "Station Scope" : "Station"}</Typography>
                        {isStationScopedHr ? (
                            <Box
                                sx={{
                                    minHeight: 42,
                                    display: "flex",
                                    alignItems: "center",
                                    px: 1.4,
                                    borderRadius: "8px",
                                    bgcolor: "rgba(17,103,232,0.06)",
                                    border: `1px solid rgba(17,103,232,0.18)`,
                                    color: C.ink,
                                    fontSize: "0.82rem",
                                    fontWeight: 900,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {currentStation || "Assigned station"}
                            </Box>
                        ) : (
                            <FormControl fullWidth size="small">
                                <Select value={stationFilter} onChange={(e) => setStationFilter(e.target.value)} displayEmpty renderValue={(selected) => selected || "All"} sx={selectSx} MenuProps={menuProps}>
                                    <MenuItem value="">All</MenuItem>
                                    {AvailableStations.map((station) => (
                                        <MenuItem key={station.name} value={station.name}>{station.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>
                )}
            </Box>

        </Box>
    );
};

export const buildUserSummary = (users = []) => {
    const activeUsers = users.filter((user) => user.isAccountActive).length;
    const employees = users.filter((user) => String(user.role || "").toLowerCase() === "employee").length;
    const interns = users.filter((user) => ["intern", "attachee"].includes(String(user.role || "").toLowerCase())).length;

    return {
        total: users.length,
        active: activeUsers,
        employees,
        interns,
    };
};

export const UserManagementHeader = ({ title = "User Management", subtitle = "Manage system users, roles and access across the institute.", actionLabel = "Clear Filters", onAction, hideAction = false }) => (
    <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2.5 }}
    >
        <Stack direction="row" spacing={2} alignItems="center">
            <Box
                sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "8px",
                    bgcolor: C.brightBlue,
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 12px 24px rgba(17,103,232,0.28)",
                    flexShrink: 0,
                }}
            >
                <SupervisorAccountRounded />
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: { xs: 24, md: 28 }, fontWeight: 950, color: C.ink, lineHeight: 1.1, letterSpacing: 0 }}>
                    {title}
                </Typography>
                <Typography sx={{ mt: 0.6, fontSize: 13, color: C.muted, fontWeight: 700 }}>
                    {subtitle}
                </Typography>
            </Box>
        </Stack>

        {!hideAction && (
            <Button
                variant="contained"
                startIcon={<RestartAltRounded />}
                onClick={onAction}
                sx={{
                    alignSelf: { xs: "flex-start", md: "center" },
                    height: 48,
                    px: 2.6,
                    borderRadius: "8px",
                    bgcolor: C.brightBlue,
                    textTransform: "none",
                    fontWeight: 900,
                    boxShadow: "0 12px 24px rgba(17,103,232,0.24)",
                    "&:hover": { bgcolor: "#0E55C4" },
                }}
            >
                {actionLabel}
            </Button>
        )}
    </Stack>
);

const SummaryCard = ({ title, value, subtitle, icon, color }) => (
    <Card
        elevation={0}
        sx={{
            height: "100%",
            borderRadius: "8px",
            border: `1px solid ${C.line}`,
            boxShadow: C.cardShadow,
            bgcolor: "#FFFFFF",
        }}
    >
        <CardContent sx={{ p: { xs: 1.8, md: 2.3 } }}>
            <Stack direction="row" spacing={2} alignItems="center">
                <Box
                    sx={{
                        width: 58,
                        height: 58,
                        borderRadius: "8px",
                        bgcolor: `${color}12`,
                        color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 25, fontWeight: 950, lineHeight: 1, color: C.ink }}>
                        {value}
                    </Typography>
                    <Typography sx={{ mt: 0.7, fontSize: 13, fontWeight: 900, color: C.ink }}>
                        {title}
                    </Typography>
                    <Typography sx={{ mt: 0.3, fontSize: 11.5, fontWeight: 700, color: C.muted }}>
                        {subtitle}
                    </Typography>
                </Box>
            </Stack>
        </CardContent>
    </Card>
);

export const UserSummaryCards = ({ users }) => {
    const summary = buildUserSummary(users);
    const cards = [
        { title: "Total Users", value: summary.total, subtitle: "All registered users", icon: <GroupsRounded />, color: C.brightBlue },
        { title: "Active Users", value: summary.active, subtitle: "Currently active", icon: <CheckCircleRounded />, color: "#16A34A" },
        { title: "Employees", value: summary.employees, subtitle: "Staff members", icon: <BadgeRounded />, color: "#F97316" },
        { title: "Interns", value: summary.interns, subtitle: "Interns & Attache", icon: <SchoolRounded />, color: "#8B5CF6" },
    ];

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(220px, 1fr))",
                    lg: "repeat(4, minmax(0, 1fr))",
                },
                gap: 2,
                mb: 2.5,
            }}
        >
            {cards.map((card) => (
                <SummaryCard key={card.title} {...card} />
            ))}
        </Box>
    );
};

export const UserManagementShell = ({ children }) => (
    <Box
        sx={{
            minHeight: "100%",
            p: 1.5,
            bgcolor: C.pageBg,
        }}
    >
        {children}
    </Box>
);

/* ─────────────────────────────────────────────
   ROOT COMPONENT
───────────────────────────────────────────── */
const UserManagementContent = ({ readOnly = false }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const currentUser = useSelector((state) => state.currentUser.user);
    const currentUserRank = String(currentUser?.rank || "").toLowerCase();
    const isStationScopedHr =
        currentUserRank === "hr" && normalizeStationName(currentUser?.station) !== "mombasa centre";
    const showRankControls = currentUserRank === "superadmin";
    const showRoleControls = ["hr", "superadmin"].includes(currentUserRank);
    const showDepartmentFilter = true;
    const showStationFilter = !isStationScopedHr;

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [launchLoading, setLaunchLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const [rankFilter, setRankFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [activeUserGroup, setActiveUserGroup] = useState("employee");
    const [statusFilter, setStatusFilter] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [stationFilter, setStationFilter] = useState("");
    const [supervisors, setSupervisors] = useState()

    //pagination states
    const [page, setPage] = useState(0);

    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [selectedUser, setSelectedUser] = useState(null);

    const [dialogOpen, setDialogOpen] = useState(false);

    const handlePageChange = (event, newPage) => {

        setPage(newPage);

    };


    const refreshUsers = async (selectedId = null) => {
        const [usersData, supervisorsData] = await Promise.all([
            getAllUsers(),
            getAllSupervisors(),
        ]);

        setUsers(usersData);
        setSupervisors(supervisorsData);

        if (selectedId) {
            const updatedUser = usersData.find(u => u._id === selectedId);

            if (updatedUser) {
                setSelectedUser(updatedUser);
            }
        }
    };



    const handleRowsPerPageChange = (event) => {

        setRowsPerPage(parseInt(event.target.value, 10));

        setPage(0);

    };

    // dispatch and redux activities
    const dispatch = useDispatch();

    useEffect(() => {
        let active = true;

        const loadInitialData = async () => {
            try {
                setLoading(true);
                setLaunchLoading(true);
                const [usersData, supervisorsData] = await Promise.all([
                    getAllUsers(),
                    getAllSupervisors(),
                ]);
                if (!active) return;
                setUsers(usersData);
                setSupervisors(supervisorsData);
            } catch (err) {
                if (!active) return;
                console.error(err);
                alert("Failed to fetch users: " + (err.response?.data?.message || err.message || "Unknown error"));
            } finally {
                if (active) {
                    setLoading(false);
                    setLaunchLoading(false);
                }
            }
        };

        loadInitialData();
        return () => { active = false; };
    }, []);





    const groupedUsers = useMemo(
        () => users.filter((user) => getUserGroupValue(user) === activeUserGroup),
        [users, activeUserGroup]
    );

    const activeGroupMeta = getUserGroupMeta(activeUserGroup);

    const handleUserGroupChange = (nextGroup) => {
        setActiveUserGroup(nextGroup);
        setRoleFilter("");
        setPage(0);
    };

    const filteredUsers = useMemo(() => {
        const search = deferredSearchTerm.toLowerCase();
        return groupedUsers.sort((a, b) => a.employeeId.localeCompare(b.employeeId)).filter((user) => {
            const matchesSearch =
                String(user.name || "").toLowerCase().includes(search) ||
                String(user.email || "").toLowerCase().includes(search) ||
                String(user.employeeId || "").toLowerCase().includes(search) ||
                String(user.department || "").toLowerCase().includes(search) ||
                String(user.station || "").toLowerCase().includes(search) ||
                String(user.supervisor || "").toLowerCase().includes(search) ||
                (showRoleControls && String(user.role || "").toLowerCase().includes(search)) ||
                (showRankControls && String(user.rank || "").toLowerCase().includes(search));

            return (
                matchesSearch &&
                (!showRankControls || !rankFilter || user.rank === rankFilter) &&
                (!showDepartmentFilter || !departmentFilter || user.department === departmentFilter) &&
                (!showStationFilter || !stationFilter || user.station === stationFilter) &&
                (statusFilter === ""
                    ? true
                    : statusFilter === "active"
                        ? user.isAccountActive
                        : statusFilter === "clockoutside" ? user.canClockOutside : !user.isAccountActive)
            );
        });
    }, [groupedUsers, deferredSearchTerm, rankFilter, statusFilter, departmentFilter, stationFilter, showDepartmentFilter, showRankControls, showRoleControls, showStationFilter]);

    const handleToggleActive = async (id) => {
        try {
            setLoading(true);
            setUpdatingId(id);

            await toggleUserActive(id);

            await refreshUsers(id);

            alert("User status updated successfully");

        } catch (e) {
            alert(e);
        } finally {
            setUpdatingId(null);
            setLoading(false);
        }
    };

    const handleRankChange = async (id, rank) => {
        if (!showRankControls) return;
        try {
            setLoading(true);
            setUpdatingId(id);

            await updateUserRank(id, rank);

            await refreshUsers(id);

            alert("User rank updated successfully");

        } catch (e) {
            alert(e);
        } finally {
            setUpdatingId(null);
            setLoading(false);
        }
    };

    const handleRoleChange = async (id, role) => {
        if (!showRoleControls) return;
        try {
            setLoading(true);
            setUpdatingId(id);

            await updateUserRole(id, role);

            await refreshUsers(id);

            alert("User role updated successfully");

        } catch (e) {
            alert(e);
        } finally {
            setUpdatingId(null);
            setLoading(false);
        }
    };

    const handleDepartmentSave = async (id, dept) => {
        try {
            setLoading(true);
            setUpdatingId(id);

            await updateUserDepartment(id, dept);

            await refreshUsers(id);

            alert("User department updated successfully");

        } catch (e) {
            alert(e);
        } finally {
            setUpdatingId(null);
            setLoading(false);
        }
    };

    const handleSupervisorChange = async (id, supervisor) => {
        try {
            setLoading(true);
            setUpdatingId(id);

            await updateUserSupervisor(id, supervisor);

            await refreshUsers(id);

            alert("User supervisor updated successfully");

        } catch (e) {
            alert(e);
        } finally {
            setUpdatingId(null);
            setLoading(false);
        }
    };

    const handleStationSave = async (id, station) => {
        try {
            setLoading(true);
            setUpdatingId(id);

            await updateUserStation(id, station === "none" ? null : station);

            await refreshUsers(id);

            alert("User station updated successfully");

        } catch (e) {
            alert(e);
        } finally {
            setUpdatingId(null);
            setLoading(false);
        }
    };

    const handleOnLeaveChange = async (id, value) => {
        try {
            setLoading(true);
            setUpdatingId(id);

            await updateUserOnLeave(id, value === "yes");

            const updatedUser = await getUserProfile();
            dispatch(updateUserCurrentUserRedux(updatedUser));

            await refreshUsers(id);

            alert("User leave status updated successfully");

        } catch (e) {
            alert(e);
        } finally {
            setUpdatingId(null);
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id) => {
        try {
            setLoading(true);
            setUpdatingId(id);

            await deleteUser(id);

            await refreshUsers();

            setDialogOpen(false);
            setSelectedUser(null);

            alert("User deleted successfully");

        } catch (e) {
            alert(e);
        } finally {
            setUpdatingId(null);
            setLoading(false);
        }
    };

    const handleResetBiometrics = async (id) => {
        try {
            setLoading(true);
            setUpdatingId(id);

            await resetUserBiometrics(id);

            await refreshUsers(id);

            const updatedUser = await getUserProfile();

            dispatch(updateUserCurrentUserRedux(updatedUser));

            alert("User biometrics reset successfully");

        } catch (e) {
            alert(e);
        } finally {
            setUpdatingId(null);
            setLoading(false);
        }
    };

    const handleResetPassword = async (id) => {
        try {
            setLoading(true);
            setUpdatingId(id);

            const resetResponse = await resetUserPassword(id);

            await refreshUsers(id);

            alert(resetResponse?.message || "User password reset successfully ask the user to check their SMS.");

        } catch (e) {
            alert(e);
        } finally {
            setUpdatingId(null);
            setLoading(false);
        }
    }

    const clearAllFilters = () => {
        setSearchTerm("");
        setRankFilter("");
        setRoleFilter("");
        setActiveUserGroup("employee");
        setStatusFilter("");
        setDepartmentFilter("");
        setStationFilter("");
        setPage(0);
    };



    if (launchLoading) {
        return (
            <UserManagementShell>
                <Stack alignItems="center" justifyContent="center" height="60vh" spacing={2}>
                    <CircularProgress size={38} thickness={3} sx={{ color: C.brightBlue }} />
                    <Typography sx={{
                        color: C.ink,
                        fontSize: "0.78rem",
                        letterSpacing: 0,
                        textTransform: "uppercase",
                        fontWeight: 900,
                    }}>
                        refreshing ...
                    </Typography>
                </Stack>
            </UserManagementShell>
        );
    }




    return (
        <UserManagementShell>
            <Stack spacing={2}>
                <UserManagementHeader onAction={clearAllFilters} />
                <UserSummaryCards users={users} />
                <UserGroupTabs value={activeUserGroup} onChange={handleUserGroupChange} users={users} />
                {/* Filter Bar */}
                <Motion.div style={{ willChange: 'transform, opacity' }}
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28 }}>
                    <FilterBar
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        rankFilter={rankFilter} setRankFilter={setRankFilter}
                        roleFilter={roleFilter} setRoleFilter={setRoleFilter}
                        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                        departmentFilter={departmentFilter} setDepartmentFilter={setDepartmentFilter}
                        stationFilter={stationFilter} setStationFilter={setStationFilter}
                        totalCount={groupedUsers.length}
                        filteredCount={filteredUsers.length}
                        isMobile={isMobile}
                        isStationScopedHr={isStationScopedHr}
                        currentStation={currentUser?.station || ""}
                        showRankFilter={showRankControls}
                        showRoleFilter={false}
                        showDepartmentFilter={showDepartmentFilter}
                        showStationFilter={showStationFilter}
                    />
                </Motion.div>

                {/* Empty state */}
                {filteredUsers.length === 0 && (
                    <Motion.div style={{ willChange: 'transform, opacity' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Box sx={{ p: 5, textAlign: "center", borderRadius: "8px", bgcolor: "#FFFFFF", border: `1px solid ${C.line}`, boxShadow: C.cardShadow }}>
                            <Typography sx={{ color: C.muted, fontWeight: 800, fontSize: "0.9rem" }}>
                                No users match your current filters
                            </Typography>
                        </Box>
                    </Motion.div>
                )}



                <UserTable

                    users={filteredUsers}

                    page={page}

                    rowsPerPage={rowsPerPage}

                    onPageChange={handlePageChange}

                    onRowsPerPageChange={handleRowsPerPageChange}

                    onViewUser={(user) => {

                        setSelectedUser(user);

                        setDialogOpen(true);

                    }}
                    showRoleColumn={showRoleControls}
                    idColumnLabel={activeGroupMeta.idColumnLabel}

                />

                <UserDetailsDialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}

                    user={selectedUser}

                    supervisors={supervisors}

                    updatingId={updatingId}

                    loading={loading}

                    readOnly={readOnly}

                    onRankChange={handleRankChange}

                    onRoleChange={handleRoleChange}

                    onDepartmentSave={handleDepartmentSave}

                    onSupervisorChange={handleSupervisorChange}

                    onStationSave={handleStationSave}

                    onOnLeaveChange={handleOnLeaveChange}

                    onToggleActive={handleToggleActive}

                    onDeleteUser={handleDeleteUser}
                    onResetPassword={handleResetPassword}

                    onResetBiometrics={handleResetBiometrics}
                />



            </Stack>
        </UserManagementShell>
    );
};

export default UserManagementContent;
