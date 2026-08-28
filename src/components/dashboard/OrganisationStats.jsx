import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
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
const HEATMAP_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

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
];

const clockingTypeOptions = [
    { value: "", label: "All Clocking Types" },
    { value: "user", label: "User" },
    { value: "system", label: "System" },
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

const attendanceReportTabs = ["analytics", "records", "summary"];

const normalizeReportTab = (value) =>
    attendanceReportTabs.includes(value) ? value : "analytics";

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

const getRecordDateKey = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return getDateInputValue(date);
};

const getRecordHours = (record) => {
    if (!record?.rawClockIn || !record?.rawClockOut) return 0;
    const start = new Date(record.rawClockIn);
    const end = new Date(record.rawClockOut);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    return Math.max((end - start) / 3600000, 0);
};

const getNairobiHourDecimal = (value) => {
    if (!value) return 0;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 0;
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat("en-GB", {
            timeZone: EAT_TIMEZONE,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).formatToParts(date).map((part) => [part.type, part.value])
    );
    return Number(parts.hour || 0) + Number(parts.minute || 0) / 60;
};

const formatDuration = (hours) => {
    const safeHours = Math.max(Number(hours || 0), 0);
    const wholeHours = Math.floor(safeHours);
    const minutes = Math.round((safeHours - wholeHours) * 60);
    return `${wholeHours}h ${String(minutes).padStart(2, "0")}m`;
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

const getWeekdayCounts = (startDate, endDate) => {
    const counts = HEATMAP_WEEKDAYS.reduce((acc, day) => ({ ...acc, [day]: 0 }), {});
    const totalDays = getTotalDays(startDate, endDate);
    if (!totalDays) return counts;

    const cursor = new Date(`${startDate}T00:00:00+03:00`);
    for (let index = 0; index < totalDays; index += 1) {
        const day = cursor.toLocaleDateString("en-US", { weekday: "short", timeZone: EAT_TIMEZONE });
        if (Object.prototype.hasOwnProperty.call(counts, day)) counts[day] += 1;
        cursor.setDate(cursor.getDate() + 1);
    }

    return counts;
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

const humanizeStaffAttribute = (value) => {
    if (!value) return "N/A";
    return titleCase(value);
};

const buildParams = (filters) => {
    const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        station: filters.station || "",
        department: filters.department || "",
        clockingType: filters.clockingType || "",
        role: "",
    };

    const [kind, value] = String(filters.staffFilter || "").split(":");
    if (kind === "role") params.role = value;

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

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
};

const describeDonutSegment = (centerX, centerY, outerRadius, innerRadius, startAngle, endAngle) => {
    const safeEndAngle = Math.min(endAngle, startAngle + 359.99);
    const outerStart = polarToCartesian(centerX, centerY, outerRadius, safeEndAngle);
    const outerEnd = polarToCartesian(centerX, centerY, outerRadius, startAngle);
    const innerStart = polarToCartesian(centerX, centerY, innerRadius, startAngle);
    const innerEnd = polarToCartesian(centerX, centerY, innerRadius, safeEndAngle);
    const largeArcFlag = safeEndAngle - startAngle <= 180 ? "0" : "1";

    return [
        `M ${outerStart.x} ${outerStart.y}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${outerEnd.x} ${outerEnd.y}`,
        `L ${innerStart.x} ${innerStart.y}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerEnd.x} ${innerEnd.y}`,
        "Z",
    ].join(" ");
};

const DonutVisualization = ({ data, theme, centerValue, centerLabel, height = 260 }) => {
    const legendRows = data?.length ? data : [];
    const visibleRows = legendRows.filter((item) => Number(item.value || 0) > 0);
    const chartRows = visibleRows.length
        ? visibleRows
        : [{ name: "No attendance yet", value: 1, color: theme.border, muted: true }];
    const total = chartRows.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
    let currentAngle = 0;

    const segments = chartRows.map((item) => {
        const sweep = (Number(item.value || 0) / total) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sweep;
        currentAngle = endAngle;
        return {
            ...item,
            path: describeDonutSegment(60, 60, 48, 28, startAngle, endAngle),
            percent: total ? (Number(item.value || 0) / total) * 100 : 0,
        };
    });

    return (
        <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ height, minHeight: height, width: "100%" }}>
            <Box sx={{ position: "relative", width: "min(100%, 210px)", aspectRatio: "1 / 1" }}>
                <svg viewBox="0 0 120 120" width="100%" height="100%" role="img" aria-label={centerLabel || "Attendance distribution"}>
                    <circle cx="60" cy="60" r="48" fill="none" stroke={`${theme.border}`} strokeWidth="1" />
                    {segments.map((segment) => (
                        <Tooltip key={segment.name} title={`${segment.name}: ${formatNumber(segment.muted ? 0 : segment.value)} (${formatPercent(segment.muted ? 0 : segment.percent)})`}>
                            <path
                                d={segment.path}
                                fill={segment.color}
                                opacity={segment.muted ? 0.55 : 1}
                                style={{ cursor: segment.muted ? "default" : "pointer", transition: "opacity 160ms ease" }}
                            />
                        </Tooltip>
                    ))}
                </svg>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        textAlign: "center",
                        pointerEvents: "none",
                    }}
                >
                    <Typography sx={{ fontSize: 23, fontWeight: 950, color: theme.text, lineHeight: 1 }}>
                        {centerValue}
                    </Typography>
                    <Typography sx={{ fontSize: 10, color: theme.muted, fontWeight: 850 }}>
                        {centerLabel}
                    </Typography>
                </Box>
            </Box>
            <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" justifyContent="center" sx={{ px: 0.5 }}>
                {(legendRows.length ? legendRows : chartRows).map((item) => (
                    <Stack key={item.name} direction="row" spacing={0.45} alignItems="center">
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: item.color, opacity: item.muted ? 0.55 : 1 }} />
                        <Typography sx={{ fontSize: 10.5, color: item.muted ? theme.muted : theme.text, fontWeight: 800 }}>
                            {item.name}
                        </Typography>
                    </Stack>
                ))}
            </Stack>
        </Stack>
    );
};

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

