import {
    AccessTimeRounded,
    FilterListRounded,
    PeopleRounded,
    RotateLeftRounded,
    SearchRounded,
    SecurityRounded,
    ShieldRounded,
    TodayRounded,
    VisibilityRounded
} from "@mui/icons-material";
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    InputAdornment,
    MenuItem,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { fetchAuditLogs } from "../../service/AuditorService.jsx";
import coreDataDetails from "../CoreDataDetails.jsx";
const { colorPalette } = coreDataDetails;
/* ─── Glass Design Tokens ────────────────────────────────────────────────── */
const G = {
    surface: {
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(3px) saturate(30%)',
        WebkitBackdropFilter: 'blur(3px) saturate(30%)',
        border: '1px solid rgba(148,163,184,0.18)',
        boxShadow: '0 5px 10px rgba(15,23,42,0.08)',
        willChange: 'transform',
    },
    cardHover: {
        '&:hover': {
            boxShadow: '0 20px 50px rgba(15,23,42,0.12)',
            transform: 'translateY(-2px)',
            transition: 'all 0.3s ease',
            willChange: 'transform',
        },
    },
    gradientBg: {
        background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(16,185,129,0.08) 100%)',
        willChange: 'transform',
    },
};

const CATEGORY_TABS = [
    { value: "all", label: "All Logs" },
    { value: "authentication", label: "Sign In / Out" },
    { value: "attendance", label: "Exports" },
    { value: "leave", label: "Leave" },
    { value: "profile", label: "Profile" },
    { value: "device", label: "Lost Device" },
    { value: "password_reset", label: "Password Reset" },
    { value: "admin_action", label: "Admin / HR Actions" },
];

const RANK_OPTIONS = [
    { value: "all", label: "All Ranks" },
    { value: "admin", label: "Admin" },
    { value: "hr", label: "HR" },
    { value: "auditor", label: "Auditor" },
    { value: "supervisor", label: "Supervisor" },
    { value: "ceo", label: "CEO" },
    { value: "user", label: "User" },
];

const CATEGORY_COLORS = {
    authentication: { bg: "rgba(59,130,246,0.12)", color: "#2563eb" },
    attendance: { bg: "rgba(16,185,129,0.12)", color: "#059669" },
    leave: { bg: "rgba(234,179,8,0.14)", color: "#a16207" },
    profile: { bg: "rgba(139,92,246,0.12)", color: "#7c3aed" },
    device: { bg: "rgba(239,68,68,0.12)", color: "#dc2626" },
    password_reset: { bg: "rgba(249,115,22,0.14)", color: "#ea580c" },
    admin_action: { bg: "rgba(20,184,166,0.14)", color: "#0f766e" },
};

const formatDateTime = (value) => {
    if (!value) return "Unknown time";
    return new Date(value).toLocaleString();
};

const compactKey = (value = "") =>
    value
        .split(".")
        .pop()
        ?.replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()) || value;

function MetricCard({ label, value, helper, icon }) {
    return (
        <Card sx={{
            ...G.surface,
            ...G.cardHover,
            borderRadius: 4,
            height: "100%",
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #3b82f6, #10b981)',
            },
        }}>
            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {label}
                    </Typography>
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "12px",
                        display: "grid",
                        placeItems: "center",
                        bgcolor: 'rgba(59,130,246,0.1)',
                        color: colorPalette.oceanBlue,
                        boxShadow: '0 4px 12px rgba(59,130,246,0.2)',
                    }}>
                        {icon}
                    </Box>
                </Stack>
                <Typography variant="h4" fontWeight={900} color="#0f172a" sx={{ mb: 1 }}>
                    {value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    {helper}
                </Typography>
            </CardContent>
        </Card>
    );
}

