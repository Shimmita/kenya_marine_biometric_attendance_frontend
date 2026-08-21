import {
    AccessTimeRounded, ClearRounded, Download,
    History, LocationOnRounded, ManageSearchRounded, Refresh,
    SearchRounded, TaskAltRounded, TipsAndUpdatesRounded, TrendingDown, TrendingUp, VerifiedRounded,
    WarningAmberRounded, WorkHistoryRounded
} from '@mui/icons-material';
import {
    Alert, Box, Button, Chip, CircularProgress, Divider, Grid, InputAdornment,
    LinearProgress, MenuItem, Skeleton, Snackbar, Stack, Table, TableBody,
    TableCell, TableContainer, TableHead, TablePagination, TableRow,
    TextField, Typography,
} from '@mui/material';
import { motion as Motion, useInView } from 'framer-motion';
import QRCode from 'qrcode';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid,
    ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis
} from 'recharts';
import KMFRILogo from "../../images/kmfri_logo.png";
import { trackClientAuditEvent } from '../../service/AuditorService.jsx';
import { fetchAttendanceStats, fetchClockingHistory } from '../../service/ClockingService';
import { createExportVerification, updateExportVerificationContent } from '../../service/VerificationService';
import coreDataDetails from '../CoreDataDetails';
import { formatDate, formatTime, getLocalDateInputValue, safeNewDate } from '../util/DateTimeFormater';



const { colorPalette } = coreDataDetails;

/* ══ GLASS TOKENS ══════════════════════════════════════════════════════════ */
const G = {
    card: { background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', border: '1px solid rgba(255,255,255,0.60)', boxShadow: '0 4px 24px rgba(10,61,98,0.08), inset 0 1px 0 rgba(255,255,255,0.80)' },
    cardStrong: { background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(28px) saturate(200%)', WebkitBackdropFilter: 'blur(28px) saturate(200%)', border: '1px solid rgba(255,255,255,0.72)', boxShadow: '0 8px 32px rgba(10,61,98,0.12), inset 0 1px 0 rgba(255,255,255,0.90)' },
    tile: { background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.22)' },
    heroBg: 'linear-gradient(140deg, #061e30 0%, #0a3560 42%, #073a52 68%, #052840 100%)',
    input: { '& .MuiOutlinedInput-root': { borderRadius: '12px', background: 'rgba(10,61,98,0.03)', '&:hover fieldset': { borderColor: colorPalette.oceanBlue }, '&.Mui-focused fieldset': { borderColor: colorPalette.oceanBlue, borderWidth: 2 } } },
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
    const locationName = isEntry ? rec.clockInLocationName : rec.clockOutLocationName;
    const withinPremise = isEntry ? rec.clockInWithinPremise : rec.clockOutWithinPremise;
    const status = (rec?.clockedOutside || rec?.clockedOutSide || locationName) ? 'Off Premise' : 'In Premise';
    if (withinPremise === true) return 'In Premise';
    if (!locationName) return withinPremise === false ? 'Off Premise' : status;
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


/* ══ AMBIENT ORBS ══════════════════════════════════════════════════════════ */
const AmbientOrbs = () => (
    <>
        {[{ s: 420, t: -60, l: -100, c: 'rgba(10,100,180,0.07)', b: 70 }, { s: 350, t: '40%', r: -80, c: 'rgba(32,178,170,0.06)', b: 60 }, { s: 500, bot: -120, l: '30%', c: 'rgba(10,61,98,0.05)', b: 80 }]
            .map(({ s, t, l, r, bot, c, b }, i) => (
                <Box key={i} sx={{ position: 'absolute', width: s, height: s, pointerEvents: 'none', zIndex: 0, top: t, left: l, right: r, bottom: bot, borderRadius: '50%', background: c, filter: `blur(${b}px)` }} />
            ))}
    </>
);

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

/* ══ GLASS TOOLTIP FOR RECHARTS ════════════════════════════════════════════ */
const GlassTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(24px)', border: '1px solid rgba(10,61,98,0.12)', borderRadius: '14px', px: 2, py: 1.5, boxShadow: '0 10px 36px rgba(10,61,98,0.16)', minWidth: 130 }}>
            {label && <Typography variant="caption" fontWeight={800} color={colorPalette.deepNavy} sx={{ display: 'block', mb: 0.6 }}>{label}</Typography>}
            {payload.map((p, i) => (
                <Stack key={i} direction="row" alignItems="center" spacing={1} sx={{ mt: 0.3 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color || p.fill, flexShrink: 0 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{p.name || p.dataKey}:</Typography>
                    <Typography variant="caption" fontWeight={900} color={colorPalette.deepNavy}>{p.value}{p.unit || ''}</Typography>
                </Stack>
            ))}
        </Box>
    );
};

/* ══ ANIMATED STAT CARD ════════════════════════════════════════════════════ */
const StatCard = ({ label, value, subtitle, icon, accent, trend, trendLabel, progress }) => (
    <Box sx={{
        ...G.card, p: 2.5, height: '100%', borderRadius: '20px', position: 'relative', overflow: 'hidden',
        transition: 'all 0.26s ease',
        '&:hover': { transform: 'translateY(-5px)', boxShadow: `0 16px 42px rgba(10,61,98,0.16)` },
        '&::after': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '20px 20px 0 0', background: `linear-gradient(90deg,${accent},${accent}66)` },
        '&::before': { content: '""', position: 'absolute', top: -24, right: -24, width: 84, height: 84, borderRadius: '50%', background: `${accent}10`, zIndex: 0 },
    }}>
        <Stack spacing={1.5} sx={{ position: 'relative', zIndex: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ width: 44, height: 44, borderRadius: '14px', bgcolor: `${accent}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${accent}22` }}>
                    {icon}
                </Box>
                {trend != null && <Chip size="small"
                    icon={trend >= 0 ? <TrendingUp sx={{ fontSize: '0.78rem !important', color: '#22c55e !important' }} /> : <TrendingDown sx={{ fontSize: '0.78rem !important', color: '#ef4444 !important' }} />}
                    label={trendLabel || `${Math.abs(trend)}%`}
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 800, bgcolor: trend >= 0 ? '#22c55e18' : '#ef444418', color: trend >= 0 ? '#16a34a' : '#dc2626', borderRadius: '8px', '& .MuiChip-label': { px: 0.8 } }}
                />}
            </Stack>
            <Box>
                <Typography variant="h4" fontWeight={900} sx={{ color: accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value ?? <Skeleton width={60} />}</Typography>
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mt: 0.3 }}>{label}</Typography>
                {subtitle && <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.2 }}>{subtitle}</Typography>}
            </Box>
            {progress != null && <Box>
                <LinearProgress variant="determinate" value={Math.min(Number(progress), 100)}
                    sx={{ height: 6, borderRadius: 99, bgcolor: `${accent}14`, '& .MuiLinearProgress-bar': { bgcolor: accent, borderRadius: 99 } }} />
                <Typography variant="caption" color="text.disabled" sx={{ mt: 0.4, display: 'block' }}>{progress}%</Typography>
            </Box>}
        </Stack>
    </Box>
);

