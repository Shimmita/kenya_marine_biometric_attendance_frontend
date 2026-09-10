import {
  Add as AddIcon,
  AccessTimeRounded,
  Business,
  CheckCircleRounded,
  CloudUpload,
  ConstructionRounded,
  DashboardRounded,
  Delete as DeleteIcon,
  Email,
  EventAvailableRounded,
  FileDownloadRounded,
  Inventory2Rounded,
  KeyRounded,
  LocationOnRounded,
  MenuBookRounded,
  MessageRounded,
  NotificationsActiveRounded,
  Palette,
  Phone,
  RestartAlt,
  Save,
  Schedule,
  SettingsBackupRestoreRounded,
  SettingsRounded,
  ShieldRounded,
  Tune,
  UploadFileRounded,
  Visibility,
  WarningAmberRounded,
  WorkspacesRounded
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import { useCallback, useEffect, useMemo, useState } from 'react';
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

const normalizeMasterSettings = (value = {}) => {
  const settings = { ...(value || {}) };
  delete settings.allowEmployeeSelfRegistration;
  delete settings.enableAttendanceExports;
  delete settings.enableLeaveManagement;
  delete settings.enableSupervisorManagement;
  return settings;
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
  borderRadius: 2,
  p: { xs: 2, sm: 3 },
  background: '#ffffff',
  border: '1px solid rgba(148, 163, 184, 0.22)',
  boxShadow: '0 12px 30px rgba(15,23,42,.05)',
};

const controlSurfaceSx = {
  borderRadius: 2,
  border: '1px solid rgba(148, 163, 184, 0.22)',
  background: 'linear-gradient(180deg, #ffffff 0%, #f8fbfc 100%)',
  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.05)',
};

const actionBarSx = {
  borderRadius: 2,
  p: { xs: 1.5, sm: 2 },
  border: '1px solid rgba(148, 163, 184, 0.22)',
  bgcolor: '#ffffff',
  boxShadow: '0 10px 24px rgba(15,23,42,.04)',
};

const toggleTileSx = {
  p: 2,
  borderRadius: 2,
  bgcolor: '#f8fbfc',
  border: '1px solid rgba(148,163,184,0.18)',
  height: '100%',
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
  accountExpiredMessage: 'Dear {firstName}, your KMFRI Attendance {role} account reached its end date ({endDate}) and has been automatically deactivated. Please contact HR for assistance.',
  maintenanceModeMessage: 'Dear {firstName}, KMFRI Attendance will be under scheduled maintenance from {startDate} to {endDate}. Services may be temporarily unavailable. Thank you for your patience.',
  maintenanceRestoredMessage: 'Dear {firstName}, KMFRI Attendance services have been restored. You may now continue using the platform.',
  holidayNoticeMessage: 'Dear {firstName}, today ({holidayDate}) is {holidayName}. KMFRI Attendance clocking is not required for the holiday. Normal clocking resumes on the next configured working day.',
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
  maintenanceMode: false,
  maintenanceStartAt: null,
  maintenanceEndAt: null,
  maintenanceMessage: '',
  maintenanceNotifiedAt: null,
  maintenanceRestoredNotifiedAt: null,
  requirePasswordResetOnFirstLogin: true,
  maxDevicesPerUser: 2,
  biometricVerificationWindowMinutes: 5,
  sessionTimeoutMinutes: 20,
  enableAuditLogging: true,
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
  { key: 'accountExpiredMessage', label: 'Account Expired Message', helper: '{firstName} {name} {role} {endDate}' },
  { key: 'maintenanceModeMessage', label: 'Maintenance Schedule Message', helper: '{firstName} {startDate} {endDate} {reason}' },
  { key: 'maintenanceRestoredMessage', label: 'Maintenance Restored Message', helper: '{firstName} {name}' },
  { key: 'holidayNoticeMessage', label: 'Holiday Notice Message', helper: '{firstName} {holidayName} {holidayDate} {date}' },
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
  { key: 'requirePasswordResetOnFirstLogin', label: 'Force First Login Reset' },
  { key: 'enableAuditLogging', label: 'Audit Logging' },
];

