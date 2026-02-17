// Notification Management Content
import { Close } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    IconButton,
    Stack,
    Typography,
    useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import coreDataDetails from '../CoreDataDetails';

const { colorPalette } = coreDataDetails;

export default function NotificationManagementContent() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const notifications = [
        { id: 1, title: 'Task Deadline Approaching', message: 'Marine biodiversity database update due tomorrow', time: '2 hours ago', type: 'warning', read: false },
        { id: 2, title: 'Leave Request Approved', message: 'Your annual leave from Mar 15-20 has been approved', time: '5 hours ago', type: 'success', read: false },
        { id: 3, title: 'New Task Assigned', message: 'Water quality analysis - Station B assigned to you', time: '1 day ago', type: 'info', read: true },
        { id: 4, title: 'Supervisor Feedback', message: 'Dr. Sarah Johnson left feedback on your coral reef project', time: '2 days ago', type: 'info', read: true }
    ];

    const getNotificationColor = (type) => {
        switch (type) {
            case 'success': return colorPalette.seafoamGreen;
            case 'warning': return colorPalette.warmSand;
            case 'error': return colorPalette.coralSunset;
            default: return colorPalette.cyanFresh;
        }
    };

    return (
        <Grid direction={'column'} container spacing={3}>
            {/* Top Buttons */}
            <Grid item xs={12}>
                <Stack
                    direction={isMobile ? 'column' : 'row'}
                    spacing={2}
                    sx={{ mb: 2 }}
                >
                    <Button
                        variant="contained"
                        fullWidth={isMobile}
                        sx={{
                            borderRadius: 3,
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 3,
                            background: `
                                linear-gradient(
                                    135deg,
                                    ${colorPalette.oceanBlue},
                                    ${colorPalette.cyanFresh}
                                )
                            `,
                            boxShadow: `0 8px 24px ${colorPalette.oceanBlue}40`,
                            backdropFilter: 'blur(10px)',
                            '&:hover': {
                                boxShadow: `0 12px 32px ${colorPalette.oceanBlue}60`,
                            }
                        }}
                    >
                        All Notifications
                    </Button>

                    <Button
                        variant="outlined"
                        fullWidth={isMobile}
                        sx={{
                            borderRadius: 3,
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 3,
                            background: 'rgba(255,255,255,0.55)',
                            backdropFilter: 'blur(16px)',
                            border: `1px solid ${colorPalette.cyanFresh}40`,
                            '&:hover': {
                                background: 'rgba(255,255,255,0.75)',
                            }
                        }}
                    >
                        Unread Only
                    </Button>

                    <Button
                        variant="outlined"
                        fullWidth={isMobile}
                        sx={{
                            borderRadius: 3,
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 3,
                            background: 'rgba(255,255,255,0.55)',
                            backdropFilter: 'blur(16px)',
                            border: `1px solid ${colorPalette.cyanFresh}40`,
                            '&:hover': {
                                background: 'rgba(255,255,255,0.75)',
                            }
                        }}
                    >
                        Mark All Read
                    </Button>
                </Stack>
            </Grid>

            {/* Notification Cards */}
            <Grid item xs={12}>
                <Stack spacing={2}>
                    {notifications.map((notif) => (
                        <Card
                            key={notif.id}
                            elevation={0}
                            sx={{
                                borderRadius: 4,
                                position: 'relative',
                                background: `
                                    linear-gradient(
                                        135deg,
                                        rgba(255,255,255,0.65),
                                        rgba(255,255,255,0.45)
                                    )
                                `,
                                backdropFilter: 'blur(22px)',
                                WebkitBackdropFilter: 'blur(22px)',
                                border: `1px solid ${
                                    notif.read
                                        ? 'rgba(10,61,98,0.08)'
                                        : `${getNotificationColor(notif.type)}40`
                                }`,
                                boxShadow: `
                                    0 12px 35px rgba(10,61,98,0.12),
                                    0 4px 18px ${getNotificationColor(notif.type)}20
                                `,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: isMobile
                                        ? 'none'
                                        : 'translateX(6px)',
                                    boxShadow: `
                                        0 18px 45px rgba(10,61,98,0.18),
                                        0 8px 24px ${getNotificationColor(notif.type)}30
                                    `
                                }
                            }}
                        >
                            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                                <Stack
                                    direction={isMobile ? 'column' : 'row'}
                                    justifyContent="space-between"
                                    alignItems={isMobile ? 'flex-start' : 'start'}
                                    spacing={isMobile ? 2 : 0}
                                >
                                    <Box sx={{ flex: 1 }}>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            flexWrap="wrap"
                                            sx={{ mb: 1 }}
                                        >
                                            <Typography
                                                variant="h6"
                                                fontWeight="800"
                                                color={colorPalette.deepNavy}
                                                sx={{
                                                    fontSize: isMobile ? '1rem' : '1.1rem'
                                                }}
                                            >
                                                {notif.title}
                                            </Typography>

                                            {!notif.read && (
                                                <Chip
                                                    label="New"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: getNotificationColor(notif.type),
                                                        color: 'white',
                                                        fontWeight: 700,
                                                        backdropFilter: 'blur(6px)',
                                                        boxShadow: `0 4px 12px ${getNotificationColor(notif.type)}40`
                                                    }}
                                                />
                                            )}
                                        </Stack>

                                        <Typography
                                            variant="body2"
                                            sx={{
                                                mb: 1,
                                                color: 'rgba(30,42,60,0.75)',
                                                lineHeight: 1.6
                                            }}
                                        >
                                            {notif.message}
                                        </Typography>

                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: 'rgba(30,42,60,0.55)'
                                            }}
                                        >
                                            {notif.time}
                                        </Typography>
                                    </Box>

                                    <IconButton
                                        size="small"
                                        sx={{
                                            color: colorPalette.charcoal,
                                            background: 'rgba(255,255,255,0.55)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(0,0,0,0.05)',
                                            '&:hover': {
                                                background: 'rgba(255,255,255,0.8)',
                                                transform: 'scale(1.05)'
                                            }
                                        }}
                                    >
                                        <Close fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            </Grid>
        </Grid>
    );
}
