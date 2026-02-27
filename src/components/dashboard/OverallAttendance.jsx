import {
    AccessTime,
    Apartment,
    ArrowDropDown, Business, CheckCircle,
    Download, EmojiEvents,
    FilterList,
    InsertChart,
    LocationOn,
    Person,
    QueryStats, Refresh, Schedule,
    Shield, TrendingDown, TrendingUp, Warning,
    WorkHistory
} from '@mui/icons-material';
import {
    Alert, Avatar, Box, Button, Chip, CircularProgress,
    Divider, FormControl, Grid, InputLabel,
    LinearProgress, Menu, MenuItem, Select, Skeleton,
    Snackbar, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow,
    Typography
} from '@mui/material';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Bar, BarChart, CartesianGrid, Cell, ComposedChart,
    Legend, Line, Pie, PieChart, RadialBar, RadialBarChart,
    ResponsiveContainer,
    Tooltip as RTooltip, XAxis, YAxis
} from 'recharts';
import { fetchOverallOrgStats } from '../../service/ClockingService';
import coreDataDetails from '../CoreDataDetails';

const { colorPalette } = coreDataDetails;

/* ══════════════════════════════════════════════════════════════════════════
   GLASS DESIGN TOKENS
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
};

const ACCENT_COLORS = [
    colorPalette.oceanBlue, colorPalette.aquaVibrant, colorPalette.seafoamGreen,
    '#f59e0b', colorPalette.coralSunset, '#6366f1', '#ec4899', '#14b8a6',
    '#8b5cf6', '#0ea5e9', '#22c55e', '#f97316',
];

const safe = (v, s = '') => (v != null ? `${v}${s}` : '—');
const parseNum = (v) => (typeof v === 'string' ? parseFloat(v) || 0 : Number(v) || 0);

const RANK_LABELS = {
    admin: 'Administrator', hr: 'HR Manager',
    supervisor: 'Supervisor', ceo: 'Chief Executive Officer',
};

/* ══════════════════════════════════════════════════════════════════════════
   DATA PROCESSING HELPERS
══════════════════════════════════════════════════════════════════════════ */
function processRawData(raw) {
    if (!raw) return null;

    const stations = raw.stations || {};
    const stationNames = Object.keys(stations);

    /* ── Flatten departments across all stations ── */
    const deptMap = {};
    stationNames.forEach((sName) => {
        const s = stations[sName];
        Object.entries(s.departments || {}).forEach(([dName, d]) => {
            if (!deptMap[dName]) {
                deptMap[dName] = {
                    name: dName,
                    headcount: 0, totalHours: 0, totalOvertime: 0,
                    lateCount: 0, overworked: false,
                    stations: [], topPerformers: [],
                };
            }
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
        topPerformers: d.topPerformers.sort((a, b) => b.score - a.score).slice(0, 3),
    }));

    /* ── Health signals ── */
    const topPerfs = raw.topPerformersOverall || [];
    const burnoutRiskCount = topPerfs.filter((p) => p.burnoutLevel === 'High').length;

    // Station with most check-ins
    const mostActiveStationEntry = stationNames.reduce(
        (best, name) =>
            (stations[name].totalCheckins || 0) > (best.checkins || 0)
                ? { name, checkins: stations[name].totalCheckins }
                : best,
        { name: '—', checkins: 0 }
    );

    // Department with highest hours
    const busiestDept = departmentBreakdown.reduce(
        (best, d) =>
            parseNum(d.totalHours) > parseNum(best?.totalHours || 0) ? d : best,
        null
    );

    // Station with highest discipline issues
    const laxStation = stationNames.reduce(
        (worst, name) => {
            const rate = parseNum(stations[name].disciplineRate);
            return rate > (worst.rate || 0) ? { name, rate } : worst;
        },
        { name: '—', rate: 0 }
    );

    // Overworked departments
    const overworkedDepts = departmentBreakdown.filter((d) => d.overworked).length;

    const healthSignals = {
        burnoutRiskCount,
        mostActiveStation: mostActiveStationEntry.name,
        chronicLatenessDept: busiestDept?.name || '—',
        laxStation: laxStation.name,
        overworkedDepts,
    };

    /* ── Station list for filters ── */
    const stationList = stationNames.map((name) => ({
        name,
        ...stations[name],
        totalHours: parseNum(stations[name].totalHours),
        totalOvertime: parseNum(stations[name].totalOvertime),
        efficiencyNum: parseNum(stations[name].efficiencyScore),
        disciplineNum: parseNum(stations[name].disciplineRate),
        departments: Object.entries(stations[name].departments || {}).map(([dName, d]) => ({
            name: dName,
            ...d,
            totalHoursNum: parseNum(d.totalHours),
            averageHoursNum: parseNum(d.averageHoursPerStaff),
            disciplineNum: parseNum(d.disciplineRate),
        })),
    }));

    return {
        ...raw,
        departmentBreakdown,
        healthSignals,
        topPerformers: topPerfs,
        stationList,
    };
}

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
            <Box key={i} sx={{
                position: 'absolute', width: s, height: s, pointerEvents: 'none', zIndex: 0,
                top: t, left: l, right: r, bottom: bot,
                borderRadius: '50%', background: c, filter: `blur(${b}px)`,
            }} />
        ))}
    </>
);

/* ══════════════════════════════════════════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════════════════════════════════════════ */
const Reveal = ({ children, delay = 0, y = 22 }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-50px' });
    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, y }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>
            {children}
        </motion.div>
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   GLASS RECHARTS TOOLTIP
══════════════════════════════════════════════════════════════════════════ */
const GlassTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{
            background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(24px)',
            border: '1px solid rgba(10,61,98,0.12)', borderRadius: '14px',
            px: 2, py: 1.5, boxShadow: '0 10px 36px rgba(10,61,98,0.16)', minWidth: 140,
        }}>
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

/* ══════════════════════════════════════════════════════════════════════════
   INSIGHT CARD  (chart + description side-by-side or stacked)
══════════════════════════════════════════════════════════════════════════ */
const InsightCard = ({ title, subtitle, accent, children, insight, insightIcon }) => (
    <Box sx={{ ...G.card, borderRadius: '22px', p: 2.8, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" alignItems="flex-start" spacing={1} mb={0.4}>
            <Box sx={{ width: 4, height: 16, borderRadius: 2, bgcolor: accent, mt: 0.3, flexShrink: 0 }} />
            <Box>
                <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>{title}</Typography>
                <Typography variant="caption" color="text.disabled" display="block">{subtitle}</Typography>
            </Box>
        </Stack>
        <Box sx={{ flex: 1, mt: 1 }}>{children}</Box>
        {insight && (
            <Box sx={{ mt: 1.5, p: 1.4, borderRadius: '10px', background: `${accent}0a`, border: `1px dashed ${accent}30` }}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                    {insightIcon || <InsertChart sx={{ fontSize: '0.9rem', color: accent, mt: 0.15, flexShrink: 0 }} />}
                    <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.7, fontSize: '0.68rem' }}>
                        <strong style={{ color: accent }}>Key Insight: </strong>{insight}
                    </Typography>
                </Stack>
            </Box>
        )}
    </Box>
);

/* ══════════════════════════════════════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════════════════════════════════════ */
const StatCard = ({ label, value, subtitle, icon, accent, trend, trendLabel, progress, badge }) => (
    <Box sx={{
        ...G.card, p: 2.5, height: '100%', borderRadius: '20px',
        position: 'relative', overflow: 'hidden', transition: 'all 0.26s ease',
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
                    <LinearProgress variant="determinate" value={Math.min(Number(progress), 100)}
                        sx={{ height: 6, borderRadius: 99, bgcolor: `${accent}14`, '& .MuiLinearProgress-bar': { bgcolor: accent, borderRadius: 99 } }} />
                    <Typography variant="caption" color="text.disabled" sx={{ mt: 0.4, display: 'block' }}>{Number(progress).toFixed(1)}%</Typography>
                </Box>
            )}
        </Stack>
    </Box>
);

/* ══════════════════════════════════════════════════════════════════════════
   SECTION LABEL
══════════════════════════════════════════════════════════════════════════ */
const SectionLabel = ({ children, accent, chip, chipColor, icon }) => (
    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        {icon && <Box sx={{ color: accent, display: 'flex' }}>{icon}</Box>}
        {!icon && <Box sx={{ width: 4, height: 18, borderRadius: 2, bgcolor: accent }} />}
        <Typography variant="subtitle1" fontWeight={800} color={colorPalette.deepNavy}>{children}</Typography>
        {chip && <Chip label={chip} size="small" sx={{ bgcolor: `${chipColor || accent}14`, color: chipColor || accent, fontWeight: 700, fontSize: '0.7rem', borderRadius: '8px' }} />}
    </Stack>
);

