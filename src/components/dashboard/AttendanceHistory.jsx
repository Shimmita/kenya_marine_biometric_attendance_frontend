// Attendance History Content
import { Download, TrendingUp } from '@mui/icons-material';
import { Button, Card, CardContent, Chip, Grid, LinearProgress, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { colorPalette } from '../Dashboard';

export  default function AttendanceHistoryContent({ currentTime }) {
    const attendanceData = [
        { date: '2024-02-01', clockIn: '08:15 AM', clockOut: '05:30 PM', hours: 9.25, status: 'present' },
        { date: '2024-02-02', clockIn: '08:30 AM', clockOut: '05:45 PM', hours: 9.25, status: 'present' },
        { date: '2024-02-03', clockIn: '—', clockOut: '—', hours: 0, status: 'absent' },
        { date: '2024-02-04', clockIn: '08:00 AM', clockOut: 'Ongoing', hours: 0, status: 'present' },
    ];

    const monthlyStats = [
        { label: 'Days Present', value: 24, total: 26, percentage: 92 },
        { label: 'Total Hours', value: 168.5, total: 180, percentage: 94 },
        { label: 'Average Hours/Day', value: 7.5, total: 8, percentage: 94 }
    ];

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ borderRadius: 4, background: colorPalette.oceanGradient, color: 'white', p: 3 }}>
                    <Typography variant="h6" fontWeight="800" sx={{ mb: 1 }}>Monthly Attendance Rate</Typography>
                    <Typography variant="h1" fontWeight="900" sx={{ mb: 1 }}>92%</Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <TrendingUp />
                        <Typography variant="body2">+5% from last month</Typography>
                    </Stack>
                </Card>
            </Grid>
            {monthlyStats.map((stat, idx) => (
                <Grid item xs={12} md={4} key={idx}>
                    <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${colorPalette.softGray}`, p: 3 }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 1 }}>{stat.label}</Typography>
                        <Typography variant="h4" fontWeight="900" color={colorPalette.deepNavy}>{stat.value}</Typography>
                        <LinearProgress variant="determinate" value={stat.percentage} sx={{ mt: 2, height: 8, borderRadius: 4, bgcolor: colorPalette.softGray, '& .MuiLinearProgress-bar': { bgcolor: colorPalette.seafoamGreen, borderRadius: 4 } }} />
                    </Card>
                </Grid>
            ))}

            <Grid item xs={12}>
                <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${colorPalette.softGray}` }}>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                            <Typography variant="h6" fontWeight="800" color={colorPalette.deepNavy}>Attendance Records</Typography>
                            <Button variant="outlined" startIcon={<Download />} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}>Export CSV</Button>
                        </Stack>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Clock In</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Clock Out</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Hours</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {attendanceData.map((row, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{new Date(row.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</TableCell>
                                            <TableCell>{row.clockIn}</TableCell>
                                            <TableCell>{row.clockOut}</TableCell>
                                            <TableCell>{row.hours > 0 ? `${row.hours} hrs` : '—'}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={row.status}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: row.status === 'present' ? `${colorPalette.seafoamGreen}20` : `${colorPalette.coralSunset}20`,
                                                        color: row.status === 'present' ? colorPalette.seafoamGreen : colorPalette.coralSunset,
                                                        fontWeight: 600,
                                                        textTransform: 'capitalize'
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};
