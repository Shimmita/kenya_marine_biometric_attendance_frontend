import {
    Analytics,
    Badge,
    Business,
    CalendarToday,
    CheckCircle,
    Close,
    Email,
    GroupWork,
    LocationOn,
    Lock,
    Person,
    PersonAdd,
    Phone,
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
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
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
    useTheme
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { CgMenu } from 'react-icons/cg';
import { useNavigate } from 'react-router-dom';
import KMFRILogo from '../assets/kmfri.png';
import { loginUser } from './auth/Login';
import { registerUser } from './auth/Register';
import { updateUserCurrentUserRedux } from '../redux/CurrentUser';
import { useDispatch } from 'react-redux';


// Color Palette (matching the dashboard)
const colorPalette = {
    deepNavy: '#0A3D62',
    oceanBlue: '#005B96',
    marineBlue: '#1a237e',
    aquaVibrant: '#00e5ff',
    cyanFresh: '#368DC5',
    skyBlue: '#87CEEB',
    coralSunset: '#FF6F61',
    warmSand: '#FFB400',
    seafoamGreen: '#48C9B0',
    cloudWhite: '#f8fafd',
    softGray: '#E8EEF7',
    charcoal: '#424242',
    oceanGradient: 'linear-gradient(135deg, #0A3D62 0%, #005B96 50%, #1B4F72 100%)',
    sunsetGradient: 'linear-gradient(135deg, #FF6F61 0%, #FFB400 100%)',
    freshGradient: 'linear-gradient(135deg, #00e5ff 0%, #48C9B0 100%)',
};

const departments = [
    "ICT",
    "Human Resources",
    "Finance",
    "Administration",
    "Logistics",
    "Research and Development",
    "Policy and Planning",
    "Extension and Outreach",
    "Legal Affairs",
    "Public Relations",
    "Quality Assurance",
    "Health and Safety",
    "Facilities Management",
    "Library and Information Services",
    "Training and Capacity Building",
    "Project Management",
    "Monitoring and Evaluation",
    "Data Analysis",
    "GIS and Remote Sensing",
    "Climate Change Studies",
    "Marine Conservation",
    "Marine Spatial Planning",
    "Fisheries Management",
    "Stock Assessment",
    "Marine Pollution Control",
    "Coastal Zone Management",
    "Marine Policy Development",
    "International Relations",
    "Community Engagement",
    "Sustainable Development",
    "Innovation and Technology Transfer",
    "Entrepreneurship Development",
    "Stores and Procurement",
    "Security Services",
    "Transport Services",
    "Catering Services",
    "Housekeeping Services",
    "Event Management",
    "Customer Service",
    "Stakeholder Relations",
    "Corporate Social Responsibility",
    "Environmental Impact Assessment",
    "Biodiversity Studies",
    "Aquaculture Research",
    "Fisheries Economics",
    "Marine Biotechnology",
    "Oceanography",
    "Hydrography",
    "Marine Geology",
    "Marine Ecology",
    "Fisheries Technology",
    "Post-Harvest Technology",
    "Fish Processing",
    "Quality Control",
    "Laboratory Services",
    "Field Operations",
    "Vessel Operations",
    "Diving Operations",
    "Safety and Compliance",
    "Training and Development",
    "Human Resource Development",
    "Organizational Development",
    "Performance Management",
    "Compensation and Benefits",
    "Employee Relations",
    "Recruitment and Staffing",
    "Payroll Management",
    "Budgeting and Forecasting",
    "Financial Reporting",
    "Audit and Compliance",
    "Taxation",
    "Accounts Payable",
    "Accounts Receivable"


];

const supervisors = [
    "Edna Onkundi",
    "Polycarp Atunga",
    "Samuel Agwata",
    "Faith Gwanda"
];

const genders = [
    'Male',
    'Female',
    'Other'
];

const datePickerStyle = {
    flex: 1, // Ensures equal width for both pickers
    '& .MuiOutlinedInput-root': {
        borderRadius: 3,
        '&.Mui-focused fieldset': {
            borderColor: colorPalette.oceanBlue,
            borderWidth: 2
        }
    },
    // This targets the native date icon to make it clickable but keeps your custom icon visible
    '& input::-webkit-calendar-picker-indicator': {
        cursor: 'pointer',
    },
    mt: { xs: 2, sm: 0 } // Add top margin on mobile for better spacing
};

// Enhanced Navbar Component
const EnhancedNavbar = ({ onNavigate, currentView }) => {
    const theme = useTheme();
    const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
    const [anchorElUser, setAnchorElUser] = useState(null);

    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleMenuClick = (setting) => {
        handleCloseUserMenu();
        if (setting === 'Login') {
            onNavigate('signin');
        } else if (setting === 'Register') {
            onNavigate('signup');
        }
    };

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                background: colorPalette.oceanGradient,
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
            }}
        >
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ py: 1 }}>
                    {/* Logo */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mr: 2,
                            cursor: 'pointer'
                        }}
                        onClick={() => onNavigate('landing')}
                    >
                        <Box
                            component="img"
                            src={KMFRILogo}
                            alt="KMFRI Logo"
                            sx={{
                                height: { md: 50, lg: 60, xs: 50 },
                                width: 'auto',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '3px solid rgba(255,255,255,0.2)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            }}
                        />

                    </Box>

                    {/* Title */}
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography
                            variant={isMdUp ? "h6" : "body1"}
                            noWrap
                            sx={{
                                fontWeight: 800,
                                letterSpacing: isMdUp ? 0.5 : 0,
                                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                cursor: 'pointer'
                            }}
                            onClick={() => onNavigate('landing')}
                        >
                            {isMdUp ? 'Kenya Marine and Fisheries Research Institute' : 'KMFRI Portal'}
                        </Typography>
                        {isMdUp && (
                            <Typography
                                variant="caption"
                                sx={{
                                    opacity: 0.9,
                                    display: 'block',
                                    fontWeight: 500,
                                    letterSpacing: 0.5
                                }}
                            >
                                Digital Attendance & Task Management System for Interns and Attachés
                            </Typography>
                        )}
                    </Box>

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={2} alignItems="center">
                        {currentView === 'landing' && (
                            <Button
                                variant="outlined"
                                startIcon={<Lock />}
                                onClick={() => onNavigate('signin')}
                                sx={{
                                    display: { xs: 'none', sm: 'flex' },
                                    color: 'white',
                                    borderColor: 'rgba(255,255,255,0.3)',
                                    fontWeight: 700,
                                    px: 3,
                                    borderRadius: 3,
                                    textTransform: 'none',
                                    backdropFilter: 'blur(10px)',
                                    bgcolor: 'rgba(255,255,255,0.1)',
                                    '&:hover': {
                                        borderColor: colorPalette.aquaVibrant,
                                        bgcolor: 'rgba(0,229,255,0.15)',
                                    }
                                }}
                            >
                                Login
                            </Button>
                        )}

                        <Tooltip title="Menu">
                            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                <Avatar
                                    sx={{
                                        width: { xs: 36, md: 44 },
                                        height: { xs: 36, md: 44 },
                                        bgcolor: colorPalette.aquaVibrant,
                                        color: colorPalette.deepNavy,
                                        fontWeight: 'bold',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    <CgMenu size={24} />
                                </Avatar>
                            </IconButton>
                        </Tooltip>
                        <Menu
                            sx={{ mt: '50px' }}
                            id="user-menu"
                            anchorEl={anchorElUser}
                            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                            keepMounted
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            open={Boolean(anchorElUser)}
                            onClose={handleCloseUserMenu}
                            PaperProps={{
                                sx: {
                                    borderRadius: 3,
                                    mt: 1,
                                    minWidth: 180,
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                                }
                            }}
                        >
                            {['Login', 'Register'].map((setting) => (
                                <MenuItem
                                    key={setting}
                                    onClick={() => handleMenuClick(setting)}
                                    sx={{
                                        py: 1.5,
                                        px: 2,
                                        '&:hover': {
                                            bgcolor: `${colorPalette.oceanBlue}15`
                                        }
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 600 }}>{setting}</Typography>
                                </MenuItem>
                            ))}
                        </Menu>
                    </Stack>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description, gradient, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay }}
    >
        <Paper
            elevation={0}
            sx={{
                p: 3,
                height: '100%',
                borderRadius: 4,
                border: `1px solid ${colorPalette.softGray}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(10, 61, 98, 0.15)',
                    borderColor: colorPalette.cyanFresh,
                }
            }}
        >
            <Box
                sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 3,
                    background: gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    boxShadow: `0 8px 24px ${colorPalette.oceanBlue}30`
                }}
            >
                {icon}
            </Box>
            <Typography variant="h6" fontWeight="800" color={colorPalette.deepNavy} sx={{ mb: 1 }}>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {description}
            </Typography>
        </Paper>
    </motion.div>
);

// Stats Card Component
const StatsCard = ({ value, label, icon, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay }}
    >
        <Card
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 4,
                bgcolor: `${color}10`,
                border: `2px solid ${color}30`,
                textAlign: 'center'
            }}
        >
            <Box sx={{ color, mb: 1 }}>
                {icon}
            </Box>
            <Typography variant="h3" fontWeight="900" color={color}>
                {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {label}
            </Typography>
        </Card>
    </motion.div>
);

// Forgot Password Modal Component
const ForgotPasswordModal = ({ open, onClose }) => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        // Handle password reset logic here
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            onClose();
            setEmail('');
        }, 3000);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 5 },

            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Lock sx={{ color: colorPalette.oceanBlue, mr: 1 }} />
                        <Typography variant="h6" fontWeight="800" color={colorPalette.deepNavy}>
                            Reset Password
                        </Typography>
                    </Box>
                </Stack>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
                {!submitted ? (
                    <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Enter your email address and we'll send you instructions to reset your password.
                        </Typography>
                        <TextField
                            autoFocus
                            fullWidth
                            label="Email Address"
                            placeholder="example@kmfri.go.ke"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Email sx={{ color: colorPalette.oceanBlue }} />
                                    </InputAdornment>
                                )
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    '&.Mui-focused fieldset': {
                                        borderColor: colorPalette.oceanBlue,
                                        borderWidth: 2
                                    }
                                }
                            }}
                        />
                    </>
                ) : (
                    <Alert
                        severity="success"
                        icon={<CheckCircle />}
                        sx={{ borderRadius: 3 }}
                    >
                        Password reset instructions have been sent to your email!
                    </Alert>
                )}
            </DialogContent>
            {!submitted && (
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        onClick={onClose}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            color: colorPalette.charcoal
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!email}
                        sx={{
                            background: colorPalette.oceanGradient,
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 3,
                            borderRadius: 3,
                            '&:hover': {
                                opacity: 0.9
                            }
                        }}
                    >
                        Reset Password
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

// Auth Card Component (Enhanced)
const AuthCard = ({ type, onBack, onSwitchToSignup }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [openSnack, setOpenSnack] = useState(false);
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        gender: '',
        department: '',
        supervisor: '',
        password: '',
        startDate: '',
        endDate: ''
    });
    const [errors, setErrors] = useState({});
    const [isAuthShown, setIsAuthShown] = useState(true);
    const [processing, setProcessing] = useState(false);
    const navigate = useNavigate();

    const handleChange = (field) => (event) => {
        setFormData({ ...formData, [field]: event.target.value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (type === 'signin') {
            if (!formData.email) newErrors.email = 'Email is required';
            if (!formData.password) newErrors.password = 'Password is required';
            console.log('signin validation')
        } else {
            if (!formData.name) newErrors.name = 'Full name is required';
            if (!formData.phone) newErrors.phone = 'Phone number is required';
            if (!formData.email) newErrors.email = 'Email is required';
            if (!formData.department) newErrors.department = 'Department is required';
            if (!formData.supervisor) newErrors.supervisor = 'Supervisor is required';
            if (!formData.password) newErrors.password = 'Password is required';
            console.log('register validation', formData)

        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {

        // validate the form
        if (validateForm()) {
            // update processing state
            setProcessing(true);
            try {

                // perfom login request
                const user = await loginUser(formData.email, formData.password);

                // udate the global state with the logged in user
                dispatch(updateUserCurrentUserRedux(user));

                // update the snack
                setOpenSnack(true);

            } catch (error) {
                alert(error);
            } finally {
                setProcessing(false);
            }

        }
    };

    const handleRegister = async () => {

        // validate the form
        if (validateForm()) {
            // update processing state
            setProcessing(true);
            try {

                console.log('in regiser')
                const res = await registerUser({ formData });
                console.log(res)

                // update the snack
                setOpenSnack(true);

            } catch (error) {
                alert(error);
            } finally {
                setProcessing(false);
            }

        }
    }



    const handleCloseSnack = (event, reason) => {
        setProcessing(false);
        navigate('/dashboard');
        if (reason === 'clickaway') return;
        setOpenSnack(false);
        if (type !== 'signin') {
            setTimeout(() => navigate('/dashboard'), 200);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <Card
                    elevation={0}
                    sx={{
                        p: { xs: 3, md: 4 },
                        maxWidth: type === 'signin' ? { xs: '100%', md: 500 } : { xs: '100%', md: 900 },
                        width: '100%',
                        mx: 'auto',
                        borderRadius: 5,
                        boxShadow: '0 20px 60px rgba(10, 61, 98, 0.25)',
                        bgcolor: 'white',
                        border: `1px solid ${colorPalette.softGray}`,
                        display: `${isAuthShown ? 'block' : 'none'}`
                    }}
                >
                    <Box width={'100%'} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title="Close" arrow>
                            <IconButton onClick={onBack} sx={{
                                border: `1px solid ${colorPalette.softGray}`
                            }}>
                                <Close sx={{ width: 15, height: 15 }} />
                            </IconButton>
                        </Tooltip>

                    </Box>

                    {/* Header */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>

                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                background: colorPalette.oceanGradient,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2,
                                boxShadow: `0 8px 24px ${colorPalette.oceanBlue}40`
                            }}
                        >
                            {type === 'signin' ? (
                                <Lock sx={{ fontSize: 40, color: 'white' }} />
                            ) : (
                                <PersonAdd sx={{ fontSize: 40, color: 'white' }} />
                            )}
                        </Box>
                        <Typography variant="h4" fontWeight="900" sx={{
                            background: colorPalette.oceanGradient,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1
                        }}>
                            {type === 'signin' ? 'Welcome Back' : 'Join KMFRI'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {type === 'signin'
                                ? 'Enter your credentials to access your attendance portal'
                                : 'Register as an intern or attaché today'}
                        </Typography>
                    </Box>

                    <Stack spacing={3}>
                        {type === 'signin' ? (
                            /* --- LOGIN VIEW --- */
                            <Stack spacing={3}>
                                <TextField
                                    fullWidth
                                    placeholder="example@kmfri.go.ke"
                                    label="Email Address"
                                    variant="outlined"
                                    value={formData.email}
                                    onChange={handleChange('email')}
                                    error={!!errors.email}
                                    helperText={errors.email}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Email sx={{ color: colorPalette.oceanBlue }} />
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            '&.Mui-focused fieldset': {
                                                borderColor: colorPalette.oceanBlue,
                                                borderWidth: 2
                                            }
                                        }
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    label="Password"
                                    placeholder="Enter your password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange('password')}
                                    error={!!errors.password}
                                    helperText={errors.password}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Lock sx={{ color: colorPalette.oceanBlue }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            '&.Mui-focused fieldset': {
                                                borderColor: colorPalette.oceanBlue,
                                                borderWidth: 2
                                            }
                                        }
                                    }}
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <LocationOn sx={{ color: colorPalette.seafoamGreen, fontSize: 20, mr: 0.5 }} />
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            Location: Mombasa HQ
                                        </Typography>
                                    </Box>
                                    {/* <Button
                                        size="small"
                                        onClick={() => {
                                            setForgotPasswordOpen(true);
                                            setIsAuthShown(false);
                                        }}
                                        sx={{
                                            textTransform: 'none',
                                            color: colorPalette.oceanBlue,
                                            fontWeight: 700,
                                            '&:hover': { bgcolor: `${colorPalette.oceanBlue}10` }
                                        }}
                                    >
                                        Forgot Password?
                                    </Button> */}
                                </Box>
                            </Stack>
                        ) : (
                            /* --- REGISTER VIEW --- */
                            <Stack container spacing={4}>
                                {/* Personal Information Section */}
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Badge sx={{ color: colorPalette.oceanBlue, mr: 1 }} />
                                    <Typography variant="h6" fontWeight="800" color={colorPalette.deepNavy}>
                                        Personal Information
                                    </Typography>
                                </Box>
                                <Divider />

                                <TextField
                                    placeholder="John Doe"
                                    required
                                    fullWidth
                                    label="Full Name"
                                    value={formData.name}
                                    onChange={handleChange('name')}
                                    error={!!errors.name}
                                    helperText={errors.name}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Badge sx={{ color: colorPalette.oceanBlue }} />
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            '&.Mui-focused fieldset': {
                                                borderColor: colorPalette.oceanBlue,
                                                borderWidth: 2
                                            }
                                        }
                                    }}
                                />



                                <TextField
                                    placeholder="+254 700 123 456"
                                    required
                                    fullWidth
                                    label="Phone Number"
                                    value={formData.phone}
                                    onChange={handleChange('phone')}
                                    error={!!errors.phone}
                                    helperText={errors.phone}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Phone sx={{ color: colorPalette.oceanBlue }} />
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            '&.Mui-focused fieldset': {
                                                borderColor: colorPalette.oceanBlue,
                                                borderWidth: 2
                                            }
                                        }
                                    }}
                                />

                                <TextField
                                    placeholder="john.doe@example.com"
                                    required
                                    fullWidth
                                    label="Email Address"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange('email')}
                                    error={!!errors.email}
                                    helperText={errors.email}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Email sx={{ color: colorPalette.oceanBlue }} />
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            '&.Mui-focused fieldset': {
                                                borderColor: colorPalette.oceanBlue,
                                                borderWidth: 2
                                            }
                                        }
                                    }}
                                />

                                <TextField
                                    required
                                    select
                                    fullWidth
                                    label="Gender"
                                    value={formData.gender}
                                    onChange={handleChange('gender')}
                                    error={!!errors.gender}
                                    helperText={errors.gender}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Person sx={{ color: colorPalette.oceanBlue }} />
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            '&.Mui-focused fieldset': {
                                                borderColor: colorPalette.oceanBlue,
                                                borderWidth: 2
                                            }
                                        }
                                    }}
                                >
                                    {genders.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                {/* Departmental Information Section */}
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, mt: 1 }}>
                                    <Business sx={{ color: colorPalette.oceanBlue, mr: 1 }} />
                                    <Typography variant="h6" fontWeight="800" color={colorPalette.deepNavy}>
                                        Departmental Information
                                    </Typography>
                                </Box>
                                <Divider />

                                <TextField
                                    required
                                    select
                                    fullWidth
                                    label="Department"
                                    value={formData.department}
                                    onChange={handleChange('department')}
                                    error={!!errors.department}
                                    helperText={errors.department}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Business sx={{ color: colorPalette.oceanBlue }} />
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            '&.Mui-focused fieldset': {
                                                borderColor: colorPalette.oceanBlue,
                                                borderWidth: 2
                                            }
                                        }
                                    }}
                                >
                                    {departments.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                <TextField
                                    required
                                    select
                                    fullWidth
                                    label="Assigned Supervisor"
                                    value={formData.supervisor}
                                    onChange={handleChange('supervisor')}
                                    error={!!errors.supervisor}
                                    helperText={errors.supervisor}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SupervisorAccount sx={{ color: colorPalette.oceanBlue }} />
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            '&.Mui-focused fieldset': {
                                                borderColor: colorPalette.oceanBlue,
                                                borderWidth: 2
                                            }
                                        }
                                    }}
                                >
                                    {supervisors.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    alignItems: 'center',
                                    width: '100%',
                                    gap: 2,

                                }}>
                                    <TextField
                                        label="Valid From (Date)"
                                        type="date"
                                        required
                                        fullWidth
                                        value={formData.startDate}
                                        onChange={handleChange('startDate')}
                                        error={!!errors.startDate}
                                        helperText={errors.startDate}
                                        InputLabelProps={{ shrink: true }} // Required for type="date" to keep label visible
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CalendarToday sx={{ color: colorPalette.oceanBlue }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={datePickerStyle}
                                    />

                                    <Typography
                                        variant="body1"
                                        fontWeight="bold"
                                        color="text.secondary"
                                        sx={{ display: { xs: 'none', sm: 'block' } }} // Only show "to" on larger screens
                                    >
                                        to
                                    </Typography>

                                    <TextField
                                        label="Valid Until (Date)"
                                        type="date"
                                        required
                                        fullWidth

                                        value={formData.endDate}
                                        onChange={handleChange('endDate')}
                                        error={!!errors.endDate}
                                        helperText={errors.endDate}
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CalendarToday sx={{ color: colorPalette.oceanBlue }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={datePickerStyle}
                                    />
                                </Box>



                                <TextField
                                    fullWidth
                                    required
                                    label="Create Password"
                                    placeholder="Minimum 8 characters"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange('password')}
                                    error={!!errors.password}
                                    helperText={errors.password}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Lock sx={{ color: colorPalette.oceanBlue }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            '&.Mui-focused fieldset': {
                                                borderColor: colorPalette.oceanBlue,
                                                borderWidth: 2
                                            }
                                        }
                                    }}
                                />



                                {/* <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<PhotoCamera />}
                                    fullWidth
                                    sx={{
                                        borderStyle: 'dashed',
                                        py: 2,
                                        color: colorPalette.oceanBlue,
                                        borderColor: colorPalette.oceanBlue,
                                        borderRadius: 3,
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        '&:hover': {
                                            borderColor: colorPalette.deepNavy,
                                            bgcolor: `${colorPalette.oceanBlue}05`
                                        }
                                    }}
                                >
                                    Upload Profile Photo (Optional)
                                    <input hidden accept="image/*" type="file" />
                                </Button> */}
                            </Stack>
                        )}

                        {/* Action Buttons */}
                        <Box sx={{ mt: 2 }}>
                            <Button
                                variant="contained"
                                fullWidth
                                disabled={processing}
                                onClick={type === 'signin' ? handleLogin : handleRegister}
                                startIcon={type === 'signin' ? <Lock /> : <PersonAdd />}
                                sx={{
                                    background: colorPalette.oceanGradient,
                                    py: 2,
                                    borderRadius: 3,
                                    fontWeight: 800,
                                    fontSize: '1rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                    boxShadow: `0 8px 24px ${colorPalette.oceanBlue}40`,
                                    '&:hover': {
                                        boxShadow: `0 12px 32px ${colorPalette.oceanBlue}60`,
                                        transform: 'translateY(-2px)'
                                    },
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {type === 'signin' ? 'Sign In' : 'Complete Registration'}
                            </Button>



                            {type === 'signin' && (
                                <Box sx={{ mt: 2, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Don't have an account?{' '}
                                        <Button
                                            variant="text"
                                            onClick={onSwitchToSignup}
                                            sx={{
                                                color: colorPalette.oceanBlue,
                                                fontWeight: 700,
                                                textTransform: 'none',
                                                p: 0,
                                                minWidth: 'auto',
                                                '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                                            }}
                                        >
                                            Register here
                                        </Button>
                                    </Typography>
                                </Box>
                            )}

                            {/* Snackbar Notification */}
                            <Snackbar
                                open={openSnack}
                                autoHideDuration={4000}
                                onClose={handleCloseSnack}
                                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                            >
                                <Alert
                                    onClose={handleCloseSnack}
                                    severity="success"
                                    icon={<CheckCircle />}
                                    sx={{
                                        width: '100%',
                                        borderRadius: 3,
                                        fontWeight: 600,
                                        boxShadow: '0 8px 24px rgba(72, 201, 176, 0.3)'
                                    }}
                                >
                                    {type === 'signin'
                                        ? '✓ Successful'
                                        : '✓ Registration submitted successfully! Please wait for approval.'}
                                </Alert>
                            </Snackbar>
                        </Box>
                    </Stack>
                </Card>
            </motion.div>

            {/* Forgot Password Modal */}
            <ForgotPasswordModal
                open={forgotPasswordOpen}
                onClose={() => {
                    setForgotPasswordOpen(false)
                    setIsAuthShown(true)
                }}
            />
        </>
    );
};

// Main Landing Page Component
const EnhancedLandingPage = () => {
    const [view, setView] = useState('landing');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: colorPalette.cloudWhite }}>
            {/* Enhanced Navbar */}
            <EnhancedNavbar onNavigate={setView} currentView={view} />

            <AnimatePresence mode="wait">
                {view === 'landing' ? (
                    <motion.div
                        key="landing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Hero Section */}
                        <Box
                            sx={{
                                background: colorPalette.oceanGradient,
                                pt: { xs: 12, md: 16 },
                                pb: { xs: 8, md: 12 },
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Decorative Elements */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: -100,
                                    right: -100,
                                    width: 400,
                                    height: 400,
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                }}
                            />
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: -150,
                                    left: -150,
                                    width: 500,
                                    height: 500,
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(255,255,255,0.03)',
                                }}
                            />

                            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                                <Grid container spacing={6} alignItems="center">
                                    <Grid item xs={12} md={7} order={{ xs: 1, md: 1 }}>
                                        <motion.div
                                            initial={{ opacity: 0, x: -50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.8 }}
                                        >
                                            <Typography
                                                variant={isMobile ? "h3" : "h2"}
                                                component="h1"
                                                fontWeight="900"
                                                textAlign={'center'}
                                                sx={{
                                                    color: 'white',
                                                    mb: 2,
                                                    lineHeight: 1.2,
                                                    textShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                Advancing Marine{' '}
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        color: colorPalette.aquaVibrant,
                                                        display: 'block'
                                                    }}
                                                >
                                                    Science in Kenya
                                                </Box>
                                            </Typography>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    color: 'rgba(255,255,255,0.9)',
                                                    mb: 4,
                                                    fontWeight: 400,
                                                    lineHeight: 1.6
                                                }}
                                            >
                                                Welcome to the Kenya Marine and Fisheries Research Institute's
                                                digital attendance portal for Interns and Attachés. Streamline your daily check-ins,
                                                task management, and research reporting on the digital platform.
                                            </Typography>
                                            <Stack
                                                direction={{ xs: 'column', sm: 'row' }}
                                                spacing={2}
                                            >
                                                <Button
                                                    variant="contained"
                                                    size="large"
                                                    startIcon={<Lock />}
                                                    onClick={() => setView('signin')}
                                                    sx={{
                                                        bgcolor: colorPalette.aquaVibrant,
                                                        color: colorPalette.deepNavy,
                                                        fontWeight: 800,
                                                        px: 4,
                                                        py: 2,
                                                        borderRadius: 3,
                                                        textTransform: 'none',
                                                        fontSize: '1.1rem',
                                                        boxShadow: '0 8px 24px rgba(0,229,255,0.4)',
                                                        '&:hover': {
                                                            bgcolor: 'white',
                                                            transform: 'translateY(-2px)',
                                                            boxShadow: '0 12px 32px rgba(255,255,255,0.3)',
                                                        },
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    Login
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    size="large"
                                                    startIcon={<PersonAdd />}
                                                    onClick={() => setView('signup')}
                                                    sx={{
                                                        color: 'white',
                                                        borderColor: 'rgba(255,255,255,0.5)',
                                                        fontWeight: 700,
                                                        px: 4,
                                                        py: 2,
                                                        borderRadius: 3,
                                                        textTransform: 'none',
                                                        fontSize: '1.1rem',
                                                        borderWidth: 2,
                                                        backdropFilter: 'blur(10px)',
                                                        bgcolor: 'rgba(255,255,255,0.1)',
                                                        '&:hover': {
                                                            borderColor: 'white',
                                                            bgcolor: 'rgba(255,255,255,0.2)',
                                                            borderWidth: 2
                                                        }
                                                    }}
                                                >
                                                    Register Now
                                                </Button>
                                            </Stack>
                                        </motion.div>
                                    </Grid>
                                    <Grid item xs={12} md={5} order={{ xs: 2, md: 2 }}>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.8, delay: 0.2 }}
                                        >
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 4,
                                                    borderRadius: 5,
                                                    bgcolor: 'rgba(255,255,255,0.95)',
                                                    backdropFilter: 'blur(10px)',
                                                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                <Stack spacing={2}>
                                                    {[
                                                        { icon: <Security />, text: 'Geo-Location Verified Check-ins', color: colorPalette.seafoamGreen },
                                                        { icon: <Schedule />, text: 'Real-time Attendance Tracking', color: colorPalette.cyanFresh },
                                                        { icon: <Work />, text: 'Integrated Task Management', color: colorPalette.warmSand },
                                                        { icon: <Analytics />, text: 'Automated Report Generation', color: colorPalette.oceanBlue },
                                                    ].map((item, index) => (
                                                        <Box
                                                            key={index}
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                p: 2,
                                                                borderRadius: 3,
                                                                bgcolor: `${item.color}10`,
                                                                transition: 'all 0.3s ease',
                                                                '&:hover': {
                                                                    transform: 'translateX(8px)',
                                                                    bgcolor: `${item.color}20`
                                                                }
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    p: 1,
                                                                    borderRadius: 2,
                                                                    bgcolor: 'white',
                                                                    mr: 2,
                                                                    display: 'flex',
                                                                    color: item.color
                                                                }}
                                                            >
                                                                {item.icon}
                                                            </Box>
                                                            <Typography fontWeight="700" color={colorPalette.deepNavy}>
                                                                {item.text}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </Paper>
                                        </motion.div>
                                    </Grid>
                                </Grid>
                            </Container>
                        </Box>

                        {/* Stats Section */}
                        <Container maxWidth="lg" sx={{ mt: -6, mb: 8, position: 'relative', zIndex: 2 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={6} md={3}>
                                    <StatsCard
                                        value="500+"
                                        label="Active Interns"
                                        icon={<GroupWork sx={{ fontSize: 40 }} />}
                                        color={colorPalette.oceanBlue}
                                        delay={0.1}
                                    />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <StatsCard
                                        value="98%"
                                        label="Attendance Rate"
                                        icon={<TrendingUp sx={{ fontSize: 40 }} />}
                                        color={colorPalette.seafoamGreen}
                                        delay={0.2}
                                    />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <StatsCard
                                        value="12"
                                        label="Research Stations"
                                        icon={<LocationOn sx={{ fontSize: 40 }} />}
                                        color={colorPalette.cyanFresh}
                                        delay={0.3}
                                    />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <StatsCard
                                        value="24/7"
                                        label="System Uptime"
                                        icon={<CheckCircle sx={{ fontSize: 40 }} />}
                                        color={colorPalette.warmSand}
                                        delay={0.4}
                                    />
                                </Grid>
                            </Grid>
                        </Container>

                        {/* Features Section */}
                        <Container maxWidth="lg" sx={{ py: 8 }}>
                            <Box sx={{ textAlign: 'center', mb: 6 }}>
                                <Typography
                                    variant="h3"
                                    fontWeight="900"
                                    sx={{
                                        background: colorPalette.oceanGradient,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        mb: 2
                                    }}
                                >
                                    Platform Features
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', fontWeight: 500 }}>
                                    Everything you need to manage your internship or attachment at KMFRI efficiently
                                </Typography>
                            </Box>

                            <Grid container spacing={4}>
                                <Grid item xs={12} md={4}>
                                    <FeatureCard
                                        icon={<LocationOn sx={{ fontSize: 32, color: 'white' }} />}
                                        title="Geo-Verified Attendance"
                                        description="Automatic location verification ensures authentic check-ins within KMFRI facility boundaries (±500m radius)."
                                        gradient={colorPalette.oceanGradient}
                                        delay={0.1}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FeatureCard
                                        icon={<Work sx={{ fontSize: 32, color: 'white' }} />}
                                        title="Task Management"
                                        description="Log daily activities, track progress, and maintain comprehensive records of your research contributions."
                                        gradient={colorPalette.freshGradient}
                                        delay={0.2}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FeatureCard
                                        icon={<Analytics sx={{ fontSize: 32, color: 'white' }} />}
                                        title="Automated Reports"
                                        description="Generate detailed attendance and activity reports with one click for supervisor review and evaluation."
                                        gradient={colorPalette.sunsetGradient}
                                        delay={0.3}
                                    />
                                </Grid>
                            </Grid>
                        </Container>

                        {/* Footer */}
                        <Box sx={{ bgcolor: colorPalette.deepNavy, color: 'white', py: 6 }}>
                            <Container maxWidth="lg">
                                <Grid container spacing={4}>
                                    <Grid item xs={12} md={4}>
                                        <Stack direction="row" gap={3} alignItems="center" sx={{ mb: 2 }}>
                                            <Box
                                                component="img"
                                                src={KMFRILogo}
                                                alt="KMFRI Logo"
                                                sx={{
                                                    height: { md: 50, lg: 60, xs: 50 },
                                                    width: 'auto',
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    border: '3px solid rgba(255,255,255,0.2)',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                                }}
                                            />


                                            <Typography variant="h6" fontWeight="800">
                                                KMFRI
                                            </Typography>
                                        </Stack>
                                        <Typography variant="body2" sx={{ opacity: 0.8, lineHeight: 1.7 }}>
                                            Kenya Marine and Fisheries Research Institute - Leading marine research
                                            and sustainable fisheries development in East Africa.
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>
                                            Quick Links
                                        </Typography>
                                        <Stack spacing={1}>
                                            {['About KMFRI', 'Research Areas', 'Contact Us', 'Help & Support'].map((link) => (
                                                <Button
                                                    key={link}
                                                    sx={{
                                                        color: 'rgba(255,255,255,0.7)',
                                                        justifyContent: 'flex-start',
                                                        textTransform: 'none',
                                                        fontWeight: 500,
                                                        '&:hover': {
                                                            color: colorPalette.aquaVibrant,
                                                            bgcolor: 'rgba(255,255,255,0.05)'
                                                        }
                                                    }}
                                                >
                                                    {link}
                                                </Button>
                                            ))}
                                        </Stack>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>
                                            Contact Information
                                        </Typography>
                                        <Stack spacing={1.5}>
                                            <Box sx={{ display: 'flex', alignItems: 'start', opacity: 0.8 }}>
                                                <LocationOn sx={{ fontSize: 20, mr: 1, mt: 0.2 }} />
                                                <Typography variant="body2">
                                                    P.O. Box 81651-80100, Mombasa, Kenya
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.8 }}>
                                                <Email sx={{ fontSize: 20, mr: 1 }} />
                                                <Typography variant="body2">
                                                    info@kmfri.go.ke
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.8 }}>
                                                <Phone sx={{ fontSize: 20, mr: 1 }} />
                                                <Typography variant="body2">
                                                    +254 20 2024571
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Grid>
                                </Grid>
                                <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />
                                <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.7 }}>
                                    © {new Date().getFullYear()} Kenya Marine and Fisheries Research Institute. All rights reserved.
                                </Typography>
                            </Container>
                        </Box>
                    </motion.div>
                ) : (
                    /* Auth Views */
                    <Box
                        sx={{
                            background: colorPalette.oceanGradient,
                            minHeight: '100vh',
                            display: 'flex',
                            alignItems: 'center',
                            pt: { xs: 10, md: 12 },
                            pb: { xs: 6, md: 8 },
                        }}
                    >
                        <Container maxWidth={view === 'signin' ? 'sm' : 'lg'}>
                            <AuthCard
                                key={view}
                                type={view}
                                onBack={() => setView('landing')}
                                onSwitchToSignup={() => setView('signup')}
                            />
                        </Container>
                    </Box>
                )}
            </AnimatePresence>
        </Box >
    );
};

export default EnhancedLandingPage;