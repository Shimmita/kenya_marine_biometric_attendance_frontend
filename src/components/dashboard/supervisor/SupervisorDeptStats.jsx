import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  MenuItem,
  Tooltip as MuiTooltip,
} from "@mui/material";
import { useEffect, useState, useMemo } from "react";
import { fetchDepartmentStats } from "../../../service/ClockingService";
import coreDataDetails from "../../CoreDataDetails";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";
import { Download, TrendingUp, WarningAmber, CheckCircle } from "@mui/icons-material";

const { colorPalette } = coreDataDetails;

/* ──────────────────────────────────────────────
   DESIGN TOKENS (App Consistent)
────────────────────────────────────────────── */
const T = {
  deepNavy:    colorPalette.deepNavy,
  oceanBlue:   colorPalette.oceanBlue,
  aqua:        colorPalette.cyanFresh,
  coralSunset: colorPalette.coralSunset,
  seafoamGreen: colorPalette.seafoamGreen,
  warmSand:    colorPalette.warmSand,
  softGray:    colorPalette.softGray,
  cloudWhite:  colorPalette.cloudWhite,
  charcoal:    colorPalette.charcoal,
  white:       "#FFFFFF",
};

const PIE_COLORS = [T.seafoamGreen, T.warmSand, T.coralSunset];

