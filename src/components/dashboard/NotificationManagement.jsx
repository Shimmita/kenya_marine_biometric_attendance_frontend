// Notification Management Content
import { Close } from '@mui/icons-material';
import { Box, Button, Card, CardContent, Chip, Grid, IconButton, Stack, Typography } from '@mui/material';
import { colorPalette } from '../Dashboard';
export default function NotificationManagementContent() {
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
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Button variant="contained" sx={{ bgcolor: colorPalette.oceanBlue, borderRadius: 3, textTransform: 'none', fontWeight: 700 }}>All Notifications</Button>
                    <Button variant="outlined" sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}>Unread Only</Button>
                    <Button variant="outlined" sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}>Mark All Read</Button>
                </Stack>
            </Grid>

            <Grid item xs={12}>
                <Stack spacing={2}>
                    {notifications.map((notif) => (
                        <Card
                            key={notif.id}
                            elevation={0}
                            sx={{
                                borderRadius: 4,
                                border: `2px solid ${notif.read ? colorPalette.softGray : `${getNotificationColor(notif.type)}30`}`,
                                bgcolor: notif.read ? 'white' : `${getNotificationColor(notif.type)}05`,
                                transition: 'all 0.3s ease',
                                '&:hover': { transform: 'translateX(4px)' }
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="start">
                                    <Box sx={{ flex: 1 }}>
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                            <Typography variant="h6" fontWeight="800" color={colorPalette.deepNavy}>{notif.title}</Typography>
                                            {!notif.read && <Chip label="New" size="small" sx={{ bgcolor: getNotificationColor(notif.type), color: 'white', fontWeight: 700 }} />}
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{notif.message}</Typography>
                                        <Typography variant="caption" color="text.secondary">{notif.time}</Typography>
                                    </Box>
                                    <IconButton size="small" sx={{ color: colorPalette.charcoal }}>
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
};