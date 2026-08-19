import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    FormControl,
    Grid,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    AssessmentRounded,
    CheckCircleRounded,
    DownloadRounded,
    EventAvailableRounded,
    FilterAltRounded,
    GroupsRounded,
    HelpOutlineRounded,
    HourglassBottomRounded,
    InsightsRounded,
    PieChartRounded,
    RefreshRounded,
    ShieldRounded,
    TrendingDownRounded,
    TrendingUpRounded,
    WarningAmberRounded,
} from "@mui/icons-material";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from "recharts";

import {
    fetchAnalyticsKPIs,
    fetchAttendanceTrends,
    fetchDepartmentAnalytics,
    fetchLateArrivalAnalytics,
    fetchStationAnalytics,
} from "../../service/ClockingService";
import * as SuperadminAPI from "../../service/SuperadminService";
import coreDataDetails, {
    applyPlatformConfigToCoreData,
    getActiveTheme,
} from "../CoreDataDetails";

const EAT_TIMEZONE = "Africa/Nairobi";

const datePartsFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: EAT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

const getDateInputValue = (date = new Date()) => {
    const parts = Object.fromEntries(
        datePartsFormatter.formatToParts(date).map((part) => [part.type, part.value])
    );

    return `${parts.year}-${parts.month}-${parts.day}`;
};

const getMonthStart = () => {
    const [year, month] = getDateInputValue().split("-");
    return `${year}-${month}-01`;
};

const formatDateLabel = (value, options = {}) => {
    if (!value) return "N/A";

    const date = new Date(`${value}T00:00:00+03:00`);
    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("en-KE", {
        timeZone: EAT_TIMEZONE,
        day: "2-digit",
        month: "short",
        year: "numeric",
        ...options,
    });
};

const formatRangeLabel = (startDate, endDate) => {
    if (!startDate || !endDate) return "Selected period";
    return `${formatDateLabel(startDate, { day: undefined })} to ${formatDateLabel(endDate, { day: undefined })}`;
};

const formatNumber = (value) => Number(value || 0).toLocaleString();
const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;
const safePercent = (value) => Math.max(0, Math.min(Number(value || 0), 100));

const normalizeOption = (option) => {
    if (typeof option === "string") return option;
    return option?.name || "";
};

const uniqueValues = (values = []) => [
    ...new Set(values.map(normalizeOption).map((value) => String(value || "").trim()).filter(Boolean)),
];

const titleCase = (value) =>
    String(value || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

const staffFilters = [
    { value: "", label: "All" },
    { value: "role:employee", label: "Employee" },
    { value: "role:intern", label: "Intern" },
    { value: "role:attachee", label: "Attachee" },
    { value: "rank:hr", label: "HR" },
    { value: "rank:supervisor", label: "Supervisor" },
    { value: "rank:admin", label: "Admin" },
    { value: "rank:ceo", label: "CEO" },
];

const buildParams = (filters) => {
    const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        station: filters.station || "",
        department: filters.department || "",
        role: "",
        rank: "",
    };

    const [kind, value] = String(filters.staffFilter || "").split(":");
    if (kind === "role") params.role = value;
    if (kind === "rank") params.rank = value;

    return params;
};

const buildTheme = (config = {}) => {
    const activeTheme = getActiveTheme(config) || {};
    const branding = config.branding || coreDataDetails.branding || {};
    const palette = coreDataDetails.colorPalette;

    return {
        primary: activeTheme.primaryColor || branding.primaryColor || palette.deepNavy,
        secondary: activeTheme.secondaryColor || branding.secondaryColor || palette.oceanBlue,
        accent: activeTheme.accentColor || branding.accentColor || palette.seafoamGreen,
        surface: activeTheme.surfaceColor || palette.cloudWhite,
        text: activeTheme.textColor || palette.charcoal || "#0f172a",
        success: palette.seafoamGreen || "#10B981",
        danger: palette.coralSunset || "#EF4444",
        warning: palette.warmSand || "#F59E0B",
        purple: "#7C3AED",
        border: "rgba(15, 23, 42, 0.10)",
        muted: "#64748B",
        white: "#FFFFFF",
    };
};

const getAttendanceColor = (rate, theme) => {
    const value = Number(rate || 0);
    if (value >= 90) return theme.success;
    if (value >= 80) return theme.secondary;
    if (value >= 70) return theme.warning;
    return theme.danger;
};