/* ══ HERO BANNER ═══════════════════════════════════════════════════════════ */
const HeroBanner = ({ stats, loading }) => (
    <Box sx={{ borderRadius: '24px', background: G.heroBg, position: 'relative', overflow: 'hidden', mb: 3, p: { xs: 3, md: 4 } }}>
        <Box sx={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(0,180,200,0.10)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -80, left: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(10,61,98,0.30)', filter: 'blur(50px)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', top: '30%', left: '42%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(0,220,255,0.07)', filter: 'blur(35px)', pointerEvents: 'none' }} />
        <Grid container spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid item xs={12} md={5}>
                <Typography variant="caption" sx={{ opacity: 0.55, fontWeight: 900, letterSpacing: 2.2, textTransform: 'uppercase', color: '#fff', display: 'block' }}>
                    {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                </Typography>
                <Stack direction="row" alignItems="baseline" spacing={1.5} mt={0.5}>
                    <Motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                        <Typography variant="h2" fontWeight={900} sx={{ fontSize: { xs: '3rem', md: '4.2rem' }, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.28)' }}>
                            {loading ? '—' : safe(stats?.monthly?.attendanceRate, '%')}
                        </Typography>
                    </Motion.div>
                    <Typography variant="h6" sx={{ opacity: 0.65, color: '#fff' }}>Attendance</Typography>
                </Stack>
                <Motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
                    <Stack direction="row" alignItems="center" spacing={0.8} mt={1}>
                        <TrendingUp sx={{ fontSize: '1rem', opacity: 0.65, color: '#00e5ff' }} />
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                            {loading ? 'Loading stats…' : stats?.summary || ''}
                        </Typography>
                    </Stack>
                </Motion.div>
            </Grid>
            <Grid item xs={12} md={7}>
                <Grid container spacing={1.8}>
                    {[{ label: 'Days Present', val: stats?.monthly?.presentDays }, { label: 'Total Hours', val: stats?.monthly?.totalHours }, { label: 'Overtime', val: stats?.monthly?.overtimeHours }, { label: 'Avg Hrs/Day', val: stats?.monthly?.avgHoursPerDay }]
                        .map(({ label, val }, i) => (
                            <Grid item xs={6} sm={3} key={label}>
                                <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                                    <Box sx={{ ...G.tile, p: 1.6, borderRadius: '16px', transition: 'all 0.22s ease', '&:hover': { background: 'rgba(255,255,255,0.22)', transform: 'translateY(-4px)' } }}>
                                        <Typography variant="h5" fontWeight={900} sx={{ fontVariantNumeric: 'tabular-nums', color: '#fff', lineHeight: 1.2 }}>{loading ? '…' : val ?? '—'}</Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.62, color: '#fff', display: 'block', mt: 0.3 }}>{label}</Typography>
                                    </Box>
                                </Motion.div>
                            </Grid>
                        ))}
                </Grid>
            </Grid>
        </Grid>
    </Box>
);

const SectionLabel = ({ children, accent, chip }) => (
    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Box sx={{ width: 4, height: 18, borderRadius: 2, bgcolor: accent }} />
        <Typography variant="subtitle1" fontWeight={800} color={colorPalette.deepNavy}>{children}</Typography>
        {chip && <Chip label={chip} size="small" sx={{ bgcolor: `${accent}14`, color: accent, fontWeight: 700, fontSize: '0.7rem', borderRadius: '8px' }} />}
    </Stack>
);

/* ══ CHART SECTION ═════════════════════════════════════════════════════════ */
const ChartSection = ({ history }) => {
    /* ── Hours bar: last 14 days ── */
    const hoursData = useMemo(() =>
        [...history].slice(0, 14).reverse().map(r => ({
            date: r.date?.slice(0, 5) || '',
            hours: r.hours !== '—' ? parseFloat(r.hours) : 0,
            target: 9,
        }))
        , [history]);

    /* ── Weekly timing: Early vs Late count ── */
    const timingData = useMemo(() => {
        const map = {};
        history.forEach(r => {
            if (!r.rawDate) return;
            const d = r.rawDate;
            const wk = `${d.toLocaleString('default', { month: 'short' })} W${Math.ceil(d.getDate() / 7)}`;
            if (!map[wk]) map[wk] = { week: wk, Early: 0, Late: 0 };
            map[wk][r.timing === 'Late' ? 'Late' : 'Early']++;
        });
        return Object.values(map).slice(-8).reverse();
    }, [history]);

    /* ── Monthly hours bar (group by month) ── */
    const monthlyHoursData = useMemo(() => {
        const map = {};
        history.forEach(r => {
            if (!r.rawDate || r.hours === '—') return;
            const key = r.rawDate.toLocaleString('default', { month: 'short', year: '2-digit' });
            if (!map[key]) map[key] = { month: key, hours: 0, days: 0 };
            map[key].hours += parseFloat(r.hours) || 0;
            map[key].days++;
        });
        return Object.values(map).slice(-6).reverse().map(m => ({ ...m, hours: parseFloat(m.hours.toFixed(1)) }));
    }, [history]);


    return (
        <Box mb={4} sx={{ position: 'relative', zIndex: 1 }}>
            <Reveal>
                <SectionLabel accent={colorPalette.cyanFresh} chip="Interactive charts">Visual Insights</SectionLabel>
            </Reveal>
            <Grid container spacing={2.5}>

                {/* ── Bar: Daily Hours (last 14 days) ── */}
                <Grid item xs={12} md={8}>
                    <Reveal delay={0.07}>
                        <Box sx={{ ...G.card, borderRadius: '22px', p: 2.8 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Box sx={{ width: 4, height: 16, borderRadius: 2, bgcolor: colorPalette.oceanBlue }} />
                                    <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Daily Hours Logged</Typography>
                                    <Chip label="Last 14 days" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: `${colorPalette.oceanBlue}10`, color: colorPalette.oceanBlue, borderRadius: '6px' }} />
                                </Stack>
                                <Stack direction="row" spacing={2}>
                                    {[{ c: 'url(#hoursGrad)', l: 'Actual' }, { c: 'rgba(10,61,98,0.12)', l: '9h target' }].map(({ c, l }) => (
                                        <Stack key={l} direction="row" alignItems="center" spacing={0.5}>
                                            <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: c.includes('url') ? colorPalette.aquaVibrant : c }} />
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{l}</Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Stack>
                            <Typography variant="caption" color="text.disabled" display="block" mb={1.5}>Hours worked per day vs 9-hour target</Typography>
                            <ResponsiveContainer width="100%" height={195}>
                                <BarChart data={hoursData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }} barCategoryGap="28%" barGap={2}>
                                    <defs>
                                        <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={colorPalette.aquaVibrant} stopOpacity={0.95} />
                                            <stop offset="100%" stopColor={colorPalette.oceanBlue} stopOpacity={0.65} />
                                        </linearGradient>
                                        <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="rgba(10,61,98,0.15)" stopOpacity={1} />
                                            <stop offset="100%" stopColor="rgba(10,61,98,0.04)" stopOpacity={1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 13]} />
                                    <RTooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(10,61,98,0.04)', radius: [4, 4, 0, 0] }} />
                                    <Bar dataKey="target" fill="url(#targetGrad)" radius={[5, 5, 0, 0]} name="Target (9h)" animationDuration={600} />
                                    <Bar dataKey="hours" fill="url(#hoursGrad)" radius={[7, 7, 0, 0]} name="Hours" animationDuration={900} animationBegin={200} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Reveal>
                </Grid>

                {/* ── Stacked Area: Punctuality trend ── */}
                <Grid item xs={12} md={7}>
                    <Reveal delay={0.12}>
                        <Box sx={{ ...G.card, borderRadius: '22px', p: 2.8 }}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                <Box sx={{ width: 4, height: 16, borderRadius: 2, bgcolor: colorPalette.seafoamGreen }} />
                                <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Punctuality Trend</Typography>
                                <Chip label="Early vs Late" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: `${colorPalette.seafoamGreen}12`, color: colorPalette.seafoamGreen, borderRadius: '6px' }} />
                            </Stack>
                            <Typography variant="caption" color="text.disabled" display="block" mb={1.5}>Weekly breakdown of on-time vs late arrivals</Typography>
                            <ResponsiveContainer width="100%" height={185}>
                                <AreaChart data={timingData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="earlyFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={colorPalette.seafoamGreen} stopOpacity={0.45} />
                                            <stop offset="95%" stopColor={colorPalette.seafoamGreen} stopOpacity={0.02} />
                                        </linearGradient>
                                        <linearGradient id="lateFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={colorPalette.coralSunset} stopOpacity={0.40} />
                                            <stop offset="95%" stopColor={colorPalette.coralSunset} stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" vertical={false} />
                                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <RTooltip content={<GlassTooltip />} />
                                    <Area type="monotone" dataKey="Early" stroke={colorPalette.seafoamGreen} strokeWidth={2.5} fill="url(#earlyFill)" name="Early" dot={{ r: 4, fill: colorPalette.seafoamGreen, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 2, stroke: 'white' }} animationDuration={900} animationBegin={300} />
                                    <Area type="monotone" dataKey="Late" stroke={colorPalette.coralSunset} strokeWidth={2.5} fill="url(#lateFill)" name="Late" dot={{ r: 4, fill: colorPalette.coralSunset, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 2, stroke: 'white' }} animationDuration={900} animationBegin={450} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </Reveal>
                </Grid>

                {/* ── Bar: Monthly total hours ── */}
                <Grid item xs={12} md={5}>
                    <Reveal delay={0.17}>
                        <Box sx={{ ...G.card, borderRadius: '22px', p: 2.8, height: '100%' }}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                <Box sx={{ width: 4, height: 16, borderRadius: 2, bgcolor: '#f59e0b' }} />
                                <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Monthly Hours</Typography>
                                <Chip label="6 months" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f59e0b14', color: '#d97706', borderRadius: '6px' }} />
                            </Stack>
                            <Typography variant="caption" color="text.disabled" display="block" mb={1.5}>Total hours logged per month</Typography>
                            <ResponsiveContainer width="100%" height={185}>
                                <BarChart data={monthlyHoursData} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="monthlyGrad" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor={colorPalette.coralSunset} stopOpacity={0.7} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="month" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} axisLine={false} tickLine={false} width={52} />
                                    <RTooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(10,61,98,0.04)' }} />
                                    <Bar dataKey="hours" fill="url(#monthlyGrad)" radius={[0, 8, 8, 0]} name="Total Hours" animationDuration={900} animationBegin={200}
                                        label={{ position: 'right', fontSize: 9, fill: '#94a3b8', fontWeight: 700, formatter: v => `${v}h` }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Reveal>
                </Grid>

            </Grid>
        </Box>
    );
};

