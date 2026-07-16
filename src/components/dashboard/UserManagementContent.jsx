import { SupervisorAccountRounded } from "@mui/icons-material";
import {
    Box,
    Button,
    CircularProgress,
    FormControl,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
    useTheme
} from "@mui/material";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateUserCurrentUserRedux } from "../../redux/CurrentUser";
import {
    deleteUser,
    getAllSupervisors,
    getAllUsers,
    resetUserBiometrics,
    toggleUserActive,
    updateUserDepartment,
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
const glassCard = (elevated = false) => ({
    background: C.glassBg,
    borderRadius: "16px",
    willChange: 'transform',
    boxShadow: elevated
        ? "0 12px 36px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.1)"
        : "0 6px 22px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.07)",
});

const selectSx = {
    color: C.textPrimary,
    willChange: 'transform',
    fontSize: "0.83rem",
    borderRadius: "10px",
    background: "rgba(0,91,150,0.32)",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,229,255,0.22)" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: C.aquaVibrant },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: C.seafoamGreen },
    "& .MuiSvgIcon-root": { color: C.cyanFresh },
};

const menuProps = {
    PaperProps: {
        sx: {
            background: "#05253D",
            border: `1px solid ${C.glassBorder}`,
            borderRadius: "12px",
            willChange: 'transform',
            color: C.textPrimary,
            boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
            "& .MuiMenuItem-root": { fontSize: "0.83rem", py: 0.8 },
            "& .MuiMenuItem-root:hover": { background: "rgba(0,229,255,0.1)", color: C.aquaVibrant },
            "& .MuiMenuItem-root.Mui-selected": { background: "rgba(72,201,176,0.14)", color: C.seafoamGreen },
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




export const FilterBar = ({
    searchTerm, setSearchTerm,
    rankFilter, setRankFilter,
    roleFilter, setRoleFilter,
    statusFilter, setStatusFilter,
    departmentFilter, setDepartmentFilter,
    stationFilter, setStationFilter,
    totalCount, filteredCount,
}) => {
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'));   // <600px
    const isMedium = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600-900px

    const hasFilters = searchTerm || rankFilter || roleFilter || statusFilter || departmentFilter;

    // Responsive stat pills – reduce size and text on small screens
    const statPills = [
        { label: "Total", value: totalCount, color: C.cyanFresh },
        { label: "Shown", value: filteredCount, color: C.seafoamGreen },
    ];

    return (
        <Box sx={{ ...glassCard(true), p: { xs: 1.5, sm: 2, md: 2.5 } }}>
            {/* Header: title + stat pills */}
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                justifyContent="space-between"
                spacing={{ xs: 1.5, sm: 0 }}
                mb={2}
            >
                {/* Left: Icon + title + count message */}
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <SupervisorAccountRounded />
                    <Box>
                        <Typography sx={{
                            fontWeight: 800,
                            fontSize: { xs: '0.85rem', sm: '0.95rem' },
                            color: C.textPrimary,
                            fontFamily: "'Exo 2', sans-serif",
                            lineHeight: 1.25,
                        }}>
                            User Management
                        </Typography>
                        <Typography sx={{
                            fontSize: { xs: '0.65rem', sm: '0.72rem' },
                            color: C.textSecondary,
                            fontWeight: 'bold',
                        }}>
                            Showing{" "}
                            <Box component="span" sx={{ color: C.softGray, fontWeight: 800 }}>
                                {filteredCount}
                            </Box>{" "}
                            of {totalCount} users
                        </Typography>
                    </Box>
                </Stack>

                {/* Right: Stat pills */}
                <Stack
                    direction="row"
                    spacing={{ xs: 0.5, sm: 1 }}
                    sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
                >
                    {statPills.map(({ label, value, color }) => (
                        <Box key={label} sx={{
                            px: { xs: 1, sm: 1.3 },
                            py: { xs: 0.3, sm: 0.5 },
                            borderRadius: "8px",
                            background: `${color}14`,
                            border: `1px solid ${color}38`,
                            textAlign: "center",
                            flex: { xs: 1, sm: '0 1 auto' },
                            minWidth: { xs: 40, sm: 46 },
                        }}>
                            <Typography sx={{
                                fontSize: { xs: '0.9rem', sm: '1rem' },
                                fontWeight: 900,
                                color: C.cloudWhite,
                                lineHeight: 1,
                                fontFamily: "'Exo 2', sans-serif",
                            }}>
                                {value}
                            </Typography>
                            <Typography sx={{
                                fontSize: { xs: '0.5rem', sm: '0.57rem' },
                                fontWeight: 'bold',
                                color: C.softGray,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                            }}>
                                {label}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            </Stack>

            {/* Filters row – wraps naturally, becomes column on very small screens */}
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1, sm: 1.5 }}
                flexWrap="wrap"
                useFlexGap
                alignItems={{ xs: 'stretch', sm: 'flex-end' }}
            >
                {/* Search */}
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 200px' }, minWidth: { xs: '100%', sm: 160 } }}>
                    <Typography variant="caption" ml={2} color={C.softGray}>Search</Typography>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="ID, Name, email, department, station…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                color: C.textPrimary,
                                fontSize: { xs: '0.75rem', sm: '0.83rem' },
                                borderRadius: "10px",
                                background: "rgba(0,91,150,0.32)",
                                "& fieldset": { borderColor: "rgba(0,229,255,0.22)" },
                                "&:hover fieldset": { borderColor: C.aquaVibrant },
                                "&.Mui-focused fieldset": { borderColor: C.seafoamGreen },
                            },
                            "& input::placeholder": { color: C.textMuted, opacity: 1 },
                        }}
                    />
                </Box>

                {/* Rank */}
                <Box sx={{ flex: { xs: '1 1 48%', sm: '0 1 128px' }, minWidth: { xs: '48%', sm: 128 } }}>
                    <Typography variant="caption" ml={2} color={C.softGray}>Rank</Typography>
                    <FormControl size="small" fullWidth>
                        <Select value={rankFilter} onChange={(e) => setRankFilter(e.target.value)} displayEmpty sx={selectSx} MenuProps={menuProps}>
                            <MenuItem value="" sx={{ color: C.textMuted }}>All</MenuItem>
                            {RANK_OPTIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>

                {/* Role */}
                <Box sx={{ flex: { xs: '1 1 48%', sm: '0 1 148px' }, minWidth: { xs: '48%', sm: 148 } }}>
                    <Typography variant="caption" ml={2} color={C.softGray}>Role</Typography>
                    <FormControl size="small" fullWidth>
                        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} displayEmpty sx={selectSx} MenuProps={menuProps}>
                            <MenuItem value="" sx={{ color: C.textMuted }}>All</MenuItem>
                            {ROLE_OPTIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>

                {/* Status */}
                <Box sx={{ flex: { xs: '1 1 48%', sm: '0 1 128px' }, minWidth: { xs: '48%', sm: 128 } }}>
                    <Typography variant="caption" ml={2} color={C.softGray}>Status</Typography>
                    <FormControl size="small" fullWidth>
                        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} displayEmpty sx={selectSx} MenuProps={menuProps}>
                            <MenuItem value="" sx={{ color: C.textMuted }}>All</MenuItem>
                            <MenuItem value="active" sx={{ color: C.seafoamGreen }}>● Active</MenuItem>
                            <MenuItem value="inactive" sx={{ color: C.coralSunset }}>● Inactive</MenuItem>
                            <MenuItem value="clockoutside" sx={{ color: C.coralSunset }}>● ClockOutside</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* Department */}
                <Box sx={{ flex: { xs: '1 1 48%', sm: '0 1 150px' }, minWidth: { xs: '48%', sm: 150 } }}>
                    <Typography variant="caption" ml={2} color={C.softGray}>Department</Typography>
                    <FormControl size="small" fullWidth>
                        <Select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} displayEmpty sx={selectSx} MenuProps={menuProps}>
                            <MenuItem value="" sx={{ color: C.textMuted }}>All</MenuItem>
                            {availableDepartments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>

                {/* (Optional) Station – uncomment if needed */}
                {/* <Box sx={{ flex: { xs: '1 1 48%', sm: '0 1 150px' }, minWidth: { xs: '48%', sm: 150 } }}>
          <Typography variant="caption" ml={2} color={C.softGray}>Station</Typography>
          <FormControl size="small" fullWidth>
            <Select value={stationFilter} onChange={(e) => setStationFilter(e.target.value)} displayEmpty sx={selectSx} MenuProps={menuProps}>
              <MenuItem value="" sx={{ color: C.textMuted }}>All</MenuItem>
              {AvailableStations.map((d) => <MenuItem key={d.name} value={d}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box> */}

                {/* Clear button – stays at the end, full width on small screens */}
                <Box sx={{
                    flex: { xs: '1 1 100%', sm: '0 0 auto' },
                    minWidth: { xs: '100%', sm: 82 },
                    mt: { xs: 0.5, sm: 0 },
                }}>
                    <Button
                        size="small"
                        variant="outlined"
                        disabled={!hasFilters}
                        onClick={() => {
                            setSearchTerm("");
                            setRankFilter("");
                            setRoleFilter("");
                            setStatusFilter("");
                            setDepartmentFilter("");
                            // also reset stationFilter if used
                            // setStationFilter("");
                        }}
                        sx={{
                            height: 36,
                            width: { xs: '100%', sm: 'auto' },
                            px: 2,
                            borderRadius: "10px",
                            fontWeight: 700,
                            fontFamily: "'Exo 2', sans-serif",
                            fontSize: { xs: '0.7rem', sm: '0.72rem' },
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            borderColor: hasFilters ? C.aquaVibrant : "rgba(0,229,255,0.18)",
                            color: hasFilters ? C.aquaVibrant : C.textMuted,
                            "&:hover": {
                                background: "rgba(0,229,255,0.08)",
                                borderColor: C.seafoamGreen,
                                color: C.seafoamGreen,
                            },
                            transition: "all 0.2s ease",
                        }}
                    >
                        Clear
                    </Button>
                </Box>
            </Stack>
        </Box>
    );
};

