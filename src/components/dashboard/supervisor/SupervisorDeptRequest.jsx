import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function SupervisorDeptRequest() {
    return (
        <Box p={3}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                    Departmental Requests
                </Typography>

                <Typography color="text.secondary">
                    This page will show departmental approvals,
                    escalations and request logs.
                </Typography>
            </Paper>
        </Box>
    );
}