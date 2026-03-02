import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function SupervisorManageMembers() {
    return (
        <Box p={3}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                    Manage Your Members
                </Typography>

                <Typography color="text.secondary">
                    This page will allow supervisors to manage users
                    under their department.
                </Typography>
            </Paper>
        </Box>
    );
}