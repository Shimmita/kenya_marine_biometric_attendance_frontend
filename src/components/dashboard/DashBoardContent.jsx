import {
    AccessTime,
    BusinessCenter,
    CalendarMonth,
    CheckCircle,
    EmojiEvents,
    FiberManualRecord,
    Fingerprint,
    History,
    InfoOutlined,
    LocationOn,
    QueryStats,
    TrendingDown,
    TrendingUp,
    WorkHistory,
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    InputAdornment,
    MenuItem,
    Paper,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
// const GEOFENCE_RADIUS_METERS = 800;
const GEOFENCE_RADIUS_METERS = 500000;

/* ─── Snackbar hook ──────────────────────────────────────────────────────── */
const useNotification = () => {
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
    const notify = (message, severity = 'success') => setSnack({ open: true, message, severity });
    const close = () => setSnack((s) => ({ ...s, open: false }));
    return { snack, notify, close };
};

/* ─── Spark bar ──────────────────────────────────────────────────────────── */
const SparkBar = ({ value, max, color }) => (
    <Box sx={{ width: '100%', height: 4, bgcolor: `${color}15`, borderRadius: 99, overflow: 'hidden', mt: 0.5 }}>
        <Box sx={{
            height: '100%',
            width: `${Math.min((value / (max || 1)) * 100, 100)}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            borderRadius: 99,
            transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
        }} />
    </Box>
);

/* ─── Elegant Stat Card ──────────────────────────────────────────────────── */
const StatCard = ({ label, value, subtitle, icon, accent, trend, trendLabel, barMax, wide = false }) => (
    <Paper
        elevation={0}
        sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            height: '100%',
            borderRadius: 4,
            border: `1px solid ${accent}16`,
            background: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
            transition: 'box-shadow 0.22s ease, transform 0.22s ease',
            '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 14px 36px ${accent}18` },
            /* radial glow */
            '&::before': {
                content: '""', position: 'absolute',
                top: -36, right: -36, width: 120, height: 120,
                background: `radial-gradient(circle, ${accent}1c 0%, transparent 68%)`,
                zIndex: 0,
            },
            /* bottom accent stripe */
            '&::after': {
                content: '""', position: 'absolute', bottom: 0, left: '18%', right: '18%',
                height: 3, borderRadius: '2px 2px 0 0',
                background: `linear-gradient(90deg, transparent, ${accent}70, transparent)`,
            },
        }}
    >
        <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box sx={{
                    width: 46, height: 46, borderRadius: 3,
                    background: `linear-gradient(135deg, ${accent}26 0%, ${accent}0e 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 12px ${accent}16`,
                }}>
                    {icon}
                </Box>
                {trend != null && (
                    <Chip
                        size="small"
                        icon={trend >= 0
                            ? <TrendingUp sx={{ fontSize: '0.76rem !important', color: '#16a34a !important' }} />
                            : <TrendingDown sx={{ fontSize: '0.76rem !important', color: '#dc2626 !important' }} />}
                        label={trendLabel || `${Math.abs(trend)}%`}
                        sx={{
                            height: 22, fontSize: '0.67rem', fontWeight: 800,
                            bgcolor: trend >= 0 ? '#dcfce7' : '#fee2e2',
                            color: trend >= 0 ? '#15803d' : '#b91c1c',
                            border: `1px solid ${trend >= 0 ? '#bbf7d0' : '#fecaca'}`,
                            '& .MuiChip-label': { px: 0.7 },
                        }}
                    />
                )}
            </Stack>

            <Box>
                <Typography
                    fontWeight={900}
                    sx={{
                        fontSize: wide
                            ? { xs: '2rem', md: '2.4rem' }
                            : { xs: '1.65rem', md: '2rem' },
                        color: accent, lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5,
                    }}
                >
                    {value ?? '—'}
                </Typography>
                <Typography variant="caption" fontWeight={700} color="text.secondary"
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.9, fontSize: '0.66rem', display: 'block', mt: 0.5 }}>
                    {label}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>{subtitle}</Typography>
                )}
            </Box>

            {barMax != null && value != null && (
                <SparkBar value={parseFloat(value)} max={barMax} color={accent} />
            )}
        </Stack>
    </Paper>
);

