import {
  AssignmentRounded,
  BarChartRounded,
  BeachAccessRounded,
  Download,
  GroupsRounded,
  LocationOn,
  LoginRounded,
  PersonRounded,
  PlaceRounded,
  ScheduleRounded,
  TravelExploreRounded,
  VerifiedRounded,
  WarningAmberRounded
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Select,
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

const { colorPalette } = coreDataDetails;

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

// ─── Reusable chart card ──────────────────────────────
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
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: `${T.oceanBlue}15`,
            color: T.oceanBlue,
          }}
        >
          {icon}
        </Box>        <Typography sx={{ fontWeight: 700, fontSize: 15, color: T.deepNavy }}>
          {title}
        </Typography>
      </Box>
    </Box>
    <Box sx={{ px: 3, pb: 2.5 }}>
      {children}
    </Box>
  </Card>
);

// ─── Main component ────────────────────────────────────
const SupervisorDeptStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("score");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [deptRecords, setDeptRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsExporting, setRecordsExporting] = useState(false);
  const [recPage, setRecPage] = useState(0);
  const [recRowsPerPage, setRecRowsPerPage] = useState(10);
  const [recSearch, setRecSearch] = useState('');
  const [recRoleFilter, setRecRoleFilter] = useState(''); // '' = All
  const [recStartDate, setRecStartDate] = useState('');
  const [recEndDate, setRecEndDate] = useState('');

  // ─── data fetching ────────────────────────────────────
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

  // Fetch clocking records – enriched with role from employee metrics
  useEffect(() => {
    const loadRecords = async () => {
      if (!stats) return;
      try {
        setRecordsLoading(true);
        const params = {};
        if (stats.station) params.station = stats.station;
        if (stats.department) params.department = stats.department;
        const recs = await fetchOverallAttendanceRecords(params);
        // Build a map email -> role from employeeMetrics
        const roleMap = {};
        (stats.employeeMetrics || []).forEach(emp => {
          if (emp.email) roleMap[emp.email] = emp.role || 'employee';
        });
        const enriched = (recs || []).map(r => {
          const email = r.email || '';
          const role = roleMap[email] || 'employee';
          return {
            email,
            role,
            name: toTitleCase(r.name || r.email || '—'),
            date: new Date(r.clock_in).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }),
            dateObj: new Date(r.clock_in), // for date filtering
            clockIn: new Date(r.clock_in).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
            clockOut: r.clock_out ? new Date(r.clock_out).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) : 'System',
            inLocation: formatLocationLabel(r, true),
            outLocation: formatLocationLabel(r, false),
            whyOut: r.outSideReason ? toTitleCase(r.outSideReason) : "",
          };
        });
        setDeptRecords(enriched);
      } catch (err) {
        console.error('Failed to load department records', err);
      } finally { setRecordsLoading(false); }
    };
    loadRecords();
  }, [stats]);

  // ─── helpers ──────────────────────────────────────────
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

  const normalizeExportValue = (value) => (value == null || value === '' ? '—' : String(value));

  // ─── derived data ─────────────────────────────────────
  const employees = useMemo(() => stats?.employeeMetrics || [], [stats?.employeeMetrics]);
  const topPerformers = useMemo(() => stats?.topPerformers || [], [stats?.topPerformers]);

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

  const outsideClockingData = useMemo(() =>
    employees
      .filter((e) => e.outsideClockingCount > 0 || e.canClockOutside)
      .map((e) => ({
        name: (e.name || "Unknown").split(" ")[0],
        Outside: e.outsideClockingCount || 0,
      })),
    [employees]
  );

  const burnoutCounts = stats?.burnoutCounts || {
    Low: employees.filter(e => e.burnoutLevel === 'Low').length,
    Moderate: employees.filter(e => e.burnoutLevel === 'Moderate').length,
    High: employees.filter(e => e.burnoutLevel === 'High').length,
  };

  // Role breakdown for banner
  const roleCounts = useMemo(() => {
    const counts = { employee: 0, intern: 0, attachee: 0 };
    employees.forEach(e => {
      const role = e.role || 'employee';
      if (counts.hasOwnProperty(role)) counts[role]++;
    });
    return counts;
  }, [employees]);

  // ─── pagination ────────────────────────────────────────
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const handleRecChangePage = (event, newPage) => setRecPage(newPage);
  const handleRecChangeRowsPerPage = (event) => {
    setRecRowsPerPage(parseInt(event.target.value, 10));
    setRecPage(0);
  };

  // Filter clocking records: search, role, date range
  const filteredDeptRecords = useMemo(() => {
    let filtered = [...deptRecords];
    // Search
    if (recSearch) {
      const s = recSearch.toLowerCase();
      filtered = filtered.filter(r =>
        String(r.name || '').toLowerCase().includes(s) ||
        String(r.inLocation || '').toLowerCase().includes(s) ||
        String(r.outLocation || '').toLowerCase().includes(s) ||
        String(r.whyOut || '').toLowerCase().includes(s) ||
        String(r.date || '').toLowerCase().includes(s)
      );
    }
    // Role filter
    if (recRoleFilter) {
      filtered = filtered.filter(r => r.role === recRoleFilter);
    }
    // Date range filter
    if (recStartDate) {
      const start = new Date(recStartDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(r => r.dateObj >= start);
    }
    if (recEndDate) {
      const end = new Date(recEndDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => r.dateObj <= end);
    }
    return filtered;
  }, [deptRecords, recSearch, recRoleFilter, recStartDate, recEndDate]);

  const paginatedDeptRecords = filteredDeptRecords.slice(recPage * recRowsPerPage, recPage * recRowsPerPage + recRowsPerPage);
  const paginatedEmployees = sortedEmployees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // ─── export functions ─────────────────────────────────
  const handleExportClockingPDF = async () => {
    if (!filteredDeptRecords || !stats) return;
    setRecordsExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const exportList = filteredDeptRecords;

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

      const qrSize = 28;
      doc.addImage(qrImage, 'PNG', pw - qrSize - 12, 6, qrSize, qrSize, undefined, 'FAST');

      autoTable(doc, {
        head: [['NAME', 'ROLE', 'DATE', 'CLOCK IN', 'CLOCK OUT', 'IN LOCATION', 'OUT LOCATION', 'WHY OUT']],
        body: exportList.map(r => [
          normalizeExportValue(r.name),
          normalizeExportValue(r.role),
          normalizeExportValue(r.date),
          normalizeExportValue(r.clockIn),
          normalizeExportValue(r.clockOut),
          normalizeExportValue(r.inLocation),
          normalizeExportValue(r.outLocation),
          normalizeExportValue(r.whyOut),
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

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape" });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();

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

      const kpis = [
        ["Staff", stats.totalStaff],
        ["OT Hrs", stats.totalOvertime],
        ["Avg Attendance", (employees.length ? (employees.reduce((s, e) => s + parseFloat(e.attendanceRate || 0), 0) / employees.length) : 0).toFixed(1) + "%"],
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

      autoTable(doc, {
        startY: 62,
        head: [["#", "Name", "Station", "Hours", "Overtime", "Attendance", "Outside", "Open"]],
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
      });

      doc.setFillColor(10, 61, 98);
      doc.rect(0, ph - 10, pw, 10, "F");
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(180, 200, 220);
      doc.text("KMFRI Confidential — For Internal Use Only", pw / 2, ph - 3, { align: "center" });

      doc.save(`KMFRI_${stats.department}_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  // ─── loading & error states ──────────────────────────
  if (loading)
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={400} gap={2}>
        <CircularProgress sx={{ color: T.oceanBlue }} />
        <Typography sx={{ color: T.charcoal, fontSize: 14, opacity: 0.7 }}>Loading Analytics</Typography>
      </Box>
    );

  if (!stats)
    return (
      <Box textAlign="center" mt={6}>
        <Typography sx={{ color: T.charcoal, opacity: 0.7 }}>No department data available.</Typography>
      </Box>
    );

  // ─── KPI data for banner ──────────────────────────────
  const kpiItems = [
    {
      label: "Total Staff",
      value: stats.totalStaff,
      icon: <GroupsRounded fontSize="small" />
    },
    {
      label: "Active Staff",
      value: stats.activeStaffThisMonth || 0,
      icon: <PersonRounded fontSize="small" />
    },
    {
      label: "Hours Worked",
      value: stats.totalHours,
      icon: <ScheduleRounded fontSize="small" />
    },
    {
      label: "Clocked In Now",
      value: stats.clockedInNow || 0,
      icon: <LoginRounded fontSize="small" />
    },
    {
      label: "Outside Clockings",
      value: stats.outsideClockingCount || 0,
      icon: <PlaceRounded fontSize="small" />
    },
    {
      label: "High Burnout",
      value: burnoutCounts.High || 0,
      icon: <WarningAmberRounded fontSize="small" />
    },
    {
      label: "On Leave",
      value: stats.onLeaveCount || 0,
      icon: <BeachAccessRounded fontSize="small" />
    },
    {
      label: "Outside Authorized",
      value: stats.outsideAuthorizedCount || 0,
      icon: <VerifiedRounded fontSize="small" />
    },
  ];

  // ─── render ────────────────────────────────────────────
  return (
    <Box sx={{ background: T.cloudWhite, minHeight: "100vh", pb: 6 }}>

      {/* ── BANNER with KPI chips ── */}
      <Box
        sx={{
          background: colorPalette.oceanGradient,
          borderRadius: 2,
          px: { xs: 2.5, md: 4 },
          pt: 3,
          pb: 2,
          color: T.white,
        }}
      >
        {/* Department, Station, Total, Month */}
        <Grid container alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: 22, md: 28 }, mb: 0.5 }}>
              {stats.department}
            </Typography>
            <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
              {stats.station && (
                <Chip
                  icon={<LocationOn sx={{ color: `${T.white} !important`, fontSize: 16 }} />}
                  label={stats.station}
                  size="small"
                  sx={{ background: "rgba(255,255,255,0.18)", color: T.white, fontWeight: 700 }}
                />
              )}
              <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.85)" }}>
                {stats.totalStaff} Members
              </Typography>
              {/* Role breakdown chips */}
              {Object.entries(roleCounts).map(([role, count]) => (
                <Chip
                  key={role}
                  label={`${role}: ${count}`}
                  size="small"
                  sx={{ background: "rgba(255,255,255,0.12)", color: T.white, fontWeight: 600, fontSize: 11 }}
                />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { xs: "left", md: "right" } }}>
            <Chip
              label={new Date().toLocaleDateString("en-KE", { month: "short", year: "numeric" })}
              size="small"
              sx={{ background: "rgba(255,255,255,0.15)", color: T.white, fontWeight: 600 }}
            />
          </Grid>
        </Grid>

        {/* KPI chips row */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "flex-start" }}>
          {kpiItems.map((kpi) => (
            <Box
              key={kpi.label}
              sx={{
                background: "rgba(255,255,255,0.12)",
                borderRadius: "8px",
                px: 1.5,
                py: 0.8,
                display: "flex",
                alignItems: "center",
                gap: 0.8,
                backdropFilter: "blur(2px)",
                transition: "all 0.2s",
                "&:hover": { background: "rgba(255,255,255,0.22)" },
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "rgba(255,255,255,0.18)",
                  color: T.white,
                  flexShrink: 0,
                }}
              >
                {kpi.icon}
              </Box>              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: T.white, lineHeight: 1.2 }}>
                  {kpi.value}
                </Typography>
                <Typography sx={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                  {kpi.label}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Main content ── */}
      <Box px={{ xs: 2.5, md: 4 }} mt={4}>

        {/* ─── Top Performers Table ─── */}
        {topPerformers.length > 0 && (
          <Box mb={4}>
            <Box display="flex" alignItems="center" gap={1.2} mb={2}>
              <BarChartRounded
                sx={{
                  color: T.seafoamGreen,
                  fontSize: 24,
                }}
              />

              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: T.deepNavy,
                }}
              >
                Top {topPerformers.length} Performers
              </Typography>
            </Box>
            <Card elevation={0} sx={{ border: `1px solid ${T.softGray}`, borderRadius: "14px", overflow: "hidden" }}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ background: T.softGray }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: T.deepNavy }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: T.deepNavy }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: T.deepNavy }}>Station</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: T.deepNavy }}>Hours</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: T.deepNavy }}>Overtime</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: T.deepNavy }}>Attendance</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: T.deepNavy }}>Score</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: T.deepNavy }}>Burnout</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topPerformers.map((emp, idx) => (
                      <TableRow key={emp.email} sx={{ background: idx % 2 === 0 ? T.white : T.cloudWhite }}>
                        <TableCell sx={{ fontWeight: 600 }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: T.deepNavy }}>{emp.name}</TableCell>
                        <TableCell>{emp.station}</TableCell>
                        <TableCell align="right">{emp.hours}h</TableCell>
                        <TableCell align="right" sx={{ color: T.coralSunset }}>{emp.overtime}h</TableCell>
                        <TableCell align="right" sx={{ color: T.oceanBlue }}>{emp.attendanceRate}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{emp.productivityScore?.toFixed(1)}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={emp.burnoutLevel}
                            sFize="small"
                            sx={{
                              background: emp.burnoutLevel === 'High' ? T.coralSunset + '30' : emp.burnoutLevel === 'Moderate' ? T.warmSand + '30' : T.seafoamGreen + '30',
                              color: emp.burnoutLevel === 'High' ? T.coralSunset : emp.burnoutLevel === 'Moderate' ? T.warmSand : T.seafoamGreen,
                              fontWeight: 700,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Box>
        )}


        {/* ─── Clocking Records Table with filters ─── */}
        <Box mb={4}>
          <Card elevation={0} sx={{ border: `1px solid ${T.softGray}`, borderRadius: "14px", overflow: "hidden" }}>
            <Box sx={{ px: 3, pt: 2.5, pb: 1.5, background: T.white }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
                <Box display="flex" alignItems="center" gap={1}>
                  <AssignmentRounded
                    sx={{
                      color: T.oceanBlue,
                      fontSize: 22,
                    }}
                  />

                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: 16,
                      color: T.deepNavy,
                    }}
                  >
                    Clocking Records
                  </Typography>
                </Box>
                <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
                  <TextField
                    size="small"
                    placeholder="Search name or location..."
                    value={recSearch}
                    onChange={e => { setRecSearch(e.target.value); setRecPage(0); }}
                    sx={{ minWidth: 180 }}
                  />
                  <Select
                    size="small"
                    value={recRoleFilter}
                    onChange={e => { setRecRoleFilter(e.target.value); setRecPage(0); }}
                    displayEmpty
                    sx={{ minWidth: 120, background: T.white, borderRadius: "8px" }}
                  >
                    <MenuItem value="">All Roles</MenuItem>
                    <MenuItem value="employee">Employee</MenuItem>
                    <MenuItem value="intern">Intern</MenuItem>
                    <MenuItem value="attachee">Attachee</MenuItem>
                  </Select>
                  <TextField
                    size="small"
                    type="date"
                    label="Start Date"
                    value={recStartDate}
                    onChange={e => { setRecStartDate(e.target.value); setRecPage(0); }}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 150 }}
                  />
                  <TextField
                    size="small"
                    type="date"
                    label="End Date"
                    value={recEndDate}
                    onChange={e => { setRecEndDate(e.target.value); setRecPage(0); }}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 150 }}
                  />
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
            <TableContainer sx={{ maxHeight: '520px', overflowY: 'auto' }}>
              <Table stickyHeader>
                <TableHead sx={{ background: T.softGray }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: T.deepNavy, background: T.softGray }}>Role</TableCell>
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
                      <TableRow key={i}>{Array.from({ length: 8 }).map((__, j) => <TableCell key={j}><CircularProgress size={18} /></TableCell>)}</TableRow>
                    ))
                  ) : paginatedDeptRecords.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}>No records match filters</TableCell></TableRow>
                  ) : (
                    paginatedDeptRecords.map((r, idx) => (
                      <TableRow key={idx} sx={{ background: idx % 2 === 0 ? T.white : T.cloudWhite }}>
                        <TableCell sx={{ fontSize: 13, color: T.deepNavy, fontWeight: 700 }}>{r.name}</TableCell>
                        <TableCell sx={{ fontSize: 13, color: T.charcoal }}>{r.role}</TableCell>
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

        {/* ─── Outside Clocking Chart ─── */}
        {outsideClockingData.length > 0 && (
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12}>
              <ChartCard title="Outside Clocking Usage" icon={<TravelExploreRounded fontSize="small" />}
              >
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