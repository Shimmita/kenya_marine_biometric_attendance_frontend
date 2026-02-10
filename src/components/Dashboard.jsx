import {
    Dashboard as DashIcon,
    History,
    Menu as MenuIcon,
    Notifications
} from '@mui/icons-material';
import {
    AppBar,
    Avatar,
    Badge,
    Box,
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
    useTheme
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSelector } from "react-redux";
import KMFRILogo from '../assets/kmfri.png';


// Import page components
import AnalyticsReportsContent from './dashboard/AnalyticsReport';
import AttendanceHistoryContent from './dashboard/AttendanceHistory';
import DashboardContent from './dashboard/DashBoardContent';
import DepartmentStructureContent from './dashboard/DepartmentStructure';
import LeaveManagementContent from './dashboard/LeaveManagement';
import NotificationManagementContent from './dashboard/NotificationManagement';
import TasksActivitiesContent from './dashboard/TaskActivities';

const drawerWidth = 280;

// On-Trend Marine & Ocean Color Palette for 2025
export const colorPalette = {
    deepNavy: '#0A3D62',
    oceanBlue: '#005B96',
    marineBlue: '#1a237e',
    aquaVibrant: '#00e5ff',
    cyanFresh: '#368DC5',
    skyBlue: '#87CEEB',
    coralSunset: '#FF6F61',
    warmSand: '#FFB400',
    seafoamGreen: '#48C9B0',
    cloudWhite: '#f8fafd',
    softGray: '#E8EEF7',
    charcoal: '#424242',
    oceanGradient: 'linear-gradient(135deg, #0A3D62 0%, #005B96 50%, #1B4F72 100%)',
    sunsetGradient: 'linear-gradient(135deg, #FF6F61 0%, #FFB400 100%)',
    freshGradient: 'linear-gradient(135deg, #00e5ff 0%, #48C9B0 100%)',
};

