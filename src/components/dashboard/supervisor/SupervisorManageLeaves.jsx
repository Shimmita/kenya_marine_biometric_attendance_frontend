import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function SupervisorManageLeaves() {
    return (
        <Box p={3}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                    Member Leave Requests
                </Typography>

                <Typography color="text.secondary">
                    Supervisors will review and approve leave
                    requests submitted by department members.
                </Typography>
            </Paper>
        </Box>
    );
}