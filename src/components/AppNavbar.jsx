import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import * as React from 'react';
import KMFRILogo from '../assets/kmfri.png';

const pages = ['Kenya Marine and Fisheries Research Institute', 'Kenya Marine and Fisheries'];
const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

function AppNavbar() {
  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  // Responsive: show long name on md+ and short name on small screens
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const displayedPages = React.useMemo(() => {
    const first = isMdUp ? pages[0] : (pages[1] ?? pages[0]);
    const rest = pages.slice(2);
    return [first, ...rest];
  }, [isMdUp]);

  return (
    <AppBar variant='outlined' position="sticky" sx={{ zIndex: (theme) => theme.zIndex.appBar }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 0, mr: { xs: 0, md: 1 } }}>
            <Box
              component="img"
              src={KMFRILogo}
              alt="KMFRI Logo"
              sx={{
                display: { xs: 'none', md: 'block' },
                height: { md: 45, lg: 60 },
                width: 'auto',
                borderRadius: '50%',
                objectFit: 'cover',
                mr: 1,
              }}
            />
          </Box>

          {/* Small device title (left) */}
          <Typography
            variant="h5"
            noWrap
            component="div"
            sx={{
              display: { xs: 'block', md: 'none' },
              flexGrow: 1,
              color: 'inherit',
              textAlign: 'left',
              textTransform: "uppercase",
              ml: 1,
              mr: 2,
            }}
          >
            {pages[1]}
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {displayedPages.map((page) => (
              <Button
                key={page}
                sx={{ my: 2, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)', display: 'block', fontWeight: 'bold' }}
              >
                {page}
              </Button>
            ))}
          </Box>
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, ml: { xs: 1, md: 0 } }}>
                <Avatar
                  alt="Remy Sharp"
                  src="/static/images/avatar/2.jpg"
                  sx={{ width: { xs: 36, md: 44 }, height: { xs: 36, md: 44 } }}
                />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="user-menu"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={handleCloseUserMenu}>
                  <Typography sx={{ textAlign: 'center' }}>{setting}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default AppNavbar;
