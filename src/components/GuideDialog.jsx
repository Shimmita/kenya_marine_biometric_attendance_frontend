import {
    AccessTimeRounded,
    ArrowBackRounded,
    ArrowForwardRounded,
    CheckCircleRounded,
    CloseRounded,
    DashboardRounded,
    DevicesRounded,
    ExitToAppRounded,
    FingerprintRounded,
    HelpOutlineRounded,
    LocationOnRounded,
    LockRounded,
    ManageAccountsRounded,
    SecurityRounded,
    VpnKeyRounded,
} from '@mui/icons-material';

import {
    Box,
    Button,
    Dialog,
    DialogContent,
    IconButton,
    LinearProgress,
    Stack,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';

import { useEffect, useState } from 'react';
import coreDataDetails from './CoreDataDetails';

const { colorPalette } = coreDataDetails;


/* ─────────────────────────────────────────────
   GUIDE DATA
───────────────────────────────────────────── */

const GUIDE_STEPS = [
    {
        title: 'Sign in to your account',
        shortTitle: 'Sign in',
        eyebrow: 'Account access',
        body:
            'Staff members can sign in using their staff number and password. ' +
            'Interns and Attaches should sign in using their registered email address ' +
            'and password. Select "Sign In to Portal" to continue.',
        icon: LockRounded,
        hint: 'Use only your assigned KMFRI account credentials.',
    },

    {
        title: 'Verify your work station',
        shortTitle: 'Location',
        eyebrow: 'Station verification',
        body:
            'Before clocking, choose your assigned KMFRI station and select ' +
            '"Verify Location". Ensure Location Services are enabled and grant ' +
            'browser permission when prompted. You must be within the approved ' +
            'geofence before attendance can be recorded.',
        icon: LocationOnRounded,
        hint: 'Location is requested when needed for attendance verification.',
    },

    {
        title: 'Register your device',
        shortTitle: 'Device',
        eyebrow: 'Secure registration',
        body:
            'On your first login, register your device and biometrics such as ' +
            'fingerprint, Face ID, or Windows Hello where supported. Biometric ' +
            'verification remains on your device and helps protect your account ' +
            'during attendance authentication.',
        icon: FingerprintRounded,
        hint: 'Your fingerprint or face template is not stored by KMFRI.',
    },

    {
        title: 'Clock in to start your workday',
        shortTitle: 'Clock in',
        eyebrow: 'Start attendance',
        body:
            'After your location is verified, select "Clock In". The system ' +
            'securely verifies your identity and records your attendance together ' +
            'with the date, time, verified location, and registered device information.',
        icon: AccessTimeRounded,
        hint: 'Confirm the successful clock-in message before leaving the page.',
    },

    {
        title: 'Clock out before leaving',
        shortTitle: 'Clock out',
        eyebrow: 'Complete attendance',
        body:
            'At the end of your workday, return to the attendance page and select ' +
            '"Clock Out". This completes your daily attendance record and allows ' +
            'your working hours to be calculated accurately.',
        icon: ExitToAppRounded,
        hint: 'Always clock out before leaving your station where possible.',
    },

    {
        title: 'Track your attendance',
        shortTitle: 'Dashboard',
        eyebrow: 'Attendance insights',
        body:
            'Use your dashboard to monitor attendance statistics, clock-in and ' +
            'clock-out history, working hours, overtime, late arrivals, and any ' +
            'approved leave or absence records associated with your account.',
        icon: DashboardRounded,
        hint: 'Your dashboard gives you a personal view of your attendance records.',
    },

    {
        title: 'Manage your account',
        shortTitle: 'Account',
        eyebrow: 'Account security',
        body:
            'Keep your account secure by updating your password when required. ' +
            'If you change or lose your registered device, submit a device replacement ' +
            'request through the portal or contact the system administrator for assistance.',
        icon: ManageAccountsRounded,
        hint: 'Never share your account credentials with another user.',
    },

    {
        title: 'Forgot your password?',
        shortTitle: 'Password',
        eyebrow: 'Account recovery',
        body:
            'Select "Reset Password" on the login page and provide the requested ' +
            'registered account details. Follow the password recovery instructions ' +
            'sent through the configured recovery channel to regain access securely.',
        icon: VpnKeyRounded,
        hint: 'Use only the recovery details registered to your account.',
    },

    {
        title: 'Need assistance?',
        shortTitle: 'Support',
        eyebrow: 'Help & support',
        body:
            'If you experience login, biometric, location verification, device, ' +
            'or attendance issues, use the Help & Support section or the available ' +
            'ICT support channels for assistance.',
        icon: HelpOutlineRounded,
        hint: 'Provide a clear description of the issue when requesting support.',
    },
];


/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */

function GuideDialog({ open, onClose }) {
    const [activeStep, setActiveStep] = useState(0);

    const theme = useTheme();

    const isMobile = useMediaQuery(
        theme.breakpoints.down('sm')
    );

    const totalSteps = GUIDE_STEPS.length;
    const currentStep = GUIDE_STEPS[activeStep];

    const CurrentIcon =
        currentStep?.icon || HelpOutlineRounded;

    const progress =
        ((activeStep + 1) / totalSteps) * 100;

    const isFirstStep = activeStep === 0;
    const isLastStep = activeStep === totalSteps - 1;


    /* Reset guide whenever it is reopened */
    useEffect(() => {
        if (open) {
            setActiveStep(0);
        }
    }, [open]);


    const handleNext = () => {
        if (!isLastStep) {
            setActiveStep((step) => step + 1);
            return;
        }

        onClose();
    };


    const handleBack = () => {
        if (!isFirstStep) {
            setActiveStep((step) => step - 1);
        }
    };


    const handleStepChange = (index) => {
        setActiveStep(index);
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
                    width: '100%',
                    maxWidth: 900,

                    height: {
                        xs: '100%',
                        sm: 'min(760px, 90dvh)',
                    },

                    maxHeight: {
                        xs: '100%',
                        sm: '90dvh',
                    },

                    m: {
                        xs: 0,
                        sm: 2,
                    },

                    borderRadius: {
                        xs: 0,
                        sm: '20px',
                    },

                    overflow: 'hidden',

                    border: {
                        xs: 0,
                        sm: '1px solid rgba(10,61,98,0.10)',
                    },

                    background: '#F8FAFC',

                    boxShadow:
                        '0 30px 90px rgba(5,37,61,0.25)',
                },
            }}
            BackdropProps={{
                sx: {
                    backgroundColor:
                        'rgba(5,37,61,0.56)',

                    backdropFilter:
                        'blur(5px)',
                },
            }}
        >

            {/* ═══════════════════════════════════
                HEADER
            ═══════════════════════════════════ */}

            <Box
                sx={{
                    position: 'relative',

                    px: {
                        xs: 2,
                        sm: 3,
                    },

                    pt: {
                        xs: 1.8,
                        sm: 2.3,
                    },

                    pb: {
                        xs: 1.6,
                        sm: 2,
                    },

                    color: '#fff',

                    overflow: 'hidden',

                    background: `
                        linear-gradient(
                            135deg,
                            ${colorPalette.deepNavy || '#0A3D62'} 0%,
                            var(--kmfri-secondary, #005B96) 100%
                        )
                    `,
                }}
            >

                {/* Decorative background */}

                <Box
                    sx={{
                        position: 'absolute',

                        width: 220,
                        height: 220,

                        borderRadius: '50%',

                        top: -150,
                        right: -60,

                        border:
                            '38px solid rgba(255,255,255,0.045)',

                        pointerEvents: 'none',
                    }}
                />


                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={2}

                    sx={{
                        position: 'relative',
                        zIndex: 1,
                    }}
                >

                    <Stack
                        direction="row"
                        spacing={1.4}
                        alignItems="center"

                        sx={{
                            minWidth: 0,
                        }}
                    >

                        <Box
                            sx={{
                                width: {
                                    xs: 42,
                                    sm: 46,
                                },

                                height: {
                                    xs: 42,
                                    sm: 46,
                                },

                                flexShrink: 0,

                                display: 'grid',
                                placeItems: 'center',

                                borderRadius: '12px',

                                background:
                                    'rgba(255,255,255,0.12)',

                                border:
                                    '1px solid rgba(255,255,255,0.16)',

                                boxShadow:
                                    'inset 0 1px 0 rgba(255,255,255,0.10)',
                            }}
                        >
                            <SecurityRounded
                                sx={{
                                    fontSize: {
                                        xs: 22,
                                        sm: 25,
                                    },
                                }}
                            />
                        </Box>


                        <Box
                            sx={{
                                minWidth: 0,
                            }}
                        >

                            <Typography
                                sx={{
                                    fontSize: {
                                        xs: '1rem',
                                        sm: '1.18rem',
                                    },

                                    fontWeight: 900,

                                    lineHeight: 1.2,

                                    letterSpacing:
                                        '-0.015em',
                                }}
                            >
                                KMFRI System Guide
                            </Typography>


                            <Typography
                                sx={{
                                    mt: 0.35,

                                    color:
                                        'rgba(255,255,255,0.70)',

                                    fontSize: {
                                        xs: '0.72rem',
                                        sm: '0.79rem',
                                    },

                                    lineHeight: 1.4,
                                }}
                            >
                                Quick guide to attendance,
                                security and account access
                            </Typography>

                        </Box>

                    </Stack>


                    <Tooltip
                        title="Close guide"
                        placement="left"
                        arrow
                    >

                        <IconButton
                            onClick={onClose}

                            aria-label="Close system guide"

                            sx={{
                                width: 34,
                                height: 34,

                                flexShrink: 0,

                                color: '#fff',

                                background:
                                    'rgba(255,255,255,0.10)',

                                border:
                                    '1px solid rgba(255,255,255,0.16)',

                                transition:
                                    'all 180ms ease',

                                '&:hover': {
                                    background:
                                        'rgba(255,255,255,0.18)',

                                    transform:
                                        'rotate(3deg)',
                                },
                            }}
                        >
                            <CloseRounded
                                sx={{
                                    fontSize: 18,
                                }}
                            />
                        </IconButton>

                    </Tooltip>

                </Stack>


                {/* Progress */}

                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}

                    sx={{
                        position: 'relative',

                        zIndex: 1,

                        mt: 1.7,
                    }}
                >

                    <LinearProgress
                        variant="determinate"

                        value={progress}

                        sx={{
                            flex: 1,

                            height: 5,

                            borderRadius: 999,

                            background:
                                'rgba(255,255,255,0.18)',

                            '& .MuiLinearProgress-bar': {
                                borderRadius: 999,

                                background:
                                    '#fff',

                                transition:
                                    'transform 300ms ease',
                            },
                        }}
                    />


                    <Typography
                        sx={{
                            minWidth: 62,

                            textAlign: 'right',

                            fontSize: '0.7rem',

                            fontWeight: 800,

                            color:
                                'rgba(255,255,255,0.82)',
                        }}
                    >
                        {activeStep + 1} / {totalSteps}
                    </Typography>

                </Stack>

            </Box>


            {/* ═══════════════════════════════════
                MAIN AREA
            ═══════════════════════════════════ */}

            <DialogContent
                sx={{
                    p: 0,

                    display: 'flex',

                    minHeight: 0,

                    overflow: 'hidden',
                }}
            >

                <Box
                    sx={{
                        width: '100%',

                        minHeight: 0,

                        display: 'grid',

                        gridTemplateColumns: {
                            xs: '1fr',
                            md: '270px minmax(0,1fr)',
                        },
                    }}
                >

                    {/* ═══════════════════════════
                        DESKTOP SIDEBAR
                    ═══════════════════════════ */}

                    <Box
                        sx={{
                            display: {
                                xs: 'none',
                                md: 'flex',
                            },

                            flexDirection: 'column',

                            minHeight: 0,

                            background: '#fff',

                            borderRight:
                                '1px solid rgba(10,61,98,0.08)',
                        }}
                    >

                        <Box
                            sx={{
                                px: 2,
                                pt: 2,
                                pb: 1.2,
                            }}
                        >

                            <Typography
                                sx={{
                                    color:
                                        'var(--kmfri-secondary, #005B96)',

                                    fontSize:
                                        '0.68rem',

                                    fontWeight: 900,

                                    textTransform:
                                        'uppercase',

                                    letterSpacing:
                                        '0.08em',
                                }}
                            >
                                Getting started
                            </Typography>


                            <Typography
                                sx={{
                                    mt: 0.35,

                                    color:
                                        '#64748B',

                                    fontSize:
                                        '0.72rem',

                                    lineHeight: 1.45,
                                }}
                            >
                                Select any step to review
                                its instructions.
                            </Typography>

                        </Box>


                        <Box
                            sx={{
                                flex: 1,

                                overflowY: 'auto',

                                px: 1.5,

                                pb: 2,

                                '&::-webkit-scrollbar': {
                                    width: 5,
                                },

                                '&::-webkit-scrollbar-thumb': {
                                    background:
                                        'rgba(10,61,98,0.16)',

                                    borderRadius: 10,
                                },
                            }}
                        >

                            <Stack spacing={0.65}>

                                {GUIDE_STEPS.map(
                                    (step, index) => {

                                        const StepIcon =
                                            step.icon;

                                        const isActive =
                                            index === activeStep;

                                        const isCompleted =
                                            index < activeStep;


                                        return (
                                            <Box
                                                key={
                                                    step.title
                                                }

                                                component="button"

                                                type="button"

                                                onClick={() =>
                                                    handleStepChange(
                                                        index
                                                    )
                                                }

                                                aria-current={
                                                    isActive
                                                        ? 'step'
                                                        : undefined
                                                }

                                                sx={{
                                                    appearance:
                                                        'none',

                                                    width:
                                                        '100%',

                                                    border:
                                                        '1px solid',

                                                    borderColor:
                                                        isActive
                                                            ? 'rgba(0,91,150,0.25)'
                                                            : 'transparent',

                                                    background:
                                                        isActive
                                                            ? 'rgba(0,91,150,0.075)'
                                                            : 'transparent',

                                                    borderRadius:
                                                        '11px',

                                                    p: 1,

                                                    cursor:
                                                        'pointer',

                                                    textAlign:
                                                        'left',

                                                    transition:
                                                        'all 160ms ease',

                                                    '&:hover':
                                                        {
                                                            background:
                                                                isActive
                                                                    ? 'rgba(0,91,150,0.09)'
                                                                    : 'rgba(10,61,98,0.035)',
                                                        },
                                                }}
                                            >

                                                <Stack
                                                    direction="row"

                                                    spacing={1}

                                                    alignItems="center"
                                                >

                                                    <Box
                                                        sx={{
                                                            width: 34,
                                                            height: 34,

                                                            flexShrink: 0,

                                                            display:
                                                                'grid',

                                                            placeItems:
                                                                'center',

                                                            borderRadius:
                                                                '9px',

                                                            color:
                                                                isActive ||
                                                                isCompleted
                                                                    ? '#fff'
                                                                    : 'var(--kmfri-secondary, #005B96)',

                                                            background:
                                                                isActive
                                                                    ? 'var(--kmfri-gradient, linear-gradient(135deg,#0A3D62,#005B96))'
                                                                    : isCompleted
                                                                        ? 'var(--kmfri-secondary, #005B96)'
                                                                        : 'rgba(0,91,150,0.07)',
                                                        }}
                                                    >

                                                        {isCompleted ? (
                                                            <CheckCircleRounded
                                                                sx={{
                                                                    fontSize: 18,
                                                                }}
                                                            />
                                                        ) : (
                                                            <StepIcon
                                                                sx={{
                                                                    fontSize: 18,
                                                                }}
                                                            />
                                                        )}

                                                    </Box>


                                                    <Box
                                                        sx={{
                                                            minWidth: 0,

                                                            flex: 1,
                                                        }}
                                                    >

                                                        <Typography
                                                            noWrap

                                                            sx={{
                                                                color:
                                                                    isActive
                                                                        ? colorPalette.deepNavy ||
                                                                          '#0A3D62'
                                                                        : '#334155',

                                                                fontWeight:
                                                                    isActive
                                                                        ? 850
                                                                        : 700,

                                                                fontSize:
                                                                    '0.77rem',

                                                                lineHeight: 1.3,
                                                            }}
                                                        >
                                                            {
                                                                step.shortTitle
                                                            }
                                                        </Typography>


                                                        <Typography
                                                            sx={{
                                                                mt: 0.2,

                                                                color:
                                                                    isActive
                                                                        ? 'var(--kmfri-secondary, #005B96)'
                                                                        : '#94A3B8',

                                                                fontSize:
                                                                    '0.63rem',

                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            Step{' '}
                                                            {index +
                                                                1}
                                                        </Typography>

                                                    </Box>

                                                </Stack>

                                            </Box>
                                        );
                                    }
                                )}

                            </Stack>

                        </Box>

                    </Box>


                    {/* ═══════════════════════════
                        CONTENT
                    ═══════════════════════════ */}

                    <Box
                        sx={{
                            minWidth: 0,
                            minHeight: 0,

                            display: 'flex',

                            flexDirection:
                                'column',

                            background:
                                '#F8FAFC',
                        }}
                    >

                        {/* Mobile step selector */}

                        <Box
                            sx={{
                                display: {
                                    xs: 'block',
                                    md: 'none',
                                },

                                background: '#fff',

                                borderBottom:
                                    '1px solid rgba(10,61,98,0.08)',

                                px: {
                                    xs: 1.5,
                                    sm: 2,
                                },

                                py: 1.3,
                            }}
                        >

                            <Stack
                                direction="row"

                                spacing={0.75}

                                sx={{
                                    overflowX:
                                        'auto',

                                    pb: 0.25,

                                    scrollbarWidth:
                                        'none',

                                    '&::-webkit-scrollbar':
                                        {
                                            display:
                                                'none',
                                        },
                                }}
                            >

                                {GUIDE_STEPS.map(
                                    (step, index) => {

                                        const isActive =
                                            index === activeStep;

                                        const isCompleted =
                                            index < activeStep;


                                        return (
                                            <Box
                                                key={
                                                    step.title
                                                }

                                                component="button"

                                                type="button"

                                                onClick={() =>
                                                    handleStepChange(
                                                        index
                                                    )
                                                }

                                                aria-label={`Step ${
                                                    index + 1
                                                }: ${
                                                    step.title
                                                }`}

                                                sx={{
                                                    appearance:
                                                        'none',

                                                    border:
                                                        '1px solid',

                                                    borderColor:
                                                        isActive
                                                            ? 'var(--kmfri-secondary, #005B96)'
                                                            : 'rgba(10,61,98,0.10)',

                                                    minWidth:
                                                        isActive
                                                            ? 92
                                                            : 38,

                                                    height: 36,

                                                    px:
                                                        isActive
                                                            ? 1.1
                                                            : 0,

                                                    flexShrink: 0,

                                                    display:
                                                        'flex',

                                                    alignItems:
                                                        'center',

                                                    justifyContent:
                                                        'center',

                                                    gap: 0.6,

                                                    borderRadius:
                                                        '9px',

                                                    cursor:
                                                        'pointer',

                                                    color:
                                                        isActive
                                                            ? '#fff'
                                                            : 'var(--kmfri-secondary, #005B96)',

                                                    background:
                                                        isActive
                                                            ? 'var(--kmfri-secondary, #005B96)'
                                                            : isCompleted
                                                                ? 'rgba(0,91,150,0.08)'
                                                                : '#fff',

                                                    font:
                                                        'inherit',

                                                    transition:
                                                        'all 180ms ease',
                                                }}
                                            >

                                                {isCompleted &&
                                                !isActive ? (
                                                    <CheckCircleRounded
                                                        sx={{
                                                            fontSize: 16,
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography
                                                        component="span"

                                                        sx={{
                                                            fontSize:
                                                                '0.72rem',

                                                            fontWeight: 900,
                                                        }}
                                                    >
                                                        {index +
                                                            1}
                                                    </Typography>
                                                )}


                                                {isActive && (
                                                    <Typography
                                                        noWrap

                                                        sx={{
                                                            maxWidth: 58,

                                                            fontSize:
                                                                '0.68rem',

                                                            fontWeight: 800,
                                                        }}
                                                    >
                                                        {
                                                            step.shortTitle
                                                        }
                                                    </Typography>
                                                )}

                                            </Box>
                                        );
                                    }
                                )}

                            </Stack>

                        </Box>


                        {/* Scrollable instructions */}

                        <Box
                            sx={{
                                flex: 1,

                                minHeight: 0,

                                overflowY:
                                    'auto',

                                p: {
                                    xs: 2,
                                    sm: 3,
                                    md: 3.5,
                                },

                                '&::-webkit-scrollbar': {
                                    width: 6,
                                },

                                '&::-webkit-scrollbar-thumb': {
                                    background:
                                        'rgba(10,61,98,0.16)',

                                    borderRadius: 10,
                                },
                            }}
                        >

                            <Box
                                sx={{
                                    maxWidth: 610,

                                    mx: 'auto',
                                }}
                            >

                                {/* Step hero */}

                                <Stack
                                    direction="row"

                                    spacing={{
                                        xs: 1.3,
                                        sm: 1.7,
                                    }}

                                    alignItems="center"
                                >

                                    <Box
                                        sx={{
                                            width: {
                                                xs: 48,
                                                sm: 58,
                                            },

                                            height: {
                                                xs: 48,
                                                sm: 58,
                                            },

                                            display:
                                                'grid',

                                            placeItems:
                                                'center',

                                            flexShrink: 0,

                                            color: '#fff',

                                            borderRadius:
                                                '15px',

                                            background:
                                                'var(--kmfri-gradient, linear-gradient(135deg,#0A3D62,#005B96))',

                                            boxShadow:
                                                '0 12px 28px rgba(0,91,150,0.20)',
                                        }}
                                    >

                                        <CurrentIcon
                                            sx={{
                                                fontSize: {
                                                    xs: 23,
                                                    sm: 27,
                                                },
                                            }}
                                        />

                                    </Box>


                                    <Box
                                        sx={{
                                            minWidth: 0,
                                        }}
                                    >

                                        <Typography
                                            sx={{
                                                color:
                                                    'var(--kmfri-secondary, #005B96)',

                                                fontSize:
                                                    '0.67rem',

                                                fontWeight: 900,

                                                letterSpacing:
                                                    '0.07em',

                                                textTransform:
                                                    'uppercase',
                                            }}
                                        >
                                            {
                                                currentStep.eyebrow
                                            }
                                        </Typography>


                                        <Typography
                                            sx={{
                                                mt: 0.3,

                                                color:
                                                    colorPalette.deepNavy ||
                                                    '#0A3D62',

                                                fontSize: {
                                                    xs: '1.15rem',
                                                    sm: '1.42rem',
                                                    md: '1.5rem',
                                                },

                                                fontWeight: 900,

                                                lineHeight: 1.2,

                                                letterSpacing:
                                                    '-0.02em',
                                            }}
                                        >
                                            {
                                                currentStep.title
                                            }
                                        </Typography>

                                    </Box>

                                </Stack>


                                {/* Main instruction */}

                                <Box
                                    sx={{
                                        position:
                                            'relative',

                                        mt: {
                                            xs: 2,
                                            sm: 2.6,
                                        },

                                        p: {
                                            xs: 2,
                                            sm: 2.5,
                                        },

                                        background: '#fff',

                                        border:
                                            '1px solid rgba(10,61,98,0.09)',

                                        borderRadius:
                                            '14px',

                                        boxShadow:
                                            '0 12px 35px rgba(10,61,98,0.055)',

                                        overflow:
                                            'hidden',

                                        '&::before': {
                                            content:
                                                '""',

                                            position:
                                                'absolute',

                                            top: 0,
                                            left: 0,

                                            width: 4,
                                            height:
                                                '100%',

                                            background:
                                                'var(--kmfri-secondary, #005B96)',
                                        },
                                    }}
                                >

                                    <Typography
                                        sx={{
                                            color:
                                                '#334155',

                                            fontSize: {
                                                xs: '0.88rem',
                                                sm: '0.95rem',
                                            },

                                            lineHeight: {
                                                xs: 1.7,
                                                sm: 1.78,
                                            },

                                            fontWeight: 500,
                                        }}
                                    >
                                        {
                                            currentStep.body
                                        }
                                    </Typography>

                                </Box>


                                {/* Helpful note */}

                                <Stack
                                    direction="row"

                                    spacing={1.1}

                                    alignItems="flex-start"

                                    sx={{
                                        mt: 1.5,

                                        p: 1.4,

                                        borderRadius:
                                            '10px',

                                        background:
                                            'rgba(0,91,150,0.045)',

                                        border:
                                            '1px solid rgba(0,91,150,0.07)',
                                    }}
                                >

                                    <SecurityRounded
                                        sx={{
                                            mt: 0.1,

                                            flexShrink: 0,

                                            color:
                                                'var(--kmfri-secondary, #005B96)',

                                            fontSize: 17,
                                        }}
                                    />


                                    <Box>

                                        <Typography
                                            sx={{
                                                color:
                                                    colorPalette.deepNavy ||
                                                    '#0A3D62',

                                                fontSize:
                                                    '0.7rem',

                                                fontWeight: 850,
                                            }}
                                        >
                                            Good to know
                                        </Typography>


                                        <Typography
                                            sx={{
                                                mt: 0.25,

                                                color:
                                                    '#64748B',

                                                fontSize:
                                                    '0.72rem',

                                                lineHeight: 1.5,
                                            }}
                                        >
                                            {
                                                currentStep.hint
                                            }
                                        </Typography>

                                    </Box>

                                </Stack>

                            </Box>

                        </Box>


                        {/* ═══════════════════════════
                            STICKY ACTION BAR
                        ═══════════════════════════ */}

                        <Box
                            sx={{
                                flexShrink: 0,

                                px: {
                                    xs: 1.5,
                                    sm: 3,
                                },

                                py: {
                                    xs: 1.25,
                                    sm: 1.6,
                                },

                                background:
                                    'rgba(255,255,255,0.96)',

                                borderTop:
                                    '1px solid rgba(10,61,98,0.08)',

                                backdropFilter:
                                    'blur(12px)',
                            }}
                        >

                            <Stack
                                direction="row"

                                alignItems="center"

                                justifyContent="space-between"

                                spacing={1}
                            >

                                <Button
                                    variant="outlined"

                                    startIcon={
                                        <ArrowBackRounded />
                                    }

                                    disabled={
                                        isFirstStep
                                    }

                                    onClick={
                                        handleBack
                                    }

                                    sx={{
                                        minWidth: {
                                            xs: 44,
                                            sm: 110,
                                        },

                                        height: 42,

                                        px: {
                                            xs: 1.2,
                                            sm: 2,
                                        },

                                        borderRadius:
                                            '10px',

                                        borderColor:
                                            'rgba(10,61,98,0.18)',

                                        color:
                                            colorPalette.deepNavy ||
                                            '#0A3D62',

                                        textTransform:
                                            'none',

                                        fontWeight: 800,

                                        '& .MuiButton-startIcon':
                                            {
                                                mr: {
                                                    xs: 0,
                                                    sm: 1,
                                                },
                                            },
                                    }}
                                >

                                    <Box
                                        component="span"

                                        sx={{
                                            display: {
                                                xs: 'none',
                                                sm: 'inline',
                                            },
                                        }}
                                    >
                                        Back
                                    </Box>

                                </Button>


                                {/* Current position */}

                                <Stack
                                    direction="row"

                                    spacing={0.5}

                                    alignItems="center"

                                    sx={{
                                        display: {
                                            xs: 'none',
                                            sm: 'flex',
                                        },
                                    }}
                                >

                                    {GUIDE_STEPS.map(
                                        (step, index) => (
                                            <Box
                                                key={
                                                    step.title
                                                }

                                                sx={{
                                                    width:
                                                        index ===
                                                        activeStep
                                                            ? 20
                                                            : 6,

                                                    height: 6,

                                                    borderRadius:
                                                        999,

                                                    background:
                                                        index ===
                                                        activeStep
                                                            ? 'var(--kmfri-secondary, #005B96)'
                                                            : index <
                                                                activeStep
                                                              ? 'rgba(0,91,150,0.40)'
                                                              : 'rgba(10,61,98,0.13)',

                                                    transition:
                                                        'all 200ms ease',
                                                }}
                                            />
                                        )
                                    )}

                                </Stack>


                                <Button
                                    variant="contained"

                                    endIcon={
                                        isLastStep ? (
                                            <CheckCircleRounded />
                                        ) : (
                                            <ArrowForwardRounded />
                                        )
                                    }

                                    onClick={
                                        handleNext
                                    }

                                    sx={{
                                        minWidth: {
                                            xs: 120,
                                            sm: 130,
                                        },

                                        height: 42,

                                        px: 2.3,

                                        borderRadius:
                                            '10px',

                                        background:
                                            'var(--kmfri-gradient, linear-gradient(135deg,#0A3D62,#005B96))',

                                        textTransform:
                                            'none',

                                        fontWeight: 900,

                                        boxShadow:
                                            '0 9px 22px rgba(0,91,150,0.20)',

                                        '&:hover': {
                                            boxShadow:
                                                '0 12px 26px rgba(0,91,150,0.26)',
                                        },
                                    }}
                                >
                                    {isLastStep
                                        ? 'Finish'
                                        : 'Next'}
                                </Button>

                            </Stack>

                        </Box>

                    </Box>

                </Box>

            </DialogContent>

        </Dialog>
    );
}

export default GuideDialog;