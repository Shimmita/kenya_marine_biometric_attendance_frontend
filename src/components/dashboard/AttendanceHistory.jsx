import {
    AccessTimeRounded, ClearRounded, Download,
    History, ManageSearchRounded, Refresh,
    SearchRounded, TaskAltRounded, TipsAndUpdatesRounded, VerifiedRounded,
    WarningAmberRounded, WorkHistoryRounded
} from '@mui/icons-material';
import {
    Alert, Box, Button, Chip, CircularProgress, Divider, Grid, InputAdornment,
    Skeleton, Snackbar, Stack, Table, TableBody,
    TableCell, TableContainer, TableHead, TablePagination, TableRow,
    TextField, Typography,
} from '@mui/material';
import { motion as Motion, useInView } from 'framer-motion';
import QRCode from 'qrcode';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import KMFRILogo from "../../images/kmfri_logo.png";
import { trackClientAuditEvent } from '../../service/AuditorService.jsx';
import { fetchAttendanceStats, fetchClockingHistory } from '../../service/ClockingService';
import { createExportVerification, updateExportVerificationContent } from '../../service/VerificationService';
import coreDataDetails from '../CoreDataDetails';
import { formatDate, formatTime, getLocalDateInputValue, safeNewDate } from '../util/DateTimeFormater';



const { colorPalette } = coreDataDetails;

/* ══ GLASS TOKENS ══════════════════════════════════════════════════════════ */
const G = {
    card: {
        background: '#fff',
        border: '1px solid rgba(148,163,184,0.18)',
        boxShadow: '0 14px 34px rgba(15,23,42,0.06)',
    },
    subtleCard: {
        background: '#fff',
        border: '1px solid rgba(148,163,184,0.18)',
        boxShadow: '0 10px 24px rgba(15,23,42,0.05)',
    },
    input: {
        '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            background: '#fff',
            '&:hover fieldset': { borderColor: colorPalette.oceanBlue },
            '&.Mui-focused fieldset': { borderColor: colorPalette.oceanBlue, borderWidth: 2 },
        },
        '& .MuiInputLabel-root': { fontWeight: 700 },
    },
    tableCell: {
        borderBottom: '1px solid rgba(10,61,98,0.06)',
        fontSize: '0.82rem',
    },
};

const safe = (v, s = '') => (v != null ? `${v}${s}` : '—');
const toTitleCase = (value) => {
    if (value == null || value === '') return '—';
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));
};
const formatLocationLabel = (rec, isEntry) => {
    const primaryLocationName = isEntry ? rec.clockInLocationName : rec.clockOutLocationName;
    const withinPremise = isEntry ? rec.clockInWithinPremise : rec.clockOutWithinPremise;
    const outsideFallback = withinPremise === false ? rec.outsideLocation : '';
    const primaryIsInside = /^IN[-\s]?PREMISE$/i.test(String(primaryLocationName || '').trim());
    const locationName = String((withinPremise === false && primaryIsInside ? outsideFallback : primaryLocationName) || outsideFallback || '').trim();
    const genericLocation = /^(OFF[-\s]?PREMISE|OUTSIDE\s+PREMISES?|UNKNOWN)$/i.test(locationName);
    const status = (rec?.clockedOutside || rec?.clockedOutSide || locationName) ? 'Off Premise' : 'In Premise';
    if (withinPremise === true) return 'In Premise';
    if (!locationName || genericLocation) return withinPremise === false ? 'Off Premise' : status;
    const parts = String(locationName).split('|').map((part) => part.trim()).filter(Boolean);
    const filtered = parts.filter((part) => !/^(UNKNOWN\s+SUB[-\s]?COUNTY|UNKNOWN\s+WARD)$/i.test(part));
    if (filtered.length === 0) return withinPremise === false ? 'Off Premise' : status;
    return filtered.join(' | ');
};
const normalizeExportValue = (value) => {
    if (value == null || value === '') return '—';
    return String(value);
};
const normalizeExportTextValue = (value) => {
    if (value == null || value === '') return '—';
    return toTitleCase(value);
};

/* ══ SCROLL-TRIGGERED REVEAL ═══════════════════════════════════════════════ */
const Reveal = ({ children, delay = 0, y = 22 }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-50px' });
    return (
        <Motion.div ref={ref} initial={{ opacity: 0, y }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>
            {children}
        </Motion.div>
    );
};

const getDateDaysAgoInput = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return getLocalDateInputValue(date);
};

