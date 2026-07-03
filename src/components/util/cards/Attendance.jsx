import {
    Avatar,
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    Stack,
    Typography,
} from "@mui/material";

import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";

const cardStyle = {
    height: "100%",
    borderRadius: 4,
    background: "rgba(255,255,255,.78)",
    backdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,.25)",
    boxShadow: "0 10px 30px rgba(15,23,42,.08)",
};

const rowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    py: 1.5,
};

const AttendanceCard = ({ attendance }) => {

    return (

        <Card sx={cardStyle}>

            <CardContent>

                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    mb={3}
                >

                    <Avatar
                        sx={{
                            width: 56,
                            height: 56,
                            bgcolor: "primary.main",
                        }}
                    >

                        <AccessTimeRoundedIcon />

                    </Avatar>

                    <Box>

                        <Typography
                            variant="h6"
                            fontWeight={700}
                        >
                            Attendance Policy
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Current attendance configuration
                        </Typography>

                    </Box>

                </Stack>

                <Divider sx={{ mb: 2 }} />

                <Box sx={rowStyle}>

                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                    >

                        <LoginRoundedIcon
                            color="primary"
                            fontSize="small"
                        />

                        <Typography>

                            Standard Clock In

                        </Typography>

                    </Stack>

                    <Chip

                        color="primary"

                        label={attendance.standardClockIn}

                    />

                </Box>

                <Box sx={rowStyle}>

                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                    >

                        <LogoutRoundedIcon
                            color="primary"
                            fontSize="small"
                        />

                        <Typography>

                            Standard Clock Out

                        </Typography>

                    </Stack>

                    <Chip

                        color="primary"

                        label={attendance.standardClockOut}

                    />

                </Box>

                <Box sx={rowStyle}>

                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                    >

                        <ScheduleRoundedIcon
                            color="primary"
                            fontSize="small"
                        />

                        <Typography>

                            Grace Period

                        </Typography>

                    </Stack>

                    <Typography
                        fontWeight={700}
                    >

                        {attendance.gracePeriod} mins

                    </Typography>

                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={rowStyle}>

                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                    >

                        <FingerprintRoundedIcon
                            color="primary"
                            fontSize="small"
                        />

                        <Typography>

                            Biometric Verification

                        </Typography>

                    </Stack>

                    <Chip

                        color={
                            attendance.biometric
                                ? "success"
                                : "default"
                        }

                        label={
                            attendance.biometric
                                ? "Required"
                                : "Disabled"
                        }

                    />

                </Box>

                <Box sx={rowStyle}>

                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                    >

                        <PlaceRoundedIcon
                            color="primary"
                            fontSize="small"
                        />

                        <Typography>

                            Clock Outside

                        </Typography>

                    </Stack>

                    <Chip

                        color={
                            attendance.allowClockOutside
                                ? "success"
                                : "default"
                        }

                        label={
                            attendance.allowClockOutside
                                ? "Allowed"
                                : "Disabled"
                        }

                    />

                </Box>

            </CardContent>

        </Card>

    );

};

export default AttendanceCard;