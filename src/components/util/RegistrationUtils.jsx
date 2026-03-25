import {
    BadgeRounded,
    Business,
    CalendarToday,
    CheckCircle,
    Email,
    Lock,
    Person,
    Phone,
    Security,
    Visibility, VisibilityOff,
    WorkRounded,
    Badge,
} from '@mui/icons-material';
import {
    Box,
    Grid,
    IconButton, InputAdornment,
    MenuItem,
    Paper,
    Stack, TextField,
    Typography
} from '@mui/material';
import React from "react";
import coreDataDetails from '../CoreDataDetails';

const { colorPalette, genders, AvailableStations, availableDepartments: departments } = coreDataDetails;

/* ══ ROLE DEFINITIONS ══════════════════════════════════════════════════════ */

/** All roles — used in public-facing / admin registration */
export const ALL_ROLES = [
    { value: 'employee',          label: 'Employee (P&P)',       icon: '👔', desc: 'Permanent' },
    { value: 'employee-contract', label: 'Employee (Contract)',  icon: '👔', desc: 'Contract' },
    { value: 'intern',            label: 'Intern',               icon: '🎓', desc: 'University / college intern' },
    { value: 'attachee',          label: 'Attaché',              icon: '📋', desc: 'Industrial attachment' },
];

/** Restricted roles — used in Dashboard → Intern & Attaché Registration */
export const INTERN_ATTACHEE_ROLES = [
    { value: 'intern',   label: 'Intern',   icon: '🎓', desc: 'University / college intern' },
    { value: 'attachee', label: 'Attaché',  icon: '📋', desc: 'Industrial attachment' },
];

/* ══ MENU STYLE ════════════════════════════════════════════════════════════ */
const menuProps = {
    PaperProps: {
        sx: {
            background: '#05253D',
            borderRadius: '12px',
            color: colorPalette.textPrimary,
            willChange: 'transform',
            boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
            '& .MuiMenuItem-root': { fontSize: '0.83rem', py: 0.8 },
            '& .MuiMenuItem-root:hover': { background: 'rgba(0,229,255,0.1)', color: colorPalette.aquaVibrant },
            '& .MuiMenuItem-root.Mui-selected': { background: 'rgba(72,201,176,0.14)', color: colorPalette.seafoamGreen },
        },
    },
};

/* ══ ROLE SELECTOR ══════════════════════════════════════════════════════════
   Accepts an optional `roles` prop to restrict which roles are displayed.
   Defaults to ALL_ROLES for backward-compatibility.
════════════════════════════════════════════════════════════════════════════ */
const RoleSelector = ({ selected, onSelect, roles = ALL_ROLES }) => (
    <Grid container spacing={1.8} justifyContent="center">
        {roles.map(r => {
            const active = selected === r.value;
            return (
                <Grid item xs={6} sm={roles.length <= 2 ? 5 : 4} key={r.value}>
                    <Paper onClick={() => onSelect(r.value)} elevation={0} sx={{
                        p: { xs: 2, sm: 3 }, borderRadius: '18px', cursor: 'pointer', textAlign: 'center',
                        border: `2px solid ${active ? colorPalette.oceanBlue : 'rgba(10,61,98,0.10)'}`,
                        bgcolor: active ? `${colorPalette.oceanBlue}0e` : 'rgba(10,61,98,0.02)',
                        boxShadow: active ? `0 4px 20px ${colorPalette.oceanBlue}22` : 'none',
                        transition: 'all 0.22s ease',
                        '&:hover': {
                            borderColor: colorPalette.oceanBlue,
                            bgcolor: `${colorPalette.oceanBlue}07`,
                            transform: 'translateY(-2px)',
                        },
                        willChange: 'transform',
                    }}>
                        <Typography sx={{ fontSize: { xs: '2rem', sm: '2.4rem' }, lineHeight: 1, mb: 1 }}>
                            {r.icon}
                        </Typography>
                        <Typography variant="subtitle2" fontWeight={800} sx={{
                            display: 'block',
                            color: active ? colorPalette.oceanBlue : colorPalette.deepNavy,
                            mb: 0.3,
                        }}>
                            {r.label}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{
                            display: 'block', fontSize: '0.65rem', lineHeight: 1.4,
                        }}>
                            {r.desc}
                        </Typography>
                    </Paper>
                </Grid>
            );
        })}
    </Grid>
);

