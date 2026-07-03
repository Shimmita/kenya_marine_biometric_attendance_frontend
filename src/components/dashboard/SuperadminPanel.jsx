import { Box, Paper } from '@mui/material';
import ConfigPanel from './ConfigPanel';

const SuperadminPanel = ({ onConfigLoaded }) => {
  return (

      <Box sx={{ p: 2, borderRadius: 3, background: 'rgba(255,255,255,0.92)', boxShadow: '0 18px 48px rgba(15,23,42,0.06)' }}>
        <ConfigPanel onConfigLoaded={onConfigLoaded} />
      </Box>
  );
};

export default SuperadminPanel;
