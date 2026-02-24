import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    MenuItem,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography
} from "@mui/material";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { createLeave, deleteLeave, fetchAllLeaves } from "../../service/LeaveService";
import coreDataDetails from "../CoreDataDetails";
const { colorPalette } = coreDataDetails;

export default function LeaveManagementContent() {
    const [open, setOpen] = useState(false);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(false);
    const [dateError, setDateError] = useState({
        startDate: "",
        endDate: ""
    });

    const today = new Date().toISOString().split("T")[0];

    // redux access user state
    const { user } = useSelector(s => s.currentUser);


    const [formData, setFormData] = useState({
        type: "",
        startDate: "",
        endDate: "",
        email: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        let errors = { ...dateError };

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

        try {
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

            setOpen(false);

            setFormData({
                type: "",
                startDate: "",
                endDate: "",
                email: "",
            });

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
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Start</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>End</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Days</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {filteredLeaves.map((req) => (
                                            <TableRow
                                                key={req._id}
                                                sx={{
                                                    transition: "0.2s ease",
                                                    "&:hover": {
                                                        backgroundColor: `${colorPalette.softGray}20`
                                                    }
                                                }}
                                            >
                                                <TableCell>
                                                    <Typography
                                                        fontWeight={600}
                                                        sx={{ textTransform: "capitalize" }}
                                                    >
                                                        {req.type}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    {new Date(req.startDate).toLocaleDateString()}
                                                </TableCell>

                                                <TableCell>
                                                    {new Date(req.endDate).toLocaleDateString()}
                                                </TableCell>

                                                <TableCell>
                                                    {calculateDays(req.startDate, req.endDate)} days
                                                </TableCell>

                                                <TableCell>
                                                    <Chip
                                                        label={req.status}
                                                        size="small"
                                                        sx={{
                                                            px: 1,
                                                            fontWeight: 700,
                                                            textTransform: "capitalize",
                                                            borderRadius: 2,
                                                            bgcolor:
                                                                req.status === "approved"
                                                                    ? `${colorPalette.seafoamGreen}20`
                                                                    : req.status === "pending"
                                                                        ? `${colorPalette.warmSand}20`
                                                                        : `${colorPalette.coralSunset}20`,
                                                            color:
                                                                req.status === "approved"
                                                                    ? colorPalette.seafoamGreen
                                                                    : req.status === "pending"
                                                                        ? colorPalette.warmSand
                                                                        : colorPalette.coralSunset,
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDelete(req._id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            </Grid>

            {/* MODAL */}
            <Dialog open={open} onClose={() => {
                if (!loading) {
                    setOpen(false)
                }
            }} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight={800}>Request Leave</DialogTitle>
                <DialogContent sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <TextField
                            select
                            label="Leave Type"
                            name="type"
                            fullWidth
                            value={formData.type}
                            onChange={handleChange}
                        >
                            <MenuItem value="maternity">Maternity</MenuItem>
                            <MenuItem value="sick">Sick</MenuItem>
                            <MenuItem value="compasion">Compassion</MenuItem>
                            <MenuItem value="casual">Casual</MenuItem>
                        </TextField>

                        <TextField
                            label="Start Date"
                            type="date"
                            name="startDate"
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: today }}
                            fullWidth
                            value={formData.startDate}
                            onChange={handleChange}
                            error={!!dateError.startDate}
                            helperText={dateError.startDate}
                        />

                        <TextField
                            label="End Date"
                            type="date"
                            name="endDate"
                            disabled={!formData.startDate}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: formData.startDate || today }}
                            fullWidth
                            value={formData.endDate}
                            onChange={handleChange}
                            error={!!dateError.endDate}
                            helperText={dateError.endDate}
                        />

                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={
                                loading ||
                                !formData.type ||
                                !formData.startDate ||
                                !formData.endDate ||
                                dateError.startDate ||
                                dateError.endDate
                            }
                            sx={{
                                bgcolor: colorPalette.oceanBlue,
                                borderRadius: 3,
                                fontWeight: 700
                            }}
                        >
                            {loading ? "Submitting..." : "Submit Request"}
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>
        </Grid>
    );
}