import {
    AddCircleOutline,
    Android,
    Apple,
    CheckCircle,
    Computer,
    DeleteOutline,
    DevicesOther,
    InfoOutlined,
    LaptopMac,
    PhoneAndroid,
    Refresh,
    ReportProblem,
    Shield,
    SmartphoneOutlined,
    Verified,
    WarningAmber,
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    IconButton,
    Skeleton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { addNewDevice, fetchMyDevices } from '../../service/DeviceService';
import { getDeviceFingerprint } from '../../service/Fingerprinting';
import coreDataDetails from '../CoreDataDetails';

const { colorPalette } = coreDataDetails;

/* ══════════════════════════════════════════════════════════════════════════
   GLASS DESIGN TOKENS
══════════════════════════════════════════════════════════════════════════ */
const G = {
    card: {
        background:           'rgba(255,255,255,0.72)',
        backdropFilter:       'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border:               '1px solid rgba(255,255,255,0.60)',
        boxShadow:            '0 4px 24px rgba(10,61,98,0.08), inset 0 1px 0 rgba(255,255,255,0.80)',
    },
    tinted: (accent) => ({
        background:           'rgba(255,255,255,0.62)',
        backdropFilter:       'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        border:               `1px solid ${accent}28`,
        boxShadow:            `0 4px 20px ${accent}10, inset 0 1px 0 rgba(255,255,255,0.70)`,
    }),
    deviceCard: (dev) => {
        if (dev.device_lost)    return { border: `1.5px solid ${colorPalette.coralSunset}45`, boxShadow: `0 4px 18px ${colorPalette.coralSunset}0c` };
        if (dev.device_primary) return { border: `2px solid ${colorPalette.oceanBlue}50`,     boxShadow: `0 4px 20px ${colorPalette.oceanBlue}12`    };
        return { border: '1px solid rgba(255,255,255,0.60)', boxShadow: '0 4px 16px rgba(10,61,98,0.07)' };
    },
    dialog: {
        background:           'rgba(255,255,255,0.88)',
        backdropFilter:       'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        border:               '1px solid rgba(255,255,255,0.65)',
        boxShadow:            '0 24px 64px rgba(10,61,98,0.22)',
    },
};

/* ── constants ────────────────────────────────────────────────────────────── */
const MAX_DEVICES = 2;

/* ── device detection ────────────────────────────────────────────────────── */
export const detectCurrentDevice = () => {
    const ua = navigator.userAgent;
    let os = 'Unknown OS', deviceName = 'This Device', deviceIcon = <Computer />;

    if      (/Windows/.test(ua))     os = 'Windows';
    else if (/Mac OS X/.test(ua))    os = 'macOS';
    else if (/Android/.test(ua))     os = 'Android';
    else if (/iPhone|iPad/.test(ua)) os = 'iOS';
    else if (/Linux/.test(ua))       os = 'Linux';

    const isMobile = /Android|iPhone|iPad/.test(ua);
    if (isMobile) {
        deviceName = /iPad/.test(ua) ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : 'Mobile Device';
        deviceIcon = <PhoneAndroid />;
    } else {
        deviceName = /Mac OS X/.test(ua) ? 'MacBook' : /Windows/.test(ua) ? 'Windows PC' : 'Desktop / Laptop';
        deviceIcon = <LaptopMac />;
    }

    let browser = 'Unknown Browser';
    if      (/Edg\//.test(ua))     browser = 'Microsoft Edge';
    else if (/Chrome\//.test(ua))  browser = 'Chrome';
    else if (/Firefox\//.test(ua)) browser = 'Firefox';
    else if (/Safari\//.test(ua))  browser = 'Safari';

    return { deviceName, os, browser, deviceIcon };
};

const osIconMap = {
    'Windows': <Computer  sx={{ fontSize: 17 }} />,
    'macOS':   <Apple     sx={{ fontSize: 17 }} />,
    'Android': <Android   sx={{ fontSize: 17 }} />,
    'iOS':     <Apple     sx={{ fontSize: 17 }} />,
    'Linux':   <Computer  sx={{ fontSize: 17 }} />,
};

/* ── ambient orbs ────────────────────────────────────────────────────────── */
const AmbientOrbs = () => (
    <>
        {[
            { s: 360, t: -50,   l: -100,  c: 'rgba(10,100,180,0.06)', b: 68 },
            { s: 290, t: '42%', r: -75,   c: 'rgba(32,178,170,0.05)', b: 52 },
            { s: 440, bot: -90, l: '20%', c: 'rgba(10,61,98,0.04)',   b: 78 },
        ].map(({ s, t, l, r, bot, c, b }, i) => (
            <Box key={i} sx={{ position: 'absolute', width: s, height: s, pointerEvents: 'none', zIndex: 0, top: t, left: l, right: r, bottom: bot, borderRadius: '50%', background: c, filter: `blur(${b}px)` }} />
        ))}
    </>
);

/* ══════════════════════════════════════════════════════════════════════════
   GLASS INFO CARD
══════════════════════════════════════════════════════════════════════════ */
const InfoCard = ({ icon, accent, title, body }) => (
    <Box sx={{
        ...G.tinted(accent),
        borderRadius: '18px', p: 2.2, mb: 1.5,
        transition: 'all 0.22s ease',
        '&:hover': { boxShadow: `0 8px 28px ${accent}18` },
    }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Box sx={{ width: 36, height: 36, borderRadius: '11px', flexShrink: 0, bgcolor: `${accent}14`, border: `1px solid ${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, mt: 0.2 }}>
                {icon}
            </Box>
            <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: accent, mb: 0.3 }}>{title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.72 }}>{body}</Typography>
            </Box>
        </Stack>
    </Box>
);

/* ── device skeleton ─────────────────────────────────────────────────────── */
const DeviceSkeleton = () => (
    <Box sx={{ ...G.card, borderRadius: '18px', p: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="center">
            <Skeleton variant="rounded" width={46} height={46} sx={{ borderRadius: '14px' }} />
            <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width={140} height={22} sx={{ borderRadius: '8px' }} />
                <Skeleton variant="text" width={100} height={18} sx={{ mt: 0.5, borderRadius: '8px' }} />
            </Box>
            <Skeleton variant="circular" width={32} height={32} />
        </Stack>
    </Box>
);

/* ══════════════════════════════════════════════════════════════════════════
   SECTION LABEL helper
══════════════════════════════════════════════════════════════════════════ */
const SectionLabel = ({ children, accent }) => (
    <Stack direction="row" alignItems="center" spacing={1} mb={1.8}>
        <Box sx={{ width: 4, height: 18, borderRadius: 2, bgcolor: accent }} />
        <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>{children}</Typography>
    </Stack>
);

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const AddDeviceContent = () => {
    const [devices,               setDevices]               = useState([]);
    const [loading,               setLoading]               = useState(true);
    const [fetchError,            setFetchError]            = useState('');
    const [enrolling,             setEnrolling]             = useState(false);
    const [enrolled,              setEnrolled]              = useState(false);
    const [enrollError,           setEnrollError]           = useState('');
    const [alreadyEnrolled,       setAlreadyEnrolled]       = useState(false);
    const [deviceHashFingerPrint, setDeviceHashFingerPrint] = useState();
    const [removeTarget,          setRemoveTarget]          = useState(null);

    const current = detectCurrentDevice();

    const loadDevices = useCallback(async () => {
        setLoading(true); setFetchError('');
        try {
            const data = await fetchMyDevices();
            setDevices(Array.isArray(data) ? data : (data.devices ?? []));
            const fp = await getDeviceFingerprint();
            setDeviceHashFingerPrint(fp);
        } catch (err) {
            setFetchError(typeof err === 'string' ? err : 'Failed to load your devices.');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadDevices(); }, [loadDevices]);

    const isCurrentEnrolled = devices.some(d => d.device_fingerprint === deviceHashFingerPrint);

    const handleEnroll = async () => {
        if (isCurrentEnrolled) { setAlreadyEnrolled(true); return; }
        if (devices.length >= MAX_DEVICES) return;
        setEnrolling(true); setEnrollError('');
        try {
            await addNewDevice({ device_name: current.deviceName, device_os: current.os, device_browser: current.browser });
            setEnrolled(true); setTimeout(() => setEnrolled(false), 5000);
            await loadDevices();
        } catch (err) {
            setEnrollError(typeof err === 'string' ? err : 'Failed to enrol device. Please try again.');
        } finally { setEnrolling(false); }
    };

    const handleRemoveConfirm = () => {
        if (!removeTarget) return;
        setDevices(prev => prev.filter(d => (d._id || d.id) !== (removeTarget._id || removeTarget.id)));
        setRemoveTarget(null);
    };

    const capacityPct   = (devices.length / MAX_DEVICES) * 100;
    const capacityColor = devices.length >= MAX_DEVICES ? colorPalette.coralSunset : colorPalette.seafoamGreen;

    /* ════════════════════════════════════════════════════════════════════ */
    return (
        <Box sx={{ position: 'relative' }}>
            <AmbientOrbs />

            {/* ── Toast Alerts ── */}
            <AnimatePresence>
                {enrolled && (
                    <motion.div key="ok" initial={{ opacity: 0, y: -12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}>
                        <Box sx={{ ...G.tinted(colorPalette.seafoamGreen), borderRadius: '16px', p: 2, mb: 3, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <Box sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: `${colorPalette.seafoamGreen}18`, border: `1px solid ${colorPalette.seafoamGreen}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <CheckCircle sx={{ color: colorPalette.seafoamGreen, fontSize: 18 }} />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, fontWeight: 500 }}>
                                Device enrolled successfully! You can now <strong>clock in and out</strong> from this device.
                            </Typography>
                        </Box>
                    </motion.div>
                )}
                {alreadyEnrolled && (
                    <motion.div key="dup" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Box sx={{ ...G.tinted(colorPalette.warmSand), borderRadius: '16px', p: 2, mb: 3, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <Box sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: `${colorPalette.warmSand}18`, border: `1px solid ${colorPalette.warmSand}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <WarningAmber sx={{ color: colorPalette.warmSand, fontSize: 18 }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, fontWeight: 500 }}>
                                    This device (OS + browser combination) is already enrolled. Check the list below.
                                </Typography>
                            </Box>
                            <Button size="small" onClick={() => setAlreadyEnrolled(false)}
                                sx={{ color: colorPalette.warmSand, fontWeight: 700, minWidth: 0, fontSize: '0.75rem', textTransform: 'none', flexShrink: 0 }}>
                                Dismiss
                            </Button>
                        </Box>
                    </motion.div>
                )}
                {enrollError && (
                    <motion.div key="enrolErr" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Alert severity="error" onClose={() => setEnrollError('')}
                            sx={{ mb: 3, borderRadius: '14px', backdropFilter: 'blur(12px)', fontWeight: 600 }}>
                            {enrollError}
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Info cards ── */}
            <InfoCard icon={<DevicesOther sx={{ fontSize: 18 }} />} accent={colorPalette.seafoamGreen}
                title="Multi-Device Clocking"
                body="Register additional devices — laptops, desktops, or smartphones — so you are never limited to a single clocking point. Each enrolled device creates a unique fingerprint tied to your account, enabling seamless clock-ins from any of your registered devices without affecting your attendance record."
            />
            <InfoCard icon={<Shield sx={{ fontSize: 18 }} />} accent={colorPalette.cyanFresh}
                title="Security & Eligibility"
                body={`• Only devices not previously enrolled by any user may be added.  • Each device is fingerprinted using browser + OS metadata to prevent duplicate registrations.  • Ideal after acquiring a replacement device or adding a personal smartphone.  • You may have a maximum of ${MAX_DEVICES} enrolled devices at any time.`}
            />
            <InfoCard icon={<InfoOutlined sx={{ fontSize: 18 }} />} accent={colorPalette.warmSand}
                title="Best Practice"
                body="If you lost your primary device and obtained a replacement, enrol the new device here to permanently restore registered clocking. Combine this with a Lost Device request if you need temporary access while awaiting the replacement."
            />
            <InfoCard icon={<ReportProblem sx={{ fontSize: 18 }} />} accent={colorPalette.coralSunset}
                title="Enrolling a Lost Device's Replacement"
                body="After receiving a replacement for a lost device, enrol it here. Your previous device will remain marked as lost in the system. Contact HR if you need an old device entry fully removed."
            />

            {/* ── Gradient divider ── */}
            <Box sx={{ my: 3, height: 1, background: 'linear-gradient(90deg, transparent, rgba(10,61,98,0.10), transparent)' }} />

            {/* ── Currently detected device ── */}
            <SectionLabel accent={colorPalette.oceanBlue}>Currently Detected Device</SectionLabel>

            <Box sx={{ ...G.tinted(colorPalette.oceanBlue), borderRadius: '20px', p: 2.5, mb: 3 }}>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent="space-between"
                >
                    {/* device info */}
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{
                            width: 54, height: 54, borderRadius: '16px', flexShrink: 0,
                            bgcolor: `${colorPalette.oceanBlue}14`,
                            border: `1px solid ${colorPalette.oceanBlue}28`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: colorPalette.oceanBlue,
                        }}>
                            {current.deviceIcon}
                        </Box>
                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>
                                    {current.deviceName}
                                </Typography>
                                {isCurrentEnrolled && (
                                    <Chip label="Already enrolled" size="small" color="success" variant="outlined"
                                        sx={{ height: 20, fontSize: '0.64rem', fontWeight: 700, borderRadius: '8px' }} />
                                )}
                            </Stack>
                            <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                                <Chip label={current.os} size="small"
                                    icon={osIconMap[current.os] || <Computer sx={{ fontSize: 13 }} />}
                                    sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem', bgcolor: 'rgba(10,61,98,0.08)', borderRadius: '8px' }} />
                                <Chip label={current.browser} size="small"
                                    icon={<SmartphoneOutlined sx={{ fontSize: 13 }} />}
                                    sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem', bgcolor: `${colorPalette.seafoamGreen}16`, color: colorPalette.seafoamGreen, borderRadius: '8px' }} />
                            </Stack>
                        </Box>
                    </Stack>

                    {/* enrol button */}
                    <Button
                        variant="contained"
                        startIcon={enrolling ? null : <AddCircleOutline />}
                        onClick={handleEnroll}
                        disabled={enrolling || isCurrentEnrolled || devices.length >= MAX_DEVICES}
                        sx={{
                            background: colorPalette.oceanGradient,
                            borderRadius: '14px', px: 3, py: 1.1,
                            fontWeight: 800, fontSize: '0.85rem', textTransform: 'none',
                            boxShadow: `0 6px 20px ${colorPalette.oceanBlue}32`,
                            whiteSpace: 'nowrap', minWidth: 160,
                            transition: 'all 0.22s ease',
                            '&:hover': { boxShadow: `0 8px 28px ${colorPalette.oceanBlue}48`, transform: 'translateY(-1px)' },
                            '&.Mui-disabled': { opacity: 0.65 },
                        }}
                    >
                        {enrolling
                            ? <><CircularProgress size={15} color="inherit" sx={{ mr: 1 }} />Enrolling…</>
                            : isCurrentEnrolled ? 'Already Enrolled' : 'Enrol This Device'
                        }
                    </Button>
                </Stack>

                {/* capacity warning */}
                {devices.length >= MAX_DEVICES && (
                    <Box sx={{ ...G.tinted(colorPalette.cyanFresh), borderRadius: '12px', p: 1.5, mt: 2, display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <InfoOutlined sx={{ color: colorPalette.cyanFresh, fontSize: 18, flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ fontSize: '0.82rem' }}>
                            You have reached the maximum of <strong>{MAX_DEVICES}</strong> enrolled devices. Remove an existing device to add a new one.
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* ── Enrolled devices header ── */}
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Box sx={{ width: 38, height: 38, borderRadius: '12px', bgcolor: `${colorPalette.deepNavy}08`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Verified sx={{ color: colorPalette.deepNavy, fontSize: '1.15rem' }} />
                </Box>
                <Typography variant="h6" fontWeight={900} color={colorPalette.deepNavy}>My Enrolled Devices</Typography>
                {!loading && (
                    <Chip label={`${devices.length} / ${MAX_DEVICES}`} size="small"
                        sx={{ bgcolor: `${colorPalette.oceanBlue}12`, color: colorPalette.oceanBlue, fontWeight: 800, fontSize: '0.72rem', borderRadius: '8px' }} />
                )}
                <Box sx={{ flex: 1 }} />
                <Tooltip title="Refresh device list"><span>
                    <Button size="small"
                        startIcon={loading ? <CircularProgress size={14} /> : <Refresh sx={{ fontSize: '1rem' }} />}
                        onClick={loadDevices} disabled={loading}
                        sx={{ textTransform: 'none', fontWeight: 700, color: colorPalette.oceanBlue, borderRadius: '10px', bgcolor: `${colorPalette.oceanBlue}08`, border: `1px solid ${colorPalette.oceanBlue}18`, '&:hover': { bgcolor: `${colorPalette.oceanBlue}12` }, px: 1.5 }}>
                        Refresh
                    </Button>
                </span></Tooltip>
            </Stack>

            {/* ── Capacity bar ── */}
            {!loading && devices.length > 0 && (
                <Box mb={2.5}>
                    <Stack direction="row" justifyContent="space-between" mb={0.6}>
                        <Typography variant="caption" color="text.secondary">Device slots used</Typography>
                        <Typography variant="caption" fontWeight={800} sx={{ color: capacityColor }}>
                            {devices.length} / {MAX_DEVICES}
                        </Typography>
                    </Stack>
                    <Box sx={{ height: 7, borderRadius: 99, bgcolor: 'rgba(10,61,98,0.08)', overflow: 'hidden' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${capacityPct}%` }}
                            transition={{ duration: 0.65, ease: 'easeOut' }}
                            style={{
                                height: '100%', borderRadius: 99,
                                background: devices.length >= MAX_DEVICES
                                    ? colorPalette.coralSunset
                                    : colorPalette.oceanGradient,
                            }}
                        />
                    </Box>
                </Box>
            )}

            {/* ── Fetch error ── */}
            {fetchError && !loading && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: '14px', backdropFilter: 'blur(12px)' }}
                    action={<Button size="small" onClick={loadDevices} sx={{ fontWeight: 700 }}>Retry</Button>}>
                    {fetchError}
                </Alert>
            )}

            {/* ── Loading skeletons ── */}
            {loading && (
                <Grid container spacing={2}>
                    {[1, 2, 3].map(k => <Grid item xs={12} sm={6} key={k}><DeviceSkeleton /></Grid>)}
                </Grid>
            )}

            {/* ── Empty state ── */}
            {!loading && !fetchError && devices.length === 0 && (
                <Box sx={{ ...G.card, borderRadius: '20px', p: 4, textAlign: 'center', border: '1.5px dashed rgba(10,61,98,0.14)' }}>
                    <Box sx={{ width: 64, height: 64, borderRadius: '20px', bgcolor: 'rgba(10,61,98,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                        <DevicesOther sx={{ color: 'rgba(10,61,98,0.22)', fontSize: 34 }} />
                    </Box>
                    <Typography color="text.disabled" fontWeight={600} variant="body2">
                        No devices enrolled yet. Enrol a device above to get started.
                    </Typography>
                </Box>
            )}

            {/* ── Device cards ── */}
            {!loading && devices.length > 0 && (
                <Grid container spacing={2}>
                    {devices.map((dev, i) => (
                        <Grid item xs={12} sm={6} key={dev._id || dev.id || i}>
                            <motion.div
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07, ease: [0.4, 0, 0.2, 1] }}
                            >
                                <Box sx={{
                                    ...G.card,
                                    ...G.deviceCard(dev),
                                    borderRadius: '20px', p: 2.5, height: '100%',
                                    position: 'relative', overflow: 'hidden',
                                    transition: 'all 0.24s ease',
                                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 14px 36px rgba(10,61,98,0.14)' },
                                    /* coloured accent bar at top */
                                    '&::after': {
                                        content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                                        borderRadius: '20px 20px 0 0',
                                        background: dev.device_lost
                                            ? `linear-gradient(90deg, ${colorPalette.coralSunset}, ${colorPalette.coralSunset}88)`
                                            : dev.device_primary
                                                ? `linear-gradient(90deg, ${colorPalette.oceanBlue}, ${colorPalette.cyanFresh})`
                                                : `linear-gradient(90deg, ${colorPalette.seafoamGreen}, ${colorPalette.seafoamGreen}88)`,
                                    },
                                }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            {/* icon bubble */}
                                            <Box sx={{
                                                width: 46, height: 46, borderRadius: '14px', flexShrink: 0,
                                                bgcolor: dev.device_lost
                                                    ? `${colorPalette.coralSunset}14`
                                                    : dev.device_primary
                                                        ? `${colorPalette.oceanBlue}14`
                                                        : `${colorPalette.seafoamGreen}14`,
                                                border: `1px solid ${dev.device_lost ? `${colorPalette.coralSunset}22` : dev.device_primary ? `${colorPalette.oceanBlue}22` : `${colorPalette.seafoamGreen}22`}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: dev.device_lost ? colorPalette.coralSunset : dev.device_primary ? colorPalette.oceanBlue : colorPalette.seafoamGreen,
                                            }}>
                                                {/Android|iOS/.test(dev.device_os) ? <PhoneAndroid /> : <LaptopMac />}
                                            </Box>

                                            {/* name + badges */}
                                            <Box>
                                                <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap" mb={0.5}>
                                                    <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy} sx={{ lineHeight: 1.2 }}>
                                                        {dev.device_name}
                                                    </Typography>
                                                    {dev.device_primary && (
                                                        <Chip label="Primary" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900, bgcolor: `${colorPalette.oceanBlue}12`, color: colorPalette.oceanBlue, letterSpacing: 0.8, borderRadius: '6px' }} />
                                                    )}
                                                    {dev.device_lost && (
                                                        <Chip label="Lost" size="small" color="error" variant="outlined" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900, borderRadius: '6px' }} />
                                                    )}
                                                </Stack>
                                                <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
                                                    <Chip label={dev.device_os || 'Unknown OS'} size="small"
                                                        icon={osIconMap[dev.device_os] || <Computer sx={{ fontSize: 12 }} />}
                                                        sx={{ fontWeight: 700, height: 20, fontSize: '0.68rem', bgcolor: 'rgba(10,61,98,0.07)', borderRadius: '6px' }} />
                                                    {dev.device_browser && (
                                                        <Chip label={dev.device_browser} size="small"
                                                            sx={{ fontWeight: 700, height: 20, fontSize: '0.68rem', bgcolor: `${colorPalette.cyanFresh}12`, color: colorPalette.cyanFresh, borderRadius: '6px' }} />
                                                    )}
                                                </Stack>
                                            </Box>
                                        </Stack>

                                        {/* remove button */}
                                        {!dev.device_primary && (
                                            <Tooltip title="Remove device">
                                                <IconButton size="small" onClick={() => setRemoveTarget(dev)}
                                                    sx={{
                                                        color: 'rgba(10,61,98,0.25)',
                                                        background: 'rgba(10,61,98,0.04)',
                                                        border: '1px solid rgba(10,61,98,0.08)',
                                                        '&:hover': { color: colorPalette.coralSunset, background: `${colorPalette.coralSunset}0e`, borderColor: `${colorPalette.coralSunset}28` },
                                                        transition: 'all 0.18s ease',
                                                    }}>
                                                    <DeleteOutline fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Stack>

                                    {/* enrolled date */}
                                    <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid rgba(10,61,98,0.07)' }}>
                                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                                            Enrolled {dev.createdAt ? new Date(dev.createdAt).toLocaleDateString() : '—'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* ══════════════════════════════════════════════════════════════
                CONFIRM REMOVE DIALOG  — frosted glass
            ══════════════════════════════════════════════════════════════ */}
            <Dialog
                open={!!removeTarget}
                onClose={() => setRemoveTarget(null)}
                PaperProps={{ sx: { ...G.dialog, borderRadius: '24px', p: 1, maxWidth: 420, width: '100%' } }}
                BackdropProps={{ sx: { backdropFilter: 'blur(6px)', bgcolor: 'rgba(6,28,50,0.35)' } }}
            >
                <DialogTitle sx={{ fontWeight: 900, color: colorPalette.deepNavy, pb: 0.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 40, height: 40, borderRadius: '13px', bgcolor: `${colorPalette.coralSunset}12`, border: `1px solid ${colorPalette.coralSunset}24`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <DeleteOutline sx={{ color: colorPalette.coralSunset, fontSize: 20 }} />
                        </Box>
                        <span>Remove Device?</span>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ pt: 1.5 }}>
                    <DialogContentText sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                        Are you sure you want to remove <strong style={{ color: colorPalette.deepNavy }}>{removeTarget?.device_name}</strong>?
                        You will no longer be able to clock in from this device until you re-enrol it.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ pb: 2.5, px: 3, gap: 1 }}>
                    <Button onClick={() => setRemoveTarget(null)}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', color: 'text.secondary', bgcolor: 'rgba(10,61,98,0.05)', border: '1px solid rgba(10,61,98,0.10)', '&:hover': { bgcolor: 'rgba(10,61,98,0.08)' }, px: 2.5 }}>
                        Cancel
                    </Button>
                    <Button variant="contained" color="error" onClick={handleRemoveConfirm}
                        sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '12px', boxShadow: `0 4px 16px ${colorPalette.coralSunset}32`, '&:hover': { boxShadow: `0 6px 22px ${colorPalette.coralSunset}48`, transform: 'translateY(-1px)' }, transition: 'all 0.2s ease', px: 2.5 }}>
                        Remove Device
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AddDeviceContent;