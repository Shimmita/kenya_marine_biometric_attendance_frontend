import {
    ArrowBack,
    ArrowForward,
    CheckCircle,
    PersonAdd,
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CircularProgress,
    Snackbar,
    Stack,
    Typography,
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useMemo, useState } from 'react';
import api from '../../service/Api';
import coreDataDetails from '../CoreDataDetails';
import {
    INTERN_ATTACHEE_ROLES,
    PersonalDetailsStep,
    ReviewDetailStep,
    RoleDetailsStep,
    WorkDetailsStep,
} from "../util/RegistrationUtils";
import { registerUser } from '../auth/Register';

const { colorPalette } = coreDataDetails;

/* ══ DESIGN TOKENS (dashboard light-theme) ══════════════════════════════════
   Matches the rest of the dashboard — white cards, ocean-blue accents,
   light gradient background.  No dark glass morphism here.
════════════════════════════════════════════════════════════════════════════ */
const tf = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '14px',
        background: 'rgba(10,61,98,0.03)',
        '&:hover fieldset':         { borderColor: colorPalette.oceanBlue },
        '&.Mui-focused fieldset':   { borderColor: colorPalette.oceanBlue, borderWidth: 2 },
    },
};

/* ── slide variants ── */
const slideVariants = {
    enter:  dir => ({ opacity: 0, x: dir * 40 }),
    center: ()  => ({ opacity: 1, x: 0 }),
    exit:   dir => ({ opacity: 0, x: dir * -40 }),
};

/* ══ STEP CONFIG ════════════════════════════════════════════════════════════ */
const STEPS = [
    { id: 'role',     label: 'Role',     icon: '👤', subtitle: 'Type of placement' },
    { id: 'personal', label: 'Personal', icon: '📋', subtitle: 'Your details' },
    { id: 'work',     label: 'Work',     icon: '🏢', subtitle: 'Station & department' },
    { id: 'review',   label: 'Review',   icon: '✅', subtitle: 'Confirm & submit' },
];

/* ══ STEP PROGRESS ══════════════════════════════════════════════════════════ */
const StepProgress = React.memo(({ current, total, steps }) => (
    <Box sx={{ mb: 4 }}>
        {/* Track + dots */}
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
            {/* bg track */}
            <Box sx={{
                position: 'absolute', top: '50%', left: '5%', right: '5%', height: 2,
                bgcolor: 'rgba(10,61,98,0.08)', transform: 'translateY(-50%)', borderRadius: 1,
            }} />
            {/* fill */}
            <Box sx={{
                position: 'absolute', top: '50%', left: '5%', height: 2, borderRadius: 1,
                background: colorPalette.oceanGradient,
                transform: 'translateY(-50%)',
                width: `${Math.min((current / (total - 1)) * 90, 90)}%`,
                transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
            }} />

            <Stack direction="row" justifyContent="space-between" sx={{ width: '100%', position: 'relative', zIndex: 1 }}>
                {steps.map((step, i) => {
                    const done   = i < current;
                    const active = i === current;
                    return (
                        <Stack key={step.id} alignItems="center" spacing={0.8} sx={{ flex: 1 }}>
                            <motion.div
                                animate={{ scale: active ? 1.15 : 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 28 }}>
                                <Box sx={{
                                    width: active ? 42 : 34, height: active ? 42 : 34,
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: (done || active) ? colorPalette.oceanGradient : 'rgba(10,61,98,0.07)',
                                    border: active
                                        ? `3px solid ${colorPalette.oceanBlue}`
                                        : done
                                            ? `2.5px solid ${colorPalette.oceanBlue}55`
                                            : '2px solid rgba(10,61,98,0.12)',
                                    boxShadow: active
                                        ? `0 0 0 5px ${colorPalette.oceanBlue}18, 0 6px 20px ${colorPalette.oceanBlue}30`
                                        : done ? `0 4px 14px ${colorPalette.oceanBlue}25` : 'none',
                                    transition: 'all 0.32s cubic-bezier(0.4,0,0.2,1)',
                                }}>
                                    {done
                                        ? <CheckCircle sx={{ fontSize: 17, color: '#fff' }} />
                                        : <Typography sx={{ fontSize: active ? '1rem' : '0.82rem', lineHeight: 1, userSelect: 'none' }}>
                                            {step.icon}
                                          </Typography>
                                    }
                                </Box>
                            </motion.div>
                            <Typography variant="caption" fontWeight={active ? 800 : 600} sx={{
                                fontSize: '0.60rem',
                                color: active ? colorPalette.oceanBlue : done ? colorPalette.deepNavy : 'text.disabled',
                                textTransform: 'uppercase', letterSpacing: 0.6,
                                display: { xs: 'none', sm: 'block' },
                                transition: 'color 0.3s',
                            }}>
                                {step.label}
                            </Typography>
                        </Stack>
                    );
                })}
            </Stack>
        </Box>

        {/* Subtitle */}
        <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.72rem' }}>
                Step {current + 1} of {total} —{' '}
                <strong style={{ color: colorPalette.deepNavy }}>{steps[current].label}</strong>:{' '}
                {steps[current].subtitle}
            </Typography>
        </Box>
    </Box>
));

