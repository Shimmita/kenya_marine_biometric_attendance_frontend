import {
    ArrowBack,
    CheckCircle, Close,
    Email,
    LocationOn, Lock,
    Phone,
    Visibility, VisibilityOff
} from '@mui/icons-material';
import {
    Alert, AppBar,
    Box, Button, Card,
    CircularProgress,
    Container, Divider, Grid, IconButton, InputAdornment,
    Snackbar, Stack, TextField, Toolbar,
    Typography, useMediaQuery, useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import KenyaArmsLogo from "../images/gov_logo.png";
import KMFRILogo from "../images/kmfri_logo.png";
import { updateUserCurrentDeviceRedux } from '../redux/CurrentDevice';
import { updateUserCurrentUserRedux } from '../redux/CurrentUser';
import { fetchMyDevices } from '../service/DeviceService';
import { requestPasswordReset, resetPassword } from '../service/ResetPasswordService';
import { markSessionStarted } from '../service/SessionTimeout';
import ClockingImage from "./../images/clocking_image_1.png";
import { loginStaff, loginUser } from './auth/Login';
import coreDataDetails from './CoreDataDetails';
import GmailIcon from './custom/Gmail';

const { colorPalette } = coreDataDetails;

/* ══ GLASS DESIGN TOKENS ═══════════════════════════════════════════════════ */
const G = {
    meshBg: `
    radial-gradient(circle at 12% 15%, rgba(0,180,255,.22) 0%, transparent 32%),
    radial-gradient(circle at 85% 12%, rgba(0,92,180,.30) 0%, transparent 34%),
    radial-gradient(circle at 58% 72%, rgba(0,155,190,.18) 0%, transparent 38%),
    radial-gradient(circle at 8% 88%, rgba(8,44,82,.55) 0%, transparent 42%),

    /* Kenya Green */
    radial-gradient(circle at 92% 82%, rgba(0,120,65,.12) 0%, transparent 30%),

    /* Kenya Red */
    radial-gradient(circle at 72% 42%, rgba(180,30,35,.08) 0%, transparent 28%),

    linear-gradient(
        145deg,
        #041627 0%,
        #062848 22%,
        #0A4D74 48%,
        #07576A 72%,
        #052A40 100%
    )
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
            '&:hover fieldset': { borderColor: 'var(--kmfri-secondary)' },
            '&.Mui-focused fieldset': { borderColor: 'var(--kmfri-secondary)', borderWidth: 2 },
        },
    },
    themedPrimaryBtn: {
        background: 'var(--kmfri-gradient)',
        py: 1.75,
        borderRadius: '14px',
        fontWeight: 800,
        fontSize: '0.92rem',
        textTransform: 'none',
        letterSpacing: 0.35,
        boxShadow: '0 10px 28px var(--kmfri-secondary-soft)',
        transition: 'all 0.24s ease',
        '&:hover': {
            boxShadow: '0 16px 38px var(--kmfri-accent-soft)',
            transform: 'translateY(-2px)',
        },
    },
    themedRoleCard: {
        p: 2.5,
        borderRadius: '16px',
        background: 'linear-gradient(135deg, var(--kmfri-primary-soft), var(--kmfri-secondary-soft))',
        border: '2px solid var(--kmfri-secondary-soft)',
        cursor: 'pointer',
        transition: 'all 0.24s ease',
        '&:hover': {
            background: 'linear-gradient(135deg, var(--kmfri-secondary-soft), var(--kmfri-accent-soft))',
            borderColor: 'var(--kmfri-secondary)',
            boxShadow: '0 10px 28px var(--kmfri-secondary-soft)',
        },
    },
};




/* ══ SIGN IN CARD ═══════════════════════════════════════════════════════════ */
const SignInCard = ({ onBack, onSwitchToSignup }) => {
    const navigate = useNavigate();
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
            markSessionStarted();
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
            markSessionStarted();
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
        navigate('/reset-password');
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
            <Card elevation={0} sx={{ ...G.formCard, p: { xs: 3, md: 4 }, maxWidth: { xs: '100%', sm: 480 }, width: '100%', mx: 'auto', borderRadius: '28px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: -1 }}>
                    <IconButton onClick={currentView === 'role-select' ? onBack : switchToSignin} size="small" sx={{ background: 'rgba(10,61,98,0.07)', border: '1px solid rgba(10,61,98,0.12)', '&:hover': { background: 'rgba(10,61,98,0.13)' } }}>
                        {!selectedRole ? <Close sx={{ fontSize: 18, color: colorPalette.deepNavy }} /> : <ArrowBack sx={{ fontSize: 18, color: colorPalette.deepNavy }} />}
                    </IconButton>
                </Box>

                {currentView === 'role-select' ? (
                    <>
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <Box sx={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--kmfri-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, boxShadow: '0 10px 32px var(--kmfri-secondary-soft)' }}>
                                <Lock sx={{ fontSize: 38, color: '#fff' }} />
                            </Box>
                            <Typography variant="h4" fontWeight={900}
                                sx={{ background: 'var(--kmfri-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 0.75 }}>
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
                                        ...G.themedRoleCard,
                                    }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Box sx={{
                                            width: 50,
                                            height: 50,
                                            borderRadius: '12px',
                                            background: 'var(--kmfri-secondary-soft)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--kmfri-secondary)',
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
                                        ...G.themedRoleCard,
                                    }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Box sx={{
                                            width: 50,
                                            height: 50,
                                            borderRadius: '12px',
                                            background: 'var(--kmfri-accent-soft)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--kmfri-accent)',
                                        }}>
                                            <GmailIcon size={24} />
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
                            <Box sx={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--kmfri-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, boxShadow: '0 10px 32px var(--kmfri-secondary-soft)' }}>
                                <Lock sx={{ fontSize: 38, color: '#fff' }} />
                            </Box>
                            <Typography variant="h4" fontWeight={900}
                                sx={{ background: 'var(--kmfri-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 0.75 }}>
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
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'var(--kmfri-secondary)' }} /></InputAdornment> }}
                                        sx={G.lightInput} />
                                    <TextField fullWidth label="Password" placeholder="Enter your password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password} onChange={handle('password')} error={!!errors.password} helperText={errors.password}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'var(--kmfri-secondary)' }} /></InputAdornment>,
                                            endAdornment: <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(p => !p)} edge="end">
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>,
                                        }} sx={G.lightInput} />

                                    <Button variant="contained" fullWidth disabled={processing} onClick={handleLoginStaff}
                                        startIcon={processing ? <CircularProgress size={16} sx={{ color: 'rgba(255,255,255,0.7)' }} /> : <Lock />}
                                        sx={G.themedPrimaryBtn}>
                                        {processing ? 'Authenticating…' : 'Sign In to Portal'}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <TextField fullWidth label="Email Address" placeholder="example@kmfri.go.ke"
                                        value={formData.email} onChange={handle('email')} error={!!errors.email} helperText={errors.email}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: 'var(--kmfri-secondary)' }} /></InputAdornment> }}
                                        sx={G.lightInput} />
                                    <TextField fullWidth label="Password" placeholder="Enter your password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password} onChange={handle('password')} error={!!errors.password} helperText={errors.password}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'var(--kmfri-secondary)' }} /></InputAdornment>,
                                            endAdornment: <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(p => !p)} edge="end">
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>,
                                        }} sx={G.lightInput} />

                                    <Button variant="contained" fullWidth disabled={processing} onClick={handleLoginIntern}
                                        startIcon={processing ? <CircularProgress size={16} sx={{ color: 'rgba(255,255,255,0.7)' }} /> : <Lock />}
                                        sx={G.themedPrimaryBtn}>
                                        {processing ? 'Please wait…' : 'Sign In to Portal'}
                                    </Button>
                                </>
                            )}

                            {selectedRole !== 'staff' && <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Forgot password?
                                </Typography>
                                <Button variant="text" onClick={switchToResetPassword}
                                    sx={{ color: 'var(--kmfri-secondary)', fontWeight: 700, textTransform: 'none', p: 0, minWidth: 'auto', fontSize: '0.875rem', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
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
/* ════════════════════════════════════════════════════════════════════════ */
/* NAVBAR */
/* ════════════════════════════════════════════════════════════════════════ */

const EnhancedNavbar = ({ onNavigate }) => {
    const theme = useTheme();
    const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
    const isTablet = useMediaQuery(theme.breakpoints.up("sm"));

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                ...G.nav,
                backdropFilter: "blur(18px)",
                background: "rgba(5,24,46,.82)",
                borderBottom: "1px solid rgba(255,255,255,.08)"
            }}
        >
            <Container maxWidth="xl">
                <Toolbar
                    disableGutters
                    sx={{
                        minHeight: { xs: 68, md: 78 },
                        py: 1,
                        px: { md: 0 }
                    }}
                >

                    {/* ================= BRAND ================= */}

                    <Box
                        onClick={() => onNavigate("landing")}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                            flexGrow: 1,
                            minWidth: 0
                        }}
                    >

                        {/* Kenya Coat of Arms */}

                        <Box
                            component="img"
                            src={KenyaArmsLogo}
                            alt="Government of Kenya"
                            loading="eager"
                            sx={{
                                height: { xs: 42, sm: 50, md: 60 },
                                width: "auto",
                                flexShrink: 0,
                                borderRadius: "2px",
                            }}
                        />

                        {/* Kenya Flag Divider */}

                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                width: { xs: 5, md: 6 },
                                height: { xs: 42, sm: 50, md: 60 },
                                overflow: "hidden",
                                borderRadius: "8px",
                                mx: 1,
                                flexShrink: 0,
                                border: "1px solid rgba(255,255,255,.15)",
                                boxShadow:
                                    "0 3px 10px rgba(0,0,0,.25), inset 0 1px 1px rgba(255,255,255,.18)"
                            }}
                        >
                            <Box sx={{ flex: 3, bgcolor: "#000000" }} />
                            <Box sx={{ flex: .45, bgcolor: "#FFFFFF" }} />
                            <Box sx={{ flex: 3, bgcolor: "#BB1E10" }} />
                            <Box sx={{ flex: .45, bgcolor: "#FFFFFF" }} />
                            <Box sx={{ flex: 3, bgcolor: "#006600" }} />
                        </Box>

                        {/* KMFRI Logo */}

                        <Box
                            sx={{
                                background: "#fff",
                                borderRadius: "3px",
                                p: .45,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 5px 16px rgba(0,0,0,.18)",
                                flexShrink: 0
                            }}
                        >
                            <Box
                                component="img"
                                src={KMFRILogo}
                                alt="KMFRI"
                                loading="eager"
                                sx={{
                                    height: { xs: 34, sm: 40, md: 50 },
                                    width: "auto",
                                    objectFit: "contain"
                                }}
                            />
                        </Box>

                        {/* Text */}

                        <Box
                            sx={{
                                ml: { xs: 1.2, md: 2 },
                                overflow: "hidden"
                            }}
                        >
                            <Typography
                                noWrap
                                sx={{
                                    color: "#fff",
                                    fontWeight: 800,
                                    lineHeight: 1.15,
                                    letterSpacing: .4,
                                    ml:.5,
                                    fontSize: {
                                        xs: ".82rem",
                                        sm: ".95rem",
                                        md: "1.1rem"
                                    },
                                    textShadow:
                                        "0 2px 8px rgba(0,0,0,.35)"
                                }}
                            >
                                {(isMdUp || isTablet) && "KENYA MARINE AND FISHERIES RESEARCH INSTITUTE"}
                            </Typography>

                            {(isMdUp || isTablet) && (
                                <Typography
                                    sx={{
                                        color: "#00E5FF",
                                        fontWeight: 700,
                                        fontSize: ".74rem",
                                        lineHeight: 1.2,
                                        my: .5,
                                         ml:.5,
                                        letterSpacing: .35
                                    }}
                                >
                                    Staff Biometric Attendance System
                                </Typography>
                            )}
                        </Box>

                    </Box>

                </Toolbar>
            </Container>
        </AppBar>
    );
};


/* ══ LANDING PAGE ═══════════════════════════════════════════════════════════ */
const EnhancedLandingPage = () => {
    const [view, setView] = useState('landing');

    useEffect(() => {
        document.title = view === 'landing'
            ? 'KMFRI Attendance System'
            : 'Sign In | KMFRI Attendance';
    }, [view]);

    return (
        <Box
            sx={{
                minHeight: "100vh",
                position: "relative",
                overflow: "hidden",
                isolation: "isolate",

                background: G.meshBg,



            }}
        >
            <EnhancedNavbar onNavigate={setView} currentView={view} />

            {/* ══ LANDING ══ */}
            {view === 'landing' && (
                <>
                    {/* Hero */}
                    <Box sx={{ pt: { xs: 13, md: 18 }, pb: { xs: 5, md: 12 }, position: 'relative', overflow: 'hidden' }}>

                        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                            <Grid container spacing={5} alignItems="center">
                                <Grid item xs={12} md={6}>
                                    <motion.div style={{ willChange: 'transform, opacity' }} initial={{ opacity: 0, x: -44 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.75 }}>

                                        <Typography variant={'h5'} fontWeight={900}
                                            sx={{ color: '#fff', mb: 2, lineHeight: 1.16, textShadow: '0 4px 18px rgba(0,0,0,0.24)' }}>
                                            <Box component="span" sx={{ color: '#00e5ff', display: 'block' }}>
                                                KMFRI STAFF ATTENDANCE SYSTEM
                                            </Box>
                                        </Typography>
                                        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.80)', mb: 4.5, fontWeight: 400, lineHeight: 1.7, maxWidth: 520 }}>
                                            Digital platform for synchronized clocking and reporting for all our employees, interns, and attaches.                                            </Typography>
                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                            <Button variant="contained" size="large" startIcon={<Lock />} onClick={() => setView('signin')}
                                                sx={{ background: 'var(--kmfri-gradient)', color: '#fff', fontWeight: 800, px: 4, py: 1.75, borderRadius: '14px', textTransform: 'none', fontSize: '1rem', boxShadow: '0 10px 30px var(--kmfri-accent-soft)', transition: 'all 0.26s ease', '&:hover': { filter: 'brightness(1.08)', transform: 'translateY(-2px)', boxShadow: '0 14px 36px var(--kmfri-secondary-soft)' } }}>
                                                Sign In
                                            </Button>
                                        </Stack>
                                    </motion.div>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                height: "100%",
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src={ClockingImage}
                                                alt="KMFRI Attendance"
                                                width="500"
                                                height="500"
                                                loading="eager"
                                                fetchPriority="high"
                                                decoding="async"
                                                sx={{
                                                    width: "100%",
                                                    maxWidth: 500,
                                                    borderRadius: 4,

                                                    ...G.surfaceStrong,
                                                    objectFit: "contain",


                                                    transition: ".4s",

                                                    "&:hover": {
                                                        transform: "translateY(-8px) scale(1.02)",
                                                    },
                                                }}
                                            />
                                        </Box>
                                    </motion.div>
                                </Grid>

                            </Grid>
                        </Container>
                    </Box>




                    {/* Footer */}
                    <Box sx={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderBottom: 'none', borderTop: '1px solid rgba(255,255,255,0.09)', py: 7, position: 'relative', zIndex: 1 }}>
                        <Container maxWidth="lg">
                            <Grid container spacing={5}>

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
                </>
            )
            }

            {/* ══ AUTH VIEWS ══ */}
            {
                view !== 'landing' && (
                    <motion.div style={{ willChange: 'transform, opacity' }} key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.38 }}>
                        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', pt: { xs: 10, md: 13 }, pb: { xs: 6, md: 8 }, position: 'relative', overflow: 'hidden' }}>
                            <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
                                {view === 'signin'
                                    ? <SignInCard key="signin" onBack={() => setView('landing')} onSwitchToSignup={() => setView('signup')} />
                                    : <RegisterStepper key="signup" onBack={() => setView('landing')} onSwitchToSignin={() => setView('signin')} />
                                }
                            </Container>
                        </Box>
                    </motion.div>
                )
            }
        </Box >
    );
};

export default EnhancedLandingPage;
