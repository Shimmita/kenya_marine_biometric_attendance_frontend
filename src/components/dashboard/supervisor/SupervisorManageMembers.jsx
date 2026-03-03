
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
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
    getAllSupervisors,
    getAllUsers,
    getAllUsersDepartment,
    toggleUserActive,
    updateUserDepartment,
    updateUserRank,
    updateUserRole,
    updateUserStation,
    updateUserSupervisor,
} from "../../../service/UserManagement";

import coreDataDetails from "../../CoreDataDetails";
import UserCard from "../../util/UserCard";
import UserCardDepart from "../../util/UserCardDepart";

/* ─────────────────────────────────────────────
   UPDATED COLOR PALETTE
───────────────────────────────────────────── */
const C = {
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
    supervisor: C.seafoamGreen,
    ceo: C.coralSunset,
    user: C.cyanFresh,
};

const ROLES = ["employee", "intern", "attachee", "employee-contract"];



/* ─────────────────────────────────────────────
   FILTER / SEARCH BAR
───────────────────────────────────────────── */
const FilterBar = ({
    searchTerm, setSearchTerm,
    rankFilter, setRankFilter,
    roleFilter, setRoleFilter,
    statusFilter, setStatusFilter,
    departmentFilter, setDepartmentFilter,
    totalCount, filteredCount,
    isMobile,
}) => {
    const hasFilters = searchTerm || rankFilter || roleFilter || statusFilter || departmentFilter;

    return (
        <Box sx={{ ...glassCard(true), p: { xs: 2, md: 2.5 } }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <SupervisorAccountRounded />
                    <Box ml={2}>
                        <Typography sx={{
                            fontWeight: 800, fontSize: "0.95rem",
                            color: C.textPrimary,
                            fontFamily: "'Exo 2', sans-serif",
                            lineHeight: 1.25,
                        }}>
                            User Management
                        </Typography>
                        <Typography sx={{ fontSize: "0.72rem", color: C.textSecondary, fontWeight: 'bold' }}>
                            Showing{" "}
                            <Box component="span" sx={{ color: C.softGray, fontWeight: 800 }}>
                                {filteredCount}
                            </Box>{" "}
                            of {totalCount} users
                        </Typography>
                    </Box>
                </Stack>

                {/* Stat pills */}
                <Stack direction="row" spacing={1}>
                    {[
                        { label: "Total", value: totalCount, color: C.cyanFresh },
                        { label: "Shown", value: filteredCount, color: C.seafoamGreen },
                    ].map(({ label, value, color }) => (
                        <Box key={label} sx={{
                            px: 1.3, py: 0.5,
                            borderRadius: "8px",
                            background: `${color}14`,
                            border: `1px solid ${color}38`,
                            textAlign: "center",
                            minWidth: 46,
                        }}>
                            <Typography sx={{ fontSize: "1rem", fontWeight: 900, color: C.cloudWhite, lineHeight: 1, fontFamily: "'Exo 2', sans-serif" }}>
                                {value}
                            </Typography>
                            <Typography sx={{ fontSize: "0.57rem", fontWeight: 'bold', color: C.softGray, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                {label}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            </Stack>

            {/* Filters row */}
            <Stack
                direction={isMobile ? "column" : "row"}
                spacing={1.5}
                flexWrap="wrap"
                useFlexGap
                alignItems={isMobile ? "stretch" : "flex-end"}
            >
                {/* Search */}
                <Box sx={{ flex: "1 1 200px", minWidth: 150 }}>
                    <Typography variant="caption" ml={2} color={C.softGray}>Search</Typography>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Name, email, department, station…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                color: C.textPrimary,
                                willChange: 'transform',
                                fontSize: "0.83rem",
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

              
                {/* Role */}
                <Box sx={{ minWidth: 160 }}>
                    <Typography variant="caption" ml={2} color={C.softGray}>Role</Typography>
                    <FormControl size="small" fullWidth>
                        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} displayEmpty sx={selectSx} MenuProps={menuProps}>
                            <MenuItem value="" sx={{ color: C.textMuted }}>All</MenuItem>
                            {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>

                {/* Status */}
                <Box sx={{ minWidth: 160 }}>
                    <Typography variant="caption" ml={2} color={C.softGray}>Status</Typography>
                    <FormControl size="small" fullWidth>
                        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} displayEmpty sx={selectSx} MenuProps={menuProps}>
                            <MenuItem value="" sx={{ color: C.textMuted }}>All</MenuItem>
                            <MenuItem value="active" sx={{ color: C.seafoamGreen }}>● Active</MenuItem>
                            <MenuItem value="inactive" sx={{ color: C.coralSunset }}>● Inactive</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                

        

                {/* Clear */}
                <Box sx={{ minWidth: 82 }}>
                    <Button
                        size="small"
                        variant="outlined"
                        disabled={!hasFilters}
                        onClick={() => { setSearchTerm(""); setRankFilter(""); setRoleFilter(""); setStatusFilter(""); setDepartmentFilter(""); }}
                        sx={{
                            height: 36,
                            px: 2,
                            borderRadius: "10px",
                            fontWeight: 700,
                            fontFamily: "'Exo 2', sans-serif",
                            fontSize: "0.72rem",
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
const UserManagementContent = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [rankFilter, setRankFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [stationFilter, setStationFilter] = useState("");
    const [supervisors, setSupervisors] = useState()

    const fetchUsers = async () => {
        try {
            const data = await getAllUsersDepartment();
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSupervisors(); }, []);





    const filteredUsers = useMemo(() => {
        const search = searchTerm.toLowerCase();
        return users.filter((user) => {
            const matchesSearch = !search ||
                user.name.toLowerCase().includes(search) ||
                user.email.toLowerCase().includes(search) ||
                user.email.toLowerCase().includes(search) ||
                user.rank.toLowerCase().includes(search) ||
                user.role.toLowerCase().includes(search) ||
                (user.department || "").toLowerCase().includes(search) ||
                (user.supervisor || "none").toLowerCase().includes(search);

            return (
                matchesSearch &&
                (!rankFilter || user.rank === rankFilter) &&
                (!roleFilter || user.role === roleFilter) &&
                (!departmentFilter || user.department === departmentFilter) &&
                (statusFilter === ""
                    ? true
                    : statusFilter === "active"
                        ? user.isAccountActive
                        : !user.isAccountActive)
            );
        });
    }, [users, searchTerm, rankFilter, roleFilter, statusFilter, departmentFilter, stationFilter]);

    const handleToggleActive = async (id) => { try { setUpdatingId(id); await toggleUserActive(id); fetchUsers(); fetchSupervisors(); } catch (e) { alert(e); } finally { setUpdatingId(null); } };
    const handleRankChange = async (id, rank) => { try { setUpdatingId(id); await updateUserRank(id, rank); fetchUsers(); fetchSupervisors(); } catch (e) { alert(e); } finally { setUpdatingId(null); } };
    const handleRoleChange = async (id, role) => { try { setUpdatingId(id); await updateUserRole(id, role); fetchUsers(); fetchSupervisors(); } catch (e) { alert(e); } finally { setUpdatingId(null); } };
    const handleDepartmentSave = async (id, dept) => { try { setUpdatingId(id); await updateUserDepartment(id, dept); fetchUsers(); fetchSupervisors(); } catch (e) { alert(e); } finally { setUpdatingId(null); } };
    const handleSupervisorChange = async (id, supervisor) => { try { setUpdatingId(id); await updateUserSupervisor(id, supervisor); fetchUsers(); fetchSupervisors() } catch (e) { alert(e); } finally { setUpdatingId(null); } };
    const handleStationSave = async (id, station) => { try { setUpdatingId(id); await updateUserStation(id, station === "none" ? null : station); fetchUsers(); fetchSupervisors(); } catch (e) { alert(e); } finally { setUpdatingId(null); } };

    if (loading) {
        return (
            <Stack alignItems="center" justifyContent="center" height="60vh" spacing={2}>
                <CircularProgress size={38} thickness={3} sx={{ color: C.aquaVibrant }} />
                <Typography sx={{
                    color: C.textSecondary,
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: "0.78rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                }}>
                    Loading Users…
                </Typography>
            </Stack>
        );
    }

    return (
        <>
            <Stack spacing={2}>
                {/* Filter Bar */}
                <motion.div style={{ willChange: 'transform, opacity' }} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
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

                {/* User Cards */}
                <AnimatePresence mode="popLayout">
                    {filteredUsers.map((user, index) => (
                        <UserCardDepart
                            key={user._id}
                            user={user}
                            supervisors={supervisors}
                            updatingId={updatingId}
                            onRankChange={handleRankChange}
                            onRoleChange={handleRoleChange}
                            onDepartmentSave={handleDepartmentSave}
                            onSupervisorChange={handleSupervisorChange}
                            onStationSave={handleStationSave}
                            onToggleActive={handleToggleActive}
                            isMobile={isMobile}
                            index={index}
                        />
                    ))}
                </AnimatePresence>
            </Stack>
        </>
    );
};

export default UserManagementContent;