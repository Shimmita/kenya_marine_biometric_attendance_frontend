import {
    AddCircle,
    ChevronLeft, ChevronRight,
    Dashboard as DashIcon,
    EmojiPeopleRounded,
    History, InsightsRounded, Lock, Logout, MarkEmailReadRounded, Menu as MenuIcon,
    PhoneLocked, QueryStats,
    SensorOccupiedRounded,
    SupervisorAccount,
    SupportAgentRounded
} from '@mui/icons-material';
import {
    AppBar, Avatar, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
    DialogContent, DialogTitle,
    Drawer, IconButton,
    List, ListItem, ListItemIcon, ListItemText, Stack, Toolbar,
    Tooltip, Typography, useMediaQuery, useTheme
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import KMFRILogo from '../assets/kmfri.png';
import { resetClearCurrentUserRedux, updateUserCurrentUserRedux } from '../redux/CurrentUser';
import { fetchAllLostDevices } from '../service/DeviceService';
import { updateUserProfile, userSignOut } from '../service/UserProfile';
import coreDataDetails from './CoreDataDetails';
import DialogAlert from './DialogAlert';
import UserProfileDialog from './UserProfileDialog';
import AdminLeaveManager from './dashboard/AdminLeaveManager';
import UserManagementContent from './dashboard/UserManagementContent';
import UserRequestsContent, { UserRequestsBadge } from './dashboard/UserRequest';
import SupervisorDeptRequest from './dashboard/supervisor/SupervisorDeptRequest';
import SupervisorDeptStats from './dashboard/supervisor/SupervisorDeptStats';
import SupervisorManageLeaves from './dashboard/supervisor/SupervisorManageLeaves';
import SupervisorManageMembers from './dashboard/supervisor/SupervisorManageMembers';
import PasswordResetRequests from './dashboard/PasswordResetRequests';
const DashboardContent = lazy(() => import('./dashboard/DashBoardContent'));
const DownloadMobileAppSection = lazy(() => import('./dashboard/DownloadMobileApp'));
const AnalyticsReportsContent = lazy(() => import('./dashboard/AnalyticsReport'));
const AttendanceHistoryContent = lazy(() => import('./dashboard/AttendanceHistory'));
const DepartmentStructureContent = lazy(() => import('./dashboard/DepartmentStructure'));
const LeaveManagementContent = lazy(() => import('./dashboard/LeaveManagement'));
const NotificationManagementContent = lazy(() => import('./dashboard/NotificationManagement'));
const OverallAttendanceStats = lazy(() => import('./dashboard/OverallAttendance'));
const TasksActivitiesContent = lazy(() => import('./dashboard/TaskActivities'));
const HelpSupport = lazy(() => import('./dashboard/HelpSupport'));
const AddDeviceContent = lazy(() => import('./dashboard/AddDevice'));
const LostDeviceContent = lazy(() => import('./dashboard/LostDevice'));
const FeedbackStatistics = lazy(() => import('./dashboard/AdminRatingFeeback'));



const { colorPalette } = coreDataDetails;

const DRAWER_WIDTH = 330;
const DRAWER_COLLAPSED_WIDTH = 72;
const APPBAR_HEIGHT = 64;

const ELEVATED_RANKS = ['admin', 'hr', 'supervisor', 'ceo'];
const PRIVILEGED_RANKS = ['admin', 'hr', 'supervisor'];
const RANK_META = {
    admin: { label: 'Admin' }, hr: { label: 'HR' }, supervisor: { label: 'Supervisor' },
    ceo: { label: 'CEO' }, user: { label: 'Employee' },
};

const adminItems = [
    { text: 'Organisations Stats', icon: <QueryStats />, color: colorPalette.seafoamGreen },
    { text: 'User Management', icon: <SupervisorAccount />, color: '#38bdf8' },
    { text: 'Leave Management', icon: <SensorOccupiedRounded />, color: '#38bdf8' },
    { text: 'All User Requests', icon: <MarkEmailReadRounded />, color: colorPalette.softGray },
    { text: 'Feedback Statistics', icon: <InsightsRounded />, color: colorPalette.cloudWhite }
];

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
        backdropFilter: 'blur(14px) saturate(200%)',
        WebkitBackdropFilter: 'blur(14px) saturate(200%)',
        borderBottom: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 4px 28px rgba(0,0,0,0.28)',
    },
    surface: {
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.13)',
        boxShadow: '0 4px 20px rgba(6,28,50,0.22), inset 0 1px 0 rgba(255,255,255,0.10)',
    },
    sidebarBg: {
        background: 'rgba(5,20,42,0.78)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '4px 0 32px rgba(0,0,0,0.24)',
    },
    dialog: {
        background: 'rgba(255,255,255,0.90)',
        backdropFilter: 'blur(20px) saturate(200%)',
        WebkitBackdropFilter: 'blur(20px) saturate(200%)',
        border: '1px solid rgba(255,255,255,0.65)',
        boxShadow: '0 24px 64px rgba(10,61,98,0.22)',
    },
};

