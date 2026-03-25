import {
    Analytics,
    ArrowBack,
    CheckCircle, Close,
    Email, Fingerprint,
    LocationOn, Lock,
    Phone,
    Schedule, Security,
    Visibility, VisibilityOff
} from '@mui/icons-material';
import {
    Alert, AppBar,
    Box, Button, Card, Chip, CircularProgress,
    Container, Divider, Grid, IconButton, InputAdornment,
    Snackbar, Stack, TextField, Toolbar,
    Typography, useMediaQuery, useTheme
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import KMFRILogo from '../assets/kmfri.png';
import { updateUserCurrentDeviceRedux } from '../redux/CurrentDevice';
import { updateUserCurrentUserRedux } from '../redux/CurrentUser';
import { fetchMyDevices } from '../service/DeviceService';
import { requestPasswordReset, resetPassword } from '../service/ResetPasswordService';
import { loginStaff, loginUser } from './auth/Login';
import coreDataDetails from './CoreDataDetails';

const { colorPalette } = coreDataDetails;

/* ══ GLASS DESIGN TOKENS ═══════════════════════════════════════════════════ */
const G = {
    meshBg: `
        radial-gradient(ellipse at 12% 18%, rgba(0,130,190,0.52) 0%, transparent 46%),
        radial-gradient(ellipse at 80% 10%, rgba(0,55,115,0.62) 0%, transparent 40%),
        radial-gradient(ellipse at 58% 78%, rgba(0,110,155,0.42) 0%, transparent 50%),
        radial-gradient(ellipse at 3%  88%, rgba(8,44,82,0.56)  0%, transparent 38%),
        radial-gradient(ellipse at 94% 85%, rgba(0,185,175,0.24) 0%, transparent 36%),
        linear-gradient(158deg, #051c30 0%, #09355a 38%, #073a52 68%, #052840 100%)
    `,
    surface: {
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px) saturate(170%)',
        WebkitBackdropFilter: 'blur(20px) saturate(170%)',
        border: '1px solid rgba(255,255,255,0.16)',
        boxShadow: '0 8px 32px rgba(6,28,50,0.30), inset 0 1px 0 rgba(255,255,255,0.14)',
        willChange: 'transform',
    },
    surfaceHover: {
        background: 'rgba(255,255,255,0.14)',
        boxShadow: '0 20px 52px rgba(6,28,50,0.38), 0 0 0 1px rgba(255,255,255,0.22)',
    },
    surfaceStrong: {
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(28px) saturate(190%)',
        WebkitBackdropFilter: 'blur(28px) saturate(190%)',
        border: '1px solid rgba(255,255,255,0.20)',
        boxShadow: '0 16px 48px rgba(6,28,50,0.36), inset 0 1px 0 rgba(255,255,255,0.18)',
        willChange: 'transform',
    },
    nav: {
        background: 'rgba(5,24,46,0.70)',
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        borderBottom: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 4px 28px rgba(0,0,0,0.22)',
        willChange: 'transform',
    },
    ghostBtn: {
        background: 'rgba(255,255,255,0.10)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.26)',
        color: '#fff',
        willChange: 'transform',
    },
    formCard: {
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(44px) saturate(220%)',
        WebkitBackdropFilter: 'blur(44px) saturate(220%)',
        border: '1px solid rgba(255,255,255,0.60)',
        boxShadow: '0 32px 80px rgba(6,28,50,0.30), inset 0 1px 0 rgba(255,255,255,0.70)',
        willChange: 'transform, opacity',
    },
    glassInput: {
        '& .MuiOutlinedInput-root': {
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.35)' },
            '&.Mui-focused fieldset': { borderColor: 'rgba(0,220,255,0.75)', borderWidth: 2 },
        },
        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.52)' },
        '& .MuiInputLabel-root.Mui-focused': { color: '#00e5ff' },
        '& .MuiInputAdornment-root svg': { color: 'rgba(255,255,255,0.42)' },
        '& .MuiFormHelperText-root.Mui-error': { color: '#ff8a80' },
        willChange: 'transform, opacity',
    },
    lightInput: {
        '& .MuiOutlinedInput-root': {
            borderRadius: '14px',
            background: 'rgba(10,61,98,0.04)',
            '&:hover fieldset': { borderColor: colorPalette.oceanBlue },
            '&.Mui-focused fieldset': { borderColor: colorPalette.oceanBlue, borderWidth: 2 },
        },
    },
};


