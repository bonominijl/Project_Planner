import React, { useState } from 'react';
import { 
  AppBar as MuiAppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar, 
  Button
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { styled, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import ProjectPlannerLogo from './ProjectPlannerLogo';

const drawerWidth = 240;

const AppBarStyled = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

interface AppBarProps {
  open?: boolean;
  drawerOpen?: boolean;
  handleDrawerOpen?: () => void;
  toggleDrawer?: () => void;
  user?: {
    name: string;
    email: string;
    photoURL?: string;
  };
}

const AppBar: React.FC<AppBarProps> = ({
  open,
  drawerOpen,
  handleDrawerOpen,
  toggleDrawer,
  user = {
    name: 'Guest User',
    email: 'guest@projectplanner.com',
    photoURL: null
  },
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleLogout = () => {
    handleClose();
    // Implement logout functionality
    navigate('/login');
  };

  return (
    <AppBarStyled position="fixed" open={open}>
      <Toolbar>
        {toggleDrawer && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer}
            edge="start"
            sx={{ marginRight: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        {handleDrawerOpen && !drawerOpen && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: 5,
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <ProjectPlannerLogo />
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Project Planner
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button color="inherit" onClick={() => navigate('/')}>
            Home
          </Button>
          <Button color="inherit" onClick={() => navigate('/projects')}>
            Projects
          </Button>
          <Button color="inherit" onClick={() => navigate('/admin')}>
            Admin
          </Button>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            {user.photoURL ? (
              <Avatar src={user.photoURL} alt={user.name} />
            ) : (
              <AccountCircle />
            )}
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleProfile}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBarStyled>
  );
};

export default AppBar; 