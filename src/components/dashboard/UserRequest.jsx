import {
    AssignmentTurnedIn, Block, CheckCircle, DevicesOther,
    ErrorOutline, FilterList, HourglassEmpty, InfoOutlined,
    PersonOutline, Refresh, Search, Timeline, VerifiedUser,
} from '@mui/icons-material';
import {
    Alert, Avatar, Box, Button, Chip, CircularProgress,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    Grid, InputAdornment, MenuItem, Select, Skeleton,
    Stack, TextField, Typography,
} from '@mui/material';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchAllLostDevices, respondToLostDevice } from '../../service/DeviceService';
import coreDataDetails from '../CoreDataDetails';

const { colorPalette } = coreDataDetails;

/* ══ STATUS CONFIG ══════════════════════════════════════════════════════════ */
const statusConfig = {
    pending:  { label:'Pending',  textColor:'#b45309', bg:'rgba(254,243,199,0.85)', border:'rgba(251,191,36,0.36)',  icon:<HourglassEmpty sx={{ fontSize:13 }}/>, glow:'rgba(251,191,36,0.18)'  },
    granted:  { label:'Approved', textColor:'#15803d', bg:'rgba(220,252,231,0.85)', border:'rgba(74,222,128,0.36)',  icon:<CheckCircle    sx={{ fontSize:13 }}/>, glow:'rgba(74,222,128,0.14)'  },
    rejected: { label:'Rejected', textColor:'#dc2626', bg:'rgba(254,226,226,0.85)', border:'rgba(248,113,113,0.36)', icon:<ErrorOutline   sx={{ fontSize:13 }}/>, glow:'rgba(248,113,113,0.12)' },
};