const DrilldownMetricCard = ({ title, value, subtitle, icon, tone, theme, onClick }) => {
    return (
        <Card
            elevation={0}
            onClick={onClick}
            sx={{
                height: "100%",
                border: `1px solid ${theme.border}`,
                borderRadius: "8px",
                bgcolor: "#fff",
                cursor: onClick ? "pointer" : "default",
                transition: "transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease",
                "&:hover": onClick ? {
                    transform: "translateY(-1px)",
                    borderColor: `${tone}55`,
                    boxShadow: `0 10px 24px ${tone}18`,
                } : undefined,
            }}
        >
            <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                <Stack direction="row" spacing={0.85} alignItems="center" sx={{ minHeight: 40 }}>
                    <Box
                        sx={{
                            width: 30,
                            height: 30,
                            borderRadius: "8px",
                            bgcolor: `${tone}16`,
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
                        <Typography sx={{ fontSize: 9.2, fontWeight: 950, color: theme.primary, letterSpacing: 0, textTransform: "uppercase", lineHeight: 1.1 }}>
                            {title}
                        </Typography>
                        <Stack direction="row" spacing={0.7} alignItems="baseline" sx={{ mt: 0.25, minWidth: 0, flexWrap: "nowrap" }}>
                            <Typography noWrap sx={{ fontSize: { xs: 16, md: 18 }, fontWeight: 950, color: theme.text, lineHeight: 1 }}>
                                {value}
                            </Typography>
                            {subtitle && (
                                <Typography noWrap sx={{ fontSize: 9.5, fontWeight: 900, color: tone, minWidth: 0, flexShrink: 1 }}>
                                    {subtitle}
                                </Typography>
                            )}
                        </Stack>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

const MetricDetailDialog = ({ open, metric, theme, onClose }) => {
    const rows = metric?.rows || [];
    const columns = metric?.columns || [];
    const [dialogFilters, setDialogFilters] = useState({
        search: "",
        station: "",
        department: "",
        status: "",
        issue: "",
        date: "",
    });

    useEffect(() => {
        if (open) {
            setDialogFilters({ search: "", station: "", department: "", status: "", issue: "", date: "" });
        }
    }, [metric?.title, open]);

    const filterOptions = useMemo(() => {
        const collect = (key) => uniqueValues(rows.map((row) => row[key]));
        return {
            stations: collect("station"),
            departments: collect("department"),
            statuses: uniqueValues(rows.map((row) => row.status || row.timing)),
            issues: collect("issue"),
            dates: uniqueValues(rows.map((row) => getRecordDateKey(row.rawDate))).sort(),
        };
    }, [rows]);

    const filteredRows = useMemo(() => {
        const searchText = dialogFilters.search.trim().toLowerCase();
        return rows.filter((row) => {
            const rowStatus = row.status || row.timing || "";
            const rowDate = getRecordDateKey(row.rawDate);
            if (dialogFilters.station && row.station !== dialogFilters.station) return false;
            if (dialogFilters.department && row.department !== dialogFilters.department) return false;
            if (dialogFilters.status && rowStatus !== dialogFilters.status) return false;
            if (dialogFilters.issue && row.issue !== dialogFilters.issue) return false;
            if (dialogFilters.date && rowDate !== dialogFilters.date) return false;
            if (!searchText) return true;
            return [
                row.employeeId,
                row.name,
                row.email,
                row.station,
                row.department,
                row.role,
                row.status,
                row.timing,
                row.issue,
                row.reason,
                row.date,
            ].some((value) => String(value || "").toLowerCase().includes(searchText));
        });
    }, [dialogFilters, rows]);

    const setDialogFilter = (key) => (event) => {
        setDialogFilters((current) => ({ ...current, [key]: event.target.value }));
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
            <DialogTitle sx={{ pb: 1 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: 17, fontWeight: 950, color: theme.text }}>
                            {metric?.title || "Attendance Details"}
                        </Typography>
                        {metric?.subtitle && (
                            <Typography sx={{ mt: 0.3, fontSize: 12, color: theme.muted }}>
                                {metric.subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Chip
                        label={`${formatNumber(filteredRows.length)} of ${formatNumber(rows.length)} rows`}
                        sx={{ borderRadius: "8px", bgcolor: `${theme.secondary}12`, color: theme.secondary, fontWeight: 900 }}
                    />
                </Stack>
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }} sx={{ mb: 1.2 }}>
                    <TextField
                        size="small"
                        label="Search"
                        value={dialogFilters.search}
                        onChange={setDialogFilter("search")}
                        sx={{ minWidth: { xs: "100%", md: 220 } }}
                    />
                    {filterOptions.stations.length > 1 && (
                        <FormControl size="small" sx={{ minWidth: { xs: "100%", md: 170 } }}>
                            <InputLabel>Station</InputLabel>
                            <Select value={dialogFilters.station} label="Station" onChange={setDialogFilter("station")}>
                                <MenuItem value="">All Stations</MenuItem>
                                {filterOptions.stations.map((station) => (
                                    <MenuItem key={station} value={station}>{station}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    {filterOptions.departments.length > 1 && (
                        <FormControl size="small" sx={{ minWidth: { xs: "100%", md: 180 } }}>
                            <InputLabel>Department</InputLabel>
                            <Select value={dialogFilters.department} label="Department" onChange={setDialogFilter("department")}>
                                <MenuItem value="">All Departments</MenuItem>
                                {filterOptions.departments.map((department) => (
                                    <MenuItem key={department} value={department}>{department}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    {filterOptions.statuses.length > 1 && (
                        <FormControl size="small" sx={{ minWidth: { xs: "100%", md: 145 } }}>
                            <InputLabel>Status</InputLabel>
                            <Select value={dialogFilters.status} label="Status" onChange={setDialogFilter("status")}>
                                <MenuItem value="">All Statuses</MenuItem>
                                {filterOptions.statuses.map((status) => (
                                    <MenuItem key={status} value={status}>{status}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    {filterOptions.issues.length > 1 && (
                        <FormControl size="small" sx={{ minWidth: { xs: "100%", md: 165 } }}>
                            <InputLabel>Issue</InputLabel>
                            <Select value={dialogFilters.issue} label="Issue" onChange={setDialogFilter("issue")}>
                                <MenuItem value="">All Issues</MenuItem>
                                {filterOptions.issues.map((issue) => (
                                    <MenuItem key={issue} value={issue}>{issue}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    {filterOptions.dates.length > 1 && (
                        <TextField
                            size="small"
                            type="date"
                            label="Date"
                            value={dialogFilters.date}
                            onChange={setDialogFilter("date")}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: { xs: "100%", md: 150 } }}
                        />
                    )}
                    {(dialogFilters.search || dialogFilters.station || dialogFilters.department || dialogFilters.status || dialogFilters.issue || dialogFilters.date) && (
                        <Button
                            onClick={() => setDialogFilters({ search: "", station: "", department: "", status: "", issue: "", date: "" })}
                            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 900, color: theme.primary }}
                        >
                            Clear
                        </Button>
                    )}
                </Stack>
                {metric?.variant === "heatmap" ? (
                    <Box sx={{ maxHeight: 560, overflowY: "auto", border: `1px solid ${theme.border}`, borderRadius: "8px", p: 1 }}>
                        <HrAttendanceHeatmap rows={filteredRows} theme={theme} rowLabel={metric.rowLabel || "Area"} rowKey={metric.rowKey || "name"} />
                    </Box>
                ) : (
                    <TableContainer sx={{ maxHeight: 520, border: `1px solid ${theme.border}`, borderRadius: "8px" }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    {columns.map((column) => (
                                        <TableCell key={column.key} sx={{ fontWeight: 950, bgcolor: "#fff", whiteSpace: "nowrap" }}>
                                            {column.label}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRows.map((row, index) => (
                                    <TableRow key={row.id || `${metric?.title || "metric"}-${index}`}>
                                        {columns.map((column) => (
                                            <TableCell key={column.key} sx={{ minWidth: column.minWidth || 110 }}>
                                                {column.render ? column.render(row, index) : row[column.key]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                                {!filteredRows.length && (
                                    <TableRow>
                                        <TableCell colSpan={Math.max(columns.length, 1)}>
                                            <EmptyState label="No matching rows for this metric in the selected scope." theme={theme} />
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.5 }}>
                    <Button onClick={onClose} sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 900, color: theme.primary }}>
                        Close
                    </Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

const HrCompactTable = ({ columns, rows, emptyLabel, theme }) => (
    <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" stickyHeader sx={{ minWidth: columns.length * 96 }}>
            <TableHead>
                <TableRow>
                    {columns.map((column) => (
                        <TableCell
                            key={column.key}
                            align={column.align || "left"}
                            sx={{ fontSize: 10, fontWeight: 950, color: theme.primary, bgcolor: "#fff", borderColor: theme.border, whiteSpace: "nowrap" }}
                        >
                            {column.label}
                        </TableCell>
                    ))}
                </TableRow>
            </TableHead>
            <TableBody>
                {rows.map((row, index) => (
                    <TableRow key={row.id || row.name || row.station || row.department || index}>
                        {columns.map((column) => (
                            <TableCell key={column.key} align={column.align || "left"} sx={{ fontSize: 11.5, minWidth: column.minWidth || 80 }}>
                                {column.render ? column.render(row, index) : row[column.key]}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
                {!rows.length && (
                    <TableRow>
                        <TableCell colSpan={columns.length}>
                            <EmptyState label={emptyLabel} theme={theme} />
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </TableContainer>
);

const HrHorizontalBars = ({ rows, theme, valueKey = "value", labelKey = "label", max = 100, tone = theme.secondary }) => (
    <Stack spacing={1}>
        {rows.length ? rows.map((row, index) => {
            const value = Number(row[valueKey] || 0);
            return (
                <Box key={row[labelKey] || index}>
                    <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 0.4 }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 900, color: theme.text }} noWrap>
                            {row[labelKey]}
                        </Typography>
                        <Typography sx={{ fontSize: 11, fontWeight: 950, color: tone }}>
                            {row.displayValue || formatPercent(value)}
                        </Typography>
                    </Stack>
                    <LinearProgress
                        variant="determinate"
                        value={safePercent((value / Math.max(max, 1)) * 100)}
                        sx={{
                            height: 8,
                            borderRadius: 999,
                            bgcolor: `${theme.muted}18`,
                            "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: row.tone || tone },
                        }}
                    />
                </Box>
            );
        }) : (
            <EmptyState label="No distribution data available." theme={theme} />
        )}
    </Stack>
);

const HrAttendanceHeatmap = ({ rows, theme, rowLabel = "Department", rowKey = "department", preview = false }) => {
    return (
        <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 460 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "128px repeat(5, 1fr)", gap: 0.6, mb: 0.6 }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 950, color: theme.primary }}>{rowLabel}</Typography>
                    {HEATMAP_WEEKDAYS.map((day) => (
                        <Typography key={day} sx={{ fontSize: 10, fontWeight: 950, color: theme.primary, textAlign: "center" }}>
                            {day}
                        </Typography>
                    ))}
                </Box>
                <Stack spacing={0.6}>
                    {rows.length ? rows.slice(0, preview ? 5 : rows.length).map((row) => (
                        <Box key={row.id || row[rowKey] || row.name} sx={{ display: "grid", gridTemplateColumns: "128px repeat(5, 1fr)", gap: 0.6, alignItems: "center" }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 900, color: theme.text }} noWrap>
                                {row[rowKey] || row.name || "Unassigned"}
                            </Typography>
                            {HEATMAP_WEEKDAYS.map((day) => {
                                const rate = Number(row[day] || 0);
                                const tone = getAttendanceColor(rate, theme);
                                return (
                                    <Box
                                        key={day}
                                        sx={{
                                            minHeight: 26,
                                            borderRadius: "6px",
                                            bgcolor: `${tone}${rate >= 85 ? "26" : "1C"}`,
                                            color: rate >= 70 ? theme.text : theme.danger,
                                            border: `1px solid ${tone}30`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 10,
                                            fontWeight: 950,
                                        }}
                                    >
                                        {formatPercent(rate)}
                                    </Box>
                                );
                            })}
                        </Box>
                    )) : (
                        <EmptyState label="No heatmap data available." theme={theme} />
                    )}
                </Stack>
            </Box>
        </Box>
    );
};

const HodAttendanceAnalytics = ({
    theme,
    kpis,
    previousKpis,
    periodRangeLabel,
    supervisorDepartment,
    supervisorStation,
    primaryMetricCards,
    todayStatusRows,
    chartData,
    attendanceDelta,
    punctualityDelta,
    hodTeamRows,
    attentionRows,
    departmentHeatmapRows,
    attendanceDistributionRows,
    spotlightCards,
    onMetricClick,
}) => {
    const teamColumns = [
        { key: "name", label: "Employee", minWidth: 145, render: (row) => <Typography sx={{ fontSize: 11.5, fontWeight: 900, color: theme.text }} noWrap>{row.name}</Typography> },
        { key: "todayStatus", label: "Today", minWidth: 84 },
        { key: "attendanceRate", label: "Attendance Rate", align: "right", minWidth: 105, render: (row) => formatPercent(row.attendanceRate) },
        { key: "lateCount", label: "Late", align: "right", minWidth: 72, render: (row) => formatNumber(row.lateCount) },
        { key: "daysAbsent", label: "Absent", align: "right", minWidth: 78, render: (row) => formatNumber(row.daysAbsent) },
        { key: "averageHours", label: "Avg Hours", align: "right", minWidth: 84, render: (row) => formatDuration(row.averageHours) },
        {
            key: "status",
            label: "Status",
            align: "right",
            minWidth: 105,
            render: (row) => (
                <Chip
                    size="small"
                    label={row.status}
                    sx={{
                        height: 22,
                        borderRadius: "6px",
                        fontSize: 10,
                        fontWeight: 900,
                        color: row.statusTone,
                        bgcolor: `${row.statusTone}14`,
                    }}
                />
            ),
        },
    ];

    const monthRows = [
        {
            label: "Attendance Rate",
            current: formatPercent(kpis?.attendanceRate),
            previous: formatPercent(previousKpis?.attendanceRate),
            change: formatDelta(attendanceDelta || 0, "pp"),
            tone: Number(attendanceDelta || 0) >= 0 ? theme.success : theme.danger,
        },
        {
            label: "Punctuality Rate",
            current: formatPercent(kpis?.punctualityRate),
            previous: formatPercent(previousKpis?.punctualityRate),
            change: formatDelta(punctualityDelta || 0, "pp"),
            tone: Number(punctualityDelta || 0) >= 0 ? theme.success : theme.warning,
        },
        {
            label: "Average Hours",
            current: formatDuration(kpis?.averageWorkingHours || 0),
            previous: formatDuration(previousKpis?.averageWorkingHours || 0),
            change: "",
            tone: theme.secondary,
        },
    ];

    return (
        <>
            <SectionCard
                title={`${supervisorDepartment || "Department"} Department`}
                subtitle={supervisorStation || "Assigned station"}
                theme={theme}
                action={<Chip size="small" label={periodRangeLabel} sx={{ borderRadius: "8px", bgcolor: `${theme.success}12`, color: theme.success, fontWeight: 900 }} />}
            >
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" }, gap: 1 }}>
                    {primaryMetricCards.map((card) => (
                        <DrilldownMetricCard key={card.key} {...card} theme={theme} onClick={() => onMetricClick(card.key)} />
                    ))}
                </Box>
            </SectionCard>

            <Grid container spacing={1.5} sx={{ mt: 0 }}>
                <Grid item xs={12} md={3} lg={2}>
                    <SectionCard title="Today's Status" theme={theme}>
                        <Stack spacing={1}>
                            {todayStatusRows.map((row) => (
                                <Button
                                    key={row.key}
                                    onClick={() => onMetricClick(row.key)}
                                    sx={{ px: 0.8, py: 0.4, minHeight: 28, justifyContent: "space-between", borderRadius: "8px", textTransform: "none", color: theme.text }}
                                >
                                    <Stack direction="row" spacing={0.8} alignItems="center">
                                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: row.tone }} />
                                        <Typography sx={{ fontSize: 11.5, fontWeight: 900 }}>{formatNumber(row.value)}</Typography>
                                        <Typography sx={{ fontSize: 11, color: theme.muted }}>{row.label}</Typography>
                                    </Stack>
                                </Button>
                            ))}
                        </Stack>
                    </SectionCard>
                </Grid>
                <Grid item xs={12} md={6} lg={7}>
                    <SectionCard title="Department Attendance Trend" theme={theme}>
                        <Box sx={{ height: 225 }}>
                            {chartData.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 8, right: 14, left: -18, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.16)" />
                                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: theme.muted }} minTickGap={16} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: theme.muted }} tickFormatter={(value) => `${value}%`} />
                                        <RechartsTooltip formatter={(value) => [formatPercent(value), "Attendance Rate"]} />
                                        <Line type="monotone" dataKey="attendance" name="Attendance Rate" stroke={theme.success} strokeWidth={2.8} dot={{ r: 2.8 }} activeDot={{ r: 5 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState label="No department attendance trend available." theme={theme} />
                            )}
                        </Box>
                    </SectionCard>
                </Grid>
                <Grid item xs={12} md={3} lg={3}>
                    <SectionCard title="This Month vs Last Month" theme={theme}>
                        <Stack spacing={1}>
                            {monthRows.map((row) => (
                                <Box key={row.label} sx={{ pb: 0.8, borderBottom: `1px solid ${theme.border}` }}>
                                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                                        <Typography sx={{ fontSize: 11, color: theme.muted, fontWeight: 800 }}>{row.label}</Typography>
                                        <Typography sx={{ fontSize: 12, color: theme.text, fontWeight: 950 }}>{row.current}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mt: 0.35 }}>
                                        <Typography sx={{ fontSize: 10.5, color: theme.muted }}>Last</Typography>
                                        <Typography sx={{ fontSize: 10.5, color: row.tone, fontWeight: 900 }}>{row.change || row.previous}</Typography>
                                    </Stack>
                                </Box>
                            ))}
                        </Stack>
                    </SectionCard>
                </Grid>
            </Grid>

            <Grid container spacing={1.5} sx={{ mt: 0 }}>
                <Grid item xs={12} lg={7}>
                    <SectionCard
                        title="Department Heatmap"
                        subtitle="Attendance by weekday"
                        theme={theme}
                        action={
                            <Button size="small" onClick={() => onMetricClick("hodDepartmentHeatmap")} sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 900, color: theme.secondary }}>
                                View All
                            </Button>
                        }
                    >
                        <HrAttendanceHeatmap rows={departmentHeatmapRows} theme={theme} rowLabel="Department" rowKey="department" />
                    </SectionCard>
                </Grid>
                <Grid item xs={12} lg={5}>
                    <SectionCard
                        title="Attendance Distribution"
                        subtitle="Today"
                        theme={theme}
                        action={
                            <Button size="small" onClick={() => onMetricClick("hodAttendanceDistribution")} sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 900, color: theme.secondary }}>
                                View Details
                            </Button>
                        }
                    >
                        <Grid container spacing={1} alignItems="center">
                            <Grid item xs={12} sm={6}>
                                <DonutVisualization data={attendanceDistributionRows} theme={theme} centerValue={formatNumber(kpis?.totalEmployees)} centerLabel="Total" height={210} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Stack spacing={0.75}>
                                    {attendanceDistributionRows.map((row) => (
                                        <Button
                                            key={row.name}
                                            onClick={() => onMetricClick(row.key)}
                                            sx={{ px: 0.8, py: 0.45, justifyContent: "space-between", borderRadius: "8px", textTransform: "none", color: theme.text, bgcolor: `${row.color}0F` }}
                                        >
                                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                                                <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: row.color, flexShrink: 0 }} />
                                                <Typography noWrap sx={{ fontSize: 11.5, fontWeight: 900 }}>{row.name}</Typography>
                                            </Stack>
                                            <Typography sx={{ fontSize: 11.5, fontWeight: 950, color: row.color }}>{formatNumber(row.value)}</Typography>
                                        </Button>
                                    ))}
                                </Stack>
                            </Grid>
                        </Grid>
                    </SectionCard>
                </Grid>
            </Grid>

            <Grid container spacing={1.5} sx={{ mt: 0 }}>
                <Grid item xs={12} lg={8}>
                    <SectionCard
                        title="Team Attendance Overview"
                        theme={theme}
                        action={
                            <Button size="small" onClick={() => onMetricClick("hodTeamMembers")} sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 900, color: theme.secondary }}>
                                View All Team Members
                            </Button>
                        }
                    >
                        <HrCompactTable columns={teamColumns} rows={hodTeamRows.slice(0, 6)} emptyLabel="No team attendance data in this department scope." theme={theme} />
                    </SectionCard>
                </Grid>
                <Grid item xs={12} lg={4}>
                    <SectionCard title="Attention Required" theme={theme}>
                        <Stack spacing={1}>
                            {attentionRows.length ? attentionRows.map((row) => (
                                <Button
                                    key={row.key}
                                    onClick={() => onMetricClick(row.key)}
                                    sx={{ justifyContent: "flex-start", textTransform: "none", borderRadius: "8px", color: theme.text, px: 1, py: 0.8, bgcolor: `${row.tone}0D` }}
                                >
                                    <WarningAmberRounded sx={{ fontSize: 16, color: row.tone, mr: 1 }} />
                                    <Typography sx={{ fontSize: 11.5, fontWeight: 850, textAlign: "left" }}>{row.label}</Typography>
                                </Button>
                            )) : (
                                <EmptyState label="No attendance exceptions requiring HOD attention." theme={theme} />
                            )}
                        </Stack>
                    </SectionCard>
                </Grid>
            </Grid>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(5, minmax(0, 1fr))" }, gap: 1, mt: 0 }}>
                {spotlightCards.map((card) => (
                    <DrilldownMetricCard key={card.key} {...card} theme={theme} onClick={() => onMetricClick(card.key)} />
                ))}
            </Box>
        </>
    );
};

const HrAttendanceAnalytics = ({
    isStationScopedHr,
    theme,
    kpis,
    previousPeriodLabel,
    periodRangeLabel,
    supervisorStation,
    scopeLabel,
    primaryMetricCards,
    secondaryMetricCards,
    chartData,
    attendanceDistributionRows,
    configuredStationPerformanceRows,
    configuredDepartmentPerformanceRows,
    todayStatusRows,
    arrivalBucketRows,
    workingHourRows,
    leaveDutyRows,
    topExceptionRows,
    departmentHeatmapRows,
    stationHeatmapRows,
    keyInsights,
    onMetricClick,
}) => {
    const totalStaff = Number(kpis?.totalEmployees || 0);
    const trendStroke = isStationScopedHr ? theme.secondary : theme.purple;
    const listedPerformanceRows = isStationScopedHr ? configuredDepartmentPerformanceRows : configuredStationPerformanceRows;
    const statusColumns = [
        { key: "name", label: "Employee", minWidth: 145, render: (row) => <Typography sx={{ fontSize: 11.5, fontWeight: 900, color: theme.text }} noWrap>{row.name}</Typography> },
        { key: "department", label: "Department", minWidth: 120 },
        { key: "clockIn", label: "Check In", minWidth: 75 },
        { key: "clockOut", label: "Check Out", minWidth: 75 },
        { key: "hours", label: "Hours", minWidth: 70 },
        {
            key: "status",
            label: "Status",
            minWidth: 86,
            render: (row) => (
                <Chip
                    size="small"
                    label={row.status}
                    sx={{
                        height: 22,
                        borderRadius: "6px",
                        fontSize: 10,
                        fontWeight: 900,
                        color: row.status === "Present" ? theme.success : row.status === "Late" ? "#B45309" : theme.danger,
                        bgcolor: row.status === "Present" ? `${theme.success}14` : row.status === "Late" ? `${theme.warning}18` : `${theme.danger}12`,
                    }}
                />
            ),
        },
    ];
    const stationColumns = [
        { key: "name", label: "Station / Centre", minWidth: 125, render: (row) => <Typography sx={{ fontSize: 11.5, fontWeight: 900, color: theme.text }} noWrap>{row.name}</Typography> },
        { key: "staff", label: "Staff", align: "right" },
        { key: "attendanceRate", label: "Attendance", align: "right", render: (row) => formatPercent(row.attendanceRate) },
        { key: "punctualityRate", label: "Punctuality", align: "right", render: (row) => formatPercent(row.punctualityRate) },
        { key: "absenteeismRate", label: "Absent", align: "right", render: (row) => formatPercent(row.absenteeismRate) },
        { key: "lateCount", label: "Late", align: "right", render: (row) => formatNumber(row.lateCount) },
        { key: "averageWorkingHours", label: "Avg Hours", align: "right", render: (row) => formatDuration(row.averageWorkingHours) },
        { key: "trend", label: "Trend", align: "right", render: (row) => <Typography sx={{ color: Number(row.attendanceRate || 0) >= 85 ? theme.success : theme.danger, fontWeight: 950 }}>{Number(row.attendanceRate || 0) >= 85 ? "↑" : "↓"}</Typography> },
    ];
    const departmentColumns = [
        { key: "name", label: "Department", minWidth: 135, render: (row) => <Typography sx={{ fontSize: 11.5, fontWeight: 900, color: theme.text }} noWrap>{row.name}</Typography> },
        { key: "staff", label: "Staff", align: "right" },
        { key: "attendanceRate", label: "Attendance", align: "right", render: (row) => formatPercent(row.attendanceRate) },
        { key: "punctualityRate", label: "Punctuality", align: "right", render: (row) => formatPercent(row.punctualityRate) },
        { key: "absenteeismRate", label: "Absent", align: "right", render: (row) => formatPercent(row.absenteeismRate) },
        { key: "lateCount", label: "Late", align: "right", render: (row) => formatNumber(row.lateCount) },
        { key: "averageWorkingHours", label: "Avg Hours", align: "right", render: (row) => formatDuration(row.averageWorkingHours) },
    ];
    const exceptionColumns = [
        { key: "name", label: "Employee", minWidth: 145, render: (row) => <Typography sx={{ fontSize: 11.5, fontWeight: 900, color: theme.text }} noWrap>{row.name}</Typography> },
        { key: "station", label: "Station", minWidth: 120 },
        { key: "department", label: "Department", minWidth: 120 },
        { key: "issue", label: "Issue", minWidth: 120 },
        { key: "occurrences", label: "Occurrences", align: "right", render: (row) => formatNumber(row.occurrences) },
    ];

    return (
        <>
            <SectionCard
                title={isStationScopedHr ? supervisorStation || scopeLabel : "Overall Attendance Overview"}
                subtitle={isStationScopedHr ? "Station / centre HR dashboard" : "All-stations HR dashboard"}
                theme={theme}
                action={<Chip size="small" label={periodRangeLabel} sx={{ borderRadius: "8px", bgcolor: `${theme.secondary}12`, color: theme.secondary, fontWeight: 900 }} />}
            >
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", lg: "repeat(6, minmax(0, 1fr))" },
                        gap: 1,
                    }}
                >
                    {primaryMetricCards.map((card) => (
                        <DrilldownMetricCard key={card.key} {...card} theme={theme} onClick={() => onMetricClick(card.key)} />
                    ))}
                </Box>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))", xl: isStationScopedHr ? "repeat(5, minmax(0, 1fr))" : "repeat(8, minmax(0, 1fr))" },
                        gap: 1,
                        mt: 1,
                    }}
                >
                    {secondaryMetricCards.map((card) => (
                        <DrilldownMetricCard key={card.key} {...card} theme={theme} onClick={() => onMetricClick(card.key)} />
                    ))}
                </Box>
            </SectionCard>

            <Grid container spacing={1.5} sx={{ mt: 0 }}>
                <Grid item xs={12} lg={isStationScopedHr ? 4 : 6}>
                    <SectionCard title="Attendance Rate Over Time" theme={theme}>
                        <Box sx={{ height: isStationScopedHr ? 220 : 250 }}>
                            {chartData.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.16)" />
                                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: theme.muted }} minTickGap={16} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: theme.muted }} tickFormatter={(value) => `${value}%`} />
                                        <RechartsTooltip formatter={(value) => [formatPercent(value), "Attendance Rate"]} />
                                        <Line type="monotone" dataKey="attendance" name="Attendance Rate" stroke={trendStroke} strokeWidth={2.6} dot={{ r: 2.8 }} activeDot={{ r: 5 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState label="No attendance trend data available." theme={theme} />
                            )}
                        </Box>
                    </SectionCard>
                </Grid>

                {!isStationScopedHr && (
                    <Grid item xs={12} lg={3}>
                        <SectionCard title="Workforce Status Today" theme={theme}>
                            <DonutVisualization data={attendanceDistributionRows} theme={theme} centerValue={formatNumber(totalStaff)} centerLabel="Total" height={250} />
                        </SectionCard>
                    </Grid>
                )}

                <Grid item xs={12} lg={isStationScopedHr ? 8 : 3}>
                    <SectionCard title={isStationScopedHr ? "Today's Staff Status" : "Key Insights"} theme={theme}>
                        {isStationScopedHr ? (
                            <HrCompactTable columns={statusColumns} rows={todayStatusRows.slice(0, 6)} emptyLabel="No staff status rows for today." theme={theme} />
                        ) : (
                            <Stack spacing={1}>
                                {keyInsights.map((item) => (
                                    <Stack key={item.label} direction="row" spacing={0.8} alignItems="flex-start">
                                        <CheckCircleRounded sx={{ color: item.tone, fontSize: 16, mt: 0.1 }} />
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography sx={{ fontSize: 11, fontWeight: 950, color: theme.text }}>{item.label}</Typography>
                                            <Typography sx={{ fontSize: 10.5, color: theme.muted, lineHeight: 1.35 }}>{item.text}</Typography>
                                        </Box>
                                    </Stack>
                                ))}
                            </Stack>
                        )}
                    </SectionCard>
                </Grid>
            </Grid>

            <Grid container spacing={1.5} sx={{ mt: 0 }}>
                <Grid item xs={12} lg={isStationScopedHr ? 6 : 5}>
                    <SectionCard
                        title={isStationScopedHr ? "Department Performance" : "Station / Centre Performance"}
                        theme={theme}
                        action={
                            <Button
                                size="small"
                                onClick={() => onMetricClick(isStationScopedHr ? "departmentPerformance" : "stationPerformance")}
                                sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 900, color: theme.secondary }}
                            >
                                View All
                            </Button>
                        }
                    >
                        <HrCompactTable
                            columns={isStationScopedHr ? departmentColumns : stationColumns}
                            rows={listedPerformanceRows.slice(0, isStationScopedHr ? 6 : 8)}
                            emptyLabel={isStationScopedHr ? "No department performance data available." : "No station performance data available."}
                            theme={theme}
                        />
                    </SectionCard>
                </Grid>
                <Grid item xs={12} lg={isStationScopedHr ? 3 : 4}>
                    <SectionCard
                        title={isStationScopedHr ? "Time of Arrival Today" : "Department Performance"}
                        subtitle={isStationScopedHr ? undefined : "Top departments"}
                        theme={theme}
                        action={!isStationScopedHr ? (
                            <Button
                                size="small"
                                onClick={() => onMetricClick("departmentPerformance")}
                                sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 900, color: theme.secondary }}
                            >
                                View All
                            </Button>
                        ) : undefined}
                    >
                        {isStationScopedHr ? (
                            <HrHorizontalBars rows={arrivalBucketRows} theme={theme} valueKey="value" labelKey="label" max={Math.max(...arrivalBucketRows.map((row) => row.value), 1)} tone={theme.secondary} />
                        ) : (
                            <HrHorizontalBars
                                rows={configuredDepartmentPerformanceRows.slice(0, 6).map((department) => ({
                                    label: department.name || "Unassigned",
                                    value: Number(department.attendanceRate || 0),
                                    displayValue: formatPercent(department.attendanceRate),
                                    tone: getAttendanceColor(department.attendanceRate, theme),
                                }))}
                                theme={theme}
                                tone={theme.purple}
                            />
                        )}
                    </SectionCard>
                </Grid>
                <Grid item xs={12} lg={isStationScopedHr ? 3 : 3}>
                    <SectionCard
                        title={isStationScopedHr ? "Leave & Duty Overview" : "Department Heatmap"}
                        subtitle={isStationScopedHr ? undefined : "Attendance by weekday"}
                        theme={theme}
                        action={!isStationScopedHr ? (
                            <Button
                                size="small"
                                onClick={() => onMetricClick("departmentHeatmap")}
                                sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 900, color: theme.secondary }}
                            >
                                View All
                            </Button>
                        ) : undefined}
                    >
                        {isStationScopedHr ? (
                            <Stack spacing={1}>
                                {leaveDutyRows.map((row) => (
                                    <Stack key={row.label} direction="row" justifyContent="space-between" spacing={1}>
                                        <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: theme.text }}>{row.label}</Typography>
                                        <Typography sx={{ fontSize: 11.5, fontWeight: 950, color: row.tone }}>{formatNumber(row.value)}</Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        ) : (
                            <HrAttendanceHeatmap rows={departmentHeatmapRows} theme={theme} rowLabel="Department" rowKey="department" preview />
                        )}
                    </SectionCard>
                </Grid>
            </Grid>

            <Grid container spacing={1.5} sx={{ mt: 0 }}>
                <Grid item xs={12} lg={isStationScopedHr ? 4 : 4}>
                    <SectionCard title={isStationScopedHr ? "Working Hours Summary" : "Time of Arrival Distribution"} theme={theme}>
                        <HrHorizontalBars
                            rows={isStationScopedHr ? workingHourRows : arrivalBucketRows}
                            theme={theme}
                            valueKey="value"
                            labelKey="label"
                            max={Math.max(...(isStationScopedHr ? workingHourRows : arrivalBucketRows).map((row) => row.value), 1)}
                            tone={isStationScopedHr ? theme.accent : theme.purple}
                        />
                    </SectionCard>
                </Grid>
                <Grid item xs={12} lg={isStationScopedHr ? 4 : 5}>
                    <SectionCard title="Top Exceptions This Month" theme={theme}>
                        <HrCompactTable columns={exceptionColumns} rows={topExceptionRows.slice(0, 7)} emptyLabel="No exception records in the selected scope." theme={theme} />
                    </SectionCard>
                </Grid>
                <Grid item xs={12} lg={isStationScopedHr ? 4 : 3}>
                    <SectionCard
                        title={isStationScopedHr ? "Attendance Composition" : "Station Heatmap"}
                        subtitle={isStationScopedHr ? undefined : "Centre attendance by weekday"}
                        theme={theme}
                        action={!isStationScopedHr ? (
                            <Button
                                size="small"
                                onClick={() => onMetricClick("stationHeatmap")}
                                sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 900, color: theme.secondary }}
                            >
                                View All
                            </Button>
                        ) : undefined}
                    >
                        {isStationScopedHr ? (
                            <DonutVisualization data={attendanceDistributionRows} theme={theme} centerValue={formatNumber(totalStaff)} centerLabel="Total" height={230} />
                        ) : (
                            <HrAttendanceHeatmap rows={stationHeatmapRows} theme={theme} rowLabel="Station" rowKey="station" preview />
                        )}
                        <InsightNote theme={theme} tone={theme.secondary}>
                            Click any KPI card to inspect the people, departments, stations, and records behind the number.
                        </InsightNote>
                    </SectionCard>
                </Grid>
            </Grid>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" sx={{ mt: 1, px: 0.5 }}>
                <Typography sx={{ fontSize: 11, color: theme.muted, fontWeight: 700 }}>
                    Data source: attendance records, user scope, leave status, outside-duty authorisations, and device enrolment readiness.
                </Typography>
                <Typography sx={{ fontSize: 11, color: theme.muted, fontWeight: 700 }}>
                    Previous comparison: {previousPeriodLabel}
                </Typography>
            </Stack>
        </>
    );
};

const ReferenceStatsGrid = ({ theme, referenceMetrics }) => (
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
);

const AttendanceRecords = ({
    theme,
    scopeLabel,
    referenceMetrics,
    referenceLoading,
    referenceError,
    referenceSearch,
    onReferenceSearchChange,
    onRefresh,
    pdfExporting,
    onExport,
    filteredRecords,
    paginatedRecords,
    recordPage,
    setRecordPage,
    recordRowsPerPage,
    setRecordRowsPerPage,
}) => (
    <SectionCard
        title="Administrative Reference"
        subtitle="Attendance records for audit, HR review, and station administration"
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
                    onClick={onRefresh}
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

        <ReferenceStatsGrid theme={theme} referenceMetrics={referenceMetrics} />

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" sx={{ mb: 1.5 }}>
            <TextField
                size="small"
                label="Search attendance records"
                value={referenceSearch}
                onChange={onReferenceSearchChange}
                sx={{ minWidth: { xs: "100%", md: 360 } }}
            />
            <Button
                variant="contained"
                startIcon={pdfExporting === "records" ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <DownloadRounded />}
                onClick={onExport}
                disabled={!filteredRecords.length}
                sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 800, bgcolor: theme.primary }}
            >
                {pdfExporting === "records" ? "Exporting..." : "Export Records PDF"}
            </Button>
        </Stack>

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
                            {["Employee", "Date", "Clock In", "Clock Out", "Timing", "In Location", "Out Location", "Department"].map((heading) => (
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
                                <TableCell colSpan={8}>
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

        <InsightNote theme={theme} tone={referenceMetrics.openSessions ? theme.warning : theme.secondary}>
            Records prove the underlying attendance events behind the analytics, including timing, clock-out state, and location reference.
        </InsightNote>
    </SectionCard>
);

const AttendanceSummary = ({
    theme,
    referenceMetrics,
    referenceLoading,
    referenceError,
    referenceSearch,
    onReferenceSearchChange,
    onRefresh,
    pdfExporting,
    onExport,
    filteredSummaryRows,
    paginatedSummaryRows,
    summaryPage,
    setSummaryPage,
    summaryRowsPerPage,
    setSummaryRowsPerPage,
    workingDaysInReferenceRange,
}) => (
    <SectionCard
        title="Administrative Reference"
        subtitle="Attendance summary for audit, HR review, and station administration"
        theme={theme}
        action={
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip
                    size="small"
                    label={`${formatNumber(referenceMetrics.summaryRows)} staff`}
                    sx={{ borderRadius: "8px", bgcolor: `${theme.accent}12`, color: theme.primary, fontWeight: 900 }}
                />
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={referenceLoading ? <CircularProgress size={12} /> : <RefreshRounded />}
                    onClick={onRefresh}
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

        <ReferenceStatsGrid theme={theme} referenceMetrics={referenceMetrics} />

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" sx={{ mb: 1.5 }}>
            <TextField
                size="small"
                label="Search attendance summary"
                value={referenceSearch}
                onChange={onReferenceSearchChange}
                sx={{ minWidth: { xs: "100%", md: 360 } }}
            />
            <Button
                variant="contained"
                startIcon={pdfExporting === "summary" ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <DownloadRounded />}
                onClick={onExport}
                disabled={!filteredSummaryRows.length}
                sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 800, bgcolor: theme.primary }}
            >
                {pdfExporting === "summary" ? "Exporting..." : "Export Summary PDF"}
            </Button>
        </Stack>

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
                                <TableCell>{humanizeStaffAttribute(row.role)}</TableCell>
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
                                <TableCell colSpan={8}>
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

        <InsightNote theme={theme} tone={referenceMetrics.openSessions ? theme.warning : theme.secondary}>
            Summary rows translate daily attendance events into staff-level coverage for HOD follow-up, HR review, and executive reporting.
        </InsightNote>
    </SectionCard>
);

const OrganisationStats = ({ user, readOnly = false, initialTab = "analytics" }) => {
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
        clockingType: "",
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
    const [activeReportTab, setActiveReportTab] = useState(() => normalizeReportTab(initialTab));
    const [pdfExporting, setPdfExporting] = useState("");
    const [recordPage, setRecordPage] = useState(0);
    const [summaryPage, setSummaryPage] = useState(0);
    const [recordRowsPerPage, setRecordRowsPerPage] = useState(10);
    const [summaryRowsPerPage, setSummaryRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [metricDialog, setMetricDialog] = useState(null);

    useEffect(() => {
        setActiveReportTab(normalizeReportTab(initialTab));
    }, [initialTab]);

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
                punctualityRate: Number(station.punctualityRate ?? (100 - Number(station.latenessRate || 0))),
                absenteeismRate: Number(station.absenteeismRate || 0),
                lateCount: Number(station.totalLateCount || 0),
                onLeaveDays: Number(station.onLeaveDays || 0),
                averageWorkingHours: Number(station.averageWorkingHours || 0),
                totalOvertime: Number(station.totalOvertime || 0),
            })),
        [sortedStations]
    );
    const departmentPerformanceRows = useMemo(
        () =>
            sortedDepartments.map((department) => ({
                name: department.department || "Unassigned",
                staff: Number(department.staffCount || 0),
                attendanceRate: Number(department.attendanceRate || 0),
                punctualityRate: Number(department.punctualityRate ?? (100 - Number(department.latenessRate || 0))),
                absenteeismRate: Number(department.absenteeismRate || 0),
                lateCount: Number(department.totalLateCount || 0),
                onLeaveDays: Number(department.onLeaveDays || 0),
                averageWorkingHours: Number(department.averageWorkingHours || 0),
            })),
        [sortedDepartments]
    );
    const configuredStationPerformanceRows = useMemo(() => {
        const rowByStation = new Map(stationPerformanceRows.map((row) => [normalizeStationAccessName(row.name), row]));
        return uniqueValues([...filterOptions.stations, ...stationPerformanceRows.map((row) => row.name)]).map((station) => {
            const existing = rowByStation.get(normalizeStationAccessName(station));
            return existing || {
                id: `station-${station}`,
                name: station,
                station,
                staff: 0,
                attendanceRate: 0,
                punctualityRate: 0,
                absenteeismRate: 0,
                lateCount: 0,
                onLeaveDays: 0,
                averageWorkingHours: 0,
                totalOvertime: 0,
            };
        });
    }, [filterOptions.stations, stationPerformanceRows]);
    const configuredDepartmentPerformanceRows = useMemo(() => {
        const rowByDepartment = new Map(departmentPerformanceRows.map((row) => [String(row.name || "").trim().toLowerCase(), row]));
        return uniqueValues([...filterOptions.departments, ...departmentPerformanceRows.map((row) => row.name)]).map((department) => {
            const existing = rowByDepartment.get(String(department || "").trim().toLowerCase());
            return existing || {
                id: `department-${department}`,
                name: department,
                department,
                staff: 0,
                attendanceRate: 0,
                punctualityRate: 0,
                absenteeismRate: 0,
                lateCount: 0,
                onLeaveDays: 0,
                averageWorkingHours: 0,
            };
        });
    }, [departmentPerformanceRows, filterOptions.departments]);
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
            rawClockIn: record.clock_in,
            rawClockOut: record.clock_out,
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
                email: String(row.email || ""),
                name: compactTitleCase(row.name),
                role: row.role || "",
                station: row.station || "Unassigned",
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

    const scopedTodayRows = useMemo(() => {
        const normalizePerson = (entry = {}) => ({
            id: entry.email || entry.employeeId || entry.name,
            employeeId: entry.employeeId || "N/A",
            name: compactTitleCase(entry.name || entry.email || "Unknown"),
            email: entry.email || "",
            station: entry.station || "Unassigned",
            department: entry.department || "Unassigned",
            role: entry.role || "",
            clockIn: entry.clockIn ? formatTime(entry.clockIn) : "N/A",
            clockOut: entry.clockOut ? formatTime(entry.clockOut) : "N/A",
            hours: entry.clockIn && entry.clockOut
                ? formatDuration((new Date(entry.clockOut) - new Date(entry.clockIn)) / 3600000)
                : "N/A",
            status: entry.isLate ? "Late" : "Present",
            leaveType: entry.leaveType || "",
            leaveStart: entry.leaveStart ? formatDateTime(entry.leaveStart, { hour: undefined, minute: undefined }) : "",
            leaveEnd: entry.leaveEnd ? formatDateTime(entry.leaveEnd, { hour: undefined, minute: undefined }) : "",
        });

        const todayKey = getDateInputValue();
        const fallbackPresent = processedRecords
            .filter((record) => getRecordDateKey(record.rawDate) === todayKey)
            .map((record) => ({
                ...record,
                hours: formatDuration(getRecordHours(record)),
                status: record.timing === "Late" ? "Late" : "Present",
            }));

        const present = Array.isArray(kpis?.todayDetails?.present) && kpis.todayDetails.present.length
            ? kpis.todayDetails.present.map(normalizePerson)
            : fallbackPresent;
        const absent = Array.isArray(kpis?.todayDetails?.absent)
            ? kpis.todayDetails.absent.map((entry) => ({ ...normalizePerson(entry), status: "Absent" }))
            : [];
        const onLeave = Array.isArray(kpis?.todayDetails?.onLeave)
            ? kpis.todayDetails.onLeave.map((entry) => ({ ...normalizePerson(entry), status: "On Leave" }))
            : [];

        return { present, absent, onLeave };
    }, [kpis, processedRecords]);

    const hrRecordGroups = useMemo(() => {
        const outsideRecords = processedRecords.filter((record) => {
            const location = `${record.inLocation || ""} ${record.outLocation || ""}`.toLowerCase();
            return record.reason || location.includes("off premise") || record.inLocation !== "In Premise" || record.outLocation !== "In Premise";
        });
        const officialDutyRecords = outsideRecords.filter((record) => /official|duty|training|meeting|conference|assignment/i.test(record.reason || ""));
        const fieldWorkRecords = outsideRecords.filter((record) => /field|research|sampling|survey|site|project|remote/i.test(record.reason || ""))
            .concat(officialDutyRecords.length ? [] : outsideRecords);
        const lateRecords = processedRecords.filter((record) => record.timing === "Late");
        const missingCheckoutRecords = processedRecords.filter((record) => record.status === "Open" || record.clockOut === "System");
        const overtimeRecords = processedRecords
            .map((record) => ({ ...record, workedHours: getRecordHours(record) }))
            .filter((record) => record.workedHours > 8);
        const shortHourRecords = processedRecords
            .map((record) => ({ ...record, workedHours: getRecordHours(record) }))
            .filter((record) => record.rawClockOut && record.workedHours > 0 && record.workedHours < 8);
        const completedRecords = processedRecords.filter((record) => record.rawClockOut);

        return {
            outsideRecords,
            officialDutyRecords,
            fieldWorkRecords,
            lateRecords,
            missingCheckoutRecords,
            overtimeRecords,
            shortHourRecords,
            completedRecords,
        };
    }, [processedRecords]);

    const hrWorkloadMetrics = useMemo(() => {
        const overtimeHours = hrRecordGroups.overtimeRecords.reduce((sum, record) => sum + Math.max(Number(record.workedHours || 0) - 8, 0), 0);
        const lostWorkingHours = hrRecordGroups.shortHourRecords.reduce((sum, record) => sum + Math.max(8 - Number(record.workedHours || 0), 0), 0)
            + processedSummaryRows.reduce((sum, row) => sum + Number(row.daysAbsent || 0) * 8, 0);

        return {
            overtimeHours,
            lostWorkingHours,
            averageWorkingHours: hrRecordGroups.completedRecords.length
                ? hrRecordGroups.completedRecords.reduce((sum, record) => sum + getRecordHours(record), 0) / hrRecordGroups.completedRecords.length
                : Number(kpis?.averageWorkingHours || 0),
        };
    }, [hrRecordGroups, kpis, processedSummaryRows]);

    const arrivalBucketRows = useMemo(() => {
        const buckets = [
            { label: "Before 7:30", min: 0, max: 7.5, value: 0, tone: theme.secondary },
            { label: "7:30 - 8:00", min: 7.5, max: 8, value: 0, tone: theme.success },
            { label: "8:00 - 8:30", min: 8, max: 8.5, value: 0, tone: theme.warning },
            { label: "8:30 - 9:00", min: 8.5, max: 9, value: 0, tone: theme.purple },
            { label: "After 9:00", min: 9, max: 24, value: 0, tone: theme.danger },
        ];

        processedRecords.forEach((record) => {
            const hour = getNairobiHourDecimal(record.rawClockIn);
            const bucket = buckets.find((item) => hour >= item.min && hour < item.max);
            if (bucket) bucket.value += 1;
        });

        return buckets.map((bucket) => ({
            ...bucket,
            displayValue: `${formatNumber(bucket.value)} (${formatPercent((bucket.value / Math.max(processedRecords.length, 1)) * 100)})`,
        }));
    }, [processedRecords, theme]);

    const workingHourRows = useMemo(() => {
        const buckets = [
            { label: "< 6 hours", min: 0, max: 6, value: 0, tone: theme.danger },
            { label: "6 - 7 hours", min: 6, max: 7, value: 0, tone: theme.warning },
            { label: "7 - 8 hours", min: 7, max: 8, value: 0, tone: theme.secondary },
            { label: "8+ hours", min: 8, max: 100, value: 0, tone: theme.success },
        ];

        hrRecordGroups.completedRecords.forEach((record) => {
            const hours = getRecordHours(record);
            const bucket = buckets.find((item) => hours >= item.min && hours < item.max);
            if (bucket) bucket.value += 1;
        });

        return buckets.map((bucket) => ({
            ...bucket,
            displayValue: `${formatNumber(bucket.value)} (${formatPercent((bucket.value / Math.max(hrRecordGroups.completedRecords.length, 1)) * 100)})`,
        }));
    }, [hrRecordGroups.completedRecords, theme]);

    const buildHeatmapRows = useCallback((groupKey, configuredGroups = []) => {
        const weekdayCounts = getWeekdayCounts(effectiveFilters.startDate, effectiveFilters.endDate);
        const staffByGroup = processedSummaryRows.reduce((acc, row) => {
            const key = row[groupKey] || "Unassigned";
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        const counts = {};

        processedRecords.forEach((record) => {
            const date = new Date(record.rawDate);
            if (Number.isNaN(date.getTime())) return;
            const day = date.toLocaleDateString("en-US", { weekday: "short", timeZone: EAT_TIMEZONE });
            if (!HEATMAP_WEEKDAYS.includes(day)) return;
            const group = record[groupKey] || "Unassigned";
            if (!counts[group]) counts[group] = {};
            counts[group][day] = (counts[group][day] || 0) + 1;
        });

        return uniqueValues([...configuredGroups, ...Object.keys(staffByGroup), ...Object.keys(counts)])
            .map((group) => {
                const staff = Math.max(staffByGroup[group] || 0, 0);
                return HEATMAP_WEEKDAYS.reduce(
                    (row, day) => ({
                        ...row,
                        [day]: staff && weekdayCounts[day]
                            ? Math.min(((counts[group]?.[day] || 0) / (staff * weekdayCounts[day])) * 100, 100)
                            : 0,
                    }),
                    {
                        id: `${groupKey}-heatmap-${group}`,
                        name: group,
                        [groupKey]: group,
                        staff,
                    }
                );
            });
    }, [effectiveFilters.endDate, effectiveFilters.startDate, processedRecords, processedSummaryRows]);

    const departmentHeatmapRows = useMemo(
        () => buildHeatmapRows("department", filterOptions.departments),
        [buildHeatmapRows, filterOptions.departments]
    );

    const stationHeatmapRows = useMemo(
        () => buildHeatmapRows("station", filterOptions.stations),
        [buildHeatmapRows, filterOptions.stations]
    );

    const hodDepartmentHeatmapRows = useMemo(
        () => buildHeatmapRows("department", [supervisorDepartment].filter(Boolean)),
        [buildHeatmapRows, supervisorDepartment]
    );

    const todayStatusRows = useMemo(
        () => [
            ...scopedTodayRows.present,
            ...scopedTodayRows.onLeave.map((row) => ({ ...row, clockIn: "-", clockOut: "-", hours: "-", status: "On Leave" })),
            ...scopedTodayRows.absent.map((row) => ({ ...row, clockIn: "-", clockOut: "-", hours: "-", status: "Absent" })),
        ],
        [scopedTodayRows]
    );

    const topExceptionRows = useMemo(() => {
        const grouped = new Map();
        const addIssue = (record, issue) => {
            const key = `${record.email || record.name}-${issue}`;
            const existing = grouped.get(key) || {
                id: key,
                name: record.name || record.email || "Unknown",
                email: record.email || "",
                station: record.station || "Unassigned",
                department: record.department || "Unassigned",
                issue,
                occurrences: 0,
            };
            existing.occurrences += 1;
            grouped.set(key, existing);
        };

        hrRecordGroups.lateRecords.forEach((record) => addIssue(record, "Repeated Late"));
        hrRecordGroups.missingCheckoutRecords.forEach((record) => addIssue(record, "Missing Checkout"));
        hrRecordGroups.outsideRecords.forEach((record) => addIssue(record, "Outside Clocking"));
        processedSummaryRows.filter((row) => Number(row.daysAbsent || 0) > 0).forEach((row) => addIssue({
            ...row,
            email: row.id,
        }, "Absence"));

        return [...grouped.values()].sort((a, b) => b.occurrences - a.occurrences).slice(0, 10);
    }, [hrRecordGroups, processedSummaryRows]);

    const leaveDutyRows = useMemo(
        () => [
            { key: "onLeaveToday", label: "On Leave Today", value: Number(kpis?.onLeaveToday || 0), tone: theme.warning },
            { key: "officialDuty", label: "Official Duty", value: hrRecordGroups.officialDutyRecords.length, tone: theme.secondary },
            { key: "fieldWork", label: "Field Work", value: hrRecordGroups.fieldWorkRecords.length, tone: theme.accent },
            { key: "outsideClocking", label: "Outside Clocking", value: hrRecordGroups.outsideRecords.length, tone: theme.purple },
            { key: "missingCheckout", label: "Missing Checkout", value: hrRecordGroups.missingCheckoutRecords.length, tone: theme.danger },
            { key: "openSessions", label: "Open Sessions", value: referenceMetrics.openSessions, tone: theme.warning },
        ],
        [hrRecordGroups, kpis, referenceMetrics.openSessions, theme]
    );

    const hrKeyInsights = useMemo(
        () => [
            {
                label: "Attendance movement",
                text: `${formatDelta(attendanceDelta || 0, "pp")} compared to ${previousPeriodLabel}.`,
                tone: Number(attendanceDelta || 0) >= 0 ? theme.success : theme.danger,
            },
            {
                label: "Punctuality movement",
                text: `${formatDelta(punctualityDelta || 0, "pp")} compared to the previous period.`,
                tone: Number(punctualityDelta || 0) >= 0 ? theme.success : theme.warning,
            },
            {
                label: "Records needing cleanup",
                text: `${formatNumber(hrRecordGroups.missingCheckoutRecords.length)} missing checkout rows and ${formatNumber(hrRecordGroups.lateRecords.length)} late records are visible in this scope.`,
                tone: hrRecordGroups.missingCheckoutRecords.length ? theme.warning : theme.secondary,
            },
            {
                label: "Lowest attendance area",
                text: `${lowestStation?.station || topDepartment?.department || "No area"} has the lowest visible attendance signal.`,
                tone: theme.danger,
            },
        ],
        [attendanceDelta, hrRecordGroups, lowestStation, previousPeriodLabel, punctualityDelta, theme, topDepartment]
    );

    const detailColumns = useMemo(() => ({
        people: [
            { key: "employeeId", label: "Employee ID", minWidth: 105 },
            { key: "name", label: "Name", minWidth: 170, render: (row) => <Typography sx={{ fontSize: 12, fontWeight: 900, color: theme.text }} noWrap>{row.name}</Typography> },
            { key: "station", label: "Station", minWidth: 140 },
            { key: "department", label: "Department", minWidth: 150 },
            { key: "role", label: "Role", minWidth: 90, render: (row) => humanizeStaffAttribute(row.role) },
        ],
        records: [
            { key: "employeeId", label: "Employee ID", minWidth: 105 },
            { key: "name", label: "Name", minWidth: 160, render: (row) => <Typography sx={{ fontSize: 12, fontWeight: 900, color: theme.text }} noWrap>{row.name}</Typography> },
            { key: "station", label: "Station", minWidth: 130 },
            { key: "department", label: "Department", minWidth: 140 },
            { key: "date", label: "Date", minWidth: 115 },
            { key: "clockIn", label: "Clock In", minWidth: 90 },
            { key: "clockOut", label: "Clock Out", minWidth: 90 },
            { key: "timing", label: "Timing", minWidth: 95 },
            { key: "inLocation", label: "In Location", minWidth: 190 },
            { key: "outLocation", label: "Out Location", minWidth: 190 },
        ],
        summary: [
            { key: "employeeId", label: "Employee ID", minWidth: 105 },
            { key: "name", label: "Name", minWidth: 170, render: (row) => <Typography sx={{ fontSize: 12, fontWeight: 900, color: theme.text }} noWrap>{row.name}</Typography> },
            { key: "station", label: "Station", minWidth: 140 },
            { key: "department", label: "Department", minWidth: 150 },
            { key: "daysPresent", label: "Present", minWidth: 90 },
            { key: "daysAbsent", label: "Absent", minWidth: 90 },
            { key: "attendanceRate", label: "Attendance", minWidth: 110, render: (row) => formatPercent(row.attendanceRate) },
        ],
        hodTeam: [
            { key: "employeeId", label: "Employee ID", minWidth: 105 },
            { key: "name", label: "Name", minWidth: 170, render: (row) => <Typography sx={{ fontSize: 12, fontWeight: 900, color: theme.text }} noWrap>{row.name}</Typography> },
            { key: "todayStatus", label: "Today", minWidth: 105 },
            { key: "station", label: "Station", minWidth: 130 },
            { key: "department", label: "Department", minWidth: 140 },
            { key: "attendanceRate", label: "Attendance", minWidth: 110, render: (row) => formatPercent(row.attendanceRate) },
            { key: "lateCount", label: "Late", minWidth: 75 },
            { key: "daysAbsent", label: "Absent", minWidth: 80 },
            { key: "averageHours", label: "Avg Hours", minWidth: 95, render: (row) => formatDuration(row.averageHours) },
            { key: "status", label: "Status", minWidth: 120 },
        ],
        hodDuty: [
            { key: "employeeId", label: "Employee ID", minWidth: 105 },
            { key: "name", label: "Name", minWidth: 170, render: (row) => <Typography sx={{ fontSize: 12, fontWeight: 900, color: theme.text }} noWrap>{row.name}</Typography> },
            { key: "status", label: "Status", minWidth: 120 },
            { key: "station", label: "Station", minWidth: 130 },
            { key: "department", label: "Department", minWidth: 140 },
            { key: "date", label: "Date", minWidth: 115 },
            { key: "reason", label: "Reason", minWidth: 180 },
        ],
        distribution: [
            { key: "name", label: "Status", minWidth: 150, render: (row) => <Typography sx={{ fontSize: 12, fontWeight: 900, color: row.color || theme.text }} noWrap>{row.name}</Typography> },
            { key: "value", label: "Count", minWidth: 90, render: (row) => formatNumber(row.value) },
            { key: "percent", label: "Share", minWidth: 90, render: (row) => formatPercent(row.percent) },
        ],
        performance: [
            { key: "name", label: "Name", minWidth: 160, render: (row) => <Typography sx={{ fontSize: 12, fontWeight: 900, color: theme.text }} noWrap>{row.name}</Typography> },
            { key: "staff", label: "Staff", minWidth: 80 },
            { key: "attendanceRate", label: "Attendance", minWidth: 110, render: (row) => formatPercent(row.attendanceRate) },
            { key: "punctualityRate", label: "Punctuality", minWidth: 110, render: (row) => formatPercent(row.punctualityRate) },
            { key: "absenteeismRate", label: "Absenteeism", minWidth: 110, render: (row) => formatPercent(row.absenteeismRate) },
            { key: "lateCount", label: "Late", minWidth: 80 },
            { key: "onLeaveDays", label: "Leave Days", minWidth: 105 },
            { key: "averageWorkingHours", label: "Avg Hours", minWidth: 105, render: (row) => formatDuration(row.averageWorkingHours) },
        ],
    }), [theme]);

    const hrPrimaryMetricCards = useMemo(() => {
        const total = Number(kpis?.totalEmployees || 0);
        const percentage = (value) => total ? formatPercent((Number(value || 0) / total) * 100) : "0.0%";

        return [
            { key: "totalStaff", title: "Total Staff", value: formatNumber(total), subtitle: "", icon: <GroupsRounded />, tone: theme.purple },
            { key: "presentToday", title: "Present", value: formatNumber(kpis?.presentToday), subtitle: percentage(kpis?.presentToday), icon: <CheckCircleRounded />, tone: theme.success },
            { key: "absentToday", title: "Absent", value: formatNumber(kpis?.absentToday), subtitle: percentage(kpis?.absentToday), icon: <WarningAmberRounded />, tone: theme.danger },
            { key: "onLeaveToday", title: "On Leave", value: formatNumber(kpis?.onLeaveToday), subtitle: percentage(kpis?.onLeaveToday), icon: <EventAvailableRounded />, tone: theme.warning },
            { key: "officialDuty", title: "Duty", value: formatNumber(hrRecordGroups.officialDutyRecords.length), subtitle: percentage(hrRecordGroups.officialDutyRecords.length), icon: <ShieldRounded />, tone: theme.secondary },
            { key: "fieldWork", title: "Field", value: formatNumber(hrRecordGroups.fieldWorkRecords.length), subtitle: percentage(hrRecordGroups.fieldWorkRecords.length), icon: <GroupsRounded />, tone: theme.accent },
        ];
    }, [hrRecordGroups, kpis, theme]);

    const hrSecondaryMetricCards = useMemo(() => [
        { key: "attendanceRate", title: "Attendance", value: formatPercent(kpis?.attendanceRate), subtitle: "", icon: <PieChartRounded />, tone: theme.secondary },
        { key: "punctualityRate", title: "Punctuality", value: formatPercent(kpis?.punctualityRate), subtitle: "", icon: <CheckCircleRounded />, tone: theme.success },
        { key: "lateRecords", title: "Late", value: formatNumber(hrRecordGroups.lateRecords.length), subtitle: "", icon: <HourglassBottomRounded />, tone: theme.warning },
        { key: "averageWorkingHours", title: "Avg Hours", value: formatDuration(hrWorkloadMetrics.averageWorkingHours), subtitle: "", icon: <AssessmentRounded />, tone: theme.primary },
        { key: "overtimeHours", title: "Overtime", value: formatDuration(hrWorkloadMetrics.overtimeHours), subtitle: "", icon: <TrendingUpRounded />, tone: theme.purple },
        { key: "missingCheckout", title: "Missing Out", value: formatNumber(hrRecordGroups.missingCheckoutRecords.length), subtitle: "", icon: <WarningAmberRounded />, tone: theme.danger },
        { key: "lostWorkingHours", title: "Lost Hours", value: formatDuration(hrWorkloadMetrics.lostWorkingHours), subtitle: "", icon: <TrendingDownRounded />, tone: theme.danger },
        { key: "biometricReadiness", title: "Biometric", value: formatPercent(biometricAnalytics?.enrollmentRate), subtitle: "", icon: <ShieldRounded />, tone: theme.accent },
    ], [biometricAnalytics, hrRecordGroups, hrWorkloadMetrics, kpis, theme]);

    const hodLateTodayRows = useMemo(() => {
        const todayKey = getDateInputValue();
        return hrRecordGroups.lateRecords.filter((record) => getRecordDateKey(record.rawDate) === todayKey);
    }, [hrRecordGroups.lateRecords]);

    const hodOfficialDutyTodayRows = useMemo(() => {
        const todayKey = getDateInputValue();
        return hrRecordGroups.officialDutyRecords.filter((record) => getRecordDateKey(record.rawDate) === todayKey);
    }, [hrRecordGroups.officialDutyRecords]);

    const hodOnLeaveDutyRows = useMemo(
        () => [
            ...scopedTodayRows.onLeave.map((row) => ({
                ...row,
                status: "On Leave",
                date: getDateInputValue(),
                reason: row.leaveType || "Approved Leave",
            })),
            ...hodOfficialDutyTodayRows.map((row) => ({
                ...row,
                status: "Official Duty",
                reason: row.reason || "Official Duty",
            })),
        ],
        [hodOfficialDutyTodayRows, scopedTodayRows.onLeave]
    );

    const hodTeamRows = useMemo(() => {
        const todayKey = getDateInputValue();
        const officialDutyEmails = new Set(hodOfficialDutyTodayRows.map((record) => String(record.email || "").toLowerCase()).filter(Boolean));
        const presentEmails = new Set(scopedTodayRows.present.map((row) => String(row.email || "").toLowerCase()).filter(Boolean));
        const leaveEmails = new Set(scopedTodayRows.onLeave.map((row) => String(row.email || "").toLowerCase()).filter(Boolean));
        const absentEmails = new Set(scopedTodayRows.absent.map((row) => String(row.email || "").toLowerCase()).filter(Boolean));

        const matchesPerson = (record, person) => {
            const recordEmail = String(record.email || "").toLowerCase();
            const personEmail = String(person.email || "").toLowerCase();
            if (recordEmail && personEmail) return recordEmail === personEmail;
            if (record.employeeId && person.employeeId && record.employeeId !== "N/A") return record.employeeId === person.employeeId;
            return record.name === person.name;
        };

        return processedSummaryRows.map((row) => {
            const email = String(row.email || "").toLowerCase();
            const employeeRecords = processedRecords.filter((record) => matchesPerson(record, row));
            const todayRecords = employeeRecords.filter((record) => getRecordDateKey(record.rawDate) === todayKey);
            const lateCount = employeeRecords.filter((record) => record.timing === "Late").length;
            const overtimeHours = employeeRecords.reduce((sum, record) => sum + Math.max(getRecordHours(record) - 8, 0), 0);
            const completedRecords = employeeRecords.filter((record) => record.rawClockOut);
            const averageHours = completedRecords.length
                ? completedRecords.reduce((sum, record) => sum + getRecordHours(record), 0) / completedRecords.length
                : 0;
            const belowExpectedHours = completedRecords.reduce((sum, record) => {
                const hours = getRecordHours(record);
                return sum + (hours > 0 && hours < 8 ? 8 - hours : 0);
            }, 0);
            const lateToday = todayRecords.some((record) => record.timing === "Late");
            const todayStatus = officialDutyEmails.has(email)
                ? "Official Duty"
                : leaveEmails.has(email)
                    ? "On Leave"
                    : absentEmails.has(email)
                        ? "Absent"
                        : lateToday
                            ? "Late"
                            : presentEmails.has(email) || todayRecords.length
                                ? "Present"
                                : "Unaccounted";
            const status = Number(row.attendanceRate || 0) >= 95
                ? "Excellent"
                : Number(row.attendanceRate || 0) >= 90
                    ? "Good"
                    : Number(row.attendanceRate || 0) >= 80
                        ? "Needs Improvement"
                        : "Needs Attention";
            const statusTone = status === "Excellent"
                ? theme.success
                : status === "Good"
                    ? theme.secondary
                    : status === "Needs Improvement"
                        ? theme.warning
                        : theme.danger;

            return {
                ...row,
                lateCount,
                overtimeHours,
                averageHours,
                belowExpectedHours,
                todayStatus,
                status,
                statusTone,
                issue: todayStatus,
            };
        }).sort((a, b) => Number(b.attendanceRate || 0) - Number(a.attendanceRate || 0));
    }, [hodOfficialDutyTodayRows, processedRecords, processedSummaryRows, scopedTodayRows, theme]);

    const hodPrimaryMetricCards = useMemo(() => {
        const total = Number(kpis?.totalEmployees || 0);
        const percentage = (value) => total ? formatPercent((Number(value || 0) / total) * 100) : "0.0%";
        const leaveDutyCount = hodOnLeaveDutyRows.length;
        return [
            { key: "hodTeamMembers", title: "Total Staff", value: formatNumber(total), subtitle: "", icon: <GroupsRounded />, tone: theme.secondary },
            { key: "presentToday", title: "Present", value: formatNumber(kpis?.presentToday), subtitle: percentage(kpis?.presentToday), icon: <CheckCircleRounded />, tone: theme.success },
            { key: "absentToday", title: "Absent", value: formatNumber(kpis?.absentToday), subtitle: percentage(kpis?.absentToday), icon: <WarningAmberRounded />, tone: theme.danger },
            { key: "onLeaveDuty", title: "Leave/Duty", value: formatNumber(leaveDutyCount), subtitle: percentage(leaveDutyCount), icon: <EventAvailableRounded />, tone: theme.warning },
            { key: "lateRecords", title: "Late", value: formatNumber(hodLateTodayRows.length || hrRecordGroups.lateRecords.length), subtitle: percentage(hodLateTodayRows.length || hrRecordGroups.lateRecords.length), icon: <HourglassBottomRounded />, tone: theme.danger },
        ];
    }, [hodLateTodayRows.length, hodOnLeaveDutyRows.length, hrRecordGroups.lateRecords.length, kpis, theme]);

    const hodTodayStatusRows = useMemo(() => [
        { key: "presentToday", label: "Present", value: Number(kpis?.presentToday || 0), tone: theme.success },
        { key: "lateRecords", label: "Late", value: hodLateTodayRows.length || hrRecordGroups.lateRecords.length, tone: theme.warning },
        { key: "officialDuty", label: "Official Duty", value: hodOfficialDutyTodayRows.length, tone: theme.secondary },
        { key: "absentToday", label: "Unaccounted", value: Number(kpis?.absentToday || 0), tone: theme.muted },
    ], [hodLateTodayRows.length, hodOfficialDutyTodayRows.length, hrRecordGroups.lateRecords.length, kpis, theme]);

    const hodAttendanceDistributionRows = useMemo(() => {
        const total = Math.max(Number(kpis?.totalEmployees || 0), 1);
        const lateValue = hodLateTodayRows.length || hrRecordGroups.lateRecords.length;
        const leaveDutyValue = hodOnLeaveDutyRows.length;
        const presentOnTime = Math.max(Number(kpis?.presentToday || 0) - lateValue, 0);
        const rows = [
            { key: "presentToday", name: "Present", value: presentOnTime, color: theme.success },
            { key: "lateRecords", name: "Late", value: lateValue, color: theme.warning },
            { key: "absentToday", name: "Absent", value: Number(kpis?.absentToday || 0), color: theme.danger },
            { key: "onLeaveDuty", name: "Leave / Duty", value: leaveDutyValue, color: theme.secondary },
        ];
        return rows.map((row) => ({
            ...row,
            percent: (Number(row.value || 0) / total) * 100,
        }));
    }, [hodLateTodayRows.length, hodOnLeaveDutyRows.length, hrRecordGroups.lateRecords.length, kpis, theme]);

    const hodAttentionRows = useMemo(() => {
        const repeatedLatePeople = hodTeamRows.filter((row) => Number(row.lateCount || 0) >= 2);
        const unexplainedAbsences = scopedTodayRows.absent;
        const missingCheckoutRows = hrRecordGroups.missingCheckoutRecords;
        const belowHoursPeople = hodTeamRows.filter((row) => Number(row.belowExpectedHours || 0) > 0);
        return [
            repeatedLatePeople.length ? { key: "hodRepeatedLate", label: `${formatNumber(repeatedLatePeople.length)} employees arrived late repeatedly`, tone: theme.warning } : null,
            unexplainedAbsences.length ? { key: "absentToday", label: `${formatNumber(unexplainedAbsences.length)} employee${unexplainedAbsences.length === 1 ? " has" : "s have"} an unexplained absence`, tone: theme.danger } : null,
            missingCheckoutRows.length ? { key: "missingCheckout", label: `${formatNumber(missingCheckoutRows.length)} attendance records have missing checkout`, tone: theme.warning } : null,
            belowHoursPeople.length ? { key: "hodBelowExpectedHours", label: `${formatNumber(belowHoursPeople.length)} employees below expected monthly hours`, tone: theme.danger } : null,
        ].filter(Boolean);
    }, [hodTeamRows, hrRecordGroups.missingCheckoutRecords, scopedTodayRows.absent, theme]);

    const hodSpotlightCards = useMemo(() => {
        const bestAttendance = hodTeamRows[0];
        const mostLate = [...hodTeamRows].sort((a, b) => Number(b.lateCount || 0) - Number(a.lateCount || 0))[0];
        const mostAbsent = [...hodTeamRows].sort((a, b) => Number(b.daysAbsent || 0) - Number(a.daysAbsent || 0))[0];
        const mostOvertime = [...hodTeamRows].sort((a, b) => Number(b.overtimeHours || 0) - Number(a.overtimeHours || 0))[0];
        const belowExpected = [...hodTeamRows].sort((a, b) => Number(b.belowExpectedHours || 0) - Number(a.belowExpectedHours || 0))[0];
        return [
            { key: "hodBestAttendance", title: "Best Attendance", value: bestAttendance?.name || "N/A", subtitle: formatPercent(bestAttendance?.attendanceRate), icon: <CheckCircleRounded />, tone: theme.success },
            { key: "hodMostLate", title: "Most Late", value: mostLate?.name || "N/A", subtitle: `${formatNumber(mostLate?.lateCount || 0)} days`, icon: <HourglassBottomRounded />, tone: theme.danger },
            { key: "hodMostAbsent", title: "Most Absence", value: mostAbsent?.name || "N/A", subtitle: `${formatNumber(mostAbsent?.daysAbsent || 0)} days`, icon: <WarningAmberRounded />, tone: theme.warning },
            { key: "hodMostOvertime", title: "Most Overtime", value: mostOvertime?.name || "N/A", subtitle: formatDuration(mostOvertime?.overtimeHours || 0), icon: <TrendingUpRounded />, tone: theme.secondary },
            { key: "hodBelowExpectedHours", title: "Below Hours", value: belowExpected?.name || "N/A", subtitle: formatDuration(belowExpected?.belowExpectedHours || 0), icon: <TrendingDownRounded />, tone: theme.danger },
        ];
    }, [hodTeamRows, theme]);

    const metricDetails = useMemo(() => {
        const withHours = (rows) => rows.map((row) => ({
            ...row,
            workedHoursLabel: row.workedHours ? formatDuration(row.workedHours) : "",
        }));

        return {
            totalStaff: { title: "Total Staff in Scope", subtitle: scopeLabel, rows: processedSummaryRows, columns: detailColumns.summary },
            hodTeamMembers: { title: "Department Team Members", subtitle: `${supervisorDepartment || "Department"} at ${supervisorStation || "assigned station"}`, rows: hodTeamRows, columns: detailColumns.hodTeam },
            presentToday: { title: "Present Today", subtitle: "Staff with a clock-in today", rows: scopedTodayRows.present, columns: detailColumns.people },
            absentToday: { title: "Absent Today", subtitle: "Staff without a clock-in and not on approved leave today", rows: scopedTodayRows.absent, columns: detailColumns.people },
            onLeaveToday: { title: "On Leave Today", subtitle: "Approved leave in today's scope", rows: scopedTodayRows.onLeave, columns: [...detailColumns.people, { key: "leaveType", label: "Leave Type", minWidth: 140 }, { key: "leaveStart", label: "From", minWidth: 115 }, { key: "leaveEnd", label: "To", minWidth: 115 }] },
            onLeaveDuty: { title: "On Leave / Official Duty", subtitle: "Approved leave and official-duty records visible today", rows: hodOnLeaveDutyRows, columns: detailColumns.hodDuty },
            officialDuty: { title: "Official Duty Records", subtitle: "Outside-duty records classified from reason text", rows: hrRecordGroups.officialDutyRecords, columns: detailColumns.records },
            fieldWork: { title: "Field Work Records", subtitle: "Field, research, remote, and site-based outside records", rows: hrRecordGroups.fieldWorkRecords, columns: detailColumns.records },
            attendanceRate: { title: "Attendance Rate Contributors", subtitle: "Staff summary behind the selected attendance rate", rows: processedSummaryRows, columns: detailColumns.summary },
            punctualityRate: { title: "Punctuality by Record", subtitle: "On-time and late records in the selected scope", rows: processedRecords, columns: detailColumns.records },
            stationPerformance: { title: "All Station / Centre Performance", subtitle: "Configured stations with attendance metrics in the selected scope", rows: configuredStationPerformanceRows, columns: detailColumns.performance },
            departmentPerformance: { title: "All Department Performance", subtitle: "Configured departments with attendance metrics in the selected scope", rows: configuredDepartmentPerformanceRows, columns: detailColumns.performance },
            departmentHeatmap: { title: "Department Attendance Heatmap", subtitle: "Weekday attendance rates for all configured departments", rows: departmentHeatmapRows, columns: [], variant: "heatmap", rowLabel: "Department", rowKey: "department" },
            stationHeatmap: { title: "Station / Centre Attendance Heatmap", subtitle: "Weekday attendance rates for all configured stations", rows: stationHeatmapRows, columns: [], variant: "heatmap", rowLabel: "Station", rowKey: "station" },
            hodDepartmentHeatmap: { title: `${supervisorDepartment || "Department"} Attendance Heatmap`, subtitle: `${supervisorStation || "Assigned station"} weekday attendance pattern`, rows: hodDepartmentHeatmapRows, columns: [], variant: "heatmap", rowLabel: "Department", rowKey: "department" },
            hodAttendanceDistribution: { title: "Department Attendance Distribution", subtitle: "Today by attendance state", rows: hodAttendanceDistributionRows, columns: detailColumns.distribution },
            lateRecords: { title: "Late Records", subtitle: "Late clock-ins in the selected scope", rows: hrRecordGroups.lateRecords, columns: detailColumns.records },
            averageWorkingHours: { title: "Completed Working Hours", subtitle: "Records with clock-in and clock-out", rows: hrRecordGroups.completedRecords, columns: [...detailColumns.records, { key: "workedHours", label: "Hours", minWidth: 90, render: (row) => formatDuration(getRecordHours(row)) }] },
            overtimeHours: { title: "Overtime Records", subtitle: "Completed records above 8 hours", rows: withHours(hrRecordGroups.overtimeRecords), columns: [...detailColumns.records, { key: "workedHoursLabel", label: "Worked", minWidth: 90 }] },
            missingCheckout: { title: "Missing Checkout Records", subtitle: "Open or system-closed attendance records", rows: hrRecordGroups.missingCheckoutRecords, columns: detailColumns.records },
            lostWorkingHours: { title: "Lost Working Hour Drivers", subtitle: "Short completed days and absent days", rows: [...hrRecordGroups.shortHourRecords, ...processedSummaryRows.filter((row) => Number(row.daysAbsent || 0) > 0)], columns: [...detailColumns.summary, { key: "workedHours", label: "Worked", minWidth: 90, render: (row) => row.workedHours ? formatDuration(row.workedHours) : "Absence" }] },
            biometricReadiness: { title: "Biometric Readiness", subtitle: "Scoped enrolment and device readiness totals", rows: [{ id: "biometric", name: "Biometric Readiness", staff: Number(kpis?.totalEmployees || 0), attendanceRate: biometricAnalytics?.enrollmentRate || 0, punctualityRate: biometricAnalytics?.deviceUptime || 0, absenteeismRate: 100 - Number(biometricAnalytics?.enrollmentRate || 0), lateCount: biometricAnalytics?.inactiveDevices || 0, onLeaveDays: biometricAnalytics?.lostDevices || 0, averageWorkingHours: 0 }], columns: detailColumns.performance },
            outsideClocking: { title: "Outside Clocking Records", subtitle: "Off-premise or outside-location records", rows: hrRecordGroups.outsideRecords, columns: detailColumns.records },
            openSessions: { title: "Open Sessions", subtitle: "Clock-ins without completed clock-outs", rows: hrRecordGroups.missingCheckoutRecords, columns: detailColumns.records },
            hodRepeatedLate: { title: "Repeated Late Arrivals", subtitle: "Team members with two or more late records in the selected period", rows: hodTeamRows.filter((row) => Number(row.lateCount || 0) >= 2), columns: detailColumns.hodTeam },
            hodBelowExpectedHours: { title: "Below Expected Hours", subtitle: "Team members with completed days below expected hours", rows: hodTeamRows.filter((row) => Number(row.belowExpectedHours || 0) > 0), columns: detailColumns.hodTeam },
            hodBestAttendance: { title: "Best Attendance", subtitle: "Top department attendance performer", rows: hodTeamRows.slice(0, 1), columns: detailColumns.hodTeam },
            hodMostLate: { title: "Most Late", subtitle: "Team member with the highest late count", rows: [...hodTeamRows].sort((a, b) => Number(b.lateCount || 0) - Number(a.lateCount || 0)).slice(0, 1), columns: detailColumns.hodTeam },
            hodMostAbsent: { title: "Most Absence", subtitle: "Team member with the highest absent days", rows: [...hodTeamRows].sort((a, b) => Number(b.daysAbsent || 0) - Number(a.daysAbsent || 0)).slice(0, 1), columns: detailColumns.hodTeam },
            hodMostOvertime: { title: "Most Overtime", subtitle: "Team member with the highest overtime hours", rows: [...hodTeamRows].sort((a, b) => Number(b.overtimeHours || 0) - Number(a.overtimeHours || 0)).slice(0, 1), columns: detailColumns.hodTeam },
        };
    }, [
        biometricAnalytics,
        configuredDepartmentPerformanceRows,
        configuredStationPerformanceRows,
        detailColumns,
        departmentHeatmapRows,
        hodAttendanceDistributionRows,
        hodDepartmentHeatmapRows,
        hodOnLeaveDutyRows,
        hodTeamRows,
        hrRecordGroups,
        kpis,
        processedRecords,
        processedSummaryRows,
        scopedTodayRows,
        scopeLabel,
        stationHeatmapRows,
        supervisorDepartment,
        supervisorStation,
    ]);

    const openMetricDetails = useCallback((key) => {
        setMetricDialog(metricDetails[key] || null);
    }, [metricDetails]);

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
        ],
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

    const reportingStationCount = useMemo(
        () => sortedStations.filter((station) => (
            Number(station.staffCount || 0) > 0
            || Number(station.attendanceRate || 0) > 0
            || Number(station.presentDays || 0) > 0
        )).length || sortedStations.length,
        [sortedStations]
    );
    const reportingStationTotal = useMemo(
        () => {
            if (isSupervisorScope || isStationScopedHr) return supervisorStation ? 1 : reportingStationCount;
            return Math.max(filterOptions.stations.length, reportingStationCount);
        },
        [filterOptions.stations.length, isStationScopedHr, isSupervisorScope, reportingStationCount, supervisorStation]
    );

    const analyticsCopy = useMemo(() => {
        if (userRank === "ceo") {
            return {
                pageHeading: "KMFRI Executive Attendance Overview",
                pageSubtitle: "Strategic attendance performance across the organisation.",
                scopeChipLabel: readOnly ? "Read Only" : "CEO Executive View",
                workforceTitle: "Executive KPIs",
                workforceSubtitle: "Strategic workforce indicators for the selected period",
                periodTitle: "Executive Pulse",
                periodSubtitle: "Attendance target, availability, and compliance signals",
                trendTitle: "Organisation Attendance Trend",
                trendSubtitle: "Attendance rate movement across the selected period",
                distributionTitle: "Workforce Distribution",
                distributionSubtitle: "Today by organisation attendance state",
                qualityTitle: "Governance Signals",
                qualitySubtitle: "Compliance and exception signals for executive visibility",
                stationTableTitle: "Station Performance",
                stationTableSubtitle: "Attendance, punctuality, and absence comparison across stations",
                departmentTableTitle: "Department Overview",
                departmentTableSubtitle: "Department-level attendance and punctuality profile",
                performanceTitle: "Station Performance",
                performanceSubtitle: "Executive comparison across KMFRI stations",
                insightTitle: "Executive Summary",
                insightSubtitle: "High-signal cards for executive action",
                recommendationTitle: "Executive Recommendations",
                recommendationSubtitle: "Strategic actions for organisation-wide attendance governance",
            };
        }

        if (isSupervisorScope) {
            const departmentLabel = supervisorDepartment || "Department";
            return {
                pageHeading: `${departmentLabel} Department Attendance`,
                pageSubtitle: "Head of Department attendance supervision and exception review.",
                scopeChipLabel: readOnly ? "Read Only" : "HOD Scope",
                workforceTitle: "Today",
                workforceSubtitle: "Current team attendance position",
                periodTitle: "Period",
                periodSubtitle: `${formatDateLabel(effectiveFilters.startDate)} - ${formatDateLabel(effectiveFilters.endDate)}`,
                trendTitle: "Attendance Trend",
                trendSubtitle: "Department attendance movement across working days",
                distributionTitle: "Attendance Distribution",
                distributionSubtitle: "Today by department attendance state",
                qualityTitle: "Team Insights",
                qualitySubtitle: "Exceptions requiring HOD review",
                stationTableTitle: "Staff Attendance",
                stationTableSubtitle: "Working-day attendance by team member",
                departmentTableTitle: "Exceptions Requiring Review",
                departmentTableSubtitle: "Team members needing attendance follow-up",
                performanceTitle: "Department Staff Ranking",
                performanceSubtitle: "Attendance leaders and staff requiring support",
                insightTitle: "Team Insights",
                insightSubtitle: "High-signal cards for HOD action",
                recommendationTitle: "HOD Recommendations",
                recommendationSubtitle: "Team-level actions for Head of Department follow-up",
            };
        }

        const pageHeading = isStationScopedHr
            ? `${supervisorStation || "Station"} HR Analytics`
            : "Organisation HR Attendance Analytics";
        const pageSubtitle = isStationScopedHr
            ? "Station-level attendance overview and departmental performance."
            : "Organisation-wide attendance, punctuality, absenteeism and compliance across KMFRI stations and departments.";

        return {
            pageHeading,
            pageSubtitle,
            scopeChipLabel: readOnly
                ? "Read Only"
                : isStationScopedHr
                    ? "Station HR Scope"
                    : isFullHr
                        ? "Super HR Scope"
                        : "Privileged Analytics",
            workforceTitle: "Today's Workforce",
            workforceSubtitle: "Live workforce status for the selected scope",
            periodTitle: "Period Performance",
            periodSubtitle: `${formatDateLabel(effectiveFilters.startDate)} - ${formatDateLabel(effectiveFilters.endDate)}`,
            trendTitle: "Attendance Trend",
            trendSubtitle: "Attendance rate across working days in the selected period",
            distributionTitle: "Attendance Distribution",
            distributionSubtitle: "Today by attendance state",
            qualityTitle: "Attendance Quality",
            qualitySubtitle: "Exceptions requiring review",
            stationTableTitle: "Attendance by Station",
            stationTableSubtitle: "Station attendance, punctuality, and absence profile",
            departmentTableTitle: "Department Performance",
            departmentTableSubtitle: "Department attendance and punctuality profile",
            performanceTitle: "Station Insights",
            performanceSubtitle: "Best, lowest, and most improved operational signals",
            insightTitle: "Management Insights",
            insightSubtitle: "High-signal cards for management action",
            recommendationTitle: isFullHr
                ? "Mombasa Centre HR Recommendations"
                : isStationScopedHr
                    ? `${supervisorStation || "Station"} HR Recommendations`
                    : "Management Recommendations",
            recommendationSubtitle: isFullHr
                ? "Cross-station and cross-department actions for headquarters HR"
                : isStationScopedHr
                    ? "Station-specific actions for local HR administration"
                    : "Actionable recommendations from the selected attendance period",
        };
    }, [
        effectiveFilters.endDate,
        effectiveFilters.startDate,
        isFullHr,
        isStationScopedHr,
        isSupervisorScope,
        readOnly,
        supervisorDepartment,
        supervisorStation,
        userRank,
    ]);

    const workforceMetricCards = useMemo(() => {
        const totalEmployees = Number(kpis?.totalEmployees || 0);
        const presentToday = Number(kpis?.presentToday || 0);
        const absentToday = Number(kpis?.absentToday || 0);
        const onLeaveToday = Number(kpis?.onLeaveToday || 0);
        const presentCoverage = totalEmployees ? (presentToday / totalEmployees) * 100 : 0;
        const absentCoverage = totalEmployees ? (absentToday / totalEmployees) * 100 : 0;
        const leaveCoverage = totalEmployees ? (onLeaveToday / totalEmployees) * 100 : 0;

        const baseCards = [
            { title: "Total Staff", value: formatNumber(totalEmployees), subtitle: "All employees", icon: <GroupsRounded />, tone: theme.secondary },
            { title: "Present Today", value: formatNumber(presentToday), subtitle: `${formatPercent(presentCoverage)} of staff`, icon: <CheckCircleRounded />, tone: theme.success },
            { title: "Absent Today", value: formatNumber(absentToday), subtitle: `${formatPercent(absentCoverage)} of staff`, icon: <WarningAmberRounded />, tone: theme.danger },
            { title: "On Leave Today", value: formatNumber(onLeaveToday), subtitle: `${formatPercent(leaveCoverage)} of staff`, icon: <EventAvailableRounded />, tone: theme.warning },
        ];

        if (userRank !== "ceo") return baseCards;

        return [
            baseCards[0],
            baseCards[1],
            { title: "Attendance Rate", value: formatPercent(kpis?.attendanceRate), subtitle: `${formatDelta(attendanceDelta || 0, "pp")} vs previous`, icon: <PieChartRounded />, tone: theme.secondary, delta: attendanceDelta },
            { title: "Punctuality Rate", value: formatPercent(kpis?.punctualityRate), subtitle: `${formatDelta(punctualityDelta || 0, "pp")} vs previous`, icon: <CheckCircleRounded />, tone: theme.success, delta: punctualityDelta },
            { title: "Absenteeism Rate", value: formatPercent(kpis?.absenteeismRate), subtitle: "Lower is better", icon: <TrendingDownRounded />, tone: theme.danger, delta: absenteeismDelta },
            { title: "Employees on Leave", value: formatNumber(onLeaveToday), subtitle: `${formatPercent(leaveCoverage)} of workforce`, icon: <EventAvailableRounded />, tone: theme.warning },
            { title: "Average Working Hours", value: `${Number(kpis?.averageWorkingHours || 0).toFixed(1)} h`, subtitle: `${formatDelta(productivityDelta || 0, "pp")} productivity`, icon: <AssessmentRounded />, tone: theme.purple, delta: productivityDelta },
            { title: "Stations Reporting", value: `${formatNumber(reportingStationCount)} / ${formatNumber(reportingStationTotal)}`, subtitle: reportingStationTotal ? `${formatPercent((reportingStationCount / reportingStationTotal) * 100)} reporting` : "Reporting coverage", icon: <ShieldRounded />, tone: theme.accent },
        ];
    }, [
        absenteeismDelta,
        attendanceDelta,
        kpis,
        productivityDelta,
        punctualityDelta,
        reportingStationCount,
        reportingStationTotal,
        theme,
        userRank,
    ]);

    const periodMetricCards = useMemo(() => {
        if (userRank === "ceo") {
            return [
                { title: "Attendance vs Target", value: `${formatPercent(kpis?.attendanceRate)} / 90%`, subtitle: `${formatDelta(Number(kpis?.attendanceRate || 0) - 90, "pp")} target gap`, icon: <AssessmentRounded />, tone: Number(kpis?.attendanceRate || 0) >= 90 ? theme.success : theme.warning, delta: Number(kpis?.attendanceRate || 0) - 90 },
                { title: "Stations Below Target", value: formatNumber(sortedStations.filter((station) => Number(station.attendanceRate || 0) < 90).length), subtitle: "Below 90% attendance", icon: <WarningAmberRounded />, tone: theme.danger },
                { title: "Open Sessions", value: formatNumber(referenceMetrics.openSessions), subtitle: "Clock-outs still pending", icon: <HourglassBottomRounded />, tone: referenceMetrics.openSessions ? theme.warning : theme.success },
            ];
        }

        return [
            { title: "Attendance Rate", value: formatPercent(kpis?.attendanceRate), subtitle: `${formatDelta(attendanceDelta || 0, "pp")} vs previous`, icon: <PieChartRounded />, tone: theme.secondary, delta: attendanceDelta },
            { title: "Punctuality Rate", value: formatPercent(kpis?.punctualityRate), subtitle: `${formatDelta(punctualityDelta || 0, "pp")} vs previous`, icon: <CheckCircleRounded />, tone: theme.success, delta: punctualityDelta },
            ...(isSupervisorScope
                ? []
                : [{ title: "Absenteeism Rate", value: formatPercent(kpis?.absenteeismRate), subtitle: `${formatDelta(absenteeismDelta || 0, "pp")} improvement`, icon: <TrendingDownRounded />, tone: theme.purple, delta: absenteeismDelta }]),
        ];
    }, [
        absenteeismDelta,
        attendanceDelta,
        isSupervisorScope,
        kpis,
        punctualityDelta,
        referenceMetrics.openSessions,
        sortedStations,
        theme,
        userRank,
    ]);

    const periodRangeLabel = `${formatDateLabel(effectiveFilters.startDate)} - ${formatDateLabel(effectiveFilters.endDate)}`;
    const lastUpdatedLabel = new Date().toLocaleString("en-KE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: EAT_TIMEZONE,
    });
    const attendanceTargetGap = Number(kpis?.attendanceRate || 0) - 90;
    const stationBelowTargetCount = sortedStations.filter((station) => Number(station.attendanceRate || 0) < 90).length;
    const mostImprovedStation = sortedStations.find((station) => station.station !== topStation?.station) || topStation;
    const lowestAbsenteeismDepartment = [...sortedDepartments]
        .sort((a, b) => Number(b.absenteeismRate || 0) - Number(a.absenteeismRate || 0))[0];

    const hrManagementCards = useMemo(
        () => [
            {
                label: "Best Station",
                value: topStation?.station || "N/A",
                subtitle: formatPercent(topStation?.attendanceRate),
                tone: theme.success,
                positive: true,
            },
            {
                label: "Needs Attention",
                value: lowestStation?.station || "N/A",
                subtitle: formatPercent(lowestStation?.attendanceRate),
                tone: theme.danger,
                positive: false,
            },
            {
                label: "Highest Absenteeism",
                value: lowestAbsenteeismDepartment?.department || lowestStation?.station || "N/A",
                subtitle: formatPercent(lowestAbsenteeismDepartment?.absenteeismRate ?? lowestStation?.absenteeismRate),
                tone: theme.warning,
                positive: false,
            },
            {
                label: "Most Improved",
                value: topDepartment?.department || mostImprovedStation?.station || "N/A",
                subtitle: `${formatDelta(attendanceDelta || 0, "pp")} vs previous`,
                tone: theme.secondary,
                positive: Number(attendanceDelta || 0) >= 0,
            },
        ],
        [attendanceDelta, lowestAbsenteeismDepartment, lowestStation, mostImprovedStation, theme, topDepartment, topStation]
    );

    const ceoExecutiveCards = useMemo(
        () => [
            {
                label: "Best Station",
                value: topStation?.station || "N/A",
                subtitle: formatPercent(topStation?.attendanceRate),
                tone: theme.success,
                positive: true,
            },
            {
                label: "Needs Attention",
                value: lowestStation?.station || "N/A",
                subtitle: formatPercent(lowestStation?.attendanceRate),
                tone: theme.danger,
                positive: false,
            },
            {
                label: "Most Improved",
                value: mostImprovedStation?.station || "N/A",
                subtitle: `${formatDelta(attendanceDelta || 0, "pp")} vs previous`,
                tone: theme.secondary,
                positive: Number(attendanceDelta || 0) >= 0,
            },
            {
                label: "Highest Absenteeism",
                value: lowestAbsenteeismDepartment?.department || lowestStation?.station || "N/A",
                subtitle: formatPercent(lowestAbsenteeismDepartment?.absenteeismRate ?? lowestStation?.absenteeismRate),
                tone: theme.purple,
                positive: false,
            },
        ],
        [attendanceDelta, lowestAbsenteeismDepartment, lowestStation, mostImprovedStation, theme, topStation]
    );

    const ceoSummaryItems = useMemo(
        () => [
            {
                label: "Attendance improved",
                value: `${formatDelta(attendanceDelta || 0, "pp")} vs previous`,
                tone: Number(attendanceDelta || 0) >= 0 ? theme.success : theme.danger,
            },
            {
                label: "Stations below target (90%)",
                value: formatNumber(stationBelowTargetCount),
                tone: stationBelowTargetCount ? theme.warning : theme.success,
            },
            {
                label: "Highest absenteeism",
                value: `${lowestAbsenteeismDepartment?.department || lowestStation?.station || "N/A"} (${formatPercent(lowestAbsenteeismDepartment?.absenteeismRate ?? lowestStation?.absenteeismRate)})`,
                tone: theme.danger,
            },
            {
                label: "Stations submitted data",
                value: `${formatNumber(reportingStationCount)} / ${formatNumber(reportingStationTotal)}`,
                tone: theme.secondary,
            },
        ],
        [attendanceDelta, lowestAbsenteeismDepartment, lowestStation, reportingStationCount, reportingStationTotal, stationBelowTargetCount, theme]
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
                    detail: `Use ${scopedStationLabel} attendance to confirm coverage before HODs assign field or lab tasks.`,
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
                    detail: "Discuss repeated late arrivals with HODs and confirm whether station-specific reporting constraints exist.",
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
                    chip: "HOD",
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

        const value = event.target.value;
        setDraftFilters((previous) => ({
            ...previous,
            [field]: value,
            ...(field === "startDate" || field === "endDate" ? { quickRange: "custom" } : {}),
        }));
        setFilters((previous) => ({
            ...previous,
            [field]: value,
            ...(field === "startDate" || field === "endDate" ? { quickRange: "custom" } : {}),
        }));
        setRecordPage(0);
        setSummaryPage(0);
    };

    const handleQuickRangeChange = (event) => {
        const value = event.target.value;
        const selectedRange = quickRanges.find((range) => range.value === value);

        const nextRangeValues = selectedRange
            ? {
                startDate: selectedRange.startDate(),
                endDate: selectedRange.endDate(),
            }
            : {};

        setDraftFilters((previous) => ({
            ...previous,
            quickRange: value,
            ...nextRangeValues,
        }));
        setFilters((previous) => ({
            ...previous,
            quickRange: value,
            ...nextRangeValues,
        }));
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
            clockingType: "",
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
        doc.text(`GENERATED: ${new Date().toLocaleString().toUpperCase()} | BY: ${(user?.name || "AUTHORIZED PERSONNEL").toUpperCase()}`, pw / 2, 29, { align: "center" });
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
                head: [["No.", "Employee ID", "Name", "Date", "Clock In", "Clock Out", "Timing", "In Location", "Out Location", "Department"]],
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
                head: [["No.", "Employee ID", "Name", "Role", "Department", "Total Days", "Working Days", "Present", "Absent", "Attendance"]],
                body: filteredSummaryRows.map((row, index) => [
                    index + 1,
                    row.employeeId,
                    row.name,
                    humanizeStaffAttribute(row.role),
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
                columnStyles: { 2: { cellWidth: 48 }, 4: { cellWidth: 58 } },
            });

            await finalizeVerifiedPdf({
                ...ctx,
                metadata: { exportKind: "summary", rows: filteredSummaryRows.length },
            });
        } finally {
            setPdfExporting("");
        }
    };

    const pageHeading = analyticsCopy.pageHeading;
    const pageSubtitle = analyticsCopy.pageSubtitle;
    const scopeChipLabel = analyticsCopy.scopeChipLabel;
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
                                <InputLabel shrink>Staff Type</InputLabel>
                                <Select
                                    value={draftFilters.staffFilter}
                                    label="Staff Type"
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
                                <InputLabel shrink>Clocking Type</InputLabel>
                                <Select
                                    value={draftFilters.clockingType}
                                    label="Clocking Type"
                                    onChange={handleFilterChange("clockingType")}
                                    displayEmpty
                                    renderValue={(selected) => clockingTypeOptions.find((item) => item.value === selected)?.label || "All Clocking Types"}
                                >
                                    {clockingTypeOptions.map((item) => (
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
                        <Box sx={{ justifySelf: "start" }}>
                            <Button
                                variant="outlined"
                                onClick={clearFilters}
                                disabled={loading}
                                sx={{ minHeight: 40, textTransform: "none", fontWeight: 800, borderRadius: "8px", borderColor: theme.border, color: theme.primary }}
                            >
                                Clear
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {activeReportTab === "analytics" && (
                <>
                    <Box sx={{ display: "grid", gap: 1.5 }}>
                        {userRank === "ceo" ? (
                            <>
                                <Grid container spacing={1.5}>
                                    <Grid item xs={12} lg={6}>
                                        <SectionCard title="Executive KPIs" theme={theme}>
                                            <Grid container spacing={1.1}>
                                                {workforceMetricCards.map((metric) => (
                                                    <Grid item xs={6} md={3} key={metric.title}>
                                                        <OverviewMetricCard {...metric} theme={theme} />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </SectionCard>
                                    </Grid>
                                    <Grid item xs={12} lg={6}>
                                        <SectionCard
                                            title="Organisation Attendance Trend"
                                            theme={theme}
                                            action={
                                                <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap>
                                                    {["Monthly", "Quarterly", "Annual", "YoY"].map((label, index) => (
                                                        <Chip key={label} size="small" label={label} sx={{ height: 24, borderRadius: "6px", fontSize: 10, fontWeight: 900, bgcolor: index === 0 ? `${theme.secondary}14` : "transparent", color: index === 0 ? theme.secondary : theme.muted, border: `1px solid ${index === 0 ? `${theme.secondary}33` : theme.border}` }} />
                                                    ))}
                                                </Stack>
                                            }
                                        >
                                            <Box sx={{ height: 250 }}>
                                                {chartData.length ? (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={chartData} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.16)" />
                                                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: theme.muted }} minTickGap={16} />
                                                            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: theme.muted }} tickFormatter={(value) => `${value}%`} />
                                                            <RechartsTooltip formatter={(value) => [formatPercent(value), "Attendance Rate"]} />
                                                            <Legend iconType="plainline" wrapperStyle={{ fontSize: 11 }} />
                                                            <Line type="monotone" dataKey="attendance" name="Attendance Rate (%)" stroke={theme.secondary} strokeWidth={2.6} dot={{ r: 2.5 }} activeDot={{ r: 5 }} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <EmptyState label="No attendance trend data available." theme={theme} />
                                                )}
                                            </Box>
                                        </SectionCard>
                                    </Grid>
                                </Grid>

                                <Grid container spacing={1.5}>
                                    <Grid item xs={12} lg={5}>
                                        <SectionCard title="Station Performance" theme={theme}>
                                            <Stack spacing={1.15}>
                                                {sortedStations.slice(0, 5).map((station, index) => {
                                                    const rate = Number(station.attendanceRate || 0);
                                                    const delta = Number(attendanceDelta || 0) - index * 0.6;
                                                    return (
                                                        <Box key={station.station || index} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "130px 1fr 72px 70px" }, gap: 1, alignItems: "center" }}>
                                                            <Typography sx={{ fontSize: 12, fontWeight: 900, color: theme.text }} noWrap>{station.station || "Unassigned"}</Typography>
                                                            <LinearProgress variant="determinate" value={safePercent(rate)} sx={{ height: 8, borderRadius: 999, bgcolor: `${theme.muted}20`, "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: getAttendanceColor(rate, theme) } }} />
                                                            <Typography sx={{ fontSize: 12, fontWeight: 950, color: theme.text, textAlign: { sm: "right" } }}>{formatPercent(rate)}</Typography>
                                                            <Typography sx={{ fontSize: 11, fontWeight: 900, color: delta >= 0 ? theme.success : theme.danger, textAlign: { sm: "right" } }}>{formatDelta(delta, "pp")}</Typography>
                                                        </Box>
                                                    );
                                                })}
                                            </Stack>
                                        </SectionCard>
                                    </Grid>
                                    <Grid item xs={12} lg={7}>
                                        <SectionCard title="Department Overview" theme={theme}>
                                            <TableContainer sx={{ overflowX: "auto" }}>
                                                <Table size="small" stickyHeader sx={{ minWidth: 700 }}>
                                                    <TableHead>
                                                        <TableRow>
                                                            {["Department", "Staff", "Attendance", "Punctuality", "Absenteeism", "vs Previous"].map((heading) => (
                                                                <TableCell key={heading} align={heading === "Department" ? "left" : "right"} sx={{ fontSize: 10, fontWeight: 950, color: theme.primary, bgcolor: "#fff", borderColor: theme.border }}>{heading}</TableCell>
                                                            ))}
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {sortedDepartments.slice(0, 6).map((department, index) => {
                                                            const rate = Number(department.attendanceRate || 0);
                                                            const delta = Number(attendanceDelta || 0) - index * 0.4;
                                                            return (
                                                                <TableRow key={department.department || index}>
                                                                    <TableCell><Typography sx={{ fontSize: 12, fontWeight: 900, color: theme.text }} noWrap>{department.department || "Unassigned"}</Typography></TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 12 }}>{formatNumber(department.staffCount)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 12, fontWeight: 900, color: getAttendanceColor(rate, theme) }}>{formatPercent(rate)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 12 }}>{formatPercent(department.punctualityRate)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 12 }}>{formatPercent(department.absenteeismRate)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 12, fontWeight: 900, color: delta >= 0 ? theme.success : theme.danger }}>{formatDelta(delta, "pp")}</TableCell>
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
                                    <Grid item xs={12} lg={7}>
                                        <SectionCard title="Executive Insights" theme={theme}>
                                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 1 }}>
                                                {ceoExecutiveCards.map((card) => (
                                                    <InsightTile key={card.label} label={card.label} value={card.value} subtitle={card.subtitle} tone={card.tone} positive={card.positive} theme={theme} />
                                                ))}
                                            </Box>
                                        </SectionCard>
                                    </Grid>
                                    <Grid item xs={12} lg={5}>
                                        <SectionCard title="Executive Summary" theme={theme}>
                                            <Grid container spacing={1.2}>
                                                <Grid item xs={12} sm={5}>
                                                    <Box sx={{ p: 1.6, minHeight: 128, borderRadius: "8px", bgcolor: `${theme.warning}12`, border: `1px solid ${theme.warning}24` }}>
                                                        <Typography sx={{ fontSize: 11, fontWeight: 900, color: theme.text }}>Attendance vs Target</Typography>
                                                        <Typography sx={{ mt: 1.5, fontSize: 24, fontWeight: 950, color: theme.text }}>{formatPercent(kpis?.attendanceRate)} / 90%</Typography>
                                                        <Typography sx={{ mt: 1, fontSize: 11, fontWeight: 900, color: attendanceTargetGap >= 0 ? theme.success : theme.danger }}>{formatDelta(attendanceTargetGap, "pp")} target gap</Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={7}>
                                                    <Stack spacing={1}>
                                                        {ceoSummaryItems.map((item) => (
                                                            <Stack key={item.label} direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                                                <Typography sx={{ fontSize: 11, fontWeight: 800, color: theme.text }}>{item.label}</Typography>
                                                                <Typography sx={{ fontSize: 11, fontWeight: 950, color: item.tone, textAlign: "right" }}>{item.value}</Typography>
                                                            </Stack>
                                                        ))}
                                                    </Stack>
                                                </Grid>
                                            </Grid>
                                        </SectionCard>
                                    </Grid>
                                </Grid>

                                <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" sx={{ color: theme.muted, px: 0.5 }}>
                                    <Typography sx={{ fontSize: 11, fontWeight: 700 }}>Data is based on biometric records. Last updated: {lastUpdatedLabel} EAT</Typography>
                                    <Typography sx={{ fontSize: 11, fontWeight: 700 }}>* Average working hours based on valid attended days</Typography>
                                </Stack>
                            </>
                        ) : isSupervisorScope ? (
                            <HodAttendanceAnalytics
                                theme={theme}
                                kpis={kpis}
                                previousKpis={previousKpis}
                                periodRangeLabel={periodRangeLabel}
                                supervisorDepartment={supervisorDepartment}
                                supervisorStation={supervisorStation}
                                primaryMetricCards={hodPrimaryMetricCards}
                                todayStatusRows={hodTodayStatusRows}
                                chartData={chartData}
                                attendanceDelta={attendanceDelta}
                                punctualityDelta={punctualityDelta}
                                hodTeamRows={hodTeamRows}
                                attentionRows={hodAttentionRows}
                                departmentHeatmapRows={hodDepartmentHeatmapRows}
                                attendanceDistributionRows={hodAttendanceDistributionRows}
                                spotlightCards={hodSpotlightCards}
                                onMetricClick={openMetricDetails}
                            />
                        ) : false ? (
                            <>
                                <Grid container spacing={1.5}>
                                    <Grid item xs={12} lg={8}>
                                        <SectionCard title="Today's Workforce" theme={theme}>
                                            <Grid container spacing={1.1}>
                                                {workforceMetricCards.map((metric) => (
                                                    <Grid item xs={6} md={3} key={metric.title}>
                                                        <OverviewMetricCard {...metric} theme={theme} />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </SectionCard>
                                    </Grid>
                                    <Grid item xs={12} lg={4}>
                                        <SectionCard title="Period Performance" subtitle={periodRangeLabel} theme={theme}>
                                            <Grid container spacing={1.1}>
                                                {periodMetricCards.map((metric) => (
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
                                            theme={theme}
                                            action={
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                    {["Daily", "Weekly", "Monthly", "Yearly"].map((label, index) => (
                                                        <Chip key={label} size="small" label={label} sx={{ height: 24, borderRadius: "6px", fontSize: 10, fontWeight: 900, bgcolor: index === 0 ? `${theme.secondary}14` : "transparent", color: index === 0 ? theme.secondary : theme.muted, border: `1px solid ${index === 0 ? `${theme.secondary}33` : theme.border}` }} />
                                                    ))}
                                                </Stack>
                                            }
                                        >
                                            <Box sx={{ height: 260 }}>
                                                {chartData.length ? (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={chartData} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.16)" />
                                                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: theme.muted }} minTickGap={16} />
                                                            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: theme.muted }} tickFormatter={(value) => `${value}%`} />
                                                            <RechartsTooltip formatter={(value, name) => [name === "Attendance Rate" ? formatPercent(value) : formatNumber(value), name]} />
                                                            <Legend iconType="plainline" wrapperStyle={{ fontSize: 11 }} />
                                                            <Line type="monotone" dataKey="attendance" name="Attendance Rate (%)" stroke={theme.secondary} strokeWidth={2.6} dot={{ r: 2.5 }} activeDot={{ r: 5 }} />
                                                            <Line type="monotone" dataKey="present" name="Previous Period (%)" stroke="#CBD5E1" strokeDasharray="4 4" strokeWidth={1.8} dot={false} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <EmptyState label="No attendance trend data available." theme={theme} />
                                                )}
                                            </Box>
                                        </SectionCard>
                                    </Grid>
                                    <Grid item xs={12} lg={6}>
                                        <SectionCard title="Attendance Distribution" theme={theme}>
                                            <Grid container spacing={1} alignItems="center">
                                                <Grid item xs={12} md={6}>
                                                    <DonutVisualization data={attendanceDistributionRows} theme={theme} centerValue={formatNumber(kpis?.totalEmployees)} centerLabel="Total Staff" height={245} />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Stack spacing={1}>
                                                        {attendanceDistributionRows.map((item) => {
                                                            const total = Number(kpis?.totalEmployees || 0);
                                                            return (
                                                                <Stack key={item.name} direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                                                    <Stack direction="row" spacing={0.8} alignItems="center" sx={{ minWidth: 0 }}>
                                                                        <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: item.color, flexShrink: 0 }} />
                                                                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: theme.text }} noWrap>{item.name}</Typography>
                                                                    </Stack>
                                                                    <Typography sx={{ fontSize: 12, fontWeight: 900, color: theme.text }}>{formatNumber(item.value)} ({formatPercent((Number(item.value || 0) / Math.max(total, 1)) * 100)})</Typography>
                                                                </Stack>
                                                            );
                                                        })}
                                                    </Stack>
                                                </Grid>
                                            </Grid>
                                        </SectionCard>
                                    </Grid>
                                </Grid>

                                <Grid container spacing={1.5}>
                                    <Grid item xs={12} lg={6}>
                                        <SectionCard title="Attendance by Station" theme={theme}>
                                            <TableContainer sx={{ overflowX: "auto" }}>
                                                <Table size="small" stickyHeader sx={{ minWidth: 650 }}>
                                                    <TableHead>
                                                        <TableRow>
                                                            {["Station", "Staff", "Attendance", "Punctuality", "Absenteeism", "Trend"].map((heading) => (
                                                                <TableCell key={heading} align={heading === "Station" ? "left" : "right"} sx={{ fontSize: 10, fontWeight: 950, color: theme.primary, bgcolor: "#fff", borderColor: theme.border }}>{heading}</TableCell>
                                                            ))}
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {sortedStations.slice(0, 6).map((station) => {
                                                            const rate = Number(station.attendanceRate || 0);
                                                            return (
                                                                <TableRow key={station.station}>
                                                                    <TableCell><Typography sx={{ fontSize: 12, fontWeight: 900, color: theme.text }} noWrap>{station.station || "Unassigned"}</Typography></TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 12 }}>{formatNumber(station.staffCount)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 12, fontWeight: 900, color: getAttendanceColor(rate, theme) }}>{formatPercent(rate)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 12 }}>{formatPercent(station.punctualityRate)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 12 }}>{formatPercent(station.absenteeismRate)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 14, fontWeight: 950, color: rate >= 85 ? theme.success : theme.danger }}>{rate >= 85 ? "↑" : "↓"}</TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </SectionCard>
                                    </Grid>
                                    <Grid item xs={12} lg={6}>
                                        <SectionCard title="Department Performance" theme={theme}>
                                            <TableContainer sx={{ overflowX: "auto" }}>
                                                <Table size="small" stickyHeader sx={{ minWidth: 800 }}>
                                                    <TableHead>
                                                        <TableRow>
                                                            {["Department", "Staff", "Attendance", "Punctuality", "Absenteeism", "Late", "Early", "Trend"].map((heading) => (
                                                                <TableCell key={heading} align={heading === "Department" ? "left" : "right"} sx={{ fontSize: 10, fontWeight: 950, color: theme.primary, bgcolor: "#fff", borderColor: theme.border }}>{heading}</TableCell>
                                                            ))}
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {sortedDepartments.slice(0, 6).map((department) => {
                                                            const rate = Number(department.attendanceRate || 0);
                                                            return (
                                                                <TableRow key={department.department}>
                                                                    <TableCell><Typography sx={{ fontSize: 12, fontWeight: 900, color: theme.text }} noWrap>{department.department || "Unassigned"}</Typography></TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 12 }}>{formatNumber(department.staffCount)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 12, fontWeight: 900, color: getAttendanceColor(rate, theme) }}>{formatPercent(rate)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 12 }}>{formatPercent(department.punctualityRate)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 12 }}>{formatPercent(department.absenteeismRate)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 12 }}>{formatNumber(department.totalLateCount)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 12 }}>{formatNumber(department.earlyDepartures || 0)}</TableCell>
                                                                    <TableCell align="right" sx={{ fontSize: 14, fontWeight: 950, color: rate >= 85 ? theme.success : theme.danger }}>{rate >= 85 ? "↑" : "↓"}</TableCell>
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
                                    <Grid item xs={12} lg={5}>
                                        <SectionCard title="Attendance Quality" subtitle="This Period" theme={theme}>
                                            <Grid container spacing={1}>
                                                {attendanceQualityRows.map((row) => (
                                                    <Grid item xs={6} key={row.label}>
                                                        <InsightTile label={row.label} value={formatNumber(row.value)} subtitle={`${formatDelta(row.value ? -1 : 0, row.value ? "" : "")} vs previous`} tone={row.tone} positive={!row.value} theme={theme} />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </SectionCard>
                                    </Grid>
                                    <Grid item xs={12} lg={7}>
                                        <SectionCard title="Management Insights" theme={theme}>
                                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 1 }}>
                                                {hrManagementCards.map((card) => (
                                                    <InsightTile key={card.label} label={card.label} value={card.value} subtitle={card.subtitle} tone={card.tone} positive={card.positive} theme={theme} />
                                                ))}
                                            </Box>
                                        </SectionCard>
                                    </Grid>
                                </Grid>
                            </>
                        ) : (
                            <HrAttendanceAnalytics
                                isStationScopedHr={isStationScopedHr}
                                theme={theme}
                                kpis={kpis}
                                previousPeriodLabel={previousPeriodLabel}
                                periodRangeLabel={periodRangeLabel}
                                supervisorStation={supervisorStation}
                                scopeLabel={scopeLabel}
                                primaryMetricCards={hrPrimaryMetricCards}
                                secondaryMetricCards={hrSecondaryMetricCards}
                                chartData={chartData}
                                attendanceDistributionRows={attendanceDistributionRows}
                                configuredStationPerformanceRows={configuredStationPerformanceRows}
                                configuredDepartmentPerformanceRows={configuredDepartmentPerformanceRows}
                                todayStatusRows={todayStatusRows}
                                arrivalBucketRows={arrivalBucketRows}
                                workingHourRows={workingHourRows}
                                leaveDutyRows={leaveDutyRows}
                                topExceptionRows={topExceptionRows}
                                departmentHeatmapRows={departmentHeatmapRows}
                                stationHeatmapRows={stationHeatmapRows}
                                keyInsights={hrKeyInsights}
                                onMetricClick={openMetricDetails}
                            />
                        )}
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
                                { label: "Absenteeism bar", text: "A high amber bar flags departments where absence needs HOD or HR follow-up.", tone: theme.warning },
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
                                { label: "High bars need action", text: "Absence, missing records, late arrivals, and early departures should trigger HOD follow-up.", tone: theme.warning },
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
                                ["Staff Type", staffFilters.find((item) => item.value === filters.staffFilter)?.label || "All"],
                                ["Clocking Type", clockingTypeOptions.find((item) => item.value === filters.clockingType)?.label || "All Clocking Types"],
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

            {activeReportTab === "records" && (
                <AttendanceRecords
                    theme={theme}
                    scopeLabel={scopeLabel}
                    referenceMetrics={referenceMetrics}
                    referenceLoading={referenceLoading}
                    referenceError={referenceError}
                    referenceSearch={referenceSearch}
                    onReferenceSearchChange={(event) => {
                        setReferenceSearch(event.target.value);
                        setRecordPage(0);
                        setSummaryPage(0);
                    }}
                    onRefresh={loadReferenceData}
                    pdfExporting={pdfExporting}
                    onExport={handleExportRecordsPdf}
                    filteredRecords={filteredRecords}
                    paginatedRecords={paginatedRecords}
                    recordPage={recordPage}
                    setRecordPage={setRecordPage}
                    recordRowsPerPage={recordRowsPerPage}
                    setRecordRowsPerPage={setRecordRowsPerPage}
                />
            )}

            {activeReportTab === "summary" && (
                <AttendanceSummary
                    theme={theme}
                    referenceMetrics={referenceMetrics}
                    referenceLoading={referenceLoading}
                    referenceError={referenceError}
                    referenceSearch={referenceSearch}
                    onReferenceSearchChange={(event) => {
                        setReferenceSearch(event.target.value);
                        setRecordPage(0);
                        setSummaryPage(0);
                    }}
                    onRefresh={loadReferenceData}
                    pdfExporting={pdfExporting}
                    onExport={handleExportSummaryPdf}
                    filteredSummaryRows={filteredSummaryRows}
                    paginatedSummaryRows={paginatedSummaryRows}
                    summaryPage={summaryPage}
                    setSummaryPage={setSummaryPage}
                    summaryRowsPerPage={summaryRowsPerPage}
                    setSummaryRowsPerPage={setSummaryRowsPerPage}
                    workingDaysInReferenceRange={workingDaysInReferenceRange}
                />
            )}

            <MetricDetailDialog
                open={Boolean(metricDialog)}
                metric={metricDialog}
                theme={theme}
                onClose={() => setMetricDialog(null)}
            />
        </Box>
    );
};

export default OrganisationStats;
