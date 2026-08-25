import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
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
    TablePagination,
    TableRow,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    AssessmentRounded,
    ChevronLeftRounded,
    ChevronRightRounded,
    CheckCircleRounded,
    DownloadRounded,
    EventAvailableRounded,
    GroupsRounded,
    HelpOutlineRounded,
    HistoryRounded,
    HourglassBottomRounded,
    InsightsRounded,
    PieChartRounded,
    RefreshRounded,
    ShieldRounded,
    TableChartRounded,
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
import QRCode from "qrcode";

import {
    fetchAbsenteeismAnalytics,
    fetchAnalyticsKPIs,
    fetchAttendanceTrends,
    fetchBiometricAnalytics,
    fetchComplianceAnalytics,
    fetchDepartmentAnalytics,
    fetchEarlyDepartureAnalytics,
    fetchOverallAttendanceRecords,
    fetchOverallAttendanceSummary,
    fetchLateArrivalAnalytics,
    fetchOutsideClockingAnalytics,
    fetchProductivityAnalytics,
    fetchStationAnalytics,
    fetchWorkforceAnalytics,
} from "../../service/ClockingService";
import KMFRILogo from "../../images/kmfri_logo.png";
import * as SuperadminAPI from "../../service/SuperadminService";
import { createExportVerification, updateExportVerificationContent } from "../../service/VerificationService";
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
const chartMinWidth = (length, itemWidth = 96, minWidth = 720) => Math.max(minWidth, Number(length || 0) * itemWidth);
const formatDelta = (value, suffix = "%") => {
    const numeric = Number(value || 0);
    if (!Number.isFinite(numeric) || numeric === 0) return `0${suffix}`;
    return `${numeric > 0 ? "+" : ""}${numeric.toFixed(1)}${suffix}`;
};

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

const normalizeStationAccessName = (value = "") =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/\bcenter\b/g, "centre");

const isMombasaCentreStation = (value) => normalizeStationAccessName(value) === "mombasa centre";

const formatDateTime = (value, options = {}) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleString("en-KE", {
        timeZone: EAT_TIMEZONE,
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        ...options,
    });
};