/* ─── Status Chip ────────────────────────────────────────────────────────── */
const StatusChip = ({ label, colorMap }) => {
    const cfg = colorMap[label] || { bg: '#f1f5f9', color: '#94a3b8' };
    return <Chip label={label || '—'} size="small" sx={{ height: 20, fontSize: '0.66rem', fontWeight: 800, bgcolor: cfg.bg, color: cfg.color, borderRadius: 1.5 }} />;
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
const DashboardContent = ({ currentTime, userLocation, setUserLocation, isWithinGeofence, setIsWithinGeofence }) => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const { user } = useSelector((state) => state.currentUser);
    const { snack, notify, close } = useNotification();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [selectedStation, setSelectedStation] = useState(AvailableStations[0]);
    const [buttonState, setButtonState] = useState({ label: 'CLOCK IN', enabled: true });
    const [biometricRegistered, setBiometricRegistered] = useState(user?.doneBiometric || false);
    const [isClockedIn, setIsClockedIn] = useState(user?.hasClockedIn || false);
    const [isToClockOut, setIsToClockOut] = useState(user?.isToClockOut || false);
    const [biometricLoading, setBiometricLoading] = useState(false);
    const [recentAttendance, setRecentAttendance] = useState([]);
    const [userStats, setUserStats] = useState(null);

    /* ── history: depends on local clock state only — no extra renders ── */
    useEffect(() => {
        let isMounted = true;
        const getAttendance = async () => {
            try {
                const records = await fetchClockingHistory(7);
                const formatted = records.map((rec) => ({
                    date: formatDate(rec.clock_in),
                    clockIn: formatTime(rec.clock_in),
                    clockOut: rec.clock_out ? formatTime(rec.clock_out) : '—',
                    status: rec.clock_out ? (rec.isPresent ? 'Present' : 'Halfday') : '',
                    timing: rec.isLate ? 'Late' : 'Early',
                }));
                if (isMounted) setRecentAttendance(formatted);
            } catch (err) {
                console.error('Attendance fetch failed:', err);
            }
        };
        getAttendance();
        return () => { isMounted = false; };
    }, [isClockedIn]);

    /* ── stats: mount only ── */
    useEffect(() => {
        let isMounted = true;
        const getStats = async () => {
            try {
                const data = await fetchAttendanceStats();
                if (isMounted) setUserStats(data);
            } catch (err) {
                console.error('Stats fetch failed:', err);
            }
        };
        getStats();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        setButtonState({ label: isClockedIn ? 'SCAN TO CLOCK OUT' : 'SCAN TO CLOCK IN', enabled: true });
    }, [isClockedIn]);

    /* ── Location ── */
    const requestLocation = () => {
        if (!navigator.geolocation) { notify('Geolocation not supported.', 'error'); return; }
        navigator.geolocation.getCurrentPosition(
            ({ coords: { latitude, longitude } }) => {
                setUserLocation({ latitude, longitude });
                const d = calculateDistanceMeters(latitude, longitude, selectedStation.lat, selectedStation.lng);
                setIsWithinGeofence(d <= GEOFENCE_RADIUS_METERS);
                console.log("distance:", d)
            },
            () => notify('Location access denied. Please enable GPS.', 'error'),
            { enableHighAccuracy: true, timeout: 20000 }
        );
    };
    useEffect(() => { requestLocation(); }, [selectedStation.name]); // eslint-disable-line

    /* ── Biometrics ── */
    const handleRegisterFingerprint = async () => {
        try {
            setBiometricLoading(true);
            await registerFingerprint();
            const updatedUser = await getUserProfile();
            if (updatedUser?.doneBiometric) {
                const deviceFingerPrinting = await getDeviceFingerprint()
                const { deviceName, browser, os } = detectCurrentDevice()
                // add the device to to the backend devices lists
                await addNewDevice({
                    device_name: deviceName,
                    device_os: os,
                    device_browser: browser,
                    device_fingerprint: deviceFingerPrinting
                });
                setBiometricRegistered(true);
                const updatedUser = await getUserProfile();
                dispatch(updateUserCurrentUserRedux(updatedUser));
                notify('Fingerprint registered successfully!', 'success');
            } else {
                throw new Error('Biometric registration incomplete. Please try again.');
            }
        } catch (err) {
            notify(`${err}`, 'error');
        } finally {
            setBiometricLoading(false);
        }
    };

    const handleClockInClockOut = async () => {
        try {
            setBiometricLoading(true);
            await verifyFingerprint(selectedStation.name);
            const updatedUser = await getUserProfile();
            dispatch(updateUserCurrentUserRedux(updatedUser));
            setIsClockedIn(updatedUser.hasClockedIn);
            setIsToClockOut(updatedUser.isToClockOut);

            // add to the local storage the selected station as recent station
            localStorage.setItem("recent_station", selectedStation.name)

            notify(`${updatedUser.name}, you have successfully clocked ${updatedUser.hasClockedIn ? 'In' : 'Out'}! 🎉`, 'success');
        } catch (err) {
            notify(`${err}`, 'error');
        } finally {
            setBiometricLoading(false);
        }
    };

    /* ── Derived ── */
    const locationLabel = userLocation
        ? isWithinGeofence ? 'Within KMFRI Premises ✓' : 'Outside KMFRI Premises'
        : 'Location not verified';
    const clockStepIndex = !userLocation || !isWithinGeofence ? 0 : !biometricRegistered ? 1 : 2;

    const timingColorMap = {
        Early: { bg: '#dcfce7', color: '#15803d' },
        Late: { bg: '#fff7ed', color: '#c2410c' },
    };

    const m = userStats?.monthly;
    const w = userStats?.weekly;

    /* ════════════════════════════════════════════════════════════════════ */
    return (
        <Box sx={{ width: '100%' }}>

            <Snackbar open={snack.open} autoHideDuration={5000} onClose={close} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={close} severity={snack.severity} variant="filled" elevation={6} sx={{ borderRadius: 3, fontWeight: 700, minWidth: 320 }}>
                    {snack.message}
                </Alert>
            </Snackbar>

            {/* ── How-to banner ─────────────────────────────────────────── */}
            <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, mb: 3, borderRadius: 4, bgcolor: `${colorPalette.oceanBlue}06`, border: `1px dashed ${colorPalette.oceanBlue}40` }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                    <InfoOutlined sx={{ color: colorPalette.oceanBlue, fontSize: '1.05rem' }} />
                    <Typography variant="subtitle2" fontWeight={900} color={colorPalette.deepNavy} sx={{ letterSpacing: 0.6, fontSize: '0.8rem' }}>
                        HOW TO CLOCK IN / OUT
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
                                <Typography variant="caption" fontWeight={900} sx={{ color: 'white', bgcolor: colorPalette.oceanBlue, borderRadius: 1, px: 0.9, py: 0.25, lineHeight: 1.6, flexShrink: 0, fontSize: '0.68rem' }}>
                                    {num}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, fontSize: '0.79rem' }}>{text}</Typography>
                            </Stack>
                        </Grid>
                    ))}
                </Grid>
                <Stack direction="row" spacing={1} mt={2} alignItems="center" flexWrap="wrap" gap={0.5}>
                    <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ fontSize: '0.64rem' }}>YOUR PROGRESS:</Typography>
                    {['Location', 'Fingerprint', 'Ready'].map((step, i) => (
                        <Stack key={step} direction="row" alignItems="center" spacing={0.5}>
                            <Box sx={{ width: i <= clockStepIndex ? 24 : 7, height: 7, borderRadius: 99, bgcolor: i < clockStepIndex ? colorPalette.seafoamGreen : i === clockStepIndex ? colorPalette.oceanBlue : `${colorPalette.oceanBlue}20`, transition: 'all 0.4s ease' }} />
                            {i <= clockStepIndex && (
                                <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.64rem', color: i === clockStepIndex ? colorPalette.oceanBlue : colorPalette.seafoamGreen }}>{step}</Typography>
                            )}
                        </Stack>
                    ))}
                </Stack>
            </Paper>

            {/* ── Main grid ─────────────────────────────────────────────── */}
            <Grid container spacing={3} alignItems="flex-start">

                {/* ═══ LEFT col — Clock + table ════════════════════════════ */}
                <Grid item xs={12} lg={7} xl={8}>
                    <Stack spacing={3}>

                        {/* ── Clock card ────────────────────────────────── */}
                        <Paper elevation={0} sx={{
                            p: { xs: 3, md: 4 },
                            borderRadius: 5,
                            background: colorPalette.oceanGradient,
                            color: 'white',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 20px 56px rgba(10,61,98,0.26)',
                            '&::before': { content: '""', position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' },
                            '&::after': { content: '""', position: 'absolute', bottom: -55, left: -55, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' },
                        }}>
                            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'center', md: 'center' }} spacing={{ xs: 4, md: 5 }}>
                                {/* Clock face */}
                                <Box sx={{ textAlign: { xs: 'center', md: 'left' }, flexShrink: 0 }}>
                                    <Typography variant="caption" sx={{ opacity: 0.68, fontWeight: 800, letterSpacing: 2.5, textTransform: 'uppercase', display: 'block', mb: 0.5, fontSize: '0.68rem' }}>
                                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </Typography>
                                    <Typography fontWeight={900} sx={{ fontSize: { xs: '4rem', sm: '5.2rem', md: '5.8rem' }, letterSpacing: -3, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.5, letterSpacing: 1 }}>
                                        {String(currentTime.getSeconds()).padStart(2, '0')}s
                                    </Typography>
                                    <Stack direction="row" spacing={1} mt={2.5} justifyContent={{ xs: 'center', md: 'flex-start' }} flexWrap="wrap" gap={1}>
                                        <Chip
                                            icon={<LocationOn sx={{ color: 'white !important', fontSize: '0.85rem !important' }} />}
                                            label={locationLabel} size="small"
                                            sx={{ bgcolor: isWithinGeofence ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.22)', color: 'white', fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${isWithinGeofence ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.35)'}` }}
                                        />
                                        {isClockedIn && isToClockOut && (
                                            <Chip icon={<CheckCircle sx={{ color: 'white !important', fontSize: '0.85rem !important' }} />} label="Session Active" size="small"
                                                sx={{ bgcolor: 'rgba(34,197,94,0.26)', color: 'white', fontWeight: 700, fontSize: '0.7rem', border: '1px solid rgba(34,197,94,0.42)' }} />
                                        )}
                                    </Stack>
                                </Box>

                                {/* Controls stack */}
                                <Stack spacing={2} sx={{ width: { xs: '100%', sm: '300px', md: '300px' } }}>
                                    <TextField
                                        select fullWidth label="Clocking Station"
                                        value={selectedStation.name}
                                        onChange={(e) => setSelectedStation(AvailableStations.find((s) => s.name === e.target.value))}
                                        InputProps={{ startAdornment: (<InputAdornment position="start"><BusinessCenter sx={{ color: 'rgba(255,255,255,0.62)', fontSize: '1.05rem' }} /></InputAdornment>) }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': { color: 'white', borderRadius: 3, '& fieldset': { borderColor: 'rgba(255,255,255,0.24)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.6)' }, '&.Mui-focused fieldset': { borderColor: colorPalette.aquaVibrant }, '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.62)' } },
                                            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                                            '& .MuiInputLabel-root.Mui-focused': { color: colorPalette.aquaVibrant },
                                            '& .MuiSelect-select': { color: 'white' },
                                        }}
                                    >
                                        {AvailableStations.map((o) => <MenuItem key={o.name} value={o.name}>{o.name}</MenuItem>)}
                                    </TextField>

                                    {clockStepIndex === 0 && (
                                        <Button variant="outlined" fullWidth startIcon={<LocationOn />} onClick={requestLocation}
                                            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.38)', py: 1.5, borderRadius: 3, fontWeight: 800, letterSpacing: 0.5, backdropFilter: 'blur(6px)', bgcolor: 'rgba(255,255,255,0.06)', '&:hover': { borderColor: 'rgba(255,255,255,0.75)', bgcolor: 'rgba(255,255,255,0.12)' } }}>
                                            Verify Location
                                        </Button>
                                    )}

                                    {clockStepIndex === 1 && (
                                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.08)', border: '1px dashed rgba(255,255,255,0.32)', backdropFilter: 'blur(8px)' }}>
                                            <Stack spacing={1.5} alignItems="center" textAlign="center">
                                                <Fingerprint sx={{ fontSize: '2.4rem', opacity: 0.85 }} />
                                                <Box>
                                                    <Typography fontWeight={900} sx={{ fontSize: '0.94rem', mb: 0.4 }}>Fingerprint Required</Typography>
                                                    <Typography variant="body2" sx={{ opacity: 0.7, fontSize: '0.78rem', lineHeight: 1.5 }}>
                                                        Register once to enable secure clocking at all KMFRI stations.
                                                    </Typography>
                                                </Box>
                                                <Button variant="contained" fullWidth disabled={biometricLoading} onClick={handleRegisterFingerprint}
                                                    startIcon={biometricLoading ? <CircularProgress size={15} sx={{ color: 'white' }} /> : <Fingerprint />}
                                                    sx={{ bgcolor: colorPalette.seafoamGreen, color: 'white', fontWeight: 900, borderRadius: 3, py: 1.25, boxShadow: `0 4px 18px ${colorPalette.seafoamGreen}55`, '&:hover': { bgcolor: '#1ea876' }, '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.4)' } }}>
                                                    {biometricLoading ? 'Registering…' : 'Register Fingerprint'}
                                                </Button>
                                            </Stack>
                                        </Paper>
                                    )}

                                    {clockStepIndex === 2 && (
                                        <Button variant="contained" fullWidth onClick={handleClockInClockOut} disabled={biometricLoading}
                                            startIcon={biometricLoading ? <CircularProgress size={15} sx={{ color: colorPalette.deepNavy }} /> : <Fingerprint />}
                                            sx={{
                                                bgcolor: isClockedIn && isToClockOut ? colorPalette.seafoamGreen : colorPalette.aquaVibrant,
                                                color: isClockedIn && isToClockOut ? 'white' : colorPalette.deepNavy,
                                                py: 1.7, borderRadius: 3, fontWeight: 900, fontSize: '0.9rem', letterSpacing: 0.8,
                                                boxShadow: `0 6px 22px ${colorPalette.aquaVibrant}50`,
                                                transition: 'all 0.2s ease',
                                                '&:hover': { transform: 'translateY(-1px)', boxShadow: `0 10px 32px ${colorPalette.aquaVibrant}65` },
                                                '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.4)' },
                                            }}>
                                            {biometricLoading ? (isClockedIn && isToClockOut ? 'Clocking Out…' : 'Clocking In…') : buttonState.label}
                                        </Button>
                                    )}
                                </Stack>
                            </Stack>
                        </Paper>

                        {/* ── Recent Attendance table ────────────────────── */}
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                                <Box sx={{ width: 4, height: 20, borderRadius: 2, bgcolor: colorPalette.deepNavy }} />
                                <Typography variant="h6" fontWeight={800} color={colorPalette.deepNavy}>Recent Attendance</Typography>
                                <Chip label="Last 7 days" size="small" sx={{ bgcolor: `${colorPalette.oceanBlue}10`, color: colorPalette.oceanBlue, fontWeight: 700, fontSize: '0.68rem' }} />
                            </Stack>
                            <TableContainer
                                component={Paper}
                                elevation={0}
                                sx={{
                                    borderRadius: 4,
                                    border: `1px solid ${colorPalette.softGray}`,
                                    overflowX: 'auto', // Enable horizontal scrolling
                                    msOverflowStyle: 'none', // Hide scrollbar for IE and Edge
                                    scrollbarWidth: 'none', // Hide scrollbar for Firefox
                                    '&::-webkit-scrollbar': {
                                        display: 'none', // Hide scrollbar for Chrome, Safari, and Opera
                                    },
                                }}
                            >
                                <Table
                                    size="small"
                                    sx={{
                                        minWidth: isMobile ? 600 : '100%', // Ensures columns don't squash on mobile
                                    }}
                                >
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: `${colorPalette.deepNavy}06` }}>
                                            {['Date', isMobile ? 'In' : 'Clock In', isMobile ? 'Out' : 'Clock Out', 'Timing', 'Status'].map((h) => (
                                                <TableCell
                                                    key={h}
                                                    sx={{
                                                        fontWeight: 900,
                                                        fontSize: '0.69rem',
                                                        color: colorPalette.deepNavy,
                                                        letterSpacing: 0.7,
                                                        py: 1.5,
                                                        textTransform: 'uppercase',
                                                        whiteSpace: 'nowrap' // Prevents headers from wrapping
                                                    }}
                                                >
                                                    {h}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {recentAttendance.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                                                    <Stack alignItems="center" spacing={1}>
                                                        <History sx={{ color: '#cbd5e1', fontSize: 36 }} />
                                                        <Typography variant="body2" color="text.disabled" fontWeight={600}>No attendance records found</Typography>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            recentAttendance.map((row, idx) => (
                                                <TableRow key={idx} sx={{ '&:last-child td': { border: 0 }, '&:hover': { bgcolor: `${colorPalette.oceanBlue}04` }, transition: 'background 0.15s' }}>
                                                    <TableCell sx={{ fontWeight: 700, color: colorPalette.deepNavy, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{row.date}</TableCell>
                                                    <TableCell sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.82rem' }}>{row.clockIn}</TableCell>
                                                    <TableCell sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.82rem' }}>{row.clockOut}</TableCell>
                                                    <TableCell><StatusChip label={row.timing} colorMap={timingColorMap} /></TableCell>
                                                    <TableCell>
                                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                                            <FiberManualRecord sx={{ fontSize: 8, color: row.status === 'Present' ? colorPalette.seafoamGreen : colorPalette.coralSunset }} />
                                                            <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{row.status || '—'}</Typography>
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Stack>
                </Grid>

                {/* ═══ RIGHT col — Stats ═══════════════════════════════════ */}
                <Grid item xs={12} lg={5} xl={4}>
                    <Stack spacing={2.5}>
                        {/* Section heading */}
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box sx={{ width: 4, height: 20, borderRadius: 2, bgcolor: colorPalette.aquaVibrant }} />
                            <Typography variant="h6" fontWeight={800} color={colorPalette.deepNavy}>My Dashboard</Typography>
                            <Chip
                                label={`${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`}
                                size="small"
                                sx={{ bgcolor: `${colorPalette.oceanBlue}10`, color: colorPalette.oceanBlue, fontWeight: 700, fontSize: '0.68rem' }}
                            />
                        </Stack>

                        {/* Present / Absent */}
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <StatCard label="Days Present" value={m?.presentDays} subtitle="This month"
                                    icon={<CheckCircle sx={{ color: colorPalette.seafoamGreen, fontSize: '1.25rem' }} />}
                                    accent={colorPalette.seafoamGreen} trend={2} trendLabel="+2 vs last mo."
                                    barMax={m ? m.presentDays + m.absentDays : 25} />
                            </Grid>
                            <Grid item xs={6}>
                                <StatCard label="Absent Days" value={m?.absentDays} subtitle="This month"
                                    icon={<CalendarMonth sx={{ color: colorPalette.coralSunset, fontSize: '1.25rem' }} />}
                                    accent={colorPalette.coralSunset} trend={-1} trendLabel="-1 vs last mo."
                                    barMax={m ? m.presentDays + m.absentDays : 25} />
                            </Grid>
                        </Grid>

                        {/* Half days / Late */}
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <StatCard label="Half Days" value={m?.halfDays} subtitle="Partial shifts"
                                    icon={<AccessTime sx={{ color: '#f59e0b', fontSize: '1.25rem' }} />}
                                    accent="#f59e0b" />
                            </Grid>
                            <Grid item xs={6}>
                                <StatCard label="Late Arrivals" value={m?.lateDays} subtitle="This month"
                                    icon={<WorkHistory sx={{ color: colorPalette.coralSunset, fontSize: '1.25rem' }} />}
                                    accent={colorPalette.coralSunset} />
                            </Grid>
                        </Grid>

                        {/* Weekly hours — spans full width of right col */}
                        <StatCard wide label="Weekly Hours Worked"
                            value={w?.totalHours ? `${w.totalHours} hrs` : '—'}
                            subtitle="Target: 40 hrs / week"
                            icon={<AccessTime sx={{ color: colorPalette.oceanBlue, fontSize: '1.25rem' }} />}
                            accent={colorPalette.oceanBlue} trend={5} trendLabel="+2.5h vs last wk"
                            barMax={40} />

                        {/* Punctuality / Attendance rate */}
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <StatCard label="Punctuality" value={m?.punctualityRate != null ? `${m.punctualityRate}%` : '—'} subtitle="On-time arrivals"
                                    icon={<EmojiEvents sx={{ color: '#f59e0b', fontSize: '1.25rem' }} />}
                                    accent="#f59e0b" barMax={100} />
                            </Grid>
                            <Grid item xs={6}>
                                <StatCard label="Attendance Rate" value={m?.attendanceRate != null ? `${m.attendanceRate}%` : '—'} subtitle="Days covered"
                                    icon={<WorkHistory sx={{ color: colorPalette.aquaVibrant, fontSize: '1.25rem' }} />}
                                    accent={colorPalette.aquaVibrant} barMax={100} />
                            </Grid>
                        </Grid>

                        {/* Monthly summary gradient card */}
                        <Paper elevation={0} sx={{
                            p: 3, borderRadius: 4,
                            background: colorPalette.oceanGradient,
                            color: 'white', position: 'relative', overflow: 'hidden',
                            boxShadow: '0 14px 44px rgba(10,61,98,0.24)',
                        }}>
                            <Box sx={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.055)', pointerEvents: 'none' }} />
                            <Box sx={{ position: 'absolute', bottom: -28, left: -28, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.035)', pointerEvents: 'none' }} />

                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ position: 'relative', zIndex: 1 }}>
                                <Box>
                                    <Typography variant="caption" sx={{ opacity: 0.72, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', fontSize: '0.64rem' }}>
                                        Monthly Overview
                                    </Typography>
                                    <Typography fontWeight={900} mt={0.5} sx={{ fontSize: '1.15rem', lineHeight: 1.3 }}>
                                        {m?.attendanceRate >= 90 ? 'Great performance! 🎯' : m?.attendanceRate >= 75 ? 'Keep it up! 💪' : 'Room to improve 📈'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.72, mt: 0.6, fontSize: '0.79rem', lineHeight: 1.5 }}>
                                        {userStats?.summary || 'Loading your summary…'}
                                    </Typography>
                                </Box>
                                <QueryStats sx={{ fontSize: 38, opacity: 0.22 }} />
                            </Stack>

                            <Divider sx={{ my: 2.5, borderColor: 'rgba(255,255,255,0.12)' }} />

                            <Grid container spacing={1.5} sx={{ position: 'relative', zIndex: 1 }}>
                                {[
                                    { label: 'Total Hrs', value: m?.totalHours ?? '—' },
                                    { label: 'Overtime', value: m?.overtimeHours ?? '—' },
                                    { label: 'Avg/Day', value: m?.avgHoursPerDay ?? '—' },
                                ].map(({ label, value }) => (
                                    <Grid item xs={4} key={label}>
                                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.12)', textAlign: 'center' }}>
                                            <Typography fontWeight={900} sx={{ fontSize: '1.15rem', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.68, fontSize: '0.64rem' }}>{label}</Typography>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    </Stack>
                </Grid>

            </Grid>
        </Box>
    );
};

export default DashboardContent;