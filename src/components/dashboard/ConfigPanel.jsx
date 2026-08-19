import {
  Add as AddIcon,
  AdminPanelSettings,
  Business,
  CloudUpload,
  Delete as DeleteIcon,
  Email,
  FileDownloadRounded,
  HomeRounded,
  MenuBookRounded,
  MessageRounded,
  Palette,
  Phone,
  RestartAlt,
  Save,
  Schedule,
  SettingsBackupRestoreRounded,
  Tune,
  UploadFileRounded,
  Visibility
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fab,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import SuperadminAPI from '../../service/SuperadminService';
import { applyPlatformConfigToCoreData } from '../CoreDataDetails';
import SuperAdminDashBoardTab from './SuperAdminDashBoard';

const normalizeDropdowns = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value === 'object') return value;
  return {};
};

const normalizeStation = (station = {}) => {
  if (typeof station === 'string') {
    return { name: station, lat: 0, lng: 0, radiusMeters: 500, active: true };
  }
  return {
    name: station.name || '',
    lat: Number(station.lat || 0),
    lng: Number(station.lng || 0),
    radiusMeters: Number(station.radiusMeters || 500),
    active: station.active !== false,
  };
};

const blankStation = { name: '', lat: '', lng: '', radiusMeters: 500, active: true };
const blankTheme = {
  name: '',
  primaryColor: '#0A3D62',
  secondaryColor: '#005B96',
  accentColor: '#48C9B0',
  surfaceColor: '#f8fafd',
  textColor: '#0f172a',
};

const cardSx = {
  borderRadius: 4,
  p: { xs: 2, sm: 3 },
  background: "rgba(255,255,255,.72)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(226, 232, 240, 0.8)",
  boxShadow: "0 15px 40px rgba(15,23,42,.04)"
};

const paletteFields = [
  { field: 'primaryColor', label: 'Primary Brand Color', helper: 'Navigation bars, main actions, and headers.' },
  { field: 'secondaryColor', label: 'Secondary Brand Color', helper: 'Supporting accents, secondary buttons, and states.' },
  { field: 'accentColor', label: 'Accent Highlight Color', helper: 'Status markers, active chips, and badge components.' },
  { field: 'surfaceColor', label: 'Page Surface Color', helper: 'Container surfaces, panels, and card backdrops.' },
  { field: 'textColor', label: 'Primary Text Color', helper: 'Body content copy text color.' },
];

const defaultNotificationReminders = {
  clockInReminderMinutes: 15,
  clockOutReminderMinutes: 15,
  clockInMessage: 'Dear {firstName}, you did not clock in today. Please remember to clock in and out for your scheduled workday.',
  clockOutMessage: 'Dear {firstName}, please remember to clock out before leaving your station.',
  clockInSuccessMessage: 'Dear {firstName}, you have successfully checked in at {station} on {date} at {time} EAT.',
  clockOutSuccessMessage: 'Dear {firstName}, you have successfully checked out from {station} on {date} at {time} EAT.',
  internRegMessage: 'Dear {firstName}, your KMFRI Attendance account is ready. Login: {email} | Password: {password}. Please change your password after login.',
  staffRegMessage: 'Dear {firstName}, your KMFRI Attendance account is ready. Login: {employeeId} | Password: {password}. Please change your password after login.',
  authorisedClockOut: 'Dear {firstName}, you are authorised to clock out outside your assigned station.',
  clockOutsideGrantedMessage: 'Dear {firstName}, permission to clock outside "{station}" is granted from {startDate} to {endDate}. Reason: {reason}.',
  clockOutsideRevokedMessage: 'Dear {firstName}, permission to clock outside "{station}" has been revoked. Please follow standard clocking procedures.',
  accountActivatedMessage: 'Dear {firstName}, your KMFRI Attendance account has been activated. You may now access attendance services.',
  accountDeactivatedMessage: 'Dear {firstName}, your KMFRI Attendance account has been deactivated. Please contact HR for assistance.',
  leaveSubmittedMessage: 'Dear {firstName}, your {type} request ({startDate}-{endDate}) has been submitted for review.',
  leaveApprovedMessage: 'Dear {firstName}, your {type} request ({startDate}-{endDate}) has been approved.',
  leaveRejectedMessage: 'Dear {firstName}, your {type} request ({startDate}-{endDate}) was rejected. Please contact your supervisor or HR.',
  leaveCancelledMessage: 'Dear {firstName}, your {type} request ({startDate}-{endDate}) has been cancelled.',
  manualLeaveEnabledMessage: 'Dear {firstName}, your attendance profile has been marked as on leave.',
  manualLeaveDisabledMessage: 'Dear {firstName}, your attendance profile has been removed from on-leave status.',
  missedClockOutMessage: 'Dear {firstName}, you did not clock out yesterday. Please ensure you complete your attendance records.',
  absentMessage: 'Dear {firstName}, no attendance was recorded for you yesterday. Please contact HR if this is incorrect.',
  channels: ['sms', 'in_app'],
};

const defaultAttendancePolicy = {
  standardClockIn: '08:00',
  standardClockOut: '17:00',
  gracePeriodMinutes: 15,
  minimumWorkHours: 8,
  halfDayWorkHours: 4,
  earlyDepartureGraceMinutes: 15,
  clockInReminderOffsetMinutes: 0,
  clockOutReminderOffsetMinutes: 0,
  midnightProcessingTime: '00:00',
  workingDays: [1, 2, 3, 4, 5],
  requireLocationForClocking: true,
  requireStationSelection: true,
  autoClockOutMissedSessions: true,
  markAbsenteesAutomatically: true,
  allowClockOutsideStation: true,
  requireBiometricVerification: true,
};