export const KMFRI_LOCATION = {
    lat: -4.0546393,
    lng: 39.6826161
};


	
export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const toRad = (value) => (value * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const EnhancedDashboard = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    // redux state
    const { user, isGuest } = useSelector((state) => state.currentUser);

    // State Management
    const [mobileOpen, setMobileOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState('My Dashboard');
    const [userLocation, setUserLocation] = useState(null);
    const [isWithinGeofence, setIsWithinGeofence] = useState(false);

    // Shared state that can be passed to child components
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [tasks, setTasks] = useState([
        { id: 1, title: 'Water quality analysis - Station A', status: 'completed', time: '09:30 AM', date: '2024-02-04' },
        { id: 2, title: 'Update marine biodiversity database', status: 'in-progress', time: '11:00 AM', date: '2024-02-04' },
        { id: 3, title: 'Team meeting - Research protocols', status: 'pending', time: '02:00 PM', date: '2024-02-04' }
    ]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

    const menuItems = [
        { text: 'My Dashboard', icon: <DashIcon />, color: colorPalette.oceanBlue },
        // { text: 'Tasks & Activities', icon: <Assignment />, color: colorPalette.aquaVibrant },
        { text: 'Attendance History', icon: <History />, color: colorPalette.deepNavy },
        // { text: 'Analytics & Reports', icon: <Insights />, color: colorPalette.seafoamGreen },
        // { text: 'Notification Management', icon: <Notifications />, color: colorPalette.marineBlue },
        // { text: 'Department Structure', icon: <Group />, color: colorPalette.coralSunset },
        // { text: 'Leave Management', icon: <EventNote />, color: colorPalette.warmSand },
    ];

    // Drawer Content
    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
            <Divider />
            <List sx={{ px: 2, mt: 2, flexGrow: 1 }}>
                {menuItems.map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        onClick={() => { setActiveTab(item.text); setMobileOpen(false); }}
                        sx={{
                            borderRadius: 3,
                            mb: 1,
                            bgcolor: activeTab === item.text ? `${item.color}15` : 'transparent',
                            color: activeTab === item.text ? item.color : '#666',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                bgcolor: `${item.color}10`,
                                transform: 'translateX(5px)',
                            }
                        }}
                    >
                        <ListItemIcon sx={{ color: activeTab === item.text ? item.color : '#666', minWidth: 40 }}>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                                fontWeight: activeTab === item.text ? 700 : 500,
                                fontSize: '0.9rem'
                            }}
                        />
                    </ListItem>
                ))}
            </List>
            <Divider />

        </Box>
    );

    // Render dynamic content based on active tab
    const renderContent = () => {
        const sharedProps = {
            currentTime,
            isCheckedIn,
            setIsCheckedIn,
            tasks,
            setTasks,
            userLocation,
            setUserLocation,
            isWithinGeofence,
            setIsWithinGeofence
        };

        switch (activeTab) {
            case 'My Dashboard':
                return <DashboardContent {...sharedProps} />;
            case 'Tasks & Activities':
                return <TasksActivitiesContent {...sharedProps} />;
            case 'Attendance History':
                return <AttendanceHistoryContent {...sharedProps} />;
            case 'Analytics & Reports':
                return <AnalyticsReportsContent {...sharedProps} />;
            case 'Department Structure':
                return <DepartmentStructureContent {...sharedProps} />;
            case 'Leave Management':
                return <LeaveManagementContent {...sharedProps} />;
            case 'Notification Management':
                return <NotificationManagementContent {...sharedProps} />;
            default:
                return <DashboardContent {...sharedProps} />;
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: colorPalette.cloudWhite }}>
            {/* AppBar */}
            <AppBar
                position="fixed"
                sx={{
                    zIndex: theme.zIndex.drawer + 1,
                    background: colorPalette.oceanGradient,
                    boxShadow: '0 4px 20px rgba(10, 61, 98, 0.15)',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Box
                        component="img"
                        src={KMFRILogo}
                        alt="KMFRI Logo"
                        sx={{
                            height: { md: 50, lg: 60, xs: 50 },
                            width: 'auto',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '3px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        }}
                    />
                    <Box ml={2} sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" noWrap sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
                            {isTablet ? 'KMFRI Portal' : 'Kenya Marine and Fisheries Research Institute'}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.85, display: { xs: 'none', sm: 'block' } }}>
                            Digital Attendance & Task Management System for Interns and Attachés
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Tooltip title="Notifications">
                            <IconButton color="inherit">
                                <Badge badgeContent={3} sx={{ '& .MuiBadge-badge': { bgcolor: colorPalette.coralSunset } }}>
                                    <Notifications />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={user?.name || 'Guest User'}>
                        <Avatar
                            sx={{
                                width: 35,
                                height: 35,
                                bgcolor: colorPalette.aquaVibrant,
                                color: colorPalette.deepNavy,
                                fontWeight: 'bold',
                                border: '2px solid rgba(255,255,255,0.3)'
                            }}
                        >
                            {user?.name?.split(' ')[0]?.charAt(0)}{user?.name?.split(' ')[1]?.charAt(0)}
                        </Avatar>
                        </Tooltip>
                    </Stack>
                </Toolbar>
            </AppBar>

            {/* Sidebar */}
            <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' }
                    }}
                >
                    {drawerContent}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            mt: '64px',
                            height: 'calc(100% - 64px)',
                            border: 'none',
                            boxShadow: '4px 0 20px rgba(0,0,0,0.03)'
                        }
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            </Box>

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, md: 4 },
                    mt: '64px',
                    width: { md: `calc(100% - ${drawerWidth}px)` }
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Page Header */}
                        <Box sx={{ mb: 4 }}>
                            <Typography
                                variant="h5"
                                fontWeight="900"
                                sx={{
                                    background: colorPalette.oceanGradient,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    mb: 0.5
                                }}
                            >
                               {user?.name || 'Guest User'}
                            </Typography>
                        </Box>

                        {/* Dynamic Content */}
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </Box>
        </Box>
    );
};

export default EnhancedDashboard;