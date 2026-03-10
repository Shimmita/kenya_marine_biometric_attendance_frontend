import {
    AccessTime, BusinessCenter,
    CheckCircle,
    EmojiEvents, FiberManualRecord, Fingerprint, History,
    InfoOutlined, LocationOn, QueryStats,
    WorkHistory
} from '@mui/icons-material';
import {
    Alert, Box, Button, Chip, CircularProgress,
    Grid,
    InputAdornment, MenuItem, Skeleton, Snackbar, Stack,
    Table, TableBody, TableCell,
    TableHead, TableRow,
    TextField, Typography, useMediaQuery, useTheme
} from '@mui/material';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, RadialBar,
    RadialBarChart,
    ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts';
import { updateUserCurrentDeviceRedux } from '../../redux/CurrentDevice';
import { updateUserCurrentUserRedux } from '../../redux/CurrentUser';
import { registerFingerprint, verifyFingerprint } from '../../service/Biometrics';
import { fetchAttendanceStats, fetchClockingHistory } from '../../service/ClockingService';
import { addNewDevice, fetchMyDevices } from '../../service/DeviceService';
import { getDeviceFingerprint } from '../../service/Fingerprinting';
import { revokeClockOutsideStatus } from '../../service/UserManagement';
import { getUserProfile } from '../../service/UserProfile';
import coreDataDetails from '../CoreDataDetails';
import { formatDate, formatTime } from '../util/DateTimeFormater';
import { calculateDistanceMeters } from '../util/DistanceMeasure';
import LiveClock from '../util/LiveClock';
import { detectCurrentDevice } from './AddDevice';

const { AvailableStations, colorPalette } = coreDataDetails;
const GEOFENCE_RADIUS_METERS = 500000;

/* ══ GLASS TOKENS ══════════════════════════════════════════════════════════ */
const G = {
    card: {
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.60)',
        boxShadow: '0 4px 24px rgba(10,61,98,0.08), inset 0 1px 0 rgba(255,255,255,0.80)',
    },
    cardStrong: {
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        border: '1px solid rgba(255,255,255,0.72)',
        boxShadow: '0 8px 32px rgba(10,61,98,0.12), inset 0 1px 0 rgba(255,255,255,0.90)',
    },
    tinted: (accent) => ({
        background: 'rgba(255,255,255,0.62)',
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        border: `1px solid ${accent}28`,
        boxShadow: `0 4px 20px ${accent}12, inset 0 1px 0 rgba(255,255,255,0.80)`,
    }),
    input: {
        '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            background: 'rgba(10,61,98,0.03)',
            '&:hover fieldset': { borderColor: colorPalette.oceanBlue },
            '&.Mui-focused fieldset': { borderColor: colorPalette.oceanBlue, borderWidth: 2 },
        },
    },
    clockBg: 'linear-gradient(140deg, #061e30 0%, #0a3560 42%, #073a52 68%, #052840 100%)',
    glassInput: {
        '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.09)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.20)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.45)' },
            '&.Mui-focused fieldset': { borderColor: 'rgba(0,220,255,0.70)', borderWidth: 2 },
            '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.55)' },
        },
        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.55)' },
        '& .MuiInputLabel-root.Mui-focused': { color: '#00e5ff' },
        '& .MuiSelect-select': { color: '#fff' },
    },
};

/* ══ HELPERS ═══════════════════════════════════════════════════════════════ */
const safe = (v, s = '') => (v != null ? `${v}${s}` : '—');
const useNotification = () => {
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
    const notify = (msg, sev = 'success') => setSnack({ open: true, message: msg, severity: sev });
    const close = () => setSnack(s => ({ ...s, open: false }));
    return { snack, notify, close };
};

/* ══ AMBIENT ORBS ══════════════════════════════════════════════════════════ */
const AmbientOrbs = () => (
    <>
        {[
            { s: 420, t: -60, l: -100, c: 'rgba(10,100,180,0.07)', b: 70 },
            { s: 350, t: '40%', r: -80, c: 'rgba(32,178,170,0.06)', b: 60 },
            { s: 500, bot: -120, l: '30%', c: 'rgba(10,61,98,0.05)', b: 80 },
        ].map(({ s, t, l, r, bot, c, b }, i) => (
            <Box key={i} sx={{
                position: 'absolute', width: s, height: s, pointerEvents: 'none', zIndex: 0,
                top: t, left: l, right: r, bottom: bot, borderRadius: '50%', background: c, filter: `blur(${b}px)`
            }} />
        ))}
    </>
);

/* ══ SCROLL REVEAL ══════════════════════════════════════════════════════════ */
const Reveal = ({ children, delay = 0, y = 20 }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-40px' });
    return (
        <motion.div style={{ willChange: 'transform, opacity' }} ref={ref}
            initial={{ opacity: 0, y }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.52, delay, ease: [0.22, 1, 0.36, 1] }}>
            {children}
        </motion.div>
    );
};

/* ══ GLASS RECHARTS TOOLTIP ════════════════════════════════════════════════ */
const GlassTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{
            background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(24px)',
            border: '1px solid rgba(10,61,98,0.12)', borderRadius: '14px',
            px: 2, py: 1.5, boxShadow: '0 10px 32px rgba(10,61,98,0.16)', minWidth: 120
        }}>
            {label && <Typography variant="caption" fontWeight={800} color={colorPalette.deepNavy} sx={{ display: 'block', mb: 0.5 }}>{label}</Typography>}
            {payload.map((p, i) => (
                <Stack key={i} direction="row" alignItems="center" spacing={1} sx={{ mt: 0.3 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.fill || p.color, flexShrink: 0 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{p.name || p.dataKey}:</Typography>
                    <Typography variant="caption" fontWeight={900} color={colorPalette.deepNavy}>{p.value}{p.unit || ''}</Typography>
                </Stack>
            ))}
        </Box>
    );
};

/* ══ SECTION LABEL ══════════════════════════════════════════════════════════ */
const SectionLabel = ({ children, accent, chip }) => (
    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Box sx={{ width: 4, height: 18, borderRadius: 2, bgcolor: accent }} />
        <Typography variant="subtitle1" fontWeight={800} color={colorPalette.deepNavy}>{children}</Typography>
        {chip && <Chip label={chip} size="small" sx={{ bgcolor: `${accent}14`, color: accent, fontWeight: 700, fontSize: '0.7rem', borderRadius: '8px' }} />}
    </Stack>
);

