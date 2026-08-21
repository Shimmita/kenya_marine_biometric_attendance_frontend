import {
    AccessTime, BusinessCenter,
    CheckCircle,
    Fingerprint, History,
    InfoOutlined, LocationOn
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
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserCurrentDeviceRedux } from '../../redux/CurrentDevice';
import { updateUserCurrentUserRedux } from '../../redux/CurrentUser';
import { fetchBiometricStatus, registerFingerprint, verifyFingerprint } from '../../service/Biometrics';
import { fetchAttendanceStats, fetchClockingHistory } from '../../service/ClockingService';
import { fetchMyDevices } from '../../service/DeviceService';
import { getDeviceFingerprint } from '../../service/Fingerprinting';
import { revokeClockOutsideStatus } from '../../service/UserManagement';
import { getUserProfile } from '../../service/UserProfile';
import coreDataDetails from '../CoreDataDetails';
import { formatDate, formatTime, getLocalDateInputValue } from '../util/DateTimeFormater';
import { calculateDistanceMeters } from '../util/DistanceMeasure';
import reverseGeocode from '../util/GeoLocationPlace';
import LiveClock from '../util/LiveClock';
import { detectCurrentDevice } from './AddDevice';

const { AvailableStations, colorPalette } = coreDataDetails;
const GEOFENCE_RADIUS_METERS = 500;

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
    clockBg: 'linear-gradient(135deg, #061D2E 0%, #0A3557 48%, #07506A 100%)',
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
    const notify = useCallback((msg, sev = 'success') => setSnack({ open: true, message: msg, severity: sev }), []);
    const close = useCallback(() => setSnack(s => ({ ...s, open: false })), []);
    return { snack, notify, close };
};

const CLOCKING_REMINDERS_STORAGE_KEY = 'kmfri_clocking_reminders';
const CLOCKING_REMINDER_INTERVAL_MS = 9 * 60 * 1000;

const formatReminderTemplate = (template, user) => {
    const firstName = user?.name?.split(' ')[0] || 'User';
    const fullName = user?.name || firstName;
    let message = String(template || '').trim();
    if (!message) return '';
    return message
        .replace(/\{firstName\}/gi, firstName)
        .replace(/\{email\}/gi, user?.email)
        .replace(/\{phone\}/gi, user?.phone)
        .replace(/\{station\}/gi, user?.station)
        .replace(/\{department\}/gi, user?.department)
        .replace(/\{name\}/gi, fullName);
};

const getReminderMessage = (template, user) => {
    if (!template) return '';
    if (Array.isArray(template) && template.length > 0) {
        template = template[Math.floor(Math.random() * template.length)];
    }
    return formatReminderTemplate(template, user);
};

const playReminderTone = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 880;
        gain.gain.value = 0.12;
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.18);
        oscillator.onended = () => context.close();
    } catch (error) {
        // Audio playback may be blocked in some environments; ignore silently.
    }
};

const sendBrowserNotification = (title, body) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const createNotification = () => {
        try {
            new Notification(title, {
                body,
                badge: '/favicon.ico',
                icon: '/favicon.ico',
                tag: 'clocking-reminder',
                renotify: true,
            });
            playReminderTone();
        } catch (error) {
            console.error('Browser notification failed:', error);
        }
    };

    if (Notification.permission === 'granted') {
        createNotification();
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') createNotification();
        });
    }
};

const persistClockingReminder = (message) => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const trimmed = message.trim();
    if (!trimmed) return;

    const stored = localStorage.getItem(CLOCKING_REMINDERS_STORAGE_KEY);
    let reminders = [];

    try {
        reminders = stored ? JSON.parse(stored) : [];
    } catch (err) {
        reminders = [];
    }

    const alreadyStored = reminders.some((item) => item.message === trimmed);
    if (alreadyStored) return;

    const next = [
        {
            _id: `clocking-reminder-${new Date().toISOString()}`,
            title: 'Clocking System Reminder',
            message: trimmed,
            status: 'info',
            label: 'clocking',
            source: 'clocking',
            createdAt: new Date().toISOString(),
        },
        ...reminders,
    ].slice(0, 10);

    localStorage.setItem(CLOCKING_REMINDERS_STORAGE_KEY, JSON.stringify(next));
};

