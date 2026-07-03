import {
  Add as AddIcon,
  Business,
  Delete as DeleteIcon,
  HomeRounded,
  Palette,
  RestartAlt,
  Save,
  Schedule,
  Tune,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
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
  p: 3,
  background:
    "rgba(255,255,255,.72)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,.25)",
  boxShadow:
    "0 15px 40px rgba(15,23,42,.08)"
};

const paletteFields = [
  { field: 'primaryColor', label: 'Primary brand color', helper: 'Navigation, main headers, and dominant brand surfaces.' },
  { field: 'secondaryColor', label: 'Secondary brand color', helper: 'Buttons, links, focused controls, and supporting accents.' },
  { field: 'accentColor', label: 'Accent highlight color', helper: 'Selections, success accents, chips, and active states.' },
  { field: 'surfaceColor', label: 'Page surface color', helper: 'Dashboard shell and light content background.' },
  { field: 'textColor', label: 'Primary text color', helper: 'Main readable text on light surfaces.' },
];

const themePreviewSx = (theme) => ({
  minHeight: 108,
  borderRadius: 2,
  border: '1px solid rgba(148,163,184,0.22)',
  background: `linear-gradient(135deg, ${theme.primaryColor || '#0A3D62'} 0%, ${theme.secondaryColor || '#005B96'} 58%, ${theme.accentColor || '#48C9B0'} 100%)`,
  color: '#fff',
  p: 2,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
});

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
      await load();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || 'Save failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resetConfig = async (section = 'all') => {
    try {
      setError('');
      setIsLoading(true)
      const data = await SuperadminAPI.resetPlatformConfig(section);
      applyLoadedConfig(data);
      setStatus(section === 'all' ? 'All configuration reset to defaults' : `${section} reset to defaults`);
      await load();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || 'Reset failed');
    } finally {
      setIsLoading(false)
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
      setIsLoading(false)
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
      setIsLoading(false)
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
      primaryColor: newTheme.primaryColor || config.branding?.primaryColor || '#0A3D62',
      secondaryColor: newTheme.secondaryColor || config.branding?.secondaryColor || '#005B96',
      accentColor: newTheme.accentColor || config.branding?.accentColor || '#48C9B0',
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

  if (!config) return <Typography>Loading configuration...</Typography>;

  return (
    <Box
      sx={{
        maxWidth: 1700,
        mx: "auto",
        px: {
          xs: 1,
          sm: 2,
          md: 3,
        },
        py: 2,
      }}
    >
      <Stack spacing={2}>
        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
        {status && <Alert severity="success" onClose={() => setStatus('')}>{status}</Alert>}

        {/* tabs */}
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={'center'} justifyContent="space-around" spacing={1}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab disabled={isLoading} icon={<HomeRounded />} iconPosition="start" label="Dashboard" />
            <Tab disabled={isLoading} icon={<Palette />} iconPosition="start" label="Branding" />
            <Tab disabled={isLoading} icon={<Business />} iconPosition="start" label="Stations" />
            <Tab disabled={isLoading} icon={<Schedule />} iconPosition="start" label="Attendance" />
            <Tab disabled={isLoading} icon={<Tune />} iconPosition="start" label="Dropdowns" />
            <Tab disabled={isLoading} label="Departments" />
          </Tabs>
        </Stack>

        <Divider />

        {tab === 0 && (
          <SuperAdminDashBoardTab />
        )}

        {tab === 1 && (
          <Stack spacing={2.5}>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={7}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(148,163,184,0.2)' }}>
                  <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1.5 }}>Organization identity</Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={8}>
                      <TextField label="Organization name" value={config.branding?.organizationName || ''} onChange={(e) => setConfig({ ...config, branding: { ...config.branding, organizationName: e.target.value } })} fullWidth />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField label="Short display name" value={config.branding?.shortName || ''} onChange={(e) => setConfig({ ...config, branding: { ...config.branding, shortName: e.target.value } })} fullWidth />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Support email" value={config.branding?.supportEmail || ''} onChange={(e) => setConfig({ ...config, branding: { ...config.branding, supportEmail: e.target.value } })} fullWidth />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Support phone" value={config.branding?.supportPhone || ''} onChange={(e) => setConfig({ ...config, branding: { ...config.branding, supportPhone: e.target.value } })} fullWidth />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              <Grid item xs={12} lg={5}>
                <Paper elevation={0} sx={{ p: 2, height: '100%', borderRadius: 2, border: '1px solid rgba(148,163,184,0.2)' }}>
                  <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1.5 }}>Logo</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <Box sx={{ minHeight: 92, minWidth: 160, borderRadius: 2, border: '1px dashed rgba(148,163,184,0.5)', display: 'grid', placeItems: 'center', p: 1 }}>
                      {config.logoUrl ? <img src={config.logoUrl} alt="KMFRI logo" style={{ maxHeight: 74, maxWidth: 180, objectFit: 'contain' }} /> : <Chip label="No logo set" />}
                    </Box>
                    <Button variant="outlined" component="label" sx={{ minHeight: 48, textTransform: 'none' }}>
                      Upload Logo
                      <input hidden accept="image/*" type="file" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => savePatch({ logoUrl: reader.result }, 'Logo updated');
                        reader.readAsDataURL(file);
                      }} />
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 2, height: '100%', borderRadius: 2, border: '1px solid rgba(148,163,184,0.2)' }}>
                  <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1.5 }}>Selected theme</Typography>
                  <TextField select label="Theme name" value={config.activeThemeName || ''} onChange={(e) => handleThemeSelect(e.target.value)} fullWidth sx={{ mb: 1.5 }}>
                    {(config.themes || []).map((theme) => <MenuItem key={theme.name} value={theme.name}>{theme.name}</MenuItem>)}
                  </TextField>
                  <Box sx={themePreviewSx(activeTheme)}>
                    <Typography fontWeight={900}>{activeTheme?.name || 'Theme preview'}</Typography>
                    <Stack direction="row" spacing={1}>
                      {['primaryColor', 'secondaryColor', 'accentColor'].map((field) => (
                        <Box key={field} sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: activeTheme?.[field], border: '2px solid rgba(255,255,255,0.7)' }} />
                      ))}
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={8}>
                <Paper elevation={0} sx={{ p: 2, height: '100%', borderRadius: 2, border: '1px solid rgba(148,163,184,0.2)' }}>
                  <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1.5 }}>Color palette roles</Typography>
                  <Grid container spacing={1.5}>
                    {paletteFields.map(({ field, label, helper }) => (
                      <Grid item xs={12} sm={6} lg={field === 'textColor' ? 4 : 6} key={field}>
                        <TextField
                          label={label}
                          disabled={isLoading}
                          type="color"
                          value={activeTheme?.[field] || config.branding?.[field] || '#0A3D62'}
                          onChange={(e) => updateActiveTheme(field, e.target.value)}
                          helperText={helper}
                          fullWidth
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(148,163,184,0.2)' }}>
              <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1.5 }}>Create new theme</Typography>
              <Grid container spacing={1.5} alignItems="center">
                <Grid item xs={12} md={4}><TextField label="New theme name" value={newTheme.name} onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })} fullWidth /></Grid>
                {paletteFields.slice(0, 3).map(({ field, label }) => (
                  <Grid item xs={12} sm={4} md={2} key={field}>
                    <TextField type="color" label={label} value={newTheme[field]} onChange={(e) => setNewTheme({ ...newTheme, [field]: e.target.value })} fullWidth />
                  </Grid>
                ))}
                <Grid item xs={12} md={2}><Button disabled={isLoading} startIcon={<AddIcon />} variant="outlined" onClick={handleCreateTheme} fullWidth sx={{ minHeight: 56 }}>Create</Button></Grid>
              </Grid>
            </Paper>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button disabled={isLoading} startIcon={<Save />} variant="contained" onClick={() => savePatch({ branding: config.branding, logoUrl: config.logoUrl, themes: config.themes, activeThemeName: config.activeThemeName }, 'Branding and theme saved')}>Save branding/theme</Button>
              <Button disabled={isLoading} startIcon={<RestartAlt />} color="warning" variant="outlined" onClick={() => resetConfig('themes')}>Reset themes</Button>
              <Button disabled={isLoading} startIcon={<RestartAlt />} color="warning" variant="outlined" onClick={() => resetConfig('branding')}>Reset branding</Button>
            </Stack>
          </Stack>
        )}

        {tab === 2 && (
          <Stack spacing={2}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={3}><TextField label="Station name" value={newStation.name} onChange={(e) => setNewStation({ ...newStation, name: e.target.value })} fullWidth /></Grid>
              <Grid item xs={6} md={2}><TextField label="Latitude" type="number" value={newStation.lat} onChange={(e) => setNewStation({ ...newStation, lat: e.target.value })} fullWidth /></Grid>
              <Grid item xs={6} md={2}><TextField label="Longitude" type="number" value={newStation.lng} onChange={(e) => setNewStation({ ...newStation, lng: e.target.value })} fullWidth /></Grid>
              <Grid item xs={6} md={2}><TextField label="Radius meters" type="number" value={newStation.radiusMeters} onChange={(e) => setNewStation({ ...newStation, radiusMeters: e.target.value })} fullWidth /></Grid>
              <Grid item xs={6} md={3}><Button disabled={isLoading} variant="contained" startIcon={<AddIcon />} onClick={handleAddStation} fullWidth sx={{ height: 56 }}>Add station</Button></Grid>
            </Grid>

            {(config.stations || []).map((station, index) => (
              <Grid container spacing={1.5} key={`${station.name}-${index}`} alignItems="center">
                <Grid item xs={12} md={3}><TextField label="Name" value={station.name} onChange={(e) => updateStation(index, 'name', e.target.value)} fullWidth /></Grid>
                <Grid item xs={6} md={2}><TextField label="Lat" type="number" value={station.lat} onChange={(e) => updateStation(index, 'lat', e.target.value)} fullWidth /></Grid>
                <Grid item xs={6} md={2}><TextField label="Lng" type="number" value={station.lng} onChange={(e) => updateStation(index, 'lng', e.target.value)} fullWidth /></Grid>
                <Grid item xs={6} md={2}><TextField label="Radius" type="number" value={station.radiusMeters} onChange={(e) => updateStation(index, 'radiusMeters', e.target.value)} fullWidth /></Grid>
                <Grid item xs={4} md={2}><FormControlLabel control={<Switch checked={station.active} onChange={(e) => updateStation(index, 'active', e.target.checked)} />} label="Active" /></Grid>
                <Grid item xs={2} md={1}>
                  <Tooltip title="Remove station">
                    <IconButton color="error" onClick={() => handleRemoveStation(station.name)}><DeleteIcon /></IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            ))}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button disabled={isLoading} startIcon={<Save />} variant="contained" onClick={() => savePatch({ stations: config.stations }, 'Stations saved')}>Save stations</Button>
              <Button disabled={isLoading} startIcon={<RestartAlt />} color="warning" variant="outlined" onClick={() => resetConfig('stations')}>Reset stations</Button>
            </Stack>
          </Stack>
        )}

        {tab === 3 && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><TextField label="Clock-in time" type="time" value={config.attendancePolicy?.standardClockIn || '08:00'} onChange={(e) => setConfig({ ...config, attendancePolicy: { ...config.attendancePolicy, standardClockIn: e.target.value } })} fullWidth /></Grid>
            <Grid item xs={12} md={3}><TextField label="Clock-out time" type="time" value={config.attendancePolicy?.standardClockOut || '17:00'} onChange={(e) => setConfig({ ...config, attendancePolicy: { ...config.attendancePolicy, standardClockOut: e.target.value } })} fullWidth /></Grid>
            <Grid item xs={12} md={3}><TextField label="Grace period" type="number" value={config.attendancePolicy?.gracePeriodMinutes || 0} onChange={(e) => setConfig({ ...config, attendancePolicy: { ...config.attendancePolicy, gracePeriodMinutes: Number(e.target.value) } })} InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }} fullWidth /></Grid>
            <Grid item xs={12} md={3}><TextField label="Default geofence radius" type="number" value={config.geofence?.radiusMeters || 100} onChange={(e) => setConfig({ ...config, geofence: { ...config.geofence, radiusMeters: Number(e.target.value) } })} InputProps={{ endAdornment: <InputAdornment position="end">m</InputAdornment> }} fullWidth /></Grid>
            <Grid item xs={12} md={4}><FormControlLabel control={<Switch disabled={isLoading} checked={config.geofence?.enabled || false} onChange={(e) => setConfig({ ...config, geofence: { ...config.geofence, enabled: e.target.checked } })} />} label="Enable geofence enforcement" /></Grid>
            <Grid item xs={12} md={4}><FormControlLabel control={<Switch disabled={isLoading} checked={config.attendancePolicy?.allowClockOutsideStation || false} onChange={(e) => setConfig({ ...config, attendancePolicy: { ...config.attendancePolicy, allowClockOutsideStation: e.target.checked } })} />} label="Allow clocking outside station" /></Grid>
            <Grid item xs={12} md={4}><FormControlLabel control={<Switch disabled={isLoading} checked={config.attendancePolicy?.requireBiometricVerification !== false} onChange={(e) => setConfig({ ...config, attendancePolicy: { ...config.attendancePolicy, requireBiometricVerification: e.target.checked } })} />} label="Require biometric verification" /></Grid>
            <Grid item xs={12} md={6}><TextField label="Clock-in reminder" type="number" value={config.notificationReminders?.clockInReminderMinutes || 0} onChange={(e) => setConfig({ ...config, notificationReminders: { ...config.notificationReminders, clockInReminderMinutes: Number(e.target.value) } })} InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }} fullWidth /></Grid>
            <Grid item xs={12} md={6}><TextField label="Clock-out reminder" type="number" value={config.notificationReminders?.clockOutReminderMinutes || 0} onChange={(e) => setConfig({ ...config, notificationReminders: { ...config.notificationReminders, clockOutReminderMinutes: Number(e.target.value) } })} InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }} fullWidth /></Grid>
            <Grid item xs={12} md={6}><TextField label="Clock-in message template" multiline minRows={3} value={config.notificationReminders?.clockInMessage || ''} onChange={(e) => setConfig({ ...config, notificationReminders: { ...config.notificationReminders, clockInMessage: e.target.value } })} fullWidth /></Grid>
            <Grid item xs={12} md={6}><TextField label="Clock-out message template" multiline minRows={3} value={config.notificationReminders?.clockOutMessage || ''} onChange={(e) => setConfig({ ...config, notificationReminders: { ...config.notificationReminders, clockOutMessage: e.target.value } })} fullWidth /></Grid>
            <Grid item xs={12}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button disabled={isLoading} startIcon={<Save />} variant="contained" onClick={() => savePatch({ attendancePolicy: config.attendancePolicy, geofence: config.geofence, notificationReminders: config.notificationReminders }, 'Attendance settings saved')}>Save attendance settings</Button>
                <Button disabled={isLoading} startIcon={<RestartAlt />} color="warning" variant="outlined" onClick={() => resetConfig('attendancePolicy')}>Reset attendance</Button>
                <Button disabled={isLoading} startIcon={<RestartAlt />} color="warning" variant="outlined" onClick={() => resetConfig('notificationReminders')}>Reset reminders</Button>
              </Stack>
            </Grid>
          </Grid>
        )}

        {tab === 4 && (
          <Stack spacing={2}>
            <TextField select label="Dropdown list" value={dropdownKey} onChange={(e) => setDropdownKey(e.target.value)} sx={{ maxWidth: 360 }}>
              {Object.keys(dropdowns).map((key) => <MenuItem key={key} value={key}>{key}</MenuItem>)}
            </TextField>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField label="New dropdown value" value={dropdownDraft} onChange={(e) => setDropdownDraft(e.target.value)} fullWidth />
              <Button disabled={isLoading} variant="outlined" startIcon={<AddIcon />} onClick={handleAddDropdownValue}>Add</Button>
            </Stack>
            <Stack direction="row" gap={1} flexWrap="wrap">
              {selectedDropdownValues.map((value) => (
                <Chip key={value} label={value} onDelete={() => handleRemoveDropdownValue(value)} />
              ))}
            </Stack>
            <TextField
              label="Advanced JSON editor"
              multiline
              minRows={5}
              value={JSON.stringify(dropdowns, null, 2)}
              onChange={(e) => {
                try {
                  setConfig({ ...config, dropdowns: JSON.parse(e.target.value) });
                } catch (err) {
                  setError('JSON is not valid yet');
                }
              }}
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button disabled={isLoading} startIcon={<Save />} variant="contained" onClick={() => savePatch({ dropdowns: config.dropdowns }, 'Dropdown settings saved')}>Save dropdowns</Button>
              <Button disabled={isLoading} startIcon={<RestartAlt />} color="warning" variant="outlined" onClick={() => resetConfig('dropdowns')}>Reset dropdowns</Button>
            </Stack>
          </Stack>
        )}

        {tab === 5 && (
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField label="New department" value={newDept} onChange={(e) => setNewDept(e.target.value)} fullWidth />
              <Button disabled={isLoading} variant="contained" startIcon={<AddIcon />} onClick={handleAddDept}>Add</Button>
            </Stack>
            <List dense>
              {(config.departments || []).map((department) => (
                <ListItem key={department} secondaryAction={<IconButton edge="end" color="error" onClick={() => handleRemoveDept(department)}><DeleteIcon /></IconButton>}>
                  <ListItemText primary={department} />
                </ListItem>
              ))}
            </List>
            <Button disabled={isLoading} startIcon={<RestartAlt />} color="warning" variant="outlined" onClick={() => resetConfig('departments')}>Reset departments</Button>
          </Stack>
        )}


        {/* floating action button visible across tabs and fixed even when scrolling */}
        <Tooltip title="Reset all configurations" placement="left">
          <Fab
            color="error"
            aria-label="reset"
            size='medium'
            onClick={() => resetConfig('all')}
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 10,
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