/* ─────────────────────────────────────────────
   ROOT COMPONENT
───────────────────────────────────────────── */
const UserManagementContent = ({ readOnly = false }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [launchLoading, setLaunchLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [rankFilter, setRankFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
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

    //get current user from the redux
    const currentUser = useSelector((state) => state?.currentUser);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setLaunchLoading(true);
            const data = await getAllUsers();
            setUsers(data);
        } catch (err) {
            console.error(err);
            alert("Failed to fetch users: " + (err.response?.data?.message || err.message || "Unknown error"));
        } finally {
            setLoading(false);
            setLaunchLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);



    // fetch supervisors and make the updates
    const fetchSupervisors = async () => {
        try {
            const data = await getAllSupervisors();
            setSupervisors(data);
        } catch (err) {
            console.error(err);
            alert("Failed to fetch supervisors: " + (err.response?.data?.message || err.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSupervisors(); }, []);





    const filteredUsers = useMemo(() => {
        const search = searchTerm.toLowerCase();
        return users.filter((user) => {
            const matchesSearch =
                user.name?.toLowerCase().includes(search) ||
                user.email?.toLowerCase().includes(search) ||
                user.employeeId?.toLowerCase().includes(search) ||
                user.staffNo?.toLowerCase().includes(search) ||
                user.department?.toLowerCase().includes(search) ||
                user.station?.toLowerCase().includes(search) ||
                user.supervisor?.toLowerCase().includes(search);

            return (
                matchesSearch &&
                (!rankFilter || user.rank === rankFilter) &&
                (!roleFilter || user.role === roleFilter) &&
                (!departmentFilter || user.department === departmentFilter) &&
                (statusFilter === ""
                    ? true
                    : statusFilter === "active"
                        ? user.isAccountActive
                        : statusFilter === "clockoutside" ? user.canClockOutside : !user.isAccountActive)
            );
        });
    }, [users, searchTerm, rankFilter, roleFilter, statusFilter, departmentFilter, stationFilter]);

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



    if (launchLoading) {
        return (
            <Stack alignItems="center" justifyContent="center" height="60vh" spacing={2}>
                <CircularProgress size={38} thickness={3} sx={{ color: C.deepNavy }} />
                <Typography sx={{
                    color: C.deepNavy,
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: "0.78rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                }}>
                    refreshing ...
                </Typography>
            </Stack>
        );
    }




    return (
        <>
            <Stack spacing={2}>
                {/* Filter Bar */}
                <motion.div style={{ willChange: 'transform, opacity' }}
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28 }}>
                    <FilterBar
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        rankFilter={rankFilter} setRankFilter={setRankFilter}
                        roleFilter={roleFilter} setRoleFilter={setRoleFilter}
                        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                        departmentFilter={departmentFilter} setDepartmentFilter={setDepartmentFilter}
                        stationFilter={stationFilter} setStationFilter={setStationFilter}
                        totalCount={users.length}
                        filteredCount={filteredUsers.length}
                        isMobile={isMobile}
                    />
                </motion.div>

                {/* Empty state */}
                {filteredUsers.length === 0 && (
                    <motion.div style={{ willChange: 'transform, opacity' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Box sx={{ ...glassCard(), p: 5, textAlign: "center" }}>
                            <Typography sx={{ fontSize: "2rem", mb: 1 }}>🌊</Typography>
                            <Typography sx={{ color: C.textSecondary, fontFamily: "'Exo 2', sans-serif", fontSize: "0.9rem" }}>
                                No users match your current filters
                            </Typography>
                        </Box>
                    </motion.div>
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

                    onToggleActive={handleToggleActive}

                    onDeleteUser={handleDeleteUser}

                    onResetBiometrics={handleResetBiometrics}
                />



            </Stack>
        </>
    );
};

export default UserManagementContent;