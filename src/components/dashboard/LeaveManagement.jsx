// Leave Management Content
import { Button, Card, CardContent, Chip, Grid, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { colorPalette } from '../Dashboard';
export default function LeaveManagementContent({ currentTime }) {
    const leaveBalance = { annual: 15, sick: 7, casual: 3 };
    const leaveRequests = [
        { id: 1, type: 'Annual Leave', startDate: '2024-03-15', endDate: '2024-03-20', days: 5, status: 'pending', reason: 'Family vacation' },
        { id: 2, type: 'Sick Leave', startDate: '2024-02-10', endDate: '2024-02-11', days: 2, status: 'approved', reason: 'Medical checkup' },
        { id: 3, type: 'Casual Leave', startDate: '2024-01-28', endDate: '2024-01-28', days: 1, status: 'approved', reason: 'Personal matter' }
    ];

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ borderRadius: 4, background: colorPalette.oceanGradient, color: 'white', p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="800" sx={{ mb: 1 }}>Annual Leave Balance</Typography>
                    <Typography variant="h1" fontWeight="900">{leaveBalance.annual}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Days Remaining</Typography>
                </Card>
            </Grid>
            {[
                { label: 'Sick Leave', value: leaveBalance.sick, color: colorPalette.warmSand },
                { label: 'Casual Leave', value: leaveBalance.casual, color: colorPalette.cyanFresh }
            ].map((leave, idx) => (
                <Grid item xs={12} md={4} key={idx}>
                    <Card elevation={0} sx={{ borderRadius: 4, border: `2px solid ${leave.color}30`, bgcolor: `${leave.color}10`, p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight="800" color={leave.color} sx={{ mb: 1 }}>{leave.label}</Typography>
                        <Typography variant="h1" fontWeight="900" color={leave.color}>{leave.value}</Typography>
                        <Typography variant="body2" color="text.secondary">Days Remaining</Typography>
                    </Card>
                </Grid>
            ))}

            <Grid item xs={12}>
                <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${colorPalette.softGray}` }}>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                            <Typography variant="h6" fontWeight="800" color={colorPalette.deepNavy}>Leave Requests</Typography>
                            <Button variant="contained" sx={{ bgcolor: colorPalette.oceanBlue, borderRadius: 3, textTransform: 'none', fontWeight: 700 }}>Request Leave</Button>
                        </Stack>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Start Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>End Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Days</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {leaveRequests.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell><Typography fontWeight={600}>{req.type}</Typography></TableCell>
                                            <TableCell>{new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                                            <TableCell>{new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                                            <TableCell>{req.days} days</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={req.status}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: req.status === 'approved' ? `${colorPalette.seafoamGreen}20` : req.status === 'pending' ? `${colorPalette.warmSand}20` : `${colorPalette.coralSunset}20`,
                                                        color: req.status === 'approved' ? colorPalette.seafoamGreen : req.status === 'pending' ? colorPalette.warmSand : colorPalette.coralSunset,
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
