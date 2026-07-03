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

import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";

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
    padding: "10px 0",
};

const StatusChip = ({ value, trueLabel = "Enabled", falseLabel = "Disabled" }) => (
    <Chip
        size="small"
        color={value ? "success" : "default"}
        label={value ? trueLabel : falseLabel}
    />
);

const ConfigurationCard = ({ configuration }) => {

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

                        <SettingsRoundedIcon />

                    </Avatar>

                    <Box>

                        <Typography
                            variant="h6"
                            fontWeight={700}
                        >
                            Platform Configuration
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Current platform settings
                        </Typography>

                    </Box>

                </Stack>

                <Divider sx={{ mb: 2 }} />

                {/* Themes */}

                <Box sx={rowStyle}>

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

                            Installed Themes

                        </Typography>

                    </Stack>

                    <Chip
                        color="primary"
                        label={configuration.themes}
                    />

                </Box>

                {/* Dropdowns */}

                <Box sx={rowStyle}>

                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                    >

                        <CategoryRoundedIcon
                            color="primary"
                            fontSize="small"
                        />

                        <Typography>

                            Dropdown Categories

                        </Typography>

                    </Stack>

                    <Chip
                        color="secondary"
                        label={configuration.dropdowns}
                    />

                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Geofence */}

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

                            Geofence

                        </Typography>

                    </Stack>

                    <StatusChip
                        value={configuration.geofenceEnabled}
                    />

                </Box>

                {/* Maintenance */}

                <Box sx={rowStyle}>

                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                    >

                        <BuildRoundedIcon
                            color="primary"
                            fontSize="small"
                        />

                        <Typography>

                            Maintenance Mode

                        </Typography>

                    </Stack>

                    <StatusChip
                        value={configuration.maintenanceMode}
                        trueLabel="ON"
                        falseLabel="OFF"
                    />

                </Box>

                {/* Self Registration */}

                <Box sx={rowStyle}>

                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                    >

                        <PersonAddRoundedIcon
                            color="primary"
                            fontSize="small"
                        />

                        <Typography>

                            Self Registration

                        </Typography>

                    </Stack>

                    <StatusChip
                        value={configuration.selfRegistration}
                    />

                </Box>

                {/* Biometric */}

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

                            Biometric Required

                        </Typography>

                    </Stack>

                    <StatusChip
                        value={configuration.biometricRequired}
                    />

                </Box>

            </CardContent>

        </Card>

    );

};

export default ConfigurationCard;