const shouldShowClockingReminder = (type) => {
    if (typeof window === 'undefined' || !window.localStorage) return true;

    const storageKey = `kmfri_clocking_reminder_${type}_${getLocalDateInputValue()}`;
    const lastShown = Number(localStorage.getItem(storageKey) || 0);
    const now = Date.now();

    if (lastShown && now - lastShown < CLOCKING_REMINDER_INTERVAL_MS) {
        return false;
    }

    localStorage.setItem(storageKey, String(now));
    return true;
};

/* ══ AMBIENT ORBS ══════════════════════════════════════════════════════════ */
const AmbientOrbs = () => (
    <Box
        aria-hidden="true"
        sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            overflow: 'hidden',
            background:
                'radial-gradient(circle at 8% 8%, rgba(0,91,150,0.055), transparent 28%), radial-gradient(circle at 92% 38%, rgba(72,201,176,0.045), transparent 25%)',
        }}
    />
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



/* ══ SECTION LABEL ══════════════════════════════════════════════════════════ */
const SectionLabel = ({ children, accent, chip }) => (
    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Box sx={{ width: 4, height: 18, borderRadius: 2, bgcolor: accent }} />
        <Typography
            variant="subtitle1"
            fontWeight={900}
            color={colorPalette.deepNavy}
            sx={{ letterSpacing: 0.35 }}
        >
            {children}
        </Typography>
        {chip && (
            <Chip
                label={chip}
                size="small"
                sx={{
                    height: 22,
                    bgcolor: `${accent}12`,
                    color: accent,
                    fontWeight: 800,
                    fontSize: '0.62rem',
                    borderRadius: '7px',
                    border: `1px solid ${accent}18`,
                }}
            />
        )}
    </Stack>
);

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
    const canUseClocking = user?.isAccountActive === true && user?.isOnLeave !== true;

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
    const [currentDeviceFingerprint, setCurrentDeviceFingerprint] = useState('');
    const [enrolledDevices, setEnrolledDevices] = useState([]);
    const [currentDeviceRegistered, setCurrentDeviceRegistered] = useState(false);
    const [locationStatus, setLocationStatus] = useState('idle');

    useEffect(() => {
        if (!user?._id) return undefined;

        let alive = true;
        const refreshClockingState = async () => {
            try {
                const updated = await getUserProfile();
                if (!alive) return;
                dispatch(updateUserCurrentUserRedux(updated));
                setIsClockedIn(Boolean(updated?.hasClockedIn));
                setIsToClockOut(Boolean(updated?.isToClockOut));
                setBiometricRegistered(Boolean(updated?.doneBiometric));
            } catch (err) {
                console.error("Dashboard profile refresh failed:", err);
            }
        };

        const refreshWhenVisible = () => {
            if (document.visibilityState !== 'hidden') {
                refreshClockingState();
            }
        };

        refreshClockingState();
        window.addEventListener('focus', refreshClockingState);
        document.addEventListener('visibilitychange', refreshWhenVisible);

        return () => {
            alive = false;
            window.removeEventListener('focus', refreshClockingState);
            document.removeEventListener('visibilitychange', refreshWhenVisible);
        };
    }, [dispatch, user?._id]);

    useEffect(() => {
        let alive = true;
        const loadCurrentDevice = async () => {
            if (!canUseClocking) {
                setBiometricRegistered(false);
                setCurrentDeviceRegistered(false);
                setCurrentDeviceFingerprint('');
                setEnrolledDevices([]);
                return;
            }

            try {
                const fp = await getDeviceFingerprint();
                const [devices, biometricStatus] = await Promise.all([
                    fetchMyDevices(),
                    fetchBiometricStatus(fp),
                ]);
                if (!alive) return;
                const activeDevices = (Array.isArray(devices) ? devices : []).filter(d => !d.device_lost);
                setCurrentDeviceFingerprint(fp);
                setEnrolledDevices(activeDevices);
                setBiometricRegistered(Boolean(biometricStatus?.registered || user?.doneBiometric));
                setCurrentDeviceRegistered(Boolean(biometricStatus?.currentDeviceRegistered));
                dispatch(updateUserCurrentDeviceRedux(activeDevices));
            } catch (err) {
                console.error("Current device check failed:", err);
                if (alive) {
                    setBiometricRegistered(Boolean(user?.doneBiometric));
                    setCurrentDeviceRegistered(false);
                }
            }
        };
        loadCurrentDevice();
        return () => { alive = false; };
    }, [canUseClocking, dispatch, user?.doneBiometric]);

    // check user update can clock outside
    useEffect(() => {
        const checkAuthorizationValidity = async () => {
            if (!canUseClocking) return;

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
    }, [canUseClocking, user, dispatch]);

    // 2. Logic to determine if user is allowed to proceed
    const isDateAuthorized = useCallback(() => {
        if (!user?.canClockOutside || !user?.outsideClockingDetails) return false;

        const today = new Date();
        const start = new Date(user.outsideClockingDetails.startDate);
        const end = new Date(user.outsideClockingDetails.endDate);

        // Ensure today is within the allowed window
        return today >= start && today <= end;
    }, [user?.canClockOutside, user?.outsideClockingDetails]);

    const outsideClockingAuthorized = isDateAuthorized();




    useEffect(() => {
        let alive = true;
        fetchClockingHistory(7).then(records => {
            if (!alive) return;
            setRecentAttendance(records.map(rec => ({
                date: formatDate(rec.clock_in),
                clockIn: formatTime(rec.clock_in),
                clockOut: rec.missedClockOut ? 'System' : rec.clock_out ? formatTime(rec.clock_out) : 'System',
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

    useEffect(() => {
        if (!canUseClocking) return undefined;

        const sendReminder = () => {
            const now = new Date();
            const hour = now.getHours();
            const reminders = coreDataDetails.notificationReminders || {};

            if (hour >= 6 && hour < 11 && !isClockedIn) {
                if (!shouldShowClockingReminder('clockin')) return;
                const message = getReminderMessage(reminders.clockInMessage, user) || 'Please clock in for your scheduled KMFRI workday.';
                notify(message, 'info');
                persistClockingReminder(message);
                sendBrowserNotification('Clocking System Reminder', message);
                return;
            }

            if (hour >= 16 && hour < 18 && isClockedIn && isToClockOut) {
                if (!shouldShowClockingReminder('clockout')) return;
                const message = getReminderMessage(reminders.clockOutMessage, user) || 'Please clock out before leaving your duty station.';
                notify(message, 'info');
                persistClockingReminder(message);
                sendBrowserNotification('Clocking System Reminder', message);
            }
        };

        sendReminder();
        const reminderInterval = setInterval(sendReminder, CLOCKING_REMINDER_INTERVAL_MS);
        return () => clearInterval(reminderInterval);
    }, [canUseClocking, isClockedIn, isToClockOut, notify, user]);

    useEffect(() => {
        if (!canUseClocking) return;
        if (!outsideClockingAuthorized) return;

        const reason = user?.outsideClockingDetails?.reason || 'authorized duty';
        notify(`Clocking outside granted for ${reason}`.toLowerCase(), 'info');
    }, [canUseClocking, outsideClockingAuthorized, user?.outsideClockingDetails?.reason, notify]);

    const getCurrentLocation = useCallback(() => new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            ({ coords: { latitude, longitude } }) => {
                const nextLocation = { latitude, longitude };
                const stationRadius = Number(selectedStation.radiusMeters || GEOFENCE_RADIUS_METERS);
                const d = calculateDistanceMeters(latitude, longitude, selectedStation.lat, selectedStation.lng);
                const withinGeofence = d <= stationRadius;
                setUserLocation(nextLocation);
                setIsWithinGeofence(withinGeofence);
                resolve({ ...nextLocation, isWithinGeofence: withinGeofence });
            },
            (error) => reject(error),
            { enableHighAccuracy: true, maximumAge: 60_000, timeout: 12000 }
        );
    }), [selectedStation.lat, selectedStation.lng, setIsWithinGeofence, setUserLocation]);

    const requestLocation = useCallback(async () => {
        setLocationStatus('checking');

        try {
            await getCurrentLocation();
            setLocationStatus('granted');
        } catch (error) {
            const nextStatus = error?.code === 1
                ? 'denied'
                : error?.message === 'Geolocation not supported.'
                    ? 'unsupported'
                    : 'error';

            setLocationStatus(nextStatus);
            notify(
                nextStatus === 'denied'
                    ? 'Location permission is required. Please allow location access to continue clocking.'
                    : 'Location could not be verified. Please try again.',
                'error'
            );
        }
    }, [getCurrentLocation, notify]);

    useEffect(() => {
        if (!canUseClocking) return;
        requestLocation();
    }, [canUseClocking, requestLocation, selectedStation.name]);
    // eslint-disable-line

    // 3. Location is mandatory for every clock action. Outside authorization
    // bypasses only the station geofence distance check, not coordinate capture.
    const hasVerifiedLocation = Boolean(userLocation?.latitude && userLocation?.longitude);
    const canProceedWithLocation = hasVerifiedLocation && (isWithinGeofence || outsideClockingAuthorized);

    const clockStepIndex = !canProceedWithLocation ? 0 : !biometricRegistered ? 1 : 2;



    const handleUserLocationLable = () => {
        if (!hasVerifiedLocation) {
            return outsideClockingAuthorized ? 'Location required for outside clocking' : 'Location not verified yet'
        } else if (outsideClockingAuthorized) {
            return `Granted to Clock Outside ✓`
        } else if (userLocation && isWithinGeofence && !outsideClockingAuthorized) {
            return 'Within KMFRI Premise Station ✓'
        } else return 'Outside Premises cannot Clock In/Out'
    }


    const handleRegisterFingerprint = async () => {
        if (!canUseClocking) {
            notify('Clocking services are unavailable for your account status.', 'warning');
            return;
        }

        try {

            setBiometricLoading(true);
            const fp = currentDeviceFingerprint || await getDeviceFingerprint();
            const { deviceName, browser, os } = detectCurrentDevice();
            const registrationResult = await registerFingerprint({
                device_name: deviceName,
                device_os: os,
                device_browser: browser,
                device_fingerprint: fp,
            });
            const [updated, devices, biometricStatus] = await Promise.all([
                getUserProfile(),
                fetchMyDevices(),
                fetchBiometricStatus(fp),
            ]);

            if (updated?.doneBiometric || registrationResult?.registered || biometricStatus?.registered) {
                setBiometricRegistered(true);
                const activeDevices = (Array.isArray(devices) ? devices : []).filter(d => !d.device_lost);
                setEnrolledDevices(activeDevices);
                setCurrentDeviceFingerprint(fp);
                setCurrentDeviceRegistered(Boolean(biometricStatus?.currentDeviceRegistered || registrationResult?.alreadyRegistered));
                dispatch(updateUserCurrentUserRedux(updated));
                dispatch(updateUserCurrentDeviceRedux(activeDevices));
                notify(
                    registrationResult?.alreadyRegistered
                        ? 'Fingerprint already registered. You can clock in or out now.'
                        : activeDevices.length > 1 ? 'Second device enrolled successfully!' : 'Primary device enrolled successfully!'
                );
            } else throw new Error('Biometric registration incomplete.');
        } catch (err) { notify(`${err}`, 'error'); }
        finally { setBiometricLoading(false); }
    };

    const handleClockInClockOut = async () => {
        if (!canUseClocking) {
            notify('Clocking services are unavailable for your account status.', 'warning');
            return;
        }

        try {
            setBiometricLoading(true);
            const fp = currentDeviceFingerprint || await getDeviceFingerprint();
            let locationForClock = null;

            try {
                locationForClock = await getCurrentLocation();
                setLocationStatus('granted');
            } catch (error) {
                setLocationStatus(error?.code === 1 ? 'denied' : 'error');
                notify('Location could not be verified. Please try again.', 'error');
                return;
            }

            if (!locationForClock?.latitude || !locationForClock?.longitude) {
                notify('Please allow location access before clocking.', 'warning');
                await requestLocation();
                return;
            }

            // Only outside-premise authorized clocking needs a place name.
            // Inside-premise clocking remains "In Premise" even when the user
            // has active outside-clock permission.
            let outsideLocation = null;
            const withinGeofenceForClock = Boolean(locationForClock.isWithinGeofence);
            const isOutsidePremiseClocking = outsideClockingAuthorized && !withinGeofenceForClock;
            try {
                if (isOutsidePremiseClocking && locationForClock?.latitude && locationForClock?.longitude) {
                    const geo = await reverseGeocode({
                        latitude: locationForClock.latitude,
                        longitude: locationForClock.longitude,
                    });
                    outsideLocation = geo?.data || null;
                }
            } catch (e) {
                console.warn('Reverse geocode failed:', e);
            }

            const expectedAction = isClockedIn && isToClockOut ? "clock_out" : "clock_in";
            const verifyRes = await verifyFingerprint(
                selectedStation.name,
                locationForClock,
                fp,
                outsideLocation,
                withinGeofenceForClock,
                expectedAction
            );
            console.debug('biometric verify response:', verifyRes);
            const [updated, biometricStatus] = await Promise.all([
                getUserProfile(),
                fetchBiometricStatus(fp),
            ]);
            dispatch(updateUserCurrentUserRedux(updated));
            setBiometricRegistered(Boolean(biometricStatus?.registered || updated?.doneBiometric));
            setCurrentDeviceRegistered(Boolean(biometricStatus?.currentDeviceRegistered));
            setIsClockedIn(updated.hasClockedIn);
            setIsToClockOut(updated.isToClockOut);
            localStorage.setItem('recent_station', selectedStation.name);
            const now = new Date();
            notify(`${updated.name}, Clocked ${updated.hasClockedIn ? 'In' : 'Out'} At ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        } catch (err) {
            try {
                const updated = await getUserProfile();
                dispatch(updateUserCurrentUserRedux(updated));
                setIsClockedIn(Boolean(updated?.hasClockedIn));
                setIsToClockOut(Boolean(updated?.isToClockOut));
            } catch (profileErr) {
                console.error("Clocking state refresh failed:", profileErr);
            }
            notify(`${err}`, 'error');
        } finally { setBiometricLoading(false); }
    };

    const m = userStats?.monthly;
    const w = userStats?.weekly;
    const accountStatus = user?.isAccountActive === false
        ? {
            severity: 'error',
            label: 'Account Disabled',
            message: 'Clocking services are disabled for your account. Recent attendance history remains available.',
        }
        : user?.isOnLeave === true
            ? {
                severity: 'info',
                label: 'On Leave',
                message: 'You are currently marked as on leave. Clocking instructions and clocking actions are hidden until leave ends.',
            }
            : null;

    /* ═══════════════════════════════════════════════════════════════════════
       RENDER
    ═══════════════════════════════════════════════════════════════════════ */
    return (
        <Box sx={{ width: '100%', position: 'relative' }}>
            <AmbientOrbs />

            <Snackbar open={snack.open} onClose={close} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={close} severity={snack.severity} variant="filled" elevation={6}
                    sx={{ borderRadius: '14px', fontWeight: 700, backdropFilter: 'blur(16px)', boxShadow: '0 8px 28px rgba(0,0,0,0.14)' }}>
                    {snack.message}
                </Alert>
            </Snackbar>

            {/* ══ HOW-TO BANNER IF USER ACTIVE  ════════════════════════════════════════════ */}
            {canUseClocking && (
                <Reveal>
                    <Box sx={{ ...G.tinted(colorPalette.oceanBlue), borderRadius: '20px', p: 2.5, mb: 3, position: 'relative', zIndex: 1 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                            <Box sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: `${colorPalette.oceanBlue}14`, border: `1px solid ${colorPalette.oceanBlue}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <InfoOutlined sx={{ color: colorPalette.oceanBlue, fontSize: '1.1rem' }} />
                            </Box>
                            <Typography variant="subtitle2" fontWeight={900} color={colorPalette.deepNavy} sx={{ letterSpacing: 0.5 }}>
                               WELCOME {user?.name?.split(" ")[0].toUpperCase()}, HERE IS YOUR CLOCKING GUIDE
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
                            <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ fontSize: '0.63rem' }}>CLOCKING READINESS:</Typography>
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
            )}

            {accountStatus && (
                <Reveal>
                    <Alert
                        severity={accountStatus.severity}
                        icon={false}
                        sx={{
                            ...G.tinted(accountStatus.severity === 'error' ? colorPalette.coralSunset : colorPalette.oceanBlue),
                            borderRadius: '18px',
                            mb: 3,
                            alignItems: 'center',
                            '& .MuiAlert-message': { width: '100%' },
                        }}
                    >
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1.5}
                            alignItems={{ xs: 'flex-start', sm: 'center' }}
                            justifyContent="space-between"
                        >
                            <Box>
                                <Typography variant="subtitle2" fontWeight={900} color={colorPalette.deepNavy}>
                                    {accountStatus.label}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                                    {accountStatus.message}
                                </Typography>
                            </Box>
                            <Chip
                                label={accountStatus.label}
                                size="small"
                                sx={{
                                    fontWeight: 900,
                                    bgcolor: accountStatus.severity === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(10,61,98,0.10)',
                                    color: accountStatus.severity === 'error' ? '#dc2626' : colorPalette.oceanBlue,
                                    border: `1px solid ${accountStatus.severity === 'error' ? 'rgba(239,68,68,0.24)' : 'rgba(10,61,98,0.18)'}`,
                                }}
                            />
                        </Stack>
                    </Alert>
                </Reveal>
            )}


            {/* ══ MAIN GRID ════════════════════════════════════════════════ */}
            <Grid container spacing={3} alignItems="flex-start" sx={{ position: 'relative', zIndex: 1 }}>

                {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
                <Grid
                    item
                    xs={12}
                    sx={{
                        flexBasis: '100%',
                        maxWidth: '100%',
                        minWidth: 0,
                    }}
                >
                    <Stack spacing={3}>

                        {/* ── DARK CLOCK CARD ── */}

                        {canUseClocking && (
                            <Reveal>
                                <Box sx={{
                                    borderRadius: { xs: '20px', sm: '24px', md: '28px' },
                                    background: G.clockBg,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    p: { xs: 2.25, sm: 3, md: 3.5 },
                                    border: '1px solid rgba(255,255,255,0.10)',
                                    boxShadow: '0 18px 44px rgba(5,37,61,0.22)',
                                    isolation: 'isolate',
                                }}>
                                    <Box aria-hidden="true" sx={{
                                        position: 'absolute', inset: 0, pointerEvents: 'none',
                                        background: 'radial-gradient(circle at 92% 5%, rgba(0,229,255,0.14), transparent 28%), radial-gradient(circle at 8% 100%, rgba(72,201,176,0.10), transparent 30%)',
                                    }} />
                                    <Box aria-hidden="true" sx={{
                                        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.22,
                                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
                                        backgroundSize: '28px 28px',
                                        maskImage: 'linear-gradient(to bottom, black, transparent 72%)',
                                    }} />

                                    <Stack
                                        direction={{ xs: 'column', md: 'row' }}
                                        justifyContent="space-between"
                                        alignItems={{ xs: 'stretch', md: 'center' }}
                                        spacing={{ xs: 3, md: 4 }}
                                        sx={{ position: 'relative', zIndex: 1 }}
                                    >

                                        {/* Clock face */}
                                        <Box sx={{
                                            textAlign: { xs: 'center', md: 'left' },
                                            flex: { md: '1 1 48%' },
                                            minWidth: 0,
                                            py: { md: 1 },
                                        }}>
                                            <LiveClock />
                                            <Stack direction="row" spacing={1} mt={2.5} justifyContent={{ xs: 'center', md: 'flex-start' }} flexWrap="wrap" gap={1}>
                                                <Chip
                                                    icon={<LocationOn sx={{ color: 'white !important', fontSize: '0.85rem !important' }} />}
                                                    // label={locationLabel} size="small"
                                                    label={handleUserLocationLable()} size="small"
                                                    sx={{ bgcolor: isWithinGeofence && !outsideClockingAuthorized ? 'rgba(34,197,94,0.22)' : outsideClockingAuthorized ? 'rgba(154, 211, 21, 0.22)' : 'rgba(138,138,138,0.22)', color: '#fff', fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${isWithinGeofence && !outsideClockingAuthorized ? 'rgba(34,197,94,0.38)' : outsideClockingAuthorized ? 'rgba(154, 211, 21, 0.35)' : 'rgba(138,138,138,0.35)'}`, backdropFilter: 'blur(8px)' }}
                                                />
                                                {isClockedIn && isToClockOut && (
                                                    <Chip icon={<CheckCircle sx={{ color: 'white !important', fontSize: '0.85rem !important' }} />} label="Session Active" size="small"
                                                        sx={{ bgcolor: isWithinGeofence && !outsideClockingAuthorized ? 'rgba(34,197,94,0.24)' : outsideClockingAuthorized ? 'rgba(154, 211, 21, 0.24)' : 'rgba(138,138,138,0.24)', color: '#fff', fontWeight: 700, fontSize: '0.7rem', border: isWithinGeofence && !outsideClockingAuthorized ? '1px solid rgba(34,197,94,0.40)' : outsideClockingAuthorized ? '1px solid rgba(154, 211, 21, 0.40)' : '1px solid rgba(138,138,138,0.40)' }} />
                                                )}
                                                {biometricRegistered && (
                                                    <Chip
                                                        icon={<Fingerprint sx={{ color: 'white !important', fontSize: '0.85rem !important' }} />}
                                                        label={currentDeviceRegistered ? 'Biometric Ready' : 'Biometric Registered'}
                                                        size="small"
                                                        sx={{ bgcolor: 'rgba(0,180,200,0.22)', color: '#fff', fontWeight: 700, fontSize: '0.7rem', border: '1px solid rgba(0,180,200,0.38)' }}
                                                    />
                                                )}

                                                {/* If authorized outside, show a special badge */}
                                                {outsideClockingAuthorized && (
                                                    <Chip
                                                        label={user.outsideClockingDetails.reason}
                                                        size="small"
                                                        sx={{ bgcolor: colorPalette.warmSand, color: colorPalette.deepNavy, fontWeight: 900, fontSize: '0.65rem' }}
                                                    />
                                                )}
                                            </Stack>
                                        </Box>

                                        {/* Controls */}
                                        <Stack spacing={1.6} sx={{
                                            width: '100%',
                                            maxWidth: { xs: '100%', sm: 430, md: 390 },
                                            flex: { md: '0 1 390px' },
                                            mx: { xs: 'auto', md: 0 },
                                            p: { xs: 1.4, sm: 1.7 },
                                            borderRadius: '18px',
                                            bgcolor: 'rgba(255,255,255,0.065)',
                                            border: '1px solid rgba(255,255,255,0.11)',
                                        }}>
                                            {outsideClockingAuthorized && (
                                                <Alert
                                                    severity="info"
                                                    sx={{
                                                        borderRadius: '14px',
                                                        bgcolor: 'rgba(255,255,255,0.10)',
                                                        color: '#fff',
                                                        border: '1px solid rgba(154,211,21,0.35)',
                                                        '& .MuiAlert-icon': { color: colorPalette.aquaVibrant },
                                                    }}
                                                >
                                                    Granted to clock outside
                                                </Alert>
                                            )}

                                            <TextField select fullWidth label="Clocking Station"
                                                value={selectedStation.name}
                                                disabled={isClockedIn && isToClockOut}
                                                onChange={e => setSelectedStation(AvailableStations.find(s => s.name === e.target.value) || AvailableStations[0])}
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
                                                        <Box sx={{
                                                            p: 1.5,
                                                            borderRadius: '14px',
                                                            bgcolor: 'rgba(255,255,255,0.08)',
                                                            border: '1px solid rgba(255,255,255,0.18)',
                                                            backdropFilter: 'blur(8px)'
                                                        }}>
                                                            <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between">
                                                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.76rem', lineHeight: 1.4 }}>
                                                                    {locationStatus === 'denied'
                                                                        ? 'Allow location access to continue clocking.'
                                                                        : locationStatus === 'checking'
                                                                            ? 'Checking your location...'
                                                                            : 'Location access is required before clocking.'}
                                                                </Typography>
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    startIcon={locationStatus === 'checking'
                                                                        ? <CircularProgress size={12} sx={{ color: '#fff' }} />
                                                                        : <LocationOn sx={{ fontSize: '0.9rem !important' }} />}
                                                                    onClick={requestLocation}
                                                                    disabled={locationStatus === 'checking'}
                                                                    sx={{
                                                                        color: '#fff',
                                                                        borderColor: 'rgba(255,255,255,0.35)',
                                                                        minWidth: 92,
                                                                        px: 1.2,
                                                                        py: 0.7,
                                                                        borderRadius: '10px',
                                                                        fontSize: '0.68rem',
                                                                        fontWeight: 900,
                                                                        letterSpacing: 0.25,
                                                                        bgcolor: 'rgba(255,255,255,0.07)',
                                                                        '& .MuiButton-startIcon': { mr: 0.45 },
                                                                        '&:hover': { borderColor: 'rgba(255,255,255,0.70)', bgcolor: 'rgba(255,255,255,0.13)' },
                                                                        '&.Mui-disabled': { color: 'rgba(255,255,255,0.45)', borderColor: 'rgba(255,255,255,0.18)' }
                                                                    }}
                                                                >
                                                                    {locationStatus === 'checking' ? 'Checking' : 'Allow'}
                                                                </Button>
                                                            </Stack>
                                                        </Box>
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
                                                                        {user?.doneBiometric && enrolledDevices.length > 0
                                                                            ? 'Enroll this browser to continue clocking.'
                                                                            : 'Register once to enable secure clocking.'}
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
                                                                    bgcolor: colorPalette.aquaVibrant,
                                                                    color: '#fff',
                                                                    minHeight: 54,
                                                                    py: 1.55,
                                                                    borderRadius: '14px',
                                                                    fontWeight: 900,
                                                                    fontSize: { xs: '0.82rem', sm: '0.9rem' },
                                                                    letterSpacing: 0.75,
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
                        )}


                        {/* ── RECENT ATTENDANCE TABLE ── */}
                        <Reveal>
                            <Box>
                                <SectionLabel accent={colorPalette.deepNavy} chip="LAST 7 DAYS">RECENT ATTENDANCE</SectionLabel>
                                <Box sx={{ ...G.card, borderRadius: '20px', overflow: 'hidden' }}>
                                    <Box sx={{ overflowX: 'auto', '&::-webkit-scrollbar': { height: 3 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(10,61,98,0.12)', borderRadius: 2 } }}>
                                        <Table size="small" sx={{ width: '100%', minWidth: isMobile ? 460 : '100%' }}>
                                            <TableHead>
                                                <TableRow sx={{ background: 'rgba(10,61,98,0.04)' }}>
                                                    {['Date', isMobile ? 'In' : 'Clock In', isMobile ? 'Out' : 'Clock Out'].map(h => (
                                                        <TableCell key={h} sx={{ fontWeight: 900, fontSize: '0.69rem', color: colorPalette.deepNavy, letterSpacing: 0.7, py: 1.6, textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(10,61,98,0.08)' }}>{h}</TableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {recentAttendance.length === 0
                                                    ? <TableRow>
                                                        <TableCell colSpan={3} align="center" sx={{ py: 5, border: 0 }}>
                                                            <Stack alignItems="center" spacing={1}>
                                                                <Box sx={{ width: 56, height: 56, borderRadius: '18px', bgcolor: 'rgba(10,61,98,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <History sx={{ fontSize: 30, color: 'rgba(10,61,98,0.22)' }} />
                                                                </Box>
                                                                <Typography variant="body2" color="text.disabled" fontWeight={600}>No attendance records found</Typography>
                                                            </Stack>
                                                        </TableCell>
                                                    </TableRow>
                                                    : recentAttendance.map((row, idx) => (
                                                        <motion.tr key={idx} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.04, duration: 0.25 }}
                                                            style={{ display: 'table-row', borderBottom: '1px solid rgba(10,61,98,0.05)' }}>
                                                            <TableCell sx={{ fontWeight: 700, color: colorPalette.deepNavy, fontSize: '0.82rem', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(10,61,98,0.05)' }}>{row.date}</TableCell>
                                                            <TableCell sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.82rem', borderBottom: '1px solid rgba(10,61,98,0.05)' }}>{row.clockIn}</TableCell>
                                                            <TableCell sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.82rem', borderBottom: '1px solid rgba(10,61,98,0.05)' }}>{row.clockOut}</TableCell>
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
            </Grid>
        </Box>
    );
};

export default DashboardContent;