/* ══ DEFAULT PASSWORD NOTICE ════════════════════════════════════════════════
   Shown on the Review step to inform the admin about the auto-assigned
   password and the first-login change requirement.
════════════════════════════════════════════════════════════════════════════ */
const DefaultPasswordNotice = () => (
    <Box sx={{
        p: 2, borderRadius: '14px',
        background: `linear-gradient(135deg, ${colorPalette.oceanBlue}08, ${colorPalette.oceanBlue}04)`,
        border: `1px solid ${colorPalette.oceanBlue}20`,
        display: 'flex', alignItems: 'flex-start', gap: 1.5,
    }}>
        <Box sx={{
            width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
            background: colorPalette.oceanGradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 12px ${colorPalette.oceanBlue}30`,
        }}>
            <Typography sx={{ fontSize: '1rem' }}>🔑</Typography>
        </Box>
        <Box>
            <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy} sx={{ mb: 0.4 }}>
                Default Password: <Box component="span" sx={{
                    fontFamily: 'monospace', bgcolor: `${colorPalette.oceanBlue}12`,
                    px: 0.8, py: 0.2, borderRadius: '6px', color: colorPalette.oceanBlue,
                }}>123456</Box>
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.65, fontSize: '0.76rem' }}>
                The registrant will be prompted to <strong>change this password immediately</strong> upon
                their first login. Make sure to inform them of this requirement.
            </Typography>
        </Box>
    </Box>
);

/* ══ MAIN COMPONENT ═════════════════════════════════════════════════════════ */
const UserRegistrationContent = () => {
    const [step,       setStep]       = useState(0);
    const [direction,  setDirection]  = useState(1);
    const [processing, setProcessing] = useState(false);
    const [snackOpen,  setSnackOpen]  = useState(false);
    const [snackMsg,   setSnackMsg]   = useState('');
    const [snackSev,   setSnackSev]   = useState('success');

    /* ── Form state ─────────────────────────────────────────────────────── */
    const [formData, setFormData] = useState({
        role:       '',
        name:       '',
        phone:      '',
        email:      '',
        gender:     '',
        department: '',
        station:    '',
        employeeId: '',
        password:   '123456',   // immutable default — changed on first login
        startDate:  new Date().toISOString().split('T')[0],
        endDate:    '',
    });
    const [errors, setErrors] = useState({});

    /* interns and attachees are never permanent employees */
    const isEmployee = false;

    /* ── Field handler ──────────────────────────────────────────────────── */
    const handle = useCallback(
        field => e => {
            const value = e?.target?.value ?? e;
            setFormData(prev => ({ ...prev, [field]: value }));
            if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
        },
        [errors],
    );

    /* ── Per-step validation ────────────────────────────────────────────── */
    const validateStep = useCallback(() => {
        const e = {};
        if (step === 0) {
            if (!formData.role) e.role = 'Please select a placement type to continue.';
        }
        if (step === 1) {
            if (!formData.name?.trim()) e.name = 'Full name is required';
            if (!formData.phone?.trim()) e.phone = 'Phone number is required';
            if (formData.phone && formData.phone.length > 10) e.phone = 'Phone number max 10 digits';
            if (!formData.email?.trim()) {
                e.email = 'Email is required';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                e.email = 'Please enter a valid email address';
            }
            if (!formData.gender) e.gender = 'Please select a gender';
        }
        if (step === 2) {
            if (!formData.station)     e.station     = 'Main clocking station is required';
            if (!formData.department)  e.department  = 'Department is required';
            if (!formData.employeeId?.trim()) e.employeeId = 'ID / registration number is required';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    }, [step, formData]);

    const goNext = () => {
        if (!validateStep()) return;
        setDirection(1);
        setStep(p => p + 1);
    };

    const goBack = () => {
        setDirection(-1);
        setStep(p => p - 1);
    };

    /* ── Submit ─────────────────────────────────────────────────────────── */
    const handleRegister = async () => {
        setProcessing(true);
        try {
            await registerUser({ formData });
            setSnackMsg(`${formData.name || 'User'} registered successfully! Default password: 123456`);
            setSnackSev('success');
            setSnackOpen(true);
            /* Reset */
            setFormData({
                role: '', name: '', phone: '', email: '', gender: '',
                department: '', station: '', employeeId: '',
                password: '123456',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
            });
            setStep(0);
        } catch (err) {
            setSnackMsg(err?.response?.data?.message || 'Registration failed. Please try again.');
            setSnackSev('error');
            setSnackOpen(true);
        } finally {
            setProcessing(false);
        }
    };

    /* ── Step content ───────────────────────────────────────────────────── */
    const renderStep = useMemo(() => {
        switch (step) {
            case 0:
                return (
                    <RoleDetailsStep
                        formData={formData}
                        errors={errors}
                        setFormData={setFormData}
                        setErrors={setErrors}
                        availableRoles={INTERN_ATTACHEE_ROLES}
                        title="Select Placement Type"
                        subtitle="Choose the category that best describes this registrant."
                    />
                );
            case 1:
                return (
                    <PersonalDetailsStep
                        formData={formData}
                        errors={errors}
                        handle={handle}
                        tf={tf}
                    />
                );
            case 2:
                return (
                    <WorkDetailsStep
                        formData={formData}
                        errors={errors}
                        handle={handle}
                        isEmployee={isEmployee}
                        tf={tf}
                        role={formData.role}
                    />
                );
            case 3:
                return (
                    <Stack spacing={3}>
                        <DefaultPasswordNotice />
                        <ReviewDetailStep
                            formData={formData}
                            isEmployee={isEmployee}
                            role={formData.role}
                            roles={INTERN_ATTACHEE_ROLES}
                        />
                    </Stack>
                );
            default:
                return null;
        }
    }, [step, formData, errors, handle]);

    /* ── Render ─────────────────────────────────────────────────────────── */
    return (
        <Box>
            {/* ── Two-column layout on wide screens ── */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' },
                gap: 3,
                alignItems: 'start',
            }}>

                {/* ── Main form card ── */}
                <Card elevation={0} sx={{
                    borderRadius: '24px',
                    bgcolor: '#fff',
                    border: '1px solid rgba(10,61,98,0.09)',
                    boxShadow: '0 4px 24px rgba(10,61,98,0.07)',
                    overflow: 'hidden',
                }}>
                    {/* Card header strip */}
                    <Box sx={{
                        background: colorPalette.oceanGradient,
                        px: 4, py: 2.5,
                        display: 'flex', alignItems: 'center', gap: 2,
                    }}>
                        <Box sx={{
                            width: 44, height: 44, borderRadius: '14px',
                            bgcolor: 'rgba(255,255,255,0.18)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.28)',
                        }}>
                            <PersonAdd sx={{ color: '#fff', fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={900} sx={{ color: '#fff', lineHeight: 1.2 }}>
                                Intern &amp; Attaché Registration
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.74rem' }}>
                                Register a new intern or industrial attaché
                            </Typography>
                        </Box>
                    </Box>

                    {/* Form body */}
                    <Box sx={{ p: { xs: 3, md: 4 } }}>
                        <StepProgress current={step} total={STEPS.length} steps={STEPS} />

                        {/* Animated step */}
                        <Box sx={{ minHeight: 280, overflow: 'hidden', position: 'relative' }}>
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={step}
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.30, ease: [0.4, 0, 0.2, 1] }}
                                >
                                    {renderStep}
                                </motion.div>
                            </AnimatePresence>
                        </Box>

                        {/* Navigation */}
                        <Stack direction="row" spacing={1.5} sx={{ mt: 4 }}>
                            {step > 0 && (
                                <Button
                                    variant="outlined"
                                    onClick={goBack}
                                    startIcon={<ArrowBack sx={{ fontSize: '1rem !important' }} />}
                                    sx={{
                                        borderRadius: '14px', textTransform: 'none', fontWeight: 700,
                                        flex: step === STEPS.length - 1 ? 'none' : 0.38,
                                        px: 2.5, py: 1.4,
                                        color: colorPalette.deepNavy,
                                        borderColor: 'rgba(10,61,98,0.20)',
                                        bgcolor: 'rgba(10,61,98,0.02)',
                                        '&:hover': {
                                            borderColor: colorPalette.oceanBlue,
                                            bgcolor: `${colorPalette.oceanBlue}06`,
                                        },
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    Back
                                </Button>
                            )}

                            {step < STEPS.length - 1 ? (
                                <Button
                                    variant="contained"
                                    onClick={goNext}
                                    fullWidth
                                    endIcon={<ArrowForward sx={{ fontSize: '1rem !important' }} />}
                                    sx={{
                                        flex: 1,
                                        background: colorPalette.oceanGradient,
                                        py: 1.5, borderRadius: '14px', fontWeight: 800,
                                        fontSize: '0.9rem', textTransform: 'none', letterSpacing: 0.3,
                                        boxShadow: `0 6px 24px ${colorPalette.oceanBlue}38`,
                                        transition: 'all 0.22s ease',
                                        '&:hover': {
                                            boxShadow: `0 10px 32px ${colorPalette.oceanBlue}50`,
                                            transform: 'translateY(-2px)',
                                        },
                                    }}
                                >
                                    {step === 0 ? 'Get Started' : 'Continue'}
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    fullWidth
                                    disabled={processing}
                                    onClick={handleRegister}
                                    startIcon={
                                        processing
                                            ? <CircularProgress size={16} sx={{ color: 'rgba(255,255,255,0.7)' }} />
                                            : <CheckCircle />
                                    }
                                    sx={{
                                        flex: 1,
                                        background: colorPalette.oceanGradient,
                                        py: 1.5, borderRadius: '14px', fontWeight: 800,
                                        fontSize: '0.92rem', textTransform: 'none', letterSpacing: 0.3,
                                        boxShadow: `0 6px 24px ${colorPalette.oceanBlue}38`,
                                        transition: 'all 0.22s ease',
                                        '&:hover': {
                                            boxShadow: `0 10px 32px ${colorPalette.oceanBlue}50`,
                                            transform: 'translateY(-2px)',
                                        },
                                    }}
                                >
                                    {processing ? 'Registering…' : 'Complete Registration'}
                                </Button>
                            )}
                        </Stack>
                    </Box>
                </Card>

                {/* ── Side info panel ── */}
                <Stack spacing={2.5} sx={{ display: { xs: 'none', lg: 'flex' } }}>

                    {/* What happens next */}
                    <Card elevation={0} sx={{
                        borderRadius: '20px', p: 3,
                        bgcolor: '#fff',
                        border: '1px solid rgba(10,61,98,0.08)',
                        boxShadow: '0 4px 20px rgba(10,61,98,0.06)',
                    }}>
                        <Typography variant="subtitle2" fontWeight={900} color={colorPalette.deepNavy} sx={{ mb: 2 }}>
                            What happens next?
                        </Typography>
                        <Stack spacing={1.8}>
                            {[
                                { step: '1', text: 'Account is created with default password 123456', color: colorPalette.oceanBlue },
                                { step: '2', text: 'Registrant logs in and is prompted to change their password', color: colorPalette.seafoamGreen },
                                { step: '3', text: 'HR or Admin activates the account within 1 business day', color: colorPalette.cyanFresh },
                                { step: '4', text: 'Registrant can begin clocking in/out from their assigned station', color: colorPalette.aquaVibrant },
                            ].map(({ step, text, color }) => (
                                <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{
                                        width: 26, height: 26, borderRadius: '8px', flexShrink: 0,
                                        bgcolor: `${color}15`, border: `1.5px solid ${color}30`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Typography variant="caption" fontWeight={900} sx={{ color, fontSize: '0.7rem' }}>
                                            {step}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, fontSize: '0.82rem' }}>
                                        {text}
                                    </Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Card>

                    {/* Password info card */}
                    <Card elevation={0} sx={{
                        borderRadius: '20px', p: 3,
                        background: `linear-gradient(135deg, ${colorPalette.oceanBlue}10, ${colorPalette.oceanBlue}05)`,
                        border: `1px solid ${colorPalette.oceanBlue}18`,
                        boxShadow: 'none',
                    }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                            <Typography sx={{ fontSize: '1.4rem' }}>🔑</Typography>
                            <Typography variant="subtitle2" fontWeight={900} color={colorPalette.deepNavy}>
                                Default Password Policy
                            </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: '0.82rem' }}>
                            All new registrants are assigned the default password{' '}
                            <Box component="span" sx={{
                                fontFamily: 'monospace', fontWeight: 900,
                                bgcolor: `${colorPalette.oceanBlue}18`,
                                px: 0.7, py: 0.15, borderRadius: '5px',
                                color: colorPalette.oceanBlue,
                            }}>
                                123456
                            </Box>
                            . They will be required to set a new, secure password before accessing the portal.
                        </Typography>
                    </Card>

                    {/* Placement types */}
                    <Card elevation={0} sx={{
                        borderRadius: '20px', p: 3,
                        bgcolor: '#fff',
                        border: '1px solid rgba(10,61,98,0.08)',
                        boxShadow: '0 4px 20px rgba(10,61,98,0.06)',
                    }}>
                        <Typography variant="subtitle2" fontWeight={900} color={colorPalette.deepNavy} sx={{ mb: 1.5 }}>
                            Placement Types
                        </Typography>
                        <Stack spacing={1.2}>
                            {[
                                { icon: '🎓', title: 'Intern',   desc: 'University or college internship programme' },
                                { icon: '📋', title: 'Attaché',  desc: 'Industrial attachment / student placement' },
                            ].map(({ icon, title, desc }) => (
                                <Box key={title} sx={{
                                    display: 'flex', gap: 1.5, alignItems: 'flex-start',
                                    p: 1.4, borderRadius: '12px', bgcolor: 'rgba(10,61,98,0.03)',
                                    border: '1px solid rgba(10,61,98,0.07)',
                                }}>
                                    <Typography sx={{ fontSize: '1.1rem', flexShrink: 0 }}>{icon}</Typography>
                                    <Box>
                                        <Typography variant="caption" fontWeight={800} color={colorPalette.deepNavy} sx={{ display: 'block' }}>
                                            {title}
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem', lineHeight: 1.5 }}>
                                            {desc}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                    </Card>
                </Stack>
            </Box>

            {/* ── Success / error snackbar ── */}
            <Snackbar
                open={snackOpen}
                autoHideDuration={snackSev === 'success' ? 4000 : 6000}
                onClose={() => setSnackOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackOpen(false)}
                    severity={snackSev}
                    icon={snackSev === 'success' ? <CheckCircle /> : undefined}
                    sx={{
                        borderRadius: '14px', fontWeight: 700,
                        backdropFilter: 'blur(16px)',
                        boxShadow: snackSev === 'success'
                            ? '0 8px 28px rgba(72,201,176,0.32)'
                            : '0 8px 28px rgba(239,68,68,0.28)',
                    }}
                >
                    {snackMsg}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default UserRegistrationContent;