const MetricTile = ({ icon, label, value, detail, accent = colorPalette.oceanBlue }) => (
    <Box sx={{
        ...G.card,
        p: { xs: 1.8, md: 2 },
        height: "100%",
        minHeight: 118,
        borderRadius: "8px",
        borderColor: "rgba(10,61,98,0.10)",
        boxShadow: "0 4px 18px rgba(10,61,98,0.06)",
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
            borderColor: `${accent}45`,
            boxShadow: '0 10px 24px rgba(10,61,98,0.10)',
        },
    }}>
        <Stack direction="row" spacing={1.4} alignItems="flex-start">
            <Box sx={{ width: 38, height: 38, borderRadius: "8px", bgcolor: `${accent}14`, color: accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" fontWeight={900} sx={{ color: colorPalette.deepNavy, lineHeight: 1, fontVariantNumeric: "tabular-nums", wordBreak: 'break-word' }}>{value}</Typography>
                <Typography variant="caption" fontWeight={900} color="text.secondary" sx={{ display: "block", mt: 0.45, textTransform: "uppercase", letterSpacing: 0 }}>{label}</Typography>
                {detail && <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.35 }}>{detail}</Typography>}
            </Box>
        </Stack>
    </Box>
);

const RecommendationPanel = ({ recommendation, filteredCount }) => (
    <Box sx={{
        ...G.card,
        p: { xs: 2, md: 2.4 },
        borderRadius: "8px",
        borderColor: `${recommendation.accent}30`,
        boxShadow: "0 6px 22px rgba(10,61,98,0.07)",
        mb: 3,
        position: "relative",
        zIndex: 1,
    }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "flex-start" }} justifyContent="space-between">
            <Stack direction="row" spacing={1.4} alignItems="flex-start" sx={{ minWidth: 0 }}>
                <Box sx={{ width: 42, height: 42, borderRadius: "8px", bgcolor: `${recommendation.accent}14`, color: recommendation.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <TipsAndUpdatesRounded />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="subtitle1" fontWeight={900} color={colorPalette.deepNavy}>{recommendation.title}</Typography>
                        <Chip size="small" label={`${filteredCount} matching records`} sx={{ height: 22, borderRadius: "8px", bgcolor: `${recommendation.accent}12`, color: recommendation.accent, fontWeight: 800 }} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>{recommendation.message}</Typography>
                </Box>
            </Stack>
            <Stack spacing={0.7} sx={{ minWidth: { md: 320 } }}>
                {recommendation.actions.map((action) => (
                    <Stack key={action} direction="row" spacing={0.8} alignItems="flex-start">
                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: recommendation.accent, mt: 0.85, flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary">{action}</Typography>
                    </Stack>
                ))}
            </Stack>
        </Stack>
    </Box>
);

const RecordMobileCard = ({ row }) => (
    <Box sx={{ ...G.subtleCard, borderRadius: '8px', p: 1.7 }}>
        <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Box>
                    <Typography variant="subtitle2" fontWeight={900} color={colorPalette.deepNavy}>
                        {row.date}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={750}>
                        Personal attendance record
                    </Typography>
                </Box>
            </Stack>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 1,
                }}
            >
                {[
                    ['Clock In', row.clockIn],
                    ['Clock Out', row.clockOut],
                ].map(([label, value]) => (
                    <Box key={label} sx={{ p: 1.2, borderRadius: '8px', bgcolor: 'rgba(10,61,98,0.04)', border: '1px solid rgba(10,61,98,0.06)' }}>
                        <Typography variant="caption" fontWeight={900} color="text.disabled" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: 0 }}>
                            {label}
                        </Typography>
                        <Typography variant="body2" fontWeight={900} color={colorPalette.deepNavy} sx={{ mt: 0.25, fontVariantNumeric: 'tabular-nums' }}>
                            {value}
                        </Typography>
                    </Box>
                ))}
            </Box>

            <Grid container spacing={1.2}>
                {[
                    ['In Location', row.inLocation],
                    ['Out Location', row.outLocation],
                    ['Why Out', row.whyOut || '—'],
                ].map(([label, value]) => (
                    <Grid item xs={12} key={label}>
                        <Typography variant="caption" fontWeight={900} color="text.disabled" sx={{ textTransform: 'uppercase', letterSpacing: 0 }}>
                            {label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2, overflowWrap: 'anywhere' }}>
                            {value}
                        </Typography>
                    </Grid>
                ))}
            </Grid>
        </Stack>
    </Box>
);

