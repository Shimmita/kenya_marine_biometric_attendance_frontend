import {
    AccessibilityNewRounded, ContrastRounded, HelpOutlineRounded,
    InstallDesktop,
    Logout as LogoutIcon,
    MenuBookRounded, Menu as MenuIcon, MenuRounded,
    Person,
    RemoveRedEyeRounded, TextDecreaseRounded, TextIncreaseRounded
} from '@mui/icons-material';
import {
    AppBar, Avatar, Box, Button, Container, IconButton,
    Menu, MenuItem, Popover, Stack, Toolbar, Tooltip, Typography,
    useMediaQuery, useTheme
} from '@mui/material';
import { useEffect, useState } from 'react';

import KenyaArmsLogo from "../images/gov_logo.png";
import KMFRILogo from "../images/kmfri_logo.png";
import coreDataDetails from './CoreDataDetails';

const { colorPalette } = coreDataDetails;

/* ══ ACCESSIBILITY HELPERS ═══════════════════════════════════════════════════ */
const A11Y_STORAGE_KEY = 'kmfri_a11y_prefs_v1';
const FONT_SCALES = [0.9, 1, 1.1, 1.25];
const BASE_ROOT_FONT_PX = 16;

export const loadA11yPrefs = () => {
    try {
        const raw = window.localStorage.getItem(A11Y_STORAGE_KEY);
        if (!raw) return { scaleIndex: 1, highContrast: false, reducedMotion: false };
        return { scaleIndex: 1, highContrast: false, reducedMotion: false, ...JSON.parse(raw) };
    } catch {
        return { scaleIndex: 1, highContrast: false, reducedMotion: false };
    }
};

export const useAccessibilityPrefs = () => {
    const [prefs, setPrefs] = useState(loadA11yPrefs);

    useEffect(() => {
        document.documentElement.style.fontSize = `${BASE_ROOT_FONT_PX * FONT_SCALES[prefs.scaleIndex]}px`;
        document.documentElement.dataset.kmfriContrast = prefs.highContrast ? 'high' : 'normal';
        document.documentElement.dataset.kmfriMotion = prefs.reducedMotion ? 'reduced' : 'full';
        try { window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs)); } catch { /* no-op */ }
        return () => { document.documentElement.style.fontSize = `${BASE_ROOT_FONT_PX}px`; };
    }, [prefs]);

    // Sync with localStorage changes from other components
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === A11Y_STORAGE_KEY && e.newValue) {
                try {
                    const newPrefs = JSON.parse(e.newValue);
                    setPrefs(newPrefs);
                } catch { /* ignore parse errors */ }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return [prefs, setPrefs];
};

export const AccessibilityMenu = ({ prefs, setPrefs }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    if (!prefs || !setPrefs) return null;

    const adjustFont = (dir) => setPrefs((p) => ({
        ...p,
        scaleIndex: Math.min(FONT_SCALES.length - 1, Math.max(0, p.scaleIndex + dir)),
    }));

    return (
        <>
            <Tooltip title="Accessibility options">
                <IconButton
                    aria-label="Accessibility options"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{
                        background: 'rgba(255,255,255,0.12)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.22)',
                        color: '#fff',
                        borderRadius: '50%',
                        width: 40,
                        height: 40,
                        '&:hover': { background: 'rgba(255,255,255,0.24)' }
                    }}
                >
                    <AccessibilityNewRounded fontSize="small" />
                </IconButton>
            </Tooltip>
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
                        border: '1px solid rgba(10,61,98,0.14)'
                    }
                }}
            >
                <Box sx={{ p: 2.5, width: 260 }}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, color: colorPalette?.deepNavy || '#0A3D62' }}>
                        Accessibility Options
                    </Typography>

                    <Typography variant="caption" color="text.secondary" fontWeight={700}>Text Size</Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, mb: 2 }}>
                        <IconButton size="small" onClick={() => adjustFont(-1)} aria-label="Decrease text size">
                            <TextDecreaseRounded fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" sx={{ minWidth: 44, textAlign: 'center', fontWeight: 700 }}>
                            {Math.round(FONT_SCALES[prefs.scaleIndex] * 100)}%
                        </Typography>
                        <IconButton size="small" onClick={() => adjustFont(1)} aria-label="Increase text size">
                            <TextIncreaseRounded fontSize="small" />
                        </IconButton>
                    </Stack>

                    <Button
                        fullWidth
                        size="small"
                        variant={prefs.highContrast ? 'contained' : 'outlined'}
                        startIcon={<ContrastRounded fontSize="small" />}
                        onClick={() => setPrefs((p) => ({ ...p, highContrast: !p.highContrast }))}
                        sx={{ textTransform: 'none', fontWeight: 700, mb: 1, justifyContent: 'flex-start', borderRadius: '10px' }}
                    >
                        High Contrast Mode
                    </Button>

                    <Button
                        fullWidth
                        size="small"
                        variant={prefs.reducedMotion ? 'contained' : 'outlined'}
                        startIcon={<RemoveRedEyeRounded fontSize="small" />}
                        onClick={() => setPrefs((p) => ({ ...p, reducedMotion: !p.reducedMotion }))}
                        sx={{ textTransform: 'none', fontWeight: 700, justifyContent: 'flex-start', borderRadius: '10px' }}
                    >
                        Reduce Motion
                    </Button>
                </Box>
            </Popover>
        </>
    );
};