const SidebarOrbs = React.memo(() => (
    <>
        {[
            { s: 180, t: -30, l: -40, c: 'rgba(0,140,200,0.12)', b: 48 },
            { s: 140, bot: -20, r: -30, c: 'rgba(0,185,175,0.10)', b: 40 },
        ].map(({ s, t, l, r, bot, c, b }, i) => (
            <Box key={i} sx={{
                position: 'absolute', width: s, height: s, pointerEvents: 'none', zIndex: 0,
                top: t, left: l, right: r, bottom: bot, borderRadius: '50%',
                background: c, filter: `blur(${b}px)`, willChange: 'transform',
            }} />
        ))}
    </>
));

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

/* ══ COLLAPSED ICON ITEM — premium animated icon-only nav ══════════════════ */
const CollapsedNavItem = React.memo(({ item, isActive, pendingCount, onClick }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <Tooltip title={item.text} placement="right" arrow
            componentsProps={{
                tooltip: {
                    sx: {
                        bgcolor: 'rgba(5,20,42,0.96)', color: '#fff', fontWeight: 700,
                        fontSize: '0.78rem', borderRadius: '10px', px: 1.5, py: 0.7,
                        border: `1px solid ${item.color}44`,
                        boxShadow: `0 4px 20px rgba(0,0,0,0.40), 0 0 12px ${item.color}22`,
                        backdropFilter: 'blur(8px)',
                    }
                },
                arrow: { sx: { color: 'rgba(5,20,42,0.96)' } }
            }}>
            <Box
                onClick={onClick}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                sx={{
                    position: 'relative', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', mx: 'auto', mb: 0.5,
                    width: 46, height: 46, borderRadius: '14px',
                    cursor: 'pointer', overflow: 'hidden',
                    transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                    transform: hovered ? 'scale(1.14) translateY(-1px)' : 'scale(1)',
                    // Active state: glowing background
                    background: isActive
                        ? `linear-gradient(135deg, ${item.color}cc, ${item.color}77)`
                        : hovered
                            ? `${item.color}22`
                            : 'transparent',
                    boxShadow: isActive
                        ? `0 4px 18px ${item.color}55, 0 0 0 1px ${item.color}44, inset 0 1px 0 rgba(255,255,255,0.18)`
                        : hovered
                            ? `0 6px 24px ${item.color}33, 0 0 16px ${item.color}22`
                            : 'none',
                    border: isActive
                        ? `1px solid ${item.color}66`
                        : hovered
                            ? `1px solid ${item.color}33`
                            : '1px solid transparent',
                }}>

                {/* Ripple shimmer on hover */}
                {hovered && !isActive && (
                    <Box sx={{
                        position: 'absolute', inset: 0, borderRadius: '14px',
                        background: `radial-gradient(circle at 50% 50%, ${item.color}33 0%, transparent 70%)`,
                        animation: 'pulseGlow 0.9s ease-in-out infinite alternate',
                        '@keyframes pulseGlow': {
                            from: { opacity: 0.5, transform: 'scale(0.95)' },
                            to: { opacity: 1, transform: 'scale(1.05)' }
                        },
                        pointerEvents: 'none',
                    }} />
                )}

                {/* Icon */}
                <Box sx={{
                    position: 'relative', zIndex: 1,
                    color: isActive ? 'rgba(255,255,255,0.95)' : hovered ? item.color : 'rgba(255,255,255,0.45)',
                    transition: 'color 0.18s ease, filter 0.18s ease',
                    filter: (isActive || hovered) ? `drop-shadow(0 0 6px ${item.color}88)` : 'none',
                    display: 'flex',
                    '& svg': {
                        fontSize: 20,
                        transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                        transform: hovered ? 'rotate(-6deg) scale(1.1)' : 'rotate(0deg) scale(1)',
                    }
                }}>
                    {item.icon}
                </Box>

                {/* Badge for pending requests */}
                {item.text === 'User Requests' && pendingCount > 0 && (
                    <Box sx={{
                        position: 'absolute', top: 4, right: 4, width: 8, height: 8,
                        borderRadius: '50%', bgcolor: '#f87171',
                        boxShadow: '0 0 6px rgba(248,113,113,0.8)',
                        animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
                        '@keyframes ping': {
                            '75%, 100%': { transform: 'scale(1.8)', opacity: 0 }
                        }
                    }} />
                )}
            </Box>
        </Tooltip>
    );
});

