import {
    Analytics,
    Badge,
    Business,
    CalendarToday,
    CheckCircle,
    Close,
    Email,
    Fingerprint,
    GroupWork,
    LocationOn,
    Lock,
    Numbers,
    Person,
    PersonAdd,
    Phone,
    PhoneIphone,
    Schedule,
    Security,
    SupervisorAccount,
    TrendingUp,
    Visibility,
    VisibilityOff,
    Work
} from '@mui/icons-material';
import {
    Alert,
    AppBar,
    Avatar,
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    Collapse,
    Container,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    Menu,
    MenuItem,
    Paper,
    Snackbar,
    Stack,
    TextField,
    Toolbar,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { CgMenu } from 'react-icons/cg';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import KMFRILogo from '../assets/kmfri.png';
import { updateUserCurrentUserRedux } from '../redux/CurrentUser';
import { loginUser } from './auth/Login';
import { registerUser } from './auth/Register';
import coreDataDetails from './CoreDataDetails';

const { colorPalette, availableDepartments: departments, availableSupervisors: supervisors, genders } = coreDataDetails;

/* ══════════════════════════════════════════════════════════════════════════
   GLASS DESIGN TOKENS
   A single place to tune every glass surface in the app.
══════════════════════════════════════════════════════════════════════════ */
const G = {
    /* ── page mesh background ── */
    meshBg: `
        radial-gradient(ellipse at 12% 18%, rgba(0,130,190,0.52) 0%, transparent 46%),
        radial-gradient(ellipse at 80% 10%, rgba(0,55,115,0.62) 0%, transparent 40%),
        radial-gradient(ellipse at 58% 78%, rgba(0,110,155,0.42) 0%, transparent 50%),
        radial-gradient(ellipse at 3%  88%, rgba(8,44,82,0.56)  0%, transparent 38%),
        radial-gradient(ellipse at 94% 85%, rgba(0,185,175,0.24) 0%, transparent 36%),
        linear-gradient(158deg, #051c30 0%, #09355a 38%, #073a52 68%, #052840 100%)
    `,

    /* ── glass surfaces (dark bg) ── */
    surface: {
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px) saturate(170%)',
        WebkitBackdropFilter: 'blur(20px) saturate(170%)',
        border: '1px solid rgba(255,255,255,0.16)',
        boxShadow: '0 8px 32px rgba(6,28,50,0.30), inset 0 1px 0 rgba(255,255,255,0.14)',
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
    },

    /* ── navbar ── */
    nav: {
        background: 'rgba(5,24,46,0.70)',
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        borderBottom: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 4px 28px rgba(0,0,0,0.22)',
    },

    /* ── ghost / outline button on dark bg ── */
    ghostBtn: {
        background: 'rgba(255,255,255,0.10)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.26)',
        color: '#fff',
    },

    /* ── frosted-white card for auth forms (light appearance) ── */
    formCard: {
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(44px) saturate(220%)',
        WebkitBackdropFilter: 'blur(44px) saturate(220%)',
        border: '1px solid rgba(255,255,255,0.60)',
        boxShadow: '0 32px 80px rgba(6,28,50,0.30), inset 0 1px 0 rgba(255,255,255,0.70)',
    },

    /* ── dark input on dark surface ── */
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
    },

    /* ── light input on white form card ── */
    lightInput: {
        '& .MuiOutlinedInput-root': {
            borderRadius: '14px',
            background: 'rgba(10,61,98,0.04)',
            '&:hover fieldset': { borderColor: colorPalette.oceanBlue },
            '&.Mui-focused fieldset': { borderColor: colorPalette.oceanBlue, borderWidth: 2 },
        },
    },
};

/* ── role definition ── */
const ROLES = [
    { value: 'employee', label: 'Employee', icon: '👔', desc: 'Full-time / Part-time staff' },
    { value: 'intern', label: 'Intern', icon: '🎓', desc: 'University / college intern' },
    { value: 'attachee', label: 'Attaché', icon: '📋', desc: 'Industrial attachment' },
];

/* ── floating ambient orbs (pointer-events: none) ── */
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
                top: t, left: l, right: r, bottom: bot,
                borderRadius: '50%', background: c, filter: `blur(${b}px)`,
            }} />
        ))}
    </>
);

