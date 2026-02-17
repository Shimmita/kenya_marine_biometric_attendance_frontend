import {
    AssignmentTurnedIn,
    Block,
    CheckCircle,
    DevicesOther,
    ErrorOutline,
    FilterList,
    HourglassEmpty,
    InfoOutlined,
    PersonOutline,
    Refresh,
    Search,
    Timeline,
    VerifiedUser,
} from '@mui/icons-material';
import {
    Alert,
    Avatar,
    Badge,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    Grid,
    InputAdornment,
    MenuItem,
    Select,
    Skeleton,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAllLostDevices, respondToLostDevice } from '../../service/DeviceService'; // adjust path
import coreDataDetails from '../CoreDataDetails';

const { colorPalette } = coreDataDetails;

/* ── status config (matches backend enum: pending | granted | rejected) ─── */
const statusConfig = {
    pending:  { label: 'Pending',  color: 'warning', textColor: '#b45309', bg: '#fef3c7', icon: <HourglassEmpty sx={{ fontSize: 14 }} /> },
    granted:  { label: 'Approved', color: 'success', textColor: '#15803d', bg: '#dcfce7', icon: <CheckCircle    sx={{ fontSize: 14 }} /> },
    rejected: { label: 'Rejected', color: 'error',   textColor: '#dc2626', bg: '#fee2e2', icon: <ErrorOutline   sx={{ fontSize: 14 }} /> },
};

/* ── helpers ────────────────────────────────────────────────────────────── */
const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const daysBetween = (a, b) => (!a || !b) ? 0 : Math.round((new Date(b) - new Date(a)) / 86_400_000);

const initials = email => {
    if (!email) return '?';
    const [local] = email.split('@');
    const parts = local.split(/[._-]/);
    return parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : local.slice(0, 2).toUpperCase();
};

const avatarColor = email => {
    const colors = [
        colorPalette.oceanBlue, colorPalette.seafoamGreen,
        colorPalette.cyanFresh, colorPalette.warmSand,
        colorPalette.coralSunset, colorPalette.deepNavy,
    ];
    let hash = 0;
    for (const c of (email || '')) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
    return colors[Math.abs(hash) % colors.length];
};

