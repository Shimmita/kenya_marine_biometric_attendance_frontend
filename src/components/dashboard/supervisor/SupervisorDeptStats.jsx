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
  Avatar,
} from "@mui/material";
import { useEffect, useState } from "react";
import { fetchDepartmentStats } from "../../../service/ClockingService";
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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
} from "recharts";

/* ──────────────────────────────────────────────
   DESIGN TOKENS
────────────────────────────────────────────── */
const T = {
  deepNavy:    "#0A2540",
  navy:        "#0A3D62",
  oceanBlue:   "#005B96",
  skyBlue:     "#1E8BC3",
  aqua:        "#00CFD5",
  gold:        "#C9A84C",
  goldLight:   "#F0D080",
  coral:       "#E05C4B",
  mint:        "#3ECFB2",
  amber:       "#F5A623",
  softGray:    "#E8EEF7",
  cloudWhite:  "#F4F7FB",
  ink:         "#1A2B3C",
  muted:       "#637280",
  border:      "#D0DAE8",
  white:       "#FFFFFF",
};

const PIE_COLORS   = [T.mint, T.amber, T.coral];
const RADAR_COLOR  = T.aqua;

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
        borderRadius: "10px",
        px: 2,
        py: 1.5,
        boxShadow: `0 8px 32px rgba(0,0,0,0.35)`,
        minWidth: 140,
      }}
    >
      <Typography sx={{ color: T.aqua, fontWeight: 700, fontSize: 12, mb: 0.5, fontFamily: "Syne, sans-serif" }}>
        {label}
      </Typography>
      {payload.map((p) => (
        <Typography key={p.name} sx={{ color: T.white, fontSize: 13, fontFamily: "DM Sans, sans-serif" }}>
          <span style={{ color: p.fill || p.stroke, fontWeight: 700 }}>{p.name}: </span>
          {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
        </Typography>
      ))}
    </Box>
  );
};

/* ──────────────────────────────────────────────
   SECTION HEADER
────────────────────────────────────────────── */
const SectionHeader = ({ title, subtitle, icon }) => (
  <Box mb={2}>
    <Box display="flex" alignItems="center" gap={1.2}>
      <Box
        sx={{
          width: 4,
          height: 28,
          borderRadius: 8,
          background: `linear-gradient(180deg, ${T.aqua}, ${T.oceanBlue})`,
        }}
      />
      <Typography
        sx={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 800,
          fontSize: 17,
          color: T.ink,
          letterSpacing: "-0.3px",
        }}
      >
        {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
        {title}
      </Typography>
    </Box>
    {subtitle && (
      <Typography
        sx={{
          fontFamily: "DM Sans, sans-serif",
          fontSize: 13,
          color: T.muted,
          mt: 0.5,
          ml: "20px",
          lineHeight: 1.55,
        }}
      >
        {subtitle}
      </Typography>
    )}
  </Box>
);