const getDateDaysAgoInput = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return getLocalDateInputValue(date);
};

const getRecordStatus = ({ durationHours, missedClockOut, rawClockOut }) => {
    if (missedClockOut) return "System Clock-out";
    if (!rawClockOut) return "Open Session";
    if (durationHours >= 5) return "Present";
    if (durationHours > 0) return "Half Day";
    return "Incomplete";
};

const durationBandMatches = (row, band) => {
    if (band === "All") return true;
    if (band === "Under 5h") return row.durationHours > 0 && row.durationHours < 5;
    if (band === "5-9h") return row.durationHours >= 5 && row.durationHours <= 9;
    if (band === "Overtime") return row.durationHours > 9;
    return true;
};

const getStatusChipSx = (status) => {
    const map = {
        Present: { bgcolor: "#dcfce7", color: "#166534" },
        "Half Day": { bgcolor: "#fef3c7", color: "#92400e" },
        "System Clock-out": { bgcolor: "#e0f2fe", color: "#075985" },
        "Open Session": { bgcolor: "#fee2e2", color: "#991b1b" },
        Incomplete: { bgcolor: "#f1f5f9", color: "#475569" },
    };
    return { ...(map[status] || map.Incomplete), fontWeight: 800, borderRadius: "8px", height: 24 };
};