/* ══ RADIAL GAUGE CHART CARD ════════════════════════════════════════════════
   For percentage metrics: Punctuality, Attendance Rate
   Uses RadialBarChart with a gauge arc from 0–100%
════════════════════════════════════════════════════════════════════════════ */
const RadialGaugeCard = ({ label, value, accent, icon, description, loading }) => {
    const numVal = parseFloat(value) || 0;
    const data = [{ name: label, value: numVal, fill: accent }];

    const trendColor = numVal >= 90 ? '#22c55e' : numVal >= 75 ? '#f59e0b' : '#ef4444';
    const trendText = numVal >= 90 ? 'Excellent' : numVal >= 75 ? 'Good' : 'Needs improvement';

    return (
        <Box sx={{
            ...G.card, borderRadius: '20px', p: 2.2, height: '100%',
            position: 'relative', overflow: 'hidden',
            transition: 'all 0.26s ease',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 16px 40px ${accent}18` },
            '&::after': {
                content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                borderRadius: '20px 20px 0 0',
                background: `linear-gradient(90deg, ${accent}, ${accent}55)`,
            },
        }}>
            {loading ? (
                <Skeleton variant="rounded" height={180} sx={{ borderRadius: '16px' }} />
            ) : (
                <Stack spacing={0.5} alignItems="center">
                    {/* Label + icon */}
                    <Stack direction="row" alignItems="center" spacing={0.8} sx={{ alignSelf: 'flex-start', width: '100%' }}>
                        <Box sx={{
                            width: 30, height: 30, borderRadius: '9px',
                            bgcolor: `${accent}14`, border: `1px solid ${accent}22`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            {icon}
                        </Box>
                        <Box>
                            <Typography variant="caption" fontWeight={900} color={colorPalette.deepNavy}
                                sx={{ textTransform: 'uppercase', letterSpacing: 0.7, fontSize: '0.62rem', display: 'block', lineHeight: 1.2 }}>
                                {label}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.58rem', color: trendColor, fontWeight: 700 }}>
                                {trendText}
                            </Typography>
                        </Box>
                    </Stack>

                    {/* Radial chart with center value */}
                    <Box sx={{ position: 'relative', width: '100%' }}>
                        <ResponsiveContainer width="100%" height={130}>
                            <RadialBarChart
                                cx="50%" cy="80%"
                                innerRadius="55%" outerRadius="90%"
                                startAngle={180} endAngle={0}
                                data={data}
                                barSize={14}
                            >
                                {/* Track */}
                                <RadialBar
                                    dataKey="value"
                                    cornerRadius={8}
                                    background={{ fill: `${accent}15` }}
                                    clockWise
                                />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        {/* Center overlay */}
                        <Box sx={{
                            position: 'absolute', bottom: 6, left: '50%',
                            transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'none'
                        }}>
                            <Typography fontWeight={900} sx={{ fontSize: '1.5rem', color: accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                                {numVal}<span style={{ fontSize: '0.75rem', opacity: 0.75 }}>%</span>
                            </Typography>
                        </Box>
                    </Box>

                    {/* Description */}
                    <Typography variant="caption" color="text.secondary" textAlign="center"
                        sx={{ fontSize: '0.68rem', lineHeight: 1.45, mt: 0.2 }}>
                        {description}
                    </Typography>

                    {/* Progress bar underneath */}
                    <Box sx={{ width: '100%', mt: 0.5 }}>
                        <Box sx={{ height: 5, borderRadius: 99, bgcolor: `${accent}14`, overflow: 'hidden' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(numVal, 100)}%` }}
                                transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.4 }}
                                style={{ height: '100%', background: `linear-gradient(90deg, ${accent}, ${accent}88)`, borderRadius: 99 }}
                            />
                        </Box>
                    </Box>
                </Stack>
            )}
        </Box>
    );
};

/* ══ DONUT COUNT CARD ═══════════════════════════════════════════════════════
   For count metrics: Days Present, Absent, Half Days, Late Arrivals
   Uses PieChart donut showing value vs total working days
════════════════════════════════════════════════════════════════════════════ */
const DonutCountCard = ({ label, value, total = 22, accent, trackColor, icon, description, loading, subtitle }) => {
    const numVal = parseInt(value) || 0;
    const remainder = Math.max(total - numVal, 0);

    const data = [
        { name: label, value: numVal, fill: accent },
        { name: 'Remaining', value: remainder, fill: trackColor || `${accent}18` },
    ];

    const renderInnerLabel = ({ cx, cy }) => (
        <>
            <text x={cx} y={cy - 6} textAnchor="middle" fill={accent} fontWeight={900} fontSize={20} fontVariantNumeric="tabular-nums">{numVal}</text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" fontWeight={700} fontSize={9.5}>of {total}</text>
        </>
    );

    const pct = total > 0 ? ((numVal / total) * 100).toFixed(0) : 0;

    return (
        <Box sx={{
            ...G.card, borderRadius: '20px', p: 2.2, height: '100%',
            position: 'relative', overflow: 'hidden',
            transition: 'all 0.26s ease',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 16px 40px ${accent}18` },
            '&::after': {
                content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                borderRadius: '20px 20px 0 0',
                background: `linear-gradient(90deg, ${accent}, ${accent}55)`,
            },
            '&::before': {
                content: '""', position: 'absolute', top: -24, right: -24,
                width: 70, height: 70, borderRadius: '50%', background: `${accent}0c`, zIndex: 0
            },
        }}>
            {loading ? (
                <Skeleton variant="rounded" height={190} sx={{ borderRadius: '16px' }} />
            ) : (
                <Stack spacing={0.5} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
                    {/* Header */}
                    <Stack direction="row" alignItems="center" spacing={0.8} sx={{ alignSelf: 'flex-start', width: '100%' }}>
                        <Box sx={{
                            width: 30, height: 30, borderRadius: '9px',
                            bgcolor: `${accent}14`, border: `1px solid ${accent}22`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            {icon}
                        </Box>
                        <Box>
                            <Typography variant="caption" fontWeight={900} color={colorPalette.deepNavy}
                                sx={{ textTransform: 'uppercase', letterSpacing: 0.7, fontSize: '0.62rem', display: 'block', lineHeight: 1.2 }}>
                                {label}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.58rem', color: 'rgba(100,116,139,0.8)', fontWeight: 600 }}>
                                {subtitle || `${pct}% of working days`}
                            </Typography>
                        </Box>
                    </Stack>

                    {/* Donut chart */}
                    <ResponsiveContainer width="100%" height={130}>
                        <PieChart>
                            <defs>
                                <linearGradient id={`donut-grad-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={accent} stopOpacity={1} />
                                    <stop offset="100%" stopColor={accent} stopOpacity={0.65} />
                                </linearGradient>
                            </defs>
                            <Pie
                                data={data}
                                cx="50%" cy="50%"
                                innerRadius="52%" outerRadius="78%"
                                paddingAngle={3}
                                dataKey="value"
                                animationBegin={100}
                                animationDuration={900}
                                stroke="none"
                                labelLine={false}
                                label={renderInnerLabel}
                            >
                                <Cell fill={`url(#donut-grad-${label.replace(/\s/g, '')})`} />
                                <Cell fill={trackColor || `${accent}15`} />
                            </Pie>
                            <RTooltip content={<GlassTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Description */}
                    <Typography variant="caption" color="text.secondary" textAlign="center"
                        sx={{ fontSize: '0.67rem', lineHeight: 1.45 }}>
                        {description}
                    </Typography>
                </Stack>
            )}
        </Box>
    );
};

