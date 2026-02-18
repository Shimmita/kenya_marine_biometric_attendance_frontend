import {
    AddCircle, AssignmentTurnedIn, Dashboard as DashIcon,
    History, Logout, Menu as MenuIcon, NotificationAddRounded,
    PhoneLocked, QueryStats, Smartphone
} from '@mui/icons-material';
import {
    AppBar, Avatar, Box, Button, Chip, Dialog, DialogActions,
    DialogContent, DialogTitle,
    Drawer, IconButton,
    List, ListItem, ListItemIcon, ListItemText, Stack, Toolbar,
    Tooltip, Typography, useMediaQuery, useTheme
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import KMFRILogo from '../assets/kmfri.png';

import AnalyticsReportsContent from './dashboard/AnalyticsReport';
import AttendanceHistoryContent from './dashboard/AttendanceHistory';
import DashboardContent from './dashboard/DashBoardContent';
import DepartmentStructureContent from './dashboard/DepartmentStructure';
import LeaveManagementContent from './dashboard/LeaveManagement';
import NotificationManagementContent from './dashboard/NotificationManagement';
import OverallAttendanceStats from './dashboard/OverallAttendance';
import TasksActivitiesContent from './dashboard/TaskActivities';

import coreDataDetails from './CoreDataDetails';
import AddDeviceContent from './dashboard/AddDevice';
import LostDeviceContent from './dashboard/LostDevice';
import UserRequestsContent, { UserRequestsBadge } from './dashboard/UserRequest';

import { useNavigate } from 'react-router-dom';
import { resetClearCurrentUserRedux } from '../redux/CurrentUser';
import { fetchAllLostDevices } from '../service/DeviceService';
import { userSignOut } from '../service/UserProfile';
import DownloadMobileAppSection from './dashboard/DownloadMobileApp';

const { colorPalette } = coreDataDetails;

const DRAWER_WIDTH = 330;
const APPBAR_HEIGHT = 64;

/* ══ ROLE CONSTANTS ════════════════════════════════════════════════════════ */
const ELEVATED_RANKS = ['admin', 'hr', 'supervisor', 'ceo'];
const PRIVILEGED_RANKS = ['admin', 'hr', 'supervisor'];
const RANK_META = {
    admin: { label: 'Admin' }, hr: { label: 'HR' }, supervisor: { label: 'Supervisor' },
    ceo: { label: 'CEO' }, user: { label: 'Employee' },
};

/* ══ GLASS TOKENS (dark — matches landing page) ════════════════════════════ */
const G = {
    meshBg: `
        radial-gradient(ellipse at 12% 18%, rgba(0,130,190,0.52) 0%, transparent 46%),
        radial-gradient(ellipse at 80% 10%, rgba(0,55,115,0.62) 0%, transparent 40%),
        radial-gradient(ellipse at 58% 78%, rgba(0,110,155,0.42) 0%, transparent 50%),
        radial-gradient(ellipse at 3%  88%, rgba(8,44,82,0.56)  0%, transparent 38%),
        radial-gradient(ellipse at 94% 85%, rgba(0,185,175,0.24) 0%, transparent 36%),
        linear-gradient(158deg, #051c30 0%, #09355a 38%, #073a52 68%, #052840 100%)
    `,
    nav: {
        background: 'rgba(5,24,46,0.82)',
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        borderBottom: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 4px 28px rgba(0,0,0,0.28)',
    },
    surface: {
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.13)',
        boxShadow: '0 4px 20px rgba(6,28,50,0.22), inset 0 1px 0 rgba(255,255,255,0.10)',
    },
    sidebarBg: {
        background: 'rgba(5,20,42,0.78)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '4px 0 32px rgba(0,0,0,0.24)',
    },
    dialog: {
        background: 'rgba(255,255,255,0.90)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        border: '1px solid rgba(255,255,255,0.65)',
        boxShadow: '0 24px 64px rgba(10,61,98,0.22)',
    },
};

