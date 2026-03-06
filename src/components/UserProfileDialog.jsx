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
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    Divider,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateUserCurrentUserRedux } from '../redux/CurrentUser';

/* ─── palette / glass tokens (keep in sync with dashboard) ─────────────── */
const G = {
    dialog: {
        background: 'rgba(5,18,40,0.88)',
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
    },
    surface: {
        background: 'rgba(255,255,255,0.055)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: '14px',
    },
    inputSx: {
        '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            color: '#fff',
            fontSize: '0.875rem',
            background: 'rgba(255,255,255,0.055)',
            transition: 'box-shadow 0.2s',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
            '&:hover fieldset': { borderColor: 'rgba(0,220,255,0.30)' },
            '&.Mui-focused fieldset': { borderColor: 'rgba(0,220,255,0.55)', borderWidth: 1.5 },
            '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(0,220,255,0.10)' },
            '&.Mui-disabled': {
                background: 'rgba(255,255,255,0.028)',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.06)' },
            },
        },
        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.38)', fontSize: '0.8rem' },
        '& .MuiInputLabel-root.Mui-focused': { color: 'rgba(0,220,255,0.80)' },
        '& .MuiInputLabel-root.Mui-disabled': { color: 'rgba(255,255,255,0.22)' },
        '& .MuiInputAdornment-root svg': { fontSize: 17 },
        '& input.Mui-disabled': { WebkitTextFillColor: 'rgba(255,255,255,0.38)', cursor: 'not-allowed' },
    },
};

const RANK_COLORS = {
    admin: { bg: 'rgba(251,191,36,0.14)', color: '#fbbf24', border: 'rgba(251,191,36,0.30)' },
    hr: { bg: 'rgba(167,139,250,0.14)', color: '#a78bfa', border: 'rgba(167,139,250,0.30)' },
    supervisor: { bg: 'rgba(34,211,238,0.14)', color: '#22d3ee', border: 'rgba(34,211,238,0.30)' },
    ceo: { bg: 'rgba(249,115,22,0.14)', color: '#f97316', border: 'rgba(249,115,22,0.30)' },
    user: { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: 'rgba(96,165,250,0.28)' },
};

const ROLE_COLORS = {
    employee: { bg: 'rgba(52,211,153,0.12)', color: '#34d399', border: 'rgba(52,211,153,0.28)' },
    intern: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.28)' },
    attachee: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: 'rgba(167,139,250,0.28)' },
    'employee-contract': { bg: 'rgba(249,115,22,0.12)', color: '#f97316', border: 'rgba(249,115,22,0.28)' },
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
                    <Box sx={{ color: 'rgba(255,255,255,0.22)' }}>{icon}</Box>
                </InputAdornment>
            ) : undefined,
            endAdornment: (
                <InputAdornment position="end">
                    <LockRounded sx={{ fontSize: '14px !important', color: 'rgba(255,255,255,0.18)' }} />
                </InputAdornment>
            ),
        }}
    />
);

