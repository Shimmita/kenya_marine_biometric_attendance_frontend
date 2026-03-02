import { Box, Card, CardContent, CircularProgress, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { fetchDepartmentStats } from "../../../service/ClockingService";
const SupervisorDeptStats = ({ department }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await fetchDepartmentStats();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) return <CircularProgress />;
  if (!stats) return <Typography>No stats available for this department</Typography>;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        {stats.department} Department Stats
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">Total Staff</Typography>
              <Typography variant="h6">{stats.totalStaff}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">Total Hours</Typography>
              <Typography variant="h6">{stats.totalHours}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">Total Overtime</Typography>
              <Typography variant="h6">{stats.totalOvertime}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">Late Count</Typography>
              <Typography variant="h6">{stats.totalLateCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6">Employee Metrics</Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {stats.employeeMetrics.map(emp => (
            <Grid item xs={12} md={4} key={emp.email}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2">{emp.name} ({emp.email})</Typography>
                  <Typography>Station: {emp.station}</Typography>
                  <Typography>Hours: {emp.hours}</Typography>
                  <Typography>Overtime: {emp.overtime}</Typography>
                  <Typography>Late Count: {emp.lateCount}</Typography>
                  <Typography>Days Present: {emp.daysPresent}</Typography>
                  <Typography>Attendance: {emp.attendanceRate}</Typography>
                  <Typography>Productivity Score: {emp.productivityScore}</Typography>
                  <Typography>Burnout Level: {emp.burnoutLevel}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default SupervisorDeptStats;