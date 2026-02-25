import {
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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    FormControl,
    Select,
    MenuItem,
} from "@mui/material";
import { useEffect, useState } from "react";
import { fetchAllLeavesAdmin, updateLeaveAdmin } from "../../service/LeaveService";
import coreDataDetails from "../CoreDataDetails";
const { colorPalette } = coreDataDetails;

export default function AdminLeaveManager() {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(false);
    const [confirmation, setConfirmation] = useState({ open: false, leaveId: "", action: "" });

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

    useEffect(() => {
        loadLeaves();
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

    return (
        <Grid container spacing={3} sx={{ width: "100%", m: 0, justifyContent: "center" }}>
            <Grid item xs={12} md={11} lg={10}>
                <Card
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        border: `1px solid ${colorPalette.softGray}`,
                        background: "linear-gradient(to bottom, #ffffff, #fafcff)"
                    }}
                >
                    <CardContent sx={{ p: 1 }}>
                        {/* HEADER */}
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            spacing={2} K
                            sx={{ mb: 3 }}
                        >
                            <Box>
                                <Typography variant="h6" fontWeight="800" color={colorPalette.deepNavy}>
                                    All Leave Requests
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                                    Approve or reject leave requests from all users
                                </Typography>
                            </Box>
                            <Button
                                variant="contained"
                                onClick={loadLeaves}
                                sx={{
                                    bgcolor: colorPalette.oceanBlue,
                                    borderRadius: 3,
                                    textTransform: "none",
                                    fontWeight: 700,
                                    px: 3,
                                    boxShadow: `0 8px 20px ${colorPalette.oceanBlue}30`,
                                    "&:hover": { bgcolor: colorPalette.oceanBlue }
                                }}
                            >
                                Refresh
                            </Button>
                        </Stack>

                        <Divider sx={{ mb: 1 }} />

                        {/* TABS */}
                        <Box>
                            <Tabs
                                value={filter}
                                onChange={(e, newValue) => setFilter(newValue)}
                                textColor="primary"
                                indicatorColor="primary"
                                sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 700 } }}
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
                            <Box sx={{ textAlign: "center", py: 6, opacity: 0.8 }}>
                                <Typography variant="h6" fontWeight={700}>
                                    No Leave Requests
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    There are currently no leave requests for the selected filter.
                                </Typography>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Station</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Start</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>End</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Days</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredLeaves.map((req) => (
                                            <TableRow key={req._id} sx={{ "&:hover": { backgroundColor: `${colorPalette.softGray}20` } }}>
                                                <TableCell>{req.name}</TableCell>
                                                <TableCell>{req.email}</TableCell>
                                                <TableCell>{req.department}</TableCell>
                                                <TableCell>{req.station}</TableCell>
                                                <TableCell sx={{ textTransform: "capitalize" }}>{req.type}</TableCell>
                                                <TableCell>{new Date(req.startDate).toLocaleDateString()}</TableCell>
                                                <TableCell>{new Date(req.endDate).toLocaleDateString()}</TableCell>
                                                <TableCell>{calculateDays(req.startDate, req.endDate)} days</TableCell>
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
                                                    <FormControl size="small" fullWidth>
                                                        <Select
                                                            value={req.status === "pending" ? "" : req.status}
                                                            displayEmpty
                                                            disabled={req.status !== "pending"}
                                                            renderValue={(selected) => {
                                                                if (!selected) {
                                                                    return (
                                                                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                                                            Select Action
                                                                        </Typography>
                                                                    );
                                                                }

                                                                return (
                                                                    <Chip
                                                                        label={selected}
                                                                        size="small"
                                                                        sx={{
                                                                            px: 1,
                                                                            fontWeight: 700,
                                                                            textTransform: "capitalize",
                                                                            borderRadius: 2,
                                                                            bgcolor:
                                                                                selected === "approved"
                                                                                    ? `${colorPalette.seafoamGreen}20`
                                                                                    : `${colorPalette.coralSunset}20`,
                                                                            color:
                                                                                selected === "approved"
                                                                                    ? colorPalette.seafoamGreen
                                                                                    : colorPalette.coralSunset,
                                                                        }}
                                                                    />
                                                                );
                                                            }}
                                                            onChange={(e) =>
                                                                setConfirmation({
                                                                    open: true,
                                                                    leaveId: req._id,
                                                                    action: e.target.value,
                                                                })
                                                            }
                                                            sx={{
                                                                borderRadius: 3,
                                                                "& .MuiOutlinedInput-notchedOutline": {
                                                                    borderColor: colorPalette.softGray,
                                                                },
                                                            }}
                                                        >
                                                            <MenuItem value="approved">
                                                                <Chip
                                                                    label="Approve"
                                                                    size="small"
                                                                    sx={{
                                                                        fontWeight: 700,
                                                                        borderRadius: 2,
                                                                        bgcolor: `${colorPalette.seafoamGreen}20`,
                                                                        color: colorPalette.seafoamGreen,
                                                                    }}
                                                                />
                                                            </MenuItem>

                                                            <MenuItem value="rejected">
                                                                <Chip
                                                                    label="Reject"
                                                                    size="small"
                                                                    sx={{
                                                                        fontWeight: 700,
                                                                        borderRadius: 2,
                                                                        bgcolor: `${colorPalette.coralSunset}20`,
                                                                        color: colorPalette.coralSunset,
                                                                    }}
                                                                />
                                                            </MenuItem>
                                                        </Select>
                                                    </FormControl>
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

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmation.open}
                onClose={() => setConfirmation({ open: false, leaveId: "", action: "" })}
            >
                <DialogTitle>Confirm Action</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to {confirmation.action} this leave request?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setConfirmation({ open: false, leaveId: "", action: "" })}
                        color="inherit"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleStatusChange(confirmation.leaveId, confirmation.action)}
                        color={confirmation.action === "approved" ? "success" : "error"}
                        variant="contained"
                    >
                        {confirmation.action === "approved" ? "Approve" : "Reject"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
}