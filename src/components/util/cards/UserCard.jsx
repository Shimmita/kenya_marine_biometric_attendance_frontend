import {
    Avatar,
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    Stack,
    Typography,
} from "@mui/material";

import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";

const cardStyle = {
    height: "100%",
    borderRadius: 4,
    background: "rgba(255,255,255,.78)",
    backdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,.25)",
    boxShadow: "0 10px 30px rgba(15,23,42,.08)",
};

const statCard = {
    p: 2,
    borderRadius: 3,
    border: "1px solid",
    borderColor: "divider",
    bgcolor: "rgba(255,255,255,.45)",
    transition: ".25s",

    "&:hover": {
        bgcolor: "rgba(255,255,255,.75)",
        transform: "translateY(-2px)",
    },
};

const UserStat = ({
    icon,
    label,
    value,
    color = "primary",
}) => (

    <Box sx={statCard}>

        <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
        >

            <Avatar
                sx={{
                    bgcolor: `${color}.main`,
                    width: 40,
                    height: 40,
                }}
            >
                {icon}
            </Avatar>

            <Typography
                variant="h5"
                fontWeight={700}
            >
                {value}
            </Typography>

        </Stack>

        <Typography
            mt={2}
            variant="body2"
            color="text.secondary"
        >
            {label}
        </Typography>

    </Box>

);

const UsersCard = ({ users }) => {

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
                                bgcolor: "primary.main",
                                width: 56,
                                height: 56,
                            }}
                        >

                            <PeopleRoundedIcon />

                        </Avatar>

                        <Box>

                            <Typography
                                variant="h6"
                                fontWeight={700}
                            >
                                User Overview
                            </Typography>

                            <Typography
                                color="text.secondary"
                                variant="body2"
                            >
                                Platform user distribution
                            </Typography>

                        </Box>

                    </Stack>

                    <Chip
                        color="primary"
                        label={`${users.total} Total`}
                    />

                </Stack>

                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2}>

                    <Grid item xs={12} sm={6}>

                        <UserStat

                            icon={<BadgeRoundedIcon />}

                            label="Employees"

                            value={users.employees}

                            color="primary"

                        />

                    </Grid>

                    <Grid item xs={12} sm={6}>

                        <UserStat

                            icon={<SupervisorAccountRoundedIcon />}

                            label="Supervisors"

                            value={users.supervisors}

                            color="secondary"

                        />

                    </Grid>

                    <Grid item xs={12} sm={6}>

                        <UserStat

                            icon={<ManageAccountsRoundedIcon />}

                            label="HR Officers"

                            value={users.hr}

                            color="success"

                        />

                    </Grid>

                    <Grid item xs={12} sm={6}>

                        <UserStat

                            icon={<AdminPanelSettingsRoundedIcon />}

                            label="Administrators"

                            value={users.admins}

                            color="warning"

                        />

                    </Grid>

                    <Grid item xs={12} sm={12}>

                        <UserStat

                            icon={<SecurityRoundedIcon />}

                            label="Super Administrators"

                            value={users.superadmins}

                            color="error"

                        />

                    </Grid>

                </Grid>

            </CardContent>

        </Card>

    );

};

export default UsersCard;