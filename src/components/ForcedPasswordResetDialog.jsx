import {
    CheckCircleRounded,
    LockResetRounded,
    LogoutRounded,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    IconButton,
    InputAdornment,
    LinearProgress,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';

const palette = {
    navy: '#0A3D62',
    teal: '#0f766e',
    ink: '#0f172a',
    muted: 'rgba(15,23,42,0.62)',
    border: 'rgba(10,61,98,0.12)',
    surface: '#f8fbff',
};

const inputSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        background: '#fff',
        color: palette.ink,
        '& fieldset': { borderColor: 'rgba(10,61,98,0.16)' },
        '&:hover fieldset': { borderColor: 'rgba(10,61,98,0.34)' },
        '&.Mui-focused fieldset': { borderColor: palette.navy, borderWidth: 1.5 },
        '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(10,61,98,0.08)' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(15,23,42,0.58)', fontWeight: 700, fontSize: '0.8rem' },
    '& .MuiInputLabel-root.Mui-focused': { color: palette.navy },
    '& input::placeholder': { color: 'rgba(15,23,42,0.34)', opacity: 1 },
};

const getPasswordScore = (password) => {
    const value = String(password || '');
    let score = 0;
    if (value.length >= 6) score += 25;
    if (value.length >= 10) score += 20;
    if (/[A-Z]/.test(value)) score += 20;
    if (/[0-9]/.test(value)) score += 20;
    if (/[^A-Za-z0-9]/.test(value)) score += 15;
    return Math.min(score, 100);
};

const ForcedPasswordResetDialog = ({ open, user, onSubmit, onSignOut }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const passwordScore = useMemo(() => getPasswordScore(newPassword), [newPassword]);
    const passwordLabel = passwordScore >= 80 ? 'Strong' : passwordScore >= 45 ? 'Good' : 'Basic';
    const passwordsMatch = Boolean(confirmPassword) && newPassword === confirmPassword;

    const handleSubmit = async () => {
        setError('');

        if (!newPassword || !confirmPassword) {
            setError('Enter and confirm your new password.');
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            setSaving(true);
            await onSubmit?.({ newPassword, confirmPassword });
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(String(err || 'Password update failed.'));
        } finally {
            setSaving(false);
        }
    };

    const handleClose = (_, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            disableEscapeKeyDown
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: {
                    borderRadius: '8px',
                    overflow: 'hidden',
                    bgcolor: palette.surface,
                    border: `1px solid ${palette.border}`,
                    boxShadow: '0 28px 70px rgba(10,61,98,0.24)',
                    m: { xs: 1.2, sm: 2 },
                    width: { xs: 'calc(100% - 20px)', sm: 'min(560px, calc(100% - 32px))' },
                },
            }}
            BackdropProps={{
                sx: {
                    backdropFilter: 'blur(3px)',
                    bgcolor: 'rgba(3,12,28,0.42)',
                },
            }}
        >
            <Box
                sx={{
                    px: { xs: 2.2, sm: 3 },
                    py: { xs: 2.3, sm: 2.8 },
                    background: `linear-gradient(135deg, ${palette.navy} 0%, ${palette.teal} 100%)`,
                    color: '#fff',
                }}
            >
                <Stack direction="row" spacing={1.6} alignItems="center">
                    <Box
                        sx={{
                            width: 46,
                            height: 46,
                            borderRadius: '8px',
                            bgcolor: 'rgba(255,255,255,0.16)',
                            border: '1px solid rgba(255,255,255,0.24)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <LockResetRounded />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.05rem', sm: '1.22rem' }, lineHeight: 1.2 }}>
                            Change Temporary Password
                        </Typography>
                        <Typography sx={{ mt: 0.35, color: 'rgba(255,255,255,0.78)', fontSize: '0.78rem', overflowWrap: 'anywhere' }}>
                            {user?.name || user?.email || 'Your account'} must set a new password before continuing.
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            <DialogContent sx={{ px: { xs: 2.2, sm: 3 }, py: { xs: 2.2, sm: 3 } }}>
                <Stack spacing={2}>
                    <Alert
                        severity="info"
                        icon={false}
                        sx={{
                            borderRadius: '8px',
                            bgcolor: 'rgba(14,165,233,0.08)',
                            border: '1px solid rgba(14,165,233,0.18)',
                            color: palette.ink,
                            '& .MuiAlert-message': { width: '100%' },
                        }}
                    >
                        <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: palette.navy }}>
                            First login security step
                        </Typography>
                        <Typography sx={{ mt: 0.35, fontSize: '0.78rem', color: palette.muted, lineHeight: 1.55 }}>
                            Use a password only you know. After this update, the temporary password will no longer work.
                        </Typography>
                    </Alert>

                    {error && (
                        <Alert
                            severity="error"
                            sx={{
                                borderRadius: '8px',
                                bgcolor: '#fef2f2',
                                border: '1px solid rgba(220,38,38,0.20)',
                                '& .MuiAlert-message': { fontSize: '0.8rem', fontWeight: 700 },
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    <TextField
                        label="New Password"
                        placeholder="Enter new password"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(event) => {
                            setNewPassword(event.target.value);
                            if (error) setError('');
                        }}
                        fullWidth
                        size="small"
                        sx={inputSx}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockResetRounded sx={{ color: 'rgba(10,61,98,0.58)', fontSize: 18 }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setShowPassword((value) => !value)} edge="end" sx={{ color: 'rgba(10,61,98,0.54)' }}>
                                        {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.7 }}>
                            <Typography sx={{ fontSize: '0.72rem', color: palette.muted, fontWeight: 800 }}>
                                Password Strength
                            </Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: passwordScore >= 80 ? '#047857' : passwordScore >= 45 ? '#0A3D62' : '#b45309', fontWeight: 900 }}>
                                {passwordLabel}
                            </Typography>
                        </Stack>
                        <LinearProgress
                            variant="determinate"
                            value={passwordScore}
                            sx={{
                                height: 7,
                                borderRadius: 99,
                                bgcolor: 'rgba(10,61,98,0.08)',
                                '& .MuiLinearProgress-bar': {
                                    borderRadius: 99,
                                    bgcolor: passwordScore >= 80 ? '#10b981' : passwordScore >= 45 ? palette.navy : '#f59e0b',
                                },
                            }}
                        />
                    </Box>

                    <TextField
                        label="Confirm New Password"
                        placeholder="Re-enter new password"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(event) => {
                            setConfirmPassword(event.target.value);
                            if (error) setError('');
                        }}
                        fullWidth
                        size="small"
                        sx={inputSx}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <CheckCircleRounded sx={{ color: passwordsMatch ? '#10b981' : 'rgba(10,61,98,0.42)', fontSize: 18 }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Stack
                        direction={{ xs: 'column-reverse', sm: 'row' }}
                        spacing={1.2}
                        justifyContent="space-between"
                        sx={{ pt: 0.6 }}
                    >
                        <Button
                            variant="outlined"
                            onClick={onSignOut}
                            disabled={saving}
                            startIcon={<LogoutRounded />}
                            sx={{
                                width: { xs: '100%', sm: 'auto' },
                                minWidth: { sm: 112 },
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontWeight: 800,
                                color: palette.navy,
                                borderColor: 'rgba(10,61,98,0.22)',
                                bgcolor: '#fff',
                            }}
                        >
                            Sign Out
                        </Button>

                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={saving || !newPassword || !confirmPassword}
                            startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <LockResetRounded />}
                            sx={{
                                width: { xs: '100%', sm: 'auto' },
                                minWidth: { sm: 190 },
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontWeight: 900,
                                bgcolor: palette.navy,
                                boxShadow: '0 8px 20px rgba(10,61,98,0.24)',
                                '&:hover': { bgcolor: '#075985', boxShadow: '0 10px 24px rgba(10,61,98,0.30)' },
                            }}
                        >
                            {saving ? 'Updating...' : 'Update Password'}
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default ForcedPasswordResetDialog;
