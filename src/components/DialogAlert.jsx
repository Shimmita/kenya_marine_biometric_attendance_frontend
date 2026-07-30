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

export default function DialogAlertDashBoard() {
    const [open, setOpen] = React.useState(true);
    const [processing, setProcessing] = React.useState(false);
    const dispatch = useDispatch();

    const currentUser = useSelector((state) => state?.currentUser?.user);

    // If user is neither deactivated nor on leave, render nothing
    if (!currentUser) return null;
    if (currentUser.isAccountActive !== false && currentUser.isOnLeave !== true) {
        return null;
    }

    // Determine which scenario we're in
    const isDeactivated = currentUser.isAccountActive === false;
    const isOnLeave = currentUser.isOnLeave === true;

    // Dialog content based on scenario
    const getContent = () => {
        if (isDeactivated) {
            return {
                title: 'Account Deactivated',
                icon: <LockPersonRounded />,
                message: `Your account has been deactivated and is no longer active. Please contact your Human Resource (HR) department at ${currentUser?.station || 'your HR team'} for assistance. To continue, you will be signed out.`,
                buttonText: processing ? 'Signing out...' : 'Sign Out & Close',
                showSignOut: true,
            };
        }
        if (isOnLeave) {
            return {
                title: 'On Leave',
                icon: <Business />,
                message: 'You are currently on leave. Clocking services are temporarily disabled. If you need to clock in or out, please contact your supervisor. You may close this message and continue browsing.',
                buttonText: 'Close',
                showSignOut: false,
            };
        }
        return null;
    };

    const content = getContent();
    if (!content) return null;

    const handleClose = () => {
        // For on‑leave, just close the dialog
        setOpen(false);
    };

    const handleSignOut = async () => {
        try {
            setProcessing(true);
            await userSignOut();
            dispatch(resetClearCurrentUserRedux());
            setOpen(false);
        } catch (error) {
            console.error('Sign out error:', error);
        } finally {
            setProcessing(false);
        }
    };

    // Decide which action to take when the button is clicked
    const handleAction = content.showSignOut ? handleSignOut : handleClose;

    return (
        <Dialog
            open={open}
            TransitionComponent={Transition}
            keepMounted
            fullWidth
            maxWidth="sm"
            aria-describedby="account-status-description"
            // For deactivated: prevent dismissing by backdrop click or Escape key
            disableEscapeKeyDown={isDeactivated}
            disableBackdropClick={isDeactivated}
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
                    {content.icon}
                </Avatar>
                {content.title}
            </DialogTitle>

            <Divider />

            {/* CONTENT */}
            <DialogContent dividers>
                <DialogContentText
                    id="account-status-description"
                    sx={{ mb: 2 }}
                >
                    {content.message}
                </DialogContentText>
                {isDeactivated && currentUser?.station && (
                    <Typography variant="body2" color="text.secondary">
                        Station: <strong>{currentUser.station}</strong>
                    </Typography>
                )}
            </DialogContent>

            <Divider />

            {/* ACTIONS */}
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    variant="contained"
                    onClick={handleAction}
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
                    {content.buttonText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}