const formatTime = (value) => {
    if (!value) return "System";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleTimeString("en-KE", {
        timeZone: EAT_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatLocationLabel = (record, isEntry) => {
    const locationName = isEntry ? record.clockInLocationName : record.clockOutLocationName;
    const withinPremise = isEntry ? record.clockInWithinPremise : record.clockOutWithinPremise;
    const offPremise = record?.clockedOutside || record?.clockedOutSide || locationName;

    if (withinPremise === true) return "In Premise";
    if (!locationName) return withinPremise === false || offPremise ? "Off Premise" : "In Premise";

    const parts = String(locationName).split("|").map((part) => part.trim()).filter(Boolean);
    const cleanParts = parts.filter((part) => !/^(UNKNOWN\s+SUB[-\s]?COUNTY|UNKNOWN\s+WARD)$/i.test(part));
    return cleanParts.length ? cleanParts.join(" | ") : "Off Premise";
};

const compactTitleCase = (value) => {
    if (value == null || value === "") return "N/A";
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/\w\S*/g, (text) => text.charAt(0).toUpperCase() + text.slice(1));
};

const getTotalDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(`${startDate}T00:00:00+03:00`);
    const end = new Date(`${endDate}T00:00:00+03:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return 0;
    return Math.floor((end - start) / 86400000) + 1;
};

const getWorkingDays = (startDate, endDate) => {
    const totalDays = getTotalDays(startDate, endDate);
    if (!totalDays) return 0;

    const cursor = new Date(`${startDate}T00:00:00+03:00`);
    let count = 0;
    for (let index = 0; index < totalDays; index += 1) {
        const day = cursor.getDay();
        if (day !== 0 && day !== 6) count += 1;
        cursor.setDate(cursor.getDate() + 1);
    }
    return count;
};

const shiftDateInput = (value, days) => {
    if (!value) return "";
    const date = new Date(`${value}T00:00:00+03:00`);
    if (Number.isNaN(date.getTime())) return "";
    date.setDate(date.getDate() + days);
    return getDateInputValue(date);
};

const getPreviousPeriodFilters = (filters) => {
    const days = getTotalDays(filters.startDate, filters.endDate);
    if (!days) return filters;

    const previousEndDate = shiftDateInput(filters.startDate, -1);
    const previousStartDate = shiftDateInput(previousEndDate, -(days - 1));

    return {
        ...filters,
        startDate: previousStartDate,
        endDate: previousEndDate,
        quickRange: "custom",
    };
};

const humanizeFilterValue = (value) => {
    if (!value) return "All";
    return titleCase(value);
};

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

const OverviewMetricCard = ({ title, value, subtitle, icon, tone, delta, deltaLabel, theme }) => {
    const deltaValue = Number(delta || 0);
    const deltaTone = deltaValue >= 0 ? theme.success : theme.danger;

    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                border: `1px solid ${theme.border}`,
                borderRadius: "8px",
                background: theme.white,
            }}
        >
            <CardContent sx={{ p: 1.5 }}>
                <Stack direction="row" spacing={1.2} alignItems="center">
                    <Box
                        sx={{
                            width: 38,
                            height: 38,
                            borderRadius: "8px",
                            bgcolor: `${tone}14`,
                            color: tone,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        {icon}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 900, color: theme.primary, letterSpacing: 0 }}>
                            {title}
                        </Typography>
                        <Typography sx={{ mt: 0.25, fontSize: { xs: 22, md: 24 }, fontWeight: 950, color: theme.text, lineHeight: 1 }}>
                            {value}
                        </Typography>
                        <Typography sx={{ mt: 0.45, fontSize: 10, fontWeight: 800, color: tone, overflowWrap: "anywhere" }}>
                            {subtitle}
                        </Typography>
                        {delta !== undefined && (
                            <Typography sx={{ mt: 0.35, fontSize: 10, color: deltaTone, fontWeight: 900 }}>
                                {formatDelta(delta)} {deltaLabel}
                            </Typography>
                        )}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

const InsightTile = ({ label, value, subtitle, tone, theme, positive = true }) => (
    <Box
        sx={{
            p: 1.35,
            minHeight: 96,
            borderRadius: "8px",
            bgcolor: `${tone}10`,
            border: `1px solid ${tone}22`,
        }}
    >
        <Typography sx={{ fontSize: 10, fontWeight: 900, color: tone, letterSpacing: 0 }}>
            {label}
        </Typography>
        <Typography sx={{ mt: 0.35, fontSize: 13, fontWeight: 900, color: theme.text, overflowWrap: "anywhere" }}>
            {value}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.55 }}>
            {positive ? (
                <TrendingUpRounded sx={{ fontSize: 15, color: tone }} />
            ) : (
                <TrendingDownRounded sx={{ fontSize: 15, color: tone }} />
            )}
            <Typography sx={{ fontSize: 10, fontWeight: 900, color: tone, overflowWrap: "anywhere" }}>
                {subtitle}
            </Typography>
        </Stack>
    </Box>
);

const RecommendationCard = ({ title, label, detail, metric, tone, chip, progress, theme, positive = true }) => (
    <Box
        sx={{
            p: 1.45,
            minHeight: 132,
            borderRadius: "8px",
            bgcolor: `${tone}0F`,
            border: `1px solid ${tone}28`,
            display: "flex",
            flexDirection: "column",
            gap: 1,
        }}
    >
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
            <Chip
                size="small"
                label={chip}
                sx={{
                    height: 22,
                    borderRadius: "6px",
                    bgcolor: `${tone}18`,
                    color: tone,
                    fontSize: 10,
                    fontWeight: 950,
                    "& .MuiChip-label": { px: 0.9 },
                }}
            />
            {positive ? (
                <TrendingUpRounded sx={{ fontSize: 17, color: tone, flexShrink: 0 }} />
            ) : (
                <TrendingDownRounded sx={{ fontSize: 17, color: tone, flexShrink: 0 }} />
            )}
        </Stack>
        <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 950, color: tone, letterSpacing: 0 }}>
                {label}
            </Typography>
            <Typography sx={{ mt: 0.25, fontSize: 15, fontWeight: 950, color: theme.text, lineHeight: 1.2, overflowWrap: "anywhere" }}>
                {title}
            </Typography>
            <Typography sx={{ mt: 0.55, fontSize: 11, color: theme.muted, lineHeight: 1.45, overflowWrap: "anywhere" }}>
                {detail}
            </Typography>
        </Box>
        <Box sx={{ mt: "auto" }}>
            <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 0.45 }}>
                <Typography sx={{ fontSize: 10, fontWeight: 900, color: theme.muted }}>
                    Signal
                </Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 950, color: tone }}>
                    {metric}
                </Typography>
            </Stack>
            <LinearProgress
                variant="determinate"
                value={safePercent(progress)}
                sx={{
                    height: 6,
                    borderRadius: 999,
                    bgcolor: `${tone}18`,
                    "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: tone },
                }}
            />
        </Box>
    </Box>
);

const ScrollableChartFrame = ({ children, minWidth = 720, theme }) => (
    <Box sx={{ position: "relative" }}>
        <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            justifyContent="flex-end"
            sx={{ mb: 0.75, color: theme.muted }}
        >
            <ChevronLeftRounded sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: 10, fontWeight: 900 }}>Scroll</Typography>
            <ChevronRightRounded sx={{ fontSize: 16 }} />
        </Stack>
        <Box
            sx={{
                overflowX: "auto",
                overflowY: "hidden",
                scrollBehavior: "smooth",
                pb: 0.5,
                "&::-webkit-scrollbar": { height: 7 },
                "&::-webkit-scrollbar-track": { bgcolor: "rgba(100,116,139,0.10)", borderRadius: 8 },
                "&::-webkit-scrollbar-thumb": { bgcolor: `${theme.secondary}88`, borderRadius: 8 },
            }}
        >
            <Box sx={{ minWidth }}>
                {children}
            </Box>
        </Box>
    </Box>
);

const ChartReading = ({ items = [], theme }) => (
    <Box sx={{ mt: 1.2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1 }}>
        {items.map((item) => (
            <Box
                key={item.label}
                sx={{
                    p: 1,
                    borderRadius: "8px",
                    bgcolor: `${item.tone || theme.secondary}0F`,
                    border: `1px solid ${item.tone || theme.secondary}22`,
                }}
            >
                <Typography sx={{ fontSize: 10, fontWeight: 900, color: item.tone || theme.secondary }}>
                    {item.label}
                </Typography>
                <Typography sx={{ mt: 0.25, fontSize: 11, color: theme.muted, lineHeight: 1.4 }}>
                    {item.text}
                </Typography>
            </Box>
        ))}
    </Box>
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

const OrganisationStats = ({ user, readOnly = false }) => {
    const userRank = String(user?.rank || "").toLowerCase();
    const isSupervisorScope = userRank === "supervisor";
    const isHrScope = userRank === "hr";
    const isStationScopedHr = isHrScope && !isMombasaCentreStation(user?.station);
    const isFullHr = isHrScope && isMombasaCentreStation(user?.station);
    const supervisorStation = String(user?.station || "").trim();
    const supervisorDepartment = String(user?.department || "").trim();

    const defaultFilters = useMemo(() => ({
        startDate: getMonthStart(),
        endDate: getDateInputValue(),
        station: "",
        department: "",
        staffFilter: "",
        quickRange: "month",
        performanceBand: "",
        sortBy: "attendance-desc",
        trendMetric: "all",
    }), []);

    const [filters, setFilters] = useState(defaultFilters);
    const [draftFilters, setDraftFilters] = useState(defaultFilters);

    const [theme, setTheme] = useState(() => buildTheme());
    const [filterOptions, setFilterOptions] = useState(() => ({
        stations: uniqueValues(coreDataDetails.AvailableStations),
        departments: uniqueValues(coreDataDetails.availableDepartments),
    }));
    const [kpis, setKpis] = useState(null);
    const [previousKpis, setPreviousKpis] = useState(null);
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
    const [records, setRecords] = useState([]);
    const [summaryRows, setSummaryRows] = useState([]);
    const [referenceLoading, setReferenceLoading] = useState(false);
    const [referenceError, setReferenceError] = useState("");
    const [referenceSearch, setReferenceSearch] = useState("");
    const deferredReferenceSearch = useDeferredValue(referenceSearch);
    const [activeReportTab, setActiveReportTab] = useState("analytics");
    const [pdfExporting, setPdfExporting] = useState("");
    const [recordPage, setRecordPage] = useState(0);
    const [summaryPage, setSummaryPage] = useState(0);
    const [recordRowsPerPage, setRecordRowsPerPage] = useState(10);
    const [summaryRowsPerPage, setSummaryRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const effectiveFilters = useMemo(
        () => ({
            ...filters,
            ...(isSupervisorScope
                ? {
                    station: supervisorStation,
                    department: supervisorDepartment,
                }
                : isStationScopedHr
                    ? {
                        station: supervisorStation,
                    }
                : {}),
        }),
        [filters, isStationScopedHr, isSupervisorScope, supervisorDepartment, supervisorStation]
    );

    const effectiveDraftFilters = useMemo(
        () => ({
            ...draftFilters,
            ...(isSupervisorScope
                ? {
                    station: supervisorStation,
                    department: supervisorDepartment,
                }
                : isStationScopedHr
                    ? {
                        station: supervisorStation,
                    }
                : {}),
        }),
        [draftFilters, isStationScopedHr, isSupervisorScope, supervisorDepartment, supervisorStation]
    );

    const scopeLabel = useMemo(() => {
        if (isSupervisorScope) {
            const departmentLabel = supervisorDepartment || "Assigned department";
            const stationLabel = supervisorStation || "assigned station";
            return `${departmentLabel} / ${stationLabel}`;
        }
        if (isStationScopedHr) {
            return `${supervisorStation || "Assigned station"} HR scope`;
        }
        if (isFullHr) {
            return "Super HR - all stations";
        }
        if (userRank === "ceo") {
            return "CEO - all stations";
        }

        return effectiveFilters.station || effectiveFilters.department || "All Stations and Departments";
    }, [effectiveFilters.department, effectiveFilters.station, isFullHr, isStationScopedHr, isSupervisorScope, supervisorDepartment, supervisorStation, userRank]);

    const displayedFilterOptions = useMemo(() => ({
        stations: (isSupervisorScope || isStationScopedHr) ? [supervisorStation].filter(Boolean) : filterOptions.stations,
        departments: isSupervisorScope ? [supervisorDepartment].filter(Boolean) : filterOptions.departments,
    }), [filterOptions.departments, filterOptions.stations, isStationScopedHr, isSupervisorScope, supervisorDepartment, supervisorStation]);

    const params = useMemo(
        () => buildParams(effectiveFilters),
        [effectiveFilters]
    );

    const previousParams = useMemo(
        () => buildParams(getPreviousPeriodFilters(effectiveFilters)),
        [effectiveFilters]
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
                previousKpiResult,
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
                fetchAnalyticsKPIs(previousParams),
            ]);

            if (configResult.status === "fulfilled") {
                const config = configResult.value || {};
                applyPlatformConfigToCoreData(config);
                setTheme(buildTheme(config));
                setFilterOptions({
                    stations: (isSupervisorScope || isStationScopedHr)
                        ? [supervisorStation].filter(Boolean)
                        : uniqueValues(config.stations || coreDataDetails.AvailableStations),
                    departments: isSupervisorScope
                        ? [supervisorDepartment].filter(Boolean)
                        : uniqueValues(config.departments || coreDataDetails.availableDepartments),
                });
            }

            if (kpiResult.status !== "fulfilled") {
                throw kpiResult.reason;
            }

            setKpis(kpiResult.value || {});
            setPreviousKpis(previousKpiResult.status === "fulfilled" ? previousKpiResult.value || null : null);
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
    }, [isStationScopedHr, isSupervisorScope, params, previousParams, supervisorDepartment, supervisorStation]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const loadReferenceData = useCallback(async () => {
        setReferenceLoading(true);
        setReferenceError("");

        try {
            const [recordsResult, summaryResult] = await Promise.allSettled([
                fetchOverallAttendanceRecords(params),
                fetchOverallAttendanceSummary(params),
            ]);

            if (recordsResult.status === "fulfilled") {
                setRecords(recordsResult.value || []);
            } else {
                setRecords([]);
            }

            if (summaryResult.status === "fulfilled") {
                setSummaryRows(summaryResult.value || []);
            } else {
                setSummaryRows([]);
            }

            if (recordsResult.status !== "fulfilled" || summaryResult.status !== "fulfilled") {
                const reason = recordsResult.reason || summaryResult.reason;
                setReferenceError(
                    typeof reason === "string"
                        ? reason
                        : reason?.response?.data?.message || reason?.message || "Some reference data could not be loaded."
                );
            }
        } finally {
            setReferenceLoading(false);
        }
    }, [params]);

    useEffect(() => {
        loadReferenceData();
    }, [loadReferenceData]);

    const lateToday = Number(lateAnalytics?.employeesLateToday || 0);
    const outsideClockingCount = Array.isArray(outsideClockingAnalytics)
        ? outsideClockingAnalytics.length
        : Number(workforceAnalytics?.outsideClocking?.length || 0);
    const previousPeriodLabel = formatRangeLabel(previousParams.startDate, previousParams.endDate);
    const attendanceDelta = previousKpis ? Number(kpis?.attendanceRate || 0) - Number(previousKpis?.attendanceRate || 0) : undefined;
    const punctualityDelta = previousKpis ? Number(kpis?.punctualityRate || 0) - Number(previousKpis?.punctualityRate || 0) : undefined;
    const absenteeismDelta = previousKpis ? Number(previousKpis?.absenteeismRate || 0) - Number(kpis?.absenteeismRate || 0) : undefined;
    const productivityDelta = previousKpis ? Number(kpis?.productivityIndex || 0) - Number(previousKpis?.productivityIndex || 0) : undefined;

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

    const sortedStations = useMemo(
        () => sortAnalyticsRows(filterByPerformanceBand(stations, filters.performanceBand), filters.sortBy),
        [filters.performanceBand, filters.sortBy, stations]
    );

    const sortedDepartments = useMemo(
        () => sortAnalyticsRows(filterByPerformanceBand(departments, filters.performanceBand), filters.sortBy),
        [departments, filters.performanceBand, filters.sortBy]
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
    const topPerformer = Array.isArray(productivityAnalytics) ? productivityAnalytics[0] : null;
    const stationPerformanceRows = useMemo(
        () =>
            sortedStations.map((station) => ({
                name: station.station || "Unassigned",
                staff: Number(station.staffCount || 0),
                attendanceRate: Number(station.attendanceRate || 0),
                absenteeismRate: Number(station.absenteeismRate || 0),
                lateCount: Number(station.totalLateCount || 0),
                onLeaveDays: Number(station.onLeaveDays || 0),
            })),
        [sortedStations]
    );
    const departmentPerformanceRows = useMemo(
        () =>
            sortedDepartments.map((department) => ({
                name: department.department || "Unassigned",
                staff: Number(department.staffCount || 0),
                attendanceRate: Number(department.attendanceRate || 0),
                absenteeismRate: Number(department.absenteeismRate || 0),
                lateCount: Number(department.totalLateCount || 0),
                onLeaveDays: Number(department.onLeaveDays || 0),
            })),
        [sortedDepartments]
    );
    const qualitySignalRows = useMemo(
        () => [
            { name: "Attendance", value: safePercent(kpis?.attendanceRate), fill: theme.secondary },
            { name: "Punctuality", value: safePercent(kpis?.punctualityRate), fill: theme.success },
            { name: "Productivity", value: safePercent(kpis?.productivityIndex), fill: theme.purple },
            { name: "Biometric", value: safePercent(biometricAnalytics?.enrollmentRate), fill: theme.accent },
            { name: "Device Uptime", value: safePercent(biometricAnalytics?.deviceUptime), fill: theme.warning },
            { name: "Absenteeism Risk", value: safePercent(kpis?.absenteeismRate), fill: theme.danger },
        ],
        [biometricAnalytics, kpis, theme]
    );
    const deviceReadinessRows = useMemo(
        () => [
            { name: "Active Devices", count: Number(biometricAnalytics?.activeDevices || 0), fill: theme.success },
            { name: "Inactive Devices", count: Number(biometricAnalytics?.inactiveDevices || 0), fill: theme.warning },
            { name: "Lost Devices", count: Number(biometricAnalytics?.lostDevices || 0), fill: theme.danger },
            { name: "Biometric Users", count: Number(biometricAnalytics?.usersWithBiometric || 0), fill: theme.secondary },
            {
                name: "Pending Users",
                count: Math.max(Number(kpis?.totalEmployees || 0) - Number(biometricAnalytics?.usersWithBiometric || 0), 0),
                fill: theme.purple,
            },
        ],
        [biometricAnalytics, kpis, theme]
    );
    const managementRecommendations = useMemo(() => {
        const notes = [];
        if (missingRecords > 0) {
            notes.push({
                label: "Close record gaps",
                value: `${formatNumber(missingRecords)} incomplete records`,
                subtitle: "Prioritise missing clock-ins and clock-outs before payroll or compliance reporting.",
                tone: theme.warning,
                positive: false,
            });
        }
        if (lateToday > 0) {
            notes.push({
                label: "Review punctuality",
                value: `${formatNumber(lateToday)} late today`,
                subtitle: "Check whether lateness is concentrated by department, route, or station start-time practice.",
                tone: theme.warning,
                positive: false,
            });
        }
        if (earlyDepartureCount > 0) {
            notes.push({
                label: "Confirm coverage",
                value: `${formatNumber(earlyDepartureCount)} early departures`,
                subtitle: "Validate whether early exits are approved field duties, partial days, or supervision exceptions.",
                tone: theme.purple,
                positive: false,
            });
        }
        if (outsideClockingCount > 0) {
            notes.push({
                label: "Audit outside duty",
                value: `${formatNumber(outsideClockingCount)} outside records`,
                subtitle: "Match off-premise clocking against approved fieldwork permissions and station assignments.",
                tone: theme.secondary,
                positive: true,
            });
        }
        if (Number(biometricAnalytics?.enrollmentRate || 0) < 95) {
            notes.push({
                label: "Improve biometric coverage",
                value: formatPercent(biometricAnalytics?.enrollmentRate),
                subtitle: "Unregistered users are more likely to need manual support during attendance verification.",
                tone: theme.accent,
                positive: false,
            });
        }
        if (lowestStation && Number(lowestStation.attendanceRate || 0) < 80) {
            notes.push({
                label: "Support low station",
                value: lowestStation.station || "Unassigned",
                subtitle: `Attendance is ${formatPercent(lowestStation.attendanceRate)}; compare absence, leave, and lateness drivers.`,
                tone: theme.danger,
                positive: false,
            });
        }
        if (averageAbsenteeismRate > 10) {
            notes.push({
                label: "Absence exposure",
                value: formatPercent(averageAbsenteeismRate),
                subtitle: "Review departments with recurring absence pressure before it becomes a service-continuity issue.",
                tone: theme.danger,
                positive: false,
            });
        }
        if (!notes.length) {
            notes.push({
                label: "Maintain controls",
                value: "Stable attendance",
                subtitle: "Continue monitoring punctuality, device readiness, and outside-duty authorisations weekly.",
                tone: theme.success,
                positive: true,
            });
        }
        return notes.slice(0, 6);
    }, [averageAbsenteeismRate, biometricAnalytics, earlyDepartureCount, lateToday, lowestStation, missingRecords, outsideClockingCount, theme]);
    const totalDaysInReferenceRange = useMemo(
        () => getTotalDays(effectiveFilters.startDate, effectiveFilters.endDate),
        [effectiveFilters.endDate, effectiveFilters.startDate]
    );
    const workingDaysInReferenceRange = useMemo(
        () => getWorkingDays(effectiveFilters.startDate, effectiveFilters.endDate),
        [effectiveFilters.endDate, effectiveFilters.startDate]
    );

    const processedRecords = useMemo(
        () => records.map((record, index) => ({
            id: record._id || `${record.email || "record"}-${index}`,
            employeeId: record.employeeId || "N/A",
            name: compactTitleCase(record.name || record.email),
            email: String(record.email || ""),
            date: formatDateTime(record.clock_in, { hour: undefined, minute: undefined }),
            rawDate: record.clock_in,
            clockIn: formatTime(record.clock_in),
            clockOut: record.missedClockOut ? "System" : record.clock_out ? formatTime(record.clock_out) : "Open",
            inLocation: formatLocationLabel(record, true),
            outLocation: formatLocationLabel(record, false),
            reason: compactTitleCase(record.outSideReason || record.outsideReason || ""),
            station: record.station || "Unassigned",
            department: record.department || "Unassigned",
            role: record.role || "",
            timing: record.isLate ? "Late" : "On Time",
            status: record.clock_out ? "Completed" : "Open",
        })),
        [records]
    );

    const processedSummaryRows = useMemo(
        () => summaryRows.map((row, index) => {
            const daysPresent = Number(row.daysPresent || 0);
            const attendanceRate = workingDaysInReferenceRange > 0
                ? (daysPresent / workingDaysInReferenceRange) * 100
                : 0;

            return {
                id: row.employeeId || row.email || `${row.name || "summary"}-${index}`,
                employeeId: row.employeeId || "N/A",
                name: compactTitleCase(row.name),
                role: row.role || "",
                department: row.department || "Unassigned",
                totalDays: totalDaysInReferenceRange,
                workingDays: workingDaysInReferenceRange,
                daysPresent,
                daysAbsent: Number(row.daysAbsent || 0),
                attendanceRate,
            };
        }),
        [summaryRows, totalDaysInReferenceRange, workingDaysInReferenceRange]
    );

    const referenceSearchText = String(deferredReferenceSearch || "").trim().toLowerCase();

    const filteredRecords = useMemo(
        () => processedRecords.filter((row) => {
            if (!referenceSearchText) return true;
            return [
                row.employeeId,
                row.name,
                row.email,
                row.station,
                row.department,
                row.role,
                row.timing,
            ].some((value) => String(value || "").toLowerCase().includes(referenceSearchText));
        }),
        [processedRecords, referenceSearchText]
    );

    const filteredSummaryRows = useMemo(
        () => processedSummaryRows.filter((row) => {
            if (!referenceSearchText) return true;
            return [
                row.employeeId,
                row.name,
                row.station,
                row.department,
                row.role,
            ].some((value) => String(value || "").toLowerCase().includes(referenceSearchText));
        }),
        [processedSummaryRows, referenceSearchText]
    );

    const paginatedRecords = useMemo(
        () => filteredRecords.slice(recordPage * recordRowsPerPage, recordPage * recordRowsPerPage + recordRowsPerPage),
        [filteredRecords, recordPage, recordRowsPerPage]
    );

    const paginatedSummaryRows = useMemo(
        () => filteredSummaryRows.slice(summaryPage * summaryRowsPerPage, summaryPage * summaryRowsPerPage + summaryRowsPerPage),
        [filteredSummaryRows, summaryPage, summaryRowsPerPage]
    );

    const referenceMetrics = useMemo(() => {
        const openSessions = processedRecords.filter((row) => row.status === "Open").length;
        const lateRecords = processedRecords.filter((row) => row.timing === "Late").length;
        const averageAttendance = processedSummaryRows.length
            ? processedSummaryRows.reduce((sum, row) => sum + Number(row.attendanceRate || 0), 0) / processedSummaryRows.length
            : 0;

        return {
            records: processedRecords.length,
            openSessions,
            lateRecords,
            summaryRows: processedSummaryRows.length,
            averageAttendance,
        };
    }, [processedRecords, processedSummaryRows]);

    const exceptionSignalRows = useMemo(
        () => [
            { name: "Absent Today", count: Number(kpis?.absentToday || 0), fill: theme.danger },
            { name: "Late Today", count: lateToday, fill: theme.warning },
            { name: "Early Departures", count: earlyDepartureCount, fill: theme.purple },
            { name: "Missing In", count: Number(complianceAnalytics?.totalMissingClockIns || 0), fill: theme.danger },
            { name: "Missing Out", count: Number(complianceAnalytics?.totalMissingClockOuts || 0), fill: theme.warning },
            { name: "Outside Duty", count: outsideClockingCount, fill: theme.secondary },
            { name: "Open Sessions", count: referenceMetrics.openSessions, fill: theme.accent },
            { name: "Inactive Devices", count: Number(biometricAnalytics?.inactiveDevices || 0), fill: theme.muted },
            { name: "Lost Devices", count: Number(biometricAnalytics?.lostDevices || 0), fill: theme.danger },
        ],
        [biometricAnalytics, complianceAnalytics, earlyDepartureCount, kpis, lateToday, outsideClockingCount, referenceMetrics.openSessions, theme]
    );

    const attendanceDistributionRows = useMemo(
        () => [
            { name: "Present", value: Number(kpis?.presentToday || 0), color: theme.success },
            { name: "Absent", value: Number(kpis?.absentToday || 0), color: theme.danger },
            { name: "On Leave", value: Number(kpis?.onLeaveToday || 0), color: theme.warning },
            { name: "Outside Duty", value: outsideClockingCount, color: theme.purple },
        ].filter((item) => item.value > 0),
        [kpis, outsideClockingCount, theme]
    );

    const attendanceQualityRows = useMemo(
        () => [
            { label: "Late Arrivals", value: lateToday, tone: theme.purple },
            { label: "Early Departures", value: earlyDepartureCount, tone: theme.warning },
            { label: "Missing Clock-ins", value: Number(complianceAnalytics?.totalMissingClockIns || 0), tone: theme.secondary },
            { label: "Missing Clock-outs", value: Number(complianceAnalytics?.totalMissingClockOuts || 0), tone: theme.danger },
        ],
        [complianceAnalytics, earlyDepartureCount, lateToday, theme]
    );

    const attentionReviewRows = useMemo(
        () => processedSummaryRows
            .map((row) => ({
                ...row,
                score: Number(row.daysAbsent || 0) + (Number(row.attendanceRate || 0) < 80 ? 2 : 0),
            }))
            .filter((row) => row.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5),
        [processedSummaryRows]
    );

    const compactInsightCards = useMemo(
        () => [
            {
                label: isSupervisorScope ? "Department Rate" : "Best Station",
                title: isSupervisorScope ? formatPercent(kpis?.attendanceRate) : (topStation?.station || "N/A"),
                value: isSupervisorScope ? supervisorDepartment || "Assigned department" : formatPercent(topStation?.attendanceRate),
                tone: theme.success,
                positive: true,
            },
            {
                label: "Needs Attention",
                title: isSupervisorScope ? "Absence Review" : (lowestStation?.station || "N/A"),
                value: isSupervisorScope ? `${formatNumber(attentionCount)} staff` : formatPercent(lowestStation?.attendanceRate),
                tone: theme.danger,
                positive: false,
            },
            {
                label: isSupervisorScope ? "Team Punctuality" : "Top Department",
                title: isSupervisorScope ? formatPercent(kpis?.punctualityRate) : (topDepartment?.department || "N/A"),
                value: isSupervisorScope ? `${formatDelta(punctualityDelta || 0, "pp")} vs prev` : formatPercent(topDepartment?.attendanceRate),
                tone: theme.secondary,
                positive: true,
            },
            {
                label: userRank === "ceo" ? "Attendance vs Target" : "Biometric Coverage",
                title: userRank === "ceo" ? `${formatPercent(kpis?.attendanceRate)} / 90%` : formatPercent(biometricAnalytics?.enrollmentRate),
                value: userRank === "ceo" ? `${formatDelta(Number(kpis?.attendanceRate || 0) - 90, "pp")} target gap` : `${formatNumber(biometricAnalytics?.usersWithBiometric || 0)} enrolled`,
                tone: theme.purple,
                positive: Number(kpis?.attendanceRate || 0) >= 90,
            },
        ],
        [attentionCount, biometricAnalytics, isSupervisorScope, kpis, lowestStation, punctualityDelta, supervisorDepartment, theme, topDepartment, topStation, userRank]
    );

    const roleRecommendationCards = useMemo(() => {
        const totalEmployees = Number(kpis?.totalEmployees || 0);
        const attendanceRate = Number(kpis?.attendanceRate || 0);
        const punctualityRate = Number(kpis?.punctualityRate || 0);
        const absenteeismRate = Number(kpis?.absenteeismRate || 0);
        const biometricRate = Number(biometricAnalytics?.enrollmentRate || 0);
        const lowestDepartment = [...sortedDepartments]
            .sort((a, b) => Number(a.attendanceRate || 0) - Number(b.attendanceRate || 0))[0];
        const stationGap = topStation && lowestStation
            ? Math.max(Number(topStation.attendanceRate || 0) - Number(lowestStation.attendanceRate || 0), 0)
            : 0;
        const targetGap = Math.max(90 - attendanceRate, 0);
        const presentCoverage = totalEmployees
            ? (Number(kpis?.presentToday || 0) / totalEmployees) * 100
            : 0;
        const topPerformerName = topPerformer?.name || topPerformer?.email || "top performers";
        const scopedStationLabel = supervisorStation || "assigned station";
        const scopedDepartmentLabel = supervisorDepartment || "assigned department";

        if (userRank === "ceo") {
            return [
                {
                    chip: "Executive",
                    label: "Organisation Target",
                    title: targetGap > 0 ? "Raise attendance toward 90%" : "Maintain attendance above target",
                    detail: targetGap > 0
                        ? `Attendance is ${formatPercent(attendanceRate)}. Ask HR to prioritise the stations and departments pulling the average below target.`
                        : `Attendance is ${formatPercent(attendanceRate)}. Keep the same governance rhythm while watching station variance.`,
                    metric: `${formatDelta(attendanceRate - 90, "pp")} vs 90%`,
                    progress: attendanceRate,
                    tone: targetGap > 0 ? theme.warning : theme.success,
                    positive: targetGap <= 0,
                },
                {
                    chip: "Station Equity",
                    label: "Station Variance",
                    title: `${formatDelta(stationGap, "pp")} best-to-lowest gap`,
                    detail: `${lowestStation?.station || "Lowest station"} needs executive visibility if the gap persists against ${topStation?.station || "top station"}.`,
                    metric: lowestStation?.station || "N/A",
                    progress: Math.min(stationGap * 3, 100),
                    tone: stationGap > 10 ? theme.danger : theme.secondary,
                    positive: stationGap <= 10,
                },
                {
                    chip: "Accountability",
                    label: "Department Oversight",
                    title: lowestDepartment?.department || "Department review",
                    detail: `Use department heads to close absence, lateness, and missing-record patterns before they affect service delivery.`,
                    metric: formatPercent(lowestDepartment?.attendanceRate),
                    progress: lowestDepartment?.attendanceRate || 0,
                    tone: theme.purple,
                    positive: Number(lowestDepartment?.attendanceRate || 0) >= 85,
                },
                {
                    chip: "Compliance",
                    label: "Record Integrity",
                    title: `${formatNumber(missingRecords)} incomplete records`,
                    detail: "Require closure of missing clock-ins and clock-outs before monthly reporting, audit review, or payroll confirmation.",
                    metric: `${formatNumber(referenceMetrics.openSessions)} open sessions`,
                    progress: Math.min(missingRecords * 8, 100),
                    tone: missingRecords > 0 ? theme.danger : theme.success,
                    positive: missingRecords === 0,
                },
                {
                    chip: "Infrastructure",
                    label: "Biometric Resilience",
                    title: formatPercent(biometricRate),
                    detail: "Track enrolment, inactive devices, and lost devices as attendance infrastructure health indicators.",
                    metric: `${formatNumber(biometricAnalytics?.usersWithBiometric || 0)} enrolled`,
                    progress: biometricRate,
                    tone: biometricRate >= 95 ? theme.success : theme.warning,
                    positive: biometricRate >= 95,
                },
                {
                    chip: "Continuity",
                    label: "Workforce Availability",
                    title: `${formatNumber(attentionCount)} staff need attention`,
                    detail: "Ask HR to separate approved leave from unexplained absence so operational coverage decisions are fair.",
                    metric: `${formatPercent(presentCoverage)} present today`,
                    progress: presentCoverage,
                    tone: attentionCount > 0 ? theme.warning : theme.success,
                    positive: attentionCount === 0,
                },
            ];
        }

        if (isFullHr) {
            return [
                {
                    chip: "Super HR",
                    label: "Station Intervention",
                    title: lowestStation?.station || "Station review",
                    detail: `Coordinate with station HR to understand why attendance sits at ${formatPercent(lowestStation?.attendanceRate)} and agree a corrective action.`,
                    metric: formatPercent(lowestStation?.attendanceRate),
                    progress: lowestStation?.attendanceRate || 0,
                    tone: theme.danger,
                    positive: false,
                },
                {
                    chip: "Cross-Dept",
                    label: "Department Follow-up",
                    title: lowestDepartment?.department || "Department review",
                    detail: "Compare attendance, absenteeism, lateness, and early departures before deciding whether the issue is supervision, shift timing, or record quality.",
                    metric: formatPercent(lowestDepartment?.attendanceRate),
                    progress: lowestDepartment?.attendanceRate || 0,
                    tone: theme.warning,
                    positive: Number(lowestDepartment?.attendanceRate || 0) >= 85,
                },
                {
                    chip: "Data Quality",
                    label: "Compliance Closure",
                    title: `${formatNumber(missingRecords)} missing records`,
                    detail: "Push station HR teams to clean missing punches daily so monthly analytics remain credible.",
                    metric: `${formatNumber(referenceMetrics.openSessions)} open sessions`,
                    progress: Math.min(missingRecords * 8, 100),
                    tone: missingRecords ? theme.danger : theme.success,
                    positive: !missingRecords,
                },
                {
                    chip: "Punctuality",
                    label: "Late Arrival Review",
                    title: `${formatNumber(lateToday)} late today`,
                    detail: "Where lateness repeats across multiple stations, review reporting times, transport realities, and grace-period discipline.",
                    metric: formatPercent(punctualityRate),
                    progress: punctualityRate,
                    tone: punctualityRate >= 90 ? theme.success : theme.warning,
                    positive: punctualityRate >= 90,
                },
                {
                    chip: "Access",
                    label: "Outside Duty Governance",
                    title: `${formatNumber(outsideClockingCount)} outside-duty records`,
                    detail: "Audit authorisations against field assignments, especially where off-premise records cluster around one station or department.",
                    metric: "Authorised records",
                    progress: Math.min(outsideClockingCount * 10, 100),
                    tone: theme.secondary,
                    positive: true,
                },
                {
                    chip: "Devices",
                    label: "Biometric Coverage",
                    title: formatPercent(biometricRate),
                    detail: "Prioritise onboarding and device support in stations with pending enrolment or inactive devices.",
                    metric: `${formatNumber(biometricAnalytics?.inactiveDevices || 0)} inactive devices`,
                    progress: biometricRate,
                    tone: biometricRate >= 95 ? theme.success : theme.purple,
                    positive: biometricRate >= 95,
                },
            ];
        }

        if (isStationScopedHr) {
            return [
                {
                    chip: "Station HR",
                    label: "Daily Coverage",
                    title: `${formatPercent(presentCoverage)} present today`,
                    detail: `Use ${scopedStationLabel} attendance to confirm coverage before supervisors assign field or lab tasks.`,
                    metric: `${formatNumber(kpis?.presentToday)} present`,
                    progress: presentCoverage,
                    tone: presentCoverage >= 85 ? theme.success : theme.warning,
                    positive: presentCoverage >= 85,
                },
                {
                    chip: "Absence",
                    label: "Same-day Follow-up",
                    title: `${formatNumber(kpis?.absentToday)} absent today`,
                    detail: "Separate approved leave, duty travel, and unexplained absence before the end-of-day attendance close.",
                    metric: formatPercent(absenteeismRate),
                    progress: Math.min(absenteeismRate * 6, 100),
                    tone: absenteeismRate > 8 ? theme.danger : theme.secondary,
                    positive: absenteeismRate <= 8,
                },
                {
                    chip: "Punctuality",
                    label: "Station Start Discipline",
                    title: formatPercent(punctualityRate),
                    detail: "Discuss repeated late arrivals with line supervisors and confirm whether station-specific reporting constraints exist.",
                    metric: `${formatNumber(lateToday)} late today`,
                    progress: punctualityRate,
                    tone: punctualityRate >= 90 ? theme.success : theme.warning,
                    positive: punctualityRate >= 90,
                },
                {
                    chip: "Records",
                    label: "Punch Completion",
                    title: `${formatNumber(missingRecords)} records to clean`,
                    detail: "Close missing clock-ins and clock-outs before they become unresolved end-month exceptions.",
                    metric: `${formatNumber(referenceMetrics.openSessions)} open`,
                    progress: Math.min(missingRecords * 12, 100),
                    tone: missingRecords ? theme.danger : theme.success,
                    positive: !missingRecords,
                },
                {
                    chip: "Department",
                    label: "Local Department Watch",
                    title: lowestDepartment?.department || "Department review",
                    detail: "Use department-level attendance to brief the relevant HOD on the exact team that needs support.",
                    metric: formatPercent(lowestDepartment?.attendanceRate),
                    progress: lowestDepartment?.attendanceRate || 0,
                    tone: theme.purple,
                    positive: Number(lowestDepartment?.attendanceRate || 0) >= 85,
                },
                {
                    chip: "Biometrics",
                    label: "Station Readiness",
                    title: formatPercent(biometricRate),
                    detail: "Resolve pending enrolment and device issues locally so staff are not pushed into manual explanations.",
                    metric: `${formatNumber(biometricAnalytics?.usersWithBiometric || 0)} enrolled`,
                    progress: biometricRate,
                    tone: biometricRate >= 95 ? theme.success : theme.warning,
                    positive: biometricRate >= 95,
                },
            ];
        }

        if (isSupervisorScope) {
            return [
                {
                    chip: "Supervisor",
                    label: "Team Attendance",
                    title: formatPercent(attendanceRate),
                    detail: `Use ${scopedDepartmentLabel} attendance to identify whether the issue is a few staff members or a team-wide pattern.`,
                    metric: `${formatNumber(totalEmployees)} staff`,
                    progress: attendanceRate,
                    tone: attendanceRate >= 90 ? theme.success : theme.warning,
                    positive: attendanceRate >= 90,
                },
                {
                    chip: "Follow-up",
                    label: "Absence Review",
                    title: `${formatNumber(kpis?.absentToday)} absent today`,
                    detail: "Call or message absent staff early and record whether the reason is approved leave, field assignment, or unexplained absence.",
                    metric: `${formatNumber(attentionReviewRows.length)} flagged`,
                    progress: Math.min(Number(kpis?.absentToday || 0) * 20, 100),
                    tone: Number(kpis?.absentToday || 0) ? theme.danger : theme.success,
                    positive: !Number(kpis?.absentToday || 0),
                },
                {
                    chip: "Coaching",
                    label: "Punctuality Coaching",
                    title: `${formatNumber(lateToday)} late today`,
                    detail: "Review repeated lateness privately and agree realistic corrective action before escalation.",
                    metric: formatPercent(punctualityRate),
                    progress: punctualityRate,
                    tone: punctualityRate >= 90 ? theme.success : theme.warning,
                    positive: punctualityRate >= 90,
                },
                {
                    chip: "Coverage",
                    label: "Work Allocation",
                    title: `${formatNumber(kpis?.onLeaveToday)} on leave`,
                    detail: "Plan handovers and daily coverage when leave or absence reduces available team capacity.",
                    metric: `${formatPercent(presentCoverage)} present`,
                    progress: presentCoverage,
                    tone: presentCoverage >= 85 ? theme.success : theme.secondary,
                    positive: presentCoverage >= 85,
                },
                {
                    chip: "Records",
                    label: "Pending Reviews",
                    title: `${formatNumber(missingRecords)} missing punches`,
                    detail: "Ask staff to resolve missing clock-ins or clock-outs while the context is still fresh.",
                    metric: `${formatNumber(referenceMetrics.openSessions)} open`,
                    progress: Math.min(missingRecords * 15, 100),
                    tone: missingRecords ? theme.warning : theme.success,
                    positive: !missingRecords,
                },
                {
                    chip: "Recognition",
                    label: "Positive Reinforcement",
                    title: titleCase(topPerformerName),
                    detail: "Recognise consistent attendance and use reliable performers as examples for team attendance discipline.",
                    metric: "Top performer",
                    progress: attendanceRate,
                    tone: theme.accent,
                    positive: true,
                },
            ];
        }

        return managementRecommendations.map((note) => ({
            chip: "Insight",
            label: note.label,
            title: note.value,
            detail: note.subtitle,
            metric: note.positive ? "Stable" : "Review",
            progress: note.positive ? 86 : 48,
            tone: note.tone,
            positive: note.positive,
        }));
    }, [
        attentionCount,
        attentionReviewRows.length,
        biometricAnalytics,
        isFullHr,
        isStationScopedHr,
        isSupervisorScope,
        kpis,
        lateToday,
        lowestStation,
        managementRecommendations,
        missingRecords,
        outsideClockingCount,
        referenceMetrics.openSessions,
        sortedDepartments,
        supervisorDepartment,
        supervisorStation,
        theme,
        topPerformer,
        topStation,
        userRank,
    ]);

    const handleFilterChange = (field) => (event) => {
        if ((isSupervisorScope || isStationScopedHr) && field === "station") return;
        if (isSupervisorScope && field === "department") return;

        setDraftFilters((previous) => ({
            ...previous,
            [field]: event.target.value,
            ...(field === "startDate" || field === "endDate" ? { quickRange: "custom" } : {}),
        }));
    };

    const handleQuickRangeChange = (event) => {
        const value = event.target.value;
        const selectedRange = quickRanges.find((range) => range.value === value);

        setDraftFilters((previous) => ({
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

    const applyFilters = () => {
        setFilters(effectiveDraftFilters);
        setRecordPage(0);
        setSummaryPage(0);
    };

    const clearFilters = () => {
        const resetFilters = {
            startDate: getMonthStart(),
            endDate: getDateInputValue(),
            station: (isSupervisorScope || isStationScopedHr) ? supervisorStation : "",
            department: isSupervisorScope ? supervisorDepartment : "",
            staffFilter: "",
            quickRange: "month",
            performanceBand: "",
            sortBy: "attendance-desc",
            trendMetric: "all",
        };
        setDraftFilters(resetFilters);
        setFilters(resetFilters);
        setReferenceSearch("");
        setRecordPage(0);
        setSummaryPage(0);
    };

    const loadReportLogo = async () => {
        const logo = new Image();
        logo.src = KMFRILogo;
        await new Promise((resolve, reject) => {
            logo.onload = resolve;
            logo.onerror = reject;
        });
        return logo;
    };

    const createVerifiedPdfContext = async ({ type, title, filename, metadata = {} }) => {
        const { default: jsPDF } = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");
        const logo = await loadReportLogo();
        const { token } = await createExportVerification({
            type,
            title,
            scope: scopeLabel,
            filename,
            metadata: {
                ...metadata,
                scope: scopeLabel,
                filters: effectiveFilters,
            },
        });
        const verifyUrl = `${window.location.origin}/verify/${token}`;
        const qrImage = await QRCode.toDataURL(verifyUrl, {
            margin: 1,
            width: 300,
            errorCorrectionLevel: "H",
        });

        const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
        const pw = doc.internal.pageSize.getWidth();
        const ph = doc.internal.pageSize.getHeight();
        const logoHeight = 20;
        const logoWidth = (logo.width / logo.height) * logoHeight;
        const qrSize = 24;
        const qrX = pw - qrSize - 10;
        const qrY = 5;

        doc.setFillColor(10, 61, 98);
        doc.rect(0, 0, pw, 40, "F");
        doc.addImage(KMFRILogo, "PNG", 3, 8, logoWidth, logoHeight, undefined, "FAST");
        doc.addImage(qrImage, "PNG", qrX, qrY, qrSize, qrSize, undefined, "FAST");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.text(title.toUpperCase(), pw / 2, 10, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.text(scopeLabel.toUpperCase(), pw / 2, 17, { align: "center" });
        doc.text(`${effectiveFilters.startDate} TO ${effectiveFilters.endDate}`.toUpperCase(), pw / 2, 23, { align: "center" });
        doc.text(`GENERATED: ${new Date().toLocaleString().toUpperCase()} | BY: ${(user?.name || "AUTHORIZED PERSONNEL").toUpperCase()} | ${(user?.rank || "").toUpperCase()}`, pw / 2, 29, { align: "center" });
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text("VERIFICATION QR", qrX + qrSize / 2, qrY + qrSize + 3, { align: "center" });

        return { doc, autoTable, token, filename, pw, ph };
    };

    const finalizeVerifiedPdf = async ({ doc, token, filename, metadata = {} }) => {
        const totalPages = doc.internal.getNumberOfPages();
        const pw = doc.internal.pageSize.getWidth();
        const ph = doc.internal.pageSize.getHeight();

        for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
            doc.setPage(pageIndex);
            doc.setDrawColor(10, 61, 98);
            doc.line(10, ph - 12, pw - 10, ph - 12);
            doc.setFontSize(8);
            doc.setTextColor(80);
            doc.text("Kenya Marine and Fisheries Research Institute (KMFRI)", 10, ph - 7);
            doc.text(`Page ${pageIndex} of ${totalPages} | Public verification valid for 90 days`, pw - 10, ph - 7, { align: "right" });
        }

        const dataUri = doc.output("datauristring");
        const documentBase64 = dataUri.split(",").pop();
        await updateExportVerificationContent(token, {
            documentBase64,
            metadata: {
                ...metadata,
                finalizedAt: new Date().toISOString(),
            },
        });
        doc.save(filename);
    };

    const handleExportAnalyticsPdf = async () => {
        setPdfExporting("analytics");
        try {
            const filename = `KMFRI_Broader_Analytics_${Date.now()}.pdf`;
            const ctx = await createVerifiedPdfContext({
                type: "broader_statistics_analytics",
                title: pageHeading,
                filename,
                metadata: {
                    rows: {
                        trends: chartData.length,
                        stations: sortedStations.length,
                        departments: sortedDepartments.length,
                        topEmployees: overallTopEmployees.length,
                    },
                },
            });
            const { doc, autoTable } = ctx;
            const hexToRgb = (value, fallback = [10, 61, 98]) => {
                const match = String(value || "").trim().match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
                if (!match) return fallback;
                return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
            };
            const primaryRgb = hexToRgb(theme.primary, [10, 61, 98]);
            const secondaryRgb = hexToRgb(theme.secondary, [0, 91, 150]);
            const successRgb = hexToRgb(theme.success, [16, 185, 129]);
            const warningRgb = hexToRgb(theme.warning, [245, 158, 11]);
            const mutedRgb = [226, 232, 240];

            const drawPdfBarChart = ({ title, rows, labelKey, valueKey, color = secondaryRgb, maxValue = 100, valueSuffix = "%", note = "" }) => {
                if (!rows.length) return;

                let y = (doc.lastAutoTable?.finalY || 45) + 8;
                const left = 10;
                const labelWidth = 66;
                const barWidth = 150;
                const rowHeight = 7.2;
                const bottomLimit = ctx.ph - 18;
                const drawTitle = () => {
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(9);
                    doc.setTextColor(...primaryRgb);
                    doc.text(title, left, y);
                    y += 4;
                    if (note) {
                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(7);
                        doc.setTextColor(90);
                        doc.text(note, left, y, { maxWidth: ctx.pw - 20 });
                        y += 5;
                    }
                };

                if (y > bottomLimit - 20) {
                    doc.addPage();
                    y = 18;
                }
                drawTitle();

                rows.forEach((row) => {
                    if (y > bottomLimit) {
                        doc.addPage();
                        y = 18;
                        drawTitle();
                    }

                    const value = safePercent(row[valueKey]);
                    const label = String(row[labelKey] || "Unassigned");
                    const shortLabel = label.length > 48 ? `${label.slice(0, 45)}...` : label;
                    const barFillWidth = (value / maxValue) * barWidth;

                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(6.8);
                    doc.setTextColor(45);
                    doc.text(shortLabel, left, y + 3.2, { maxWidth: labelWidth - 2 });
                    doc.setFillColor(...mutedRgb);
                    doc.roundedRect(left + labelWidth, y, barWidth, 3.8, 1.2, 1.2, "F");
                    doc.setFillColor(...color);
                    doc.roundedRect(left + labelWidth, y, barFillWidth, 3.8, 1.2, 1.2, "F");
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(...primaryRgb);
                    doc.text(`${value.toFixed(1)}${valueSuffix}`, left + labelWidth + barWidth + 5, y + 3.2);
                    y += rowHeight;
                });

                doc.lastAutoTable = { finalY: y };
            };

            const sectionStyles = {
                styles: { fontSize: 7.4, cellPadding: 1.7, overflow: "linebreak", valign: "middle" },
                headStyles: { fillColor: [10, 61, 98], textColor: 255, fontStyle: "bold", halign: "center" },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { left: 8, right: 8 },
            };

            autoTable(doc, {
                startY: 45,
                head: [["Executive Metric", "Value", "Administrative Reading"]],
                body: [
                    ["Total Staff", formatNumber(kpis?.totalEmployees), "Active workforce inside the authorized scope"],
                    ["Present Today", formatNumber(kpis?.presentToday), "Current clocked-in workforce"],
                    ["Absent Today", formatNumber(kpis?.absentToday), "Requires operational review where high"],
                    ["On Leave Today", formatNumber(kpis?.onLeaveToday), "Approved leave coverage"],
                    ["Attendance Rate", formatPercent(kpis?.attendanceRate), "Selected-period presence against expected working days"],
                    ["Punctuality Rate", formatPercent(kpis?.punctualityRate), "Share of recorded arrivals that were on time"],
                    ["Absenteeism Rate", formatPercent(kpis?.absenteeismRate), "Lower values indicate stronger staff coverage"],
                    ["Average Working Hours", Number(kpis?.averageWorkingHours || 0).toFixed(1), "Average hours per completed attendance record"],
                    ["Reference Records", formatNumber(referenceMetrics.records), "Underlying clocking rows included for audit reference"],
                    ["Open Sessions", formatNumber(referenceMetrics.openSessions), "Clock-ins without completed clock-out"],
                ],
                ...sectionStyles,
                columnStyles: { 0: { cellWidth: 58 }, 1: { cellWidth: 38, halign: "center" }, 2: { cellWidth: 170 } },
            });

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 6,
                head: [["Management Insight", "Value", "Recommended Administrative Use"]],
                body: [
                    ["Best Performing Station", topStation?.station || "N/A", `Attendance ${formatPercent(topStation?.attendanceRate)}`],
                    ["Lowest Attendance Station", lowestStation?.station || "N/A", `Attendance ${formatPercent(lowestStation?.attendanceRate)}; review staffing, leave, and lateness drivers`],
                    ["Top Department", topDepartment?.department || "N/A", `Attendance ${formatPercent(topDepartment?.attendanceRate)}`],
                    ["Current Top Performer", topPerformer?.name || topPerformer?.email || "N/A", topPerformer?.department || "No productivity ranking available"],
                    ["Missing Records", formatNumber(missingRecords), "Prioritize correction before payroll or compliance reporting"],
                    ["Outside Clocking", formatNumber(outsideClockingCount), "Review off-premise activity against authorizations"],
                    ["Early Departures", formatNumber(earlyDepartureCount), "Check workload coverage and shift completion risk"],
                    ["Staff Requiring Attention", formatNumber(attentionCount), "Absent or late today"],
                ],
                ...sectionStyles,
                headStyles: { fillColor: [7, 58, 82], textColor: 255, fontStyle: "bold", halign: "center" },
                columnStyles: { 0: { cellWidth: 62 }, 1: { cellWidth: 74 }, 2: { cellWidth: 130 } },
            });

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 6,
                head: [["Trend Date", "Present", "Absent", "Late", "Attendance Rate"]],
                body: chartData.map((item) => [
                    item.date || item.label,
                    item.present,
                    item.absent,
                    item.late,
                    formatPercent(item.attendance),
                ]),
                ...sectionStyles,
                headStyles: { fillColor: [0, 91, 150], textColor: 255, fontStyle: "bold", halign: "center" },
                columnStyles: { 0: { cellWidth: 42 }, 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "center" } },
            });

            drawPdfBarChart({
                title: "Daily Attendance Rate Visual",
                rows: chartData,
                labelKey: "date",
                valueKey: "attendance",
                color: secondaryRgb,
                note: "Longer bars represent higher attendance for each working day in the selected period.",
            });

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 6,
                head: [["Station", "Staff", "Present", "Absent", "Late", "On Leave", "Attendance %"]],
                body: sortedStations.map((station) => [
                    station.station || "Unassigned",
                    station.staffCount || 0,
                    station.presentDays || 0,
                    station.absentDays || 0,
                    station.totalLateCount || 0,
                    station.onLeaveDays || 0,
                    formatPercent(station.attendanceRate),
                ]),
                ...sectionStyles,
                headStyles: { fillColor: [0, 121, 140], textColor: 255, fontStyle: "bold", halign: "center" },
                columnStyles: { 0: { cellWidth: 52 }, 6: { halign: "center" } },
            });

            drawPdfBarChart({
                title: "Station Attendance Rate Visual",
                rows: sortedStations.map((station) => ({
                    name: station.station || "Unassigned",
                    attendanceRate: station.attendanceRate,
                })),
                labelKey: "name",
                valueKey: "attendanceRate",
                color: successRgb,
                note: "Use this to see which stations have stronger or weaker attendance coverage.",
            });

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 6,
                head: [["Department", "Staff", "Present", "Absent", "Late", "On Leave", "Attendance %"]],
                body: sortedDepartments.map((department) => [
                    department.department || "Unassigned",
                    department.staffCount || 0,
                    department.presentDays || 0,
                    department.absentDays || 0,
                    department.totalLateCount || 0,
                    department.onLeaveDays || 0,
                    formatPercent(department.attendanceRate),
                ]),
                ...sectionStyles,
                headStyles: { fillColor: [24, 110, 99], textColor: 255, fontStyle: "bold", halign: "center" },
                columnStyles: { 0: { cellWidth: 82 }, 6: { halign: "center" } },
            });

            drawPdfBarChart({
                title: "Department Attendance Rate Visual",
                rows: sortedDepartments.map((department) => ({
                    name: department.department || "Unassigned",
                    attendanceRate: department.attendanceRate,
                })),
                labelKey: "name",
                valueKey: "attendanceRate",
                color: warningRgb,
                note: "Longer bars mean stronger department coverage across expected working days.",
            });

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 6,
                head: [["Top Employee", "Station", "Department", "Present Days", "Attendance %", "Hours"]],
                body: overallTopEmployees.map((employee) => [
                    employee.name || employee.email || "Unknown",
                    employee.station || "Unassigned",
                    employee.department || "Unassigned",
                    employee.presentDays || 0,
                    formatPercent(employee.attendanceRate),
                    Number(employee.hours || 0).toFixed(1),
                ]),
                ...sectionStyles,
                headStyles: { fillColor: [54, 141, 197], textColor: 255, fontStyle: "bold", halign: "center" },
                columnStyles: { 0: { cellWidth: 66 }, 2: { cellWidth: 82 } },
            });

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 6,
                head: [["Station", "Employee", "Department", "Present Days", "Attendance %", "Hours"]],
                body: topEmployeesByStation.flatMap((stationGroup) =>
                    stationGroup.employees.map((employee) => [
                        stationGroup.station,
                        employee.name || employee.email || "Unknown",
                        employee.department || "Unassigned",
                        employee.presentDays || 0,
                        formatPercent(employee.attendanceRate),
                        Number(employee.hours || 0).toFixed(1),
                    ])
                ),
                ...sectionStyles,
                headStyles: { fillColor: [72, 201, 176], textColor: 255, fontStyle: "bold", halign: "center" },
                columnStyles: { 0: { cellWidth: 48 }, 1: { cellWidth: 62 }, 2: { cellWidth: 82 } },
            });

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 6,
                head: [["Risk / Compliance Area", "Count / Rate", "Administrative Interpretation"]],
                body: [
                    ["Incomplete Records", formatNumber(missingRecords), "Missing clock-in or clock-out records that require correction follow-up"],
                    ["Late Records Today", formatNumber(lateToday), "Daily punctuality signal"],
                    ["Average Absenteeism", formatPercent(averageAbsenteeismRate), "Period absence exposure"],
                    ["Outside Clocking", formatNumber(outsideClockingCount), "Off-premise activity needing authorization review"],
                    ["Biometric Enrollment", formatPercent(biometricAnalytics?.enrollmentRate), "Registration coverage for biometric clocking"],
                    ["Device Uptime", formatPercent(biometricAnalytics?.deviceUptime), "Device reliability signal"],
                    ["Open Sessions", formatNumber(referenceMetrics.openSessions), "Active or missed clock-out sessions in records"],
                    ["Mean Summary Attendance", formatPercent(referenceMetrics.averageAttendance), "Average attendance rate across summary staff rows"],
                ],
                ...sectionStyles,
                headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: "bold", halign: "center" },
                columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 42, halign: "center" }, 2: { cellWidth: 150 } },
            });

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 6,
                head: [["Audience", "Recommendation", "Signal", "Action"]],
                body: roleRecommendationCards.map((card) => [
                    card.chip,
                    `${card.label}: ${card.title}`,
                    card.metric,
                    card.detail,
                ]),
                ...sectionStyles,
                headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: "bold", halign: "center" },
                columnStyles: { 0: { cellWidth: 34 }, 1: { cellWidth: 72 }, 2: { cellWidth: 42 }, 3: { cellWidth: 138 } },
            });

            await finalizeVerifiedPdf({
                ...ctx,
                metadata: {
                    exportKind: "analytics",
                    trends: chartData.length,
                    stations: sortedStations.length,
                    departments: sortedDepartments.length,
                    topEmployees: overallTopEmployees.length,
                },
            });
        } finally {
            setPdfExporting("");
        }
    };

    const handleExportRecordsPdf = async () => {
        setPdfExporting("records");
        try {
            const filename = `KMFRI_Attendance_Records_${Date.now()}.pdf`;
            const ctx = await createVerifiedPdfContext({
                type: "broader_statistics_records",
                title: "KMFRI Attendance Records",
                filename,
                metadata: { rows: filteredRecords.length },
            });
            const { doc, autoTable } = ctx;

            autoTable(doc, {
                startY: 45,
                head: [["No.", "Employee ID", "Name", "Date", "Clock In", "Clock Out", "Timing", "Status", "In Location", "Out Location",  "Department"]],
                body: filteredRecords.map((row, index) => [
                    index + 1,
                    row.employeeId,
                    row.name,
                    row.date,
                    row.clockIn,
                    row.clockOut,
                    row.timing,
                    row.inLocation,
                    row.outLocation,
                    row.department,
                ]),
                headStyles: { fillColor: [10, 61, 98], textColor: 255, halign: "center" },
                styles: { fontSize: 6.8, cellPadding: 1.4, halign: "center" },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { left: 6, right: 6 },
            });

            await finalizeVerifiedPdf({
                ...ctx,
                metadata: { exportKind: "records", rows: filteredRecords.length },
            });
        } finally {
            setPdfExporting("");
        }
    };

    const handleExportSummaryPdf = async () => {
        setPdfExporting("summary");
        try {
            const filename = `KMFRI_Attendance_Summary_${Date.now()}.pdf`;
            const ctx = await createVerifiedPdfContext({
                type: "broader_statistics_summary",
                title: "KMFRI Attendance Summary Report",
                filename,
                metadata: { rows: filteredSummaryRows.length },
            });
            const { doc, autoTable } = ctx;

            autoTable(doc, {
                startY: 45,
                head: [["No.", "Employee ID", "Name", "Role", "Rank",  "Department", "Total Days", "Working Days", "Present", "Absent", "Attendance"]],
                body: filteredSummaryRows.map((row, index) => [
                    index + 1,
                    row.employeeId,
                    row.name,
                    humanizeFilterValue(row.role),
                    row.department,
                    row.totalDays,
                    row.workingDays,
                    row.daysPresent,
                    row.daysAbsent,
                    formatPercent(row.attendanceRate),
                ]),
                headStyles: { fillColor: [10, 61, 98], textColor: 255, halign: "center" },
                styles: { fontSize: 7.2, cellPadding: 1.7, halign: "center" },
                alternateRowStyles: { fillColor: [248, 250, 252] },
            });

            await finalizeVerifiedPdf({
                ...ctx,
                metadata: { exportKind: "summary", rows: filteredSummaryRows.length },
            });
        } finally {
            setPdfExporting("");
        }
    };

    const pageHeading = userRank === "ceo"
        ? "KMFRI Executive Attendance Overview"
        : isSupervisorScope
            ? `${supervisorDepartment || "Department"} Attendance`
            : isStationScopedHr
                ? `${supervisorStation || "Station"} HR Analytics`
                : "Organisation HR Attendance Analytics";
    const pageSubtitle = isSupervisorScope
        ? "Department attendance supervision and exception review."
        : isStationScopedHr
            ? "Station-level attendance overview and departmental performance."
            : userRank === "ceo"
                ? "Strategic attendance performance across the organisation."
                : "Organisation-wide attendance, punctuality, absenteeism and compliance across KMFRI stations and departments.";
    const scopeChipLabel = readOnly
        ? "Read Only"
        : isSupervisorScope
            ? "Supervisor Scope"
            : isStationScopedHr
                ? "Station HR Scope"
                : isFullHr
                    ? "Super HR Scope"
                    : "Privileged Analytics";
    const showLegacyAnalytics = Boolean(globalThis?.__KMFRI_SHOW_LEGACY_ANALYTICS__);

    if (loading && !kpis) {
        return (
            <Box sx={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Stack spacing={2} alignItems="center">
                    <CircularProgress size={34} sx={{ color: theme.secondary }} />
                    <Typography sx={{ color: theme.muted, fontWeight: 700 }}>
                        Loading {isSupervisorScope ? "department" : "organisation"} statistics...
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
                            {pageHeading}
                        </Typography>
                        <Typography sx={{ mt: 0.5, fontSize: 13, color: theme.muted }}>
                            {pageSubtitle}
                        </Typography>
                    </Box>
                </Stack>

                <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }} flexWrap="wrap" useFlexGap>
                    <Chip
                        icon={<ShieldRounded sx={{ fontSize: 16 }} />}
                        label={scopeChipLabel}
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
                    {activeReportTab === "analytics" && (
                        <Button
                            variant="contained"
                            startIcon={pdfExporting === "analytics" ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <DownloadRounded />}
                            onClick={handleExportAnalyticsPdf}
                            disabled={pdfExporting === "analytics"}
                            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 800, bgcolor: theme.primary }}
                        >
                            {pdfExporting === "analytics" ? "Exporting..." : "Export Analytics PDF"}
                        </Button>
                    )}
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
                                    value={draftFilters.quickRange}
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
                                value={draftFilters.startDate}
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
                                value={draftFilters.endDate}
                                onChange={handleFilterChange("endDate")}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>
                        <Box>
                            <FormControl fullWidth size="small">
                                <InputLabel shrink>Station</InputLabel>
                                <Select
                                    value={effectiveDraftFilters.station}
                                    label={(isSupervisorScope || isStationScopedHr) ? "Station Scope" : "Station"}
                                    onChange={handleFilterChange("station")}
                                    disabled={isSupervisorScope || isStationScopedHr}
                                    displayEmpty
                                    renderValue={(selected) => selected || ((isSupervisorScope || isStationScopedHr) ? "No station assigned" : "All Stations")}
                                >
                                    {(isSupervisorScope || isStationScopedHr) ? (
                                        <MenuItem value={supervisorStation}>{supervisorStation || "No station assigned"}</MenuItem>
                                    ) : (
                                        [
                                            <MenuItem key="all-stations" value="">All Stations</MenuItem>,
                                            ...displayedFilterOptions.stations.map((station) => (
                                                <MenuItem key={station} value={station}>
                                                    {station}
                                                </MenuItem>
                                            )),
                                        ]
                                    )}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box>
                            <FormControl fullWidth size="small">
                                <InputLabel shrink>Department</InputLabel>
                                <Select
                                    value={effectiveDraftFilters.department}
                                    label={isSupervisorScope ? "Department Scope" : "Department"}
                                    onChange={handleFilterChange("department")}
                                    disabled={isSupervisorScope}
                                    displayEmpty
                                    renderValue={(selected) => selected || (isSupervisorScope ? "No department assigned" : "All Departments")}
                                >
                                    {isSupervisorScope ? (
                                        <MenuItem value={supervisorDepartment}>{supervisorDepartment || "No department assigned"}</MenuItem>
                                    ) : (
                                        [
                                            <MenuItem key="all-departments" value="">All Departments</MenuItem>,
                                            ...displayedFilterOptions.departments.map((department) => (
                                                <MenuItem key={department} value={department}>
                                                    {department}
                                                </MenuItem>
                                            )),
                                        ]
                                    )}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box>
                            <FormControl fullWidth size="small">
                                <InputLabel shrink>Staff Type / Rank</InputLabel>
                                <Select
                                    value={draftFilters.staffFilter}
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
                                    value={draftFilters.performanceBand}
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
                                    value={draftFilters.sortBy}
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
                                    value={draftFilters.trendMetric}
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
                                <Button
                                    variant="contained"
                                    onClick={applyFilters}
                                    disabled={loading}
                                    sx={{ textTransform: "none", fontWeight: 800, borderRadius: "8px", bgcolor: theme.secondary }}
                                >
                                    Apply
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={clearFilters}
                                    disabled={loading}
                                    sx={{ textTransform: "none", fontWeight: 800, borderRadius: "8px", borderColor: theme.border, color: theme.primary }}
                                >
                                    Clear
                                </Button>
                            </Stack>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            <Card elevation={0} sx={{ mb: 2.5, border: `1px solid ${theme.border}`, borderRadius: "8px", overflow: "hidden" }}>
                <Tabs
                    value={activeReportTab}
                    onChange={(_, value) => setActiveReportTab(value)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        minHeight: 48,
                        bgcolor: "#fff",
                        "& .MuiTab-root": {
                            minHeight: 48,
                            textTransform: "none",
                            fontWeight: 900,
                            color: theme.muted,
                        },
                        "& .Mui-selected": { color: theme.primary },
                        "& .MuiTabs-indicator": { bgcolor: theme.primary, height: 3 },
                    }}
                >
                    <Tab value="analytics" label="Analytics" icon={<AssessmentRounded fontSize="small" />} iconPosition="start" />
                    <Tab value="records" label="Records" icon={<HistoryRounded fontSize="small" />} iconPosition="start" />
                    <Tab value="summary" label="Summary" icon={<TableChartRounded fontSize="small" />} iconPosition="start" />
                </Tabs>
            </Card>

            {activeReportTab === "analytics" && (
                <>
                    <Box sx={{ display: "grid", gap: 1.5 }}>
                        <Grid container spacing={1.5}>
                            <Grid item xs={12} lg={8}>
                                <SectionCard title="Today's Workforce" subtitle="Live workforce status for the selected scope" theme={theme}>
                                    <Grid container spacing={1.1}>
                                        {[
                                            { title: "Total Staff", value: formatNumber(kpis?.totalEmployees), subtitle: "All employees", icon: <GroupsRounded />, tone: theme.secondary },
                                            { title: "Present Today", value: formatNumber(kpis?.presentToday), subtitle: `${formatPercent((Number(kpis?.presentToday || 0) / Math.max(Number(kpis?.totalEmployees || 0), 1)) * 100)} of staff`, icon: <CheckCircleRounded />, tone: theme.success },
                                            { title: "Absent Today", value: formatNumber(kpis?.absentToday), subtitle: `${formatPercent((Number(kpis?.absentToday || 0) / Math.max(Number(kpis?.totalEmployees || 0), 1)) * 100)} of staff`, icon: <WarningAmberRounded />, tone: theme.danger },
                                            { title: "On Leave Today", value: formatNumber(kpis?.onLeaveToday), subtitle: `${formatPercent((Number(kpis?.onLeaveToday || 0) / Math.max(Number(kpis?.totalEmployees || 0), 1)) * 100)} of staff`, icon: <EventAvailableRounded />, tone: theme.warning },
                                        ].map((metric) => (
                                            <Grid item xs={6} md={3} key={metric.title}>
                                                <OverviewMetricCard {...metric} theme={theme} />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </SectionCard>
                            </Grid>

                            <Grid item xs={12} lg={4}>
                                <SectionCard title="Period Performance" subtitle={`${formatDateLabel(effectiveFilters.startDate)} - ${formatDateLabel(effectiveFilters.endDate)}`} theme={theme}>
                                    <Grid container spacing={1.1}>
                                        {[
                                            { title: "Attendance Rate", value: formatPercent(kpis?.attendanceRate), subtitle: `${formatDelta(attendanceDelta || 0, "pp")} vs previous`, icon: <PieChartRounded />, tone: theme.secondary, delta: attendanceDelta },
                                            { title: "Punctuality Rate", value: formatPercent(kpis?.punctualityRate), subtitle: `${formatDelta(punctualityDelta || 0, "pp")} vs previous`, icon: <CheckCircleRounded />, tone: theme.success, delta: punctualityDelta },
                                            { title: "Absenteeism Rate", value: formatPercent(kpis?.absenteeismRate), subtitle: `${formatDelta(absenteeismDelta || 0, "pp")} improvement`, icon: <TrendingDownRounded />, tone: theme.purple, delta: absenteeismDelta },
                                        ].map((metric) => (
                                            <Grid item xs={12} sm={4} lg={12} key={metric.title}>
                                                <OverviewMetricCard {...metric} theme={theme} />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </SectionCard>
                            </Grid>
                        </Grid>

                        <Grid container spacing={1.5}>
                            <Grid item xs={12} lg={6}>
                                <SectionCard
                                    title="Attendance Trend"
                                    subtitle="Attendance rate across working days in the selected period"
                                    theme={theme}
                                    action={
                                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                            {["Daily", "Weekly", "Monthly", "Yearly"].map((label, index) => (
                                                <Chip
                                                    key={label}
                                                    size="small"
                                                    label={label}
                                                    sx={{
                                                        height: 24,
                                                        borderRadius: "6px",
                                                        fontSize: 10,
                                                        fontWeight: 900,
                                                        bgcolor: index === 0 ? `${theme.secondary}14` : "transparent",
                                                        color: index === 0 ? theme.secondary : theme.muted,
                                                        border: `1px solid ${index === 0 ? `${theme.secondary}33` : theme.border}`,
                                                    }}
                                                />
                                            ))}
                                        </Stack>
                                    }
                                >
                                    <Box sx={{ height: { xs: 240, md: 285 } }}>
                                        {chartData.length ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={chartData} margin={{ top: 8, right: 10, left: -22, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.16)" />
                                                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: theme.muted }} minTickGap={16} />
                                                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: theme.muted }} tickFormatter={(value) => `${value}%`} />
                                                    <RechartsTooltip formatter={(value, name) => [name === "Attendance Rate" ? formatPercent(value) : formatNumber(value), name]} />
                                                    <Legend iconType="plainline" wrapperStyle={{ fontSize: 11 }} />
                                                    <Line type="monotone" dataKey="attendance" name="Attendance Rate" stroke={theme.secondary} strokeWidth={2.6} dot={{ r: 2.5 }} activeDot={{ r: 5 }} />
                                                    <Line type="monotone" dataKey="present" name="Present" stroke={theme.success} strokeDasharray="4 4" strokeWidth={1.8} dot={false} />
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
                                    <DonutVisualization data={attendanceDistributionRows} theme={theme} centerValue={formatNumber(kpis?.totalEmployees)} centerLabel="Total Staff" height={225} />
                                    <Stack spacing={0.8} sx={{ mt: 0.5 }}>
                                        {attendanceDistributionRows.map((item) => (
                                            <Stack key={item.name} direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                                <Stack direction="row" spacing={0.8} alignItems="center" sx={{ minWidth: 0 }}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: item.color, flexShrink: 0 }} />
                                                    <Typography sx={{ fontSize: 11, fontWeight: 800, color: theme.text }} noWrap>{item.name}</Typography>
                                                </Stack>
                                                <Typography sx={{ fontSize: 11, fontWeight: 900, color: theme.text }}>{formatNumber(item.value)}</Typography>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </SectionCard>
                            </Grid>

                            <Grid item xs={12} md={6} lg={3}>
                                <SectionCard title={isSupervisorScope ? "Team Insights" : "Attendance Quality"} subtitle="Exceptions requiring review" theme={theme}>
                                    <Stack spacing={1}>
                                        {attendanceQualityRows.map((row) => (
                                            <Box key={row.label} sx={{ p: 1.15, borderRadius: "8px", border: `1px solid ${theme.border}`, bgcolor: `${row.tone}08` }}>
                                                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: row.tone }}>{row.label}</Typography>
                                                    <Typography sx={{ fontSize: 18, fontWeight: 950, color: theme.text }}>{formatNumber(row.value)}</Typography>
                                                </Stack>
                                            </Box>
                                        ))}
                                    </Stack>
                                </SectionCard>
                            </Grid>
                        </Grid>

                        <Grid container spacing={1.5}>
                            <Grid item xs={12} lg={isSupervisorScope ? 7 : 6}>
                                <SectionCard title={isSupervisorScope ? "Staff Attendance" : "Attendance by Station"} subtitle={isSupervisorScope ? "Working-day attendance by team member" : "Station attendance, punctuality, and absence profile"} theme={theme}>
                                    <TableContainer sx={{ overflowX: "auto" }}>
                                        <Table size="small" stickyHeader sx={{ minWidth: isSupervisorScope ? 680 : 620 }}>
                                            <TableHead>
                                                <TableRow>
                                                    {(isSupervisorScope
                                                        ? ["Employee", "Present Days", "Absent Days", "Attendance", "Status"]
                                                        : ["Station", "Staff", "Attendance", "Punctuality", "Absenteeism", "Trend"]
                                                    ).map((heading) => (
                                                        <TableCell key={heading} align={["Staff", "Attendance", "Punctuality", "Absenteeism", "Trend", "Present Days", "Absent Days", "Status"].includes(heading) ? "right" : "left"} sx={{ fontSize: 10, fontWeight: 950, color: theme.primary, bgcolor: "#fff", borderColor: theme.border }}>
                                                            {heading}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {(isSupervisorScope ? processedSummaryRows.slice(0, 6) : sortedStations.slice(0, 6)).map((row) => {
                                                    const rate = Number(row.attendanceRate || 0);
                                                    return (
                                                        <TableRow key={row.id || row.station || row.name}>
                                                            <TableCell sx={{ minWidth: 160 }}>
                                                                <Typography sx={{ fontSize: 11, fontWeight: 900, color: theme.text }} noWrap>{isSupervisorScope ? row.name : row.station}</Typography>
                                                            </TableCell>
                                                            {isSupervisorScope ? (
                                                                <>
                                                                    <TableCell align="right" sx={{ fontSize: 11 }}>{formatNumber(row.daysPresent)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 11 }}>{formatNumber(row.daysAbsent)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 11, fontWeight: 900, color: getAttendanceColor(rate, theme) }}>{formatPercent(rate)}</TableCell>
                                                                    <TableCell align="right">
                                                                        <Chip size="small" label={rate >= 90 ? "Good" : rate >= 80 ? "Monitor" : "Needs Attention"} sx={{ height: 22, borderRadius: "6px", fontSize: 10, fontWeight: 900, color: getAttendanceColor(rate, theme), bgcolor: `${getAttendanceColor(rate, theme)}12` }} />
                                                                    </TableCell>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <TableCell align="right" sx={{ fontSize: 11 }}>{formatNumber(row.staffCount)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 11, fontWeight: 900, color: getAttendanceColor(rate, theme) }}>{formatPercent(rate)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 11 }}>{formatPercent(row.punctualityRate)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 11 }}>{formatPercent(row.absenteeismRate)}</TableCell>
                                                                    <TableCell align="right">{rate >= 90 ? "up" : rate >= 80 ? "flat" : "down"}</TableCell>
                                                                </>
                                                            )}
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </SectionCard>
                            </Grid>

                            <Grid item xs={12} lg={isSupervisorScope ? 5 : 6}>
                                <SectionCard title={isSupervisorScope ? "Exceptions Requiring Review" : "Department Performance"} subtitle={isSupervisorScope ? "Team members needing attendance follow-up" : "Department attendance and punctuality profile"} theme={theme}>
                                    <TableContainer sx={{ overflowX: "auto" }}>
                                        <Table size="small" stickyHeader sx={{ minWidth: 620 }}>
                                            <TableHead>
                                                <TableRow>
                                                    {(isSupervisorScope
                                                        ? ["Employee", "Absent", "Attendance", "Status"]
                                                        : ["Department", "Staff", "Attendance", "Punctuality", "Absenteeism", "Late", "Early"]
                                                    ).map((heading) => (
                                                        <TableCell key={heading} align={["Staff", "Attendance", "Punctuality", "Absenteeism", "Late", "Early", "Absent", "Status"].includes(heading) ? "right" : "left"} sx={{ fontSize: 10, fontWeight: 950, color: theme.primary, bgcolor: "#fff", borderColor: theme.border }}>
                                                            {heading}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {(isSupervisorScope ? attentionReviewRows : sortedDepartments.slice(0, 6)).map((row) => {
                                                    const rate = Number(row.attendanceRate || 0);
                                                    return (
                                                        <TableRow key={row.id || row.department || row.name}>
                                                            <TableCell sx={{ minWidth: 160 }}>
                                                                <Typography sx={{ fontSize: 11, fontWeight: 900, color: theme.text }} noWrap>{isSupervisorScope ? row.name : row.department}</Typography>
                                                            </TableCell>
                                                            {isSupervisorScope ? (
                                                                <>
                                                                    <TableCell align="right" sx={{ fontSize: 11 }}>{formatNumber(row.daysAbsent)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 11, fontWeight: 900, color: getAttendanceColor(rate, theme) }}>{formatPercent(rate)}</TableCell>
                                                                    <TableCell align="right"><Chip size="small" label="Pending" sx={{ height: 22, borderRadius: "6px", fontSize: 10, fontWeight: 900, color: "#B45309", bgcolor: "rgba(245,158,11,0.12)" }} /></TableCell>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <TableCell align="right" sx={{ fontSize: 11 }}>{formatNumber(row.staffCount)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 11, fontWeight: 900, color: getAttendanceColor(rate, theme) }}>{formatPercent(rate)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 11 }}>{formatPercent(row.punctualityRate)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 11 }}>{formatPercent(row.absenteeismRate)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 11 }}>{formatNumber(row.totalLateCount)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 11 }}>{formatNumber(row.earlyDepartures || 0)}</TableCell>
                                                                </>
                                                            )}
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </SectionCard>
                            </Grid>
                        </Grid>

                        <Grid container spacing={1.5}>
                            {(userRank === "ceo" ? sortedStations : sortedDepartments).length > 0 && (
                                <Grid item xs={12} lg={7}>
                                    <SectionCard title={userRank === "ceo" ? "Station Performance" : "Station Insights"} subtitle={userRank === "ceo" ? "Executive comparison across KMFRI stations" : "Best, lowest, and most improved operational signals"} theme={theme}>
                                        <Stack spacing={1.1}>
                                            {(userRank === "ceo" ? sortedStations : sortedDepartments).slice(0, 5).map((row) => {
                                                const label = userRank === "ceo" ? row.station : row.department;
                                                const rate = Number(row.attendanceRate || 0);
                                                return (
                                                    <Box key={label} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "160px 1fr 64px" }, gap: 1, alignItems: "center" }}>
                                                        <Typography sx={{ fontSize: 11, fontWeight: 900, color: theme.text }} noWrap>{label || "Unassigned"}</Typography>
                                                        <LinearProgress variant="determinate" value={safePercent(rate)} sx={{ height: 8, borderRadius: 999, bgcolor: `${theme.muted}22`, "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: getAttendanceColor(rate, theme) } }} />
                                                        <Typography sx={{ fontSize: 11, fontWeight: 950, color: getAttendanceColor(rate, theme), textAlign: { xs: "left", sm: "right" } }}>{formatPercent(rate)}</Typography>
                                                    </Box>
                                                );
                                            })}
                                        </Stack>
                                    </SectionCard>
                                </Grid>
                            )}

                            <Grid item xs={12} lg={userRank === "ceo" ? 5 : 12}>
                                <SectionCard title={userRank === "ceo" ? "Executive Summary" : "Management Insights"} subtitle="High-signal cards for management action" theme={theme}>
                                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 1 }}>
                                        {compactInsightCards.map((card) => (
                                            <InsightTile
                                                key={card.label}
                                                label={card.label}
                                                value={card.title}
                                                subtitle={card.value}
                                                tone={card.tone}
                                                positive={card.positive}
                                                theme={theme}
                                            />
                                        ))}
                                    </Box>
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.4, color: theme.muted }}>
                                        <HelpOutlineRounded sx={{ fontSize: 16 }} />
                                        <Typography sx={{ fontSize: 10.5, fontWeight: 700 }}>
                                            Data is based on biometric records. Last updated{" "}
                                            {new Date().toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: EAT_TIMEZONE })} EAT.
                                        </Typography>
                                    </Stack>
                                </SectionCard>
                            </Grid>
                        </Grid>
                    </Box>

                    {showLegacyAnalytics && (
                        <>
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12}>
                    <SectionCard title="Today's Workforce" subtitle="Current daily attendance position" theme={theme}>
                        <Grid container spacing={1.2}>
                            <Grid item xs={6} sm={3}>
                                <OverviewMetricCard title="Total Staff" value={formatNumber(kpis?.totalEmployees)} subtitle="All employees" icon={<GroupsRounded />} tone={theme.secondary} theme={theme} />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <OverviewMetricCard title="Present Today" value={formatNumber(kpis?.presentToday)} subtitle={`${formatPercent((Number(kpis?.presentToday || 0) / Math.max(Number(kpis?.totalEmployees || 0), 1)) * 100)} of staff`} icon={<CheckCircleRounded />} tone={theme.success} theme={theme} />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <OverviewMetricCard title="Absent Today" value={formatNumber(kpis?.absentToday)} subtitle={`${formatPercent((Number(kpis?.absentToday || 0) / Math.max(Number(kpis?.totalEmployees || 0), 1)) * 100)} of staff`} icon={<WarningAmberRounded />} tone={theme.danger} theme={theme} />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <OverviewMetricCard title="On Leave Today" value={formatNumber(kpis?.onLeaveToday)} subtitle={`${formatPercent((Number(kpis?.onLeaveToday || 0) / Math.max(Number(kpis?.totalEmployees || 0), 1)) * 100)} of staff`} icon={<EventAvailableRounded />} tone={theme.warning} theme={theme} />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <OverviewMetricCard title="Late Today" value={formatNumber(lateToday)} subtitle="After grace period" icon={<HourglassBottomRounded />} tone={theme.purple} theme={theme} />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <OverviewMetricCard title="Early Departures" value={formatNumber(earlyDepartureCount)} subtitle="Selected period" icon={<TrendingDownRounded />} tone={theme.warning} theme={theme} />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <OverviewMetricCard title="Outside Duty" value={formatNumber(outsideClockingCount)} subtitle="Off-premise records" icon={<ShieldRounded />} tone={theme.secondary} theme={theme} />
                            </Grid>
                        </Grid>
                    </SectionCard>
                </Grid>

                <Grid item xs={12} lg={6}>
                    <SectionCard title="Period Performance" subtitle={`${formatDateLabel(effectiveFilters.startDate)} to ${formatDateLabel(effectiveFilters.endDate)} compared with ${previousPeriodLabel}`} theme={theme}>
                        <Grid container spacing={1.2}>
                            <Grid item xs={6} sm={3}>
                                <OverviewMetricCard title="Attendance Rate" value={formatPercent(kpis?.attendanceRate)} subtitle="Selected period" icon={<PieChartRounded />} tone={theme.secondary} delta={attendanceDelta} deltaLabel="vs prev" theme={theme} />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <OverviewMetricCard title="Punctuality Rate" value={formatPercent(kpis?.punctualityRate)} subtitle="On-time arrivals" icon={<CheckCircleRounded />} tone={theme.success} delta={punctualityDelta} deltaLabel="vs prev" theme={theme} />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <OverviewMetricCard title="Absenteeism Rate" value={formatPercent(kpis?.absenteeismRate)} subtitle="Lower is better" icon={<TrendingDownRounded />} tone={theme.danger} delta={absenteeismDelta} deltaLabel="improvement" theme={theme} />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <OverviewMetricCard title="Productivity Index" value={formatPercent(kpis?.productivityIndex)} subtitle={`${Number(kpis?.averageWorkingHours || 0).toFixed(1)} avg hrs`} icon={<AssessmentRounded />} tone={theme.purple} delta={productivityDelta} deltaLabel="vs prev" theme={theme} />
                            </Grid>
                        </Grid>
                    </SectionCard>
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} lg={4}>
                    <SectionCard title={isSupervisorScope ? "Top 3 Employees in Scope" : "Overall Top 3 Employees"} subtitle={isSupervisorScope ? "Highest attendance rate in your department and station" : "Highest attendance rate across all stations"} theme={theme}>
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
                    <SectionCard title={isSupervisorScope ? "Top 3 Employees at Station" : "Top 3 Employees by Station"} subtitle={isSupervisorScope ? "Station-scoped leaders by attendance rate" : "Station leaders by attendance rate"} theme={theme}>
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
                            {isSupervisorScope
                                ? "This station-scoped ranking helps you recognise reliable attendance inside the department you supervise."
                                : "Station-level top 3 lists help management recognise strong attendance locally without comparing small and large stations unfairly."}
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

            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} lg={6}>
                    <SectionCard title={isSupervisorScope ? "Assigned Station Attendance" : "Attendance by Station"} subtitle="Attendance and absenteeism shown together for site comparison" theme={theme}>
                        {stationPerformanceRows.length ? (
                            <ScrollableChartFrame minWidth={chartMinWidth(stationPerformanceRows.length, 118, 720)} theme={theme}>
                                <Box sx={{ height: 310 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stationPerformanceRows} margin={{ top: 8, right: 14, left: -14, bottom: 58 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.16)" />
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: theme.muted }} interval={0} angle={-22} textAnchor="end" height={72} />
                                            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: theme.muted }} tickFormatter={(value) => `${value}%`} />
                                            <RechartsTooltip formatter={(value, name) => [formatPercent(value), name]} />
                                            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                                            <Bar dataKey="attendanceRate" name="Attendance %" fill={theme.success} radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="absenteeismRate" name="Absenteeism %" fill={theme.danger} radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </ScrollableChartFrame>
                        ) : (
                            <EmptyState label="No station data available." theme={theme} />
                        )}
                        <ChartReading
                            theme={theme}
                            items={[
                                { label: "Attendance bar", text: "Higher green bars mean the station is recording more expected staff-days as present.", tone: theme.success },
                                { label: "Absenteeism bar", text: "Higher red bars show where absence is reducing daily station coverage.", tone: theme.danger },
                            ]}
                        />
                        <TableContainer sx={{ mt: 1.2, maxHeight: 250 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 900, bgcolor: "#fff" }}>Station</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "#fff" }}>Staff</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "#fff" }}>Late</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "#fff" }}>Leave Days</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "#fff" }}>Attendance</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stationPerformanceRows.map((station) => (
                                        <TableRow key={station.name}>
                                            <TableCell sx={{ minWidth: 160 }}>
                                                <Typography sx={{ fontSize: 12, fontWeight: 800, color: theme.text, overflowWrap: "anywhere" }}>{station.name}</Typography>
                                            </TableCell>
                                            <TableCell align="right">{formatNumber(station.staff)}</TableCell>
                                            <TableCell align="right">{formatNumber(station.lateCount)}</TableCell>
                                            <TableCell align="right">{formatNumber(station.onLeaveDays)}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 900, color: getAttendanceColor(station.attendanceRate, theme) }}>{formatPercent(station.attendanceRate)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </SectionCard>
                </Grid>

                <Grid item xs={12} lg={6}>
                    <SectionCard title="Attendance by Department" subtitle="Department comparison using the same attendance and absence measures" theme={theme}>
                        {departmentPerformanceRows.length ? (
                            <ScrollableChartFrame minWidth={chartMinWidth(departmentPerformanceRows.length, 128, 760)} theme={theme}>
                                <Box sx={{ height: 310 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={departmentPerformanceRows} margin={{ top: 8, right: 14, left: -14, bottom: 74 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.16)" />
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: theme.muted }} interval={0} angle={-24} textAnchor="end" height={90} />
                                            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: theme.muted }} tickFormatter={(value) => `${value}%`} />
                                            <RechartsTooltip formatter={(value, name) => [formatPercent(value), name]} />
                                            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                                            <Bar dataKey="attendanceRate" name="Attendance %" fill={theme.secondary} radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="absenteeismRate" name="Absenteeism %" fill={theme.warning} radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </ScrollableChartFrame>
                        ) : (
                            <EmptyState label="No department data available." theme={theme} />
                        )}
                        <ChartReading
                            theme={theme}
                            items={[
                                { label: "Attendance bar", text: "A high blue bar means the department is meeting more of its expected working-day coverage.", tone: theme.secondary },
                                { label: "Absenteeism bar", text: "A high amber bar flags departments where absence needs supervisor or HR follow-up.", tone: theme.warning },
                            ]}
                        />
                        <TableContainer sx={{ mt: 1.2, maxHeight: 250 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 900, bgcolor: "#fff" }}>Department</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "#fff" }}>Staff</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "#fff" }}>Late</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "#fff" }}>Leave Days</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "#fff" }}>Attendance</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {departmentPerformanceRows.map((department) => (
                                        <TableRow key={department.name}>
                                            <TableCell sx={{ minWidth: 220 }}>
                                                <Typography sx={{ fontSize: 12, fontWeight: 800, color: theme.text, overflowWrap: "anywhere" }}>{department.name}</Typography>
                                            </TableCell>
                                            <TableCell align="right">{formatNumber(department.staff)}</TableCell>
                                            <TableCell align="right">{formatNumber(department.lateCount)}</TableCell>
                                            <TableCell align="right">{formatNumber(department.onLeaveDays)}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 900, color: getAttendanceColor(department.attendanceRate, theme) }}>{formatPercent(department.attendanceRate)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </SectionCard>
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} lg={6}>
                    <SectionCard title="Quality and Readiness Signals" subtitle="Key rates combined in one comparison" theme={theme}>
                        <ScrollableChartFrame minWidth={chartMinWidth(qualitySignalRows.length, 120, 720)} theme={theme}>
                            <Box sx={{ height: 290 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={qualitySignalRows} margin={{ top: 8, right: 12, left: -14, bottom: 44 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.16)" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: theme.muted }} interval={0} angle={-18} textAnchor="end" height={56} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: theme.muted }} tickFormatter={(value) => `${value}%`} />
                                        <RechartsTooltip formatter={(value) => [formatPercent(value), "Rate"]} />
                                        <Bar dataKey="value" name="Rate" radius={[6, 6, 0, 0]}>
                                            {qualitySignalRows.map((row) => (
                                                <Cell key={row.name} fill={row.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </ScrollableChartFrame>
                        <ChartReading
                            theme={theme}
                            items={[
                                { label: "High bars are generally good", text: "Attendance, punctuality, productivity, biometric coverage, and device uptime should trend high.", tone: theme.success },
                                { label: "Absenteeism is the exception", text: "The absenteeism bar should remain low; if it rises while attendance falls, coverage risk is increasing.", tone: theme.danger },
                            ]}
                        />
                    </SectionCard>
                </Grid>

                <Grid item xs={12} lg={6}>
                    <SectionCard title="Operational Exceptions" subtitle="Counts that need review or explanation" theme={theme}>
                        <ScrollableChartFrame minWidth={chartMinWidth(exceptionSignalRows.length, 112, 760)} theme={theme}>
                            <Box sx={{ height: 290 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={exceptionSignalRows} margin={{ top: 8, right: 12, left: -14, bottom: 54 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.16)" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: theme.muted }} interval={0} angle={-20} textAnchor="end" height={68} />
                                        <YAxis tick={{ fontSize: 10, fill: theme.muted }} allowDecimals={false} />
                                        <RechartsTooltip formatter={(value) => [formatNumber(value), "Count"]} />
                                        <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
                                            {exceptionSignalRows.map((row) => (
                                                <Cell key={row.name} fill={row.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </ScrollableChartFrame>
                        <ChartReading
                            theme={theme}
                            items={[
                                { label: "High bars need action", text: "Absence, missing records, late arrivals, and early departures should trigger supervisor follow-up.", tone: theme.warning },
                                { label: "Outside duty needs matching", text: "Off-premise records are acceptable when they match approved fieldwork or authorised outside clocking.", tone: theme.secondary },
                            ]}
                        />
                    </SectionCard>
                </Grid>

                <Grid item xs={12} lg={6}>
                    <SectionCard title="Device and Biometric Readiness" subtitle="Device availability and user registration in one view" theme={theme}>
                        <ScrollableChartFrame minWidth={chartMinWidth(deviceReadinessRows.length, 126, 700)} theme={theme}>
                            <Box sx={{ height: 280 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={deviceReadinessRows} margin={{ top: 8, right: 12, left: -14, bottom: 54 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.16)" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: theme.muted }} interval={0} angle={-20} textAnchor="end" height={68} />
                                        <YAxis tick={{ fontSize: 10, fill: theme.muted }} allowDecimals={false} />
                                        <RechartsTooltip formatter={(value) => [formatNumber(value), "Count"]} />
                                        <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
                                            {deviceReadinessRows.map((row) => (
                                                <Cell key={row.name} fill={row.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </ScrollableChartFrame>
                        <ChartReading
                            theme={theme}
                            items={[
                                { label: "Registration coverage", text: "Pending biometric users can slow attendance verification or require manual HR support.", tone: theme.secondary },
                                { label: "Device exceptions", text: "Inactive and lost devices can explain failed clocking attempts even when staff are available.", tone: theme.warning },
                            ]}
                        />
                    </SectionCard>
                </Grid>

                <Grid item xs={12} lg={6}>
                    <SectionCard title="Management Recommendations" subtitle="Actionable readings from the selected period" theme={theme}>
                        <Grid container spacing={1.2}>
                            {managementRecommendations.map((note) => (
                                <Grid item xs={12} sm={6} key={note.label}>
                                    <InsightTile
                                        label={note.label}
                                        value={note.value}
                                        subtitle={note.subtitle}
                                        tone={note.tone}
                                        positive={note.positive}
                                        theme={theme}
                                    />
                                </Grid>
                            ))}
                            <Grid item xs={12}>
                                <Box sx={{ p: 1.5, borderRadius: "8px", bgcolor: `${theme.success}12`, border: `1px solid ${theme.success}33` }}>
                                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                                        <Box>
                                            <Typography sx={{ fontSize: 11, fontWeight: 900, color: theme.success }}>{isSupervisorScope ? "Assigned Station" : "Best Performing Station"}</Typography>
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
                                            <Typography sx={{ fontSize: 11, fontWeight: 900, color: theme.danger }}>{isSupervisorScope ? "Scope Attendance" : "Lowest Attendance Station"}</Typography>
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
                <Grid item xs={12}>
                    <SectionCard title="Summary" subtitle="Selected period snapshot" theme={theme}>
                        <Stack spacing={1.2}>
                            {[
                                ["Scope", scopeLabel],
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

                        </>
                    )}
                </>
            )}

            {activeReportTab !== "analytics" && (
            <Box sx={{ mt: 2 }}>
                <SectionCard
                    title="Administrative Reference"
                    subtitle="Attendance records and staff summary for audit, HR review, and station administration"
                    theme={theme}
                    action={
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Chip
                                size="small"
                                label={`${formatNumber(referenceMetrics.records)} records`}
                                sx={{ borderRadius: "8px", bgcolor: `${theme.secondary}12`, color: theme.secondary, fontWeight: 900 }}
                            />
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={referenceLoading ? <CircularProgress size={12} /> : <RefreshRounded />}
                                onClick={loadReferenceData}
                                disabled={referenceLoading}
                                sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 800, borderColor: theme.border, color: theme.primary }}
                            >
                                Refresh Reference
                            </Button>
                        </Stack>
                    }
                >
                    {referenceError && (
                        <Alert severity="warning" sx={{ mb: 1.5, borderRadius: "8px" }}>
                            {referenceError}
                        </Alert>
                    )}

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", md: "repeat(5, minmax(0, 1fr))" },
                            gap: 1.2,
                            mb: 1.5,
                        }}
                    >
                        <StatCard title="Reference Records" value={formatNumber(referenceMetrics.records)} subtitle="Clocking rows in scope" icon={<HistoryRounded />} tone={theme.secondary} theme={theme} />
                        <StatCard title="Summary Staff" value={formatNumber(referenceMetrics.summaryRows)} subtitle="People in summary" icon={<GroupsRounded />} tone={theme.accent} theme={theme} />
                        <StatCard title="Open Sessions" value={formatNumber(referenceMetrics.openSessions)} subtitle="Missing clock-out" icon={<WarningAmberRounded />} tone={referenceMetrics.openSessions ? theme.warning : theme.success} theme={theme} />
                        <StatCard title="Late Records" value={formatNumber(referenceMetrics.lateRecords)} subtitle="Late arrivals in period" icon={<HourglassBottomRounded />} tone={referenceMetrics.lateRecords ? theme.danger : theme.success} theme={theme} />
                        <StatCard title="Avg Summary Rate" value={formatPercent(referenceMetrics.averageAttendance)} subtitle="Mean staff attendance" icon={<TableChartRounded />} tone={theme.primary} theme={theme} />
                    </Box>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" sx={{ mb: 1.5 }}>
                        <TextField
                            size="small"
                            label="Search records and summary"
                            value={referenceSearch}
                            onChange={(event) => {
                                setReferenceSearch(event.target.value);
                                setRecordPage(0);
                                setSummaryPage(0);
                            }}
                            sx={{ minWidth: { xs: "100%", md: 360 } }}
                        />
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {activeReportTab === "records" && (
                            <Button
                                variant="contained"
                                startIcon={pdfExporting === "records" ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <DownloadRounded />}
                                onClick={handleExportRecordsPdf}
                                disabled={!filteredRecords.length}
                                sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 800, bgcolor: theme.primary }}
                            >
                                {pdfExporting === "records" ? "Exporting..." : "Export Records PDF"}
                            </Button>
                            )}
                            {activeReportTab === "summary" && (
                            <Button
                                variant="contained"
                                startIcon={pdfExporting === "summary" ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <DownloadRounded />}
                                onClick={handleExportSummaryPdf}
                                disabled={!filteredSummaryRows.length}
                                sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 800, bgcolor: theme.primary }}
                            >
                                {pdfExporting === "summary" ? "Exporting..." : "Export Summary PDF"}
                            </Button>
                            )}
                        </Stack>
                    </Stack>

                    <Grid container spacing={2}>
                        {activeReportTab === "records" && (
                        <Grid item xs={12}>
                            <Box sx={{ border: `1px solid ${theme.border}`, borderRadius: "8px", overflow: "hidden" }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ px: 1.5, py: 1, bgcolor: `${theme.secondary}08` }}>
                                    <Box>
                                        <Typography sx={{ fontSize: 13, fontWeight: 900, color: theme.text }}>Attendance Records</Typography>
                                        <Typography sx={{ fontSize: 11, color: theme.muted }}>Clock-in and clock-out reference rows within {scopeLabel}</Typography>
                                    </Box>
                                    {referenceLoading && <CircularProgress size={16} sx={{ color: theme.secondary }} />}
                                </Stack>
                                <TableContainer sx={{ maxHeight: 430 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                {["Employee", "Date", "Clock In", "Clock Out","Timing", "In Location", "Out Location", "Department"].map((heading) => (
                                                    <TableCell key={heading} sx={{ fontWeight: 900, bgcolor: "#fff", whiteSpace: "nowrap" }}>
                                                        {heading}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedRecords.map((row) => (
                                                <TableRow key={row.id}>
                                                    <TableCell sx={{ minWidth: 180 }}>
                                                        <Typography sx={{ fontSize: 12, fontWeight: 900, color: theme.text }}>{row.name}</Typography>
                                                        <Typography sx={{ fontSize: 10, color: theme.muted }}>{row.employeeId}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ whiteSpace: "nowrap" }}>{row.date}</TableCell>
                                                    <TableCell>{row.clockIn}</TableCell>
                                                    <TableCell>{row.clockOut}</TableCell>
                                                    <TableCell>
                                                        <Chip size="small" label={row.timing} sx={{ height: 22, borderRadius: "8px", fontWeight: 800, bgcolor: row.timing === "Late" ? `${theme.warning}18` : `${theme.success}16`, color: row.timing === "Late" ? "#B45309" : theme.success }} />
                                                    </TableCell>
                                                  
                                                    <TableCell sx={{ minWidth: 180, maxWidth: 260 }}>
                                                        <Typography sx={{ fontSize: 11, color: theme.muted, overflowWrap: "anywhere" }}>{row.inLocation}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ minWidth: 180, maxWidth: 260 }}>
                                                        <Typography sx={{ fontSize: 11, color: theme.muted, overflowWrap: "anywhere" }}>{row.outLocation}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ minWidth: 170 }}>{row.department}</TableCell>
                                                </TableRow>
                                            ))}
                                            {!paginatedRecords.length && (
                                                <TableRow>
                                                    <TableCell colSpan={11}>
                                                        <EmptyState label={referenceLoading ? "Loading attendance records..." : "No attendance records match the selected scope."} theme={theme} />
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    component="div"
                                    count={filteredRecords.length}
                                    page={recordPage}
                                    onPageChange={(_, pageValue) => setRecordPage(pageValue)}
                                    rowsPerPage={recordRowsPerPage}
                                    onRowsPerPageChange={(event) => {
                                        setRecordRowsPerPage(Number(event.target.value));
                                        setRecordPage(0);
                                    }}
                                    rowsPerPageOptions={[10, 25, 50, 100]}
                                />
                            </Box>
                        </Grid>
                        )}

                        {activeReportTab === "summary" && (
                        <Grid item xs={12}>
                            <Box sx={{ border: `1px solid ${theme.border}`, borderRadius: "8px", overflow: "hidden" }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ px: 1.5, py: 1, bgcolor: `${theme.accent}08` }}>
                                    <Box>
                                        <Typography sx={{ fontSize: 13, fontWeight: 900, color: theme.text }}>Attendance Summary</Typography>
                                        <Typography sx={{ fontSize: 11, color: theme.muted }}>Working-day present and absent totals per staff member</Typography>
                                    </Box>
                                    <Chip size="small" label={`${workingDaysInReferenceRange} working days`} sx={{ borderRadius: "8px", fontWeight: 900, bgcolor: `${theme.accent}16`, color: theme.primary }} />
                                </Stack>
                                <TableContainer sx={{ maxHeight: 430 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                {["Employee", "Role", "Department", "Total Days", "Working Days", "Present", "Absent", "Attendance"].map((heading) => (
                                                    <TableCell key={heading} sx={{ fontWeight: 900, bgcolor: "#fff", whiteSpace: "nowrap" }} align={["Total Days", "Working Days", "Present", "Absent"].includes(heading) ? "right" : "left"}>
                                                        {heading}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedSummaryRows.map((row) => (
                                                <TableRow key={row.id}>
                                                    <TableCell sx={{ minWidth: 180 }}>
                                                        <Typography sx={{ fontSize: 12, fontWeight: 900, color: theme.text }}>{row.name}</Typography>
                                                        <Typography sx={{ fontSize: 10, color: theme.muted }}>{row.employeeId}</Typography>
                                                    </TableCell>
                                                    <TableCell>{humanizeFilterValue(row.role)}</TableCell>
                                                    <TableCell sx={{ minWidth: 180 }}>{row.department}</TableCell>
                                                    <TableCell align="right">{formatNumber(row.totalDays)}</TableCell>
                                                    <TableCell align="right">{formatNumber(row.workingDays)}</TableCell>
                                                    <TableCell align="right">{formatNumber(row.daysPresent)}</TableCell>
                                                    <TableCell align="right">{formatNumber(row.daysAbsent)}</TableCell>
                                                    <TableCell sx={{ minWidth: 140 }}>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={safePercent(row.attendanceRate)}
                                                                sx={{
                                                                    width: 72,
                                                                    height: 7,
                                                                    borderRadius: 10,
                                                                    bgcolor: "rgba(100,116,139,0.16)",
                                                                    "& .MuiLinearProgress-bar": {
                                                                        bgcolor: getAttendanceColor(row.attendanceRate, theme),
                                                                        borderRadius: 10,
                                                                    },
                                                                }}
                                                            />
                                                            <Typography sx={{ fontSize: 12, fontWeight: 900, color: getAttendanceColor(row.attendanceRate, theme) }}>
                                                                {formatPercent(row.attendanceRate)}
                                                            </Typography>
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {!paginatedSummaryRows.length && (
                                                <TableRow>
                                                    <TableCell colSpan={10}>
                                                        <EmptyState label={referenceLoading ? "Loading attendance summary..." : "No summary rows match the selected scope."} theme={theme} />
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    component="div"
                                    count={filteredSummaryRows.length}
                                    page={summaryPage}
                                    onPageChange={(_, pageValue) => setSummaryPage(pageValue)}
                                    rowsPerPage={summaryRowsPerPage}
                                    onRowsPerPageChange={(event) => {
                                        setSummaryRowsPerPage(Number(event.target.value));
                                        setSummaryPage(0);
                                    }}
                                    rowsPerPageOptions={[10, 25, 50, 100]}
                                />
                            </Box>
                        </Grid>
                        )}
                    </Grid>

                    <InsightNote theme={theme} tone={referenceMetrics.openSessions ? theme.warning : theme.secondary}>
                        This reference layer turns the dashboard from a chart-only view into an administration workspace: trends reveal the issue, records prove it, and summary rows support follow-up.
                    </InsightNote>
                </SectionCard>
            </Box>
            )}

            {activeReportTab === "analytics" && (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12}>
                        <SectionCard
                            title={
                                userRank === "ceo"
                                    ? "Executive Recommendations"
                                    : isSupervisorScope
                                        ? "Supervisor Recommendations"
                                        : isFullHr
                                            ? "Mombasa Centre HR Recommendations"
                                            : isStationScopedHr
                                                ? `${supervisorStation || "Station"} HR Recommendations`
                                                : "Management Recommendations"
                            }
                            subtitle={
                                userRank === "ceo"
                                    ? "Strategic actions for organisation-wide attendance governance"
                                    : isSupervisorScope
                                        ? "Team-level actions for HOD and supervisor follow-up"
                                        : isFullHr
                                            ? "Cross-station and cross-department actions for headquarters HR"
                                            : isStationScopedHr
                                                ? "Station-specific actions for local HR administration"
                                                : "Actionable recommendations from the selected attendance period"
                            }
                            theme={theme}
                        >
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "1fr",
                                        sm: "repeat(2, minmax(0, 1fr))",
                                        xl: "repeat(3, minmax(0, 1fr))",
                                    },
                                    gap: 1.2,
                                }}
                            >
                                {roleRecommendationCards.map((card) => (
                                    <RecommendationCard
                                        key={`${card.chip}-${card.label}`}
                                        {...card}
                                        theme={theme}
                                    />
                                ))}
                            </Box>
                        </SectionCard>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default OrganisationStats;