/* ══ AMBIENT ORBS (sidebar depth) ══════════════════════════════════════════ */
const SidebarOrbs = () => (
    <>
        {[
            { s: 180, t: -30, l: -40, c: 'rgba(0,140,200,0.12)', b: 48 },
            { s: 140, bot: -20, r: -30, c: 'rgba(0,185,175,0.10)', b: 40 },
        ].map(({ s, t, l, r, bot, c, b }, i) => (
            <Box key={i} sx={{ position: 'absolute', width: s, height: s, pointerEvents: 'none', zIndex: 0, top: t, left: l, right: r, bottom: bot, borderRadius: '50%', background: c, filter: `blur(${b}px)` }} />
        ))}
    </>
);

/* ══ SECTION LABEL ══════════════════════════════════════════════════════════ */
const SectionLabel = ({ children }) => (
    <Box sx={{ px: 1.5, pt: 2.2, pb: 0.6 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.56rem', letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)', whiteSpace: 'nowrap' }}>
                {children}
            </Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.08)' }} />
        </Stack>
    </Box>
);

/* ══ NAV ITEM ═══════════════════════════════════════════════════════════════ */
const NavItem = ({ item, isActive, pendingCount, onClick }) => (
    <motion.div whileHover={{ x: isActive ? 0 : 4 }} transition={{ type: 'spring', stiffness: 440, damping: 34 }}>
        <ListItem button onClick={onClick} sx={{
            borderRadius: '14px', mb: 0.5, px: 1.4, py: 1,
            position: 'relative', overflow: 'hidden',
            color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
            transition: 'color 0.18s ease',
            '&:hover': { color: isActive ? '#fff' : 'rgba(255,255,255,0.88)', bgcolor: 'transparent' },
            bgcolor: 'transparent',
            '&::before': {
                content: '""', position: 'absolute', inset: 0, borderRadius: '14px',
                background: isActive ? `linear-gradient(120deg,${item.color}d8,${item.color}88)` : 'transparent',
                boxShadow: isActive ? `0 6px 22px ${item.color}40` : 'none',
                transition: 'all 0.22s ease', zIndex: 0,
            },
            '&:hover::before': !isActive ? { background: `${item.color}16` } : {},
        }}>
            <ListItemIcon sx={{ color: isActive ? 'rgba(255,255,255,0.92)' : item.color, minWidth: 34, position: 'relative', zIndex: 1, '& svg': { fontSize: 19 }, transition: 'color 0.18s ease' }}>
                {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} sx={{ position: 'relative', zIndex: 1, my: 0 }}
                primaryTypographyProps={{ fontWeight: isActive ? 700 : 500, fontSize: '0.875rem', letterSpacing: isActive ? 0.15 : 0, lineHeight: 1.25 }} />
            <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 0.6 }}>
                {item.text === 'User Requests' && <UserRequestsBadge count={pendingCount} />}
                {isActive && <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.85)', boxShadow: '0 0 6px rgba(255,255,255,0.7)', flexShrink: 0 }} />}
            </Box>
        </ListItem>
    </motion.div>
);

