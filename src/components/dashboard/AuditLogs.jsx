import {
    AccountCircle,
    AdminPanelSettingsRounded,
    AssessmentRounded,
    BoltRounded,
    Business,
    CategoryRounded,
    Description,
    DownloadRounded,
    FilterListRounded,
    PeopleRounded,
    Person,
    PictureAsPdfRounded,
    Place,
    RotateLeftRounded,
    SearchRounded,
    SecurityRounded,
    ShieldRounded,
    TimelineRounded,
    TodayRounded,
    VisibilityRounded,
} from "@mui/icons-material";

import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    InputAdornment,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from "recharts";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import React, { useEffect, useMemo, useState } from "react";

import { fetchAuditLogs } from "../../service/AuditorService.jsx";
import coreDataDetails from "../CoreDataDetails.jsx";
import { safeNewDate } from "../util/DateTimeFormater";

const { colorPalette } = coreDataDetails;

/* ─────────────────────────────────────────────────────────────────────────────
   DEBOUNCE
───────────────────────────────────────────────────────────────────────────── */

const useDebouncedValue = (value, delay = 350) => {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timeoutId = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timeoutId);
    }, [value, delay]);

    return debounced;
};

/* ─────────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────────────────────────── */

const G = {
    page: {
        minHeight: "100vh",
        background:
            "radial-gradient(circle at 5% 0%, rgba(0,91,150,.07), transparent 28%)," +
            "radial-gradient(circle at 95% 5%, rgba(0,229,255,.05), transparent 24%)," +
            "#f5f8fc",
    },

    surface: {
        bgcolor: "rgba(255,255,255,.96)",
        border: "1px solid rgba(15,23,42,.07)",
        boxShadow: "0 8px 30px rgba(15,23,42,.055)",
    },

    elevated: {
        bgcolor: "#ffffff",
        border: "1px solid #e8eef6",
        boxShadow: "0 12px 35px rgba(15,23,42,.065)",
    },

    navy: "#062C4D",
    blue: "#005B96",
    cyan: "#00A8CC",
    green: "#16A085",
    amber: "#F59E0B",
    red: "#DC2626",
    purple: "#7C3AED",

    text: "#102A43",
    muted: "#6B7C93",
    border: "#E8EEF6",
    light: "#F7F9FC",
};

/* ─────────────────────────────────────────────────────────────────────────────
   FILTER OPTIONS
───────────────────────────────────────────────────────────────────────────── */

const CATEGORY_TABS = [
    { value: "all", label: "All Logs" },
    { value: "authentication", label: "Sign In / Out" },
    { value: "attendance", label: "Exports" },
    { value: "leave", label: "Leave" },
    { value: "profile", label: "Profile" },
    { value: "device", label: "Lost Device" },
    { value: "password_reset", label: "Password Reset" },
    { value: "admin_action", label: "Admin / HR" },
    { value: "superadmin", label: "Superadmin" },
];

const RANK_OPTIONS = [
    { value: "all", label: "All Ranks" },
    ...coreDataDetails.RANK_OPTIONS.map((rank) => ({
        value: rank,
        label: rank.charAt(0).toUpperCase() + rank.slice(1),
    })),
];

/* ─────────────────────────────────────────────────────────────────────────────
   CHART COLORS
───────────────────────────────────────────────────────────────────────────── */

const CHART_COLORS = [
    "#005B96",
    "#00A8CC",
    "#16A085",
    "#F59E0B",
    "#7C3AED",
    "#DC2626",
    "#64748B",
    "#0891B2",
    "#84CC16",
];

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

const formatDateTime = (value) => {
    if (!value) return "Unknown time";

    const parsed = safeNewDate(value);

    if (!parsed) return "Invalid date";

    return parsed.toLocaleString("en-KE", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};

const compactKey = (value = "") =>
    value
        ?.split(".")
        .pop()
        ?.replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()) || value;

const getRankColor = (rank = "") => {
    switch (String(rank).toLowerCase()) {
        case "superadmin":
            return "#7C3AED";
        case "admin":
            return "#DC2626";
        case "hr":
            return "#F59E0B";
        case "auditor":
            return "#005B96";
        case "supervisor":
            return "#16A085";
        case "ceo":
            return "#0891B2";
        default:
            return "#64748B";
    }
};

