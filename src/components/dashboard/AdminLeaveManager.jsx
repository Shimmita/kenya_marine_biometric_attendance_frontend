import { CheckRounded, CloseRounded, DownloadRounded, HourglassTopRounded, PersonRounded, VisibilityRounded } from "@mui/icons-material";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    Grid,
    Stack,
    Tab,
    Tabs,
    Typography
} from "@mui/material";
import { useEffect, useState } from "react";
import { fetchAllLeavesAdmin, updateLeaveAdmin } from "../../service/LeaveService";
import coreDataDetails from "../CoreDataDetails";

const { colorPalette } = coreDataDetails;

/* ─── Design tokens (extend KEMFRI palette) ─────────────────────────── */
const STATUS = {
    approved: {
        color: colorPalette.seafoamGreen ?? "#22c55e",
        bg: "#f0fdf4",
        border: "#bbf7d0",
        icon: <CheckRounded sx={{ fontSize: 13 }} />,
    },
    pending: {
        color: colorPalette.warmSand ?? "#f59e0b",
        bg: "#fffbeb",
        border: "#fde68a",
        icon: <HourglassTopRounded sx={{ fontSize: 13 }} />,
    },
    rejected: {
        color: colorPalette.coralSunset ?? "#ef4444",
        bg: "#fff1f2",
        border: "#fecdd3",
        icon: <CloseRounded sx={{ fontSize: 13 }} />,
    },
};

const statusOf = (s) => STATUS[s] ?? STATUS.pending;

function initials(name = "") {
    return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

/* ─── Stat summary bar ───────────────────────────────────────────────── */
function SummaryBar({ leaves }) {
    const counts = { all: leaves.length, pending: 0, approved: 0, rejected: 0 };
    leaves.forEach((l) => { if (counts[l.status] !== undefined) counts[l.status]++; });

    const items = [
        { label: "Total", value: counts.all, color: colorPalette.oceanBlue ?? "#3b82f6" },
        { label: "Pending", value: counts.pending, color: STATUS.pending.color },
        { label: "Approved", value: counts.approved, color: STATUS.approved.color },
        { label: "Rejected", value: counts.rejected, color: STATUS.rejected.color },
    ];

    return (
        <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: "wrap", gap: 1.5 }}>
            {items.map((it) => (
                <Box
                    key={it.label}
                    sx={{
                        flex: "1 1 80px",
                        minWidth: 80,
                        borderRadius: 3,
                        p: "10px 16px",
                        bgcolor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        textAlign: "center",
                    }}
                >
                    <Typography variant="h5" fontWeight={900} sx={{ color: it.color, lineHeight: 1.1 }}>
                        {it.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", fontSize: "0.6rem", letterSpacing: 1 }}>
                        {it.label}
                    </Typography>
                </Box>
            ))}
        </Stack>
    );
}

/* ─── Single Leave Card ──────────────────────────────────────────────── */
function LeaveCard({ req, calculateDays, onViewFile, onConfirm, readOnly = false }) {
    const st = statusOf(req.status);

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 3,
                border: "1px solid",
                height: "100%",
                borderColor:'divider',
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                transition: "box-shadow 0.2s, transform 0.2s",
                "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
                },
            }}
        >
            {/* Colour accent bar */}
            <Box sx={{ height: 4, bgcolor: st.color, flexShrink: 0 }} />

            <CardContent sx={{ p: 2.5, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                {/* ── User row ── */}
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <Avatar
                        sx={{
                            width: 40, height: 40,
                            bgcolor: `${st.color}22`,
                            color: st.color,
                            fontWeight: 800,
                            fontSize: "0.8rem",
                            border: `2px solid ${st.color}44`,
                        }}
                    >
                        {req.avatar ? (
                            <Box component="img" src={req.avatar} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            initials(req.name)
                        )}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={800} color={colorPalette.deepNavy ?? "#0f172a"} noWrap>
                            {req.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                            {req.email}
                        </Typography>
                    </Box>
                    {/* Status badge — pushed to the right */}
                    <Box sx={{ ml: "auto !important", flexShrink: 0 }}>
                        <Chip
                            icon={st.icon}
                            label={req.status}
                            size="small"
                            sx={{
                                bgcolor: st.bg,
                                color: st.color,
                                border: `1px solid ${st.border}`,
                                fontWeight: 800,
                                fontSize: "0.65rem",
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                borderRadius: 1.5,
                                "& .MuiChip-icon": { color: st.color, ml: 0.5 },
                            }}
                        />
                    </Box>
                </Stack>

                {/* ── Dept / station tags ── */}
                <Stack direction="row" spacing={0.75} flexWrap="wrap" gap={0.75} sx={{ mb: 2 }}>
                    <Chip
                        icon={<PersonRounded sx={{ fontSize: "0.7rem !important" }} />}
                        label={req.department}
                        size="small"
                        sx={{ bgcolor: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: "0.65rem", borderRadius: 1.5, border: "1px solid #e2e8f0", height: 22 }}
                    />
                    <Chip
                        label={req.station}
                        size="small"
                        sx={{ bgcolor: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: "0.65rem", borderRadius: 1.5, border: "1px solid #e2e8f0", height: 22 }}
                    />
                </Stack>

                {/* ── Info grid ── */}
                <Box
                    sx={{
                        borderRadius: 2,
                        border: "1px solid #eef2f6",
                        overflow: "hidden",
                        mb: 2,
                    }}
                >
                    <Stack direction="row" divider={<Divider orientation="vertical" flexItem />}>
                        <Box sx={{ flex: 1, p: 1.25 }}>
                            <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 800, fontSize: "0.58rem", letterSpacing: 0.8, display: "block", mb: 0.4 }}>
                                LEAVE TYPE
                            </Typography>
                            <Typography variant="body2" fontWeight={700} sx={{ textTransform: "capitalize", fontSize: "0.8rem", color: colorPalette.deepNavy ?? "#0f172a" }}>
                                {req.type}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1, p: 1.25 }}>
                            <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 800, fontSize: "0.58rem", letterSpacing: 0.8, display: "block", mb: 0.4 }}>
                                DURATION
                            </Typography>
                            <Typography variant="body2" fontWeight={800} sx={{ fontSize: "0.8rem", color: st.color }}>
                                {calculateDays(req.startDate, req.endDate)} days
                            </Typography>
                        </Box>
                    </Stack>
                    <Divider />
                    <Box sx={{ px: 1.25, py: 1, bgcolor: "#f8fafc" }}>
                        <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 800, fontSize: "0.58rem", letterSpacing: 0.8, display: "block", mb: 0.4 }}>
                            DATE RANGE
                        </Typography>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.78rem" }}>
                                {new Date(req.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            </Typography>
                            <Typography sx={{ color: "#cbd5e1", fontWeight: 900, fontSize: "0.7rem" }}>→</Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.78rem" }}>
                                {new Date(req.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            </Typography>
                        </Stack>
                    </Box>
                </Box>

                {/* ── Remarks ── */}
                <Box
                    sx={{
                        mb: 2.5,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: "#f8fafc",
                        border: "1px solid #eef2f6",
                        borderLeft: `3px solid ${st.color}66`,
                        flexGrow: 1,
                    }}
                >
                    <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 800, fontSize: "0.58rem", letterSpacing: 0.8, display: "block", mb: 0.5 }}>
                        STAFF REMARKS
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ fontSize: "0.78rem", color: "#475569", fontStyle: req.remarks ? "normal" : "italic", lineHeight: 1.5 }}
                    >
                        {req.remarks || "No remarks provided."}
                    </Typography>
                </Box>

                {/* ── Actions ── */}
                <Stack spacing={1} sx={{ mt: "auto" }}>
                    <Button
                        fullWidth
                        disableElevation
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityRounded sx={{ fontSize: "0.95rem !important" }} />}
                        onClick={() => onViewFile(req.attachment)}
                        disabled={!req.attachment}
                        sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.78rem",
                            borderColor: "#e2e8f0",
                            color: "#64748b",
                            "&:hover": { borderColor: colorPalette.oceanBlue, color: colorPalette.oceanBlue, bgcolor: `${colorPalette.oceanBlue}08` },
                            "&.Mui-disabled": { bgcolor: "#f8fafc" },
                        }}
                    >
                        {req.attachment ? "Review Documentation" : "No Document Attached"}
                    </Button>

                    {req.status === "pending" && !readOnly && (
                        <Stack direction="row" spacing={1}>
                            <Button
                                fullWidth
                                disableElevation
                                variant="contained"
                                startIcon={<CheckRounded sx={{ fontSize: "0.9rem !important" }} />}
                                onClick={() => onConfirm(req._id, "approved")}
                                sx={{
                                    bgcolor: "#22c55e",
                                    borderRadius: 2,
                                    textTransform: "none",
                                    fontWeight: 700,
                                    fontSize: "0.78rem",
                                    "&:hover": { bgcolor: "#16a34a" },
                                }}
                            >
                                Approve
                            </Button>
                            <Button
                                fullWidth
                                disableElevation
                                variant="outlined"
                                startIcon={<CloseRounded sx={{ fontSize: "0.9rem !important" }} />}
                                onClick={() => onConfirm(req._id, "rejected")}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: "none",
                                    fontWeight: 700,
                                    fontSize: "0.78rem",
                                    borderColor: "#fecdd3",
                                    color: "#ef4444",
                                    "&:hover": { bgcolor: "#fff1f2", borderColor: "#ef4444" },
                                }}
                            >
                                Reject
                            </Button>
                        </Stack>
                    )}
                    {req.status === "pending" && readOnly && (
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>
                                Read-Only Access — Actions Disabled
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}

/* ─── Main component ─────────────────────────────────────────────────── */
export default function AdminLeaveManager({ readOnly = false }) {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(false);
    const [confirmation, setConfirmation] = useState({ open: false, leaveId: "", action: "" });
    const [viewFile, setViewFile] = useState(null);
    const [fileType, setFileType] = useState("");

    const loadLeaves = async () => {
        setLoading(true);
        try {
            const data = await fetchAllLeavesAdmin();
            setLeaveRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load leaves:", err);
            setLeaveRequests([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadLeaves(); }, []);

    const calculateDays = (start, end) => {
        if (!start || !end) return 0;
        return Math.ceil((new Date(end) - new Date(start)) / 86_400_000) + 1;
    };

    const filteredLeaves = filter === "all"
        ? leaveRequests
        : leaveRequests.filter((l) => l.status === filter);

    const handleStatusChange = async (id, action) => {
        try {
            await updateLeaveAdmin(id, { status: action });
            loadLeaves();
        } catch (err) {
            alert(err || "Failed to update leave");
        } finally {
            setConfirmation({ open: false, leaveId: "", action: "" });
        }
    };

    const handleViewFile = (base64Data) => {
        if (!base64Data) return;
        setFileType(base64Data.includes("application/pdf") ? "pdf" : "image");
        setViewFile(base64Data);
    };

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = viewFile;
        link.download = `leave_attachment_${Date.now()}.${fileType === "pdf" ? "pdf" : "png"}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const TABS = [
        { label: "All", value: "all" },
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
    ];

    return (
        <Box sx={{ width: "100%", maxWidth: 1400, mx: "auto", p: { xs: 1.5, sm: 2.5 } }}>
            {/* ── Page card ── */}
            <Card
                elevation={0}
                sx={{
                    borderRadius: 4,
                    border: "1px solid #e8edf2",
                    background: "linear-gradient(160deg, #ffffff 0%, #f8faff 100%)",
                    overflow: "visible",
                }}
            >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    {/* ── Header ── */}
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        spacing={2}
                        sx={{ mb: 2.5 }}
                    >
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                                <Box
                                    sx={{
                                        width: 4, height: 28, borderRadius: 2,
                                        bgcolor: colorPalette.oceanBlue ?? "#3b82f6",
                                        flexShrink: 0,
                                    }}
                                />
                                <Typography variant="h6" fontWeight={900} color={colorPalette.deepNavy ?? "#0f172a"} sx={{ letterSpacing: -0.3 }}>
                                    Leave Request Management
                                </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ ml: "20px" }}>
                                Review and action leave requests from all staff
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            onClick={loadLeaves}
                            disabled={loading}
                            disableElevation
                            sx={{
                                bgcolor: colorPalette.oceanBlue ?? "#3b82f6",
                                borderRadius: 3,
                                textTransform: "none",
                                fontWeight: 700,
                                px: 3,
                                "&:hover": { bgcolor: colorPalette.oceanBlue, filter: "brightness(0.92)" },
                            }}
                        >
                            {loading ? "Loading…" : "Refresh"}
                        </Button>
                    </Stack>

                    {/* ── Summary bar ── */}
                    <SummaryBar leaves={leaveRequests} />

                    {/* ── Tabs ── */}
                    <Tabs
                        value={filter}
                        onChange={(_, v) => setFilter(v)}
                        textColor="primary"
                        indicatorColor="primary"
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            mb: 0.5,
                            minHeight: 40,
                            "& .MuiTab-root": { textTransform: "none", fontWeight: 700, minHeight: 40, py: 0.5 },
                            "& .MuiTabs-indicator": { borderRadius: 2, height: 3 },
                        }}
                    >
                        {TABS.map((t) => (
                            <Tab
                                key={t.value}
                                label={t.label}
                                value={t.value}
                                sx={{ color: t.value !== "all" ? statusOf(t.value).color : undefined }}
                            />
                        ))}
                    </Tabs>
                    <Divider sx={{ mb: 2.5 }} />

                    {/* ── Cards grid / empty ── */}
                    {filteredLeaves.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 10, opacity: 0.55 }}>
                            <Typography variant="body1" fontWeight={700}>No leave records for this view.</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>Try switching tabs or refreshing the list.</Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2.5}>
                            {filteredLeaves.map((req) => (
                                <Grid item xs={12} md={6} lg={4} key={req._id}>
                                    <LeaveCard
                                        req={req}
                                        calculateDays={calculateDays}
                                        onViewFile={handleViewFile}
                                        onConfirm={(id, action) => setConfirmation({ open: true, leaveId: id, action })}
                                        readOnly={readOnly}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </CardContent>
            </Card>

            {/* ── Confirmation dialog ── */}
            <Dialog
                open={confirmation.open}
                onClose={() => setConfirmation({ open: false, leaveId: "", action: "" })}
                PaperProps={{ sx: { borderRadius: 3, minWidth: 340 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Confirm Action</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to{" "}
                        <Box component="span" sx={{ fontWeight: 800, color: confirmation.action === "approved" ? "#22c55e" : "#ef4444" }}>
                            {confirmation.action}
                        </Box>{" "}
                        this leave request?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button
                        onClick={() => setConfirmation({ open: false, leaveId: "", action: "" })}
                        variant="outlined"
                        disableElevation
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, borderColor: "#e2e8f0", color: "#64748b" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleStatusChange(confirmation.leaveId, confirmation.action)}
                        variant="contained"
                        disableElevation
                        sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 700,
                            bgcolor: confirmation.action === "approved" ? "#22c55e" : "#ef4444",
                            "&:hover": { filter: "brightness(0.9)", bgcolor: confirmation.action === "approved" ? "#22c55e" : "#ef4444" },
                        }}
                    >
                        {confirmation.action === "approved" ? "Approve" : "Reject"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Attachment viewer ── */}
            <Dialog
                open={Boolean(viewFile)}
                onClose={() => setViewFile(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800 }}>
                    Attached Document
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<DownloadRounded />}
                        onClick={handleDownload}
                        disableElevation
                        sx={{ bgcolor: colorPalette.oceanBlue, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                    >
                        Download
                    </Button>
                </DialogTitle>
                <DialogContent
                    dividers
                    sx={{ height: "70vh", p: 0, display: "flex", justifyContent: "center", bgcolor: "#f1f5f9" }}
                >
                    {fileType === "pdf" ? (
                        <iframe src={viewFile} width="100%" height="100%" style={{ border: "none" }} title="PDF Preview" />
                    ) : (
                        <Box
                            component="img"
                            src={viewFile}
                            alt="Attachment Preview"
                            sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", p: 2 }}
                        />
                    )}
                </DialogContent>
                <Box sx={{ p: 1.5, textAlign: "right" }}>
                    <Button onClick={() => setViewFile(null)} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
                        Close
                    </Button>
                </Box>
            </Dialog>
        </Box>
    );
}