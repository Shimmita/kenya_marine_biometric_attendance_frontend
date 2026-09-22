import {
  BackupRounded,
  CheckCircleRounded,
  CloudDoneRounded,
  CloudOffRounded,
  ErrorOutlineRounded,
  FolderRounded,
  PlayArrowRounded,
  RefreshRounded,
  RestoreRounded,
  StorageRounded,
  WarningAmberRounded,
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
  FormControl,
  FormControlLabel,
  Grid,
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import SuperadminAPI from '../../service/SuperadminService';

const cardSx = {
  borderRadius: 2,
  p: { xs: 2, sm: 3 },
  background: '#ffffff',
  border: '1px solid rgba(148, 163, 184, 0.22)',
  boxShadow: '0 12px 30px rgba(15,23,42,.05)',
};

const formatDateTime = (value, fallback = 'Not available') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatBytes = (value = 0) => {
  const size = Number(value || 0);
  if (!Number.isFinite(size) || size <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  return `${(size / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const titleCase = (value = '') =>
  String(value).replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const monthOrder = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const groupBackups = (backups = []) => {
  const grouped = {};
  backups.forEach((backup) => {
    const year = backup.year || 'Unknown';
    const month = backup.month || 'unknown';
    const week = backup.week || 0;
    grouped[year] = grouped[year] || {};
    grouped[year][month] = grouped[year][month] || {};
    grouped[year][month][week] = grouped[year][month][week] || [];
    grouped[year][month][week].push(backup);
  });
  return grouped;
};

const StatusChip = ({ available, label }) => (
  <Chip
    size="small"
    icon={available ? <CheckCircleRounded /> : <WarningAmberRounded />}
    label={label}
    color={available ? 'success' : 'warning'}
    variant={available ? 'filled' : 'outlined'}
    sx={{ borderRadius: 1.5, fontWeight: 850 }}
  />
);

const StorageCard = ({ title, icon, status, configured, enabled = true }) => {
  const connected = status === 'connected';
  const label = !enabled ? 'Disabled' : connected ? 'Connected' : status === 'not_configured' ? 'Not Configured' : 'Unavailable';
  return (
    <Paper elevation={0} sx={{ ...cardSx, height: '100%' }}>
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box sx={{ color: connected ? 'success.main' : 'warning.main', display: 'flex' }}>{icon}</Box>
          <Chip
            size="small"
            label={label}
            color={!enabled ? 'default' : connected ? 'success' : 'warning'}
            variant="outlined"
            sx={{ borderRadius: 1.5, fontWeight: 850 }}
          />
        </Stack>
        <Box>
          <Typography fontWeight={950}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            Path configured: {configured ? 'Yes' : 'No'}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

const BackupHierarchy = ({ backups, source, onRestore, onRetrySync, busy }) => {
  const grouped = useMemo(() => groupBackups(backups), [backups]);
  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  if (!backups.length) {
    return (
      <Box sx={{ borderRadius: 2, border: '1px dashed rgba(148,163,184,0.4)', p: 3, textAlign: 'center', bgcolor: '#f8fbfc' }}>
        <FolderRounded color="disabled" />
        <Typography fontWeight={900}>No valid backups found</Typography>
        <Typography variant="body2" color="text.secondary">Completed snapshots will appear here after discovery.</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {years.map((year) => {
        const months = Object.keys(grouped[year]).sort((a, b) => (monthOrder[b] || 0) - (monthOrder[a] || 0));
        return (
          <Paper key={year} elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(148,163,184,0.22)', overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.4, bgcolor: '#f8fbfc', borderBottom: '1px solid rgba(148,163,184,0.18)' }}>
              <Typography fontWeight={950}>{year}</Typography>
            </Box>
            <Stack spacing={0} divider={<Divider />}>
              {months.map((month) => {
                const weeks = Object.keys(grouped[year][month]).sort((a, b) => Number(b) - Number(a));
                return (
                  <Box key={`${year}-${month}`} sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={950} sx={{ mb: 1 }}>
                      {titleCase(month)}
                    </Typography>
                    <Stack spacing={1.2}>
                      {weeks.map((week) => (
                        <Box key={`${year}-${month}-${week}`}>
                          <Typography variant="caption" color="text.secondary" fontWeight={900}>
                            Week {week}
                          </Typography>
                          <Stack spacing={1} sx={{ mt: 0.5 }}>
                            {grouped[year][month][week].map((backup) => {
                              const localAvailable = backup.copies?.local?.available === true;
                              const networkAvailable = backup.copies?.network?.available === true;
                              const networkPending = backup.copies?.network?.status === 'pending_sync';
                              return (
                                <Paper
                                  key={backup.backupId}
                                  elevation={0}
                                  sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    border: '1px solid rgba(148,163,184,0.2)',
                                    bgcolor: '#ffffff',
                                  }}
                                >
                                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
                                    <Box>
                                      <Typography fontWeight={900}>{formatDateTime(backup.createdAt)}</Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {formatBytes(backup.backupSize)} · {backup.collectionCount || 0} collections
                                      </Typography>
                                    </Box>
                                    <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
                                      <StatusChip available={localAvailable} label={`Local ${localAvailable ? 'Available' : 'Missing'}`} />
                                      <StatusChip available={networkAvailable} label={`Network ${networkAvailable ? 'Available' : networkPending ? 'Pending Sync' : 'Unavailable'}`} />
                                      {source === 'local' && networkPending && (
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          startIcon={<RefreshRounded />}
                                          disabled={busy}
                                          onClick={() => onRetrySync(backup.backupId)}
                                          sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 850 }}
                                        >
                                          Retry Sync
                                        </Button>
                                      )}
                                      <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<RestoreRounded />}
                                        disabled={busy}
                                        onClick={() => onRestore(backup)}
                                        sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 850 }}
                                      >
                                        Restore
                                      </Button>
                                    </Stack>
                                  </Stack>
                                </Paper>
                              );
                            })}
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
};

const BackupManagement = () => {
  const [overview, setOverview] = useState(null);
  const [localBackups, setLocalBackups] = useState([]);
  const [networkBackups, setNetworkBackups] = useState([]);
  const [restoreSource, setRestoreSource] = useState('local');
  const [networkMode, setNetworkMode] = useState('configured');
  const [networkPath, setNetworkPath] = useState('');
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [operation, setOperation] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReadingNetwork, setIsReadingNetwork] = useState(false);

  const busy = isLoading || operation?.status === 'running';

  const loadOverview = useCallback(async () => {
    try {
      setError('');
      setIsLoading(true);
      const [overviewData, localData] = await Promise.all([
        SuperadminAPI.getBackupOverview(),
        SuperadminAPI.getLocalBackups(),
      ]);
      setOverview(overviewData);
      setLocalBackups(localData.backups || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load backup information.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (!operation?.operationId || ['completed', 'failed'].includes(operation.status)) return undefined;

    const timer = window.setInterval(async () => {
      try {
        const next = await SuperadminAPI.getBackupOperation(operation.operationId);
        setOperation(next);
        if (['completed', 'failed'].includes(next.status)) {
          if (next.status === 'completed') {
            setStatus(next.message || 'Operation completed.');
            loadOverview();
          } else {
            setError(next.error?.message || next.message || 'Operation failed.');
          }
        }
      } catch {
        window.clearInterval(timer);
      }
    }, 2500);

    return () => window.clearInterval(timer);
  }, [operation, loadOverview]);

  const handleManualBackup = async () => {
    try {
      setError('');
      setStatus('');
      setIsLoading(true);
      const result = await SuperadminAPI.createManualBackup();
      setOperation(result.operation || null);
      setStatus('Backup completed.');
      await loadOverview();
    } catch (err) {
      setError(err?.response?.data?.message || 'Manual backup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadNetwork = async () => {
    try {
      setError('');
      setStatus('');
      setIsReadingNetwork(true);
      const data = networkMode === 'configured'
        ? await SuperadminAPI.getConfiguredNetworkBackups()
        : await SuperadminAPI.readCustomNetworkBackups(networkPath);
      setNetworkBackups(data.backups || []);
      setStatus(`Network backup connected. ${data.count || data.backups?.length || 0} valid backups found.`);
    } catch (err) {
      setNetworkBackups([]);
      setError(err?.response?.data?.message || 'Unable to access network backup location.');
    } finally {
      setIsReadingNetwork(false);
    }
  };

  const handleRetrySync = async (backupId) => {
    try {
      setError('');
      setStatus('');
      setIsLoading(true);
      const result = await SuperadminAPI.retryNetworkBackupSync(backupId);
      setOperation(result.operation || null);
      setStatus('Network synchronization completed.');
      await loadOverview();
    } catch (err) {
      setError(err?.response?.data?.message || 'Network synchronization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;
    try {
      setError('');
      setStatus('');
      setIsLoading(true);
      const result = await SuperadminAPI.restoreDatabaseBackup({
        source: restoreSource,
        backupId: selectedBackup.backupId,
        networkMode,
        networkPath: networkMode === 'custom' ? networkPath : undefined,
      });
      setOperation(result.operation || null);
      setStatus('Database restored successfully.');
      setSelectedBackup(null);
      await loadOverview();
    } catch (err) {
      setError(err?.response?.data?.message || 'Database restoration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const sourceBackups = restoreSource === 'local' ? localBackups : networkBackups;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={950}>Backup Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage weekly database snapshots, network copies, retry sync, and controlled restore operations.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={busy ? <CircularProgress color="inherit" size={18} /> : <PlayArrowRounded />}
          disabled={busy}
          onClick={handleManualBackup}
          sx={{ minHeight: 44, borderRadius: 2, textTransform: 'none', fontWeight: 900 }}
        >
          Create Backup Now
        </Button>
      </Stack>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {status && <Alert severity="success" onClose={() => setStatus('')}>{status}</Alert>}

      {operation && ['running', 'pending'].includes(operation.status) && (
        <Paper elevation={0} sx={cardSx}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <CircularProgress size={22} />
              <Box>
                <Typography fontWeight={950}>{operation.phase || 'Operation running'}</Typography>
                <Typography variant="body2" color="text.secondary">{operation.message || 'Please wait.'}</Typography>
              </Box>
            </Stack>
            <LinearProgress />
          </Stack>
        </Paper>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <StorageCard
            title="Local Storage"
            icon={<StorageRounded />}
            status={overview?.storage?.local?.status}
            configured={overview?.storage?.local?.configured}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StorageCard
            title="Network Storage"
            icon={overview?.storage?.network?.status === 'connected' ? <CloudDoneRounded /> : <CloudOffRounded />}
            status={overview?.storage?.network?.status}
            configured={overview?.storage?.network?.configured}
            enabled={overview?.storage?.network?.enabled !== false}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ ...cardSx, height: '100%' }}>
            <Stack spacing={1.5}>
              <Box sx={{ color: 'primary.main', display: 'flex' }}><BackupRounded /></Box>
              <Box>
                <Typography fontWeight={950}>Last Successful Backup</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDateTime(overview?.lastSuccessfulBackup)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Schedule: {overview?.schedule || 'Not configured'}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
            <Box>
              <Typography fontWeight={950}>Restore Database</Typography>
              <Typography variant="body2" color="text.secondary">Choose the backup source before selecting a restore point.</Typography>
            </Box>
            <ToggleButtonGroup
              exclusive
              value={restoreSource}
              onChange={(event, value) => value && setRestoreSource(value)}
              size="small"
              disabled={busy}
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 900, borderRadius: 1.5 } }}
            >
              <ToggleButton value="local">Local Backup</ToggleButton>
              <ToggleButton value="network">Network Backup</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {restoreSource === 'network' && (
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(148,163,184,0.22)', p: 2, bgcolor: '#f8fbfc' }}>
              <Stack spacing={2}>
                <FormControl>
                  <RadioGroup row value={networkMode} onChange={(event) => setNetworkMode(event.target.value)}>
                    <FormControlLabel value="configured" control={<Radio />} label="Use configured network backup location" />
                    <FormControlLabel value="custom" control={<Radio />} label="Enter network location" />
                  </RadioGroup>
                </FormControl>
                {networkMode === 'custom' && (
                  <TextField
                    label="Network UNC Address"
                    placeholder="\\\\BACKUP-SERVER\\KMFRI_Backups\\clocking_backup"
                    value={networkPath}
                    onChange={(event) => setNetworkPath(event.target.value)}
                    fullWidth
                    disabled={busy || isReadingNetwork}
                  />
                )}
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={isReadingNetwork ? <CircularProgress size={16} /> : <RefreshRounded />}
                    disabled={busy || isReadingNetwork || (networkMode === 'custom' && !networkPath.trim())}
                    onClick={handleReadNetwork}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 900 }}
                  >
                    {isReadingNetwork ? 'Connecting to network backup...' : 'Connect / Read Backups'}
                  </Button>
                </Box>
              </Stack>
            </Paper>
          )}

          <BackupHierarchy
            backups={sourceBackups}
            source={restoreSource}
            busy={busy}
            onRestore={setSelectedBackup}
            onRetrySync={handleRetrySync}
          />
        </Stack>
      </Paper>

      <Dialog open={Boolean(selectedBackup)} onClose={() => !busy && setSelectedBackup(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 950 }}>Restore Database?</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="warning" icon={<ErrorOutlineRounded />}>
              This operation will replace the current database. A safety backup of the current database will be created before restoration.
            </Alert>
            <Box>
              <Typography variant="body2" color="text.secondary">Source</Typography>
              <Typography fontWeight={900}>{restoreSource === 'local' ? 'Local Backup' : 'Network Backup'}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Backup</Typography>
              <Typography fontWeight={900}>
                {titleCase(selectedBackup?.month)} {selectedBackup?.year} — Week {selectedBackup?.week}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Created</Typography>
              <Typography fontWeight={900}>{formatDateTime(selectedBackup?.createdAt)}</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button disabled={busy} onClick={() => setSelectedBackup(null)} sx={{ textTransform: 'none', fontWeight: 850 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={busy}
            startIcon={busy ? <CircularProgress color="inherit" size={16} /> : <RestoreRounded />}
            onClick={handleRestore}
            sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 2 }}
          >
            Restore Backup
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default BackupManagement;
