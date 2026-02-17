import {
    AddCircle,
    AssignmentTurnedIn,
    Dashboard as DashIcon,
    History,
    Logout,
    Menu as MenuIcon,
    NotificationAddRounded,
    PhoneLocked,
    QueryStats,
} from '@mui/icons-material';
import {
    AppBar,
    Avatar,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Stack,
    Toolbar,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import KMFRILogo from '../assets/kmfri.png';

// Page components
import AnalyticsReportsContent from './dashboard/AnalyticsReport';
import AttendanceHistoryContent from './dashboard/AttendanceHistory';
import DashboardContent from './dashboard/DashBoardContent';
import DepartmentStructureContent from './dashboard/DepartmentStructure';
import LeaveManagementContent from './dashboard/LeaveManagement';
import NotificationManagementContent from './dashboard/NotificationManagement';
import OverallAttendanceStats from './dashboard/OverallAttendance';
import TasksActivitiesContent from './dashboard/TaskActivities';

// Device management
import coreDataDetails from './CoreDataDetails';
import AddDeviceContent from './dashboard/AddDevice';
import LostDeviceContent from './dashboard/LostDevice';
import UserRequestsContent, { UserRequestsBadge } from './dashboard/UserRequest';

// API / Redux
import { resetClearCurrentUserRedux } from '../redux/CurrentUser';
import { fetchAllLostDevices } from '../service/DeviceService';
import { userSignOut } from '../service/UserProfile';

const { colorPalette } = coreDataDetails;

const DRAWER_WIDTH = 350;
const APPBAR_HEIGHT = 64;

/* ─── Role constants ─────────────────────────────────────────────────────── */
const ELEVATED_RANKS = ['admin', 'hr', 'supervisor', 'ceo'];
const PRIVILEGED_RANKS = ['admin', 'hr', 'supervisor'];

const RANK_META = {
    admin: { label: 'Admin' },
    hr: { label: 'HR' },
    supervisor: { label: 'Supervisor' },
    ceo: { label: 'CEO' },
    user: { label: 'Employee' },
};

/* ─── Section header ─────────────────────────────────────────────────────── */
const SectionLabel = ({ children }) => (
    <Box sx={{ px: 1.5, pt: 2.5, pb: 0.8 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{
                fontWeight: 800, fontSize: '0.58rem', letterSpacing: 1.8,
                textTransform: 'uppercase', color: 'rgba(30,42,60,0.32)', whiteSpace: 'nowrap',
            }}>
                {children}
            </Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(30,42,60,0.07)' }} />
        </Stack>
    </Box>
);

/* ─── Single nav item ────────────────────────────────────────────────────── */
const NavItem = ({ item, isActive, pendingCount, onClick }) => (
    <motion.div whileHover={{ x: isActive ? 0 : 3 }} transition={{ type: 'spring', stiffness: 420, damping: 32 }}>
        <ListItem
            button
            onClick={onClick}
            sx={{
                borderRadius: '12px',
                mb: 0.4,
                px: 1.4,
                py: 0.95,
                position: 'relative',
                overflow: 'hidden',
                color: isActive ? '#fff' : 'rgba(30,42,60,0.6)',
                transition: 'color 0.18s ease',
                '&:hover': { color: isActive ? '#fff' : 'rgba(30,42,60,0.9)', bgcolor: 'transparent' },
                bgcolor: 'transparent',
                /* active gradient fill */
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '12px',
                    background: isActive
                        ? `linear-gradient(120deg, ${item.color}f0, ${item.color}b0)`
                        : 'transparent',
                    boxShadow: isActive ? `0 4px 18px ${item.color}40` : 'none',
                    transition: 'background 0.2s ease, box-shadow 0.2s ease',
                    zIndex: 0,
                },
                '&:hover::before': !isActive ? { background: `${item.color}10` } : {},
            }}
        >
            <ListItemIcon sx={{
                color: isActive ? 'rgba(255,255,255,0.92)' : item.color,
                minWidth: 34, position: 'relative', zIndex: 1,
                '& svg': { fontSize: 19 },
                transition: 'color 0.18s ease',
            }}>
                {item.icon}
            </ListItemIcon>

            <ListItemText
                primary={item.text}
                sx={{ position: 'relative', zIndex: 1, my: 0 }}
                primaryTypographyProps={{
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.875rem',
                    letterSpacing: isActive ? 0.15 : 0,
                    lineHeight: 1.25,
                }}
            />

            {/* badge + active dot */}
            <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 0.6 }}>
                {item.text === 'User Requests' && <UserRequestsBadge count={pendingCount} />}
                {isActive && (
                    <Box sx={{
                        width: 5, height: 5, borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.85)',
                        boxShadow: '0 0 5px rgba(255,255,255,0.7)',
                        flexShrink: 0,
                    }} />
                )}
            </Box>
        </ListItem>
    </motion.div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   DRAWER CONTENT — shared between mobile & desktop
