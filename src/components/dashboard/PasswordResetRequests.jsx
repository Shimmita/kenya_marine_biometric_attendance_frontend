import { CheckCircle, Refresh } from '@mui/icons-material';
import { Alert, Avatar, Box, Button, Card, CircularProgress, Grid, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchPasswordResetRequests, allowPasswordReset } from '../../service/ResetPasswordService';
import coreDataDetails from '../CoreDataDetails';

const { colorPalette } = coreDataDetails;

const initials = (value) => {
    if (!value) return '??';
    const name = value.split('@')[0].replace(/[^a-zA-Z]/g, ' ');
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0]?.slice(0, 2).toUpperCase() || value.slice(0, 2).toUpperCase();
};

const assertStatus = (req) => {
    if (req.userIsPasswordReset) return { label: 'Approved', color: '#15803d', bg: 'rgba(220,252,231,0.8)' };
    return { label: 'Pending', color: '#b45309', bg: 'rgba(254,243,199,0.8)' };
};

const PasswordResetRequests = ({ readOnly = false }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');
    const [actionError, setActionError] = useState('');
    const [processingEmail, setProcessingEmail] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogEmail, setDialogEmail] = useState('');
    const [adminNewPassword, setAdminNewPassword] = useState('');
    const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
    const [dialogError, setDialogError] = useState('');
    const [dialogProcessing, setDialogProcessing] = useState(false);

    const loadRequests = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await fetchPasswordResetRequests();
            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(typeof err === 'string' ? err : 'Failed to load requests');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleAllow = async (email) => {
        // Open dialog so admin can enter new password for the user
        setDialogError('');
        setAdminNewPassword('');
        setAdminConfirmPassword('');
        setDialogEmail(email);
        setDialogOpen(true);
    };

    const handleConfirmAllow = async () => {
        setDialogError('');
        if (!adminNewPassword || adminNewPassword.length < 6) {
            setDialogError('Password must be at least 6 characters');
            return;
        }
        if (adminNewPassword !== adminConfirmPassword) {
            setDialogError('Passwords do not match');
            return;
        }

        setDialogProcessing(true);
        setProcessingEmail(dialogEmail);
        try {
            await allowPasswordReset(dialogEmail, adminNewPassword);
            setActionMessage(`Password reset completed for ${dialogEmail}`);
            setDialogOpen(false);
            await loadRequests();
        } catch (err) {
            setActionError(typeof err === 'string' ? err : 'Action failed');
        } finally {
            setDialogProcessing(false);
            setProcessingEmail('');
        }
    };

    const cards = useMemo(() => {
        if (!requests.length) return null;

        return requests.map((req) => {
            const status = assertStatus(req);
            return (
                <Grid item xs={12} sm={6} md={4} key={req._id || req.email}>
                    <Card sx={{ p: 2.25, borderRadius: '16px', border: '1px solid rgba(10,61,98,0.16)' }}>
                        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.25 }}>
                            <Avatar sx={{ bgcolor: colorPalette.oceanBlue, width: 42, height: 42 }}>{initials(req.email)}</Avatar>
                            <Stack>
                                <Typography fontWeight={800} sx={{ fontSize: '0.92rem' }}>{req.userName || 'Unknown User'}</Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{req.email}</Typography>
                            </Stack>
                        </Stack>nnnnnnn 

                        <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mb: 1 }}>
                            <Box sx={{ px: 1.05, py: 0.35, borderRadius: 1, bgcolor: status.bg, color: status.color, fontWeight: 700, fontSize: '0.7rem' }}>{status.label}</Box>
                            <Box sx={{ px: 1.05, py: 0.35, borderRadius: 1, bgcolor: 'rgba(59,130,246,0.12)', color: '#0ea5e9', fontWeight: 700, fontSize: '0.7rem' }}>{req.role || 'N/A'}</Box>
                        </Stack>

                        <Stack spacing={0.45} sx={{ mb: 1.2 }}>
                            <Typography variant="caption" color="text.secondary">Department: <strong>{req.department || 'N/A'}</strong></Typography>
                            <Typography variant="caption" color="text.secondary">Station: <strong>{req.station || 'N/A'}</strong></Typography>
                            <Typography variant="caption" color="text.secondary">Requested: <strong>{new Date(req.createdAt).toLocaleString()}</strong></Typography>
                        </Stack>

                        <Button
                            size="small"
                            fullWidth
                            variant="contained"
                            sx={{ textTransform: 'none', fontWeight: 700 }}
                            disabled={req.userIsPasswordReset || processingEmail === req.email || readOnly}
                            onClick={() => handleAllow(req.email)}
                            startIcon={processingEmail === req.email ? <CircularProgress size={15} /> : <CheckCircle />}
                        >
                            {readOnly ? 'Read Only' : req.userIsPasswordReset ? 'Already Approved' : 'Allow Request'}
                        </Button>
                    </Card>
                </Grid>
            );
        });
    }, [requests, processingEmail]);

    return (
        <Box sx={{ p: 2.5, height: '100%', overflowY: 'auto' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h5" fontWeight={800}>Password Reset Requests</Typography>
                <Button variant="outlined" onClick={loadRequests} startIcon={<Refresh />} sx={{ textTransform: 'none' }}>Refresh</Button>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
            {actionMessage && <Alert severity="success" sx={{ mb: 2 }}>{actionMessage}</Alert>}

            <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    {readOnly ? 'View user password reset requests (read-only access).' : 'As an admin, approve user password reset requests.'}
                </Typography>
            </Box>

            {loading ? (
                <Stack spacing={1}>
                    {[...Array(3)].map((_, i) => <Box key={i} sx={{ height: 116, background: 'rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%' }} />)}
                </Stack>
            ) : requests.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', borderRadius: '16px', background: 'rgba(255,255,255,0.08)' }}>
                    <Typography>No pending password reset requests.</Typography>
                </Box>
            ) : (
                <Grid container spacing={2}>{cards}</Grid>
            )}

            <Dialog
                open={dialogOpen}
                onClose={() => !dialogProcessing && setDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { maxWidth: 400 } // Clean, compact size ideal for a password prompt
                }}
            >
                <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
                    Set New Password
                </DialogTitle>

                {/* Wrapping in a form allows submission on pressing 'Enter' */}
                <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!dialogProcessing) handleConfirmAllow();
                }}>
                    <DialogContent dividers sx={{ pt: 2, pb: 3 }}>
                        <Stack spacing={2.5}>
                            {dialogError && (
                                <Alert severity="error" variant="outlined" sx={{ width: '100%' }}>
                                    {dialogError}
                                </Alert>
                            )}

                            <TextField
                                autoFocus
                                label="New Password"
                                type="password"
                                fullWidth
                                variant="outlined"
                                value={adminNewPassword}
                                onChange={(e) => setAdminNewPassword(e.target.value)}
                                disabled={dialogProcessing}
                            />

                            <TextField
                                label="Confirm New Password"
                                type="password"
                                fullWidth
                                value={adminConfirmPassword}
                                onChange={(e) => setAdminConfirmPassword(e.target.value)}
                                error={adminConfirmPassword.length > 0 && adminNewPassword !== adminConfirmPassword}
                                helperText={adminConfirmPassword.length > 0 && adminNewPassword !== adminConfirmPassword ? "Passwords do not match" : ""}
                                disabled={dialogProcessing}
                            />
                        </Stack>
                    </DialogContent>

                    <DialogActions sx={{ p: 2, px: 3 }}>
                        <Button
                            onClick={() => setDialogOpen(false)}
                            disabled={dialogProcessing}
                            variant="text"
                            color="inherit"
                            sx={{
                                borderRadius:2
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            sx={{
                                borderRadius:2
                            }}
                            variant="contained"
                            color="primary"
                            disabled={dialogProcessing || !adminNewPassword || !adminConfirmPassword}
                            startIcon={dialogProcessing ? null : <CheckCircle />}
                        >
                            {dialogProcessing ? <CircularProgress size={20} color="inherit" /> : 'Set Password'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default PasswordResetRequests;
