import {
    AccessTime,
    BusinessCenter,
    CheckCircle,
    FiberManualRecord,
    History,
    InfoOutlined,
    LocationOn
} from '@mui/icons-material';
import {
    Box,
    Button,
    Chip,
    Divider,
    Grid,
    InputAdornment,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { registerFingerprint, verifyFingerprint } from '../../service/Biometrics';
import { calculateDistanceMeters, colorPalette, KMFRI_LOCATION } from '../Dashboard';
import AvailableStations from '../util/AvailableStations';

const GEOFENCE_RADIUS_METERS = 500;

// Mock Attendance Data for the last 3 days
const recentAttendance = [
    { date: 'Feb 08, 2026', clockIn: '08:02 AM', clockOut: '04:45 PM', status: 'Present' },
    { date: 'Feb 07, 2026', clockIn: '07:55 AM', clockOut: '05:02 PM', status: 'Present' },
    { date: 'Feb 06, 2026', clockIn: '08:15 AM', clockOut: '04:30 PM', status: 'Present' },
];

const DashboardContent = ({
    currentTime,
    isCheckedIn,
    setIsCheckedIn,
    userLocation,
    setUserLocation,
    isWithinGeofence,
    setIsWithinGeofence
}) => {
    const [selectedStation, setSelectedStation] = useState(AvailableStations[0]);

    const [buttonState, setButtonState] = useState({
        label: 'CLOCK IN',
        enabled: true,
    });


    // Biometrics
    const [biometricRegistered, setBiometricRegistered] = useState(false);
    const [biometricVerified, setBiometricVerified] = useState(false);
    const [biometricLoading, setBiometricLoading] = useState(false);


    useEffect(() => {
        setButtonState({
            label: isCheckedIn ? 'CLOCK OUT' : 'CLOCK IN',
            enabled: true,
        });
    }, [isCheckedIn]);

    const requestLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by this browser.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ latitude, longitude });
                const distance = calculateDistanceMeters(latitude, longitude, KMFRI_LOCATION.lat, KMFRI_LOCATION.lng);
                setIsWithinGeofence(distance <= GEOFENCE_RADIUS_METERS);

            },
            () => alert('Location access denied. Please enable GPS.'),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };


    const handleRegisterFingerprint = async () => {
        try {
            setBiometricLoading(true);
            await registerFingerprint();
            setBiometricRegistered(true);
            alert("✅ Fingerprint registered successfully");
        } catch (err) {
            alert(err);
        } finally {
            setBiometricLoading(false);
        }
    };

    const handleVerifyFingerprint = async () => {
        try {
            setBiometricLoading(true);
            await verifyFingerprint();
            setBiometricVerified(true);
            alert("✅ Fingerprint verified");
        } catch (err) {
            alert(err);
        } finally {
            setBiometricLoading(false);
        }
    };






    const handleCheckInOut = () => {
        if (!userLocation || !isWithinGeofence) {
            alert('📍 Please verify your location first.');
            return;
        }
        setIsCheckedIn(prev => !prev);
    };

    return (
        <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>

            {/* 1. CLOCKING INSTRUCTIONS (Immediate Top) */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 4, bgcolor: `${colorPalette.oceanBlue}10`, border: `1px dashed ${colorPalette.oceanBlue}` }}>
                <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                    <InfoOutlined color="primary" />
                    <Typography variant="subtitle1" fontWeight={800} color={colorPalette.deepNavy}>
                        How to Clock In/Out
                    </Typography>
                </Stack>
                <Grid container spacing={2}>
                    {[
                        "Select your assigned station from the dropdown.",
                        "Click 'Verify Location' to confirm you are within KMFRI premises.",
                        "Once verified, You can now clock In to record your attendance.",
                        "Once verified, You can now clock out to mark end of shift.",
                    ].map((step, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <Stack direction="row" spacing={1}>
                                <Typography fontWeight={900} color={colorPalette.oceanBlue}>{index + 1}.</Typography>
                                <Typography variant="body2" color="text.secondary">{step}</Typography>
                            </Stack>
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            <Grid container spacing={3}>
                {/* 2. MAIN CLOCK CARD */}
                <Grid item xs={12} lg={7}>
                    <Stack spacing={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 3, md: 4 },
                                borderRadius: 5,
                                background: colorPalette.oceanGradient,
                                color: 'white',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 8px 32px rgba(10, 61, 98, 0.2)'
                            }}
                        >
                            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={4}>
                                <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                                    <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 900, letterSpacing: 1.5 }}>
                                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </Typography>
                                    <Typography variant="h2" fontWeight="900" sx={{ fontSize: { xs: '3.5rem', md: '4.5rem' } }}>
                                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Typography>

                                    <Stack direction="row" spacing={1} mt={2} justifyContent={{ xs: 'center', md: 'flex-start' }}>
                                        <Chip
                                            icon={<LocationOn sx={{ color: 'white !important' }} />}
                                            label={userLocation ? (isWithinGeofence ? 'Verified, within KMFRI Premises' : 'You\'re Outside KMFRI Premises') : 'Your location is not yet Verified'}
                                            sx={{ bgcolor: isWithinGeofence ? 'rgba(0,200,83,0.3)' : 'rgba(255,82,82,0.3)', color: 'white', fontWeight: 700 }}
                                        />
                                        {isCheckedIn && (
                                            <Chip icon={<CheckCircle sx={{ color: 'white !important' }} />} label="Active" sx={{ bgcolor: colorPalette.seafoamGreen, color: 'white', fontWeight: 700 }} />
                                        )}
                                    </Stack>
                                </Box>

                                <Stack spacing={2} sx={{ width: { xs: '100%', md: '280px' } }}>
                                    {biometricRegistered && biometricVerified && (
                                        <TextField
                                            select
                                            fullWidth
                                            label="Clocking Station"
                                            value={selectedStation.name}
                                            onChange={(e) => setSelectedStation(AvailableStations.find(s => s.name === e.target.value))}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <BusinessCenter sx={{ color: 'white' }} />
                                                    </InputAdornment>
                                                )
                                            }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    color: 'white',
                                                    borderRadius: 3,
                                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                                                    '&:hover fieldset': { borderColor: 'white' },
                                                    '&.Mui-focused fieldset': { borderColor: colorPalette.aquaVibrant }
                                                },
                                                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.8)' }
                                            }}
                                        >
                                            {AvailableStations.map((option) => (
                                                <MenuItem key={option.name} value={option.name}>{option.name}</MenuItem>
                                            ))}
                                        </TextField>
                                    )}



                                    {!userLocation || !isWithinGeofence ? (
                                        /* LOCATION NOT VERIFIED */
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            startIcon={<LocationOn />}
                                            onClick={requestLocation}
                                            sx={{
                                                color: 'white',
                                                borderColor: 'white',
                                                py: 1.5,
                                                borderRadius: 3,
                                                fontWeight: 800,
                                            }}
                                        >
                                            Verify Location
                                        </Button>
                                    ) : !biometricRegistered ? (
                                        /* 🔐 BIOMETRIC REGISTRATION */
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                borderRadius: 3,
                                                bgcolor: 'rgba(255,255,255,0.15)',
                                                border: '1px dashed rgba(255,255,255,0.6)',
                                            }}
                                        >
                                            <Stack spacing={1.5} alignItems="center" textAlign="center">
                                                <Typography fontWeight={900}>
                                                    🔐 Fingerprint Required 
                                                </Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                                    For security and attendance integrity, KMFRI requires all staff
                                                    to register their fingerprint before clocking in.
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    disabled={biometricLoading}
                                                    onClick={handleRegisterFingerprint}
                                                    sx={{
                                                        bgcolor: colorPalette.seafoamGreen,
                                                        color: 'white',
                                                        fontWeight: 900,
                                                        borderRadius: 3,
                                                    }}
                                                >
                                                    Register Fingerprint  
                                                </Button>
                                            </Stack>
                                        </Paper>
                                    ) : !biometricVerified ? (
                                        /* 🧬 VERIFY FINGERPRINT */
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            disabled={biometricLoading}
                                            onClick={handleVerifyFingerprint}
                                            sx={{
                                                bgcolor: colorPalette.coralSunset,
                                                color: 'white',
                                                py: 1.5,
                                                borderRadius: 3,
                                                fontWeight: 900,
                                            }}
                                        >
                                            Scan Fingerprint
                                        </Button>
                                    ) : (
                                        /* ✅ CLOCK IN / OUT */
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            onClick={handleCheckInOut}
                                            sx={{
                                                bgcolor: isCheckedIn
                                                    ? colorPalette.seafoamGreen
                                                    : colorPalette.aquaVibrant,
                                                color: isCheckedIn ? 'white' : colorPalette.deepNavy,
                                                py: 1.5,
                                                borderRadius: 3,
                                                fontWeight: 900,
                                                fontSize: '1rem',
                                            }}
                                        >
                                            {buttonState.label}
                                        </Button>
                                    )}


                                </Stack>
                            </Stack>
                        </Paper>

                        {/* 3. RECENT ATTENDANCE (Below the Card) */}
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                                <History sx={{ color: colorPalette.deepNavy }} />
                                <Typography variant="h6" fontWeight={800} color={colorPalette.deepNavy}>
                                    Recent Attendance (Last 3 Days)
                                </Typography>
                            </Stack>
                            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: `1px solid ${colorPalette.softGray}` }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: colorPalette.softGray }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>In</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Out</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {recentAttendance.map((row) => (
                                            <TableRow key={row.date} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                <TableCell sx={{ fontWeight: 600 }}>{row.date}</TableCell>
                                                <TableCell>{row.clockIn}</TableCell>
                                                <TableCell>{row.clockOut}</TableCell>
                                                <TableCell>
                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                        <FiberManualRecord sx={{ fontSize: 10, color: colorPalette.seafoamGreen }} />
                                                        <Typography variant="body2" fontWeight={700}>{row.status}</Typography>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Stack>
                </Grid>

                {/* 4. STATS SUMMARY (Side) */}
                <Grid item xs={12} lg={5} mt={2}>
                    <Stack spacing={2} direction={'row'}>
                        <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'white', border: `1px solid ${colorPalette.softGray}` }}>
                            <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>THIS MONTH'S SUMMARY</Typography>
                            <Divider sx={{ my: 2 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="h4" fontWeight={900} color={colorPalette.oceanBlue}>22</Typography>
                                    <Typography variant="caption" fontWeight={700}>Days Present</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="h4" fontWeight={900} color={colorPalette.coralSunset}>01</Typography>
                                    <Typography variant="caption" fontWeight={700}>Days Absent</Typography>
                                </Grid>
                            </Grid>
                        </Paper>

                        <Paper sx={{ p: 3, borderRadius: 4, background: colorPalette.freshGradient, color: 'white' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography fontWeight={700} sx={{ opacity: 0.9 }}>Weekly Progress</Typography>
                                    <Typography variant="h5" fontWeight={900}>42.5 Hours</Typography>
                                </Box>
                                <AccessTime sx={{ fontSize: 40, opacity: 0.5 }} />
                            </Stack>
                        </Paper>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardContent;