import {
    AccessTime,
    ArrowBackRounded,
    ArrowForwardRounded,
    CheckCircleRounded,
    Close,
    Dashboard,
    ExitToApp,
    Fingerprint,
    HelpOutline,
    LocationOn,
    LockRounded,
    ManageAccounts,
    VpnKey,
} from '@mui/icons-material';
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    IconButton,
    LinearProgress,
    Stack,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { useState } from 'react';
import coreDataDetails from './CoreDataDetails';

const { colorPalette } = coreDataDetails;

const STEP_ICONS = [
    LockRounded,
    LocationOn,
    Fingerprint,
    AccessTime,
    ExitToApp,
    Dashboard,
    ManageAccounts,
    VpnKey,
    HelpOutline,
];

const GUIDE_STEPS = [
    {
        title: 'Sign in to your account',
        body: 'Staff members can sign in using their staff number and password. Interns and Attaches should sign in using their registered email address and password. Select "Sign In to Portal" to continue.',
    },
    {
        title: 'Verify your work station',
        body: 'Before clocking, choose your assigned KMFRI station and select "Verify Location". Ensure Location Services are enabled and grant browser permission when prompted. You must be within the approved geofence before attendance can be recorded.',
    },
    {
        title: 'Register your device',
        body: 'On your first login, register your device and biometrics (fingerprint, Face ID, or Windows Hello) if supported. This allows secure authentication for future attendance while helping protect your account from unauthorized access.',
    },
    {
        title: 'Clock in to start your workday',
        body: 'After your location is verified, select "Clock In". The system securely verifies your identity and records your attendance together with the date, time, verified location, and registered device information.',
    },
    {
        title: 'Clock out before leaving',
        body: 'At the end of your workday, return to the attendance page and select "Clock Out". This completes your daily attendance record and ensures your working hours are calculated accurately.',
    },
    {
        title: 'Track your attendance',
        body: 'Use your dashboard to monitor attendance statistics, clock-in and clock-out history, working hours, overtime, late arrivals, and any approved leave or absence records associated with your account.',
    },
    {
        title: 'Manage your account',
        body: 'Keep your account secure by updating your password when required. If you change or lose your registered device, submit a device replacement request through the portal or contact the system administrator for assistance.',
    },
    {
        title: 'Forgot your password?',
        body: 'Select "Reset Password" on the login page, enter your registered email address, and submit the request. An administrator will review your request before you can create a new password.',
    },
    {
        title: 'Need assistance?',
        body: 'If you experience login, biometric, location verification, or attendance issues, use the Help & Support section to contact the ICT team via email or the provided support channels.',
    },
];