const exportCsv = ({ kpis, stations, departments, filters }) => {
    const rows = [
        ["Organisation Statistics", ""],
        ["Period", `${filters.startDate} to ${filters.endDate}`],
        ["Total Staff", kpis?.totalEmployees || 0],
        ["Present Today", kpis?.presentToday || 0],
        ["Absent Today", kpis?.absentToday || 0],
        ["On Leave Today", kpis?.onLeaveToday || 0],
        ["Attendance Rate", formatPercent(kpis?.attendanceRate)],
        [],
        ["Station", "Staff", "Present Days", "Absent Days", "Late", "On Leave", "Attendance Rate"],
        ...stations.map((station) => [
            station.station,
            station.staffCount || 0,
            station.presentDays || 0,
            station.absentDays || 0,
            station.totalLateCount || 0,
            station.onLeaveDays || 0,
            formatPercent(station.attendanceRate),
        ]),
        [],
        ["Department", "Staff", "Present Days", "Absent Days", "Late", "On Leave", "Attendance Rate"],
        ...departments.map((department) => [
            department.department,
            department.staffCount || 0,
            department.presentDays || 0,
            department.absentDays || 0,
            department.totalLateCount || 0,
            department.onLeaveDays || 0,
            formatPercent(department.attendanceRate),
        ]),
    ];

    const csv = rows
        .map((row) =>
            row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `organisation-statistics-${filters.startDate}-to-${filters.endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
};

const StatCard = ({ title, value, subtitle, icon, tone, theme }) => (
    <Card
        elevation={0}
        sx={{
            height: "100%",
            border: `1px solid ${theme.border}`,
            borderRadius: "8px",
            background: theme.white,
        }}
    >
        <CardContent sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 800, color: theme.muted, textTransform: "uppercase", letterSpacing: 0 }}>
                        {title}
                    </Typography>
                    <Typography sx={{ mt: 0.5, fontSize: { xs: 22, md: 26 }, fontWeight: 900, color: theme.text, lineHeight: 1.05 }}>
                        {value}
                    </Typography>
                    <Typography sx={{ mt: 0.5, fontSize: 11, color: theme.muted, overflowWrap: "anywhere" }}>
                        {subtitle}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "8px",
                        background: `${tone}18`,
                        color: tone,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </Box>
            </Stack>
        </CardContent>
    </Card>
);

const SectionCard = ({ title, subtitle, action, children, theme }) => (
    <Card
        elevation={0}
        sx={{
            height: "100%",
            border: `1px solid ${theme.border}`,
            borderRadius: "8px",
            background: theme.white,
        }}
    >
        <CardContent sx={{ p: 2 }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 900, color: theme.text, letterSpacing: 0 }}>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography sx={{ mt: 0.25, fontSize: 11, color: theme.muted }}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                {action}
            </Stack>
            {children}
        </CardContent>
    </Card>
);

const EmptyState = ({ label, theme }) => (
    <Stack alignItems="center" justifyContent="center" sx={{ height: "100%", minHeight: 180 }}>
        <Typography sx={{ fontSize: 13, color: theme.muted, fontWeight: 700 }}>
            {label}
        </Typography>
    </Stack>
);

const OrganisationStats = () => {
    const [filters, setFilters] = useState({
        startDate: getMonthStart(),
        endDate: getDateInputValue(),
        station: "",
        department: "",
        staffFilter: "",
    });

    const [theme, setTheme] = useState(() => buildTheme());
    const [filterOptions, setFilterOptions] = useState(() => ({
        stations: uniqueValues(coreDataDetails.AvailableStations),
        departments: uniqueValues(coreDataDetails.availableDepartments),
    }));
    const [kpis, setKpis] = useState(null);
    const [trends, setTrends] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [stations, setStations] = useState([]);
    const [lateAnalytics, setLateAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const params = useMemo(() => buildParams(filters), [filters]);

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [
                configResult,
                kpiResult,
                trendResult,
                departmentResult,
                stationResult,
                lateResult,
            ] = await Promise.allSettled([
                SuperadminAPI.getPlatformConfig(),
                fetchAnalyticsKPIs(params),
                fetchAttendanceTrends(params),
                fetchDepartmentAnalytics(params),
                fetchStationAnalytics(params),
                fetchLateArrivalAnalytics(params),
            ]);

            if (configResult.status === "fulfilled") {
                const config = configResult.value || {};
                applyPlatformConfigToCoreData(config);
                setTheme(buildTheme(config));
                setFilterOptions({
                    stations: uniqueValues(config.stations || coreDataDetails.AvailableStations),
                    departments: uniqueValues(config.departments || coreDataDetails.availableDepartments),
                });
            }

            if (kpiResult.status !== "fulfilled") {
                throw kpiResult.reason;
            }

            setKpis(kpiResult.value || {});
            setTrends(trendResult.status === "fulfilled" ? trendResult.value?.daily || [] : []);
            setDepartments(departmentResult.status === "fulfilled" ? departmentResult.value?.departments || [] : []);
            setStations(stationResult.status === "fulfilled" ? stationResult.value?.stations || [] : []);
            setLateAnalytics(lateResult.status === "fulfilled" ? lateResult.value || {} : {});
        } catch (err) {
            setError(
                typeof err === "string"
                    ? err
                    : err?.response?.data?.message || err?.message || "Failed to load organisation statistics."
            );
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const lateToday = Number(lateAnalytics?.employeesLateToday || 0);
    const presentToday = Number(kpis?.presentToday || 0);
    const onTimeToday = Math.max(presentToday - lateToday, 0);

    const chartData = useMemo(
        () =>
            trends.map((item) => ({
                ...item,
                label: formatDateLabel(item.date, { year: undefined }),
                present: Number(item.present || 0),
                absent: Number(item.absent || 0),
                late: Number(item.late || 0),
                attendance: Number(item.attendance || 0),
            })),
        [trends]
    );

    const distribution = useMemo(
        () =>
            [
                { name: "Present", value: onTimeToday, color: theme.success },
                { name: "Absent", value: Number(kpis?.absentToday || 0), color: theme.danger },
                { name: "On Leave", value: Number(kpis?.onLeaveToday || 0), color: theme.warning },
                { name: "Late", value: lateToday, color: theme.purple },
            ].filter((item) => item.value > 0),
        [kpis, lateToday, onTimeToday, theme]
    );

    const sortedStations = useMemo(
        () => [...stations].sort((a, b) => Number(b.attendanceRate || 0) - Number(a.attendanceRate || 0)),
        [stations]
    );

    const sortedDepartments = useMemo(
        () => [...departments].sort((a, b) => Number(b.attendanceRate || 0) - Number(a.attendanceRate || 0)),
        [departments]
    );

    const topStation = sortedStations[0];
    const lowestStation = [...sortedStations].reverse()[0];
    const topDepartment = sortedDepartments[0];
    const attentionCount = Number(kpis?.absentToday || 0) + lateToday;

    const handleFilterChange = (field) => (event) => {
        setFilters((previous) => ({
            ...previous,
            [field]: event.target.value,
        }));
    };

    const clearFilters = () => {
        setFilters({
            startDate: getMonthStart(),
            endDate: getDateInputValue(),
            station: "",
            department: "",
            staffFilter: "",
        });
    };

    if (loading && !kpis) {
        return (
            <Box sx={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Stack spacing={2} alignItems="center">
                    <CircularProgress size={34} sx={{ color: theme.secondary }} />
                    <Typography sx={{ color: theme.muted, fontWeight: 700 }}>
                        Loading organisation statistics...
                    </Typography>
                </Stack>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100%", p: { xs: 1.5, md: 3 }, background: `linear-gradient(180deg, ${theme.surface} 0%, #ffffff 100%)` }}>
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", md: "center" }}
                justifyContent="space-between"
                sx={{ mb: 2.5 }}
            >
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: theme.secondary,
                            background: `${theme.secondary}14`,
                        }}
                    >
                        <AssessmentRounded />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 900, color: theme.text, lineHeight: 1.1 }}>
                            Organisation Statistics
                        </Typography>
                        <Typography sx={{ mt: 0.5, fontSize: 13, color: theme.muted }}>
                            Attendance performance across stations and departments.
                        </Typography>
                    </Box>
                </Stack>

                <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }} flexWrap="wrap" useFlexGap>
                    <Chip
                        icon={<ShieldRounded sx={{ fontSize: 16 }} />}
                        label="HR Manager"
                        sx={{
                            height: 40,
                            borderRadius: "8px",
                            bgcolor: `${theme.accent}18`,
                            color: theme.primary,
                            fontWeight: 800,
                        }}
                    />
                    <Button
                        variant="outlined"
                        startIcon={loading ? <CircularProgress size={14} /> : <RefreshRounded />}
                        onClick={loadDashboard}
                        disabled={loading}
                        sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 800, borderColor: theme.border, color: theme.primary }}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<DownloadRounded />}
                        onClick={() => exportCsv({ kpis, stations: sortedStations, departments: sortedDepartments, filters })}
                        sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 800, bgcolor: theme.primary }}
                    >
                        Export
                    </Button>
                </Stack>
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>
                    {error}
                </Alert>
            )}

            <Card elevation={0} sx={{ mb: 2.5, border: `1px solid ${theme.border}`, borderRadius: "8px" }}>
                <CardContent sx={{ p: 2 }}>
                    <Grid container spacing={1.5} alignItems="center">
                        <Grid item xs={12} sm={6} md={2.4}>
                            <TextField
                                fullWidth
                                size="small"
                                type="date"
                                label="From"
                                value={filters.startDate}
                                onChange={handleFilterChange("startDate")}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                            <TextField
                                fullWidth
                                size="small"
                                type="date"
                                label="To"
                                value={filters.endDate}
                                onChange={handleFilterChange("endDate")}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Station</InputLabel>
                                <Select value={filters.station} label="Station" onChange={handleFilterChange("station")}>
                                    <MenuItem value="">All Stations</MenuItem>
                                    {filterOptions.stations.map((station) => (
                                        <MenuItem key={station} value={station}>
                                            {station}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Department</InputLabel>
                                <Select value={filters.department} label="Department" onChange={handleFilterChange("department")}>
                                    <MenuItem value="">All Departments</MenuItem>
                                    {filterOptions.departments.map((department) => (
                                        <MenuItem key={department} value={department}>
                                            {department}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Staff Type / Rank</InputLabel>
                                <Select value={filters.staffFilter} label="Staff Type / Rank" onChange={handleFilterChange("staffFilter")}>
                                    {staffFilters.map((item) => (
                                        <MenuItem key={item.value || "all"} value={item.value}>
                                            {item.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                <Button onClick={clearFilters} sx={{ textTransform: "none", fontWeight: 800, color: theme.primary }}>
                                    Clear
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<FilterAltRounded />}
                                    onClick={loadDashboard}
                                    disabled={loading}
                                    sx={{ textTransform: "none", fontWeight: 800, borderRadius: "8px", bgcolor: theme.primary }}
                                >
                                    Apply Filters
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                <Grid item xs={6} sm={4} lg={2}>
                    <StatCard title="Total Staff" value={formatNumber(kpis?.totalEmployees)} subtitle="Workforce" icon={<GroupsRounded />} tone={theme.secondary} theme={theme} />
                </Grid>
                <Grid item xs={6} sm={4} lg={2}>
                    <StatCard title="Present" value={formatNumber(kpis?.presentToday)} subtitle="Today" icon={<CheckCircleRounded />} tone={theme.success} theme={theme} />
                </Grid>
                <Grid item xs={6} sm={4} lg={2}>
                    <StatCard title="Absent" value={formatNumber(kpis?.absentToday)} subtitle="Today" icon={<WarningAmberRounded />} tone={theme.danger} theme={theme} />
                </Grid>
                <Grid item xs={6} sm={4} lg={2}>
                    <StatCard title="On Leave" value={formatNumber(kpis?.onLeaveToday)} subtitle="Today" icon={<EventAvailableRounded />} tone={theme.warning} theme={theme} />
                </Grid>
                <Grid item xs={6} sm={4} lg={2}>
                    <StatCard title="Late" value={formatNumber(lateToday)} subtitle="Today" icon={<HourglassBottomRounded />} tone={theme.purple} theme={theme} />
                </Grid>
                <Grid item xs={6} sm={4} lg={2}>
                    <StatCard title="Attendance Rate" value={formatPercent(kpis?.attendanceRate)} subtitle={formatRangeLabel(filters.startDate, filters.endDate)} icon={<PieChartRounded />} tone={theme.secondary} theme={theme} />
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} lg={5}>
                    <SectionCard
                        title="Attendance Trend"
                        subtitle="Daily present, absent, and late staff"
                        theme={theme}
                        action={
                            <Tooltip title="Working days in the selected date range">
                                <HelpOutlineRounded sx={{ fontSize: 18, color: theme.muted }} />
                            </Tooltip>
                        }
                    >
                        <Box sx={{ height: 295 }}>
                            {chartData.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.18)" />
                                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: theme.muted }} minTickGap={18} />
                                        <YAxis tick={{ fontSize: 10, fill: theme.muted }} allowDecimals={false} />
                                        <RechartsTooltip />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                                        <Line type="monotone" dataKey="present" name="Present" stroke={theme.success} strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                                        <Line type="monotone" dataKey="absent" name="Absent" stroke={theme.danger} strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                                        <Line type="monotone" dataKey="late" name="Late" stroke={theme.purple} strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState label="No attendance trend data available." theme={theme} />
                            )}
                        </Box>
                    </SectionCard>
                </Grid>

                <Grid item xs={12} md={6} lg={3}>
                    <SectionCard title="Attendance Distribution" subtitle="Today by attendance state" theme={theme}>
                        <Box sx={{ height: 295, position: "relative" }}>
                            {distribution.length ? (
                                <>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2}>
                                                {distribution.map((item) => (
                                                    <Cell key={item.name} fill={item.color} />
                                                ))}
                                            </Pie>
                                            <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                                            <RechartsTooltip formatter={(value, name) => [formatNumber(value), name]} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <Box sx={{ position: "absolute", top: "41%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                                        <Typography sx={{ fontSize: 24, fontWeight: 900, color: theme.text, lineHeight: 1 }}>
                                            {formatNumber(kpis?.totalEmployees)}
                                        </Typography>
                                        <Typography sx={{ fontSize: 10, color: theme.muted, fontWeight: 700 }}>
                                            Total Staff
                                        </Typography>
                                    </Box>
                                </>
                            ) : (
                                <EmptyState label="No distribution data available." theme={theme} />
                            )}
                        </Box>
                        <Box sx={{ mt: -0.5, py: 1, px: 1.5, borderRadius: "8px", bgcolor: `${theme.success}14`, textAlign: "center" }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 900, color: theme.success }}>
                                Attendance Rate: {formatPercent(kpis?.attendanceRate)}
                            </Typography>
                        </Box>
                    </SectionCard>
                </Grid>

                <Grid item xs={12} md={6} lg={4}>
                    <SectionCard title="Attendance by Station" subtitle="Station performance" theme={theme}>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 900 }}>Station</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 900 }}>Staff</TableCell>
                                        <TableCell sx={{ fontWeight: 900 }}>Attendance</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 900 }}>Absent</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 900 }}>Late</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedStations.slice(0, 6).map((station) => {
                                        const rate = Number(station.attendanceRate || 0);
                                        return (
                                            <TableRow key={station.station}>
                                                <TableCell sx={{ maxWidth: 150 }}>
                                                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: theme.text, overflowWrap: "anywhere" }}>
                                                        {station.station || "Unassigned"}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">{formatNumber(station.staffCount)}</TableCell>
                                                <TableCell sx={{ minWidth: 118 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={safePercent(rate)}
                                                            sx={{
                                                                width: 64,
                                                                height: 6,
                                                                borderRadius: 10,
                                                                bgcolor: "rgba(100,116,139,0.16)",
                                                                "& .MuiLinearProgress-bar": {
                                                                    bgcolor: getAttendanceColor(rate, theme),
                                                                    borderRadius: 10,
                                                                },
                                                            }}
                                                        />
                                                        <Typography sx={{ fontSize: 11, fontWeight: 900 }}>{formatPercent(rate)}</Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell align="right">{formatNumber(station.absentDays)}</TableCell>
                                                <TableCell align="right">{formatNumber(station.totalLateCount)}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {!sortedStations.length && (
                                        <TableRow>
                                            <TableCell colSpan={5}>
                                                <EmptyState label="No station data available." theme={theme} />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </SectionCard>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} lg={8}>
                    <SectionCard title="Department Performance" subtitle="Present-days, absence, leave, and lateness" theme={theme}>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 900 }}>Department</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 900 }}>Staff</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 900 }}>Present</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 900 }}>Absent</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 900 }}>Late</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 900 }}>On Leave</TableCell>
                                        <TableCell sx={{ fontWeight: 900 }}>Attendance</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedDepartments.slice(0, 8).map((department) => {
                                        const rate = Number(department.attendanceRate || 0);
                                        return (
                                            <TableRow key={department.department}>
                                                <TableCell sx={{ maxWidth: 230 }}>
                                                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: theme.text, overflowWrap: "anywhere" }}>
                                                        {department.department || "Unassigned"}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">{formatNumber(department.staffCount)}</TableCell>
                                                <TableCell align="right">{formatNumber(department.presentDays)}</TableCell>
                                                <TableCell align="right">{formatNumber(department.absentDays)}</TableCell>
                                                <TableCell align="right">{formatNumber(department.totalLateCount)}</TableCell>
                                                <TableCell align="right">{formatNumber(department.onLeaveDays)}</TableCell>
                                                <TableCell sx={{ minWidth: 140 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={safePercent(rate)}
                                                            sx={{
                                                                width: 70,
                                                                height: 7,
                                                                borderRadius: 10,
                                                                bgcolor: "rgba(100,116,139,0.16)",
                                                                "& .MuiLinearProgress-bar": {
                                                                    bgcolor: getAttendanceColor(rate, theme),
                                                                    borderRadius: 10,
                                                                },
                                                            }}
                                                        />
                                                        <Typography sx={{ fontSize: 12, fontWeight: 900, color: getAttendanceColor(rate, theme) }}>
                                                            {formatPercent(rate)}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {!sortedDepartments.length && (
                                        <TableRow>
                                            <TableCell colSpan={7}>
                                                <EmptyState label="No department data available." theme={theme} />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </SectionCard>
                </Grid>

                <Grid item xs={12} lg={4}>
                    <SectionCard title="Management Insights" subtitle="Highlights for the selected period" theme={theme}>
                        <Grid container spacing={1.2}>
                            <Grid item xs={12}>
                                <Box sx={{ p: 1.5, borderRadius: "8px", bgcolor: `${theme.success}12`, border: `1px solid ${theme.success}33` }}>
                                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                                        <Box>
                                            <Typography sx={{ fontSize: 11, fontWeight: 900, color: theme.success }}>Best Performing Station</Typography>
                                            <Typography sx={{ mt: 0.5, fontSize: 16, fontWeight: 900, color: theme.text }}>{topStation?.station || "N/A"}</Typography>
                                            <Typography sx={{ fontSize: 23, fontWeight: 900, color: theme.success }}>{formatPercent(topStation?.attendanceRate)}</Typography>
                                        </Box>
                                        <TrendingUpRounded sx={{ color: theme.success, fontSize: 34, alignSelf: "center" }} />
                                    </Stack>
                                </Box>
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ p: 1.5, borderRadius: "8px", bgcolor: `${theme.danger}10`, border: `1px solid ${theme.danger}33` }}>
                                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                                        <Box>
                                            <Typography sx={{ fontSize: 11, fontWeight: 900, color: theme.danger }}>Lowest Attendance Station</Typography>
                                            <Typography sx={{ mt: 0.5, fontSize: 16, fontWeight: 900, color: theme.text }}>{lowestStation?.station || "N/A"}</Typography>
                                            <Typography sx={{ fontSize: 23, fontWeight: 900, color: theme.danger }}>{formatPercent(lowestStation?.attendanceRate)}</Typography>
                                        </Box>
                                        <TrendingDownRounded sx={{ color: theme.danger, fontSize: 34, alignSelf: "center" }} />
                                    </Stack>
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Box sx={{ p: 1.4, minHeight: 104, borderRadius: "8px", bgcolor: `${theme.secondary}10` }}>
                                    <Typography sx={{ fontSize: 10, fontWeight: 900, color: theme.secondary }}>Top Department</Typography>
                                    <Typography sx={{ mt: 0.5, fontSize: 13, fontWeight: 900, color: theme.text, overflowWrap: "anywhere" }}>
                                        {topDepartment?.department || "N/A"}
                                    </Typography>
                                    <Typography sx={{ mt: 0.5, fontSize: 18, fontWeight: 900, color: theme.secondary }}>
                                        {formatPercent(topDepartment?.attendanceRate)}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Box sx={{ p: 1.4, minHeight: 104, borderRadius: "8px", bgcolor: `${theme.warning}16` }}>
                                    <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#B45309" }}>Frequent Late Arrivals</Typography>
                                    <Typography sx={{ mt: 0.5, fontSize: 24, fontWeight: 900, color: "#92400E" }}>{formatNumber(lateToday)}</Typography>
                                    <Typography sx={{ fontSize: 10, color: "#B45309", fontWeight: 700 }}>staff today</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Box sx={{ p: 1.4, minHeight: 104, borderRadius: "8px", bgcolor: `${theme.purple}12` }}>
                                    <Typography sx={{ fontSize: 10, fontWeight: 900, color: theme.purple }}>Staff Requiring Attention</Typography>
                                    <Typography sx={{ mt: 0.5, fontSize: 24, fontWeight: 900, color: theme.purple }}>{formatNumber(attentionCount)}</Typography>
                                    <Typography sx={{ fontSize: 10, color: theme.purple, fontWeight: 700 }}>absent or late today</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Box sx={{ p: 1.4, minHeight: 104, borderRadius: "8px", bgcolor: `${theme.accent}14` }}>
                                    <Typography sx={{ fontSize: 10, fontWeight: 900, color: theme.primary }}>Average Hours</Typography>
                                    <Typography sx={{ mt: 0.5, fontSize: 24, fontWeight: 900, color: theme.primary }}>
                                        {Number(kpis?.averageWorkingHours || 0).toFixed(1)}
                                    </Typography>
                                    <Typography sx={{ fontSize: 10, color: theme.primary, fontWeight: 700 }}>hours per record</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </SectionCard>
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mt: 0 }}>
                <Grid item xs={12} lg={8}>
                    <SectionCard title="Department Attendance Rate" subtitle="Top departments by attendance percentage" theme={theme}>
                        <Box sx={{ height: 300 }}>
                            {sortedDepartments.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={sortedDepartments.slice(0, 8)} margin={{ top: 8, right: 10, left: -20, bottom: 42 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.16)" />
                                        <XAxis dataKey="department" tick={{ fontSize: 10, fill: theme.muted }} interval={0} angle={-20} textAnchor="end" height={64} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: theme.muted }} tickFormatter={(value) => `${value}%`} />
                                        <RechartsTooltip formatter={(value) => [formatPercent(value), "Attendance"]} />
                                        <Bar dataKey="attendanceRate" name="Attendance Rate" radius={[6, 6, 0, 0]}>
                                            {sortedDepartments.slice(0, 8).map((item) => (
                                                <Cell key={item.department} fill={getAttendanceColor(item.attendanceRate, theme)} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState label="No department chart data available." theme={theme} />
                            )}
                        </Box>
                    </SectionCard>
                </Grid>
                <Grid item xs={12} lg={4}>
                    <SectionCard title="Summary" subtitle="Selected period snapshot" theme={theme}>
                        <Stack spacing={1.2}>
                            {[
                                ["Scope", filters.station || filters.department || "All Stations and Departments"],
                                ["Staff Type / Rank", staffFilters.find((item) => item.value === filters.staffFilter)?.label || "All"],
                                ["Punctuality Rate", formatPercent(kpis?.punctualityRate)],
                                ["Absenteeism Rate", formatPercent(kpis?.absenteeismRate)],
                                ["Productivity Index", formatPercent(kpis?.productivityIndex)],
                            ].map(([label, value]) => (
                                <Stack key={label} direction="row" justifyContent="space-between" spacing={2} sx={{ py: 1, borderBottom: `1px solid ${theme.border}` }}>
                                    <Typography sx={{ color: theme.muted, fontSize: 12, fontWeight: 800 }}>{label}</Typography>
                                    <Typography sx={{ color: theme.text, fontSize: 12, fontWeight: 900, textAlign: "right", overflowWrap: "anywhere" }}>
                                        {titleCase(value)}
                                    </Typography>
                                </Stack>
                            ))}
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ pt: 0.5 }}>
                                <InsightsRounded sx={{ color: theme.secondary, fontSize: 18 }} />
                                <Typography sx={{ color: theme.muted, fontSize: 11 }}>
                                    Last updated{" "}
                                    {new Date().toLocaleString("en-KE", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                        timeZone: EAT_TIMEZONE,
                                    })}{" "}
                                    EAT.
                                </Typography>
                            </Stack>
                        </Stack>
                    </SectionCard>
                </Grid>
            </Grid>
        </Box>
    );
};

export default OrganisationStats;