/* ══ ACTIVE INDICATOR LINE (bottom underline for collapsed active item) ════ */
const ActiveLine = ({ color }) => (
    <motion.div
        layoutId="activeUnderline"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        exit={{ scaleX: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        style={{
            position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)',
            width: 24, height: 3, borderRadius: 999,
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            boxShadow: `0 0 8px ${color}88`,
        }}
    />
);

/* ══ FULL NAV ITEM ══════════════════════════════════════════════════════════ */
const NavItem = React.memo(({ item, isActive, pendingCount, onClick }) => (
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
));

/* ══ COLLAPSED DRAWER CONTENT ═══════════════════════════════════════════════ */
const CollapsedDrawerContent = React.memo(({ user, activeTab, pendingCount, onTabChange, onLogout, onExpand, allItems }) => (
    <Box sx={{
        height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
        position: 'relative', overflow: 'hidden', ...G.sidebarBg,
        pt: 1.5, pb: 2,
    }}>
        <SidebarOrbs />

        {/* Expand trigger */}
        <Tooltip title="Expand sidebar" placement="right">
            <Box
                onClick={onExpand}
                sx={{
                    position: 'relative', zIndex: 1, mb: 2,
                    width: 40, height: 40, borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.06)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        background: 'rgba(0,220,255,0.14)',
                        border: '1px solid rgba(0,220,255,0.32)',
                        boxShadow: '0 4px 16px rgba(0,220,255,0.2)',
                        transform: 'scale(1.08)',
                    },
                }}>
                <ChevronRight sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }} />
            </Box>
        </Tooltip>

        {/* Avatar mini */}
        <Tooltip title={user?.name || 'User'} placement="right">
            <Avatar
                src={user?.avatar}
                sx={{
                    width: 40, height: 40, mb: 2.5, flexShrink: 0, zIndex: 1,
                    background: 'linear-gradient(135deg,rgba(0,220,255,0.30),rgba(0,185,175,0.20))',
                    border: '2px solid rgba(255,255,255,0.22)',
                    color: '#fff', fontWeight: 900, fontSize: '0.78rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    cursor: 'default',
                }}>
                {user?.name?.split(' ')[0]?.charAt(0)}{user?.name?.split(' ')[1]?.charAt(0)}
            </Avatar>
        </Tooltip>

        {/* Divider */}
        <Box sx={{ width: 32, height: '1px', bgcolor: 'rgba(255,255,255,0.10)', mb: 1.5, zIndex: 1 }} />

        {/* Icons list */}
        <Box sx={{
            flex: 1, overflowY: 'auto', overflowX: 'hidden',
            width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
            px: 0.5, pb: 1, zIndex: 1,
            '&::-webkit-scrollbar': { display: 'none' },
        }}>
            {allItems.map((item) => (
                <Box key={item.text} sx={{ position: 'relative', width: 46, mb: 0.5 }}>
                    <CollapsedNavItem
                        item={item}
                        isActive={activeTab === item.text}
                        pendingCount={pendingCount}
                        onClick={() => onTabChange(item.text)}
                    />
                    <AnimatePresence>
                        {activeTab === item.text && <ActiveLine color={item.color} />}
                    </AnimatePresence>
                </Box>
            ))}
        </Box>

        {/* Divider */}
        <Box sx={{ width: 32, height: '1px', bgcolor: 'rgba(255,255,255,0.10)', mb: 1.5, zIndex: 1 }} />

        {/* Logout icon */}
        <Tooltip title="Log Out" placement="right">
            <Box
                onClick={onLogout}
                sx={{
                    zIndex: 1, width: 46, height: 46, borderRadius: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', border: '1px solid rgba(239,68,68,0.15)',
                    background: 'rgba(239,68,68,0.07)',
                    transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                    '&:hover': {
                        background: 'rgba(239,68,68,0.20)',
                        border: '1px solid rgba(239,68,68,0.40)',
                        boxShadow: '0 4px 20px rgba(239,68,68,0.30)',
                        transform: 'scale(1.1) translateY(-1px)',
                        '& svg': { transform: 'rotate(-12deg) scale(1.1)' }
                    },
                }}>
                <Logout sx={{
                    color: 'rgba(251,113,113,0.88)', fontSize: 19,
                    transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                }} />
            </Box>
        </Tooltip>
    </Box>
));

