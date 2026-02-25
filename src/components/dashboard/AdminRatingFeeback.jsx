import { Assessment, CheckCircle, TrendingUp, Warning } from '@mui/icons-material';
import {
  Box,
  Card, CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis
} from "recharts";
import { getFeedbackAnalytics } from "../../service/FeedbackService";

// YOUR CUSTOM PALETTE
const PALETTE = {
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
  oceanGradient: 'linear-gradient(135deg, #0A3D62 0%, #005B96 100%)',
  sunsetGradient: 'linear-gradient(135deg, #FF6F61 0%, #FFB400 100%)',
  freshGradient: 'linear-gradient(135deg, #00e5ff 0%, #48C9B0 100%)',
};

const PIE_COLORS = [PALETTE.coralSunset, PALETTE.warmSand, PALETTE.cyanFresh, PALETTE.seafoamGreen];

const AdminRatingFeedback = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await getFeedbackAnalytics();
      setData(res || {});
    } catch (err) {
      console.error("Analytics Error:", err);
      setData({});
    } finally {
      setLoading(false);
    }
  };



  if (loading) return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="60vh">
      <CircularProgress sx={{ color: PALETTE.oceanBlue }} />
      <Typography mt={2} color="textSecondary">Synthesizing Management Data...</Typography>
    </Box>
  );

  const summary = data?.summary || {};
  const distribution = Array.isArray(data?.distribution) ? data.distribution : [];

  const barData = [
    { name: "Ease", value: summary.avgEaseOfUse ?? 0 },
    { name: "Response", value: summary.avgResponsiveness ?? 0 },
    { name: "Speed", value: summary.avgSpeed ?? 0 },
    { name: "Clocking", value: summary.avgClocking ?? 0 },
    { name: "UI/UX", value: summary.avgUiDesign ?? 0 },
    { name: "Stability", value: summary.avgReliability ?? 0 },
  ].sort((a, b) => b.value - a.value); // Sorting to show high/low performers immediately

  const recommendations = [];
  if (summary.avgOverall < 7) recommendations.push({ text: "Urgent: User satisfaction is below target (70%). Investigation required.", level: 'high' });
  if ((summary.avgReliability ?? 0) < 3.5) recommendations.push({ text: "Stability Issues: Frequent disruptions reported. Technical audit advised.", level: 'high' });
  if ((summary.avgClocking ?? 0) < 4.0) recommendations.push({ text: "Operational Friction: Clocking mechanics are lagging behind UI scores.", level: 'mid' });

  // Data transformation for Radial
  const radialData = barData.map((item, index) => ({
    name: item.name,
    uv: (item.value / 5) * 100, // Percentage of "Perfect 5"
    fill: PIE_COLORS[index % PIE_COLORS.length],
  }));
  return (
    <Box p={isMobile ? 2 : 4} sx={{ backgroundColor: PALETTE.cloudWhite, minHeight: '100vh' }}>

      {/* HEADER SECTION */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ color: PALETTE.deepNavy }}>
            Executive Feedback Insights
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Real-time performance metrics and conclusives
          </Typography>
        </Box>
        <Chip icon={<Assessment />} label="2026 Q1 Analysis" sx={{ bgcolor: PALETTE.softGray }} />
      </Stack>

      {/* KPI CARDS */}
      <Grid container spacing={3} mb={5}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, background: PALETTE.oceanGradient, color: 'white', borderRadius: 4 }}>
            <Typography variant="overline" sx={{ opacity: 0.8 }}>Sample Size (N)</Typography>
            <Typography variant="h3" fontWeight={900}>{summary.totalResponses ?? 0}</Typography>
            <Typography variant="body2">Total Verified Feedbacks</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${PALETTE.softGray}`, borderRadius: 4 }}>
            <Typography variant="overline" color="textSecondary">USAT Score</Typography>
            <Typography variant="h3" fontWeight={900} sx={{ color: PALETTE.oceanBlue }}>
              {summary.avgOverall ? `${((summary.avgOverall / 10) * 100).toFixed(0)}%` : "N/A"}
            </Typography>
            <Typography variant="body2" color="textSecondary">Overall User Satisfaction</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, background: PALETTE.freshGradient, color: 'white', borderRadius: 4 }}>
            <Typography variant="overline" sx={{ opacity: 0.8 }}>System Health</Typography>
            <Typography variant="h3" fontWeight={900}>
              {summary.avgReliability > 4 ? "Optimal" : summary.avgReliability > 3 ? "Stable" : "Critical"}
            </Typography>
            <Typography variant="body2">Reliability Index</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* PIE CHART - SATISFACTION SEGMENTS */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>


            {/* STRATEGIC SENTIMENT PIE CHART */}
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', border: `1px solid ${PALETTE.softGray}` }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={800} sx={{ color: PALETTE.deepNavy }}>
                    User Engagement Health
                  </Typography>
                  <Typography variant="caption" color="textSecondary" display="block" mb={2}>
                    Strategic segmentation of the total user base coverage.
                  </Typography>

                  <Box sx={{ position: 'relative', height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: 'Critical / Churn Risk',
                              value: distribution.find(d => d._id === 0)?.count || 0,
                              color: PALETTE.coralSunset
                            },
                            {
                              name: 'Passive / Neutral',
                              value: distribution.find(d => d._id === 4)?.count || 0,
                              color: PALETTE.warmSand
                            },
                            {
                              name: 'Promoters / Growth',
                              value: (distribution.find(d => d._id === 7)?.count || 0) + (distribution.find(d => d._id === 9)?.count || 0),
                              color: PALETTE.seafoamGreen
                            }
                          ]}
                          dataKey="value"
                          innerRadius={75}
                          outerRadius={100}
                          paddingAngle={5}
                          stroke="none"
                        >
                          {/* Mapping custom colors directly */}
                          <Cell fill={PALETTE.coralSunset} />
                          <Cell fill={PALETTE.warmSand} />
                          <Cell fill={PALETTE.seafoamGreen} />
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                          formatter={(value) => [`${((value / summary.totalResponses) * 100).toFixed(1)}%`, 'Coverage']}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* CENTER LABEL: The "At-a-Glance" Metric */}
                    <Box sx={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)', textAlign: 'center'
                    }}>
                      <Typography variant="h4" fontWeight={900} sx={{ color: PALETTE.oceanBlue }}>
                        {summary.avgOverall ? `${((summary.avgOverall / 10) * 100).toFixed(0)}%` : "0%"}
                      </Typography>
                      <Typography variant="caption" fontWeight={700} color="textSecondary">USAT</Typography>
                    </Box>
                  </Box>

                  {/* STRATEGIC LEGEND & DEFINITIONS */}
                  <Box mt={3}>
                    <Stack spacing={2}>
                      {[
                        {
                          label: "Growth Drivers (8-10)",
                          color: PALETTE.seafoamGreen,
                          desc: "users are satsified and very comfortable with the system.",
                          id: [7, 9]
                        },
                        {
                          label: "Retention Risks (5-7)",
                          color: PALETTE.warmSand,
                          desc: "users are satisfied but prone to complaints about the system.",
                          id: [4]
                        },
                        {
                          label: "Critical Friction (0-4)",
                          color: PALETTE.coralSunset,
                          desc: "System under critical perfomance, immediate intervention",
                          id: [0]
                        }
                      ].map((item, idx) => {
                        const count = item.id.reduce((acc, curr) => acc + (distribution.find(d => d._id === curr)?.count || 0), 0);
                        const percent = ((count / summary.totalResponses) * 100).toFixed(0);

                        return (
                          <Box key={idx} display="flex" alignItems="flex-start" gap={2}>
                            <Box sx={{ minWidth: 50 }}>
                              <Typography variant="h6" fontWeight={900} sx={{ color: item.color, lineHeight: 1 }}>
                                {percent}%
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" fontWeight={800} sx={{ color: PALETTE.charcoal, textTransform: 'uppercase' }}>
                                {item.label}
                              </Typography>
                              <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem', lineHeight: 1.3 }}>
                                {item.desc}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

          </Card>
        </Grid>

        {/* BAR CHART - CATEGORY PERFORMANCE DRILLDOWN */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 4, height: '100%', border: `1px solid ${PALETTE.softGray}` }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography variant="h6" fontWeight={800} sx={{ color: PALETTE.deepNavy }}>
                    Operational Performance Index
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Comparative analysis of core system pillars (Target: 4.0+)
                  </Typography>
                </Box>
                <Chip
                  label="Benchmarks: 1-5"
                  size="small"
                  sx={{ bgcolor: PALETTE.deepNavy, color: 'white', fontWeight: 700 }}
                />
              </Box>

              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ left: 30, right: 30, top: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={PALETTE.softGray} />

                  {/* X-Axis now visible with custom ticks for management clarity */}
                  <XAxis
                    type="number"
                    domain={[0, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    axisLine={false}
                    tick={{ fill: PALETTE.charcoal, fontSize: 12, fontWeight: 700 }}
                  />

                  <YAxis
                    dataKey="name"
                    type="category"
                    width={90}
                    tick={{ fontSize: 11, fontWeight: 800, fill: PALETTE.deepNavy }}
                    axisLine={false}
                  />

                  <Tooltip
                    cursor={{ fill: 'rgba(0, 91, 150, 0.05)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />

                  <Bar
                    dataKey="value"
                    radius={[0, 10, 10, 0]}
                    barSize={24}
                  >
                    {barData.map((entry, index) => {
                      // DYNAMIC COLOR LOGIC BASED ON YOUR PALETTE
                      let barColor = PALETTE.seafoamGreen; // Default: High Performance
                      if (entry.value < 3.0) barColor = PALETTE.coralSunset; // Critical
                      else if (entry.value < 4.0) barColor = PALETTE.warmSand; // Warning

                      return <Cell key={`cell-${index}`} fill={barColor} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* STRATEGIC CAPTION */}
              <Box mt={1} p={2} sx={{ borderTop: `1px solid ${PALETTE.softGray}` }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 10, height: 10, bgcolor: PALETTE.seafoamGreen, borderRadius: '2px' }} />
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: PALETTE.charcoal }}>
                        OPTIMAL (4.0 - 5.0)
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                      Strengths to maintain and leverage in marketing.
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 10, height: 10, bgcolor: PALETTE.coralSunset, borderRadius: '2px' }} />
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: PALETTE.charcoal }}>
                        ACTION REQUIRED (&lt; 3.0)
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                      Systemic friction points causing user frustration.
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* STRATEGIC INSIGHTS SECTION */}
      <Box mt={5}>
        <Typography variant="h6" fontWeight={800} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp sx={{ color: PALETTE.marineBlue }} /> Executive Recommendations
        </Typography>
        <Grid container spacing={2}>
          {recommendations.length > 0 ? (
            recommendations.map((rec, i) => (
              <Grid item xs={12} key={i}>
                <Paper sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  borderLeft: `6px solid ${rec.level === 'high' ? PALETTE.coralSunset : PALETTE.warmSand}`,
                  bgcolor: 'white'
                }}>
                  {rec.level === 'high' ? <Warning color="error" /> : <CheckCircle sx={{ color: PALETTE.warmSand }} />}
                  <Typography variant="body1" fontWeight={500} color={PALETTE.charcoal}>{rec.text}</Typography>
                </Paper>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: PALETTE.seafoamGreen, color: 'white' }}>
                <Typography>✅ System operating at peak performance. No immediate interventions required.</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default AdminRatingFeedback;