const templateParameterGroups = [
  {
    title: 'Platform Access',
    params: [
      ['{siteLink}', 'Clickable KMFRI Attendance site link: https://clocking.kmfri.go.ke/'],
    ],
  },
  {
    title: 'User Profile',
    params: [
      ['{firstName}', 'First word from the user name.'],
      ['{name}', 'Full registered user name.'],
      ['{fullName}', 'Full registered user name.'],
      ['{email}', 'Registered email address.'],
      ['{phone}', 'Registered phone number.'],
      ['{employeeId}', 'Staff payroll or employee identifier.'],
      ['{role}', 'User account type, such as employee, intern, or attaché.'],
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
    title: 'Holidays',
    params: [
      ['{holidayName}', 'Configured holiday name.'],
      ['{holidayDate}', 'Readable holiday date in Africa/Nairobi time.'],
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

const toDateTimeLocalValue = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const addHoursLocalValue = (hours = 2) => {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return toDateTimeLocalValue(date);
};

const formatDateTimeLabel = (value, fallback = 'Not scheduled') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleString('en-KE', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getMaintenanceUiState = (settings = {}) => {
  const now = new Date();
  const startAt = settings.maintenanceStartAt ? new Date(settings.maintenanceStartAt) : null;
  const endAt = settings.maintenanceEndAt ? new Date(settings.maintenanceEndAt) : null;
  const enabled = !!settings.maintenanceMode;
  const scheduled = enabled && startAt && startAt > now;
  const expired = enabled && endAt && endAt <= now;
  const active = enabled && !expired && (!startAt || startAt <= now);

  return {
    enabled,
    active,
    scheduled,
    expired,
    startAt,
    endAt,
    label: active ? 'Active' : scheduled ? 'Scheduled' : 'Inactive',
    color: active ? 'warning' : scheduled ? 'info' : 'success',
  };
};

const controlTabs = [
  { label: 'Dashboard', description: 'System snapshot and administration summary.', icon: <DashboardRounded /> },
  { label: 'Branding', description: 'Identity, logo, themes, and system-wide access controls.', icon: <Palette /> },
  { label: 'Stations', description: 'Duty stations, geofence boundaries, and location status.', icon: <LocationOnRounded /> },
  { label: 'Attendance', description: 'Clocking rules, working days, alerts, and message templates.', icon: <AccessTimeRounded /> },
  { label: 'Dropdowns', description: 'Controlled lists used by forms and operational workflows.', icon: <Inventory2Rounded /> },
  { label: 'Departments', description: 'Organization departments available across user records.', icon: <WorkspacesRounded /> },
];

const MetricTile = ({ icon, label, value, detail, color = '#0A3D62' }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: 2,
      border: '1px solid rgba(148,163,184,0.2)',
      bgcolor: '#ffffff',
      height: '100%',
      minHeight: 116,
    }}
  >
    <Stack spacing={1.2}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          color,
          bgcolor: `${color}14`,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={900} sx={{ lineHeight: 1.1 }}>
          {value}
        </Typography>
        <Typography variant="body2" fontWeight={800} color="text.primary">
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {detail}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

const SectionHeading = ({ icon, title, description, action }) => (
  <Stack
    direction={{ xs: 'column', sm: 'row' }}
    spacing={1.5}
    justifyContent="space-between"
    alignItems={{ xs: 'flex-start', sm: 'center' }}
    sx={{ mb: 2.5 }}
  >
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          color: 'primary.main',
          bgcolor: 'rgba(10,61,98,0.08)',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle1" fontWeight={900}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
    </Stack>
    {action}
  </Stack>
);

const EmptyState = ({ icon, title, description }) => (
  <Box
    sx={{
      minHeight: 120,
      borderRadius: 2,
      border: '1px dashed rgba(148,163,184,0.42)',
      bgcolor: '#f8fbfc',
      display: 'grid',
      placeItems: 'center',
      textAlign: 'center',
      px: 2,
    }}
  >
    <Stack spacing={1} alignItems="center">
      <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
      <Typography variant="body2" fontWeight={900}>{title}</Typography>
      {description && <Typography variant="caption" color="text.secondary">{description}</Typography>}
    </Stack>
  </Box>
);

const ToggleTile = ({ checked, onChange, label, disabled, color = 'primary' }) => (
  <Box sx={toggleTileSx}>
    <FormControlLabel
      control={<Switch disabled={disabled} checked={checked} onChange={onChange} color={color} />}
      label={<Typography fontWeight={800}>{label}</Typography>}
      sx={{ m: 0, width: '100%', justifyContent: 'space-between', flexDirection: 'row-reverse' }}
    />
  </Box>
);

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
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [maintenanceDraft, setMaintenanceDraft] = useState({
    startAt: toDateTimeLocalValue(new Date()),
    endAt: addHoursLocalValue(2),
    message: '',
  });

  const dropdowns = useMemo(() => normalizeDropdowns(config?.dropdowns), [config?.dropdowns]);
  const selectedDropdownValues = dropdowns[dropdownKey] || [];
  const activeTheme = useMemo(
    () => (config?.themes || []).find((theme) => theme.name === config?.activeThemeName) || config?.themes?.[0] || blankTheme,
    [config?.activeThemeName, config?.themes],
  );

  const applyLoadedConfig = useCallback((data) => {
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
        ...normalizeMasterSettings(data?.masterSettings),
      }
    };
    setConfig(next);
    applyPlatformConfigToCoreData(next);
    if (typeof onConfigLoaded === 'function') onConfigLoaded(next);
  }, [onConfigLoaded]);

  const load = useCallback(async () => {
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
  }, [applyLoadedConfig]);

  useEffect(() => { load(); }, [load]);

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

  const openMaintenanceDialog = () => {
    setMaintenanceDraft({
      startAt: toDateTimeLocalValue(config.masterSettings?.maintenanceStartAt || new Date()),
      endAt: toDateTimeLocalValue(config.masterSettings?.maintenanceEndAt || addHoursLocalValue(2)),
      message: config.masterSettings?.maintenanceMessage || '',
    });
    setMaintenanceOpen(true);
  };

  const handleScheduleMaintenance = async () => {
    const startAt = new Date(maintenanceDraft.startAt);
    const endAt = new Date(maintenanceDraft.endAt);

    if (!maintenanceDraft.startAt || Number.isNaN(startAt.getTime())) {
      setError('Maintenance start date and time are required.');
      return;
    }

    if (!maintenanceDraft.endAt || Number.isNaN(endAt.getTime())) {
      setError('Maintenance end date and time are required.');
      return;
    }

    if (endAt <= startAt) {
      setError('Maintenance end date and time must be after the start date and time.');
      return;
    }

    if (endAt <= new Date()) {
      setError('Maintenance end date and time must be in the future.');
      return;
    }

    await savePatch(
      {
        masterSettings: {
          ...config.masterSettings,
          maintenanceMode: true,
          maintenanceStartAt: startAt.toISOString(),
          maintenanceEndAt: endAt.toISOString(),
          maintenanceMessage: maintenanceDraft.message.trim(),
        },
      },
      'Maintenance window scheduled and users have been notified.'
    );
    setMaintenanceOpen(false);
  };

  const handleRestoreMaintenance = async () => {
    if (!window.confirm('Disable maintenance mode and notify users that services have been restored?')) return;

    await savePatch(
      {
        masterSettings: {
          ...config.masterSettings,
          maintenanceMode: false,
          maintenanceStartAt: null,
          maintenanceEndAt: null,
          maintenanceMessage: '',
        },
      },
      'Maintenance mode disabled and users have been notified.'
    );
  };

  const currentTabMeta = controlTabs[tab] || controlTabs[0];
  const maintenanceState = getMaintenanceUiState(config?.masterSettings);
  const stations = config?.stations || [];
  const departments = config?.departments || [];
  const notificationChannels = config?.notificationReminders?.channels || [];
  const workingDays = config?.attendancePolicy?.workingDays || [];
  const activePolicyCount = [
    !!config?.geofence?.enabled,
    ...policyToggleFields.map(({ key }) => config?.attendancePolicy?.[key] !== false),
  ].filter(Boolean).length;
  const enabledMasterControls = masterToggleFields.filter(({ key }) => !!config?.masterSettings?.[key]).length;
  const configuredMessageCount = messageTemplateFields.filter(({ key }) => !!config?.notificationReminders?.[key]).length;
  const dropdownListCount = Object.keys(dropdowns).length;
  const activeStations = stations.filter((station) => station.active !== false).length;

  const masterStats = [
    {
      label: 'Stations Online',
      value: `${activeStations}/${stations.length}`,
      detail: stations.length ? 'active duty locations' : 'no stations configured',
      icon: <LocationOnRounded fontSize="small" />,
      color: '#0A3D62',
    },
    {
      label: 'Departments',
      value: departments.length,
      detail: 'available for user records',
      icon: <WorkspacesRounded fontSize="small" />,
      color: '#00897B',
    },
    {
      label: 'Policy Controls',
      value: activePolicyCount,
      detail: 'attendance rules enabled',
      icon: <ShieldRounded fontSize="small" />,
      color: '#6A4C93',
    },
    {
      label: 'Message Templates',
      value: `${configuredMessageCount}/${messageTemplateFields.length}`,
      detail: `${notificationChannels.length || 0} delivery channel${notificationChannels.length === 1 ? '' : 's'}`,
      icon: <NotificationsActiveRounded fontSize="small" />,
      color: '#C2410C',
    },
  ];

  if (!config) {
    return (
      <Box sx={{ maxWidth: 1600, mx: 'auto', px: { xs: 1.5, sm: 3 }, py: 3 }}>
        <Paper elevation={0} sx={{ ...controlSurfaceSx, p: { xs: 3, sm: 4 } }}>
          <Stack spacing={2} alignItems="center" textAlign="center">
            <CircularProgress size={32} />
            <Box>
              <Typography variant="h6" fontWeight={900}>Loading Global Parameters</Typography>
              <Typography variant="body2" color="text.secondary">Preparing the master configuration panel.</Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 1600,
        mx: 'auto',
        px: { xs: 1.5, sm: 3 },
        py: 2,
        minHeight: '100%',
        background: 'linear-gradient(180deg, #f8fbfc 0%, #eef7f6 42%, #ffffff 100%)',
      }}
    >
      <Stack spacing={3}>
        <Paper
          elevation={0}
          sx={{
            ...controlSurfaceSx,
            p: { xs: 2, sm: 3 },
            overflow: 'hidden',
          }}
        >
          <Grid container spacing={2.5} alignItems="center">
            <Grid item xs={12} lg={7}>
              <Stack spacing={1.5}>
                <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
                  <Chip
                    size="small"
                    icon={<SettingsRounded />}
                    label="Master Control"
                    color="primary"
                    sx={{ borderRadius: 1.5, fontWeight: 900 }}
                  />
                  <Chip
                    size="small"
                    icon={maintenanceState.active || maintenanceState.scheduled ? <WarningAmberRounded /> : <CheckCircleRounded />}
                    label={maintenanceState.active ? 'Maintenance Active' : maintenanceState.scheduled ? 'Maintenance Scheduled' : 'System Live'}
                    color={maintenanceState.active ? 'warning' : maintenanceState.scheduled ? 'info' : 'success'}
                    variant="outlined"
                    sx={{ borderRadius: 1.5, fontWeight: 800, bgcolor: '#fff' }}
                  />
                  <Chip
                    size="small"
                    icon={<KeyRounded />}
                    label={`${enabledMasterControls}/${masterToggleFields.length} controls enabled`}
                    variant="outlined"
                    sx={{ borderRadius: 1.5, fontWeight: 800, bgcolor: '#fff' }}
                  />
                </Stack>

                <Box>
                  <Typography variant="h4" fontWeight={950} sx={{ lineHeight: 1.1, letterSpacing: 0 }}>
                    Platform Configuration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8, maxWidth: 760 }}>
                    Manage identity, attendance rules, locations, notifications, dropdowns, departments, and recovery backups from one control surface.
                  </Typography>
                </Box>

                <Stack direction="row" gap={1} flexWrap="wrap">
                  <Chip size="small" label={`Theme: ${activeTheme.name || 'Default'}`} variant="outlined" sx={{ borderRadius: 1.5, bgcolor: '#fff' }} />
                  <Chip size="small" label={`${workingDays.length} working days`} variant="outlined" sx={{ borderRadius: 1.5, bgcolor: '#fff' }} />
                  <Chip size="small" label={`${dropdownListCount} dropdown lists`} variant="outlined" sx={{ borderRadius: 1.5, bgcolor: '#fff' }} />
                </Stack>
              </Stack>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.2}
                justifyContent={{ xs: 'stretch', lg: 'flex-end' }}
              >
                <Button
                  variant="outlined"
                  startIcon={<SettingsBackupRestoreRounded />}
                  onClick={() => setBackupOpen(true)}
                  disabled={isLoading}
                  sx={{ minHeight: 44, borderRadius: 2 }}
                >
                  Backup
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<MenuBookRounded />}
                  onClick={() => setManualOpen(true)}
                  disabled={isLoading}
                  sx={{ minHeight: 44, borderRadius: 2 }}
                >
                  Message Manual
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<RestartAlt />}
                  onClick={() => resetConfig('all')}
                  disabled={isLoading}
                  sx={{ minHeight: 44, borderRadius: 2 }}
                >
                  Reset All
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Grid container spacing={1.5}>
                {masterStats.map((item) => (
                  <Grid item xs={12} sm={6} lg={3} key={item.label}>
                    <MetricTile {...item} />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
        {status && <Alert severity="success" onClose={() => setStatus('')}>{status}</Alert>}

        <Paper
          elevation={0}
          sx={{
            ...controlSurfaceSx,
            p: 0.75,
            position: { md: 'sticky' },
            top: { md: 12 },
            zIndex: 3,
          }}
        >
          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: 52,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': {
                minHeight: 48,
                borderRadius: 2,
                mx: 0.25,
                textTransform: 'none',
                fontWeight: 850,
              },
              '& .Mui-selected': {
                bgcolor: 'primary.main',
                color: '#fff !important',
                boxShadow: '0 8px 18px rgba(10,61,98,0.18)',
              },
            }}
          >
            {controlTabs.map((item) => (
              <Tab key={item.label} disabled={isLoading} icon={item.icon} iconPosition="start" label={item.label} />
            ))}
          </Tabs>
          <Divider sx={{ my: 0.75 }} />
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={1}
            sx={{ px: 1, pb: 0.75 }}
          >
            <Box>
              <Typography variant="subtitle2" fontWeight={900}>{currentTabMeta.label}</Typography>
              <Typography variant="caption" color="text.secondary">{currentTabMeta.description}</Typography>
            </Box>
            {isLoading && (
              <Chip
                size="small"
                icon={<CircularProgress size={14} color="inherit" />}
                label="Syncing"
                variant="outlined"
                sx={{ borderRadius: 1.5, fontWeight: 800 }}
              />
            )}
          </Stack>
        </Paper>

        {tab === 0 && <SuperAdminDashBoardTab />}

        {tab === 1 && (
          <Stack spacing={3}>
            <SectionHeading
              icon={<Palette />}
              title="Brand & System Access"
              description="Identity, visual profile, and global access controls that affect the full platform."
              action={<Chip label={`${config.themes?.length || 0} themes`} color="primary" variant="outlined" sx={{ borderRadius: 1.5, fontWeight: 800 }} />}
            />

            {/* Row 1: Identity & Logo Upload */}
            <Grid container spacing={3}>
              <Grid item xs={12} lg={7}>
                <Paper elevation={0} sx={cardSx}>
                  <SectionHeading icon={<Business />} title="Organization Identity" description="Primary naming and support details used across the system." />
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
                  <SectionHeading icon={<CloudUpload />} title="Platform Logo" description="Visible in navigation, reports, and branded account surfaces." />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                    <Box sx={{ height: 124, width: '100%', maxWidth: 240, borderRadius: 2, border: '1px dashed rgba(148,163,184,0.55)', display: 'grid', placeItems: 'center', p: 1.5, bgcolor: '#f8fbfc' }}>
                      {config.logoUrl ? <img src={config.logoUrl} alt="Logo preview" style={{ maxHeight: 90, maxWidth: '100%', objectFit: 'contain' }} /> : <Chip label="No Asset Set" variant="outlined" color="warning" />}
                    </Box>
                    <Button variant="contained" component="label" startIcon={<CloudUpload />} sx={{ minHeight: 48, textTransform: 'none', borderRadius: 2, width: { xs: '100%', sm: 'auto' } }}>
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
                  <SectionHeading icon={<Visibility />} title="Active Theme" description="Select the color profile currently applied to the platform." />
                  <TextField select label="Theme Profiles" value={config.activeThemeName || ''} onChange={(e) => handleThemeSelect(e.target.value)} fullWidth sx={{ mb: 2.5 }}>
                    {(config.themes || []).map((theme) => <MenuItem key={theme.name} value={theme.name}>{theme.name}</MenuItem>)}
                  </TextField>

                  {/* Real-time Theme Preview Card */}
                  <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: activeTheme.surfaceColor, border: '1px solid rgba(0,0,0,0.08)' }}>
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
                  <SectionHeading icon={<Palette />} title="Color Palette" description="Tune the active theme while previewing changes immediately." />
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
              <SectionHeading icon={<AddIcon />} title="Theme Builder" description="Create a named theme profile without overwriting existing saved themes." />
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
              <SectionHeading icon={<ShieldRounded />} title="Master Operational Controls" description="Security, session policy, audit logging, and scheduled platform maintenance." />

              <Box
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  mb: 2.5,
                  borderRadius: 2,
                  bgcolor: maintenanceState.active ? 'rgba(251,146,60,0.08)' : '#f8fbfc',
                  border: '1px solid',
                  borderColor: maintenanceState.active ? 'rgba(194,65,12,0.35)' : 'rgba(148,163,184,0.22)',
                }}
              >
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                    spacing={2}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: 2,
                          display: 'grid',
                          placeItems: 'center',
                          color: maintenanceState.active ? '#C2410C' : 'primary.main',
                          bgcolor: maintenanceState.active ? 'rgba(194,65,12,0.12)' : 'rgba(10,61,98,0.08)',
                        }}
                      >
                        <ConstructionRounded />
                      </Box>
                      <Box>
                        <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
                          <Typography variant="subtitle1" fontWeight={900}>Maintenance Window</Typography>
                          <Chip label={maintenanceState.label} color={maintenanceState.color} size="small" sx={{ borderRadius: 1.5, fontWeight: 900 }} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {maintenanceState.enabled
                            ? (config.masterSettings?.maintenanceMessage || 'Users will be redirected while the active maintenance window is running.')
                            : 'Schedule a controlled service window and notify all users automatically.'}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
                      <Button
                        variant="contained"
                        startIcon={<Schedule />}
                        onClick={openMaintenanceDialog}
                        disabled={isLoading}
                        sx={{ borderRadius: 2, minHeight: 44 }}
                      >
                        {maintenanceState.enabled ? 'Update Window' : 'Schedule'}
                      </Button>
                      {maintenanceState.enabled && (
                        <Button
                          variant="outlined"
                          color="success"
                          startIcon={<EventAvailableRounded />}
                          onClick={handleRestoreMaintenance}
                          disabled={isLoading}
                          sx={{ borderRadius: 2, minHeight: 44 }}
                        >
                          Restore Service
                        </Button>
                      )}
                    </Stack>
                  </Stack>

                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fff', border: '1px solid rgba(148,163,184,0.18)' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={800}>Starts</Typography>
                        <Typography variant="body2" fontWeight={900}>{formatDateTimeLabel(config.masterSettings?.maintenanceStartAt)}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fff', border: '1px solid rgba(148,163,184,0.18)' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={800}>Auto Restore</Typography>
                        <Typography variant="body2" fontWeight={900}>{formatDateTimeLabel(config.masterSettings?.maintenanceEndAt)}</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Stack>
              </Box>

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
                    value={config.masterSettings?.sessionTimeoutMinutes ?? 20}
                    onChange={(e) => updateSectionField('masterSettings', 'sessionTimeoutMinutes', Number(e.target.value))}
                    InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }}
                    fullWidth
                  />
                </Grid>
                {masterToggleFields.map(({ key, label }) => (
                  <Grid item xs={12} sm={6} md={4} key={key}>
                    <ToggleTile
                      checked={!!config.masterSettings?.[key]}
                      onChange={(e) => updateSectionField('masterSettings', key, e.target.checked)}
                      color="primary"
                      label={label}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>


            {/* Submit Actions Toolbar */}
            <Stack sx={actionBarSx} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-start">
              <Button disabled={isLoading} startIcon={<Save />} variant="contained" size="large" onClick={() => savePatch({ branding: config.branding, logoUrl: config.logoUrl, themes: config.themes, activeThemeName: config.activeThemeName, masterSettings: config.masterSettings }, 'Global profile layout saves applied.')} sx={{ minWidth: 200, borderRadius: 2 }}>Save System Parameters</Button>
              <Button disabled={isLoading} startIcon={<RestartAlt />} color="warning" variant="outlined" onClick={() => resetConfig('themes')} sx={{ borderRadius: 2 }}>Reset Palette Themes</Button>
              <Button disabled={isLoading} startIcon={<RestartAlt />} color="warning" variant="outlined" onClick={() => resetConfig('branding')} sx={{ borderRadius: 2 }}>Reset Branding Info</Button>
            </Stack>
          </Stack>
        )}

        {tab === 2 && (
          <Stack spacing={3}>
            <SectionHeading
              icon={<LocationOnRounded />}
              title="Station & Geofence Control"
              description="Maintain the official duty-station registry and the boundaries used by clocking checks."
              action={<Chip label={`${activeStations} active`} color="success" variant="outlined" sx={{ borderRadius: 1.5, fontWeight: 800 }} />}
            />

            <Paper elevation={0} sx={cardSx}>
              <SectionHeading icon={<AddIcon />} title="Register Duty Station" description="Add a new operational location with geofence coordinates." />
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3.5}><TextField label="Facility Station Location Name" value={newStation.name} onChange={(e) => setNewStation({ ...newStation, name: e.target.value })} fullWidth /></Grid>
                <Grid item xs={6} sm={4} md={2}><TextField label="Geographic Latitude" type="number" value={newStation.lat} onChange={(e) => setNewStation({ ...newStation, lat: e.target.value })} fullWidth /></Grid>
                <Grid item xs={6} sm={4} md={2}><TextField label="Geographic Longitude" type="number" value={newStation.lng} onChange={(e) => setNewStation({ ...newStation, lng: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12} sm={4} md={2.5}><TextField label="Geofence Radius Threshold" type="number" value={newStation.radiusMeters} onChange={(e) => setNewStation({ ...newStation, radiusMeters: e.target.value })} InputProps={{ endAdornment: <InputAdornment position="end">meters</InputAdornment> }} fullWidth /></Grid>
                <Grid item xs={12} md={2}><Button disabled={isLoading} variant="contained" startIcon={<AddIcon />} onClick={handleAddStation} fullWidth sx={{ minHeight: 54, borderRadius: 2 }}>Add Station</Button></Grid>
              </Grid>
            </Paper>

            <Paper elevation={0} sx={cardSx}>
              <SectionHeading icon={<Business />} title={`Configured Stations (${stations.length})`} description="Edit coordinates, radius limits, and active status for each location." />
              {stations.length === 0 ? (
                <EmptyState
                  icon={<LocationOnRounded />}
                  title="No Duty Stations Configured"
                  description="Add the first station above to enable location-aware attendance rules."
                />
              ) : (
                <Stack spacing={2} separator={<Divider />}>
                  {stations.map((station, index) => (
                    <Grid container spacing={2} key={`${station.name}-${index}`} alignItems="center">
                      <Grid item xs={12} sm={6} md={3}><TextField label="Station Area Name" value={station.name} onChange={(e) => updateStation(index, 'name', e.target.value)} fullWidth /></Grid>
                      <Grid item xs={6} sm={3} md={2}><TextField label="Lat Coord" type="number" value={station.lat} onChange={(e) => updateStation(index, 'lat', e.target.value)} fullWidth /></Grid>
                      <Grid item xs={6} sm={3} md={2}><TextField label="Lng Coord" type="number" value={station.lng} onChange={(e) => updateStation(index, 'lng', e.target.value)} fullWidth /></Grid>
                      <Grid item xs={12} sm={6} md={2}><TextField label="Boundary Perimeter" type="number" value={station.radiusMeters} onChange={(e) => updateStation(index, 'radiusMeters', e.target.value)} InputProps={{ endAdornment: <InputAdornment position="end">m</InputAdornment> }} fullWidth /></Grid>
                      <Grid item xs={8} sm={4} md={2}>
                        <ToggleTile
                          checked={station.active}
                          onChange={(e) => updateStation(index, 'active', e.target.checked)}
                          label="Active"
                        />
                      </Grid>
                      <Grid item xs={4} sm={2} md={1} textAlign="right">
                        <Tooltip title="Delete Location Entry" arrow>
                          <IconButton color="error" onClick={() => handleRemoveStation(station.name)}><DeleteIcon /></IconButton>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  ))}
                </Stack>
              )}
            </Paper>

            <Stack sx={actionBarSx} direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button disabled={isLoading} startIcon={<Save />} variant="contained" onClick={() => savePatch({ stations: config.stations }, 'Facility location roster metrics updated.')} sx={{ borderRadius: 2 }}>Save Changes</Button>
              <Button disabled={isLoading} startIcon={<RestartAlt />} color="warning" variant="outlined" onClick={() => resetConfig('stations')} sx={{ borderRadius: 2 }}>Reset Station Changes</Button>
            </Stack>
          </Stack>
        )}

        {tab === 3 && (
          <Stack spacing={3}>
            <SectionHeading
              icon={<AccessTimeRounded />}
              title="Attendance Policy"
              description="Clocking windows, geofence enforcement, reminders, and platform-generated messages."
              action={<Chip label={`${activePolicyCount} active rules`} color="primary" variant="outlined" sx={{ borderRadius: 1.5, fontWeight: 800 }} />}
            />

            {/* Section A: Core Shift Timing Constants */}
            <Paper elevation={0} sx={cardSx}>
              <SectionHeading icon={<Schedule />} title="Shift Timing Windows" description="Define the core workday, reminders, processing time, and work-hour thresholds." />
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
              <SectionHeading icon={<Tune />} title="Verification & Rule Enforcement" description="Control the checks that govern daily attendance capture." />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <ToggleTile
                    disabled={isLoading}
                    checked={!!config.geofence?.enabled}
                    onChange={(e) => updateSectionField('geofence', 'enabled', e.target.checked)}
                    label="Geofence Enforcement"
                  />
                </Grid>

                {policyToggleFields.map(({ key, label }) => (
                  <Grid item xs={12} sm={6} md={4} key={key}>
                    <ToggleTile
                      disabled={isLoading}
                      checked={config.attendancePolicy?.[key] !== false}
                      onChange={(e) => updateSectionField('attendancePolicy', key, e.target.checked)}
                      label={label}
                    />
                  </Grid>
                ))}

                <Grid item xs={12}>
                  <Stack
                    direction="row"
                    gap={1}
                    flexWrap="wrap"
                    alignItems="center"
                    sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(148,163,184,0.18)', bgcolor: '#f8fbfc' }}
                  >
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
              <SectionHeading icon={<NotificationsActiveRounded />} title="Notification Timing & Channels" description="Set reminder thresholds and the channels used for platform communication." />
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
              <SectionHeading
                icon={<MessageRounded />}
                title="Message Templates"
                description="Manage the text used for registration, clocking, leave, status, and expiry communication."
                action={(
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<MenuBookRounded />}
                    onClick={() => setManualOpen(true)}
                    sx={{ borderRadius: 2 }}
                  >
                    Parameters
                  </Button>
                )}
              />
              <Grid container spacing={2.5}>
                {messageTemplateFields.map(({ key, label, helper }) => (
                  <Grid item xs={12} md={6} key={key}>
                    <TextField
                      label={label}
                      multiline
                      minRows={3}
                      value={config.notificationReminders?.[key] || ''}
                      onChange={(e) => updateSectionField('notificationReminders', key, e.target.value)}
                      helperText={`${helper} {siteLink}`}
                      fullWidth
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Form Control Persist Actions Footer */}
            <Stack sx={actionBarSx} direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
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
                sx={{ minWidth: 240, borderRadius: 2 }}
              >
                Save Shift Parameters
              </Button>
              <Button
                disabled={isLoading}
                startIcon={<RestartAlt />}
                color="warning"
                variant="outlined"
                onClick={() => resetConfig('attendancePolicy')}
                sx={{ borderRadius: 2 }}
              >
                Reset Attendance Policy
              </Button>
              <Button
                disabled={isLoading}
                startIcon={<RestartAlt />}
                color="warning"
                variant="outlined"
                onClick={() => resetConfig('notificationReminders')}
                sx={{ borderRadius: 2 }}
              >
                Reset Messages
              </Button>
            </Stack>
          </Stack>
        )}

        {tab === 4 && (
          <Paper elevation={0} sx={cardSx}>
            <SectionHeading
              icon={<Inventory2Rounded />}
              title="System Selection Lists"
              description="Maintain controlled values used by registration, leave, and attendance forms."
              action={<Chip label={`${dropdownListCount} lists`} color="primary" variant="outlined" sx={{ borderRadius: 1.5, fontWeight: 800 }} />}
            />
            <Stack spacing={3}>
              <TextField select label="Target Custom Roster Dropdown" value={dropdownKey} onChange={(e) => setDropdownKey(e.target.value)} sx={{ maxWidth: 400 }}>
                {Object.keys(dropdowns).map((key) => <MenuItem key={key} value={key}>{key}</MenuItem>)}
              </TextField>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Append New Row Entry Value" value={dropdownDraft} onChange={(e) => setDropdownDraft(e.target.value)} fullWidth />
                <Button disabled={isLoading} variant="outlined" startIcon={<AddIcon />} onClick={handleAddDropdownValue} sx={{ minWidth: 120, minHeight: 54, borderRadius: 2 }}>Append</Button>
              </Stack>

              <Box sx={{ p: 2, minHeight: 96, borderRadius: 2, border: '1px solid rgba(148,163,184,0.18)', bgcolor: '#f8fbfc' }}>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {selectedDropdownValues.length === 0 ? (
                    <EmptyState
                      icon={<Inventory2Rounded />}
                      title="No Values In This List"
                      description="Append a value above or paste a valid JSON payload below."
                    />
                  ) : selectedDropdownValues.map((value) => (
                    <Chip key={value} label={value} color="primary" variant="outlined" onDelete={() => handleRemoveDropdownValue(value)} sx={{ borderRadius: 1.5 }} />
                  ))}
                </Stack>
              </Box>

              <TextField
                label="Structured Advanced JSON Payload Editor"
                multiline
                minRows={6}
                value={JSON.stringify(dropdowns, null, 2)}
                InputProps={{
                  sx: {
                    fontFamily: 'monospace',
                    fontSize: 13,
                    alignItems: 'flex-start',
                  },
                }}
                onChange={(e) => {
                  try {
                    setConfig({ ...config, dropdowns: JSON.parse(e.target.value) });
                  } catch {
                    setError('Malformed payload script validation failure.');
                  }
                }}
                fullWidth
              />

              <Stack sx={actionBarSx} direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button disabled={isLoading} startIcon={<Save />} variant="contained" onClick={() => savePatch({ dropdowns: config.dropdowns }, 'Selection dataset attributes updated globally.')} sx={{ borderRadius: 2 }}>Save Dropdown Attributes</Button>
                <Button disabled={isLoading} startIcon={<RestartAlt />} color="warning" variant="outlined" onClick={() => resetConfig('dropdowns')} sx={{ borderRadius: 2 }}>Reset Lists to Base</Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {tab === 5 && (
          <Paper elevation={0} sx={cardSx}>
            <SectionHeading
              icon={<WorkspacesRounded />}
              title="Department Directory"
              description="Manage the official departments available for staff, interns, attachés, and supervisors."
              action={<Chip label={`${departments.length} departments`} color="primary" variant="outlined" sx={{ borderRadius: 1.5, fontWeight: 800 }} />}
            />
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Add Organizational Department" value={newDept} onChange={(e) => setNewDept(e.target.value)} fullWidth />
                <Button disabled={isLoading} variant="contained" startIcon={<AddIcon />} onClick={handleAddDept} sx={{ minWidth: 160, minHeight: 54, borderRadius: 2 }}>Add</Button>
              </Stack>

              <Paper variant="outlined" sx={{ borderRadius: 2, maxHeight: 450, overflow: 'auto', p: 1, bgcolor: '#f8fbfc' }}>
                {departments.length === 0 ? (
                  <EmptyState
                    icon={<WorkspacesRounded />}
                    title="No Departments Configured"
                    description="Add a department above to make it available during registration and profile edits."
                  />
                ) : (
                  <List dense>
                    {departments.map((department) => (
                      <ListItem
                        key={department}
                        secondaryAction={(
                          <Tooltip title="Remove department" arrow>
                            <IconButton edge="end" color="error" onClick={() => handleRemoveDept(department)}><DeleteIcon /></IconButton>
                          </Tooltip>
                        )}
                        sx={{
                          borderRadius: 1.5,
                          mb: 0.5,
                          bgcolor: '#fff',
                          border: '1px solid rgba(148,163,184,0.16)',
                        }}
                      >
                        <ListItemText primary={department} primaryTypographyProps={{ fontWeight: 800 }} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>

              <Box sx={actionBarSx}>
                <Button disabled={isLoading} startIcon={<RestartAlt />} color="warning" variant="outlined" onClick={() => resetConfig('departments')} sx={{ borderRadius: 2 }}>Reset Departments</Button>
              </Box>
            </Stack>
          </Paper>
        )}

        <Dialog
          open={maintenanceOpen}
          onClose={() => setMaintenanceOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 2,
              border: '1px solid rgba(148,163,184,0.22)',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ConstructionRounded color="warning" /> Schedule Maintenance
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                During the active window, regular users will be redirected to the maintenance page. Superadmin access remains available for recovery and control.
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Start Date & Time"
                    type="datetime-local"
                    value={maintenanceDraft.startAt}
                    onChange={(e) => setMaintenanceDraft((prev) => ({ ...prev, startAt: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="End Date & Time"
                    type="datetime-local"
                    value={maintenanceDraft.endAt}
                    onChange={(e) => setMaintenanceDraft((prev) => ({ ...prev, endAt: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
              </Grid>
              <TextField
                label="Maintenance Notice"
                multiline
                minRows={4}
                value={maintenanceDraft.message}
                onChange={(e) => setMaintenanceDraft((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Example: KMFRI Attendance is undergoing scheduled service maintenance. Please be patient while the ICT team completes the work."
                helperText="This message appears on the maintenance page and is sent to users with the configured maintenance template."
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setMaintenanceOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              onClick={handleScheduleMaintenance}
              variant="contained"
              color="warning"
              startIcon={<Schedule />}
              disabled={isLoading}
              sx={{ borderRadius: 2 }}
            >
              Activate Schedule
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={backupOpen}
          onClose={() => setBackupOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 2,
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
              borderRadius: 2,
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
                Use these parameters inside message templates. The system replaces them automatically when sending clocking, leave, account, device, and registration messages. Add {'{siteLink}'} when you want the deployed site URL to appear as a clickable SMS link.
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

      </Stack>
    </Box>
  );
};

export default ConfigPanel;