/* ══ REVIEW SUMMARY ROW ════════════════════════════════════════════════════ */
const ReviewRow = ({ label, value, accent }) => (
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between"
        sx={{ py: 1, borderBottom: '1px solid rgba(10,61,98,0.06)' }}>
        <Typography variant="caption" color="text.disabled" fontWeight={700}
            sx={{ textTransform: 'uppercase', letterSpacing: 0.7, fontSize: '0.62rem', minWidth: 110, pt: 0.1 }}>
            {label}
        </Typography>
        <Typography variant="body2" fontWeight={700}
            color={accent || colorPalette.deepNavy}
            sx={{ textAlign: 'right', maxWidth: '58%', wordBreak: 'break-word' }}>
            {value || <Box component="span" sx={{ opacity: 0.35 }}>—</Box>}
        </Typography>
    </Stack>
);

/* ══ DYNAMIC EMPLOYEE-ID FIELD ═════════════════════════════════════════════ */
const EmployeeIdField = React.memo(({ value, error, onChange, tf, role }) => {
    const cfg = {
        employee:          { label: 'Staff ID',               placeholder: 'Enter your staff ID' },
        'employee-contract': { label: 'Staff ID',             placeholder: 'Enter your staff ID' },
        intern:            { label: 'National ID',            placeholder: 'Enter your national ID' },
        attachee:          { label: 'Student Reg. Number',    placeholder: 'Enter your student registration number' },
    }[role] || { label: 'ID Number', placeholder: 'Enter your ID number' };

    return (
        <TextField fullWidth required
            label={cfg.label} placeholder={cfg.placeholder}
            value={value} onChange={onChange}
            error={!!error} helperText={error}
            type='number'
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <BadgeRounded sx={{ color: colorPalette.oceanBlue }} />
                    </InputAdornment>
                ),
            }}
            sx={tf}
        />
    );
});

/* ══ STEP: ROLE ════════════════════════════════════════════════════════════
   Accepts an optional `availableRoles` prop (defaults to ALL_ROLES).
   The Dashboard Intern/Attaché page passes INTERN_ATTACHEE_ROLES here.
════════════════════════════════════════════════════════════════════════════ */
const RoleDetailsStep = React.memo(({
    formData, errors, setFormData, setErrors,
    availableRoles = ALL_ROLES,
    title        = "What's your role at KMFRI?",
    subtitle     = 'Select the category that best describes your employment type.',
}) => (
    <Stack spacing={3}>
        <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={900} color={colorPalette.deepNavy} mb={0.5}>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
        </Box>
        <RoleSelector
            roles={availableRoles}
            selected={formData.role}
            onSelect={v => {
                setFormData(p => ({ ...p, role: v, supervisor: '', employeeId: '' }));
                setErrors(p => ({ ...p, role: '' }));
            }}
        />
        {errors.role && (
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 0.8,
                p: 1.4, borderRadius: '12px',
                bgcolor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)',
            }}>
                <Typography variant="caption" color="error" fontWeight={700}>{errors.role}</Typography>
            </Box>
        )}
    </Stack>
));

