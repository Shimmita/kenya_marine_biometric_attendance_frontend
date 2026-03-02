// CEOOverview.jsx
import { Box, Typography } from '@mui/material';
import coreDataDetails from '../CoreDataDetails';
const { colorPalette } = coreDataDetails;

export default function CEOOverview({ title }) {
  return (
    <Box sx={{
      p: 3,
      borderRadius: '24px',
      background: 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(18px)',
      boxShadow: '0 10px 40px rgba(0,60,120,0.12)'
    }}>
      <Typography variant="h5" fontWeight={900}
        sx={{
          background: colorPalette.oceanGradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
        {title}
      </Typography>

      <Typography mt={2} color="text.secondary">
        CEO strategic analytics view. Expand this with organisation-wide KPIs,
        comparative station analytics and performance heatmaps.
      </Typography>
    </Box>
  );
}