const defaultMasterSettings = {
  allowEmployeeSelfRegistration: false,
  maintenanceMode: false,
  requirePasswordResetOnFirstLogin: false,
  maxDevicesPerUser: 2,
  biometricVerificationWindowMinutes: 5,
  sessionTimeoutMinutes: 1440,
  enableAuditLogging: true,
  enableAttendanceExports: true,
  enableLeaveManagement: true,
  enableSupervisorManagement: true,
};

const weekDayOptions = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const notificationChannelOptions = [
  { value: 'sms', label: 'SMS' },
  { value: 'in_app', label: 'In-App' },
  { value: 'email', label: 'Email' },
];

const messageTemplateFields = [
  { key: 'clockInMessage', label: 'Clock-In Reminder Message', helper: '{firstName} {name} {station} {department}' },
  { key: 'clockOutMessage', label: 'Clock-Out Reminder Message', helper: '{firstName} {name} {station} {department}' },
  { key: 'clockInSuccessMessage', label: 'Clock-In Success Message', helper: '{firstName} {station} {date} {time}' },
  { key: 'clockOutSuccessMessage', label: 'Clock-Out Success Message', helper: '{firstName} {station} {date} {time}' },
  { key: 'authorisedClockOut', label: 'General Outside Clocking Message', helper: '{firstName} {station}' },
  { key: 'clockOutsideGrantedMessage', label: 'Outside Clocking Granted Message', helper: '{firstName} {station} {startDate} {endDate} {reason}' },
  { key: 'clockOutsideRevokedMessage', label: 'Outside Clocking Revoked Message', helper: '{firstName} {station}' },
  { key: 'internRegMessage', label: 'Intern/Attache Registration Message', helper: '{firstName} {email} {password}' },
  { key: 'staffRegMessage', label: 'Staff Registration Message', helper: '{firstName} {employeeId} {password}' },
  { key: 'leaveSubmittedMessage', label: 'Leave Submitted Message', helper: '{firstName} {type} {startDate} {endDate}' },
  { key: 'leaveApprovedMessage', label: 'Leave Approved Message', helper: '{firstName} {type} {startDate} {endDate}' },
  { key: 'leaveRejectedMessage', label: 'Leave Rejected Message', helper: '{firstName} {type} {startDate} {endDate}' },
  { key: 'leaveCancelledMessage', label: 'Leave Cancelled Message', helper: '{firstName} {type} {startDate} {endDate}' },
  { key: 'manualLeaveEnabledMessage', label: 'Manual On-Leave Message', helper: '{firstName} {name}' },
  { key: 'manualLeaveDisabledMessage', label: 'Manual Leave Cleared Message', helper: '{firstName} {name}' },
  { key: 'missedClockOutMessage', label: 'Missed Clock-Out Message', helper: '{firstName} {name}' },
  { key: 'absentMessage', label: 'Absent Attendance Message', helper: '{firstName} {name}' },
  { key: 'accountActivatedMessage', label: 'Account Activated Message', helper: '{firstName} {name}' },
  { key: 'accountDeactivatedMessage', label: 'Account Deactivated Message', helper: '{firstName} {name}' },
];

const policyToggleFields = [
  { key: 'requireLocationForClocking', label: 'Require Location Before Clocking' },
  { key: 'requireStationSelection', label: 'Require Station Selection' },
  { key: 'requireBiometricVerification', label: 'Require Biometric Verification' },
  { key: 'allowClockOutsideStation', label: 'Allow Outside-Station Clocking' },
  { key: 'autoClockOutMissedSessions', label: 'Auto Clock-Out Missed Sessions' },
  { key: 'markAbsenteesAutomatically', label: 'Auto Mark Absent Users' },
];

const masterToggleFields = [
  { key: 'maintenanceMode', label: 'Maintenance Mode' },
  { key: 'allowEmployeeSelfRegistration', label: 'Employee Self Registration' },
  { key: 'requirePasswordResetOnFirstLogin', label: 'Force First Login Reset' },
  { key: 'enableAuditLogging', label: 'Audit Logging' },
  { key: 'enableAttendanceExports', label: 'Attendance Exports' },
  { key: 'enableLeaveManagement', label: 'Leave Management' },
  { key: 'enableSupervisorManagement', label: 'Supervisor Management' },
];

const templateParameterGroups = [
  {
    title: 'User Profile',
    params: [
      ['{firstName}', 'First word from the user name.'],
      ['{name}', 'Full registered user name.'],
      ['{fullName}', 'Full registered user name.'],
      ['{email}', 'Registered email address.'],
      ['{phone}', 'Registered phone number.'],
      ['{employeeId}', 'Staff payroll or employee identifier.'],
      ['{department}', 'Assigned department.'],
      ['{station}', 'Assigned or selected station.'],
    ],
  },
  {
    title: 'Clocking',
    params: [
      ['{date}', 'Clock-in or clock-out date.'],
      ['{time}', 'Clock-in or clock-out time.'],
      ['{reason}', 'Approved outside-clock reason.'],
    ],
  },
  {
    title: 'Leave',
    params: [
      ['{type}', 'Leave request type.'],
      ['{startDate}', 'Leave or outside-clock start date.'],
      ['{endDate}', 'Leave or outside-clock end date.'],
    ],
  },
  {
    title: 'Registration',
    params: [
      ['{password}', 'Temporary password sent during account creation.'],
    ],
  },
];

const platformConfigBackupKeys = [
  'logoUrl',
  'branding',
  'activeThemeName',
  'themes',
  'notificationReminders',
  'geofence',
  'attendancePolicy',
  'departments',
  'stations',
  'dropdowns',
  'masterSettings',
  'holidays',
];

const pickPlatformConfigPayload = (source = {}) =>
  platformConfigBackupKeys.reduce((payload, key) => {
    if (typeof source[key] !== 'undefined') payload[key] = source[key];
    return payload;
  }, {});