/* ══ STEP: PERSONAL ════════════════════════════════════════════════════════ */
const PersonalDetailsStep = React.memo(({ formData, errors, handle, tf }) => (
    <Stack spacing={2.5}>
        <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={900} color={colorPalette.deepNavy} mb={0.5}>
                Personal Information
            </Typography>
            <Typography variant="body2" color="text.secondary">Tell us a little about yourself.</Typography>
        </Box>
        <TextField fullWidth required label="Full Name" placeholder="John Doe"
            value={formData.name} onChange={handle('name')}
            error={!!errors.name} helperText={errors.name}
            InputProps={{ startAdornment: <InputAdornment position="start"><Badge sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }}
            sx={tf} />
        <TextField fullWidth required type="number" label="Phone Number" placeholder="0723569054"
            value={formData.phone} onChange={handle('phone')}
            error={!!errors.phone} helperText={errors.phone}
            InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }}
            sx={tf} />
        <TextField fullWidth required label="Email Address" type="email" placeholder="john.doe@kmfri.go.ke"
            value={formData.email} onChange={handle('email')}
            error={!!errors.email} helperText={errors.email}
            InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }}
            sx={tf} />
        <TextField select fullWidth required label="Gender"
            MenuProps={menuProps}
            value={formData.gender} onChange={handle('gender')}
            error={!!errors.gender} helperText={errors.gender}
            InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }}
            sx={tf}>
            {genders.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
        </TextField>
    </Stack>
));

/* ══ STEP: WORK ════════════════════════════════════════════════════════════ */
const WorkDetailsStep = React.memo(({ formData, errors, handle, isEmployee, tf, role }) => (
    <Stack spacing={2.5}>
        <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={900} color={colorPalette.deepNavy} mb={0.5}>
                Work Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Your main station and placement information.
            </Typography>
        </Box>

        {/* Station */}
        <TextField select fullWidth required label="Station"
            value={formData.station} onChange={handle('station')}
            error={!!errors.station} helperText={errors.station}
            InputProps={{ startAdornment: <InputAdornment position="start"><Business sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }}
            sx={tf}>
            {AvailableStations.map(s => <MenuItem key={s.name} value={s.name}>{s.name}</MenuItem>)}
        </TextField>

        {/* Department */}
        <TextField select fullWidth required label="Department"
            value={formData.department} onChange={handle('department')}
            error={!!errors.department} helperText={errors.department}
            InputProps={{ startAdornment: <InputAdornment position="start"><WorkRounded sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }}
            sx={tf}>
            {departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
        </TextField>

        {/* Dynamic ID field */}
        <EmployeeIdField
            value={formData.employeeId}
            error={errors.employeeId}
            onChange={handle('employeeId')}
            tf={tf}
            role={role}
        />

        {/* Date range — always shown for interns/attachees */}
        {!isEmployee && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <TextField fullWidth label="Start Date" type="date"
                    value={formData.startDate} onChange={handle('startDate')}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><CalendarToday sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }}
                    sx={tf} />
                <Typography variant="body2" fontWeight={700} color="text.disabled"
                    sx={{ display: { xs: 'none', sm: 'block' }, flexShrink: 0 }}>
                    to
                </Typography>
                <TextField fullWidth label="End Date" type="date"
                    value={formData.endDate} onChange={handle('endDate')}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><CalendarToday sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }}
                    sx={tf} />
            </Stack>
        )}
    </Stack>
));

/* ══ STEP: SECURITY ════════════════════════════════════════════════════════ */
const SecurityDetailStep = React.memo(({ formData, errors, handle, tf, showPassword, setShowPassword }) => (
    <Stack spacing={2.5}>
        <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={900} color={colorPalette.deepNavy} mb={0.5}>
                Account Security
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Create a strong password to secure your account.
            </Typography>
        </Box>
        <Box sx={{ p: 1.8, borderRadius: '14px', bgcolor: `${colorPalette.oceanBlue}06`, border: `1px solid ${colorPalette.oceanBlue}18` }}>
            <Stack direction="row" spacing={1} alignItems="flex-start">
                <Security sx={{ color: colorPalette.oceanBlue, fontSize: '1.05rem', mt: 0.15, flexShrink: 0 }} />
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: '0.76rem' }}>
                    Use at least <strong>6 characters</strong> including a mix of letters, numbers, and symbols for a strong password.
                </Typography>
            </Stack>
        </Box>
        <TextField fullWidth required label="Create Password" placeholder="Minimum 6 characters"
            type={showPassword ? 'text' : 'password'}
            value={formData.password} onChange={handle('password')}
            error={!!errors.password} helperText={errors.password}
            InputProps={{
                startAdornment: <InputAdornment position="start"><Lock sx={{ color: colorPalette.oceanBlue }} /></InputAdornment>,
                endAdornment: <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(p => !p)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                </InputAdornment>,
            }}
            sx={tf}
        />
        {formData.password.length > 0 && (() => {
            const len = formData.password.length;
            const strength = len < 6 ? 1 : len < 10 ? 2 : len < 14 ? 3 : 4;
            const colors = ['#ef4444', '#f59e0b', colorPalette.seafoamGreen, colorPalette.oceanBlue];
            const labels = ['Weak', 'Fair', 'Good', 'Strong'];
            return (
                <Box>
                    <Stack direction="row" spacing={0.6} mb={0.6}>
                        {[1, 2, 3, 4].map(i => (
                            <Box key={i} sx={{
                                flex: 1, height: 4, borderRadius: 99,
                                bgcolor: i <= strength ? colors[strength - 1] : 'rgba(10,61,98,0.10)',
                                transition: 'background 0.3s',
                            }} />
                        ))}
                    </Stack>
                    <Typography variant="caption" fontWeight={700}
                        sx={{ color: colors[strength - 1], fontSize: '0.68rem' }}>
                        {labels[strength - 1]} password
                    </Typography>
                </Box>
            );
        })()}
    </Stack>
));