const MetricTile = ({ icon, label, value, detail, accent = colorPalette.oceanBlue }) => (
    <Box sx={{
        ...G.card,
        p: 2,
        height: "100%",
        borderRadius: "8px",
        borderColor: "rgba(10,61,98,0.10)",
        boxShadow: "0 4px 18px rgba(10,61,98,0.06)",
    }}>
        <Stack direction="row" spacing={1.4} alignItems="flex-start">
            <Box sx={{ width: 38, height: 38, borderRadius: "8px", bgcolor: `${accent}14`, color: accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" fontWeight={900} sx={{ color: colorPalette.deepNavy, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</Typography>
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

/* ══ MAIN ══════════════════════════════════════════════════════════════════ */
export default function AttendanceHistoryContent() {
    const { user } = useSelector(s => s.currentUser);
    const [stats, setStats] = useState(null);
    const [rawHistory, setRawHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterTiming, setFilterTiming] = useState('All');
    const [filterStartDate, setFilterStartDate] = useState(getDateDaysAgoInput(30));
    const [filterEndDate, setFilterEndDate] = useState(getLocalDateInputValue());
    const [filterPremise, setFilterPremise] = useState('All');
    const [filterClockOut, setFilterClockOut] = useState('All');
    const [filterDuration, setFilterDuration] = useState('All');
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
                const status = getRecordStatus({ durationHours, missedClockOut: rec.missedClockOut, rawClockOut });

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
                    duration: rawClockIn && rawClockOut ? durationHours.toFixed(2) : '—',
                    timing: rec.isLate ? 'Late' : 'Early',
                    status,
                    premise,
                    clockOutState: rec.missedClockOut ? "System Closed" : rawClockOut ? "Completed" : "Open",
                    searchable: [formatDate(createdDate), formatTime(rawClockIn), formatTime(rawClockOut), inLocation, outLocation, whyOut, status, premise].join(" ").toLowerCase(),
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
        status: filterStatus,
        timing: filterTiming,
        premise: filterPremise,
        clockOut: filterClockOut,
        duration: filterDuration,
        search: searchTerm || "none",
    }), [filterStartDate, filterEndDate, filterStatus, filterTiming, filterPremise, filterClockOut, filterDuration, searchTerm]);

    const filteredRows = useMemo(() => rawHistory.filter(row => {
        if (!row?.rawDate) return false;
        if (filterStartDate && row.dateKey < filterStartDate) return false;
        if (filterEndDate && row.dateKey > filterEndDate) return false;
        if (filterStatus !== 'All' && row.status !== filterStatus) return false;
        if (filterTiming !== 'All' && row.timing !== filterTiming) return false;
        if (filterPremise !== 'All' && row.premise !== filterPremise) return false;
        if (filterClockOut !== 'All' && row.clockOutState !== filterClockOut) return false;
        if (!durationBandMatches(row, filterDuration)) return false;
        if (searchTerm.trim() && !row.searchable.includes(searchTerm.trim().toLowerCase())) return false;
        return true;
    }), [rawHistory, filterStartDate, filterEndDate, filterStatus, filterTiming, filterPremise, filterClockOut, filterDuration, searchTerm]);

    const personalMetrics = useMemo(() => {
        const source = filteredRows;
        const totalHours = source.reduce((sum, row) => sum + (Number(row.durationHours) || 0), 0);
        const completedRows = source.filter(row => row.clockOutState !== "Open").length;
        const presentRows = source.filter(row => ["Present", "System Clock-out"].includes(row.status)).length;
        const lateRows = source.filter(row => row.timing === "Late").length;
        const offPremiseRows = source.filter(row => row.premise === "Off Premise").length;
        const attentionRows = source.filter(row => ["Open Session", "Incomplete", "System Clock-out"].includes(row.status)).length;
        const averageHours = source.length ? totalHours / source.length : 0;
        const completionRate = source.length ? (completedRows / source.length) * 100 : 0;
        const overtimeRows = source.filter(row => row.durationHours > 9).length;

        return {
            totalHours: totalHours.toFixed(1),
            averageHours: averageHours.toFixed(1),
            presentRows,
            lateRows,
            offPremiseRows,
            attentionRows,
            completionRate: completionRate.toFixed(0),
            overtimeRows,
        };
    }, [filteredRows]);

    const attendanceRecommendation = useMemo(() => {
        const rate = Number(stats?.monthly?.attendanceRate ?? 0);
        const lateCount = Number(personalMetrics.lateRows || 0);
        const reviewCount = Number(personalMetrics.attentionRows || 0);
        const offPremiseCount = Number(personalMetrics.offPremiseRows || 0);

        const supportingActions = [];
        if (reviewCount > 0) supportingActions.push(`Review ${reviewCount} open, incomplete, or system-closed record${reviewCount === 1 ? "" : "s"} before exporting official records.`);
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
                    "Use the date and status filters to inspect any days that look unusual.",
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
        setFilterStatus('All');
        setFilterTiming('All');
        setFilterStartDate(getDateDaysAgoInput(30));
        setFilterEndDate(getLocalDateInputValue());
        setFilterPremise('All');
        setFilterClockOut('All');
        setFilterDuration('All');
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
                `FILTERS: STATUS ${filterStatus.toUpperCase()} | TIMING ${filterTiming.toUpperCase()} | PREMISE ${filterPremise.toUpperCase()}`,
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
                    ["Late Arrivals", personalMetrics.lateRows, "Matching late records"],
                    ["Off-Premise Records", personalMetrics.offPremiseRows, "Clocking activity outside premise"],
                    ["Records Needing Review", personalMetrics.attentionRows, "Open, incomplete, or system-closed rows"],
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
                        "DURATION",
                        "STATUS",
                        "TIMING",
                        "PREMISE",
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
                    normalizeExportValue(r.duration === "—" ? r.duration : `${r.duration}h`),
                    normalizeExportTextValue(r.status),
                    normalizeExportTextValue(r.timing),
                    normalizeExportTextValue(r.premise),
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
                    8: { cellWidth: 42 },
                    9: { cellWidth: 42 },
                    10: { cellWidth: 34 },
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
        <Box sx={{ width: '100%', maxWidth: '100%', mx: 'auto', position: 'relative' }}>
            <Snackbar open={snack.open} autoHideDuration={5000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert severity={snack.severity} variant="filled" elevation={6} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: '14px', fontWeight: 700, backdropFilter: 'blur(16px)' }}>{snack.message}</Alert>
            </Snackbar>

            <Reveal>
                <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" spacing={2} sx={{ mb: 3, position: "relative", zIndex: 1 }}>
                    <Stack spacing={0.7}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <VerifiedRounded sx={{ color: colorPalette.oceanBlue }} />
                            <Typography variant="h5" fontWeight={900} color={colorPalette.deepNavy}>My Attendance History</Typography>
                            <Chip size="small" label="Personal records" sx={{ bgcolor: `${colorPalette.oceanBlue}10`, color: colorPalette.oceanBlue, fontWeight: 800, borderRadius: "8px" }} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                            Review your attendance pattern, resolve incomplete records, and export verifiable KMFRI records.
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1.5}>
                        <Button variant="outlined" startIcon={<Refresh sx={{ fontSize: '1rem' }} />} onClick={loadData} disabled={loading}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 800, fontSize: '0.82rem', background: '#fff', borderColor: 'rgba(10,61,98,0.18)', color: colorPalette.deepNavy, '&:hover': { borderColor: colorPalette.oceanBlue } }}>
                            Refresh
                        </Button>
                        <Button variant="contained" startIcon={exporting ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <Download />} onClick={handleExportPDF} disabled={exporting || historyLoading}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 800, fontSize: '0.82rem', background: colorPalette.oceanGradient, boxShadow: `0 6px 18px ${colorPalette.oceanBlue}35`, '&:hover': { boxShadow: `0 8px 24px ${colorPalette.oceanBlue}45` }, transition: 'all 0.22s' }}>
                            {exporting ? 'Generating…' : 'Export Records PDF'}
                        </Button>
                    </Stack>
                </Stack>
            </Reveal>

            <Reveal delay={0.03}>
                <Box sx={{ ...G.card, borderRadius: "8px", p: { xs: 2, md: 2.4 }, mb: 3, position: "relative", zIndex: 1 }}>
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
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <TextField fullWidth size="small" label="Search records" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(0); }} sx={G.input}
                                InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> }} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField fullWidth size="small" type="date" label="From" value={filterStartDate} onChange={e => { setFilterStartDate(e.target.value); setPage(0); }} InputLabelProps={{ shrink: true }} sx={G.input} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField fullWidth size="small" type="date" label="To" value={filterEndDate} onChange={e => { setFilterEndDate(e.target.value); setPage(0); }} InputLabelProps={{ shrink: true }} sx={G.input} />
                        </Grid>
                        {[
                            { label: 'Status', val: filterStatus, set: setFilterStatus, items: ['All', 'Present', 'Half Day', 'System Clock-out', 'Open Session', 'Incomplete'] },
                            { label: 'Timing', val: filterTiming, set: setFilterTiming, items: ['All', 'Early', 'Late'] },
                            { label: 'Premise', val: filterPremise, set: setFilterPremise, items: ['All', 'In Premise', 'Off Premise'] },
                            { label: 'Clock-out', val: filterClockOut, set: setFilterClockOut, items: ['All', 'Completed', 'System Closed', 'Open'] },
                            { label: 'Duration', val: filterDuration, set: setFilterDuration, items: ['All', 'Under 5h', '5-9h', 'Overtime'] },
                        ].map(({ label, val, set, items }) => (
                            <Grid item xs={12} sm={6} md={2.4} key={label}>
                                <TextField select fullWidth size="small" label={label} value={val} onChange={e => { set(e.target.value); setPage(0); }} sx={G.input}>
                                    {items.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                                </TextField>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Reveal>

            <Reveal delay={0.04}>
                <Grid container spacing={2} sx={{ mb: 3, position: "relative", zIndex: 1 }}>
                    <Grid item xs={12} sm={6} lg={3}>
                        <MetricTile icon={<WorkHistoryRounded />} label="Monthly Attendance" value={loading ? "..." : safe(stats?.monthly?.attendanceRate, "%")} detail={`${stats?.monthly?.presentDays ?? "—"} present days this month`} accent={colorPalette.oceanBlue} />
                    </Grid>
                    <Grid item xs={12} sm={6} lg={3}>
                        <MetricTile icon={<AccessTimeRounded />} label="Filtered Hours" value={`${personalMetrics.totalHours}h`} detail={`${personalMetrics.averageHours}h average per record`} accent="#0f766e" />
                    </Grid>
                    <Grid item xs={12} sm={6} lg={3}>
                        <MetricTile icon={<TaskAltRounded />} label="Completion Rate" value={`${personalMetrics.completionRate}%`} detail={`${personalMetrics.overtimeRows} overtime records`} accent="#2563eb" />
                    </Grid>
                    <Grid item xs={12} sm={6} lg={3}>
                        <MetricTile icon={<WarningAmberRounded />} label="Needs Review" value={personalMetrics.attentionRows} detail={`${personalMetrics.offPremiseRows} off-premise records`} accent="#dc2626" />
                    </Grid>
                </Grid>
            </Reveal>

            <Reveal delay={0.06}>
                <RecommendationPanel recommendation={attendanceRecommendation} filteredCount={filteredRows.length} />
            </Reveal>

            {/* CHARTS */}
            {!historyLoading && filteredRows.length > 0 && <ChartSection history={filteredRows} />}



            {/* Records Table */}
            <Reveal>
                <Box sx={{ ...G.card, borderRadius: '22px', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
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
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ background: 'rgba(10,61,98,0.04)' }}>
                                    {['Date', 'Clock In', 'Clock Out', 'Duration', 'Status', 'Timing', 'Premise', 'In Location', 'Out Location', 'Why Out'].map(h => (
                                        <TableCell key={h} sx={{ fontWeight: 900, fontSize: '0.72rem', color: colorPalette.deepNavy, letterSpacing: 0.6, py: 1.6, borderBottom: '1px solid rgba(10,61,98,0.08)', whiteSpace: 'nowrap' }}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historyLoading
                                    ? Array.from({ length: 6 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 10 }).map((__, j) => <TableCell key={j} sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)' }}><Skeleton sx={{ borderRadius: '8px' }} /></TableCell>)}</TableRow>)
                                    : paginatedRows.length === 0
                                        ? <TableRow><TableCell colSpan={10} align="center" sx={{ py: 7, border: 0 }}><Stack alignItems="center" spacing={1.5}><Box sx={{ width: 68, height: 68, borderRadius: '8px', bgcolor: 'rgba(10,61,98,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ManageSearchRounded sx={{ fontSize: 36, color: 'rgba(10,61,98,0.25)' }} /></Box><Typography variant="body2" color="text.disabled" fontWeight={600}>No records match the selected filters</Typography><Button size="small" onClick={resetFilters} sx={{ textTransform: 'none', color: colorPalette.oceanBlue, fontWeight: 800, borderRadius: '8px', bgcolor: `${colorPalette.oceanBlue}08`, px: 2 }}>Clear filters</Button></Stack></TableCell></TableRow>
                                        : paginatedRows.map((row, idx) => (
                                            <Motion.tr key={idx} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.025, duration: 0.25, ease: 'easeOut' }} style={{ display: 'table-row' }}>
                                                <TableCell sx={{ fontWeight: 800, color: colorPalette.deepNavy, whiteSpace: 'nowrap', borderBottom: '1px solid rgba(10,61,98,0.05)' }}>{row.date}</TableCell>
                                                <TableCell sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: 'text.secondary', borderBottom: '1px solid rgba(10,61,98,0.05)' }}>{row.clockIn}</TableCell>
                                                <TableCell sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: 'text.secondary', borderBottom: '1px solid rgba(10,61,98,0.05)' }}>{row.clockOut}</TableCell>
                                                <TableCell sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: 'text.secondary', borderBottom: '1px solid rgba(10,61,98,0.05)' }}>{row.duration === '—' ? row.duration : `${row.duration}h`}</TableCell>
                                                <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', whiteSpace: 'nowrap' }}><Chip size="small" label={row.status} sx={getStatusChipSx(row.status)} /></TableCell>
                                                <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', whiteSpace: 'nowrap' }}><Chip size="small" label={row.timing} sx={{ height: 24, borderRadius: '8px', fontWeight: 800, bgcolor: row.timing === 'Late' ? '#fee2e2' : '#dcfce7', color: row.timing === 'Late' ? '#991b1b' : '#166534' }} /></TableCell>
                                                <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', whiteSpace: 'nowrap' }}><Stack direction="row" alignItems="center" spacing={0.5}><LocationOnRounded sx={{ fontSize: 15, color: row.premise === 'Off Premise' ? '#dc2626' : '#0f766e' }} /><Typography variant="body2" color="text.secondary">{row.premise}</Typography></Stack></TableCell>
                                                <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', whiteSpace: 'normal', maxWidth: 280 }}><Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280 }}>{row.inLocation}</Typography></TableCell>
                                                <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', whiteSpace: 'normal', maxWidth: 280 }}><Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280 }}>{row.outLocation}</Typography></TableCell>
                                                <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)', whiteSpace: 'normal', maxWidth: 320 }}><Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>{row.whyOut || '—'}</Typography></TableCell>
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