/* ══════════════════════════════════════════════════════════════════════════
   NAV BAR
══════════════════════════════════════════════════════════════════════════ */
const EnhancedNavbar = ({ onNavigate, currentView }) => {
    const theme = useTheme();
    const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
    const [anchor, setAnchor] = useState(null);

    return (
        <AppBar position="fixed" elevation={0} sx={{ ...G.nav }}>
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ py: 0.8 }}>
                    <Box onClick={() => onNavigate('landing')}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 2, cursor: 'pointer' }}>
                        <Box component="img" src={KMFRILogo} alt="KMFRI"
                            sx={{ height: { xs: 42, md: 48 }, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid rgba(255,255,255,0.22)', boxShadow: '0 4px 16px rgba(0,0,0,0.28)' }} />
                    </Box>

                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography noWrap fontWeight={800} onClick={() => onNavigate('landing')}
                            sx={{ fontSize: { xs: '0.88rem', md: '1rem' }, letterSpacing: 0.35, color: '#fff', cursor: 'pointer', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                            {isMdUp ? 'Kenya Marine and Fisheries Research Institute'.toUpperCase() : 'KMFRI Attendance'.toUpperCase()}
                        </Typography>
                        {isMdUp && (
                            <Typography variant="caption" sx={{ opacity: 0.62, display: 'block', fontWeight: 500, letterSpacing: 0.55 }}>
                                Digital Attendance Management Platform
                            </Typography>
                        )}
                    </Box>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                        {currentView === 'landing' && (
                            <Button variant="outlined" startIcon={<Lock sx={{ fontSize: 15 }} />}
                                onClick={() => onNavigate('signin')}
                                sx={{
                                    display: { xs: 'none', sm: 'flex' },
                                    ...G.ghostBtn,
                                    fontWeight: 700, px: 2.5, borderRadius: '12px',
                                    textTransform: 'none', fontSize: '0.875rem',
                                    transition: 'all 0.22s ease',
                                    '&:hover': {
                                        background: 'rgba(0,220,255,0.18)',
                                        borderColor: '#00e5ff',
                                        color: '#00e5ff',
                                        transform: 'translateY(-1px)',
                                    },
                                }}
                            >
                                Login
                            </Button>
                        )}
                        <Tooltip title="Menu">
                            <IconButton onClick={(e) => setAnchor(e.currentTarget)} sx={{ p: 0 }}>
                                <Avatar sx={{
                                    width: { xs: 36, md: 40 }, height: { xs: 36, md: 40 },
                                    ...G.surface, color: '#fff', fontWeight: 800,
                                    transition: 'all 0.2s',
                                    '&:hover': { ...G.surfaceHover },
                                }}>
                                    <CgMenu size={20} />
                                </Avatar>
                            </IconButton>
                        </Tooltip>
                        <Menu
                            anchorEl={anchor}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            open={Boolean(anchor)}
                            onClose={() => setAnchor(null)}
                            PaperProps={{
                                sx: {
                                    ...G.surfaceStrong,
                                    borderRadius: '16px', mt: 1.2, minWidth: 175,
                                    background: 'rgba(5,24,46,0.88)',
                                },
                            }}
                        >
                            {[{ label: 'Login', view: 'signin' }, { label: 'Register', view: 'signup' }].map(({ label, view }) => (
                                <MenuItem key={label}
                                    onClick={() => { setAnchor(null); onNavigate(view); }}
                                    sx={{ py: 1.5, px: 2.5, color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '0.9rem', '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', color: '#00e5ff' } }}>
                                    {label}
                                </MenuItem>
                            ))}
                        </Menu>
                    </Stack>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   GLASS FEATURE CARD
══════════════════════════════════════════════════════════════════════════ */
const GlassFeatureCard = ({ icon, title, description, color, delay }) => (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay }} style={{ height: '100%' }}>
        <Box sx={{
            ...G.surface, borderRadius: '22px', p: 3.5, height: '100%',
            transition: 'all 0.3s ease',
            '&:hover': { ...G.surfaceHover, transform: 'translateY(-8px)' },
        }}>
            <Box sx={{
                width: 58, height: 58, borderRadius: '16px',
                background: `linear-gradient(135deg, ${color}ee, ${color}88)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mb: 2.5, boxShadow: `0 8px 22px ${color}45`,
            }}>
                {icon}
            </Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', mb: 1, textShadow: '0 2px 8px rgba(0,0,0,0.22)' }}>
                {title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.78 }}>
                {description}
            </Typography>
        </Box>
    </motion.div>
);

/* ══════════════════════════════════════════════════════════════════════════
   GLASS STATS CARD
══════════════════════════════════════════════════════════════════════════ */
const GlassStatsCard = ({ value, label, icon, color, delay }) => (
    <motion.div initial={{ opacity: 0, scale: 0.82 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay }}>
        <Box sx={{
            ...G.surface, borderRadius: '20px', p: { xs: 2.5, sm: 3 }, textAlign: 'center',
            transition: 'all 0.26s ease',
            '&:hover': { ...G.surfaceHover, transform: 'translateY(-6px)' },
        }}>
            <Box sx={{
                display: 'inline-flex', p: 1.4, borderRadius: '12px',
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.16)',
                color, mb: 1.5,
            }}>
                {icon}
            </Box>
            <Typography variant="h3" fontWeight={900} sx={{ color: '#fff', lineHeight: 1, textShadow: `0 0 28px ${color}80` }}>
                {value}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.58)', fontWeight: 600, mt: 0.6 }}>
                {label}
            </Typography>
        </Box>
    </motion.div>
);

/* ══════════════════════════════════════════════════════════════════════════
   ROLE SELECTOR (used inside white auth card → light colours)
══════════════════════════════════════════════════════════════════════════ */
const RoleSelector = ({ selected, onSelect }) => (
    <Box>
        <Typography variant="caption" fontWeight={800} color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 0.9, fontSize: '0.67rem', display: 'block', mb: 1.2 }}>
            Registering as *
        </Typography>
        <Grid container spacing={1.5}>
            {ROLES.map((r) => {
                const active = selected === r.value;
                return (
                    <Grid item xs={4} key={r.value}>
                        <Paper onClick={() => onSelect(r.value)} elevation={0} sx={{
                            p: { xs: 1.4, sm: 1.8 }, borderRadius: '14px', cursor: 'pointer', textAlign: 'center',
                            border: `2px solid ${active ? colorPalette.oceanBlue : 'rgba(10,61,98,0.12)'}`,
                            bgcolor: active ? `${colorPalette.oceanBlue}10` : 'rgba(10,61,98,0.02)',
                            transition: 'all 0.18s ease',
                            '&:hover': { borderColor: colorPalette.oceanBlue, bgcolor: `${colorPalette.oceanBlue}07` },
                        }}>
                            <Typography sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' }, lineHeight: 1, mb: 0.5 }}>{r.icon}</Typography>
                            <Typography variant="caption" fontWeight={800} sx={{ display: 'block', fontSize: '0.73rem', color: active ? colorPalette.oceanBlue : 'text.primary' }}>
                                {r.label}
                            </Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ display: { xs: 'none', sm: 'block' }, fontSize: '0.63rem', lineHeight: 1.3 }}>
                                {r.desc}
                            </Typography>
                        </Paper>
                    </Grid>
                );
            })}
        </Grid>
    </Box>
);

/* ══════════════════════════════════════════════════════════════════════════
   AUTH CARD  (frosted-white glass form card)
══════════════════════════════════════════════════════════════════════════ */
const AuthCard = ({ type, onBack, onSwitchToSignup }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [openSnack, setOpenSnack] = useState(false);
    const [processing, setProcessing] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const recentStation = localStorage.getItem('recent_station');
    const isSignIn = type === 'signin';

    const [formData, setFormData] = useState({ role: '', name: '', phone: '', email: '', gender: '', department: '', supervisor: '', employeeId: '', password: '', startDate: '', endDate: '' });
    const [errors, setErrors] = useState({});

    const isEmployee = formData.role === 'employee';
    const needsSupervisor = formData.role === 'intern' || formData.role === 'attachee';

    const handle = (field) => (e) => {
        setFormData(p => ({ ...p, [field]: e.target.value }));
        if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
    };

    const validate = () => {
        const e = {};
        if (isSignIn) {
            if (!formData.email) e.email = 'Email is required';
            if (!formData.password) e.password = 'Password is required';
        } else {
            if (!formData.role) e.role = 'Please select a role';
            if (!formData.name) e.name = 'Full name is required';
            if (!formData.phone) e.phone = 'Phone number is required';
            if (!formData.email) e.email = 'Email is required';
            if (!formData.gender) e.gender = 'Gender is required';
            if (!formData.department) e.department = 'Department is required';
            if (!formData.password) e.password = 'Password is required';
            if (isEmployee && !formData.employeeId) e.employeeId = 'Employee ID is required';
            if (needsSupervisor && !formData.supervisor) e.supervisor = 'Supervisor is required';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;
        setProcessing(true);
        try {
            const user = await loginUser(formData.email, formData.password);
            dispatch(updateUserCurrentUserRedux(user));
            setOpenSnack(true);
        } catch (err) { alert(err); }
        finally { setProcessing(false); }
    };

    const handleRegister = async () => {
        if (!validate()) return;
        setProcessing(true);
        try {
            await registerUser({ formData });
            setOpenSnack(true);
        } catch (err) { alert(err); }
        finally { setProcessing(false); }
    };

    const handleCloseSnack = (_, reason) => {
        if (reason === 'clickaway') return;
        setOpenSnack(false);
        window.location.reload();
    };

    /* shared light TextField sx */
    const tf = G.lightInput;

    return (
        <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.97 }}
            transition={{ duration: 0.44, ease: [0.4, 0, 0.2, 1] }}
        >
            <Card elevation={0} sx={{
                ...G.formCard,
                p: { xs: 3, md: 4.5 },
                maxWidth: isSignIn ? { xs: '100%', sm: 480 } : { xs: '100%', md: '70%', lg: '65%' },
                width: '100%',
                mx: 'auto',
                borderRadius: '28px',
            }}>
                {/* Close button */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: -1 }}>
                    <IconButton onClick={onBack} size="small" sx={{
                        background: 'rgba(10,61,98,0.07)',
                        border: '1px solid rgba(10,61,98,0.12)',
                        '&:hover': { background: 'rgba(10,61,98,0.13)' },
                    }}>
                        <Close sx={{ width: 14, height: 14, color: colorPalette.deepNavy }} />
                    </IconButton>
                </Box>

                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 3.5 }}>
                    <Box sx={{
                        width: 76, height: 76, borderRadius: '50%',
                        background: colorPalette.oceanGradient,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 2,
                        boxShadow: `0 10px 32px ${colorPalette.oceanBlue}42`,
                    }}>
                        {isSignIn ? <Lock sx={{ fontSize: 38, color: '#fff' }} /> : <PersonAdd sx={{ fontSize: 38, color: '#fff' }} />}
                    </Box>
                    <Typography variant="h4" fontWeight={900}
                        sx={{ background: colorPalette.oceanGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 0.75 }}>
                        {isSignIn ? 'Welcome Back' : 'Join KMFRI'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        {isSignIn ? 'Sign in to access your attendance portal' : 'Create your KMFRI account to get started'}
                    </Typography>
                </Box>

                <Stack spacing={3}>
                    {/* ── SIGN IN ── */}
                    {isSignIn && (
                        <Stack spacing={2.5}>
                            <TextField fullWidth label="Email Address" placeholder="example@kmfri.go.ke"
                                value={formData.email} onChange={handle('email')} error={!!errors.email} helperText={errors.email}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }}
                                sx={tf} />
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
                                }}
                                sx={tf} />
                            {recentStation && (
                                <Stack direction="row" alignItems="center" spacing={0.6}>
                                    <LocationOn sx={{ color: colorPalette.seafoamGreen, fontSize: 17 }} />
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Recent Station: {recentStation}
                                    </Typography>
                                </Stack>
                            )}
                        </Stack>
                    )}

                    {/* ── REGISTER ── */}
                    {!isSignIn && (
                        <Stack spacing={3}>
                            <RoleSelector
                                selected={formData.role}
                                onSelect={(v) => { setFormData(p => ({ ...p, role: v, supervisor: '', employeeId: '' })); setErrors(p => ({ ...p, role: '' })); }}
                            />
                            {errors.role && <Typography variant="caption" color="error" sx={{ mt: -1.5 }}>{errors.role}</Typography>}

                            {/* Personal */}
                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                                    <Badge sx={{ color: colorPalette.oceanBlue }} />
                                    <Typography variant="subtitle1" fontWeight={800} color={colorPalette.deepNavy}>Personal Information</Typography>
                                </Stack>
                                <Divider sx={{ mb: 2.5, borderColor: 'rgba(10,61,98,0.08)' }} />
                                <Stack spacing={2.5}>
                                    <TextField fullWidth required label="Full Name" placeholder="John Doe" value={formData.name} onChange={handle('name')} error={!!errors.name} helperText={errors.name}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Badge sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }} sx={tf} />
                                    <TextField fullWidth required label="Phone Number" placeholder="+254 700 123 456" value={formData.phone} onChange={handle('phone')} error={!!errors.phone} helperText={errors.phone}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }} sx={tf} />
                                    <TextField fullWidth required label="Email Address" type="email" placeholder="john.doe@kmfri.go.ke" value={formData.email} onChange={handle('email')} error={!!errors.email} helperText={errors.email}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }} sx={tf} />
                                    <TextField select fullWidth required label="Gender" value={formData.gender} onChange={handle('gender')} error={!!errors.gender} helperText={errors.gender}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }} sx={tf}>
                                        {genders.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                                    </TextField>
                                </Stack>
                            </Box>

                            {/* Departmental */}
                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                                    <Business sx={{ color: colorPalette.oceanBlue }} />
                                    <Typography variant="subtitle1" fontWeight={800} color={colorPalette.deepNavy}>Departmental Information</Typography>
                                </Stack>
                                <Divider sx={{ mb: 2.5, borderColor: 'rgba(10,61,98,0.08)' }} />
                                <Stack spacing={2.5}>
                                    <TextField select fullWidth required label="Department" value={formData.department} onChange={handle('department')} error={!!errors.department} helperText={errors.department}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Business sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }} sx={tf}>
                                        {departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                                    </TextField>
                                    <Collapse in={isEmployee}>
                                        <TextField fullWidth required={isEmployee} label="Employee ID" placeholder="e.g. KMFRI-2024-001" value={formData.employeeId} onChange={handle('employeeId')} error={!!errors.employeeId}
                                            helperText={errors.employeeId || 'Your official employment number (not National ID)'}
                                            InputProps={{ startAdornment: <InputAdornment position="start"><Numbers sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }} sx={tf} />
                                    </Collapse>
                                    <Collapse in={needsSupervisor}>
                                        <Stack spacing={2.5}>
                                            <TextField select fullWidth required={needsSupervisor} label="Assigned Supervisor" value={formData.supervisor} onChange={handle('supervisor')} error={!!errors.supervisor} helperText={errors.supervisor}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><SupervisorAccount sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }} sx={tf}>
                                                {supervisors.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                            </TextField>
                                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                                                <TextField fullWidth label="Valid From" type="date" value={formData.startDate} onChange={handle('startDate')} error={!!errors.startDate} helperText={errors.startDate}
                                                    InputLabelProps={{ shrink: true }}
                                                    InputProps={{ startAdornment: <InputAdornment position="start"><CalendarToday sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }} sx={tf} />
                                                <Typography variant="body2" fontWeight={700} color="text.disabled" sx={{ display: { xs: 'none', sm: 'block' }, flexShrink: 0 }}>to</Typography>
                                                <TextField fullWidth label="Valid Until" type="date" value={formData.endDate} onChange={handle('endDate')} error={!!errors.endDate} helperText={errors.endDate}
                                                    InputLabelProps={{ shrink: true }}
                                                    InputProps={{ startAdornment: <InputAdornment position="start"><CalendarToday sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }} sx={tf} />
                                            </Stack>
                                        </Stack>
                                    </Collapse>
                                </Stack>
                            </Box>

                            {/* Security */}
                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                                    <Lock sx={{ color: colorPalette.oceanBlue }} />
                                    <Typography variant="subtitle1" fontWeight={800} color={colorPalette.deepNavy}>Account Security</Typography>
                                </Stack>
                                <Divider sx={{ mb: 2.5, borderColor: 'rgba(10,61,98,0.08)' }} />
                                <TextField fullWidth required label="Create Password" placeholder="Minimum 8 characters"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password} onChange={handle('password')} error={!!errors.password} helperText={errors.password}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Lock sx={{ color: colorPalette.oceanBlue }} /></InputAdornment>,
                                        endAdornment: <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(p => !p)} edge="end">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>,
                                    }} sx={tf} />
                            </Box>
                        </Stack>
                    )}

                    {/* CTA */}
                    <Button
                        variant="contained" fullWidth disabled={processing}
                        onClick={isSignIn ? handleLogin : handleRegister}
                        startIcon={processing
                            ? <CircularProgress size={16} sx={{ color: 'rgba(255,255,255,0.7)' }} />
                            : isSignIn ? <Lock /> : <PersonAdd />}
                        sx={{
                            background: colorPalette.oceanGradient,
                            py: 1.75, borderRadius: '14px',
                            fontWeight: 800, fontSize: '0.92rem',
                            textTransform: 'none', letterSpacing: 0.35,
                            boxShadow: `0 8px 28px ${colorPalette.oceanBlue}42`,
                            transition: 'all 0.24s ease',
                            '&:hover': { boxShadow: `0 14px 36px ${colorPalette.oceanBlue}5a`, transform: 'translateY(-2px)' },
                        }}
                    >
                        {processing ? 'Please wait…' : isSignIn ? 'Sign In to Portal' : 'Complete Registration'}
                    </Button>

                    {isSignIn && (
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                            Don't have an account?{' '}
                            <Button variant="text" onClick={onSwitchToSignup}
                                sx={{ color: colorPalette.oceanBlue, fontWeight: 700, textTransform: 'none', p: 0, minWidth: 'auto', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
                                Register here
                            </Button>
                        </Typography>
                    )}
                </Stack>
            </Card>

            <Snackbar open={openSnack} autoHideDuration={1200} onClose={handleCloseSnack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnack} severity="success" icon={<CheckCircle />}
                    sx={{ borderRadius: '14px', fontWeight: 700, backdropFilter: 'blur(16px)', boxShadow: '0 8px 28px rgba(72,201,176,0.32)' }}>
                    {isSignIn ? '✓ Login successful!' : '✓ Registration submitted! Please await approval.'}
                </Alert>
            </Snackbar>
        </motion.div>
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════════════════════════════════ */
const EnhancedLandingPage = () => {
    const [view, setView] = useState('landing');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Box sx={{ minHeight: '100vh', background: G.meshBg, position: 'relative' }}>
            <EnhancedNavbar onNavigate={setView} currentView={view} />

            <AnimatePresence mode="wait">

                {/* ══════════════ LANDING ══════════════ */}
                {view === 'landing' && (
                    <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.42 }}>

                        {/* ─── HERO ──────────────────────────────────────────── */}
                        <Box sx={{ pt: { xs: 13, md: 18 }, pb: { xs: 8, md: 12 }, position: 'relative', overflow: 'hidden' }}>
                            <AmbientOrbs />
                            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                                <Grid container spacing={5} alignItems="center">

                                    {/* copy */}
                                    <Grid item xs={12} md={6}>
                                        <motion.div initial={{ opacity: 0, x: -44 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.75 }}>
                                            <Chip
                                                label="Digital Attendance Platform"
                                                size="small"
                                                sx={{
                                                    background: 'rgba(0,220,255,0.12)',
                                                    backdropFilter: 'blur(8px)',
                                                    color: '#00e5ff',
                                                    fontWeight: 700,
                                                    border: '1px solid rgba(0,220,255,0.26)',
                                                    mb: 2.5, px: 1, fontSize: '0.72rem',
                                                }}
                                            />
                                            <Typography variant={isMobile ? 'h3' : 'h2'} component="h1" fontWeight={900}
                                                sx={{ color: '#fff', mb: 2, lineHeight: 1.16, textShadow: '0 4px 18px rgba(0,0,0,0.24)' }}>
                                                Powering KMFRI
                                                <Box component="span" sx={{ color: '#00e5ff', display: 'block' }}>
                                                    Workforce Management
                                                </Box>
                                            </Typography>
                                            <Typography variant="h6"
                                                sx={{ color: 'rgba(255,255,255,0.80)', mb: 4.5, fontWeight: 400, lineHeight: 1.7, maxWidth: 520 }}>
                                                A unified digital platform for{' '}
                                                <Box component="span" sx={{ color: '#00e5ff', fontWeight: 700 }}>all KMFRI staff</Box>
                                                {' '}— employees, interns, and attachés — to clock in and out with geo-verification and biometric authentication.
                                            </Typography>
                                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                                <Button variant="contained" size="large" startIcon={<Lock />}
                                                    onClick={() => setView('signin')}
                                                    sx={{
                                                        bgcolor: '#00e5ff', color: colorPalette.deepNavy,
                                                        fontWeight: 800, px: 4, py: 1.75, borderRadius: '14px',
                                                        textTransform: 'none', fontSize: '1rem',
                                                        boxShadow: '0 8px 28px rgba(0,220,255,0.40)',
                                                        transition: 'all 0.26s ease',
                                                        '&:hover': { bgcolor: '#fff', transform: 'translateY(-2px)', boxShadow: '0 14px 36px rgba(255,255,255,0.26)' },
                                                    }}>
                                                    Sign In
                                                </Button>
                                                <Button variant="outlined" size="large" startIcon={<PersonAdd />}
                                                    onClick={() => setView('signup')}
                                                    sx={{
                                                        ...G.ghostBtn,
                                                        fontWeight: 700, px: 4, py: 1.75, borderRadius: '14px',
                                                        textTransform: 'none', fontSize: '1rem',
                                                        transition: 'all 0.22s ease',
                                                        '&:hover': { background: 'rgba(255,255,255,0.18)', borderColor: '#fff', transform: 'translateY(-1px)' },
                                                    }}>
                                                    Register
                                                </Button>
                                            </Stack>
                                        </motion.div>
                                    </Grid>

                                    {/* capabilities panel */}
                                    <Grid item xs={12} md={6}>
                                        <motion.div initial={{ opacity: 0, scale: 0.84 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.75, delay: 0.16 }}>
                                            <Box sx={{ ...G.surfaceStrong, borderRadius: '24px', p: { xs: 3, md: 3.5 } }}>
                                                <Typography variant="subtitle2" fontWeight={900}
                                                    sx={{ color: 'rgba(255,255,255,0.42)', mb: 2, letterSpacing: 1.3, textTransform: 'uppercase', fontSize: '0.62rem' }}>
                                                    Platform Capabilities
                                                </Typography>
                                                <Stack spacing={1.2}>
                                                    {[
                                                        { icon: <Security />, text: 'Geo-Location Verified Check-ins', color: colorPalette.seafoamGreen },
                                                        { icon: <Fingerprint />, text: 'Biometric Fingerprint Authentication', color: colorPalette.cyanFresh },
                                                        { icon: <Schedule />, text: 'Real-time Attendance & Shift Tracking', color: '#00e5ff' },
                                                        { icon: <Analytics />, text: 'Automated Reports & HR Analytics', color: colorPalette.warmSand },
                                                        { icon: <Work />, text: 'Task & Activity Management', color: colorPalette.coralSunset },
                                                    ].map((item, i) => (
                                                        <motion.div key={i} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.28 + i * 0.08 }}>
                                                            <Box sx={{
                                                                background: 'rgba(255,255,255,0.06)',
                                                                backdropFilter: 'blur(8px)',
                                                                border: '1px solid rgba(255,255,255,0.10)',
                                                                display: 'flex', alignItems: 'center',
                                                                p: 1.6, borderRadius: '13px',
                                                                transition: 'all 0.22s ease',
                                                                '&:hover': { background: 'rgba(255,255,255,0.12)', transform: 'translateX(5px)' },
                                                            }}>
                                                                <Box sx={{
                                                                    p: 0.85, borderRadius: '10px', mr: 1.8,
                                                                    background: `${item.color}1e`,
                                                                    border: `1px solid ${item.color}2e`,
                                                                    color: item.color, display: 'flex', flexShrink: 0,
                                                                }}>
                                                                    {item.icon}
                                                                </Box>
                                                                <Typography fontWeight={700} sx={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.875rem' }}>
                                                                    {item.text}
                                                                </Typography>
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

                        {/* ─── STATS ─────────────────────────────────────────── */}
                        <Container maxWidth="lg" sx={{ pb: 9, position: 'relative', zIndex: 1 }}>
                            <Grid container spacing={2.5}>
                                {[
                                    { value: '800+', label: 'Active Staff Members', icon: <GroupWork sx={{ fontSize: 34 }} />, color: '#00e5ff', delay: 0.08 },
                                    { value: '98%', label: 'System Uptime', icon: <TrendingUp sx={{ fontSize: 34 }} />, color: colorPalette.seafoamGreen, delay: 0.16 },
                                    { value: '12', label: 'Research Stations', icon: <LocationOn sx={{ fontSize: 34 }} />, color: colorPalette.cyanFresh, delay: 0.24 },
                                    { value: '3', label: 'Staff Categories', icon: <CheckCircle sx={{ fontSize: 34 }} />, color: colorPalette.warmSand, delay: 0.32 },
                                ].map(s => <Grid item xs={6} md={3} key={s.label}><GlassStatsCard {...s} /></Grid>)}
                            </Grid>
                        </Container>

                        {/* Mobile App */}
                        {/* ─── MOBILE APP SECTION ─────────────────────────── */}
                        <Box sx={{ pb: { xs: 8, md: 10 }, position: 'relative', zIndex: 1 }}>
                            <Container maxWidth="lg">
                                <motion.div
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <Box
                                        sx={{
                                            ...G.surfaceStrong,
                                            borderRadius: '28px',
                                            p: { xs: 4, md: 6 },
                                            textAlign: 'center',
                                        }}
                                    >
                                        {/* Big Icon */}
                                        <Box
                                            sx={{
                                                width: 120,
                                                height: 120,
                                                borderRadius: '28px',
                                                mx: 'auto',
                                                mb: 3,
                                                background: colorPalette.oceanGradient,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: `0 20px 60px ${colorPalette.oceanBlue}55`,
                                            }}
                                        >
                                            <PhoneIphone sx={{ fontSize: 64, color: '#fff' }} />
                                        </Box>

                                        <Typography
                                            variant="h4"
                                            fontWeight={900}
                                            sx={{
                                                color: '#fff',
                                                mb: 2,
                                                textShadow: '0 4px 18px rgba(0,0,0,0.25)',
                                            }}
                                        >
                                            Get the KMFRI Mobile App
                                        </Typography>

                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: 'rgba(255,255,255,0.75)',
                                                mb: 4,
                                                maxWidth: 600,
                                                mx: 'auto',
                                                lineHeight: 1.8,
                                            }}
                                        >
                                            Access attendance, biometric authentication, and real-time tracking
                                            directly from your smartphone. Faster, more secure, and optimized
                                            for on-site usage. Clock using Android Application In case you face hindrance when using our web portal.
                                        </Typography>

                                        <Button
                                            variant="contained"
                                            size="large"
                                            startIcon={<PhoneIphone />}
                                            sx={{
                                                background: colorPalette.oceanGradient,
                                                px: 5,
                                                py: 1.8,
                                                borderRadius: '16px',
                                                fontWeight: 800,
                                                textTransform: 'none',
                                                fontSize: '1rem',
                                                boxShadow: `0 12px 40px ${colorPalette.oceanBlue}50`,
                                                transition: 'all 0.25s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-3px)',
                                                    boxShadow: `0 20px 60px ${colorPalette.oceanBlue}70`,
                                                },
                                            }}
                                        >
                                            Download App
                                        </Button>
                                    </Box>
                                </motion.div>
                            </Container>
                        </Box>


                        {/*  */}

                        {/* ─── WHO CAN USE ───────────────────────────────────── */}
                        <Box sx={{ py: { xs: 8, md: 11 }, position: 'relative', zIndex: 1 }}>
                            <Box sx={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(3px)', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
                            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                                <Box sx={{ textAlign: 'center', mb: 6 }}>
                                    <Typography variant="h4" fontWeight={900} sx={{ color: '#fff', mb: 1.5, textShadow: '0 4px 18px rgba(0,0,0,0.22)' }}>
                                        Built for Everyone at KMFRI
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.62)', maxWidth: 560, mx: 'auto', fontWeight: 500, lineHeight: 1.72 }}>
                                        Whether you're a permanent staff member, an intern, or an attaché — your single point for attendance, reporting, and HR management.
                                    </Typography>
                                </Box>
                                <Grid container spacing={3}>
                                    {[
                                        { emoji: '👔', title: 'Employees', subtitle: 'Full-time & Part-time Staff', color: colorPalette.oceanBlue, desc: 'Clock in/out with your Employee ID, track monthly hours, generate attendance reports, and view your HR statistics from a single dashboard.' },
                                        { emoji: '🎓', title: 'Interns', subtitle: 'University & College Students', color: colorPalette.seafoamGreen, desc: 'Manage internship attendance with geo-verified check-ins, get assigned to your supervisor, and track progress throughout your placement.' },
                                        { emoji: '📋', title: 'Attachés', subtitle: 'Industrial Attachment', color: colorPalette.warmSand, desc: 'Keep accurate records of your attachment period, submit daily activity reports, and maintain a clear trail of your time at KMFRI.' },
                                    ].map((card, i) => (
                                        <Grid item xs={12} md={4} key={card.title}>
                                            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1, duration: 0.6 }} style={{ height: '100%' }}>
                                                <Box sx={{
                                                    ...G.surface, borderRadius: '22px', p: 3.5, height: '100%',
                                                    transition: 'all 0.28s ease',
                                                    '&:hover': { ...G.surfaceHover, transform: 'translateY(-7px)' },
                                                }}>
                                                    <Typography sx={{ fontSize: '2.4rem', mb: 1.5, lineHeight: 1 }}>{card.emoji}</Typography>
                                                    <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', mb: 0.3 }}>{card.title}</Typography>
                                                    <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.9, fontSize: '0.64rem', color: card.color }}>
                                                        {card.subtitle}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.64)', lineHeight: 1.74 }}>
                                                        {card.desc}
                                                    </Typography>
                                                </Box>
                                            </motion.div>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Container>
                        </Box>

                        {/* ─── PLATFORM FEATURES ─────────────────────────────── */}
                        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 11 }, position: 'relative', zIndex: 1 }}>
                            <Box sx={{ textAlign: 'center', mb: 6 }}>
                                <Typography variant="h4" fontWeight={900} sx={{ color: '#fff', mb: 1.5, textShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
                                    Platform Features
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.60)', maxWidth: 540, mx: 'auto', fontWeight: 500, lineHeight: 1.7 }}>
                                    Everything you need to manage attendance and HR tasks — in one place
                                </Typography>
                            </Box>
                            <Grid container spacing={3}>
                                {[
                                    { icon: <LocationOn sx={{ fontSize: 28, color: '#fff' }} />, title: 'Geo-Verified Check-ins', description: 'Automatic location verification ensures authentic clock-ins within 1.2km of any KMFRI station — no proxy sign-ins.', color: colorPalette.seafoamGreen, delay: 0.08 },
                                    { icon: <Fingerprint sx={{ fontSize: 28, color: '#fff' }} />, title: 'Biometric Security', description: 'One-time fingerprint registration unlocks secure, fast authentication at all KMFRI stations across all sites.', color: colorPalette.cyanFresh, delay: 0.16 },
                                    { icon: <Analytics sx={{ fontSize: 28, color: '#fff' }} />, title: 'Instant Reports', description: 'Download detailed PDF attendance reports with one click — ready for supervisor review or HR audit at any time.', color: colorPalette.warmSand, delay: 0.24 },
                                ].map(f => <Grid item xs={12} md={4} key={f.title}><GlassFeatureCard {...f} /></Grid>)}
                            </Grid>
                        </Container>

                        {/* ─── FOOTER ────────────────────────────────────────── */}
                        <Box sx={{
                            ...G.surface,
                            borderRadius: 0,
                            borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
                            borderTop: '1px solid rgba(255,255,255,0.09)',
                            py: 7, position: 'relative', zIndex: 1,
                        }}>
                            <Container maxWidth="lg">
                                <Grid container spacing={5}>
                                    <Grid item xs={12} md={4}>
                                        <Stack direction="row" gap={2} alignItems="center" mb={2}>
                                            <Box component="img" src={KMFRILogo} alt="KMFRI"
                                                sx={{ height: 50, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }} />
                                            <Box>
                                                <Typography variant="h6" fontWeight={800} sx={{ color: '#fff' }}>KMFRI</Typography>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.46)', fontSize: '0.67rem' }}>
                                                    Kenya Marine & Fisheries Research Institute
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.56)', lineHeight: 1.76 }}>
                                            Leading marine research and sustainable fisheries development in East Africa since 1979.
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="subtitle2" fontWeight={700}
                                            sx={{ mb: 2, color: 'rgba(255,255,255,0.44)', letterSpacing: 1.1, textTransform: 'uppercase', fontSize: '0.67rem' }}>
                                            Quick Links
                                        </Typography>
                                        <Stack spacing={0.3}>
                                            {['About KMFRI', 'Research Areas', 'Contact Us', 'Help & Support', 'Privacy Policy'].map(link => (
                                                <Button key={link} sx={{ color: 'rgba(255,255,255,0.60)', justifyContent: 'flex-start', textTransform: 'none', fontWeight: 500, fontSize: '0.855rem', py: 0.6, '&:hover': { color: '#00e5ff', bgcolor: 'rgba(255,255,255,0.04)' } }}>
                                                    {link}
                                                </Button>
                                            ))}
                                        </Stack>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="subtitle2" fontWeight={700}
                                            sx={{ mb: 2, color: 'rgba(255,255,255,0.44)', letterSpacing: 1.1, textTransform: 'uppercase', fontSize: '0.67rem' }}>
                                            Contact
                                        </Typography>
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

                {/* ══════════════ AUTH VIEWS ══════════════ */}
                {view !== 'landing' && (
                    <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.38 }}>
                        <Box sx={{
                            minHeight: '100vh',
                            display: 'flex', alignItems: 'center',
                            pt: { xs: 10, md: 13 }, pb: { xs: 6, md: 8 },
                            position: 'relative', overflow: 'hidden',
                        }}>
                            <AmbientOrbs />
                            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                                <AuthCard key={view} type={view} onBack={() => setView('landing')} onSwitchToSignup={() => setView('signup')} />
                            </Container>
                        </Box>
                    </motion.div>
                )}

            </AnimatePresence>
        </Box>
    );
};

export default EnhancedLandingPage;