═══════════════════════════════════════════════════════════════════════════ */
const DrawerContent = ({ user, isElevated, isPrivileged, activeTab, pendingCount, onTabChange, onLogout, rankMeta }) => {
    const baseItems = [
        { text: 'Clocking Dashboard', icon: <DashIcon />, color: colorPalette.oceanBlue },
        { text: 'Attendance History', icon: <History />, color: colorPalette.deepNavy },
        { text: 'Notification Panel', icon: <NotificationAddRounded />, color: colorPalette.deepNavy },
    ];
    const adminItems = [{ text: 'Organisation Overview', icon: <QueryStats />, color: colorPalette.seafoamGreen }];
    const requestItems = [{ text: 'User Requests', icon: <AssignmentTurnedIn />, color: '#e05a50' }];
    const techItems = [
        { text: 'Lost Device', icon: <PhoneLocked />, color: '#e05a50' },
        { text: 'Add Device', icon: <AddCircle />, color: colorPalette.warmSand },
    ];

    return (
        <Box sx={{
            height: '100%', display: 'flex', flexDirection: 'column',
            bgcolor: '#f7f9fc',
            backgroundImage: `
                radial-gradient(ellipse at 10% 5%, rgba(10,61,98,0.045) 0%, transparent 55%),
                radial-gradient(ellipse at 90% 95%, rgba(32,178,160,0.045) 0%, transparent 55%)
            `,
        }}>
            {/* ── Profile card ── */}
            <Box sx={{ px: 1.5, pt: 2, pb: 0.5 }}>
                <Box sx={{
                    borderRadius: '16px',
                    background: `linear-gradient(140deg, ${colorPalette.deepNavy} 0%, #1c5c80 55%, #1a8a8a 100%)`,
                    p: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 28px rgba(10,61,98,0.24)',
                }}>
                    {/* decorative blobs */}
                    <Box sx={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
                    <Box sx={{ position: 'absolute', bottom: -30, right: 20, width: 110, height: 110, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
                    <Box sx={{ position: 'absolute', top: '50%', left: -24, width: 60, height: 60, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.03)', transform: 'translateY(-50%)', pointerEvents: 'none' }} />

                    <Stack direction="row" alignItems="center" spacing={1.4} sx={{ position: 'relative', zIndex: 1 }}>
                        <Avatar sx={{
                            width: 44, height: 44, flexShrink: 0,
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)',
                            border: '2px solid rgba(255,255,255,0.22)',
                            color: '#fff', fontWeight: 900, fontSize: '1rem',
                            backdropFilter: 'blur(6px)',
                        }}>
                            {user?.name?.split(' ')[0]?.charAt(0)}{user?.name?.split(' ')[1]?.charAt(0)}
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                            <Typography noWrap sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', lineHeight: 1.2, letterSpacing: 0.15 }}>
                                {user?.name || 'User'}
                            </Typography>
                            <Typography noWrap sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.58)', mt: 0.25 }}>
                                {user?.department || user?.email || ''}
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 1.4, position: 'relative', zIndex: 1 }}>
                        <Chip
                            label={(rankMeta.label).toUpperCase()}
                            size="small"
                            sx={{
                                height: 19, fontWeight: 900, fontSize: '0.57rem', letterSpacing: 1.5,
                                bgcolor: 'rgba(255,255,255,0.13)', color: '#fff',
                                borderRadius: '6px', border: '1px solid rgba(255,255,255,0.18)',
                            }}
                        />
                        {user?.employeeId && (
                            <Typography sx={{ fontSize: '0.63rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                                #{user.employeeId}
                            </Typography>
                        )}
                    </Stack>
                </Box>
            </Box>

            {/* ── Scrollable nav ── */}
            <Box sx={{
                flex: 1, overflowY: 'auto', overflowX: 'hidden', px: 1, pb: 1,
                '&::-webkit-scrollbar': { width: 3 },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(10,61,98,0.1)', borderRadius: 2 },
            }}>
                <SectionLabel>Navigation</SectionLabel>
                <List disablePadding>
                    {baseItems.map(item => (
                        <NavItem key={item.text} item={item} isActive={activeTab === item.text}
                            pendingCount={pendingCount} onClick={() => onTabChange(item.text)} />
                    ))}
                </List>

                {isElevated && (
                    <>
                        <SectionLabel>Admin Tools</SectionLabel>
                        <List disablePadding>
                            {adminItems.map(item => (
                                <NavItem key={item.text} item={item} isActive={activeTab === item.text}
                                    pendingCount={pendingCount} onClick={() => onTabChange(item.text)} />
                            ))}
                        </List>
                    </>
                )}

                {isPrivileged && (
                    <>
                        <SectionLabel>Requests</SectionLabel>
                        <List disablePadding>
                            {requestItems.map(item => (
                                <NavItem key={item.text} item={item} isActive={activeTab === item.text}
                                    pendingCount={pendingCount} onClick={() => onTabChange(item.text)} />
                            ))}
                        </List>
                    </>
                )}

                <SectionLabel>Technical Help</SectionLabel>
                <List disablePadding>
                    {techItems.map(item => (
                        <NavItem key={item.text} item={item} isActive={activeTab === item.text}
                            pendingCount={pendingCount} onClick={() => onTabChange(item.text)} />
                    ))}
                </List>
            </Box>

            {/* ── Logout ── */}
            <Box sx={{ px: 1.5, pb: 2, pt: 0.5 }}>
                <Divider sx={{ mb: 1.5, borderColor: 'rgba(10,61,98,0.07)' }} />
                <Button
                    fullWidth
                    startIcon={<Logout sx={{ fontSize: '17px !important' }} />}
                    onClick={onLogout}
                    sx={{
                        borderRadius: '12px', py: 1.05, fontWeight: 700, fontSize: '0.875rem',
                        textTransform: 'none', justifyContent: 'flex-start', pl: 1.8, gap: 0.3,
                        color: 'rgba(200,36,36,0.75)', bgcolor: 'rgba(220,38,38,0.04)',
                        border: '1px solid rgba(220,38,38,0.09)',
                        '&:hover': { bgcolor: 'rgba(220,38,38,0.09)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.18)' },
                        transition: 'all 0.18s ease',
                    }}
                >
                    Log Out
                </Button>
            </Box>
        </Box>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════════════ */
const EnhancedDashboard = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
    const { user } = useSelector((state) => state.currentUser);
    const dispatch = useDispatch();

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

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        refreshPendingCount();
        const poll = setInterval(refreshPendingCount, 60_000);
        return () => clearInterval(poll);
    }, [refreshPendingCount]);

    const handleTabChange = (tabText) => {
        setActiveTab(tabText);
        setMobileOpen(false);
        if (activeTab === 'User Requests') refreshPendingCount();
    };

    const isElevated = ELEVATED_RANKS.includes(user?.rank);
    const isPrivileged = PRIVILEGED_RANKS.includes(user?.rank);
    const rankMeta = RANK_META[user?.rank] || RANK_META.user;

    const handleLogout = async () => {
        await userSignOut();
        dispatch(resetClearCurrentUserRedux());
        window.location.reload();
        setLogoutDialogOpen(false);
    };

    const drawerProps = {
        user, isElevated, isPrivileged, activeTab, pendingCount, rankMeta,
        onTabChange: handleTabChange,
        onLogout: () => setLogoutDialogOpen(true),
    };

    /* ── content router ── */
    const renderContent = () => {
        const sharedProps = { currentTime, tasks, setTasks, userLocation, setUserLocation, isWithinGeofence, setIsWithinGeofence };
        switch (activeTab) {
            case 'Clocking Dashboard': return <DashboardContent              {...sharedProps} />;
            case 'Tasks & Activities': return <TasksActivitiesContent        {...sharedProps} />;
            case 'Attendance History': return <AttendanceHistoryContent      {...sharedProps} />;
            case 'Analytics & Reports': return <AnalyticsReportsContent       {...sharedProps} />;
            case 'Department Structure': return <DepartmentStructureContent    {...sharedProps} />;
            case 'Leave Management': return <LeaveManagementContent        {...sharedProps} />;
            case 'Notification Panel': return <NotificationManagementContent {...sharedProps} />;
            case 'Organisation Overview': return isElevated ? <OverallAttendanceStats /> : <DashboardContent {...sharedProps} />;
            case 'User Requests': return isPrivileged ? <UserRequestsContent onCountChange={setPendingCount} /> : <DashboardContent {...sharedProps} />;
            case 'Lost Device': return <LostDeviceContent />;
            case 'Add Device': return <AddDeviceContent />;
            default: return <DashboardContent {...sharedProps} />;
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
    };

    const pageSubtitles = {
        'User Requests': 'Review and respond to employee lost-device requests awaiting your approval',
        'Lost Device': 'Raise a temporary-access request to your Admin, Hiring Manager, or Supervisor',
        'Add Device': 'Register additional devices to clock in and out seamlessly from multiple devices',
        'Organisation Overview': 'Organisation-wide attendance insights for decision making',
    };

    /* ════════════════════════════════════════════════════════════════════════ */
    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#eff3f8' }}>

            {/* AppBar */}
            <AppBar
                position="fixed"
                sx={{
                    zIndex: theme.zIndex.drawer + 1,
                    background: colorPalette.oceanGradient,
                    boxShadow: '0 2px 16px rgba(10,61,98,0.2)',
                }}
            >
                <Toolbar sx={{ minHeight: `${APPBAR_HEIGHT}px !important`, gap: 1 }}>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={() => setMobileOpen(p => !p)}
                        sx={{
                            display: { md: 'none' },
                            bgcolor: 'rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            p: 0.9,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
                        }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Box component="img" src={KMFRILogo} alt="KMFRI"
                        sx={{ height: { xs: 38, md: 44 }, width: 'auto', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid rgba(255,255,255,0.22)', boxShadow: '0 3px 10px rgba(0,0,0,0.2)', flexShrink: 0 }}
                    />

                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="h6" noWrap sx={{ fontWeight: 800, letterSpacing: 0.3, fontSize: { xs: '0.88rem', md: '1rem' } }}>
                            {isMobile ? 'KMFRI' : isTablet ? 'KMFRI ATTENDANCE' : 'Kenya Marine and Fisheries Research Institute'.toUpperCase()}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.72, display: { xs: 'none', sm: 'block' }, fontSize: '0.68rem' }}>
                            Digital Attendance Tracking Platform
                        </Typography>
                    </Box>

                    <Tooltip title={user?.name || 'User'}>
                        <Avatar sx={{
                            width: 34, height: 34, flexShrink: 0,
                            bgcolor: 'rgba(255,255,255,0.14)',
                            border: '2px solid rgba(255,255,255,0.28)',
                            color: '#fff', fontWeight: 900, fontSize: '0.8rem',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
                            transition: 'background 0.2s',
                        }}>
                            {user?.name?.split(' ')[0]?.charAt(0)}{user?.name?.split(' ')[1]?.charAt(0)}
                        </Avatar>
                    </Tooltip>
                </Toolbar>
            </AppBar>

            {/* Sidebar */}
            <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>

                {/*
                 * MOBILE: temporary drawer
                 * ✅ KEY FIX — pt: `${APPBAR_HEIGHT}px` on the Paper pushes
                 *    all drawer content below the fixed AppBar so nothing is clipped.
                 */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': {
                            width: DRAWER_WIDTH,
                            boxSizing: 'border-box',
                            border: 'none',
                            boxShadow: '6px 0 36px rgba(10,61,98,0.12)',
                            /* push entire paper content below the AppBar */
                            pt: `${APPBAR_HEIGHT}px`,
                            bgcolor: 'transparent',
                        },
                    }}
                >
                    <DrawerContent {...drawerProps} />
                </Drawer>

                {/* DESKTOP: permanent */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': {
                            width: DRAWER_WIDTH,
                            mt: `${APPBAR_HEIGHT}px`,
                            height: `calc(100% - ${APPBAR_HEIGHT}px)`,
                            border: 'none',
                            boxShadow: '2px 0 18px rgba(10,61,98,0.05)',
                            bgcolor: 'transparent',
                        },
                    }}
                    open
                >
                    <DrawerContent {...drawerProps} />
                </Drawer>
            </Box>

            {/* Main content area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, sm: 2.5, md: 4 },
                    mt: `${APPBAR_HEIGHT}px`,
                    width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    minHeight: `calc(100vh - ${APPBAR_HEIGHT}px)`,
                    boxSizing: 'border-box',
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
                    >
                        {/* page title */}
                        <Box sx={{ mb: 4 }}>
                            <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
                                <Typography
                                    variant="h5"
                                    fontWeight={900}
                                    sx={{
                                        background: colorPalette.oceanGradient,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        lineHeight: 1.2,
                                        fontSize: { xs: '1.2rem', md: '1.45rem' },
                                    }}
                                >
                                    {pageTitles[activeTab] || activeTab}
                                </Typography>

                                {activeTab === 'User Requests' && pendingCount > 0 && (
                                    <Chip
                                        label={`${pendingCount} pending`}
                                        size="small"
                                        sx={{
                                            fontWeight: 800, fontSize: '0.7rem', height: 22,
                                            bgcolor: 'rgba(224,90,80,0.1)', color: '#e05a50',
                                            border: '1px solid rgba(224,90,80,0.28)',
                                        }}
                                    />
                                )}
                            </Stack>

                            {pageSubtitles[activeTab] && (
                                <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 0.4 }}>
                                    {pageSubtitles[activeTab]}
                                </Typography>
                            )}
                        </Box>

                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </Box>

            <Dialog
                open={logoutDialogOpen}
                onClose={() => setLogoutDialogOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        p: 1,
                        maxWidth: 400,
                        width: '100%',
                        background: `
                linear-gradient(
                    135deg,
                    rgba(10,61,98,0.08),
                    rgba(16,185,129,0.06)
                ),
                rgba(255,255,255,0.75)
            `,
                        backdropFilter: 'blur(28px)',
                        WebkitBackdropFilter: 'blur(28px)',
                        border: '1px solid rgba(16,185,129,0.15)',
                        boxShadow: `
                0 20px 60px rgba(10,61,98,0.15),
                0 4px 18px rgba(16,185,129,0.08)
            `,
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 900,
                        color: colorPalette.deepNavy,
                        pb: 1,
                    }}
                >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                            sx={{
                                width: 42,
                                height: 42,
                                borderRadius: '12px',
                                background: `
                        linear-gradient(
                            135deg,
                            rgba(224,90,80,0.18),
                            rgba(224,90,80,0.08)
                        )
                    `,
                                border: '1px solid rgba(224,90,80,0.25)',
                                backdropFilter: 'blur(12px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 6px 20px rgba(224,90,80,0.2)',
                            }}
                        >
                            <Logout sx={{ color: '#e05a50', fontSize: 20 }} />
                        </Box>
                        <span>Log Out</span>
                    </Stack>
                </DialogTitle>

                <DialogContent>
                    <Typography
                        variant="body1"
                        sx={{
                            lineHeight: 1.7,
                            color: 'rgba(20,40,60,0.75)',
                        }}
                    >
                        You are about to be logged out of the{' '}
                        <strong>KMFRI Digital Attendance Platform</strong>.
                        Please log back in to continue clocking in and out.
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            mt: 1.5,
                            fontSize: '0.78rem',
                            color: 'rgba(20,40,60,0.55)',
                        }}
                    >
                        Logged in as{' '}
                        <strong>{user?.name || 'Unknown User'}</strong> ·{' '}
                        {user?.department || user?.email || ''}
                    </Typography>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    {/* Ocean Cancel Button */}
                    <Button
                        onClick={() => setLogoutDialogOpen(false)}
                        variant="outlined"
                        sx={{
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 3,
                            background: 'rgba(16,185,129,0.05)',
                            border: '1px solid rgba(16,185,129,0.2)',
                            color: colorPalette.deepNavy,
                            '&:hover': {
                                background: 'rgba(16,185,129,0.1)',
                                border: '1px solid rgba(16,185,129,0.35)',
                            },
                            transition: 'all 0.18s ease',
                        }}
                    >
                        Cancel
                    </Button>

                    {/* Confirm Logout */}
                    <Button
                        onClick={handleLogout}
                        variant="contained"
                        sx={{
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontWeight: 800,
                            px: 3,
                            bgcolor: 'rgba(224,90,80,0.92)',
                            border: '1px solid rgba(224,90,80,0.35)',
                            boxShadow: '0 8px 22px rgba(224,90,80,0.28)',
                            '&:hover': {
                                bgcolor: '#e05a50',
                                boxShadow: '0 12px 30px rgba(224,90,80,0.4)',
                            },
                            transition: 'all 0.18s ease',
                        }}
                    >
                        Yes, Log Out
                    </Button>
                </DialogActions>
            </Dialog>



        </Box>
    );
};

export default EnhancedDashboard;