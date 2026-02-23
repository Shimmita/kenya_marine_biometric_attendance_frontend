
import {
    Badge,
    BadgeRounded,
    Business,
    CalendarToday,
    CheckCircle,
    Email,
    Lock,
    Person,
    Phone,
    Security,
    SupervisorAccount,
    Visibility, VisibilityOff,
    WorkRounded
} from '@mui/icons-material';
import {
    Box,
    Collapse,
    Grid,
    IconButton, InputAdornment,
    MenuItem,
    Paper,
    Stack, TextField,
    Typography
} from '@mui/material';
import React from "react";
import coreDataDetails from '../CoreDataDetails';
const { colorPalette, genders, AvailableStations, availableDepartments: departments } = coreDataDetails


const ROLES = [
    { value: 'employee', label: 'Employee (Full-Time)', icon: '👔', desc: 'Full-time' },
    { value: 'employee-contract', label: 'Employee (Contract)', icon: '👔', desc: 'Contract' },
    { value: 'intern', label: 'Intern', icon: '🎓', desc: 'University / college intern' },
    { value: 'attachee', label: 'Attaché', icon: '📋', desc: 'Industrial attachment' },
];


const selectSx = {
    color: colorPalette.textPrimary,
    fontSize: "0.83rem",
    borderRadius: "10px",
    background: "rgba(0,91,150,0.32)",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,229,255,0.22)" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: colorPalette.aquaVibrant },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: colorPalette.seafoamGreen },
    "& .MuiSvgIcon-root": { color: colorPalette.cyanFresh },
};

const menuProps = {
    PaperProps: {
        sx: {
            background: "#05253D",
            borderRadius: "12px",
            color: colorPalette.textPrimary,
            willChange: 'transform',
            boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
            "& .MuiMenuItem-root": { fontSize: "0.83rem", py: 0.8 },
            "& .MuiMenuItem-root:hover": { background: "rgba(0,229,255,0.1)", color: colorPalette.aquaVibrant },
            "& .MuiMenuItem-root.Mui-selected": { background: "rgba(72,201,176,0.14)", color: colorPalette.seafoamGreen },
        },
    },
};


/* ══ ROLE SELECTOR ══════════════════════════════════════════════════════════ */
const RoleSelector = ({ selected, onSelect }) => (
    <Grid container spacing={1.8}>
        {ROLES.map(r => {
            const active = selected === r.value;
            return (
                <Grid item xs={4} key={r.value}>
                    <Paper onClick={() => onSelect(r.value)} elevation={0} sx={{
                        p: { xs: 1.8, sm: 2.5 }, borderRadius: '18px', cursor: 'pointer', textAlign: 'center',
                        border: `2px solid ${active ? colorPalette.oceanBlue : 'rgba(10,61,98,0.10)'}`,
                        bgcolor: active ? `${colorPalette.oceanBlue}0e` : 'rgba(10,61,98,0.02)',
                        boxShadow: active ? `0 4px 20px ${colorPalette.oceanBlue}22` : 'none',
                        transition: 'all 0.22s ease',
                        '&:hover': { borderColor: colorPalette.oceanBlue, bgcolor: `${colorPalette.oceanBlue}07`, transform: 'translateY(-2px)' },
                        willChange: 'transform',
                    }}>
                        <Typography sx={{ fontSize: { xs: '1.8rem', sm: '2rem' }, lineHeight: 1, mb: 0.8 }}>{r.icon}</Typography>
                        <Typography variant="subtitle2" fontWeight={800} sx={{ display: 'block', color: active ? colorPalette.oceanBlue : colorPalette.deepNavy, mb: 0.3 }}>
                            {r.label}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ display: { xs: 'none', sm: 'block' }, fontSize: '0.65rem', lineHeight: 1.4 }}>
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
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ py: 1, borderBottom: '1px solid rgba(10,61,98,0.06)' }}>
        <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.7, fontSize: '0.62rem', minWidth: 90, pt: 0.1 }}>
            {label}
        </Typography>
        <Typography variant="body2" fontWeight={700} color={accent || colorPalette.deepNavy} sx={{ textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>
            {value || <Box component="span" sx={{ opacity: 0.35 }}>—</Box>}
        </Typography>
    </Stack>
);


const EmployeeIdField = React.memo(({ value, error, onChange, tf, show }) => {
    if (!show) return null;

    return (
        <TextField
            fullWidth
            required
            label="Employee ID"
            placeholder="e.g. KMFRI-2024-001"
            value={value}
            onChange={onChange}
            error={!!error}
            helperText={error || 'Your official employment number (not National ID)'}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <BadgeRounded sx={{ color: colorPalette.oceanBlue }} />
                    </InputAdornment>
                )
            }}
            sx={tf}
        />
    );
});

