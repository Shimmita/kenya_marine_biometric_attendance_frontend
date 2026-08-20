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
    fetchAbsenteeismAnalytics,
    fetchAnalyticsKPIs,
    fetchAttendanceTrends,
    fetchBiometricAnalytics,
    fetchComplianceAnalytics,
    fetchDepartmentAnalytics,
    fetchEarlyDepartureAnalytics,
    fetchLateArrivalAnalytics,
    fetchOutsideClockingAnalytics,
    fetchProductivityAnalytics,
    fetchStationAnalytics,
    fetchWorkforceAnalytics,
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

const getDateDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return getDateInputValue(date);
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

const quickRanges = [
    { value: "today", label: "Today", startDate: getDateInputValue, endDate: getDateInputValue },
    { value: "7d", label: "Last 7 Days", startDate: () => getDateDaysAgo(6), endDate: getDateInputValue },
    { value: "30d", label: "Last 30 Days", startDate: () => getDateDaysAgo(29), endDate: getDateInputValue },
    { value: "month", label: "This Month", startDate: getMonthStart, endDate: getDateInputValue },
];

const performanceBands = [
    { value: "", label: "All Performance" },
    { value: "excellent", label: "Excellent 90%+" },
    { value: "stable", label: "Stable 80-89%" },
    { value: "watch", label: "Watch 70-79%" },
    { value: "critical", label: "Critical <70%" },
];

const sortOptions = [
    { value: "attendance-desc", label: "Attendance High-Low" },
    { value: "attendance-asc", label: "Attendance Low-High" },
    { value: "staff-desc", label: "Staff Count High-Low" },
    { value: "absent-desc", label: "Absence High-Low" },
    { value: "late-desc", label: "Lateness High-Low" },
];

const trendMetricOptions = [
    { value: "all", label: "Present, Absent, Late" },
    { value: "attendance", label: "Attendance Rate" },
    { value: "present", label: "Present Only" },
    { value: "risk", label: "Absence and Lateness" },
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

const filterByPerformanceBand = (items, band) => {
    if (!band) return items;

    return items.filter((item) => {
        const rate = Number(item.attendanceRate || 0);
        if (band === "excellent") return rate >= 90;
        if (band === "stable") return rate >= 80 && rate < 90;
        if (band === "watch") return rate >= 70 && rate < 80;
        if (band === "critical") return rate < 70;
        return true;
    });
};

const sortAnalyticsRows = (items, sortBy) => {
    const rows = [...items];
    const numeric = (item, key) => Number(item?.[key] || 0);

    if (sortBy === "attendance-asc") {
        return rows.sort((a, b) => numeric(a, "attendanceRate") - numeric(b, "attendanceRate"));
    }
    if (sortBy === "staff-desc") {
        return rows.sort((a, b) => numeric(b, "staffCount") - numeric(a, "staffCount"));
    }
    if (sortBy === "absent-desc") {
        return rows.sort((a, b) => numeric(b, "absentDays") - numeric(a, "absentDays"));
    }
    if (sortBy === "late-desc") {
        return rows.sort((a, b) => numeric(b, "totalLateCount") - numeric(a, "totalLateCount"));
    }

    return rows.sort((a, b) => numeric(b, "attendanceRate") - numeric(a, "attendanceRate"));
};

const buildChartColors = (theme) => [
    theme.secondary,
    theme.success,
    theme.warning,
    theme.danger,
    theme.purple,
    theme.accent,
    "#0EA5E9",
    "#F97316",
    "#14B8A6",
    "#64748B",
];

const withChartColors = (items, theme) => {
    const colors = buildChartColors(theme);
    return items
        .filter((item) => Number(item.value || 0) > 0)
        .map((item, index) => ({ ...item, color: item.color || colors[index % colors.length] }));
};

const topWithOthers = (items, limit = 6) => {
    if (items.length <= limit) return items;
    const visible = items.slice(0, limit - 1);
    const otherValue = items.slice(limit - 1).reduce((sum, item) => sum + Number(item.value || 0), 0);
    return [...visible, { name: "Others", value: otherValue }];
};

const getTotalValue = (items) => items.reduce((sum, item) => sum + Number(item.value || 0), 0);

const exportCsv = ({ kpis, stations, departments, filters, overallTopEmployees = [], topEmployeesByStation = [] }) => {
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
        [],
        ["Overall Top Employees", "Station", "Department", "Present Days", "Attendance Rate"],
        ...overallTopEmployees.map((employee) => [
            employee.name || employee.email || "Unknown",
            employee.station || "Unassigned",
            employee.department || "Unassigned",
            employee.presentDays || 0,
            formatPercent(employee.attendanceRate),
        ]),
        [],
        ["Top Employees by Station", "Station", "Department", "Present Days", "Attendance Rate"],
        ...topEmployeesByStation.flatMap((stationGroup) =>
            stationGroup.employees.map((employee) => [
                employee.name || employee.email || "Unknown",
                employee.station || stationGroup.station || "Unassigned",
                employee.department || "Unassigned",
                employee.presentDays || 0,
                formatPercent(employee.attendanceRate),
            ])
        ),
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

const InsightNote = ({ children, theme, tone }) => (
    <Stack
        direction="row"
        spacing={1}
        alignItems="flex-start"
        sx={{
            mt: 1.2,
            p: 1.2,
            borderRadius: "8px",
            bgcolor: `${tone || theme.secondary}10`,
            border: `1px solid ${tone || theme.secondary}22`,
        }}
    >
        <InsightsRounded sx={{ mt: 0.1, fontSize: 16, color: tone || theme.secondary, flexShrink: 0 }} />
        <Typography sx={{ fontSize: 11, color: theme.muted, lineHeight: 1.45 }}>
            {children}
        </Typography>
    </Stack>
);

const DonutVisualization = ({ data, theme, centerValue, centerLabel, height = 260 }) => (
    <Box sx={{ height, position: "relative" }}>
        {data.length ? (
            <>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="42%"
                            innerRadius="48%"
                            outerRadius="72%"
                            paddingAngle={2}
                        >
                            {data.map((item) => (
                                <Cell key={item.name} fill={item.color} />
                            ))}
                        </Pie>
                        <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        <RechartsTooltip formatter={(value, name) => [formatNumber(value), name]} />
                    </PieChart>
                </ResponsiveContainer>
                <Box
                    sx={{
                        position: "absolute",
                        top: "41%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        textAlign: "center",
                        pointerEvents: "none",
                    }}
                >
                    <Typography sx={{ fontSize: 23, fontWeight: 900, color: theme.text, lineHeight: 1 }}>
                        {centerValue}
                    </Typography>
                    <Typography sx={{ fontSize: 10, color: theme.muted, fontWeight: 800 }}>
                        {centerLabel}
                    </Typography>
                </Box>
            </>
        ) : (
            <EmptyState label="No chart data available." theme={theme} />
        )}
    </Box>
);

const EmployeeRankList = ({ rows, theme, emptyLabel }) => (
    <Stack spacing={1}>
        {rows.length ? rows.map((employee, index) => {
            const rate = Number(employee.attendanceRate || 0);
            return (
                <Stack
                    key={`${employee.station || "station"}-${employee.email || employee.name || index}`}
                    direction="row"
                    spacing={1.2}
                    alignItems="center"
                    sx={{
                        p: 1.2,
                        border: `1px solid ${theme.border}`,
                        borderRadius: "8px",
                        bgcolor: index === 0 ? `${theme.success}10` : "#fff",
                    }}
                >
                    <Box
                        sx={{
                            width: 30,
                            height: 30,
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            bgcolor: `${getAttendanceColor(rate, theme)}18`,
                            color: getAttendanceColor(rate, theme),
                            fontSize: 12,
                            fontWeight: 900,
                        }}
                    >
                        {index + 1}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 900, color: theme.text, overflowWrap: "anywhere" }}>
                            {titleCase(employee.name || employee.email || "Unknown")}
                        </Typography>
                        <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: theme.muted, overflowWrap: "anywhere" }}>
                            {employee.station || "Unassigned"} - {employee.department || "Unassigned"}
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 900, color: getAttendanceColor(rate, theme) }}>
                            {formatPercent(rate)}
                        </Typography>
                        <Typography sx={{ fontSize: 10, color: theme.muted, fontWeight: 700 }}>
                            {formatNumber(employee.presentDays)} days
                        </Typography>
                    </Box>
                </Stack>
            );
        }) : (
            <EmptyState label={emptyLabel} theme={theme} />
        )}
    </Stack>
);

