// Analytics & Reports Content
import { Download } from '@mui/icons-material';
import { Box, Button, Card, CardContent, Chip, Grid, Paper, Stack, Typography } from '@mui/material';
import { colorPalette } from '../Dashboard';
export  default function AnalyticsReportsContent() {
    const reports = [
        { title: 'Monthly Attendance Summary', type: 'PDF', date: 'Feb 2024', size: '2.3 MB', color: colorPalette.oceanBlue },
        { title: 'Task Completion Report', type: 'XLSX', date: 'Jan 2024', size: '1.8 MB', color: colorPalette.seafoamGreen },
        { title: 'Performance Analytics', type: 'PDF', date: 'Jan 2024', size: '3.1 MB', color: colorPalette.warmSand },
        { title: 'Weekly Activity Log', type: 'CSV', date: 'Feb 2024', size: '0.5 MB', color: colorPalette.cyanFresh }
    ];

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ borderRadius: 4, background: colorPalette.freshGradient, color: 'white', p: 4, height: '100%' }}>
                    <Typography variant="h5" fontWeight="800" sx={{ mb: 2 }}>Performance Insights</Typography>
                    <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>Your productivity has increased by 18% this month compared to last month.</Typography>
                    <Stack spacing={2}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Attendance</Typography>
                            <Typography variant="body2" fontWeight="700">Excellent</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Task Completion</Typography>
                            <Typography variant="body2" fontWeight="700">Good</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Punctuality</Typography>
                            <Typography variant="body2" fontWeight="700">Excellent</Typography>
                        </Box>
                    </Stack>
                </Card>
            </Grid>

            <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${colorPalette.softGray}`, p: 4, height: '100%' }}>
                    <Typography variant="h6" fontWeight="800" color={colorPalette.deepNavy} sx={{ mb: 3 }}>Quick Stats</Typography>
                    <Grid container spacing={2}>
                        {[
                            { label: 'Total Tasks', value: '156', color: colorPalette.oceanBlue },
                            { label: 'Completed', value: '132', color: colorPalette.seafoamGreen },
                            { label: 'Working Days', value: '24', color: colorPalette.cyanFresh },
                            { label: 'Avg Hours/Day', value: '7.5', color: colorPalette.warmSand }
                        ].map((stat, idx) => (
                            <Grid item xs={6} key={idx}>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: `${stat.color}10`, borderRadius: 3 }}>
                                    <Typography variant="h4" fontWeight="900" color={stat.color}>{stat.value}</Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{stat.label}</Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Card>
            </Grid>

            <Grid item xs={12}>
                <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${colorPalette.softGray}` }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight="800" color={colorPalette.deepNavy} sx={{ mb: 3 }}>Available Reports</Typography>
                        <Grid container spacing={2}>
                            {reports.map((report, idx) => (
                                <Grid item xs={12} sm={6} md={3} key={idx}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 3,
                                            borderRadius: 4,
                                            border: `2px solid ${report.color}30`,
                                            bgcolor: `${report.color}05`,
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 24px ${report.color}40` }
                                        }}
                                    >
                                        <Chip label={report.type} size="small" sx={{ bgcolor: report.color, color: 'white', fontWeight: 700, mb: 2 }} />
                                        <Typography variant="body1" fontWeight="700" color={colorPalette.deepNavy} sx={{ mb: 1 }}>{report.title}</Typography>
                                        <Typography variant="caption" color="text.secondary">{report.date} • {report.size}</Typography>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            startIcon={<Download />}
                                            sx={{ mt: 2, borderRadius: 3, textTransform: 'none', fontWeight: 700, borderColor: report.color, color: report.color }}
                                        >
                                            Download
                                        </Button>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};