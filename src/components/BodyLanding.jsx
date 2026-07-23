import {
    ArrowBack,
    AssessmentRounded,
    Call,
    CheckCircle, Close,
    Email,
    HelpOutlineRounded,
    Lock,
    MenuBookRounded,
    SendRounded,
    ShieldRounded,
    VerifiedUserRounded,
    Visibility, VisibilityOff
} from '@mui/icons-material';
import {
    Alert,
    Box, Button, Card,
    CircularProgress,
    Container, Dialog, DialogContent,
    Grid, IconButton, InputAdornment,
    Snackbar, Stack,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateUserCurrentDeviceRedux } from '../redux/CurrentDevice';
import { updateUserCurrentUserRedux } from '../redux/CurrentUser';
import { fetchMyDevices } from '../service/DeviceService';
import { requestPasswordReset, resetPassword } from '../service/ResetPasswordService';
import { markSessionStarted } from '../service/SessionTimeout';
import { getPlatformConfig } from '../service/SuperadminService';
import ClockingImage from "./../images/clocking_image_1.png";
import AppNavbar, { useAccessibilityPrefs } from './AppNavbar';
import { loginStaff, loginUser } from './auth/Login';
import coreDataDetails, { applyPlatformConfigToCoreData } from './CoreDataDetails';
import GmailIcon from './custom/Gmail';
import GuideDialog from './GuideDialog';

const { colorPalette } = coreDataDetails;


