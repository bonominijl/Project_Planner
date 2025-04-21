import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Alert,
  Snackbar,
  Container,
  Divider,
  AppBar,
  Toolbar,
  IconButton
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import TemplateEditor from './TemplateEditor';
import HolidayManager from './HolidayManager';
import UserManager from './UserManager';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

const AdminDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSuccess = (message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'success'
    });
  };

  const handleError = (message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'error'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const handleGoBack = () => {
    // Implement navigation or go to home page
    window.location.href = '/';
  };

  return (
    <>
      <AppBar position="static" color="default">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleGoBack}
            aria-label="back to dashboard"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ ml: 2 }}>
            Admin Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="admin dashboard tabs"
              variant="fullWidth"
            >
              <Tab label="Budget Templates" {...a11yProps(0)} />
              <Tab label="Company Holidays" {...a11yProps(1)} />
              <Tab label="User Management" {...a11yProps(2)} />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              Manage Budget Templates
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Edit existing budget templates, including activities, durations, and resource assignments.
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <TemplateEditor 
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Manage Company Holidays
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Add, edit, or remove company holidays that will be excluded from project timeline calculations.
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <HolidayManager
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Manage Users
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Add, edit, or remove users and manage their permissions within the Project Planner.
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <UserManager
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </TabPanel>
        </Paper>
      </Container>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AdminDashboard; 