const getCategoryColor = (category = "") => {
    switch (category) {
        case "authentication":
            return "#005B96";
        case "attendance":
            return "#00A8CC";
        case "leave":
            return "#16A085";
        case "profile":
            return "#64748B";
        case "device":
            return "#F59E0B";
        case "password_reset":
            return "#DC2626";
        case "admin_action":
            return "#7C3AED";
        case "superadmin":
            return "#991B1B";
        default:
            return "#64748B";
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   TABLE COLUMNS
───────────────────────────────────────────────────────────────────────────── */

const columns = [
    {
        field: "occurredAt",
        headerName: "Timestamp",
        width: 190,
        valueFormatter: (value) => formatDateTime(value),
    },
    {
        field: "category",
        headerName: "Category",
        width: 165,
        renderCell: (params) => {
            const color = getCategoryColor(params.value);

            return (
                <Chip
                    size="small"
                    label={compactKey(params.value)}
                    sx={{
                        fontWeight: 800,
                        fontSize: 10.5,
                        bgcolor: `${color}12`,
                        color,
                        border: `1px solid ${color}22`,
                    }}
                />
            );
        },
    },
    {
        field: "action",
        headerName: "Action",
        minWidth: 180,
        flex: 0.7,
        valueFormatter: (value) => compactKey(value),
    },
    {
        field: "actorName",
        headerName: "Actor",
        minWidth: 170,
        flex: 0.7,
        valueGetter: (_, row) => row.actor?.name || "Unknown",
    },
    {
        field: "actorEmail",
        headerName: "Actor Email",
        minWidth: 220,
        flex: 1,
        valueGetter: (_, row) => row.actor?.email || "No email",
    },
    {
        field: "actorRank",
        headerName: "Rank",
        width: 125,
        valueGetter: (_, row) => row.actor?.rank || "",
        renderCell: (params) => {
            const color = getRankColor(params.value);

            return params.value ? (
                <Chip
                    size="small"
                    label={String(params.value).toUpperCase()}
                    sx={{
                        height: 24,
                        fontSize: 10,
                        fontWeight: 900,
                        bgcolor: `${color}12`,
                        color,
                    }}
                />
            ) : (
                "—"
            );
        },
    },
    {
        field: "targetName",
        headerName: "Target",
        minWidth: 160,
        flex: 0.6,
        valueGetter: (_, row) => row.target?.name || "—",
    },
    {
        field: "description",
        headerName: "Description",
        minWidth: 300,
        flex: 1.4,
    },
];

/* ─────────────────────────────────────────────────────────────────────────────
   PDF EXPORT
───────────────────────────────────────────────────────────────────────────── */

const exportToPDF = (logs) => {
    try {
        const doc = new jsPDF("l", "mm", "a4");

        doc.setFontSize(18);
        doc.setTextColor(6, 44, 77);
        doc.text("KMFRI System Audit Trail Report", 14, 18);

        doc.setFontSize(9);
        doc.setTextColor(100);

        doc.text(
            `Generated: ${new Date().toLocaleString("en-KE")}`,
            14,
            27
        );

        doc.text(`Total Records: ${logs.length}`, 14, 32);

        const tableColumns = [
            "Timestamp",
            "Category",
            "Action",
            "Actor",
            "Actor Email",
            "Rank",
            "Target",
            "Description",
        ];

        const tableRows = logs.map((log) => [
            formatDateTime(log.occurredAt),
            compactKey(log.category),
            compactKey(log.action),
            log.actor?.name || "Unknown",
            log.actor?.email || "",
            String(log.actor?.rank || "").toUpperCase(),
            log.target?.name || "",
            String(log.description || "").substring(0, 90),
        ]);

        autoTable(doc, {
            head: [tableColumns],
            body: tableRows,
            startY: 40,

            styles: {
                fontSize: 7,
                cellPadding: 2,
                overflow: "linebreak",
            },

            headStyles: {
                fillColor: [6, 44, 77],
                textColor: 255,
                fontStyle: "bold",
            },

            alternateRowStyles: {
                fillColor: [247, 249, 252],
            },

            margin: {
                top: 40,
                left: 10,
                right: 10,
            },

            theme: "grid",

            didDrawPage: (data) => {
                doc.setFontSize(8);
                doc.text(
                    `Page ${data.pageNumber}`,
                    data.settings.margin.left,
                    doc.internal.pageSize.height - 7
                );
            },
        });

        doc.save(
            `KMFRI_Audit_Trail_${new Date().toISOString().slice(0, 10)}.pdf`
        );
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Unable to generate audit report.");
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   KPI CARD
───────────────────────────────────────────────────────────────────────────── */

function MetricCard({
    label,
    value,
    helper,
    icon,
    accent = G.blue,
    badge,
}) {
    return (
        <Card
            sx={{
                ...G.elevated,
                borderRadius: "18px",
                height: "100%",
                overflow: "hidden",
                position: "relative",
                transition: "all .22s ease",

                "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 16px 40px rgba(15,23,42,.09)",
                },

                "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    bgcolor: accent,
                },
            }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Stack
                    direction="row"
                    alignItems="flex-start"
                    justifyContent="space-between"
                    spacing={2}
                >
                    <Box>
                        <Typography
                            variant="caption"
                            sx={{
                                color: G.muted,
                                fontWeight: 800,
                                letterSpacing: ".08em",
                                textTransform: "uppercase",
                            }}
                        >
                            {label}
                        </Typography>

                        <Typography
                            sx={{
                                mt: 0.7,
                                fontSize: {
                                    xs: 28,
                                    lg: 32,
                                },
                                lineHeight: 1,
                                fontWeight: 900,
                                color: G.text,
                            }}
                        >
                            {value}
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: "13px",
                            display: "grid",
                            placeItems: "center",
                            bgcolor: `${accent}12`,
                            color: accent,
                            flexShrink: 0,
                        }}
                    >
                        {icon}
                    </Box>
                </Stack>

                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                    sx={{ mt: 2 }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            color: G.muted,
                            lineHeight: 1.4,
                        }}
                    >
                        {helper}
                    </Typography>

                    {badge && (
                        <Chip
                            size="small"
                            label={badge}
                            sx={{
                                bgcolor: `${accent}10`,
                                color: accent,
                                fontWeight: 900,
                            }}
                        />
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CHART HEADER
───────────────────────────────────────────────────────────────────────────── */

function ChartHeader({ title, subtitle, icon }) {
    return (
        <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2.5 }}
        >
            <Box>
                <Typography
                    fontWeight={900}
                    color={G.text}
                    sx={{ fontSize: 16 }}
                >
                    {title}
                </Typography>

                <Typography
                    variant="caption"
                    sx={{
                        color: G.muted,
                        display: "block",
                        mt: 0.3,
                    }}
                >
                    {subtitle}
                </Typography>
            </Box>

            {icon && (
                <Box
                    sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 2.5,
                        bgcolor: "rgba(0,91,150,.07)",
                        color: G.blue,
                        display: "grid",
                        placeItems: "center",
                    }}
                >
                    {icon}
                </Box>
            )}
        </Stack>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export default function AuditLogsContent() {
    const [category, setCategory] = useState("all");
    const [action, setAction] = useState("all");
    const [actorRank, setActorRank] = useState("all");

    const [search, setSearch] = useState("");

    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [data, setData] = useState({
        logs: [],
        metrics: {},
        actionCounts: {},
    });

    const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

    const debouncedSearch = useDebouncedValue(search);

    /* ─────────────────────────────────────────────────────────────────────────
       LOAD LOGS
    ───────────────────────────────────────────────────────────────────────── */

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
                    search: debouncedSearch.trim(),
                    dateFrom,
                    dateTo,
                    limit: 300,
                });

                if (active) {
                    setData({
                        logs: response?.logs || [],
                        metrics: response?.metrics || {},
                        actionCounts: response?.actionCounts || {},
                    });
                }
            } catch (err) {
                console.error(err);

                if (active) {
                    setError(
                        typeof err === "string"
                            ? err
                            : "Failed to load audit logs."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadLogs();

        return () => {
            active = false;
        };
    }, [
        category,
        action,
        actorRank,
        debouncedSearch,
        dateFrom,
        dateTo,
    ]);

    /* ─────────────────────────────────────────────────────────────────────────
       ACTION OPTIONS
    ───────────────────────────────────────────────────────────────────────── */

    const actionOptions = useMemo(() => {
        const entries = Object.keys(data.actionCounts || {});

        return [
            {
                value: "all",
                label: "All Activities",
            },

            ...entries.map((item) => ({
                value: item,
                label: compactKey(item),
            })),
        ];
    }, [data.actionCounts]);

    /* ─────────────────────────────────────────────────────────────────────────
       ANALYTICS
    ───────────────────────────────────────────────────────────────────────── */

    const analytics = useMemo(() => {
        const logs = data.logs || [];

        const categoryMap = {};
        const rankMap = {};
        const actionMap = {};
        const dailyMap = {};

        logs.forEach((log) => {
            /* CATEGORY */

            const categoryKey = compactKey(
                log.category || "unknown"
            );

            categoryMap[categoryKey] =
                (categoryMap[categoryKey] || 0) + 1;

            /* RANK */

            const rankKey = String(
                log.actor?.rank || "unknown"
            ).toUpperCase();

            rankMap[rankKey] =
                (rankMap[rankKey] || 0) + 1;

            /* ACTION */

            const actionKey = compactKey(
                log.action || "unknown"
            );

            actionMap[actionKey] =
                (actionMap[actionKey] || 0) + 1;

            /* DAILY ACTIVITY */

            const parsedDate = safeNewDate(log.occurredAt);

            if (parsedDate) {
                const dayKey =
                    parsedDate.getFullYear() +
                    "-" +
                    String(parsedDate.getMonth() + 1).padStart(2, "0") +
                    "-" +
                    String(parsedDate.getDate()).padStart(2, "0");

                if (!dailyMap[dayKey]) {
                    dailyMap[dayKey] = {
                        rawDate: dayKey,
                        count: 0,
                        privileged: 0,
                    };
                }

                dailyMap[dayKey].count += 1;

                const rank = String(
                    log.actor?.rank || ""
                ).toLowerCase();

                if (
                    ["admin", "hr", "superadmin"].includes(rank)
                ) {
                    dailyMap[dayKey].privileged += 1;
                }
            }
        });

        const categoryData = Object.entries(categoryMap)
            .map(([name, value]) => ({
                name,
                value,
            }))
            .sort((a, b) => b.value - a.value);

        const rankData = Object.entries(rankMap)
            .map(([name, value]) => ({
                name,
                value,
            }))
            .sort((a, b) => b.value - a.value);

        const actionData = Object.entries(actionMap)
            .map(([name, value]) => ({
                name,
                value,
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 7);

        const trendData = Object.values(dailyMap)
            .sort((a, b) =>
                a.rawDate.localeCompare(b.rawDate)
            )
            .map((item) => ({
                ...item,

                date: new Date(
                    `${item.rawDate}T00:00:00`
                ).toLocaleDateString("en-KE", {
                    month: "short",
                    day: "numeric",
                }),
            }));

        const privilegedPercentage = logs.length
            ? Math.round(
                  ((data.metrics?.privilegedActions || 0) /
                      logs.length) *
                      100
              )
            : 0;

        return {
            categoryData,
            rankData,
            actionData,
            trendData,
            privilegedPercentage,
        };
    }, [data.logs, data.metrics]);

    /* ─────────────────────────────────────────────────────────────────────────
       FILTER RESET
    ───────────────────────────────────────────────────────────────────────── */

    const resetFilters = () => {
        setCategory("all");
        setAction("all");
        setActorRank("all");
        setSearch("");
        setDateFrom("");
        setDateTo("");
    };

    /* ─────────────────────────────────────────────────────────────────────────
       EXPORT
    ───────────────────────────────────────────────────────────────────────── */

    const handleExportMenuOpen = (event) => {
        setExportMenuAnchor(event.currentTarget);
    };

    const handleExportMenuClose = () => {
        setExportMenuAnchor(null);
    };

    const handleExportPDF = () => {
        exportToPDF(data.logs || []);
        handleExportMenuClose();
    };

    /* ─────────────────────────────────────────────────────────────────────────
       ACTIVE FILTER COUNT
    ───────────────────────────────────────────────────────────────────────── */

    const activeFilterCount = [
        category !== "all",
        action !== "all",
        actorRank !== "all",
        Boolean(search),
        Boolean(dateFrom),
        Boolean(dateTo),
    ].filter(Boolean).length;

    /* ─────────────────────────────────────────────────────────────────────────
       RENDER
    ───────────────────────────────────────────────────────────────────────── */

    return (
        <Box
            sx={{
                ...G.page,
                py: { xs: 1, md: 2 },
            }}
        >
            <Box
                sx={{
                    maxWidth: 1600,
                    mx: "auto",
                    px: { xs: 1, sm: 2, lg: 3 },
                }}
            >
                {/* ============================================================
                    PAGE HEADER
                ============================================================ */}

                <Card
                    sx={{
                        ...G.surface,
                        borderRadius: "22px",
                        mb: 2.5,
                        overflow: "hidden",
                    }}
                >
                    <Box
                        sx={{
                            height: 4,
                            background:
                                "linear-gradient(90deg,#062C4D,#005B96,#00A8CC,#16A085)",
                        }}
                    />

                    <CardContent
                        sx={{
                            p: {
                                xs: 2,
                                md: 3,
                            },
                        }}
                    >
                        <Stack
                            direction={{
                                xs: "column",
                                md: "row",
                            }}
                            justifyContent="space-between"
                            alignItems={{
                                xs: "flex-start",
                                md: "center",
                            }}
                            spacing={2}
                        >
                            <Stack
                                direction="row"
                                spacing={2}
                                alignItems="center"
                            >
                                <Box
                                    sx={{
                                        width: 52,
                                        height: 52,
                                        borderRadius: "15px",
                                        display: "grid",
                                        placeItems: "center",
                                        bgcolor:
                                            "rgba(0,91,150,.08)",
                                        color: G.blue,
                                        flexShrink: 0,
                                    }}
                                >
                                    <ShieldRounded />
                                </Box>

                                <Box>
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                        flexWrap="wrap"
                                    >
                                        <Typography
                                            sx={{
                                                fontSize: {
                                                    xs: 20,
                                                    md: 25,
                                                },
                                                fontWeight: 900,
                                                color: G.navy,
                                            }}
                                        >
                                            Audit Intelligence
                                        </Typography>

                                        <Chip
                                            size="small"
                                            label="SYSTEM AUDIT"
                                            sx={{
                                                fontSize: 9,
                                                height: 21,
                                                fontWeight: 900,
                                                bgcolor:
                                                    "rgba(22,160,133,.1)",
                                                color: G.green,
                                            }}
                                        />
                                    </Stack>

                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: G.muted,
                                            mt: 0.5,
                                            maxWidth: 760,
                                        }}
                                    >
                                        Monitor system activity,
                                        accountability events,
                                        administrative operations and
                                        security-sensitive actions.
                                    </Typography>
                                </Box>
                            </Stack>

                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                flexWrap="wrap"
                            >
                                <Chip
                                    icon={<VisibilityRounded />}
                                    label={`${
                                        data.logs?.length || 0
                                    } visible events`}
                                    sx={{
                                        fontWeight: 800,
                                        bgcolor:
                                            "rgba(0,91,150,.07)",
                                        color: G.blue,
                                    }}
                                />

                                <Chip
                                    icon={<SecurityRounded />}
                                    label="Audit monitoring active"
                                    sx={{
                                        fontWeight: 800,
                                        bgcolor:
                                            "rgba(22,160,133,.08)",
                                        color: G.green,
                                    }}
                                />
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>

                {/* ============================================================
                    FILTER PANEL
                ============================================================ */}

                <Card
                    sx={{
                        ...G.surface,
                        borderRadius: "20px",
                        mb: 2.5,
                    }}
                >
                    <CardContent
                        sx={{
                            p: {
                                xs: 2,
                                md: 2.5,
                            },
                        }}
                    >
                        {/* CATEGORY TABS */}

                        <Tabs
                            value={category}
                            onChange={(_, value) => {
                                setCategory(value);
                                setAction("all");
                            }}
                            variant="scrollable"
                            allowScrollButtonsMobile
                            sx={{
                                minHeight: 40,

                                "& .MuiTabs-indicator": {
                                    display: "none",
                                },

                                "& .MuiTab-root": {
                                    minHeight: 38,
                                    minWidth: "auto",
                                    px: 1.6,
                                    mr: 0.7,
                                    borderRadius: "10px",
                                    textTransform: "none",
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: G.muted,

                                    "&.Mui-selected": {
                                        bgcolor:
                                            "rgba(0,91,150,.08)",
                                        color: G.blue,
                                    },
                                },
                            }}
                        >
                            {CATEGORY_TABS.map((tab) => (
                                <Tab
                                    key={tab.value}
                                    value={tab.value}
                                    label={tab.label}
                                />
                            ))}
                        </Tabs>

                        <Divider sx={{ my: 2.3 }} />

                        {/* FILTER HEADER */}

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ mb: 1.8 }}
                        >
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                            >
                                <FilterListRounded
                                    sx={{
                                        color: G.blue,
                                        fontSize: 20,
                                    }}
                                />

                                <Typography
                                    fontWeight={900}
                                    color={G.text}
                                >
                                    Filters
                                </Typography>

                                {activeFilterCount > 0 && (
                                    <Chip
                                        size="small"
                                        label={`${activeFilterCount} active`}
                                        sx={{
                                            height: 22,
                                            fontSize: 10,
                                            fontWeight: 900,
                                            bgcolor:
                                                "rgba(0,91,150,.08)",
                                            color: G.blue,
                                        }}
                                    />
                                )}
                            </Stack>

                            <Tooltip title="Reset all audit filters">
                                <Button
                                    size="small"
                                    startIcon={
                                        <RotateLeftRounded />
                                    }
                                    onClick={resetFilters}
                                    sx={{
                                        textTransform: "none",
                                        fontWeight: 800,
                                        color: G.blue,
                                    }}
                                >
                                    Reset
                                </Button>
                            </Tooltip>
                        </Stack>

                        {/* FILTER CONTROLS */}

                        <Grid container spacing={1.5}>
                            <Grid
                                item
                                xs={12}
                                md={4}
                            >
                                <TextField
                                    fullWidth
                                    size="small"
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                    placeholder="Search actor, target or activity..."
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchRounded
                                                    fontSize="small"
                                                    sx={{
                                                        color: G.muted,
                                                    }}
                                                />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid
                                item
                                xs={12}
                                sm={6}
                                md={2.5}
                            >
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Activity"
                                    value={action}
                                    onChange={(e) =>
                                        setAction(e.target.value)
                                    }
                                >
                                    {actionOptions.map((item) => (
                                        <MenuItem
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid
                                item
                                xs={12}
                                sm={6}
                                md={1.8}
                            >
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Actor Rank"
                                    value={actorRank}
                                    onChange={(e) =>
                                        setActorRank(
                                            e.target.value
                                        )
                                    }
                                >
                                    {RANK_OPTIONS.map((item) => (
                                        <MenuItem
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid
                                item
                                xs={12}
                                sm={6}
                                md={1.85}
                            >
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="From"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) =>
                                        setDateFrom(
                                            e.target.value
                                        )
                                    }
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>

                            <Grid
                                item
                                xs={12}
                                sm={6}
                                md={1.85}
                            >
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="To"
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) =>
                                        setDateTo(e.target.value)
                                    }
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* ============================================================
                    ERRORS
                ============================================================ */}

                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 2.5,
                            borderRadius: 3,
                        }}
                    >
                        {error}
                    </Alert>
                )}

                {/* ============================================================
                    KPI CARDS
                ============================================================ */}

                <Grid
                    container
                    spacing={2}
                    sx={{ mb: 2.5 }}
                >
                    <Grid
                        item
                        xs={12}
                        sm={6}
                        lg={3}
                    >
                        <MetricCard
                            label="Audit Events"
                            value={data.metrics?.total || 0}
                            helper="Events matching current filters"
                            icon={<AssessmentRounded />}
                            accent={G.blue}
                        />
                    </Grid>

                    <Grid
                        item
                        xs={12}
                        sm={6}
                        lg={3}
                    >
                        <MetricCard
                            label="Unique Actors"
                            value={
                                data.metrics?.uniqueActors || 0
                            }
                            helper="Distinct users generating events"
                            icon={<PeopleRounded />}
                            accent={G.green}
                        />
                    </Grid>

                    <Grid
                        item
                        xs={12}
                        sm={6}
                        lg={3}
                    >
                        <MetricCard
                            label="Privileged"
                            value={
                                data.metrics
                                    ?.privilegedActions || 0
                            }
                            helper="Admin, HR and superadmin activity"
                            icon={
                                <AdminPanelSettingsRounded />
                            }
                            accent={G.amber}
                            badge={`${analytics.privilegedPercentage}%`}
                        />
                    </Grid>

                    <Grid
                        item
                        xs={12}
                        sm={6}
                        lg={3}
                    >
                        <MetricCard
                            label="Today"
                            value={data.metrics?.today || 0}
                            helper="Audit events recorded today"
                            icon={<BoltRounded />}
                            accent={G.purple}
                        />
                    </Grid>
                </Grid>

                {/* ============================================================
                    PRIMARY ANALYTICS
                ============================================================ */}

                <Grid
                    container
                    spacing={2.5}
                    sx={{ mb: 2.5 }}
                >
                    {/* ACTIVITY TREND */}

                    <Grid
                        item
                        xs={12}
                        lg={8}
                    >
                        <Card
                            sx={{
                                ...G.elevated,
                                borderRadius: "20px",
                                height: "100%",
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <ChartHeader
                                    title="Audit Activity Trend"
                                    subtitle="System event volume and privileged operations over time"
                                    icon={<TimelineRounded />}
                                />

                                {analytics.trendData.length ? (
                                    <Box
                                        sx={{
                                            width: "100%",
                                            height: 310,
                                        }}
                                    >
                                        <ResponsiveContainer>
                                            <AreaChart
                                                data={
                                                    analytics.trendData
                                                }
                                                margin={{
                                                    top: 5,
                                                    right: 15,
                                                    left: -15,
                                                    bottom: 0,
                                                }}
                                            >
                                                <defs>
                                                    <linearGradient
                                                        id="auditGradient"
                                                        x1="0"
                                                        y1="0"
                                                        x2="0"
                                                        y2="1"
                                                    >
                                                        <stop
                                                            offset="5%"
                                                            stopColor={
                                                                G.blue
                                                            }
                                                            stopOpacity={
                                                                0.25
                                                            }
                                                        />

                                                        <stop
                                                            offset="95%"
                                                            stopColor={
                                                                G.blue
                                                            }
                                                            stopOpacity={
                                                                0
                                                            }
                                                        />
                                                    </linearGradient>
                                                </defs>

                                                <CartesianGrid
                                                    strokeDasharray="4 4"
                                                    vertical={false}
                                                    stroke="#edf2f7"
                                                />

                                                <XAxis
                                                    dataKey="date"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{
                                                        fontSize: 11,
                                                        fill: G.muted,
                                                    }}
                                                />

                                                <YAxis
                                                    allowDecimals={
                                                        false
                                                    }
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{
                                                        fontSize: 11,
                                                        fill: G.muted,
                                                    }}
                                                />

                                                <RechartsTooltip
                                                    contentStyle={{
                                                        borderRadius:
                                                            12,
                                                        border:
                                                            "1px solid #e8eef6",
                                                        boxShadow:
                                                            "0 10px 30px rgba(15,23,42,.08)",
                                                        fontSize: 12,
                                                    }}
                                                />

                                                <Area
                                                    type="monotone"
                                                    dataKey="count"
                                                    name="Audit Events"
                                                    stroke={G.blue}
                                                    strokeWidth={2.5}
                                                    fill="url(#auditGradient)"
                                                />

                                                <Area
                                                    type="monotone"
                                                    dataKey="privileged"
                                                    name="Privileged Actions"
                                                    stroke={
                                                        G.amber
                                                    }
                                                    strokeWidth={2}
                                                    fill="transparent"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </Box>
                                ) : (
                                    <EmptyChart />
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* CATEGORY DISTRIBUTION */}

                    <Grid
                        item
                        xs={12}
                        lg={4}
                    >
                        <Card
                            sx={{
                                ...G.elevated,
                                borderRadius: "20px",
                                height: "100%",
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <ChartHeader
                                    title="Activity Distribution"
                                    subtitle="Audit events grouped by system category"
                                    icon={<CategoryRounded />}
                                />

                                {analytics.categoryData.length ? (
                                    <>
                                        <Box
                                            sx={{
                                                height: 205,
                                            }}
                                        >
                                            <ResponsiveContainer>
                                                <PieChart>
                                                    <Pie
                                                        data={
                                                            analytics.categoryData
                                                        }
                                                        dataKey="value"
                                                        nameKey="name"
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={
                                                            55
                                                        }
                                                        outerRadius={
                                                            80
                                                        }
                                                        paddingAngle={
                                                            3
                                                        }
                                                    >
                                                        {analytics.categoryData.map(
                                                            (
                                                                _,
                                                                index
                                                            ) => (
                                                                <Cell
                                                                    key={
                                                                        index
                                                                    }
                                                                    fill={
                                                                        CHART_COLORS[
                                                                            index %
                                                                                CHART_COLORS.length
                                                                        ]
                                                                    }
                                                                />
                                                            )
                                                        )}
                                                    </Pie>

                                                    <RechartsTooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </Box>

                                        <Stack spacing={1}>
                                            {analytics.categoryData
                                                .slice(0, 5)
                                                .map(
                                                    (
                                                        item,
                                                        index
                                                    ) => (
                                                        <Stack
                                                            key={
                                                                item.name
                                                            }
                                                            direction="row"
                                                            justifyContent="space-between"
                                                            alignItems="center"
                                                        >
                                                            <Stack
                                                                direction="row"
                                                                spacing={
                                                                    1
                                                                }
                                                                alignItems="center"
                                                            >
                                                                <Box
                                                                    sx={{
                                                                        width: 8,
                                                                        height: 8,
                                                                        borderRadius:
                                                                            "50%",
                                                                        bgcolor:
                                                                            CHART_COLORS[
                                                                                index %
                                                                                    CHART_COLORS.length
                                                                            ],
                                                                    }}
                                                                />

                                                                <Typography
                                                                    variant="caption"
                                                                    color={
                                                                        G.muted
                                                                    }
                                                                >
                                                                    {
                                                                        item.name
                                                                    }
                                                                </Typography>
                                                            </Stack>

                                                            <Typography
                                                                variant="caption"
                                                                fontWeight={
                                                                    900
                                                                }
                                                                color={
                                                                    G.text
                                                                }
                                                            >
                                                                {
                                                                    item.value
                                                                }
                                                            </Typography>
                                                        </Stack>
                                                    )
                                                )}
                                        </Stack>
                                    </>
                                ) : (
                                    <EmptyChart />
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* ============================================================
                    SECONDARY ANALYTICS
                ============================================================ */}

                <Grid
                    container
                    spacing={2.5}
                    sx={{ mb: 2.5 }}
                >
                    {/* FREQUENT ACTIVITIES */}

                    <Grid
                        item
                        xs={12}
                        lg={7}
                    >
                        <Card
                            sx={{
                                ...G.elevated,
                                borderRadius: "20px",
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <ChartHeader
                                    title="Most Frequent Activities"
                                    subtitle="Highest-volume operations in the selected audit period"
                                    icon={<AssessmentRounded />}
                                />

                                {analytics.actionData.length ? (
                                    <Box sx={{ height: 290 }}>
                                        <ResponsiveContainer>
                                            <BarChart
                                                data={
                                                    analytics.actionData
                                                }
                                                layout="vertical"
                                                margin={{
                                                    left: 20,
                                                    right: 20,
                                                }}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="4 4"
                                                    horizontal={
                                                        false
                                                    }
                                                    stroke="#edf2f7"
                                                />

                                                <XAxis
                                                    type="number"
                                                    allowDecimals={
                                                        false
                                                    }
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{
                                                        fontSize: 11,
                                                        fill: G.muted,
                                                    }}
                                                />

                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    width={145}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{
                                                        fontSize: 10,
                                                        fill: G.muted,
                                                    }}
                                                />

                                                <RechartsTooltip />

                                                <Bar
                                                    dataKey="value"
                                                    name="Events"
                                                    fill={G.blue}
                                                    radius={[
                                                        0,
                                                        7,
                                                        7,
                                                        0,
                                                    ]}
                                                    barSize={18}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                ) : (
                                    <EmptyChart />
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* ACTIVITY BY RANK */}

                    <Grid
                        item
                        xs={12}
                        lg={5}
                    >
                        <Card
                            sx={{
                                ...G.elevated,
                                borderRadius: "20px",
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <ChartHeader
                                    title="Activity by Access Rank"
                                    subtitle="Event distribution across account privilege levels"
                                    icon={
                                        <AdminPanelSettingsRounded />
                                    }
                                />

                                {analytics.rankData.length ? (
                                    <Box sx={{ height: 290 }}>
                                        <ResponsiveContainer>
                                            <BarChart
                                                data={
                                                    analytics.rankData
                                                }
                                                margin={{
                                                    top: 5,
                                                    right: 5,
                                                    left: -15,
                                                }}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="4 4"
                                                    vertical={false}
                                                    stroke="#edf2f7"
                                                />

                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{
                                                        fontSize: 9,
                                                        fill: G.muted,
                                                    }}
                                                />

                                                <YAxis
                                                    allowDecimals={
                                                        false
                                                    }
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{
                                                        fontSize: 10,
                                                        fill: G.muted,
                                                    }}
                                                />

                                                <RechartsTooltip />

                                                <Bar
                                                    dataKey="value"
                                                    name="Events"
                                                    fill={G.green}
                                                    radius={[
                                                        6,
                                                        6,
                                                        0,
                                                        0,
                                                    ]}
                                                    maxBarSize={38}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                ) : (
                                    <EmptyChart />
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* ============================================================
                    AUDIT STREAM
                ============================================================ */}

                <Card
                    sx={{
                        ...G.elevated,
                        borderRadius: "20px",
                        overflow: "hidden",
                    }}
                >
                    <CardContent
                        sx={{
                            p: {
                                xs: 2,
                                md: 3,
                            },
                        }}
                    >
                        <Stack
                            direction={{
                                xs: "column",
                                sm: "row",
                            }}
                            justifyContent="space-between"
                            alignItems={{
                                xs: "flex-start",
                                sm: "center",
                            }}
                            spacing={2}
                            sx={{ mb: 2 }}
                        >
                            <Box>
                                <Typography
                                    sx={{
                                        fontSize: 17,
                                        fontWeight: 900,
                                        color: G.text,
                                    }}
                                >
                                    Audit Event Stream
                                </Typography>

                                <Typography
                                    variant="caption"
                                    color={G.muted}
                                >
                                    Select an event to inspect its
                                    complete accountability record.
                                </Typography>
                            </Box>

                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                            >
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: G.muted,
                                        fontWeight: 700,
                                    }}
                                >
                                    {data.logs?.length || 0} entries
                                </Typography>

                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={
                                        <DownloadRounded />
                                    }
                                    onClick={
                                        handleExportMenuOpen
                                    }
                                    disabled={
                                        !data.logs?.length
                                    }
                                    sx={{
                                        textTransform: "none",
                                        fontWeight: 800,
                                        borderRadius: 2.5,
                                        borderColor: G.border,
                                        color: G.blue,
                                    }}
                                >
                                    Export
                                </Button>

                                <Menu
                                    anchorEl={exportMenuAnchor}
                                    open={Boolean(
                                        exportMenuAnchor
                                    )}
                                    onClose={
                                        handleExportMenuClose
                                    }
                                    anchorOrigin={{
                                        vertical: "bottom",
                                        horizontal: "right",
                                    }}
                                    transformOrigin={{
                                        vertical: "top",
                                        horizontal: "right",
                                    }}
                                    PaperProps={{
                                        sx: {
                                            mt: 1,
                                            borderRadius: 2.5,
                                            boxShadow:
                                                "0 12px 35px rgba(15,23,42,.12)",
                                        },
                                    }}
                                >
                                    <MenuItem
                                        onClick={
                                            handleExportPDF
                                        }
                                    >
                                        <PictureAsPdfRounded
                                            sx={{
                                                mr: 1.2,
                                                color: G.red,
                                            }}
                                        />

                                        Export PDF Report
                                    </MenuItem>
                                </Menu>
                            </Stack>
                        </Stack>

                        <Divider sx={{ mb: 2 }} />

                        {loading ? (
                            <Stack
                                alignItems="center"
                                justifyContent="center"
                                spacing={2}
                                sx={{ py: 10 }}
                            >
                                <CircularProgress
                                    size={35}
                                    sx={{
                                        color: G.blue,
                                    }}
                                />

                                <Typography
                                    variant="body2"
                                    color={G.muted}
                                >
                                    Loading audit intelligence...
                                </Typography>
                            </Stack>
                        ) : data.logs?.length ? (
                            <Box
                                sx={{
                                    height: 620,
                                    width: "100%",
                                }}
                            >
                                <DataGrid
                                    rows={data.logs}
                                    columns={columns}
                                    getRowId={(row) =>
                                        row._id
                                    }
                                    initialState={{
                                        pagination: {
                                            paginationModel: {
                                                pageSize: 10,
                                                page: 0,
                                            },
                                        },
                                    }}
                                    pageSizeOptions={[
                                        10,
                                        25,
                                        50,
                                    ]}
                                    disableRowSelectionOnClick
                                    onRowClick={(params) => {
                                        setSelectedLog(
                                            params.row
                                        );

                                        setDialogOpen(true);
                                    }}
                                    sx={{
                                        border: 0,
                                        color: G.text,

                                        "& .MuiDataGrid-columnHeaders":
                                            {
                                                bgcolor:
                                                    "#f7f9fc",
                                                borderBottom:
                                                    "1px solid #e8eef6",
                                            },

                                        "& .MuiDataGrid-columnHeaderTitle":
                                            {
                                                fontWeight: 900,
                                                fontSize: 11,
                                                color: "#52667A",
                                                textTransform:
                                                    "uppercase",
                                                letterSpacing:
                                                    ".035em",
                                            },

                                        "& .MuiDataGrid-cell":
                                            {
                                                borderBottom:
                                                    "1px solid #f0f3f7",
                                                fontSize: 12.5,
                                            },

                                        "& .MuiDataGrid-row":
                                            {
                                                cursor: "pointer",
                                            },

                                        "& .MuiDataGrid-row:hover":
                                            {
                                                bgcolor:
                                                    "rgba(0,91,150,.035)",
                                            },

                                        "& .MuiDataGrid-footerContainer":
                                            {
                                                borderTop:
                                                    "1px solid #e8eef6",
                                            },

                                        "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus":
                                            {
                                                outline: "none",
                                            },
                                    }}
                                />
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    py: 10,
                                    textAlign: "center",
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 60,
                                        height: 60,
                                        borderRadius: "18px",
                                        display: "grid",
                                        placeItems: "center",
                                        bgcolor:
                                            "rgba(0,91,150,.06)",
                                        color: G.blue,
                                        mx: "auto",
                                        mb: 2,
                                    }}
                                >
                                    <SearchRounded />
                                </Box>

                                <Typography
                                    variant="h6"
                                    fontWeight={900}
                                    color={G.text}
                                >
                                    No audit events found
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color={G.muted}
                                    sx={{
                                        mt: 0.7,
                                        maxWidth: 420,
                                        mx: "auto",
                                    }}
                                >
                                    Try changing the activity,
                                    account rank, search term or
                                    selected date range.
                                </Typography>

                                {activeFilterCount > 0 && (
                                    <Button
                                        onClick={resetFilters}
                                        sx={{
                                            mt: 2,
                                            textTransform:
                                                "none",
                                            fontWeight: 800,
                                        }}
                                    >
                                        Clear filters
                                    </Button>
                                )}
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* ============================================================
                    AUDIT INVESTIGATION DIALOG
                ============================================================ */}

                <Dialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: "22px",
                            overflow: "hidden",
                            boxShadow:
                                "0 30px 70px rgba(15,23,42,.2)",
                        },
                    }}
                >
                    <DialogTitle
                        sx={{
                            p: 0,
                        }}
                    >
                        <Box
                            sx={{
                                px: {
                                    xs: 2.5,
                                    md: 3.5,
                                },
                                py: 2.5,
                                background:
                                    "linear-gradient(135deg,#062C4D,#005B96)",
                                color: "#fff",
                            }}
                        >
                            <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                spacing={2}
                            >
                                <Stack
                                    direction="row"
                                    spacing={1.5}
                                    alignItems="center"
                                >
                                    <Box
                                        sx={{
                                            width: 42,
                                            height: 42,
                                            borderRadius: 2.5,
                                            display: "grid",
                                            placeItems:
                                                "center",
                                            bgcolor:
                                                "rgba(255,255,255,.12)",
                                        }}
                                    >
                                        <ShieldRounded />
                                    </Box>

                                    <Box>
                                        <Typography
                                            fontWeight={900}
                                            sx={{
                                                fontSize: 18,
                                            }}
                                        >
                                            {selectedLog?.action
                                                ? compactKey(
                                                      selectedLog.action
                                                  )
                                                : "Audit Event"}
                                        </Typography>

                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color:
                                                    "rgba(255,255,255,.72)",
                                            }}
                                        >
                                            Accountability event
                                            investigation
                                        </Typography>
                                    </Box>
                                </Stack>

                                {selectedLog?.category && (
                                    <Chip
                                        size="small"
                                        label={compactKey(
                                            selectedLog.category
                                        )}
                                        sx={{
                                            bgcolor:
                                                "rgba(255,255,255,.14)",
                                            color: "#fff",
                                            fontWeight: 800,
                                        }}
                                    />
                                )}
                            </Stack>
                        </Box>
                    </DialogTitle>

                    <DialogContent
                        sx={{
                            p: {
                                xs: 2.5,
                                md: 3.5,
                            },
                            bgcolor: "#f8fafc",
                        }}
                    >
                        <Stack spacing={2.5}>
                            {/* EVENT META */}

                            <Grid
                                container
                                spacing={1.5}
                            >
                                <Grid
                                    item
                                    xs={12}
                                    sm={6}
                                >
                                    <InfoBlock
                                        label="Event Time"
                                        value={formatDateTime(
                                            selectedLog?.occurredAt
                                        )}
                                        icon={
                                            <TodayRounded />
                                        }
                                    />
                                </Grid>

                                <Grid
                                    item
                                    xs={12}
                                    sm={6}
                                >
                                    <InfoBlock
                                        label="Actor Rank"
                                        value={
                                            selectedLog?.actor
                                                ?.rank
                                                ? String(
                                                      selectedLog
                                                          .actor
                                                          .rank
                                                  ).toUpperCase()
                                                : "Unknown"
                                        }
                                        icon={
                                            <SecurityRounded />
                                        }
                                    />
                                </Grid>
                            </Grid>

                            {/* ACTOR */}

                            <Card
                                sx={{
                                    borderRadius: "16px",
                                    border:
                                        "1px solid #e8eef6",
                                    boxShadow: "none",
                                }}
                            >
                                <CardContent
                                    sx={{
                                        p: 2.5,
                                        "&:last-child": {
                                            pb: 2.5,
                                        },
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: G.muted,
                                            fontWeight: 900,
                                            letterSpacing:
                                                ".07em",
                                        }}
                                    >
                                        ACTOR
                                    </Typography>

                                    <Stack
                                        direction="row"
                                        spacing={1.5}
                                        alignItems="center"
                                        sx={{ mt: 1.5 }}
                                    >
                                        <Avatar
                                            sx={{
                                                bgcolor:
                                                    "rgba(0,91,150,.1)",
                                                color: G.blue,
                                                fontWeight: 900,
                                            }}
                                        >
                                            {(
                                                selectedLog?.actor
                                                    ?.name || "?"
                                            )
                                                .charAt(0)
                                                .toUpperCase()}
                                        </Avatar>

                                        <Box>
                                            <Typography
                                                fontWeight={900}
                                                color={G.text}
                                            >
                                                {selectedLog?.actor
                                                    ?.name ||
                                                    "Unknown User"}
                                            </Typography>

                                            <Typography
                                                variant="caption"
                                                color={G.muted}
                                            >
                                                {selectedLog?.actor
                                                    ?.email ||
                                                    "No email recorded"}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>

                            {/* DESCRIPTION */}

                            <Card
                                sx={{
                                    borderRadius: "16px",
                                    border:
                                        "1px solid #e8eef6",
                                    boxShadow: "none",
                                }}
                            >
                                <CardContent
                                    sx={{
                                        p: 2.5,
                                        "&:last-child": {
                                            pb: 2.5,
                                        },
                                    }}
                                >
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                    >
                                        <Description
                                            sx={{
                                                color: G.blue,
                                                fontSize: 19,
                                            }}
                                        />

                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: G.muted,
                                                fontWeight: 900,
                                                letterSpacing:
                                                    ".07em",
                                            }}
                                        >
                                            ACTIVITY DESCRIPTION
                                        </Typography>
                                    </Stack>

                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: G.text,
                                            mt: 1.5,
                                            lineHeight: 1.7,
                                        }}
                                    >
                                        {selectedLog?.description ||
                                            "No descriptive snapshot was attached to this event."}
                                    </Typography>
                                </CardContent>
                            </Card>

                            {/* REGISTERED USERS */}

                            {selectedLog?.metadata
                                ?.registeredUsers?.length ? (
                                <Box>
                                    <Typography
                                        fontWeight={900}
                                        color={G.text}
                                        sx={{ mb: 1.5 }}
                                    >
                                        Registered Users (
                                        {
                                            selectedLog.metadata
                                                .registeredUsers
                                                .length
                                        }
                                        )
                                    </Typography>

                                    <List
                                        disablePadding
                                        sx={{
                                            bgcolor: "#fff",
                                            border:
                                                "1px solid #e8eef6",
                                            borderRadius:
                                                "16px",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {selectedLog.metadata.registeredUsers.map(
                                            (user, index) => (
                                                <React.Fragment
                                                    key={
                                                        user.id ||
                                                        index
                                                    }
                                                >
                                                    <ListItem
                                                        sx={{
                                                            px: 2.5,
                                                            py: 1.7,
                                                        }}
                                                    >
                                                        <ListItemAvatar>
                                                            <Avatar
                                                                sx={{
                                                                    bgcolor:
                                                                        "rgba(0,91,150,.1)",
                                                                    color: G.blue,
                                                                    fontWeight: 900,
                                                                }}
                                                            >
                                                                {(
                                                                    user.name ||
                                                                    "?"
                                                                )
                                                                    .charAt(
                                                                        0
                                                                    )
                                                                    .toUpperCase()}
                                                            </Avatar>
                                                        </ListItemAvatar>

                                                        <ListItemText
                                                            primary={
                                                                <Typography
                                                                    fontWeight={
                                                                        900
                                                                    }
                                                                    color={
                                                                        G.text
                                                                    }
                                                                >
                                                                    {user.name ||
                                                                        "Unknown"}
                                                                </Typography>
                                                            }
                                                            secondary={
                                                                <Stack
                                                                    direction={{
                                                                        xs: "column",
                                                                        sm: "row",
                                                                    }}
                                                                    spacing={
                                                                        1.5
                                                                    }
                                                                    sx={{
                                                                        mt: 0.4,
                                                                    }}
                                                                >
                                                                    <Typography
                                                                        variant="caption"
                                                                        color={
                                                                            G.muted
                                                                        }
                                                                    >
                                                                        <Business
                                                                            sx={{
                                                                                fontSize: 12,
                                                                                mr: 0.4,
                                                                                verticalAlign:
                                                                                    "middle",
                                                                            }}
                                                                        />
                                                                        {user.department ||
                                                                            "No department"}
                                                                    </Typography>

                                                                    <Typography
                                                                        variant="caption"
                                                                        color={
                                                                            G.muted
                                                                        }
                                                                    >
                                                                        <Place
                                                                            sx={{
                                                                                fontSize: 12,
                                                                                mr: 0.4,
                                                                                verticalAlign:
                                                                                    "middle",
                                                                            }}
                                                                        />
                                                                        {user.station ||
                                                                            "No station"}
                                                                    </Typography>
                                                                </Stack>
                                                            }
                                                        />
                                                    </ListItem>

                                                    {index <
                                                        selectedLog
                                                            .metadata
                                                            .registeredUsers
                                                            .length -
                                                            1 && (
                                                        <Divider />
                                                    )}
                                                </React.Fragment>
                                            )
                                        )}
                                    </List>
                                </Box>
                            ) : selectedLog?.metadata
                                  ?.registeredUser ||
                              selectedLog?.target ? (
                                <SingleTarget
                                    user={
                                        selectedLog?.metadata
                                            ?.registeredUser ||
                                        selectedLog?.target
                                    }
                                />
                            ) : null}

                            {/* METADATA */}

                            {selectedLog?.metadata &&
                                Object.keys(
                                    selectedLog.metadata
                                ).length > 0 && (
                                    <Card
                                        sx={{
                                            borderRadius:
                                                "16px",
                                            border:
                                                "1px solid #e8eef6",
                                            boxShadow: "none",
                                        }}
                                    >
                                        <CardContent
                                            sx={{
                                                p: 2.5,
                                                "&:last-child": {
                                                    pb: 2.5,
                                                },
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: G.muted,
                                                    fontWeight: 900,
                                                    letterSpacing:
                                                        ".07em",
                                                }}
                                            >
                                                EVENT METADATA
                                            </Typography>

                                            <Box
                                                component="pre"
                                                sx={{
                                                    mt: 1.5,
                                                    mb: 0,
                                                    p: 2,
                                                    borderRadius: 2.5,
                                                    bgcolor:
                                                        "#0f172a",
                                                    color:
                                                        "#dbeafe",
                                                    fontSize: 11,
                                                    overflowX:
                                                        "auto",
                                                    whiteSpace:
                                                        "pre-wrap",
                                                    wordBreak:
                                                        "break-word",
                                                    maxHeight: 280,
                                                }}
                                            >
                                                {JSON.stringify(
                                                    selectedLog.metadata,
                                                    null,
                                                    2
                                                )}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                )}
                        </Stack>
                    </DialogContent>

                    <DialogActions
                        sx={{
                            px: 3.5,
                            py: 2,
                            borderTop:
                                "1px solid #e8eef6",
                        }}
                    >
                        <Button
                            onClick={() =>
                                setDialogOpen(false)
                            }
                            variant="contained"
                            sx={{
                                bgcolor: G.navy,
                                borderRadius: 2.5,
                                textTransform: "none",
                                fontWeight: 800,
                                px: 3,

                                "&:hover": {
                                    bgcolor: G.blue,
                                },
                            }}
                        >
                            Close Investigation
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   EMPTY CHART
───────────────────────────────────────────────────────────────────────────── */

function EmptyChart() {
    return (
        <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
                height: 260,
                textAlign: "center",
            }}
        >
            <Box
                sx={{
                    width: 50,
                    height: 50,
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "rgba(0,91,150,.06)",
                    color: G.blue,
                    mb: 1.5,
                }}
            >
                <AssessmentRounded />
            </Box>

            <Typography
                variant="body2"
                fontWeight={800}
                color={G.text}
            >
                No analytics available
            </Typography>

            <Typography
                variant="caption"
                color={G.muted}
                sx={{ mt: 0.4 }}
            >
                Audit data will appear here when records are available.
            </Typography>
        </Stack>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   INFORMATION BLOCK
───────────────────────────────────────────────────────────────────────────── */

function InfoBlock({ label, value, icon }) {
    return (
        <Box
            sx={{
                p: 2,
                bgcolor: "#fff",
                border: "1px solid #e8eef6",
                borderRadius: "14px",
                height: "100%",
            }}
        >
            <Stack
                direction="row"
                spacing={1.3}
                alignItems="center"
            >
                <Box
                    sx={{
                        width: 36,
                        height: 36,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 2,
                        bgcolor: "rgba(0,91,150,.07)",
                        color: G.blue,

                        "& svg": {
                            fontSize: 18,
                        },
                    }}
                >
                    {icon}
                </Box>

                <Box>
                    <Typography
                        variant="caption"
                        sx={{
                            color: G.muted,
                            fontWeight: 700,
                        }}
                    >
                        {label}
                    </Typography>

                    <Typography
                        variant="body2"
                        fontWeight={900}
                        color={G.text}
                    >
                        {value}
                    </Typography>
                </Box>
            </Stack>
        </Box>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SINGLE TARGET
───────────────────────────────────────────────────────────────────────────── */

function SingleTarget({ user }) {
    if (!user) return null;

    return (
        <Box>
            <Typography
                fontWeight={900}
                color={G.text}
                sx={{ mb: 1.5 }}
            >
                Target User
            </Typography>

            <Card
                sx={{
                    borderRadius: "16px",
                    border: "1px solid #e8eef6",
                    boxShadow: "none",
                }}
            >
                <CardContent
                    sx={{
                        p: 2.5,
                        "&:last-child": {
                            pb: 2.5,
                        },
                    }}
                >
                    <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                    >
                        <Avatar
                            sx={{
                                bgcolor:
                                    "rgba(0,91,150,.1)",
                                color: G.blue,
                                fontWeight: 900,
                            }}
                        >
                            {(user?.name || "?")
                                .charAt(0)
                                .toUpperCase()}
                        </Avatar>

                        <Box>
                            <Typography
                                fontWeight={900}
                                color={G.text}
                            >
                                {user?.name || "Unknown User"}
                            </Typography>

                            {user?.email && (
                                <Typography
                                    variant="caption"
                                    color={G.muted}
                                    sx={{
                                        display: "block",
                                    }}
                                >
                                    {user.email}
                                </Typography>
                            )}

                            <Stack
                                direction={{
                                    xs: "column",
                                    sm: "row",
                                }}
                                spacing={{
                                    xs: 0.3,
                                    sm: 1.5,
                                }}
                                sx={{ mt: 0.4 }}
                            >
                                {user?.department && (
                                    <Typography
                                        variant="caption"
                                        color={G.muted}
                                    >
                                        <Business
                                            sx={{
                                                fontSize: 12,
                                                verticalAlign:
                                                    "middle",
                                                mr: 0.3,
                                            }}
                                        />
                                        {user.department}
                                    </Typography>
                                )}

                                {user?.station && (
                                    <Typography
                                        variant="caption"
                                        color={G.muted}
                                    >
                                        <Place
                                            sx={{
                                                fontSize: 12,
                                                verticalAlign:
                                                    "middle",
                                                mr: 0.3,
                                            }}
                                        />
                                        {user.station}
                                    </Typography>
                                )}
                            </Stack>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}