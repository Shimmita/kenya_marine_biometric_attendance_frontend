import {
    Grid,
    Card,
    CardContent,
    Typography,
    Stack,
    Avatar,
    Chip,
} from "@mui/material";

import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";

const cardStyle = {
    height: "100%",
    borderRadius: 4,
    background: "rgba(255,255,255,.78)",
    backdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,.25)",
    boxShadow: "0 10px 30px rgba(15,23,42,.08)",
    transition: "all .25s ease",

    "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 20px 45px rgba(15,23,42,.15)",
    },
};

const iconStyle = {
    width: 54,
    height: 54,
    bgcolor: "primary.main",
};

const DashboardSummaryCards = ({ dashboard }) => {

    const cards = [
        {
            title: "Users",
            value: dashboard.users.total,
            subtitle: `${dashboard.users.employees} Employees`,
            icon: <PeopleAltRoundedIcon />,
        },
        {
            title: "Departments",
            value: dashboard.organization.departments,
            subtitle: "Organization Departments",
            icon: <ApartmentRoundedIcon />,
        },
        {
            title: "Stations",
            value: dashboard.organization.stations,
            subtitle: "Clocking Stations",
            icon: <LocationOnRoundedIcon />,
        },
        {
            title: "Themes",
            value: dashboard.configuration.themes,
            subtitle: dashboard.organization.activeTheme,
            icon: <PaletteRoundedIcon />,
        },
    ];

    return (
        <Grid container spacing={3}>

            {cards.map((card) => (

                <Grid
                    item
                    xs={12}
                    sm={6}
                    lg={3}
                    key={card.title}
                >

                    <Card sx={cardStyle}>

                        <CardContent>

                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                            >

                                <Avatar sx={iconStyle}>
                                    {card.icon}
                                </Avatar>

                                <Chip
                                    size="small"
                                    color="primary"
                                    label="Live"
                                />

                            </Stack>

                            <Typography
                                mt={3}
                                variant="body2"
                                color="text.secondary"
                            >
                                {card.title}
                            </Typography>

                            <Typography
                                variant="h3"
                                fontWeight={700}
                            >
                                {card.value}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                {card.subtitle}
                            </Typography>

                        </CardContent>

                    </Card>

                </Grid>

            ))}

        </Grid>
    );

};

export default DashboardSummaryCards;