// work
const WorkDetailsStep = React.memo(
    ({
        formData,
        errors,
        handle,
        isEmployee,
        allSupervisors,
        tf
    }) => {

        // Memoized supervisor menu items (prevents re-creation on every keystroke)
        const supervisorOptions = React.useMemo(() => {
            if (!allSupervisors) return null;

            return allSupervisors.map((supervisor) => (
                <MenuItem
                    key={supervisor?.name}
                    value={supervisor?.name}
                >
                    {supervisor?.name}
                </MenuItem>
            ));
        }, [allSupervisors]);

        return (
            <Stack spacing={2.5}>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography
                        variant="h6"
                        fontWeight={900}
                        color={colorPalette.deepNavy}
                        mb={0.5}
                    >
                        Work Details
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                        Your main station and placement information.
                    </Typography>
                </Box>

                {/* Station */}
                <TextField
                    select
                    fullWidth
                    required
                    label="Station"
                    value={formData.station}
                    onChange={handle('station')}
                    error={!!errors.station}
                    helperText={errors.station}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Business sx={{ color: colorPalette.oceanBlue }} />
                            </InputAdornment>
                        )
                    }}
                    sx={tf}
                >
                    {AvailableStations.map((s) => (
                        <MenuItem key={s.name} value={s.name}>
                            {s.name}
                        </MenuItem>
                    ))}
                </TextField>

                {/* Department */}
                <TextField
                    select
                    fullWidth
                    required
                    label="Department"
                    value={formData.department}
                    onChange={handle('department')}
                    error={!!errors.department}

                    helperText={errors.department}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <WorkRounded sx={{ color: colorPalette.oceanBlue }} />
                            </InputAdornment>
                        )
                    }}
                    sx={tf}
                >
                    {departments.map((d) => (
                        <MenuItem key={d} value={d}>
                            {d}
                        </MenuItem>
                    ))}
                </TextField>

                {/* Employee ID */}
                <Collapse in={isEmployee}>
                    <EmployeeIdField
                        value={formData.employeeId}
                        error={errors.employeeId}
                        onChange={handle('employeeId')}
                        tf={tf}
                        show={isEmployee}
                    />
                </Collapse>


                <TextField
                    select
                    fullWidth
                    required={false}
                    label="Supervisor"
                    value={formData.supervisor}
                    onChange={handle('supervisor')}
                    error={!!errors.supervisor}
                    helperText={errors.supervisor}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SupervisorAccount sx={{ color: colorPalette.oceanBlue }} />
                            </InputAdornment>
                        )
                    }}
                    sx={tf}
                >
                    {supervisorOptions}
                </TextField>

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ sm: 'center' }}
                >
                    <TextField
                        fullWidth
                        label="Valid From"
                        type="date"
                        value={formData.startDate}
                        onChange={handle('startDate')}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <CalendarToday sx={{ color: colorPalette.oceanBlue }} />
                                </InputAdornment>
                            )
                        }}
                        sx={tf}
                    />

                    <Typography
                        variant="body2"
                        fontWeight={700}
                        color="text.disabled"
                        sx={{
                            display: { xs: 'none', sm: 'block' },
                            flexShrink: 0
                        }}
                    >
                        to
                    </Typography>

                    <TextField
                        fullWidth
                        label="Valid Until"
                        type="date"
                        value={formData.endDate}
                        onChange={handle('endDate')}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <CalendarToday sx={{ color: colorPalette.oceanBlue }} />
                                </InputAdornment>
                            )
                        }}
                        sx={tf}
                    />
                </Stack>
            </Stack>
        );
    });

// role

const RoleDetailsStep = React.memo(({
    formData,
    errors,
    setFormData,
    setErrors
}) => {
    return (
        <Stack spacing={3}>
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={900} color={colorPalette.deepNavy} mb={0.5}>
                    What's your role at KMFRI?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Select the category that best describes your employment type.
                </Typography>
            </Box>
            <Stack justifyContent={'center'}>
                <RoleSelector
                    selected={formData.role}
                    onSelect={v => { setFormData(p => ({ ...p, role: v, supervisor: '', employeeId: '' })); setErrors(p => ({ ...p, role: '' })); }}
                />
            </Stack>
            {errors.role && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, p: 1.4, borderRadius: '12px', bgcolor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
                    <Typography variant="caption" color="error" fontWeight={700}>{errors.role}</Typography>
                </Box>
            )}
        </Stack>
    );
})



// personal info