/* ─── SectionTitle ──────────────────────────────────────────────────────── */
const SectionTitle = ({ children }) => (
    <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 1.5 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '0.58rem', letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', whiteSpace: 'nowrap' }}>
            {children}
        </Typography>
        <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.07)' }} />
    </Stack>
);

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════════════ */
const UserProfileDialog = ({ open, onClose, user, onSave }) => {
    const fileInputRef = useRef(null);

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
        if (user) {
            setPhone(user.phone || '');
            setAvatarPreview(user.avatar || null);
        }
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
        setSaveSuccess(false);
    }, [user, open]);

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
            setTimeout(() => setSaveSuccess(false), 2000);
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
            maxWidth="sm"
            fullWidth
            TransitionProps={{ timeout: 300 }}
            PaperProps={{
                component: motion.div,
                initial: { opacity: 0, scale: 0.94, y: 20 },
                animate: { opacity: 1, scale: 1, y: 0 },
                exit: { opacity: 0, scale: 0.94, y: 20 },
                transition: { duration: 0.28, ease: [0.34, 1.12, 0.64, 1] },
                sx: {
                    ...G.dialog,
                    borderRadius: '24px',
                    m: { xs: 1.5, sm: 2 },
                    maxHeight: '92vh',
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': { width: 3 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 4 },
                },
            }}
            BackdropProps={{
                sx: {
                    backdropFilter: 'blur(6px)',
                    bgcolor: 'rgba(3,12,28,0.60)',
                },
            }}
        >
            {/* ── Header ── */}
            <Box sx={{
                position: 'relative',
                px: { xs: 2.5, sm: 3.5 },
                pt: 3,
                pb: 2.5,
                background: 'linear-gradient(135deg, rgba(0,110,170,0.18) 0%, rgba(0,60,120,0.10) 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}>
                {/* decorative orb */}
                <Box sx={{ position: 'absolute', top: -30, right: -20, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,220,255,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

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
                                    background: 'linear-gradient(135deg, rgba(0,220,255,0.30), rgba(0,185,175,0.20))',
                                    border: '2.5px solid rgba(255,255,255,0.18)',
                                    color: '#fff',
                                    fontWeight: 900,
                                    fontSize: '1.4rem',
                                    boxShadow: '0 8px 28px rgba(0,0,0,0.40)',
                                }}>
                                {!avatarPreview && initials(user?.name)}
                            </Avatar>
                            {/* Camera overlay */}
                            <Tooltip title="Change photo" placement="bottom">
                                <Box
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
                                </Box>
                            </Tooltip>

                            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                            {/* Edit badge */}
                            <Box sx={{
                                position: 'absolute', bottom: 0, right: 0,
                                width: 22, height: 22, borderRadius: '50%',
                                bgcolor: '#0ea5e9', border: '2px solid rgba(5,18,40,0.90)',
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
                            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.42)', mb: 1, fontFamily: 'monospace' }}>
                                {user?.email}
                            </Typography>
                            <Stack direction="row" spacing={0.8} flexWrap="wrap" justifyContent={{ xs: 'center', sm: 'flex-start' }}>
                                <Chip
                                    label={(user?.rank ?? 'user').toUpperCase()}
                                    size="small"
                                    sx={{
                                        height: 20, fontWeight: 900, fontSize: '0.55rem', letterSpacing: 1.5,
                                        bgcolor: rankStyle.bg, color: rankStyle.color,
                                        border: `1px solid ${rankStyle.border}`, borderRadius: '7px',
                                    }}
                                />
                                <Chip
                                    label={(user?.role ?? 'employee').replace('-', ' ').toUpperCase()}
                                    size="small"
                                    sx={{
                                        height: 20, fontWeight: 800, fontSize: '0.55rem', letterSpacing: 1.2,
                                        bgcolor: roleStyle.bg, color: roleStyle.color,
                                        border: `1px solid ${roleStyle.border}`, borderRadius: '7px',
                                    }}
                                />
                                {user?.employeeId && (
                                    <Chip
                                        label={`#${user.employeeId}`}
                                        size="small"
                                        sx={{
                                            height: 20, fontWeight: 700, fontSize: '0.58rem',
                                            bgcolor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.42)',
                                            border: '1px solid rgba(255,255,255,0.10)', borderRadius: '7px',
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
                            color: 'rgba(255,255,255,0.45)',
                            bgcolor: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.10)',
                            borderRadius: '10px',
                            width: 34, height: 34, flexShrink: 0,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' },
                            transition: 'all 0.18s ease',
                        }}>
                        <Close sx={{ fontSize: 16 }} />
                    </IconButton>
                </Stack>
            </Box>

            <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, py: 3 }}>
                <Stack spacing={3.5}>

                    {/* ── READ-ONLY DETAILS ── */}
                    <Box>
                        <SectionTitle>Account Details</SectionTitle>
                        <Stack spacing={1.6}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.6}>
                                <LockedField label="Full Name" value={user?.name} icon={<PersonRounded />} />
                                <LockedField label="Email Address" value={user?.email} icon={<EmailRounded />} />
                            </Stack>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.6}>
                                <LockedField label="Employee ID" value={user?.employeeId ? `#${user.employeeId}` : null} icon={<BadgeRounded />} />
                                <LockedField label="Gender" value={user?.gender} icon={<PersonRounded />} />
                            </Stack>
                        </Stack>
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />

                    {/* ── WORK INFO ── */}
                    <Box>
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

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />

                    {/* ── EDITABLE FIELDS ── */}
                    <Box>
                        <SectionTitle>Update Your Info</SectionTitle>
                        <Stack spacing={1.6}>
                            {/* Phone */}
                            <TextField
                                label="Phone Number"
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
                                            <PhoneRounded sx={{ color: errors.phone ? '#f87171' : 'rgba(0,220,255,0.55)' }} />
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
                                        '& input::placeholder': { color: 'rgba(255,255,255,0.18)', opacity: 1 },
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockRounded sx={{ color: errors.newPassword ? '#f87171' : 'rgba(0,220,255,0.55)' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setShowPw(p => !p)} sx={{ color: 'rgba(255,255,255,0.30)', p: 0.4 }}>
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
                                        '& input::placeholder': { color: 'rgba(255,255,255,0.18)', opacity: 1 },
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockRounded sx={{ color: errors.confirmPassword ? '#f87171' : 'rgba(255,255,255,0.22)' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setShowConfirm(p => !p)} sx={{ color: 'rgba(255,255,255,0.30)', p: 0.4 }}>
                                                    {showConfirm ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Stack>

                            {/* Avatar upload cue */}
                            {avatarFile && (
                                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                                    <Box sx={{
                                        ...G.surface,
                                        px: 2, py: 1.2,
                                        display: 'flex', alignItems: 'center', gap: 1.2,
                                    }}>
                                        <CameraAlt sx={{ fontSize: 15, color: '#0ea5e9' }} />
                                        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', flex: 1 }}>
                                            New photo selected: <span style={{ color: '#60a5fa' }}>{avatarFile.name}</span>
                                        </Typography>
                                        <IconButton size="small" onClick={() => { setAvatarFile(null); setAvatarPreview(user?.avatar || null); }} sx={{ color: 'rgba(255,255,255,0.30)', p: 0.3 }}>
                                            <Close sx={{ fontSize: 14 }} />
                                        </IconButton>
                                    </Box>
                                </motion.div>
                            )}
                        </Stack>
                    </Box>

                    {/* ── General error ── */}
                    <AnimatePresence>
                        {errors.general && (
                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <Box sx={{ borderRadius: '12px', px: 2, py: 1.4, bgcolor: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.24)' }}>
                                    <Typography sx={{ fontSize: '0.78rem', color: '#f87171', fontWeight: 600 }}>{errors.general}</Typography>
                                </Box>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Success feedback ── */}
                    <AnimatePresence>
                        {saveSuccess && (
                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <Box sx={{ borderRadius: '12px', px: 2, py: 1.4, bgcolor: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.26)' }}>
                                    <Typography sx={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 700 }}>✓ Profile updated successfully!</Typography>
                                </Box>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Action bar ── */}
                    <Stack direction="row" spacing={1.2} justifyContent="flex-end" sx={{ pt: 0.5 }}>
                        <Box
                            onClick={onClose}
                            sx={{
                                cursor: 'pointer',
                                px: 2.4, py: 1,
                                borderRadius: '12px',
                                fontWeight: 700, fontSize: '0.82rem',
                                color: 'rgba(255,255,255,0.55)',
                                bgcolor: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.10)',
                                userSelect: 'none',
                                transition: 'all 0.18s ease',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.10)', color: '#fff' },
                                display: 'flex', alignItems: 'center',
                            }}
                            component={motion.div}
                            whileTap={{ scale: 0.97 }}
                        >
                            Cancel
                        </Box>

                        <Box
                            onClick={!saving && hasChanges ? handleSave : undefined}
                            component={motion.div}
                            whileTap={!saving && hasChanges ? { scale: 0.97 } : {}}
                            sx={{
                                cursor: (!saving && hasChanges) ? 'pointer' : 'not-allowed',
                                px: 2.6, py: 1,
                                borderRadius: '12px',
                                fontWeight: 800, fontSize: '0.82rem',
                                userSelect: 'none',
                                display: 'flex', alignItems: 'center', gap: 0.8,
                                transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                                background: (!saving && hasChanges)
                                    ? 'linear-gradient(135deg, #0ea5e9, #0284c7)'
                                    : 'rgba(255,255,255,0.07)',
                                color: (!saving && hasChanges) ? '#fff' : 'rgba(255,255,255,0.25)',
                                border: (!saving && hasChanges) ? '1px solid rgba(14,165,233,0.40)' : '1px solid rgba(255,255,255,0.08)',
                                boxShadow: (!saving && hasChanges) ? '0 6px 20px rgba(14,165,233,0.35)' : 'none',
                                '&:hover': (!saving && hasChanges) ? {
                                    background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                                    boxShadow: '0 8px 28px rgba(14,165,233,0.48)',
                                    transform: 'translateY(-1px)',
                                } : {},
                            }}
                        >
                            {saving
                                ? <><CircularProgress size={13} sx={{ color: 'rgba(255,255,255,0.50)' }} /> Saving…</>
                                : <><SaveRounded sx={{ fontSize: 15 }} /> Save Changes</>
                            }
                        </Box>
                    </Stack>

                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default UserProfileDialog;