function GuideDialog({ open, onClose }) {
    const [activeStep, setActiveStep] = useState(0);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isCompactGuide = useMediaQuery(theme.breakpoints.down('md'));
    const totalSteps = GUIDE_STEPS.length;
    const currentStep = GUIDE_STEPS[activeStep];
    const CurrentIcon = STEP_ICONS[activeStep] || HelpOutline;
    const progress = ((activeStep + 1) / totalSteps) * 100;

    const handleNext = () => {
        if (activeStep < totalSteps - 1) {
            setActiveStep((step) => step + 1);
            return;
        }

        onClose();
    };

    const handleBack = () => {
        if (activeStep > 0) setActiveStep((step) => step - 1);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            fullScreen={isMobile}
            maxWidth="md"
            PaperProps={{
                sx: {
                    borderRadius: { xs: 0, sm: '18px' },
                    overflow: 'hidden',
                    border: { xs: 0, sm: '1px solid rgba(10,61,98,0.14)' },
                    boxShadow: '0 28px 90px rgba(10, 61, 98, 0.28)',
                    bgcolor: '#f8fafc',
                },
            }}
        >
            <Box
                sx={{
                    background: 'var(--kmfri-gradient, linear-gradient(135deg, #0A3D62 0%, #005B96 100%))',
                    color: '#fff',
                    px: { xs: 2, sm: 3 },
                    py: { xs: 1.75, sm: 2.25 },
                }}
            >
                <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                        <Box
                            sx={{
                                width: { xs: 42, sm: 48 },
                                height: { xs: 42, sm: 48 },
                                borderRadius: '14px',
                                display: 'grid',
                                placeItems: 'center',
                                bgcolor: 'rgba(255,255,255,0.16)',
                                border: '1px solid rgba(255,255,255,0.28)',
                                flexShrink: 0,
                            }}
                        >
                            <CurrentIcon fontSize="small" />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="h6" fontWeight={900} noWrap sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                System Guide
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.78)', fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.82rem' } }}>
                                Step {activeStep + 1} of {totalSteps}
                            </Typography>
                        </Box>
                    </Stack>

                    <IconButton
                        onClick={onClose}
                        aria-label="Close guide"
                        sx={{
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.24)',
                            bgcolor: 'rgba(255,255,255,0.10)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
                        }}
                    >
                        <Close />
                    </IconButton>
                </Stack>

                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        mt: 2,
                        height: 6,
                        borderRadius: 999,
                        bgcolor: 'rgba(255,255,255,0.22)',
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 999,
                            bgcolor: '#fff',
                        },
                    }}
                />
            </Box>

            <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '300px minmax(0, 1fr)' },
                        minHeight: { xs: 'calc(100dvh - 100px)', sm: 500, md: 520 },
                        maxHeight: { xs: 'none', sm: 'min(72dvh, 660px)' },
                    }}
                >
                    <Box
                        sx={{
                            display: { xs: 'none', md: 'block' },
                            bgcolor: '#fff',
                            borderRight: '1px solid rgba(10,61,98,0.10)',
                            p: 2,
                            overflowY: 'auto',
                        }}
                    >
                        <Stack spacing={1}>
                            {GUIDE_STEPS.map((step, idx) => {
                                const StepIcon = STEP_ICONS[idx] || HelpOutline;
                                const isActive = idx === activeStep;
                                const isDone = idx < activeStep;

                                return (
                                    <Box
                                        key={step.title}
                                        component="button"
                                        type="button"
                                        onClick={() => setActiveStep(idx)}
                                        aria-current={isActive ? 'step' : undefined}
                                        sx={{
                                            appearance: 'none',
                                            border: '1px solid',
                                            borderColor: isActive ? 'var(--kmfri-secondary, #005B96)' : 'rgba(10,61,98,0.10)',
                                            bgcolor: isActive ? 'var(--kmfri-secondary-soft, rgba(0,91,150,0.10))' : '#fff',
                                            color: isActive ? 'var(--kmfri-primary, #0A3D62)' : '#475569',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            width: '100%',
                                            p: 1.2,
                                            textAlign: 'left',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                borderColor: 'var(--kmfri-secondary, #005B96)',
                                                bgcolor: 'rgba(0,91,150,0.06)',
                                            },
                                        }}
                                    >
                                        <Stack direction="row" spacing={1.1} alignItems="center">
                                            <Box
                                                sx={{
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: '10px',
                                                    display: 'grid',
                                                    placeItems: 'center',
                                                    flexShrink: 0,
                                                    color: isActive || isDone ? '#fff' : 'var(--kmfri-secondary, #005B96)',
                                                    bgcolor: isActive || isDone ? 'var(--kmfri-gradient)' : 'rgba(0,91,150,0.08)',
                                                }}
                                            >
                                                {isDone ? <CheckCircleRounded sx={{ fontSize: 19 }} /> : <StepIcon sx={{ fontSize: 19 }} />}
                                            </Box>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography noWrap fontWeight={800} sx={{ fontSize: '0.8rem', color: 'inherit' }}>
                                                    {step.title}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.68rem', color: isActive ? 'var(--kmfri-secondary, #005B96)' : '#94a3b8', fontWeight: 700 }}>
                                                    Step {idx + 1}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>

                    <Box
                        sx={{
                            p: { xs: 2, sm: 3, md: 4 },
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: { xs: 'flex-start', md: 'space-between' },
                            overflowY: { xs: 'visible', md: 'auto' },
                        }}
                    >
                        <Box
                            sx={{
                                display: { xs: 'block', md: 'none' },
                                mb: { xs: 2, sm: 2.5 },
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(9, minmax(0, 1fr))',
                                    gap: { xs: 0.5, sm: 0.75 },
                                    mb: 1.25,
                                }}
                            >
                                {GUIDE_STEPS.map((step, idx) => {
                                    const isActive = idx === activeStep;
                                    const isDone = idx < activeStep;

                                    return (
                                        <Box
                                            key={step.title}
                                            component="button"
                                            type="button"
                                            onClick={() => setActiveStep(idx)}
                                            aria-label={`Open guide step ${idx + 1}: ${step.title}`}
                                            aria-current={isActive ? 'step' : undefined}
                                            sx={{
                                                appearance: 'none',
                                                border: '1px solid',
                                                borderColor: isActive
                                                    ? 'var(--kmfri-secondary, #005B96)'
                                                    : isDone
                                                        ? 'var(--kmfri-secondary-soft, rgba(0,91,150,0.18))'
                                                        : 'rgba(10,61,98,0.12)',
                                                bgcolor: isActive
                                                    ? 'var(--kmfri-secondary, #005B96)'
                                                    : isDone
                                                        ? 'var(--kmfri-secondary-soft, rgba(0,91,150,0.10))'
                                                        : '#fff',
                                                color: isActive ? '#fff' : 'var(--kmfri-primary, #0A3D62)',
                                                borderRadius: '10px',
                                                minWidth: 0,
                                                height: { xs: 34, sm: 38 },
                                                display: 'grid',
                                                placeItems: 'center',
                                                font: 'inherit',
                                                fontSize: { xs: '0.78rem', sm: '0.85rem' },
                                                fontWeight: 900,
                                                cursor: 'pointer',
                                                boxShadow: isActive ? '0 8px 18px rgba(0,91,150,0.20)' : 'none',
                                            }}
                                        >
                                            {idx + 1}
                                        </Box>
                                    );
                                })}
                            </Box>
                            <Typography
                                sx={{
                                    color: '#64748b',
                                    fontSize: { xs: '0.75rem', sm: '0.82rem' },
                                    fontWeight: 700,
                                    textAlign: 'center',
                                }}
                            >
                                {currentStep.title}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: { xs: 1.75, sm: 2.25, md: 2.5 } }}>
                                <Box
                                    sx={{
                                        width: { xs: 48, sm: 56, md: 62 },
                                        height: { xs: 48, sm: 56, md: 62 },
                                        borderRadius: '16px',
                                        display: 'grid',
                                        placeItems: 'center',
                                        color: '#fff',
                                        background: 'var(--kmfri-gradient)',
                                        boxShadow: '0 16px 34px var(--kmfri-secondary-soft, rgba(0,91,150,0.22))',
                                        flexShrink: 0,
                                    }}
                                >
                                    <CurrentIcon />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography
                                        sx={{
                                            color: 'var(--kmfri-secondary, #005B96)',
                                            fontWeight: 900,
                                            fontSize: '0.72rem',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        Quick start
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        fontWeight={900}
                                        sx={{
                                            color: colorPalette.deepNavy || 'var(--kmfri-primary, #0A3D62)',
                                            fontSize: { xs: '1.18rem', sm: '1.45rem', md: '1.55rem' },
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        {currentStep.title}
                                    </Typography>
                                </Box>
                            </Stack>

                            <Box
                                sx={{
                                    bgcolor: '#fff',
                                    border: '1px solid rgba(10,61,98,0.10)',
                                    borderRadius: { xs: '14px', sm: '16px' },
                                    p: { xs: 2, sm: 2.5 },
                                    boxShadow: '0 14px 38px rgba(10,61,98,0.06)',
                                }}
                            >
                                <Typography
                                    sx={{
                                        color: '#334155',
                                        fontSize: { xs: '0.93rem', sm: '1rem' },
                                        lineHeight: { xs: 1.68, sm: 1.78, md: 1.8 },
                                        fontWeight: 500,
                                    }}
                                >
                                    {currentStep.body}
                                </Typography>
                            </Box>
                        </Box>

                        <Stack
                            direction={{ xs: 'column-reverse', sm: 'row' }}
                            spacing={1.5}
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                            justifyContent="space-between"
                            sx={{ mt: { xs: 2.25, md: 4 } }}
                        >
                            <Button
                                variant="outlined"
                                startIcon={<ArrowBackRounded />}
                                onClick={handleBack}
                                disabled={activeStep === 0}
                                sx={{
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    fontWeight: 800,
                                    px: 2.5,
                                    py: 1.1,
                                }}
                            >
                                Back
                            </Button>

                            <Stack
                                direction="row"
                                spacing={1}
                                justifyContent="center"
                                aria-hidden="true"
                                sx={{ display: isCompactGuide ? 'none' : 'flex' }}
                            >
                                {GUIDE_STEPS.map((step, idx) => (
                                    <Box
                                        key={step.title}
                                        sx={{
                                            width: idx === activeStep ? 22 : 7,
                                            height: 7,
                                            borderRadius: 999,
                                            bgcolor: idx <= activeStep ? 'var(--kmfri-secondary, #005B96)' : 'rgba(10,61,98,0.16)',
                                            transition: 'all 0.2s ease',
                                        }}
                                    />
                                ))}
                            </Stack>

                            <Button
                                variant="contained"
                                endIcon={activeStep === totalSteps - 1 ? <CheckCircleRounded /> : <ArrowForwardRounded />}
                                onClick={handleNext}
                                sx={{
                                    background: 'var(--kmfri-gradient)',
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    fontWeight: 900,
                                    px: 3,
                                    py: 1.2,
                                    boxShadow: '0 12px 26px var(--kmfri-secondary-soft, rgba(0,91,150,0.24))',
                                }}
                            >
                                {activeStep === totalSteps - 1 ? 'Got it' : 'Next'}
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
}

export default GuideDialog;