/* ══ AMBIENT ORBS ══════════════════════════════════════════════════════════ */
const AmbientOrbs = () => (
    <>
        {[
            { s: 500, t: -100, l: -150, c: 'rgba(0,160,210,0.10)', b: 80 },
            { s: 380, t: '32%', r: -120, c: 'rgba(0,220,255,0.07)', b: 65 },
            { s: 560, bot: -180, l: '18%', c: 'rgba(8,44,80,0.20)', b: 90 },
            { s: 280, t: '52%', l: '52%', c: 'rgba(0,190,165,0.09)', b: 55 },
        ].map(({ s, t, l, r, bot, c, b }, i) => (
            <Box key={i} sx={{
                position: 'absolute', width: s, height: s, pointerEvents: 'none', zIndex: 0,
                top: t, left: l, right: r, bottom: bot, borderRadius: '50%', background: c, filter: `blur(${b}px)`,
                willChange: 'transform',
            }} />
        ))}
    </>
);



/* ══ SIGN IN CARD ═══════════════════════════════════════════════════════════ */
const SignInCard = ({ onBack, onSwitchToSignup }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [openSnack, setOpenSnack] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [currentView, setCurrentView] = useState('role-select'); // 'role-select', 'signin', 'reset'
    const [selectedRole, setSelectedRole] = useState(null); // 'staff' or 'intern'
    const [resetPasswordEmail, setResetPasswordEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetPasswordErrors, setResetPasswordErrors] = useState('');
    const [resetPasswordProcessing, setResetPasswordProcessing] = useState(false);
    const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);
    const [passwordChanged, setPasswordChanged] = useState(false);
    const [hasPendingReset, setHasPendingReset] = useState(false);
    const [isPasswordChangeEnabled, setIsPasswordChangeEnabled] = useState(false);
    const dispatch = useDispatch();
    const recentStation = localStorage.getItem('recent_station');

    const [formData, setFormData] = useState({ email: '', userId: '', password: '' });
    const [errors, setErrors] = useState({});

    const handle = field => e => {
        setFormData(p => ({ ...p, [field]: e.target.value }));
        if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
    };

    const validateStaff = () => {
        const e = {};
        if (!formData.userId) e.userId = 'User ID is required';
        if (!formData.password) e.password = 'Password is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateIntern = () => {
        const e = {};
        if (!formData.email) e.email = 'Email is required';
        if (!formData.password) e.password = 'Password is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleLoginStaff = async () => {
        if (!validateStaff()) return;
        setProcessing(true);
        try {
            const user = await loginStaff(formData.userId, formData.password);
            dispatch(updateUserCurrentUserRedux(user));
            const devices = await fetchMyDevices()
            dispatch(updateUserCurrentDeviceRedux(devices))
            setOpenSnack(true);
        } catch (err) { alert(err); }
        finally { setProcessing(false); }
    };

    const handleLoginIntern = async () => {
        if (!validateIntern()) return;
        setProcessing(true);
        try {
            const user = await loginUser(formData.email, formData.password);
            dispatch(updateUserCurrentUserRedux(user));
            const devices = await fetchMyDevices()
            dispatch(updateUserCurrentDeviceRedux(devices))
            setOpenSnack(true);
        } catch (err) { alert(err); }
        finally { setProcessing(false); }
    };

    const selectRole = (role) => {
        setSelectedRole(role);
        setCurrentView('signin');
        setFormData({ email: '', userId: '', password: '' });
        setErrors({});
    };

    const switchToResetPassword = () => {
        setCurrentView('reset');
        setResetPasswordEmail('');
        setNewPassword('');
        setConfirmPassword('');
        setResetPasswordErrors('');
        setHasPendingReset(false);
        setIsPasswordChangeEnabled(false);
    };

    const switchToSignin = () => {
        setCurrentView('role-select');
        setSelectedRole(null);
        setResetPasswordEmail('');
        setNewPassword('');
        setConfirmPassword('');
        setResetPasswordErrors('');
        setHasPendingReset(false);
        setIsPasswordChangeEnabled(false);
        setFormData({ email: '', userId: '', password: '' });
    };

    const handleResetPasswordSubmit = async () => {
        if (!resetPasswordEmail.trim()) {
            setResetPasswordErrors('Email is required');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(resetPasswordEmail)) {
            setResetPasswordErrors('Please enter a valid email');
            return;
        }

        setResetPasswordProcessing(true);
        try {
            const response = await requestPasswordReset(resetPasswordEmail);

            if (response?.status === 'approved') {
                setIsPasswordChangeEnabled(true);
                setResetPasswordErrors('');
                setResetPasswordSuccess(false);
                return;
            }

            if (response?.status === 'pending') {
                setHasPendingReset(true);
                setIsPasswordChangeEnabled(false);
                setResetPasswordErrors('');
                return;
            }

            if (response?.status === 'requested') {
                setHasPendingReset(true);
                setResetPasswordSuccess(true);
                setResetPasswordErrors('');
                setTimeout(() => setResetPasswordSuccess(false), 3500);
                return;
            }

            setResetPasswordSuccess(true);
            setResetPasswordErrors('');
            setTimeout(() => setResetPasswordSuccess(false), 3500);
        } catch (err) {
            setResetPasswordErrors((err?.message || err?.toString() || 'Password reset request failed').toString());
        } finally {
            setResetPasswordProcessing(false);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword.trim() || !confirmPassword.trim()) {
            setResetPasswordErrors('Both password fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            setResetPasswordErrors('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setResetPasswordErrors('New password must be at least 6 characters');
            return;
        }

        setResetPasswordProcessing(true);
        try {
            await resetPassword(resetPasswordEmail, newPassword);
            setPasswordChanged(true);
            setIsPasswordChangeEnabled(false);
            setTimeout(() => setPasswordChanged(false), 4000);
            switchToSignin();
        } catch (err) {
            setResetPasswordErrors((err?.message || err?.toString() || 'Failed to change password').toString());
        } finally {
            setResetPasswordProcessing(false);
        }
    };

    const handleCloseSnack = (_, reason) => {
        if (reason === 'clickaway') return;
        setOpenSnack(false);
        window.location.reload();
    };

    const handleCloseResetSnack = (_, reason) => {
        if (reason === 'clickaway') return;
        setResetPasswordSuccess(false);
    };

    return (
        <motion.div
            style={{ willChange: 'transform, opacity' }}
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.97 }}
            transition={{ duration: 0.44, ease: [0.4, 0, 0.2, 1] }}>
            <Card elevation={0} sx={{ ...G.formCard, p: { xs: 3, md: 4.5 }, maxWidth: { xs: '100%', sm: 480 }, width: '100%', mx: 'auto', borderRadius: '28px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: -1 }}>
                    <IconButton onClick={currentView === 'role-select' ? onBack : switchToSignin} size="small" sx={{ background: 'rgba(10,61,98,0.07)', border: '1px solid rgba(10,61,98,0.12)', '&:hover': { background: 'rgba(10,61,98,0.13)' } }}>
                        {!selectedRole ? <Close sx={{ fontSize: 18, color: colorPalette.deepNavy }} /> : <ArrowBack sx={{ fontSize: 18, color: colorPalette.deepNavy }} />}
                    </IconButton>
                </Box>

                {currentView === 'role-select' ? (
                    <>
                        <Box sx={{ textAlign: 'center', mb: 3.5 }}>
                            <Box sx={{ width: 76, height: 76, borderRadius: '50%', background: colorPalette.oceanGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, boxShadow: `0 10px 32px ${colorPalette.oceanBlue}42` }}>
                                <Lock sx={{ fontSize: 38, color: '#fff' }} />
                            </Box>
                            <Typography variant="h4" fontWeight={900}
                                sx={{ background: colorPalette.oceanGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 0.75 }}>
                                Sign In
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                Select your account to continue
                            </Typography>
                        </Box>
                        <Stack spacing={2}>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                                <Box
                                    onClick={() => selectRole('staff')}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: '16px',
                                        background: 'rgba(59, 130, 246, 0.08)',
                                        border: '2px solid rgba(59, 130, 246, 0.3)',
                                        cursor: 'pointer',
                                        transition: 'all 0.24s ease',
                                        '&:hover': {
                                            background: 'rgba(59, 130, 246, 0.15)',
                                            borderColor: 'rgba(59, 130, 246, 0.6)',
                                            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.20)',
                                        }
                                    }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Box sx={{
                                            width: 50,
                                            height: 50,
                                            borderRadius: '12px',
                                            background: 'rgba(59, 130, 246, 0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#3b82f6',
                                        }}>
                                            <Lock sx={{ fontSize: 24 }} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" fontWeight={800} sx={{ color: colorPalette.deepNavy }}>
                                                Staff
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                               Sign in with your staff credentials
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                                <Box
                                    onClick={() => selectRole('intern')}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: '16px',
                                        background: 'rgba(34, 197, 94, 0.08)',
                                        border: '2px solid rgba(34, 197, 94, 0.3)',
                                        cursor: 'pointer',
                                        transition: 'all 0.24s ease',
                                        '&:hover': {
                                            background: 'rgba(34, 197, 94, 0.15)',
                                            borderColor: 'rgba(34, 197, 94, 0.6)',
                                            boxShadow: '0 8px 24px rgba(34, 197, 94, 0.20)',
                                        }
                                    }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Box sx={{
                                            width: 50,
                                            height: 50,
                                            borderRadius: '12px',
                                            background: 'rgba(34, 197, 94, 0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#22c55e',
                                        }}>
                                            <Email sx={{ fontSize: 24 }} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" fontWeight={800} sx={{ color: colorPalette.deepNavy }}>
                                                Intern / Attache
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                Sign in with email & password
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            </motion.div>
                        </Stack>
                    </>
                ) : currentView === 'signin' ? (
                    <>
                        <Box sx={{ textAlign: 'center', mb: 3.5 }}>
                            <Box sx={{ width: 76, height: 76, borderRadius: '50%', background: colorPalette.oceanGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, boxShadow: `0 10px 32px ${colorPalette.oceanBlue}42` }}>
                                <Lock sx={{ fontSize: 38, color: '#fff' }} />
                            </Box>
                            <Typography variant="h4" fontWeight={900}
                                sx={{ background: colorPalette.oceanGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 0.75 }}>
                                Welcome Back
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                {selectedRole === 'staff'
                                    ? 'Sign in with your staff credentials'
                                    : 'Sign in to access your attendance portal'}
                            </Typography>
                        </Box>
                        <Stack spacing={2.5}>
                            {selectedRole === 'staff' ? (
                                <>
                                    <TextField fullWidth label="User ID" placeholder="Enter User ID"
                                        value={formData.userId} onChange={handle('userId')} error={!!errors.userId} helperText={errors.userId}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }}
                                        sx={G.lightInput} />
                                    <TextField fullWidth label="Password" placeholder="Enter your password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password} onChange={handle('password')} error={!!errors.password} helperText={errors.password}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Lock sx={{ color: colorPalette.oceanBlue }} /></InputAdornment>,
                                            endAdornment: <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(p => !p)} edge="end">
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>,
                                        }} sx={G.lightInput} />
                                    {recentStation && (
                                        <Stack direction="row" alignItems="center" spacing={0.6}>
                                            <LocationOn sx={{ color: colorPalette.seafoamGreen, fontSize: 17 }} />
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                Recent Station: {recentStation}
                                            </Typography>
                                        </Stack>
                                    )}
                                    <Button variant="contained" fullWidth disabled={processing} onClick={handleLoginStaff}
                                        startIcon={processing ? <CircularProgress size={16} sx={{ color: 'rgba(255,255,255,0.7)' }} /> : <Lock />}
                                        sx={{ background: colorPalette.oceanGradient, py: 1.75, borderRadius: '14px', fontWeight: 800, fontSize: '0.92rem', textTransform: 'none', letterSpacing: 0.35, boxShadow: `0 8px 28px ${colorPalette.oceanBlue}42`, transition: 'all 0.24s ease', '&:hover': { boxShadow: `0 14px 36px ${colorPalette.oceanBlue}5a`, transform: 'translateY(-2px)' } }}>
                                        {processing ? 'Authenticating…' : 'Sign In to Portal'}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <TextField fullWidth label="Email Address" placeholder="example@kmfri.go.ke"
                                        value={formData.email} onChange={handle('email')} error={!!errors.email} helperText={errors.email}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }}
                                        sx={G.lightInput} />
                                    <TextField fullWidth label="Password" placeholder="Enter your password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password} onChange={handle('password')} error={!!errors.password} helperText={errors.password}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Lock sx={{ color: colorPalette.oceanBlue }} /></InputAdornment>,
                                            endAdornment: <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(p => !p)} edge="end">
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>,
                                        }} sx={G.lightInput} />
                                    {recentStation && (
                                        <Stack direction="row" alignItems="center" spacing={0.6}>
                                            <LocationOn sx={{ color: colorPalette.seafoamGreen, fontSize: 17 }} />
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                Recent Station: {recentStation}
                                            </Typography>
                                        </Stack>
                                    )}
                                    <Button variant="contained" fullWidth disabled={processing} onClick={handleLoginIntern}
                                        startIcon={processing ? <CircularProgress size={16} sx={{ color: 'rgba(255,255,255,0.7)' }} /> : <Lock />}
                                        sx={{ background: colorPalette.oceanGradient, py: 1.75, borderRadius: '14px', fontWeight: 800, fontSize: '0.92rem', textTransform: 'none', letterSpacing: 0.35, boxShadow: `0 8px 28px ${colorPalette.oceanBlue}42`, transition: 'all 0.24s ease', '&:hover': { boxShadow: `0 14px 36px ${colorPalette.oceanBlue}5a`, transform: 'translateY(-2px)' } }}>
                                        {processing ? 'Please wait…' : 'Sign In to Portal'}
                                    </Button>
                                </>
                            )}

                            {selectedRole !== 'staff' && <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Forgot password?
                                </Typography>
                                <Button variant="text" onClick={switchToResetPassword}
                                    sx={{ color: colorPalette.oceanBlue, fontWeight: 700, textTransform: 'none', p: 0, minWidth: 'auto', fontSize: '0.875rem', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
                                    Reset here
                                </Button>
                            </Box>}


                        </Stack>
                    </>
                ) : (
                    <>
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <Box sx={{
                                width: 68, height: 68, borderRadius: '50%', background: 'rgba(255,152,0,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
                                border: '2px solid rgba(255,152,0,0.25)'
                            }}>
                                <Lock sx={{ fontSize: 34, color: 'rgb(255,152,0)' }} />
                            </Box>
                            <Typography variant="h5" fontWeight={900} sx={{ mb: 1, color: colorPalette.deepNavy }}>
                                Reset Password
                            </Typography>
                            {isPasswordChangeEnabled ? <Typography variant="body2" color="success" sx={{ lineHeight: 1.6, bgcolor: 'rgba(72,201,176,0.12)', display: 'inline-block', px: 1.5, py: 0.5, borderRadius: 1 }}>
                                Your password reset request is approved. Kindly, fill in your new password and confirm to change your password.
                            </Typography> : <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                Enter your registered email address. Your admin will need to approve your password reset request before you can proceed.
                            </Typography>}

                        </Box>

                        <Stack spacing={2.5}>
                            {isPasswordChangeEnabled ? (
                                <>
                                    <TextField fullWidth label="New Password" placeholder="Enter new password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                        error={!!resetPasswordErrors} helperText=""
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Lock sx={{ color: colorPalette.oceanBlue }} /></InputAdornment>,
                                            endAdornment: <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(p => !p)} edge="end">
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>,
                                        }} sx={G.lightInput} />

                                    <TextField fullWidth label="Confirm Password" placeholder="Confirm new password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                        error={!!resetPasswordErrors} helperText={resetPasswordErrors}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Lock sx={{ color: colorPalette.oceanBlue }} /></InputAdornment>,
                                            endAdornment: <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(p => !p)} edge="end">
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>,
                                        }} sx={G.lightInput} />

                                    <Button variant="contained" fullWidth onClick={handleChangePassword}
                                        disabled={resetPasswordProcessing}
                                        startIcon={resetPasswordProcessing ? <CircularProgress size={16} sx={{ color: 'rgba(255,255,255,0.7)' }} /> : <Lock />}
                                        sx={{
                                            background: 'linear-gradient(135deg, rgb(255,152,0) 0%, rgb(255,109,0) 100%)',
                                            py: 1.5, borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem',
                                            textTransform: 'none', letterSpacing: 0.3, boxShadow: '0 6px 20px rgba(255,152,0,0.3)',
                                            transition: 'all 0.24s ease', '&:hover': {
                                                boxShadow: '0 10px 28px rgba(255,152,0,0.4)',
                                                transform: 'translateY(-2px)'
                                            }
                                        }}>
                                        {resetPasswordProcessing ? 'Updating...' : 'Change Password'}
                                    </Button>


                                </>
                            ) : (
                                <>
                                    <TextField fullWidth label="Registered Email" placeholder="example@kmfri.go.ke"
                                        value={resetPasswordEmail} onChange={e => {
                                            setResetPasswordEmail(e.target.value);
                                            if (resetPasswordErrors) setResetPasswordErrors('');
                                            if (hasPendingReset) setHasPendingReset(false);
                                        }}
                                        error={!!resetPasswordErrors} helperText={resetPasswordErrors}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">
                                                <Email sx={{ color: colorPalette.oceanBlue }} />
                                            </InputAdornment>
                                        }}
                                        sx={G.lightInput} disabled={resetPasswordProcessing || hasPendingReset} />

                                    {hasPendingReset ? (
                                        <Box sx={{
                                            backgroundColor: 'rgba(255,152,0,0.08)',
                                            border: '1.5px solid rgb(255,152,0)',
                                            borderRadius: '12px',
                                            p: 2.5,
                                            textAlign: 'center'
                                        }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'rgb(255,152,0)', mb: 1 }}>
                                                Pending Password Reset
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                                                You already have a pending password reset request. Please contact your admin or visit the admin office at your station for approval.
                                            </Typography>
                                            <Button fullWidth variant="outlined" onClick={switchToSignin}
                                                sx={{ mt: 2, color: 'rgb(255,152,0)', borderColor: 'rgb(255,152,0)', '&:hover': { backgroundColor: 'rgba(255,152,0,0.08)' } }}>
                                                Back to Sign In
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Button variant="contained" fullWidth onClick={handleResetPasswordSubmit}
                                            disabled={resetPasswordProcessing}
                                            startIcon={resetPasswordProcessing ? <CircularProgress size={16} sx={{ color: 'rgba(255,255,255,0.7)' }} /> : <Lock />}
                                            sx={{
                                                background: 'linear-gradient(135deg, rgb(255,152,0) 0%, rgb(255,109,0) 100%)',
                                                py: 1.5, borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem',
                                                textTransform: 'none', letterSpacing: 0.3, boxShadow: '0 6px 20px rgba(255,152,0,0.3)',
                                                transition: 'all 0.24s ease', '&:hover': {
                                                    boxShadow: '0 10px 28px rgba(255,152,0,0.4)',
                                                    transform: 'translateY(-2px)'
                                                }
                                            }}>
                                            {resetPasswordProcessing ? 'Requesting...' : 'Request Password Reset'}
                                        </Button>
                                    )}

                                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', lineHeight: 1.6, fontSize: '0.75rem' }}>
                                        {hasPendingReset
                                            ? 'Status checked successfully'
                                            : 'Next steps: Your admin will review your request and approve the reset. You\'ll be notified once approved.'
                                        }
                                    </Typography>

                                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                        <Button variant="text" onClick={switchToSignin}
                                            sx={{ color: colorPalette.oceanBlue, fontWeight: 700, textTransform: 'none', fontSize: '0.875rem', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
                                            ← Back to Sign In
                                        </Button>
                                    </Box>
                                </>
                            )}
                        </Stack>
                    </>
                )}
            </Card>

            <Snackbar open={openSnack} autoHideDuration={1200} onClose={handleCloseSnack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnack} severity="success" icon={<CheckCircle />}
                    sx={{ borderRadius: '14px', fontWeight: 700, backdropFilter: 'blur(16px)', boxShadow: '0 8px 28px rgba(72,201,176,0.32)' }}>
                    ✓ Login successful!
                </Alert>
            </Snackbar>

            <Snackbar open={resetPasswordSuccess || passwordChanged} autoHideDuration={3000} onClose={handleCloseResetSnack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseResetSnack} severity="success" icon={<CheckCircle />}
                    sx={{ borderRadius: '14px', fontWeight: 500, backdropFilter: 'blur(16px)', boxShadow: '0 8px 28px rgba(76,175,80,0.32)' }}>
                    {resetPasswordSuccess ? 'Password reset request submitted!' : passwordChanged ? 'Password changed successfully!' : ''}
                </Alert>
            </Snackbar>
        </motion.div>
    );
};

/* ══ NAV BAR ════════════════════════════════════════════════════════════════ */
const EnhancedNavbar = ({ onNavigate, currentView }) => {
    const theme = useTheme();
    const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

    return (
        <AppBar position="fixed" elevation={0} sx={{ ...G.nav }}>
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ py: 0.8 }}>
                    <Box onClick={() => onNavigate('landing')} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 2, cursor: 'pointer' }}>
                        <Box component="img" src={KMFRILogo} alt="KMFRI"
                            sx={{ height: { xs: 42, md: 48 }, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid rgba(255,255,255,0.22)', boxShadow: '0 4px 16px rgba(0,0,0,0.28)' }} />
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography noWrap fontWeight={800} onClick={() => onNavigate('landing')}
                            sx={{ fontSize: { xs: '0.88rem', md: '1rem' }, letterSpacing: 0.35, color: '#fff', cursor: 'pointer', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                            {isMdUp ? 'Kenya Marine and Fisheries Research Institute'.toUpperCase() : 'KMFRI Attendance'.toUpperCase()}
                        </Typography>
                        {isMdUp && <Typography variant="caption" sx={{ opacity: 0.62, display: 'block', fontWeight: 500, letterSpacing: 0.55 }}>
                            Staff Attendance System</Typography>}
                    </Box>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        {currentView === 'landing' && (
                            <Button variant="outlined" startIcon={<Lock sx={{ fontSize: 15 }} />} onClick={() => onNavigate('signin')}
                                sx={{
                                    display: { xs: 'none', sm: 'flex' }, ...G.ghostBtn, fontWeight: 700, px: 2.5, borderRadius: '12px', textTransform: 'none', fontSize: '0.875rem', transition: 'all 0.22s ease',
                                    '&:hover': { background: 'rgba(0,220,255,0.18)', borderColor: '#00e5ff', color: '#00e5ff', transform: 'translateY(-1px)' }
                                }}>
                                Sign In
                            </Button>
                        )}

                    </Stack>
                </Toolbar>
            </Container>
        </AppBar>
    );
};


/* ══ LANDING PAGE ═══════════════════════════════════════════════════════════ */
const EnhancedLandingPage = () => {
    const [view, setView] = useState('landing');

    return (
        <Box sx={{ minHeight: '100vh', background: G.meshBg, position: 'relative' }}>
            <EnhancedNavbar onNavigate={setView} currentView={view} />
            <AnimatePresence mode="wait">

                {/* ══ LANDING ══ */}
                {view === 'landing' && (
                    <motion.div style={{ willChange: 'transform, opacity' }} key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.42 }}>

                        {/* Hero */}
                        <Box sx={{ pt: { xs: 13, md: 18 }, pb: { xs: 5, md: 12 }, position: 'relative', overflow: 'hidden' }}>
                            <AmbientOrbs />
                            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                                <Grid container spacing={5} alignItems="center">
                                    <Grid item xs={12} md={6}>
                                        <motion.div style={{ willChange: 'transform, opacity' }} initial={{ opacity: 0, x: -44 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.75 }}>
                                            <Chip label="Digital Attendance Platform" size="small"
                                                sx={{ background: 'rgba(0,220,255,0.12)', backdropFilter: 'blur(8px)', color: '#00e5ff', fontWeight: 700, border: '1px solid rgba(0,220,255,0.26)', mb: 2.5, px: 1, fontSize: '0.72rem' }} />
                                            <Typography variant={'h5'} fontWeight={900}
                                                sx={{ color: '#fff', mb: 2, lineHeight: 1.16, textShadow: '0 4px 18px rgba(0,0,0,0.24)' }}>
                                                <Box component="span" sx={{ color: '#00e5ff', display: 'block' }}>
                                                    KMFRI STAFF ATTENDANCE SYSTEM
                                                </Box>
                                            </Typography>
                                            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.80)', mb: 4.5, fontWeight: 400, lineHeight: 1.7, maxWidth: 520 }}>
                                                A unified digital platform for synchronized clocking and reporting for all our employees, interns, and attaches.                                            </Typography>
                                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                                <Button variant="contained" size="large" startIcon={<Lock />} onClick={() => setView('signin')}
                                                    sx={{ bgcolor: '#00e5ff', color: colorPalette.deepNavy, fontWeight: 800, px: 4, py: 1.75, borderRadius: '14px', textTransform: 'none', fontSize: '1rem', boxShadow: '0 8px 28px rgba(0,220,255,0.40)', transition: 'all 0.26s ease', '&:hover': { bgcolor: '#fff', transform: 'translateY(-2px)', boxShadow: '0 14px 36px rgba(255,255,255,0.26)' } }}>
                                                    Sign In
                                                </Button>
                                            </Stack>
                                        </motion.div>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <motion.div style={{ willChange: 'transform, opacity' }} initial={{ opacity: 0, scale: 0.84 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.75, delay: 0.16 }}>
                                            <Box sx={{ ...G.surfaceStrong, borderRadius: '24px', p: { xs: 3, md: 3.5 } }}>
                                                <Typography variant="subtitle2" fontWeight={900} sx={{ color: 'rgba(255,255,255,0.42)', mb: 2, letterSpacing: 1.3, textTransform: 'uppercase', fontSize: '0.62rem' }}>
                                                    Platform Capabilities
                                                </Typography>
                                                <Stack spacing={1.2}>
                                                    {[
                                                        { icon: <Security />, text: 'Geo-Location Verification', color: colorPalette.seafoamGreen },
                                                        { icon: <Fingerprint />, text: 'Biometric Authentication', color: colorPalette.cyanFresh },
                                                        { icon: <Schedule />, text: 'Digital Attendance Tracking', color: '#00e5ff' },
                                                        { icon: <Analytics />, text: 'System Automated Report Analysis', color: colorPalette.warmSand },
                                                    ].map((item, i) => (
                                                        <motion.div key={i} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.28 + i * 0.08 }}>
                                                            <Box sx={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', p: 1.6, borderRadius: '13px', transition: 'all 0.22s ease', '&:hover': { background: 'rgba(255,255,255,0.12)', transform: 'translateX(5px)', willChange: 'transform', } }}>
                                                                <Box sx={{ p: 0.85, borderRadius: '10px', mr: 1.8, background: `${item.color}1e`, border: `1px solid ${item.color}2e`, color: item.color, display: 'flex', flexShrink: 0 }}>{item.icon}</Box>
                                                                <Typography fontWeight={700} sx={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.875rem' }}>{item.text}</Typography>
                                                            </Box>
                                                        </motion.div>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        </motion.div>
                                    </Grid>
                                </Grid>
                            </Container>
                        </Box>


                        {/* Footer */}
                        <Box sx={{ ...G.surface, borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderBottom: 'none', borderTop: '1px solid rgba(255,255,255,0.09)', py: 7, position: 'relative', zIndex: 1 }}>
                            <Container maxWidth="lg">
                                <Grid container spacing={5}>
                                    <Grid item xs={12} md={4}>
                                        <Stack direction="row" gap={2} alignItems="center" mb={2}>
                                            <Box component="img" src={KMFRILogo} alt="KMFRI" sx={{ height: 50, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }} />
                                            <Box>
                                                <Typography variant="h6" fontWeight={800} sx={{ color: '#fff' }}>KMFRI</Typography>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.46)', fontSize: '0.67rem' }}>Kenya Marine & Fisheries Research Institute</Typography>
                                            </Box>
                                        </Stack>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.56)', lineHeight: 1.76 }}>
                                            Leading marine research and sustainable fisheries development in East Africa since 1979.
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: 'rgba(255,255,255,0.44)', letterSpacing: 1.1, textTransform: 'uppercase', fontSize: '0.67rem' }}>Quick Links</Typography>
                                        <Stack spacing={0.3}>
                                            {['About KMFRI', 'Research Areas', 'Contact Us', 'Help & Support', 'Privacy Policy'].map(link => (
                                                <Button key={link} sx={{ color: 'rgba(255,255,255,0.60)', justifyContent: 'flex-start', textTransform: 'none', fontWeight: 500, fontSize: '0.855rem', py: 0.6, '&:hover': { color: '#00e5ff', bgcolor: 'rgba(255,255,255,0.04)' } }}>{link}</Button>
                                            ))}
                                        </Stack>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: 'rgba(255,255,255,0.44)', letterSpacing: 1.1, textTransform: 'uppercase', fontSize: '0.67rem' }}>Contact</Typography>
                                        <Stack spacing={2}>
                                            {[
                                                { icon: <LocationOn sx={{ fontSize: 17 }} />, text: 'P.O. Box 81651-80100, Mombasa, Kenya' },
                                                { icon: <Email sx={{ fontSize: 17 }} />, text: 'info@kmfri.go.ke' },
                                                { icon: <Phone sx={{ fontSize: 17 }} />, text: '+254 20 2024571' },
                                            ].map(({ icon, text }) => (
                                                <Stack key={text} direction="row" spacing={1.2} alignItems="flex-start">
                                                    <Box sx={{ mt: 0.1, flexShrink: 0, color: '#00e5ff' }}>{icon}</Box>
                                                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.56)', lineHeight: 1.56 }}>{text}</Typography>
                                                </Stack>
                                            ))}
                                        </Stack>
                                    </Grid>
                                </Grid>
                                <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.08)' }} />
                                <Typography variant="body2" sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem' }}>
                                    © {new Date().getFullYear()} Kenya Marine and Fisheries Research Institute. All rights reserved.
                                </Typography>
                            </Container>
                        </Box>
                    </motion.div>
                )}

                {/* ══ AUTH VIEWS ══ */}
                {view !== 'landing' && (
                    <motion.div style={{ willChange: 'transform, opacity' }} key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.38 }}>
                        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', pt: { xs: 10, md: 13 }, pb: { xs: 6, md: 8 }, position: 'relative', overflow: 'hidden' }}>
                            <AmbientOrbs />
                            <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
                                {view === 'signin'
                                    ? <SignInCard key="signin" onBack={() => setView('landing')} onSwitchToSignup={() => setView('signup')} />
                                    : <RegisterStepper key="signup" onBack={() => setView('landing')} onSwitchToSignin={() => setView('signin')} />
                                }
                            </Container>
                        </Box>
                    </motion.div>
                )}


            </AnimatePresence>
        </Box>
    );
};

export default EnhancedLandingPage;