/* ══ STEP: REVIEW ══════════════════════════════════════════════════════════ */
const ReviewDetailStep = React.memo(({ formData, isEmployee, role, roles = ALL_ROLES }) => (
    <Stack spacing={2.5}>
        <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={900} color={colorPalette.deepNavy} mb={0.5}>
                Review Your Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Please confirm everything looks correct before submitting.
            </Typography>
        </Box>

        <Box sx={{ borderRadius: '18px', p: 2.5, bgcolor: `${colorPalette.oceanBlue}05`, border: `1px solid ${colorPalette.oceanBlue}14` }}>
            {/* Role badge */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                {(() => {
                    const r = roles.find(r => r.value === formData.role);
                    if (!r) return null;
                    return (
                        <Box sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 1,
                            px: 2, py: 0.8, borderRadius: '12px',
                            bgcolor: `${colorPalette.oceanBlue}0e`,
                            border: `1.5px solid ${colorPalette.oceanBlue}28`,
                        }}>
                            <Typography sx={{ fontSize: '1.2rem' }}>{r.icon}</Typography>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={900} color={colorPalette.oceanBlue}>{r.label}</Typography>
                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.62rem' }}>{r.desc}</Typography>
                            </Box>
                        </Box>
                    );
                })()}
            </Box>

            <Stack spacing={0}>
                <ReviewRow label="Full Name"    value={formData.name} />
                <ReviewRow label="Phone"        value={formData.phone} />
                <ReviewRow label="Email"        value={formData.email} />
                <ReviewRow label="Gender"       value={formData.gender} />
                <ReviewRow label="Station"      value={formData.station} />
                <ReviewRow label="Department"   value={formData.department} />
                <ReviewRow label={
                    role === 'intern'   ? 'National ID' :
                    role === 'attachee' ? 'Student Reg. No.' : 'Staff ID'
                } value={formData.employeeId} />
                {role !== 'employee' && role !== 'employee-contract' && (
                    <>
                        <ReviewRow label="Start Date" value={formData.startDate} />
                        <ReviewRow label="End Date"   value={formData.endDate} />
                    </>
                )}
                <ReviewRow label="Password" value="••••••••" accent={colorPalette.seafoamGreen} />
            </Stack>
        </Box>

        <Box sx={{
            display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5,
            borderRadius: '12px', bgcolor: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.18)',
        }}>
            <CheckCircle sx={{ color: '#22c55e', fontSize: '1rem', mt: 0.18, flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.65, fontSize: '0.75rem' }}>
                By submitting you agree to KMFRI's terms. Your account will be reviewed and activated within 1 business day.
            </Typography>
        </Box>
    </Stack>
));

export {
    PersonalDetailsStep,
    ReviewDetailStep,
    RoleDetailsStep,
    SecurityDetailStep,
    WorkDetailsStep,
};