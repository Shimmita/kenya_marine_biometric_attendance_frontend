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
import { fetchDepartmentLeaves, updateLeaveAdmin } from "../../../service/LeaveService";
import coreDataDetails from "../../CoreDataDetails";

const { colorPalette } = coreDataDetails;

/* ─── Design tokens ──────────────────────────────────────────────────── */
const STATUS = {
    approved: {
        color: colorPalette.seafoamGreen ?? "#22c55e",
        bg: "#f0fdf4",
        border: "#bbf7d0",
        icon: <CheckRounded sx={{ fontSize: 13 }} />,
        label: "Approved",
    },
    pending: {
        color: colorPalette.warmSand ?? "#f59e0b",
        bg: "#fffbeb",
        border: "#fde68a",
        icon: <HourglassTopRounded sx={{ fontSize: 13 }} />,
        label: "Pending",
    },
    rejected: {
        color: colorPalette.coralSunset ?? "#ef4444",
        bg: "#fff1f2",
        border: "#fecdd3",
        icon: <CloseRounded sx={{ fontSize: 13 }} />,
        label: "Rejected",
    },
};

const st = (status) => STATUS[status] ?? STATUS.pending;

function initials(name = "") {
    return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

/* ─── Summary bar ────────────────────────────────────────────────────── */
function DeptSummaryBar({ leaves }) {
    const counts = { all: leaves.length, pending: 0, approved: 0, rejected: 0 };
    leaves.forEach((l) => { if (counts[l.status] !== undefined) counts[l.status]++; });

    return (
        <Stack direction="row" spacing={1.5} sx={{ mb: 3, flexWrap: "wrap", gap: 1.5 }}>
            {[
                { label: "Total Requests", value: counts.all, color: colorPalette.oceanBlue ?? "#3b82f6" },
                { label: "Awaiting Review", value: counts.pending, color: STATUS.pending.color },
                { label: "Approved", value: counts.approved, color: STATUS.approved.color },
                { label: "Rejected", value: counts.rejected, color: STATUS.rejected.color },
            ].map((item) => (
                <Box
                    key={item.label}
                    sx={{
                        flex: "1 1 90px",
                        minWidth: 90,
                        p: "10px 14px",
                        borderRadius: 3,
                        bgcolor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 0.3,
                    }}
                >
                    <Typography variant="h5" fontWeight={900} sx={{ color: item.color, lineHeight: 1.1 }}>
                        {item.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700, fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: 0.8, textAlign: "center" }}>
                        {item.label}
                    </Typography>
                </Box>
            ))}
        </Stack>
    );
}

/* ─── Reliever badge ─────────────────────────────────────────────────── */
function RelieverBadge({ reliever }) {
    if (!reliever) return null;
    return (
        <Stack direction="row" spacing={0.75} alignItems="center"
            sx={{ px: 1.25, py: 0.75, borderRadius: 2, bgcolor: "#f0f4ff", border: "1px solid #c7d7fd", display: "inline-flex" }}
        >
            <PersonRounded sx={{ fontSize: "0.75rem", color: "#6366f1" }} />
            <Typography variant="caption" fontWeight={700} sx={{ color: "#4f46e5", fontSize: "0.7rem" }}>
                Reliever: {reliever}
            </Typography>
        </Stack>
    );
}

/* ─── Single Leave Card ──────────────────────────────────────────────── */
function SupervisorLeaveCard({ req, calculateDays, onViewFile, onConfirm }) {
    const status = st(req.status);

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 3,
                border: "1px solid #e8edf2",
                borderLeft: `4px solid ${status.color}`,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                transition: "box-shadow 0.2s, transform 0.2s",
                "&:hover": { transform: "translateY(-2px)", boxShadow: "0 10px 28px rgba(0,0,0,0.07)" },
            }}
        >
            <CardContent sx={{ p: 2.5, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                {/* ── Staff header ── */}
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.75 }}>
                    <Avatar
                        sx={{
                            width: 38, height: 38,
                            bgcolor: `${status.color}18`,
                            color: status.color,
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            border: `2px solid ${status.color}33`,
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
                    {/* Status chip */}
                    <Chip
                        icon={status.icon}
                        label={status.label}
                        size="small"
                        sx={{
                            ml: "auto !important",
                            flexShrink: 0,
                            bgcolor: status.bg,
                            color: status.color,
                            border: `1px solid ${status.border}`,
                            fontWeight: 800,
                            fontSize: "0.6rem",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            borderRadius: 1.5,
                            "& .MuiChip-icon": { color: status.color, ml: 0.5 },
                        }}
                    />
                </Stack>

                {/* ── Dept + station ── */}
                <Stack direction="row" spacing={0.75} flexWrap="wrap" gap={0.75} sx={{ mb: 1.75 }}>
                    <Chip
                        label={req.department}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.62rem", height: 20, borderRadius: 1.5, fontWeight: 700, borderColor: "#e2e8f0", color: "#64748b" }}
                    />
                    <Chip
                        label={req.station}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.62rem", height: 20, borderRadius: 1.5, fontWeight: 700, borderColor: "#e2e8f0", color: "#64748b" }}
                    />
                </Stack>

                <Divider sx={{ mb: 2, borderStyle: "dashed", borderColor: "#f1f5f9" }} />

                {/* ── Type + duration ── */}
                <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 800, fontSize: "0.58rem", letterSpacing: 0.8, display: "block", mb: 0.4 }}>
                            LEAVE TYPE
                        </Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ textTransform: "capitalize", fontSize: "0.8rem", color: colorPalette.deepNavy ?? "#0f172a" }}>
                            {req.type}
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 800, fontSize: "0.58rem", letterSpacing: 0.8, display: "block", mb: 0.4 }}>
                            TOTAL DAYS
                        </Typography>
                        <Typography variant="body2" fontWeight={800} sx={{ fontSize: "0.8rem", color: status.color }}>
                            {calculateDays(req.startDate, req.endDate)} days
                        </Typography>
                    </Grid>
                </Grid>

                {/* ── Date range ── */}
                <Box
                    sx={{
                        p: 1.25, mb: 2, borderRadius: 2,
                        bgcolor: "#f8fafc", border: "1px solid #eef2f6",
                    }}
                >
                    <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 800, fontSize: "0.58rem", letterSpacing: 0.8, display: "block", mb: 0.5 }}>
                        DATE RANGE
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.78rem" }}>
                            {new Date(req.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </Typography>
                        <Typography sx={{ color: "#cbd5e1", fontWeight: 900, fontSize: "0.75rem" }}>→</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.78rem" }}>
                            {new Date(req.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </Typography>
                    </Stack>
                </Box>

                {/* ── Reliever ── */}
                {req.reliever && (
                    <Box sx={{ mb: 2 }}>
                        <RelieverBadge reliever={req.reliever} />
                    </Box>
                )}

                {/* ── Remarks ── */}
                <Box
                    sx={{
                        mb: 2.5, flexGrow: 1, p: 1.5,
                        bgcolor: "#fffdf8",
                        borderRadius: 2,
                        border: "1px solid #fde68a44",
                        borderLeft: `3px solid ${status.color}55`,
                    }}
                >
                    <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 800, fontSize: "0.58rem", letterSpacing: 0.8, display: "block", mb: 0.5 }}>
                        REMARKS
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
                        size="small"
                        variant="outlined"
                        disableElevation
                        startIcon={<VisibilityRounded sx={{ fontSize: "0.9rem !important" }} />}
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
                        }}
                    >
                        {req.attachment ? "View Attachment" : "No Document Attached"}
                    </Button>

                    {req.status === "pending" && (
                        <Stack direction="row" spacing={1}>
                            <Button
                                fullWidth
                                variant="contained"
                                disableElevation
                                startIcon={<CheckRounded sx={{ fontSize: "0.9rem !important" }} />}
                                onClick={() => onConfirm(req._id, "approved")}
                                sx={{
                                    bgcolor: "#22c55e", borderRadius: 2,
                                    textTransform: "none", fontWeight: 700, fontSize: "0.78rem",
                                    "&:hover": { bgcolor: "#16a34a" },
                                }}
                            >
                                Approve
                            </Button>
                            <Button
                                fullWidth
                                variant="outlined"
                                disableElevation
                                startIcon={<CloseRounded sx={{ fontSize: "0.9rem !important" }} />}
                                onClick={() => onConfirm(req._id, "rejected")}
                                sx={{
                                    borderRadius: 2, textTransform: "none", fontWeight: 700, fontSize: "0.78rem",
                                    borderColor: "#fecdd3", color: "#ef4444",
                                    "&:hover": { bgcolor: "#fff1f2", borderColor: "#ef4444" },
                                }}
                            >
                                Reject
                            </Button>
                        </Stack>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}

/* ─── Main component ─────────────────────────────────────────────────── */
export default function SupervisorLeaveManager() {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(false);
    const [confirmation, setConfirmation] = useState({ open: false, leaveId: "", action: "" });
    const [viewFile, setViewFile] = useState(null);
    const [fileType, setFileType] = useState("");

    const loadLeaves = async () => {
        setLoading(true);
        try {
            const data = await fetchDepartmentLeaves();
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

    return (
        <Box sx={{ width: "100%", maxWidth: 1400, mx: "auto", p: { xs: 1.5, sm: 2.5 } }}>
            <Card
                elevation={0}
                sx={{
                    borderColor:'divider',
                    borderRadius: 4,
                    border: "1px solid",
                    background: "linear-gradient(160deg, #ffffff 0%, #f8faff 100%)",
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
                                        bgcolor: colorPalette.seafoamGreen ?? "#22c55e",
                                        flexShrink: 0,
                                    }}
                                />
                                <Typography variant="h6" fontWeight={900} color={colorPalette.deepNavy ?? "#0f172a"} sx={{ letterSpacing: -0.3 }}>
                                    Department Leave Requests
                                </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ ml: "20px" }}>
                                Review and action leave requests within your department
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
                    <DeptSummaryBar leaves={leaveRequests} />

                    {/* ── Tabs ── */}
                    <Tabs
                        value={filter}
                        onChange={(_, v) => setFilter(v)}
                        textColor="primary"
                        indicatorColor="primary"
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            mb: 0.5, minHeight: 40,
                            "& .MuiTab-root": { textTransform: "none", fontWeight: 700, minHeight: 40, py: 0.5 },
                            "& .MuiTabs-indicator": { borderRadius: 2, height: 3 },
                        }}
                    >
                        {[
                            { label: "All", value: "all" },
                            { label: "Pending", value: "pending" },
                            { label: "Approved", value: "approved" },
                            { label: "Rejected", value: "rejected" },
                        ].map((t) => (
                            <Tab key={t.value} label={t.label} value={t.value} />
                        ))}
                    </Tabs>
                    <Divider sx={{ mb: 2.5 }} />

                    {/* ── Cards ── */}
                    {filteredLeaves.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 9, opacity: 0.55 }}>
                            <Typography variant="h6" fontWeight={700}>No leave requests</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>There are no requests matching this filter.</Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2.5}>
                            {filteredLeaves.map((req) => (
                                <Grid item xs={12} md={6} lg={4} key={req._id}>
                                    <SupervisorLeaveCard
                                        req={req}
                                        calculateDays={calculateDays}
                                        onViewFile={handleViewFile}
                                        onConfirm={(id, action) => setConfirmation({ open: true, leaveId: id, action })}
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
                            borderRadius: 2, textTransform: "none", fontWeight: 700,
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
                <DialogContent dividers sx={{ height: "70vh", p: 0, display: "flex", justifyContent: "center", bgcolor: "#f1f5f9" }}>
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