/* ═══════════════════════════════════════════════════════════════════════════
   BADGE EXPORT — import this wherever you render the sidebar nav item
   Usage: <UserRequestsBadge /> next to the nav label
═══════════════════════════════════════════════════════════════════════════ */
export const UserRequestsBadge = ({ count }) =>
    count > 0 ? (
        <Chip
            label={count > 99 ? '99+' : count}
            size="small"
            sx={{
                height: 18, minWidth: 18, fontSize: '0.6rem', fontWeight: 900,
                bgcolor: colorPalette.coralSunset, color: '#fff',
                borderRadius: '9px', px: 0.6, ml: 0.5,
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                    '0%, 100%': { boxShadow: `0 0 0 0 ${colorPalette.coralSunset}66` },
                    '50%':      { boxShadow: `0 0 0 5px ${colorPalette.coralSunset}00` },
                },
            }}
        />
    ) : null;

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const UserRequestsContent = () => {
    /* ── data state ── */
    const [requests,   setRequests]   = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [fetchError, setFetchError] = useState('');

    /* ── filter / search state ── */
    const [search,     setSearch]     = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortOrder,  setSortOrder]  = useState('newest'); // newest | oldest | duration

    /* ── respond dialog state ── */
    const [dialogTarget, setDialogTarget] = useState(null); // { request, action: 'granted'|'rejected' }
    const [responding,   setResponding]   = useState(false);
    const [respondError, setRespondError] = useState('');
    const [respondSuccess, setRespondSuccess] = useState('');

    /* ── load all requests ── */
    const loadRequests = useCallback(async () => {
        setLoading(true);
        setFetchError('');
        try {
            const data = await fetchAllLostDevices();
            setRequests(Array.isArray(data) ? data : (data.requests ?? []));
        } catch (err) {
            setFetchError(typeof err === 'string' ? err : 'Failed to load requests.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadRequests(); }, [loadRequests]);

    /* ── stats ── */
    const stats = useMemo(() => ({
        total:    requests.length,
        pending:  requests.filter(r => r.status === 'pending').length,
        granted:  requests.filter(r => r.status === 'granted').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
    }), [requests]);

    /* ── filtered + sorted list ── */
    const filtered = useMemo(() => {
        let list = [...requests];
        if (statusFilter !== 'all') list = list.filter(r => r.status === statusFilter);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(r =>
                r.user_email?.toLowerCase().includes(q) ||
                r.description?.toLowerCase().includes(q) ||
                r._id?.toLowerCase().includes(q)
            );
        }
        list.sort((a, b) => {
            if (sortOrder === 'oldest')   return new Date(a.createdAt) - new Date(b.createdAt);
            if (sortOrder === 'duration') return daysBetween(b.startDate, b.endDate) - daysBetween(a.startDate, a.endDate);
            return new Date(b.createdAt) - new Date(a.createdAt); // newest
        });
        return list;
    }, [requests, statusFilter, search, sortOrder]);

    /* ── respond (grant / reject) ── */
    const handleRespond = async () => {
        if (!dialogTarget) return;
        setResponding(true);
        setRespondError('');
        try {
            await respondToLostDevice(dialogTarget.request._id, dialogTarget.action);
            setRespondSuccess(
                `Request from ${dialogTarget.request.user_email} has been ${dialogTarget.action === 'granted' ? 'approved' : 'rejected'}.`
            );
            setTimeout(() => setRespondSuccess(''), 6000);
            setDialogTarget(null);
            await loadRequests();
        } catch (err) {
            setRespondError(typeof err === 'string' ? err : 'Failed to respond. Please try again.');
        } finally {
            setResponding(false);
        }
    };

    /* ── subcomponents ── */
    const StatCard = ({ label, value, color, icon, onClick, active }) => (
        <Card
            elevation={0}
            onClick={onClick}
            sx={{
                borderRadius: 3,
                border: active ? `2px solid ${color}` : `1.5px solid ${color}22`,
                bgcolor: active ? `${color}12` : `${color}06`,
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: `0 6px 20px ${color}22` } : {},
            }}
        >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography variant="h4" fontWeight={900} color={color} sx={{ lineHeight: 1 }}>
                            {value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {label}
                        </Typography>
                    </Box>
                    <Box sx={{ color, opacity: 0.7, fontSize: 32 }}>{icon}</Box>
                </Stack>
            </CardContent>
        </Card>
    );

    const RequestSkeleton = () => (
        <Card elevation={0} sx={{ borderRadius: 3, border: '1.5px solid #e8eef7', p: 2.5 }}>
            <Stack spacing={1.5}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Skeleton variant="circular" width={42} height={42} />
                    <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width={180} height={20} />
                        <Skeleton variant="text" width={120} height={16} />
                    </Box>
                    <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: 2 }} />
                </Stack>
                <Skeleton variant="text" width="90%" height={18} />
                <Stack direction="row" spacing={1}>
                    <Skeleton variant="rounded" width={110} height={22} sx={{ borderRadius: 2 }} />
                    <Skeleton variant="rounded" width={90}  height={22} sx={{ borderRadius: 2 }} />
                </Stack>
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <Skeleton variant="rounded" width={90}  height={34} sx={{ borderRadius: 2 }} />
                    <Skeleton variant="rounded" width={90}  height={34} sx={{ borderRadius: 2 }} />
                </Stack>
            </Stack>
        </Card>
    );

    /* ══════════════════════════════════════════════════════════════════════ */
    return (
        <Box>
            {/* ── Page header ── */}
            <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                <Box sx={{
                    width: 44, height: 44, borderRadius: 2.5,
                    background: colorPalette.oceanGradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', boxShadow: '0 4px 16px rgba(10,61,98,0.25)',
                }}>
                    <AssignmentTurnedIn />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h6" fontWeight={900} color={colorPalette.deepNavy}>
                            User Device Requests
                        </Typography>
                        {stats.pending > 0 && <UserRequestsBadge count={stats.pending} />}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                        Review and respond to employee lost-device requests
                    </Typography>
                </Box>
                <Tooltip title="Refresh">
                    <span>
                        <Button
                            size="small"
                            startIcon={loading ? <CircularProgress size={14} /> : <Refresh />}
                            onClick={loadRequests}
                            disabled={loading}
                            sx={{ textTransform: 'none', fontWeight: 700, color: colorPalette.oceanBlue }}
                        >
                            Refresh
                        </Button>
                    </span>
                </Tooltip>
            </Stack>

            {/* ── Alerts ── */}
            <AnimatePresence>
                {respondSuccess && (
                    <motion.div key="ok" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Alert icon={<CheckCircle />} severity="success" sx={{ mb: 3, borderRadius: 3, fontWeight: 600 }}
                            onClose={() => setRespondSuccess('')}>
                            {respondSuccess}
                        </Alert>
                    </motion.div>
                )}
                {fetchError && (
                    <motion.div key="err" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}
                            action={<Button size="small" onClick={loadRequests} sx={{ fontWeight: 700 }}>Retry</Button>}>
                            {fetchError}
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Stats row ── */}
            {loading ? (
                <Grid container spacing={2} mb={3}>
                    {[1,2,3,4].map(k => (
                        <Grid item xs={6} sm={3} key={k}>
                            <Skeleton variant="rounded" height={80} sx={{ borderRadius: 3 }} />
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Grid container spacing={2} mb={3}>
                    <Grid item xs={6} sm={3}>
                        <StatCard label="Total Requests" value={stats.total} color={colorPalette.deepNavy}
                            icon={<DevicesOther sx={{ fontSize: 32 }} />}
                            onClick={() => setStatusFilter('all')} active={statusFilter === 'all'} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard label="Pending" value={stats.pending} color="#d97706"
                            icon={<HourglassEmpty sx={{ fontSize: 32 }} />}
                            onClick={() => setStatusFilter('pending')} active={statusFilter === 'pending'} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard label="Approved" value={stats.granted} color="#16a34a"
                            icon={<CheckCircle sx={{ fontSize: 32 }} />}
                            onClick={() => setStatusFilter('granted')} active={statusFilter === 'granted'} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard label="Rejected" value={stats.rejected} color="#dc2626"
                            icon={<Block sx={{ fontSize: 32 }} />}
                            onClick={() => setStatusFilter('rejected')} active={statusFilter === 'rejected'} />
                    </Grid>
                </Grid>
            )}

            {/* ── Filters bar ── */}
            <Card elevation={0} sx={{ borderRadius: 3, border: '1.5px solid #e8eef7', mb: 3 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                        <TextField
                            size="small"
                            placeholder="Search by email, description or ID…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>,
                            }}
                            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                        />
                        <Stack direction="row" spacing={1} alignItems="center">
                            <FilterList sx={{ color: 'text.disabled', fontSize: 18 }} />
                            <Select
                                size="small"
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                sx={{ borderRadius: 2.5, minWidth: 130, fontWeight: 700, fontSize: '0.85rem' }}
                            >
                                <MenuItem value="all">All Statuses</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="granted">Approved</MenuItem>
                                <MenuItem value="rejected">Rejected</MenuItem>
                            </Select>
                            <Select
                                size="small"
                                value={sortOrder}
                                onChange={e => setSortOrder(e.target.value)}
                                sx={{ borderRadius: 2.5, minWidth: 130, fontWeight: 700, fontSize: '0.85rem' }}
                            >
                                <MenuItem value="newest">Newest First</MenuItem>
                                <MenuItem value="oldest">Oldest First</MenuItem>
                                <MenuItem value="duration">Longest Duration</MenuItem>
                            </Select>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>

            {/* ── Result count ── */}
            {!loading && (
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Showing <strong style={{ color: colorPalette.deepNavy }}>{filtered.length}</strong> of <strong>{requests.length}</strong> requests
                    </Typography>
                    {(search || statusFilter !== 'all') && (
                        <Button size="small" onClick={() => { setSearch(''); setStatusFilter('all'); }}
                            sx={{ textTransform: 'none', fontSize: '0.75rem', color: colorPalette.coralSunset, fontWeight: 700 }}>
                            Clear filters
                        </Button>
                    )}
                </Stack>
            )}

            {/* ── Skeletons ── */}
            {loading && (
                <Stack spacing={2}>
                    {[1,2,3].map(k => <RequestSkeleton key={k} />)}
                </Stack>
            )}

            {/* ── Empty state ── */}
            {!loading && !fetchError && filtered.length === 0 && (
                <Card elevation={0} sx={{ borderRadius: 3, border: '1.5px dashed #ddd', p: 4, textAlign: 'center' }}>
                    <DevicesOther sx={{ color: '#ccc', fontSize: 48, mb: 1 }} />
                    <Typography color="text.disabled" fontWeight={600}>
                        {requests.length === 0 ? 'No lost device requests have been submitted yet.' : 'No requests match your current filters.'}
                    </Typography>
                </Card>
            )}

            {/* ── Request cards ── */}
            {!loading && filtered.length > 0 && (
                <Stack spacing={2}>
                    <AnimatePresence>
                        {filtered.map((req, i) => {
                            const sc       = statusConfig[req.status] || statusConfig.pending;
                            const duration = daysBetween(req.startDate, req.endDate);
                            const isPending = req.status === 'pending';
                            const color     = avatarColor(req.user_email);

                            return (
                                <motion.div
                                    key={req._id || i}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ delay: i * 0.04 }}
                                >
                                    <Card
                                        elevation={0}
                                        sx={{
                                            borderRadius: 3,
                                            border: isPending
                                                ? `1.5px solid #fbbf2444`
                                                : req.status === 'granted'
                                                    ? `1.5px solid ${colorPalette.seafoamGreen}44`
                                                    : `1.5px solid ${colorPalette.coralSunset}33`,
                                            transition: 'all 0.22s ease',
                                            '&:hover': { boxShadow: '0 6px 24px rgba(0,0,0,0.07)', transform: 'translateY(-1px)' },
                                        }}
                                    >
                                        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>

                                            {/* ── Top row: avatar + email + status chip ── */}
                                            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={1.5} mb={1.5}>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Avatar sx={{ bgcolor: color, width: 42, height: 42, fontWeight: 900, fontSize: '0.9rem' }}>
                                                        {initials(req.user_email)}
                                                    </Avatar>
                                                    <Box>
                                                        <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap">
                                                            <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy}>
                                                                {req.user_email}
                                                            </Typography>
                                                            <Chip
                                                                icon={sc.icon}
                                                                label={sc.label}
                                                                size="small"
                                                                color={sc.color}
                                                                variant="outlined"
                                                                sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }}
                                                            />
                                                            {req.responded && req.responded !== 'pending' && (
                                                                <Chip
                                                                    icon={<VerifiedUser sx={{ fontSize: 12 }} />}
                                                                    label={`By ${req.responded}`}
                                                                    size="small"
                                                                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: `${colorPalette.deepNavy}08`, color: colorPalette.deepNavy }}
                                                                />
                                                            )}
                                                        </Stack>
                                                        <Typography variant="caption" color="text.disabled">
                                                            ID: {req._id ? req._id.slice(-8).toUpperCase() : '—'} · Submitted {fmtDate(req.createdAt)}
                                                        </Typography>
                                                    </Box>
                                                </Stack>

                                                {/* duration badge */}
                                                <Chip
                                                    icon={<Timeline sx={{ fontSize: 14 }} />}
                                                    label={`${duration} day${duration !== 1 ? 's' : ''}`}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 700, height: 24, fontSize: '0.72rem',
                                                        bgcolor: duration > 20 ? '#fee2e2' : duration > 10 ? '#fef3c7' : '#dcfce7',
                                                        color:   duration > 20 ? '#dc2626' : duration > 10 ? '#b45309' : '#15803d',
                                                        border: 'none',
                                                    }}
                                                />
                                            </Stack>

                                            {/* ── Description ── */}
                                            <Box
                                                sx={{
                                                    bgcolor: '#f8fafc', borderRadius: 2, px: 2, py: 1.2, mb: 1.5,
                                                    borderLeft: `3px solid ${sc.bg === '#fef3c7' ? '#d97706' : sc.bg === '#dcfce7' ? '#16a34a' : '#dc2626'}`,
                                                }}
                                            >
                                                <Stack direction="row" spacing={0.8} alignItems="flex-start">
                                                    <InfoOutlined sx={{ fontSize: 15, color: 'text.disabled', mt: 0.2 }} />
                                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                                        {req.description}
                                                    </Typography>
                                                </Stack>
                                            </Box>

                                            {/* ── Date range chips ── */}
                                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={isPending ? 2 : 0}>
                                                <Chip
                                                    icon={<PersonOutline sx={{ fontSize: 13 }} />}
                                                    label={`From: ${fmtDate(req.startDate)}`}
                                                    size="small"
                                                    sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem', bgcolor: `${colorPalette.oceanBlue}10`, color: colorPalette.oceanBlue }}
                                                />
                                                <Chip
                                                    icon={<PersonOutline sx={{ fontSize: 13 }} />}
                                                    label={`Until: ${fmtDate(req.endDate)}`}
                                                    size="small"
                                                    sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem', bgcolor: `${colorPalette.seafoamGreen}12`, color: colorPalette.seafoamGreen }}
                                                />
                                            </Stack>

                                            {/* ── Action buttons (only for pending) ── */}
                                            {isPending && (
                                                <>
                                                    <Divider sx={{ mb: 2 }} />
                                                    <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            color="error"
                                                            startIcon={<Block sx={{ fontSize: 16 }} />}
                                                            onClick={() => setDialogTarget({ request: req, action: 'rejected' })}
                                                            sx={{
                                                                borderRadius: 2.5, textTransform: 'none', fontWeight: 800,
                                                                fontSize: '0.8rem', px: 2.5, py: 0.8,
                                                                '&:hover': { bgcolor: '#fee2e2' },
                                                            }}
                                                        >
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            color="success"
                                                            startIcon={<CheckCircle sx={{ fontSize: 16 }} />}
                                                            onClick={() => setDialogTarget({ request: req, action: 'granted' })}
                                                            sx={{
                                                                borderRadius: 2.5, textTransform: 'none', fontWeight: 800,
                                                                fontSize: '0.8rem', px: 2.5, py: 0.8,
                                                                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                                                boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
                                                                '&:hover': { boxShadow: '0 6px 20px rgba(22,163,74,0.45)', transform: 'translateY(-1px)' },
                                                            }}
                                                        >
                                                            Approve
                                                        </Button>
                                                    </Stack>
                                                </>
                                            )}

                                            {/* ── Already responded note ── */}
                                            {!isPending && (
                                                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.2, fontStyle: 'italic' }}>
                                                    {req.status === 'granted'
                                                        ? '✓ This request was approved — employee has temporary multi-device access.'
                                                        : '✗ This request was rejected — employee was notified.'}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </Stack>
            )}

            {/* ── Confirm respond dialog ── */}
            <Dialog
                open={!!dialogTarget}
                onClose={() => !responding && setDialogTarget(null)}
                PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 440 } }}
            >
                <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>
                    {dialogTarget?.action === 'granted' ? '✅ Approve Request?' : '❌ Reject Request?'}
                </DialogTitle>
                <DialogContent>
                    {respondError && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{respondError}</Alert>
                    )}
                    <DialogContentText sx={{ lineHeight: 1.7 }}>
                        {dialogTarget?.action === 'granted' ? (
                            <>
                                You are about to <strong>approve</strong> the lost-device request from{' '}
                                <strong>{dialogTarget?.request?.user_email}</strong>.
                                <br /><br />
                                This will grant them temporary clocking access from{' '}
                                <strong>{fmtDate(dialogTarget?.request?.startDate)}</strong> to{' '}
                                <strong>{fmtDate(dialogTarget?.request?.endDate)}</strong> ({daysBetween(dialogTarget?.request?.startDate, dialogTarget?.request?.endDate)} days).
                                The employee will be notified immediately.
                            </>
                        ) : (
                            <>
                                You are about to <strong>reject</strong> the lost-device request from{' '}
                                <strong>{dialogTarget?.request?.user_email}</strong>.
                                <br /><br />
                                The employee will <strong>not</strong> receive temporary multi-device access and will be notified of this decision.
                            </>
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ pb: 2, pr: 3, gap: 1 }}>
                    <Button
                        onClick={() => setDialogTarget(null)}
                        disabled={responding}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color={dialogTarget?.action === 'granted' ? 'success' : 'error'}
                        disabled={responding}
                        onClick={handleRespond}
                        startIcon={responding ? <CircularProgress size={16} color="inherit" /> : null}
                        sx={{
                            textTransform: 'none', fontWeight: 800, borderRadius: 2, px: 3,
                            ...(dialogTarget?.action === 'granted' && {
                                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
                            }),
                        }}
                    >
                        {responding ? 'Processing…' : dialogTarget?.action === 'granted' ? 'Yes, Approve' : 'Yes, Reject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserRequestsContent;