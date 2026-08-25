import {
  AddRounded,
  CalendarMonthRounded,
  DeleteRounded,
  EventAvailableRounded,
  InfoOutlined,
  NotesRounded,
  RepeatRounded,
  RestartAltRounded,
  TodayRounded,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import SuperadminAPI from '../../service/SuperadminService';
import coreDataDetails from '../CoreDataDetails';

const { colorPalette } = coreDataDetails;

const kenyaHolidayOptions = [
  { name: "New Year's Day", recurring: true, hint: 'Fixed public holiday observed on 1 January.' },
  { name: 'Good Friday', recurring: false, hint: 'Movable Easter holiday. Confirm the yearly date before saving.' },
  { name: 'Easter Monday', recurring: false, hint: 'Movable Easter holiday. Confirm the yearly date before saving.' },
  { name: 'Idd-ul-Fitr', recurring: false, hint: 'Movable holiday. Confirm the official gazetted date before saving.' },
  { name: 'Labour Day', recurring: true, hint: 'Fixed public holiday observed on 1 May.' },
  { name: 'Madaraka Day', recurring: true, hint: 'Fixed public holiday observed on 1 June.' },
  { name: 'Idd-ul-Adha', recurring: false, hint: 'Movable holiday. Confirm the official gazetted date before saving.' },
  { name: 'Mazingira Day', recurring: true, hint: 'Fixed public holiday observed on 10 October.' },
  { name: 'Mashujaa Day', recurring: true, hint: 'Fixed public holiday observed on 20 October.' },
  { name: 'Jamhuri Day', recurring: true, hint: 'Fixed public holiday observed on 12 December.' },
  { name: 'Christmas Day', recurring: true, hint: 'Fixed public holiday observed on 25 December.' },
  { name: 'Boxing Day', recurring: true, hint: 'Fixed public holiday observed on 26 December.' },
  { name: 'Other', recurring: false, hint: 'Use this for a gazetted one-off, observed, or institution-specific holiday.' },
];

const todayKey = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Nairobi',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

const formatDateKey = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const formatReadableDate = (value) => {
  const key = formatDateKey(value);
  if (!key) return 'Not set';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${key}T00:00:00+03:00`));
};

const cardSx = {
  borderRadius: 2,
  border: '1px solid rgba(148,163,184,0.20)',
  bgcolor: '#fff',
  boxShadow: '0 14px 34px rgba(15,23,42,0.06)',
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: '#fff',
  },
  '& .MuiInputLabel-root': {
    fontWeight: 800,
  },
};

const emptyDraft = {
  name: "New Year's Day",
  customName: '',
  date: todayKey(),
  recurring: true,
  description: '',
};

const getHolidaySortTime = (holiday) => {
  const key = formatDateKey(holiday?.date);
  const today = new Date(`${todayKey()}T00:00:00+03:00`);
  const date = new Date(`${key}T00:00:00+03:00`);

  if (Number.isNaN(date.getTime())) return Number.MAX_SAFE_INTEGER;

  if (holiday?.recurring) {
    date.setFullYear(today.getFullYear());
    if (date < today) date.setFullYear(today.getFullYear() + 1);
  }

  return date.getTime();
};

const HolidayCard = ({ holiday, readOnly, saving, onRemove }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: 2,
      border: '1px solid rgba(148,163,184,0.20)',
      bgcolor: holiday.active === false ? '#f8fafc' : '#fff',
      height: '100%',
      minHeight: 178,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
      '&:hover': {
        borderColor: `${colorPalette.oceanBlue}35`,
        boxShadow: '0 14px 28px rgba(15,23,42,0.08)',
        transform: 'translateY(-2px)',
      },
    }}
  >
    <Stack spacing={1.4}>
      <Stack direction="row" spacing={1.2} alignItems="flex-start" justifyContent="space-between">
        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={950} color={colorPalette.deepNavy} sx={{ lineHeight: 1.25, overflowWrap: 'anywhere' }}>
            {holiday.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={800}>
            {formatReadableDate(holiday.date)}
          </Typography>
        </Box>
        <Tooltip title={readOnly ? 'Read only' : 'Remove holiday'} arrow>
          <span>
            <IconButton
              color="error"
              size="small"
              disabled={readOnly || saving}
              onClick={() => onRemove(holiday)}
              sx={{
                borderRadius: 1.5,
                bgcolor: 'rgba(239,68,68,0.08)',
                '&:hover': { bgcolor: 'rgba(239,68,68,0.14)' },
              }}
            >
              <DeleteRounded fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <Stack direction="row" gap={0.8} flexWrap="wrap">
        <Chip
          size="small"
          icon={<RepeatRounded sx={{ fontSize: '0.9rem !important' }} />}
          label={holiday.recurring ? 'Yearly' : 'One-time'}
          color={holiday.recurring ? 'primary' : 'default'}
          variant={holiday.recurring ? 'filled' : 'outlined'}
          sx={{ borderRadius: 1.5, fontWeight: 850 }}
        />
        <Chip
          size="small"
          label={holiday.active === false ? 'Inactive' : 'Active'}
          color={holiday.active === false ? 'default' : 'success'}
          variant="outlined"
          sx={{ borderRadius: 1.5, fontWeight: 850 }}
        />
      </Stack>
    </Stack>

    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mt: 1.5, lineHeight: 1.55, overflowWrap: 'anywhere' }}
    >
      {holiday.description || 'Kenya public holiday'}
    </Typography>
  </Paper>
);

const HolidayManagement = ({ readOnly = false }) => {
  const [holidays, setHolidays] = useState([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const activeHolidays = useMemo(
    () => holidays.filter((holiday) => holiday?.active !== false),
    [holidays]
  );

  const sortedHolidays = useMemo(
    () => [...holidays].sort((a, b) => getHolidaySortTime(a) - getHolidaySortTime(b)),
    [holidays]
  );

  const nextHoliday = sortedHolidays.find((holiday) => holiday?.active !== false) || null;
  const recurringCount = activeHolidays.filter((holiday) => holiday?.recurring).length;
  const oneTimeCount = activeHolidays.length - recurringCount;

  const selectedOption = useMemo(
    () => kenyaHolidayOptions.find((item) => item.name === draft.name) || kenyaHolidayOptions[0],
    [draft.name]
  );

  const load = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      const data = await SuperadminAPI.getHolidays();
      setHolidays(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load holidays.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateDraft = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleHolidayNameChange = (event) => {
    const name = event.target.value;
    const option = kenyaHolidayOptions.find((item) => item.name === name) || kenyaHolidayOptions[0];
    setDraft((prev) => ({
      ...prev,
      name,
      recurring: option.recurring,
      description: option.name === 'Other' ? prev.description : option.hint,
    }));
  };

  const handleAddHoliday = async () => {
    if (readOnly) return;

    try {
      setError('');
      setStatus('');
      setSaving(true);
      const payload = {
        ...draft,
        description: draft.description || selectedOption.hint,
      };
      const data = await SuperadminAPI.addHoliday(payload);
      setHolidays(Array.isArray(data) ? data : []);
      setDraft({ ...emptyDraft, date: todayKey() });
      setStatus('Holiday added successfully.');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to add holiday.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveHoliday = async (holiday) => {
    if (readOnly || !holiday?._id) return;
    if (!window.confirm(`Remove ${holiday.name} from configured holidays?`)) return;

    try {
      setError('');
      setStatus('');
      setSaving(true);
      const data = await SuperadminAPI.removeHoliday(holiday._id);
      setHolidays(Array.isArray(data) ? data : []);
      setStatus('Holiday removed successfully.');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to remove holiday.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 'none', mx: 'auto', px: { xs: 1, sm: 2.5, lg: 3 }, py: 2 }}>
      <Stack spacing={3}>
        <Paper
          elevation={0}
          sx={{
            ...cardSx,
            p: { xs: 2, md: 3 },
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #ffffff 0%, #f5fbff 58%, #eefbf7 100%)',
          }}
        >
          <Grid container spacing={2.5} alignItems="center">
            <Grid item xs={12} md={8}>
              <Stack spacing={1.2}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    icon={<EventAvailableRounded />}
                    label="Holiday Management"
                    color="primary"
                    sx={{ borderRadius: 1.5, fontWeight: 900 }}
                  />
                  <Chip
                    label={`${activeHolidays.length} active holidays`}
                    variant="outlined"
                    sx={{ borderRadius: 1.5, fontWeight: 800, bgcolor: '#fff' }}
                  />
                </Stack>
                <Box>
                  <Typography variant="h4" fontWeight={950} sx={{ letterSpacing: 0, lineHeight: 1.1 }}>
                    Kenya Holiday Calendar
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8, maxWidth: 820 }}>
                    Configure public holidays used by clocking, reminder jobs, compliance checks, and attendance analytics.
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent={{ md: 'flex-end' }} spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={loading ? <CircularProgress size={16} /> : <RestartAltRounded />}
                  onClick={load}
                  disabled={loading || saving}
                  sx={{ borderRadius: 2, minHeight: 42 }}
                >
                  Refresh
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    lg: 'repeat(4, minmax(0, 1fr))',
                  },
                  gap: 1.5,
                }}
              >
                {[
                  { label: 'Next Holiday', value: nextHoliday?.name || 'None', detail: nextHoliday ? formatReadableDate(nextHoliday.date) : 'No active holiday configured', icon: <TodayRounded />, accent: colorPalette.oceanBlue },
                  { label: 'Active Holidays', value: activeHolidays.length, detail: 'Used by clocking and analytics', icon: <EventAvailableRounded />, accent: '#0f766e' },
                  { label: 'Yearly Rules', value: recurringCount, detail: 'Repeats automatically', icon: <RepeatRounded />, accent: '#2563eb' },
                  { label: 'One-Time Dates', value: oneTimeCount, detail: 'Review yearly where needed', icon: <NotesRounded />, accent: '#d97706' },
                ].map((item) => (
                  <Paper
                    key={item.label}
                    elevation={0}
                    sx={{
                      p: 1.8,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.82)',
                      border: '1px solid rgba(148,163,184,0.20)',
                    }}
                  >
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: `${item.accent}14`, color: item.accent, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        {item.icon}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={950} color={colorPalette.deepNavy} sx={{ lineHeight: 1.1, overflowWrap: 'anywhere' }}>
                          {item.value}
                        </Typography>
                        <Typography variant="caption" fontWeight={900} color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                          {item.label}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                          {item.detail}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
        {status && <Alert severity="success" onClose={() => setStatus('')}>{status}</Alert>}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'minmax(320px, 390px) minmax(0, 1fr)',
              xl: 'minmax(340px, 420px) minmax(0, 1fr)',
            },
            gap: 3,
            alignItems: 'start',
          }}
        >
          <Box>
            <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2, sm: 2.5 }, position: { lg: 'sticky' }, top: { lg: 88 } }}>
              <Stack spacing={2.2}>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: 'rgba(10,61,98,0.08)', display: 'grid', placeItems: 'center' }}>
                    <CalendarMonthRounded sx={{ color: colorPalette.deepNavy }} />
                  </Box>
                  <Box>
                    <Typography fontWeight={950}>Add Holiday</Typography>
                    <Typography variant="caption" color="text.secondary">Date and name are required.</Typography>
                  </Box>
                </Stack>

                <TextField
                  select
                  label="Holiday Name"
                  value={draft.name}
                  onChange={handleHolidayNameChange}
                  disabled={readOnly || saving}
                  sx={fieldSx}
                  fullWidth
                >
                  {kenyaHolidayOptions.map((option) => (
                    <MenuItem key={option.name} value={option.name}>{option.name}</MenuItem>
                  ))}
                </TextField>

                {draft.name === 'Other' && (
                  <TextField
                    label="Custom Holiday Name"
                    value={draft.customName}
                    onChange={(event) => updateDraft('customName', event.target.value)}
                    disabled={readOnly || saving}
                    sx={fieldSx}
                    fullWidth
                  />
                )}

                <TextField
                  label="Holiday Date"
                  type="date"
                  value={draft.date}
                  onChange={(event) => updateDraft('date', event.target.value)}
                  disabled={readOnly || saving}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                  fullWidth
                />

                <TextField
                  select
                  label="Repeat Rule"
                  value={draft.recurring ? 'recurring' : 'once'}
                  onChange={(event) => updateDraft('recurring', event.target.value === 'recurring')}
                  disabled={readOnly || saving}
                  helperText={selectedOption.hint}
                  sx={fieldSx}
                  fullWidth
                >
                  <MenuItem value="once">One-time holiday</MenuItem>
                  <MenuItem value="recurring">Repeats every year</MenuItem>
                </TextField>

                <TextField
                  label="Internal Note"
                  value={draft.description}
                  onChange={(event) => updateDraft('description', event.target.value)}
                  disabled={readOnly || saving}
                  minRows={3}
                  multiline
                  sx={fieldSx}
                  fullWidth
                />

                <Button
                  variant="contained"
                  size="large"
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <AddRounded />}
                  onClick={handleAddHoliday}
                  disabled={readOnly || saving}
                  sx={{ borderRadius: 2, minHeight: 48, fontWeight: 900 }}
                >
                  Add Holiday
                </Button>
              </Stack>
            </Paper>
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Stack spacing={2}>
              <Alert
                icon={<InfoOutlined />}
                severity="info"
                sx={{ borderRadius: 2, bgcolor: 'rgba(10,61,98,0.05)', border: '1px solid rgba(10,61,98,0.12)' }}
              >
                Fixed holidays may repeat yearly. Movable holidays such as Easter and Idd holidays should be reviewed each year against official Kenya gazette notices.
              </Alert>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    xl: 'repeat(3, minmax(0, 1fr))',
                  },
                  gap: 1.5,
                }}
              >
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <Paper key={index} elevation={0} sx={{ ...cardSx, p: 2, minHeight: 178 }}>
                      <Stack spacing={1.2}>
                        <CircularProgress size={20} />
                        <Typography variant="body2" color="text.secondary">Loading holiday card...</Typography>
                      </Stack>
                    </Paper>
                  ))
                ) : sortedHolidays.length === 0 ? (
                  <Paper elevation={0} sx={{ ...cardSx, p: 3, gridColumn: '1 / -1', textAlign: 'center' }}>
                    <Typography color="text.secondary" fontWeight={800}>No holidays configured yet.</Typography>
                  </Paper>
                ) : sortedHolidays.map((holiday) => (
                  <HolidayCard
                    key={holiday._id || `${holiday.name}-${holiday.date}`}
                    holiday={holiday}
                    readOnly={readOnly}
                    saving={saving}
                    onRemove={handleRemoveHoliday}
                  />
                ))}
              </Box>

              <Paper elevation={0} sx={{ ...cardSx, overflow: 'hidden', display: { xs: 'none', xl: 'block' } }}>
                <TableContainer sx={{ maxHeight: 620 }}>
                  <Table stickyHeader size="small" sx={{ minWidth: 760 }}>
                    <TableHead>
                      <TableRow>
                        {['Holiday', 'Date', 'Repeat', 'Status', 'Notes', 'Action'].map((header) => (
                          <TableCell
                            key={header}
                            sx={{ fontWeight: 950, color: colorPalette.deepNavy, bgcolor: '#f8fbfc', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.7 }}
                          >
                            {header}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                            <CircularProgress size={24} />
                          </TableCell>
                        </TableRow>
                      ) : sortedHolidays.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                            <Typography color="text.secondary" fontWeight={700}>No holidays configured yet.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : sortedHolidays.map((holiday) => (
                        <TableRow key={holiday._id || `${holiday.name}-${holiday.date}`} hover>
                          <TableCell sx={{ fontWeight: 850, color: colorPalette.deepNavy }}>{holiday.name}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatReadableDate(holiday.date)}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={holiday.recurring ? 'Yearly' : 'One-time'}
                              color={holiday.recurring ? 'primary' : 'default'}
                              variant={holiday.recurring ? 'filled' : 'outlined'}
                              sx={{ borderRadius: 1.5, fontWeight: 800 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={holiday.active === false ? 'Inactive' : 'Active'}
                              color={holiday.active === false ? 'default' : 'success'}
                              variant="outlined"
                              sx={{ borderRadius: 1.5, fontWeight: 800 }}
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 220, color: 'text.secondary' }}>
                            {holiday.description || 'Kenya public holiday'}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title={readOnly ? 'Read only' : 'Remove holiday'} arrow>
                              <span>
                                <IconButton
                                  color="error"
                                  disabled={readOnly || saving}
                                  onClick={() => handleRemoveHoliday(holiday)}
                                  size="small"
                                >
                                  <DeleteRounded fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Stack>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
};

export default HolidayManagement;