function AuditLogCard({ log }) {
    const colors = CATEGORY_COLORS[log.category] || CATEGORY_COLORS.authentication;
    const metadataEntries = Object.entries(log.metadata || {}).filter(([, value]) => {
        if (value === null || value === undefined || value === "") return false;
        if (typeof value === "object") return false;
        return true;
    });

    return (
        <Card sx={{
            ...G.surface,
            ...G.cardHover,
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
        }}>
            <CardContent sx={{ p: 3 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Chip
                            size="small"
                            label={compactKey(log.category)}
                            sx={{
                                bgcolor: colors.bg,
                                color: colors.color,
                                fontWeight: 800,
                                border: `1px solid ${colors.color}20`,
                                boxShadow: `0 2px 8px ${colors.color}30`,
                            }}
                        />
                        <Chip
                            size="small"
                            variant="outlined"
                            label={compactKey(log.action)}
                            sx={{
                                fontWeight: 700,
                                borderColor: 'rgba(148,163,184,0.3)',
                                '&:hover': { bgcolor: 'rgba(148,163,184,0.1)' },
                            }}
                        />
                        {log.actor?.rank && (
                            <Chip
                                size="small"
                                label={String(log.actor.rank).toUpperCase()}
                                sx={{
                                    bgcolor: 'rgba(15,23,42,0.08)',
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    border: '1px solid rgba(15,23,42,0.2)',
                                }}
                            />
                        )}
                    </Stack>

                    <Stack direction="row" spacing={0.8} alignItems="center" color="text.secondary">
                        <AccessTimeRounded sx={{ fontSize: 16 }} />
                        <Typography variant="caption" fontWeight={700}>
                            {formatDateTime(log.occurredAt)}
                        </Typography>
                    </Stack>
                </Stack>

                <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ mb: 1 }}>
                    {log.description}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.6 }}>
                    <strong>{log.actor?.name || "Unknown user"}</strong> ({log.actor?.email || "No email"})
                    {log.target?.email ? ` → ${log.target?.name || "Target user"} (${log.target.email})` : ""}
                </Typography>

                {metadataEntries.length > 0 && (
                    <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                        {metadataEntries.map(([key, value]) => (
                            <Chip
                                key={`${log._id}-${key}`}
                                size="small"
                                variant="outlined"
                                label={`${compactKey(key)}: ${String(value)}`}
                                sx={{
                                    borderColor: 'rgba(148,163,184,0.3)',
                                    '&:hover': { bgcolor: 'rgba(148,163,184,0.1)' },
                                }}
                            />
                        ))}
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
}

export default function AuditLogsContent() {
    const [category, setCategory] = useState("all");
    const [action, setAction] = useState("all");
    const [actorRank, setActorRank] = useState("all");
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [data, setData] = useState({ logs: [], metrics: {}, actionCounts: {} });

    useEffect(() => {
        let active = true;

        const loadLogs = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetchAuditLogs({
                    category,
                    action,
                    actorRank,
                    search: search.trim(),
                    dateFrom,
                    dateTo,
                    limit: 300,
                });

                if (active) {
                    setData(response);
                }
            } catch (err) {
                if (active) {
                    setError(typeof err === "string" ? err : "Failed to load audit logs");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadLogs();
        return () => { active = false; };
    }, [category, action, actorRank, search, dateFrom, dateTo]);

    const actionOptions = useMemo(() => {
        const entries = Object.keys(data.actionCounts || {});
        return [
            { value: "all", label: "All Activities" },
            ...entries.map((item) => ({ value: item, label: compactKey(item) })),
        ];
    }, [data.actionCounts]);

    const resetFilters = () => {
        setCategory("all");
        setAction("all");
        setActorRank("all");
        setSearch("");
        setDateFrom("");
        setDateTo("");
    };

    return (
        <Box sx={{ maxWidth: 1400, mx: "auto" }}>
            <Card sx={{ ...G.surface, borderRadius: 5, mb: 3 }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
                        <Box>
                            <Typography variant="h5" fontWeight={900} color="#0f172a">
                                System Audit Trail
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6, maxWidth: 760 }}>
                                Review accountability logs for sign-in activity, attendance actions, leave requests, profile updates,
                                lost-device workflows, password-reset workflows, and high-privilege admin or HR changes.
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                                icon={<ShieldRounded />}
                                label={`${data.logs?.length || 0} matched logs`}
                                sx={{ fontWeight: 800, bgcolor: "rgba(14,165,233,0.10)", color: "#0369a1" }}
                            />
                        </Stack>
                    </Stack>

                    <Tabs
                        value={category}
                        onChange={(_, value) => { setCategory(value); setAction("all"); setActorRank("all"); }}
                        variant="scrollable"
                        allowScrollButtonsMobile
                        sx={{
                            mt: 2.5,
                            '& .MuiTab-root': {
                                borderRadius: '8px',
                                mx: 0.5,
                                minHeight: 40,
                                textTransform: 'none',
                                fontWeight: 700,
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(59,130,246,0.1)',
                                    color: colorPalette.oceanBlue,
                                },
                            },
                        }}
                    >
                        {CATEGORY_TABS.map((tab) => (
                            <Tab key={tab.value} value={tab.value} label={tab.label} />
                        ))}
                    </Tabs>

                    <Divider sx={{ my: 3 }} />

                    <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <FilterListRounded sx={{ color: "#0f172a" }} />
                            <Typography variant="h6" fontWeight={800}>
                                Filters
                            </Typography>
                        </Stack>
                        <Tooltip title="Reset all filters to default values">
                            <Chip
                                icon={<RotateLeftRounded />}
                                label="Reset"
                                onClick={resetFilters}
                                size="small"
                                variant="outlined"
                                sx={{
                                    borderColor: 'rgba(59,130,246,0.4)',
                                    color: '#2563eb',
                                    fontWeight: 700,
                                    '&:hover': {
                                        borderColor: '#2563eb',
                                        bgcolor: 'rgba(59,130,246,0.08)',
                                        cursor: 'pointer',
                                    },
                                    transition: 'all 0.2s ease',
                                }}
                            />
                        </Tooltip>
                    </Stack>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <Tooltip title="Search by actor name, email, target, or action details">
                                <TextField
                                    fullWidth
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    label="Search actor, target, action"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchRounded fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Tooltip>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.5}>
                            <TextField
                                select
                                fullWidth
                                label="Activity"
                                value={action}
                                onChange={(e) => setAction(e.target.value)}
                            >
                                {actionOptions.map((item) => (
                                    <MenuItem key={item.value} value={item.value}>
                                        {item.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <Tooltip title="Filter by actor's rank/role">
                                <TextField
                                    select
                                    fullWidth
                                    label="Actor Rank"
                                    value={actorRank}
                                    onChange={(e) => setActorRank(e.target.value)}
                                >
                                    {RANK_OPTIONS.map((item) => (
                                        <MenuItem key={item.value} value={item.value}>
                                            {item.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Tooltip>
                        </Grid>
                        <Grid item xs={12} sm={6} md={1.75}>
                            <Tooltip title="Start date for filtering logs">
                                <TextField
                                    fullWidth
                                    label="From"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Tooltip>
                        </Grid>
                        <Grid item xs={12} sm={6} md={1.75}>
                            <Tooltip title="End date for filtering logs">
                                <TextField
                                    fullWidth
                                    label="To"
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Tooltip>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Grid container spacing={2.2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <MetricCard
                        label="Visible Logs"
                        value={data.metrics?.total || 0}
                        helper="All audit entries matching the current filters."
                        icon={<VisibilityRounded fontSize="small" />}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <MetricCard
                        label="Active Users"
                        value={data.metrics?.uniqueActors || 0}
                        helper="Distinct actors represented in this filtered view."
                        icon={<PeopleRounded fontSize="small" />}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <MetricCard
                        label="Privileged Actions"
                        value={data.metrics?.privilegedActions || 0}
                        helper="Actions performed by admin or HR users."
                        icon={<SecurityRounded fontSize="small" />}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <MetricCard
                        label="Today"
                        value={data.metrics?.today || 0}
                        helper="Audit entries created today."
                        icon={<TodayRounded fontSize="small" />}
                    />
                </Grid>
            </Grid>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Card sx={{
                ...G.surface,
                borderRadius: 5,
                ...G.gradientBg,
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #3b82f6, #10b981, #f59e0b)',
                },
            }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" sx={{ mb: 2 }}>
                        <Typography variant="h6" fontWeight={800} color="#0f172a">
                            Activity Stream
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Entries are ordered from most recent to oldest.
                        </Typography>
                    </Stack>

                    <Divider sx={{ mb: 2.5 }} />

                    {loading ? (
                        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
                            <CircularProgress sx={{ color: colorPalette.oceanBlue }} />
                        </Stack>
                    ) : data.logs?.length ? (
                        <Stack spacing={2}>
                            {data.logs.map((log) => (
                                <AuditLogCard key={log._id} log={log} />
                            ))}
                        </Stack>
                    ) : (
                        <Box sx={{ py: 8, textAlign: "center" }}>
                            <Typography variant="h6" fontWeight={800} color="#0f172a">
                                No audit logs found
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                Try broadening the selected activity, date range, or search filters.
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}