const PersonalDetailsStep = React.memo(({
    formData,
    errors,
    handle,
    tf
}) => {
    return (
        <Stack spacing={2.5}>
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={900} color={colorPalette.deepNavy} mb={0.5}>
                    Personal Information
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Tell us a little about yourself.
                </Typography>
            </Box>
            <TextField fullWidth required label="Full Name" placeholder="John Doe"
                value={formData.name} onChange={handle('name')} error={!!errors.name} helperText={errors.name}
                InputProps={{ startAdornment: <InputAdornment position="start"><Badge sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }} sx={tf} />
            <TextField fullWidth required label="Phone Number" placeholder="+254 700 123 456"
                value={formData.phone} onChange={handle('phone')} error={!!errors.phone} helperText={errors.phone}
                InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }} sx={tf} />
            <TextField fullWidth required label="Email Address" type="email" placeholder="john.doe@kmfri.go.ke"
                value={formData.email} onChange={handle('email')} error={!!errors.email} helperText={errors.email}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }} sx={tf} />
            <TextField select fullWidth required label="Gender"
                MenuProps={menuProps}
                value={formData.gender} onChange={handle('gender')} error={!!errors.gender} helperText={errors.gender}
                InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: colorPalette.oceanBlue }} /></InputAdornment> }} sx={tf}>
                {genders.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </TextField>
        </Stack>
    );
})


const SecurityDetailStep = React.memo(({ formData,
    errors,
    handle,
    tf, showPassword,
    setShowPassword }) => {
    return (
        <Stack spacing={2.5}>
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={900} color={colorPalette.deepNavy} mb={0.5}>
                    Account Security
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Create a strong password to secure your account.
                </Typography>
            </Box>
            {/* Password strength hint */}
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
                value={formData.password} onChange={handle('password')} error={!!errors.password} helperText={errors.password}
                InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock sx={{ color: colorPalette.oceanBlue }} /></InputAdornment>,
                    endAdornment: <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(p => !p)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                    </InputAdornment>,
                }} sx={tf} />
            {/* password strength bar */}
            {formData.password.length > 0 && (() => {
                const len = formData.password.length;
                const strength = len < 6 ? 1 : len < 10 ? 2 : len < 14 ? 3 : 4;
                const colors = ['#ef4444', '#f59e0b', colorPalette.seafoamGreen, colorPalette.oceanBlue];
                const labels = ['Weak', 'Fair', 'Good', 'Strong'];
                return (
                    <Box>
                        <Stack direction="row" spacing={0.6} mb={0.6}>
                            {[1, 2, 3, 4].map(i => (
                                <Box key={i} sx={{ flex: 1, height: 4, borderRadius: 99, bgcolor: i <= strength ? colors[strength - 1] : 'rgba(10,61,98,0.10)', transition: 'background 0.3s' }} />
                            ))}
                        </Stack>
                        <Typography variant="caption" fontWeight={700} sx={{ color: colors[strength - 1], fontSize: '0.68rem' }}>
                            {labels[strength - 1]} password
                        </Typography>
                    </Box>
                );
            })()}
        </Stack>
    );
})


// Review details
const ReviewDetailStep = React.memo(({
    formData,
    isEmployee,
}) => {
    return (
        <Stack spacing={2.5}>
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={900} color={colorPalette.deepNavy} mb={0.5}>
                    Review Your Information
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Please confirm everything looks correct before submitting.
                </Typography>
            </Box>

            {/* Summary card */}
            <Box sx={{ borderRadius: '18px', p: 2.5, bgcolor: `${colorPalette.oceanBlue}05`, border: `1px solid ${colorPalette.oceanBlue}14` }}>
                {/* Role badge */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    {ROLES.find(r => r.value === formData.role) && (() => {
                        const role = ROLES.find(r => r.value === formData.role);
                        return (
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.8, borderRadius: '12px', bgcolor: `${colorPalette.oceanBlue}0e`, border: `1.5px solid ${colorPalette.oceanBlue}28` }}>
                                <Typography sx={{ fontSize: '1.2rem' }}>{role.icon}</Typography>
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={900} color={colorPalette.oceanBlue}>{role.label}</Typography>
                                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.62rem' }}>{role.desc}</Typography>
                                </Box>
                            </Box>
                        );
                    })()}
                </Box>

                <Stack spacing={0}>
                    <ReviewRow label="Full Name" value={formData.name} />
                    <ReviewRow label="Phone" value={formData.phone} />
                    <ReviewRow label="Email" value={formData.email} />
                    <ReviewRow label="Gender" value={formData.gender} />
                    <ReviewRow label="Department" value={formData.department} />
                    {isEmployee && <ReviewRow label="Employee ID" value={formData.employeeId} />}
                    <ReviewRow label="Supervisor" value={formData.supervisor} />
                    <ReviewRow label="Valid From" value={formData.startDate} />
                    <ReviewRow label="Valid Until" value={formData.endDate} />
                    <ReviewRow label="Password" value="••••••••" accent={colorPalette.seafoamGreen} />
                </Stack>
            </Box>

            {/* notice */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, borderRadius: '12px', bgcolor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)' }}>
                <CheckCircle sx={{ color: '#22c55e', fontSize: '1rem', mt: 0.18, flexShrink: 0 }} />
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.65, fontSize: '0.75rem' }}>
                    By submitting you agree to KMFRI's terms. Your account will be reviewed and activated within 1 business day.
                </Typography>
            </Box>
        </Stack>
    );
})


export { PersonalDetailsStep, ReviewDetailStep, RoleDetailsStep, SecurityDetailStep, WorkDetailsStep };



