import {
    ArrowBack,
    CheckCircle,
    Email,
    Lock,
    Security,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    Container,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { motion as Motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { requestPasswordReset, resetPassword } from '../service/ResetPasswordService';
import coreDataDetails from './CoreDataDetails';

const { colorPalette } = coreDataDetails;

const G = {
    meshBg: `
        radial-gradient(ellipse at 12% 18%, rgba(0,130,190,0.52) 0%, transparent 46%),
        radial-gradient(ellipse at 80% 10%, rgba(0,55,115,0.62) 0%, transparent 40%),
        radial-gradient(ellipse at 58% 78%, rgba(0,110,155,0.42) 0%, transparent 50%),
        radial-gradient(ellipse at 3%  88%, rgba(8,44,82,0.56)  0%, transparent 38%),
        radial-gradient(ellipse at 94% 85%, rgba(0,185,175,0.24) 0%, transparent 36%),
        linear-gradient(158deg, #051c30 0%, #09355a 38%, #073a52 68%, #052840 100%)
    `,
    formCard: {
        background: 'rgba(255,255,255,0.90)',
        backdropFilter: 'blur(42px) saturate(220%)',
        WebkitBackdropFilter: 'blur(42px) saturate(220%)',
        border: '1px solid rgba(255,255,255,0.60)',
        boxShadow: '0 32px 80px rgba(6,28,50,0.30), inset 0 1px 0 rgba(255,255,255,0.72)',
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

const AmbientOrbs = () => (
    <>
        {[
            { s: 500, t: -100, l: -150, c: 'rgba(0,160,210,0.10)', b: 80 },
            { s: 380, t: '32%', r: -120, c: 'rgba(0,220,255,0.07)', b: 65 },
            { s: 560, bot: -180, l: '18%', c: 'rgba(8,44,80,0.20)', b: 90 },
            { s: 280, t: '52%', l: '52%', c: 'rgba(0,190,165,0.09)', b: 55 },
        ].map(({ s, t, l, r, bot, c, b }, i) => (
            <Box
                key={i}
                sx={{
                    position: 'absolute',
                    width: s,
                    height: s,
                    pointerEvents: 'none',
                    zIndex: 0,
                    top: t,
                    left: l,
                    right: r,
                    bottom: bot,
                    borderRadius: '50%',
                    background: c,
                    filter: `blur(${b}px)`,
                }}
            />
        ))}
    </>
);

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialEmail = useMemo(() => searchParams.get('email') || '', [searchParams]);
    const [email, setEmail] = useState(initialEmail);
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState(initialEmail ? 'reset' : 'request');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    const handleRequestCode = async () => {
        setError('');
        setSuccess('');

        if (!email.trim()) {
            setError('Email is required');
            return;
        }
        if (!validateEmail(email)) {
            setError('Please enter a valid registered email');
            return;
        }

        setSubmitting(true);
        try {
            const response = await requestPasswordReset(email.trim());
            setSuccess(response?.message || 'A reset code has been sent to your email');
            setStep('reset');
        } catch (err) {
            setError(String(err || 'Failed to send password reset code'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = async () => {
        setError('');
        setSuccess('');

        if (!email.trim() || !validateEmail(email)) {
            setError('Enter the same registered email used to request the code');
            return;
        }
        if (!code.trim()) {
            setError('Reset code is required');
            return;
        }
        if (!newPassword.trim()) {
            setError('New password is required');
            return;
        }
        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setSubmitting(true);
        try {
            await resetPassword(email.trim(), code.trim(), newPassword);
            setSuccess('Password reset successful. You can now sign in with your new password.');
            setTimeout(() => navigate('/'), 1400);
        } catch (err) {
            setError(String(err || 'Failed to reset password'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh', position: 'relative', overflow: 'hidden', background: G.meshBg,
            display: 'flex',
            alignItems: 'center',     
            justifyContent: 'center',
        }}>
            <AmbientOrbs />
            <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1,  }}>
                <Motion.div
                    initial={{ opacity: 0, y: 28, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                    <Card sx={{ ...G.formCard, p: { xs: 3, md: 4.5 }, borderRadius: '28px' }}>
                        <Stack direction="row" justifyContent="flex-end" alignItems="center" mb={3}>
                            <IconButton
                                onClick={() => navigate('/')}
                                sx={{ background: 'rgba(10,61,98,0.07)', border: '1px solid rgba(10,61,98,0.12)' }}>
                                <ArrowBack sx={{ fontSize: 18, color: colorPalette.deepNavy }} />
                            </IconButton>
                        </Stack>

                        <Box sx={{ textAlign: 'center', mb: 3.5 }}>
                            <Box sx={{ width: 76, height: 76, borderRadius: '50%', background: colorPalette.oceanGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, boxShadow: `0 10px 32px ${colorPalette.oceanBlue}42` }}>
                                <Security sx={{ fontSize: 38, color: '#fff' }} />
                            </Box>
                            <Typography variant="h5" fontWeight={900} sx={{ background: colorPalette.oceanGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 0.75 }}>
                                Reset Password
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                Request a reset code by email, then enter the code and your new password.
                            </Typography>
                        </Box>

                        <Stack spacing={2.2}>
                            {error && <Alert severity="error" sx={{ borderRadius: '14px' }}>{error}</Alert>}
                            {success && <Alert severity="success" icon={<CheckCircle />} sx={{ borderRadius: '14px' }}>{success}</Alert>}

                            <TextField
                                fullWidth
                                label="Registered Email"
                                placeholder="example@kmfri.go.ke"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                sx={G.lightInput}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Email sx={{ color: colorPalette.oceanBlue }} /></InputAdornment>,
                                }}
                            />

                            {step === 'reset' && (
                                <>
                                    <TextField
                                        fullWidth
                                        label="Reset Code"
                                        placeholder="Enter the 6-digit code sent to your email"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        sx={G.lightInput}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Security sx={{ color: colorPalette.oceanBlue }} /></InputAdornment>,
                                        }}
                                    />

                                    <TextField
                                        fullWidth
                                        label="New Password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        sx={G.lightInput}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Lock sx={{ color: colorPalette.oceanBlue }} /></InputAdornment>,
                                            endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword((v) => !v)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>,
                                        }}
                                    />

                                    <TextField
                                        fullWidth
                                        label="Confirm Password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        sx={G.lightInput}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Lock sx={{ color: colorPalette.oceanBlue }} /></InputAdornment>,
                                        }}
                                    />
                                </>
                            )}

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                {step === 'request' ? (
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        disabled={submitting}
                                        onClick={handleRequestCode}
                                        sx={{ background: colorPalette.oceanGradient, py: 1.55, borderRadius: '14px', fontWeight: 800, textTransform: 'none' }}>
                                        {submitting ? 'Sending code...' : 'Send Reset Code'}
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            disabled={submitting}
                                            onClick={handleRequestCode}
                                            sx={{ py: 1.55, borderRadius: '14px', fontWeight: 800, textTransform: 'none', borderColor: 'rgba(10,61,98,0.22)', color: colorPalette.deepNavy }}>
                                            {submitting ? 'Resending...' : 'Resend Code'}
                                        </Button>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            disabled={submitting}
                                            onClick={handleResetPassword}
                                            sx={{ background: colorPalette.oceanGradient, py: 1.55, borderRadius: '14px', fontWeight: 800, textTransform: 'none' }}>
                                            {submitting ? 'Resetting...' : 'Reset Password'}
                                        </Button>
                                    </>
                                )}
                            </Stack>

                            <Button
                                variant="text"
                                onClick={() => navigate('/')}
                                sx={{ color: colorPalette.oceanBlue, fontWeight: 700, textTransform: 'none', alignSelf: 'center' }}>
                                Back to Sign In
                            </Button>
                        </Stack>
                    </Card>
                </Motion.div>
            </Container>
        </Box>
    );
}
