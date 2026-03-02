import {
    LockPersonRounded,
    Business,
    SupervisorAccount
} from '@mui/icons-material';
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    Slide,
    Stack,
    Typography
} from '@mui/material';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetClearCurrentUserRedux } from '../redux/CurrentUser';
import { userSignOut } from '../service/UserProfile';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function DialogAlert() {
    const [open, setOpen] = React.useState(true);
    const [processing, setProcessing] = React.useState(false);
    const [isHelp, setIsHelp] = React.useState(false);

    const dispatch = useDispatch();

    // Get current user safely from redux
    const currentUser = useSelector((state) => state?.currentUser?.user);

    const department = currentUser?.department || "Not Assigned";
    const supervisor = currentUser?.supervisor || "Not Assigned";

    const handleClose = async () => {
        try {
            setProcessing(true);
            await userSignOut();
            dispatch(resetClearCurrentUserRedux());
            setOpen(false);
        } catch (error) {
            console.log(error);
        } finally {
            setProcessing(false);
        }
    };

    const handleHelp = () => {
        setIsHelp(prev=>!prev);
    };

    return (
        <>
            <Dialog
                open={open}
                TransitionComponent={Transition}
                keepMounted
                fullWidth
                maxWidth="sm"
                aria-describedby="account-deactivated-description"
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        p: 1
                    }
                }}
            >
                {/* HEADER */}
                <DialogTitle
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        fontWeight: 600,
                        color: '#0A3D62'
                    }}
                >
                    <Avatar
                        sx={{
                            bgcolor: '#E3F2FD',
                            color: '#0A3D62'
                        }}
                    >
                        <LockPersonRounded />
                    </Avatar>
                    Account Deactivated
                </DialogTitle>

                <Divider />

                {/* CONTENT */}
                <DialogContent dividers>
                    <DialogContentText
                        id="account-deactivated-description"
                        sx={{ mb: 2 }}
                    >
                        Your account has not yet been activated for clocking services.
                        Please contact your assigned departmental supervisor, HR, or Admin
                        to activate your account.
                    </DialogContentText>

                    {isHelp && (
                        <Box
                            sx={{
                                mt: 2,
                                p: 2,
                                borderRadius: 3,
                                bgcolor: '#F5F9FF',
                                border: '1px solid #E3F2FD'
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                fontWeight={600}
                                gutterBottom
                                color="#0A3D62"
                            >
                                Your Assignment Details
                            </Typography>

                            <Stack spacing={2}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Business fontSize="small" color="primary" />
                                    <Chip
                                        label={`Department: ${department}`}
                                        variant="outlined"
                                        sx={{ fontWeight: 500 }}
                                    />
                                </Stack>

                                <Stack direction="row" spacing={1} alignItems="center">
                                    <SupervisorAccount fontSize="small" color="primary" />
                                    <Chip
                                        label={`Supervisor: ${supervisor}`}
                                        variant="outlined"
                                        sx={{ fontWeight: 500 }}
                                    />
                                </Stack>
                            </Stack>
                        </Box>
                    )}
                </DialogContent>

                <Divider />

                {/* ACTIONS */}
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={handleHelp}
                        sx={{
                            borderRadius: 3,
                            textTransform: 'none'
                        }}
                        disabled={processing}
                    >
                      Help
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleClose}
                        disabled={processing}
                        sx={{
                            borderRadius: 3,
                            textTransform: 'none'
                        }}
                        startIcon={
                            processing ? (
                                <CircularProgress size={18} color="inherit" />
                            ) : null
                        }
                    >
                        {processing ? "Signing out..." : "Close"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}