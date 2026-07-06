import {
  Add as AddIcon,
  AdminPanelSettings,
  Business,
  CloudUpload,
  Delete as DeleteIcon,
  Email,
  HomeRounded,
  Palette,
  Phone,
  RestartAlt,
  Save,
  Schedule,
  Tune,
  Visibility
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
      masterSettings: data?.masterSettings || {
        allowEmployeeSelfRegistration: false,
        maintenanceMode: false,
        requirePasswordResetOnFirstLogin: false,
        maxDevicesPerUser: 2
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
              <Grid container spacing={3} alignItems="center">

                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={<Switch checked={config.masterSettings?.maintenanceMode || false} onChange={(e) => setConfig({ ...config, masterSettings: { ...config.masterSettings, maintenanceMode: e.target.checked } })} color="error" />}
                    label="Maintenance Shield Mode"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">Restrict regular accounts from accessing system interfaces.</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={<Switch checked={config.masterSettings?.requirePasswordResetOnFirstLogin || false} onChange={(e) => setConfig({ ...config, masterSettings: { ...config.masterSettings, requirePasswordResetOnFirstLogin: e.target.checked } })} />}
                    label="Force Initial Credentials Reset"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">Compel password validation changes on initial system login cycles.</Typography>
                </Grid>

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

                {/* GLOBAL GEOFECE RADIUS */}
                {/* <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Global Geofence Radius"
                    type="number"
                    value={config.geofence?.radiusMeters ?? 500}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      geofence: { ...(prev.geofence || {}), radiusMeters: Number(e.target.value) }
                    }))}
                    InputProps={{ endAdornment: <InputAdornment position="end">m</InputAdornment> }}
                    fullWidth
                  />
                </Grid> */}
              </Grid>
            </Paper>

            {/* Section B: Policy & Enforcement Toggles */}
            <Paper elevation={0} sx={cardSx}>
              <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tune color="primary" /> Verification Policies & System Rule Enforcement
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.05)', height: '100%' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          disabled={isLoading}
                          checked={!!config.geofence?.enabled}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            geofence: { ...(prev.geofence || {}), enabled: e.target.checked }
                          }))}
                        />
                      }
                      label={<Typography fontWeight={700}>Geofence Enforcement</Typography>}
                    />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, pl: 4 }}>
                      Restrict check-ins exclusively to verified coordinates.
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.05)', height: '100%' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          disabled={isLoading}
                          checked={!!config.attendancePolicy?.allowClockOutsideStation}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            attendancePolicy: { ...(prev.attendancePolicy || {}), allowClockOutsideStation: e.target.checked }
                          }))}
                        />
                      }
                      label={<Typography fontWeight={700}>Allow Remote Clocking</Typography>}
                    />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, pl: 4 }}>
                      Permit trusted staff to record attendance out of office.
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.05)', height: '100%' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          disabled={isLoading}
                          checked={config.attendancePolicy?.requireBiometricVerification !== false}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            attendancePolicy: { ...(prev.attendancePolicy || {}), requireBiometricVerification: e.target.checked }
                          }))}
                        />
                      }
                      label={<Typography fontWeight={700}>Biometric Security Check</Typography>}
                    />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, pl: 4 }}>
                      Require secondary face or fingerprint hardware authorization.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Section C: Automated Reminders & Alerts */}
            <Paper elevation={0} sx={cardSx}>
              <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AdminPanelSettings color="primary" /> Automated Dispatch Notifications
              </Typography>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Clock-In Reminder Threshold"
                    type="number"
                    value={config.notificationReminders?.clockInReminderMinutes ?? 15}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      notificationReminders: { ...(prev.notificationReminders || {}), clockInReminderMinutes: Number(e.target.value) }
                    }))}
                    InputProps={{ endAdornment: <InputAdornment position="end">mins prior</InputAdornment> }}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Clock-In Push Message Template"
                    multiline
                    minRows={3}
                    value={config.notificationReminders?.clockInMessage || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      notificationReminders: { ...(prev.notificationReminders || {}), clockInMessage: e.target.value }
                    }))}
                    helperText="Dynamic variables: {firstName}"
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Clock-Out Reminder Threshold"
                    type="number"
                    value={config.notificationReminders?.clockOutReminderMinutes ?? 15}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      notificationReminders: { ...(prev.notificationReminders || {}), clockOutReminderMinutes: Number(e.target.value) }
                    }))}
                    InputProps={{ endAdornment: <InputAdornment position="end">mins prior</InputAdornment> }}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Clock-Out Push Message Template"
                    multiline
                    minRows={3}
                    value={config.notificationReminders?.clockOutMessage || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      notificationReminders: { ...(prev.notificationReminders || {}), clockOutMessage: e.target.value }
                    }))}
                    helperText="Dynamic variables: {firstName}"
                    fullWidth
                  />
                </Grid>
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
                Reset to Default Values
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
                  {(config.departments || []).map((department,idx) => (
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

        {/* Global Reset Float Trigger Button */}
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