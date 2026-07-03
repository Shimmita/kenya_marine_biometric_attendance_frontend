import {
    Avatar,
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    LinearProgress,
    Stack,
    Typography,
} from "@mui/material";

import MonitorHeartRoundedIcon from "@mui/icons-material/MonitorHeartRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import MemoryRoundedIcon from "@mui/icons-material/MemoryRounded";
import DnsRoundedIcon from "@mui/icons-material/DnsRounded";
import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

const cardStyle = {
    height: "100%",
    borderRadius: 4,
    background: "rgba(255,255,255,.78)",
    backdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,.25)",
    boxShadow: "0 10px 30px rgba(15,23,42,.08)",
};

const bytesToGB = (bytes = 0) =>
    (bytes / 1024 / 1024 / 1024).toFixed(2);

const formatUptime = (seconds = 0) => {

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${days}d ${hours}h ${minutes}m`;

};

const SystemHealthCard = ({ health }) => {

    const used =
        health.memory.heapUsed;

    const total =
        health.memory.heapTotal;

    const percent =
        Math.min((used / total) * 100, 100);

    return (

        <Card sx={cardStyle}>

            <CardContent>

                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={3}
                >

                    <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                    >

                        <Avatar
                            sx={{
                                bgcolor: "success.main",
                                width: 56,
                                height: 56,
                            }}
                        >

                            <MonitorHeartRoundedIcon />

                        </Avatar>

                        <Box>

                            <Typography
                                variant="h6"
                                fontWeight={700}
                            >

                                System Health

                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >

                                Server monitoring

                            </Typography>

                        </Box>

                    </Stack>

                    <Chip
                        color={
                            health.database === "Healthy"
                                ? "success"
                                : "error"
                        }
                        icon={
                            health.database === "Healthy"
                                ? <CheckCircleRoundedIcon />
                                : <WarningAmberRoundedIcon />
                        }
                        label={health.database}
                    />

                </Stack>

                <Divider sx={{ mb: 3 }} />

                <Stack spacing={2.5}>

                    <Stack
                        direction="row"
                        justifyContent="space-between"
                    >

                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                        >

                            <StorageRoundedIcon
                                color="primary"
                            />

                            <Typography>

                                Database

                            </Typography>

                        </Stack>

                        <Typography
                            fontWeight={700}
                        >

                            {health.database}

                        </Typography>

                    </Stack>

                    <Stack
                        direction="row"
                        justifyContent="space-between"
                    >

                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                        >

                            <ComputerRoundedIcon
                                color="primary"
                            />

                            <Typography>

                                Environment

                            </Typography>

                        </Stack>

                        <Typography
                            fontWeight={700}
                        >

                            {health.environment}

                        </Typography>

                    </Stack>

                    <Stack
                        direction="row"
                        justifyContent="space-between"
                    >

                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                        >

                            <DnsRoundedIcon
                                color="primary"
                            />

                            <Typography>

                                Node Version

                            </Typography>

                        </Stack>

                        <Typography
                            fontWeight={700}
                        >

                            {health.nodeVersion}

                        </Typography>

                    </Stack>

                    <Stack
                        direction="row"
                        justifyContent="space-between"
                    >

                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                        >

                            <MemoryRoundedIcon
                                color="primary"
                            />

                            <Typography>

                                CPU Cores

                            </Typography>

                        </Stack>

                        <Typography
                            fontWeight={700}
                        >

                            {health.cpuCount}

                        </Typography>

                    </Stack>

                </Stack>

                <Divider sx={{ my: 3 }} />

                <Typography
                    fontWeight={600}
                    gutterBottom
                >

                    Memory Usage

                </Typography>

                <LinearProgress
                    variant="determinate"
                    value={percent}
                    sx={{
                        height: 10,
                        borderRadius: 10,
                        mb: 1,
                    }}
                />

                <Typography
                    variant="body2"
                    color="text.secondary"
                >

                    {bytesToGB(used)} GB used of{" "}
                    {bytesToGB(total)} GB

                </Typography>

                <Divider sx={{ my: 3 }} />

                <Stack
                    direction="row"
                    justifyContent="space-between"
                >

                    <Typography
                        color="text.secondary"
                    >

                        Server Uptime

                    </Typography>

                    <Typography
                        fontWeight={700}
                    >

                        {formatUptime(
                            health.uptime
                        )}

                    </Typography>

                </Stack>

            </CardContent>

        </Card>

    );

};

export default SystemHealthCard;