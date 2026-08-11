// src/pages/analytics/OrgDashboard.jsx
import {
    AccessTime,
    CheckCircle,
    CloudOff,
    Devices,
    Fingerprint,
    LockOpen,
    People,
    Settings,
    Storage,
    TrendingUp,
    Warning
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Chip,
    Grid,
    LinearProgress,
    MenuItem,
    Paper,
    Snackbar,
    Stack,
    Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    TextField,
    ToggleButton, ToggleButtonGroup,
    Typography
} from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis,
    ZAxis
} from 'recharts';

import {
    fetchAbsenteeismAnalytics,
    fetchAnalyticsKPIs,
    fetchAttendanceTrends,
    fetchBiometricAnalytics,
    fetchComplianceAnalytics,
    fetchDepartmentAnalytics,
    fetchEarlyDepartureAnalytics,
    fetchLateArrivalAnalytics,
    fetchStationAnalytics
} from '../../service/ClockingService';
import { AmbientOrbs, colorPalette, G, GlassTooltip, Reveal, StatCard } from './AttendanceHistory';

// ---------------------------------------------------------------------
// 1. FILTER BAR
// ---------------------------------------------------------------------
const FilterBar = ({ filters, setFilters, departments, stations }) => (
    <Box sx={{ ...G.card, p: 2, borderRadius: '16px', mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
                <TextField
                    label="Start Date"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                    sx={G.input}
                />
            </Grid>
            <Grid item xs={12} sm={3}>
                <TextField
                    label="End Date"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                    sx={G.input}
                />
            </Grid>
            <Grid item xs={12} sm={3}>
                <TextField
                    select
                    label="Department"
                    value={filters.department}
                    onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                    fullWidth
                    size="small"
                    sx={G.input}
                >
                    <MenuItem value="">All Departments</MenuItem>
                    {departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
                <TextField
                    select
                    label="Station"
                    value={filters.station}
                    onChange={(e) => setFilters(prev => ({ ...prev, station: e.target.value }))}
                    fullWidth
                    size="small"
                    sx={G.input}
                >
                    <MenuItem value="">All Stations</MenuItem>
                    {stations.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
            </Grid>
        </Grid>
    </Box>
);

// ---------------------------------------------------------------------
// 2. SECTION LABEL (with optional description)
// ---------------------------------------------------------------------
const SectionLabel = ({ children, accent, chip, description }) => (
    <Stack spacing={0.5} mb={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{ width: 4, height: 18, borderRadius: 2, bgcolor: accent }} />
            <Typography variant="subtitle1" fontWeight={800} color={colorPalette.deepNavy}>
                {children}
            </Typography>
            {chip && <Chip label={chip} size="small" sx={{ bgcolor: `${accent}14`, color: accent, fontWeight: 700, fontSize: '0.7rem', borderRadius: '8px' }} />}
        </Stack>
        {description && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                {description}
            </Typography>
        )}
    </Stack>
);

// ---------------------------------------------------------------------
// 3. TRENDS SECTION (Line chart)
// ---------------------------------------------------------------------
const TrendsSection = ({ data }) => {
    const [view, setView] = useState('daily');
    if (!data) return <LinearProgress />;

    const chartData = data[view] || [];
    const xKey = view === 'daily' ? 'date' : view === 'weekly' ? 'week' : view === 'monthly' ? 'month' : 'year';

    return (
        <Reveal>
            <Box sx={{ ...G.card, p: 2.5, borderRadius: '20px', mb: 3 }}>
                <SectionLabel
                    accent={colorPalette.cyanFresh}
                    chip="Trend"
                    description="Track how attendance rates evolve over time – daily, weekly, monthly, or yearly."
                >
                    Attendance Trends
                </SectionLabel>
                <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small" sx={{ mb: 1.5 }}>
                    <ToggleButton value="daily">Daily</ToggleButton>
                    <ToggleButton value="weekly">Weekly</ToggleButton>
                    <ToggleButton value="monthly">Monthly</ToggleButton>
                    <ToggleButton value="yearly">Yearly</ToggleButton>
                </ToggleButtonGroup>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" vertical={false} />
                        <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip content={<GlassTooltip />} />
                        <Line type="monotone" dataKey="attendance" stroke={colorPalette.oceanBlue} strokeWidth={3} dot={{ r: 4, fill: colorPalette.oceanBlue }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Reveal>
    );
};

// ---------------------------------------------------------------------
// 4. LATE ARRIVALS (bar + heatmap)
// ---------------------------------------------------------------------
const LateArrivalSection = ({ data }) => {
    if (!data) return null;
    const { lateByWeekday, lateByDepartment, heatmapData } = data;

    return (
        <Reveal>
            <Box sx={{ ...G.card, p: 2.5, borderRadius: '20px', mb: 3 }}>
                <SectionLabel
                    accent={colorPalette.coralSunset}
                    chip="Analytics"
                    description="Analyse late arrivals by weekday, department, and the arrival time heatmap."
                >
                    Late Arrivals
                </SectionLabel>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Stack spacing={1}>
                            <StatCard label="Employees Late Today" value={data.employeesLateToday} accent={colorPalette.coralSunset} icon={<Warning />} />
                            <StatCard label="Avg Lateness (min)" value={data.averageLatenessMinutes} accent={colorPalette.coralSunset} icon={<AccessTime />} />
                        </Stack>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">By Weekday</Typography>
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={lateByWeekday}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" />
                                <XAxis dataKey="weekday" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip content={<GlassTooltip />} />
                                <Bar dataKey="count" fill={colorPalette.coralSunset} radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">By Department</Typography>
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={lateByDepartment} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 10 }} />
                                <YAxis type="category" dataKey="department" tick={{ fontSize: 10 }} width={60} />
                                <Tooltip content={<GlassTooltip />} />
                                <Bar dataKey="count" fill={colorPalette.coralSunset} radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Grid>
                    {heatmapData && heatmapData.length > 0 && (
                        <Grid item xs={12}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary">Arrival Time Heatmap</Typography>
                            <ResponsiveContainer width="100%" height={180}>
                                <ScatterChart>
                                    <XAxis dataKey="hour" type="number" domain={[6, 12]} tick={{ fontSize: 10 }} />
                                    <YAxis dataKey="day" type="category" data={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']} tick={{ fontSize: 10 }} />
                                    <ZAxis dataKey="value" range={[0, 100]} />
                                    <Tooltip content={<GlassTooltip />} />
                                    <Scatter data={heatmapData} fill={colorPalette.coralSunset} />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </Reveal>
    );
};

// ---------------------------------------------------------------------
// 5. EARLY DEPARTURES
// ---------------------------------------------------------------------
const EarlyDepartureSection = ({ data }) => {
    if (!data) return null;
    return (
        <Reveal>
            <Box sx={{ ...G.card, p: 2.5, borderRadius: '20px', mb: 3 }}>
                <SectionLabel
                    accent="#f59e0b"
                    chip="Analytics"
                    description="Employees leaving before official closing time – track frequency and departments."
                >
                    Early Departures
                </SectionLabel>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <StatCard label="Employees Leaving Early" value={data.employeesLeavingEarly} accent="#f59e0b" icon={<Warning />} />
                        <StatCard label="Avg Early Departure (min)" value={data.averageEarlyDepartureMinutes} accent="#f59e0b" icon={<AccessTime />} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">Frequent Early Departures</Typography>
                        <TableContainer component={Paper} sx={{ mt: 1, background: 'transparent', boxShadow: 'none' }}>
                            <Table size="small">
                                <TableHead><TableRow><TableCell>Employee</TableCell><TableCell align="right">Count</TableCell></TableRow></TableHead>
                                <TableBody>
                                    {data.frequentEarlyDepartures.slice(0, 5).map((e, i) => (
                                        <TableRow key={i}><TableCell>{e.email}</TableCell><TableCell align="right">{e.count}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">By Department</Typography>
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={data.earlyByDepartment}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" />
                                <XAxis dataKey="department" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip content={<GlassTooltip />} />
                                <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Grid>
                </Grid>
            </Box>
        </Reveal>
    );
};

// ---------------------------------------------------------------------
// 6. ABSENTEEISM
// ---------------------------------------------------------------------
const AbsenteeismSection = ({ data }) => {
    if (!data) return null;
    return (
        <Reveal>
            <Box sx={{ ...G.card, p: 2.5, borderRadius: '20px', mb: 3 }}>
                <SectionLabel
                    accent="#ef4444"
                    chip="Analytics"
                    description="Average absenteeism rate, monthly trend, and breakdown by department."
                >
                    Absenteeism
                </SectionLabel>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <StatCard label="Average Absenteeism Rate" value={`${data.averageAbsenteeismRate}%`} accent="#ef4444" icon={<Warning />} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">Monthly Trend</Typography>
                        <ResponsiveContainer width="100%" height={150}>
                            <AreaChart data={data.monthlyAbsenteeism}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" />
                                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip content={<GlassTooltip />} />
                                <Area type="monotone" dataKey="rate" stroke="#ef4444" fill="#ef444422" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">By Department</Typography>
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={data.departmentAbsenteeism}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" />
                                <XAxis dataKey="department" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip content={<GlassTooltip />} />
                                <Bar dataKey="rate" fill="#ef4444" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Grid>
                </Grid>
            </Box>
        </Reveal>
    );
};

// ---------------------------------------------------------------------
// 7. DEPARTMENT COMPARISON (Radar)
// ---------------------------------------------------------------------
const DeptComparisonSection = ({ data }) => {
    if (!data || !data.departments) return null;
    return (
        <Reveal>
            <Box sx={{ ...G.card, p: 2.5, borderRadius: '20px', mb: 3 }}>
                <SectionLabel
                    accent={colorPalette.deepNavy}
                    chip="Compare"
                    description="Radar chart comparing departments on attendance, lateness, and absenteeism rates."
                >
                    Department Comparison
                </SectionLabel>
                <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={data.departments}>
                        <PolarGrid stroke="rgba(10,61,98,0.15)" />
                        <PolarAngleAxis dataKey="department" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar name="Attendance %" dataKey="attendanceRate" stroke={colorPalette.oceanBlue} fill={colorPalette.oceanBlue} fillOpacity={0.3} />
                        <Radar name="Lateness %" dataKey="latenessRate" stroke={colorPalette.coralSunset} fill={colorPalette.coralSunset} fillOpacity={0.3} />
                        <Radar name="Absenteeism %" dataKey="absenteeismRate" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                        <Tooltip content={<GlassTooltip />} />
                        <Legend />
                    </RadarChart>
                </ResponsiveContainer>
            </Box>
        </Reveal>
    );
};

// ---------------------------------------------------------------------
// 8. DEPARTMENT PERFORMANCE GROUPED BAR
// ---------------------------------------------------------------------
const DeptPerformanceBarSection = ({ deptData }) => {
    if (!deptData || !deptData.departments || deptData.departments.length === 0) return null;

    const data = deptData.departments.map(d => ({
        department: d.department,
        Attendance: d.attendanceRate || 0,
        Lateness: d.latenessRate || 0,
        Absenteeism: d.absenteeismRate || 0,
    }));

    return (
        <Reveal>
            <Box sx={{ ...G.card, p: 2.5, borderRadius: '20px', mb: 3 }}>
                <SectionLabel
                    accent={colorPalette.deepNavy}
                    chip="Compare"
                    description="Side‑by‑side bar comparison of departments on key performance indicators."
                >
                    Department Performance (Grouped Bar)
                </SectionLabel>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" />
                        <XAxis dataKey="department" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                        <Tooltip content={<GlassTooltip />} />
                        <Legend />
                        <Bar dataKey="Attendance" fill={colorPalette.oceanBlue} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Lateness" fill={colorPalette.coralSunset} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Absenteeism" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Reveal>
    );
};

// ---------------------------------------------------------------------
// 9. ATTENDANCE HISTOGRAM (departments)
// ---------------------------------------------------------------------
const AttendanceHistogramSection = ({ deptData }) => {
    if (!deptData || !deptData.departments || deptData.departments.length === 0) return null;

    const bins = { '0-20': 0, '20-40': 0, '40-60': 0, '60-80': 0, '80-100': 0 };
    deptData.departments.forEach(d => {
        const rate = d.attendanceRate || 0;
        if (rate < 20) bins['0-20']++;
        else if (rate < 40) bins['20-40']++;
        else if (rate < 60) bins['40-60']++;
        else if (rate < 80) bins['60-80']++;
        else bins['80-100']++;
    });

    const histData = Object.keys(bins).map(key => ({ range: key, count: bins[key] }));

    return (
        <Reveal>
            <Box sx={{ ...G.card, p: 2.5, borderRadius: '20px', mb: 3 }}>
                <SectionLabel
                    accent="#6366f1"
                    chip="Distribution"
                    description="Distribution of departments across attendance rate ranges – helps spot overall performance spread."
                >
                    Attendance Rate Histogram
                </SectionLabel>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={histData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" />
                        <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip content={<GlassTooltip />} />
                        <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Reveal>
    );
};

// ---------------------------------------------------------------------
// 10. PRODUCTIVITY TREND (using daily attendance)
// ---------------------------------------------------------------------
const ProductivityTrendSection = ({ trends }) => {
    if (!trends || !trends.daily) return null;
    const data = trends.daily.slice(-30);
    return (
        <Reveal>
            <Box sx={{ ...G.card, p: 2.5, borderRadius: '20px', mb: 3 }}>
                <SectionLabel
                    accent="#22c55e"
                    chip="Trend"
                    description="Daily attendance rate as a proxy for productivity – shows recent performance trend."
                >
                    Productivity Index (Proxy)
                </SectionLabel>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                        <Tooltip content={<GlassTooltip />} />
                        <Area type="monotone" dataKey="attendance" stroke="#22c55e" fill="#22c55e22" />
                    </AreaChart>
                </ResponsiveContainer>
            </Box>
        </Reveal>
    );
};

// ---------------------------------------------------------------------
// 11. COMPLIANCE (table + pie)
// ---------------------------------------------------------------------
const ComplianceSection = ({ data }) => {
    if (!data) return null;
    return (
        <Reveal>
            <Box sx={{ ...G.card, p: 2.5, borderRadius: '20px', mb: 3 }}>
                <SectionLabel
                    accent="#8b5cf6"
                    chip="Monitoring"
                    description="List of employees with missing clock‑ins or clock‑outs – essential for payroll and discipline."
                >
                    Compliance Monitoring
                </SectionLabel>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary">Missing Clock‑Ins</Typography>
                        <TableContainer component={Paper} sx={{ mt: 1, background: 'transparent', boxShadow: 'none' }}>
                            <Table size="small">
                                <TableHead><TableRow><TableCell>Employee</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
                                <TableBody>
                                    {data.missingClockIns.slice(0, 5).map((e, i) => (
                                        <TableRow key={i}><TableCell>{e.email}</TableCell><TableCell>{e.date}</TableCell></TableRow>
                                    ))}
                                    {data.missingClockIns.length === 0 && <TableRow><TableCell colSpan={2} align="center">All clear</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary">Missing Clock‑Outs</Typography>
                        <TableContainer component={Paper} sx={{ mt: 1, background: 'transparent', boxShadow: 'none' }}>
                            <Table size="small">
                                <TableHead><TableRow><TableCell>Employee</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
                                <TableBody>
                                    {data.missingClockOuts.slice(0, 5).map((e, i) => (
                                        <TableRow key={i}><TableCell>{e.email}</TableCell><TableCell>{e.date}</TableCell></TableRow>
                                    ))}
                                    {data.missingClockOuts.length === 0 && <TableRow><TableCell colSpan={2} align="center">All clear</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                </Grid>
            </Box>
        </Reveal>
    );
};

const CompliancePieSection = ({ data }) => {
    if (!data) return null;
    const pieData = [
        { name: 'Missing Clock-Ins', value: data.totalMissingClockIns || 0 },
        { name: 'Missing Clock-Outs', value: data.totalMissingClockOuts || 0 },
    ];
    if (pieData[0].value === 0 && pieData[1].value === 0) return null;
    const COLORS = ['#ef4444', '#f59e0b'];

    return (
        <Reveal>
            <Box sx={{ ...G.card, p: 2.5, borderRadius: '20px', mb: 3 }}>
                <SectionLabel
                    accent="#8b5cf6"
                    chip="Overview"
                    description="Pie chart summarising total compliance gaps – clock‑ins vs clock‑outs."
                >
                    Compliance Overview
                </SectionLabel>
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label>
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<GlassTooltip />} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Box>
        </Reveal>
    );
};

// ---------------------------------------------------------------------
// 12. STATION COMPARISON (Radar)
// ---------------------------------------------------------------------
const StationComparisonRadarSection = ({ stationData }) => {
    if (!stationData || !stationData.stations || stationData.stations.length === 0) return null;

    return (
        <Reveal>
            <Box sx={{ ...G.card, p: 2.5, borderRadius: '20px', mb: 3 }}>
                <SectionLabel
                    accent="#0ea5e9"
                    chip="Stations"
                    description="Radar chart comparing stations on attendance, lateness, and absenteeism rates."
                >
                    Station Comparison (Radar)
                </SectionLabel>
                <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={stationData.stations}>
                        <PolarGrid stroke="rgba(10,61,98,0.15)" />
                        <PolarAngleAxis dataKey="station" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar name="Attendance %" dataKey="attendanceRate" stroke={colorPalette.oceanBlue} fill={colorPalette.oceanBlue} fillOpacity={0.3} />
                        <Radar name="Lateness %" dataKey="latenessRate" stroke={colorPalette.coralSunset} fill={colorPalette.coralSunset} fillOpacity={0.3} />
                        <Radar name="Absenteeism %" dataKey="absenteeismRate" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                        <Tooltip content={<GlassTooltip />} />
                        <Legend />
                    </RadarChart>
                </ResponsiveContainer>
            </Box>
        </Reveal>
    );
};

// ---------------------------------------------------------------------
// 13. STATION PERFORMANCE GROUPED BAR
// ---------------------------------------------------------------------
const StationPerformanceBarSection = ({ stationData }) => {
    if (!stationData || !stationData.stations || stationData.stations.length === 0) return null;

    const data = stationData.stations.map(s => ({
        station: s.station,
        Attendance: s.attendanceRate || 0,
        Lateness: s.latenessRate || 0,
        Absenteeism: s.absenteeismRate || 0,
        StaffCount: s.staffCount || 0,
    }));

    return (
        <Reveal>
            <Box sx={{ ...G.card, p: 2.5, borderRadius: '20px', mb: 3 }}>
                <SectionLabel
                    accent="#0ea5e9"
                    chip="Stations"
                    description="Grouped bar chart comparing station performance across attendance, lateness, and absenteeism."
                >
                    Station Performance (Grouped Bar)
                </SectionLabel>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" />
                        <XAxis dataKey="station" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                        <Tooltip content={<GlassTooltip />} />
                        <Legend />
                        <Bar dataKey="Attendance" fill={colorPalette.oceanBlue} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Lateness" fill={colorPalette.coralSunset} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Absenteeism" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Reveal>
    );
};

// ---------------------------------------------------------------------
// 14. STATION ATTENDANCE HISTOGRAM
// ---------------------------------------------------------------------
const StationHistogramSection = ({ stationData }) => {
    if (!stationData || !stationData.stations || stationData.stations.length === 0) return null;

    const bins = { '0-20': 0, '20-40': 0, '40-60': 0, '60-80': 0, '80-100': 0 };
    stationData.stations.forEach(s => {
        const rate = s.attendanceRate || 0;
        if (rate < 20) bins['0-20']++;
        else if (rate < 40) bins['20-40']++;
        else if (rate < 60) bins['40-60']++;
        else if (rate < 80) bins['60-80']++;
        else bins['80-100']++;
    });

    const histData = Object.keys(bins).map(key => ({ range: key, count: bins[key] }));

    return (
        <Reveal>
            <Box sx={{ ...G.card, p: 2.5, borderRadius: '20px', mb: 3 }}>
                <SectionLabel
                    accent="#6366f1"
                    chip="Distribution"
                    description="Histogram showing how many stations fall into each attendance rate bucket."
                >
                    Station Attendance Histogram
                </SectionLabel>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={histData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,98,0.06)" />
                        <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip content={<GlassTooltip />} />
                        <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Reveal>
    );
};

// ---------------------------------------------------------------------
// 15. BIOMETRIC SECTION (with Pie charts)
// ---------------------------------------------------------------------
const BiometricSection = ({ data }) => {
    if (!data) return null;

    const osData = data.osDistribution || [];
    const browserData = data.browserDistribution || [];
    const osPieData = osData.map(item => ({ name: item._id || 'Unknown', value: item.count }));
    const browserPieData = browserData.map(item => ({ name: item._id || 'Unknown', value: item.count }));
    const COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

    return (
        <Reveal>
            <Box sx={{ ...G.card, p: 2.5, borderRadius: '20px', mb: 3 }}>
                <SectionLabel
                    accent="#3b82f6"
                    chip="Admin"
                    description="Biometric enrolment, device health, and OS/browser distribution for IT monitoring."
                >
                    Biometric & Device Analytics
                </SectionLabel>

                <Grid container spacing={2}>
                    {/* Biometric enrolment cards */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
                            Biometric Enrolment
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard label="Users Enrolled" value={data.usersWithBiometric} icon={<Fingerprint />} accent="#3b82f6" />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard label="Authenticators" value={data.totalAuthenticators} icon={<LockOpen />} accent="#8b5cf6" />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard label="Successful Verifications" value={data.totalSuccessfulVerifications} icon={<CheckCircle />} accent="#22c55e" />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard label="Enrolment Rate" value={`${data.enrolmentRate}%`} icon={<TrendingUp />} accent="#f59e0b" />
                    </Grid>

                    {/* Device health cards */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                            Device Health
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard label="Total Devices" value={data.totalDevices} icon={<Devices />} accent="#0a3d62" />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard label="Active (7d)" value={data.activeDevices} icon={<CheckCircle />} accent="#22c55e" />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard label="Inactive" value={data.inactiveDevices} icon={<CloudOff />} accent="#ef4444" />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard label="Uptime" value={`${data.deviceUptime}%`} icon={<Storage />} accent="#3b82f6" />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard label="Avg Offline (min)" value={data.deviceOfflineDuration} icon={<AccessTime />} accent="#f59e0b" />
                    </Grid>

                    {/* Device status cards */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                            Device Status
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard label="Lost Devices" value={data.lostDevices} icon={<Warning />} accent="#ef4444" />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard label="Users with Lost Device" value={data.usersWithLostDevice} icon={<People />} accent="#f59e0b" />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard label="Primary Devices" value={data.primaryDevices} icon={<Settings />} accent="#3b82f6" />
                    </Grid>

                    {/* OS & Browser Distribution – Pie charts */}
                    {(osPieData.length > 0 || browserPieData.length > 0) && (
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                                OS / Browser Distribution
                            </Typography>
                            <Grid container spacing={2}>
                                {osPieData.length > 0 && (
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" display="block" color="text.secondary">Operating Systems</Typography>
                                        <ResponsiveContainer width="100%" height={150}>
                                            <PieChart>
                                                <Pie data={osPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={60} label>
                                                    {osPieData.map((entry, index) => (
                                                        <Cell key={`os-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<GlassTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Grid>
                                )}
                                {browserPieData.length > 0 && (
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" display="block" color="text.secondary">Browsers</Typography>
                                        <ResponsiveContainer width="100%" height={150}>
                                            <PieChart>
                                                <Pie data={browserPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={60} label>
                                                    {browserPieData.map((entry, index) => (
                                                        <Cell key={`browser-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<GlassTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Grid>
                                )}
                            </Grid>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </Reveal>
    );
};

// ---------------------------------------------------------------------
// 16. MAIN ORGDASHBOARD – charts only (no HeroBanner / KpiSection)
// ---------------------------------------------------------------------
export default function OrgDashboard({ user }) {
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        department: '',
        station: '',
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Data states
    const [kpis, setKpis] = useState(null);
    const [trends, setTrends] = useState(null);
    const [late, setLate] = useState(null);
    const [early, setEarly] = useState(null);
    const [absenteeism, setAbsenteeism] = useState(null);
    const [deptComp, setDeptComp] = useState(null);
    const [stationComp, setStationComp] = useState(null);
    const [compliance, setCompliance] = useState(null);
    const [biometric, setBiometric] = useState(null);

    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    const departments = kpis?.departments || [];
    const stations = kpis?.stations || [];

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = {
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    department: filters.department,
                    station: filters.station,
                };

                const promises = [
                    fetchAnalyticsKPIs(params).then(data => { setKpis(data); return data; }),
                    fetchAttendanceTrends(params).then(data => { setTrends(data); return data; }),
                    fetchLateArrivalAnalytics(params).then(data => { setLate(data); return data; }),
                    fetchEarlyDepartureAnalytics(params).then(data => { setEarly(data); return data; }),
                    fetchAbsenteeismAnalytics(params).then(data => { setAbsenteeism(data); return data; }),
                    fetchDepartmentAnalytics(params).then(data => { setDeptComp(data); return data; }),
                    fetchStationAnalytics(params).then(data => { setStationComp(data); return data; }),
                    fetchComplianceAnalytics(params).then(data => { setCompliance(data); return data; }),
                ];

                if (user?.rank === 'admin') {
                    promises.push(
                        fetchBiometricAnalytics(params).then(data => { setBiometric(data); return data; })
                    );
                } else {
                    setBiometric(null);
                }

                await Promise.all(promises);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError(err.message || 'Failed to load data');
                setSnack({ open: true, message: err.message || 'Failed to load analytics data', severity: 'error' });
                setLoading(false);
            }
        };

        fetchAllData();
    }, [filters, user]);

    if (error && !loading) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error">Failed to load analytics: {error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ position: 'relative', px: { xs: 2, md: 4 }, py: 3, maxWidth: '1600px', mx: 'auto' }}>
            <AmbientOrbs />

            <Snackbar
                open={snack.open}
                autoHideDuration={5000}
                onClose={() => setSnack(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity={snack.severity} variant="filled" elevation={6}>
                    {snack.message}
                </Alert>
            </Snackbar>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <FilterBar filters={filters} setFilters={setFilters} departments={departments} stations={stations} />
            </motion.div>

            {/* ---- Charts only (HeroBanner and KpiSection removed) ---- */}

            <TrendsSection data={trends} />
            <LateArrivalSection data={late} />
            <EarlyDepartureSection data={early} />
            <AbsenteeismSection data={absenteeism} />

            {/* Department comparisons */}
            <DeptComparisonSection data={deptComp} />
            <DeptPerformanceBarSection deptData={deptComp} />
            <AttendanceHistogramSection deptData={deptComp} />

            {/* Station comparisons */}
            <StationComparisonRadarSection stationData={stationComp} />
            <StationPerformanceBarSection stationData={stationComp} />
            <StationHistogramSection stationData={stationComp} />

            <ProductivityTrendSection trends={trends} />

            <ComplianceSection data={compliance} />
            <CompliancePieSection data={compliance} />

            {user?.rank === 'admin' && <BiometricSection data={biometric} />}
        </Box>
    );
}