/* ══ DRAWER CONTENT ═════════════════════════════════════════════════════════ */
const DrawerContent = ({ user, isElevated, isPrivileged, activeTab, pendingCount, onTabChange, onLogout, rankMeta }) => {
    const baseItems = [
        { text: 'Clocking Dashboard', icon: <DashIcon />, color: colorPalette.aquaVibrant },
        { text: 'Attendance History', icon: <History />, color: '#60a5fa' },
        { text: 'Notification Panel', icon: <NotificationAddRounded />, color: '#a78bfa' },
        { text: 'Our Mobile App', icon: <Smartphone />, color: '#38bdf8' },
    ];
    const adminItems = [{ text: 'Organisation Overview', icon: <QueryStats />, color: colorPalette.seafoamGreen }];
    const reqItems = [{ text: 'User Requests', icon: <AssignmentTurnedIn />, color: '#f87171' }];
    const techItems = [
        { text: 'Lost Device', icon: <PhoneLocked />, color: '#fb923c' },
        { text: 'Add Device', icon: <AddCircle />, color: '#fbbf24' },
    ];

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', ...G.sidebarBg }}>
            <SidebarOrbs />

            {/* ── Profile card ── */}
            <Box sx={{ px: 1.5, pt: 2, pb: 0.5, position: 'relative', zIndex: 1 }}>
                <Box sx={{
                    borderRadius: '18px', p: 2.2, position: 'relative', overflow: 'hidden',
                    background: 'rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.13)',
                    boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
                }}>
                    {/* decorative blobs */}
                    <Box sx={{ position: 'absolute', top: -18, right: -18, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(0,220,255,0.07)', pointerEvents: 'none' }} />
                    <Box sx={{ position: 'absolute', bottom: -22, left: 10, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(0,185,175,0.06)', pointerEvents: 'none' }} />
                    <Stack direction="row" alignItems="center" spacing={1.4} sx={{ position: 'relative', zIndex: 1 }}>
                        <Avatar sx={{
                            width: 44, height: 44, flexShrink: 0,
                            background: 'linear-gradient(135deg,rgba(0,220,255,0.30),rgba(0,185,175,0.20))',
                            border: '2px solid rgba(255,255,255,0.22)',
                            color: '#fff', fontWeight: 900, fontSize: '0.95rem',
                            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.24)',
                        }}>
                            {user?.name?.split(' ')[0]?.charAt(0)}{user?.name?.split(' ')[1]?.charAt(0)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography noWrap sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#fff', lineHeight: 1.2 }}>
                                {user?.name || 'User'}
                            </Typography>
                            <Typography noWrap sx={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.50)', mt: 0.2 }}>
                                {user?.department || user?.email || ''}
                            </Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 1.3, position: 'relative', zIndex: 1 }}>
                        <Chip label={(rankMeta.label).toUpperCase()} size="small" sx={{
                            height: 18, fontWeight: 900, fontSize: '0.55rem', letterSpacing: 1.6,
                            bgcolor: 'rgba(0,220,255,0.14)', color: '#00e5ff',
                            borderRadius: '6px', border: '1px solid rgba(0,220,255,0.28)',
                        }} />
                        {user?.employeeId && (
                            <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.36)', fontFamily: 'monospace' }}>
                                #{user.employeeId}
                            </Typography>
                        )}
                    </Stack>
                </Box>
            </Box>

            {/* ── Nav ── */}
            <Box sx={{
                flex: 1, overflowY: 'auto', overflowX: 'hidden', px: 1, pb: 1, position: 'relative', zIndex: 1,
                '&::-webkit-scrollbar': { width: 2 },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.10)', borderRadius: 2 },
            }}>
                <SectionLabel>Navigation</SectionLabel>
                <List disablePadding>
                    {baseItems.map(item => (
                        <NavItem key={item.text} item={item} isActive={activeTab === item.text} pendingCount={pendingCount} onClick={() => onTabChange(item.text)} />
                    ))}
                </List>
                {isElevated && (<>
                    <SectionLabel>Admin Tools</SectionLabel>
                    <List disablePadding>
                        {adminItems.map(item => <NavItem key={item.text} item={item} isActive={activeTab === item.text} pendingCount={pendingCount} onClick={() => onTabChange(item.text)} />)}
                    </List>
                </>)}
                {isPrivileged && (<>
                    <SectionLabel>User Requests</SectionLabel>
                    <List disablePadding>
                        {reqItems.map(item => <NavItem key={item.text} item={item} isActive={activeTab === item.text} pendingCount={pendingCount} onClick={() => onTabChange(item.text)} />)}
                    </List>
                </>)}
                <SectionLabel>Technical Help</SectionLabel>
                <List disablePadding>
                    {techItems.map(item => <NavItem key={item.text} item={item} isActive={activeTab === item.text} pendingCount={pendingCount} onClick={() => onTabChange(item.text)} />)}
                </List>
            </Box>

            {/* ── Logout ── */}
            <Box sx={{ px: 1.5, pb: 2.5, pt: 0.5, position: 'relative', zIndex: 1 }}>
                <Box sx={{ height: '1px', bgcolor: 'rgba(255,255,255,0.08)', mb: 1.5 }} />
                <Button fullWidth startIcon={<Logout sx={{ fontSize: '16px !important' }} />} onClick={onLogout} sx={{
                    borderRadius: '13px', py: 1.1, fontWeight: 700, fontSize: '0.875rem',
                    textTransform: 'none', justifyContent: 'flex-start', pl: 1.8,
                    color: 'rgba(251,113,113,0.88)', bgcolor: 'rgba(239,68,68,0.07)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    '&:hover': { bgcolor: 'rgba(239,68,68,0.14)', color: '#f87171', border: '1px solid rgba(239,68,68,0.30)' },
                    transition: 'all 0.18s ease',
                }}>
                    Log Out
                </Button>
            </Box>
        </Box>
    );
};

