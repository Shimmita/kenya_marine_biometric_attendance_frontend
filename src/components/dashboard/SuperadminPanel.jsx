import React from 'react';
import { Box, Stack, Typography, Button, Paper } from '@mui/material';
import { Settings, SupervisorAccount, InsightsRounded, History } from '@mui/icons-material';
import ConfigPanel from './ConfigPanel';

const SuperadminPanel = ({ onConfigLoaded }) => {
  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper sx={{ p: 3, borderRadius: 3, background: 'rgba(255,255,255,0.88)', boxShadow: '0 20px 60px rgba(15,23,42,0.08)' }}>
        <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
          <Settings sx={{ fontSize: 36, color: '#0e7490' }} />
          <Box>
            <Typography variant="h5" fontWeight={900} sx={{ color: '#0f172a' }}>
              Superadmin Console
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', mt: 0.5 }}>
              Manage global platform settings, departments, stations, dropdown options, and audit-level configuration.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3, background: 'rgba(255,255,255,0.92)', boxShadow: '0 18px 48px rgba(15,23,42,0.06)' }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2, color: '#0f172a' }}>
          Superadmin Tasks
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Platform Settings', icon: <Settings />, color: '#06b6d4' },
            { label: 'User & Feedback', icon: <SupervisorAccount />, color: '#1d4ed8' },
            { label: 'Audit Logs', icon: <History />, color: '#8b5cf6' },
            { label: 'Reports Overview', icon: <InsightsRounded />, color: '#14b8a6' },
          ].map((item) => (
            <Button
              key={item.label}
              variant="outlined"
              startIcon={item.icon}
              sx={{
                borderColor: `${item.color}50`, color: `${item.color}cc`,
                borderRadius: '14px', textTransform: 'none', fontWeight: 700,
                '&:hover': { borderColor: item.color, background: `${item.color}10` },
                flex: 1,
              }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>

        <Typography variant="body2" sx={{ color: '#475569', mb: 1 }}>
          Use the platform configuration below to adjust company settings, update dropdown values, and manage departments/stations. Only superadmins can access this area.
        </Typography>

        <ConfigPanel onConfigLoaded={onConfigLoaded} />
      </Paper>
    </Box>
  );
};

export default SuperadminPanel;
