import { AccessTime, Close, Dashboard, ExitToApp, Fingerprint, HelpOutline, LocationOn, LockRounded, ManageAccounts, VpnKey } from '@mui/icons-material';
import {
    Box, Button, Dialog, DialogContent,
    Fade, IconButton, LinearProgress,
    Stack, Step, StepLabel, Stepper,
    Typography, useMediaQuery, useTheme
} from '@mui/material';
import { useState } from 'react';
import coreDataDetails from './CoreDataDetails';

const { colorPalette } = coreDataDetails;

// Map each step to an icon
const STEP_ICONS = [
    <LockRounded />,
    <LocationOn />,
    <Fingerprint />,
    <AccessTime />,
    <ExitToApp />,
    <Dashboard />,
    <ManageAccounts />,
    <VpnKey />,
    <HelpOutline />
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
        title: 'Register your device (First Time Only)',
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
    }
];

function GuideDialog({ open, onClose }) {
    const [activeStep, setActiveStep] = useState(0);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const totalSteps = GUIDE_STEPS.length;
    const progress = ((activeStep + 1) / totalSteps) * 100;

    const handleNext = () => {
        if (activeStep < totalSteps - 1) {
            setActiveStep(activeStep + 1);
        } else {
            onClose();
        }
    };

    const handleBack = () => {
        if (activeStep > 0) setActiveStep(activeStep - 1);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            PaperProps={{
                sx: {
                    borderRadius: '24px',
                    overflow: 'hidden',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
                }
            }}
        >
            {/* Header with gradient background */}
            <Box
                sx={{
                    background: 'var(--kmfri-gradient, linear-gradient(135deg, #0a1a3a 0%, #1a3a6a 100%))',
                    px: { xs: 2, sm: 4 },
                    py: 2.5,
                    position: 'relative',
                }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography
                            variant="h6"
                            fontWeight={800}
                            sx={{ color: '#fff', letterSpacing: '-0.5px' }}
                        >
                            Quick Start Guide
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}
                        >
                            {activeStep + 1} of {totalSteps} • {GUIDE_STEPS[activeStep].title}
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={onClose}
                        sx={{ color: '#fff', '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' } }}
                        aria-label="Close"
                    >
                        <Close />
                    </IconButton>
                </Stack>

                {/* Progress bar */}
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        mt: 2,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: '#fff',
                            borderRadius: 2,
                        }
                    }}
                />
            </Box>

            <DialogContent dividers sx={{ p: { xs: 2, sm: 4 }, backgroundColor: '#f8fafc' }}>
                <Stepper
                    activeStep={activeStep}
                    orientation="vertical"
                    connector={null}
                    sx={{
                        '& .MuiStep-root': {
                            padding: 0,
                            mb: 1.5,
                        },
                        '& .MuiStepLabel-root': {
                            padding: 0,
                            alignItems: 'center',
                        }
                    }}
                >
                    {GUIDE_STEPS.map((step, idx) => {
                        const isActive = idx === activeStep;
                        const isCompleted = idx < activeStep;
                        const icon = STEP_ICONS[idx];

                        return (
                            <Step key={step.title} expanded={isActive}>
                                {/* StepLabel: icon + title on the same line */}
                                <StepLabel
                                    StepIconComponent={() => (
                                        <Box
                                            sx={{
                                                width: 35,
                                                height: 35,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: isActive
                                                    ? 'var(--kmfri-primary, #0a1a3a)'
                                                    : isCompleted
                                                        ? 'var(--kmfri-primary, #0a1a3a)'
                                                        : '#e2e8f0',
                                                color: isActive || isCompleted ? '#fff' : '#94a3b8',
                                                transition: 'all 0.3s ease',
                                                boxShadow: isActive
                                                    ? '0 6px 20px rgba(10,26,58,0.3)'
                                                    : 'none',
                                                transform: isActive ? 'scale(1.08)' : 'scale(1)',
                                                border: isActive ? '2px solid #fff' : 'none',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {icon}
                                        </Box>
                                    )}
                                    sx={{
                                        '& .MuiStepLabel-label': {
                                            fontWeight: 500,
                                            fontSize: '1rem',
                                            color: isActive
                                                ? 'var(--kmfri-primary, #0a1a3a)'
                                                : isCompleted
                                                    ? 'var(--kmfri-primary, #0a1a3a)'
                                                    : '#94a3b8',
                                            transition: 'color 0.3s ease',
                                            ml: 1.5, // gap between icon and title
                                        }
                                    }}
                                >
                                    {step.title}
                                </StepLabel>

                                {/* Body content — only visible for the active step */}
                                {isActive && (
                                    <Box sx={{ ml: 6.5, mt: 0.5, pr: 1 }}>
                                        <Fade in={isActive} timeout={400} unmountOnExit>
                                            <Box>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: '#334155',
                                                        lineHeight: 1.8,
                                                        mb: 2,
                                                        maxWidth: '95%',
                                                    }}
                                                >
                                                    {step.body}
                                                </Typography>

                                                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" gap={1}>
                                                    {idx > 0 && (
                                                        <Button
                                                            size="medium"
                                                            onClick={handleBack}
                                                            sx={{
                                                                textTransform: 'none',
                                                                fontWeight: 600,
                                                                color: 'var(--kmfri-primary, #0a1a3a)',
                                                                px: 2,
                                                                '&:hover': {
                                                                    backgroundColor: 'rgba(10,26,58,0.06)',
                                                                }
                                                            }}
                                                        >
                                                            Back
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="contained"
                                                        onClick={handleNext}
                                                        sx={{
                                                            background: 'var(--kmfri-gradient, linear-gradient(135deg, #0a1a3a, #1a3a6a))',
                                                            py: 0.9,
                                                            px: 3.5,
                                                            borderRadius: '30px',
                                                            fontWeight: 600,
                                                            textTransform: 'none',
                                                            boxShadow: '0 8px 20px rgba(10,26,58,0.25)',
                                                            transition: 'all 0.2s ease',
                                                            '&:hover': {
                                                                transform: 'translateY(-2px)',
                                                                boxShadow: '0 12px 28px rgba(10,26,58,0.35)',
                                                            },
                                                            '&:active': {
                                                                transform: 'scale(0.97)',
                                                            }
                                                        }}
                                                    >
                                                        {idx === totalSteps - 1 ? 'Got it' : 'Next'}
                                                    </Button>
                                                    {idx < totalSteps - 1 && (
                                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                                                            Step {idx + 1} of {totalSteps}
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            </Box>
                                        </Fade>
                                    </Box>
                                )}

                                {/* Connector line between steps */}
                                {idx < totalSteps - 1 && (
                                    <Box
                                        sx={{
                                            ml: 4.25, // aligns with the center of the icon
                                            mt: 0.5,
                                            mb: 0.5,
                                            width: 2,
                                            height: 20,
                                            backgroundColor: isCompleted
                                                ? 'var(--kmfri-primary, #0a1a3a)'
                                                : '#e2e8f0',
                                            transition: 'background-color 0.3s ease',
                                            borderRadius: 1,
                                        }}
                                    />
                                )}
                            </Step>
                        );
                    })}
                </Stepper>
            </DialogContent>
        </Dialog>
    );
}

export default GuideDialog;