const buildConfigBackup = (config = {}) => ({
  backupType: 'kmfri-platform-config',
  exportedAt: new Date().toISOString(),
  version: 1,
  platformConfig: pickPlatformConfigPayload(config),
});

const getBackupConfigPayload = (backup = {}) => {
  const source = backup.platformConfig || backup.config || backup;
  const payload = pickPlatformConfigPayload(source);

  if (Object.keys(payload).length === 0) {
    throw new Error('This file does not contain platform configuration settings.');
  }

  return payload;
};

const ConfigPanel = ({ onConfigLoaded }) => {
  const [tab, setTab] = useState(0);
  const [config, setConfig] = useState(null);
  const [newDept, setNewDept] = useState('');
  const [newStation, setNewStation] = useState(blankStation);
  const [dropdownKey, setDropdownKey] = useState('leaveTypes');
  const [dropdownDraft, setDropdownDraft] = useState('');
  const [newTheme, setNewTheme] = useState(blankTheme);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);

  const dropdowns = useMemo(() => normalizeDropdowns(config?.dropdowns), [config?.dropdowns]);
  const selectedDropdownValues = dropdowns[dropdownKey] || [];
  const activeTheme = useMemo(
    () => (config?.themes || []).find((theme) => theme.name === config?.activeThemeName) || config?.themes?.[0] || blankTheme,
    [config?.activeThemeName, config?.themes],
  );

  const applyLoadedConfig = (data) => {
    const next = {
      ...data,
      stations: (data?.stations || []).map(normalizeStation),
      dropdowns: normalizeDropdowns(data?.dropdowns),
      geofence: {
        radiusMeters: 500,
        enabled: false,
        ...(data?.geofence || {}),
      },
      attendancePolicy: {
        ...defaultAttendancePolicy,
        ...(data?.attendancePolicy || {}),
      },
      notificationReminders: {
        ...defaultNotificationReminders,
        ...(data?.notificationReminders || {}),
        channels: Array.isArray(data?.notificationReminders?.channels)
          ? data.notificationReminders.channels
          : defaultNotificationReminders.channels,
      },
      masterSettings: {
        ...defaultMasterSettings,
        ...(data?.masterSettings || {}),
      }
    };
    setConfig(next);
    applyPlatformConfigToCoreData(next);
    if (typeof onConfigLoaded === 'function') onConfigLoaded(next);
  };

  const load = async () => {
    try {
      setError('');
      setIsLoading(true);
      const data = await SuperadminAPI.getPlatformConfig();
      applyLoadedConfig(data);
    } catch (err) {
      console.error('Load config', err);
      setError(typeof err === 'string' ? err : 'Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const savePatch = async (payload, message = 'Configuration saved') => {
    try {
      setError('');
      setIsLoading(true);
      const data = await SuperadminAPI.updatePlatformConfig(payload);
      applyLoadedConfig(data);
      setStatus(message);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || 'Save failed');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSectionField = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...(prev?.[section] || {}),
        [field]: value,
      },
    }));
  };

  const toggleWorkingDay = (dayValue) => {
    const currentDays = config.attendancePolicy?.workingDays || [];
    const nextDays = currentDays.includes(dayValue)
      ? currentDays.filter((day) => day !== dayValue)
      : [...currentDays, dayValue].sort((a, b) => a - b);

    updateSectionField('attendancePolicy', 'workingDays', nextDays);
  };

  const resetConfig = async (section = 'all') => {
    if (!window.confirm(`Are you sure you want to restore default values for ${section}?`)) return;
    try {
      setError('');
      setIsLoading(true);
      const data = await SuperadminAPI.resetPlatformConfig(section);
      applyLoadedConfig(data);
      setStatus(section === 'all' ? 'All configurations reset to defaults' : `${section} reset to defaults`);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadConfigBackup = () => {
    const backup = buildConfigBackup(config);
    const fileName = `kmfri-platform-config-${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus('Platform configuration backup downloaded.');
  };

  const uploadConfigBackup = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setError('');
      const rawText = await file.text();
      const parsed = JSON.parse(rawText);
      const payload = getBackupConfigPayload(parsed);
      const applyBackup = window.confirm(
        'Configuration file loaded successfully. Click OK to apply these settings across the platform.'
      );

      if (!applyBackup) return;

      await savePatch(payload, 'Platform configuration backup restored successfully.');
      setBackupOpen(false);
      window.alert('Configuration restored successfully. The changes are now active across the platform.');
    } catch (err) {
      console.error('Restore config backup', err);
      setError(err?.message || 'Could not restore configuration backup.');
    }
  };

  const handleAddDept = async () => {
    if (!newDept.trim()) return;
    try {
      setIsLoading(true);
      await SuperadminAPI.addDepartment(newDept.trim());
      setNewDept('');
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Department update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDept = async (name) => {
    try {
      setIsLoading(true);
      await SuperadminAPI.removeDepartment(name);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Department removal failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStation = async () => {
    if (!newStation.name.trim()) return;
    try {
      setIsLoading(true);
      await SuperadminAPI.addStation(newStation);
      setNewStation(blankStation);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Station update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStation = async (name) => {
    try {
      setIsLoading(true);
      await SuperadminAPI.removeStation(name);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Station removal failed');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStation = (index, field, value) => {
    const stations = [...(config.stations || [])];
    stations[index] = {
      ...stations[index],
      [field]: field === 'name' ? value : field === 'active' ? value : Number(value),
    };
    setConfig({ ...config, stations });
  };

  const handleAddDropdownValue = () => {
    const value = dropdownDraft.trim();
    if (!value) return;
    const nextValues = Array.from(new Set([...selectedDropdownValues, value]));
    setConfig({ ...config, dropdowns: { ...dropdowns, [dropdownKey]: nextValues } });
    setDropdownDraft('');
  };

  const handleRemoveDropdownValue = (value) => {
    const nextValues = selectedDropdownValues.filter((item) => item !== value);
    setConfig({ ...config, dropdowns: { ...dropdowns, [dropdownKey]: nextValues } });
  };

  const handleThemeSelect = (name) => {
    const theme = (config.themes || []).find((item) => item.name === name);
    if (!theme) return;
    setConfig({
      ...config,
      activeThemeName: theme.name,
      branding: {
        ...config.branding,
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        accentColor: theme.accentColor,
      },
    });
  };

  const updateActiveTheme = (field, value) => {
    const themes = (config.themes || []).map((theme) => (
      theme.name === activeTheme.name ? { ...theme, [field]: value } : theme
    ));
    const brandingPatch = ['primaryColor', 'secondaryColor', 'accentColor'].includes(field)
      ? { [field]: value }
      : {};
    setConfig({
      ...config,
      themes,
      branding: { ...config.branding, ...brandingPatch },
    });
  };

  const handleCreateTheme = () => {
    const name = newTheme.name.trim();
    if (!name) return;
    const theme = {
      ...newTheme,
      name,
    };
    const themes = [...(config.themes || []).filter((item) => item.name !== name), theme];
    setConfig({
      ...config,
      themes,
      activeThemeName: name,
      branding: {
        ...config.branding,
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        accentColor: theme.accentColor,
      },
    });
    setNewTheme(blankTheme);
  };

  if (!config) return <Typography sx={{ p: 4 }}>Loading global parameters...</Typography>;

  return (
    <Box sx={{ maxWidth: 1600, mx: "auto", px: { xs: 1.5, sm: 3 }, py: 2 }}>
      <Stack spacing={3}>
        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
        {status && <Alert severity="success" onClose={() => setStatus('')}>{status}</Alert>}

        {/* Navigation Tabs Bar */}
        <Paper elevation={0} sx={{ borderRadius: 3, p: 0.5, bgcolor: 'background.neutral', border: '1px solid rgba(148,163,184,0.15)' }}>
          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTabs-indicator': { borderRadius: '4px' }
            }}
          >
            <Tab disabled={isLoading} icon={<HomeRounded />} iconPosition="start" label="Dashboard" />
            <Tab disabled={isLoading} icon={<Palette />} iconPosition="start" label="Branding" />
            <Tab disabled={isLoading} icon={<Business />} iconPosition="start" label="Stations" />
            <Tab disabled={isLoading} icon={<Schedule />} iconPosition="start" label="Attendance" />
            <Tab disabled={isLoading} icon={<Tune />} iconPosition="start" label="Dropdowns" />
            <Tab disabled={isLoading} icon={<AdminPanelSettings />} iconPosition="start" label="Departments" />
          </Tabs>
        </Paper>

        <Divider />

        {tab === 0 && <SuperAdminDashBoardTab />}

        {tab === 1 && (
          <Stack spacing={3}>
            {/* Row 1: Identity & Logo Upload */}
            <Grid container spacing={3}>
              <Grid item xs={12} lg={7}>
                <Paper elevation={0} sx={cardSx}>
                  <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2 }}>Organization Identity</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                      <TextField label="Organization Name" value={config.branding?.organizationName || ''} onChange={(e) => setConfig({ ...config, branding: { ...config.branding, organizationName: e.target.value } })} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField label="Short Acronym Name" value={config.branding?.shortName || ''} onChange={(e) => setConfig({ ...config, branding: { ...config.branding, shortName: e.target.value } })} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Support Email Address"
                        value={config.branding?.supportEmail || ''}
                        onChange={(e) => setConfig({ ...config, branding: { ...config.branding, supportEmail: e.target.value } })}
                        fullWidth
                        InputProps={{ startAdornment: <InputAdornment position="start"><Email fontSize="small" /></InputAdornment> }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Support Contact Number"
                        value={config.branding?.supportPhone || ''}
                        onChange={(e) => setConfig({ ...config, branding: { ...config.branding, supportPhone: e.target.value } })}
                        fullWidth
                        InputProps={{ startAdornment: <InputAdornment position="start"><Phone fontSize="small" /></InputAdornment> }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12} lg={5}>
                <Paper elevation={0} sx={cardSx}>
                  <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2 }}>Platform Identity Logo</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                    <Box sx={{ height: 110, width: '100%', maxWidth: 220, borderRadius: 3, border: '2px dashed rgba(148,163,184,0.4)', display: 'grid', placeItems: 'center', p: 1, bgcolor: '#f8fafd' }}>
                      {config.logoUrl ? <img src={config.logoUrl} alt="Logo preview" style={{ maxHeight: 90, maxWidth: '100%', objectFit: 'contain' }} /> : <Chip label="No Asset Set" variant="outlined" color="warning" />}
                    </Box>
                    <Button variant="contained" component="label" startIcon={<CloudUpload />} sx={{ minHeight: 48, textTransform: 'none', borderRadius: 2 }} fullWidth={{ xs: true, sm: false }}>
                      Upload Image File
                      <input hidden accept="image/*" type="file" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => savePatch({ logoUrl: reader.result }, 'Logo asset updated');
                        reader.readAsDataURL(file);
                      }} />
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            {/* Row 2: Theme Management */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={cardSx}>
                  <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2 }}>Current Active Selection</Typography>
                  <TextField select label="Theme Profiles" value={config.activeThemeName || ''} onChange={(e) => handleThemeSelect(e.target.value)} fullWidth sx={{ mb: 2.5 }}>
                    {(config.themes || []).map((theme) => <MenuItem key={theme.name} value={theme.name}>{theme.name}</MenuItem>)}
                  </TextField>

                  {/* Real-time Theme Preview Card */}
                  <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: activeTheme.surfaceColor, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 8px 24px rgba(0,0,0,0.03)' }}>
                    <Typography variant="body2" fontWeight={800} sx={{ color: activeTheme.textColor, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><Visibility fontSize="small" /> {activeTheme.name || 'Preview Schema'}</Typography>
                    <Stack direction="row" spacing={1.5}>
                      {['primaryColor', 'secondaryColor', 'accentColor'].map((field) => (
                        <Tooltip key={field} title={field} arrow>
                          <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: activeTheme[field], border: '2px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }} />
                        </Tooltip>
                      ))}
                    </Stack>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={8}>
                <Paper elevation={0} sx={cardSx}>
                  <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2 }}>Color Palette Settings Configuration</Typography>
                  <Grid container spacing={2}>
                    {paletteFields.map(({ field, label, helper }) => (
                      <Grid item xs={12} sm={6} lg={4} key={field}>
                        <TextField
                          label={label}
                          disabled={isLoading}
                          type="color"
                          value={activeTheme[field] || '#0A3D62'}
                          onChange={(e) => updateActiveTheme(field, e.target.value)}
                          helperText={helper}
                          fullWidth
                          slotProps={{ input: { style: { height: 42, padding: '4px' } } }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            {/* Row 3: Custom Theme Builder Engine */}
            <Paper elevation={0} sx={cardSx}>
              <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2 }}>Theme Customizer Generator Engine</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField label="Unique Theme Name" value={newTheme.name} onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })} fullWidth />
                </Grid>
                {paletteFields.map(({ field, label }) => (
                  <Grid item xs={6} sm={4} md={1.8} key={field}>
                    <Tooltip title={label} arrow>
                      <TextField type="color" label={field} value={newTheme[field] || ''} onChange={(e) => setNewTheme({ ...newTheme, [field]: e.target.value })} fullWidth slotProps={{ input: { style: { height: 42, padding: '2px' } } }} />
                    </Tooltip>
                  </Grid>
                ))}
                <Grid item xs={12} md={1.4}>
                  <Button disabled={isLoading} startIcon={<AddIcon />} variant="contained" onClick={handleCreateTheme} fullWidth sx={{ minHeight: 48, borderRadius: 2 }}>Create</Button>
                </Grid>
              </Grid>
            </Paper>


            {/* Row 4: Master Operational System Flags (New Branding Features) */}
            <Paper elevation={0} sx={cardSx}>
              <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2 }}>More Operational Controls</Typography>
              <Grid container spacing={2.5} alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Maximum Devices Per User"
                    type="number"
                    value={config.masterSettings?.maxDevicesPerUser ?? 2}
                    onChange={(e) => updateSectionField('masterSettings', 'maxDevicesPerUser', Number(e.target.value))}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Biometric Session Window"
                    type="number"
                    value={config.masterSettings?.biometricVerificationWindowMinutes ?? 5}
                    onChange={(e) => updateSectionField('masterSettings', 'biometricVerificationWindowMinutes', Number(e.target.value))}
                    InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Session Timeout"
                    type="number"
                    value={config.masterSettings?.sessionTimeoutMinutes ?? 1440}
                    onChange={(e) => updateSectionField('masterSettings', 'sessionTimeoutMinutes', Number(e.target.value))}
                    InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }}
                    fullWidth
                  />
                </Grid>
                {masterToggleFields.map(({ key, label }) => (
                  <Grid item xs={12} sm={6} md={4} key={key}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.05)', height: '100%' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!config.masterSettings?.[key]}
                            onChange={(e) => updateSectionField('masterSettings', key, e.target.checked)}
                            color={key === 'maintenanceMode' ? 'error' : 'primary'}
                          />
                        }
                        label={<Typography fontWeight={700}>{label}</Typography>}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>


            {/* Submit Actions Toolbar */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-start">
              <Button disabled={isLoading} startIcon={<Save />} variant="contained" size="large" onClick={() => savePatch({ branding: config.branding, logoUrl: config.logoUrl, themes: config.themes, activeThemeName: config.activeThemeName, masterSettings: config.masterSettings }, 'Global profile layout saves applied.')} sx={{ minWidth: 200, borderRadius: 2.5 }}>Save System Parameters</Button>
              <Button disabled={isLoading} startIcon={<RestartAlt />} color="warning" variant="outlined" onClick={() => resetConfig('themes')} sx={{ borderRadius: 2.5 }}>Reset Palette Themes</Button>
              <Button disabled={isLoading} startIcon={<RestartAlt />} color="warning" variant="outlined" onClick={() => resetConfig('branding')} sx={{ borderRadius: 2.5 }}>Reset Branding Info</Button>
            </Stack>
          </Stack>
        )}

        {tab === 2 && (
          <Stack spacing={3}>
            <Paper elevation={0} sx={cardSx}>
              <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2 }}>Register Facility Duty Station</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3.5}><TextField label="Facility Station Location Name" value={newStation.name} onChange={(e) => setNewStation({ ...newStation, name: e.target.value })} fullWidth /></Grid>
                <Grid item xs={6} sm={4} md={2}><TextField label="Geographic Latitude" type="number" value={newStation.lat} onChange={(e) => setNewStation({ ...newStation, lat: e.target.value })} fullWidth /></Grid>
                <Grid item xs={6} sm={4} md={2}><TextField label="Geographic Longitude" type="number" value={newStation.lng} onChange={(e) => setNewStation({ ...newStation, lng: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12} sm={4} md={2.5}><TextField label="Geofence Radius Threshold" type="number" value={newStation.radiusMeters} onChange={(e) => setNewStation({ ...newStation, radiusMeters: e.target.value })} InputProps={{ endAdornment: <InputAdornment position="end">meters</InputAdornment> }} fullWidth /></Grid>
                <Grid item xs={12} md={2}><Button disabled={isLoading} variant="contained" startIcon={<AddIcon />} onClick={handleAddStation} fullWidth sx={{ minHeight: 54, borderRadius: 2 }}>Add Station</Button></Grid>
              </Grid>
            </Paper>

            <Paper elevation={0} sx={cardSx}>
              <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2 }}>Configured Operational Hub Stations ({config.stations?.length || 0})</Typography>
              <Stack spacing={2} separator={<Divider />}>
                {(config.stations || []).map((station, index) => (
                  <Grid container spacing={2} key={`${station.name}-${index}`} alignItems="center">
                    <Grid item xs={12} sm={6} md={3.5}><TextField label="Station Area Name" value={station.name} onChange={(e) => updateStation(index, 'name', e.target.value)} fullWidth /></Grid>
                    <Grid item xs={6} sm={3} md={2}><TextField label="Lat Coord" type="number" value={station.lat} onChange={(e) => updateStation(index, 'lat', e.target.value)} fullWidth /></Grid>
                    <Grid item xs={6} sm={3} md={2}><TextField label="Lng Coord" type="number" value={station.lng} onChange={(e) => updateStation(index, 'lng', e.target.value)} fullWidth /></Grid>
                    <Grid item xs={7} sm={8} md={2.5}><TextField label="Boundary Perimeter" type="number" value={station.radiusMeters} onChange={(e) => updateStation(index, 'radiusMeters', e.target.value)} InputProps={{ endAdornment: <InputAdornment position="end">m</InputAdornment> }} fullWidth /></Grid>
                    <Grid item xs={3} sm={2} md={1}><FormControlLabel control={<Switch checked={station.active} onChange={(e) => updateStation(index, 'active', e.target.checked)} />} label="Active" /></Grid>
                    <Grid item xs={2} sm={2} md={1} textAlign="right">
                      <Tooltip title="Delete Location Entry" arrow>
                        <IconButton color="error" onClick={() => handleRemoveStation(station.name)}><DeleteIcon /></IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>
                ))}
              </Stack>
            </Paper>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button disabled={isLoading} startIcon={<Save />} variant="contained" onClick={() => savePatch({ stations: config.stations }, 'Facility location roster metrics updated.')} sx={{ borderRadius: 2.5 }}>Save Changes</Button>
              <Button disabled={isLoading} startIcon={<RestartAlt />} color="warning" variant="outlined" onClick={() => resetConfig('stations')} sx={{ borderRadius: 2.5 }}>Reset Station Changes</Button>
            </Stack>
          </Stack>
        )}

        {tab === 3 && (
          <Stack spacing={3}>
            {/* Section A: Core Shift Timing Constants */}
            <Paper elevation={0} sx={cardSx}>
              <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule color="primary" /> Shift Constraints & Timing Windows
              </Typography>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Shift Start (Clock-In)"
                    type="time"
                    value={config.attendancePolicy?.standardClockIn || '08:00'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      attendancePolicy: { ...(prev.attendancePolicy || {}), standardClockIn: e.target.value }
                    }))}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Shift End (Clock-Out)"
                    type="time"
                    value={config.attendancePolicy?.standardClockOut || '17:00'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      attendancePolicy: { ...(prev.attendancePolicy || {}), standardClockOut: e.target.value }
                    }))}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Late Grace Period Window"
                    type="number"
                    value={config.attendancePolicy?.gracePeriodMinutes ?? 0}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      attendancePolicy: { ...(prev.attendancePolicy || {}), gracePeriodMinutes: Number(e.target.value) }
                    }))}
                    InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Clock-In Reminder Offset"
                    type="number"
                    value={config.attendancePolicy?.clockInReminderOffsetMinutes ?? 0}
                    onChange={(e) => updateSectionField('attendancePolicy', 'clockInReminderOffsetMinutes', Number(e.target.value))}
                    InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Clock-Out Reminder Lead"
                    type="number"
                    value={config.attendancePolicy?.clockOutReminderOffsetMinutes ?? 0}
                    onChange={(e) => updateSectionField('attendancePolicy', 'clockOutReminderOffsetMinutes', Number(e.target.value))}
                    InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Midnight Processing Time"
                    type="time"
                    value={config.attendancePolicy?.midnightProcessingTime || '00:00'}
                    onChange={(e) => updateSectionField('attendancePolicy', 'midnightProcessingTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Minimum Work Day"
                    type="number"
                    value={config.attendancePolicy?.minimumWorkHours ?? 8}
                    onChange={(e) => updateSectionField('attendancePolicy', 'minimumWorkHours', Number(e.target.value))}
                    InputProps={{ endAdornment: <InputAdornment position="end">hrs</InputAdornment> }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Half-Day Threshold"
                    type="number"
                    value={config.attendancePolicy?.halfDayWorkHours ?? 4}
                    onChange={(e) => updateSectionField('attendancePolicy', 'halfDayWorkHours', Number(e.target.value))}
                    InputProps={{ endAdornment: <InputAdornment position="end">hrs</InputAdornment> }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Early Departure Grace"
                    type="number"
                    value={config.attendancePolicy?.earlyDepartureGraceMinutes ?? 15}
                    onChange={(e) => updateSectionField('attendancePolicy', 'earlyDepartureGraceMinutes', Number(e.target.value))}
                    InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Global Geofence Radius"
                    type="number"
                    value={config.geofence?.radiusMeters ?? 500}
                    onChange={(e) => updateSectionField('geofence', 'radiusMeters', Number(e.target.value))}
                    InputProps={{ endAdornment: <InputAdornment position="end">m</InputAdornment> }}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Section B: Policy & Enforcement Toggles */}
            <Paper elevation={0} sx={cardSx}>
              <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tune color="primary" /> Verification Policies & System Rule Enforcement
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.05)', height: '100%' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          disabled={isLoading}
                          checked={!!config.geofence?.enabled}
                          onChange={(e) => updateSectionField('geofence', 'enabled', e.target.checked)}
                        />
                      }
                      label={<Typography fontWeight={700}>Geofence Enforcement</Typography>}
                    />
                  </Box>
                </Grid>

                {policyToggleFields.map(({ key, label }) => (
                  <Grid item xs={12} sm={6} md={4} key={key}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.05)', height: '100%' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            disabled={isLoading}
                            checked={config.attendancePolicy?.[key] !== false}
                            onChange={(e) => updateSectionField('attendancePolicy', key, e.target.checked)}
                          />
                        }
                        label={<Typography fontWeight={700}>{label}</Typography>}
                      />
                    </Box>
                  </Grid>
                ))}

                <Grid item xs={12}>
                  <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
                    <Typography variant="body2" fontWeight={800} sx={{ mr: 1 }}>Working Days</Typography>
                    {weekDayOptions.map((day) => {
                      const selected = (config.attendancePolicy?.workingDays || []).includes(day.value);
                      return (
                        <Chip
                          key={day.value}
                          label={day.label}
                          color={selected ? 'primary' : 'default'}
                          variant={selected ? 'filled' : 'outlined'}
                          onClick={() => toggleWorkingDay(day.value)}
                          sx={{ borderRadius: 1.5, fontWeight: 800 }}
                        />
                      );
                    })}
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={0} sx={cardSx}>
              <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AdminPanelSettings color="primary" /> Notification Timing & Channels
              </Typography>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Clock-In Reminder Threshold"
                    type="number"
                    value={config.notificationReminders?.clockInReminderMinutes ?? 15}
                    onChange={(e) => updateSectionField('notificationReminders', 'clockInReminderMinutes', Number(e.target.value))}
                    InputProps={{ endAdornment: <InputAdornment position="end">mins</InputAdornment> }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Clock-Out Reminder Threshold"
                    type="number"
                    value={config.notificationReminders?.clockOutReminderMinutes ?? 15}
                    onChange={(e) => updateSectionField('notificationReminders', 'clockOutReminderMinutes', Number(e.target.value))}
                    InputProps={{ endAdornment: <InputAdornment position="end">mins</InputAdornment> }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    label="Notification Channels"
                    value={config.notificationReminders?.channels || []}
                    onChange={(e) => updateSectionField('notificationReminders', 'channels', e.target.value)}
                    SelectProps={{
                      multiple: true,
                      renderValue: (selected) => selected.map((value) => notificationChannelOptions.find((item) => item.value === value)?.label || value).join(', '),
                    }}
                    fullWidth
                  >
                    {notificationChannelOptions.map((channel) => (
                      <MenuItem key={channel.value} value={channel.value}>
                        {channel.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={0} sx={cardSx}>
              <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MessageRounded color="primary" /> Message Template Controls
              </Typography>
              <Grid container spacing={2.5}>
                {messageTemplateFields.map(({ key, label, helper }) => (
                  <Grid item xs={12} md={6} key={key}>
                    <TextField
                      label={label}
                      multiline
                      minRows={3}
                      value={config.notificationReminders?.[key] || ''}
                      onChange={(e) => updateSectionField('notificationReminders', key, e.target.value)}
                      helperText={helper}
                      fullWidth
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Form Control Persist Actions Footer */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                disabled={isLoading}
                startIcon={<Save />}
                variant="contained"
                size="large"
                onClick={() => savePatch(
                  {
                    attendancePolicy: config.attendancePolicy,
                    geofence: config.geofence,
                    notificationReminders: config.notificationReminders
                  },
                  'Attendance guidelines synced successfully.'
                )}
                sx={{ minWidth: 240, borderRadius: 2.5 }}
              >
                Save Shift Parameters
              </Button>
              <Button
                disabled={isLoading}
                startIcon={<RestartAlt />}
                color="warning"
                variant="outlined"
                onClick={() => resetConfig('attendancePolicy')}
                sx={{ borderRadius: 2.5 }}
              >
                Reset Attendance Policy
              </Button>
              <Button
                disabled={isLoading}
                startIcon={<RestartAlt />}
                color="warning"
                variant="outlined"
                onClick={() => resetConfig('notificationReminders')}
                sx={{ borderRadius: 2.5 }}
              >
                Reset Messages
              </Button>
            </Stack>
          </Stack>
        )}

        {tab === 4 && (
          <Paper elevation={0} sx={cardSx}>
            <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2 }}>System Selection Roster Lists</Typography>
            <Stack spacing={3}>
              <TextField select label="Target Custom Roster Dropdown" value={dropdownKey} onChange={(e) => setDropdownKey(e.target.value)} sx={{ maxWidth: 400 }}>
                {Object.keys(dropdowns).map((key) => <MenuItem key={key} value={key}>{key}</MenuItem>)}
              </TextField>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Append New Row Entry Value" value={dropdownDraft} onChange={(e) => setDropdownDraft(e.target.value)} fullWidth />
                <Button disabled={isLoading} variant="outlined" startIcon={<AddIcon />} onClick={handleAddDropdownValue} sx={{ minWidth: 120, minHeight: 54, borderRadius: 2 }}>Append</Button>
              </Stack>

              <Box sx={{ p: 2, minHeight: 80, borderRadius: 2, border: '1px solid rgba(148,163,184,0.15)', bg: '#fafbfc' }}>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {selectedDropdownValues.length === 0 ? <Typography variant="body2" color="text.secondary">No fields assigned yet.</Typography> : selectedDropdownValues.map((value) => (
                    <Chip key={value} label={value} color="primary" variant="outlined" onDelete={() => handleRemoveDropdownValue(value)} sx={{ borderRadius: 1.5 }} />
                  ))}
                </Stack>
              </Box>

              <TextField
                label="Structured Advanced JSON Payload Editor"
                multiline
                minRows={6}
                value={JSON.stringify(dropdowns, null, 2)}
                onChange={(e) => {
                  try {
                    setConfig({ ...config, dropdowns: JSON.parse(e.target.value) });
                  } catch (err) {
                    setError('Malformed payload script validation failure.');
                  }
                }}
                fullWidth
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button disabled={isLoading} startIcon={<Save />} variant="contained" onClick={() => savePatch({ dropdowns: config.dropdowns }, 'Selection dataset attributes updated globally.')} sx={{ borderRadius: 2.5 }}>Save Dropdown Attributes</Button>
                <Button disabled={isLoading} startIcon={<RestartAlt />} color="warning" variant="outlined" onClick={() => resetConfig('dropdowns')} sx={{ borderRadius: 2.5 }}>Reset Lists to Base</Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {tab === 5 && (
          <Paper elevation={0} sx={cardSx}>
            <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2 }}>Corporate Management Divisions</Typography>
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Add Organizational Department" value={newDept} onChange={(e) => setNewDept(e.target.value)} fullWidth />
                <Button disabled={isLoading} variant="contained" startIcon={<AddIcon />} onClick={handleAddDept} sx={{ minWidth: 160, minHeight: 54, borderRadius: 2 }}>Add</Button>
              </Stack>

              <Paper variant="outlined" sx={{ borderRadius: 3, maxHeight: 450, overflow: 'auto', p: 1 }}>
                <List dense>
                  {(config.departments || []).map((department, idx) => (
                    <ListItem
                      key={department}
                      secondaryAction={<IconButton edge="end" color="error" onClick={() => handleRemoveDept(department)}><DeleteIcon /></IconButton>}
                      sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}
                    >
                      <ListItemText primary={`${idx + 1}. ${department}`} primaryTypographyProps={{ fontWeight: 600 }} />
                    </ListItem>
                  ))}
                </List>
              </Paper>

              <Box>
                <Button disabled={isLoading} startIcon={<RestartAlt />} color="warning" variant="outlined" onClick={() => resetConfig('departments')} sx={{ borderRadius: 2.5 }}>Reset Departments</Button>
              </Box>
            </Stack>
          </Paper>
        )}

        <Dialog
          open={backupOpen}
          onClose={() => setBackupOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 3,
              border: '1px solid rgba(148,163,184,0.22)',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsBackupRestoreRounded color="primary" /> Platform Config Backup
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              <Alert severity="info">
                Export a JSON snapshot of the current platform configuration or restore a previous backup into the live system.
              </Alert>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1 }}>
                  Included Sections
                </Typography>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {platformConfigBackupKeys.map((key) => (
                    <Chip key={key} label={key} size="small" variant="outlined" sx={{ borderRadius: 1.5 }} />
                  ))}
                </Stack>
              </Paper>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  variant="contained"
                  startIcon={<FileDownloadRounded />}
                  onClick={downloadConfigBackup}
                  disabled={!config || isLoading}
                  fullWidth
                  sx={{ minHeight: 48, borderRadius: 2 }}
                >
                  Download JSON
                </Button>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadFileRounded />}
                  disabled={isLoading}
                  fullWidth
                  sx={{ minHeight: 48, borderRadius: 2 }}
                >
                  Upload JSON
                  <input hidden accept="application/json,.json" type="file" onChange={uploadConfigBackup} />
                </Button>
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setBackupOpen(false)} variant="contained" sx={{ borderRadius: 2 }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={manualOpen}
          onClose={() => setManualOpen(false)}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: {
              borderRadius: 3,
              border: '1px solid rgba(148,163,184,0.22)',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
            <MenuBookRounded color="primary" /> Superadmin Message Manual
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              <Alert severity="info">
                Use these parameters inside message templates. The system replaces them automatically when sending clocking, leave, account, device, and registration messages.
              </Alert>

              <Grid container spacing={2}>
                {templateParameterGroups.map((group) => (
                  <Grid item xs={12} md={6} key={group.title}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                      <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1.5 }}>
                        {group.title}
                      </Typography>
                      <Stack spacing={1.2}>
                        {group.params.map(([param, description]) => (
                          <Box
                            key={param}
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: { xs: '1fr', sm: '150px 1fr' },
                              gap: 1,
                              alignItems: 'start',
                            }}
                          >
                            <Chip
                              label={param}
                              color="primary"
                              variant="outlined"
                              sx={{
                                borderRadius: 1.5,
                                fontFamily: 'monospace',
                                fontWeight: 800,
                                justifySelf: 'start',
                              }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {description}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setManualOpen(false)} variant="contained" sx={{ borderRadius: 2 }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Tooltip title="Import or Export Platform Config" placement="left" arrow>
          <Fab
            color="secondary"
            aria-label="platform-config-backup"
            size="large"
            onClick={() => setBackupOpen(true)}
            sx={{
              position: 'fixed',
              bottom: 168,
              right: 24,
              boxShadow: '0 6px 20px rgba(54,141,197,0.35)'
            }}
          >
            <SettingsBackupRestoreRounded />
          </Fab>
        </Tooltip>

        <Tooltip title="Superadmin Message Manual" placement="left" arrow>
          <Fab
            color="primary"
            aria-label="superadmin-manual"
            size="large"
            onClick={() => setManualOpen(true)}
            sx={{
              position: 'fixed',
              bottom: 96,
              right: 24,
              boxShadow: '0 6px 20px rgba(10,61,98,0.35)'
            }}
          >
            <MenuBookRounded />
          </Fab>
        </Tooltip>

        <Tooltip title="Purge System Override Options" placement="left" arrow>
          <Fab
            color="error"
            aria-label="purge-all"
            size="large"
            onClick={() => resetConfig('all')}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              boxShadow: '0 6px 20px rgba(239,68,68,0.4)'
            }}
          >
            <RestartAlt />
          </Fab>
        </Tooltip>
      </Stack>
    </Box>
  );
};

export default ConfigPanel;
