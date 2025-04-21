import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Divider,
  Container,
  Alert,
  useTheme,
  IconButton,
  Breadcrumbs,
  Link,
  ThemeProvider,
  CssBaseline,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  Avatar,
  ListItemIcon
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import TemplateEditor from './admin/TemplateEditor';
import HolidayManager from './admin/HolidayManager';
import AuditLogViewer from './admin/AuditLogViewer';
import AdminIcon from '@mui/icons-material/AdminPanelSettings';
import CalendarIcon from '@mui/icons-material/CalendarMonth';
import TemplateIcon from '@mui/icons-material/LibraryBooks';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import HistoryIcon from '@mui/icons-material/History';
import Footer from './Footer';
import { epipheoTheme } from '../themes/epipheoTheme';
import { useAuth } from '../auth/AuthContext';
import ProjectPlannerLogo from './ProjectPlannerLogo';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
      style={{ padding: '24px 0' }}
    >
      {value === index && (
        <Box>{children}</Box>
      )}
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [saveStatus, setSaveStatus] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // User menu state
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
  const userMenuOpen = Boolean(userMenuAnchorEl);
  const { currentUser, isAuthenticated, logout } = useAuth();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // User menu handlers
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };
  
  const handleProfileClick = () => {
    navigate('/profile');
    handleUserMenuClose();
  };
  
  const handleLoginClick = () => {
    navigate('/login');
    handleUserMenuClose();
  };
  
  const handleLogoutClick = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
    handleUserMenuClose();
  };

  // Clear status messages after 5 seconds
  useEffect(() => {
    if (saveStatus) {
      const timer = setTimeout(() => {
        setSaveStatus(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleSaveSuccess = (message: string) => {
    setSaveStatus({
      message,
      type: 'success'
    });
  };

  const handleSaveError = (message: string) => {
    setSaveStatus({
      message,
      type: 'error'
    });
  };

  return (
    <ThemeProvider theme={epipheoTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static" sx={{ mb: 4 }}>
          <Toolbar>
            <ProjectPlannerLogo />
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
              Admin Dashboard
            </Typography>
            
            <IconButton 
              color="inherit" 
              component={RouterLink} 
              to="/" 
              aria-label="Home"
              sx={{ mr: 1 }}
            >
              <HomeIcon />
            </IconButton>
            
            <IconButton
              onClick={handleUserMenuOpen}
              size="large"
              edge="end"
              aria-label="account menu"
              aria-controls={userMenuOpen ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={userMenuOpen ? 'true' : undefined}
              color="inherit"
              sx={{ mr: 1 }}
            >
              {isAuthenticated && currentUser?.photoUrl ? (
                <Avatar 
                  src={currentUser.photoUrl}
                  alt={currentUser.name} 
                  sx={{ width: 32, height: 32 }}
                />
              ) : (
                <AccountCircleIcon />
              )}
            </IconButton>
          </Toolbar>
        </AppBar>
        
        {/* User Menu */}
        <Menu
          anchorEl={userMenuAnchorEl}
          id="account-menu"
          open={userMenuOpen}
          onClose={handleUserMenuClose}
          onClick={handleUserMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.12))',
              mt: 1.5,
              minWidth: 200,
            }
          }}
        >
          {isAuthenticated ? (
            <>
              <MenuItem onClick={handleProfileClick}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogoutClick}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </>
          ) : (
            <MenuItem onClick={handleLoginClick}>
              <ListItemIcon>
                <LoginIcon fontSize="small" />
              </ListItemIcon>
              Login
            </MenuItem>
          )}
        </Menu>
        
        <Container maxWidth="lg" sx={{ flex: 1 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: theme.shape.borderRadius * 2,
              backgroundColor: theme.palette.background.paper
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
                <Link
                  component={RouterLink}
                  to="/"
                  color="inherit"
                  underline="hover"
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
                  Home
                </Link>
                <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <AdminIcon sx={{ mr: 0.5 }} fontSize="small" />
                  Admin Dashboard
                </Typography>
              </Breadcrumbs>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  startIcon={<ArrowBackIcon />}
                  component={RouterLink}
                  to="/"
                  sx={{ mr: 2 }}
                  variant="outlined"
                >
                  Back to Planner
                </Button>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                  Admin Dashboard
                </Typography>
              </Box>
            </Box>

            {saveStatus && (
              <Alert 
                severity={saveStatus.type} 
                sx={{ mb: 3, borderRadius: theme.shape.borderRadius }}
                onClose={() => setSaveStatus(null)}
              >
                {saveStatus.message}
              </Alert>
            )}

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={currentTab} 
                onChange={handleTabChange}
                aria-label="admin dashboard tabs"
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    minHeight: 48,
                  }
                }}
              >
                <Tab 
                  icon={<TemplateIcon sx={{ mr: 1 }} />} 
                  iconPosition="start" 
                  label="Budget Templates" 
                  id="admin-tab-0" 
                  aria-controls="admin-tabpanel-0" 
                />
                <Tab 
                  icon={<CalendarIcon sx={{ mr: 1 }} />} 
                  iconPosition="start" 
                  label="Company Holidays" 
                  id="admin-tab-1" 
                  aria-controls="admin-tabpanel-1" 
                />
                <Tab 
                  icon={<HistoryIcon sx={{ mr: 1 }} />} 
                  iconPosition="start" 
                  label="Audit Log" 
                  id="admin-tab-2" 
                  aria-controls="admin-tabpanel-2" 
                />
              </Tabs>
            </Box>
            
            <TabPanel value={currentTab} index={0}>
              <TemplateEditor onSuccess={handleSaveSuccess} onError={handleSaveError} />
            </TabPanel>
            
            <TabPanel value={currentTab} index={1}>
              <HolidayManager onSuccess={handleSaveSuccess} onError={handleSaveError} />
            </TabPanel>
            
            <TabPanel value={currentTab} index={2}>
              <AuditLogViewer />
            </TabPanel>
          </Paper>
        </Container>
        <Footer />
      </Box>
    </ThemeProvider>
  );
};

export default AdminDashboard; 