/* ══ GLASS TOKENS ══════════════════════════════════════════════════════════ */
const G = {
    card: {
        background:           'rgba(255,255,255,0.72)',
        backdropFilter:       'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border:               '1px solid rgba(255,255,255,0.60)',
        boxShadow:            '0 4px 24px rgba(10,61,98,0.08), inset 0 1px 0 rgba(255,255,255,0.80)',
    },
    dialog: {
        background:           'rgba(255,255,255,0.90)',
        backdropFilter:       'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        border:               '1px solid rgba(255,255,255,0.65)',
        boxShadow:            '0 24px 64px rgba(10,61,98,0.22)',
    },
    input: {
        '& .MuiOutlinedInput-root': {
            borderRadius: '12px', background: 'rgba(10,61,98,0.03)',
            '&:hover fieldset':       { borderColor: colorPalette.oceanBlue },
            '&.Mui-focused fieldset': { borderColor: colorPalette.oceanBlue, borderWidth: 2 },
        },
    },
    selectSx: { borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem', background: 'rgba(10,61,98,0.03)' },
};

/* ══ HELPERS ════════════════════════════════════════════════════════════════ */
const fmtDate     = iso => iso ? new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const daysBetween = (a, b) => (!a || !b) ? 0 : Math.round((new Date(b) - new Date(a)) / 86_400_000);

const initials = email => {
    if (!email) return '?';
    const [local] = email.split('@');
    const parts = local.split(/[._-]/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : local.slice(0, 2).toUpperCase();
};

const avatarColor = email => {
    const palette = [colorPalette.oceanBlue, colorPalette.seafoamGreen, colorPalette.cyanFresh, colorPalette.warmSand, colorPalette.coralSunset, colorPalette.deepNavy];
    let h = 0;
    for (const c of (email || '')) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
    return palette[Math.abs(h) % palette.length];
};

const durationStyle = d => d > 20
    ? { bg:'rgba(254,226,226,0.60)', color:'#dc2626', border:'rgba(248,113,113,0.35)' }
    : d > 10
    ? { bg:'rgba(254,243,199,0.60)', color:'#b45309', border:'rgba(251,191,36,0.35)'  }
    : { bg:'rgba(220,252,231,0.60)', color:'#15803d', border:'rgba(74,222,128,0.35)'  };

/* ══ BADGE EXPORT ═══════════════════════════════════════════════════════════ */
export const UserRequestsBadge = ({ count }) =>
    count > 0 ? (
        <Chip label={count > 99 ? '99+' : count} size="small" sx={{
            height:18, minWidth:18, fontSize:'0.6rem', fontWeight:900,
            bgcolor:colorPalette.coralSunset, color:'#fff', borderRadius:'9px', px:0.6, ml:0.5,
            animation:'urBadgePulse 2s infinite',
            '@keyframes urBadgePulse': {
                '0%,100%':{ boxShadow:`0 0 0 0 ${colorPalette.coralSunset}66` },
                '50%':     { boxShadow:`0 0 0 5px ${colorPalette.coralSunset}00` },
            },
        }}/>
    ) : null;

/* ══ AMBIENT ORBS ══════════════════════════════════════════════════════════ */
const AmbientOrbs = () => (
    <>
        {[
            { s:400, t:-55,    l:-110, c:'rgba(10,100,180,0.06)', b:70 },
            { s:320, t:'38%',  r:-75,  c:'rgba(32,178,170,0.05)', b:60 },
            { s:460, bot:-110, l:'28%',c:'rgba(10,61,98,0.04)',   b:80 },
        ].map(({ s,t,l,r,bot,c,b }, i) => (
            <Box key={i} sx={{ position:'absolute', width:s, height:s, pointerEvents:'none', zIndex:0,
                top:t, left:l, right:r, bottom:bot, borderRadius:'50%', background:c, filter:`blur(${b}px)` }}/>
        ))}
    </>
);

/* ══ SCROLL REVEAL ══════════════════════════════════════════════════════════ */
const Reveal = ({ children, delay = 0, y = 18 }) => {
    const ref    = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-40px' });
    return (
        <motion.div ref={ref} initial={{ opacity:0, y }} animate={inView ? { opacity:1, y:0 } : {}}
            transition={{ duration:0.50, delay, ease:[0.22,1,0.36,1] }}>
            {children}
        </motion.div>
    );
};

/* ══ STAT CARD ══════════════════════════════════════════════════════════════ */
const StatCard = ({ label, value, accent, icon, onClick, active }) => (
    <Box onClick={onClick} sx={{
        ...G.card, borderRadius:'20px', p:2.5,
        cursor: onClick ? 'pointer' : 'default',
        position:'relative', overflow:'hidden',
        border:      active ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.60)',
        background:  active ? 'rgba(255,255,255,0.86)' : 'rgba(255,255,255,0.72)',
        transition: 'all 0.24s ease',
        '&:hover': onClick ? { transform:'translateY(-4px)', boxShadow:`0 14px 36px ${accent}22` } : {},
        '&::after':  { content:'""', position:'absolute', top:0, left:0, right:0, height:3, borderRadius:'20px 20px 0 0', background:`linear-gradient(90deg,${accent},${accent}66)` },
        '&::before': { content:'""', position:'absolute', top:-22, right:-22, width:80, height:80, borderRadius:'50%', background:`${accent}0e`, zIndex:0 },
    }}>
        <Stack spacing={1.4} sx={{ position:'relative', zIndex:1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box sx={{ width:40, height:40, borderRadius:'13px', bgcolor:`${accent}14`, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${accent}22` }}>
                    {icon}
                </Box>
                {active && <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:accent, boxShadow:`0 0 8px ${accent}90` }}/>}
            </Stack>
            <Typography variant="h4" fontWeight={900} sx={{ color:accent, lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
                {value}
            </Typography>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform:'uppercase', letterSpacing:0.7, fontSize:'0.65rem' }}>
                {label}
            </Typography>
        </Stack>
    </Box>
);

/* ══ SKELETON ═══════════════════════════════════════════════════════════════ */
const RequestSkeleton = () => (
    <Box sx={{ ...G.card, borderRadius:'20px', p:2.8 }}>
        <Stack spacing={1.8}>
            <Stack direction="row" spacing={2} alignItems="center">
                <Skeleton variant="circular" width={46} height={46}/>
                <Box sx={{ flex:1 }}>
                    <Skeleton variant="text" width={210} height={20}/>
                    <Skeleton variant="text" width={130} height={15}/>
                </Box>
                <Skeleton variant="rounded" width={86} height={24} sx={{ borderRadius:'8px' }}/>
            </Stack>
            <Skeleton variant="rounded" height={56} sx={{ borderRadius:'14px' }}/>
            <Stack direction="row" spacing={1}>
                <Skeleton variant="rounded" width={120} height={22} sx={{ borderRadius:'9px' }}/>
                <Skeleton variant="rounded" width={105} height={22} sx={{ borderRadius:'9px' }}/>
            </Stack>
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
                <Skeleton variant="rounded" width={92} height={36} sx={{ borderRadius:'12px' }}/>
                <Skeleton variant="rounded" width={92} height={36} sx={{ borderRadius:'12px' }}/>
            </Stack>
        </Stack>
    </Box>
);

/* ══ MAIN ═══════════════════════════════════════════════════════════════════ */
const UserRequestsContent = ({ onCountChange }) => {
    const [requests,       setRequests]       = useState([]);
    const [loading,        setLoading]        = useState(true);
    const [fetchError,     setFetchError]     = useState('');
    const [search,         setSearch]         = useState('');
    const [statusFilter,   setStatusFilter]   = useState('all');
    const [sortOrder,      setSortOrder]      = useState('newest');
    const [dialogTarget,   setDialogTarget]   = useState(null);
    const [responding,     setResponding]     = useState(false);
    const [respondError,   setRespondError]   = useState('');
    const [respondSuccess, setRespondSuccess] = useState('');

    const loadRequests = useCallback(async () => {
        setLoading(true); setFetchError('');
        try {
            const data = await fetchAllLostDevices();
            const list = Array.isArray(data) ? data : (data.requests ?? []);
            setRequests(list);
            onCountChange?.(list.filter(r => r.status === 'pending').length);
        } catch (err) {
            setFetchError(typeof err === 'string' ? err : 'Failed to load requests.');
        } finally { setLoading(false); }
    }, [onCountChange]);

    useEffect(() => { loadRequests(); }, [loadRequests]);

    const stats = useMemo(() => ({
        total:    requests.length,
        pending:  requests.filter(r => r.status === 'pending').length,
        granted:  requests.filter(r => r.status === 'granted').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
    }), [requests]);

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
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        return list;
    }, [requests, statusFilter, search, sortOrder]);

    const handleRespond = async () => {
        if (!dialogTarget) return;
        setResponding(true); setRespondError('');
        try {
            await respondToLostDevice(dialogTarget.request._id, dialogTarget.action);
            setRespondSuccess(`Request from ${dialogTarget.request.user_email} has been ${dialogTarget.action === 'granted' ? 'approved' : 'rejected'}.`);
            setTimeout(() => setRespondSuccess(''), 6000);
            setDialogTarget(null);
            await loadRequests();
        } catch (err) {
            setRespondError(typeof err === 'string' ? err : 'Failed to respond. Please try again.');
        } finally { setResponding(false); }
    };

    const statCards = [
        { label:'Total Requests', value:stats.total,    accent:colorPalette.deepNavy,     icon:<DevicesOther   sx={{ color:colorPalette.deepNavy,     fontSize:'1.15rem' }}/>, filter:'all'      },
        { label:'Pending',        value:stats.pending,  accent:'#d97706',                  icon:<HourglassEmpty sx={{ color:'#d97706',                  fontSize:'1.15rem' }}/>, filter:'pending'  },
        { label:'Approved',       value:stats.granted,  accent:colorPalette.seafoamGreen,  icon:<CheckCircle    sx={{ color:colorPalette.seafoamGreen,  fontSize:'1.15rem' }}/>, filter:'granted'  },
        { label:'Rejected',       value:stats.rejected, accent:colorPalette.coralSunset,   icon:<Block          sx={{ color:colorPalette.coralSunset,   fontSize:'1.15rem' }}/>, filter:'rejected' },
    ];

    /* ══ RENDER ════════════════════════════════════════════════════════════ */
    return (
        <Box sx={{ width:'100%', position:'relative' }}>
            <AmbientOrbs/>

            {/* ── Global alerts ── */}
            <AnimatePresence>
                {respondSuccess && (
                    <motion.div key="ok" initial={{ opacity:0, y:-14 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}>
                        <Alert icon={<CheckCircle/>} severity="success" onClose={() => setRespondSuccess('')}
                            sx={{ mb:2.5, borderRadius:'14px', fontWeight:700, backdropFilter:'blur(16px)', background:'rgba(220,252,231,0.90)', border:'1px solid rgba(74,222,128,0.40)', boxShadow:'0 4px 20px rgba(74,222,128,0.14)' }}>
                            {respondSuccess}
                        </Alert>
                    </motion.div>
                )}
                {fetchError && (
                    <motion.div key="err" initial={{ opacity:0, y:-14 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                        <Alert severity="error" onClose={() => setFetchError('')}
                            action={<Button size="small" onClick={loadRequests} sx={{ fontWeight:700 }}>Retry</Button>}
                            sx={{ mb:2.5, borderRadius:'14px', fontWeight:600, backdropFilter:'blur(16px)' }}>
                            {fetchError}
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Stat cards ── */}
            <Grid container spacing={2} sx={{ mb:3, position:'relative', zIndex:1 }}>
                {statCards.map((c, i) => (
                    <Grid item xs={6} sm={3} key={c.label}>
                        <Reveal delay={i * 0.07}>
                            {loading
                                ? <Skeleton variant="rounded" height={118} sx={{ borderRadius:'20px' }}/>
                                : <StatCard {...c} onClick={() => setStatusFilter(c.filter)} active={statusFilter === c.filter}/>
                            }
                        </Reveal>
                    </Grid>
                ))}
            </Grid>

            {/* ── Filters bar ── */}
            <Reveal>
                <Box sx={{ ...G.card, borderRadius:'20px', p:2.2, mb:2.5, position:'relative', zIndex:1 }}>
                    <Stack direction={{ xs:'column', sm:'row' }} spacing={1.5} alignItems={{ sm:'center' }}>
                        {/* Search */}
                        <TextField size="small" fullWidth placeholder="Search by email, description or ID…"
                            value={search} onChange={e => setSearch(e.target.value)}
                            InputProps={{ startAdornment:(
                                <InputAdornment position="start"><Search sx={{ fontSize:17, color:'text.disabled' }}/></InputAdornment>
                            )}}
                            sx={{ flex:1, ...G.input }}/>

                        <Stack direction="row" spacing={1.2} alignItems="center" flexShrink={0} flexWrap="wrap" gap={1}>
                            {/* Filter icon */}
                            <Box sx={{ width:30, height:30, borderRadius:'9px', bgcolor:`${colorPalette.oceanBlue}0d`, border:`1px solid ${colorPalette.oceanBlue}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <FilterList sx={{ color:colorPalette.oceanBlue, fontSize:'1.05rem' }}/>
                            </Box>

                            {/* Status select */}
                            <Select size="small" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                sx={{ ...G.selectSx, minWidth:132 }}>
                                <MenuItem value="all">All Statuses</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="granted">Approved</MenuItem>
                                <MenuItem value="rejected">Rejected</MenuItem>
                            </Select>

                            {/* Sort select */}
                            <Select size="small" value={sortOrder} onChange={e => setSortOrder(e.target.value)}
                                sx={{ ...G.selectSx, minWidth:148 }}>
                                <MenuItem value="newest">Newest First</MenuItem>
                                <MenuItem value="oldest">Oldest First</MenuItem>
                                <MenuItem value="duration">Longest Duration</MenuItem>
                            </Select>

                            {/* Refresh button */}
                            <Button size="small" startIcon={loading ? <CircularProgress size={13}/> : <Refresh sx={{ fontSize:'1rem !important' }}/>}
                                onClick={loadRequests} disabled={loading}
                                sx={{ borderRadius:'12px', textTransform:'none', fontWeight:700, fontSize:'0.82rem',
                                    background:'rgba(255,255,255,0.72)', backdropFilter:'blur(12px)',
                                    border:'1px solid rgba(10,61,98,0.14)', color:colorPalette.deepNavy, px:2,
                                    whiteSpace:'nowrap',
                                    '&:hover':{ border:`1px solid ${colorPalette.oceanBlue}`, bgcolor:'rgba(10,61,98,0.05)' },
                                    transition:'all 0.18s ease',
                                }}>
                                Refresh
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Reveal>

            {/* ── Result count / clear ── */}
            {!loading && (
                <Stack direction="row" alignItems="center" spacing={1} mb={2} sx={{ position:'relative', zIndex:1 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Showing <strong style={{ color:colorPalette.deepNavy }}>{filtered.length}</strong> of <strong>{requests.length}</strong> requests
                    </Typography>
                    {(search || statusFilter !== 'all') && (
                        <Button size="small" onClick={() => { setSearch(''); setStatusFilter('all'); }}
                            sx={{ textTransform:'none', fontSize:'0.72rem', color:colorPalette.coralSunset, fontWeight:700,
                                borderRadius:'8px', px:1.2, '&:hover':{ bgcolor:`${colorPalette.coralSunset}0c` } }}>
                            Clear filters
                        </Button>
                    )}
                </Stack>
            )}

            {/* ── Skeletons ── */}
            {loading && (
                <Stack spacing={2} sx={{ position:'relative', zIndex:1 }}>
                    {[1,2,3].map(k => <RequestSkeleton key={k}/>)}
                </Stack>
            )}

            {/* ── Empty state ── */}
            {!loading && !fetchError && filtered.length === 0 && (
                <Reveal>
                    <Box sx={{ ...G.card, borderRadius:'20px', p:6, textAlign:'center', position:'relative', zIndex:1, border:'1.5px dashed rgba(10,61,98,0.13)' }}>
                        <Box sx={{ width:72, height:72, borderRadius:'22px', bgcolor:'rgba(10,61,98,0.06)', display:'flex', alignItems:'center', justifyContent:'center', mx:'auto', mb:2, border:'1px solid rgba(10,61,98,0.08)' }}>
                            <DevicesOther sx={{ fontSize:38, color:'rgba(10,61,98,0.22)' }}/>
                        </Box>
                        <Typography fontWeight={700} color="text.disabled" sx={{ fontSize:'0.95rem', mb:1.5 }}>
                            {requests.length === 0 ? 'No lost device requests have been submitted yet.' : 'No requests match your current filters.'}
                        </Typography>
                        {(search || statusFilter !== 'all') && (
                            <Button size="small" onClick={() => { setSearch(''); setStatusFilter('all'); }}
                                sx={{ textTransform:'none', fontWeight:700, color:colorPalette.oceanBlue, borderRadius:'10px',
                                    bgcolor:`${colorPalette.oceanBlue}08`, px:2, '&:hover':{ bgcolor:`${colorPalette.oceanBlue}12` } }}>
                                Clear filters
                            </Button>
                        )}
                    </Box>
                </Reveal>
            )}

            {/* ══ REQUEST CARDS ════════════════════════════════════════════ */}
            {!loading && filtered.length > 0 && (
                <Stack spacing={2} sx={{ position:'relative', zIndex:1 }}>
                    <AnimatePresence>
                        {filtered.map((req, i) => {
                            const sc        = statusConfig[req.status] || statusConfig.pending;
                            const isPending = req.status === 'pending';
                            const isGranted = req.status === 'granted';
                            const duration  = daysBetween(req.startDate, req.endDate);
                            const dc        = durationStyle(duration);
                            const avColor   = avatarColor(req.user_email);

                            return (
                                <motion.div key={req._id || i}
                                    initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                                    transition={{ delay:i * 0.045, ease:[0.22,1,0.36,1] }}>
                                    <Box sx={{
                                        ...G.card,
                                        borderRadius:'22px', p:0, overflow:'hidden',
                                        border:      `1.5px solid ${sc.border}`,
                                        boxShadow:   `0 4px 24px ${sc.glow}, inset 0 1px 0 rgba(255,255,255,0.80)`,
                                        transition:  'all 0.26s ease',
                                        '&:hover':   { transform:'translateY(-3px)', boxShadow:`0 14px 38px ${sc.glow}, 0 0 0 1.5px ${sc.border}` },
                                    }}>
                                        {/* top accent bar */}
                                        <Box sx={{ height:3, background:`linear-gradient(90deg,${sc.textColor},${sc.textColor}66)` }}/>

                                        <Box sx={{ p:{ xs:2.2, sm:2.8 } }}>

                                            {/* ── Identity row ── */}
                                            <Stack direction={{ xs:'column', sm:'row' }} alignItems={{ sm:'flex-start' }} justifyContent="space-between" spacing={1.5} mb={2}>
                                                <Stack direction="row" spacing={1.6} alignItems="center" sx={{ minWidth:0 }}>
                                                    {/* Avatar with status dot */}
                                                    <Box sx={{ position:'relative', flexShrink:0 }}>
                                                        <Avatar sx={{
                                                            bgcolor:avColor, width:46, height:46,
                                                            fontWeight:900, fontSize:'0.92rem',
                                                            border:'2.5px solid rgba(255,255,255,0.80)',
                                                            boxShadow:`0 4px 16px ${avColor}40`,
                                                        }}>
                                                            {initials(req.user_email)}
                                                        </Avatar>
                                                        <Box sx={{ position:'absolute', bottom:1, right:1, width:11, height:11, borderRadius:'50%', bgcolor:sc.textColor, border:'2px solid #fff', boxShadow:`0 0 6px ${sc.textColor}` }}/>
                                                    </Box>

                                                    <Box sx={{ minWidth:0 }}>
                                                        <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap" gap={0.5} mb={0.3}>
                                                            <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy} noWrap sx={{ fontSize:'0.88rem' }}>
                                                                {req.user_email}
                                                            </Typography>

                                                            {/* Status pill */}
                                                            <Box sx={{ display:'inline-flex', alignItems:'center', gap:0.45, px:1.1, py:0.32, borderRadius:'8px', bgcolor:sc.bg, border:`1px solid ${sc.border}` }}>
                                                                {sc.icon}
                                                                <Typography variant="caption" fontWeight={800} sx={{ color:sc.textColor, fontSize:'0.67rem', lineHeight:1 }}>
                                                                    {sc.label}
                                                                </Typography>
                                                            </Box>

                                                            {/* Responded-by chip */}
                                                            {req.responded && req.responded !== 'pending' && (
                                                                <Box sx={{ display:'inline-flex', alignItems:'center', gap:0.4, px:0.9, py:0.26, borderRadius:'7px', bgcolor:`${colorPalette.deepNavy}08`, border:`1px solid ${colorPalette.deepNavy}14` }}>
                                                                    <VerifiedUser sx={{ fontSize:11, color:colorPalette.deepNavy, opacity:0.62 }}/>
                                                                    <Typography variant="caption" fontWeight={700} sx={{ color:colorPalette.deepNavy, fontSize:'0.62rem', opacity:0.72 }}>
                                                                        By {req.responded}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                        </Stack>
                                                        <Typography variant="caption" color="text.disabled" sx={{ fontSize:'0.68rem' }}>
                                                            ID: {req._id ? req._id.slice(-8).toUpperCase() : '—'} · Submitted {fmtDate(req.createdAt)}
                                                        </Typography>
                                                    </Box>
                                                </Stack>

                                                {/* Duration badge */}
                                                <Box sx={{ display:'inline-flex', alignItems:'center', gap:0.5, px:1.2, py:0.45, borderRadius:'10px', bgcolor:dc.bg, border:`1px solid ${dc.border}`, flexShrink:0, alignSelf:{ xs:'flex-start', sm:'center' } }}>
                                                    <Timeline sx={{ fontSize:13, color:dc.color }}/>
                                                    <Typography variant="caption" fontWeight={800} sx={{ color:dc.color, fontSize:'0.7rem' }}>
                                                        {duration} day{duration !== 1 ? 's' : ''}
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            {/* ── Description block ── */}
                                            <Box sx={{
                                                borderRadius:'14px', px:2, py:1.5, mb:2,
                                                background:'rgba(10,61,98,0.034)',
                                                border:'1px solid rgba(10,61,98,0.07)',
                                                borderLeft:`3.5px solid ${sc.textColor}`,
                                            }}>
                                                <Stack direction="row" spacing={0.9} alignItems="flex-start">
                                                    <InfoOutlined sx={{ fontSize:15, color:'text.disabled', mt:0.28, flexShrink:0 }}/>
                                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight:1.65, fontSize:'0.83rem' }}>
                                                        {req.description}
                                                    </Typography>
                                                </Stack>
                                            </Box>

                                            {/* ── Date chips ── */}
                                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={isPending ? 2.5 : 1.2}>
                                                {[
                                                    { lbl:`From: ${fmtDate(req.startDate)}`, bg:`${colorPalette.oceanBlue}10`,     col:colorPalette.oceanBlue,     bd:`${colorPalette.oceanBlue}28`     },
                                                    { lbl:`Until: ${fmtDate(req.endDate)}`,  bg:`${colorPalette.seafoamGreen}12`,  col:colorPalette.seafoamGreen,  bd:`${colorPalette.seafoamGreen}28`  },
                                                ].map(({ lbl, bg, col, bd }) => (
                                                    <Box key={lbl} sx={{ display:'inline-flex', alignItems:'center', gap:0.5, px:1.2, py:0.4, borderRadius:'9px', bgcolor:bg, border:`1px solid ${bd}` }}>
                                                        <PersonOutline sx={{ fontSize:12, color:col }}/>
                                                        <Typography variant="caption" fontWeight={700} sx={{ color:col, fontSize:'0.7rem' }}>{lbl}</Typography>
                                                    </Box>
                                                ))}
                                            </Stack>

                                            {/* ── Action buttons ── */}
                                            {isPending && (
                                                <>
                                                    <Box sx={{ height:'1px', bgcolor:'rgba(10,61,98,0.07)', mb:2.5 }}/>
                                                    <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                                                        <Button variant="outlined" size="small" startIcon={<Block sx={{ fontSize:15 }}/>}
                                                            onClick={() => setDialogTarget({ request:req, action:'rejected' })}
                                                            sx={{ borderRadius:'12px', textTransform:'none', fontWeight:800, fontSize:'0.8rem', px:2.5, py:0.9,
                                                                color:colorPalette.coralSunset, borderColor:`${colorPalette.coralSunset}55`,
                                                                bgcolor:`${colorPalette.coralSunset}06`,
                                                                '&:hover':{ bgcolor:`${colorPalette.coralSunset}10`, borderColor:colorPalette.coralSunset, transform:'translateY(-1px)' },
                                                                transition:'all 0.18s ease',
                                                            }}>
                                                            Reject
                                                        </Button>
                                                        <Button variant="contained" size="small" startIcon={<CheckCircle sx={{ fontSize:15 }}/>}
                                                            onClick={() => setDialogTarget({ request:req, action:'granted' })}
                                                            sx={{ borderRadius:'12px', textTransform:'none', fontWeight:800, fontSize:'0.8rem', px:2.5, py:0.9,
                                                                background:`linear-gradient(135deg,${colorPalette.seafoamGreen},#15803d)`,
                                                                boxShadow:`0 6px 20px ${colorPalette.seafoamGreen}44`,
                                                                '&:hover':{ boxShadow:`0 8px 28px ${colorPalette.seafoamGreen}55`, transform:'translateY(-1.5px)' },
                                                                transition:'all 0.18s ease',
                                                            }}>
                                                            Approve
                                                        </Button>
                                                    </Stack>
                                                </>
                                            )}

                                            {/* ── Resolved note ── */}
                                            {!isPending && (
                                                <Box sx={{ display:'inline-flex', alignItems:'center', gap:0.7, px:1.4, py:0.55, borderRadius:'10px', bgcolor:sc.bg, border:`1px solid ${sc.border}`, mt:0.5 }}>
                                                    <Typography sx={{ fontSize:'0.78rem', lineHeight:1 }}>{isGranted ? '✓' : '✗'}</Typography>
                                                    <Typography variant="caption" fontWeight={700} sx={{ color:sc.textColor, fontSize:'0.7rem' }}>
                                                        {isGranted
                                                            ? 'Approved — employee has temporary multi-device access.'
                                                            : 'Rejected — employee was notified of this decision.'}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </Stack>
            )}

            {/* ══ CONFIRM DIALOG ══════════════════════════════════════════ */}
            <Dialog open={!!dialogTarget} onClose={() => !responding && setDialogTarget(null)}
                PaperProps={{ sx:{ ...G.dialog, borderRadius:'24px', p:1, maxWidth:460, width:'100%' } }}
                BackdropProps={{ sx:{ backdropFilter:'blur(6px)', bgcolor:'rgba(6,28,50,0.22)' } }}>

                <DialogTitle sx={{ fontWeight:900, color:colorPalette.deepNavy, pb:0.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{
                            width:44, height:44, borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center',
                            bgcolor: dialogTarget?.action === 'granted' ? `${colorPalette.seafoamGreen}14` : `${colorPalette.coralSunset}14`,
                            border:  dialogTarget?.action === 'granted' ? `1.5px solid ${colorPalette.seafoamGreen}30` : `1.5px solid ${colorPalette.coralSunset}30`,
                        }}>
                            {dialogTarget?.action === 'granted'
                                ? <CheckCircle sx={{ color:colorPalette.seafoamGreen }}/>
                                : <Block       sx={{ color:colorPalette.coralSunset  }}/>}
                        </Box>
                        <span>{dialogTarget?.action === 'granted' ? 'Approve Request?' : 'Reject Request?'}</span>
                    </Stack>
                </DialogTitle>

                <DialogContent>
                    {respondError && (
                        <Alert severity="error" sx={{ mb:2, borderRadius:'12px', fontWeight:600 }}>{respondError}</Alert>
                    )}
                    <DialogContentText sx={{ lineHeight:1.75, color:'rgba(20,40,60,0.72)', fontSize:'0.88rem' }}>
                        {dialogTarget?.action === 'granted' ? (
                            <>
                                You are about to <strong>approve</strong> the lost-device request from{' '}
                                <strong style={{ color:colorPalette.deepNavy }}>{dialogTarget?.request?.user_email}</strong>.
                                <br/><br/>
                                This grants temporary clocking access from{' '}
                                <strong>{fmtDate(dialogTarget?.request?.startDate)}</strong> to{' '}
                                <strong>{fmtDate(dialogTarget?.request?.endDate)}</strong>{' '}
                                ({daysBetween(dialogTarget?.request?.startDate, dialogTarget?.request?.endDate)} days).
                                The employee will be notified immediately.
                            </>
                        ) : (
                            <>
                                You are about to <strong>reject</strong> the lost-device request from{' '}
                                <strong style={{ color:colorPalette.deepNavy }}>{dialogTarget?.request?.user_email}</strong>.
                                <br/><br/>
                                The employee will <strong>not</strong> receive temporary multi-device access and will be notified of this decision.
                            </>
                        )}
                    </DialogContentText>
                </DialogContent>

                <DialogActions sx={{ px:3, pb:2.5, gap:1 }}>
                    <Button onClick={() => setDialogTarget(null)} disabled={responding}
                        sx={{ borderRadius:'12px', textTransform:'none', fontWeight:700, px:2.5,
                            bgcolor:'rgba(10,61,98,0.05)', border:'1px solid rgba(10,61,98,0.12)',
                            color:colorPalette.deepNavy, '&:hover':{ bgcolor:'rgba(10,61,98,0.09)' } }}>
                        Cancel
                    </Button>
                    <Button variant="contained" disabled={responding} onClick={handleRespond}
                        startIcon={responding ? <CircularProgress size={15} sx={{ color:'#fff' }}/> : null}
                        sx={{
                            borderRadius:'12px', textTransform:'none', fontWeight:800, px:3,
                            transition:'all 0.18s ease',
                            ...(dialogTarget?.action === 'granted'
                                ? { background:`linear-gradient(135deg,${colorPalette.seafoamGreen},#15803d)`, boxShadow:`0 6px 22px ${colorPalette.seafoamGreen}44`, '&:hover':{ boxShadow:`0 8px 30px ${colorPalette.seafoamGreen}55`, transform:'translateY(-1px)' } }
                                : { bgcolor:colorPalette.coralSunset, boxShadow:`0 6px 22px ${colorPalette.coralSunset}44`, '&:hover':{ boxShadow:`0 8px 30px ${colorPalette.coralSunset}55`, transform:'translateY(-1px)' } }
                            ),
                        }}>
                        {responding ? 'Processing…' : dialogTarget?.action === 'granted' ? 'Yes, Approve' : 'Yes, Reject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserRequestsContent;