import {
    BadgeRounded,
    CameraAlt,
    Close,
    EditRounded,
    EmailRounded,
    LockRounded,
    PersonRounded,
    PhoneRounded,
    SaveRounded,
    Visibility,
    VisibilityOff,
    WorkRounded,
} from '@mui/icons-material';
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/* ─── palette / glass tokens (keep in sync with dashboard) ─────────────── */
const G = {
    dialog: {
        background: '#f8fbff',
        border: '1px solid rgba(10,61,98,0.12)',
        boxShadow: '0 28px 70px rgba(10,61,98,0.22)',
    },
    surface: {
        background: '#fff',
        border: '1px solid rgba(10,61,98,0.10)',
        borderRadius: '8px',
        boxShadow: '0 4px 18px rgba(10,61,98,0.05)',
    },
    inputSx: {
        '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            color: '#0f172a',
            fontSize: '0.875rem',
            background: '#fff',
            transition: 'box-shadow 0.2s, border-color 0.2s',
            '& fieldset': { borderColor: 'rgba(10,61,98,0.16)' },
            '&:hover fieldset': { borderColor: 'rgba(10,61,98,0.38)' },
            '&.Mui-focused fieldset': { borderColor: '#0A3D62', borderWidth: 1.5 },
            '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(10,61,98,0.08)' },
            '&.Mui-disabled': {
                background: 'rgba(10,61,98,0.035)',
                '& fieldset': { borderColor: 'rgba(10,61,98,0.08)' },
            },
        },
        '& .MuiInputLabel-root': { color: 'rgba(15,23,42,0.58)', fontSize: '0.8rem', fontWeight: 700 },
        '& .MuiInputLabel-root.Mui-focused': { color: '#0A3D62' },
        '& .MuiInputLabel-root.Mui-disabled': { color: 'rgba(15,23,42,0.40)' },
        '& .MuiInputAdornment-root svg': { fontSize: 17 },
        '& input.Mui-disabled': { WebkitTextFillColor: 'rgba(15,23,42,0.62)', cursor: 'not-allowed' },
    },
};

const RANK_COLORS = {
    admin: { bg: 'rgba(251,191,36,0.18)', color: '#92400e', border: 'rgba(251,191,36,0.38)' },
    hr: { bg: 'rgba(167,139,250,0.18)', color: '#5b21b6', border: 'rgba(167,139,250,0.38)' },
    supervisor: { bg: 'rgba(34,211,238,0.18)', color: '#0e7490', border: 'rgba(34,211,238,0.38)' },
    ceo: { bg: 'rgba(249,115,22,0.18)', color: '#9a3412', border: 'rgba(249,115,22,0.38)' },
    auditor: { bg: 'rgba(14,165,233,0.16)', color: '#075985', border: 'rgba(14,165,233,0.32)' },
    superadmin: { bg: 'rgba(10,61,98,0.12)', color: '#0A3D62', border: 'rgba(10,61,98,0.24)' },
    user: { bg: 'rgba(96,165,250,0.14)', color: '#1d4ed8', border: 'rgba(96,165,250,0.30)' },
};

const ROLE_COLORS = {
    employee: { bg: 'rgba(52,211,153,0.15)', color: '#047857', border: 'rgba(52,211,153,0.32)' },
    intern: { bg: 'rgba(251,191,36,0.18)', color: '#92400e', border: 'rgba(251,191,36,0.36)' },
    attachee: { bg: 'rgba(167,139,250,0.18)', color: '#5b21b6', border: 'rgba(167,139,250,0.36)' },
};

/* ─── tiny helpers ──────────────────────────────────────────────────────── */
const initials = (name = '') => {
    const parts = name.trim().split(' ');
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
};

const fmtDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return d; }
};

/* ─── LockedField ───────────────────────────────────────────────────────── */
const LockedField = ({ label, value, icon }) => (
    <TextField
        label={label}
        value={value || '—'}
        disabled
        fullWidth
        size="small"
        sx={G.inputSx}
        InputProps={{
            startAdornment: icon ? (
                <InputAdornment position="start">
                    <Box sx={{ color: 'rgba(10,61,98,0.52)' }}>{icon}</Box>
                </InputAdornment>
            ) : undefined,
            endAdornment: (
                <InputAdornment position="end">
                    <LockRounded sx={{ fontSize: '14px !important', color: 'rgba(10,61,98,0.34)' }} />
                </InputAdornment>
            ),
        }}
    />
);

/* ─── SectionTitle ──────────────────────────────────────────────────────── */
const SectionTitle = ({ children }) => (
    <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 1.5 }}>
        <Typography sx={{ fontWeight: 900, fontSize: '0.68rem', letterSpacing: 0.8, textTransform: 'uppercase', color: '#0A3D62', whiteSpace: 'nowrap' }}>
            {children}
        </Typography>
        <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(10,61,98,0.10)' }} />
    </Stack>
);

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════════════ */
const UserProfileDialog = ({ open, onClose, user, onSave }) => {
    const fileInputRef = useRef(null);
    const saveSuccessTimerRef = useRef(null);

    /* editable state */
    const [phone, setPhone] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [saveSuccess, setSaveSuccess] = useState(false);

    /* sync with user prop */
    useEffect(() => {
        if (saveSuccessTimerRef.current) clearTimeout(saveSuccessTimerRef.current);
        if (user) {
            setPhone(user.phone || '');
            setAvatarPreview(user.avatar || null);
        }
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
        setSaveSuccess(false);
    }, [user, open]);

    useEffect(() => () => {
        if (saveSuccessTimerRef.current) clearTimeout(saveSuccessTimerRef.current);
    }, []);

    /* ── avatar pick ── */
    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onload = () => setAvatarPreview(reader.result);
        reader.readAsDataURL(file);
    };

    /* ── validate ── */
    const validate = () => {
        const errs = {};
        if (!phone.trim()) errs.phone = 'Phone number is required';
        else if (!/^\+?[\d\s\-()]{7,20}$/.test(phone.trim())) errs.phone = 'Enter a valid phone number';
        if (newPassword) {
            if (newPassword.length < 6) errs.newPassword = 'Minimum 6 characters';
            if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    /* ── save ── */
    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            await onSave?.({ phone, newPassword: newPassword || undefined, avatarFile });

            setSaveSuccess(true);
            setNewPassword('');
            setConfirmPassword('');
            setAvatarFile(null);
            if (saveSuccessTimerRef.current) clearTimeout(saveSuccessTimerRef.current);
            saveSuccessTimerRef.current = setTimeout(() => setSaveSuccess(false), 2000);
        } catch (err) {
            setErrors({ general: err?.message || 'Failed to save changes. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const hasChanges =
        phone !== (user?.phone || '') ||
        newPassword.length > 0 ||
        avatarFile !== null;

    const rankStyle = RANK_COLORS[user?.rank] ?? RANK_COLORS.user;
    const roleStyle = ROLE_COLORS[user?.role] ?? ROLE_COLORS.employee;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            TransitionProps={{ timeout: 300 }}
            PaperProps={{
                component: Motion.div,
                initial: { opacity: 0, scale: 0.94, y: 20 },
                animate: { opacity: 1, scale: 1, y: 0 },
                exit: { opacity: 0, scale: 0.94, y: 20 },
                transition: { duration: 0.28, ease: [0.34, 1.12, 0.64, 1] },
                sx: {
                    ...G.dialog,
                    borderRadius: '8px',
                    m: { xs: 1, sm: 2 },
                    width: { xs: 'calc(100% - 16px)', sm: 'min(820px, calc(100% - 32px))' },
                    maxHeight: { xs: 'calc(100dvh - 16px)', sm: '92vh' },
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': { width: 6 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(10,61,98,0.18)', borderRadius: 4 },
                },
            }}
            BackdropProps={{
                sx: {
                    backdropFilter: 'blur(3px)',
                    bgcolor: 'rgba(3,12,28,0.38)',
                },
            }}
        >
            {/* ── Header ── */}
            <Box sx={{
                position: 'relative',
                px: { xs: 2.5, sm: 3.5 },
                pt: 3,
                pb: 2.5,
                background: 'linear-gradient(135deg, #0A3D62 0%, #0f766e 100%)',
                borderBottom: '1px solid rgba(10,61,98,0.12)',
            }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
                    {/* Avatar + identity */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'center', sm: 'flex-start' }} spacing={2.2}>
                        {/* Avatar with upload overlay */}
                        <Box sx={{ position: 'relative', flexShrink: 0 }}>
                            <Avatar
                                src={avatarPreview || undefined}
                                sx={{
                                    width: { xs: 68, sm: 76 },
                                    height: { xs: 68, sm: 76 },
                                    background: 'rgba(255,255,255,0.16)',
                                    border: '2px solid rgba(255,255,255,0.55)',
                                    color: '#fff',
                                    fontWeight: 900,
                                    fontSize: '1.4rem',
                                    boxShadow: '0 8px 22px rgba(0,0,0,0.22)',
                                }}>
                                {!avatarPreview && initials(user?.name)}
                            </Avatar>
                            {/* Camera overlay */}
                            <Tooltip title="Change photo" placement="bottom">
                                <IconButton
                                    aria-label="Change photo"
                                    onClick={() => fileInputRef.current?.click()}
                                    sx={{
                                        position: 'absolute', inset: 0, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'rgba(0,0,0,0)',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        '&:hover': { background: 'rgba(0,0,0,0.52)' },
                                        '&:hover .cam-icon': { opacity: 1, transform: 'scale(1)' },
                                    }}>
                                    <CameraAlt className="cam-icon" sx={{ color: '#fff', fontSize: 20, opacity: 0, transform: 'scale(0.85)', transition: 'all 0.2s ease', pointerEvents: 'none' }} />
                                </IconButton>
                            </Tooltip>

                            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                            {/* Edit badge */}
                            <Box sx={{
                                position: 'absolute', bottom: 0, right: 0,
                                width: 22, height: 22, borderRadius: '50%',
                                bgcolor: '#0ea5e9', border: '2px solid #fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                pointerEvents: 'none',
                            }}>
                                <EditRounded sx={{ fontSize: 11, color: '#fff' }} />
                            </Box>
                        </Box>

                        {/* Name + badges */}
                        <Box sx={{ minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}>
                            <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.1rem', sm: '1.25rem' }, color: '#fff', lineHeight: 1.2, mb: 0.5 }}>
                                {user?.name || 'Unknown User'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.78)', mb: 1, overflowWrap: 'anywhere' }}>
                                {user?.email}
                            </Typography>
                            <Stack direction="row" spacing={0.8} flexWrap="wrap" justifyContent={{ xs: 'center', sm: 'flex-start' }}>
                                <Chip
                                    label={(user?.rank ?? 'user').toUpperCase()}
                                    size="small"
                                    sx={{
                                        height: 20, fontWeight: 700, fontSize: '0.58rem',
                                        bgcolor: 'rgba(255,255,255,0.16)', color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.24)', borderRadius: '7px',
                                        fontFamily: 'monospace',
                                    }}
                                />
                                <Chip
                                    label={(user?.role ?? 'employee').replace('-', ' ').toUpperCase()}
                                    size="small"
                                    sx={{
                                        height: 20, fontWeight: 700, fontSize: '0.58rem',
                                        bgcolor: 'rgba(255,255,255,0.16)', color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.24)', borderRadius: '7px',
                                        fontFamily: 'monospace',
                                    }}
                                />
                                {user?.employeeId && (
                                    <Chip
                                        label={`#${user.employeeId}`}
                                        size="small"
                                        sx={{
                                            height: 20, fontWeight: 700, fontSize: '0.58rem',
                                            bgcolor: 'rgba(255,255,255,0.16)', color: '#fff',
                                            border: '1px solid rgba(255,255,255,0.24)', borderRadius: '7px',
                                            fontFamily: 'monospace',
                                        }}
                                    />
                                )}
                            </Stack>
                        </Box>
                    </Stack>

                    {/* Close */}
                    <IconButton
                        onClick={onClose}
                        size="small"
                        sx={{
                            color: 'rgba(255,255,255,0.78)',
                            bgcolor: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.24)',
                            borderRadius: '8px',
                            width: 34, height: 34, flexShrink: 0,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' },
                            transition: 'all 0.18s ease',
                        }}>
                        <Close sx={{ fontSize: 16 }} />
                    </IconButton>
                </Stack>
            </Box>

            <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 }, bgcolor: '#f8fbff' }}>
                <Stack spacing={2}>

                    {/* ── READ-ONLY DETAILS ── */}
                    <Box sx={{ ...G.surface, p: { xs: 1.8, sm: 2.2 } }}>
                        <SectionTitle>Account Details</SectionTitle>
                        <Stack spacing={1.6}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.6}>
                                <LockedField label="Full Name" value={user?.name} icon={<PersonRounded />} />
                                <LockedField label="Email Address" value={user?.email} icon={<EmailRounded />} />
                            </Stack>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.6}>
                                <LockedField label="Employee ID" value={user?.employeeId ? `#${user.employeeId}` : null} icon={<BadgeRounded />} />
                            </Stack>
                        </Stack>
                    </Box>

                    {/* ── WORK INFO ── */}
                    <Box sx={{ ...G.surface, p: { xs: 1.8, sm: 2.2 } }}>
                        <SectionTitle>Work Information</SectionTitle>
                        <Stack spacing={1.6}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.6}>
                                <LockedField label="Department" value={user?.department} icon={<WorkRounded />} />
                                <LockedField label="Station" value={user?.station} icon={<WorkRounded />} />
                            </Stack>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.6}>
                                <LockedField label="Supervisor" value={user?.supervisor} icon={<PersonRounded />} />
                                <LockedField label="Role" value={user?.role?.replace('-', ' ')} icon={<BadgeRounded />} />
                            </Stack>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.6}>
                                <LockedField label="Start Date" value={fmtDate(user?.startDate)} />
                                <LockedField label="End Date" value={fmtDate(user?.endDate)} />
                            </Stack>
                        </Stack>
                    </Box>

                    {/* ── EDITABLE FIELDS ── */}
                    <Box sx={{ ...G.surface, p: { xs: 1.8, sm: 2.2 } }}>
                        <SectionTitle>Update Your Info</SectionTitle>
                        <Stack spacing={1.6}>
                            {/* Phone */}
                            <TextField
                                label="Phone Number"
                                placeholder='254XXXX'
                                value={phone}
                                onChange={(e) => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: undefined })); }}
                                fullWidth
                                size="small"
                                error={!!errors.phone}
                                helperText={errors.phone}
                                sx={{
                                    ...G.inputSx,
                                    '& .MuiFormHelperText-root': { color: '#f87171', ml: 0.5, fontSize: '0.72rem' },
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PhoneRounded sx={{ color: errors.phone ? '#dc2626' : 'rgba(10,61,98,0.58)' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            {/* New password */}
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField
                                    label="New Password"
                                    type={showPw ? 'text' : 'password'}
                                    value={newPassword}
                                    placeholder="new password"
                                    onChange={(e) => { setNewPassword(e.target.value); setErrors(p => ({ ...p, newPassword: undefined, confirmPassword: undefined })); }}
                                    fullWidth
                                    size="small"
                                    error={!!errors.newPassword}
                                    helperText={errors.newPassword}
                                    sx={{
                                        ...G.inputSx,
                                        '& .MuiFormHelperText-root': { color: '#f87171', ml: 0.5, fontSize: '0.72rem' },
                                        '& input::placeholder': { color: 'rgba(15,23,42,0.34)', opacity: 1 },
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockRounded sx={{ color: errors.newPassword ? '#dc2626' : 'rgba(10,61,98,0.58)' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setShowPw(p => !p)} sx={{ color: 'rgba(10,61,98,0.54)', p: 0.4 }}>
                                                    {showPw ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <TextField
                                    label="Confirm Password"
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    placeholder="Re-enter new password"
                                    onChange={(e) => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: undefined })); }}
                                    fullWidth
                                    size="small"
                                    error={!!errors.confirmPassword}
                                    helperText={errors.confirmPassword}
                                    sx={{
                                        ...G.inputSx,
                                        '& .MuiFormHelperText-root': { color: '#f87171', ml: 0.5, fontSize: '0.72rem' },
                                        '& input::placeholder': { color: 'rgba(15,23,42,0.34)', opacity: 1 },
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockRounded sx={{ color: errors.confirmPassword ? '#dc2626' : 'rgba(10,61,98,0.42)' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setShowConfirm(p => !p)} sx={{ color: 'rgba(10,61,98,0.54)', p: 0.4 }}>
                                                    {showConfirm ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Stack>

                            {/* Avatar upload cue */}
                            {avatarFile && (
                                <Motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                                    <Box sx={{
                                        ...G.surface,
                                        px: 2, py: 1.2,
                                        display: 'flex', alignItems: 'center', gap: 1.2,
                                        bgcolor: 'rgba(14,165,233,0.06)',
                                    }}>
                                        <CameraAlt sx={{ fontSize: 15, color: '#0ea5e9' }} />
                                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', flex: 1, overflowWrap: 'anywhere' }}>
                                            New photo selected: <span style={{ color: '#60a5fa' }}>{avatarFile.name}</span>
                                        </Typography>
                                        <IconButton size="small" onClick={() => { setAvatarFile(null); setAvatarPreview(user?.avatar || null); }} sx={{ color: 'rgba(10,61,98,0.52)', p: 0.3 }}>
                                            <Close sx={{ fontSize: 14 }} />
                                        </IconButton>
                                    </Box>
                                </Motion.div>
                            )}
                        </Stack>
                    </Box>

                    {/* ── General error ── */}
                    <AnimatePresence>
                        {errors.general && (
                            <Motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <Box sx={{ borderRadius: '8px', px: 2, py: 1.4, bgcolor: '#fef2f2', border: '1px solid rgba(220,38,38,0.20)' }}>
                                    <Typography sx={{ fontSize: '0.78rem', color: '#991b1b', fontWeight: 700 }}>{errors.general}</Typography>
                                </Box>
                            </Motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Success feedback ── */}
                    <AnimatePresence>
                        {saveSuccess && (
                            <Motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <Box sx={{ borderRadius: '8px', px: 2, py: 1.4, bgcolor: '#ecfdf5', border: '1px solid rgba(16,185,129,0.22)' }}>
                                    <Typography sx={{ fontSize: '0.78rem', color: '#047857', fontWeight: 800 }}>Profile updated successfully.</Typography>
                                </Box>
                            </Motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Action bar ── */}
                    <Stack
                        direction={{ xs: 'column-reverse', sm: 'row' }}
                        spacing={1.2}
                        justifyContent="flex-end"
                        sx={{
                            position: { xs: 'sticky', sm: 'static' },
                            bottom: { xs: -16, sm: 'auto' },
                            mx: { xs: -2, sm: 0 },
                            px: { xs: 2, sm: 0 },
                            pt: 1.4,
                            pb: { xs: 1.5, sm: 0 },
                            bgcolor: { xs: '#f8fbff', sm: 'transparent' },
                            borderTop: { xs: '1px solid rgba(10,61,98,0.08)', sm: 'none' },
                            zIndex: 2,
                        }}
                    >
                        <Button
                            variant="outlined"
                            onClick={onClose}
                            sx={{
                                width: { xs: '100%', sm: 'auto' },
                                minWidth: { sm: 112 },
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontWeight: 800,
                                color: '#0A3D62',
                                borderColor: 'rgba(10,61,98,0.22)',
                                bgcolor: '#fff',
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={saving || !hasChanges}
                            startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <SaveRounded sx={{ fontSize: 16 }} />}
                            sx={{
                                width: { xs: '100%', sm: 'auto' },
                                minWidth: { sm: 148 },
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontWeight: 900,
                                bgcolor: '#0A3D62',
                                boxShadow: '0 8px 20px rgba(10,61,98,0.24)',
                                '&:hover': { bgcolor: '#075985', boxShadow: '0 10px 24px rgba(10,61,98,0.30)' },
                            }}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </Stack>

                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default UserProfileDialog;