/* ══ MAIN ══════════════════════════════════════════════════════════════════ */
export default function AttendanceHistoryContent() {
    const { user } = useSelector(s => s.currentUser);
    const [stats, setStats] = useState(null);
    const [rawHistory, setRawHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
    const [filterStartDate, setFilterStartDate] = useState(getDateDaysAgoInput(30));
    const [filterEndDate, setFilterEndDate] = useState(getLocalDateInputValue());
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const notify = (msg, sev = 'success') => setSnack({ open: true, message: msg, severity: sev });

    const loadData = async (isActive = () => true) => {
        setLoading(true); setHistoryLoading(true);
        try {
            const [statsData, historyData] = await Promise.all([fetchAttendanceStats(), fetchClockingHistory(90)]);
            if (!isActive()) return;
            setStats(statsData);
            setRawHistory(historyData.map(rec => {
                const rawClockIn = safeNewDate(rec.clock_in);
                const rawClockOut = safeNewDate(rec.clock_out);
                const createdDate = rawClockIn || rawClockOut;
                const durationHours = rawClockIn && rawClockOut ? (rawClockOut - rawClockIn) / 3_600_000 : 0;
                const inLocation = formatLocationLabel(rec, true);
                const outLocation = formatLocationLabel(rec, false);
                const whyOut = rec.outSideReason ? toTitleCase(rec.outSideReason) : "";
                const premise = (
                    rec.clockInWithinPremise === false ||
                    rec.clockOutWithinPremise === false ||
                    rec.clockedOutside ||
                    rec.clockedOutSide ||
                    whyOut
                ) ? "Off Premise" : "In Premise";
                return {
                    date: createdDate ? formatDate(createdDate) : 'Invalid date',
                    rawDate: createdDate,
                    dateKey: createdDate ? getLocalDateInputValue(createdDate) : '',
                    clockIn: rawClockIn ? formatTime(rawClockIn) : 'Invalid date',
                    clockOut: rec.missedClockOut ? 'System' : rawClockOut ? formatTime(rawClockOut) : 'System',
                    inLocation,
                    outLocation,
                    whyOut,
                    durationHours,
                    timing: rec.isLate ? 'Late' : 'Early',
                    premise,
                    clockOutState: rec.missedClockOut ? "System Closed" : rawClockOut ? "Completed" : "Open",
                    searchable: [formatDate(createdDate), formatTime(rawClockIn), formatTime(rawClockOut), inLocation, outLocation, whyOut].join(" ").toLowerCase(),
                };
            }));
        } catch {
            if (isActive()) notify('Failed to load data.', 'error');
        }
        finally {
            if (isActive()) {
                setLoading(false);
                setHistoryLoading(false);
            }
        }
    };

    useEffect(() => {
        let active = true;
        loadData(() => active);
        return () => { active = false; };
    }, []);// eslint-disable-line

    const filtersForExport = useMemo(() => ({
        startDate: filterStartDate || "all",
        endDate: filterEndDate || "all",
        search: searchTerm || "none",
    }), [filterStartDate, filterEndDate, searchTerm]);

    const filteredRows = useMemo(() => rawHistory.filter(row => {
        if (!row?.rawDate) return false;
        if (filterStartDate && row.dateKey < filterStartDate) return false;
        if (filterEndDate && row.dateKey > filterEndDate) return false;
        if (searchTerm.trim() && !row.searchable.includes(searchTerm.trim().toLowerCase())) return false;
        return true;
    }), [rawHistory, filterStartDate, filterEndDate, searchTerm]);

    const activeFilterChips = useMemo(() => ([
        filterStartDate ? `From ${filterStartDate}` : null,
        filterEndDate ? `To ${filterEndDate}` : null,
        searchTerm.trim() ? `Search: ${searchTerm.trim()}` : null,
    ].filter(Boolean)), [filterEndDate, filterStartDate, searchTerm]);

    const personalMetrics = useMemo(() => {
        const source = filteredRows;
        const totalHours = source.reduce((sum, row) => sum + (Number(row.durationHours) || 0), 0);
        const completedRows = source.filter(row => row.clockOutState !== "Open").length;
        const lateRows = source.filter(row => row.timing === "Late").length;
        const offPremiseRows = source.filter(row => row.premise === "Off Premise").length;
        const attentionRows = source.filter(row => row.clockOutState !== "Completed").length;
        const averageHours = source.length ? totalHours / source.length : 0;
        const completionRate = source.length ? (completedRows / source.length) * 100 : 0;

        return {
            totalHours: totalHours.toFixed(1),
            averageHours: averageHours.toFixed(1),
            completedRows,
            lateRows,
            offPremiseRows,
            attentionRows,
            completionRate: completionRate.toFixed(0),
        };
    }, [filteredRows]);

    const attendanceRecommendation = useMemo(() => {
        const rate = Number(stats?.monthly?.attendanceRate ?? 0);
        const lateCount = Number(personalMetrics.lateRows || 0);
        const reviewCount = Number(personalMetrics.attentionRows || 0);
        const offPremiseCount = Number(personalMetrics.offPremiseRows || 0);

        const supportingActions = [];
        if (reviewCount > 0) supportingActions.push(`Review ${reviewCount} open or system-closed record${reviewCount === 1 ? "" : "s"} before exporting official records.`);
        if (lateCount > 0) supportingActions.push(`Reduce late arrivals by planning clock-in buffer time on the days that commonly run tight.`);
        if (offPremiseCount > 0) supportingActions.push(`Keep off-premise reasons clear so supervisors can verify field or remote activity.`);

        if (!stats?.monthly) {
            return {
                title: "Attendance Guidance",
                message: "Your recommendation will appear once your attendance statistics finish loading.",
                accent: colorPalette.oceanBlue,
                actions: ["Use the filters above to narrow the period you want to review."],
            };
        }

        if (rate >= 95) {
            return {
                title: "Excellent Attendance",
                message: `You are at ${rate}% this month. Keep the rhythm steady and make sure all clock-outs stay complete.`,
                accent: "#0f766e",
                actions: supportingActions.length ? supportingActions : [
                    "Maintain the same clock-in routine through the rest of the month.",
                    "Export your records when you need a verified personal attendance trail.",
                ],
            };
        }

        if (rate >= 85) {
            return {
                title: "Good Attendance",
                message: `You are at ${rate}% this month. You are in a healthy range, with room to tighten consistency.`,
                accent: "#2563eb",
                actions: supportingActions.length ? supportingActions : [
                    "Watch for missed clock-outs and late arrivals so the percentage does not slip.",
                    "Use the date and timing filters to inspect any days that look unusual.",
                ],
            };
        }

        if (rate >= 75) {
            return {
                title: "Attendance Needs Attention",
                message: `You are at ${rate}% this month. A few corrections or steadier attendance days can move this back into a stronger range.`,
                accent: "#d97706",
                actions: [
                    ...supportingActions,
                    "Check whether leave, field duty, missed clock-outs, or late entries explain the lower percentage.",
                    "Follow up early with HR or your supervisor for records that need correction.",
                ].slice(0, 4),
            };
        }

        return {
            title: "Low Attendance Alert",
            message: `You are at ${rate}% this month. This may need prompt review so your official attendance record stays accurate.`,
            accent: "#dc2626",
            actions: [
                ...supportingActions,
                "Confirm that approved leave, field work, or clocking issues are correctly reflected.",
                "Contact HR or your supervisor if valid attendance is missing from the system.",
            ].slice(0, 4),
        };
    }, [stats?.monthly, personalMetrics.attentionRows, personalMetrics.lateRows, personalMetrics.offPremiseRows]);

    const paginatedRows = useMemo(() => (
        filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    ), [filteredRows, page, rowsPerPage]);

    const resetFilters = () => {
        setFilterStartDate(getDateDaysAgoInput(30));
        setFilterEndDate(getLocalDateInputValue());
        setSearchTerm('');
        setPage(0);
    };

    const handleExportPDF = async () => {
        if (!filteredRows.length) {
            notify("No records match the selected filters.", "warning");
            return;
        }

        setExporting(true);

        try {
            const { default: jsPDF } = await import("jspdf");
            const { default: autoTable } = await import("jspdf-autotable");
            const filename = `KMFRI_Personal_Attendance_Records_${Date.now()}.pdf`;
            const scope = `Personal attendance history for ${user?.name || user?.email || "current user"}`;
            const { token } = await createExportVerification({
                type: "personal_attendance_records",
                title: "KMFRI Personal Attendance Records",
                scope,
                filename,
                metadata: {
                    exportKind: "records",
                    rows: filteredRows.length,
                    filters: filtersForExport,
                    generatedFor: {
                        name: user?.name || "",
                        email: user?.email || "",
                        station: user?.station || "",
                        department: user?.department || "",
                    },
                },
            });
            const verifyUrl = `${window.location.origin}/verify/${token}`;

            // Generate QR Code
            const qrImage = await QRCode.toDataURL(verifyUrl, {
                margin: 1,
                width: 300,
                errorCorrectionLevel: "H",
            });

            // Load KMFRI logo to preserve aspect ratio
            const logo = new Image();
            logo.src = KMFRILogo;

            await new Promise((resolve, reject) => {
                logo.onload = resolve;
                logo.onerror = reject;
            });

            const doc = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4",
            });

            const pw = doc.internal.pageSize.getWidth();
            const ph = doc.internal.pageSize.getHeight();

            // =====================================================
            // Header Background
            // =====================================================
            doc.setFillColor(10, 61, 98);
            doc.rect(0, 0, pw, 40, "F");

            // =====================================================
            // KMFRI Logo (LEFT)
            // =====================================================
            const logoHeight = 20;
            const logoWidth = (logo.width / logo.height) * logoHeight;

            const logoX = 3;
            const logoY = 8;

            doc.addImage(
                KMFRILogo,
                "PNG",
                logoX,
                logoY,
                logoWidth,
                logoHeight,
                undefined,
                "FAST"
            );

            // =====================================================
            // QR Code (RIGHT)
            // =====================================================
            const qrSize = 30;
            const qrX = pw - qrSize - 10;
            const qrY = 5;

            doc.addImage(
                qrImage,
                "PNG",
                qrX,
                qrY,
                qrSize,
                qrSize,
                undefined,
                "FAST"
            );

            // =====================================================
            // Header Text
            // =====================================================
            doc.setTextColor(255, 255, 255);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("KMFRI PERSONAL ATTENDANCE RECORDS", pw / 2, 10, {
                align: "center",
            });

            doc.setFontSize(9);
            doc.text(
                `${user?.name || "CURRENT USER"} | ${user?.station || "UNASSIGNED STATION"} | ${user?.department || "UNASSIGNED DEPARTMENT"}`.toUpperCase(),
                pw / 2,
                16,
                { align: "center" }
            );

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);

            doc.text(
                `${filtersForExport.startDate} TO ${filtersForExport.endDate}`.toUpperCase(),
                pw / 2,
                22,
                { align: "center" }
            );

            doc.text(
                `GENERATED: ${new Date().toLocaleString().toUpperCase()} | BY: ${(user?.name || "AUTHORIZED PERSONNEL").toUpperCase()}`,
                pw / 2,
                28,
                { align: "center" }
            );

            doc.text(
                `FILTERS: SEARCH ${(searchTerm.trim() || "NONE").toUpperCase()} | ROWS ${filteredRows.length}`,
                pw / 2,
                34,
                { align: "center" }
            );

            // QR Label
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7);
            doc.text(
                "VERIFICATION QR",
                qrX + qrSize / 2,
                qrY + qrSize + 3,
                {
                    align: "center",
                }
            );

            autoTable(doc, {
                startY: 45,
                head: [["Personal Metric", "Value", "Scope"]],
                body: [
                    ["Rows Exported", filteredRows.length, "Filtered records"],
                    ["Total Hours", `${personalMetrics.totalHours}h`, "Completed clocking records"],
                    ["Average Hours", `${personalMetrics.averageHours}h`, "Per matching record"],
                    ["Completion Rate", `${personalMetrics.completionRate}%`, "Records with a closed clock-out"],
                    ["Records Needing Review", personalMetrics.attentionRows, "Open or system-closed rows"],
                ],
                theme: "striped",
                headStyles: { fillColor: [7, 58, 82], textColor: 255, halign: "center", fontStyle: "bold" },
                styles: { fontSize: 7.8, halign: "center", cellPadding: 1.7 },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { left: 10, right: 10 },
            });

            autoTable(doc, {
                head: [
                    [
                        "NO.",
                        "DATE",
                        "CLOCK IN",
                        "CLOCK OUT",
                        "IN LOCATION",
                        "OUT LOCATION",
                        "WHY OUT",
                    ],
                ],
                body: filteredRows.map((r, index) => [
                    index + 1,
                    normalizeExportValue(r.date),
                    normalizeExportValue(r.clockIn),
                    normalizeExportValue(r.clockOut),
                    normalizeExportTextValue(r.inLocation),
                    normalizeExportTextValue(r.outLocation),
                    normalizeExportTextValue(r.whyOut),
                ]),
                startY: doc.lastAutoTable.finalY + 6,
                theme: "striped",
                headStyles: {
                    fillColor: [10, 61, 98],
                    textColor: 255,
                    halign: "center",
                    fontStyle: "bold",
                },
                styles: {
                    fontSize: 6.8,
                    halign: "center",
                    cellPadding: 1.35,
                    overflow: "linebreak",
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252],
                },
                margin: {
                    left: 6,
                    right: 6,
                },
                columnStyles: {
                    0: { cellWidth: 9 },
                    4: { cellWidth: 64 },
                    5: { cellWidth: 64 },
                    6: { cellWidth: 46 },
                },
            });

            // =====================================================
            // Footer
            // =====================================================
            const totalPages = doc.internal.getNumberOfPages();

            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);

                doc.setDrawColor(10, 61, 98);
                doc.line(
                    10,
                    ph - 12,
                    pw - 10,
                    ph - 12
                );

                doc.setFontSize(8);
                doc.setTextColor(80);

                doc.text(
                    "Kenya Marine and Fisheries Research Institute (KMFRI)",
                    10,
                    ph - 7
                );

                doc.text(
                    `Page ${i} of ${totalPages} | Public verification valid for 90 days`,
                    pw - 10,
                    ph - 7,
                    {
                        align: "right",
                    }
                );
            }

            const dataUri = doc.output("datauristring");
            const documentBase64 = dataUri.split(",").pop();
            await updateExportVerificationContent(token, {
                documentBase64,
                metadata: {
                    exportKind: "records",
                    rows: filteredRows.length,
                    filters: filtersForExport,
                    finalizedAt: new Date().toISOString(),
                },
            });

            doc.save(filename);

            await trackClientAuditEvent("attendance.history_exported", {
                rowsExported: filteredRows.length,
                filters: filtersForExport,
            });

            notify("Records exported successfully with official QR verification.");
        } catch (err) {
            console.error("PDF Export Error:", err);
            notify("Export failed. Check console for details.", "error");
        } finally {
            setExporting(false);
        }
    };

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: 1600,
                mx: 'auto',
                px: { xs: 1, sm: 2, lg: 3 },
                py: { xs: 1, sm: 2 },
                position: 'relative',
            }}
        >
            <Snackbar open={snack.open} autoHideDuration={5000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert severity={snack.severity} variant="filled" elevation={6} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: '14px', fontWeight: 700, backdropFilter: 'blur(16px)' }}>{snack.message}</Alert>
            </Snackbar>

            <Reveal>
                <Box
                    sx={{
                        ...G.card,
                        borderRadius: '8px',
                        p: { xs: 2, md: 2.6 },
                        mb: 2.5,
                        position: 'relative',
                        zIndex: 1,
                        background: 'linear-gradient(135deg, #ffffff 0%, #f4fbff 54%, #f7fbf8 100%)',
                    }}
                >
                    <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" spacing={2}>
                        <Stack direction="row" spacing={1.4} alignItems="flex-start" sx={{ minWidth: 0 }}>
                            <Box sx={{ width: 42, height: 42, borderRadius: "8px", bgcolor: `${colorPalette.oceanBlue}12`, color: colorPalette.oceanBlue, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <VerifiedRounded />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                    <Typography variant="h5" fontWeight={900} color={colorPalette.deepNavy} sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                                        My Attendance History
                                    </Typography>
                                    <Chip size="small" label="Personal records" sx={{ bgcolor: `${colorPalette.oceanBlue}10`, color: colorPalette.oceanBlue, fontWeight: 800, borderRadius: "8px" }} />
                                </Stack>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.55, maxWidth: 760 }}>
                                    Review your attendance pattern, resolve incomplete records, and export verifiable KMFRI records.
                                </Typography>
                            </Box>
                        </Stack>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
                            <Button variant="outlined" startIcon={<Refresh sx={{ fontSize: '1rem' }} />} onClick={loadData} disabled={loading}
                                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 800, fontSize: '0.82rem', background: '#fff', borderColor: 'rgba(10,61,98,0.18)', color: colorPalette.deepNavy, whiteSpace: 'nowrap', width: { xs: '100%', sm: 'auto' }, minHeight: 42, '&:hover': { borderColor: colorPalette.oceanBlue } }}>
                                Refresh
                            </Button>
                            <Button variant="contained" startIcon={exporting ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <Download />} onClick={handleExportPDF} disabled={exporting || historyLoading}
                                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 800, fontSize: '0.82rem', background: colorPalette.oceanGradient, boxShadow: `0 6px 18px ${colorPalette.oceanBlue}30`, whiteSpace: 'nowrap', width: { xs: '100%', sm: 'auto' }, minHeight: 42, '&:hover': { boxShadow: `0 8px 24px ${colorPalette.oceanBlue}40` }, transition: 'all 0.22s' }}>
                                {exporting ? 'Generating...' : 'Export Records PDF'}
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Reveal>

            <Reveal delay={0.03}>
                <Box sx={{ ...G.card, borderRadius: "8px", p: { xs: 2, md: 2.4 }, mb: 2.5, position: "relative", zIndex: 1 }}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" sx={{ mb: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 34, height: 34, borderRadius: "8px", bgcolor: `${colorPalette.deepNavy}10`, color: colorPalette.deepNavy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <ManageSearchRounded fontSize="small" />
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={900} color={colorPalette.deepNavy}>Attendance Filters</Typography>
                                <Typography variant="caption" color="text.secondary">{filteredRows.length} of {rawHistory.length} records in view</Typography>
                            </Box>
                        </Stack>
                        <Button size="small" startIcon={<ClearRounded />} onClick={resetFilters}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 800, fontSize: '0.8rem', color: colorPalette.deepNavy, bgcolor: 'rgba(10,61,98,0.05)', alignSelf: { xs: "flex-start", md: "center" } }}>
                            Reset Filters
                        </Button>
                    </Stack>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, minmax(0, 1fr))',
                                lg: 'minmax(260px, 1.4fr) repeat(2, minmax(150px, 1fr))',
                            },
                            gap: 1.5,
                        }}
                    >
                        <TextField fullWidth size="small" label="Search records" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(0); }} sx={G.input}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> }} />
                        <TextField fullWidth size="small" type="date" label="From" value={filterStartDate} onChange={e => { setFilterStartDate(e.target.value); setPage(0); }} InputLabelProps={{ shrink: true }} sx={G.input} />
                        <TextField fullWidth size="small" type="date" label="To" value={filterEndDate} onChange={e => { setFilterEndDate(e.target.value); setPage(0); }} InputLabelProps={{ shrink: true }} sx={G.input} />
                    </Box>
                    {activeFilterChips.length > 0 && (
                        <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                            {activeFilterChips.map((item) => (
                                <Chip
                                    key={item}
                                    size="small"
                                    label={item}
                                    sx={{ borderRadius: '8px', bgcolor: `${colorPalette.oceanBlue}0f`, color: colorPalette.deepNavy, fontWeight: 800 }}
                                />
                            ))}
                        </Stack>
                    )}
                </Box>
            </Reveal>

            <Reveal delay={0.04}>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, minmax(0, 1fr))',
                            xl: 'repeat(4, minmax(0, 1fr))',
                        },
                        gap: 2,
                        mb: 3,
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    <MetricTile icon={<WorkHistoryRounded />} label="Monthly Attendance" value={loading ? "..." : safe(stats?.monthly?.attendanceRate, "%")} detail={`${stats?.monthly?.presentDays ?? "—"} present days this month`} accent={colorPalette.oceanBlue} />
                    <MetricTile icon={<AccessTimeRounded />} label="Hours Logged" value={`${personalMetrics.totalHours}h`} detail={`${personalMetrics.averageHours}h average per record`} accent="#0f766e" />
                    <MetricTile icon={<TaskAltRounded />} label="Clock-Out Completion" value={`${personalMetrics.completionRate}%`} detail={`${personalMetrics.completedRows} closed records`} accent="#2563eb" />
                    <MetricTile icon={<WarningAmberRounded />} label="Needs Review" value={personalMetrics.attentionRows} detail={`${personalMetrics.offPremiseRows} off-premise records`} accent="#dc2626" />
                </Box>
            </Reveal>

            <Reveal delay={0.06}>
                <RecommendationPanel recommendation={attendanceRecommendation} filteredCount={filteredRows.length} />
            </Reveal>

            {/* Records Table */}
            <Reveal>
                <Box sx={{ ...G.card, borderRadius: '8px', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ px: { xs: 2, md: 3 }, pt: 3, pb: 2, gap: 1.5 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 38, height: 38, borderRadius: '8px', bgcolor: `${colorPalette.deepNavy}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <History sx={{ color: colorPalette.deepNavy, fontSize: '1.2rem' }} />
                            </Box>
                            <Typography variant="h6" fontWeight={800} color={colorPalette.deepNavy}>Attendance Records</Typography>
                            {!historyLoading && <Chip label={`${filteredRows.length} records`} size="small" sx={{ bgcolor: `${colorPalette.oceanBlue}12`, color: colorPalette.oceanBlue, fontWeight: 700, fontSize: '0.7rem', borderRadius: '8px' }} />}
                        </Stack>
                    </Stack>
                    <Divider sx={{ borderColor: 'rgba(10,61,98,0.07)' }} />

                    <Box sx={{ display: { xs: 'block', md: 'none' }, p: 1.5 }}>
                        {historyLoading
                            ? <Stack spacing={1.2}>{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} variant="rounded" height={138} sx={{ borderRadius: '8px' }} />)}</Stack>
                            : paginatedRows.length === 0
                                ? <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }}><Box sx={{ width: 68, height: 68, borderRadius: '8px', bgcolor: 'rgba(10,61,98,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ManageSearchRounded sx={{ fontSize: 36, color: 'rgba(10,61,98,0.25)' }} /></Box><Typography variant="body2" color="text.disabled" fontWeight={600}>No records match the selected filters</Typography><Button size="small" onClick={resetFilters} sx={{ textTransform: 'none', color: colorPalette.oceanBlue, fontWeight: 800, borderRadius: '8px', bgcolor: `${colorPalette.oceanBlue}08`, px: 2 }}>Clear filters</Button></Stack>
                                : <Stack spacing={1.2}>{paginatedRows.map((row, index) => <RecordMobileCard key={`${row.date}-${index}`} row={row} />)}</Stack>}
                    </Box>

                    <TableContainer sx={{ display: { xs: 'none', md: 'block' }, maxHeight: 620, overflowX: 'auto' }}>
                        <Table stickyHeader size="small" sx={{ minWidth: 760 }}>
                            <TableHead>
                                <TableRow sx={{ background: 'rgba(10,61,98,0.04)' }}>
                                    {['Date', 'Clock In', 'Clock Out', 'In Location', 'Out Location', 'Why Out'].map(h => (
                                        <TableCell key={h} sx={{ fontWeight: 900, fontSize: '0.72rem', color: colorPalette.deepNavy, letterSpacing: 0.6, py: 1.4, borderBottom: '1px solid rgba(10,61,98,0.08)', whiteSpace: 'nowrap', bgcolor: '#f8fbfd' }}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historyLoading
                                    ? Array.from({ length: 6 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((__, j) => <TableCell key={j} sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)' }}><Skeleton sx={{ borderRadius: '8px' }} /></TableCell>)}</TableRow>)
                                    : paginatedRows.length === 0
                                        ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 7, border: 0 }}><Stack alignItems="center" spacing={1.5}><Box sx={{ width: 68, height: 68, borderRadius: '8px', bgcolor: 'rgba(10,61,98,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ManageSearchRounded sx={{ fontSize: 36, color: 'rgba(10,61,98,0.25)' }} /></Box><Typography variant="body2" color="text.disabled" fontWeight={600}>No records match the selected filters</Typography><Button size="small" onClick={resetFilters} sx={{ textTransform: 'none', color: colorPalette.oceanBlue, fontWeight: 800, borderRadius: '8px', bgcolor: `${colorPalette.oceanBlue}08`, px: 2 }}>Clear filters</Button></Stack></TableCell></TableRow>
                                        : paginatedRows.map((row, idx) => (
                                            <Motion.tr key={idx} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.025, duration: 0.25, ease: 'easeOut' }} style={{ display: 'table-row' }}>
                                                <TableCell sx={{ ...G.tableCell, fontWeight: 800, color: colorPalette.deepNavy, whiteSpace: 'nowrap' }}>{row.date}</TableCell>
                                                <TableCell sx={{ ...G.tableCell, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: 'text.secondary' }}>{row.clockIn}</TableCell>
                                                <TableCell sx={{ ...G.tableCell, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: 'text.secondary' }}>{row.clockOut}</TableCell>
                                                <TableCell sx={{ ...G.tableCell, whiteSpace: 'normal', maxWidth: 250 }}><Typography variant="body2" color="text.secondary" sx={{ maxWidth: 250, overflowWrap: 'anywhere' }}>{row.inLocation}</Typography></TableCell>
                                                <TableCell sx={{ ...G.tableCell, whiteSpace: 'normal', maxWidth: 250 }}><Typography variant="body2" color="text.secondary" sx={{ maxWidth: 250, overflowWrap: 'anywhere' }}>{row.outLocation}</Typography></TableCell>
                                                <TableCell sx={{ ...G.tableCell, whiteSpace: 'normal', maxWidth: 300 }}><Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, overflowWrap: 'anywhere' }}>{row.whyOut || '—'}</Typography></TableCell>
                                            </Motion.tr>
                                        ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination component="div" count={filteredRows.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[5, 10, 25, 50, 100]} sx={{ borderTop: '1px solid rgba(10,61,98,0.07)', background: 'rgba(10,61,98,0.02)', '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '0.8rem', color: 'text.secondary' } }} />
                </Box>
            </Reveal>
        </Box>
    );
}
