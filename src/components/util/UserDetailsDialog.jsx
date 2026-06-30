import {
    Avatar,
    Box,
    Button,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    Grid,
    IconButton,
    MenuItem,
    Select,
    Stack,
    Tab,
    Tabs,
    Tooltip,
    Typography
} from "@mui/material";

import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";

import { BorderAllRounded, BusinessRounded, Face6Rounded, GroupsRounded, InfoRounded, LockClockRounded, ManageAccountsRounded, SecurityRounded, SelfImprovementRounded, ShieldRounded } from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { updateUserCurrentUserRedux } from "../../redux/CurrentUser";
import { revokeClockOutsideStatus, updateClockOutsideStatus } from "../../service/UserManagement";
import { getUserProfile } from "../../service/UserProfile";
import coreDataDetails from "../CoreDataDetails";
import ClockOutsideModal from "./ClockOutsideDialog";
const { availableDepartments, AvailableStations } = coreDataDetails;

const GlassSection = ({ title, icon, children }) => (

    <Box
        sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 3,

            bgcolor: coreDataDetails.C.glassBg,

            backdropFilter: "blur(18px)",

            border: `1px solid ${coreDataDetails.C.glassBorder}`,

            boxShadow: "0 12px 30px rgba(0,0,0,.18)",

            transition: ".3s",

            "&:hover": {

                borderColor: coreDataDetails.C.glassBorderHover,

                transform: "translateY(-2px)",

                boxShadow: "0 18px 36px rgba(0,0,0,.22)"
            }
        }}
    >

        <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            mb={2}
        >

            {icon}

            <Typography
                sx={{
                    fontWeight: 800,
                    color: coreDataDetails.C.aquaVibrant,
                    letterSpacing: ".04em",
                    textTransform: "uppercase",
                    fontSize: ".8rem"
                }}
            >
                {title}
            </Typography>

        </Stack>

        {children}

    </Box>

);

const InfoRow = ({ label, value }) => (

    <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{
            py: 1.3,

            borderBottom: `1px solid ${coreDataDetails.C.glassBorder}`,

            "&:last-child": {
                borderBottom: "none"
            }
        }}
    >

        <Typography
            sx={{
                color: coreDataDetails.C.textMuted,
                fontSize: ".80rem",
                fontWeight: 700
            }}
        >
            {label}
        </Typography>

        <Typography
            variant="body2"
            sx={{
                color: coreDataDetails.C.textPrimary,
                fontWeight: 600,
                maxWidth: "55%",
                textAlign: "right"
            }}
        >
            {value || "--"}
        </Typography>

    </Stack>

);