/* ──────────────────────────────────────────────
   KPI CARD
────────────────────────────────────────────── */
const KpiCard = ({ label, value, icon, accent, trend }) => (
  <Card
    elevation={0}
    sx={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: "16px",
      overflow: "hidden",
      position: "relative",
      transition: "transform .2s, box-shadow .2s",
      "&:hover": {
        transform: "translateY(-3px)",
        boxShadow: `0 12px 40px rgba(10,61,98,0.10)`,
      },
      "&::before": {
        content: '""',
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 3,
        background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
      },
    }}
  >
    <CardContent sx={{ p: "22px 22px 18px" }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography
            sx={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: T.muted,
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              mb: 0.8,
            }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              fontFamily: "Syne, sans-serif",
              fontWeight: 800,
              fontSize: 30,
              color: T.ink,
              lineHeight: 1,
            }}
          >
            {value}
          </Typography>
          {trend && (
            <Typography sx={{ fontSize: 12, color: T.mint, fontFamily: "DM Sans, sans-serif", mt: 0.6 }}>
              {trend}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: "12px",
            background: `${accent}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
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
const ChartCard = ({ children, sx = {} }) => (
  <Card
    elevation={0}
    sx={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: "18px",
      p: "26px 22px 18px",
      ...sx,
    }}
  >
    {children}
  </Card>
);

/* ──────────────────────────────────────────────
   BURNOUT BADGE
────────────────────────────────────────────── */
const BurnoutBadge = ({ level }) => {
  const map = {
    Low:      { bg: "#E8F7F1", color: "#1C7A56", label: "Low Risk" },
    Moderate: { bg: "#FFF4E0", color: "#9A6B00", label: "Moderate" },
    High:     { bg: "#FDECEA", color: "#B52A1C", label: "High Risk" },
  };
  const s = map[level] || map["Low"];
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{
        background: s.bg,
        color: s.color,
        fontWeight: 700,
        fontFamily: "DM Sans, sans-serif",
        fontSize: 11,
        height: 22,
      }}
    />
  );
};

/* ──────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────── */
const SupervisorDeptStats = () => {
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);

  // Inject Google Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);

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

  if (loading)
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight={320}
        gap={2}
      >
        <CircularProgress sx={{ color: T.oceanBlue }} />
        <Typography sx={{ fontFamily: "DM Sans, sans-serif", color: T.muted, fontSize: 14 }}>
          Loading department analytics…
        </Typography>
      </Box>
    );

  if (!stats)
    return (
      <Box textAlign="center" mt={6}>
        <Typography sx={{ fontFamily: "DM Sans, sans-serif", color: T.muted }}>
          No department data available.
        </Typography>
      </Box>
    );

  /* ── Derived chart data ── */
  const chartData = stats.employeeMetrics.map((e) => ({
    name: e.name.split(" ")[0],
    Hours:    Number(e.hours),
    Overtime: Number(e.overtime),
    Score:    Number(e.productivityScore),
  }));

  const burnoutData = ["Low", "Moderate", "High"].map((level) => ({
    level,
    count: stats.employeeMetrics.filter((e) => e.burnoutLevel === level).length,
  }));

  const attendanceData = stats.employeeMetrics.map((e) => ({
    name:       e.name.split(" ")[0],
    Attendance: parseFloat(e.attendanceRate),
  }));

  const lateData = stats.employeeMetrics.map((e) => ({
    name: e.name.split(" ")[0],
    Late: e.lateCount,
  }));

  // Radar data — top 5 by score
  const radarData = stats.employeeMetrics.slice(0, 5).map((e) => ({
    subject: e.name.split(" ")[0],
    Score:   Number(e.productivityScore),
    Hours:   Number(e.hours),
  }));

  // Pie — burnout distribution
  const pieBurnout = burnoutData.filter((b) => b.count > 0);

  // Line — score trend (using sorted order as proxy timeline)
  const scoreTrend = [...stats.employeeMetrics]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e, i) => ({
      name:  e.name.split(" ")[0],
      Score: Number(e.productivityScore),
      Hours: Number(e.hours),
    }));

  /* ── Executive summary ── */
  const highBurnout = burnoutData.find((b) => b.level === "High")?.count || 0;
  const avgScore = (
    stats.employeeMetrics.reduce((s, e) => s + Number(e.productivityScore), 0) /
    stats.employeeMetrics.length
  ).toFixed(1);

  const executiveSummary = `The ${stats.department} department has ${stats.totalStaff} staff members this reporting period. The average productivity score is ${avgScore}, with a total of ${stats.totalOvertime} hours of overtime logged.

${
    highBurnout > 0
      ? `⚠ ${highBurnout} employee(s) are flagged at HIGH burnout risk due to excessive overtime. Immediate workload review is recommended.`
      : "✓ No employees are currently at high burnout risk."
  }

Late arrivals total ${stats.totalLateCount} occurrences, representing a discipline pattern that should be monitored. Top performer is ${stats.topPerformers[0]?.name || "N/A"} with a productivity score of ${stats.topPerformers[0]?.productivityScore?.toFixed(1) || "N/A"}.`;

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
      doc.setFillColor(10, 37, 64);
      doc.rect(0, 0, pw, 36, "F");

      doc.setFillColor(0, 207, 213);
      doc.rect(0, 36, pw, 2, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("Kenya Marine and Fisheries Research Institute", pw / 2, 13, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(180, 220, 240);
      doc.text(`${stats.department} Department — Performance Report`, pw / 2, 22, { align: "center" });
      doc.text(`Generated: ${new Date().toLocaleDateString("en-KE", { dateStyle: "long" })}`, pw / 2, 30, { align: "center" });

      // ── KPI Row ──
      const kpis = [
        ["Total Staff",   stats.totalStaff],
        ["Total Hours",   stats.totalHours],
        ["Overtime Hrs",  stats.totalOvertime],
        ["Late Events",   stats.totalLateCount],
        ["Avg Score",     avgScore],
        ["High Burnout",  highBurnout],
      ];

      const boxW = (pw - 30) / kpis.length;
      kpis.forEach(([lbl, val], i) => {
        const x = 15 + i * boxW;
        doc.setFillColor(234, 241, 249);
        doc.roundedRect(x, 44, boxW - 4, 22, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(10, 61, 98);
        doc.text(String(val), x + (boxW - 4) / 2, 54, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100, 120, 140);
        doc.text(lbl, x + (boxW - 4) / 2, 61, { align: "center" });
      });

      // ── Executive Summary ──
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(10, 37, 64);
      doc.text("Executive Summary", 15, 76);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(60, 80, 100);
      const summaryLines = doc.splitTextToSize(executiveSummary, pw - 30);
      doc.text(summaryLines, 15, 83);

      // ── Employee Table ──
      autoTable(doc, {
        startY: 83 + summaryLines.length * 4 + 6,
        head: [["#", "Name", "Station", "Hours", "Overtime", "Attendance", "Productivity", "Late", "Burnout"]],
        body: stats.employeeMetrics.map((e, i) => [
          i + 1,
          e.name,
          e.station,
          e.hours,
          e.overtime,
          e.attendanceRate,
          Number(e.productivityScore).toFixed(1),
          e.lateCount,
          e.burnoutLevel,
        ]),
        headStyles: {
          fillColor: [10, 37, 64],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        bodyStyles:  { fontSize: 8, textColor: [40, 60, 80] },
        alternateRowStyles: { fillColor: [240, 245, 252] },
        didParseCell(data) {
          if (data.column.index === 8 && data.section === "body") {
            const v = data.cell.raw;
            if (v === "High")     data.cell.styles.textColor = [180, 42, 28];
            if (v === "Moderate") data.cell.styles.textColor = [154, 107, 0];
            if (v === "Low")      data.cell.styles.textColor = [28, 122, 86];
          }
        },
      });

      // ── Top Performers section ──
      const finalY = (doc.lastAutoTable?.finalY || ph - 50) + 10;
      if (finalY < ph - 40) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(10, 37, 64);
        doc.text("🏆 Top 3 Performers", 15, finalY);

        stats.topPerformers.slice(0, 3).forEach((p, i) => {
          const medal = ["🥇", "🥈", "🥉"][i];
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(40, 60, 80);
          doc.text(
            `${medal} ${p.name}  |  Score: ${Number(p.productivityScore).toFixed(1)}  |  ${p.station}`,
            20,
            finalY + 7 + i * 7
          );
        });
      }

      // ── Footer ──
      doc.setFillColor(10, 37, 64);
      doc.rect(0, ph - 12, pw, 12, "F");
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(180, 200, 220);
      doc.text("KMFRI Confidential — For Internal Use Only", pw / 2, ph - 4, { align: "center" });

      doc.save(
        `KMFRI_${stats.department}_Report_${new Date().toISOString().split("T")[0]}.pdf`
      );
    } catch (err) {
      console.error(err);
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
        background: "#F0F4FA",
        minHeight: "100vh",
        fontFamily: "DM Sans, sans-serif",
        pb: 8,
      }}
    >
      {/* ════ HERO HEADER ════ */}
      <Box
        sx={{
          background: `linear-gradient(130deg, ${T.deepNavy} 0%, ${T.navy} 55%, ${T.oceanBlue} 100%)`,
          px: { xs: 3, md: 5 },
          pt: 5,
          pb: 4,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* decorative circles */}
        {[
          { size: 320, top: -120, right: -60,  opacity: 0.07 },
          { size: 180, top:   40, right:  160, opacity: 0.06 },
          { size:  90, top:  -20, right:  320, opacity: 0.09 },
        ].map((c, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              top: c.top,
              right: c.right,
              width: c.size,
              height: c.size,
              borderRadius: "50%",
              border: `1.5px solid ${T.aqua}`,
              opacity: c.opacity,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* KMFRI badge */}
        <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              background: `linear-gradient(135deg, ${T.aqua}, ${T.oceanBlue})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            🌊
          </Box>
          <Box>
            <Typography
              sx={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 800,
                fontSize: 11,
                color: T.aqua,
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              KMFRI
            </Typography>
            <Typography
              sx={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: 11,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1,
              }}
            >
              Kenya Marine &amp; Fisheries Research Institute
            </Typography>
          </Box>
        </Box>

        <Typography
          sx={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 800,
            fontSize: { xs: 22, md: 28 },
            color: T.white,
            letterSpacing: "-0.5px",
            lineHeight: 1.15,
          }}
        >
          {stats.department}
        </Typography>
        <Typography
          sx={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: 14,
            color: "rgba(255,255,255,0.55)",
            mt: 0.4,
          }}
        >
          Supervisor Performance Dashboard
        </Typography>

        {/* date + export row */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mt={3}
          flexWrap="wrap"
          gap={2}
        >
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip
              label={`${stats.totalStaff} Staff Members`}
              size="small"
              sx={{
                background: "rgba(255,255,255,0.12)",
                color: T.white,
                fontFamily: "DM Sans, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            />
            <Chip
              label={new Date().toLocaleDateString("en-KE", { month: "long", year: "numeric" })}
              size="small"
              sx={{
                background: "rgba(0,207,213,0.15)",
                color: T.aqua,
                fontFamily: "DM Sans, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                border: `1px solid ${T.aqua}44`,
              }}
            />
          </Box>

          <Button
            variant="contained"
            onClick={handleExportPDF}
            disabled={exporting}
            startIcon={<span style={{ fontSize: 16 }}>⬇</span>}
            sx={{
              background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
              color: T.deepNavy,
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: 13,
              textTransform: "none",
              borderRadius: "10px",
              px: 3,
              py: 1,
              boxShadow: `0 4px 20px rgba(201,168,76,0.4)`,
              "&:hover": {
                background: `linear-gradient(135deg, ${T.goldLight}, ${T.gold})`,
                boxShadow: `0 6px 28px rgba(201,168,76,0.55)`,
              },
              "&:disabled": { opacity: 0.7 },
            }}
          >
            {exporting ? "Generating PDF…" : "Download Report"}
          </Button>
        </Box>
      </Box>

      {/* ════ PAGE CONTENT ════ */}
      <Box px={{ xs: 2, md: 5 }} mt={4}>

        {/* ── KPI CARDS ── */}
        <Grid container spacing={2.5} mb={4}>
          {[
            { label: "Total Staff",      value: stats.totalStaff,      icon: "👥", accent: T.oceanBlue, trend: "Active this month" },
            { label: "Hours Worked",     value: stats.totalHours,      icon: "⏱",  accent: T.mint,      trend: "Dept total" },
            { label: "Overtime Hours",   value: stats.totalOvertime,   icon: "🔥", accent: T.amber,     trend: "Accumulated" },
            { label: "Late Occurrences", value: stats.totalLateCount,  icon: "⚠", accent: T.coral,     trend: "This period" },
          ].map((kpi) => (
            <Grid item xs={12} sm={6} md={3} key={kpi.label}>
              <KpiCard {...kpi} />
            </Grid>
          ))}
        </Grid>

        {/* ── ROW 1: Productivity Bar + Burnout Pie ── */}
        <Grid container spacing={3} mb={3}>
          {/* Productivity Score Bar */}
          <Grid item xs={12} md={8}>
            <ChartCard>
              <SectionHeader
                title="Productivity Scores"
                icon="📊"
                subtitle="Composite score = (hours × 0.6) + (overtime × 0.5) − (late × 1.5). Higher indicates greater contribution and punctuality."
              />
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.aqua}      stopOpacity={0.9} />
                      <stop offset="100%" stopColor={T.oceanBlue} stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Score" fill="url(#scoreGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          {/* Burnout Pie */}
          <Grid item xs={12} md={4}>
            <ChartCard sx={{ height: "100%" }}>
              <SectionHeader
                title="Burnout Risk"
                icon="🔥"
                subtitle="Distribution based on overtime thresholds (>10 h = Moderate, >20 h = High)."
              />
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieBurnout}
                    dataKey="count"
                    nameKey="level"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={4}
                    label={({ level, percent }) =>
                      `${level} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {pieBurnout.map((entry, i) => (
                      <Cell key={i} fill={PIE_COLORS[["Low","Moderate","High"].indexOf(entry.level)]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [val, name]}
                    contentStyle={{ fontFamily: "DM Sans, sans-serif", borderRadius: 10 }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontFamily: "DM Sans, sans-serif", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        </Grid>

        {/* ── ROW 2: Attendance Area + Late Bar ── */}
        <Grid container spacing={3} mb={3}>
          {/* Attendance Area */}
          <Grid item xs={12} md={6}>
            <ChartCard>
              <SectionHeader
                title="Attendance Rate"
                icon="📅"
                subtitle="Percentage of working days each employee was present this month. Target ≥ 90%."
              />
              <ResponsiveContainer width="100%" height={270}>
                <AreaChart data={attendanceData}>
                  <defs>
                    <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={T.mint}  stopOpacity={0.4} />
                      <stop offset="100%" stopColor={T.mint}  stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Attendance" stroke={T.mint} strokeWidth={2.5} fill="url(#attendGrad)" dot={{ r: 4, fill: T.mint }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          {/* Late Arrivals Bar */}
          <Grid item xs={12} md={6}>
            <ChartCard>
              <SectionHeader
                title="Late Arrival Frequency"
                icon="🕐"
                subtitle="Number of late clock-ins per employee. High counts signal punctuality issues requiring follow-up."
              />
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={lateData} barCategoryGap="35%">
                  <defs>
                    <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={T.amber} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={T.coral} stopOpacity={0.75} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Late" fill="url(#lateGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        </Grid>

        {/* ── ROW 3: Hours vs Overtime Grouped + Score Line ── */}
        <Grid container spacing={3} mb={3}>
          {/* Hours vs Overtime Grouped */}
          <Grid item xs={12} md={7}>
            <ChartCard>
              <SectionHeader
                title="Hours vs Overtime"
                icon="⚡"
                subtitle="Side-by-side comparison of regular hours and overtime per employee. Persistent overtime disparity may indicate understaffing."
              />
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} barCategoryGap="25%" barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, paddingTop: 8 }} />
                  <Bar dataKey="Hours"    fill={T.oceanBlue} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Overtime" fill={T.coral}     radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          {/* Score Line Trend */}
          <Grid item xs={12} md={5}>
            <ChartCard>
              <SectionHeader
                title="Score Trend (Alphabetical)"
                icon="📈"
                subtitle="Productivity score sweep across all employees. Identifies outliers in either direction."
              />
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={scoreTrend}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%"   stopColor={T.aqua}      />
                      <stop offset="100%" stopColor={T.oceanBlue} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="Score"
                    stroke="url(#lineGrad)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: T.aqua, strokeWidth: 0 }}
                    activeDot={{ r: 7, fill: T.white, stroke: T.aqua, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        </Grid>

        {/* ── ROW 4: Radar ── */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={5}>
            <ChartCard>
              <SectionHeader
                title="Multi-Metric Radar"
                icon="🎯"
                subtitle="Radar overlay of productivity score vs hours for top-5 employees — reveals balanced vs imbalanced contributors."
              />
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={100}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="subject" tick={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fill: T.muted }} />
                  <PolarRadiusAxis angle={30} tick={{ fontSize: 10, fill: T.muted }} axisLine={false} />
                  <Radar name="Score" dataKey="Score" stroke={T.aqua}      fill={T.aqua}      fillOpacity={0.25} strokeWidth={2} />
                  <Radar name="Hours" dataKey="Hours" stroke={T.oceanBlue} fill={T.oceanBlue} fillOpacity={0.15} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontFamily: "DM Sans, sans-serif", fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          {/* Hours Area chart */}
          <Grid item xs={12} md={7}>
            <ChartCard>
              <SectionHeader
                title="Hours Worked — Area View"
                icon="🕓"
                subtitle="Smooth area representation of total hours worked per employee, useful for spotting workload concentration."
              />
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={T.oceanBlue} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={T.oceanBlue} stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="otGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={T.coral} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={T.coral} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontFamily: "DM Sans, sans-serif", fontSize: 12 }} />
                  <Area type="monotone" dataKey="Hours"    stroke={T.oceanBlue} strokeWidth={2} fill="url(#hoursGrad)" dot={{ r: 3, fill: T.oceanBlue }} />
                  <Area type="monotone" dataKey="Overtime" stroke={T.coral}     strokeWidth={2} fill="url(#otGrad)"    dot={{ r: 3, fill: T.coral }}     />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        </Grid>

        {/* ── TOP 3 PERFORMERS ── */}
        <Box mb={3}>
          <SectionHeader
            title="Top 3 Performers"
            icon="🏆"
            subtitle="Ranked by composite productivity score for this reporting period."
          />
          <Grid container spacing={2.5}>
            {stats.topPerformers.map((emp, index) => {
              const medals = ["🥇", "🥈", "🥉"];
              const accents = [T.gold, T.muted, T.amber];
              return (
                <Grid item xs={12} md={4} key={emp.email}>
                  <Card
                    elevation={0}
                    sx={{
                      border: `1px solid ${index === 0 ? T.gold + "60" : T.border}`,
                      borderRadius: "16px",
                      background: index === 0
                        ? `linear-gradient(135deg, #FFFBEF, #FFF6D6)`
                        : T.white,
                      transition: "transform .2s, box-shadow .2s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: `0 8px 30px rgba(0,0,0,0.08)`,
                      },
                    }}
                  >
                    <CardContent sx={{ p: "20px 22px" }}>
                      <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                        <Typography sx={{ fontSize: 28 }}>{medals[index]}</Typography>
                        <Box>
                          <Typography
                            sx={{
                              fontFamily: "Syne, sans-serif",
                              fontWeight: 700,
                              fontSize: 15,
                              color: T.ink,
                              lineHeight: 1.2,
                            }}
                          >
                            {emp.name}
                          </Typography>
                          <Typography sx={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: T.muted }}>
                            {emp.station}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 1.5, borderColor: T.border }} />
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: T.muted }}>
                          Productivity Score
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "Syne, sans-serif",
                            fontWeight: 800,
                            fontSize: 18,
                            color: accents[index] === T.muted ? T.ink : accents[index],
                          }}
                        >
                          {Number(emp.productivityScore).toFixed(1)}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                        <Typography sx={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: T.muted }}>
                          Burnout Risk
                        </Typography>
                        <BurnoutBadge level={emp.burnoutLevel} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* ── EXECUTIVE SUMMARY ── */}
        <Box mb={3}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${T.border}`,
              borderRadius: "18px",
              overflow: "hidden",
              background: T.white,
            }}
          >
            <Box
              sx={{
                background: `linear-gradient(90deg, ${T.deepNavy} 0%, ${T.navy} 100%)`,
                px: 3,
                py: 2,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Typography sx={{ fontSize: 20 }}>📋</Typography>
              <Typography
                sx={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  color: T.white,
                }}
              >
                Executive Summary
              </Typography>
              <Chip
                label="Supervisor View"
                size="small"
                sx={{
                  ml: "auto",
                  background: `${T.aqua}22`,
                  color: T.aqua,
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  border: `1px solid ${T.aqua}44`,
                }}
              />
            </Box>
            <CardContent sx={{ px: 3, py: 2.5 }}>
              <Typography
                sx={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: 14,
                  color: T.ink,
                  lineHeight: 1.8,
                  whiteSpace: "pre-line",
                }}
              >
                {executiveSummary}
              </Typography>

              {/* quick stat pills */}
              <Box display="flex" gap={1.5} mt={2.5} flexWrap="wrap">
                {[
                  { label: `Avg Score: ${avgScore}`,          color: T.aqua },
                  { label: `Top: ${stats.topPerformers[0]?.name?.split(" ")[0]}`, color: T.gold },
                  { label: `${highBurnout} High-Burnout`,     color: highBurnout > 0 ? T.coral : T.mint },
                ].map((pill) => (
                  <Box
                    key={pill.label}
                    sx={{
                      background: `${pill.color}14`,
                      border: `1px solid ${pill.color}40`,
                      borderRadius: "8px",
                      px: 1.8,
                      py: 0.6,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "DM Sans, sans-serif",
                        fontWeight: 700,
                        fontSize: 12,
                        color: pill.color,
                      }}
                    >
                      {pill.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* ── BOTTOM EXPORT ── */}
        <Box display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            onClick={handleExportPDF}
            disabled={exporting}
            startIcon={<span style={{ fontSize: 16 }}>📄</span>}
            sx={{
              background: `linear-gradient(135deg, ${T.deepNavy}, ${T.oceanBlue})`,
              color: T.white,
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: 13,
              textTransform: "none",
              borderRadius: "10px",
              px: 3.5,
              py: 1.2,
              boxShadow: `0 4px 20px rgba(10,37,64,0.3)`,
              "&:hover": {
                background: `linear-gradient(135deg, ${T.navy}, ${T.skyBlue})`,
                boxShadow: `0 6px 28px rgba(10,37,64,0.45)`,
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