const OrganisationStats = () => {
    const [filters, setFilters] = useState({
        startDate: getMonthStart(),
        endDate: getDateInputValue(),
        station: "",
        department: "",
        staffFilter: "",
        quickRange: "month",
        performanceBand: "",
        sortBy: "attendance-desc",
        trendMetric: "all",
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
    const [earlyAnalytics, setEarlyAnalytics] = useState(null);
    const [absenteeismAnalytics, setAbsenteeismAnalytics] = useState(null);
    const [complianceAnalytics, setComplianceAnalytics] = useState(null);
    const [biometricAnalytics, setBiometricAnalytics] = useState(null);
    const [outsideClockingAnalytics, setOutsideClockingAnalytics] = useState([]);
    const [workforceAnalytics, setWorkforceAnalytics] = useState(null);
    const [productivityAnalytics, setProductivityAnalytics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const params = useMemo(
        () => buildParams(filters),
        [filters.startDate, filters.endDate, filters.station, filters.department, filters.staffFilter]
    );

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
                earlyResult,
                absenteeismResult,
                complianceResult,
                biometricResult,
                outsideClockingResult,
                workforceResult,
                productivityResult,
            ] = await Promise.allSettled([
                SuperadminAPI.getPlatformConfig(),
                fetchAnalyticsKPIs(params),
                fetchAttendanceTrends(params),
                fetchDepartmentAnalytics(params),
                fetchStationAnalytics(params),
                fetchLateArrivalAnalytics(params),
                fetchEarlyDepartureAnalytics(params),
                fetchAbsenteeismAnalytics(params),
                fetchComplianceAnalytics(params),
                fetchBiometricAnalytics(params),
                fetchOutsideClockingAnalytics(params),
                fetchWorkforceAnalytics(params),
                fetchProductivityAnalytics(params),
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
            setEarlyAnalytics(earlyResult.status === "fulfilled" ? earlyResult.value || {} : {});
            setAbsenteeismAnalytics(absenteeismResult.status === "fulfilled" ? absenteeismResult.value || {} : {});
            setComplianceAnalytics(complianceResult.status === "fulfilled" ? complianceResult.value || {} : {});
            setBiometricAnalytics(biometricResult.status === "fulfilled" ? biometricResult.value || {} : {});
            setOutsideClockingAnalytics(outsideClockingResult.status === "fulfilled" ? outsideClockingResult.value || [] : []);
            setWorkforceAnalytics(workforceResult.status === "fulfilled" ? workforceResult.value || {} : {});
            setProductivityAnalytics(productivityResult.status === "fulfilled" ? productivityResult.value || [] : []);
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

    const punctualityDistribution = useMemo(
        () =>
            withChartColors(
                [
                    { name: "On Time", value: onTimeToday, color: theme.success },
                    { name: "Late", value: lateToday, color: theme.warning },
                ],
                theme
            ),
        [lateToday, onTimeToday, theme]
    );

    const complianceDistribution = useMemo(() => {
        const missingIn = Number(complianceAnalytics?.totalMissingClockIns || 0);
        const missingOut = Number(complianceAnalytics?.totalMissingClockOuts || 0);
        const expectedSessions = Math.max(Number(kpis?.totalEmployees || 0) * Math.max(chartData.length, 1), missingIn + missingOut);
        const completed = Math.max(expectedSessions - missingIn - missingOut, 0);

        return withChartColors(
            [
                { name: "Complete Records", value: completed, color: theme.success },
                { name: "Missing Clock In", value: missingIn, color: theme.danger },
                { name: "Missing Clock Out", value: missingOut, color: theme.warning },
            ],
            theme
        );
    }, [chartData.length, complianceAnalytics, kpis, theme]);

    const biometricDistribution = useMemo(() => {
        const enrolled = Number(biometricAnalytics?.usersWithBiometric || 0);
        const total = Math.max(Number(kpis?.totalEmployees || 0), enrolled);

        return withChartColors(
            [
                { name: "Biometric Registered", value: enrolled, color: theme.success },
                { name: "Pending Registration", value: Math.max(total - enrolled, 0), color: theme.warning },
            ],
            theme
        );
    }, [biometricAnalytics, kpis, theme]);

    const deviceHealthDistribution = useMemo(
        () =>
            withChartColors(
                [
                    { name: "Active Devices", value: Number(biometricAnalytics?.activeDevices || 0), color: theme.success },
                    { name: "Inactive Devices", value: Number(biometricAnalytics?.inactiveDevices || 0), color: theme.danger },
                    { name: "Lost Devices", value: Number(biometricAnalytics?.lostDevices || 0), color: theme.warning },
                ],
                theme
            ),
        [biometricAnalytics, theme]
    );

    const sortedStations = useMemo(
        () => sortAnalyticsRows(filterByPerformanceBand(stations, filters.performanceBand), filters.sortBy),
        [filters.performanceBand, filters.sortBy, stations]
    );

    const sortedDepartments = useMemo(
        () => sortAnalyticsRows(filterByPerformanceBand(departments, filters.performanceBand), filters.sortBy),
        [departments, filters.performanceBand, filters.sortBy]
    );

    const stationShareData = useMemo(
        () =>
            withChartColors(
                topWithOthers(
                    sortedStations.map((station) => ({
                        name: station.station || "Unassigned",
                        value: Number(station.staffCount || 0),
                    }))
                ),
                theme
            ),
        [sortedStations, theme]
    );

    const departmentShareData = useMemo(
        () =>
            withChartColors(
                topWithOthers(
                    sortedDepartments.map((department) => ({
                        name: department.department || "Unassigned",
                        value: Number(department.staffCount || 0),
                    }))
                ),
                theme
            ),
        [sortedDepartments, theme]
    );

    const absenteeismDistribution = useMemo(
        () =>
            withChartColors(
                topWithOthers(
                    sortedDepartments
                        .map((department) => ({
                            name: department.department || "Unassigned",
                            value: Number(department.absentDays || 0),
                        }))
                        .sort((a, b) => b.value - a.value)
                ),
                theme
            ),
        [sortedDepartments, theme]
    );

    const latenessByDepartment = useMemo(() => {
        const apiRows = Array.isArray(lateAnalytics?.lateByDepartment) ? lateAnalytics.lateByDepartment : [];
        const rows = apiRows.length
            ? apiRows.map((item) => ({
                department: item.department || item._id || "Unassigned",
                count: Number(item.count || item.totalLateCount || 0),
            }))
            : sortedDepartments.map((department) => ({
                department: department.department || "Unassigned",
                count: Number(department.totalLateCount || 0),
            }));

        return rows.filter((item) => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 8);
    }, [lateAnalytics, sortedDepartments]);

    const earlyDepartureByDepartment = useMemo(() => {
        const rows = Array.isArray(earlyAnalytics?.earlyByDepartment) ? earlyAnalytics.earlyByDepartment : [];
        return rows
            .map((item) => ({
                department: item.department || item._id || "Unassigned",
                count: Number(item.count || 0),
            }))
            .filter((item) => item.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
    }, [earlyAnalytics]);

    const outsideClockingDistribution = useMemo(() => {
        const rows = Array.isArray(outsideClockingAnalytics) ? outsideClockingAnalytics : [];
        const outsideCount = rows.length || Number(workforceAnalytics?.outsideClocking?.length || 0);
        const present = Number(kpis?.presentToday || 0);

        return withChartColors(
            [
                { name: "Inside Premise", value: Math.max(present - outsideCount, 0), color: theme.success },
                { name: "Outside Clocking", value: outsideCount, color: theme.secondary },
            ],
            theme
        );
    }, [kpis, outsideClockingAnalytics, theme, workforceAnalytics]);

    const osDistribution = useMemo(
        () =>
            withChartColors(
                topWithOthers(
                    (biometricAnalytics?.osDistribution || []).map((item) => ({
                        name: item._id || "Unknown OS",
                        value: Number(item.count || 0),
                    }))
                ),
                theme
            ),
        [biometricAnalytics, theme]
    );

    const topEmployeesByStation = useMemo(
        () =>
            sortedStations.map((station) => ({
                station: station.station || "Unassigned",
                employees: (station.topPerformers || []).slice(0, 3).map((employee) => ({
                    ...employee,
                    name: employee.name || employee.email,
                    station: employee.station || station.station || "Unassigned",
                    department: employee.department || "Unassigned",
                    attendanceRate: Number(employee.attendanceRate ?? station.attendanceRate ?? 0),
                    presentDays: Number(employee.presentDays || 0),
                    hours: Number(employee.hours || 0),
                })),
            })),
        [sortedStations]
    );

    const overallTopEmployees = useMemo(() => {
        const employeesByEmail = new Map();

        topEmployeesByStation.forEach((stationGroup) => {
            stationGroup.employees.forEach((employee) => {
                const key = String(employee.email || `${employee.station}-${employee.name}`).toLowerCase();
                const existing = employeesByEmail.get(key);
                if (!existing || Number(employee.attendanceRate || 0) > Number(existing.attendanceRate || 0)) {
                    employeesByEmail.set(key, employee);
                }
            });
        });

        return [...employeesByEmail.values()]
            .sort((a, b) => {
                const rateDiff = Number(b.attendanceRate || 0) - Number(a.attendanceRate || 0);
                if (rateDiff !== 0) return rateDiff;
                const daysDiff = Number(b.presentDays || 0) - Number(a.presentDays || 0);
                if (daysDiff !== 0) return daysDiff;
                return Number(b.hours || 0) - Number(a.hours || 0);
            })
            .slice(0, 3);
    }, [topEmployeesByStation]);

    const topStation = sortedStations[0];
    const lowestStation = [...sortedStations].reverse()[0];
    const topDepartment = sortedDepartments[0];
    const attentionCount = Number(kpis?.absentToday || 0) + lateToday;
    const earlyDepartureCount = Number(earlyAnalytics?.employeesLeavingEarly || 0);
    const missingRecords = Number(complianceAnalytics?.totalMissingClockIns || 0) + Number(complianceAnalytics?.totalMissingClockOuts || 0);
    const averageAbsenteeismRate = Number(absenteeismAnalytics?.averageAbsenteeismRate ?? kpis?.absenteeismRate ?? 0);
    const outsideClockingCount = Array.isArray(outsideClockingAnalytics) ? outsideClockingAnalytics.length : 0;
    const topPerformer = Array.isArray(productivityAnalytics) ? productivityAnalytics[0] : null;

    const handleFilterChange = (field) => (event) => {
        setFilters((previous) => ({
            ...previous,
            [field]: event.target.value,
            ...(field === "startDate" || field === "endDate" ? { quickRange: "custom" } : {}),
        }));
    };

    const handleQuickRangeChange = (event) => {
        const value = event.target.value;
        const selectedRange = quickRanges.find((range) => range.value === value);

        setFilters((previous) => ({
            ...previous,
            quickRange: value,
            ...(selectedRange
                ? {
                    startDate: selectedRange.startDate(),
                    endDate: selectedRange.endDate(),
                }
                : {}),
        }));
    };

    const clearFilters = () => {
        setFilters({
            startDate: getMonthStart(),
            endDate: getDateInputValue(),
            station: "",
            department: "",
            staffFilter: "",
            quickRange: "month",
            performanceBand: "",
            sortBy: "attendance-desc",
            trendMetric: "all",
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
                        onClick={() => exportCsv({
                            kpis,
                            stations: sortedStations,
                            departments: sortedDepartments,
                            filters,
                            overallTopEmployees,
                            topEmployeesByStation,
                        })}
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
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, minmax(220px, 1fr))",
                                lg: "repeat(4, minmax(220px, 1fr))",
                            },
                            gap: 1.5,
                            alignItems: "center",
                        }}
                    >
                        <Box>
                            <FormControl fullWidth size="small">
                                <InputLabel shrink>Period</InputLabel>
                                <Select
                                    value={filters.quickRange}
                                    label="Period"
                                    onChange={handleQuickRangeChange}
                                    displayEmpty
                                    renderValue={(selected) => quickRanges.find((range) => range.value === selected)?.label || "Custom Period"}
                                >
                                    {quickRanges.map((range) => (
                                        <MenuItem key={range.value} value={range.value}>
                                            {range.label}
                                        </MenuItem>
                                    ))}
                                    <MenuItem value="custom">Custom Period</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box>
                            <TextField
                                fullWidth
                                size="small"
                                type="date"
                                label="From"
                                value={filters.startDate}
                                onChange={handleFilterChange("startDate")}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>
                        <Box>
                            <TextField
                                fullWidth
                                size="small"
                                type="date"
                                label="To"
                                value={filters.endDate}
                                onChange={handleFilterChange("endDate")}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>
                        <Box>
                            <FormControl fullWidth size="small">
                                <InputLabel shrink>Station</InputLabel>
                                <Select
                                    value={filters.station}
                                    label="Station"
                                    onChange={handleFilterChange("station")}
                                    displayEmpty
                                    renderValue={(selected) => selected || "All Stations"}
                                >
                                    <MenuItem value="">All Stations</MenuItem>
                                    {filterOptions.stations.map((station) => (
                                        <MenuItem key={station} value={station}>
                                            {station}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box>
                            <FormControl fullWidth size="small">
                                <InputLabel shrink>Department</InputLabel>
                                <Select
                                    value={filters.department}
                                    label="Department"
                                    onChange={handleFilterChange("department")}
                                    displayEmpty
                                    renderValue={(selected) => selected || "All Departments"}
                                >
                                    <MenuItem value="">All Departments</MenuItem>
                                    {filterOptions.departments.map((department) => (
                                        <MenuItem key={department} value={department}>
                                            {department}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box>
                            <FormControl fullWidth size="small">
                                <InputLabel shrink>Staff Type / Rank</InputLabel>
                                <Select
                                    value={filters.staffFilter}
                                    label="Staff Type / Rank"
                                    onChange={handleFilterChange("staffFilter")}
                                    displayEmpty
                                    renderValue={(selected) => staffFilters.find((item) => item.value === selected)?.label || "All"}
                                >
                                    {staffFilters.map((item) => (
                                        <MenuItem key={item.value || "all"} value={item.value}>
                                            {item.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box>
                            <FormControl fullWidth size="small">
                                <InputLabel shrink>Performance Band</InputLabel>
                                <Select
                                    value={filters.performanceBand}
                                    label="Performance Band"
                                    onChange={handleFilterChange("performanceBand")}
                                    displayEmpty
                                    renderValue={(selected) => performanceBands.find((band) => band.value === selected)?.label || "All Performance"}
                                >
                                    {performanceBands.map((band) => (
                                        <MenuItem key={band.value || "all"} value={band.value}>
                                            {band.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box>
                            <FormControl fullWidth size="small">
                                <InputLabel shrink>Sort View</InputLabel>
                                <Select
                                    value={filters.sortBy}
                                    label="Sort View"
                                    onChange={handleFilterChange("sortBy")}
                                    displayEmpty
                                    renderValue={(selected) => sortOptions.find((option) => option.value === selected)?.label || "Attendance High-Low"}
                                >
                                    {sortOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box>
                            <FormControl fullWidth size="small">
                                <InputLabel shrink>Trend Focus</InputLabel>
                                <Select
                                    value={filters.trendMetric}
                                    label="Trend Focus"
                                    onChange={handleFilterChange("trendMetric")}
                                    displayEmpty
                                    renderValue={(selected) => trendMetricOptions.find((option) => option.value === selected)?.label || "Present, Absent, Late"}
                                >
                                    {trendMetricOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ justifySelf: { xs: "stretch", lg: "end" } }}>
                            <Stack direction="row" justifyContent={{ xs: "flex-start", md: "flex-end" }} spacing={1}>
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
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                <Grid item xs={6} sm={4} lg={2}>
                    <StatCard title="Total Staff" value={formatNumber(kpis?.totalEmployees)} subtitle="Active workforce in scope" icon={<GroupsRounded />} tone={theme.secondary} theme={theme} />
                </Grid>
                <Grid item xs={6} sm={4} lg={2}>
                    <StatCard title="Present" value={formatNumber(kpis?.presentToday)} subtitle="Clocked in today" icon={<CheckCircleRounded />} tone={theme.success} theme={theme} />
                </Grid>
                <Grid item xs={6} sm={4} lg={2}>
                    <StatCard title="Absent" value={formatNumber(kpis?.absentToday)} subtitle="No attendance record today" icon={<WarningAmberRounded />} tone={theme.danger} theme={theme} />
                </Grid>
                <Grid item xs={6} sm={4} lg={2}>
                    <StatCard title="On Leave" value={formatNumber(kpis?.onLeaveToday)} subtitle="Approved leave today" icon={<EventAvailableRounded />} tone={theme.warning} theme={theme} />
                </Grid>
                <Grid item xs={6} sm={4} lg={2}>
                    <StatCard title="Late" value={formatNumber(lateToday)} subtitle="Arrived after grace period" icon={<HourglassBottomRounded />} tone={theme.purple} theme={theme} />
                </Grid>
                <Grid item xs={6} sm={4} lg={2}>
                    <StatCard title="Attendance Rate" value={formatPercent(kpis?.attendanceRate)} subtitle={formatRangeLabel(filters.startDate, filters.endDate)} icon={<PieChartRounded />} tone={theme.secondary} theme={theme} />
                </Grid>
                <Grid item xs={6} sm={4} lg={2}>
                    <StatCard title="Punctuality" value={formatPercent(kpis?.punctualityRate)} subtitle="On-time share of present staff" icon={<CheckCircleRounded />} tone={theme.success} theme={theme} />
                </Grid>
                <Grid item xs={6} sm={4} lg={2}>
                    <StatCard title="Absenteeism" value={formatPercent(averageAbsenteeismRate)} subtitle="Average absence exposure" icon={<TrendingDownRounded />} tone={theme.danger} theme={theme} />
                </Grid>
                <Grid item xs={6} sm={4} lg={2}>
                    <StatCard title="Early Departures" value={formatNumber(earlyDepartureCount)} subtitle="Clock-outs before target hours" icon={<HourglassBottomRounded />} tone={theme.warning} theme={theme} />
                </Grid>
                <Grid item xs={6} sm={4} lg={2}>
                    <StatCard title="Incomplete Records" value={formatNumber(missingRecords)} subtitle="Missing clock-in or clock-out" icon={<WarningAmberRounded />} tone={theme.danger} theme={theme} />
                </Grid>
                <Grid item xs={6} sm={4} lg={2}>
                    <StatCard title="Outside Clocking" value={formatNumber(outsideClockingCount)} subtitle="Approved off-premise records" icon={<ShieldRounded />} tone={theme.secondary} theme={theme} />
                </Grid>
                <Grid item xs={6} sm={4} lg={2}>
                    <StatCard title="Biometric Rate" value={formatPercent(biometricAnalytics?.enrollmentRate)} subtitle="Registered biometric coverage" icon={<ShieldRounded />} tone={theme.accent} theme={theme} />
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} lg={4}>
                    <SectionCard title="Overall Top 3 Employees" subtitle="Highest attendance rate across all stations" theme={theme}>
                        <EmployeeRankList
                            rows={overallTopEmployees}
                            theme={theme}
                            emptyLabel="No employee ranking data available."
                        />
                        <InsightNote theme={theme} tone={theme.success}>
                            This view recognises consistent attendance across the selected period, with present days used to break close ties.
                        </InsightNote>
                    </SectionCard>
                </Grid>
                <Grid item xs={12} lg={8}>
                    <SectionCard title="Top 3 Employees by Station" subtitle="Station leaders by attendance rate" theme={theme}>
                        {topEmployeesByStation.length ? (
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "1fr",
                                        md: "repeat(2, minmax(260px, 1fr))",
                                        xl: "repeat(3, minmax(260px, 1fr))",
                                    },
                                    gap: 1.5,
                                }}
                            >
                                {topEmployeesByStation.map((stationGroup) => (
                                    <Box
                                        key={stationGroup.station}
                                        sx={{
                                            p: 1.4,
                                            borderRadius: "8px",
                                            border: `1px solid ${theme.border}`,
                                            bgcolor: "#fff",
                                            minWidth: 0,
                                        }}
                                    >
                                        <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                            <Typography sx={{ fontSize: 12, fontWeight: 900, color: theme.text, overflowWrap: "anywhere" }}>
                                                {stationGroup.station}
                                            </Typography>
                                            <Chip
                                                size="small"
                                                label="Top 3"
                                                sx={{
                                                    height: 24,
                                                    borderRadius: "8px",
                                                    bgcolor: `${theme.secondary}12`,
                                                    color: theme.secondary,
                                                    fontWeight: 900,
                                                }}
                                            />
                                        </Stack>
                                        <EmployeeRankList
                                            rows={stationGroup.employees}
                                            theme={theme}
                                            emptyLabel="No ranked employees for this station."
                                        />
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <EmptyState label="No station employee ranking data available." theme={theme} />
                        )}
                        <InsightNote theme={theme}>
                            Station-level top 3 lists help management recognise strong attendance locally without comparing small and large stations unfairly.
                        </InsightNote>
                    </SectionCard>
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} lg={6}>
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
                                        <YAxis
                                            tick={{ fontSize: 10, fill: theme.muted }}
                                            allowDecimals={false}
                                            domain={filters.trendMetric === "attendance" ? [0, 100] : undefined}
                                            tickFormatter={filters.trendMetric === "attendance" ? (value) => `${value}%` : undefined}
                                        />
                                        <RechartsTooltip />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                                        {(filters.trendMetric === "all" || filters.trendMetric === "present") && (
                                            <Line type="monotone" dataKey="present" name="Present" stroke={theme.success} strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                                        )}
                                        {(filters.trendMetric === "all" || filters.trendMetric === "risk") && (
                                            <Line type="monotone" dataKey="absent" name="Absent" stroke={theme.danger} strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                                        )}
                                        {(filters.trendMetric === "all" || filters.trendMetric === "risk") && (
                                            <Line type="monotone" dataKey="late" name="Late" stroke={theme.purple} strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                                        )}
                                        {filters.trendMetric === "attendance" && (
                                            <Line type="monotone" dataKey="attendance" name="Attendance Rate" stroke={theme.secondary} strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                                        )}
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState label="No attendance trend data available." theme={theme} />
                            )}
                        </Box>
                        <InsightNote theme={theme}>
                            Use this to see whether attendance pressure is occasional or persistent across the selected period.
                        </InsightNote>
                    </SectionCard>
                </Grid>

                <Grid item xs={12} md={6} lg={3}>
                    <SectionCard title="Attendance Distribution" subtitle="Today by attendance state" theme={theme}>
                        <DonutVisualization
                            data={distribution}
                            theme={theme}
                            centerValue={formatNumber(kpis?.totalEmployees)}
                            centerLabel="Total Staff"
                            height={295}
                        />
                        <Box sx={{ mt: -0.5, py: 1, px: 1.5, borderRadius: "8px", bgcolor: `${theme.success}14`, textAlign: "center" }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 900, color: theme.success }}>
                                Attendance Rate: {formatPercent(kpis?.attendanceRate)}
                            </Typography>
                        </Box>
                        <InsightNote theme={theme}>
                            This separates today&apos;s workforce into present, absent, late and approved leave for quick staffing decisions.
                        </InsightNote>
                    </SectionCard>
                </Grid>

                <Grid item xs={12} md={6} lg={3}>
                    <SectionCard title="Attendance by Station" subtitle="Station performance after selected filters" theme={theme}>
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
                        <InsightNote theme={theme}>
                            Station ranking helps leadership spot whether a challenge is local to one site or shared across the organisation.
                        </InsightNote>
                    </SectionCard>
                </Grid>
            </Grid>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(260px, 1fr))",
                        lg: "repeat(3, minmax(0, 1fr))",
                    },
                    gap: 2,
                    mb: 2,
                    alignItems: "stretch",
                }}
            >
                <Box sx={{ minWidth: 0 }}>
                    <SectionCard title="Punctuality Split" subtitle="On-time arrivals compared with late arrivals" theme={theme}>
                        <DonutVisualization
                            data={punctualityDistribution}
                            theme={theme}
                            centerValue={formatPercent(kpis?.punctualityRate)}
                            centerLabel="Punctuality"
                        />
                        <InsightNote theme={theme} tone={theme.success}>
                            A narrowing on-time segment signals morning arrival risk even when the attendance rate looks healthy.
                        </InsightNote>
                    </SectionCard>
                </Box>

                <Box sx={{ minWidth: 0 }}>
                    <SectionCard title="Record Compliance" subtitle="Complete biometric sessions versus missing actions" theme={theme}>
                        <DonutVisualization
                            data={complianceDistribution}
                            theme={theme}
                            centerValue={formatNumber(missingRecords)}
                            centerLabel="Missing"
                        />
                        <InsightNote theme={theme} tone={missingRecords ? theme.warning : theme.success}>
                            Missing clock-ins or clock-outs are the records most likely to need HR follow-up before payroll reporting.
                        </InsightNote>
                    </SectionCard>
                </Box>

                <Box sx={{ minWidth: 0 }}>
                    <SectionCard title="Outside Clocking Split" subtitle="Premise-based and approved off-premise records" theme={theme}>
                        <DonutVisualization
                            data={outsideClockingDistribution}
                            theme={theme}
                            centerValue={formatNumber(outsideClockingCount)}
                            centerLabel="Outside"
                        />
                        <InsightNote theme={theme}>
                            Use this to confirm whether remote clocking approvals are exceptional or becoming a normal attendance channel.
                        </InsightNote>
                    </SectionCard>
                </Box>

                <Box sx={{ minWidth: 0 }}>
                    <SectionCard title="Staff by Station" subtitle="Workforce concentration across stations" theme={theme}>
                        <DonutVisualization
                            data={stationShareData}
                            theme={theme}
                            centerValue={formatNumber(getTotalValue(stationShareData))}
                            centerLabel="Staff"
                        />
                        <InsightNote theme={theme}>
                            Larger station slices show where attendance changes have the biggest operational impact.
                        </InsightNote>
                    </SectionCard>
                </Box>

                <Box sx={{ minWidth: 0 }}>
                    <SectionCard title="Staff by Department" subtitle="Department workforce distribution" theme={theme}>
                        <DonutVisualization
                            data={departmentShareData}
                            theme={theme}
                            centerValue={formatNumber(getTotalValue(departmentShareData))}
                            centerLabel="Staff"
                        />
                        <InsightNote theme={theme}>
                            This shows where staffing weight sits, so attendance rates can be judged against department size.
                        </InsightNote>
                    </SectionCard>
                </Box>

                <Box sx={{ minWidth: 0 }}>
                    <SectionCard title="Absenteeism Pressure" subtitle="Absent days by department" theme={theme}>
                        <DonutVisualization
                            data={absenteeismDistribution}
                            theme={theme}
                            centerValue={formatPercent(averageAbsenteeismRate)}
                            centerLabel="Avg Rate"
                        />
                        <InsightNote theme={theme} tone={averageAbsenteeismRate > 10 ? theme.danger : theme.secondary}>
                            High slices identify departments where absence concentration may affect service continuity.
                        </InsightNote>
                    </SectionCard>
                </Box>

                <Box sx={{ minWidth: 0 }}>
                    <SectionCard title="Biometric Enrollment" subtitle="Registered users compared with pending registrations" theme={theme}>
                        <DonutVisualization
                            data={biometricDistribution}
                            theme={theme}
                            centerValue={formatPercent(biometricAnalytics?.enrollmentRate)}
                            centerLabel="Enrolled"
                        />
                        <InsightNote theme={theme}>
                            Enrollment gaps point to users who may experience clocking delays or need device support.
                        </InsightNote>
                    </SectionCard>
                </Box>

                <Box sx={{ minWidth: 0 }}>
                    <SectionCard title="Device Health" subtitle="Active, inactive, and lost biometric devices" theme={theme}>
                        <DonutVisualization
                            data={deviceHealthDistribution}
                            theme={theme}
                            centerValue={formatPercent(biometricAnalytics?.deviceUptime)}
                            centerLabel="Uptime"
                        />
                        <InsightNote theme={theme} tone={theme.warning}>
                            Inactive or lost devices can explain slow verification, repeated registration attempts, and support escalations.
                        </InsightNote>
                    </SectionCard>
                </Box>

                <Box sx={{ minWidth: 0 }}>
                    <SectionCard title="Device Operating Systems" subtitle="OS distribution from registered devices" theme={theme}>
                        <DonutVisualization
                            data={osDistribution}
                            theme={theme}
                            centerValue={formatNumber(getTotalValue(osDistribution))}
                            centerLabel="Devices"
                        />
                        <InsightNote theme={theme}>
                            Device mix helps IT prioritise Android, iOS, or desktop biometric support where staff actually clock.
                        </InsightNote>
                    </SectionCard>
                </Box>
            </Box>

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
                        <InsightNote theme={theme}>
                            Department rows combine attendance, absence, leave and lateness so HR can separate staffing gaps from discipline or support issues.
                        </InsightNote>
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
                            <Grid item xs={12}>
                                <Box sx={{ p: 1.4, borderRadius: "8px", bgcolor: `${theme.secondary}10`, border: `1px solid ${theme.secondary}22` }}>
                                    <Typography sx={{ fontSize: 10, fontWeight: 900, color: theme.secondary }}>Current Top Performer</Typography>
                                    <Typography sx={{ mt: 0.5, fontSize: 13, fontWeight: 900, color: theme.text, overflowWrap: "anywhere" }}>
                                        {topPerformer?.name || topPerformer?.email || "N/A"}
                                    </Typography>
                                    <Typography sx={{ fontSize: 10, color: theme.muted, fontWeight: 700, overflowWrap: "anywhere" }}>
                                        {topPerformer?.department || "No productivity ranking available for this period"}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                        <InsightNote theme={theme}>
                            These highlights are designed for fast exception review: best areas, weakest areas, and staff groups needing immediate attention.
                        </InsightNote>
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
                        <InsightNote theme={theme}>
                            Use this comparison to see whether a department is consistently healthy or only strong because of its size.
                        </InsightNote>
                    </SectionCard>
                </Grid>
                <Grid item xs={12} lg={4}>
                    <SectionCard title="Summary" subtitle="Selected period snapshot" theme={theme}>
                        <Stack spacing={1.2}>
                            {[
                                ["Scope", filters.station || filters.department || "All Stations and Departments"],
                                ["Staff Type / Rank", staffFilters.find((item) => item.value === filters.staffFilter)?.label || "All"],
                                ["Period", quickRanges.find((item) => item.value === filters.quickRange)?.label || "Custom Period"],
                                ["Performance Band", performanceBands.find((item) => item.value === filters.performanceBand)?.label || "All Performance"],
                                ["Punctuality Rate", formatPercent(kpis?.punctualityRate)],
                                ["Absenteeism Rate", formatPercent(kpis?.absenteeismRate)],
                                ["Productivity Index", formatPercent(kpis?.productivityIndex)],
                                ["Device Uptime", formatPercent(biometricAnalytics?.deviceUptime)],
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

            <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} lg={6}>
                    <SectionCard title="Lateness Concentration" subtitle="Departments with the highest late-arrival counts" theme={theme}>
                        <Box sx={{ height: 300 }}>
                            {latenessByDepartment.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={latenessByDepartment} margin={{ top: 8, right: 10, left: -20, bottom: 42 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.16)" />
                                        <XAxis dataKey="department" tick={{ fontSize: 10, fill: theme.muted }} interval={0} angle={-20} textAnchor="end" height={64} />
                                        <YAxis tick={{ fontSize: 10, fill: theme.muted }} allowDecimals={false} />
                                        <RechartsTooltip formatter={(value) => [formatNumber(value), "Late arrivals"]} />
                                        <Bar dataKey="count" name="Late Arrivals" radius={[6, 6, 0, 0]} fill={theme.warning} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState label="No lateness concentration data available." theme={theme} />
                            )}
                        </Box>
                        <InsightNote theme={theme} tone={theme.warning}>
                            Concentrated lateness may point to transport timing, shift alignment, or team-level supervision issues.
                        </InsightNote>
                    </SectionCard>
                </Grid>

                <Grid item xs={12} lg={6}>
                    <SectionCard title="Early Departure Concentration" subtitle="Departments with clock-outs before expected completion" theme={theme}>
                        <Box sx={{ height: 300 }}>
                            {earlyDepartureByDepartment.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={earlyDepartureByDepartment} margin={{ top: 8, right: 10, left: -20, bottom: 42 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.16)" />
                                        <XAxis dataKey="department" tick={{ fontSize: 10, fill: theme.muted }} interval={0} angle={-20} textAnchor="end" height={64} />
                                        <YAxis tick={{ fontSize: 10, fill: theme.muted }} allowDecimals={false} />
                                        <RechartsTooltip formatter={(value) => [formatNumber(value), "Early departures"]} />
                                        <Bar dataKey="count" name="Early Departures" radius={[6, 6, 0, 0]} fill={theme.purple} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState label="No early departure data available." theme={theme} />
                            )}
                        </Box>
                        <InsightNote theme={theme} tone={theme.purple}>
                            Early departure concentration helps HR distinguish workload coverage gaps from isolated employee events.
                        </InsightNote>
                    </SectionCard>
                </Grid>
            </Grid>
        </Box>
    );
};

export default OrganisationStats;