/* ══ UNIFIED NAVBAR ══════════════════════════════════════════════════════════ */
const ghostBtnSx = {
    background: 'rgba(255,255,255,0.10)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.20)',
    color: '#fff',
    textTransform: 'none',
    fontWeight: 700,
    borderRadius: '12px',
    '&:hover': { background: 'rgba(255,255,255,0.20)', border: '1px solid rgba(255,255,255,0.35)' },
};

function AppNavbar({
    variant = 'landing', // 'landing' | 'dashboard'
    onNavigate,
    platformLogoUrl,
    platformBranding,
    onOpenHelp,
    onOpenGuide,
    a11yPrefs,
    setA11yPrefs,
    mobileOpen,
    setMobileOpen,
    user,
    openProfile,
    onLogout,
    canInstall,
    handleInstall,
    installStatus,
    setActiveTab,
}) {
    const theme = useTheme();
    const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
    const isTablet = useMediaQuery(theme.breakpoints.up('sm'));
    const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);

    const isDashboard = variant === 'dashboard';
    const orgFullName = platformBranding?.organizationName || 'KENYA MARINE AND FISHERIES RESEARCH INSTITUTE';
    const orgShortName = platformBranding?.shortName || 'KMFRI';

    const handleGuideClick = () => {
        if (onOpenGuide) onOpenGuide();
    };

    const handleHelpClick = () => {
        if (onOpenHelp) {
            onOpenHelp();
        } else if (setActiveTab) {
            setActiveTab('Help & Support');
        }
    };

    const logoSrc = platformLogoUrl || KMFRILogo;

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                zIndex: (t) => isDashboard ? t.zIndex.drawer + 1 : t.zIndex.appBar,
                background: 'var(--kmfri-nav-gradient, var(--kmfri-gradient, linear-gradient(135deg, #062848 0%, #0A4D74 100%)))',
                backdropFilter: 'blur(18px) saturate(200%)',
                WebkitBackdropFilter: 'blur(18px) saturate(200%)',
                borderBottom: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 4px 28px rgba(0,0,0,0.25)',
            }}
        >
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 74 }, py: 0.8, gap: 1 }}>

                    {/* Dashboard Mobile Drawer Toggle */}
                    {isDashboard && (
                        <IconButton
                            color="inherit"
                            edge="start"
                            aria-label="Toggle Navigation Menu"
                            onClick={() => setMobileOpen && setMobileOpen((prev) => !prev)}
                            sx={{
                                display: { md: 'none' },
                                bgcolor: 'rgba(255,255,255,0.12)',
                                borderRadius: '11px',
                                p: 0.9,
                                border: '1px solid rgba(255,255,255,0.20)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
                                mr: 0.5,
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

                    {/* Official Government & KMFRI Branding */}
                    <Box
                        onClick={() => {
                            if (onNavigate) onNavigate('landing');
                        }}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: onNavigate ? 'pointer' : 'default',
                            flexGrow: 1,
                            minWidth: 0,
                        }}
                    >
                        {/* Kenya Coat of Arms */}
                        <Box
                            component="img"
                            src={KenyaArmsLogo}
                            alt="Government of Kenya"
                            loading="eager"
                            sx={{
                                height: { xs: 34, sm: 44, md: 54 },
                                width: 'auto',
                                flexShrink: 0,
                                borderRadius: '2px',
                            }}
                        />

                        {/* Kenya Flag vertical divider */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                width: { xs: 4, md: 6 },
                                height: { xs: 34, sm: 44, md: 54 },
                                overflow: 'hidden',
                                borderRadius: '6px',
                                mx: { xs: 0.6, sm: 1 },
                                flexShrink: 0,
                                border: '1px solid rgba(255,255,255,.18)',
                                boxShadow: '0 2px 8px rgba(0,0,0,.25)',
                            }}
                        >
                            <Box sx={{ flex: 3, bgcolor: '#000000' }} />
                            <Box sx={{ flex: 0.45, bgcolor: '#FFFFFF' }} />
                            <Box sx={{ flex: 3, bgcolor: '#BB1E10' }} />
                            <Box sx={{ flex: 0.45, bgcolor: '#FFFFFF' }} />
                            <Box sx={{ flex: 3, bgcolor: '#006600' }} />
                        </Box>

                        {/* KMFRI Logo inside clean white card */}
                        <Box
                            sx={{
                                background: '#ffffff',
                                borderRadius: '6px',
                                p: 0.4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 14px rgba(0,0,0,.20)',
                                flexShrink: 0,
                            }}
                        >
                            <Box
                                component="img"
                                src={logoSrc}
                                alt="KMFRI Logo"
                                loading="eager"
                                sx={{
                                    height: { xs: 26, sm: 34, md: 44 },
                                    width: 'auto',
                                    objectFit: 'contain',
                                }}
                            />
                        </Box>

                        {/* Title & Subtitle */}
                        <Box sx={{ ml: { xs: 0.8, sm: 1.5 }, overflow: 'hidden', minWidth: 0 }}>
                            <Typography
                                noWrap
                                sx={{
                                    color: '#fff',
                                    fontWeight: 800,
                                    lineHeight: 1.15,
                                    letterSpacing: 0.35,
                                    fontSize: { xs: '0.82rem', sm: '0.95rem', md: '1.05rem' },
                                    textShadow: '0 2px 8px rgba(0,0,0,.35)',
                                    display: { xs: 'none', sm: 'block' },
                                }}
                            >
                                {(isTablet || isMdUp) ? orgFullName.toUpperCase() : `${orgShortName}`}
                            </Typography>
                            <Typography
                                sx={{
                                    color: 'var(--kmfri-accent-bright, var(--kmfri-accent, #48C9B0))',
                                    fontWeight: 700,
                                    fontSize: { xs: '0.62rem', sm: '0.70rem' },
                                    lineHeight: 1.2,
                                    mt: 0.2,
                                    letterSpacing: 0.3,
                                    display: { xs: 'none', sm: 'block' },
                                }}
                            >
                                Staff Biometric Attendance System
                            </Typography>
                        </Box>
                    </Box>

                    {/* Actions (Desktop >= 900px) */}
                    {isMdUp ? (
                        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ flexShrink: 0 }}>
                            {onOpenGuide && (
                                <Button
                                    onClick={handleGuideClick}
                                    startIcon={<MenuBookRounded fontSize="small" />}
                                    sx={{ ...ghostBtnSx, px: 1.75, py: 0.85, fontSize: '0.82rem' }}
                                >
                                    Guide
                                </Button>
                            )}

                            {/* Help & Support */}
                            {(onOpenHelp || setActiveTab) && (
                                <Button
                                    onClick={handleHelpClick}
                                    startIcon={<HelpOutlineRounded fontSize="small" />}
                                    sx={{ ...ghostBtnSx, px: 1.75, py: 0.85, fontSize: '0.82rem' }}
                                >
                                    Help & Support
                                </Button>
                            )}

                            {/* Accessibility Widget */}
                            {a11yPrefs && setA11yPrefs && (
                                <AccessibilityMenu prefs={a11yPrefs} setPrefs={setA11yPrefs} />
                            )}

                            {/* PWA Install Button */}
                            {canInstall && (
                                <Tooltip title="Install KMFRI Digital Attendance System">
                                    <IconButton
                                        color="inherit"
                                        onClick={handleInstall}
                                        sx={{
                                            ...ghostBtnSx,
                                            borderRadius: '50%',
                                            width: 40,
                                            height: 40,
                                            p: 0,
                                        }}
                                    >
                                        <InstallDesktop fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {/* Dashboard User Profile Avatar */}
                            {isDashboard && user && (
                                <Tooltip title="View Profile Options">
                                    <IconButton
                                        onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                                        sx={{ p: 0, ml: 0.5 }}
                                    >
                                        <Avatar
                                            src={user?.avatar}
                                            sx={{
                                                width: 42,
                                                height: 42,
                                                background: 'rgba(0,220,255,0.22)',
                                                border: '2px solid rgba(255,255,255,0.40)',
                                                color: '#fff',
                                                fontWeight: 900,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                                                '&:hover': { transform: 'scale(1.05)' },
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            {user?.name?.split(' ')[0]?.charAt(0)}
                                            {user?.name?.split(' ')[1]?.charAt(0)}
                                        </Avatar>
                                    </IconButton>
                                </Tooltip>
                            )}

                            {/* User Profile Dropdown Menu */}
                            {isDashboard && (
                                <Menu
                                    anchorEl={userMenuAnchor}
                                    open={Boolean(userMenuAnchor)}
                                    onClose={() => setUserMenuAnchor(null)}
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                    PaperProps={{
                                        sx: {
                                            borderRadius: '14px',
                                            minWidth: 180,
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                                            border: '1px solid rgba(10,61,98,0.12)',
                                            mt: 1,
                                        }
                                    }}
                                >
                                    {openProfile && (
                                        <MenuItem
                                            onClick={() => {
                                                setUserMenuAnchor(null);
                                                openProfile();
                                            }}
                                        >
                                            <Stack direction="row" spacing={1.2} alignItems="center">
                                                <Person fontSize="small" color="primary" />
                                                <Typography variant="body2" fontWeight={700}>View Profile</Typography>
                                            </Stack>
                                        </MenuItem>
                                    )}
                                    {onLogout && (
                                        <MenuItem
                                            onClick={() => {
                                                setUserMenuAnchor(null);
                                                onLogout();
                                            }}
                                        >
                                            <Stack direction="row" spacing={1.2} alignItems="center">
                                                <LogoutIcon fontSize="small" color="error" />
                                                <Typography variant="body2" fontWeight={700} color="error.main">Logout</Typography>
                                            </Stack>
                                        </MenuItem>
                                    )}
                                </Menu>
                            )}
                        </Stack>
                    ) : (
                        /* Mobile Action Bar (< 900px) */
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
                            {a11yPrefs && setA11yPrefs && (
                                <AccessibilityMenu prefs={a11yPrefs} setPrefs={setA11yPrefs} />
                            )}

                            {/* Mobile Actions Dropdown */}
                            <IconButton
                                aria-label="Open navigation menu"
                                onClick={(e) => setMobileMenuAnchor(e.currentTarget)}
                                sx={{ ...ghostBtnSx, borderRadius: '50%', width: 40, height: 40, p: 0 }}
                            >
                                <MenuRounded fontSize="small" />
                            </IconButton>

                            <Menu
                                anchorEl={mobileMenuAnchor}
                                open={Boolean(mobileMenuAnchor)}
                                onClose={() => setMobileMenuAnchor(null)}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                PaperProps={{
                                    sx: {
                                        borderRadius: '14px',
                                        minWidth: 190,
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                                        mt: 1,
                                    }
                                }}
                            >
                                {onOpenGuide && (
                                    <MenuItem
                                        onClick={() => {
                                            handleGuideClick();
                                            setMobileMenuAnchor(null);
                                        }}
                                    >
                                        <Stack direction="row" spacing={1.2} alignItems="center">
                                            <MenuBookRounded fontSize="small" />
                                            <Typography variant="body2" fontWeight={600}>System Guide</Typography>
                                        </Stack>
                                    </MenuItem>
                                )}
                                {(onOpenHelp || setActiveTab) && (
                                    <MenuItem
                                        onClick={() => {
                                            handleHelpClick();
                                            setMobileMenuAnchor(null);
                                        }}
                                    >
                                        <Stack direction="row" spacing={1.2} alignItems="center">
                                            <HelpOutlineRounded fontSize="small" />
                                            <Typography variant="body2" fontWeight={600}>Help & Support</Typography>
                                        </Stack>
                                    </MenuItem>
                                )}
                                {canInstall && (
                                    <MenuItem
                                        onClick={() => {
                                            if (handleInstall) handleInstall();
                                            setMobileMenuAnchor(null);
                                        }}
                                    >
                                        <Stack direction="row" spacing={1.2} alignItems="center">
                                            <InstallDesktop fontSize="small" />
                                            <Typography variant="body2" fontWeight={600}>Install Web App</Typography>
                                        </Stack>
                                    </MenuItem>
                                )}
                                {isDashboard && openProfile && (
                                    <MenuItem
                                        onClick={() => {
                                            setMobileMenuAnchor(null);
                                            openProfile();
                                        }}
                                    >
                                        <Stack direction="row" spacing={1.2} alignItems="center">
                                            <Person fontSize="small" />
                                            <Typography variant="body2" fontWeight={600}>User Profile</Typography>
                                        </Stack>
                                    </MenuItem>
                                )}
                            </Menu>

                            {/* User avatar on mobile for Dashboard */}
                            {isDashboard && user && (
                                <Avatar
                                    src={user?.avatar}
                                    onClick={openProfile}
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        background: 'rgba(0,220,255,0.22)',
                                        border: '2px solid rgba(255,255,255,0.40)',
                                        color: '#fff',
                                        fontWeight: 900,
                                        fontSize: '0.78rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {user?.name?.split(' ')[0]?.charAt(0)}
                                    {user?.name?.split(' ')[1]?.charAt(0)}
                                </Avatar>
                            )}
                        </Stack>
                    )}
                </Toolbar>
            </Container>
        </AppBar>
    );
}

export default AppNavbar;
