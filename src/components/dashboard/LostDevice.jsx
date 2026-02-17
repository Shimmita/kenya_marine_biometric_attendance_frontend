import {
    CheckCircle,
    DevicesOther,
    ErrorOutline,
    EventAvailable,
    HourglassEmpty,
    InfoOutlined,
    LaptopMac,
    PhoneAndroid,
    Refresh,
    ReportProblem,
    Send,
    WarningAmber,
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    FormControlLabel,
    Grid,
    Skeleton,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateUserCurrentUserRedux } from '../../redux/CurrentUser';
import { fetchMyDevices, fetchMyLostRequests, submitLostDeviceRequest } from '../../service/DeviceService';
import { getUserProfile } from '../../service/UserProfile';
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
    deviceSelected: (accent) => ({
        background:           'rgba(255,255,255,0.82)',
        backdropFilter:       'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border:               `2px solid ${accent}`,
        boxShadow:            `0 6px 24px ${accent}28, inset 0 1px 0 rgba(255,255,255,0.80)`,
    }),
    requestCard: (status) => {
        const map = {
            granted:  { border: `${colorPalette.seafoamGreen}40`, glow: `${colorPalette.seafoamGreen}0a` },
            rejected: { border: `${colorPalette.coralSunset}40`,  glow: `${colorPalette.coralSunset}0a`  },
            pending:  { border: 'rgba(10,61,98,0.14)',             glow: 'rgba(10,61,98,0.02)'             },
        };
        const c = map[status] || map.pending;
        return {
            background:           'rgba(255,255,255,0.68)',
            backdropFilter:       'blur(16px) saturate(160%)',
            WebkitBackdropFilter: 'blur(16px) saturate(160%)',
            border:               `1.5px solid ${c.border}`,
            boxShadow:            `0 4px 16px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.72)`,
        };
    },
    input: {
        '& .MuiOutlinedInput-root': {
            borderRadius:  '14px',
            background:    'rgba(10,61,98,0.03)',
            '&:hover fieldset':       { borderColor: colorPalette.oceanBlue },
            '&.Mui-focused fieldset': { borderColor: colorPalette.oceanBlue, borderWidth: 2 },
        },
    },
};

/* ── helpers ─────────────────────────────────────────────────────────────── */
const today = () => new Date().toISOString().split('T')[0];
const MAX_DAYS = 30;

const statusConfig = {
    pending:  { label: 'Pending',  color: 'warning', icon: <HourglassEmpty sx={{ fontSize: 14 }} /> },
    granted:  { label: 'Approved', color: 'success', icon: <CheckCircle    sx={{ fontSize: 14 }} /> },
    rejected: { label: 'Rejected', color: 'error',   icon: <ErrorOutline   sx={{ fontSize: 14 }} /> },
};

const daysBetween = (a, b) => {
    if (!a || !b) return 0;
    return Math.round((new Date(b) - new Date(a)) / 86_400_000);
};

const DeviceIcon = ({ os, size = 18 }) =>
    /Android|iOS/.test(os) ? <PhoneAndroid sx={{ fontSize: size }} /> : <LaptopMac sx={{ fontSize: size }} />;

/* ── ambient orbs ────────────────────────────────────────────────────────── */
const AmbientOrbs = () => (
    <>
        {[
            { s: 380, t: -50,  l: -110, c: 'rgba(10,100,180,0.06)', b: 70 },
            { s: 300, t: '45%', r: -80, c: 'rgba(32,178,170,0.05)', b: 55 },
            { s: 460, bot: -100, l: '22%', c: 'rgba(10,61,98,0.04)', b: 80 },
        ].map(({ s, t, l, r, bot, c, b }, i) => (
            <Box key={i} sx={{ position: 'absolute', width: s, height: s, pointerEvents: 'none', zIndex: 0, top: t, left: l, right: r, bottom: bot, borderRadius: '50%', background: c, filter: `blur(${b}px)` }} />
        ))}
    </>
);