/* ══ MAIN ═══════════════════════════════════════════════════════════════════ */
const EnhancedDashboard = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
    const { user } = useSelector(s => s.currentUser);
    const dispatch = useDispatch();
    const navigate = useNavigate()

    const [mobileOpen, setMobileOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState('Clocking Dashboard');
    const [userLocation, setUserLocation] = useState(null);
    const [isWithinGeofence, setIsWithinGeofence] = useState(false);
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const [tasks, setTasks] = useState([
        { id: 1, title: 'Water quality analysis - Station A', status: 'completed', time: '09:30 AM', date: '2024-02-04' },
        { id: 2, title: 'Update marine biodiversity database', status: 'in-progress', time: '11:00 AM', date: '2024-02-04' },
        { id: 3, title: 'Team meeting - Research protocols', status: 'pending', time: '02:00 PM', date: '2024-02-04' },
    ]);
    const [pendingCount, setPendingCount] = useState(0);

    const refreshPendingCount = useCallback(async () => {
        if (!PRIVILEGED_RANKS.includes(user?.rank)) return;
        try {
            const data = await fetchAllLostDevices();
            const list = Array.isArray(data) ? data : (data.requests ?? []);
            setPendingCount(list.filter(r => r.status === 'pending').length);
        } catch { /* silent */ }
    }, [user?.rank]);

    useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);
    useEffect(() => { refreshPendingCount(); const p = setInterval(refreshPendingCount, 60_000); return () => clearInterval(p); }, [refreshPendingCount]);

    const handleTabChange = tab => { setActiveTab(tab); setMobileOpen(false); if (activeTab === 'User Requests') refreshPendingCount(); };

    const isElevated = ELEVATED_RANKS.includes(user?.rank);
    const isPrivileged = PRIVILEGED_RANKS.includes(user?.rank);
    const rankMeta = RANK_META[user?.rank] || RANK_META.user;

    const handleLogout = async () => {
        await userSignOut();
        dispatch(resetClearCurrentUserRedux());
        setLogoutDialogOpen(false);
        navigate("/")
    };

    const drawerProps = { user, isElevated, isPrivileged, activeTab, pendingCount, rankMeta, onTabChange: handleTabChange, onLogout: () => setLogoutDialogOpen(true) };

    const renderContent = () => {
        const sp = { currentTime, tasks, setTasks, userLocation, setUserLocation, isWithinGeofence, setIsWithinGeofence };
        switch (activeTab) {
            case 'Clocking Dashboard': return <DashboardContent              {...sp} />;
            case 'Tasks & Activities': return <TasksActivitiesContent        {...sp} />;
            case 'Attendance History': return <AttendanceHistoryContent      {...sp} />;
            case 'Analytics & Reports': return <AnalyticsReportsContent       {...sp} />;
            case 'Department Structure': return <DepartmentStructureContent    {...sp} />;
            case 'Leave Management': return <LeaveManagementContent        {...sp} />;
            case 'Notification Panel': return <NotificationManagementContent {...sp} />;
            case 'Our Mobile App':
                return <DownloadMobileAppSection />;
            case 'Organisation Overview': return isElevated ? <OverallAttendanceStats /> : <DashboardContent {...sp} />;
            case 'User Requests': return isPrivileged ? <UserRequestsContent onCountChange={setPendingCount} /> : <DashboardContent {...sp} />;
            case 'Lost Device': return <LostDeviceContent />;
            case 'Add Device': return <AddDeviceContent />;

            default: return <DashboardContent {...sp} />;
        }
    };

    const pageTitles = {
        'Clocking Dashboard': `Welcome back, ${user?.name?.split(' ')[0] || 'User'} 👋`,
        'Attendance History': 'Attendance History',
        'Organisation Overview': 'Organisation Overview',
        'Tasks & Activities': 'Tasks & Activities',
        'Analytics & Reports': 'Analytics & Reports',
        'Department Structure': 'Department Structure',
        'Leave Management': 'Leave Management',
        'Notification Panel': 'Notification Management',
        'User Requests': 'User Device Requests',
        'Lost Device': 'Lost Device Request',
        'Add Device': 'Add Clocking Device',
        'Our Mobile App': 'KMFRI Mobile Application',

    };
    const pageSubtitles = {
        'User Requests': 'Review and respond to employee lost-device requests awaiting your approval',
        'Lost Device': 'Raise a temporary-access request to your Admin, Hiring Manager, or Supervisor',
        'Add Device': 'Register additional devices to clock in and out seamlessly from multiple devices',
        'Organisation Overview': 'Organisation-wide attendance insights for decision making',
        'Our Mobile App': 'Clock in using either the Web Portal or Android Mobile App to ensure uninterrupted attendance tracking.',

    };

    return (
        <Box sx={{
            display: 'flex', minHeight: '100vh',
            background: 'linear-gradient(160deg,#eef3f9 0%,#e8f0f7 50%,#f0f5fb 100%)',
        }}>

            {/* ── AppBar ── */}
            <AppBar position="fixed" elevation={0} sx={{ zIndex: theme.zIndex.drawer + 1, ...G.nav }}>
                <Toolbar sx={{ minHeight: `${APPBAR_HEIGHT}px !important`, gap: 1 }}>
                    <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(p => !p)}
                        sx={{
                            display: { md: 'none' }, bgcolor: 'rgba(255,255,255,0.09)', borderRadius: '11px', p: 0.9,
                            border: '1px solid rgba(255,255,255,0.14)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' }
                        }}>
                        <MenuIcon />
                    </IconButton>

                    <Box component="img" src={KMFRILogo} alt="KMFRI"
                        sx={{ height: { xs: 38, md: 44 }, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid rgba(255,255,255,0.22)', boxShadow: '0 3px 12px rgba(0,0,0,0.24)', flexShrink: 0 }} />

                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="h6" noWrap sx={{ fontWeight: 800, letterSpacing: 0.3, fontSize: { xs: '0.88rem', md: '1rem' }, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
                            {isMobile ? 'KMFRI' : isTablet ? 'KMFRI ATTENDANCE' : 'Kenya Marine and Fisheries Research Institute'.toUpperCase()}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.6, display: { xs: 'none', sm: 'block' }, fontSize: '0.67rem', color: 'rgba(255,255,255,0.8)' }}>
                            Digital Attendance Tracking Platform
                        </Typography>
                    </Box>

                    <Tooltip title={user?.name || 'User'}>
                        <Avatar sx={{
                            width: 36, height: 36, flexShrink: 0,
                            background: 'rgba(0,220,255,0.18)',
                            border: '2px solid rgba(255,255,255,0.28)',
                            color: '#fff', fontWeight: 900, fontSize: '0.82rem',
                            cursor: 'pointer', backdropFilter: 'blur(8px)',
                            '&:hover': { background: 'rgba(0,220,255,0.28)' },
                            transition: 'all 0.2s',
                        }}>
                            {user?.name?.split(' ')[0]?.charAt(0)}{user?.name?.split(' ')[1]?.charAt(0)}
                        </Avatar>
                    </Tooltip>
                </Toolbar>
            </AppBar>

            {/* ── Sidebar ── */}
            <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
                <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none', pt: `${APPBAR_HEIGHT}px`, bgcolor: 'transparent' }
                    }}>
                    <DrawerContent {...drawerProps} />
                </Drawer>
                <Drawer variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, mt: `${APPBAR_HEIGHT}px`, height: `calc(100% - ${APPBAR_HEIGHT}px)`, border: 'none', bgcolor: 'transparent' }
                    }}
                    open>
                    <DrawerContent {...drawerProps} />
                </Drawer>
            </Box>

            {/* ── Main content ── */}
            <Box component="main" sx={{
                flexGrow: 1, p: { xs: 2, sm: 2.5, md: 3.5 },
                mt: `${APPBAR_HEIGHT}px`,
                width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
                minHeight: `calc(100vh - ${APPBAR_HEIGHT}px)`,
                boxSizing: 'border-box',
                position: 'relative',
            }}>
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}>

                        {/* page title */}
                        <Box sx={{ mb: 3.5 }}>
                            <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
                                <Typography variant="h5" fontWeight={900} sx={{
                                    background: colorPalette.oceanGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    lineHeight: 1.2, fontSize: { xs: '1.2rem', md: '1.45rem' },
                                }}>
                                    {pageTitles[activeTab] || activeTab}
                                </Typography>
                                {activeTab === 'User Requests' && pendingCount > 0 && (
                                    <Chip label={`${pendingCount} pending`} size="small" sx={{ fontWeight: 800, fontSize: '0.7rem', height: 22, bgcolor: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.28)' }} />
                                )}
                            </Stack>
                            {pageSubtitles[activeTab] && (
                                <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 0.5 }}>
                                    {pageSubtitles[activeTab]}
                                </Typography>
                            )}
                        </Box>

                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </Box>

            {/* ── Logout dialog ── */}
            <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}
                PaperProps={{ sx: { ...G.dialog, borderRadius: '24px', p: 1, maxWidth: 420, width: '100%' } }}
                BackdropProps={{ sx: { backdropFilter: 'blur(6px)', bgcolor: 'rgba(6,28,50,0.30)' } }}>
                <DialogTitle sx={{ fontWeight: 900, color: colorPalette.deepNavy, pb: 0.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 40, height: 40, borderRadius: '13px', bgcolor: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Logout sx={{ color: '#ef4444', fontSize: 20 }} />
                        </Box>
                        <span>Log Out</span>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ lineHeight: 1.7, color: 'rgba(20,40,60,0.75)' }}>
                        You are about to be logged out of the <strong>KMFRI Digital Attendance Platform</strong>.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1.5, fontSize: '0.78rem', color: 'rgba(20,40,60,0.50)' }}>
                        Logged in as <strong>{user?.name || 'Unknown User'}</strong> · {user?.department || user?.email || ''}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button onClick={() => setLogoutDialogOpen(false)} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 2.5, bgcolor: 'rgba(10,61,98,0.05)', border: '1px solid rgba(10,61,98,0.12)', color: colorPalette.deepNavy, '&:hover': { bgcolor: 'rgba(10,61,98,0.09)' } }}>
                        Cancel
                    </Button>
                    <Button onClick={handleLogout} variant="contained" sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800, px: 2.5, bgcolor: '#ef4444', boxShadow: '0 6px 20px rgba(239,68,68,0.30)', '&:hover': { bgcolor: '#dc2626', boxShadow: '0 8px 28px rgba(239,68,68,0.42)', transform: 'translateY(-1px)' }, transition: 'all 0.18s ease' }}>
                        Yes, Log Out
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EnhancedDashboard;