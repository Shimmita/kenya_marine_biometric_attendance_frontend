import { Close, CloudUploadRounded, DownloadRounded, VisibilityRounded } from "@mui/icons-material";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    MenuItem,
    Modal,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography
} from "@mui/material";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { createLeave, deleteLeave, fetchAllLeaves, fetchColleagues } from "../../service/LeaveService";
import coreDataDetails from "../CoreDataDetails";
const { colorPalette } = coreDataDetails;

/* ─────────────────────────────────────────────
   DESIGN TOKENS (Synced with your reference)
───────────────────────────────────────────── */
const C = {
    deepNavy: "#0A3D62",
    oceanBlue: "#005B96",
    aquaVibrant: "#00e5ff",
    cyanFresh: "#3FC1FF",
    skyBlue: "#87CEEB",
    coralSunset: "#FF5C4A",
    warmSand: "#FFB400",
    seafoamGreen: "#48C9B0",
    softGray: "#E8EEF7",
    glassBg: "rgba(10,61,98,0.72)",
    glassBorder: "rgba(0,229,255,0.22)",
    glassInput: "rgba(0,91,150,0.28)",
    textPrimary: "#E6F4FA",
    textSecondary: "rgba(190,228,245,0.80)",
    textMuted: "rgba(190,228,245,0.48)",
    dark: "#05253D",
};

const textFieldSx = {
    "& .MuiOutlinedInput-root": {
        color: C.textPrimary,
        background: C.glassInput,
        borderRadius: "10px",
        "& fieldset": { borderColor: C.glassBorder },
        "&:hover fieldset": { borderColor: C.aquaVibrant },
        "&.Mui-focused fieldset": { borderColor: C.seafoamGreen },
    },
    "& .MuiInputLabel-root": { color: C.textMuted },
    "& .MuiInputLabel-root.Mui-focused": { color: C.seafoamGreen },
    "& .MuiSvgIcon-root": { color: C.cyanFresh },
};

const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { xs: "92%", sm: 500 },
    bgcolor: C.dark,
    border: `1px solid ${C.glassBorder}`,
    boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
    p: 3,
    borderRadius: "20px",
    outline: "none",
    maxHeight: '90vh',
    overflowY: 'auto',
    '&::-webkit-scrollbar': { display: 'none' },
    /* Hide scrollbar for IE, Edge and Firefox */
    msOverflowStyle: "none",
    scrollbarWidth: "none",
};

