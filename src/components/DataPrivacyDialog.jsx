import {
    BadgeRounded,
    Close,
    DevicesRounded,
    FingerprintRounded,
    LocationOnRounded,
    LockRounded,
    PrivacyTipRounded,
    ShareRounded,
    ShieldRounded,
    VerifiedUserRounded,
} from '@mui/icons-material';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import coreDataDetails from './CoreDataDetails';

const { colorPalette } = coreDataDetails;

const DATA_PRIVACY_POINTS = [
    {
        title: 'Location Use',
        body: 'Your location is requested only when you clock in or clock out. It is used to confirm that you are within the approved geofence of your work station premises.',
        icon: LocationOnRounded,
        label: 'Geofence only',
    },
    {
        title: 'Biometric Privacy',
        body: 'KMFRI does not store your fingerprint, face, or device biometric template. Biometric verification remains on your device; the system only receives the authentication result needed to protect your account.',
        icon: FingerprintRounded,
        label: 'Stored on device',
    },
    {
        title: 'Registered Devices',
        body: 'Device registration helps prevent account impersonation by linking each account to an approved device. Basic device details may be used for authentication, lost-device handling, and account security reviews.',
        icon: DevicesRounded,
        label: 'Account protection',
    },
    {
        title: 'User Records',
        body: 'Profile, department, station, attendance, leave, notification, support, and audit records are used only for official attendance administration, reporting, supervision, compliance, and user support.',
        icon: BadgeRounded,
        label: 'Official use only',
    },
    {
        title: 'Data Sharing',
        body: 'Collected user information is not sold or shared with third parties. It is used within the organization by authorized personnel when required to process staff records and attendance operations.',
        icon: ShareRounded,
        label: 'Not sold',
    },
    {
        title: 'Access & Security',
        body: 'Access is role-based, sessions expire after inactivity, and a newer login replaces an older active session to reduce unauthorized access from shared or lost devices.',
        icon: ShieldRounded,
        label: 'Role protected',
    },
];

const DataPrivacyDialog = ({
    open,
    onClose,
    requireDecision = false,
    accepting = false,
    onAccept,
    onReject,
}) => {
    const handleClose = (_, reason) => {
        if (requireDecision && ['backdropClick', 'escapeKeyDown'].includes(reason)) return;
        if (!requireDecision) onClose?.();
    };

    return (
    <Dialog
        open={open}
        onClose={handleClose}
        disableEscapeKeyDown={requireDecision}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
            sx: {
                width: '100%',
                maxWidth: 820,
                maxHeight: { xs: '92vh', sm: '88vh' },
                m: { xs: 1.5, sm: 3 },
                borderRadius: { xs: '14px', sm: '18px' },
                overflow: 'hidden',
                border: '1px solid rgba(10, 61, 98, 0.10)',
                boxShadow: '0 24px 70px rgba(5, 37, 61, 0.20)',
                background: '#fff',
            },
        }}
        BackdropProps={{
            sx: {
                backgroundColor: 'rgba(5, 37, 61, 0.52)',
                backdropFilter: 'blur(5px)',
            },
        }}
    >
        <Box
            sx={{
                position: 'relative',
                px: { xs: 2.25, sm: 3.5 },
                pt: { xs: 2.25, sm: 3 },
                pb: { xs: 2.25, sm: 2.75 },
                overflow: 'hidden',
                background: `
                    linear-gradient(
                        135deg,
                        ${colorPalette.deepNavy} 0%,
                        var(--kmfri-secondary, #005B96) 100%
                    )
                `,
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    width: 180,
                    height: 180,
                    borderRadius: '50%',
                    right: -65,
                    top: -100,
                    border: '32px solid rgba(255,255,255,0.05)',
                    pointerEvents: 'none',
                }}
            />

            <Box
                sx={{
                    position: 'absolute',
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    right: 75,
                    bottom: -75,
                    background: 'rgba(0,229,255,0.05)',
                    pointerEvents: 'none',
                }}
            />

            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                spacing={2}
                sx={{ position: 'relative', zIndex: 1 }}
            >
                <Stack
                    direction="row"
                    spacing={{ xs: 1.4, sm: 1.8 }}
                    alignItems="center"
                >
                    <Box
                        sx={{
                            width: { xs: 42, sm: 48 },
                            height: { xs: 42, sm: 48 },
                            flexShrink: 0,
                            borderRadius: '12px',
                            display: 'grid',
                            placeItems: 'center',
                            color: '#fff',
                            background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.16)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
                        }}
                    >
                        <PrivacyTipRounded sx={{ fontSize: { xs: 23, sm: 27 } }} />
                    </Box>

                    <Box>
                        <Typography
                            sx={{
                                color: '#fff',
                                fontSize: { xs: '1.05rem', sm: '1.25rem' },
                                fontWeight: 900,
                                lineHeight: 1.2,
                                letterSpacing: 0,
                            }}
                        >
                            Data Privacy
                        </Typography>

                        <Typography
                            sx={{
                                mt: 0.55,
                                color: 'rgba(255,255,255,0.70)',
                                fontSize: { xs: '0.76rem', sm: '0.82rem' },
                                lineHeight: 1.45,
                                maxWidth: 520,
                            }}
                        >
                            How KMFRI Attendance uses, processes and protects your information.
                        </Typography>
                    </Box>
                </Stack>

                {!requireDecision && (
                    <Tooltip title="Close" placement="left" arrow>
                        <IconButton
                            onClick={onClose}
                            aria-label="Close data privacy"
                            size="small"
                            sx={{
                                flexShrink: 0,
                                width: 34,
                                height: 34,
                                color: '#fff',
                                background: 'rgba(255,255,255,0.10)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                transition: 'all 180ms ease',

                                '&:hover': {
                                    background: 'rgba(255,255,255,0.18)',
                                    transform: 'rotate(3deg)',
                                },
                            }}
                        >
                            <Close sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                )}
            </Stack>
        </Box>

        <DialogContent
            sx={{
                p: { xs: 2, sm: 3 },
                background: '#F8FAFC',

                '&::-webkit-scrollbar': {
                    width: 6,
                },
                '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(10,61,98,0.20)',
                    borderRadius: 20,
                },
            }}
        >
            <Box
                sx={{
                    mb: 2.5,
                    p: { xs: 1.6, sm: 1.8 },
                    borderRadius: '12px',
                    display: 'flex',
                    gap: 1.4,
                    alignItems: 'flex-start',
                    background: 'rgba(72,201,176,0.08)',
                    border: '1px solid rgba(72,201,176,0.20)',
                }}
            >
                <VerifiedUserRounded
                    sx={{
                        color: '#159A80',
                        fontSize: 22,
                        mt: 0.1,
                        flexShrink: 0,
                    }}
                />

                <Box>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            color: colorPalette.deepNavy,
                            fontWeight: 850,
                            lineHeight: 1.3,
                        }}
                    >
                        Your privacy is protected
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            mt: 0.35,
                            color: 'rgba(15,23,42,0.65)',
                            lineHeight: 1.55,
                            fontSize: '0.79rem',
                        }}
                    >
                        Attendance data is collected only where necessary for authentication, attendance management and authorized organizational operations.
                    </Typography>
                </Box>
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, minmax(0, 1fr))',
                    },
                    gap: 1.5,
                }}
            >
                {DATA_PRIVACY_POINTS.map((item) => {
                    const Icon = item.icon;

                    return (
                        <Box
                            key={item.title}
                            sx={{
                                position: 'relative',
                                minWidth: 0,
                                p: { xs: 1.7, sm: 1.9 },
                                borderRadius: '12px',
                                border: '1px solid rgba(10,61,98,0.09)',
                                background: '#fff',
                                transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',

                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    borderColor: 'rgba(0,91,150,0.22)',
                                    boxShadow: '0 10px 28px rgba(10,61,98,0.08)',
                                },
                            }}
                        >
                            <Stack direction="row" alignItems="flex-start" spacing={1.3}>
                                <Box
                                    sx={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: '10px',
                                        flexShrink: 0,
                                        display: 'grid',
                                        placeItems: 'center',
                                        color: 'var(--kmfri-secondary, #005B96)',
                                        background: 'rgba(0,91,150,0.07)',
                                        border: '1px solid rgba(0,91,150,0.08)',
                                    }}
                                >
                                    <Icon sx={{ fontSize: 20 }} />
                                </Box>

                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            color: colorPalette.deepNavy,
                                            fontWeight: 850,
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {item.title}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            mt: 0.65,
                                            color: 'rgba(15,23,42,0.65)',
                                            fontSize: '0.79rem',
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {item.body}
                                    </Typography>

                                    <Box
                                        sx={{
                                            mt: 1.25,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            px: 0.9,
                                            py: 0.35,
                                            borderRadius: '6px',
                                            background: 'rgba(10,61,98,0.045)',
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                color: 'var(--kmfri-secondary, #005B96)',
                                                fontSize: '0.66rem',
                                                fontWeight: 800,
                                                letterSpacing: 0,
                                            }}
                                        >
                                            {item.label}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Stack>
                        </Box>
                    );
                })}
            </Box>

            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1.1}
                sx={{
                    mt: 2.5,
                    px: 1.5,
                    py: 1.25,
                    borderRadius: '10px',
                    border: '1px solid rgba(10,61,98,0.08)',
                    background: 'rgba(10,61,98,0.035)',
                }}
            >
                <LockRounded
                    sx={{
                        color: colorPalette.deepNavy,
                        fontSize: 17,
                        flexShrink: 0,
                    }}
                />

                <Typography
                    sx={{
                        color: 'rgba(15,23,42,0.62)',
                        fontSize: '0.73rem',
                        lineHeight: 1.5,
                    }}
                >
                    <Box component="span" sx={{ color: colorPalette.deepNavy, fontWeight: 800 }}>
                        Privacy by design.
                    </Box>{' '}
                    Location is used for attendance verification, device biometrics remain on your device, and organizational data is accessible only to authorized personnel.
                </Typography>
            </Stack>
        </DialogContent>

        {requireDecision && (
            <DialogActions
                sx={{
                    px: { xs: 2, sm: 3 },
                    py: { xs: 1.75, sm: 2 },
                    gap: 1,
                    flexWrap: 'wrap',
                    borderTop: '1px solid rgba(10,61,98,0.08)',
                    background: '#fff',
                }}
            >
                <Button
                    onClick={onReject}
                    disabled={accepting}
                    variant="outlined"
                    sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 800,
                        color: '#b91c1c',
                        borderColor: 'rgba(185,28,28,0.28)',
                        '&:hover': {
                            borderColor: '#b91c1c',
                            background: 'rgba(185,28,28,0.06)',
                        },
                    }}
                >
                    Reject
                </Button>

                <Button
                    onClick={onAccept}
                    disabled={accepting}
                    variant="contained"
                    sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 900,
                        px: 2.5,
                        background: 'var(--kmfri-gradient, linear-gradient(135deg, #005B96 0%, #0A3D62 100%))',
                        boxShadow: '0 8px 22px rgba(0,91,150,0.22)',
                    }}
                >
                    {accepting ? 'Accepting...' : 'Accept'}
                </Button>
            </DialogActions>
        )}
    </Dialog>
    );
};

export default DataPrivacyDialog;
