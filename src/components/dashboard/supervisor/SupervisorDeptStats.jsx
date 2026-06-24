import { CheckCircle, CheckCircleOutline, Download, LocationOn } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Tooltip as MuiTooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { fetchDepartmentStats, fetchOverallAttendanceRecords } from "../../../service/ClockingService";
import { createVerification } from "../../../service/VerificationService";
import coreDataDetails from "../../CoreDataDetails";
import StatChip from "../../util/StatChip";

const { colorPalette } = coreDataDetails;

/* ──────────────────────────────────────────────
   DESIGN TOKENS (App Consistent)
────────────────────────────────────────────── */
const T = {
  deepNavy: colorPalette.deepNavy,
  oceanBlue: colorPalette.oceanBlue,
  aqua: colorPalette.cyanFresh,
  coralSunset: colorPalette.coralSunset,
  seafoamGreen: colorPalette.seafoamGreen,
  warmSand: colorPalette.warmSand,
  softGray: colorPalette.softGray,
  cloudWhite: colorPalette.cloudWhite,
  charcoal: colorPalette.charcoal,
  white: "#FFFFFF",
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
    Low: { bg: "#E8F7F1", color: "#1C7A56", label: "✓ Low" },
    Moderate: { bg: "#FFF4E0", color: "#9A6B00", label: "⚠ Moderate" },
    High: { bg: "#FDECEA", color: "#B52A1C", label: "🔴 High" },
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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("score");

  // for table pagination 
  // Inside your component:
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5); // or 5, 25, etc.
  const [deptRecords, setDeptRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsExporting, setRecordsExporting] = useState(false);
  const [recPage, setRecPage] = useState(0);
  const [recRowsPerPage, setRecRowsPerPage] = useState(10);
  const [recSearch, setRecSearch] = useState('');


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

  // Helpers: title case and location formatting (ignore UNKNOWN parts)
  const toTitleCase = (value) => {
    if (value == null || value === '') return '—';
    return String(value).trim().toLowerCase().replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));
  };

  const formatLocationLabel = (rec, isEntry) => {
    const locationName = isEntry ? rec.clockInLocationName : rec.clockOutLocationName;
    const status = rec?.clockedOutside ? 'Off Premise' : 'In Premise';
    if (!locationName) return status;
    const parts = String(locationName).split('|').map(p => p.trim()).filter(Boolean);
    const filtered = parts.filter((part) => !/^(UNKNOWN\s+SUB[-\s]?COUNTY|UNKNOWN\s+WARD)$/i.test(part));
    if (filtered.length === 0) return status;
    return `${status} (${filtered.map(toTitleCase).join(' | ')})`;
  };

  const normalizeExportTextValue = (value) => {
    if (value == null || value === '') return '—';
    return toTitleCase(value);
  };

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

  // Fetch department clocking records (uses overall records endpoint with filters)
  useEffect(() => {
    const loadRecords = async () => {
      if (!stats) return;
      try {
        setRecordsLoading(true);
        const params = {};
        if (stats.station) params.station = stats.station;
        if (stats.department) params.department = stats.department;
        const recs = await fetchOverallAttendanceRecords(params);
        // map into display-friendly shape
        setDeptRecords((recs || []).map(r => ({
          name: toTitleCase(r.name || r.email || '—'),
          date: new Date(r.clock_in).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }),
          rawDate: new Date(r.clock_in),
          clockIn: new Date(r.clock_in).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
          clockOut: r.clock_out ? new Date(r.clock_out).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) : 'System',
          inLocation: formatLocationLabel(r, true),
          outLocation: formatLocationLabel(r, false),
          whyOut: r.outSideReason ? toTitleCase(r.outSideReason) : "",
        })));
      } catch (err) {
        console.error('Failed to load department records', err);
      } finally { setRecordsLoading(false); }
    };
    loadRecords();
  }, [stats]);

  const normalizeExportValue = (value) => (value == null || value === '' ? '—' : String(value));

  const handleExportClockingPDF = async () => {
    if (!deptRecords || !stats) return;
    setRecordsExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      // create verification token for the exported dataset (use current filtered view)
      const exportList = recSearch ? deptRecords.filter(r => (
        String(r.name || '').toLowerCase().includes(recSearch.toLowerCase()) ||
        String(r.inLocation || '').toLowerCase().includes(recSearch.toLowerCase()) ||
        String(r.outLocation || '').toLowerCase().includes(recSearch.toLowerCase()) ||
        String(r.whyOut || '').toLowerCase().includes(recSearch.toLowerCase()) ||
        String(r.date || '').toLowerCase().includes(recSearch.toLowerCase())
      )) : deptRecords;
      const { token, dataHash } = await createVerification(exportList);
      const verifyUrl = `${window.location.origin}/verify/${token}?hash=${encodeURIComponent(dataHash)}`;
      const qrImage = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 300, errorCorrectionLevel: 'H' });

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pw = doc.internal.pageSize.getWidth();
      doc.setFillColor(10, 61, 98); doc.rect(0, 0, pw, 36, 'F');
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
      doc.text(`KMFRI — ${stats.department || 'Department'} RECORDS`, pw / 2, 12, { align: 'center' });
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(`${(stats.station || '').toUpperCase()} · ${(stats.department || '').toUpperCase()} · ${new Date().toLocaleDateString()}`, pw / 2, 20, { align: 'center' });
      doc.setFontSize(8);
      doc.text(`GENERATED: ${new Date().toLocaleString()} | BY: ${(stats.supervisorName || 'Supervisor')}`, pw / 2, 26, { align: 'center' });

      // add qr
      const qrSize = 28;
      doc.addImage(qrImage, 'PNG', pw - qrSize - 12, 6, qrSize, qrSize, undefined, 'FAST');

      autoTable(doc, {
        head: [['NAME', 'DATE', 'CLOCK IN', 'CLOCK OUT', 'IN LOCATION', 'OUT LOCATION', 'WHY OUT']],
        body: exportList.map(r => [
          normalizeExportValue(r.name), normalizeExportValue(r.date), normalizeExportValue(r.clockIn), normalizeExportValue(r.clockOut),
          normalizeExportValue(r.inLocation), normalizeExportValue(r.outLocation), normalizeExportValue(r.whyOut),
        ]),
        startY: 42,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [10, 61, 98], textColor: 255, fontStyle: 'bold' },
      });

      const tp = doc.internal.getNumberOfPages();
      for (let i = 1; i <= tp; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(160, 174, 192);
        doc.text(`Page ${i} of ${tp}  |  KMFRI Attendance System  |  Confidential`, pw / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
      }

      doc.save(`KMFRI_${stats.department || 'Dept'}_Clocking_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Department export error', err);
    } finally { setRecordsExporting(false); }
  };

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
          Loading Analytics
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
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape" });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();

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
        ["OT Hrs", stats.totalOvertime],
        ["Avg Attendance", avgAttendance + "%"],
      ]

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
        head: [["#", "Name", "Station", "Hours", "Overtime", "Attendance", "Outside", "Open",]],
        body: sortedEmployees.slice(0, 50).map((e, i) => [
          i + 1,
          e.name,
          e.station,
          e.hours,
          e.overtime,
          e.attendanceRate,
          e.outsideClockingCount || 0,
          e.openSessions || 0,
        ]),
        headStyles: {
          fillColor: [10, 61, 98],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        bodyStyles: { fontSize: 8, textColor: [40, 60, 80] },
        alternateRowStyles: { fillColor: [240, 245, 252] },
        didParseCell(data) {
          if (data.column.index === 10 && data.section === "body") {
            const v = data.cell.raw;
            if (v === "High") data.cell.styles.textColor = [181, 42, 28];
            if (v === "Moderate") data.cell.styles.textColor = [154, 107, 0];
            if (v === "Low") data.cell.styles.textColor = [28, 122, 86];
          }
        },
      });


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



  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // reset to first page when rows per page changes
  };

  const handleRecChangePage = (event, newPage) => setRecPage(newPage);
  const handleRecChangeRowsPerPage = (event) => { setRecRowsPerPage(parseInt(event.target.value, 10)); setRecPage(0); };

  const filteredDeptRecords = !recSearch
    ? deptRecords
    : deptRecords.filter(r => {
      const s = recSearch.toLowerCase();
      return (
        String(r.name || '').toLowerCase().includes(s) ||
        String(r.inLocation || '').toLowerCase().includes(s) ||
        String(r.outLocation || '').toLowerCase().includes(s) ||
        String(r.whyOut || '').toLowerCase().includes(s) ||
        String(r.date || '').toLowerCase().includes(s)
      );
    });

  const paginatedDeptRecords = filteredDeptRecords.slice(recPage * recRowsPerPage, recPage * recRowsPerPage + recRowsPerPage);

  // Slice the data for the current page
  const paginatedEmployees = sortedEmployees.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
          borderRadius: 2,
          px: { xs: 2.5, md: 4 },
          pt: 4,
          pb: 3,
          color: T.white,
        }}
      >
        {/* First row: Title + Download */}
        <Grid container spacing={2} alignItems="flex-end" sx={{ mb: 3 }}>
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
            <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.75)" }}>
              {stats.totalStaff} Members
            </Typography>
          </Grid>
          <Grid
            item
            xs={12}
            md={4}
            display="flex"
            gap={1.5}
            justifyContent={{ xs: "flex-start", md: "flex-end" }}
          >
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

          </Grid>
        </Grid>

        <Grid container spacing={2} alignItems="center">

          <Grid item xs={6} sm={3} md={2}>
            <StatChip
              label="Outside Clockings"
              value={stats.outsideClockingCount || 0}
              icon={<LocationOn fontSize="small" />}
              color="#7BC5AE"
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <StatChip
              label="Present Days"
              value={stats.presentDays || 0}
              icon={<CheckCircleOutline fontSize="small" />}
              color="#A5D6A5"
            />
          </Grid>
        </Grid>

        {/* Optional third row: Average timings + Today's snapshot */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6}>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                ⏱️ Avg Clock‑In: {stats.avgClockIn || "—"}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                🕒 Avg Clock‑Out: {stats.avgClockOut || "—"}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} textAlign={{ xs: "left", sm: "right" }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 'bold' }}>
              📅 Today: {stats.today?.clockIns || 0} clock‑ins, &nbsp;
              {stats.today?.present || 0} present
            </Typography>
          </Grid>
        </Grid>
      </Box>


      {/* ════ PAGE CONTENT ════ */}
      <Box px={{ xs: 2.5, md: 4 }} mt={3.5}>

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
            🏆 Top {topPerformers?.length} Performers
          </Typography>
          <Grid container spacing={2.5}>
            {topPerformers.map((emp, index) => {
              const medals = ["🥇", "🥈", "🥉", "🏅"];
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

                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* ── EMPLOYEE RECORDS TABLE ── */}
        <Box mb={4}>
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
                    <MenuItem value="hours">Sort by Hours</MenuItem>
                    <MenuItem value="outside">Sort by Outside</MenuItem>
                    <MenuItem value="open">Sort by Open Sessions</MenuItem>
                  </TextField>

                  {/* ── BUTTON EXPORT ── */}
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
                      {exporting ? "Generating…" : "Export Report"}
                    </Button>
                  </Box>
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
                    <TableCell align="right" sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Overtime</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Attendance</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Present</TableCell>

                    <TableCell align="center" sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Outside</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Open</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedEmployees.map((emp, idx) => (
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

                        <TableCell align="right" sx={{ fontSize: 13, color: T.seafoamGreen, fontWeight: 600 }}>
                          {emp.presentCount || 0}
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: 13, color: (emp.outsideClockingCount || 0) > 0 ? T.oceanBlue : T.charcoal, fontWeight: 700 }}>
                          {emp.outsideClockingCount || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: 13, color: (emp.openSessions || 0) > 0 ? T.seafoamGreen : T.charcoal, fontWeight: 700 }}>
                          {emp.openSessions || 0}
                        </TableCell>

                      </TableRow>
                    </MuiTooltip>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 50, 100,]}
              component="div"
              count={sortedEmployees.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                borderBottom: 'none',
                background: T.cloudWhite,
                '.MuiTablePagination-toolbar': {
                  minHeight: '48px',
                },
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  fontSize: '0.75rem',
                  color: T.charcoal,
                },
              }}
            />
          </Card>
        </Box>

        {/* ── DEPARTMENT CLOCKING RECORDS (Supervisor) ── */}
        <Box mb={4}>
          <Card elevation={0} sx={{ border: `1px solid ${T.softGray}`, borderRadius: "14px", overflow: "hidden" }}>
            <Box sx={{ px: 3, pt: 2.5, pb: 1.5, background: T.white }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
                <Typography sx={{ fontWeight: 700, fontSize: 16, color: T.deepNavy }}>
                  📋 Department Clocking Records
                </Typography>
                <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
                  <TextField size="small" placeholder="Search name or location..." value={recSearch} onChange={e => { setRecSearch(e.target.value); setRecPage(0); }} sx={{ minWidth: 220 }} />
                  <Box display="flex" justifyContent="center" gap={2}>
                    <Button
                      variant="contained"
                      onClick={handleExportClockingPDF}
                      disabled={recordsExporting || recordsLoading}
                      startIcon={<Download />}
                      sx={{
                        background: colorPalette.oceanGradient,
                        color: T.white,
                        fontWeight: 700,
                        fontSize: 13,
                        textTransform: 'none',
                        borderRadius: '10px',
                        px: 3.5,
                        py: 1.2,
                      }}
                    >
                      {recordsExporting ? 'Generating…' : 'Export Records'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>

            <TableContainer sx={{ maxHeight: '520px', overflowY: 'auto' }}>
              <Table stickyHeader>
                <TableHead sx={{ background: T.softGray }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Clock In</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Clock Out</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>In Location</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Out Location</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Why Out</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recordsLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>{Array.from({ length: 7 }).map((__, j) => <TableCell key={j}><CircularProgress size={18} /></TableCell>)}</TableRow>
                    ))
                  ) : paginatedDeptRecords.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>No records available</TableCell></TableRow>
                  ) : (
                    paginatedDeptRecords.map((r, idx) => (
                      <TableRow key={idx} sx={{ background: idx % 2 === 0 ? T.white : T.cloudWhite }}>
                        <TableCell sx={{ fontSize: 13, color: T.deepNavy, fontWeight: 700 }}>{r.name}</TableCell>
                        <TableCell sx={{ fontSize: 13, color: T.deepNavy }}>{r.date}</TableCell>
                        <TableCell sx={{ fontSize: 13, color: T.charcoal }}>{r.clockIn}</TableCell>
                        <TableCell sx={{ fontSize: 13, color: T.charcoal }}>{r.clockOut}</TableCell>
                        <TableCell sx={{ fontSize: 13, color: T.charcoal, whiteSpace: 'normal', maxWidth: 260 }}>{r.inLocation}</TableCell>
                        <TableCell sx={{ fontSize: 13, color: T.charcoal, whiteSpace: 'normal', maxWidth: 260 }}>{r.outLocation}</TableCell>
                        <TableCell sx={{ fontSize: 13, color: T.charcoal, whiteSpace: 'normal', maxWidth: 260 }}>{r.whyOut}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={filteredDeptRecords.length}
              rowsPerPage={recRowsPerPage}
              page={recPage}
              onPageChange={handleRecChangePage}
              onRowsPerPageChange={handleRecChangeRowsPerPage}
              sx={{ borderBottom: 'none', background: T.cloudWhite }}
            />
          </Card>
        </Box>


        {/* ── KPI CARDS ── */}
        <Grid container spacing={2.5} mb={4}>
          {[
            { label: "Total Staff", value: stats.totalStaff, icon: "👥", accent: T.oceanBlue, subtext: "Active this month" },
            { label: "Hours Worked", value: stats.totalHours, icon: "⏱", accent: T.seafoamGreen, subtext: "Dept total" },
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
      </Box>
    </Box>
  );
};

export default SupervisorDeptStats;