/* ══ GLASS DESIGN TOKENS (WHITENING BODY & COOL NAVBAR) ═════════════════════ */
const G = {
    meshBg: `
    radial-gradient(circle at 10% 12%, var(--kmfri-secondary-soft, rgba(0, 91, 150, 0.08)) 0%, transparent 38%),
    radial-gradient(circle at 85% 20%, var(--kmfri-accent-soft, rgba(72, 201, 176, 0.10)) 0%, transparent 40%),
    radial-gradient(circle at 50% 80%, var(--kmfri-primary-soft, rgba(10, 61, 98, 0.05)) 0%, transparent 45%),
    linear-gradient(
        var(--kmfri-surface, #ffffff) 0%,
        #f8fafc 48%,
        #f1f5f9 100%
    )
`,
    surfaceStrong: {
        background: 'rgba(255, 255, 255, 0.90)',
        backdropFilter: 'blur(28px) saturate(190%)',
        WebkitBackdropFilter: 'blur(28px) saturate(190%)',
        border: '1px solid rgba(10, 61, 98, 0.14)',
        boxShadow: '0 16px 48px rgba(10, 61, 98, 0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
        willChange: 'transform',
    },
    nav: {
        background: 'var(--kmfri-gradient, linear-gradient(135deg, #062848 0%, #0A4D74 100%))',
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 4px 28px rgba(0,0,0,0.22)',
        willChange: 'transform',
    },
    ghostBtn: {
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1.5px solid var(--kmfri-secondary-soft, rgba(0,91,150,0.22))',
        color: 'var(--kmfri-primary, #0A3D62)',
        textTransform: 'none',
        fontWeight: 700,
        borderRadius: '12px',
        willChange: 'transform',
        '&:hover': { background: '#ffffff', border: '1.5px solid var(--kmfri-secondary, #005B96)', boxShadow: '0 4px 14px rgba(10,61,98,0.12)' },
    },
    formCard: {
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(44px) saturate(220%)',
        WebkitBackdropFilter: 'blur(44px) saturate(220%)',
        border: '1px solid rgba(255,255,255,0.80)',
        boxShadow: '0 32px 80px rgba(10,61,98,0.14), inset 0 1px 0 rgba(255,255,255,0.90)',
        willChange: 'transform, opacity',
    },
    featureCard: {
        p: 3,
        height: '100%',
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(10, 61, 98, 0.12)',
        boxShadow: '0 12px 32px rgba(10, 61, 98, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.85)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
            background: '#ffffff',
            transform: 'translateY(-6px)',
            borderColor: 'var(--kmfri-secondary, #005B96)',
            boxShadow: '0 20px 40px rgba(0, 91, 150, 0.14), inset 0 1px 0 rgba(255, 255, 255, 1)',
        },
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
        '&:hover': { boxShadow: '0 16px 38px var(--kmfri-accent-soft)', transform: 'translateY(-2px)' },
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

/* ══ THEME / BRANDING HELPERS ═══════════════════════════════════════════════ */
// Turns a #rrggbb hex into an rgba() string at the given alpha.
const hexToRgba = (hex, alpha = 1) => {
    if (!hex || typeof hex !== 'string') return `rgba(10,61,98,${alpha})`;
    let clean = hex.replace('#', '');
    if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
    const int = parseInt(clean, 16);
    if (Number.isNaN(int)) return `rgba(10,61,98,${alpha})`;
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r},${g},${b},${alpha})`;
};

// Syncs platform config (branding + active theme presets) into core data and CSS variables.
const applyBrandingToDocument = (cfg) => {
    if (!cfg) return;
    if (typeof applyPlatformConfigToCoreData === 'function') {
        applyPlatformConfigToCoreData(cfg);
    }
    const branding = cfg.branding || {};
    const root = document.documentElement;
    const primary = branding.primaryColor || '#0A3D62';
    const secondary = branding.secondaryColor || '#005B96';
    const accent = branding.accentColor || '#48C9B0';
    root.style.setProperty('--kmfri-primary', primary);
    root.style.setProperty('--kmfri-secondary', secondary);
    root.style.setProperty('--kmfri-accent', accent);
    root.style.setProperty('--kmfri-primary-soft', hexToRgba(primary, 0.14));
    root.style.setProperty('--kmfri-secondary-soft', hexToRgba(secondary, 0.18));
    root.style.setProperty('--kmfri-accent-soft', hexToRgba(accent, 0.22));
    root.style.setProperty('--kmfri-gradient', `linear-gradient(135deg, ${secondary} 0%, ${primary} 100%)`);
};

/* ══ ACCESSIBILITY WIDGET ═══════════════════════════════════════════════════
   A small, self-contained control that lets any visitor adjust text size,
   toggle a high-contrast palette, and reduce motion — persisted locally so
   the preference survives a reload. */
const A11Y_STORAGE_KEY = 'kmfri_a11y_prefs_v1';
const FONT_SCALES = [0.9, 1, 1.1, 1.25];
const BASE_ROOT_FONT_PX = 16;

const loadA11yPrefs = () => {
    try {
        const raw = window.localStorage.getItem(A11Y_STORAGE_KEY);
        if (!raw) return { scaleIndex: 1, highContrast: false, reducedMotion: false };
        return { scaleIndex: 1, highContrast: false, reducedMotion: false, ...JSON.parse(raw) };
    } catch {
        return { scaleIndex: 1, highContrast: false, reducedMotion: false };
    }
};




/* ══ HELP & SUPPORT DIALOG ═══════════════════════════════════════════════════ */
const HelpSupportDialog = ({ open, onClose, supportEmail, supportPhone }) => {
    const [messageMode, setMessageMode] = useState(false);
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const email = supportEmail || '+254 (20) 8021561 ';
    const phone = supportPhone || '+254 20 2024571';

    const handleSendMessage = () => {
        const subject = encodeURIComponent('KMFRI Attendance System — Support Request');
        const body = encodeURIComponent(`Name: ${name || '—'}\n\nMessage:\n${message}`);
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        onClose();
        setMessageMode(false);
        setName('');
        setMessage('');
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '10px' } }}>
            <DialogContent sx={{ p: 3.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={900} sx={{ color: colorPalette.deepNavy }}>
                            Help and Support
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {messageMode ? 'Send us a direct message.' : 'Choose how you\'d like to reach us.'}
                        </Typography>
                    </Box>
                    <Tooltip title="Close" placement="left" arrow>
                        <IconButton size="small" sx={{border:'1px solid', borderColor:'divider'}} onClick={onClose} aria-label="Close">
                        <Close fontSize="small" sx={{width:17,height:17}} />
                    </IconButton>
                    </Tooltip>
                </Stack>

                {!messageMode ? (
                    <Stack spacing={1.5}>
                        <Button
                            component="a"
                            href={`mailto:${email}`}
                            fullWidth
                            variant="outlined"
                            startIcon={<Email />}
                            sx={{ justifyContent: 'flex-start', textTransform: 'none', fontWeight: 700, py: 1.4, borderRadius: '14px' }}
                        >
                            Email · {email}
                        </Button>
                        <Button
                            component="a"
                            href={`tel:${phone.replace(/\s+/g, '')}`}
                            fullWidth
                            variant="outlined"
                            startIcon={<Call />}
                            sx={{ justifyContent: 'flex-start', textTransform: 'none', fontWeight: 700, py: 1.4, borderRadius: '14px' }}
                        >
                            Call · {phone}
                        </Button>
                        {/* <Button
                            fullWidth
                            variant="contained"
                            startIcon={<SendRounded />}
                            onClick={() => setMessageMode(true)}
                            sx={{ ...G.themedPrimaryBtn, py: 1.4 }}
                        >
                            Send a direct message
                        </Button> */}
                    </Stack>
                ) : (
                    <Stack spacing={2}>
                        <TextField
                            label="Your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            fullWidth
                            sx={G.lightInput}
                        />
                        <TextField
                            label="Message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            fullWidth
                            multiline
                            minRows={4}
                            sx={G.lightInput}
                        />
                        <Stack direction="row" spacing={1.5}>
                            <Button fullWidth variant="text" onClick={() => setMessageMode(false)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                                Back
                            </Button>
                            <Button
                                fullWidth
                                variant="contained"
                                disabled={!message.trim()}
                                startIcon={<SendRounded />}
                                onClick={handleSendMessage}
                                sx={G.themedPrimaryBtn}
                            >
                                Send
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </DialogContent>
        </Dialog>
    );
};


/* ══ SIGN IN CARD ═══════════════════════════════════════════════════════════ */
const SignInCard = ({ onBack, reducedMotion }) => {
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

    const motionProps = reducedMotion
        ? { initial: false, animate: { opacity: 1 }, transition: { duration: 0 } }
        : {
            initial: { opacity: 0, y: 32, scale: 0.96 },
            animate: { opacity: 1, y: 0, scale: 1 },
            exit: { opacity: 0, y: -24, scale: 0.97 },
            transition: { duration: 0.44, ease: [0.4, 0, 0.2, 1] },
        };

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
        <motion.div style={{ willChange: 'transform, opacity' }} {...motionProps}>
            <Card
                elevation={0}
                sx={{
                    ...G.formCard,
                    p: { xs: 2.5, sm: 3.5, md: 4 },
                    maxWidth: { xs: '100%', sm: 480 },
                    width: '100%',
                    mx: 'auto',
                    borderRadius: { xs: '22px', sm: '28px' },
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: -1 }}>
                    <IconButton onClick={currentView === 'role-select' ? onBack : switchToSignin} size="small" sx={{ background: 'rgba(10,61,98,0.07)', border: '1px solid rgba(10,61,98,0.12)', '&:hover': { background: 'rgba(10,61,98,0.13)' } }}>
                        {!selectedRole ? <Close sx={{ fontSize: 18, color: colorPalette.deepNavy }} /> : <ArrowBack sx={{ fontSize: 18, color: colorPalette.deepNavy }} />}
                    </IconButton>
                </Box>

                {currentView === 'role-select' ? (
                    <>
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <Box sx={{ width: { xs: 64, sm: 76 }, height: { xs: 64, sm: 76 }, borderRadius: '50%', background: 'var(--kmfri-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, boxShadow: '0 10px 32px var(--kmfri-secondary-soft)' }}>
                                <Lock sx={{ fontSize: { xs: 32, sm: 38 }, color: '#fff' }} />
                            </Box>
                            <Typography variant="h4" fontWeight={900} sx={{ fontSize: { xs: '1.6rem', sm: '2.125rem' }, background: 'var(--kmfri-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 0.75 }}>
                                Sign In
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                Select your account to continue
                            </Typography>
                        </Box>
                        <Stack spacing={2}>
                            <motion.div whileHover={reducedMotion ? undefined : { scale: 1.02 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                                <Box onClick={() => selectRole('staff')} sx={{ ...G.themedRoleCard }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Box sx={{ width: 50, height: 50, borderRadius: '12px', background: 'var(--kmfri-secondary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--kmfri-secondary)' }}>
                                            <Lock sx={{ fontSize: 24 }} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" fontWeight={800} sx={{ color: colorPalette.deepNavy }}>Staff</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Sign in with your staff credentials</Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            </motion.div>

                            <motion.div whileHover={reducedMotion ? undefined : { scale: 1.02 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                                <Box onClick={() => selectRole('intern')} sx={{ ...G.themedRoleCard }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Box sx={{ width: 50, height: 50, borderRadius: '12px', background: 'var(--kmfri-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--kmfri-accent)' }}>
                                            <GmailIcon size={24} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" fontWeight={800} sx={{ color: colorPalette.deepNavy }}>Intern / Attache</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Sign in with email &amp; password</Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            </motion.div>
                        </Stack>
                    </>
                ) : currentView === 'signin' ? (
                    <>
                        <Box sx={{ textAlign: 'center', mb: 3.5 }}>
                            <Box sx={{ width: { xs: 64, sm: 76 }, height: { xs: 64, sm: 76 }, borderRadius: '50%', background: 'var(--kmfri-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, boxShadow: '0 10px 32px var(--kmfri-secondary-soft)' }}>
                                <Lock sx={{ fontSize: { xs: 32, sm: 38 }, color: '#fff' }} />
                            </Box>
                            <Typography variant="h4" fontWeight={900} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' }, background: 'var(--kmfri-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 0.75 }}>
                                Welcome Back
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                {selectedRole === 'staff' ? 'Sign in with your staff credentials' : 'Sign in to access your attendance portal'}
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

                            {selectedRole !== 'staff' && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography variant="body2" color="text.secondary">Forgot password?</Typography>
                                    <Button variant="text" onClick={switchToResetPassword}
                                        sx={{ color: 'var(--kmfri-secondary)', fontWeight: 700, textTransform: 'none', p: 0, minWidth: 'auto', fontSize: '0.875rem', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
                                        Reset here
                                    </Button>
                                </Box>
                            )}
                        </Stack>
                    </>
                ) : (
                    <>
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <Box sx={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(255,152,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, border: '2px solid rgba(255,152,0,0.25)' }}>
                                <Lock sx={{ fontSize: 34, color: 'rgb(255,152,0)' }} />
                            </Box>
                            <Typography variant="h5" fontWeight={900} sx={{ mb: 1, color: colorPalette.deepNavy }}>Reset Password</Typography>
                            {isPasswordChangeEnabled ? (
                                <Typography variant="body2" color="success" sx={{ lineHeight: 1.6, bgcolor: 'rgba(72,201,176,0.12)', display: 'inline-block', px: 1.5, py: 0.5, borderRadius: 1 }}>
                                    Your password reset request is approved. Kindly, fill in your new password and confirm to change your password.
                                </Typography>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                    Enter your registered email address. Your admin will need to approve your password reset request before you can proceed.
                                </Typography>
                            )}
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
                                        sx={{ background: 'linear-gradient(135deg, rgb(255,152,0) 0%, rgb(255,109,0) 100%)', py: 1.5, borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', textTransform: 'none', letterSpacing: 0.3, boxShadow: '0 6px 20px rgba(255,152,0,0.3)', transition: 'all 0.24s ease', '&:hover': { boxShadow: '0 10px 28px rgba(255,152,0,0.4)', transform: 'translateY(-2px)' } }}>
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
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }}
                                        sx={G.lightInput} disabled={resetPasswordProcessing || hasPendingReset} />

                                    {hasPendingReset ? (
                                        <Box sx={{ backgroundColor: 'rgba(255,152,0,0.08)', border: '1.5px solid rgb(255,152,0)', borderRadius: '12px', p: 2.5, textAlign: 'center' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'rgb(255,152,0)', mb: 1 }}>Pending Password Reset</Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                                                You already have a pending password reset request. Please contact your admin or visit the admin office at your station for approval.
                                            </Typography>
                                            <Button fullWidth variant="outlined" onClick={switchToSignin} sx={{ mt: 2, color: 'rgb(255,152,0)', borderColor: 'rgb(255,152,0)', '&:hover': { backgroundColor: 'rgba(255,152,0,0.08)' } }}>
                                                Back to Sign In
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Button variant="contained" fullWidth onClick={handleResetPasswordSubmit}
                                            disabled={resetPasswordProcessing}
                                            startIcon={resetPasswordProcessing ? <CircularProgress size={16} sx={{ color: 'rgba(255,255,255,0.7)' }} /> : <Lock />}
                                            sx={{ background: 'linear-gradient(135deg, rgb(255,152,0) 0%, rgb(255,109,0) 100%)', py: 1.5, borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', textTransform: 'none', letterSpacing: 0.3, boxShadow: '0 6px 20px rgba(255,152,0,0.3)', transition: 'all 0.24s ease', '&:hover': { boxShadow: '0 10px 28px rgba(255,152,0,0.4)', transform: 'translateY(-2px)' } }}>
                                            {resetPasswordProcessing ? 'Requesting...' : 'Request Password Reset'}
                                        </Button>
                                    )}

                                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', lineHeight: 1.6, fontSize: '0.75rem' }}>
                                        {hasPendingReset ? 'Status checked successfully' : "Next steps: Your admin will review your request and approve the reset. You'll be notified once approved."}
                                    </Typography>

                                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                        <Button variant="text" onClick={switchToSignin} sx={{ color: colorPalette.oceanBlue, fontWeight: 700, textTransform: 'none', fontSize: '0.875rem', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
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
                <Alert onClose={handleCloseSnack} severity="success" icon={<CheckCircle />} sx={{ borderRadius: '14px', fontWeight: 700, backdropFilter: 'blur(16px)', boxShadow: '0 8px 28px rgba(72,201,176,0.32)' }}>
                    ✓ Login successful!
                </Alert>
            </Snackbar>

            <Snackbar open={resetPasswordSuccess || passwordChanged} autoHideDuration={3000} onClose={handleCloseResetSnack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseResetSnack} severity="success" icon={<CheckCircle />} sx={{ borderRadius: '14px', fontWeight: 500, backdropFilter: 'blur(16px)', boxShadow: '0 8px 28px rgba(76,175,80,0.32)' }}>
                    {resetPasswordSuccess ? 'Password reset request submitted!' : passwordChanged ? 'Password changed successfully!' : ''}
                </Alert>
            </Snackbar>
        </motion.div>
    );
};


/* ══ LANDING PAGE ═══════════════════════════════════════════════════════════ */
const EnhancedLandingPage = () => {
    const [view, setView] = useState('landing');
    const [helpOpen, setHelpOpen] = useState(false);
    const [guideOpen, setGuideOpen] = useState(false);
    const [branding, setBranding] = useState(null);
    const [a11yPrefs, setA11yPrefs] = useAccessibilityPrefs();

    useEffect(() => {
        document.title = view === 'landing' ? 'KMFRI Attendance System' : 'Sign In | KMFRI Attendance';
    }, [view]);

    // Pull live branding/theme from the PlatformConfig singleton so superadmin
    // changes (colors, org name, support contacts, active theme) reflect here immediately.
    useEffect(() => {
        let isMounted = true;
        const loadConfig = async () => {
            try {
                const cfg = await getPlatformConfig();
                if (isMounted && cfg) {
                    applyPlatformConfigToCoreData(cfg);
                    applyBrandingToDocument(cfg);
                    setBranding(cfg.branding || null);
                }
            } catch (err) {
                console.warn('Could not load platform config, using default theme.', err);
            }
        };

        loadConfig();

        const handleConfigUpdate = (e) => {
            if (!isMounted) return;
            const cfg = e.detail || JSON.parse(localStorage.getItem('kmfri_platform_config') || 'null');
            if (cfg && cfg.branding) {
                setBranding(cfg.branding);
            }
        };

        window.addEventListener('kmfri_platform_config_updated', handleConfigUpdate);
        window.addEventListener('storage', handleConfigUpdate);

        return () => {
            isMounted = false;
            window.removeEventListener('kmfri_platform_config_updated', handleConfigUpdate);
            window.removeEventListener('storage', handleConfigUpdate);
        };
    }, []);

    const highContrastOverrides = a11yPrefs.highContrast
        ? {
            filter: 'contrast(1.3) saturate(1.15)',
            '& .MuiCard-root, & .MuiAppBar-root': {
                borderColor: '#00e5ff !important',
                boxShadow: '0 0 12px rgba(0, 229, 255, 0.4) !important',
            },
        }
        : {};


    return (
        <Box sx={{ minHeight: "100vh", position: "relative", overflow: "hidden", isolation: "isolate", background: G.meshBg, ...highContrastOverrides }}>
            <AppNavbar
                variant="landing"
                onNavigate={setView}
                platformLogoUrl={branding?.logoUrl}
                platformBranding={branding}
                onOpenHelp={() => setHelpOpen(true)}
                onOpenGuide={() => setGuideOpen(true)}
                a11yPrefs={a11yPrefs}
                setA11yPrefs={setA11yPrefs}
            />

            {/* ══ LANDING ══ */}
            {view === 'landing' && (
                <>
                    {/* Hero */}
                    <Box sx={{ pt: { xs: 11, sm: 13, md: 17 }, pb: { xs: 6, md: 10 }, position: 'relative', overflow: 'hidden' }}>
                        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                            <Grid container spacing={{ xs: 4, md: 5 }} alignItems="center">
                                <Grid item xs={12} md={6}>
                                    <motion.div
                                        style={{ willChange: 'transform, opacity' }}
                                        initial={a11yPrefs.reducedMotion ? false : { opacity: 0, x: -44 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: a11yPrefs.reducedMotion ? 0 : 0.75 }}
                                    >
                                        <Typography
                                            fontWeight={900}
                                            sx={{
                                                color: 'var(--kmfri-text, #0f172a)',
                                                mb: 2,
                                                lineHeight: 1.16,
                                                fontSize: { xs: "1.2rem", sm: "1.25rem", md: "1.5rem" }
                                            }}
                                        >
                                            <Box component="span" sx={{ color: 'var(--kmfri-secondary, #005B96)', display: 'block', mb: 0.5, fontWeight: 900 }}>
                                                {(branding?.organizationName ? `${branding.shortName || 'KMFRI'} STAFF ATTENDANCE SYSTEM` : 'KMFRI STAFF ATTENDANCE SYSTEM')}
                                            </Box>
                                        </Typography>

                                        <Typography sx={{ color: 'rgba(15, 23, 42, 0.78)', mb: 3.5, fontWeight: 500, lineHeight: 1.7, maxWidth: 520, fontSize: 'clamp(0.95rem, 1.6vw, 1.15rem)' }}>
                                            Digital platform for synchronized clocking and reporting for all our employees, interns, and attaches across research stations nationwide.
                                        </Typography>

                                        {/* Feature Chips / Pills */}
                                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 4 }}>
                                            <Box sx={{ px: 1.75, py: 0.6, borderRadius: '20px', background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(10,61,98,0.14)', boxShadow: '0 4px 12px rgba(10,61,98,0.06)', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                <ShieldRounded sx={{ fontSize: 16, color: 'var(--kmfri-secondary, #005B96)' }} />
                                                <Typography variant="caption" sx={{ color: '#0f172a', fontWeight: 700 }}>Trusted Security</Typography>
                                            </Box>
                                            <Box sx={{ px: 1.75, py: 0.6, borderRadius: '20px', background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(10,61,98,0.14)', boxShadow: '0 4px 12px rgba(10,61,98,0.06)', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                <VerifiedUserRounded sx={{ fontSize: 16, color: 'var(--kmfri-accent, #48C9B0)' }} />
                                                <Typography variant="caption" sx={{ color: '#0f172a', fontWeight: 700 }}>All Staff, Interns and Attaches </Typography>
                                            </Box>
                                            <Box sx={{ px: 1.75, py: 0.6, borderRadius: '20px', background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(10,61,98,0.14)', boxShadow: '0 4px 12px rgba(10,61,98,0.06)', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                <AssessmentRounded sx={{ fontSize: 16, color: 'var(--kmfri-secondary, #368DC5)' }} />
                                                <Typography variant="caption" sx={{ color: '#0f172a', fontWeight: 700 }}>Real-Time Analytics</Typography>
                                            </Box>
                                        </Stack>

                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                            <Button variant="contained" size="large" startIcon={<Lock />} onClick={() => setView('signin')}
                                                sx={{ background: 'var(--kmfri-gradient)', color: '#fff', fontWeight: 800, px: 4, py: 1.75, borderRadius: '14px', textTransform: 'none', fontSize: '1rem', boxShadow: '0 10px 30px var(--kmfri-secondary-soft)', transition: 'all 0.26s ease', '&:hover': { filter: 'brightness(1.08)', transform: 'translateY(-2px)', boxShadow: '0 14px 36px var(--kmfri-secondary-soft)' } }}>
                                                Sign In to Portal
                                            </Button>
                                            <Button variant="outlined" size="large" startIcon={<MenuBookRounded />} onClick={() => setGuideOpen(true)}
                                                sx={{ ...G.ghostBtn, px: 3, py: 1.75, fontSize: '0.95rem' }}>
                                                Explore Guide
                                            </Button>
                                        </Stack>
                                    </motion.div>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <motion.div
                                        initial={a11yPrefs.reducedMotion ? false : { opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: a11yPrefs.reducedMotion ? 0 : 0.8, delay: a11yPrefs.reducedMotion ? 0 : 0.2 }}
                                    >
                                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                                            <Box
                                                component="img"
                                                src={ClockingImage}
                                                alt="KMFRI Attendance"
                                                loading="eager"
                                                fetchPriority="high"
                                                decoding="async"
                                                sx={{ width: "100%", maxWidth: 500, borderRadius: 4, ...G.surfaceStrong, objectFit: "contain", transition: ".4s", "&:hover": { transform: a11yPrefs.reducedMotion ? 'none' : "translateY(-8px) scale(1.02)" } }}
                                            />
                                        </Box>
                                    </motion.div>
                                </Grid>
                            </Grid>
                        </Container>
                    </Box>


                    {/* Minimal footer placed at the very bottom */}
                    <Box component="footer" sx={{
                        borderTop: '1px solid var(--kmfri-secondary-soft, rgba(0,91,150,0.12))',
                        py: { xs: 2.5, sm: 3, md: 4 },
                        position: 'relative',
                        zIndex: 1,
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(248,250,252,0.85) 100%)',
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        boxShadow: '0 -4px 24px rgba(10,61,98,0.06)',
                    }}>
                        <Container maxWidth="lg">
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={{ xs: 1.5, sm: 2 }}
                                alignItems="center"
                                justifyContent="space-between"
                            >
                                <Typography variant="body2" sx={{
                                    color: 'var(--kmfri-text, rgba(15,23,42,0.65))',
                                    fontSize: '0.78rem',
                                    textAlign: { xs: 'center', sm: 'left' },
                                    fontWeight: 500,
                                }}>
                                    © {new Date().getFullYear()} {branding?.shortName || 'KMFRI'}. All rights reserved.
                                </Typography>

                                <Stack direction="row" spacing={{ xs: 2, sm: 2.5 }} alignItems="center" flexWrap="wrap" justifyContent="center">

                                    <Button size="small" onClick={() => setGuideOpen(true)} startIcon={<MenuBookRounded sx={{ fontSize: 15 }} />} sx={{
                                        color: 'var(--kmfri-secondary, rgba(0,91,150,0.75))',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        p: 0,
                                        minWidth: 'auto',
                                        borderRadius: '8px',
                                        px: 1,
                                        py: 0.5,
                                        '&:hover': {
                                            color: 'var(--kmfri-secondary)',
                                            bgcolor: 'var(--kmfri-secondary-soft, rgba(0,91,150,0.08))',
                                        }
                                    }}>
                                        Guide
                                    </Button>
                                    <Button size="small" onClick={() => setHelpOpen(true)} startIcon={<HelpOutlineRounded sx={{ fontSize: 15 }} />} sx={{
                                        color: 'var(--kmfri-secondary, rgba(0,91,150,0.75))',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        p: 0,
                                        minWidth: 'auto',
                                        borderRadius: '8px',
                                        px: 1,
                                        py: 0.5,
                                        '&:hover': {
                                            color: 'var(--kmfri-secondary)',
                                            bgcolor: 'var(--kmfri-secondary-soft, rgba(0,91,150,0.08))',

                                        }
                                    }}>
                                        Technical Support
                                    </Button>

                                </Stack>
                            </Stack>
                        </Container>
                    </Box>
                </>
            )}

            {/* ══ AUTH VIEWS ══ */}
            {view !== 'landing' && (
                <motion.div style={{ willChange: 'transform, opacity' }} key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: a11yPrefs.reducedMotion ? 0 : 0.38 }}>
                    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', pt: { xs: 9, md: 13 }, pb: { xs: 6, md: 8 }, position: 'relative', overflow: 'hidden' }}>
                        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
                            {view === 'signin'
                                ? <SignInCard key="signin" onBack={() => setView('landing')} reducedMotion={a11yPrefs.reducedMotion} />
                                : <RegisterStepper key="signup" onBack={() => setView('landing')} onSwitchToSignin={() => setView('signin')} />
                            }
                        </Container>
                    </Box>
                </motion.div>
            )}

            <HelpSupportDialog
                open={helpOpen}
                onClose={() => setHelpOpen(false)}
                supportEmail={branding?.supportEmail}
                supportPhone={branding?.supportPhone}
            />
            <GuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} />
        </Box>
    );
};

export default EnhancedLandingPage;