/* ══════════════════════════════════════════════════════════════════════════
   HERO BANNER
══════════════════════════════════════════════════════════════════════════ */
const OrgHeroBanner = ({ data, loading, rank, filterLabel }) => {
    const ov = data?.overview;
    const effNum = ov?.averageStaffEfficiency ? parseFloat(ov.averageStaffEfficiency) : 0;
    return (
        <Box sx={{ borderRadius: '24px', background: G.heroBg, position: 'relative', overflow: 'hidden', mb: 3, p: { xs: 3, md: 4 } }}>
            <Box sx={{ position: 'absolute', top: -60, right: -60, width: 230, height: 230, borderRadius: '50%', background: 'rgba(0,180,200,0.10)', filter: 'blur(45px)', pointerEvents: 'none' }} />
            <Box sx={{ position: 'absolute', bottom: -90, left: -90, width: 290, height: 290, borderRadius: '50%', background: 'rgba(10,61,98,0.28)', filter: 'blur(55px)', pointerEvents: 'none' }} />
            <Box sx={{ position: 'absolute', top: '35%', left: '45%', width: 190, height: 190, borderRadius: '50%', background: 'rgba(0,220,255,0.06)', filter: 'blur(36px)', pointerEvents: 'none' }} />
            <Grid container spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
                <Grid item xs={12} md={5}>
                    <Stack direction="row" alignItems="center" spacing={0.8} mb={0.5}>
                        <Shield sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)' }} />
                        <Typography variant="caption" sx={{ opacity: 0.55, fontWeight: 900, letterSpacing: 2.2, textTransform: 'uppercase', fontSize: '0.66rem', color: '#fff' }}>
                            {RANK_LABELS[rank] || 'Admin'} · Org Dashboard
                        </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ opacity: 0.52, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', display: 'block', mb: 0.5, color: '#fff' }}>
                        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                        {filterLabel && <span style={{ marginLeft: 8, opacity: 0.7 }}>· {filterLabel}</span>}
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
                                {loading ? 'Loading stats…' : `${ov?.activeStaffThisMonth ?? 0} of ${ov?.totalStaff ?? 0} staff active this month`}
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
   FILTER BAR
══════════════════════════════════════════════════════════════════════════ */
const FilterBar = ({ stationList, selectedStation, setSelectedStation, selectedDept, setSelectedDept }) => {
    const deptOptions = useMemo(() => {
        if (!selectedStation) {
            // All departments across all stations
            const all = new Set();
            stationList.forEach(s => s.departments?.forEach(d => all.add(d.name)));
            return Array.from(all).sort();
        }
        const s = stationList.find(s => s.name === selectedStation);
        return (s?.departments || []).map(d => d.name).sort();
    }, [selectedStation, stationList]);

    const handleStationChange = (val) => {
        setSelectedStation(val);
        setSelectedDept('');
    };

    return (
        <Reveal>
            <Box sx={{ ...G.filterBg, borderRadius: '18px', p: 2, mb: 3, position: 'relative', zIndex: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} flexWrap="wrap">
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <FilterList sx={{ color: colorPalette.deepNavy, fontSize: '1.1rem' }} />
                        <Typography variant="body2" fontWeight={800} color={colorPalette.deepNavy}>Filter View</Typography>
                    </Stack>

                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel sx={{ fontWeight: 700, fontSize: '0.82rem' }}>Station</InputLabel>
                        <Select
                            value={selectedStation}
                            label="Station"
                            onChange={e => handleStationChange(e.target.value)}
                            sx={{ borderRadius: '12px', fontWeight: 700, fontSize: '0.82rem', bgcolor: 'rgba(255,255,255,0.7)' }}
                        >
                            <MenuItem value=""><em>All Stations</em></MenuItem>
                            {stationList.map(s => (
                                <MenuItem key={s.name} value={s.name}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <LocationOn sx={{ fontSize: '0.85rem', color: colorPalette.oceanBlue }} />
                                        <span>{s.name}</span>
                                        <Chip label={`${s.headcount} staff`} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: `${colorPalette.oceanBlue}12`, color: colorPalette.oceanBlue }} />
                                    </Stack>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel sx={{ fontWeight: 700, fontSize: '0.82rem' }}>Department</InputLabel>
                        <Select
                            value={selectedDept}
                            label="Department"
                            onChange={e => setSelectedDept(e.target.value)}
                            sx={{ borderRadius: '12px', fontWeight: 700, fontSize: '0.82rem', bgcolor: 'rgba(255,255,255,0.7)' }}
                        >
                            <MenuItem value=""><em>All Departments</em></MenuItem>
                            {deptOptions.map(d => (
                                <MenuItem key={d} value={d}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Apartment sx={{ fontSize: '0.85rem', color: colorPalette.seafoamGreen }} />
                                        <span>{d}</span>
                                    </Stack>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {(selectedStation || selectedDept) && (
                        <Button size="small" variant="outlined"
                            onClick={() => { setSelectedStation(''); setSelectedDept(''); }}
                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', borderColor: 'rgba(10,61,98,0.22)', color: colorPalette.deepNavy }}>
                            Clear Filters
                        </Button>
                    )}

                    <Box sx={{ ml: 'auto' }}>
                        {selectedStation && (
                            <Chip
                                icon={<LocationOn sx={{ fontSize: '0.8rem !important' }} />}
                                label={selectedStation}
                                onDelete={() => handleStationChange('')}
                                size="small"
                                sx={{ bgcolor: `${colorPalette.oceanBlue}12`, color: colorPalette.oceanBlue, fontWeight: 700, borderRadius: '8px', mr: 1 }} />
                        )}
                        {selectedDept && (
                            <Chip
                                icon={<Apartment sx={{ fontSize: '0.8rem !important' }} />}
                                label={selectedDept}
                                onDelete={() => setSelectedDept('')}
                                size="small"
                                sx={{ bgcolor: `${colorPalette.seafoamGreen}12`, color: '#16a34a', fontWeight: 700, borderRadius: '8px' }} />
                        )}
                    </Box>
                </Stack>
            </Box>
        </Reveal>
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   CHART SECTION — All main visualisations
══════════════════════════════════════════════════════════════════════════ */
const ChartsSection = ({ data, selectedStation, selectedDept }) => {
    const ov = data?.overview;
    const stations = data?.stationList || [];
    const allDepts = data?.departmentBreakdown || [];
    const topPerfs = data?.topPerformers || [];

    /* ── Determine which data to show based on filters ── */
    const activeDepts = useMemo(() => {
        if (selectedStation) {
            const s = stations.find(st => st.name === selectedStation);
            if (!s) return [];
            if (selectedDept) return s.departments.filter(d => d.name === selectedDept);
            return s.departments.map(d => ({
                name: d.name,
                headcount: d.headcount,
                totalHours: d.totalHoursNum.toFixed(1),
                totalOvertime: parseNum(d.totalOvertime).toFixed(1),
                averageHoursPerStaff: d.averageHoursNum.toFixed(1),
                disciplineRate: d.disciplineRate,
                overworked: d.overworked,
                topPerformers: d.topPerformers || [],
            }));
        }
        if (selectedDept) return allDepts.filter(d => d.name === selectedDept);
        return allDepts;
    }, [selectedStation, selectedDept, stations, allDepts]);

    const activeStations = useMemo(() => {
        if (selectedStation) return stations.filter(s => s.name === selectedStation);
        return stations;
    }, [selectedStation, stations]);

    /* ── Department bar chart data ── */
    const deptBarData = [...activeDepts]
        .sort((a, b) => parseNum(b.totalHours) - parseNum(a.totalHours))
        .slice(0, 10)
        .map(d => ({
            name: d.name?.length > 13 ? d.name.slice(0, 12) + '…' : d.name,
            fullName: d.name,
            hours: parseNum(d.totalHours),
            overtime: parseNum(d.totalOvertime),
            headcount: d.headcount || 0,
            avg: parseNum(d.averageHoursPerStaff),
            discipline: parseNum(d.disciplineRate),
        }));

    /* ── Station comparison chart ── */
    const stationBarData = activeStations
        .map(s => ({
            name: s.name?.length > 10 ? s.name.slice(0, 9) + '…' : s.name,
            fullName: s.name,
            hours: +(s.totalHours).toFixed(1),
            overtime: +(s.totalOvertime).toFixed(1),
            headcount: s.headcount || 0,
            efficiency: s.efficiencyNum,
            checkins: s.totalCheckins || 0,
            discipline: s.disciplineNum,
        }))
        .sort((a, b) => b.hours - a.hours);

    /* ── Burnout / productivity composition ── */
    const burnoutLevels = { Low: 0, Moderate: 0, High: 0 };
    topPerfs.forEach(p => { if (burnoutLevels[p.burnoutLevel] !== undefined) burnoutLevels[p.burnoutLevel]++; });
    const burnoutData = [
        { name: 'Low Risk', value: burnoutLevels.Low, fill: '#22c55e' },
        { name: 'Moderate Risk', value: burnoutLevels.Moderate, fill: '#f59e0b' },
        { name: 'High Risk (Burnout)', value: burnoutLevels.High, fill: colorPalette.coralSunset },
    ].filter(d => d.value > 0);

    /* ── Efficiency radial ── */
    const effNum = parseNum(ov?.averageStaffEfficiency);
    const activationPct = ov?.totalStaff ? +((ov.activeStaffThisMonth / ov.totalStaff) * 100).toFixed(1) : 0;
    const overtimePct = ov?.totalOrgHours ? +((parseNum(ov.totalOrgOvertime) / parseNum(ov.totalOrgHours)) * 100).toFixed(1) : 0;

    /* ── Top performers scatter ── */
    const scatterData = topPerfs.map(p => ({
        x: parseNum(p.hours),
        y: parseNum(p.overtime),
        z: Math.max(Math.round(p.score), 5),
        email: p.email?.split('@')[0],
        burnout: p.burnoutLevel,
    }));

    /* ── Discipline vs Efficiency (station level) ── */
    const disciplineEffData = stationBarData.map(s => ({
        name: s.name,
        efficiency: s.efficiency,
        lateRate: s.discipline,
        headcount: s.headcount,
    }));

    /* ── Dept overwork signal ── */
    const overworkData = activeDepts.filter(d => d.overworked).map(d => ({
        name: d.name?.length > 13 ? d.name.slice(0, 12) + '…' : d.name,
        avg: parseNum(d.averageHoursPerStaff),
        standard: 160,
    }));

    const renderPctLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (percent < 0.08) return null;
        const R = Math.PI / 180;
        const r = innerRadius + (outerRadius - innerRadius) * 0.56;
        return (
            <text x={cx + r * Math.cos(-midAngle * R)} y={cy + r * Math.sin(-midAngle * R)}
                fill="white" textAnchor="middle" dominantBaseline="central"
                fontSize={11} fontWeight={900}>{`${(percent * 100).toFixed(0)}%`}</text>
        );
    };

    const isDeptOnly = selectedDept && !selectedStation;
    const singleStation = selectedStation ? activeStations[0] : null;

    return (
        <Box mb={4} sx={{ position: 'relative', zIndex: 1 }}>
            <Reveal>
                <SectionLabel accent={colorPalette.cyanFresh} chip="Live analytics" icon={<InsertChart sx={{ fontSize: '1.1rem' }} />}>
                    Organisation Insights
                </SectionLabel>
            </Reveal>

            <Grid container spacing={2.5}>

                {/* ── 1. Department Hours Comparison (main bar chart) ── */}
                <Grid item xs={12} lg={8}>
                    <Reveal delay={0}>
                        <InsightCard
                            title="Department Hours Breakdown"
                            subtitle={`Total & overtime hours per department${selectedStation ? ` · ${selectedStation}` : ''}${selectedDept ? ` · ${selectedDept}` : ''}`}
                            accent={colorPalette.oceanBlue}
                            insight={
                                deptBarData.length > 0
                                    ? `${deptBarData[0].fullName} leads with ${deptBarData[0].hours}h total. ${deptBarData.filter(d => d.overtime > 0).length} department(s) logged overtime this month.`
                                    : 'No department data available for this filter.'
                            }
                        >
                            {deptBarData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={230}>
                                    <BarChart data={deptBarData} margin={{ top: 4, right: 16, left: -16, bottom: 24 }}>
                                        <defs>
                                            <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={colorPalette.oceanBlue} stopOpacity={0.88} />
                                                <stop offset="100%" stopColor={colorPalette.aquaVibrant} stopOpacity={0.66} />
                                            </linearGradient>
                                            <linearGradient id="otGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={colorPalette.coralSunset} stopOpacity={0.9} />
                                                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.65} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} angle={-28} textAnchor="end" height={44} />
                                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <RTooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(10,61,98,0.04)' }} />
                                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                                        <Bar dataKey="hours" name="Total Hours" fill="url(#hoursGrad)" radius={[6, 6, 0, 0]} animationDuration={900} />
                                        <Bar dataKey="overtime" name="Overtime Hours" fill="url(#otGrad)" radius={[6, 6, 0, 0]} animationDuration={900} animationBegin={200} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <Stack alignItems="center" justifyContent="center" height={230}>
                                    <Typography variant="body2" color="text.disabled">No data for current filter</Typography>
                                </Stack>
                            )}
                        </InsightCard>
                    </Reveal>
                </Grid>

                {/* ── 2. Burnout Risk Donut ── */}
                <Grid item xs={12} lg={4}>
                    <Reveal delay={0.07}>
                        <InsightCard
                            title="Burnout Risk Distribution"
                            subtitle="Staff classified by overtime workload"
                            accent={colorPalette.coralSunset}
                            insight={`${burnoutLevels.High} staff at high burnout risk (>20h overtime). ${burnoutLevels.Moderate} at moderate risk.`}
                        >
                            <Box sx={{ position: 'relative' }}>
                                <ResponsiveContainer width="100%" height={190}>
                                    <PieChart>
                                        <Pie data={burnoutData} cx="50%" cy="50%"
                                            innerRadius={52} outerRadius={80}
                                            paddingAngle={4} dataKey="value"
                                            animationBegin={200} animationDuration={1000}
                                            labelLine={false} label={renderPctLabel}
                                            stroke="rgba(255,255,255,0.6)" strokeWidth={3}>
                                            {burnoutData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                        </Pie>
                                        <RTooltip content={<GlassTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                                    <Typography variant="h6" fontWeight={900} color={colorPalette.deepNavy}>{topPerfs.length}</Typography>
                                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.62rem', fontWeight: 700 }}>Active</Typography>
                                </Box>
                            </Box>
                            <Stack spacing={0.8} mt={0.5}>
                                {[{ label: 'Low Risk', color: '#22c55e', val: burnoutLevels.Low }, { label: 'Moderate Risk', color: '#f59e0b', val: burnoutLevels.Moderate }, { label: 'High Risk', color: colorPalette.coralSunset, val: burnoutLevels.High }]
                                    .map(({ label, color, val }) => (
                                        <Stack key={label} direction="row" alignItems="center" justifyContent="space-between">
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: color }} />
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
                                            </Stack>
                                            <Typography variant="caption" fontWeight={900} color={colorPalette.deepNavy}>{val}</Typography>
                                        </Stack>
                                    ))}
                            </Stack>
                        </InsightCard>
                    </Reveal>
                </Grid>

                {/* ── 3. Station Comparison Bar (only show if >1 station or no filter) ── */}
                {!selectedDept && (
                    <Grid item xs={12} md={7}>
                        <Reveal delay={0.1}>
                            <InsightCard
                                title="Station Performance Comparison"
                                subtitle="Hours, overtime and headcount by station"
                                accent={colorPalette.seafoamGreen}
                                insight={
                                    stationBarData.length > 0
                                        ? `${stationBarData[0].fullName} is the most active station with ${stationBarData[0].hours}h total. ${stationBarData.filter(s => s.overtime > 0).length} station(s) recorded overtime.`
                                        : 'No station data available.'
                                }
                            >
                                <ResponsiveContainer width="100%" height={220}>
                                    <ComposedChart data={stationBarData} margin={{ top: 4, right: 24, left: -16, bottom: 24 }}>
                                        <defs>
                                            <linearGradient id="stnHoursGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={colorPalette.seafoamGreen} stopOpacity={0.88} />
                                                <stop offset="100%" stopColor={colorPalette.aquaVibrant} stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} angle={-22} textAnchor="end" height={40} />
                                        <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <RTooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(10,61,98,0.04)' }} />
                                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
                                        <Bar yAxisId="left" dataKey="hours" name="Total Hours" fill="url(#stnHoursGrad)" radius={[6, 6, 0, 0]} animationDuration={900} />
                                        <Bar yAxisId="left" dataKey="overtime" name="Overtime" fill={`${colorPalette.coralSunset}cc`} radius={[6, 6, 0, 0]} animationDuration={900} />
                                        <Line yAxisId="right" type="monotone" dataKey="headcount" name="Headcount" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </InsightCard>
                        </Reveal>
                    </Grid>
                )}

                {/* ── 4. Avg Hrs / Head per Department ── */}
                <Grid item xs={12} md={selectedDept ? 12 : 5}>
                    <Reveal delay={0.14}>
                        <InsightCard
                            title="Avg Hours per Staff"
                            subtitle="Productivity intensity by department"
                            accent={colorPalette.coralSunset}
                            insight={
                                deptBarData.length > 0
                                    ? `Avg of ${(deptBarData.reduce((a, d) => a + d.avg, 0) / deptBarData.length).toFixed(1)}h per staff across departments. Standard month = 160h.`
                                    : undefined
                            }
                        >
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={deptBarData} layout="vertical" margin={{ top: 4, right: 50, left: 4, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="avgHorizGrad" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor={colorPalette.coralSunset} stopOpacity={0.88} />
                                            <stop offset="100%" stopColor="#f97316" stopOpacity={0.55} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 700 }} axisLine={false} tickLine={false} width={90} />
                                    <RTooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(10,61,98,0.04)' }} />
                                    <Bar dataKey="avg" name="Avg hrs/head" fill="url(#avgHorizGrad)" radius={[0, 8, 8, 0]}
                                        label={{ position: 'right', fontSize: 9, fill: '#94a3b8', fontWeight: 700, formatter: v => `${v}h` }}
                                        animationDuration={900} />
                                </BarChart>
                            </ResponsiveContainer>
                        </InsightCard>
                    </Reveal>
                </Grid>

                {/* ── 5. Discipline Rate (Late %) ── */}
                {!selectedDept && (
                    <Grid item xs={12} md={6}>
                        <Reveal delay={0.18}>
                            <InsightCard
                                title="Discipline Rates by Station"
                                subtitle="% of check-ins that were late arrivals"
                                accent="#f59e0b"
                                insight={
                                    disciplineEffData.length > 0
                                        ? `${disciplineEffData.sort((a, b) => b.lateRate - a.lateRate)[0]?.name} has the highest late-arrival rate at ${disciplineEffData.sort((a, b) => b.lateRate - a.lateRate)[0]?.lateRate?.toFixed(1)}%. Lower is better.`
                                        : undefined
                                }
                                insightIcon={<Warning sx={{ fontSize: '0.9rem', color: '#f59e0b', mt: 0.15 }} />}
                            >
                                <ResponsiveContainer width="100%" height={210}>
                                    <BarChart data={disciplineEffData} margin={{ top: 4, right: 8, left: -18, bottom: 24 }}>
                                        <defs>
                                            <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                                                <stop offset="100%" stopColor="#f97316" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} angle={-22} textAnchor="end" height={40} />
                                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                                        <RTooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(10,61,98,0.04)' }} />
                                        <Bar dataKey="lateRate" name="Late Rate %" fill="url(#lateGrad)" radius={[6, 6, 0, 0]} animationDuration={900} unit="%" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </InsightCard>
                        </Reveal>
                    </Grid>
                )}

                {/* ── 6. Efficiency by Station ── */}
                {!selectedDept && (
                    <Grid item xs={12} md={6}>
                        <Reveal delay={0.22}>
                            <InsightCard
                                title="Efficiency Score by Station"
                                subtitle="Hours logged vs 160h standard (%) per station"
                                accent={colorPalette.aquaVibrant}
                                insight={
                                    stationBarData.length > 0
                                        ? `Top performing station: ${stationBarData.sort((a, b) => b.efficiency - a.efficiency)[0]?.fullName} at ${stationBarData[0]?.efficiency?.toFixed(1)}% efficiency. Below 50% warrants review.`
                                        : undefined
                                }
                            >
                                <ResponsiveContainer width="100%" height={210}>
                                    <BarChart data={stationBarData.map(s => ({ name: s.name, efficiency: s.efficiency, target: 80 }))} margin={{ top: 4, right: 8, left: -18, bottom: 24 }}>
                                        <defs>
                                            <linearGradient id="effBarGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={colorPalette.aquaVibrant} stopOpacity={0.9} />
                                                <stop offset="100%" stopColor={colorPalette.cyanFresh} stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} angle={-22} textAnchor="end" height={40} />
                                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                                        <RTooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(10,61,98,0.04)' }} />
                                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
                                        <Bar dataKey="efficiency" name="Efficiency %" fill="url(#effBarGrad)" radius={[6, 6, 0, 0]} animationDuration={900} unit="%" />
                                        <Line type="monotone" dataKey="target" name="80% Target" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={1.8} dot={false} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </InsightCard>
                        </Reveal>
                    </Grid>
                )}

                {/* ── 7. Overworked Department Alert (if any) ── */}
                {overworkData.length > 0 && (
                    <Grid item xs={12} md={6}>
                        <Reveal delay={0.25}>
                            <InsightCard
                                title="Overworked Departments"
                                subtitle="Departments averaging above 160h/staff this month"
                                accent={colorPalette.coralSunset}
                                insight={`${overworkData.length} department(s) have staff averaging over 160 hours — the standard monthly capacity. Immediate workload redistribution recommended.`}
                                insightIcon={<Warning sx={{ fontSize: '0.9rem', color: colorPalette.coralSunset, mt: 0.15 }} />}
                            >
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={overworkData} margin={{ top: 4, right: 8, left: -18, bottom: 24 }}>
                                        <defs>
                                            <linearGradient id="overworkGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={colorPalette.coralSunset} stopOpacity={0.9} />
                                                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} angle={-22} textAnchor="end" height={40} />
                                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <RTooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(10,61,98,0.04)' }} />
                                        <Legend wrapperStyle={{ fontSize: 10 }} />
                                        <Bar dataKey="avg" name="Avg hrs/staff" fill="url(#overworkGrad)" radius={[6, 6, 0, 0]} animationDuration={900} />
                                        <Line type="monotone" dataKey="standard" name="160h Standard" stroke="#6366f1" strokeDasharray="6 4" strokeWidth={2} dot={false} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </InsightCard>
                        </Reveal>
                    </Grid>
                )}

                {/* ── 8. Productivity Radials ── */}
                <Grid item xs={12} md={overworkData.length > 0 ? 6 : 5}>
                    <Reveal delay={0.28}>
                        <InsightCard
                            title="Key Org Performance Gauges"
                            subtitle="Efficiency · Activation · Overtime ratio"
                            accent="#6366f1"
                            insight={`Staff activation at ${activationPct.toFixed(1)}%, org efficiency at ${effNum.toFixed(1)}%, and overtime represents ${overtimePct.toFixed(1)}% of total hours logged.`}
                        >
                            <ResponsiveContainer width="100%" height={190}>
                                <RadialBarChart cx="50%" cy="50%" innerRadius={28} outerRadius={85}
                                    data={[
                                        { name: 'Efficiency', value: Math.min(effNum, 100), fill: `url(#radEff)` },
                                        { name: 'Activation', value: Math.min(activationPct, 100), fill: `url(#radAct)` },
                                        { name: 'Overtime Ratio', value: Math.min(overtimePct * 3, 100), fill: `url(#radOt)` },
                                    ]}
                                    startAngle={180} endAngle={-180} barSize={18}>
                                    <defs>
                                        <linearGradient id="radEff" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={colorPalette.aquaVibrant} /><stop offset="100%" stopColor={colorPalette.seafoamGreen} stopOpacity={0.7} /></linearGradient>
                                        <linearGradient id="radAct" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={colorPalette.oceanBlue} /><stop offset="100%" stopColor={colorPalette.cyanFresh} stopOpacity={0.7} /></linearGradient>
                                        <linearGradient id="radOt" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor={colorPalette.coralSunset} stopOpacity={0.7} /></linearGradient>
                                    </defs>
                                    <RadialBar background={{ fill: 'rgba(10,61,98,0.05)' }} dataKey="value" cornerRadius={10} animationDuration={1200} />
                                    <RTooltip content={<GlassTooltip />} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <Stack direction="row" justifyContent="space-around" mt={0.5}>
                                {[
                                    { label: 'Efficiency', value: `${effNum.toFixed(1)}%`, color: colorPalette.aquaVibrant },
                                    { label: 'Activation', value: `${activationPct.toFixed(1)}%`, color: colorPalette.oceanBlue },
                                    { label: 'OT Ratio', value: `${overtimePct.toFixed(1)}%`, color: '#f59e0b' },
                                ].map(({ label, value, color }) => (
                                    <Box key={label} sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" fontWeight={900} sx={{ color, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                                        <Typography variant="caption" color="text.disabled" fontWeight={700}>{label}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </InsightCard>
                    </Reveal>
                </Grid>

                {/* ── 9. Dept check-in count bar ── */}
                <Grid item xs={12} md={overworkData.length > 0 ? 12 : 7}>
                    <Reveal delay={0.3}>
                        <InsightCard
                            title="Department Headcount vs Logged Hours"
                            subtitle="Correlation between team size and hours recorded"
                            accent={colorPalette.seafoamGreen}
                            insight={
                                deptBarData.length > 0
                                    ? `Correlation between headcount and hours indicates ${deptBarData.filter(d => d.headcount > 0 && d.avg > 120).length} dept(s) with above-average per-capita output. Smaller teams with high hours may need support.`
                                    : undefined
                            }
                        >
                            <ResponsiveContainer width="100%" height={210}>
                                <ComposedChart data={deptBarData} margin={{ top: 4, right: 24, left: -16, bottom: 24 }}>
                                    <defs>
                                        <linearGradient id="hcGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={colorPalette.seafoamGreen} stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.55} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} angle={-22} textAnchor="end" height={40} />
                                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <RTooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(10,61,98,0.04)' }} />
                                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
                                    <Bar yAxisId="left" dataKey="hours" name="Total Hours" fill="url(#hcGrad)" radius={[5, 5, 0, 0]} animationDuration={900} />
                                    <Line yAxisId="right" type="monotone" dataKey="headcount" name="Headcount" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 3 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </InsightCard>
                    </Reveal>
                </Grid>

            </Grid>
        </Box>
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   TOP PERFORMERS LIST
══════════════════════════════════════════════════════════════════════════ */
const TopPerformersList = ({ performers, loading, title = 'Top Performers', subtitle = 'By attendance score' }) => {
    const medals = ['🥇', '🥈', '🥉'];
    return (
        <Box sx={{ ...G.card, borderRadius: '22px', p: 3, height: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
                <Box sx={{ width: 44, height: 44, borderRadius: '14px', bgcolor: '#f59e0b14', border: '1px solid #f59e0b22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EmojiEvents sx={{ color: '#f59e0b' }} />
                </Box>
                <Box>
                    <Typography variant="h6" fontWeight={800} color={colorPalette.deepNavy}>{title}</Typography>
                    <Typography variant="caption" color="text.disabled">{subtitle}</Typography>
                </Box>
            </Stack>

            {loading ? (
                <Stack spacing={1.5}>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: '14px' }} />)}</Stack>
            ) : performers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                    <Typography variant="body2" color="text.disabled">No performer data</Typography>
                </Box>
            ) : (
                <Stack spacing={1.4}>
                    {performers.slice(0, 8).map((p, idx) => {
                        const rs = [
                            { bg: 'rgba(254,243,199,0.82)', border: 'rgba(253,230,138,0.72)', color: '#d97706' },
                            { bg: 'rgba(241,245,249,0.82)', border: 'rgba(226,232,240,0.72)', color: '#64748b' },
                            { bg: 'rgba(255,247,237,0.82)', border: 'rgba(254,215,170,0.72)', color: '#c2410c' },
                        ][idx] || { bg: `${colorPalette.oceanBlue}08`, border: `${colorPalette.oceanBlue}22`, color: colorPalette.oceanBlue };
                        const emailLocal = p.email?.split('@')[0] || '??';
                        return (
                            <motion.div key={idx} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06, ease: [0.22, 1, 0.36, 1] }}>
                                <Box sx={{ p: 1.8, borderRadius: '14px', background: rs.bg, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${rs.border}`, transition: 'all 0.18s ease', '&:hover': { transform: 'translateX(4px)', boxShadow: '0 6px 20px rgba(10,61,98,0.10)' } }}>
                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                        <Typography sx={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 }}>{medals[idx] || `#${idx + 1}`}</Typography>
                                        <Avatar sx={{ width: 34, height: 34, bgcolor: colorPalette.deepNavy, color: '#fff', fontSize: '0.7rem', fontWeight: 800, flexShrink: 0 }}>{emailLocal.slice(0, 2).toUpperCase()}</Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" fontWeight={800} color={colorPalette.deepNavy} noWrap sx={{ fontSize: '0.82rem' }}>{emailLocal}</Typography>
                                            <Stack direction="row" spacing={0.6} mt={0.2}>
                                                <Chip label={`${p.hours}h`} size="small" sx={{ height: 17, fontSize: '0.6rem', fontWeight: 700, bgcolor: `${colorPalette.oceanBlue}10`, color: colorPalette.oceanBlue, borderRadius: '5px' }} />
                                                <Chip label={p.burnoutLevel} size="small" sx={{ height: 17, fontSize: '0.6rem', fontWeight: 700, bgcolor: p.burnoutLevel === 'High' ? '#ef444418' : p.burnoutLevel === 'Moderate' ? '#f59e0b18' : '#22c55e18', color: p.burnoutLevel === 'High' ? '#dc2626' : p.burnoutLevel === 'Moderate' ? '#d97706' : '#16a34a', borderRadius: '5px' }} />
                                            </Stack>
                                        </Box>
                                        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                            <Typography variant="body2" fontWeight={900} sx={{ color: rs.color, fontVariantNumeric: 'tabular-nums' }}>{Math.round(p.score)}</Typography>
                                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>pts</Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            </motion.div>
                        );
                    })}
                </Stack>
            )}

            {performers.length > 0 && (
                <Box sx={{ mt: 2, p: 1.6, borderRadius: '10px', background: 'rgba(10,61,98,0.04)', border: '1px dashed rgba(10,61,98,0.12)' }}>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.64rem', lineHeight: 1.65, display: 'block' }}>
                        <strong style={{ color: colorPalette.deepNavy }}>Score formula:</strong> (Hours × 0.6) + (Early arrivals × 2) − (Late arrivals × 1.5) + (Overtime × 0.5)
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   EXPORT DROPDOWN BUTTON
══════════════════════════════════════════════════════════════════════════ */
const ExportButton = ({ data, user, loading, stationList, selectedStation, selectedDept }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [exporting, setExporting] = useState(false);

    const handleExport = async (mode) => {
        setAnchorEl(null);
        if (!data) return;
        setExporting(true);
        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const pw = doc.internal.pageSize.getWidth();

            // Header
            doc.setFillColor(10, 61, 98);
            doc.rect(0, 0, pw, 32, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16); doc.setFont('helvetica', 'bold');
            doc.text('Kenya Marine and Fisheries Research Institute', pw / 2, 10, { align: 'center' });
            doc.setFontSize(11); doc.setFont('helvetica', 'normal');
            const reportTitle = mode === 'overall' ? 'Organisation Attendance Report — Overall'
                : mode === 'station' ? `Station Report — ${selectedStation || 'All Stations'}`
                    : `Department Report — ${selectedDept || 'All Departments'}`;
            doc.text(`${reportTitle} · ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`, pw / 2, 19, { align: 'center' });
            doc.setFontSize(8);
            doc.text(`Generated: ${new Date().toLocaleString()}  |  By: ${user?.name || 'N/A'}  |  Role: ${RANK_LABELS[user?.rank] || 'Admin'}`, pw / 2, 27, { align: 'center' });

            const ov = data.overview;
            const sy = 40;

            if (mode === 'overall') {
                // Overview boxes
                const boxes = [
                    ['Total Staff', String(ov?.totalStaff ?? '—')],
                    ['Active Staff', String(ov?.activeStaffThisMonth ?? '—')],
                    ['Org Hours', `${ov?.totalOrgHours ?? '—'}h`],
                    ['Overtime', `${ov?.totalOrgOvertime ?? '—'}h`],
                    ['Efficiency', String(ov?.averageStaffEfficiency ?? '—')],
                    ['Inactive', String(ov?.inactiveAccounts ?? '—')],
                ];
                const bw = (pw - 20) / boxes.length;
                boxes.forEach(([lbl, val], i) => {
                    const x = 10 + i * bw;
                    doc.setFillColor(245, 248, 252); doc.roundedRect(x, sy, bw - 2, 18, 2, 2, 'F');
                    doc.setTextColor(10, 61, 98); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
                    doc.text(val, x + bw / 2 - 1, sy + 8, { align: 'center' });
                    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
                    doc.text(lbl, x + bw / 2 - 1, sy + 14, { align: 'center' });
                });

                // Stations table
                const stnRows = stationList.map(s => [
                    s.name, s.headcount, `${s.totalHours.toFixed(1)}h`,
                    `${s.totalOvertime.toFixed(1)}h`, s.efficiencyScore,
                    s.disciplineRate, s.totalCheckins,
                ]);
                doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(10, 61, 98);
                doc.text('Station Overview', 10, sy + 26);
                autoTable(doc, {
                    head: [['Station', 'Headcount', 'Total Hours', 'Overtime', 'Efficiency', 'Late Rate', 'Check-ins']],
                    body: stnRows, startY: sy + 30,
                    styles: { fontSize: 8, cellPadding: 2.5 },
                    headStyles: { fillColor: [10, 61, 98], textColor: 255, fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [248, 250, 252] },
                });

                // Top performers
                const topPerfs = data.topPerformers || [];
                if (topPerfs.length) {
                    const ay = (doc.lastAutoTable?.finalY ?? sy + 60) + 10;
                    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(10, 61, 98);
                    doc.text('Top Performers Overall', 10, ay);
                    autoTable(doc, {
                        head: [['Rank', 'Email', 'Hours', 'Overtime', 'Attendance Rate', 'Burnout Level', 'Score']],
                        body: topPerfs.map((p, i) => [`#${i + 1}`, p.email, `${p.hours}h`, `${p.overtime}h`, p.attendanceRate, p.burnoutLevel, Math.round(p.score)]),
                        startY: ay + 4,
                        styles: { fontSize: 8, cellPadding: 2.5 },
                        headStyles: { fillColor: [10, 61, 98], textColor: 255, fontStyle: 'bold' },
                        alternateRowStyles: { fillColor: [248, 250, 252] },
                    });
                }

            } else if (mode === 'station') {
                const targetStations = selectedStation ? stationList.filter(s => s.name === selectedStation) : stationList;
                doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(10, 61, 98);
                doc.text(`Station Analysis Report${selectedStation ? `: ${selectedStation}` : ' — All Stations'}`, 10, sy);
                autoTable(doc, {
                    head: [['Station', 'Headcount', 'Total Hours', 'Overtime', 'Efficiency', 'Late Rate', 'Check-ins', 'Avg Hrs/Staff']],
                    body: targetStations.map(s => [s.name, s.headcount, `${s.totalHours.toFixed(1)}h`, `${s.totalOvertime.toFixed(1)}h`, s.efficiencyScore, s.disciplineRate, s.totalCheckins, `${s.averageHoursPerStaff}h`]),
                    startY: sy + 6,
                    styles: { fontSize: 8, cellPadding: 2.5 },
                    headStyles: { fillColor: [7, 58, 82], textColor: 255, fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [248, 250, 252] },
                });
                // Per-station top performers
                targetStations.forEach(s => {
                    if ((s.topPerformers || []).length === 0) return;
                    const ay = (doc.lastAutoTable?.finalY ?? sy + 50) + 8;
                    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(10, 61, 98);
                    doc.text(`Top Performers — ${s.name}`, 10, ay);
                    autoTable(doc, {
                        head: [['Rank', 'Email', 'Score']],
                        body: s.topPerformers.map((p, i) => [`#${i + 1}`, p.email, Math.round(p.score)]),
                        startY: ay + 4,
                        styles: { fontSize: 8, cellPadding: 2 },
                        headStyles: { fillColor: [10, 61, 98], textColor: 255 },
                        alternateRowStyles: { fillColor: [248, 250, 252] },
                        margin: { left: 10 }, tableWidth: 120,
                    });
                });

            } else if (mode === 'department') {
                const targetDepts = selectedDept ? data.departmentBreakdown.filter(d => d.name === selectedDept) : data.departmentBreakdown;
                doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(10, 61, 98);
                doc.text(`Department Analysis Report${selectedDept ? `: ${selectedDept}` : ' — All Departments'}`, 10, sy);
                autoTable(doc, {
                    head: [['Department', 'Headcount', 'Total Hours', 'Overtime', 'Avg Hrs/Head', 'Late Rate', 'Overworked', 'Stations']],
                    body: targetDepts.map(d => [d.name, d.headcount, `${d.totalHours}h`, `${d.totalOvertime.toFixed ? d.totalOvertime.toFixed(1) : d.totalOvertime}h`, `${d.averageHoursPerStaff}h`, d.disciplineRate, d.overworked ? 'YES ⚠' : 'No', (d.stations || []).join(', ')]),
                    startY: sy + 6,
                    styles: { fontSize: 8, cellPadding: 2.5 },
                    headStyles: { fillColor: [5, 40, 64], textColor: 255, fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [248, 250, 252] },
                    columnStyles: { 6: { fontStyle: 'bold', textColor: [220, 38, 38] } },
                });
            }

            // Footer
            const tp = doc.internal.getNumberOfPages();
            for (let i = 1; i <= tp; i++) {
                doc.setPage(i);
                doc.setFontSize(7); doc.setTextColor(160, 174, 192);
                doc.text(`Page ${i} of ${tp}  |  KMFRI Digital Attendance Platform  |  Confidential — Admin Only`, pw / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
            }

            const modeLabel = mode === 'overall' ? 'Overall' : mode === 'station' ? (selectedStation || 'AllStations') : (selectedDept || 'AllDepts');
            doc.save(`KMFRI_${modeLabel}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (e) {
            console.error(e);
        } finally {
            setExporting(false);
        }
    };

    return (
        <>
            <Button
                variant="contained"
                startIcon={exporting ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <Download />}
                endIcon={<ArrowDropDown />}
                onClick={e => setAnchorEl(e.currentTarget)}
                disabled={exporting || loading}
                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', background: colorPalette.oceanGradient, boxShadow: `0 6px 20px ${colorPalette.oceanBlue}40`, transition: 'all 0.22s', '&:hover': { boxShadow: `0 8px 28px ${colorPalette.oceanBlue}55`, transform: 'translateY(-1px)' } }}>
                {exporting ? 'Generating…' : 'Export Report'}
            </Button>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
                PaperProps={{ sx: { borderRadius: '14px', border: '1px solid rgba(10,61,98,0.10)', boxShadow: '0 12px 36px rgba(10,61,98,0.16)', mt: 0.8, minWidth: 220 } }}>
                <Box sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(10,61,98,0.07)' }}>
                    <Typography variant="caption" fontWeight={800} color="text.disabled" sx={{ letterSpacing: 0.8, textTransform: 'uppercase', fontSize: '0.64rem' }}>Export Scope</Typography>
                </Box>
                <MenuItem onClick={() => handleExport('overall')} sx={{ py: 1.4, px: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 32, height: 32, borderRadius: '10px', bgcolor: `${colorPalette.oceanBlue}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <QueryStats sx={{ fontSize: '1rem', color: colorPalette.oceanBlue }} />
                        </Box>
                        <Box>
                            <Typography variant="body2" fontWeight={700}>Overall Organisation</Typography>
                            <Typography variant="caption" color="text.disabled">All stations · All departments</Typography>
                        </Box>
                    </Stack>
                </MenuItem>
                <MenuItem onClick={() => handleExport('station')} sx={{ py: 1.4, px: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 32, height: 32, borderRadius: '10px', bgcolor: `${colorPalette.seafoamGreen}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <LocationOn sx={{ fontSize: '1rem', color: colorPalette.seafoamGreen }} />
                        </Box>
                        <Box>
                            <Typography variant="body2" fontWeight={700}>By Station</Typography>
                            <Typography variant="caption" color="text.disabled">{selectedStation ? `Current: ${selectedStation}` : 'All stations breakdown'}</Typography>
                        </Box>
                    </Stack>
                </MenuItem>
                <MenuItem onClick={() => handleExport('department')} sx={{ py: 1.4, px: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 32, height: 32, borderRadius: '10px', bgcolor: `${colorPalette.coralSunset}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Apartment sx={{ fontSize: '1rem', color: colorPalette.coralSunset }} />
                        </Box>
                        <Box>
                            <Typography variant="body2" fontWeight={700}>By Department</Typography>
                            <Typography variant="caption" color="text.disabled">{selectedDept ? `Current: ${selectedDept}` : 'All departments breakdown'}</Typography>
                        </Box>
                    </Stack>
                </MenuItem>
            </Menu>
        </>
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export default function OverallAttendanceStats() {
    const { user } = useSelector(s => s.currentUser);
    const [rawData, setRawData] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    /* Filters */
    const [selectedStation, setSelectedStation] = useState('');
    const [selectedDept, setSelectedDept] = useState('');

    const notify = (msg, sev = 'success') => setSnack({ open: true, message: msg, severity: sev });

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetchOverallOrgStats();
            setRawData(res);
            setData(processRawData(res));
        } catch {
            notify('Failed to load organisation data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []); // eslint-disable-line

    const ov = data?.overview;
    const hs = data?.healthSignals;
    const depts = data?.departmentBreakdown || [];
    const topPerfs = data?.topPerformers || [];
    const stationList = data?.stationList || [];

    const effNum = ov?.averageStaffEfficiency ? parseFloat(ov.averageStaffEfficiency) : 0;
    const activationPct = ov?.totalStaff ? +((ov.activeStaffThisMonth / ov.totalStaff) * 100).toFixed(1) : 0;

    /* Dept max for table load bar */
    const deptMaxHours = depts.length ? Math.max(...depts.map(d => parseNum(d.totalHours)), 1) : 1;

    /* Active performers for filtered view */
    const activePerformers = useMemo(() => {
        if (!selectedStation && !selectedDept) return topPerfs;
        if (selectedStation && !selectedDept) {
            const s = stationList.find(st => st.name === selectedStation);
            return s?.topPerformers || [];
        }
        if (selectedDept) {
            const d = depts.find(dep => dep.name === selectedDept);
            return d?.topPerformers || [];
        }
        return topPerfs;
    }, [selectedStation, selectedDept, topPerfs, stationList, depts]);

    /* Active departments for table */
    const activeDepts = useMemo(() => {
        if (selectedStation) {
            const s = stationList.find(st => st.name === selectedStation);
            if (!s) return [];
            const mapped = (s.departments || []).map(d => ({
                name: d.name,
                headcount: d.headcount,
                totalHours: d.totalHoursNum?.toFixed(1) || d.totalHours,
                totalOvertime: parseNum(d.totalOvertime).toFixed(1),
                averageHoursPerStaff: d.averageHoursNum?.toFixed(1) || d.averageHoursPerStaff,
                disciplineRate: d.disciplineRate,
                overworked: d.overworked,
            }));
            return selectedDept ? mapped.filter(d => d.name === selectedDept) : mapped;
        }
        return selectedDept ? depts.filter(d => d.name === selectedDept) : depts;
    }, [selectedStation, selectedDept, stationList, depts]);

    const filterLabel = selectedStation && selectedDept ? `${selectedStation} · ${selectedDept}`
        : selectedStation ? selectedStation
            : selectedDept ? selectedDept
                : null;



    const healthCards = [
        { label: 'Burnout Risk Staff', value: safe(hs?.burnoutRiskCount), subtitle: '>20h overtime logged', icon: <Warning sx={{ color: colorPalette.coralSunset, fontSize: '1.3rem' }} />, accent: colorPalette.coralSunset },
        { label: 'Busiest Department', value: hs?.chronicLatenessDept || '—', subtitle: 'Highest hours recorded', icon: <Business sx={{ color: colorPalette.aquaVibrant, fontSize: '1.3rem' }} />, accent: colorPalette.aquaVibrant },
        { label: 'Most Active Station', value: hs?.mostActiveStation || '—', subtitle: 'Most check-ins this month', icon: <LocationOn sx={{ color: colorPalette.seafoamGreen, fontSize: '1.3rem' }} />, accent: colorPalette.seafoamGreen },
    ];

    /* Overworked departments alert */
    const overworkedDepts = activeDepts.filter(d => d.overworked);

    return (
        <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', position: 'relative' }}>
            <AmbientOrbs />

            <Snackbar open={snack.open} autoHideDuration={5000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert severity={snack.severity} variant="filled" elevation={6} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: '14px', fontWeight: 700 }}>{snack.message}</Alert>
            </Snackbar>

            {/* ── Overworked Alert Banner ── */}
            <AnimatePresence>
                {!loading && overworkedDepts.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <Alert severity="warning" variant="filled" icon={<Warning />}
                            sx={{ mb: 2, borderRadius: '14px', fontWeight: 700, backdropFilter: 'blur(16px)', background: 'linear-gradient(90deg, #f59e0b, #f97316)', color: '#fff', position: 'relative', zIndex: 2 }}>
                            ⚠ {overworkedDepts.length} department{overworkedDepts.length > 1 ? 's' : ''} ({overworkedDepts.map(d => d.name).join(', ')}) {overworkedDepts.length > 1 ? 'are' : 'is'} flagged as <strong>overworked</strong> (avg &gt;160h/staff). Immediate review recommended.
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Hero Banner ── */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <OrgHeroBanner data={data} loading={loading} rank={user?.rank} filterLabel={filterLabel} />
            </motion.div>

            {/* ── Toolbar ── */}
            <Reveal>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={2} sx={{ position: 'relative', zIndex: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <QueryStats sx={{ color: colorPalette.deepNavy }} />
                        <Typography variant="h6" fontWeight={900} color={colorPalette.deepNavy}>Organisation Statistics</Typography>
                        <Chip label={new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} size="small" sx={{ bgcolor: `${colorPalette.oceanBlue}12`, color: colorPalette.oceanBlue, fontWeight: 700, fontSize: '0.7rem', borderRadius: '8px' }} />
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Chip label={RANK_LABELS[user?.rank] || 'Admin'} size="small" icon={<Shield sx={{ fontSize: '0.78rem !important', color: `${colorPalette.aquaVibrant} !important` }} />}
                            sx={{ bgcolor: `${colorPalette.aquaVibrant}12`, color: colorPalette.deepNavy, fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${colorPalette.aquaVibrant}28`, borderRadius: '8px' }} />
                        <Button variant="outlined"
                            startIcon={loading ? <CircularProgress size={13} sx={{ color: colorPalette.deepNavy }} /> : <Refresh sx={{ fontSize: '1rem' }} />}
                            onClick={loadData} disabled={loading}
                            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(12px)', borderColor: 'rgba(10,61,98,0.15)', color: colorPalette.deepNavy, '&:hover': { borderColor: colorPalette.oceanBlue, bgcolor: 'rgba(10,61,98,0.06)' } }}>
                            Refresh
                        </Button>
                        <ExportButton data={data} user={user} loading={loading} stationList={stationList} selectedStation={selectedStation} selectedDept={selectedDept} />
                    </Stack>
                </Stack>
            </Reveal>

            {/* ── Filter Bar ── */}
            {!loading && stationList.length > 0 && (
                <FilterBar
                    stationList={stationList}
                    selectedStation={selectedStation}
                    setSelectedStation={setSelectedStation}
                    selectedDept={selectedDept}
                    setSelectedDept={setSelectedDept}
                />
            )}




            {/* ── Health Signals ── */}
            <Box mb={4} sx={{ position: 'relative', zIndex: 1 }}>
                <Reveal><SectionLabel accent={colorPalette.coralSunset} chip="Automated insights" chipColor={colorPalette.coralSunset}>Health Signals</SectionLabel></Reveal>
                <Grid container spacing={3}>
                    {healthCards.map((c, i) => (
                        <Grid item xs={6} sm={3} key={c.label}>
                            <Reveal delay={i * 0.07}>{loading ? <Skeleton variant="rounded" height={145} sx={{ borderRadius: '20px' }} /> : <StatCard {...c} />}</Reveal>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* ── Charts ── */}
            {!loading && data && (
                <ChartsSection
                    data={data}
                    selectedStation={selectedStation}
                    selectedDept={selectedDept}
                />
            )}



            {/* ── Department Table + Top Performers ── */}
            <Grid container w spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
                <Grid item xs={12} lg={7}>
                    <Reveal>
                        <Box sx={{ ...G.card, borderRadius: '22px', overflow: 'hidden', height: '100%' }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ px: { xs: 2, md: 3 }, pt: 3, pb: 2, gap: 1.5 }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Box sx={{ width: 38, height: 38, borderRadius: '12px', bgcolor: `${colorPalette.deepNavy}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Business sx={{ color: colorPalette.deepNavy, fontSize: '1.15rem' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" fontWeight={800} color={colorPalette.deepNavy}>Department Breakdown</Typography>
                                        <Typography variant="caption" color="text.disabled">{filterLabel ? `Filtered: ${filterLabel}` : 'All departments this month'}</Typography>
                                    </Box>
                                    {!loading && <Chip label={`${activeDepts.length} depts`} size="small" sx={{ bgcolor: `${colorPalette.seafoamGreen}12`, color: colorPalette.seafoamGreen, fontWeight: 700, fontSize: '0.7rem', borderRadius: '8px' }} />}
                                </Stack>
                            </Stack>
                            <Divider sx={{ borderColor: 'rgba(10,61,98,0.07)' }} />
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ background: 'rgba(10,61,98,0.04)' }}>
                                            {['Department', 'Staff', 'Total Hrs', 'Avg/Head', 'Late Rate', 'Overwork', 'Load'].map(h => (
                                                <TableCell key={h} sx={{ fontWeight: 900, fontSize: '0.7rem', color: colorPalette.deepNavy, letterSpacing: 0.6, py: 1.6, borderBottom: '1px solid rgba(10,61,98,0.08)', whiteSpace: 'nowrap' }}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading
                                            ? Array.from({ length: 5 }).map((_, i) => (
                                                <TableRow key={i}>{Array.from({ length: 7 }).map((__, j) => (
                                                    <TableCell key={j} sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)' }}><Skeleton sx={{ borderRadius: '8px' }} /></TableCell>
                                                ))}</TableRow>
                                            ))
                                            : activeDepts.length === 0
                                                ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 7, border: 0 }}>
                                                    <Stack alignItems="center" spacing={1.5}>
                                                        <Box sx={{ width: 64, height: 64, borderRadius: '20px', bgcolor: 'rgba(10,61,98,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Business sx={{ fontSize: 34, color: 'rgba(10,61,98,0.25)' }} /></Box>
                                                        <Typography variant="body2" color="text.disabled" fontWeight={600}>No department data for current filter</Typography>
                                                    </Stack>
                                                </TableCell></TableRow>
                                                : activeDepts.map((dept, idx) => {
                                                    const hrs = parseNum(dept.totalHours);
                                                    const loadPct = Math.min((hrs / deptMaxHours) * 100, 100);
                                                    return (
                                                        <motion.tr key={idx} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04, duration: 0.28 }} style={{ display: 'table-row' }}>
                                                            <TableCell sx={{ fontWeight: 700, color: colorPalette.deepNavy, borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.4 }}>{dept.name}</TableCell>
                                                            <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.4 }}>
                                                                <Chip label={dept.headcount} size="small" sx={{ height: 22, fontWeight: 800, fontSize: '0.7rem', borderRadius: '8px', bgcolor: `${colorPalette.oceanBlue}10`, color: colorPalette.oceanBlue }} />
                                                            </TableCell>
                                                            <TableCell sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.4 }}>{dept.totalHours}h</TableCell>
                                                            <TableCell sx={{ fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.4 }}>{dept.averageHoursPerStaff}h</TableCell>
                                                            <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.4 }}>
                                                                <Chip label={dept.disciplineRate} size="small" sx={{ height: 20, fontSize: '0.67rem', fontWeight: 700, borderRadius: '6px', bgcolor: parseNum(dept.disciplineRate) > 20 ? '#ef444418' : '#22c55e14', color: parseNum(dept.disciplineRate) > 20 ? '#dc2626' : '#16a34a' }} />
                                                            </TableCell>
                                                            <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.4 }}>
                                                                {dept.overworked
                                                                    ? <Chip label="⚠ Yes" size="small" sx={{ height: 20, fontSize: '0.67rem', fontWeight: 800, borderRadius: '6px', bgcolor: '#ef444418', color: '#dc2626' }} />
                                                                    : <Chip label="✓ Ok" size="small" sx={{ height: 20, fontSize: '0.67rem', fontWeight: 700, borderRadius: '6px', bgcolor: '#22c55e14', color: '#16a34a' }} />}
                                                            </TableCell>
                                                            <TableCell sx={{ minWidth: 100, borderBottom: '1px solid rgba(10,61,98,0.05)', py: 1.4 }}>
                                                                <LinearProgress variant="determinate" value={loadPct} sx={{ height: 6, borderRadius: 99, bgcolor: `${colorPalette.seafoamGreen}14`, '& .MuiLinearProgress-bar': { bgcolor: colorPalette.seafoamGreen, borderRadius: 99 } }} />
                                                                <Typography variant="caption" color="text.disabled" sx={{ mt: 0.3, display: 'block', fontSize: '0.62rem' }}>{loadPct.toFixed(0)}%</Typography>
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

                {/* ── Top Performers (filtered) ── */}
                <Grid item xs={12} lg={5}>
                    <Reveal delay={0.08}>
                        <TopPerformersList
                            performers={activePerformers}
                            loading={loading}
                            title={filterLabel ? `Top Performers — ${filterLabel}` : 'Top Performers'}
                            subtitle={filterLabel ? 'Filtered by current selection' : 'By attendance & productivity score'}
                        />
                    </Reveal>
                </Grid>
            </Grid>

            {/* ── Station Deep-Dive (when station selected) ── */}
            {!loading && selectedStation && (() => {
                const s = stationList.find(st => st.name === selectedStation);
                if (!s) return null;
                return (
                    <Reveal>
                        <Box sx={{ ...G.cardStrong, borderRadius: '22px', p: 3, mt: 3, position: 'relative', zIndex: 1 }}>
                            <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
                                <Box sx={{ width: 44, height: 44, borderRadius: '14px', bgcolor: `${colorPalette.seafoamGreen}14`, border: `1px solid ${colorPalette.seafoamGreen}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <LocationOn sx={{ color: colorPalette.seafoamGreen }} />
                                </Box>
                                <Box>
                                    <Typography variant="h6" fontWeight={800} color={colorPalette.deepNavy}>Station Deep-Dive: {s.name}</Typography>
                                    <Typography variant="caption" color="text.disabled">Detailed metrics for this station</Typography>
                                </Box>
                            </Stack>
                            <Grid container spacing={2}>
                                {[
                                    { label: 'Headcount', value: s.headcount, accent: colorPalette.oceanBlue, icon: <Person sx={{ fontSize: '1.1rem', color: colorPalette.oceanBlue }} /> },
                                    { label: 'Total Hours', value: `${s.totalHours.toFixed(1)}h`, accent: colorPalette.aquaVibrant, icon: <AccessTime sx={{ fontSize: '1.1rem', color: colorPalette.aquaVibrant }} /> },
                                    { label: 'Overtime', value: `${s.totalOvertime.toFixed(1)}h`, accent: '#f59e0b', icon: <WorkHistory sx={{ fontSize: '1.1rem', color: '#f59e0b' }} /> },
                                    { label: 'Efficiency', value: s.efficiencyScore, accent: colorPalette.seafoamGreen, icon: <TrendingUp sx={{ fontSize: '1.1rem', color: colorPalette.seafoamGreen }} />, progress: s.efficiencyNum },
                                    { label: 'Late Rate', value: s.disciplineRate, accent: colorPalette.coralSunset, icon: <Schedule sx={{ fontSize: '1.1rem', color: colorPalette.coralSunset }} /> },
                                    { label: 'Total Check-ins', value: s.totalCheckins, accent: '#6366f1', icon: <CheckCircle sx={{ fontSize: '1.1rem', color: '#6366f1' }} /> },
                                ].map((c, i) => (
                                    <Grid item xs={6} sm={4} md={2} key={c.label}>
                                        <Box sx={{ ...G.card, p: 2, borderRadius: '16px', textAlign: 'center', '&:hover': { transform: 'translateY(-3px)' }, transition: 'all 0.2s' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.8 }}>{c.icon}</Box>
                                            <Typography variant="h6" fontWeight={900} sx={{ color: c.accent, fontVariantNumeric: 'tabular-nums' }}>{c.value}</Typography>
                                            <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ fontSize: '0.66rem' }}>{c.label}</Typography>
                                            {c.progress != null && <LinearProgress variant="determinate" value={Math.min(c.progress, 100)} sx={{ height: 4, borderRadius: 99, mt: 0.6, bgcolor: `${c.accent}14`, '& .MuiLinearProgress-bar': { bgcolor: c.accent } }} />}
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Reveal>
                );
            })()}

        </Box>
    );
}