/* ──────────────────────────────────────────────
   CUSTOM TOOLTIP
────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        background: T.deepNavy,
        border: `1px solid ${T.aqua}`,
        borderRadius: "8px",
        px: 2,
        py: 1.2,
        boxShadow: `0 8px 24px rgba(10,61,98,0.3)`,
        minWidth: 120,
      }}
    >
      <Typography sx={{ color: T.aqua, fontWeight: 700, fontSize: 12, mb: 0.5 }}>
        {label}
      </Typography>
      {payload.map((p) => (
        <Typography key={p.name} sx={{ color: T.white, fontSize: 12 }}>
          <span style={{ color: p.fill || p.stroke, fontWeight: 700 }}>{p.name}: </span>
          {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
        </Typography>
      ))}
    </Box>
  );
};

/* ──────────────────────────────────────────────
   KPI CARD
────────────────────────────────────────────── */
const KpiCard = ({ label, value, icon, accent, subtext }) => (
  <Card
    elevation={0}
    sx={{
      background: T.white,
      border: `1px solid ${T.softGray}`,
      borderRadius: "12px",
      overflow: "hidden",
      transition: "all .2s ease",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: `0 8px 24px rgba(0,91,150,0.12)`,
      },
      "&::before": {
        content: '""',
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 2.5,
        background: accent,
      },
      position: "relative",
    }}
  >
    <CardContent sx={{ p: "16px 18px" }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              color: T.charcoal,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              mb: 0.8,
              opacity: 0.7,
            }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: 28,
              color: T.deepNavy,
              lineHeight: 1,
            }}
          >
            {value}
          </Typography>
          {subtext && (
            <Typography sx={{ fontSize: 11, color: T.charcoal, opacity: 0.6, mt: 0.5 }}>
              {subtext}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: "10px",
            background: `${accent}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

/* ──────────────────────────────────────────────
   CHART WRAPPER CARD
────────────────────────────────────────────── */
const ChartCard = ({ title, icon, children, sx = {} }) => (
  <Card
    elevation={0}
    sx={{
      background: T.white,
      border: `1px solid ${T.softGray}`,
      borderRadius: "14px",
      ...sx,
    }}
  >
    <Box sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
      <Box display="flex" alignItems="center" gap={1}>
        <Typography sx={{ fontSize: 18 }}>{icon}</Typography>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 15,
            color: T.deepNavy,
          }}
        >
          {title}
        </Typography>
      </Box>
    </Box>
    <Box sx={{ px: 3, pb: 2.5 }}>
      {children}
    </Box>
  </Card>
);

/* ──────────────────────────────────────────────
   STATUS BADGE
────────────────────────────────────────────── */
const StatusBadge = ({ level }) => {
  const burnoutMap = {
    Low:      { bg: "#E8F7F1", color: "#1C7A56", label: "✓ Low" },
    Moderate: { bg: "#FFF4E0", color: "#9A6B00", label: "⚠ Moderate" },
    High:     { bg: "#FDECEA", color: "#B52A1C", label: "🔴 High" },
  };
  const s = burnoutMap[level] || burnoutMap["Low"];
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{
        background: s.bg,
        color: s.color,
        fontWeight: 700,
        fontSize: 11,
        height: 22,
      }}
    />
  );
};

/* ──────────────────────────────────────────────
   INSIGHT CARD
────────────────────────────────────────────── */
const InsightCard = ({ title, value, trend, icon: Icon, color }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: "12px",
      border: `1px solid ${T.softGray}`,
      background: T.white,
    }}
  >
    <Box display="flex" gap={1.5} alignItems="flex-start">
      <Box
        sx={{
          p: 1,
          borderRadius: "8px",
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon sx={{ color, fontSize: 20 }} />
      </Box>
      <Box flex={1}>
        <Typography sx={{ fontSize: 12, color: T.charcoal, opacity: 0.7, mb: 0.3 }}>
          {title}
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: 18, color: T.deepNavy }}>
          {value}
        </Typography>
        {trend && (
          <Typography sx={{ fontSize: 11, color: trend.color, fontWeight: 700, mt: 0.4 }}>
            {trend.label}
          </Typography>
        )}
      </Box>
    </Box>
  </Paper>
);

/* ──────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────── */
const SupervisorDeptStats = () => {
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("score");

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

  /* ── Derived data ── */
  const employees = useMemo(() => stats?.employeeMetrics || [], [stats?.employeeMetrics]);
  const topPerformers = useMemo(() => stats?.topPerformers || [], [stats?.topPerformers]);
  const dailyTrend = useMemo(() => stats?.dailyTrend || [], [stats?.dailyTrend]);
  const stationSummary = useMemo(() => stats?.stationSummary || [], [stats?.stationSummary]);

  const sortedEmployees = useMemo(() => {
    let sorted = [...employees];
    
    if (searchTerm) {
      sorted = sorted.filter(e =>
        (e.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.station || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (sortBy === "score") {
      sorted.sort((a, b) => b.productivityScore - a.productivityScore);
    } else if (sortBy === "hours") {
      sorted.sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours));
    } else if (sortBy === "late") {
      sorted.sort((a, b) => b.lateCount - a.lateCount);
    } else if (sortBy === "outside") {
      sorted.sort((a, b) => (b.outsideClockingCount || 0) - (a.outsideClockingCount || 0));
    } else if (sortBy === "open") {
      sorted.sort((a, b) => (b.openSessions || 0) - (a.openSessions || 0));
    }
    
    return sorted;
  }, [employees, searchTerm, sortBy]);

  // Chart data
  const chartDataTop10 = employees.slice(0, 10).map((e) => ({
    name: (e.name || "Unknown").split(" ")[0],
    Score: Number(parseFloat(e.productivityScore || 0).toFixed(1)),
    Hours: parseFloat(e.hours),
    Overtime: parseFloat(e.overtime),
  }));

  const burnoutData = {
    Low: employees.filter((e) => e.burnoutLevel === "Low").length,
    Moderate: employees.filter((e) => e.burnoutLevel === "Moderate").length,
    High: employees.filter((e) => e.burnoutLevel === "High").length,
  };

  const pieBurnoutData = [
    { name: "Low", value: burnoutData.Low, fill: T.seafoamGreen },
    { name: "Moderate", value: burnoutData.Moderate, fill: T.warmSand },
    { name: "High", value: burnoutData.High, fill: T.coralSunset },
  ].filter(item => item.value > 0);

  const attendanceData = employees.map((e) => ({
    name: (e.name || "Unknown").split(" ")[0],
    Attendance: parseFloat(e.attendanceRate),
  }));

  const lateData = employees.map((e) => ({
    name: (e.name || "Unknown").split(" ")[0],
    Late: e.lateCount,
  }));

  const stationChartData = stationSummary.map((item) => ({
    name: item.station,
    Staff: item.staff,
    Hours: item.hours,
    Late: item.lateCount,
    Outside: item.outsideClockingCount,
  }));

  const outsideClockingData = employees
    .filter((e) => e.outsideClockingCount > 0 || e.canClockOutside)
    .map((e) => ({
      name: (e.name || "Unknown").split(" ")[0],
      Outside: e.outsideClockingCount || 0,
      Authorized: e.canClockOutside ? 1 : 0,
    }));

  // Metrics
  const employeeCount = employees.length || 1;
  const avgScore = employees.length
    ? (
      employees.reduce((s, e) => s + parseFloat(e.productivityScore || 0), 0) /
      employeeCount
    ).toFixed(1)
    : "0.0";

  const avgAttendance = employees.length
    ? (
      employees.reduce((s, e) => s + parseFloat(e.attendanceRate || 0), 0) /
      employeeCount
    ).toFixed(1)
    : "0.0";

  const highBurnout = burnoutData.High;
  const moderateBurnout = burnoutData.Moderate;
  const activeCoverage = stats?.totalStaff
    ? (((stats.activeStaffThisMonth || 0) / stats.totalStaff) * 100).toFixed(1)
    : "0.0";
  const outsideUsageRate = stats?.totalStaff
    ? (((stats.outsideClockingStaffCount || 0) / stats.totalStaff) * 100).toFixed(1)
    : "0.0";

  if (loading)
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight={400}
        gap={2}
      >
        <CircularProgress sx={{ color: T.oceanBlue }} />
        <Typography sx={{ color: T.charcoal, fontSize: 14, opacity: 0.7 }}>
          Loading department analytics…
        </Typography>
      </Box>
    );

  if (!stats)
    return (
      <Box textAlign="center" mt={6}>
        <Typography sx={{ color: T.charcoal, opacity: 0.7 }}>
          No department data available.
        </Typography>
      </Box>
    );

  /* ── PDF Export ── */
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { default: jsPDF }     = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape" });
      const pw  = doc.internal.pageSize.getWidth();
      const ph  = doc.internal.pageSize.getHeight();

      // ── Header band ──
      doc.setFillColor(10, 61, 98);
      doc.rect(0, 0, pw, 32, "F");

      doc.setFillColor(54, 141, 197);
      doc.rect(0, 32, pw, 2, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Kenya Marine and Fisheries Research Institute", pw / 2, 11, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(180, 220, 240);
      doc.text(`${stats.department} Department — Performance Report`, pw / 2, 19, { align: "center" });
      doc.text(`Generated: ${new Date().toLocaleDateString("en-KE", { dateStyle: "long" })}`, pw / 2, 26, { align: "center" });

      // ── KPI Row ──
      const kpis = [
        ["Staff", stats.totalStaff],
        ["Hours", stats.totalHours],
        ["OT Hrs", stats.totalOvertime],
        ["Late", stats.totalLateCount],
        ["Avg Score", avgScore],
        ["Burnout High", highBurnout],
      ];

      const boxW = (pw - 30) / kpis.length;
      kpis.forEach(([lbl, val], i) => {
        const x = 15 + i * boxW;
        doc.setFillColor(232, 238, 247);
        doc.roundedRect(x, 40, boxW - 4, 18, 1.5, 1.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(10, 61, 98);
        doc.text(String(val), x + (boxW - 4) / 2, 48, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100, 120, 140);
        doc.text(lbl, x + (boxW - 4) / 2, 56, { align: "center" });
      });

      // ── Employee Table ──
      autoTable(doc, {
        startY: 62,
        head: [["#", "Name", "Station", "Hours", "OT", "Att%", "Score", "Late", "Outside", "Open", "Risk"]],
        body: sortedEmployees.slice(0, 50).map((e, i) => [
          i + 1,
          e.name,
          e.station,
          e.hours,
          e.overtime,
          e.attendanceRate,
          parseFloat(e.productivityScore).toFixed(1),
          e.lateCount,
          e.outsideClockingCount || 0,
          e.openSessions || 0,
          e.burnoutLevel,
        ]),
        headStyles: {
          fillColor: [10, 61, 98],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        bodyStyles:  { fontSize: 8, textColor: [40, 60, 80] },
        alternateRowStyles: { fillColor: [240, 245, 252] },
        didParseCell(data) {
          if (data.column.index === 10 && data.section === "body") {
            const v = data.cell.raw;
            if (v === "High")     data.cell.styles.textColor = [181, 42, 28];
            if (v === "Moderate") data.cell.styles.textColor = [154, 107, 0];
            if (v === "Low")      data.cell.styles.textColor = [28, 122, 86];
          }
        },
      });

      // ── Top Performers section ──
      const finalY = (doc.lastAutoTable?.finalY || ph - 50) + 8;
      if (finalY < ph - 30) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(10, 61, 98);
        doc.text("🏆 Top 3 Performers", 15, finalY);

        topPerformers.slice(0, 3).forEach((p, i) => {
          const medal = ["🥇", "🥈", "🥉"][i];
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(40, 60, 80);
          doc.text(
            `${medal} ${p.name}  |  Score: ${parseFloat(p.productivityScore).toFixed(1)}  |  ${p.station}`,
            20,
            finalY + 6 + i * 6
          );
        });
      }

      // ── Footer ──
      doc.setFillColor(10, 61, 98);
      doc.rect(0, ph - 10, pw, 10, "F");
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(180, 200, 220);
      doc.text("KMFRI Confidential — For Internal Use Only", pw / 2, ph - 3, { align: "center" });

      doc.save(
        `KMFRI_${stats.department}_Report_${new Date().toISOString().split("T")[0]}.pdf`
      );
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  /* ──────────────────────────────────────────
     RENDER
  ────────────────────────────────────────── */
  return (
    <Box
      sx={{
        background: T.cloudWhite,
        minHeight: "100vh",
        pb: 6,
      }}
    >
      {/* ════ HERO HEADER ════ */}
      <Box
        sx={{
          background: colorPalette.oceanGradient,
          px: { xs: 2.5, md: 4 },
          pt: 4,
          pb: 3,
          color: T.white,
        }}
      >
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} md={8}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { xs: 22, md: 28 },
                color: T.white,
                mb: 0.5,
              }}
            >
              {stats.department}
            </Typography>
            <Typography
              sx={{
                fontSize: 14,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              Supervisor Performance Dashboard — {stats.totalStaff} Staff Members
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} display="flex" gap={1.5} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
            <Chip
              label={new Date().toLocaleDateString("en-KE", { month: "short", year: "numeric" })}
              size="small"
              sx={{
                background: "rgba(255,255,255,0.15)",
                color: T.white,
                fontWeight: 600,
                fontSize: 12,
              }}
            />
            <Button
              variant="contained"
              onClick={handleExportPDF}
              disabled={exporting}
              startIcon={<Download />}
              sx={{
                background: T.warmSand,
                color: T.deepNavy,
                fontWeight: 700,
                fontSize: 12,
                textTransform: "none",
                borderRadius: "8px",
                px: 2,
                py: 0.8,
                "&:hover": {
                  background: T.warmSand + "dd",
                },
                "&:disabled": { opacity: 0.6 },
              }}
            >
              {exporting ? "Generating..." : "Download"}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* ════ PAGE CONTENT ════ */}
      <Box px={{ xs: 2.5, md: 4 }} mt={3.5}>

        {/* ── KPI CARDS ── */}
        <Grid container spacing={2.5} mb={4}>
          {[
            { label: "Total Staff", value: stats.totalStaff, icon: "👥", accent: T.oceanBlue, subtext: "Active this month" },
            { label: "Hours Worked", value: stats.totalHours, icon: "⏱", accent: T.seafoamGreen, subtext: "Dept total" },
            { label: "Overtime Hours", value: stats.totalOvertime, icon: "🔥", accent: T.warmSand, subtext: "Accumulated" },
            { label: "Late Arrivals", value: stats.totalLateCount, icon: "⚠️", accent: T.coralSunset, subtext: "This period" },
            { label: "Active Coverage", value: `${activeCoverage}%`, icon: "📌", accent: T.aqua, subtext: `${stats.activeStaffThisMonth || 0} staff with records` },
            { label: "Clocked In Now", value: stats.clockedInNow || 0, icon: "🟢", accent: T.seafoamGreen, subtext: "Open sessions" },
            { label: "Outside Clocking", value: stats.outsideClockingCount || 0, icon: "📍", accent: T.oceanBlue, subtext: `${outsideUsageRate}% staff usage` },
            { label: "On Leave", value: stats.onLeaveCount || 0, icon: "🏖", accent: T.warmSand, subtext: "From user profiles" },
          ].map((kpi) => (
            <Grid item xs={12} sm={6} md={3} key={kpi.label}>
              <KpiCard {...kpi} />
            </Grid>
          ))}
        </Grid>

        {/* ── INSIGHT ROW ── */}
        <Grid container spacing={2.5} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <InsightCard
              title="Avg Productivity"
              value={avgScore}
              icon={TrendingUp}
              color={T.oceanBlue}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <InsightCard
              title="Avg Attendance"
              value={`${avgAttendance}%`}
              icon={CheckCircle}
              color={T.seafoamGreen}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <InsightCard
              title="Moderate Risk"
              value={moderateBurnout}
              icon={WarningAmber}
              color={T.warmSand}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <InsightCard
              title="High Risk Staff"
              value={highBurnout}
              icon={WarningAmber}
              color={highBurnout > 0 ? T.coralSunset : T.seafoamGreen}
              trend={highBurnout > 0 ? { label: "Action needed", color: T.coralSunset } : { label: "No concerns", color: T.seafoamGreen }}
            />
          </Grid>
        </Grid>

        {/* ── OPERATIONAL SUMMARY ── */}
        <Grid container spacing={2.5} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <InsightCard
              title="Avg Clock In"
              value={stats.avgClockIn || "—"}
              icon={CheckCircle}
              color={T.oceanBlue}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <InsightCard
              title="Avg Clock Out"
              value={stats.avgClockOut || "—"}
              icon={CheckCircle}
              color={T.seafoamGreen}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <InsightCard
              title="Today's Clock-ins"
              value={stats.today?.clockIns || 0}
              icon={TrendingUp}
              color={T.aqua}
              trend={{ label: `${stats.today?.late || 0} late today`, color: (stats.today?.late || 0) > 0 ? T.coralSunset : T.seafoamGreen }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <InsightCard
              title="Outside Authorized"
              value={stats.outsideAuthorizedCount || 0}
              icon={WarningAmber}
              color={T.warmSand}
              trend={{ label: `${stats.outsideClockingStaffCount || 0} used this month`, color: T.oceanBlue }}
            />
          </Grid>
        </Grid>

        {/* ── ROW 1: Productivity Bar + Burnout Pie ── */}
        <Grid container spacing={3} mb={3}>
          {/* Productivity Score Bar */}
          <Grid item xs={12} md={8}>
            <ChartCard title="Productivity Scores (Top 10)" icon="📊">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartDataTop10}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.oceanBlue} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={T.aqua} stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.softGray} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.charcoal, opacity: 0.7 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: T.charcoal, opacity: 0.7 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Score" fill="url(#scoreGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          {/* Burnout Pie */}
          <Grid item xs={12} md={4}>
            <ChartCard title="Burnout Distribution" icon="🔥" sx={{ height: "100%" }}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieBurnoutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={45}
                    paddingAngle={3}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {pieBurnoutData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        </Grid>

        {/* ── ROW 2: Attendance + Late Arrivals ── */}
        <Grid container spacing={3} mb={3}>
          {/* Attendance Area */}
          <Grid item xs={12} md={6}>
            <ChartCard title="Attendance Rate" icon="📅">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={attendanceData}>
                  <defs>
                    <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.seafoamGreen} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={T.seafoamGreen} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.softGray} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.charcoal, opacity: 0.7 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.charcoal, opacity: 0.7 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Attendance" stroke={T.seafoamGreen} strokeWidth={2.5} fill="url(#attendGrad)" dot={{ r: 3, fill: T.seafoamGreen }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          {/* Late Arrivals Bar */}
          <Grid item xs={12} md={6}>
            <ChartCard title="Late Arrivals by Employee" icon="🕐">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={lateData} barCategoryGap="35%">
                  <defs>
                    <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.warmSand} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={T.coralSunset} stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.softGray} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.charcoal, opacity: 0.7 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: T.charcoal, opacity: 0.7 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Late" fill="url(#lateGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        </Grid>

        {/* ── ROW 3: Hours vs Overtime + Score Trend ── */}
        <Grid container spacing={3} mb={3}>
          {/* Hours vs Overtime */}
          <Grid item xs={12} md={7}>
            <ChartCard title="Hours vs Overtime Comparison" icon="⚡">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={chartDataTop10}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.softGray} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.charcoal, opacity: 0.7 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: T.charcoal, opacity: 0.7 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Bar dataKey="Hours" fill={T.oceanBlue} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Overtime" fill={T.coralSunset} radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          {/* Score Line Trend */}
          <Grid item xs={12} md={5}>
            <ChartCard title="Productivity Trend" icon="📈">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartDataTop10}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={T.aqua} />
                      <stop offset="100%" stopColor={T.oceanBlue} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.softGray} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.charcoal, opacity: 0.7 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: T.charcoal, opacity: 0.7 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="Score"
                    stroke="url(#lineGrad)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: T.aqua }}
                    activeDot={{ r: 6, fill: T.white, stroke: T.aqua, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        </Grid>

        {/* ── ROW 4: Daily Trend + Station Summary ── */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={7}>
            <ChartCard title="Department Clocking Trend" icon="📈">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.softGray} vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: T.charcoal, opacity: 0.7 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.charcoal, opacity: 0.7 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.charcoal, opacity: 0.7 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Bar yAxisId="left" dataKey="clockIns" name="Clock Ins" fill={T.oceanBlue} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="outsideClocking" name="Outside" fill={T.warmSand} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="hours" name="Hours" stroke={T.seafoamGreen} strokeWidth={2.5} dot={{ r: 3, fill: T.seafoamGreen }} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          <Grid item xs={12} md={5}>
            <ChartCard title="Station Workload Summary" icon="🏢">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stationChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.softGray} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: T.charcoal, opacity: 0.7 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 10, fill: T.charcoal, opacity: 0.75 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Bar dataKey="Hours" fill={T.oceanBlue} radius={[0, 5, 5, 0]} />
                  <Bar dataKey="Late" fill={T.coralSunset} radius={[0, 5, 5, 0]} />
                  <Bar dataKey="Outside" fill={T.warmSand} radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        </Grid>

        {/* ── ROW 5: Outside Clocking Focus ── */}
        {outsideClockingData.length > 0 && (
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12}>
              <ChartCard title="Outside Clocking Usage" icon="📍">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={outsideClockingData} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.softGray} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.charcoal, opacity: 0.7 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: T.charcoal, opacity: 0.7 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar dataKey="Outside" name="Outside Clockings" fill={T.oceanBlue} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
          </Grid>
        )}

        {/* ── TOP 3 PERFORMERS ── */}
        <Box mb={3}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 16,
              color: T.deepNavy,
              mb: 2,
            }}
          >
            🏆 Top 3 Performers
          </Typography>
          <Grid container spacing={2.5}>
            {topPerformers.map((emp, index) => {
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <Grid item xs={12} md={4} key={emp.email}>
                  <Card
                    elevation={0}
                    sx={{
                      border: `1.5px solid ${index === 0 ? T.warmSand + "60" : T.softGray}`,
                      borderRadius: "12px",
                      background: index === 0 ? "#FFFBEF" : T.white,
                      transition: "all .2s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: `0 8px 24px rgba(0,91,150,0.12)`,
                      },
                    }}
                  >
                    <CardContent sx={{ p: "18px" }}>
                      <Box display="flex" alignItems="center" gap={1.2} mb={1.5}>
                        <Typography sx={{ fontSize: 28 }}>{medals[index]}</Typography>
                        <Box>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: 14,
                              color: T.deepNavy,
                            }}
                          >
                            {emp.name}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: T.charcoal, opacity: 0.7 }}>
                            {emp.station}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 1.2, borderColor: T.softGray }} />
                      <Stack spacing={1}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography sx={{ fontSize: 12, color: T.charcoal, opacity: 0.7 }}>
                            Productivity
                          </Typography>
                          <Typography
                            sx={{
                              fontWeight: 800,
                              fontSize: 16,
                              color: T.deepNavy,
                            }}
                          >
                            {parseFloat(emp.productivityScore).toFixed(1)}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography sx={{ fontSize: 12, color: T.charcoal, opacity: 0.7 }}>
                            Burnout Risk
                          </Typography>
                          <StatusBadge level={emp.burnoutLevel} />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* ── EMPLOYEE RECORDS TABLE ── */}
        <Box mb={3}>
          <Card elevation={0} sx={{ border: `1px solid ${T.softGray}`, borderRadius: "14px", overflow: "hidden" }}>
            <Box sx={{ px: 3, pt: 2.5, pb: 1.5, background: T.white }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
                <Typography sx={{ fontWeight: 700, fontSize: 16, color: T.deepNavy }}>
                  📋 Employee Performance Records
                </Typography>
                <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
                  <TextField
                    size="small"
                    placeholder="Search by name, email, or station..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                      width: { xs: "100%", sm: "200px" },
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                      },
                    }}
                  />
                  <TextField
                    size="small"
                    select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    sx={{
                      width: "120px",
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                      },
                    }}
                  >
                    <MenuItem value="score">Sort by Score</MenuItem>
                    <MenuItem value="hours">Sort by Hours</MenuItem>
                    <MenuItem value="late">Sort by Late Count</MenuItem>
                    <MenuItem value="outside">Sort by Outside</MenuItem>
                    <MenuItem value="open">Sort by Open Sessions</MenuItem>
                  </TextField>
                </Box>
              </Box>
            </Box>
            <TableContainer sx={{ maxHeight: "600px", overflowY: "auto" }}>
              <Table stickyHeader>
                <TableHead sx={{ background: T.softGray }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Station</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Hours</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>OT</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Attendance %</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Score</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Present</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Half</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Late</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Outside</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Open</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Risk</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedEmployees.map((emp, idx) => (
                    <MuiTooltip key={emp.email} title={`Days Present: ${emp.daysPresent || "N/A"}`} placement="left">
                      <TableRow
                        sx={{
                          background: idx % 2 === 0 ? T.white : T.cloudWhite,
                          "&:hover": { background: T.softGray + "50" },
                        }}
                      >
                        <TableCell sx={{ fontSize: 13, color: T.deepNavy, fontWeight: 600 }}>{emp.name}</TableCell>
                        <TableCell sx={{ fontSize: 13, color: T.charcoal, opacity: 0.8 }}>{emp.station}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 13, color: T.charcoal }}>
                          {emp.hours}h
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 13, color: T.coralSunset, fontWeight: 600 }}>
                          {emp.overtime}h
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 13, color: T.oceanBlue, fontWeight: 600 }}>
                          {emp.attendanceRate}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: parseFloat(emp.productivityScore) > avgScore ? T.seafoamGreen : T.charcoal,
                          }}
                        >
                          {parseFloat(emp.productivityScore).toFixed(1)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 13, color: T.seafoamGreen, fontWeight: 600 }}>
                          {emp.presentCount || 0}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 13, color: T.warmSand, fontWeight: 600 }}>
                          {emp.halfDayCount || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: 13, color: T.charcoal, fontWeight: 600 }}>
                          {emp.lateCount}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: 13, color: (emp.outsideClockingCount || 0) > 0 ? T.oceanBlue : T.charcoal, fontWeight: 700 }}>
                          {emp.outsideClockingCount || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: 13, color: (emp.openSessions || 0) > 0 ? T.seafoamGreen : T.charcoal, fontWeight: 700 }}>
                          {emp.openSessions || 0}
                        </TableCell>
                        <TableCell align="center">
                          <StatusBadge level={emp.burnoutLevel} />
                        </TableCell>
                      </TableRow>
                    </MuiTooltip>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ px: 3, py: 1.5, background: T.cloudWhite, textAlign: "center" }}>
              <Typography sx={{ fontSize: 12, color: T.charcoal, opacity: 0.7 }}>
                Showing {sortedEmployees.length} of {stats.employeeMetrics.length} employees
              </Typography>
            </Box>
          </Card>
        </Box>

        {/* ── BOTTOM EXPORT ── */}
        <Box display="flex" justifyContent="center" gap={2}>
          <Button
            variant="contained"
            onClick={handleExportPDF}
            disabled={exporting}
            startIcon={<Download />}
            sx={{
              background: colorPalette.oceanGradient,
              color: T.white,
              fontWeight: 700,
              fontSize: 13,
              textTransform: "none",
              borderRadius: "10px",
              px: 3.5,
              py: 1.2,
              boxShadow: `0 4px 16px rgba(10,61,98,0.25)`,
              "&:hover": {
                boxShadow: `0 6px 24px rgba(10,61,98,0.35)`,
              },
              "&:disabled": { opacity: 0.6 },
            }}
          >
            {exporting ? "Generating…" : "Export Full PDF Report"}
          </Button>
        </Box>

      </Box>{/* end page content */}
    </Box>
  );
};

export default SupervisorDeptStats;