export default function UserDetailsDialog({
    open,
    onClose,
    user,
    supervisors = [],
    onRankChange,
    onRoleChange,
    onDepartmentSave,
    onStationSave,
    onSupervisorChange,
    onToggleActive,
    onDeleteUser,
    onResetBiometrics,
}) {

    const [tab, setTab] = useState(0);

    const dispatch = useDispatch();

    const [isLoading, setIsLoading] = useState(false);

    const [error, setError] = useState("");

    const [clockOutside, setClockOutside] = useState("no");

    const [openClockModal, setOpenClockModal] = useState(false);

    const [formData, setFormData] = useState({
        startDate: "",
        endDate: "",
        reason: ""
    });

    useEffect(() => {

        if (!user) return;

        setClockOutside(
            user.canClockOutside ? "yes" : "no"
        );

        setFormData({
            startDate: "",
            endDate: "",
            reason: ""
        });

        setError("");

        setOpenClockModal(false);

    }, [user]);

    if (!user) return null;


    const handleClockOutsideChange = async (e) => {
        const val = e.target.value;
        if (val === "yes") {
            setClockOutside("yes");
            setOpenClockModal(true);
            return;
        }
        if (val === "no" && user.canClockOutside) {
            const confirmRevoke = window.confirm(`Revoke clock-outside permission for ${user.name}?`);
            if (confirmRevoke) {
                try {
                    setIsLoading(true);
                    await revokeClockOutsideStatus(user._id);
                    setClockOutside("no");
                    const updatedUser = await getUserProfile();
                    dispatch(updateUserCurrentUserRedux(updatedUser));
                } catch (err) {
                    setError(err || "Failed to revoke permission");
                    setClockOutside("yes");
                } finally {
                    setIsLoading(false);
                }
            } else {
                setClockOutside("yes");
            }
        } else {
            setClockOutside("no");
        }
    };

    const handleClose = () => {

        setOpenClockModal(false);

        setError("");

        setFormData({
            startDate: "",
            endDate: "",
            reason: ""
        });

        setClockOutside(
            user.canClockOutside
                ? "yes"
                : "no"
        );

    };

    const handleSubmit = async () => {
        if (new Date(formData.endDate) <= new Date(formData.startDate)) {
            setError("End date must be after start date.");
            return;
        }
        try {
            setIsLoading(true);
            await updateClockOutsideStatus(user._id, formData);
            const updatedUser = await getUserProfile();
            dispatch(updateUserCurrentUserRedux(updatedUser));
            setOpenClockModal(false);
            setError("");
        } catch (err) {
            setError(err || "Failed to update authorization");
        } finally {
            setIsLoading(false);
        }
    };

    return (

        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >

            <Box
                sx={{
                    position: "relative",
                    minHeight: 650
                }}
            >

                <Box
                    sx={{

                        opacity: openClockModal ? 0.08 : 1,

                        transition: "all .35s ease",

                        pointerEvents: openClockModal
                            ? "none"
                            : "auto",

                        filter: openClockModal
                            ? "blur(5px)"
                            : "none",

                        transform: openClockModal
                            ? "scale(.98)"
                            : "scale(1)"

                    }}
                >


                    <DialogTitle

                        sx={{

                            background:
                                "rgba(255,255,255,.02)",

                            backdropFilter: "blur(20px)",

                            borderBottom: `1px solid ${coreDataDetails.C.glassBorder}`

                        }}

                    >
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                        >

                            <Stack
                                direction="row"
                                spacing={2}
                                alignItems="center"
                            >

                                <Avatar
                                    src={user.avatar}
                                    sx={{

                                        width: 60,

                                        height: 60,

                                        background: coreDataDetails.C.freshGradient,

                                        border: `1px solid ${coreDataDetails.C.glassBorder}`,

                                        boxShadow: `0 0 18px ${coreDataDetails.C.aquaVibrant}30`

                                    }}
                                >
                                    {user.name?.charAt(0)}
                                </Avatar>

                                <Box flex={1}>

                                    <Typography
                                        variant="h5"
                                        fontWeight={800}
                                    >
                                        {user.name}
                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        mb={1}
                                    >
                                        {user.email}
                                    </Typography>

                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        flexWrap="wrap"
                                    >

                                        <Chip
                                            sx={{

                                                fontWeight: 700,

                                                borderRadius: 2,

                                                backdropFilter: "blur(10px)",

                                                border: `1px solid ${coreDataDetails.C.glassBorder}`

                                            }}
                                            size="small"
                                            color="primary"
                                            label={user.role}
                                        />

                                        <Chip
                                            sx={{

                                                fontWeight: 700,

                                                borderRadius: 2,

                                                backdropFilter: "blur(10px)",

                                                border: `1px solid ${coreDataDetails.C.glassBorder}`

                                            }}
                                            size="small"
                                            color="secondary"
                                            label={user.rank}
                                        />

                                        <Chip
                                            sx={{

                                                fontWeight: 700,

                                                borderRadius: 2,

                                                backdropFilter: "blur(10px)",

                                                border: `1px solid ${coreDataDetails.C.glassBorder}`,
                                                      bgcolor: user.isAccountActive
                                                    ? "rgba(72,201,176,.15)"
                                                    : "rgba(255,92,74,.15)",

                                                color: user.isAccountActive
                                                    ? "#48C9B0"
                                                    : "#FF5C4A"

                                            }}
                                            size="small"
                                            label={
                                                user.isAccountActive
                                                    ? "Active"
                                                    : "Inactive"
                                            }
                                           
                                        />

                                    </Stack>

                                </Box>

                            </Stack>

                            <Tooltip title='close' arrow>
                                <IconButton
                                    onClick={onClose}
                                    sx={{
                                        borderColor: 'divider', border: '1px solid',
                                        borderRadius: '50%'
                                    }} size="small" >
                                    <CloseRoundedIcon />
                                </IconButton>
                            </Tooltip>

                        </Stack>

                    </DialogTitle>

                    <Divider />

                    <Tabs
                        value={tab}
                        onChange={(e, v) => setTab(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        sx={{
                            px: 1,
                            py: 1,

                            "& .MuiTabs-flexContainer": {
                                gap: 0.5
                            },

                            "& .MuiTabs-scrollButtons": {
                                color: "#00E5FF"
                            },

                            "& .MuiTabs-indicator": {
                                display: "none"
                            },

                            "& .MuiTab-root": {
                                minHeight: 42,
                                minWidth: {
                                    xs: 110,
                                    sm: 140
                                },
                                px: 2,
                                borderRadius: 2,
                                fontWeight: 700,
                                textTransform: "none",
                                whiteSpace: "nowrap",
                                transition: ".25s"
                            },

                            "& .Mui-selected": {
                                bgcolor: "rgba(0,229,255,.10)",
                                color: "#00E5FF"
                            }
                        }}
                    >
                        <Tab
                            icon={<DashboardRoundedIcon fontSize="small" />}
                            iconPosition="top"
                            label="Overview"
                        />

                        <Tab
                            icon={<WorkRoundedIcon fontSize="small" />}
                            iconPosition="top"
                            label="Job"
                        />

                        <Tab
                            icon={<AdminPanelSettingsRoundedIcon fontSize="small" />}
                            iconPosition="top"
                            label="Manage"
                        />

                        <Tab
                            icon={<SettingsRoundedIcon fontSize="small" />}
                            iconPosition="top"
                            label="Actions"
                        />
                    </Tabs>

                    <DialogContent>

                        {tab === 0 && (

                            <Box>

                                <GlassSection icon={<DashboardRoundedIcon />} title="Personal Information">

                                    <InfoRow
                                        label="Employee ID"
                                        value={user.employeeId}
                                    />

                                    <InfoRow
                                        label="Staff Number"
                                        value={user.staffNo}
                                    />

                                    <InfoRow
                                        label="Phone"
                                        value={user.phone}
                                    />

                                    <InfoRow
                                        label="Gender"
                                        value={user.gender}
                                    />

                                </GlassSection>

                                <GlassSection icon={<ShieldRounded />} title="Security & Authentication">

                                    <InfoRow
                                        label="Email Verified"
                                        value={user.email_verified ? "Verified" : "Not Verified"}
                                    />

                                    <InfoRow
                                        label="Biometrics"
                                        value={user.doneBiometric ? "Registered" : "Not Registered"}
                                    />

                                    <InfoRow
                                        label="Devices"
                                        value={user.hasDevices ? "Registered" : "None"}
                                    />

                                    <InfoRow
                                        label="Password Reset"
                                        value={user.isPasswordReset ? "Required" : "Normal"}
                                    />

                                </GlassSection>

                            </Box>

                        )}

                        {tab === 1 && (

                            <Box>

                                <GlassSection icon={<WorkRoundedIcon />} title="Employment Details">

                                    <InfoRow
                                        label="Department"
                                        value={user.department}
                                    />

                                    <InfoRow
                                        label="Station"
                                        value={user.station}
                                    />

                                    <InfoRow
                                        label="Supervisor"
                                        value={user.supervisor}
                                    />

                                    <InfoRow
                                        label="Start Date"
                                        value={user.startDate}
                                    />

                                    <InfoRow
                                        label="End Date"
                                        value={user.endDate}
                                    />

                                </GlassSection>

                                <GlassSection icon={<InfoRounded />} title="Employment Status">

                                    <InfoRow
                                        label="Role"
                                        value={user.role}
                                    />

                                    <InfoRow
                                        label="Rank"
                                        value={user.rank}
                                    />

                                    <InfoRow
                                        label="Account"
                                        value={user.isAccountActive ? "Active" : "Inactive"}
                                    />

                                    <InfoRow
                                        label="Currently On Leave"
                                        value={user.isOnLeave ? "Yes" : "No"}
                                    />

                                </GlassSection>

                            </Box>

                        )}

                        {tab === 2 && (

                            <Box>

                                <Grid
                                    container
                                    spacing={3}
                                    alignItems="flex-start"
                                >

                                    <Grid size={{ xs: 12, md: 7 }}>

                                        <GlassSection
                                            icon={<Face6Rounded />}
                                            title="Role Management"
                                        >

                                            <Typography mb={1}>
                                                Role
                                            </Typography>

                                            <FormControl fullWidth size="small">

                                                <Select

                                                    value={user.role}
                                                    onChange={(e) =>
                                                        onRoleChange(
                                                            user._id,
                                                            e.target.value
                                                        )
                                                    }
                                                >

                                                    {[
                                                        "employee",
                                                        "intern",
                                                        "attachee",
                                                        "employee-contract"

                                                    ].map(role => (

                                                        <MenuItem
                                                            key={role}
                                                            value={role}
                                                        >

                                                            {role}

                                                        </MenuItem>

                                                    ))}

                                                </Select>

                                            </FormControl>

                                        </GlassSection>

                                    </Grid>

                                    <Grid size={{ xs: 12, md: 5 }}>

                                        <GlassSection
                                            icon={<GroupsRounded />}
                                            title="Rank Management"
                                        >

                                            <Typography mb={1}>
                                                Rank
                                            </Typography>

                                            <FormControl fullWidth size="small">

                                                <Select
                                                    value={user.rank}
                                                    onChange={(e) =>
                                                        onRankChange(
                                                            user._id,
                                                            e.target.value
                                                        )
                                                    }
                                                >

                                                    {[
                                                        "admin",
                                                        "hr",
                                                        "supervisor",
                                                        "ceo",
                                                        "user",
                                                        "auditor"

                                                    ].map(rank => (

                                                        <MenuItem
                                                            key={rank}
                                                            value={rank}
                                                        >

                                                            {rank}

                                                        </MenuItem>

                                                    ))}

                                                </Select>

                                            </FormControl>
                                        </GlassSection>


                                    </Grid>

                                    <Grid size={{ xs: 12, md: 5 }}>

                                        <GlassSection
                                        icon={<BorderAllRounded/>}
                                            title="Department Management"
                                        >

                                            <Typography mb={1}>
                                                Department
                                            </Typography>

                                            <FormControl fullWidth size="small">

                                                <Select

                                                    value={user.department}

                                                    onChange={(e) =>

                                                        onDepartmentSave(

                                                            user._id,

                                                            e.target.value

                                                        )

                                                    }

                                                >

                                                    {availableDepartments.map(dept => (

                                                        <MenuItem

                                                            key={dept}

                                                            value={dept}

                                                        >

                                                            {dept}

                                                        </MenuItem>

                                                    ))}

                                                </Select>

                                            </FormControl>
                                        </GlassSection>

                                    </Grid>

                                    <Grid size={{ xs: 12, md: 5 }}>

                                        <GlassSection
                                        icon={<BusinessRounded/>}
                                            title="Station Management"
                                        >

                                            <Typography mb={1}>
                                                Station
                                            </Typography>

                                            <FormControl fullWidth>

                                                <Select

                                                    value={user.station}

                                                    onChange={(e) =>

                                                        onStationSave(

                                                            user._id,

                                                            e.target.value

                                                        )

                                                    }

                                                >

                                                    {AvailableStations.map(st => (

                                                        <MenuItem

                                                            key={st.name}

                                                            value={st.name}

                                                        >

                                                            {st.name}

                                                        </MenuItem>

                                                    ))}

                                                </Select>

                                            </FormControl>

                                        </GlassSection>

                                    </Grid>

                                    <Grid size={{ xs: 12, md: 5 }}>

                                        <GlassSection
                                        icon={<SelfImprovementRounded/>}
                                            title="Supervisor Management"
                                        >

                                            <Typography mb={1}>
                                                Supervisor
                                            </Typography>

                                            <FormControl fullWidth>

                                                <Select

                                                    value={user.supervisor}

                                                    onChange={(e) =>

                                                        onSupervisorChange(

                                                            user._id,

                                                            e.target.value

                                                        )

                                                    }

                                                >

                                                    {supervisors
                                                        ?.filter((s) => s.email !== user.email)
                                                        .map((s) => (
                                                            <MenuItem
                                                                key={s._id}
                                                                value={s}
                                                            >
                                                                {s.name}
                                                            </MenuItem>
                                                        ))}

                                                </Select>

                                            </FormControl>

                                        </GlassSection>

                                    </Grid>

                                    <Grid size={{ xs: 12, md: 5 }}>

                                        <GlassSection
                                        icon={<LockClockRounded/>}
                                            title="Clock Outside Access"
                                        >

                                            <Typography mb={1}>
                                                Clock Outside
                                            </Typography>

                                            <FormControl fullWidth size="small">

                                                <Select
                                                    value={clockOutside}
                                                    onChange={handleClockOutsideChange}
                                                >

                                                    <MenuItem value="no">
                                                        No
                                                    </MenuItem>

                                                    <MenuItem value="yes">
                                                        Yes
                                                    </MenuItem>

                                                </Select>

                                            </FormControl>

                                        </GlassSection>

                                    </Grid>



                                </Grid>

                            </Box>

                        )}


                        {tab === 3 && (

                            <Box>

                                <GlassSection
                                icon={<SecurityRounded/>}
                                    title="Security Actions"
                                >

                                    <Button
                                        sx={{

                                            justifyContent: "flex-start",

                                            py: 1.6,

                                            fontWeight: 700,

                                            textTransform: "none",

                                            borderRadius: 2,

                                            background:
                                                coreDataDetails.C.freshGradient,

                                            "&:hover": {

                                                filter: "brightness(1.08)",

                                                boxShadow: `0 0 22px ${coreDataDetails.C.aquaVibrant}45`

                                            }

                                        }}
                                        fullWidth
                                        variant="contained"
                                        color="warning"
                                        onClick={() =>
                                            onResetBiometrics(user._id)
                                        }
                                        
                                    >

                                        Reset User Biometrics

                                    </Button>

                                </GlassSection>

                                <GlassSection
                                icon={<ManageAccountsRounded/>}
                                    title="Account Lifecycle"
                                >

                                    <Stack spacing={2}>

                                        <Button
                                            sx={{

                                                justifyContent: "flex-start",

                                                py: 1.6,

                                                fontWeight: 700,

                                                textTransform: "none",

                                                borderRadius: 2,

                                                background:
                                                    coreDataDetails.C.freshGradient,

                                                "&:hover": {

                                                    filter: "brightness(1.08)",

                                                    boxShadow: `0 0 22px ${coreDataDetails.C.aquaVibrant}45`

                                                }

                                            }}
                                            fullWidth
                                            variant="contained"
                                            color={
                                                user.isAccountActive
                                                    ? "warning"
                                                    : "success"
                                            }
                                            onClick={() =>
                                                onToggleActive(user._id)
                                            }
                                        >

                                            {user.isAccountActive
                                                ? "Deactivate Account"
                                                : "Activate Account"}

                                        </Button>

                                        <Button
                                            sx={{

                                                justifyContent: "flex-start",

                                                py: 1.6,

                                                fontWeight: 700,

                                                textTransform: "none",

                                                borderRadius: 2,

                                                background:
                                                    coreDataDetails.C.freshGradient,

                                                "&:hover": {

                                                    filter: "brightness(1.08)",

                                                    boxShadow: `0 0 22px ${coreDataDetails.C.aquaVibrant}45`

                                                }

                                            }}
                                            fullWidth
                                            variant="contained"
                                            color="error"
                                            onClick={() =>
                                                onDeleteUser(user._id)
                                            }
                                        >

                                            Delete User Permanently

                                        </Button>

                                    </Stack>

                                </GlassSection>

                            </Box>

                        )}

                    </DialogContent>
                </Box>

                <AnimatePresence>

                    {openClockModal && (

                        <motion.div

                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                zIndex: 100
                            }}

                            initial={{
                                opacity: 0,
                                scale: .9
                            }}

                            animate={{
                                opacity: 1,
                                scale: 1
                            }}

                            exit={{
                                opacity: 0,
                                scale: .9
                            }}

                            transition={{
                                duration: .25
                            }}

                        >

                            <ClockOutsideModal

                                open={openClockModal}

                                onClose={handleClose}

                                isLoading={isLoading}

                                error={error}

                                formData={formData}

                                setFormData={setFormData}

                                onSubmit={handleSubmit}

                            />

                        </motion.div>

                    )}

                </AnimatePresence>


            </Box>

        </Dialog>

    );

}