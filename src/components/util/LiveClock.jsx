import { Typography, Stack, useMediaQuery, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';

const LiveClock = () => {
    const [time, setTime] = useState(new Date());
    const theme=useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant={isMobile ? 'h4':'h2'} fontWeight={950} sx={{ color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: '#fff' }}>
                {time.toLocaleDateString()}
            </Typography>
        </Stack>
    );
};

export default LiveClock;