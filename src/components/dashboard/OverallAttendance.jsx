
import {
    Apartment, ArrowDropDown,
    Business,
    Download, EmojiEvents,
    FilterList, History, InsertChart, LocationOn, Person,
    QueryStats, Refresh,
    Search, Shield,
    Star, TableChart, TrendingDown, TrendingUp, Warning
} from '@mui/icons-material';
import {
    Alert, Avatar, Box, Button, Chip, CircularProgress,
    Divider, FormControl, Grid, InputAdornment, InputLabel,
    LinearProgress, Menu, MenuItem, Select, Skeleton, Snackbar,
    Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
    TablePagination, TableRow, Tabs, TextField, Typography
} from '@mui/material';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import Papa from 'papaparse';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Bar, BarChart, CartesianGrid, Cell, ComposedChart,
    Legend, Line, Pie, PieChart, RadialBar, RadialBarChart,
    ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts';
import * as XLSX from 'xlsx';
import { fetchOverallAttendanceRecords, fetchOverallOrgStats } from '../../service/ClockingService';
import coreDataDetails from '../CoreDataDetails';

const { colorPalette } = coreDataDetails;

/* ══════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════════════════════════ */
const G = {
    card: {
        background: 'rgba(255,255,255,0.74)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.62)',
        boxShadow: '0 4px 24px rgba(10,61,98,0.08), inset 0 1px 0 rgba(255,255,255,0.80)',
    },
    cardStrong: {
        background: 'rgba(255,255,255,0.84)',
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        border: '1px solid rgba(255,255,255,0.74)',
        boxShadow: '0 8px 32px rgba(10,61,98,0.12), inset 0 1px 0 rgba(255,255,255,0.90)',
    },
    tile: {
        background: 'rgba(255,255,255,0.14)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.24)',
    },
    heroBg: 'linear-gradient(140deg, #061e30 0%, #0a3560 42%, #073a52 68%, #052840 100%)',
    filterBg: {
        background: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(10,61,98,0.10)',
        boxShadow: '0 2px 16px rgba(10,61,98,0.06)',
    },
    input: {
        '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.7)',
            '&:hover fieldset': { borderColor: colorPalette.oceanBlue },
            '&.Mui-focused fieldset': { borderColor: colorPalette.oceanBlue, borderWidth: 2 },
        },
    },
};

const RANK_LABELS = { admin: 'Administrator', hr: 'HR Manager', supervisor: 'Supervisor', ceo: 'Chief Executive Officer' };
const safe = (v, s = '') => (v != null ? `${v}${s}` : '—');
const parseNum = (v) => (typeof v === 'string' ? parseFloat(v) || 0 : Number(v) || 0);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
const fmtDuration = (clockIn, clockOut) => {
    if (!clockOut) return '—';
    const h = (new Date(clockOut) - new Date(clockIn)) / 3600000;
    return h.toFixed(2);
};

/* ── Process raw API response ── */
function processRawData(raw) {
    if (!raw) return null;
    const stations = raw.stations || {};
    const stationNames = Object.keys(stations);

    const deptMap = {};
    stationNames.forEach((sName) => {
        const s = stations[sName];
        Object.entries(s.departments || {}).forEach(([dName, d]) => {
            if (!deptMap[dName]) deptMap[dName] = { name: dName, headcount: 0, totalHours: 0, totalOvertime: 0, lateCount: 0, overworked: false, stations: [], topPerformers: [] };
            deptMap[dName].headcount += d.headcount || 0;
            deptMap[dName].totalHours += parseNum(d.totalHours);
            deptMap[dName].totalOvertime += parseNum(d.totalOvertime);
            deptMap[dName].lateCount += d.lateCount || 0;
            if (d.overworked) deptMap[dName].overworked = true;
            deptMap[dName].stations.push(sName);
            deptMap[dName].topPerformers.push(...(d.topPerformers || []));
        });
    });

    const departmentBreakdown = Object.values(deptMap).map((d) => ({
        ...d,
        totalHours: d.totalHours.toFixed(1),
        averageHoursPerStaff: d.headcount > 0 ? (d.totalHours / d.headcount).toFixed(1) : '0',
        disciplineRate: d.headcount > 0 ? ((d.lateCount / d.headcount) * 100).toFixed(1) + '%' : '0%',
        topPerformers: d.topPerformers.sort((a, b) => b.score - a.score).slice(0, 10),
    }));

    const topPerfs = raw.topPerformersOverall || [];
    const burnoutRiskCount = topPerfs.filter((p) => p.burnoutLevel === 'High').length;

    const mostActiveStationEntry = stationNames.reduce(
        (best, name) => ((stations[name].totalCheckins || 0) > (best.checkins || 0) ? { name, checkins: stations[name].totalCheckins } : best),
        { name: '—', checkins: 0 }
    );

    const busiestDept = departmentBreakdown.reduce((best, d) => (parseNum(d.totalHours) > parseNum(best?.totalHours || 0) ? d : best), null);
    const overworkedDepts = departmentBreakdown.filter((d) => d.overworked).length;

    const stationList = stationNames.map((name) => ({
        name, ...stations[name],
        totalHours: parseNum(stations[name].totalHours),
        totalOvertime: parseNum(stations[name].totalOvertime),
        efficiencyNum: parseNum(stations[name].efficiencyScore),
        disciplineNum: parseNum(stations[name].disciplineRate),
        departments: Object.entries(stations[name].departments || {}).map(([dName, d]) => ({
            name: dName, ...d,
            totalHoursNum: parseNum(d.totalHours),
            averageHoursNum: parseNum(d.averageHoursPerStaff),
            disciplineNum: parseNum(d.disciplineRate),
        })),
    }));

    return {
        ...raw,
        departmentBreakdown,
        healthSignals: { burnoutRiskCount, mostActiveStation: mostActiveStationEntry.name, busiestDept: busiestDept?.name || '—', overworkedDepts },
        topPerformers: topPerfs,
        stationList,
        allDeptNames: Object.keys(deptMap).sort(),
    };
}

/* ── Performance description helper ── */
const getPerformanceInsight = (p, isTop) => {
    const hrs = parseFloat(p.hours || 0);
    const ot = parseFloat(p.overtime || 0);
    const ar = parseFloat(p.attendanceRate || 0);
    const score = Math.round(p.score || 0);
    if (isTop) {
        if (ar >= 90 && ot < 10) return 'Exemplary attendance with a sustainable workload. A benchmark for peers.';
        if (ar >= 80 && hrs >= 140) return 'Consistent performer with above-standard hours logged this period.';
        if (ot > 15 && ar >= 80) return 'Highly dedicated — note elevated overtime; monitor for burnout risk.';
        return `Reliable contributor with a strong score of ${score}pts. Recognized for consistency.`;
    } else {
        if (ar < 50) return 'Critically low attendance rate. Immediate HR review and support plan required.';
        if (hrs < 80) return 'Significantly below 160h standard. Review leave/absence records urgently.';
        if (ot > 20) return 'High overtime despite low productivity score. Task allocation review recommended.';
        return `Below-average score of ${score}pts. A performance improvement plan is advisable.`;
    }
};

/* ── Export helpers ── */
const exportCSV = (rows, filename) => {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
};
const exportExcel = (rows, filename, sheetName = 'Data') => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
};

/* ══════════════════════════════════════════════════════════════════════════
   AMBIENT ORBS
══════════════════════════════════════════════════════════════════════════ */
const AmbientOrbs = () => (
    <>
        {[
            { s: 440, t: -70, l: -120, c: 'rgba(10,100,180,0.07)', b: 75 },
            { s: 360, t: '38%', r: -90, c: 'rgba(32,178,170,0.06)', b: 60 },
            { s: 520, bot: -140, l: '25%', c: 'rgba(10,61,98,0.05)', b: 85 },
        ].map(({ s, t, l, r, bot, c, b }, i) => (
            <Box key={i} sx={{ position: 'absolute', width: s, height: s, pointerEvents: 'none', zIndex: 0, top: t, left: l, right: r, bottom: bot, borderRadius: '50%', background: c, filter: `blur(${b}px)` }} />
        ))}
    </>
);

/* ══════════════════════════════════════════════════════════════════════════
   REUSABLE PRIMITIVES
══════════════════════════════════════════════════════════════════════════ */
const Reveal = ({ children, delay = 0, y = 22 }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-50px' });
    return (
        <motion.div ref={ref} initial={{ opacity: 0, y }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>
            {children}
        </motion.div>
    );
};

const GlassTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(24px)', border: '1px solid rgba(10,61,98,0.12)', borderRadius: '14px', px: 2, py: 1.5, boxShadow: '0 10px 36px rgba(10,61,98,0.16)', minWidth: 140 }}>
            {label && <Typography variant="caption" fontWeight={800} color={colorPalette.deepNavy} sx={{ display: 'block', mb: 0.6 }}>{label}</Typography>}
            {payload.map((p, i) => (
                <Stack key={i} direction="row" alignItems="center" spacing={1} sx={{ mt: 0.3 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color || p.fill, flexShrink: 0 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{p.name || p.dataKey}:</Typography>
                    <Typography variant="caption" fontWeight={900} color={colorPalette.deepNavy}>{p.value}{p.unit || ''}</Typography>
                </Stack>
            ))}
        </Box>
    );
};

const StatCard = ({ label, value, subtitle, icon, accent, trend, trendLabel, progress, badge }) => (
    <Box sx={{
        ...G.card, p: 2.5, height: '100%', borderRadius: '20px', position: 'relative', overflow: 'hidden', transition: 'all 0.26s ease',
        '&:hover': { transform: 'translateY(-5px)', boxShadow: `0 16px 42px rgba(10,61,98,0.16)` },
        '&::after': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '20px 20px 0 0', background: `linear-gradient(90deg,${accent},${accent}66)` },
        '&::before': { content: '""', position: 'absolute', top: -24, right: -24, width: 84, height: 84, borderRadius: '50%', background: `${accent}10`, zIndex: 0 },
    }}>
        <Stack spacing={1.5} sx={{ position: 'relative', zIndex: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ width: 44, height: 44, borderRadius: '14px', bgcolor: `${accent}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${accent}22` }}>{icon}</Box>
                {trend != null && (
                    <Chip size="small"
                        icon={trend >= 0 ? <TrendingUp sx={{ fontSize: '0.78rem !important', color: '#22c55e !important' }} /> : <TrendingDown sx={{ fontSize: '0.78rem !important', color: '#ef4444 !important' }} />}
                        label={trendLabel || `${Math.abs(trend)}%`}
                        sx={{ height: 22, fontSize: '0.7rem', fontWeight: 800, bgcolor: trend >= 0 ? '#22c55e18' : '#ef444418', color: trend >= 0 ? '#16a34a' : '#dc2626', borderRadius: '8px', '& .MuiChip-label': { px: 0.8 } }} />
                )}
                {badge && <Chip size="small" label={badge} sx={{ height: 22, fontSize: '0.7rem', fontWeight: 800, bgcolor: `${accent}18`, color: accent, borderRadius: '8px' }} />}
            </Stack>
            <Box>
                <Typography variant="h4" fontWeight={900} sx={{ color: accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value ?? <Skeleton width={60} />}</Typography>
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mt: 0.3 }}>{label}</Typography>
                {subtitle && <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.2 }}>{subtitle}</Typography>}
            </Box>
            {progress != null && (
                <Box>
                    <LinearProgress variant="determinate" value={Math.min(Number(progress), 100)} sx={{ height: 6, borderRadius: 99, bgcolor: `${accent}14`, '& .MuiLinearProgress-bar': { bgcolor: accent, borderRadius: 99 } }} />
                    <Typography variant="caption" color="text.disabled" sx={{ mt: 0.4, display: 'block' }}>{Number(progress).toFixed(1)}%</Typography>
                </Box>
            )}
        </Stack>
    </Box>
);

const SectionLabel = ({ children, accent, chip, chipColor, icon }) => (
    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        {icon ? <Box sx={{ color: accent, display: 'flex' }}>{icon}</Box> : <Box sx={{ width: 4, height: 18, borderRadius: 2, bgcolor: accent }} />}
        <Typography variant="subtitle1" fontWeight={800} color={colorPalette.deepNavy}>{children}</Typography>
        {chip && <Chip label={chip} size="small" sx={{ bgcolor: `${chipColor || accent}14`, color: chipColor || accent, fontWeight: 700, fontSize: '0.7rem', borderRadius: '8px' }} />}
    </Stack>
);

/* ══════════════════════════════════════════════════════════════════════════
   HERO BANNER
══════════════════════════════════════════════════════════════════════════ */
const OrgHeroBanner = ({ data, loading, rank, activeTab }) => {
    const ov = data?.overview;
    const tabLabels = ['Records', 'Performance'];
    return (
        <Box sx={{ borderRadius: '24px', background: G.heroBg, position: 'relative', overflow: 'hidden', mb: 3, p: { xs: 3, md: 4 } }}>
            <Box sx={{ position: 'absolute', top: -60, right: -60, width: 230, height: 230, borderRadius: '50%', background: 'rgba(0,180,200,0.10)', filter: 'blur(45px)', pointerEvents: 'none' }} />
            <Box sx={{ position: 'absolute', bottom: -90, left: -90, width: 290, height: 290, borderRadius: '50%', background: 'rgba(10,61,98,0.28)', filter: 'blur(55px)', pointerEvents: 'none' }} />
            <Grid container spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
                <Grid item xs={12} md={5}>
                    <Stack direction="row" alignItems="center" spacing={0.8} mb={0.5}>
                        <Shield sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)' }} />
                        <Typography variant="caption" sx={{ opacity: 0.55, fontWeight: 900, letterSpacing: 2.2, textTransform: 'uppercase', fontSize: '0.66rem', color: '#fff' }}>
                            {RANK_LABELS[rank] || 'Admin'} · {tabLabels[activeTab]} Dashboard
                        </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ opacity: 0.52, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', display: 'block', mb: 0.5, color: '#fff' }}>
                        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </Typography>
                    <Stack direction="row" alignItems="baseline" spacing={1.5} mt={0.5}>
                        <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                            <Typography variant="h2" fontWeight={900} sx={{ fontSize: { xs: '3rem', md: '4.2rem' }, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.28)' }}>
                                {loading ? '—' : safe(ov?.averageStaffEfficiency)}
                            </Typography>
                        </motion.div>
                        <Typography variant="h6" sx={{ opacity: 0.65, color: '#fff' }}>Efficiency</Typography>
                    </Stack>
                    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
                        <Stack direction="row" alignItems="center" spacing={0.8} mt={1}>
                            <TrendingUp sx={{ fontSize: '1rem', color: '#00e5ff', opacity: 0.8 }} />
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                                {loading ? 'Loading…' : `${ov?.activeStaffThisMonth ?? 0} of ${ov?.totalStaff ?? 0} staff active this month`}
                            </Typography>
                        </Stack>
                    </motion.div>
                </Grid>
                <Grid item xs={12} md={7}>
                    <Grid container spacing={1.8}>
                        {[
                            { label: 'Total Staff', val: ov?.totalStaff },
                            { label: 'Active Staff', val: ov?.activeStaffThisMonth },
                            { label: 'Org Hours', val: ov?.totalOrgHours ? `${ov.totalOrgHours}h` : '—' },
                            { label: 'Overtime', val: ov?.totalOrgOvertime ? `${ov.totalOrgOvertime}h` : '—' },
                            { label: 'Inactive Accounts', val: ov?.inactiveAccounts ?? '—' },
                            { label: 'Stations', val: data?.stationList?.length ?? '—' },
                        ].map(({ label, val }, i) => (
                            <Grid item xs={6} sm={4} key={label}>
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                                    <Box sx={{ ...G.tile, p: 1.6, borderRadius: '16px', transition: 'all 0.22s ease', '&:hover': { background: 'rgba(255,255,255,0.22)', transform: 'translateY(-4px)' } }}>
                                        <Typography variant="h5" fontWeight={900} sx={{ fontVariantNumeric: 'tabular-nums', color: '#fff', lineHeight: 1.2 }}>{loading ? '…' : val ?? '—'}</Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.62, color: '#fff', display: 'block', mt: 0.3 }}>{label}</Typography>
                                    </Box>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   TAB NAVIGATION
══════════════════════════════════════════════════════════════════════════ */
const TabNav = ({ activeTab, setActiveTab }) => (
    <Box sx={{ ...G.filterBg, borderRadius: '18px', p: 0.7, mb: 3, display: 'inline-flex', position: 'relative', zIndex: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
            sx={{ minHeight: 0, '& .MuiTabs-indicator': { display: 'none' } }}>
            {[
                { label: 'Records', icon: <TableChart sx={{ fontSize: '1rem' }} /> },
                { label: 'Performance', icon: <EmojiEvents sx={{ fontSize: '1rem' }} /> },
            ].map(({ label, icon }, i) => (
                <Tab key={i} icon={icon} iconPosition="start" label={label}
                    sx={{
                        minHeight: 42, textTransform: 'none', fontWeight: 700, fontSize: '0.88rem',
                        borderRadius: '12px', px: 2.5, gap: 0.8, color: 'text.secondary', transition: 'all 0.22s',
                        '&.Mui-selected': { color: colorPalette.deepNavy, fontWeight: 900, background: 'rgba(255,255,255,0.92)', boxShadow: '0 2px 16px rgba(10,61,98,0.12)' },
                    }} />
            ))}
        </Tabs>
    </Box>
);

/* ══════════════════════════════════════════════════════════════════════════
   EXPORT MENU — shared across tabs
══════════════════════════════════════════════════════════════════════════ */
const ExportMenu = ({ onPDF, onCSV, onExcel, loading = false }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [exporting, setExporting] = useState('');
    const handle = async (type, fn) => {
        setAnchorEl(null); setExporting(type);
        try { await fn(); } finally { setExporting(''); }
    };
    return (
        <>
            <Button variant="contained" startIcon={exporting ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <Download />} endIcon={<ArrowDropDown />}
                onClick={e => setAnchorEl(e.currentTarget)} disabled={!!exporting || loading}
                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', background: colorPalette.oceanGradient, boxShadow: `0 6px 20px ${colorPalette.oceanBlue}40`, '&:hover': { transform: 'translateY(-1px)', boxShadow: `0 8px 28px ${colorPalette.oceanBlue}55` }, transition: 'all 0.22s' }}>
                {exporting ? 'Exporting…' : 'Export'}
            </Button>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
                PaperProps={{ sx: { borderRadius: '14px', border: '1px solid rgba(10,61,98,0.10)', boxShadow: '0 12px 36px rgba(10,61,98,0.16)', mt: 0.8, minWidth: 180 } }}>
                <Box sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(10,61,98,0.07)' }}>
                    <Typography variant="caption" fontWeight={800} color="text.disabled" sx={{ letterSpacing: 0.8, textTransform: 'uppercase', fontSize: '0.63rem' }}>Export Format</Typography>
                </Box>
                {[
                    { label: 'PDF Document', type: 'pdf', fn: onPDF, color: '#ef4444' },
                    { label: 'CSV File', type: 'csv', fn: onCSV, color: '#22c55e' },
                    { label: 'Excel Spreadsheet', type: 'xlsx', fn: onExcel, color: '#1d6f42' },
                ].map(({ label, type, fn, color }) => (
                    <MenuItem key={type} onClick={() => handle(type, fn)} sx={{ py: 1.2, px: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Download sx={{ fontSize: '0.9rem', color }} />
                            </Box>
                            <Typography variant="body2" fontWeight={700}>{label}</Typography>
                        </Stack>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   TAB 0 — OVERVIEW
══════════════════════════════════════════════════════════════════════════ */
const OverviewTab = ({ data, loading, stationList }) => {
    const [selectedStation, setSelectedStation] = useState('');
    const [selectedDept, setSelectedDept] = useState('');

    const ov = data?.overview;
    const hs = data?.healthSignals;
    const depts = data?.departmentBreakdown || [];
    const topPerfs = data?.topPerformers || [];

    const deptOptions = useMemo(() => {
        if (!selectedStation) { const all = new Set(); stationList.forEach(s => s.departments?.forEach(d => all.add(d.name))); return Array.from(all).sort(); }
        const s = stationList.find(s => s.name === selectedStation); return (s?.departments || []).map(d => d.name).sort();
    }, [selectedStation, stationList]);

    const activeDepts = useMemo(() => {
        if (selectedStation) {
            const s = stationList.find(st => st.name === selectedStation); if (!s) return [];
            const mapped = (s.departments || []).map(d => ({ name: d.name, headcount: d.headcount, totalHours: d.totalHoursNum?.toFixed(1) || d.totalHours, totalOvertime: parseNum(d.totalOvertime).toFixed(1), averageHoursPerStaff: d.averageHoursNum?.toFixed(1) || d.averageHoursPerStaff, disciplineRate: d.disciplineRate, overworked: d.overworked }));
            return selectedDept ? mapped.filter(d => d.name === selectedDept) : mapped;
        }
        return selectedDept ? depts.filter(d => d.name === selectedDept) : depts;
    }, [selectedStation, selectedDept, stationList, depts]);

    const deptMaxHours = activeDepts.length ? Math.max(...activeDepts.map(d => parseNum(d.totalHours)), 1) : 1;

    const effNum = ov?.averageStaffEfficiency ? parseFloat(ov.averageStaffEfficiency) : 0;
    const activationPct = ov?.totalStaff ? +((ov.activeStaffThisMonth / ov.totalStaff) * 100).toFixed(1) : 0;
    const overtimePct = ov?.totalOrgHours ? +((parseNum(ov.totalOrgOvertime) / parseNum(ov.totalOrgHours)) * 100).toFixed(1) : 0;

    // Dept bar data
    const deptBarData = [...activeDepts].sort((a, b) => parseNum(b.totalHours) - parseNum(a.totalHours)).slice(0, 10)
        .map(d => ({ name: d.name?.length > 12 ? d.name.slice(0, 11) + '…' : d.name, fullName: d.name, hours: parseNum(d.totalHours), overtime: parseNum(d.totalOvertime), headcount: d.headcount || 0, avg: parseNum(d.averageHoursPerStaff), discipline: parseNum(d.disciplineRate) }));

    const activeStations = selectedStation ? stationList.filter(s => s.name === selectedStation) : stationList;
    const stationBarData = activeStations.map(s => ({ name: s.name?.length > 9 ? s.name.slice(0, 8) + '…' : s.name, fullName: s.name, hours: +(s.totalHours).toFixed(1), overtime: +(s.totalOvertime).toFixed(1), headcount: s.headcount || 0, efficiency: s.efficiencyNum, discipline: s.disciplineNum })).sort((a, b) => b.hours - a.hours);

    const burnoutLevels = { Low: 0, Moderate: 0, High: 0 };
    topPerfs.forEach(p => { if (burnoutLevels[p.burnoutLevel] !== undefined) burnoutLevels[p.burnoutLevel]++; });
    const burnoutData = [{ name: 'Low Risk', value: burnoutLevels.Low, fill: '#22c55e' }, { name: 'Moderate', value: burnoutLevels.Moderate, fill: '#f59e0b' }, { name: 'High Risk', value: burnoutLevels.High, fill: colorPalette.coralSunset }].filter(d => d.value > 0);

    const renderPctLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (percent < 0.08) return null;
        const R = Math.PI / 180; const r = innerRadius + (outerRadius - innerRadius) * 0.56;
        return <text x={cx + r * Math.cos(-midAngle * R)} y={cy + r * Math.sin(-midAngle * R)} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={900}>{`${(percent * 100).toFixed(0)}%`}</text>;
    };

    const overworkedDepts = activeDepts.filter(d => d.overworked);
    const medals = ['🥇', '🥈', '🥉'];

    return (
        <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* Overworked alert */}
            <AnimatePresence>
                {!loading && overworkedDepts.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <Alert severity="warning" variant="filled" icon={<Warning />} sx={{ mb: 2.5, borderRadius: '14px', fontWeight: 700, background: 'linear-gradient(90deg, #f59e0b, #f97316)', color: '#fff' }}>
                            ⚠ {overworkedDepts.length} department{overworkedDepts.length > 1 ? 's' : ''} ({overworkedDepts.map(d => d.name).join(', ')}) flagged as <strong>overworked</strong> (avg &gt;160h/staff). Review recommended.
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filter bar */}
            <Reveal>
                <Box sx={{ ...G.filterBg, borderRadius: '18px', p: 2, mb: 3 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} flexWrap="wrap">
                        <Stack direction="row" alignItems="center" spacing={1}><FilterList sx={{ color: colorPalette.deepNavy, fontSize: '1.1rem' }} /><Typography variant="body2" fontWeight={800} color={colorPalette.deepNavy}>Filter View</Typography></Stack>
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel sx={{ fontWeight: 700, fontSize: '0.82rem' }}>Station</InputLabel>
                            <Select value={selectedStation} label="Station" onChange={e => { setSelectedStation(e.target.value); setSelectedDept(''); }} sx={{ borderRadius: '12px', fontWeight: 700, fontSize: '0.82rem', bgcolor: 'rgba(255,255,255,0.7)' }}>
                                <MenuItem value=""><em>All Stations</em></MenuItem>
                                {stationList.map(s => <MenuItem key={s.name} value={s.name}><Stack direction="row" alignItems="center" spacing={1}><LocationOn sx={{ fontSize: '0.85rem', color: colorPalette.oceanBlue }} /><span>{s.name}</span></Stack></MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel sx={{ fontWeight: 700, fontSize: '0.82rem' }}>Department</InputLabel>
                            <Select value={selectedDept} label="Department" onChange={e => setSelectedDept(e.target.value)} sx={{ borderRadius: '12px', fontWeight: 700, fontSize: '0.82rem', bgcolor: 'rgba(255,255,255,0.7)' }}>
                                <MenuItem value=""><em>All Departments</em></MenuItem>
                                {deptOptions.map(d => <MenuItem key={d} value={d}><Stack direction="row" alignItems="center" spacing={1}><Apartment sx={{ fontSize: '0.85rem', color: colorPalette.seafoamGreen }} /><span>{d}</span></Stack></MenuItem>)}
                            </Select>
                        </FormControl>
                        {(selectedStation || selectedDept) && <Button size="small" variant="outlined" onClick={() => { setSelectedStation(''); setSelectedDept(''); }} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', borderColor: 'rgba(10,61,98,0.22)', color: colorPalette.deepNavy }}>Clear</Button>}
                    </Stack>
                </Box>
            </Reveal>

            {/* Health signals */}
            <Reveal><SectionLabel accent={colorPalette.coralSunset} chip="Automated insights" chipColor={colorPalette.coralSunset}>Health Signals</SectionLabel></Reveal>
            <Grid container spacing={2.5} mb={4}>
                {[
                    { label: 'Burnout Risk Staff', value: safe(hs?.burnoutRiskCount), subtitle: '>20h overtime logged', icon: <Warning sx={{ color: colorPalette.coralSunset, fontSize: '1.3rem' }} />, accent: colorPalette.coralSunset },
                    { label: 'Busiest Department', value: hs?.busiestDept || '—', subtitle: 'Highest hours recorded', icon: <Business sx={{ color: colorPalette.aquaVibrant, fontSize: '1.3rem' }} />, accent: colorPalette.aquaVibrant },
                    { label: 'Most Active Station', value: hs?.mostActiveStation || '—', subtitle: 'Most check-ins this month', icon: <LocationOn sx={{ color: colorPalette.seafoamGreen, fontSize: '1.3rem' }} />, accent: colorPalette.seafoamGreen },
                    { label: 'Overworked Depts', value: safe(hs?.overworkedDepts), subtitle: 'Avg > 160h/staff', icon: <Warning sx={{ color: '#f59e0b', fontSize: '1.3rem' }} />, accent: '#f59e0b' },
                ].map((c, i) => (
                    <Grid item xs={6} sm={3} key={c.label}>
                        <Reveal delay={i * 0.07}>{loading ? <Skeleton variant="rounded" height={145} sx={{ borderRadius: '20px' }} /> : <StatCard {...c} />}</Reveal>
                    </Grid>
                ))}
            </Grid>

            {/* Charts */}
            <Reveal><SectionLabel accent={colorPalette.cyanFresh} chip="Live analytics" icon={<InsertChart sx={{ fontSize: '1.1rem' }} />}>Organisation Insights</SectionLabel></Reveal>
            <Grid container spacing={2.5} mb={4}>
                {/* Dept Hours */}
                <Grid item xs={12} lg={8}>
                    <Reveal delay={0}>
                        <Box sx={{ ...G.card, borderRadius: '22px', p: 2.8, height: '100%' }}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                                <Box sx={{ width: 4, height: 16, borderRadius: 2, bgcolor: colorPalette.oceanBlue }} />
                                <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Department Hours Breakdown</Typography>
                            </Stack>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={deptBarData} margin={{ top: 4, right: 16, left: -16, bottom: 28 }}>
                                    <defs>
                                        <linearGradient id="ov_hoursGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colorPalette.oceanBlue} stopOpacity={0.88} /><stop offset="100%" stopColor={colorPalette.aquaVibrant} stopOpacity={0.66} /></linearGradient>
                                        <linearGradient id="ov_otGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colorPalette.coralSunset} stopOpacity={0.9} /><stop offset="100%" stopColor="#f43f5e" stopOpacity={0.65} /></linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} angle={-28} textAnchor="end" height={44} />
                                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <RTooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(10,61,98,0.04)' }} />
                                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
                                    <Bar dataKey="hours" name="Total Hours" fill="url(#ov_hoursGrad)" radius={[6, 6, 0, 0]} animationDuration={900} />
                                    <Bar dataKey="overtime" name="Overtime" fill="url(#ov_otGrad)" radius={[6, 6, 0, 0]} animationDuration={900} animationBegin={200} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Reveal>
                </Grid>

                {/* Burnout donut */}
                <Grid item xs={12} lg={4}>
                    <Reveal delay={0.07}>
                        <Box sx={{ ...G.card, borderRadius: '22px', p: 2.8, height: '100%' }}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                                <Box sx={{ width: 4, height: 16, borderRadius: 2, bgcolor: colorPalette.coralSunset }} />
                                <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Burnout Risk</Typography>
                            </Stack>
                            <Box sx={{ position: 'relative' }}>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie data={burnoutData} cx="50%" cy="50%" innerRadius={50} outerRadius={76} paddingAngle={4} dataKey="value" animationDuration={1000} labelLine={false} label={renderPctLabel} stroke="rgba(255,255,255,0.6)" strokeWidth={3}>
                                            {burnoutData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                        </Pie>
                                        <RTooltip content={<GlassTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                                    <Typography variant="h6" fontWeight={900} color={colorPalette.deepNavy}>{topPerfs.length}</Typography>
                                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.62rem', fontWeight: 700 }}>Tracked</Typography>
                                </Box>
                            </Box>
                            <Stack spacing={0.7} mt={0.5}>
                                {[{ label: 'Low Risk', color: '#22c55e', val: burnoutLevels.Low }, { label: 'Moderate', color: '#f59e0b', val: burnoutLevels.Moderate }, { label: 'High Risk', color: colorPalette.coralSunset, val: burnoutLevels.High }].map(({ label, color, val }) => (
                                    <Stack key={label} direction="row" alignItems="center" justifyContent="space-between">
                                        <Stack direction="row" alignItems="center" spacing={1}><Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: color }} /><Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography></Stack>
                                        <Typography variant="caption" fontWeight={900} color={colorPalette.deepNavy}>{val}</Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        </Box>
                    </Reveal>
                </Grid>

                {/* Station comparison */}
                {!selectedDept && (
                    <Grid item xs={12} md={7}>
                        <Reveal delay={0.1}>
                            <Box sx={{ ...G.card, borderRadius: '22px', p: 2.8, height: '100%' }}>
                                <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                                    <Box sx={{ width: 4, height: 16, borderRadius: 2, bgcolor: colorPalette.seafoamGreen }} />
                                    <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Station Performance</Typography>
                                </Stack>
                                <ResponsiveContainer width="100%" height={210}>
                                    <ComposedChart data={stationBarData} margin={{ top: 4, right: 24, left: -16, bottom: 24 }}>
                                        <defs><linearGradient id="ov_stnGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colorPalette.seafoamGreen} stopOpacity={0.88} /><stop offset="100%" stopColor={colorPalette.aquaVibrant} stopOpacity={0.6} /></linearGradient></defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} angle={-22} textAnchor="end" height={40} />
                                        <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <RTooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(10,61,98,0.04)' }} />
                                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
                                        <Bar yAxisId="left" dataKey="hours" name="Total Hours" fill="url(#ov_stnGrad)" radius={[6, 6, 0, 0]} animationDuration={900} />
                                        <Bar yAxisId="left" dataKey="overtime" name="Overtime" fill={`${colorPalette.coralSunset}cc`} radius={[6, 6, 0, 0]} animationDuration={900} />
                                        <Line yAxisId="right" type="monotone" dataKey="headcount" name="Headcount" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </Box>
                        </Reveal>
                    </Grid>
                )}

                {/* Org gauges */}
                <Grid item xs={12} md={!selectedDept ? 5 : 6}>
                    <Reveal delay={0.14}>
                        <Box sx={{ ...G.card, borderRadius: '22px', p: 2.8, height: '100%' }}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                                <Box sx={{ width: 4, height: 16, borderRadius: 2, bgcolor: '#6366f1' }} />
                                <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Key Org Gauges</Typography>
                            </Stack>
                            <ResponsiveContainer width="100%" height={180}>
                                <RadialBarChart cx="50%" cy="50%" innerRadius={28} outerRadius={85} data={[{ name: 'Efficiency', value: Math.min(effNum, 100), fill: 'url(#ov_radEff)' }, { name: 'Activation', value: Math.min(activationPct, 100), fill: 'url(#ov_radAct)' }, { name: 'OT Ratio', value: Math.min(overtimePct * 3, 100), fill: 'url(#ov_radOt)' }]} startAngle={180} endAngle={-180} barSize={18}>
                                    <defs>
                                        <linearGradient id="ov_radEff" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={colorPalette.aquaVibrant} /><stop offset="100%" stopColor={colorPalette.seafoamGreen} stopOpacity={0.7} /></linearGradient>
                                        <linearGradient id="ov_radAct" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={colorPalette.oceanBlue} /><stop offset="100%" stopColor={colorPalette.cyanFresh} stopOpacity={0.7} /></linearGradient>
                                        <linearGradient id="ov_radOt" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor={colorPalette.coralSunset} stopOpacity={0.7} /></linearGradient>
                                    </defs>
                                    <RadialBar background={{ fill: 'rgba(10,61,98,0.05)' }} dataKey="value" cornerRadius={10} animationDuration={1200} />
                                    <RTooltip content={<GlassTooltip />} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <Stack direction="row" justifyContent="space-around" mt={0.5}>
                                {[{ label: 'Efficiency', value: `${effNum.toFixed(1)}%`, color: colorPalette.aquaVibrant }, { label: 'Activation', value: `${activationPct.toFixed(1)}%`, color: colorPalette.oceanBlue }, { label: 'OT Ratio', value: `${overtimePct.toFixed(1)}%`, color: '#f59e0b' }].map(({ label, value, color }) => (
                                    <Box key={label} sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" fontWeight={900} sx={{ color, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                                        <Typography variant="caption" color="text.disabled" fontWeight={700}>{label}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    </Reveal>
                </Grid>
            </Grid>

            {/* Dept table + Top Performers */}
            <Grid container spacing={3}>
                <Grid item xs={12} lg={7}>
                    <Reveal>
                        <Box sx={{ ...G.card, borderRadius: '22px', overflow: 'hidden', height: '100%' }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, pt: 3, pb: 2 }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Box sx={{ width: 38, height: 38, borderRadius: '12px', bgcolor: `${colorPalette.deepNavy}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Business sx={{ color: colorPalette.deepNavy, fontSize: '1.15rem' }} /></Box>
                                    <Box>
                                        <Typography variant="h6" fontWeight={800} color={colorPalette.deepNavy}>Department Breakdown</Typography>
                                        <Typography variant="caption" color="text.disabled">{activeDepts.length} departments</Typography>
                                    </Box>
                                </Stack>
                            </Stack>
                            <Divider sx={{ borderColor: 'rgba(10,61,98,0.07)' }} />
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ background: 'rgba(10,61,98,0.04)' }}>
                                            {['Department', 'Staff', 'Hrs', 'Avg/Head', 'Late Rate', 'Status', 'Load'].map(h => (
                                                <TableCell key={h} sx={{ fontWeight: 900, fontSize: '0.7rem', color: colorPalette.deepNavy, letterSpacing: 0.6, py: 1.6, borderBottom: '1px solid rgba(10,61,98,0.08)', whiteSpace: 'nowrap' }}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 7 }).map((__, j) => <TableCell key={j}><Skeleton sx={{ borderRadius: '8px' }} /></TableCell>)}</TableRow>)
                                            : activeDepts.map((dept, idx) => {
                                                const hrs = parseNum(dept.totalHours);
                                                const loadPct = Math.min((hrs / deptMaxHours) * 100, 100);
                                                return (
                                                    <motion.tr key={idx} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }} style={{ display: 'table-row' }}>
                                                        <TableCell sx={{ fontWeight: 700, color: colorPalette.deepNavy, borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.4 }}>{dept.name}</TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.4 }}><Chip label={dept.headcount} size="small" sx={{ height: 20, fontWeight: 800, fontSize: '0.7rem', borderRadius: '7px', bgcolor: `${colorPalette.oceanBlue}10`, color: colorPalette.oceanBlue }} /></TableCell>
                                                        <TableCell sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.4 }}>{dept.totalHours}h</TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.4 }}>{dept.averageHoursPerStaff}h</TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.4 }}><Chip label={dept.disciplineRate} size="small" sx={{ height: 20, fontSize: '0.67rem', fontWeight: 700, borderRadius: '6px', bgcolor: parseNum(dept.disciplineRate) > 20 ? '#ef444418' : '#22c55e14', color: parseNum(dept.disciplineRate) > 20 ? '#dc2626' : '#16a34a' }} /></TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.4 }}>{dept.overworked ? <Chip label="⚠ Overworked" size="small" sx={{ height: 20, fontSize: '0.67rem', fontWeight: 800, borderRadius: '6px', bgcolor: '#ef444418', color: '#dc2626' }} /> : <Chip label="✓ Normal" size="small" sx={{ height: 20, fontSize: '0.67rem', fontWeight: 700, borderRadius: '6px', bgcolor: '#22c55e14', color: '#16a34a' }} />}</TableCell>
                                                        <TableCell sx={{ minWidth: 90, borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.4 }}>
                                                            <LinearProgress variant="determinate" value={loadPct} sx={{ height: 6, borderRadius: 99, bgcolor: `${colorPalette.seafoamGreen}14`, '& .MuiLinearProgress-bar': { bgcolor: colorPalette.seafoamGreen, borderRadius: 99 } }} />
                                                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.62rem' }}>{loadPct.toFixed(0)}%</Typography>
                                                        </TableCell>
                                                    </motion.tr>
                                                );
                                            })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Reveal>
                </Grid>
                <Grid item xs={12} lg={5}>
                    <Reveal delay={0.08}>
                        <Box sx={{ ...G.card, borderRadius: '22px', p: 3, height: '100%' }}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
                                <Box sx={{ width: 44, height: 44, borderRadius: '14px', bgcolor: '#f59e0b14', border: '1px solid #f59e0b22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><EmojiEvents sx={{ color: '#f59e0b' }} /></Box>
                                <Box><Typography variant="h6" fontWeight={800} color={colorPalette.deepNavy}>Top Performers</Typography><Typography variant="caption" color="text.disabled">By attendance score</Typography></Box>
                            </Stack>
                            {loading ? <Stack spacing={1.5}>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: '14px' }} />)}</Stack>
                                : topPerfs.slice(0, 5).map((p, idx) => {
                                    const rs = [{ bg: 'rgba(254,243,199,0.82)', border: 'rgba(253,230,138,0.72)', color: '#d97706' }, { bg: 'rgba(241,245,249,0.82)', border: 'rgba(226,232,240,0.72)', color: '#64748b' }, { bg: 'rgba(255,247,237,0.82)', border: 'rgba(254,215,170,0.72)', color: '#c2410c' }][idx] || { bg: `${colorPalette.oceanBlue}08`, border: `${colorPalette.oceanBlue}22`, color: colorPalette.oceanBlue };
                                    const emailLocal = p.email?.split('@')[0] || '??';
                                    return (
                                        <motion.div key={idx} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06 }}>
                                            <Box sx={{ p: 1.8, borderRadius: '14px', background: rs.bg, border: `1px solid ${rs.border}`, mb: 1.2, '&:hover': { transform: 'translateX(4px)' }, transition: 'all 0.18s' }}>
                                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                                    <Typography sx={{ fontSize: '1.3rem', lineHeight: 1 }}>{medals[idx] || `#${idx + 1}`}</Typography>
                                                    <Avatar sx={{ width: 34, height: 34, bgcolor: colorPalette.deepNavy, color: '#fff', fontSize: '0.7rem', fontWeight: 800 }}>{emailLocal.slice(0, 2).toUpperCase()}</Avatar>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography variant="body2" fontWeight={800} color={colorPalette.deepNavy} noWrap sx={{ fontSize: '0.82rem' }}>{emailLocal}</Typography>
                                                        <Stack direction="row" spacing={0.6} mt={0.2}>
                                                            <Chip label={`${p.hours}h`} size="small" sx={{ height: 17, fontSize: '0.6rem', fontWeight: 700, bgcolor: `${colorPalette.oceanBlue}10`, color: colorPalette.oceanBlue, borderRadius: '5px' }} />
                                                            <Chip label={p.burnoutLevel} size="small" sx={{ height: 17, fontSize: '0.6rem', fontWeight: 700, bgcolor: p.burnoutLevel === 'High' ? '#ef444418' : p.burnoutLevel === 'Moderate' ? '#f59e0b18' : '#22c55e18', color: p.burnoutLevel === 'High' ? '#dc2626' : p.burnoutLevel === 'Moderate' ? '#d97706' : '#16a34a', borderRadius: '5px' }} />
                                                        </Stack>
                                                    </Box>
                                                    <Box sx={{ textAlign: 'right' }}>
                                                        <Typography variant="body2" fontWeight={900} sx={{ color: rs.color }}>{Math.round(p.score)}</Typography>
                                                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>pts</Typography>
                                                    </Box>
                                                </Stack>
                                            </Box>
                                        </motion.div>
                                    );
                                })}
                        </Box>
                    </Reveal>
                </Grid>
            </Grid>
        </Box>
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   TAB 1 — RECORDS
══════════════════════════════════════════════════════════════════════════ */
const RecordsTab = ({ stationList, allDeptNames, user }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filterStation, setFilterStation] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterStartDate, setFilterStartDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; });
    const [filterEndDate, setFilterEndDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const hasFetched = useRef(false);

    const loadRecords = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const params = {};
            if (filterStartDate) params.startDate = filterStartDate;
            if (filterEndDate) params.endDate = filterEndDate;
            const res = await fetchOverallAttendanceRecords(params);
            setRecords(res || []);
        } catch (err) {
            setError(typeof err === 'string' ? err : 'Failed to load records. Ensure the /overall/attendance/records backend route is added.');
        } finally { setLoading(false); }
    }, [filterStartDate, filterEndDate]);

    useEffect(() => {
        if (!hasFetched.current) { hasFetched.current = true; loadRecords(); }
    }, []); // eslint-disable-line

    const processedRecords = useMemo(() => records.map(rec => ({
        name: rec.name || '—',
        email: rec.email || '—',
        date: fmtDate(rec.clock_in),
        rawDate: new Date(rec.clock_in),
        clockIn: fmtTime(rec.clock_in),
        clockOut: rec.clock_out ? fmtTime(rec.clock_out) : '—',
        duration: fmtDuration(rec.clock_in, rec.clock_out),
        station: rec.station || '—',
        department: rec.department || '—',
        timing: rec.isLate ? 'Late' : 'Early',
    })), [records]);

    const deptOptions = useMemo(() => {
        if (!filterStation) return allDeptNames;
        const s = stationList.find(st => st.name === filterStation);
        return (s?.departments || []).map(d => d.name).sort();
    }, [filterStation, stationList, allDeptNames]);

    const filteredRecords = useMemo(() => processedRecords.filter(row => {
        if (filterStation && row.station !== filterStation) return false;
        if (filterDept && row.department !== filterDept) return false;
        if (search) { const s = search.toLowerCase(); if (!row.name.toLowerCase().includes(s) && !row.station.toLowerCase().includes(s) && !row.department.toLowerCase().includes(s)) return false; }
        return true;
    }), [processedRecords, filterStation, filterDept, search]);

    const paginatedRecords = filteredRecords.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const exportRows = filteredRecords.map(r => ({
        'Name': r.name, 'Date': r.date,
        'Clock In': r.clockIn, 'Clock Out': r.clockOut,
        'Station': r.station, 'Department': r.department,
    }));

    const handleExportCSV = () => exportCSV(exportRows, `KMFRI_Records_${Date.now()}.csv`);
    const handleExportExcel = () => exportExcel(exportRows, `KMFRI_Records_${Date.now()}.xlsx`, 'Attendance Records');
    const handleExportPDF = async () => {
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pw = doc.internal.pageSize.getWidth();
        doc.setFillColor(10, 61, 98); doc.rect(0, 0, pw, 36, 'F');
        doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
        doc.text('KMFRI — Attendance Records', pw / 2, 12, { align: 'center' });
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        doc.text(`${filterStation || 'All Stations'} · ${filterDept || 'All Departments'} · ${filterStartDate} → ${filterEndDate}`, pw / 2, 20, { align: 'center' });
        doc.setFontSize(7.5);
        doc.text(`Generated: ${new Date().toLocaleString()} | By: ${user?.name || 'Admin'} | Role: ${RANK_LABELS[user?.rank] || 'Admin'} | ${filteredRecords.length} records`, pw / 2, 28, { align: 'center' });
        autoTable(doc, {
            head: [['Name', 'Date', 'Clock In', 'Clock Out', 'Station', 'Department']],
            body: filteredRecords.map(r => [r.name, r.date, r.clockIn, r.clockOut, r.station, r.department]),
            startY: 40,
            styles: { fontSize: 7.5, cellPadding: 2.2 },
            headStyles: { fillColor: [10, 61, 98], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: { 5: { fontStyle: 'bold' } },
        });
        const tp = doc.internal.getNumberOfPages();
        for (let i = 1; i <= tp; i++) { doc.setPage(i); doc.setFontSize(7); doc.setTextColor(160, 174, 192); doc.text(`Page ${i} of ${tp}  |  KMFRI Digital Attendance Platform  |  Confidential`, pw / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' }); }
        doc.save(`KMFRI_Records_${Date.now()}.pdf`);
    };

    const lateCount = filteredRecords.filter(r => r.timing === 'Late').length;
    const lateRate = filteredRecords.length > 0 ? ((lateCount / filteredRecords.length) * 100).toFixed(1) : 0;

    return (
        <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* Records table */}
            <Reveal>
                <Box sx={{ ...G.card, borderRadius: '22px', overflow: 'hidden' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ px: 3, pt: 3, pb: 2, gap: 1.5 }} flexWrap="wrap">
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: `${colorPalette.deepNavy}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><History sx={{ color: colorPalette.deepNavy, fontSize: '1.2rem' }} /></Box>
                            <Box>
                                <Typography variant="h6" fontWeight={800} color={colorPalette.deepNavy}>Clocking Records</Typography>
                                <Typography variant="caption" color="text.disabled">All stations combined · filtered view</Typography>
                            </Box>
                            <Chip label={`${filteredRecords.length} records`} size="small" sx={{ bgcolor: `${colorPalette.oceanBlue}12`, color: colorPalette.oceanBlue, fontWeight: 700, fontSize: '0.7rem', borderRadius: '8px' }} />
                        </Stack>
                        <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap">
                            <ExportMenu onPDF={handleExportPDF} onCSV={handleExportCSV} onExcel={handleExportExcel} loading={loading} />
                        </Stack>
                    </Stack>

                    <Box sx={{ px: 3, pb: 2.5 }}>
                        <Box sx={{ p: 2.5, borderRadius: '16px', background: 'rgba(10,61,98,0.04)', border: '1px solid rgba(10,61,98,0.08)' }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField fullWidth size="small" label="Search name / station / department" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: '1rem', color: 'text.disabled' }} /></InputAdornment> }}
                                        sx={G.input} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField select fullWidth size="small" label="Station" value={filterStation} onChange={e => { setFilterStation(e.target.value); setFilterDept(''); setPage(0); }} sx={G.input} SelectProps={{ displayEmpty: true, renderValue: selected => selected || 'All Stations' }}>
                                        <MenuItem value=""><em>All Stations</em></MenuItem>
                                        {stationList.map(s => <MenuItem key={s.name} value={s.name}>{s.name}</MenuItem>)}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField select fullWidth size="small" label="Department" value={filterDept} onChange={e => { setFilterDept(e.target.value); setPage(0); }} sx={G.input} SelectProps={{ displayEmpty: true, renderValue: selected => selected || 'All Departments' }}>
                                        <MenuItem value=""><em>All Departments</em></MenuItem>
                                        {deptOptions.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField fullWidth size="small" type="date" label="From Date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={G.input} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField fullWidth size="small" type="date" label="To Date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={G.input} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Button fullWidth variant="contained" onClick={loadRecords} disabled={loading}
                                        startIcon={loading ? <CircularProgress size={13} sx={{ color: '#fff' }} /> : <Refresh />}
                                        sx={{ height: 40, borderRadius: '12px', textTransform: 'none', fontWeight: 700, background: colorPalette.oceanGradient }}>
                                        {loading ? 'Loading…' : 'Apply Date Range'}
                                    </Button>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Button fullWidth variant="outlined" onClick={() => { setFilterStation(''); setFilterDept(''); setSearch(''); setPage(0); }}
                                        sx={{ height: 40, borderRadius: '12px', textTransform: 'none', fontWeight: 700, borderColor: 'rgba(10,61,98,0.22)', color: colorPalette.deepNavy }}>
                                        Clear Filters
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(10,61,98,0.07)' }} />

                    {error && <Alert severity="warning" sx={{ m: 2, borderRadius: '12px' }}>{error}</Alert>}

                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ background: 'rgba(10,61,98,0.04)' }}>
                                    {['Name', 'Date', 'Clock In', 'Clock Out', 'Station', 'Department'].map(h => (
                                        <TableCell key={h} sx={{ fontWeight: 900, fontSize: '0.7rem', color: colorPalette.deepNavy, letterSpacing: 0.6, py: 1.6, borderBottom: '1px solid rgba(10,61,98,0.08)', whiteSpace: 'nowrap' }}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading
                                    ? Array.from({ length: 8 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((__, j) => <TableCell key={j} sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)' }}><Skeleton sx={{ borderRadius: '6px' }} /></TableCell>)}</TableRow>)
                                    : paginatedRecords.length === 0
                                        ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8, border: 0 }}>
                                            <Stack alignItems="center" spacing={1.5}>
                                                <Box sx={{ width: 64, height: 64, borderRadius: '20px', bgcolor: 'rgba(10,61,98,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><History sx={{ fontSize: 34, color: 'rgba(10,61,98,0.25)' }} /></Box>
                                                <Typography variant="body2" color="text.disabled" fontWeight={600}>{error ? 'Backend route not available' : 'No records match current filters'}</Typography>
                                                <Button size="small" onClick={() => { setFilterStation(''); setFilterDept(''); setSearch(''); }} sx={{ textTransform: 'none', color: colorPalette.oceanBlue, fontWeight: 700, borderRadius: '10px', bgcolor: `${colorPalette.oceanBlue}08`, px: 2 }}>Clear filters</Button>
                                            </Stack>
                                        </TableCell></TableRow>
                                        : paginatedRecords.map((row, idx) => (
                                            <motion.tr key={idx} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }} style={{ display: 'table-row' }}>
                                                <TableCell sx={{ fontWeight: 700, color: colorPalette.deepNavy, borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.4, whiteSpace: 'nowrap' }}>{row.name}</TableCell>
                                                <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.4, whiteSpace: 'nowrap', color: 'text.secondary' }}>{row.date}</TableCell>
                                                <TableCell sx={{ fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.4 }}>{row.clockIn}</TableCell>
                                                <TableCell sx={{ fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.4, color: 'text.secondary' }}>{row.clockOut}</TableCell>
                                                <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.4 }}><Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 120 }}>{row.station}</Typography></TableCell>
                                                <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.4 }}><Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 130 }}>{row.department}</Typography></TableCell>
                                            </motion.tr>
                                        ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination component="div" count={filteredRecords.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[10, 15, 25, 50, 100]}
                        sx={{ borderTop: '1px solid rgba(10,61,98,0.07)', background: 'rgba(10,61,98,0.02)', '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '0.8rem', color: 'text.secondary' } }} />
                </Box>
            </Reveal>
        </Box>
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   PERFORMER CARD
══════════════════════════════════════════════════════════════════════════ */
const PerformerCard = ({ performer, rank, isBottom }) => {
    const emailLocal = performer.email?.split('@')[0] || '??';
    const hrs = parseFloat(performer.hours || 0);
    const ot = parseFloat(performer.overtime || 0);
    const ar = parseFloat(performer.attendanceRate || 0);
    const score = Math.round(performer.score || 0);
    const description = getPerformanceInsight(performer, isBottom);

    const rankStyles = isBottom
        ? { bg: 'rgba(254,242,242,0.88)', border: 'rgba(252,165,165,0.5)', accent: '#ef4444', label: `⚠ #${rank}`, chipBg: '#ef444414' }
        : rank === 1 ? { bg: 'rgba(254,243,199,0.9)', border: 'rgba(253,230,138,0.7)', accent: '#d97706', label: '🥇 #1', chipBg: '#f59e0b14' }
            : rank === 2 ? { bg: 'rgba(241,245,249,0.88)', border: 'rgba(203,213,225,0.7)', accent: '#64748b', label: '🥈 #2', chipBg: '#94a3b814' }
                : { bg: 'rgba(255,247,237,0.88)', border: 'rgba(254,215,170,0.65)', accent: '#c2410c', label: '🥉 #3', chipBg: '#f9731614' };

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: rank * 0.08, ease: [0.22, 1, 0.36, 1] }}>
            <Box sx={{ p: 2.5, borderRadius: '18px', background: rankStyles.bg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${rankStyles.border}`, transition: 'all 0.22s', '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 12px 32px ${rankStyles.accent}22` } }}>
                <Stack direction="row" alignItems="flex-start" spacing={2}>
                    <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
                        <Typography sx={{ fontSize: '2rem', lineHeight: 1, mb: 0.5 }}>{isBottom ? '⚠' : rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.65rem', color: rankStyles.accent, display: 'block' }}>{isBottom ? `#${rank} Bottom` : `#${rank} Top`}</Typography>
                    </Box>
                    <Avatar sx={{ width: 48, height: 48, bgcolor: rankStyles.accent + '22', color: rankStyles.accent, fontSize: '1rem', fontWeight: 900, border: `2px solid ${rankStyles.accent}44`, flexShrink: 0 }}>{emailLocal.slice(0, 2).toUpperCase()}</Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={900} color={colorPalette.deepNavy} noWrap>{emailLocal}</Typography>
                        <Typography variant="caption" color="text.disabled" noWrap>{performer.email}</Typography>
                        <Stack direction="row" spacing={0.8} mt={0.8} flexWrap="wrap" useFlexGap>
                            {hrs > 0 && <Chip label={`${hrs.toFixed(1)}h logged`} size="small" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: `${colorPalette.oceanBlue}10`, color: colorPalette.oceanBlue, borderRadius: '6px' }} />}
                            {ot > 0 && <Chip label={`+${ot.toFixed(1)}h OT`} size="small" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: '#f59e0b12', color: '#d97706', borderRadius: '6px' }} />}
                            {ar > 0 && <Chip label={`${ar.toFixed(1)}% attend.`} size="small" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: rankStyles.chipBg, color: rankStyles.accent, borderRadius: '6px' }} />}
                            <Chip label={performer.burnoutLevel || 'Low'} size="small" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: performer.burnoutLevel === 'High' ? '#ef444414' : performer.burnoutLevel === 'Moderate' ? '#f59e0b12' : '#22c55e12', color: performer.burnoutLevel === 'High' ? '#dc2626' : performer.burnoutLevel === 'Moderate' ? '#d97706' : '#16a34a', borderRadius: '6px' }} />
                        </Stack>
                    </Box>
                    <Box sx={{ textAlign: 'center', flexShrink: 0, p: 1.5, borderRadius: '14px', bgcolor: `${rankStyles.accent}12`, border: `1px solid ${rankStyles.accent}22` }}>
                        <Typography variant="h5" fontWeight={900} sx={{ color: rankStyles.accent, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{score}</Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem', fontWeight: 700, display: 'block' }}>SCORE</Typography>
                    </Box>
                </Stack>
                {/* Insight bar */}
                <Box sx={{ mt: 1.8, p: 1.3, borderRadius: '10px', background: `${rankStyles.accent}08`, border: `1px dashed ${rankStyles.accent}28` }}>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                        {isBottom ? <Warning sx={{ fontSize: '0.85rem', color: rankStyles.accent, mt: 0.1, flexShrink: 0 }} /> : <Star sx={{ fontSize: '0.85rem', color: rankStyles.accent, mt: 0.1, flexShrink: 0 }} />}
                        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.7, fontSize: '0.69rem' }}>
                            <strong style={{ color: rankStyles.accent }}>{isBottom ? 'Action Needed: ' : 'Recognition: '}</strong>{description}
                        </Typography>
                    </Stack>
                </Box>
                {/* Score bar */}
                {score > 0 && (
                    <Box sx={{ mt: 1.2 }}>
                        <Stack direction="row" justifyContent="space-between" mb={0.4}>
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.62rem', fontWeight: 700 }}>PERFORMANCE SCORE</Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.62rem', fontWeight: 900, color: rankStyles.accent }}>{score} pts</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={Math.min((score / 200) * 100, 100)} sx={{ height: 5, borderRadius: 99, bgcolor: `${rankStyles.accent}14`, '& .MuiLinearProgress-bar': { bgcolor: rankStyles.accent, borderRadius: 99 } }} />
                    </Box>
                )}
            </Box>
        </motion.div>
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   TAB 2 — PERFORMANCE
══════════════════════════════════════════════════════════════════════════ */
const PerformanceTab = ({ data, stationList, allDeptNames, user }) => {
    const [scope, setScope] = useState('overall'); // 'overall' | 'station' | 'department'
    const [perfStation, setPerfStation] = useState('');
    const [perfDept, setPerfDept] = useState('');

    const allOverall = data?.topPerformers || [];

    // Enrich station/dept performers with full data from allOverall where possible
    const enrichPerformers = (partials) => partials.map(p => {
        const full = allOverall.find(f => f.email === p.email);
        return full ? { ...p, ...full } : { ...p, hours: '—', overtime: '—', attendanceRate: '—', burnoutLevel: 'N/A' };
    });

    const currentPerformers = useMemo(() => {
        if (scope === 'overall') return allOverall;
        if (scope === 'station' && perfStation) {
            const s = stationList.find(st => st.name === perfStation);
            return enrichPerformers(s?.topPerformers || []);
        }
        if (scope === 'department' && perfDept) {
            const d = data?.departmentBreakdown?.find(dep => dep.name === perfDept);
            return enrichPerformers(d?.topPerformers || []);
        }
        return [];
    }, [scope, perfStation, perfDept, allOverall, stationList, data]); // eslint-disable-line

    const topThree = currentPerformers.slice(0, 3);

    const perfDeptOptions = useMemo(() => {
        if (!perfStation) return allDeptNames;
        const s = stationList.find(st => st.name === perfStation);
        return (s?.departments || []).map(d => d.name).sort();
    }, [perfStation, stationList, allDeptNames]);

    const exportPerformers = (list, label) => list.map((p, i) => ({
        'Rank': `#${i + 1}`, 'Email': p.email, 'Hours': p.hours, 'Overtime': p.overtime,
        'Attendance Rate': p.attendanceRate, 'Score': Math.round(p.score || 0), 'Category': label,
    }));

    const allExportRows = [
        ...exportPerformers(topThree, 'Top Performer'),
    ];

    const handleExportCSV = () => exportCSV(allExportRows, `KMFRI_Performance_${scope}_${Date.now()}.csv`);
    const handleExportExcel = () => exportExcel(allExportRows, `KMFRI_Performance_${scope}_${Date.now()}.xlsx`, 'Performance');
    const handleExportPDF = async () => {
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pw = doc.internal.pageSize.getWidth();
        doc.setFillColor(10, 61, 98); doc.rect(0, 0, pw, 36, 'F');
        doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
        doc.text('KMFRI — Staff Performance Report', pw / 2, 12, { align: 'center' });
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        const scopeLabel = scope === 'overall' ? 'Overall Organisation' : scope === 'station' ? `Station: ${perfStation}` : `Department: ${perfDept}`;
        doc.text(`${scopeLabel} · ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`, pw / 2, 20, { align: 'center' });
        doc.setFontSize(7.5);
        doc.text(`Generated: ${new Date().toLocaleString()} | By: ${user?.name || 'Admin'} | Role: ${RANK_LABELS[user?.rank] || 'Admin'}`, pw / 2, 28, { align: 'center' });

        if (topThree.length > 0) {
            doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(10, 61, 98);
            doc.text('Top 3 Performers', 14, 44);
            autoTable(doc, {
                head: [['Rank', 'Email', 'Hours', 'Overtime', 'Attendance Rate', 'Score', 'Insight']],
                body: topThree.map((p, i) => [`#${i + 1} TOP`, p.email, `${p.hours}h`, `${p.overtime}h`, p.attendanceRate, Math.round(p.score || 0), getPerformanceInsight(p, false)]),
                startY: 48, styles: { fontSize: 7.5, cellPadding: 2 },
                headStyles: { fillColor: [10, 61, 98], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
            });
        }
        const tp = doc.internal.getNumberOfPages();
        for (let i = 1; i <= tp; i++) { doc.setPage(i); doc.setFontSize(7); doc.setTextColor(160, 174, 192); doc.text(`Page ${i} of ${tp}  |  KMFRI Digital Attendance Platform  |  HR Confidential`, pw / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' }); }
        doc.save(`KMFRI_Performance_${scope}_${Date.now()}.pdf`);
    };

    const scopeReady = scope === 'overall' || (scope === 'station' && perfStation) || (scope === 'department' && perfDept);

    return (
        <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* Scope selector */}
            <Reveal>
                <Box sx={{ ...G.filterBg, borderRadius: '20px', p: 2.5, mb: 3 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} flexWrap="wrap">
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <EmojiEvents sx={{ color: colorPalette.deepNavy }} />
                            <Typography variant="body2" fontWeight={800} color={colorPalette.deepNavy}>Performance Scope</Typography>
                        </Stack>
                        {[
                            { key: 'overall', label: 'Overall Org', icon: <Business sx={{ fontSize: '0.9rem' }} /> },
                            { key: 'station', label: 'By Station', icon: <LocationOn sx={{ fontSize: '0.9rem' }} /> },
                            { key: 'department', label: 'By Department', icon: <Apartment sx={{ fontSize: '0.9rem' }} /> },
                        ].map(({ key, label, icon }) => (
                            <Button key={key} startIcon={icon} variant={scope === key ? 'contained' : 'outlined'}
                                onClick={() => { setScope(key); setPerfStation(''); setPerfDept(''); }}
                                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', ...(scope === key ? { background: colorPalette.oceanGradient, boxShadow: `0 4px 16px ${colorPalette.oceanBlue}40` } : { borderColor: 'rgba(10,61,98,0.22)', color: colorPalette.deepNavy, bgcolor: 'rgba(255,255,255,0.6)' }) }}>
                                {label}
                            </Button>
                        ))}
                        {scope === 'station' && (
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel sx={{ fontWeight: 700, fontSize: '0.82rem' }}>Select Station</InputLabel>
                                <Select value={perfStation} label="Select Station" displayEmpty renderValue={selected => selected || 'Choose a station…'} onChange={e => setPerfStation(e.target.value)} sx={{ borderRadius: '12px', fontWeight: 700, fontSize: '0.82rem', bgcolor: 'rgba(255,255,255,0.7)' }}>
                                    <MenuItem value=""><em>Choose a station…</em></MenuItem>
                                    {stationList.map(s => <MenuItem key={s.name} value={s.name}><Stack direction="row" alignItems="center" spacing={1}><LocationOn sx={{ fontSize: '0.85rem', color: colorPalette.oceanBlue }} /><span>{s.name}</span></Stack></MenuItem>)}
                                </Select>
                            </FormControl>
                        )}
                        {scope === 'department' && (
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel sx={{ fontWeight: 700, fontSize: '0.82rem' }}>Select Department</InputLabel>
                                <Select value={perfDept} label="Select Department" displayEmpty renderValue={selected => selected || 'Choose a department…'} onChange={e => setPerfDept(e.target.value)} sx={{ borderRadius: '12px', fontWeight: 700, fontSize: '0.82rem', bgcolor: 'rgba(255,255,255,0.7)' }}>
                                    <MenuItem value=""><em>Choose a department…</em></MenuItem>
                                    {allDeptNames.map(d => <MenuItem key={d} value={d}><Stack direction="row" alignItems="center" spacing={1}><Apartment sx={{ fontSize: '0.85rem', color: colorPalette.seafoamGreen }} /><span>{d}</span></Stack></MenuItem>)}
                                </Select>
                            </FormControl>
                        )}
                        {scopeReady && currentPerformers.length > 0 && (
                            <Box sx={{ ml: 'auto' }}>
                                <ExportMenu onPDF={handleExportPDF} onCSV={handleExportCSV} onExcel={handleExportExcel} />
                            </Box>
                        )}
                    </Stack>
                </Box>
            </Reveal>

            {!scopeReady ? (
                <Box sx={{ ...G.card, borderRadius: '22px', p: 6, textAlign: 'center' }}>
                    <EmojiEvents sx={{ fontSize: 52, color: 'rgba(10,61,98,0.18)', mb: 2 }} />
                    <Typography variant="h6" fontWeight={800} color="text.disabled">Select a {scope} to view performance rankings</Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>Use the filter above to choose your scope</Typography>
                </Box>
            ) : currentPerformers.length === 0 ? (
                <Box sx={{ ...G.card, borderRadius: '22px', p: 6, textAlign: 'center' }}>
                    <Person sx={{ fontSize: 52, color: 'rgba(10,61,98,0.18)', mb: 2 }} />
                    <Typography variant="h6" fontWeight={800} color="text.disabled">No performance data for this selection</Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>This may mean no activity was recorded this month for this {scope}</Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {/* Top Performers */}
                    <Grid item xs={12} lg={6}>
                        <Reveal>
                            <Box sx={{ ...G.card, borderRadius: '22px', p: 3, height: '100%' }}>
                                <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
                                    <Box sx={{ width: 44, height: 44, borderRadius: '14px', bgcolor: '#f59e0b14', border: '1px solid #f59e0b22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><EmojiEvents sx={{ color: '#f59e0b' }} /></Box>
                                    <Box>
                                        <Typography variant="h6" fontWeight={800} color={colorPalette.deepNavy}>Top 3 Performers</Typography>
                                        <Typography variant="caption" color="text.disabled">
                                            {scope === 'overall' ? 'Best performers across the organisation' : scope === 'station' ? `Best in ${perfStation}` : `Best in ${perfDept}`}
                                        </Typography>
                                    </Box>
                                    <Chip label={`${topThree.length} shown`} size="small" sx={{ ml: 'auto', bgcolor: '#f59e0b12', color: '#d97706', fontWeight: 700, borderRadius: '8px', fontSize: '0.7rem' }} />
                                </Stack>
                                <Stack spacing={1.8}>
                                    {topThree.length > 0 ? topThree.map((p, i) => <PerformerCard key={i} performer={p} rank={i + 1} isBottom={false} />)
                                        : <Box sx={{ p: 4, textAlign: 'center' }}><Typography variant="body2" color="text.disabled">No performers available</Typography></Box>}
                                </Stack>
                                {/* Formula note */}
                                {/* <Box sx={{ mt: 2.5, p: 1.8, borderRadius: '12px', background: 'rgba(10,61,98,0.04)', border: '1px dashed rgba(10,61,98,0.12)' }}>
                                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.64rem', lineHeight: 1.7, display: 'block' }}>
                                        <strong style={{ color: colorPalette.deepNavy }}>Score Formula:</strong> (Hours × 0.6) + (Early arrivals × 2) − (Late arrivals × 1.5) + (Overtime × 0.5).
                                        Higher scores reflect consistent attendance and punctuality.
                                    </Typography>
                                </Box> */}
                            </Box>
                        </Reveal>
                    </Grid>

                    {/* Bottom Performers */}

                    {/* Summary table */}
                    {currentPerformers.length > 3 && (
                        <Grid item xs={12}>
                            <Reveal delay={0.15}>
                                <Box sx={{ ...G.card, borderRadius: '22px', overflow: 'hidden' }}>
                                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 3, py: 2.5 }}>
                                        <QueryStats sx={{ color: colorPalette.deepNavy }} />
                                        <Typography variant="h6" fontWeight={800} color={colorPalette.deepNavy}>Full Performance Rankings</Typography>
                                        <Chip label={`${currentPerformers.length} staff`} size="small" sx={{ bgcolor: `${colorPalette.oceanBlue}12`, color: colorPalette.oceanBlue, fontWeight: 700, borderRadius: '8px', fontSize: '0.7rem' }} />
                                    </Stack>
                                    <Divider sx={{ borderColor: 'rgba(10,61,98,0.07)' }} />
                                    <TableContainer sx={{ maxHeight: 400 }}>
                                        <Table size="small" stickyHeader>
                                            <TableHead>
                                                <TableRow>
                                                    {['Rank', 'Email', 'Hours', 'Overtime', 'Attendance', 'Burnout', 'Score', 'Grade'].map(h => (
                                                        <TableCell key={h} sx={{ fontWeight: 900, fontSize: '0.7rem', color: colorPalette.deepNavy, letterSpacing: 0.6, py: 1.6, background: 'rgba(10,61,98,0.04)', borderBottom: '1px solid rgba(10,61,98,0.08)', whiteSpace: 'nowrap' }}>{h}</TableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {currentPerformers.map((p, idx) => {
                                                    const isTop = idx < 3;
                                                    const isLow = idx >= currentPerformers.length - 3;
                                                    const scoreNum = Math.round(p.score || 0);
                                                    return (
                                                        <TableRow key={idx} sx={{ bgcolor: isTop ? 'rgba(251,191,36,0.06)' : isLow ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                                                            <TableCell sx={{ fontWeight: 800, borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.3 }}>
                                                                <Stack direction="row" alignItems="center" spacing={0.8}>
                                                                    <Typography sx={{ fontSize: '0.9rem' }}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : isLow ? '⚠' : ''}</Typography>
                                                                    <Typography variant="body2" fontWeight={700} color={isTop ? '#d97706' : isLow ? '#dc2626' : 'text.secondary'}>#{idx + 1}</Typography>
                                                                </Stack>
                                                            </TableCell>
                                                            <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.3, color: colorPalette.deepNavy, fontWeight: 600, fontSize: '0.8rem' }}>{p.email?.split('@')[0]}</TableCell>
                                                            <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.3, fontVariantNumeric: 'tabular-nums' }}>{p.hours !== undefined ? `${parseFloat(p.hours || 0).toFixed(1)}h` : '—'}</TableCell>
                                                            <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.3, fontVariantNumeric: 'tabular-nums' }}>{p.overtime !== undefined ? `${parseFloat(p.overtime || 0).toFixed(1)}h` : '—'}</TableCell>
                                                            <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.3 }}>{p.attendanceRate || '—'}</TableCell>
                                                            <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.3 }}>
                                                                {p.burnoutLevel && p.burnoutLevel !== 'N/A' ? <Chip label={p.burnoutLevel} size="small" sx={{ height: 19, fontSize: '0.62rem', fontWeight: 700, borderRadius: '6px', bgcolor: p.burnoutLevel === 'High' ? '#ef444414' : p.burnoutLevel === 'Moderate' ? '#f59e0b12' : '#22c55e12', color: p.burnoutLevel === 'High' ? '#dc2626' : p.burnoutLevel === 'Moderate' ? '#d97706' : '#16a34a' }} /> : '—'}
                                                            </TableCell>
                                                            <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.3, fontWeight: 900, color: isTop ? '#d97706' : isLow ? '#dc2626' : colorPalette.deepNavy, fontVariantNumeric: 'tabular-nums' }}>{scoreNum}</TableCell>
                                                            <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.3 }}>
                                                                <Chip label={isTop ? '⭐ Top' : isLow ? '⚠ Review' : '✓ Active'} size="small" sx={{ height: 19, fontSize: '0.62rem', fontWeight: 700, borderRadius: '6px', bgcolor: isTop ? '#f59e0b14' : isLow ? '#ef444414' : `${colorPalette.oceanBlue}10`, color: isTop ? '#d97706' : isLow ? '#dc2626' : colorPalette.oceanBlue }} />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            </Reveal>
                        </Grid>
                    )}
                </Grid>
            )}
        </Box>
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export default function OverallAttendanceStats({ readOnly = false }) {
    const { user } = useSelector(s => s.currentUser);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    const notify = (msg, sev = 'success') => setSnack({ open: true, message: msg, severity: sev });

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetchOverallOrgStats();
            setData(processRawData(res));
        } catch {
            notify('Failed to load organisation data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []); // eslint-disable-line

    const stationList = data?.stationList || [];
    const allDeptNames = data?.allDeptNames || [];

    return (
        <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', position: 'relative' }}>
            <AmbientOrbs />

            <Snackbar open={snack.open} autoHideDuration={5000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert severity={snack.severity} variant="filled" elevation={6} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: '14px', fontWeight: 700 }}>{snack.message}</Alert>
            </Snackbar>

            {/* Hero */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <OrgHeroBanner data={data} loading={loading} rank={user?.rank} activeTab={activeTab} />
            </motion.div>

            {/* Toolbar */}
            <Reveal>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2.5} flexWrap="wrap" gap={2} sx={{ position: 'relative', zIndex: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Chip label={RANK_LABELS[user?.rank] || 'Admin'} size="small"
                            icon={<Shield sx={{ fontSize: '0.78rem !important', color: `${colorPalette.aquaVibrant} !important` }} />}
                            sx={{ bgcolor: `${colorPalette.aquaVibrant}12`, color: colorPalette.deepNavy, fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${colorPalette.aquaVibrant}28`, borderRadius: '8px' }} />
                        <Button variant="outlined"
                            startIcon={loading ? <CircularProgress size={13} sx={{ color: colorPalette.deepNavy }} /> : <Refresh sx={{ fontSize: '1rem' }} />}
                            onClick={loadData} disabled={loading}
                            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(12px)', borderColor: 'rgba(10,61,98,0.15)', color: colorPalette.deepNavy, '&:hover': { borderColor: colorPalette.oceanBlue, bgcolor: 'rgba(10,61,98,0.06)' } }}>
                            Refresh
                        </Button>
                    </Stack>
                </Stack>
            </Reveal>

            {/* Tab panels */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
                    {activeTab === 0 && <RecordsTab stationList={stationList} allDeptNames={allDeptNames} user={user} />}
                    {activeTab === 1 && <PerformanceTab data={data} stationList={stationList} allDeptNames={allDeptNames} user={user} />}
                </motion.div>
            </AnimatePresence>
        </Box>
    );
}