export default function LeaveManagementContent() {
    const [open, setOpen] = useState(false);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [relievers, setRelievers] = useState([]);
    const [relieversLoading, setRelieversLoading] = useState(false);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(false);
    const [dateError, setDateError] = useState({
        startDate: "",
        endDate: ""
    });
    const [viewFile, setViewFile] = useState(null);
    const [fileType, setFileType] = useState("");

    const today = new Date().toISOString().split("T")[0];

    // redux access user state
    const { user } = useSelector(s => s.currentUser);


    const [formData, setFormData] = useState({
        type: "",
        startDate: "",
        endDate: "",
        email: "",
        reliever: "",
        remarks: "",
        attachment: ""
    });

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        let errors = { ...dateError };
        // file validation logic
        if (name === "attachment" && files[0]) {
            const file = files[0];
            if (file.size > 10 * 1024 * 1024) {
                alert("File is too large. Please select a file under 10MB.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, attachment: reader.result }));
            };
            reader.readAsDataURL(file);
            return;
        }

        if (name === "startDate") {
            if (value < today) {
                errors.startDate = "Start date cannot be in the past";
            } else {
                errors.startDate = "";
            }

            // Reset endDate if invalid
            if (formData.endDate && value > formData.endDate) {
                errors.endDate = "End date cannot be before start date";
            } else {
                errors.endDate = "";
            }
        }

        if (name === "endDate") {
            if (value < formData.startDate) {
                errors.endDate = "End date cannot be before start date";
            } else {
                errors.endDate = "";
            }
        }

        setDateError(errors);
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async () => {
        if (formData.startDate < today) {
            alert("Start date cannot be in the past");
            return;
        }

        if (formData.endDate < formData.startDate) {
            alert("End date cannot be before start date");
            return;
        }

        if (dateError.startDate || dateError.endDate) {
            alert("Please fix date errors before submitting");
            return;
        }

        if (relievers.length > 0 && !formData.reliever) {
            alert("Please select a reliever for your leave");
            return;
        }

        if (formData.attachment === "") {
            alert("Please upload a proof of leave document");
            return;
        }

        try {
            setLoading(true)
            const payload = {
                ...formData,
                email: user?.email
            };


            const response = await createLeave(payload);

            if (!response) {
                throw new Error("No response from server");
            }

            const updated = await fetchAllLeaves();
            setLeaveRequests(Array.isArray(updated) ? updated : []);

            setFormData({
                type: "",
                startDate: "",
                endDate: "",
                email: "",
                reliever: "",
                remarks: "",
                attachment: ""
            });

            setOpen(false);

        } catch (err) {
            console.error("Submit failed:", err);
            alert(typeof err === "string" ? err : "Failed to submit leave");
        } finally {
            setLoading(false)
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchAllLeaves();
                setLeaveRequests(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Fetch failed:", err);
                alert("Failed to load leaves");
                setLeaveRequests([]);
            }
        };

        loadData();
    }, []);

    const calculateDays = (start, end) => {
        if (!start || !end) return 0;
        const diff = new Date(end) - new Date(start);
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    };

    const filteredLeaves =
        filter === "all"
            ? leaveRequests
            : leaveRequests.filter((leave) => leave.status === filter);


    const handleDelete = async (id) => {
        if (!window.confirm("Delete this leave request?")) return;

        try {
            await deleteLeave(id);
            const updated = await fetchAllLeaves();
            setLeaveRequests(updated);
        } catch (err) {
            alert("Failed to delete leave");
        }
    };

    // Function to open the viewer
    const handleViewFile = (base64Data) => {
        if (!base64Data) return;

        // Check if it's a PDF or Image from the Base64 prefix
        if (base64Data.includes("application/pdf")) {
            setFileType("pdf");
        } else {
            setFileType("image");
        }
        setViewFile(base64Data);
    };

    // Function to download the file
    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = viewFile;
        // Set a default filename based on type
        link.download = `attachment_${new Date().getTime()}.${fileType === "pdf" ? "pdf" : "png"}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    // fetch or load relievers from the backend
    useEffect(() => {
        if (open) {
            const loadRelievers = async () => {
                try {
                    setRelieversLoading(true);
                    const data = await fetchColleagues();
                    setRelievers(data);
                } catch (err) {
                    console.error("Failed to load relievers:", err);
                } finally {
                    setRelieversLoading(false);
                }
            };
            loadRelievers();
        }
    }, [open]);

    return (
        <Grid container spacing={3} sx={{
            width: "100%",
            m: 0
        }}>
            <Grid item xs={12} sx={{ width: "100%" }}>
                <Card
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        border: `1px solid ${colorPalette.softGray}`,
                        background: "linear-gradient(to bottom, #ffffff, #fafcff)"
                    }}
                >
                    <CardContent sx={{
                        p: 2
                    }}>

                        {/* HEADER */}
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            spacing={2}
                            sx={{ mb: 3 }}
                        >
                            <Box>
                                <Typography
                                    variant="h6"
                                    fontWeight="800"
                                    color={colorPalette.deepNavy}
                                >
                                    Leave Requests
                                </Typography>

                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.5 }}
                                >
                                    Manage and track your submitted leave applications
                                </Typography>
                            </Box>

                            <Button
                                variant="contained"
                                onClick={() => setOpen(true)}
                                sx={{
                                    bgcolor: colorPalette.oceanBlue,
                                    borderRadius: 3,
                                    textTransform: "none",
                                    fontWeight: 700,
                                    px: 3,
                                    boxShadow: `0 8px 20px ${colorPalette.oceanBlue}30`,
                                    "&:hover": {
                                        bgcolor: colorPalette.oceanBlue
                                    }
                                }}
                            >
                                Request Leave
                            </Button>
                        </Stack>

                        <Divider sx={{ mb: 1 }} />

                        <Box>
                            <Tabs
                                value={filter}
                                onChange={(e, newValue) => setFilter(newValue)}
                                textColor="primary"
                                indicatorColor="primary"
                                sx={{
                                    "& .MuiTab-root": {
                                        textTransform: "none",
                                        fontWeight: 700
                                    }
                                }}
                            >
                                <Tab label="All" value="all" />
                                <Tab label="Pending" value="pending" />
                                <Tab label="Approved" value="approved" />
                                <Tab label="Rejected" value="rejected" />
                            </Tabs>
                        </Box>
                        <Divider sx={{ mb: 1 }} />

                        {/* EMPTY STATE */}
                        {filteredLeaves.length === 0 ? (
                            <Box
                                sx={{
                                    textAlign: "center",
                                    py: 6,
                                    opacity: 0.8
                                }}
                            >
                                <Typography variant="h6" fontWeight={700}>
                                    No Leave Requests Yet
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Click "Request Leave" to submit your first application.
                                </Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                {filteredLeaves.map((req) => (
                                    <Grid item xs={12} md={6} lg={4} key={req._id}>
                                        <Card
                                            variant="outlined"
                                            sx={{
                                                borderRadius: 3,
                                                transition: "0.3s",
                                                "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }
                                            }}
                                        >
                                            <CardContent>
                                                {/* Status Chip & Leave Type */}
                                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight={800} sx={{ textTransform: "capitalize" }}>
                                                            {req.type} Leave
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Submitted on {new Date(req.createdAt).toLocaleDateString()}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={req.status}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 700,
                                                            textTransform: "capitalize",
                                                            borderRadius: 1.5,
                                                            bgcolor:
                                                                req.status === "approved" ? `${colorPalette.seafoamGreen}20` :
                                                                    req.status === "pending" ? `${colorPalette.warmSand}20` : `${colorPalette.coralSunset}20`,
                                                            color:
                                                                req.status === "approved" ? colorPalette.seafoamGreen :
                                                                    req.status === "pending" ? colorPalette.warmSand : colorPalette.coralSunset,
                                                        }}
                                                    />
                                                </Stack>

                                                <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />

                                                {/* Date Details */}
                                                <Grid container spacing={1} sx={{ mb: 2 }}>
                                                    <Grid item xs={6}>
                                                        <Typography variant="caption" color="text.secondary" display="block">DURATION</Typography>
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {calculateDays(req.startDate, req.endDate)} Days
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="caption" color="text.secondary" display="block">RELIEVER</Typography>
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {req.reliever || "Not assigned"}
                                                        </Typography>
                                                    </Grid>
                                                </Grid>

                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, bgcolor: '#f8f9fa', p: 1, borderRadius: 2 }}>
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" display="block">PERIOD</Typography>
                                                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                                                            {new Date(req.startDate).toLocaleDateString()} — {new Date(req.endDate).toLocaleDateString()}
                                                        </Typography>
                                                    </Box>
                                                </Stack>

                                                {/* Remarks (Trunated) */}
                                                {req.remarks && (
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{
                                                            mb: 2,
                                                            fontStyle: 'italic',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        "{req.remarks}"
                                                    </Typography>
                                                )}

                                                {/* Action Buttons */}
                                                <Stack direction="row" spacing={1} mt={1}>
                                                    <Button
                                                        fullWidth
                                                        size="small"
                                                        variant="contained"
                                                        disableElevation
                                                        startIcon={<VisibilityRounded />}
                                                        onClick={() => handleViewFile(req.attachment)}
                                                        disabled={!req.attachment}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontWeight: 700,
                                                            borderRadius: 2,
                                                            bgcolor: colorPalette.oceanBlue,
                                                            "&:hover": { bgcolor: colorPalette.deepNavy }
                                                        }}
                                                    >
                                                        View Docs
                                                    </Button>

                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        variant="outlined"
                                                        disabled={req.status !== "pending"}
                                                        onClick={() => handleDelete(req._id)}
                                                        sx={{ borderRadius: 2, minWidth: 'auto', px: 2, display: req.status === "pending" ? 'inline-flex' : 'none' }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </CardContent>
                </Card>
            </Grid>

            {/* UPDATED LEAVE REQUEST MODAL */}
            <Modal open={open} onClose={() => !loading && setOpen(false)}>
                <Box sx={modalStyle}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight={800} color={C.textPrimary}>Request Leave</Typography>
                        <IconButton disabled={loading} onClick={() => setOpen(false)} sx={{ color: C.textMuted }}><Close /></IconButton>
                    </Stack>

                    <Stack spacing={2.5}>
                        <TextField
                            required
                            disabled={loading}
                            select label="Leave Type" name="type" fullWidth
                            sx={textFieldSx} value={formData.type} onChange={handleChange}
                            SelectProps={{ MenuProps: { PaperProps: { sx: { bgcolor: C.dark, color: C.textPrimary } } } }}
                        >
                            {coreDataDetails.LEAVE_TYPES.map((type) => (
                                <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            required
                            disabled={loading || !formData.type}
                            label="Start Date" type="date" name="startDate" fullWidth
                            sx={textFieldSx} InputLabelProps={{ shrink: true }}
                            value={formData.startDate} onChange={handleChange} error={!!dateError.startDate} helperText={dateError.startDate}
                        />

                        <TextField
                            required
                            disabled={loading || !formData.startDate}
                            label="End Date" type="date" name="endDate" fullWidth
                            sx={textFieldSx} InputLabelProps={{ shrink: true }}
                            value={formData.endDate} onChange={handleChange} error={!!dateError.endDate} helperText={dateError.endDate}
                        />

                        <TextField
                            disabled={loading || !formData.endDate}
                            select label={relieversLoading ? "Loading..." : "Select Reliever"}
                            name="reliever" fullWidth sx={textFieldSx}
                            required
                            value={formData.reliever} onChange={handleChange}
                        >
                            {relievers.map((person) => (
                                <MenuItem key={person._id} value={person.name}>
                                    <Typography variant="body2">{person.name} ({person.email})</Typography>
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            required={relievers.length > 0}
                            disabled={loading || (relievers.length > 0 && !formData.reliever)}
                            label="Remarks / Reason" name="remarks" multiline rows={3}
                            fullWidth sx={textFieldSx} value={formData.remarks} onChange={handleChange}
                        />

                        <Box>
                            <Button
                                disabled={loading || !formData.remarks}
                                component="label" variant="outlined" fullWidth
                                startIcon={<CloudUploadRounded />}
                                sx={{
                                    borderColor: formData.attachment ? C.seafoamGreen : C.glassBorder,
                                    color: formData.attachment ? C.seafoamGreen : C.textSecondary,
                                    borderRadius: "10px", py: 1.5
                                }}
                            >
                                {formData.attachment ? "File Loaded" : "Upload Proof *"}
                                <input disabled={loading || !formData.remarks} type="file" name="attachment" hidden onChange={handleChange} accept=".pdf,.jpg,.jpeg,.png" />
                            </Button>
                        </Box>

                        <Button
                            fullWidth variant="contained" onClick={handleSubmit}
                            disabled={loading || !formData.type || !formData.startDate}
                            sx={{
                                bgcolor: C.oceanBlue,
                                color: "#fff",
                                fontWeight: 800,
                                borderRadius: "12px",
                                py: 1.5,
                                "&:hover": { bgcolor: C.aquaVibrant, color: C.dark }
                            }}
                        >
                            {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "SUBMIT REQUEST"}
                        </Button>
                    </Stack>
                </Box>
            </Modal>




            {/* --- ATTACHMENT VIEWER MODAL --- */}
            <Dialog
                open={Boolean(viewFile)}
                onClose={() => setViewFile(null)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography fontWeight={800}>Attached Document</Typography>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<DownloadRounded />}
                        onClick={handleDownload}
                        sx={{ bgcolor: colorPalette.oceanBlue, borderRadius: 5 }}
                    >
                        Download
                    </Button>
                </DialogTitle>
                <DialogContent dividers sx={{ height: '70vh', p: 0, display: 'flex', justifyContent: 'center', bgcolor: '#f4f4f4' }}>
                    {fileType === "pdf" ? (
                        <iframe
                            src={viewFile}
                            width="100%"
                            height="100%"
                            style={{ border: 'none' }}
                            title="PDF Preview"
                        />
                    ) : (
                        <Box
                            component="img"
                            src={viewFile}
                            alt="Attachment Preview"
                            sx={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                p: 2
                            }}
                        />
                    )}
                </DialogContent>
                <Box sx={{ p: 2, textAlign: 'right' }}>
                    <Button onClick={() => setViewFile(null)} fontWeight={700}>Close</Button>
                </Box>
            </Dialog>

        </Grid>
    );
}