/* ══════════════════════════════════════════════════════════════════════════
   GLASS INFO CARD
══════════════════════════════════════════════════════════════════════════ */
const InfoCard = ({ icon, title, body, accent }) => (
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

/* ── request skeleton ────────────────────────────────────────────────────── */
const RequestSkeleton = () => (
    <Box sx={{ ...G.card, borderRadius: '18px', p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between">
            <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width={160} height={22} sx={{ borderRadius: '8px' }} />
                <Skeleton variant="text" width="80%" height={18} sx={{ mt: 0.5, borderRadius: '8px' }} />
                <Skeleton variant="text" width="60%" height={18} sx={{ borderRadius: '8px' }} />
            </Box>
            <Box sx={{ textAlign: 'right', minWidth: 120 }}>
                <Skeleton variant="text" width={100} height={18} sx={{ borderRadius: '8px' }} />
                <Skeleton variant="text" width={80}  height={18} sx={{ borderRadius: '8px' }} />
            </Box>
        </Stack>
    </Box>
);

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const LostDeviceContent = () => {
    const [confirmed,      setConfirmed]      = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [fromDate,       setFromDate]       = useState('');
    const [toDate,         setToDate]         = useState('');
    const [reason,         setReason]         = useState('');
    const [errors,         setErrors]         = useState({});
    const [submitting,     setSubmitting]     = useState(false);
    const [submitted,      setSubmitted]      = useState(false);
    const [submitError,    setSubmitError]    = useState('');
    const [devices,        setDevices]        = useState([]);
    const [devicesLoading, setDevicesLoading] = useState(true);
    const [devicesError,   setDevicesError]   = useState('');
    const [requests,       setRequests]       = useState([]);
    const [loading,        setLoading]        = useState(true);
    const [fetchError,     setFetchError]     = useState('');
    const dispatch = useDispatch();

    const loadDevices = useCallback(async () => {
        setDevicesLoading(true); setDevicesError('');
        try {
            const data = await fetchMyDevices();
            const list = Array.isArray(data) ? data : (data.devices ?? []);
            setDevices(list.filter(d => !d.device_lost));
        } catch (err) { setDevicesError(typeof err === 'string' ? err : 'Failed to load your devices.'); }
        finally { setDevicesLoading(false); }
    }, []);

    const loadRequests = useCallback(async () => {
        setLoading(true); setFetchError('');
        try {
            const data = await fetchMyLostRequests();
            setRequests(Array.isArray(data) ? data : (data.requests ?? []));
        } catch (err) { setFetchError(typeof err === 'string' ? err : 'Failed to load your requests.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadDevices(); loadRequests(); }, [loadDevices, loadRequests]);

    const validate = () => {
        const e = {};
        if (!confirmed)      e.confirmed = 'You must confirm the declaration.';
        if (!selectedDevice) e.device    = 'Please select the device you are reporting as lost.';
        if (!fromDate)       e.fromDate  = 'Please select a start date.';
        if (!toDate)         e.toDate    = 'Please select an end date.';
        if (fromDate && toDate) {
            if (toDate <= fromDate)                             e.toDate = 'End date must be after start date.';
            else if (daysBetween(fromDate, toDate) > MAX_DAYS) e.toDate = `Maximum access window is ${MAX_DAYS} days.`;
        }
        if (!reason.trim()) e.reason = 'Please briefly describe how the device was lost.';
        return e;
    };

    const handleSubmit = async () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setSubmitting(true); setSubmitError('');
        try {
            await submitLostDeviceRequest({ description: reason.trim(), startDate: fromDate, endDate: toDate, device_fingerprint: selectedDevice.device_fingerprint });
            setConfirmed(false); setSelectedDevice(null); setFromDate(''); setToDate(''); setReason(''); setErrors({});
            setSubmitted(true); setTimeout(() => setSubmitted(false), 6000);
            await Promise.all([loadRequests(), loadDevices()]);
            const user = await getUserProfile();
            dispatch(updateUserCurrentUserRedux(user));
        } catch (err) { setSubmitError(typeof err === 'string' ? err : 'Submission failed. Please try again.'); }
        finally { setSubmitting(false); }
    };

    const durationColor = () => {
        const d = daysBetween(fromDate, toDate);
        if (!d) return colorPalette.deepNavy;
        if (d <= 7)  return colorPalette.seafoamGreen;
        if (d <= 20) return colorPalette.warmSand;
        return colorPalette.coralSunset;
    };

    /* ════════════════════════════════════════════════════════════════════ */
    return (
        <Box sx={{ position: 'relative' }}>
            <AmbientOrbs />

            {/* ── Toast Alerts ── */}
            <AnimatePresence>
                {submitted && (
                    <motion.div key="success" initial={{ opacity: 0, y: -12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}>
                        <Box sx={{ ...G.tinted(colorPalette.seafoamGreen), borderRadius: '16px', p: 2, mb: 3, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <Box sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: `${colorPalette.seafoamGreen}18`, border: `1px solid ${colorPalette.seafoamGreen}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <CheckCircle sx={{ color: colorPalette.seafoamGreen, fontSize: 18 }} />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, fontWeight: 500 }}>
                                Your lost-device request has been submitted. HR, your Hiring Manager, or Supervisor have been notified and will review within <strong>1–2 business days</strong>.
                            </Typography>
                        </Box>
                    </motion.div>
                )}
                {submitError && (
                    <motion.div key="err" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Alert severity="error" onClose={() => setSubmitError('')}
                            sx={{ mb: 3, borderRadius: '14px', backdropFilter: 'blur(12px)', fontWeight: 600 }}>
                            {submitError}
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Info cards ── */}
            <InfoCard icon={<ReportProblem sx={{ fontSize: 18 }} />} accent={colorPalette.coralSunset}
                title="What is this request for?"
                body="If you have lost, misplaced, or had your registered clocking device stolen, use this form to formally notify your Admin, Hiring Manager, or Supervisor. Once approved, you will be permitted to clock in and out using any available device for the specified period. Access automatically expires on the end date you choose."
            />
            <InfoCard icon={<InfoOutlined sx={{ fontSize: 18 }} />} accent={colorPalette.cyanFresh}
                title="Important notes"
                body={`• Approval is required before alternative-device clocking is activated.  • The maximum temporary access window is ${MAX_DAYS} days.  • You must re-register a permanent device before the access period ends to avoid disruption.  • Repeated lost-device requests may be flagged for review by HR.`}
            />

            {/* ── Divider ── */}
            <Box sx={{ my: 3, height: 1, background: 'linear-gradient(90deg, transparent, rgba(10,61,98,0.10), transparent)' }} />

            {/* ── Declaration ── */}
            <Box sx={{ ...G.tinted(colorPalette.warmSand), borderRadius: '18px', p: 2.5, mb: 3 }}>
                <Stack direction="row" spacing={1.2} alignItems="center" mb={1.5}>
                    <Box sx={{ width: 34, height: 34, borderRadius: '11px', bgcolor: `${colorPalette.warmSand}18`, border: `1px solid ${colorPalette.warmSand}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <WarningAmber sx={{ color: colorPalette.warmSand, fontSize: 18 }} />
                    </Box>
                    <Typography variant="subtitle2" fontWeight={800} color={colorPalette.charcoal}>
                        Declaration — Required
                    </Typography>
                </Stack>
                <FormControlLabel
                    control={
                        <Checkbox checked={confirmed}
                            onChange={e => { setConfirmed(e.target.checked); setErrors(p => ({ ...p, confirmed: undefined })); }}
                            sx={{ color: colorPalette.warmSand, '&.Mui-checked': { color: colorPalette.warmSand } }} />
                    }
                    label={
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.72 }}>
                            I confirm that I have <strong>lost my registered clocking device</strong> and I hereby request temporary permission
                            to clock in and out using an alternative device for the period specified below. I acknowledge that this access is
                            conditional upon approval and will automatically expire on the end date I select.
                        </Typography>
                    }
                />
                {errors.confirmed && <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block', pl: 4 }}>{errors.confirmed}</Typography>}
            </Box>

            {/* ── Device Selector header ── */}
            <Stack direction="row" alignItems="center" spacing={1} mb={1.8}>
                <Box sx={{ width: 4, height: 18, borderRadius: 2, bgcolor: colorPalette.coralSunset }} />
                <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Select the Lost Device</Typography>
                {devicesError && (
                    <Tooltip title="Retry loading devices"><span>
                        <Button size="small" startIcon={devicesLoading ? <CircularProgress size={12} /> : <Refresh />}
                            onClick={loadDevices} disabled={devicesLoading}
                            sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, color: colorPalette.oceanBlue, minWidth: 0, ml: 0.5 }}>
                            Retry
                        </Button>
                    </span></Tooltip>
                )}
            </Stack>

            {devicesLoading && (
                <Grid container spacing={1.5} mb={3}>
                    {[1, 2, 3].map(k => <Grid item xs={12} sm={6} md={4} key={k}><Skeleton variant="rounded" height={82} sx={{ borderRadius: '16px' }} /></Grid>)}
                </Grid>
            )}

            {devicesError && !devicesLoading && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '14px', backdropFilter: 'blur(12px)' }}>{devicesError}</Alert>
            )}

            {!devicesLoading && !devicesError && devices.length === 0 && (
                <Box sx={{ ...G.tinted(colorPalette.cyanFresh), borderRadius: '16px', p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <InfoOutlined sx={{ color: colorPalette.cyanFresh, fontSize: 20, flexShrink: 0 }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        You have no enrolled devices available to report. If all your devices are already flagged as lost, please contact HR directly.
                    </Typography>
                </Box>
            )}

            {/* ── Device cards ── */}
            {!devicesLoading && !devicesError && devices.length > 0 && (
                <Grid container spacing={1.5} mb={errors.device ? 0.5 : 3}>
                    {devices.map(dev => {
                        const isSelected = selectedDevice?._id === dev._id;
                        return (
                            <Grid item xs={12} sm={6} md={4} key={dev._id}>
                                <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
                                    <Box
                                        onClick={() => { setSelectedDevice(isSelected ? null : dev); setErrors(p => ({ ...p, device: undefined })); }}
                                        sx={{
                                            ...(isSelected ? G.deviceSelected(colorPalette.coralSunset) : G.card),
                                            borderRadius: '16px', p: 1.8, cursor: 'pointer',
                                            ...(errors.device && !isSelected && { borderColor: '#ef444455' }),
                                            transition: 'all 0.22s ease',
                                            '&:hover': !isSelected ? { border: `1.5px solid ${colorPalette.coralSunset}66`, boxShadow: `0 6px 24px ${colorPalette.coralSunset}14` } : {},
                                        }}
                                    >
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Box sx={{
                                                width: 42, height: 42, borderRadius: '13px', flexShrink: 0,
                                                bgcolor: isSelected ? `${colorPalette.coralSunset}14` : 'rgba(10,61,98,0.07)',
                                                border: `1px solid ${isSelected ? `${colorPalette.coralSunset}28` : 'rgba(10,61,98,0.10)'}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: isSelected ? colorPalette.coralSunset : colorPalette.deepNavy,
                                                transition: 'all 0.22s ease',
                                            }}>
                                                <DeviceIcon os={dev.device_os} size={20} />
                                            </Box>
                                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                                <Stack direction="row" spacing={0.6} alignItems="center" mb={0.4}>
                                                    <Typography variant="body2" fontWeight={800} noWrap sx={{ fontSize: '0.82rem', color: isSelected ? colorPalette.coralSunset : colorPalette.deepNavy, transition: 'color 0.2s' }}>
                                                        {dev.device_name}
                                                    </Typography>
                                                    {dev.device_primary && (
                                                        <Chip label="Primary" size="small" sx={{ height: 16, fontSize: '0.57rem', fontWeight: 900, bgcolor: `${colorPalette.oceanBlue}12`, color: colorPalette.oceanBlue, letterSpacing: 0.5, borderRadius: '6px' }} />
                                                    )}
                                                </Stack>
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                    <Chip label={dev.device_os || 'Unknown'} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(10,61,98,0.07)', borderRadius: '6px' }} />
                                                    {dev.device_browser && (
                                                        <Chip label={dev.device_browser} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: `${colorPalette.cyanFresh}12`, color: colorPalette.cyanFresh, borderRadius: '6px' }} />
                                                    )}
                                                </Stack>
                                            </Box>
                                            {isSelected && <CheckCircle sx={{ color: colorPalette.coralSunset, fontSize: 20, flexShrink: 0 }} />}
                                        </Stack>
                                    </Box>
                                </motion.div>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {errors.device && <Typography variant="caption" color="error" sx={{ display: 'block', mb: 2.5, mt: 0.5 }}>{errors.device}</Typography>}

            {/* ── Confirmation strip ── */}
            <AnimatePresence>
                {selectedDevice && (
                    <motion.div key="strip" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                        <Box sx={{ ...G.tinted(colorPalette.coralSunset), borderRadius: '14px', p: 1.8, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <WarningAmber sx={{ color: colorPalette.coralSunset, fontSize: 20, flexShrink: 0 }} />
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                Reporting <strong style={{ color: colorPalette.coralSunset }}>{selectedDevice.device_name}</strong>
                                {' '}({selectedDevice.device_os}{selectedDevice.device_browser ? ` · ${selectedDevice.device_browser}` : ''}) as lost. This device will be flagged pending approval.
                            </Typography>
                        </Box>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Date pickers ── */}
            <Stack direction="row" alignItems="center" spacing={1} mb={1.8} flexWrap="wrap" gap={1}>
                <Box sx={{ width: 4, height: 18, borderRadius: 2, bgcolor: colorPalette.oceanBlue }} />
                <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>Temporary Access Period</Typography>
                <AnimatePresence>
                    {fromDate && toDate && toDate > fromDate && (
                        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                            <Chip
                                label={`${daysBetween(fromDate, toDate)} day${daysBetween(fromDate, toDate) !== 1 ? 's' : ''} of access`}
                                size="small"
                                sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem', borderRadius: '8px', bgcolor: `${durationColor()}16`, color: durationColor(), border: `1px solid ${durationColor()}36` }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </Stack>

            <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6}>
                    <Tooltip title="The date from which you need access to clock using another device" placement="top">
                        <TextField fullWidth label="Allow me to clock from" type="date"
                            value={fromDate}
                            onChange={e => { setFromDate(e.target.value); setErrors(p => ({ ...p, fromDate: undefined, toDate: undefined })); }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: today() }}
                            error={!!errors.fromDate}
                            helperText={errors.fromDate || 'First day of temporary access'}
                            InputProps={{ startAdornment: <EventAvailable sx={{ color: colorPalette.oceanBlue, mr: 1, fontSize: 20 }} /> }}
                            sx={G.input}
                        />
                    </Tooltip>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Tooltip title={`Access will automatically expire after this date (max ${MAX_DAYS} days)`} placement="top">
                        <TextField fullWidth label="Allow me to clock until" type="date"
                            value={toDate}
                            onChange={e => { setToDate(e.target.value); setErrors(p => ({ ...p, toDate: undefined })); }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: fromDate || today() }}
                            error={!!errors.toDate}
                            helperText={errors.toDate || `Access expires automatically (max ${MAX_DAYS} days)`}
                            InputProps={{ startAdornment: <EventAvailable sx={{ color: colorPalette.seafoamGreen, mr: 1, fontSize: 20 }} /> }}
                            sx={G.input}
                        />
                    </Tooltip>
                </Grid>
            </Grid>

            {/* ── Reason ── */}
            <TextField fullWidth multiline minRows={3} maxRows={6}
                label="Brief description of how the device was lost"
                placeholder="e.g. My phone was stolen during the field research expedition at Mombasa on 14 Feb 2026…"
                value={reason}
                onChange={e => { setReason(e.target.value); setErrors(p => ({ ...p, reason: undefined })); }}
                error={!!errors.reason}
                helperText={errors.reason || `${reason.length} / 500 characters`}
                inputProps={{ maxLength: 500 }}
                sx={{ ...G.input, mb: 3 }}
            />

            {/* ── Submit ── */}
            <Button
                variant="contained" size="large"
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Send />}
                onClick={handleSubmit}
                disabled={submitting || devicesLoading || devices.length === 0}
                sx={{
                    background: colorPalette.oceanGradient,
                    borderRadius: '14px', px: 4, py: 1.35,
                    fontWeight: 800, fontSize: '0.9rem', textTransform: 'none',
                    boxShadow: `0 6px 22px ${colorPalette.oceanBlue}38`,
                    transition: 'all 0.22s ease',
                    '&:hover': { boxShadow: `0 10px 30px ${colorPalette.oceanBlue}50`, transform: 'translateY(-2px)' },
                    '&.Mui-disabled': { opacity: 0.65 },
                }}
            >
                {submitting ? 'Submitting…' : 'Submit Request'}
            </Button>

            {/* ══════════════════════════════════════════════════════════════
                REQUEST HISTORY
            ══════════════════════════════════════════════════════════════ */}
            <Box mt={5}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
                    <Box sx={{ width: 4, height: 18, borderRadius: 2, bgcolor: colorPalette.aquaVibrant }} />
                    <Box sx={{ width: 38, height: 38, borderRadius: '12px', bgcolor: `${colorPalette.deepNavy}08`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DevicesOther sx={{ color: colorPalette.deepNavy, fontSize: '1.15rem' }} />
                    </Box>
                    <Typography variant="h6" fontWeight={900} color={colorPalette.deepNavy}>My Lost Device Requests</Typography>
                    {!loading && (
                        <Chip label={requests.length} size="small"
                            sx={{ bgcolor: `${colorPalette.oceanBlue}12`, color: colorPalette.oceanBlue, fontWeight: 800, fontSize: '0.72rem', borderRadius: '8px' }} />
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Tooltip title="Refresh requests"><span>
                        <Button size="small"
                            startIcon={loading ? <CircularProgress size={14} /> : <Refresh sx={{ fontSize: '1rem' }} />}
                            onClick={loadRequests} disabled={loading}
                            sx={{ textTransform: 'none', fontWeight: 700, color: colorPalette.oceanBlue, borderRadius: '10px', bgcolor: `${colorPalette.oceanBlue}08`, border: `1px solid ${colorPalette.oceanBlue}18`, '&:hover': { bgcolor: `${colorPalette.oceanBlue}12` }, px: 1.5 }}>
                            Refresh
                        </Button>
                    </span></Tooltip>
                </Stack>

                {fetchError && !loading && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: '14px', backdropFilter: 'blur(12px)' }}
                        action={<Button size="small" onClick={loadRequests} sx={{ fontWeight: 700 }}>Retry</Button>}>
                        {fetchError}
                    </Alert>
                )}

                {loading && <Stack spacing={2}>{[1, 2].map(k => <RequestSkeleton key={k} />)}</Stack>}

                {!loading && !fetchError && requests.length === 0 && (
                    <Box sx={{ ...G.card, borderRadius: '18px', p: 4, textAlign: 'center', border: '1.5px dashed rgba(10,61,98,0.14)' }}>
                        <Box sx={{ width: 64, height: 64, borderRadius: '20px', bgcolor: 'rgba(10,61,98,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                            <PhoneAndroid sx={{ color: 'rgba(10,61,98,0.22)', fontSize: 34 }} />
                        </Box>
                        <Typography color="text.disabled" fontWeight={600} variant="body2">No requests submitted yet.</Typography>
                    </Box>
                )}

                {!loading && requests.length > 0 && (
                    <Stack spacing={2}>
                        {requests.map((req, i) => {
                            const sc       = statusConfig[req.status] || statusConfig.pending;
                            const duration = daysBetween(req.startDate, req.endDate);
                            return (
                                <motion.div key={req._id || req.id || i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, ease: [0.4, 0, 0.2, 1] }}>
                                    <Box sx={{
                                        ...G.requestCard(req.status),
                                        borderRadius: '18px', p: 2.5,
                                        transition: 'all 0.22s ease',
                                        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 32px rgba(10,61,98,0.12)' },
                                    }}>
                                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5}>
                                            <Box sx={{ flex: 1 }}>
                                                <Stack direction="row" spacing={1} alignItems="center" mb={0.6} flexWrap="wrap">
                                                    <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>
                                                        Request #{req._id ? req._id.slice(-6).toUpperCase() : String(i + 1).padStart(3, '0')}
                                                    </Typography>
                                                    <Chip icon={sc.icon} label={sc.label} size="small" color={sc.color} variant="outlined"
                                                        sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem', borderRadius: '8px' }} />
                                                    {req.responded && req.responded !== 'pending' && (
                                                        <Chip label={`Responded: ${req.responded}`} size="small"
                                                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(10,61,98,0.07)', color: colorPalette.deepNavy, borderRadius: '6px' }} />
                                                    )}
                                                </Stack>
                                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>{req.description}</Typography>
                                            </Box>
                                            <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, flexShrink: 0 }}>
                                                <Typography variant="caption" color="text.disabled" display="block">
                                                    Submitted: {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '—'}
                                                </Typography>
                                                <Typography variant="caption" fontWeight={700} color={colorPalette.oceanBlue} display="block" sx={{ mt: 0.3 }}>
                                                    {req.startDate} → {req.endDate}
                                                </Typography>
                                                {duration > 0 && (
                                                    <Typography variant="caption" color="text.disabled" display="block">
                                                        {duration} day{duration !== 1 ? 's' : ''}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Stack>
                                    </Box>
                                </motion.div>
                            );
                        })}
                    </Stack>
                )}
            </Box>
        </Box>
    );
};

export default LostDeviceContent;