/* ══ WEEKLY HOURS BAR CARD ═══════════════════════════════════════════════════
   Horizontal segmented bar vs 40h target with per-day breakdown feel
════════════════════════════════════════════════════════════════════════════ */
const WeeklyHoursCard = ({ value, loading }) => {
    const numVal = parseFloat(value) || 0;
    const target = 40;
    const pct = Math.min((numVal / target) * 100, 100).toFixed(0);
    const remaining = Math.max(target - numVal, 0).toFixed(1);
    const accent = colorPalette.oceanBlue;

    // Simulate daily distribution for the bar chart
    const dailyData = [
        { day: 'Mon', hours: Math.min(numVal / 5, 9), fill: colorPalette.aquaVibrant },
        { day: 'Tue', hours: Math.min(numVal / 5, 9), fill: colorPalette.aquaVibrant },
        { day: 'Wed', hours: Math.min(numVal / 5, 9), fill: colorPalette.aquaVibrant },
        { day: 'Thu', hours: Math.min(numVal / 5, 9), fill: colorPalette.aquaVibrant },
        { day: 'Fri', hours: Math.min(numVal / 5, 9), fill: colorPalette.aquaVibrant },
    ];

    const statusColor = numVal >= 38 ? '#22c55e' : numVal >= 28 ? '#f59e0b' : '#ef4444';
    const statusText = numVal >= 38 ? 'On track ✓' : numVal >= 28 ? 'In progress' : 'Behind target';

    return (
        <Box sx={{
            ...G.card, borderRadius: '20px', p: 2.2,
            position: 'relative', overflow: 'hidden',
            transition: 'all 0.26s ease',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 16px 40px ${accent}18` },
            '&::after': {
                content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                borderRadius: '20px 20px 0 0',
                background: `linear-gradient(90deg, ${accent}, ${colorPalette.aquaVibrant})`,
            },
        }}>
            {loading ? <Skeleton variant="rounded" height={180} sx={{ borderRadius: '16px' }} /> : (
                <Stack spacing={1.5}>
                    {/* Header */}
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={0.8}>
                            <Box sx={{
                                width: 30, height: 30, borderRadius: '9px',
                                bgcolor: `${accent}14`, border: `1px solid ${accent}22`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <AccessTime sx={{ color: accent, fontSize: '0.95rem' }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" fontWeight={900} color={colorPalette.deepNavy}
                                    sx={{ textTransform: 'uppercase', letterSpacing: 0.7, fontSize: '0.62rem', display: 'block', lineHeight: 1.2 }}>
                                    Weekly Hours
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: '0.58rem', color: statusColor, fontWeight: 700 }}>
                                    {statusText}
                                </Typography>
                            </Box>
                        </Stack>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography fontWeight={900} sx={{ fontSize: '1.4rem', color: accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                                {numVal}<span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>h</span>
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#94a3b8' }}>/ {target}h target</Typography>
                        </Box>
                    </Stack>

                    {/* Estimated daily hours bar chart */}
                    <ResponsiveContainer width="100%" height={80}>
                        <BarChart data={dailyData} margin={{ top: 2, right: 2, left: -30, bottom: 0 }} barCategoryGap="20%">
                            <defs>
                                <linearGradient id="weekHrsGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={colorPalette.aquaVibrant} stopOpacity={0.95} />
                                    <stop offset="100%" stopColor={colorPalette.oceanBlue} stopOpacity={0.55} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" vertical={false} />
                            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 10]} />
                            <RTooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(10,61,98,0.04)' }} />
                            {/* Target line as reference bar */}
                            <Bar dataKey={() => 9} fill="rgba(10,61,98,0.08)" radius={[3, 3, 0, 0]} name="Daily target (9h)" animationDuration={400} />
                            <Bar dataKey="hours" fill="url(#weekHrsGrad)" radius={[5, 5, 0, 0]} name="Hours" animationDuration={900} animationBegin={200} />
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Segmented progress track */}
                    <Stack spacing={0.5}>
                        <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.63rem' }}>{pct}% complete</Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.63rem' }}>{remaining}h remaining</Typography>
                        </Stack>
                        <Box sx={{ height: 7, borderRadius: 99, bgcolor: `${accent}12`, overflow: 'hidden' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1.3, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
                                style={{
                                    height: '100%',
                                    background: `linear-gradient(90deg, ${colorPalette.oceanBlue}, ${colorPalette.aquaVibrant})`,
                                    borderRadius: 99,
                                }}
                            />
                        </Box>
                    </Stack>

                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.67rem', lineHeight: 1.45 }}>
                        Track your weekly logged hours against the standard 40-hour work schedule.
                    </Typography>
                </Stack>
            )}
        </Box>
    );
};

/* ══ COMBINED OVERVIEW BARCHART ═════════════════════════════════════════════
   All 4 day-count metrics in one grouped bar for quick at-a-glance comparison
════════════════════════════════════════════════════════════════════════════ */
const AttendanceOverviewBar = ({ m, loading }) => {
    const data = [
        { name: 'Present', value: m?.presentDays || 0, fill: colorPalette.seafoamGreen },
        { name: 'Absent', value: m?.absentDays || 0, fill: colorPalette.coralSunset },
        { name: 'Half Days', value: m?.halfDays || 0, fill: '#f59e0b' },
        { name: 'Late', value: m?.lateDays || 0, fill: '#8b5cf6' },
    ];

    return (
        <Box sx={{ ...G.card, borderRadius: '22px', p: 2.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 4, height: 16, borderRadius: 2, bgcolor: colorPalette.aquaVibrant }} />
                    <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Monthly At-a-Glance</Typography>
                    <Chip label={new Date().toLocaleString('default', { month: 'short' })} size="small"
                        sx={{ height: 20, fontSize: '0.63rem', fontWeight: 700, bgcolor: `${colorPalette.aquaVibrant}12`, color: colorPalette.aquaVibrant, borderRadius: '6px' }} />
                </Stack>
            </Stack>
            <Typography variant="caption" color="text.disabled" display="block" mb={1.5}>
                Side-by-side comparison of all attendance day categories this month
            </Typography>
            {loading ? <Skeleton variant="rounded" height={150} sx={{ borderRadius: '12px' }} /> : (
                <ResponsiveContainer width="100%" height={145}>
                    <BarChart data={data} layout="vertical" margin={{ top: 0, right: 36, left: 4, bottom: 0 }}>
                        <defs>
                            {[colorPalette.seafoamGreen, colorPalette.coralSunset, '#f59e0b', '#8b5cf6'].map((c, i) => (
                                <linearGradient key={i} id={`ovGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor={c} stopOpacity={0.92} />
                                    <stop offset="100%" stopColor={c} stopOpacity={0.55} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name"
                            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }}
                            axisLine={false} tickLine={false} width={62} />
                        <RTooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(10,61,98,0.04)' }} />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]} name="Days" animationDuration={900} animationBegin={200}
                            label={{ position: 'right', fontSize: 10, fill: '#94a3b8', fontWeight: 800 }}>
                            {data.map((_, i) => <Cell key={i} fill={`url(#ovGrad${i})`} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </Box>
    );
};



/* ══ STATUS CHIP ════════════════════════════════════════════════════════════ */
const timingCfg = {
    Early: { bg: '#22c55e18', color: '#16a34a' },
    Late: { bg: '#f9731618', color: '#ea580c' },
};
const statusCfg = {
    Present: { color: colorPalette.seafoamGreen },
    Halfday: { color: '#f59e0b' },
    '': { color: '#94a3b8' },
};

/* ══ MAIN COMPONENT ════════════════════════════════════════════════════════ */
const DashboardContent = ({ userLocation, setUserLocation, isWithinGeofence, setIsWithinGeofence }) => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const { user } = useSelector(s => s.currentUser);
    const { snack, notify, close } = useNotification();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [selectedStation, setSelectedStation] = useState(() => {
        if (user?.station) {
            const foundStation = AvailableStations.find(
                (s) => s.name === user.station
            );
            return foundStation || AvailableStations[0];
        }

        return AvailableStations[0];
    });
    const [biometricRegistered, setBiometricRegistered] = useState(user?.doneBiometric || false);
    const [isClockedIn, setIsClockedIn] = useState(user?.hasClockedIn || false);
    const [isToClockOut, setIsToClockOut] = useState(user?.isToClockOut || false);
    const [biometricLoading, setBiometricLoading] = useState(false);
    const [recentAttendance, setRecentAttendance] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // check user update can clock outside
    useEffect(() => {
        const checkAuthorizationValidity = async () => {
            if (user?.canClockOutside && user?.outsideClockingDetails?.endDate) {
                const today = new Date();
                const expiryDate = new Date(user.outsideClockingDetails.endDate);

                // If today is past the end date, trigger auto-revoke
                if (today > expiryDate) {
                    try {
                        // Call the revoke function we created earlier
                        await revokeClockOutsideStatus(user._id);
                        const updated = await getUserProfile();
                        dispatch(updateUserCurrentUserRedux(updated));
                        notify("Clock-outside authorization has expired and was reset.", "info");
                    } catch (err) {
                        console.error("Auto-revoke failed:", err);
                    }
                }
            }
        };
        checkAuthorizationValidity();
    }, [user, dispatch]);

    // 2. Logic to determine if user is allowed to proceed
    const isDateAuthorized = () => {
        if (!user?.canClockOutside || !user?.outsideClockingDetails) return false;

        const today = new Date();
        const start = new Date(user.outsideClockingDetails.startDate);
        const end = new Date(user.outsideClockingDetails.endDate);

        // Ensure today is within the allowed window
        return today >= start && today <= end;
    };




    useEffect(() => {
        let alive = true;
        fetchClockingHistory(7).then(records => {
            if (!alive) return;
            setRecentAttendance(records.map(rec => ({
                date: formatDate(rec.clock_in),
                clockIn: formatTime(rec.clock_in),
                clockOut: rec.clock_out ? formatTime(rec.clock_out) : '—',
                status: rec.clock_out ? (rec.isPresent ? 'Present' : 'Halfday') : '',
                timing: rec.isLate ? 'Late' : 'Early',
                hours: rec.clock_out ? ((new Date(rec.clock_out) - new Date(rec.clock_in)) / 3_600_000).toFixed(2) : '—',
            })));
        }).catch(console.error);
        return () => { alive = false; };
    }, [isClockedIn]);

    useEffect(() => {
        let alive = true;
        setStatsLoading(true);
        fetchAttendanceStats()
            .then(data => { if (alive) { setUserStats(data); setStatsLoading(false); } })
            .catch(() => { if (alive) setStatsLoading(false); });
        return () => { alive = false; };
    }, []);

    const requestLocation = () => {
        if (!navigator.geolocation) { notify('Geolocation not supported.', 'error'); return; }
        navigator.geolocation.getCurrentPosition(
            ({ coords: { latitude, longitude } }) => {
                setUserLocation({ latitude, longitude });
                const d = calculateDistanceMeters(latitude, longitude, selectedStation.lat, selectedStation.lng);
                setIsWithinGeofence(d <= GEOFENCE_RADIUS_METERS);
            },
            () => notify('Location access denied.', 'error'),
            { enableHighAccuracy: true, timeout: 20000 }
        );
    };
    useEffect(() => { requestLocation(); }, [selectedStation.name]);
    // eslint-disable-line

    // 3. Combined Geofence + Outside Authorization check
    // If they are in the fence OR they are authorized to be outside today
    const canProceedWithLocation = isWithinGeofence || isDateAuthorized();

    const clockStepIndex = !userLocation || !canProceedWithLocation ? 0 : !biometricRegistered ? 1 : 2;



    const handleUserLocationLable = () => {
        if (isDateAuthorized()) {
            return `Authorized to Clock Outside ✓`
        } else if (!userLocation) {
            return 'Location not verified yet'
        } else if (userLocation && isWithinGeofence && !isDateAuthorized()) {
            return 'Within KMFRI Premise Station ✓'
        } else return 'Outside Premises cannot Clock In/Out'
    }


    const handleRegisterFingerprint = async () => {
        try {
            
            setBiometricLoading(true);
            await registerFingerprint();
            const updated = await getUserProfile();
            if (updated?.doneBiometric) {
                const fp = await getDeviceFingerprint();
                const { deviceName, browser, os } = detectCurrentDevice();
                await addNewDevice({ device_name: deviceName, device_os: os, device_browser: browser, device_fingerprint: fp });
                setBiometricRegistered(true);
                const devices = await fetchMyDevices();
                dispatch(updateUserCurrentUserRedux(await getUserProfile()));
                dispatch(updateUserCurrentDeviceRedux(devices));
                notify('Fingerprint registered successfully!');
            } else throw new Error('Biometric registration incomplete.');
        } catch (err) { notify(`${err}`, 'error'); }
        finally { setBiometricLoading(false); }
    };

    const handleClockInClockOut = async () => {
        try {
            setBiometricLoading(true);
            await verifyFingerprint(selectedStation.name,userLocation);
            const updated = await getUserProfile();
            dispatch(updateUserCurrentUserRedux(updated));
            setIsClockedIn(updated.hasClockedIn);
            setIsToClockOut(updated.isToClockOut);
            localStorage.setItem('recent_station', selectedStation.name);
            const now = new Date();
            notify(`${updated.name}, Clocked ${updated.hasClockedIn ? 'In' : 'Out'} At ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        } catch (err) {
            notify(`${err}`, 'error');
        } finally { setBiometricLoading(false); }
    };

    const m = userStats?.monthly;
    const w = userStats?.weekly;

    /* ═══════════════════════════════════════════════════════════════════════
       RENDER
    ═══════════════════════════════════════════════════════════════════════ */
    return (
        <Box sx={{ width: '100%', position: 'relative' }}>
            <AmbientOrbs />

            <Snackbar open={snack.open} autoHideDuration={5000} onClose={close} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={close} severity={snack.severity} variant="filled" elevation={6}
                    sx={{ borderRadius: '14px', fontWeight: 700, backdropFilter: 'blur(16px)', boxShadow: '0 8px 28px rgba(0,0,0,0.14)' }}>
                    {snack.message}
                </Alert>
            </Snackbar>

            {/* ══ HOW-TO BANNER ════════════════════════════════════════════ */}
            <Reveal>
                <Box sx={{ ...G.tinted(colorPalette.oceanBlue), borderRadius: '20px', p: 2.5, mb: 3, position: 'relative', zIndex: 1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                        <Box sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: `${colorPalette.oceanBlue}14`, border: `1px solid ${colorPalette.oceanBlue}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <InfoOutlined sx={{ color: colorPalette.oceanBlue, fontSize: '1.1rem' }} />
                        </Box>
                        <Typography variant="subtitle2" fontWeight={900} color={colorPalette.deepNavy} sx={{ letterSpacing: 0.5 }}>
                            How to Clock In / Out
                        </Typography>
                    </Stack>
                    <Grid container spacing={1.5}>
                        {[
                            { num: '01', text: 'Select your assigned station from the dropdown.' },
                            { num: '02', text: "Click 'Verify Location' to confirm you're within KMFRI premises." },
                            { num: '03', text: 'Register your fingerprint once (first time only).' },
                            { num: '04', text: 'Scan your fingerprint to clock in or out.' },
                        ].map(({ num, text }) => (
                            <Grid item xs={12} sm={6} md={3} key={num}>
                                <Stack direction="row" spacing={1.2} alignItems="flex-start">
                                    <Box sx={{ px: 0.9, py: 0.3, borderRadius: '7px', bgcolor: colorPalette.oceanBlue, flexShrink: 0 }}>
                                        <Typography variant="caption" fontWeight={900} sx={{ color: '#fff', fontSize: '0.66rem', lineHeight: 1.6 }}>{num}</Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, fontSize: '0.79rem' }}>{text}</Typography>
                                </Stack>
                            </Grid>
                        ))}
                    </Grid>
                    <Stack direction="row" spacing={1} mt={2} alignItems="center" flexWrap="wrap" gap={0.5}>
                        <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ fontSize: '0.63rem' }}>YOUR PROGRESS:</Typography>
                        {['Location', 'Fingerprint', 'Ready'].map((step, i) => (
                            <Stack key={step} direction="row" alignItems="center" spacing={0.5}>
                                <Box sx={{
                                    width: i <= clockStepIndex ? 26 : 7, height: 7, borderRadius: 99,
                                    bgcolor: i < clockStepIndex ? colorPalette.seafoamGreen : i === clockStepIndex ? colorPalette.oceanBlue : `${colorPalette.oceanBlue}20`,
                                    transition: 'all 0.4s ease'
                                }} />
                                {i <= clockStepIndex && (
                                    <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.63rem', color: i === clockStepIndex ? colorPalette.oceanBlue : colorPalette.seafoamGreen }}>
                                        {step}
                                    </Typography>
                                )}
                            </Stack>
                        ))}
                    </Stack>
                </Box>
            </Reveal>

            {/* ══ MAIN GRID ════════════════════════════════════════════════ */}
            <Grid container spacing={3} alignItems="flex-start" sx={{ position: 'relative', zIndex: 1 }}>

                {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
                <Grid item xs={12} lg={7}>
                    <Stack spacing={3}>

                        {/* ── DARK CLOCK CARD ── */}
                        <Reveal>
                            <Box sx={{
                                borderRadius: '24px',
                                background: G.clockBg,
                                position: 'relative', overflow: 'hidden',
                                p: { xs: 3, md: 4 },
                                boxShadow: '0 20px 56px rgba(10,61,98,0.30)',
                            }}>
                                <Box sx={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(0,180,200,0.10)', filter: 'blur(40px)', pointerEvents: 'none' }} />
                                <Box sx={{ position: 'absolute', bottom: -80, left: -80, width: 260, height: 260, borderRadius: '50%', background: 'rgba(10,61,98,0.30)', filter: 'blur(50px)', pointerEvents: 'none' }} />

                                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'center', md: 'center' }} spacing={{ xs: 4, md: 5 }} sx={{ position: 'relative', zIndex: 1 }}>

                                    {/* Clock face */}
                                    <Box sx={{ textAlign: { xs: 'center', md: 'left' }, flexShrink: 0 }}>
                                        <LiveClock />
                                        <Stack direction="row" spacing={1} mt={2.5} justifyContent={{ xs: 'center', md: 'flex-start' }} flexWrap="wrap" gap={1}>
                                            <Chip
                                                icon={<LocationOn sx={{ color: 'white !important', fontSize: '0.85rem !important' }} />}
                                                // label={locationLabel} size="small"
                                                label={handleUserLocationLable()} size="small"
                                                sx={{ bgcolor: isWithinGeofence && !isDateAuthorized() ? 'rgba(34,197,94,0.22)' : isDateAuthorized() ? 'rgba(154, 211, 21, 0.22)' : 'rgba(138,138,138,0.22)', color: '#fff', fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${isWithinGeofence && !isDateAuthorized() ? 'rgba(34,197,94,0.38)' : isDateAuthorized() ? 'rgba(154, 211, 21, 0.35)' : 'rgba(138,138,138,0.35)'}`, backdropFilter: 'blur(8px)' }}
                                            />
                                            {isClockedIn && isToClockOut && (
                                                <Chip icon={<CheckCircle sx={{ color: 'white !important', fontSize: '0.85rem !important' }} />} label="Session Active" size="small"
                                                    sx={{ bgcolor: isWithinGeofence && !isDateAuthorized() ? 'rgba(34,197,94,0.24)' : isDateAuthorized() ? 'rgba(154, 211, 21, 0.24)' : 'rgba(138,138,138,0.24)', color: '#fff', fontWeight: 700, fontSize: '0.7rem', border: isWithinGeofence && !isDateAuthorized() ? '1px solid rgba(34,197,94,0.40)' : isDateAuthorized() ? '1px solid rgba(154, 211, 21, 0.40)' : '1px solid rgba(138,138,138,0.40)' }} />
                                            )}

                                            {/* If authorized outside, show a special badge */}
                                            {isDateAuthorized() && (
                                                <Chip
                                                    label={user.outsideClockingDetails.reason}
                                                    size="small"
                                                    sx={{ bgcolor: colorPalette.warmSand, color: colorPalette.deepNavy, fontWeight: 900, fontSize: '0.65rem' }}
                                                />
                                            )}
                                        </Stack>
                                    </Box>

                                    {/* Controls */}
                                    <Stack spacing={2} sx={{ width: { xs: '100%', sm: '300px', md: '300px' } }}>
                                        <TextField select fullWidth label="Clocking Station"
                                            value={selectedStation.name}
                                            disabled={isClockedIn && isToClockOut}
                                            onChange={e => setSelectedStation(AvailableStations.find(s => s.name === e.target.value))}
                                            InputProps={{ startAdornment: <InputAdornment position="start"><BusinessCenter sx={{ color: 'rgba(255,255,255,0.60)', fontSize: '1.05rem' }} /></InputAdornment> }}
                                            sx={G.glassInput}>
                                            {AvailableStations.map(o => <MenuItem key={o.name} value={o.name} >{o.name}</MenuItem>)}
                                        </TextField>

                                        <AnimatePresence mode="wait">
                                            {/* Step 0: verify location */}
                                            {clockStepIndex === 0 && (
                                                <motion.div style={{ willChange: 'transform, opacity' }} key="loc"
                                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                                    transition={{ duration: 0.28 }}>
                                                    <Button variant="outlined" fullWidth startIcon={<LocationOn />} onClick={requestLocation}
                                                        sx={{
                                                            color: '#fff', borderColor: 'rgba(255,255,255,0.35)',
                                                            py: 1.5, borderRadius: '14px', fontWeight: 800, letterSpacing: 0.4,
                                                            backdropFilter: 'blur(8px)', bgcolor: 'rgba(255,255,255,0.07)',
                                                            '&:hover': { borderColor: 'rgba(255,255,255,0.70)', bgcolor: 'rgba(255,255,255,0.13)' }
                                                        }}>
                                                        Verify Location
                                                    </Button>
                                                </motion.div>
                                            )}

                                            {/* Step 1: register fingerprint — ANIMATED GLOW */}
                                            {clockStepIndex === 1 && (
                                                <motion.div style={{ willChange: 'transform, opacity' }} key="fp"
                                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                                    transition={{ duration: 0.28 }}>
                                                    <Box sx={{
                                                        p: 2.5, borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.08)',
                                                        border: '1px dashed rgba(255,255,255,0.30)', backdropFilter: 'blur(8px)'
                                                    }}>
                                                        <Stack spacing={1.5} alignItems="center" textAlign="center">
                                                            {/* Animated fingerprint icon */}
                                                            <Box sx={{
                                                                width: 56, height: 56, borderRadius: '16px',
                                                                bgcolor: 'rgba(255,255,255,0.10)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                border: '1px solid rgba(255,255,255,0.18)',
                                                                position: 'relative',
                                                                animation: 'fpIconPulse 2.4s ease-in-out infinite',
                                                                '@keyframes fpIconPulse': {
                                                                    '0%': { boxShadow: `0 0 0 0 ${colorPalette.seafoamGreen}55` },
                                                                    '50%': { boxShadow: `0 0 0 10px ${colorPalette.seafoamGreen}00` },
                                                                    '100%': { boxShadow: `0 0 0 0 ${colorPalette.seafoamGreen}00` },
                                                                },
                                                            }}>
                                                                <Fingerprint sx={{ fontSize: '1.8rem', color: 'rgba(255,255,255,0.90)' }} />
                                                            </Box>
                                                            <Box>
                                                                <Typography fontWeight={900} sx={{ fontSize: '0.92rem', color: '#fff', mb: 0.4 }}>Fingerprint Required</Typography>
                                                                <Typography variant="body2" sx={{ opacity: 0.65, fontSize: '0.76rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.75)' }}>
                                                                    Register once to enable secure clocking at all KMFRI stations.
                                                                </Typography>
                                                            </Box>

                                                            {/* GLOWING REGISTER BUTTON */}
                                                            <Box sx={{ width: '100%', position: 'relative' }}>
                                                                {/* Glow halo layer */}
                                                                {!biometricLoading && (
                                                                    <Box sx={{
                                                                        position: 'absolute', inset: -3, borderRadius: '15px', zIndex: 0,
                                                                        background: `${colorPalette.seafoamGreen}40`,
                                                                        filter: 'blur(8px)',
                                                                        animation: 'registerGlow 2s ease-in-out infinite',
                                                                        '@keyframes registerGlow': {
                                                                            '0%': { opacity: 0.5, transform: 'scale(0.97)' },
                                                                            '50%': { opacity: 1, transform: 'scale(1.01)' },
                                                                            '100%': { opacity: 0.5, transform: 'scale(0.97)' },
                                                                        },
                                                                    }} />
                                                                )}
                                                                <Button
                                                                    variant="contained"
                                                                    fullWidth
                                                                    disabled={biometricLoading}
                                                                    onClick={handleRegisterFingerprint}
                                                                    startIcon={biometricLoading
                                                                        ? <CircularProgress size={14} sx={{ color: '#fff' }} />
                                                                        : <Fingerprint sx={{
                                                                            animation: biometricLoading ? 'none' : 'fpSpin 3s linear infinite',
                                                                            '@keyframes fpSpin': {
                                                                                '0%': { transform: 'scale(1)' },
                                                                                '50%': { transform: 'scale(1.18)' },
                                                                                '100%': { transform: 'scale(1)' },
                                                                            }
                                                                        }} />
                                                                    }
                                                                    sx={{
                                                                        position: 'relative', zIndex: 1,
                                                                        bgcolor: colorPalette.seafoamGreen, color: '#fff',
                                                                        fontWeight: 900, borderRadius: '12px', py: 1.35,
                                                                        letterSpacing: 0.5,
                                                                        boxShadow: `0 6px 22px ${colorPalette.seafoamGreen}55`,
                                                                        transition: 'all 0.22s ease',
                                                                        '&:hover': {
                                                                            bgcolor: '#1ea876',
                                                                            boxShadow: `0 10px 32px ${colorPalette.seafoamGreen}77`,
                                                                            transform: 'translateY(-2px)',
                                                                        },
                                                                        '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.38)' }
                                                                    }}>
                                                                    {biometricLoading ? 'Registering…' : 'Register Fingerprint'}
                                                                </Button>
                                                            </Box>
                                                        </Stack>
                                                    </Box>
                                                </motion.div>
                                            )}

                                            {/* Step 2: clock in/out — ANIMATED GLOW */}
                                            {clockStepIndex === 2 && (
                                                <motion.div style={{ willChange: 'transform, opacity' }} key="clock"
                                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                                    transition={{ duration: 0.28 }}>

                                                    <Box sx={{ position: 'relative', width: '100%' }}>
                                                        {/* Animated glow aura */}
                                                        {!biometricLoading && (
                                                            <Box sx={{
                                                                position: 'absolute', inset: -4, borderRadius: '18px', zIndex: 0,
                                                                background: isClockedIn && isToClockOut
                                                                    ? `${colorPalette.seafoamGreen}45`
                                                                    : `${colorPalette.aquaVibrant}45`,
                                                                filter: 'blur(10px)',
                                                                animation: 'clockGlow 2.2s ease-in-out infinite',
                                                                '@keyframes clockGlow': {
                                                                    '0%': { opacity: 0.55, transform: 'scale(0.96)' },
                                                                    '50%': { opacity: 1, transform: 'scale(1.02)' },
                                                                    '100%': { opacity: 0.55, transform: 'scale(0.96)' },
                                                                },
                                                            }} />
                                                        )}

                                                        {/* Secondary shimmer ring */}
                                                        {!biometricLoading && (
                                                            <Box sx={{
                                                                position: 'absolute', inset: -8, borderRadius: '22px', zIndex: 0,
                                                                background: isClockedIn && isToClockOut
                                                                    ? `${colorPalette.seafoamGreen}20`
                                                                    : `${colorPalette.aquaVibrant}20`,
                                                                filter: 'blur(16px)',
                                                                animation: 'clockGlow2 2.2s ease-in-out infinite 0.4s',
                                                                '@keyframes clockGlow2': {
                                                                    '0%': { opacity: 0.3, transform: 'scale(0.94)' },
                                                                    '50%': { opacity: 0.85, transform: 'scale(1.04)' },
                                                                    '100%': { opacity: 0.3, transform: 'scale(0.94)' },
                                                                },
                                                            }} />
                                                        )}

                                                        <Button
                                                            variant="contained"
                                                            fullWidth
                                                            onClick={handleClockInClockOut}
                                                            disabled={biometricLoading}
                                                            startIcon={biometricLoading
                                                                ? <CircularProgress size={15} sx={{ color: colorPalette.deepNavy }} />
                                                                : <Fingerprint sx={{
                                                                    fontSize: '1.3rem !important',
                                                                    animation: biometricLoading ? 'none' : 'scanPulse 1.8s ease-in-out infinite',
                                                                    '@keyframes scanPulse': {
                                                                        '0%': { transform: 'scale(1)', opacity: 1 },
                                                                        '50%': { transform: 'scale(1.2)', opacity: 0.85 },
                                                                        '100%': { transform: 'scale(1)', opacity: 1 },
                                                                    }
                                                                }} />
                                                            }
                                                            sx={{
                                                                position: 'relative', zIndex: 1,
                                                                bgcolor: isClockedIn && isToClockOut ? colorPalette.seafoamGreen : colorPalette.aquaVibrant,
                                                                color: isClockedIn && isToClockOut ? '#fff' : colorPalette.deepNavy,
                                                                py: 1.8, borderRadius: '14px',
                                                                fontWeight: 900, fontSize: '0.9rem', letterSpacing: 0.9,
                                                                boxShadow: isClockedIn && isToClockOut
                                                                    ? `0 8px 28px ${colorPalette.seafoamGreen}55`
                                                                    : `0 8px 28px ${colorPalette.aquaVibrant}55`,
                                                                transition: 'all 0.22s ease',
                                                                '&:hover': {
                                                                    transform: 'translateY(-2px)',
                                                                    boxShadow: isClockedIn && isToClockOut
                                                                        ? `0 14px 40px ${colorPalette.seafoamGreen}77`
                                                                        : `0 14px 40px ${colorPalette.aquaVibrant}77`,
                                                                },
                                                                '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.38)' },
                                                            }}>
                                                            {biometricLoading
                                                                ? (isClockedIn && isToClockOut ? 'Clocking Out…' : 'Clocking In…')
                                                                : (isClockedIn && isToClockOut ? 'SCAN TO CLOCK OUT' : 'SCAN TO CLOCK IN')}
                                                        </Button>
                                                    </Box>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </Stack>
                                </Stack>
                            </Box>
                        </Reveal>

                        {/* ── RECENT ATTENDANCE TABLE ── */}
                        <Reveal>
                            <Box>
                                <SectionLabel accent={colorPalette.deepNavy} chip="Last 7 days">Recent Attendance</SectionLabel>
                                <Box sx={{ ...G.card, borderRadius: '20px', overflow: 'hidden' }}>
                                    <Box sx={{ overflowX: 'auto', '&::-webkit-scrollbar': { height: 3 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(10,61,98,0.12)', borderRadius: 2 } }}>
                                        <Table size="small" sx={{ minWidth: isMobile ? 560 : '100%' }}>
                                            <TableHead>
                                                <TableRow sx={{ background: 'rgba(10,61,98,0.04)' }}>
                                                    {['Date', isMobile ? 'In' : 'Clock In', isMobile ? 'Out' : 'Clock Out', 'Timing', 'Status'].map(h => (
                                                        <TableCell key={h} sx={{ fontWeight: 900, fontSize: '0.69rem', color: colorPalette.deepNavy, letterSpacing: 0.7, py: 1.6, textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(10,61,98,0.08)' }}>{h}</TableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {recentAttendance.length === 0
                                                    ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5, border: 0 }}>
                                                        <Stack alignItems="center" spacing={1}>
                                                            <Box sx={{ width: 56, height: 56, borderRadius: '18px', bgcolor: 'rgba(10,61,98,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <History sx={{ fontSize: 30, color: 'rgba(10,61,98,0.22)' }} />
                                                            </Box>
                                                            <Typography variant="body2" color="text.disabled" fontWeight={600}>No attendance records found</Typography>
                                                        </Stack>
                                                    </TableCell></TableRow>
                                                    : recentAttendance.map((row, idx) => (
                                                        <motion.tr key={idx} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.04, duration: 0.25 }}
                                                            style={{ display: 'table-row', willChange: 'transform, opacity' }}>
                                                            <TableCell sx={{ fontWeight: 700, color: colorPalette.deepNavy, fontSize: '0.82rem', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(10,61,98,0.05)' }}>{row.date}</TableCell>
                                                            <TableCell sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.82rem', borderBottom: '1px solid rgba(10,61,98,0.05)' }}>{row.clockIn}</TableCell>
                                                            <TableCell sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.82rem', borderBottom: '1px solid rgba(10,61,98,0.05)' }}>{row.clockOut}</TableCell>
                                                            <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)' }}>
                                                                <Chip label={row.timing} size="small" sx={{ height: 20, fontWeight: 800, fontSize: '0.66rem', borderRadius: '7px', bgcolor: timingCfg[row.timing]?.bg || '#e0e0e020', color: timingCfg[row.timing]?.color || '#9e9e9e' }} />
                                                            </TableCell>
                                                            <TableCell sx={{ borderBottom: '1px solid rgba(10,61,98,0.05)' }}>
                                                                <Stack direction="row" alignItems="center" spacing={0.6}>
                                                                    <FiberManualRecord sx={{ fontSize: 8, color: statusCfg[row.status]?.color || '#94a3b8' }} />
                                                                    <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.79rem' }}>{row.status || '—'}</Typography>
                                                                </Stack>
                                                            </TableCell>
                                                        </motion.tr>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </Box>
                                </Box>
                            </Box>
                        </Reveal>

                        {/* ── Weekly Hours bar card (full width) ── */}
                        <Reveal delay={0.20}>
                            <WeeklyHoursCard
                                value={w?.totalHours}
                                loading={statsLoading}
                            />
                        </Reveal>


                    </Stack>
                </Grid>

                {/* ── RIGHT COLUMN — STAT CHARTS ──────────────────────────── */}
                <Grid item xs={12} lg={5}>
                    <Stack spacing={2}>

                        <Reveal>
                            <SectionLabel accent={colorPalette.aquaVibrant} chip={`${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`}>
                                Overview Statistics
                            </SectionLabel>
                        </Reveal>

                        {/* ── Overview combined bar ── */}
                        <Reveal delay={0.04}>
                            <AttendanceOverviewBar m={m} loading={statsLoading} />
                        </Reveal>



                        {/* ── Half Days + Late Arrivals Donut row ── */}
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Reveal delay={0.13}>
                                    <DonutCountCard
                                        label="Half Days"
                                        value={m?.halfDays}
                                        total={22}
                                        accent="#f59e0b"
                                        trackColor="rgba(245,158,11,0.10)"
                                        icon={<AccessTime sx={{ color: '#f59e0b', fontSize: '0.95rem' }} />}
                                        description="Partial shifts — clocked out before full shift."
                                        subtitle="Partial shifts this month"
                                        loading={statsLoading}
                                    />
                                </Reveal>
                            </Grid>
                            <Grid item xs={6}>
                                <Reveal delay={0.17}>
                                    <DonutCountCard
                                        label="Late Arrivals"
                                        value={m?.lateDays}
                                        total={m?.presentDays || 22}
                                        accent="#8b5cf6"
                                        trackColor="rgba(139,92,246,0.10)"
                                        icon={<WorkHistory sx={{ color: '#8b5cf6', fontSize: '0.95rem' }} />}
                                        description="Days you clocked in after the start time."
                                        subtitle="of present days"
                                        loading={statsLoading}
                                    />
                                </Reveal>
                            </Grid>
                        </Grid>



                        {/* ── Punctuality + Attendance Rate radial gauges ── */}
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Reveal delay={0.23}>
                                    <RadialGaugeCard
                                        label="Punctuality"
                                        value={m?.punctualityRate}
                                        accent="#f59e0b"
                                        icon={<EmojiEvents sx={{ color: '#f59e0b', fontSize: '0.95rem' }} />}
                                        description="Percentage of days you arrived on time or early."
                                        loading={statsLoading}
                                    />
                                </Reveal>
                            </Grid>
                            <Grid item xs={6}>
                                <Reveal delay={0.27}>
                                    <RadialGaugeCard
                                        label="Attendance Rate"
                                        value={m?.attendanceRate}
                                        accent={colorPalette.aquaVibrant}
                                        icon={<WorkHistory sx={{ color: colorPalette.aquaVibrant, fontSize: '0.95rem' }} />}
                                        description="Total days present out of expected working days."
                                        loading={statsLoading}
                                    />
                                </Reveal>
                            </Grid>
                        </Grid>

                        {/* ── Monthly summary dark card (kept as-is) ── */}
                        <Reveal delay={0.30}>
                            <Box sx={{
                                borderRadius: '22px', background: G.clockBg,
                                color: '#fff', p: 3, position: 'relative', overflow: 'hidden',
                                boxShadow: '0 14px 44px rgba(10,61,98,0.28)'
                            }}>
                                <Box sx={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(0,180,200,0.10)', filter: 'blur(30px)', pointerEvents: 'none' }} />
                                <Box sx={{ position: 'absolute', bottom: -30, left: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(10,61,98,0.30)', filter: 'blur(24px)', pointerEvents: 'none' }} />
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ position: 'relative', zIndex: 1 }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ opacity: 0.65, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', fontSize: '0.62rem', display: 'block', mb: 0.5, color: 'rgba(255,255,255,0.8)' }}>
                                            Monthly Overview
                                        </Typography>
                                        <Typography fontWeight={900} sx={{ fontSize: '1.1rem', lineHeight: 1.3, color: '#fff' }}>
                                            {m?.attendanceRate >= 90 ? 'Great performance! 🎯' : m?.attendanceRate >= 75 ? 'Keep it up! 💪' : 'Room to improve 📈'}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.68, mt: 0.6, fontSize: '0.78rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.75)' }}>
                                            {userStats?.summary || 'Loading your summary…'}
                                        </Typography>
                                    </Box>
                                    <QueryStats sx={{ fontSize: 38, opacity: 0.18, flexShrink: 0 }} />
                                </Stack>
                                <Box sx={{ height: '1px', bgcolor: 'rgba(255,255,255,0.10)', my: 2.5 }} />
                                <Grid container spacing={1.5} sx={{ position: 'relative', zIndex: 1 }}>
                                    {[
                                        { label: 'Total Hrs', value: safe(m?.totalHours) },
                                        { label: 'Overtime', value: safe(m?.overtimeHours) },
                                        { label: 'Avg/Day', value: safe(m?.avgHoursPerDay) },
                                    ].map(({ label, value }) => (
                                        <Grid item xs={4} key={label}>
                                            <Box sx={{ p: 1.5, borderRadius: '14px', background: 'rgba(255,255,255,0.09)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.13)', textAlign: 'center' }}>
                                                <Typography fontWeight={900} sx={{ fontSize: '1.1rem', fontVariantNumeric: 'tabular-nums', color: '#fff' }}>{value}</Typography>
                                                <Typography variant="caption" sx={{ opacity: 0.60, fontSize: '0.62rem', color: 'rgba(255,255,255,0.7)' }}>{label}</Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        </Reveal>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardContent;