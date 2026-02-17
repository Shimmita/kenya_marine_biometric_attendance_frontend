import {
    AccessTime, BusinessCenter, CalendarMonth, CheckCircle,
    EmojiEvents, FiberManualRecord, Fingerprint, History,
    InfoOutlined, LocationOn, QueryStats, TrendingDown, TrendingUp, WorkHistory,
} from '@mui/icons-material';
import {
    Alert, Box, Button, Chip, CircularProgress, Divider, Grid,
    InputAdornment, MenuItem, Skeleton, Snackbar, Stack,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
    ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts';
import { updateUserCurrentUserRedux } from '../../redux/CurrentUser';
import { registerFingerprint, verifyFingerprint } from '../../service/Biometrics';
import { fetchAttendanceStats, fetchClockingHistory } from '../../service/ClockingService';
import { addNewDevice } from '../../service/DeviceService';
import { getDeviceFingerprint } from '../../service/Fingerprinting';
import { getUserProfile } from '../../service/UserProfile';
import coreDataDetails from '../CoreDataDetails';
import { formatDate, formatTime } from '../util/DateTimeFormater';
import { calculateDistanceMeters } from '../util/DistanceMeasure';
import { detectCurrentDevice } from './AddDevice';

const { AvailableStations, colorPalette } = coreDataDetails;
const GEOFENCE_RADIUS_METERS = 500000;

/* ══ GLASS TOKENS (light content area) ════════════════════════════════════ */
const G = {
    card: {
        background:           'rgba(255,255,255,0.72)',
        backdropFilter:       'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border:               '1px solid rgba(255,255,255,0.60)',
        boxShadow:            '0 4px 24px rgba(10,61,98,0.08), inset 0 1px 0 rgba(255,255,255,0.80)',
    },
    cardStrong: {
        background:           'rgba(255,255,255,0.82)',
        backdropFilter:       'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        border:               '1px solid rgba(255,255,255,0.72)',
        boxShadow:            '0 8px 32px rgba(10,61,98,0.12), inset 0 1px 0 rgba(255,255,255,0.90)',
    },
    tinted: (accent) => ({
        background:           `rgba(255,255,255,0.62)`,
        backdropFilter:       'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        border:               `1px solid ${accent}28`,
        boxShadow:            `0 4px 20px ${accent}12, inset 0 1px 0 rgba(255,255,255,0.80)`,
    }),
    input: {
        '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            background: 'rgba(10,61,98,0.03)',
            '&:hover fieldset':       { borderColor: colorPalette.oceanBlue },
            '&.Mui-focused fieldset': { borderColor: colorPalette.oceanBlue, borderWidth: 2 },
        },
    },
    /* dark clock card — matches landing page dark surface */
    clockBg: 'linear-gradient(140deg, #061e30 0%, #0a3560 42%, #073a52 68%, #052840 100%)',
    glassInput: {
        '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.09)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            '& fieldset':             { borderColor: 'rgba(255,255,255,0.20)' },
            '&:hover fieldset':       { borderColor: 'rgba(255,255,255,0.45)' },
            '&.Mui-focused fieldset': { borderColor: 'rgba(0,220,255,0.70)', borderWidth: 2 },
            '& .MuiSvgIcon-root':     { color: 'rgba(255,255,255,0.55)' },
        },
        '& .MuiInputLabel-root':           { color: 'rgba(255,255,255,0.55)' },
        '& .MuiInputLabel-root.Mui-focused':{ color: '#00e5ff' },
        '& .MuiSelect-select':             { color: '#fff' },
    },
};

/* ══ HELPERS ═══════════════════════════════════════════════════════════════ */
const safe = (v, s = '') => (v != null ? `${v}${s}` : '—');
const useNotification = () => {
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
    const notify = (msg, sev = 'success') => setSnack({ open: true, message: msg, severity: sev });
    const close  = () => setSnack(s => ({ ...s, open: false }));
    return { snack, notify, close };
};

/* ══ AMBIENT ORBS ══════════════════════════════════════════════════════════ */
const AmbientOrbs = () => (
    <>
        {[
            { s:420, t:-60,  l:-100, c:'rgba(10,100,180,0.07)', b:70 },
            { s:350, t:'40%', r:-80, c:'rgba(32,178,170,0.06)', b:60 },
            { s:500, bot:-120,l:'30%',c:'rgba(10,61,98,0.05)',  b:80 },
        ].map(({ s,t,l,r,bot,c,b }, i) => (
            <Box key={i} sx={{ position:'absolute', width:s, height:s, pointerEvents:'none', zIndex:0,
                top:t, left:l, right:r, bottom:bot, borderRadius:'50%', background:c, filter:`blur(${b}px)` }}/>
        ))}
    </>
);

/* ══ SCROLL REVEAL ══════════════════════════════════════════════════════════ */
const Reveal = ({ children, delay = 0, y = 20 }) => {
    const ref    = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-40px' });
    return (
        <motion.div ref={ref} initial={{ opacity:0, y }} animate={inView ? { opacity:1, y:0 } : {}}
            transition={{ duration:0.52, delay, ease:[0.22,1,0.36,1] }}>
            {children}
        </motion.div>
    );
};

/* ══ GLASS RECHARTS TOOLTIP ════════════════════════════════════════════════ */
const GlassTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{ background:'rgba(255,255,255,0.94)', backdropFilter:'blur(24px)', border:'1px solid rgba(10,61,98,0.12)', borderRadius:'14px', px:2, py:1.5, boxShadow:'0 10px 32px rgba(10,61,98,0.16)', minWidth:120 }}>
            {label && <Typography variant="caption" fontWeight={800} color={colorPalette.deepNavy} sx={{ display:'block', mb:0.5 }}>{label}</Typography>}
            {payload.map((p, i) => (
                <Stack key={i} direction="row" alignItems="center" spacing={1} sx={{ mt:0.3 }}>
                    <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:p.fill||p.color, flexShrink:0 }}/>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{p.name||p.dataKey}:</Typography>
                    <Typography variant="caption" fontWeight={900} color={colorPalette.deepNavy}>{p.value}{p.unit||''}</Typography>
                </Stack>
            ))}
        </Box>
    );
};

/* ══ SECTION LABEL ══════════════════════════════════════════════════════════ */
const SectionLabel = ({ children, accent, chip }) => (
    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Box sx={{ width:4, height:18, borderRadius:2, bgcolor:accent }}/>
        <Typography variant="subtitle1" fontWeight={800} color={colorPalette.deepNavy}>{children}</Typography>
        {chip && <Chip label={chip} size="small" sx={{ bgcolor:`${accent}14`, color:accent, fontWeight:700, fontSize:'0.7rem', borderRadius:'8px' }}/>}
    </Stack>
);

/* ══ GLASS STAT CARD ═══════════════════════════════════════════════════════ */
const StatCard = ({ label, value, subtitle, icon, accent, trend, trendLabel, progress }) => (
    <Box sx={{ ...G.card, p:2.5, height:'100%', borderRadius:'20px', position:'relative', overflow:'hidden',
        transition:'all 0.26s ease',
        '&:hover':{ transform:'translateY(-5px)', boxShadow:`0 16px 42px rgba(10,61,98,0.16)` },
        '&::after':{ content:'""', position:'absolute', top:0, left:0, right:0, height:3, borderRadius:'20px 20px 0 0', background:`linear-gradient(90deg,${accent},${accent}66)` },
        '&::before':{ content:'""', position:'absolute', top:-24, right:-24, width:84, height:84, borderRadius:'50%', background:`${accent}10`, zIndex:0 },
    }}>
        <Stack spacing={1.5} sx={{ position:'relative', zIndex:1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ width:44, height:44, borderRadius:'14px', bgcolor:`${accent}14`, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${accent}22` }}>
                    {icon}
                </Box>
                {trend != null && (
                    <Chip size="small"
                        icon={trend>=0 ? <TrendingUp sx={{ fontSize:'0.78rem !important', color:'#22c55e !important' }}/> : <TrendingDown sx={{ fontSize:'0.78rem !important', color:'#ef4444 !important' }}/>}
                        label={trendLabel || `${Math.abs(trend)}%`}
                        sx={{ height:22, fontSize:'0.7rem', fontWeight:800, bgcolor:trend>=0?'#22c55e18':'#ef444418', color:trend>=0?'#16a34a':'#dc2626', borderRadius:'8px', '& .MuiChip-label':{px:0.8} }}
                    />
                )}
            </Stack>
            <Box>
                <Typography variant="h4" fontWeight={900} sx={{ color:accent, lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
                    {value ?? <Skeleton width={55}/>}
                </Typography>
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform:'uppercase', letterSpacing:0.8, display:'block', mt:0.3 }}>
                    {label}
                </Typography>
                {subtitle && <Typography variant="caption" color="text.disabled" display="block" sx={{ mt:0.2 }}>{subtitle}</Typography>}
            </Box>
            {progress != null && (
                <Box>
                    <Box sx={{ height:6, borderRadius:99, bgcolor:`${accent}14`, overflow:'hidden' }}>
                        <motion.div initial={{ width:0 }} animate={{ width:`${Math.min(Number(progress),100)}%` }}
                            transition={{ duration:1, ease:[0.4,0,0.2,1], delay:0.3 }}
                            style={{ height:'100%', background:accent, borderRadius:99 }}/>
                    </Box>
                    <Typography variant="caption" color="text.disabled" sx={{ mt:0.4, display:'block' }}>{progress}%</Typography>
                </Box>
            )}
        </Stack>
    </Box>
);

/* ══ CHARTS SECTION ════════════════════════════════════════════════════════ */
const DashboardCharts = ({ stats, history }) => {
    /* ── Pie: attendance status split ── */
    const pieData = (() => {
        const counts = { Present:0, Halfday:0, Late:0 };
        history.forEach(r => {
            if (r.status === 'Present') counts.Present++;
            else if (r.status === 'Halfday') counts.Halfday++;
            if (r.timing === 'Late') counts.Late++;
        });
        return [
            { name:'Present',  value:counts.Present,  fill:colorPalette.seafoamGreen },
            { name:'Halfday',  value:counts.Halfday,  fill:'#f59e0b'                 },
            { name:'Late In',  value:counts.Late,     fill:colorPalette.coralSunset  },
        ].filter(d => d.value > 0);
    })();

    /* ── Bar: daily hours last 7 days ── */
    const barData = [...history].slice(0, 7).reverse().map(r => ({
        date: r.date?.slice(0, 5) || '',
        hours: r.hours !== '—' ? parseFloat(r.hours) : 0,
        target: 9,
    }));

    /* ── Bar: weekly summary tiles ── */
    const w = stats?.weekly;
    const m = stats?.monthly;
    const summaryBar = [
        { name:'Present', value:m?.presentDays || 0, fill:colorPalette.seafoamGreen },
        { name:'Halfday', value:m?.halfDays     || 0, fill:'#f59e0b'                },
        { name:'Absent',  value:m?.absentDays   || 0, fill:colorPalette.coralSunset },
        { name:'Late',    value:m?.lateDays     || 0, fill:'#8b5cf6'                },
    ];

    const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (percent < 0.1) return null;
        const R = Math.PI / 180;
        const r = innerRadius + (outerRadius - innerRadius) * 0.56;
        return <text x={cx + r * Math.cos(-midAngle * R)} y={cy + r * Math.sin(-midAngle * R)} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={900}>{`${(percent*100).toFixed(0)}%`}</text>;
    };

    return (
        <Box mb={0} sx={{ position:'relative', zIndex:1 }}>
            <Reveal><SectionLabel accent={colorPalette.cyanFresh} chip="7-day view">At-a-Glance Charts</SectionLabel></Reveal>
            <Grid container spacing={2.5}>

                {/* ── Donut ── */}
                <Grid item xs={12} sm={5}>
                    <Reveal delay={0}>
                        <Box sx={{ ...G.card, borderRadius:'22px', p:2.8, height:'100%' }}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                <Box sx={{ width:4, height:16, borderRadius:2, bgcolor:colorPalette.seafoamGreen }}/>
                                <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Week Status Split</Typography>
                            </Stack>
                            <Typography variant="caption" color="text.disabled" display="block" mb={1.5}>Last 7 clocking records</Typography>
                            <Box sx={{ position:'relative' }}>
                                <ResponsiveContainer width="100%" height={190}>
                                    <PieChart>
                                        <defs>
                                            {[colorPalette.seafoamGreen,'#f59e0b',colorPalette.coralSunset].map((c,i)=>(
                                                <radialGradient key={i} id={`dg${i}`} cx="50%" cy="50%" r="50%">
                                                    <stop offset="0%" stopColor={c} stopOpacity={1}/>
                                                    <stop offset="100%" stopColor={c} stopOpacity={0.72}/>
                                                </radialGradient>
                                            ))}
                                        </defs>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={84}
                                            paddingAngle={4} dataKey="value"
                                            animationBegin={200} animationDuration={900}
                                            stroke="rgba(255,255,255,0.55)" strokeWidth={2.5}
                                            labelLine={false} label={renderDonutLabel}>
                                            {pieData.map((_, i) => <Cell key={i} fill={`url(#dg${i})`}/>)}
                                        </Pie>
                                        <RTooltip content={<GlassTooltip/>}/>
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* centre */}
                                <Box sx={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', pointerEvents:'none' }}>
                                    <Typography variant="h5" fontWeight={900} color={colorPalette.deepNavy} sx={{ lineHeight:1 }}>{history.length}</Typography>
                                    <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ fontSize:'0.65rem' }}>Records</Typography>
                                </Box>
                            </Box>
                            <Stack spacing={0.8} mt={0.5}>
                                {pieData.map(item => (
                                    <Stack key={item.name} direction="row" alignItems="center" justifyContent="space-between">
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Box sx={{ width:11, height:11, borderRadius:'4px', bgcolor:item.fill }}/>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>{item.name}</Typography>
                                        </Stack>
                                        <Typography variant="caption" fontWeight={900} color={colorPalette.deepNavy}>{item.value}</Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        </Box>
                    </Reveal>
                </Grid>

                {/* ── Daily Hours Bar ── */}
                <Grid item xs={12} sm={7}>
                    <Reveal delay={0.08}>
                        <Box sx={{ ...G.card, borderRadius:'22px', p:2.8 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Box sx={{ width:4, height:16, borderRadius:2, bgcolor:colorPalette.oceanBlue }}/>
                                    <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Daily Hours</Typography>
                                    <Chip label="vs 9h target" size="small" sx={{ height:20, fontSize:'0.63rem', fontWeight:700, bgcolor:`${colorPalette.oceanBlue}10`, color:colorPalette.oceanBlue, borderRadius:'6px' }}/>
                                </Stack>
                                <Stack direction="row" spacing={1.5}>
                                    {[{ c:colorPalette.aquaVibrant, l:'Logged' },{ c:'rgba(10,61,98,0.13)', l:'Target' }].map(({ c,l }) => (
                                        <Stack key={l} direction="row" alignItems="center" spacing={0.5}>
                                            <Box sx={{ width:9, height:9, borderRadius:'3px', bgcolor:c.startsWith('rgba')?'rgba(10,61,98,0.18)':c }}/>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize:'0.63rem' }}>{l}</Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Stack>
                            <Typography variant="caption" color="text.disabled" display="block" mb={1.5}>Hours clocked per shift (last 7 days)</Typography>
                            <ResponsiveContainer width="100%" height={185}>
                                <BarChart data={barData} margin={{ top:4, right:4, left:-22, bottom:0 }} barCategoryGap="30%" barGap={2}>
                                    <defs>
                                        <linearGradient id="hrsGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={colorPalette.aquaVibrant} stopOpacity={0.95}/>
                                            <stop offset="100%" stopColor={colorPalette.oceanBlue} stopOpacity={0.65}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" vertical={false}/>
                                    <XAxis dataKey="date" tick={{ fontSize:10, fill:'#94a3b8', fontWeight:600 }} axisLine={false} tickLine={false}/>
                                    <YAxis tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} domain={[0,12]}/>
                                    <RTooltip content={<GlassTooltip/>} cursor={{ fill:'rgba(10,61,98,0.04)', radius:[4,4,0,0] }}/>
                                    <Bar dataKey="target" fill="rgba(10,61,98,0.10)" radius={[4,4,0,0]} name="Target (9h)" animationDuration={600}/>
                                    <Bar dataKey="hours"  fill="url(#hrsGrad)"        radius={[7,7,0,0]} name="Hours Logged" animationDuration={900} animationBegin={200}/>
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Reveal>
                </Grid>

                {/* ── Monthly Summary Bar ── */}
                <Grid item xs={12}>
                    <Reveal delay={0.14}>
                        <Box sx={{ ...G.card, borderRadius:'22px', p:2.8 }}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                <Box sx={{ width:4, height:16, borderRadius:2, bgcolor:'#f59e0b' }}/>
                                <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Monthly Breakdown</Typography>
                                <Chip label={new Date().toLocaleString('default',{month:'long'})} size="small" sx={{ height:20, fontSize:'0.63rem', fontWeight:700, bgcolor:'#f59e0b14', color:'#d97706', borderRadius:'6px' }}/>
                            </Stack>
                            <Typography variant="caption" color="text.disabled" display="block" mb={1.5}>Days present, halfday, absent and late arrivals this month</Typography>
                            <ResponsiveContainer width="100%" height={130}>
                                <BarChart data={summaryBar} layout="vertical" margin={{ top:4, right:40, left:8, bottom:0 }}>
                                    <defs>
                                        {[colorPalette.seafoamGreen,'#f59e0b',colorPalette.coralSunset,'#8b5cf6'].map((c,i)=>(
                                            <linearGradient key={i} id={`sbGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor={c} stopOpacity={0.9}/>
                                                <stop offset="100%" stopColor={c} stopOpacity={0.6}/>
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" horizontal={false}/>
                                    <XAxis type="number" tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
                                    <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:'#64748b', fontWeight:700 }} axisLine={false} tickLine={false} width={56}/>
                                    <RTooltip content={<GlassTooltip/>} cursor={{ fill:'rgba(10,61,98,0.04)' }}/>
                                    <Bar dataKey="value" radius={[0,8,8,0]} name="Days" animationDuration={900} animationBegin={200}
                                        label={{ position:'right', fontSize:10, fill:'#94a3b8', fontWeight:700 }}>
                                        {summaryBar.map((_,i)=><Cell key={i} fill={`url(#sbGrad${i})`}/>)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Reveal>
                </Grid>
            </Grid>
        </Box>
    );
};

/* ══ STATUS CHIP ════════════════════════════════════════════════════════════ */
const timingCfg = {
    Early: { bg:'#22c55e18', color:'#16a34a' },
    Late:  { bg:'#f9731618', color:'#ea580c' },
};
const statusCfg = {
    Present: { color:colorPalette.seafoamGreen },
    Halfday: { color:'#f59e0b' },
    '':      { color:'#94a3b8' },
};

/* ══ MAIN COMPONENT ════════════════════════════════════════════════════════ */
const DashboardContent = ({ currentTime, userLocation, setUserLocation, isWithinGeofence, setIsWithinGeofence }) => {
    const dispatch   = useDispatch();
    const theme      = useTheme();
    const { user }   = useSelector(s => s.currentUser);
    const { snack, notify, close } = useNotification();
    const isMobile   = useMediaQuery(theme.breakpoints.down('sm'));

    const [selectedStation,    setSelectedStation]    = useState(AvailableStations[0]);
    const [biometricRegistered,setBiometricRegistered]= useState(user?.doneBiometric || false);
    const [isClockedIn,        setIsClockedIn]        = useState(user?.hasClockedIn  || false);
    const [isToClockOut,       setIsToClockOut]       = useState(user?.isToClockOut  || false);
    const [biometricLoading,   setBiometricLoading]   = useState(false);
    const [recentAttendance,   setRecentAttendance]   = useState([]);
    const [userStats,          setUserStats]          = useState(null);
    const [statsLoading,       setStatsLoading]       = useState(true);

    /* ── fetch history ── */
    useEffect(() => {
        let alive = true;
        fetchClockingHistory(7).then(records => {
            if (!alive) return;
            setRecentAttendance(records.map(rec => ({
                date:    formatDate(rec.clock_in),
                clockIn: formatTime(rec.clock_in),
                clockOut:rec.clock_out ? formatTime(rec.clock_out) : '—',
                status:  rec.clock_out ? (rec.isPresent ? 'Present' : 'Halfday') : '',
                timing:  rec.isLate ? 'Late' : 'Early',
                hours:   rec.clock_out ? ((new Date(rec.clock_out)-new Date(rec.clock_in))/3_600_000).toFixed(2) : '—',
            })));
        }).catch(console.error);
        return () => { alive = false; };
    }, [isClockedIn]);

    /* ── fetch stats ── */
    useEffect(() => {
        let alive = true;
        setStatsLoading(true);
        fetchAttendanceStats().then(data => { if (alive) { setUserStats(data); setStatsLoading(false); } }).catch(() => { if (alive) setStatsLoading(false); });
        return () => { alive = false; };
    }, []);

    /* ── location ── */
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
    useEffect(() => { requestLocation(); }, [selectedStation.name]); // eslint-disable-line

    /* ── step logic ── */
    const clockStepIndex = !userLocation || !isWithinGeofence ? 0 : !biometricRegistered ? 1 : 2;
    const locationLabel  = userLocation
        ? isWithinGeofence ? 'Within KMFRI Premises ✓' : 'Outside Premises'
        : 'Location not verified';

    /* ── biometrics ── */
    const handleRegisterFingerprint = async () => {
        try {
            setBiometricLoading(true);
            await registerFingerprint();
            const updated = await getUserProfile();
            if (updated?.doneBiometric) {
                const fp = await getDeviceFingerprint();
                const { deviceName, browser, os } = detectCurrentDevice();
                await addNewDevice({ device_name:deviceName, device_os:os, device_browser:browser, device_fingerprint:fp });
                setBiometricRegistered(true);
                dispatch(updateUserCurrentUserRedux(await getUserProfile()));
                notify('Fingerprint registered successfully!');
            } else throw new Error('Biometric registration incomplete.');
        } catch (err) { notify(`${err}`, 'error'); }
        finally { setBiometricLoading(false); }
    };

    const handleClockInClockOut = async () => {
        try {
            setBiometricLoading(true);
            await verifyFingerprint(selectedStation.name);
            const updated = await getUserProfile();
            dispatch(updateUserCurrentUserRedux(updated));
            setIsClockedIn(updated.hasClockedIn);
            setIsToClockOut(updated.isToClockOut);
            localStorage.setItem('recent_station', selectedStation.name);
            notify(`${updated.name}, you clocked ${updated.hasClockedIn ? 'In' : 'Out'} successfully! 🎉`);
        } catch (err) { notify(`${err}`, 'error'); }
        finally { setBiometricLoading(false); }
    };

    const m = userStats?.monthly;
    const w = userStats?.weekly;

    /* ══ RENDER ════════════════════════════════════════════════════════════ */
    return (
        <Box sx={{ width:'100%', position:'relative' }}>
            <AmbientOrbs/>

            <Snackbar open={snack.open} autoHideDuration={5000} onClose={close} anchorOrigin={{ vertical:'top', horizontal:'center' }}>
                <Alert onClose={close} severity={snack.severity} variant="filled" elevation={6}
                    sx={{ borderRadius:'14px', fontWeight:700, backdropFilter:'blur(16px)', boxShadow:'0 8px 28px rgba(0,0,0,0.14)' }}>
                    {snack.message}
                </Alert>
            </Snackbar>

            {/* ══ HOW-TO BANNER ════════════════════════════════════════════ */}
            <Reveal>
                <Box sx={{ ...G.tinted(colorPalette.oceanBlue), borderRadius:'20px', p:2.5, mb:3, position:'relative', zIndex:1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                        <Box sx={{ width:34, height:34, borderRadius:'10px', bgcolor:`${colorPalette.oceanBlue}14`, border:`1px solid ${colorPalette.oceanBlue}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <InfoOutlined sx={{ color:colorPalette.oceanBlue, fontSize:'1.1rem' }}/>
                        </Box>
                        <Typography variant="subtitle2" fontWeight={900} color={colorPalette.deepNavy} sx={{ letterSpacing:0.5 }}>
                            How to Clock In / Out
                        </Typography>
                    </Stack>
                    <Grid container spacing={1.5}>
                        {[
                            { num:'01', text:'Select your assigned station from the dropdown.' },
                            { num:'02', text:"Click 'Verify Location' to confirm you're within KMFRI premises." },
                            { num:'03', text:'Register your fingerprint once (first time only).' },
                            { num:'04', text:'Scan your fingerprint to clock in or out.' },
                        ].map(({ num, text }) => (
                            <Grid item xs={12} sm={6} md={3} key={num}>
                                <Stack direction="row" spacing={1.2} alignItems="flex-start">
                                    <Box sx={{ px:0.9, py:0.3, borderRadius:'7px', bgcolor:colorPalette.oceanBlue, flexShrink:0 }}>
                                        <Typography variant="caption" fontWeight={900} sx={{ color:'#fff', fontSize:'0.66rem', lineHeight:1.6 }}>{num}</Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight:1.55, fontSize:'0.79rem' }}>{text}</Typography>
                                </Stack>
                            </Grid>
                        ))}
                    </Grid>
                    {/* progress dots */}
                    <Stack direction="row" spacing={1} mt={2} alignItems="center" flexWrap="wrap" gap={0.5}>
                        <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ fontSize:'0.63rem' }}>YOUR PROGRESS:</Typography>
                        {['Location','Fingerprint','Ready'].map((step, i) => (
                            <Stack key={step} direction="row" alignItems="center" spacing={0.5}>
                                <Box sx={{ width:i<=clockStepIndex?26:7, height:7, borderRadius:99,
                                    bgcolor:i<clockStepIndex?colorPalette.seafoamGreen:i===clockStepIndex?colorPalette.oceanBlue:`${colorPalette.oceanBlue}20`,
                                    transition:'all 0.4s ease' }}/>
                                {i<=clockStepIndex && (
                                    <Typography variant="caption" fontWeight={700} sx={{ fontSize:'0.63rem', color:i===clockStepIndex?colorPalette.oceanBlue:colorPalette.seafoamGreen }}>
                                        {step}
                                    </Typography>
                                )}
                            </Stack>
                        ))}
                    </Stack>
                </Box>
            </Reveal>

            {/* ══ MAIN GRID ════════════════════════════════════════════════ */}
            <Grid container spacing={3} alignItems="flex-start" sx={{ position:'relative', zIndex:1 }}>

                {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
                <Grid item xs={12} lg={7}>
                    <Stack spacing={3}>

                        {/* ── DARK CLOCK CARD ── */}
                        <Reveal>
                            <Box sx={{
                                borderRadius:'24px',
                                background: G.clockBg,
                                position:'relative', overflow:'hidden',
                                p:{ xs:3, md:4 },
                                boxShadow:'0 20px 56px rgba(10,61,98,0.30)',
                            }}>
                                {/* orbs inside clock */}
                                <Box sx={{ position:'absolute', top:-60, right:-60, width:220, height:220, borderRadius:'50%', background:'rgba(0,180,200,0.10)', filter:'blur(40px)', pointerEvents:'none' }}/>
                                <Box sx={{ position:'absolute', bottom:-80, left:-80, width:260, height:260, borderRadius:'50%', background:'rgba(10,61,98,0.30)', filter:'blur(50px)', pointerEvents:'none' }}/>

                                <Stack direction={{ xs:'column', md:'row' }} justifyContent="space-between" alignItems={{ xs:'center', md:'center' }} spacing={{ xs:4, md:5 }} sx={{ position:'relative', zIndex:1 }}>

                                    {/* Clock face */}
                                    <Box sx={{ textAlign:{ xs:'center', md:'left' }, flexShrink:0 }}>
                                        <Typography variant="caption" sx={{ opacity:0.60, fontWeight:800, letterSpacing:2.4, textTransform:'uppercase', display:'block', mb:0.5, fontSize:'0.66rem', color:'rgba(255,255,255,0.85)' }}>
                                            {currentTime.toLocaleDateString('en-US',{ weekday:'long', month:'long', day:'numeric' })}
                                        </Typography>
                                        <motion.div key={currentTime.getMinutes()} initial={{ opacity:0.7 }} animate={{ opacity:1 }} transition={{ duration:0.3 }}>
                                            <Typography fontWeight={900} sx={{ fontSize:{ xs:'4rem', sm:'5.2rem', md:'5.8rem' }, letterSpacing:-3, lineHeight:1, fontVariantNumeric:'tabular-nums', color:'#fff', textShadow:'0 4px 24px rgba(0,0,0,0.28)' }}>
                                                {currentTime.toLocaleTimeString([],{ hour:'2-digit', minute:'2-digit' })}
                                            </Typography>
                                        </motion.div>
                                        <Typography variant="caption" sx={{ opacity:0.45, letterSpacing:1, color:'rgba(255,255,255,0.7)' }}>
                                            {String(currentTime.getSeconds()).padStart(2,'0')}s
                                        </Typography>
                                        <Stack direction="row" spacing={1} mt={2.5} justifyContent={{ xs:'center', md:'flex-start' }} flexWrap="wrap" gap={1}>
                                            <Chip
                                                icon={<LocationOn sx={{ color:'white !important', fontSize:'0.85rem !important' }}/>}
                                                label={locationLabel} size="small"
                                                sx={{ bgcolor:isWithinGeofence?'rgba(34,197,94,0.22)':'rgba(239,68,68,0.22)', color:'#fff', fontWeight:700, fontSize:'0.7rem', border:`1px solid ${isWithinGeofence?'rgba(34,197,94,0.38)':'rgba(239,68,68,0.35)'}`, backdropFilter:'blur(8px)' }}
                                            />
                                            {isClockedIn && isToClockOut && (
                                                <Chip icon={<CheckCircle sx={{ color:'white !important', fontSize:'0.85rem !important' }}/>} label="Session Active" size="small"
                                                    sx={{ bgcolor:'rgba(34,197,94,0.24)', color:'#fff', fontWeight:700, fontSize:'0.7rem', border:'1px solid rgba(34,197,94,0.40)' }}/>
                                            )}
                                        </Stack>
                                    </Box>

                                    {/* Controls */}
                                    <Stack spacing={2} sx={{ width:{ xs:'100%', sm:'300px', md:'300px' } }}>
                                        <TextField select fullWidth label="Clocking Station"
                                            value={selectedStation.name}
                                            onChange={e => setSelectedStation(AvailableStations.find(s => s.name === e.target.value))}
                                            InputProps={{ startAdornment:<InputAdornment position="start"><BusinessCenter sx={{ color:'rgba(255,255,255,0.60)', fontSize:'1.05rem' }}/></InputAdornment> }}
                                            sx={G.glassInput}>
                                            {AvailableStations.map(o => <MenuItem key={o.name} value={o.name}>{o.name}</MenuItem>)}
                                        </TextField>

                                        {/* Step 0: verify location */}
                                        <AnimatePresence mode="wait">
                                            {clockStepIndex === 0 && (
                                                <motion.div key="loc" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.28 }}>
                                                    <Button variant="outlined" fullWidth startIcon={<LocationOn/>} onClick={requestLocation}
                                                        sx={{ color:'#fff', borderColor:'rgba(255,255,255,0.35)', py:1.5, borderRadius:'14px', fontWeight:800, letterSpacing:0.4, backdropFilter:'blur(8px)', bgcolor:'rgba(255,255,255,0.07)', '&:hover':{ borderColor:'rgba(255,255,255,0.70)', bgcolor:'rgba(255,255,255,0.13)' } }}>
                                                        Verify Location
                                                    </Button>
                                                </motion.div>
                                            )}

                                            {/* Step 1: register fingerprint */}
                                            {clockStepIndex === 1 && (
                                                <motion.div key="fp" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.28 }}>
                                                    <Box sx={{ p:2.5, borderRadius:'16px', bgcolor:'rgba(255,255,255,0.08)', border:'1px dashed rgba(255,255,255,0.30)', backdropFilter:'blur(8px)' }}>
                                                        <Stack spacing={1.5} alignItems="center" textAlign="center">
                                                            <Box sx={{ width:48, height:48, borderRadius:'14px', bgcolor:'rgba(255,255,255,0.10)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.18)' }}>
                                                                <Fingerprint sx={{ fontSize:'1.8rem', color:'rgba(255,255,255,0.85)' }}/>
                                                            </Box>
                                                            <Box>
                                                                <Typography fontWeight={900} sx={{ fontSize:'0.92rem', color:'#fff', mb:0.4 }}>Fingerprint Required</Typography>
                                                                <Typography variant="body2" sx={{ opacity:0.65, fontSize:'0.76rem', lineHeight:1.5, color:'rgba(255,255,255,0.75)' }}>
                                                                    Register once to enable secure clocking at all KMFRI stations.
                                                                </Typography>
                                                            </Box>
                                                            <Button variant="contained" fullWidth disabled={biometricLoading} onClick={handleRegisterFingerprint}
                                                                startIcon={biometricLoading ? <CircularProgress size={14} sx={{ color:'#fff' }}/> : <Fingerprint/>}
                                                                sx={{ bgcolor:colorPalette.seafoamGreen, color:'#fff', fontWeight:900, borderRadius:'12px', py:1.25, boxShadow:`0 6px 22px ${colorPalette.seafoamGreen}50`, '&:hover':{ bgcolor:'#1ea876' }, '&.Mui-disabled':{ bgcolor:'rgba(255,255,255,0.16)', color:'rgba(255,255,255,0.38)' } }}>
                                                                {biometricLoading ? 'Registering…' : 'Register Fingerprint'}
                                                            </Button>
                                                        </Stack>
                                                    </Box>
                                                </motion.div>
                                            )}

                                            {/* Step 2: clock in/out */}
                                            {clockStepIndex === 2 && (
                                                <motion.div key="clock" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.28 }}>
                                                    <Button variant="contained" fullWidth onClick={handleClockInClockOut} disabled={biometricLoading}
                                                        startIcon={biometricLoading ? <CircularProgress size={15} sx={{ color:colorPalette.deepNavy }}/> : <Fingerprint/>}
                                                        sx={{
                                                            bgcolor:isClockedIn&&isToClockOut ? colorPalette.seafoamGreen : colorPalette.aquaVibrant,
                                                            color:isClockedIn&&isToClockOut ? '#fff' : colorPalette.deepNavy,
                                                            py:1.7, borderRadius:'14px', fontWeight:900, fontSize:'0.9rem', letterSpacing:0.8,
                                                            boxShadow:`0 8px 28px ${colorPalette.aquaVibrant}55`,
                                                            transition:'all 0.22s ease',
                                                            '&:hover':{ transform:'translateY(-2px)', boxShadow:`0 12px 36px ${colorPalette.aquaVibrant}66` },
                                                            '&.Mui-disabled':{ bgcolor:'rgba(255,255,255,0.14)', color:'rgba(255,255,255,0.38)' },
                                                        }}>
                                                        {biometricLoading
                                                            ? (isClockedIn&&isToClockOut ? 'Clocking Out…' : 'Clocking In…')
                                                            : (isClockedIn&&isToClockOut ? 'SCAN TO CLOCK OUT' : 'SCAN TO CLOCK IN')}
                                                    </Button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </Stack>
                                </Stack>
                            </Box>
                        </Reveal>

                        {/* ── CHARTS ── */}
                        {recentAttendance.length > 0 && userStats && (
                            <DashboardCharts stats={userStats} history={recentAttendance}/>
                        )}

                        {/* ── RECENT ATTENDANCE TABLE ── */}
                        <Reveal>
                            <Box>
                                <SectionLabel accent={colorPalette.deepNavy} chip="Last 7 days">Recent Attendance</SectionLabel>
                                <Box sx={{ ...G.card, borderRadius:'20px', overflow:'hidden' }}>
                                    <Box sx={{ overflowX:'auto', '&::-webkit-scrollbar':{ height:3 }, '&::-webkit-scrollbar-thumb':{ bgcolor:'rgba(10,61,98,0.12)', borderRadius:2 } }}>
                                        <Table size="small" sx={{ minWidth: isMobile ? 560 : '100%' }}>
                                            <TableHead>
                                                <TableRow sx={{ background:'rgba(10,61,98,0.04)' }}>
                                                    {['Date', isMobile?'In':'Clock In', isMobile?'Out':'Clock Out', 'Timing', 'Status'].map(h => (
                                                        <TableCell key={h} sx={{ fontWeight:900, fontSize:'0.69rem', color:colorPalette.deepNavy, letterSpacing:0.7, py:1.6, textTransform:'uppercase', whiteSpace:'nowrap', borderBottom:'1px solid rgba(10,61,98,0.08)' }}>{h}</TableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {recentAttendance.length === 0
                                                    ? <TableRow><TableCell colSpan={5} align="center" sx={{ py:5, border:0 }}>
                                                        <Stack alignItems="center" spacing={1}>
                                                            <Box sx={{ width:56, height:56, borderRadius:'18px', bgcolor:'rgba(10,61,98,0.06)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                                <History sx={{ fontSize:30, color:'rgba(10,61,98,0.22)' }}/>
                                                            </Box>
                                                            <Typography variant="body2" color="text.disabled" fontWeight={600}>No attendance records found</Typography>
                                                        </Stack>
                                                      </TableCell></TableRow>
                                                    : recentAttendance.map((row, idx) => (
                                                        <motion.tr key={idx} initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }} transition={{ delay:idx*0.04, duration:0.25 }} style={{ display:'table-row' }}>
                                                            <TableCell sx={{ fontWeight:700, color:colorPalette.deepNavy, fontSize:'0.82rem', whiteSpace:'nowrap', borderBottom:'1px solid rgba(10,61,98,0.05)' }}>{row.date}</TableCell>
                                                            <TableCell sx={{ fontVariantNumeric:'tabular-nums', fontSize:'0.82rem', borderBottom:'1px solid rgba(10,61,98,0.05)' }}>{row.clockIn}</TableCell>
                                                            <TableCell sx={{ fontVariantNumeric:'tabular-nums', fontSize:'0.82rem', borderBottom:'1px solid rgba(10,61,98,0.05)' }}>{row.clockOut}</TableCell>
                                                            <TableCell sx={{ borderBottom:'1px solid rgba(10,61,98,0.05)' }}>
                                                                <Chip label={row.timing} size="small" sx={{ height:20, fontWeight:800, fontSize:'0.66rem', borderRadius:'7px', bgcolor:timingCfg[row.timing]?.bg||'#e0e0e020', color:timingCfg[row.timing]?.color||'#9e9e9e' }}/>
                                                            </TableCell>
                                                            <TableCell sx={{ borderBottom:'1px solid rgba(10,61,98,0.05)' }}>
                                                                <Stack direction="row" alignItems="center" spacing={0.6}>
                                                                    <FiberManualRecord sx={{ fontSize:8, color:statusCfg[row.status]?.color||'#94a3b8' }}/>
                                                                    <Typography variant="body2" fontWeight={700} sx={{ fontSize:'0.79rem' }}>{row.status||'—'}</Typography>
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
                    </Stack>
                </Grid>

                {/* ── RIGHT COLUMN — STATS ─────────────────────────────────── */}
                <Grid item xs={12} lg={5}>
                    <Stack spacing={2.5}>
                        <Reveal>
                            <SectionLabel accent={colorPalette.aquaVibrant} chip={`${new Date().toLocaleString('default',{month:'long'})} ${new Date().getFullYear()}`}>
                                My Dashboard
                            </SectionLabel>
                        </Reveal>

                        {/* Present / Absent */}
                        <Grid container spacing={2}>
                            {[
                                { label:'Days Present', value:safe(m?.presentDays), subtitle:'This month', icon:<CheckCircle sx={{ color:colorPalette.seafoamGreen, fontSize:'1.25rem' }}/>, accent:colorPalette.seafoamGreen, trend:2, trendLabel:'+2 vs last', progress:m?.attendanceRate },
                                { label:'Absent Days',  value:safe(m?.absentDays),  subtitle:'This month', icon:<CalendarMonth sx={{ color:colorPalette.coralSunset, fontSize:'1.25rem' }}/>, accent:colorPalette.coralSunset, trend:-1, trendLabel:'-1 vs last' },
                            ].map((c,i) => (
                                <Grid item xs={6} key={c.label}><Reveal delay={i*0.07}>{statsLoading?<Skeleton variant="rounded" height={140} sx={{ borderRadius:'20px' }}/>:<StatCard {...c}/>}</Reveal></Grid>
                            ))}
                        </Grid>

                        {/* Half days / Late */}
                        <Grid container spacing={2}>
                            {[
                                { label:'Half Days',     value:safe(m?.halfDays), subtitle:'Partial shifts', icon:<AccessTime sx={{ color:'#f59e0b', fontSize:'1.25rem' }}/>, accent:'#f59e0b' },
                                { label:'Late Arrivals', value:safe(m?.lateDays), subtitle:'This month',      icon:<WorkHistory sx={{ color:'#8b5cf6', fontSize:'1.25rem' }}/>, accent:'#8b5cf6' },
                            ].map((c,i) => (
                                <Grid item xs={6} key={c.label}><Reveal delay={i*0.07}>{statsLoading?<Skeleton variant="rounded" height={130} sx={{ borderRadius:'20px' }}/>:<StatCard {...c}/>}</Reveal></Grid>
                            ))}
                        </Grid>

                        {/* Weekly Hours */}
                        <Reveal>
                            {statsLoading
                                ? <Skeleton variant="rounded" height={145} sx={{ borderRadius:'20px' }}/>
                                : <StatCard label="Weekly Hours Worked"
                                    value={w?.totalHours ? `${w.totalHours} hrs` : '—'}
                                    subtitle="Target: 40 hrs / week"
                                    icon={<AccessTime sx={{ color:colorPalette.oceanBlue, fontSize:'1.3rem' }}/>}
                                    accent={colorPalette.oceanBlue} trend={5} trendLabel="+2.5h vs last"
                                    progress={w?.totalHours ? ((w.totalHours/40)*100).toFixed(0) : null}/>
                            }
                        </Reveal>

                        {/* Punctuality / Attendance rate */}
                        <Grid container spacing={2}>
                            {[
                                { label:'Punctuality',    value:m?.punctualityRate!=null?`${m.punctualityRate}%`:'—', subtitle:'On-time arrivals', icon:<EmojiEvents sx={{ color:'#f59e0b', fontSize:'1.25rem' }}/>, accent:'#f59e0b', progress:m?.punctualityRate },
                                { label:'Attendance Rate', value:m?.attendanceRate!=null?`${m.attendanceRate}%`:'—',  subtitle:'Days covered',     icon:<WorkHistory sx={{ color:colorPalette.aquaVibrant, fontSize:'1.25rem' }}/>, accent:colorPalette.aquaVibrant, progress:m?.attendanceRate },
                            ].map((c,i) => (
                                <Grid item xs={6} key={c.label}><Reveal delay={i*0.07}>{statsLoading?<Skeleton variant="rounded" height={150} sx={{ borderRadius:'20px' }}/>:<StatCard {...c}/>}</Reveal></Grid>
                            ))}
                        </Grid>

                        {/* Monthly summary dark card */}
                        <Reveal>
                            <Box sx={{ borderRadius:'22px', background:G.clockBg, color:'#fff', p:3, position:'relative', overflow:'hidden', boxShadow:'0 14px 44px rgba(10,61,98,0.28)' }}>
                                <Box sx={{ position:'absolute', top:-40, right:-40, width:140, height:140, borderRadius:'50%', background:'rgba(0,180,200,0.10)', filter:'blur(30px)', pointerEvents:'none' }}/>
                                <Box sx={{ position:'absolute', bottom:-30, left:-30, width:110, height:110, borderRadius:'50%', background:'rgba(10,61,98,0.30)', filter:'blur(24px)', pointerEvents:'none' }}/>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ position:'relative', zIndex:1 }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ opacity:0.65, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase', fontSize:'0.62rem', display:'block', mb:0.5, color:'rgba(255,255,255,0.8)' }}>
                                            Monthly Overview
                                        </Typography>
                                        <Typography fontWeight={900} sx={{ fontSize:'1.1rem', lineHeight:1.3, color:'#fff' }}>
                                            {m?.attendanceRate>=90?'Great performance! 🎯':m?.attendanceRate>=75?'Keep it up! 💪':'Room to improve 📈'}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity:0.68, mt:0.6, fontSize:'0.78rem', lineHeight:1.55, color:'rgba(255,255,255,0.75)' }}>
                                            {userStats?.summary||'Loading your summary…'}
                                        </Typography>
                                    </Box>
                                    <QueryStats sx={{ fontSize:38, opacity:0.18, flexShrink:0 }}/>
                                </Stack>
                                <Box sx={{ height:'1px', bgcolor:'rgba(255,255,255,0.10)', my:2.5 }}/>
                                <Grid container spacing={1.5} sx={{ position:'relative', zIndex:1 }}>
                                    {[
                                        { label:'Total Hrs', value:safe(m?.totalHours) },
                                        { label:'Overtime',  value:safe(m?.overtimeHours) },
                                        { label:'Avg/Day',   value:safe(m?.avgHoursPerDay) },
                                    ].map(({ label, value }) => (
                                        <Grid item xs={4} key={label}>
                                            <Box sx={{ p:1.5, borderRadius:'14px', background:'rgba(255,255,255,0.09)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.13)', textAlign:'center' }}>
                                                <Typography fontWeight={900} sx={{ fontSize:'1.1rem', fontVariantNumeric:'tabular-nums', color:'#fff' }}>{value}</Typography>
                                                <Typography variant="caption" sx={{ opacity:0.60, fontSize:'0.62rem', color:'rgba(255,255,255,0.7)' }}>{label}</Typography>
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