/* ══ FULL DRAWER CONTENT ════════════════════════════════════════════════════ */
const DrawerContent = React.memo(({ user, activeTab, pendingCount, onTabChange, onLogout, rankMeta, onCollapse, onProfileOpen }) => {

    // USER → no elevated tools
    const isAdmin = user?.rank === 'admin';
    const isHR = user?.rank === 'hr';
    const isSupervisor = user?.rank === 'supervisor';
    const isCEO = user?.rank === 'ceo';


    const baseItems = [
        { text: 'Clocking Dashboard', icon: <DashIcon />, color: colorPalette.aquaVibrant },
        { text: 'Attendance History', icon: <History />, color: '#60a5fa' },
        // { text: 'Notification Panel', icon: <CircleNotificationsRounded />, color: '#a78bfa' },
        // { text: 'Our Mobile App', icon: <Smartphone />, color: '#38bdf8' },
        { text: 'Request for Leave', icon: <EmojiPeopleRounded />, color: '#38bdf8' },
    ];
    const adminItems = [
        { text: 'Organisations Stats', icon: <QueryStats />, color: colorPalette.seafoamGreen },
        { text: 'User Management', icon: <SupervisorAccount />, color: '#38bdf8' },
        { text: 'Leave Management', icon: <SensorOccupiedRounded />, color: '#38bdf8' },
        { text: 'All User Requests', icon: <MarkEmailReadRounded />, color: colorPalette.softGray },
        { text: 'Password Reset Requests', icon: <Lock />, color: '#f97316' },
        { text: 'Feedback Statistics', icon: <InsightsRounded />, color: colorPalette.cloudWhite }
    ];
    const techItems = [
        { text: 'Lost Device', icon: <PhoneLocked />, color: '#fb923c' },
        { text: 'Add Device', icon: <AddCircle />, color: '#fbbf24' },
        { text: 'Help & Support', icon: <SupportAgentRounded />, color: '#22d3ee' },
    ];

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', ...G.sidebarBg }}>
            <SidebarOrbs />

            {/* ── Profile card ── */}
            <Box sx={{ px: 1.5, pt: 2, pb: 0.5, position: 'relative', zIndex: 1 }}>
                <Box sx={{
                    borderRadius: '18px', p: 2.2, position: 'relative', overflow: 'hidden',
                    background: 'rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.13)',
                    boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
                }}>
                    <Box sx={{ position: 'absolute', top: -18, right: -18, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(0,220,255,0.07)', pointerEvents: 'none' }} />
                    <Box sx={{ position: 'absolute', bottom: -22, left: 10, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(0,185,175,0.06)', pointerEvents: 'none' }} />

                    {/* Collapse button inside profile card */}
                    <Tooltip arrow title="Collapse sidebar" placement="right" >
                        <Box onClick={onCollapse} sx={{
                            position: 'absolute', top: 15, right: 10, zIndex: 2,
                            width: 26, height: 26, borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                background: 'rgba(0,220,255,0.14)',
                                border: '1px solid rgba(0,220,255,0.30)',
                                boxShadow: '0 2px 10px rgba(0,220,255,0.18)',
                                transform: 'scale(1.1)',
                            }
                        }}>
                            <ChevronLeft sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, }} />
                        </Box>
                    </Tooltip>

                    <Stack direction="row" alignItems="center" spacing={1.4} sx={{ position: 'relative', zIndex: 1 }}>
                        <Avatar
                            src={user?.avatar}
                            sx={{
                                width: 44, height: 44, flexShrink: 0,
                                background: 'linear-gradient(135deg,rgba(0,220,255,0.30),rgba(0,185,175,0.20))',
                                border: '2px solid rgba(255,255,255,0.22)',
                                color: '#fff', fontWeight: 900, fontSize: '0.95rem',
                                backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
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
                {/* user tools */}
                <SectionLabel>Navigation</SectionLabel>
                <List disablePadding>
                    {baseItems.map(item => (
                        <NavItem key={item.text} item={item} isActive={activeTab === item.text} pendingCount={pendingCount} onClick={() => onTabChange(item.text)} />
                    ))}
                </List>


                {/* CEO */}
                {isCEO && (
                    <>
                        <SectionLabel>CEO Panel</SectionLabel>
                        <List disablePadding>
                            {[
                                { text: 'Overall Organisation Stats', icon: <QueryStats />, color: '#22d3ee' },
                                { text: 'Station Statistics', icon: <InsightsRounded />, color: '#38bdf8' },
                                { text: 'Departmental Statistics', icon: <SupervisorAccount />, color: '#0ea5e9' },
                            ].map(item => (
                                <NavItem
                                    key={item.text}
                                    item={item}
                                    isActive={activeTab === item.text}
                                    pendingCount={pendingCount}
                                    onClick={() => onTabChange(item.text)}
                                />
                            ))}
                        </List>
                    </>
                )}

                {/* ── ADMIN PANEL ── */}
                {isAdmin && (
                    <>
                        <SectionLabel>Admin Tools</SectionLabel>
                        <List disablePadding>
                            {adminItems.map(item => (
                                <NavItem
                                    key={item.text}
                                    item={item}
                                    isActive={activeTab === item.text}
                                    pendingCount={pendingCount}
                                    onClick={() => onTabChange(item.text)}
                                />
                            ))}
                        </List>
                    </>
                )}

                {/* ── HR PANEL (same as admin but renamed) ── */}
                {isHR && (
                    <>
                        <SectionLabel>Human Resource</SectionLabel>
                        <List disablePadding>
                            {adminItems.map(item => (
                                <NavItem
                                    key={item.text}
                                    item={{ ...item }}
                                    isActive={activeTab === item.text}
                                    pendingCount={pendingCount}
                                    onClick={() => onTabChange(item.text)}
                                />
                            ))}
                        </List>
                    </>
                )}

                {/*  ── SUPERVISOR PANEL  */}
                {isSupervisor && (
                    <>
                        <SectionLabel>Supervisor Panel</SectionLabel>
                        <List disablePadding>
                            {[
                                { text: 'Departmental Statistics', icon: <QueryStats />, color: '#22d3ee' },
                                { text: 'Manage Your Members', icon: <SupervisorAccount />, color: '#0ea5e9' },
                                { text: 'Member Leave Requests', icon: <SensorOccupiedRounded />, color: '#06b6d4' },
                                // { text: 'Departmental Requests', icon: <MarkEmailReadRounded />, color: '#38bdf8' },
                            ].map(item => (
                                <NavItem
                                    key={item.text}
                                    item={item}
                                    isActive={activeTab === item.text}
                                    pendingCount={pendingCount}
                                    onClick={() => onTabChange(item.text)}
                                />
                            ))}
                        </List>
                    </>
                )}

                {/* technical help */}
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
});


/* ══ MAIN ═══════════════════════════════════════════════════════════════════ */
const EnhancedDashboard = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
    const { user } = useSelector(s => s.currentUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('Clocking Dashboard');
    const [userLocation, setUserLocation] = useState(null);
    const [isWithinGeofence, setIsWithinGeofence] = useState(false);
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const [tasks, setTasks] = useState([
        { id: 1, title: 'Water quality analysis - Station A', status: 'completed', time: '09:30 AM', date: '2024-02-04' },
        { id: 2, title: 'Update marine biodiversity database', status: 'in-progress', time: '11:00 AM', date: '2024-02-04' },
        { id: 3, title: 'Team meeting - Research protocols', status: 'pending', time: '02:00 PM', date: '2024-02-04' },
    ]);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        if (!PRIVILEGED_RANKS.includes(user?.rank)) return;
        let isMounted = true;
        const loadPending = async () => {
            try {
                const data = await fetchAllLostDevices();
                const list = Array.isArray(data) ? data : (data.requests ?? []);
                if (isMounted) setPendingCount(list.filter(r => r.status === 'pending').length);
            } catch { }
        };
        loadPending();
        const interval = setInterval(loadPending, 60_000);
        return () => { isMounted = false; clearInterval(interval); };
    }, [user?.rank]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setMobileOpen(false);
        if (tab === 'User Requests') setPendingCount(prev => prev);
    };

    const isElevated = ELEVATED_RANKS.includes(user?.rank);
    const isPrivileged = PRIVILEGED_RANKS.includes(user?.rank);
    const rankMeta = RANK_META[user?.rank] || RANK_META.user;

    const handleLogout = async () => {
        await userSignOut();
        dispatch(resetClearCurrentUserRedux());
        setLogoutDialogOpen(false);
        navigate("/");
    };



    // updated all nav items
    const allNavItems = useMemo(() => {
        const base = [
            { text: 'Clocking Dashboard', icon: <DashIcon />, color: colorPalette.aquaVibrant },
            { text: 'Attendance History', icon: <History />, color: '#60a5fa' },
            { text: 'Request for Leave', icon: <EmojiPeopleRounded />, color: '#38bdf8' },
        ];

        const tech = [
            { text: 'Lost Device', icon: <PhoneLocked />, color: '#fb923c' },
            { text: 'Add Device', icon: <AddCircle />, color: '#fbbf24' },
            { text: 'Help & Support', icon: <SupportAgentRounded />, color: '#22d3ee' },
        ];

        const roleItems = {
            admin: adminItems,
            hr: adminItems,
            supervisor: [
                { text: 'Departmental Statistics', icon: <QueryStats />, color: '#22d3ee' },
                { text: 'Manage Your Members', icon: <SupervisorAccount />, color: '#0ea5e9' },
                { text: 'Member Leave Requests', icon: <SensorOccupiedRounded />, color: '#06b6d4' },
                { text: 'Departmental Requests', icon: <MarkEmailReadRounded />, color: '#38bdf8' },
            ],

            ceo: [
                { text: 'Overall Organisation Stats', icon: <QueryStats />, color: '#22d3ee' },
                { text: 'Station Statistics', icon: <InsightsRounded />, color: '#38bdf8' },
                { text: 'Departmental Statistics', icon: <SupervisorAccount />, color: '#0ea5e9' },
            ],
        };

        return [
            ...base,
            ...(roleItems[user?.rank] || []),
            ...tech,
        ];
    }, [user?.rank]);

    const drawerProps = useMemo(() => ({
        user, isElevated, isPrivileged, activeTab, pendingCount, rankMeta,
        onTabChange: handleTabChange,
        onLogout: () => setLogoutDialogOpen(true),
        onCollapse: () => setSidebarCollapsed(true),
        onProfileOpen: () => setProfileOpen(true),
    }), [user, isElevated, isPrivileged, activeTab, pendingCount, rankMeta]);

    const currentDrawerWidth = sidebarCollapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH;

    const renderContent = () => {
        const sp = { tasks, setTasks, userLocation, setUserLocation, isWithinGeofence, setIsWithinGeofence };
        switch (activeTab) {
            case 'Clocking Dashboard': return <DashboardContent {...sp} />;
            case 'Tasks & Activities': return <TasksActivitiesContent {...sp} />;
            case 'Attendance History': return <AttendanceHistoryContent {...sp} />;
            case 'Analytics & Reports': return <AnalyticsReportsContent {...sp} />;
            case 'Department Structure': return <DepartmentStructureContent {...sp} />;
            case 'Request for Leave': return <LeaveManagementContent {...sp} />;
            case 'Leave Management': return <AdminLeaveManager {...sp} />;
            case 'Notification Panel': return <NotificationManagementContent {...sp} />;
            case 'Our Mobile App': return <DownloadMobileAppSection />;
            case 'Organisations Stats': return isElevated ? <OverallAttendanceStats /> : <DashboardContent {...sp} />;
            case 'All User Requests': return isElevated ? <UserRequestsContent onCountChange={setPendingCount} /> : <DashboardContent {...sp} />;
            case 'Lost Device': return <LostDeviceContent />;
            case 'Add Device': return <AddDeviceContent />;
            case 'User Management': return isElevated ? <UserManagementContent /> : <DashboardContent {...sp} />;
            case 'Password Reset Requests': return isElevated ? <PasswordResetRequests /> : <DashboardContent {...sp} />;
            case 'Feedback Statistics': return isElevated ? <FeedbackStatistics /> : <DashboardContent {...sp} />;
            case 'Help & Support': return <HelpSupport />;


            // Supervisor Pages (Separate Components)
            case 'Departmental Statistics':
                return <SupervisorDeptStats department={user?.department} />;

            case 'Manage Your Members':
                return <SupervisorManageMembers />;

            case 'Member Leave Requests':
                return <SupervisorManageLeaves />;

            case 'Departmental Requests':
                return <SupervisorDeptRequest />;

            default: return <DashboardContent {...sp} />;
        }
    };

    const pageTitles = {
        'Clocking Dashboard': `Welcome back, ${user?.name?.split(' ')[0] || 'User'} 👋`,
        'Attendance History': 'Attendance History',
        'Organisations Stats': 'Organisation Overview',
        'Tasks & Activities': 'Tasks & Activities',
        'Analytics & Reports': 'Analytics & Reports',
        'Department Structure': 'Department Structure',
        'Request for Leave': 'Request and Manage Your Leave',
        'Leave Management': 'Administration Leave Management',
        'Notification Panel': 'Notification Management',
        'All User Requests': 'User Device Requests',
        'Password Reset Requests': 'User Password Reset Requests',
        'Lost Device': 'Lost Device Request',
        'Add Device': 'Add Clocking Device',
        'Our Mobile App': 'KMFRI Mobile Application',
        'User Management': 'User Management & Administration',
        'Help & Support': 'Help & Support Center',
        'Feedback Statistics': 'Feedback Statistics Overview',
    };
    const pageSubtitles = {
        'All User Requests': 'Review and respond to employee lost-device requests awaiting your approval',
        'Lost Device': 'Raise a temporary-access request to your Admin, Hiring Manager, or Supervisor',
        'Add Device': 'Register additional devices to clock in and out seamlessly from multiple devices',
        'Organisation Overview': 'Organisation-wide attendance insights for decision making',
        'Our Mobile App': 'Clock in using either the Web Portal or Android Mobile App to ensure uninterrupted attendance tracking.',
        'Help & Support': 'Find guidance, report issues, and get assistance for the KMFRI Attendance System.',
        'Feedback Statistics': 'View aggregated feedback data from employees and supervisors',
    };



    const handleProfileSave = async ({ phone, newPassword, avatarFile }) => {

        const updatedUser = await updateUserProfile({
            phone,
            newPassword,
            avatarFile
        });

        // update redux
        dispatch(updateUserCurrentUserRedux(updatedUser));

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
                            Staff Attendance System
                        </Typography>
                    </Box>

                    <Tooltip title="View Profile">
                        <Avatar
                            src={user?.avatar}
                            onClick={() => setProfileOpen(true)}
                            sx={{
                                background: 'rgba(0,220,255,0.18)',
                                border: '2px solid rgba(255,255,255,0.28)',
                                color: '#fff', fontWeight: 900, fontSize: '0.82rem',
                                cursor: 'pointer', backdropFilter: 'blur(4px)',
                                '&:hover': { background: 'rgba(0,220,255,0.28)' },
                                transition: 'all 0.2s',
                            }}>
                            {user?.name?.split(' ')[0]?.charAt(0)}{user?.name?.split(' ')[1]?.charAt(0)}
                        </Avatar>
                    </Tooltip>
                </Toolbar>
            </AppBar>

            {/* ── Sidebar ── */}
            <Box
                component="nav"
                sx={{
                    width: { md: currentDrawerWidth },
                    flexShrink: { md: 0 },
                    transition: 'width 0.32s cubic-bezier(0.4,0,0.2,1)',
                }}>
                {/* Mobile temporary drawer */}
                <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none', pt: `${APPBAR_HEIGHT}px`, bgcolor: 'transparent' }
                    }}>
                    <DrawerContent {...drawerProps} />
                </Drawer>

                {/* Desktop permanent drawer — animated width */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': {
                            width: currentDrawerWidth,
                            mt: `${APPBAR_HEIGHT}px`,
                            height: `calc(100% - ${APPBAR_HEIGHT}px)`,
                            border: 'none',
                            bgcolor: 'transparent',
                            overflow: 'hidden',
                            transition: 'width 0.32s cubic-bezier(0.4,0,0.2,1)',
                        }
                    }}
                    open>
                    <AnimatePresence mode="wait" initial={false}>
                        {sidebarCollapsed ? (
                            <motion.div
                                key="collapsed"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                                style={{ height: '100%' }}
                            >
                                <CollapsedDrawerContent
                                    user={user}
                                    isElevated={isElevated}
                                    activeTab={activeTab}
                                    pendingCount={pendingCount}
                                    onTabChange={handleTabChange}
                                    onLogout={() => setLogoutDialogOpen(true)}
                                    onExpand={() => setSidebarCollapsed(false)}
                                    allItems={allNavItems}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="expanded"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                                style={{ height: '100%' }}
                            >
                                <DrawerContent {...drawerProps} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Drawer>
            </Box>

            {/* ── Main content ── */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, sm: 2.5, md: 3.5 },
                    mt: `${APPBAR_HEIGHT}px`,
                    width: { xs: '100%', md: `calc(100% - ${currentDrawerWidth}px)` },
                    minHeight: `calc(100vh - ${APPBAR_HEIGHT}px)`,
                    boxSizing: 'border-box',
                    position: 'relative',
                    transition: 'width 0.32s cubic-bezier(0.4,0,0.2,1)',
                }}>
                <AnimatePresence mode="wait">
                    <motion.div style={{ willChange: 'transform, opacity' }} key={activeTab}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}>

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

                        <Suspense fallback={
                            <Stack height={'80vh'} width={'100%'} justifyContent={'center'}>
                                <Box display={'flex'} justifyContent={'center'} alignItems={'center'}>
                                    <CircularProgress size={20} />
                                </Box>
                            </Stack>
                        }>
                            {renderContent()}
                        </Suspense>
                    </motion.div>
                </AnimatePresence>
            </Box>

            {/* user not activated their accounts */}
            {!user?.isAccountActive && <DialogAlert />}

            {/* show user profile dialog */}
            <UserProfileDialog
                open={profileOpen}
                onClose={() => setProfileOpen(false)}
                user={user}
                onSave={handleProfileSave}
            />


            {/* ── Logout dialog ── */}
            <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}
                PaperProps={{ sx: { ...G.dialog, borderRadius: '24px', p: 1, maxWidth: 420, width: '100%' } }}
                BackdropProps={{ sx: { backdropFilter: 'blur(3px)', bgcolor: 'rgba(6,28,50,0.30)' } }}>
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