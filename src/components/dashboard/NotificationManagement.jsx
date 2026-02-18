// Notification Management Content
import { Close } from "@mui/icons-material";
import {
    Box,
    Card,
    CardContent,
    Chip,
    Grid,
    IconButton,
    MenuItem,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
    useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import {
    deleteUserNotification,
    fetchAdminNotifications,
    fetchUserNotifications,
} from "../../service/Notification";
import coreDataDetails from "../CoreDataDetails";

const { colorPalette } = coreDataDetails;

export default function NotificationManagementContent({ currentUser }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [tab, setTab] = useState(0);
    const [userNotifs, setUserNotifs] = useState([]);
    const [adminNotifs, setAdminNotifs] = useState([]);
    const [filterStatus, setFilterStatus] = useState("");

    const isAdminLevel = ["admin", "hr", "ceo", "supervisor"].includes(
        currentUser?.rank
    );

    // 🔥 FETCH
    useEffect(() => {
        const load = async () => {
            const userData = await fetchUserNotifications();
            setUserNotifs(userData);

            if (isAdminLevel) {
                const adminData = await fetchAdminNotifications();
                setAdminNotifs(adminData);
            }
        };

        load();
    }, []);

    // 🔥 MERGE
    const allNotifications = useMemo(() => {
        if (isAdminLevel) return [...userNotifs, ...adminNotifs];
        return userNotifs;
    }, [userNotifs, adminNotifs]);

    const displayedNotifications = useMemo(() => {
        let base = [];

        if (tab === 0) base = allNotifications;
        if (tab === 1) base = userNotifs;
        if (tab === 2) base = adminNotifs;

        return filterStatus
            ? base.filter((n) => n.status === filterStatus)
            : base;
    }, [tab, userNotifs, adminNotifs, filterStatus]);

    // 🔥 DELETE (only user messages)
    const handleDelete = async (id) => {
        await deleteUserNotification(id);
        setUserNotifs((prev) => prev.filter((n) => n._id !== id));
    };

    // 🔥 STATUS COLOR
    const getStatusColor = (status) => {
        switch (status) {
            case "success":
                return colorPalette.seafoamGreen;
            case "rejected":
                return colorPalette.coralSunset;
            case "granted":
                return colorPalette.oceanBlue;
            default:
                return colorPalette.warmSand;
        }
    };

    return (
        <Grid direction={"column"} container spacing={3}>
            {/* Tabs + Filter */}
            <Grid item xs={12}>
                <Stack
                    direction={isMobile ? "column" : "row"}
                    spacing={2}
                    alignItems="center"
                >
                    <Tabs value={tab} onChange={(e, v) => setTab(v)}>
                        <Tab label="All Notifications" />
                        <Tab label="My Messages" />
                        {isAdminLevel && (
                            <Tab label="Administration Messages" />
                        )}
                    </Tabs>

                    <TextField
                        select
                        size="small"
                        label="Filter"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        sx={{ minWidth: 160 }}
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="success">Success</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                        <MenuItem value="granted">Granted</MenuItem>
                    </TextField>
                </Stack>
            </Grid>

            {/* Notification Cards */}
            <Grid item xs={12}>
                <Stack spacing={2}>
                    {displayedNotifications.map((notif) => {
                        const isUserMessage =
                            notif.user_email === currentUser.email;

                        return (
                            <Card
                                key={notif._id}
                                elevation={0}
                                sx={{
                                    borderRadius: 4,
                                    position: "relative",
                                    background: `
                    linear-gradient(
                      135deg,
                      rgba(255,255,255,0.65),
                      rgba(255,255,255,0.45)
                    )
                  `,
                                    backdropFilter: "blur(22px)",
                                    WebkitBackdropFilter: "blur(22px)",
                                    border: `1px solid ${getStatusColor(
                                        notif.status
                                    )}40`,
                                    boxShadow: `
                    0 12px 35px rgba(10,61,98,0.12),
                    0 4px 18px ${getStatusColor(
                                        notif.status
                                    )}20
                  `,
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                        transform: isMobile
                                            ? "none"
                                            : "translateX(6px)",
                                        boxShadow: `
                      0 18px 45px rgba(10,61,98,0.18),
                      0 8px 24px ${getStatusColor(
                                            notif.status
                                        )}30
                    `,
                                    },
                                }}
                            >
                                <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                                    <Stack
                                        direction={isMobile ? "column" : "row"}
                                        justifyContent="space-between"
                                        spacing={2}
                                    >
                                        <Box sx={{ flex: 1 }}>
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                alignItems="center"
                                                flexWrap="wrap"
                                                sx={{ mb: 1 }}
                                            >
                                                <Typography
                                                    variant="h6"
                                                    fontWeight="800"
                                                    color={colorPalette.deepNavy}
                                                    sx={{
                                                        fontSize: isMobile
                                                            ? "1rem"
                                                            : "1.1rem",
                                                    }}
                                                >
                                                    {notif.title}
                                                </Typography>

                                                {/* STATUS CHIP (Original Style Preserved) */}
                                                <Chip
                                                    label={notif.status}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: getStatusColor(
                                                            notif.status
                                                        ),
                                                        color: "white",
                                                        fontWeight: 700,
                                                        backdropFilter: "blur(6px)",
                                                        boxShadow: `0 4px 12px ${getStatusColor(
                                                            notif.status
                                                        )}40`,
                                                    }}
                                                />

                                                {/* URGENT CHIP */}
                                                {notif.label === "urgent" && (
                                                    <Chip
                                                        label="Urgent"
                                                        size="small"
                                                        sx={{
                                                            bgcolor:
                                                                colorPalette.coralSunset,
                                                            color: "white",
                                                            fontWeight: 700,
                                                            backdropFilter: "blur(6px)",
                                                            boxShadow: `0 4px 12px ${colorPalette.coralSunset}40`,
                                                        }}
                                                    />
                                                )}
                                            </Stack>

                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    mb: 1,
                                                    color: "rgba(30,42,60,0.75)",
                                                    lineHeight: 1.6,
                                                }}
                                            >
                                                {notif.message}
                                            </Typography>

                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: "rgba(30,42,60,0.55)",
                                                }}
                                            >
                                                {new Date(
                                                    notif.createdAt
                                                ).toLocaleString()}
                                            </Typography>
                                        </Box>

                                        {/* DELETE ONLY FOR USER MESSAGES */}
                                        {tab !== 2 && isUserMessage && (
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    handleDelete(notif._id)
                                                }
                                                sx={{
                                                    color: colorPalette.charcoal,
                                                    background:
                                                        "rgba(255,255,255,0.55)",
                                                    backdropFilter: "blur(10px)",
                                                    border:
                                                        "1px solid rgba(0,0,0,0.05)",
                                                    "&:hover": {
                                                        background:
                                                            "rgba(255,255,255,0.8)",
                                                        transform: "scale(1.05)",
                                                    },
                                                }}
                                            >
                                                <Close fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Stack>
            </Grid>
        </Grid>
    );
}
