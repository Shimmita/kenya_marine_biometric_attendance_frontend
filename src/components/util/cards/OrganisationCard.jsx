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

import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

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
    py: 1.2,
};

const OrganizationCard = ({ organization }) => {

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
                            bgcolor: "primary.main",
                            width: 58,
                            height: 58,
                        }}
                    >

                        <BusinessRoundedIcon />

                    </Avatar>

                    <Box>

                        <Typography
                            variant="h6"
                            fontWeight={700}
                        >
                            Organization
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Platform Information
                        </Typography>

                    </Box>

                </Stack>

              

                <Divider sx={{ my: 3 }} />

                <Stack spacing={2}>

                    <Box sx={rowStyle} gap={2}>

                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                        >

                            <PaletteRoundedIcon
                                color="primary"
                                fontSize="small"
                            />

                            <Typography>
                                Active Theme
                            </Typography>

                        </Stack>

                        <Chip
                            label={organization.activeTheme}
                            color="primary"
                            size="small"
                        />

                    </Box>

                    <Box sx={rowStyle}>

                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                        >

                            <ApartmentRoundedIcon
                                color="primary"
                                fontSize="small"
                            />

                            <Typography>
                                Departments
                            </Typography>

                        </Stack>

                        <Typography
                            fontWeight={700}
                        >
                            {organization.departments}
                        </Typography>

                    </Box>

                    <Box sx={rowStyle}>

                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                        >

                            <LocationOnRoundedIcon
                                color="primary"
                                fontSize="small"
                            />

                            <Typography>
                                Stations
                            </Typography>

                        </Stack>

                        <Typography
                            fontWeight={700}
                        >
                            {organization.stations}
                        </Typography>

                    </Box>

                </Stack>

              

            </CardContent>

        </Card>

    );

};

export default OrganizationCard;