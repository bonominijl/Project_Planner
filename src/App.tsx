import React, { useState, useEffect } from 'react';
import { 
  Box,
  CssBaseline,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Stepper,
  Step,
  StepLabel,
  ThemeProvider,
  Button,
  Snackbar,
  Alert,
  Link,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Avatar,
  ListItemIcon
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import HomeIcon from '@mui/icons-material/Home';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { format, addBusinessDays, differenceInBusinessDays } from 'date-fns';

import { epipheoTheme } from './themes/epipheoTheme';
import ActivitySelection from './components/ActivitySelection';
import TimelineDisplay from './components/TimelineDisplay';
import ActivitiesTimelineView from './components/ActivitiesTimelineView';
import { ProjectPlan, ProjectActivity } from './types/projectTypes';
import { calculateProjectTimeline } from './utils/projectUtils';
import ClientView from './components/ClientView';
import googleCalendarService from './services/GoogleCalendarService';
import Footer from './components/Footer';
import { useAuth } from './auth/AuthContext';
import ProjectPlannerLogo from './components/ProjectPlannerLogo';
import DevModeProvider from './context/DevModeContext';
import DevModePageIdentifier from './components/DevModePageIdentifier';

// Storage key for local storage
const STORAGE_KEY = 'project_planner_projects';
const AUDIT_LOG_KEY = 'project_planner_audit_log';

// Type for audit log entry
interface AuditLogEntry {
  id?: string;
  action: string;
  projectId: string;
  projectName: string;
  user: string;
  timestamp: string;
  details?: string;
}

// Function to save an action to the audit log
const saveToAuditLog = (entry: Omit<AuditLogEntry, 'id'>) => {
  try {
    // Get existing audit log
    const storedLog = localStorage.getItem(AUDIT_LOG_KEY);
    let auditLog: AuditLogEntry[] = [];
    
    if (storedLog) {
      try {
        auditLog = JSON.parse(storedLog);
      } catch (error) {
        console.error('Error parsing audit log:', error);
        auditLog = [];
      }
    }
    
    // Add new entry with a unique ID
    const newEntry: AuditLogEntry = {
      ...entry,
      id: uuidv4()
    };
    
    // Add to beginning of log (most recent first)
    auditLog.unshift(newEntry);
    
    // Limit log size (optional, to prevent localStorage from getting too large)
    if (auditLog.length > 1000) {
      auditLog = auditLog.slice(0, 1000);
    }
    
    // Save updated log
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(auditLog));
    console.log('Action saved to audit log:', newEntry.action);
  } catch (error) {
    console.error('Error saving to audit log:', error);
  }
};

const App: React.FC = () => {
  console.log("App component loaded - version with debug code");
  
  const [activeStep, setActiveStep] = useState(0);
  const [projectPlan, setProjectPlan] = useState<ProjectPlan>({
    id: uuidv4(),
    name: 'New Animation Project',
    startDate: new Date(),
    endDate: null,
    activities: []
  });
  const [showClientView, setShowClientView] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // User menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const { currentUser, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // User menu handlers
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setAnchorEl(null);
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

  // Check for URL parameters on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const projectName = searchParams.get('name');
    
    if (projectName) {
      // Update the project name from URL parameter
      setProjectPlan(prevPlan => ({
        ...prevPlan,
        name: projectName
      }));
      
      console.log(`Set project name from URL parameter: ${projectName}`);
    }
    
    // Check if we're editing an existing project
    const projectId = searchParams.get('projectId');
    
    if (projectId) {
      // Try to load the project from localStorage
      const savedProjects = localStorage.getItem(STORAGE_KEY);
      if (savedProjects) {
        try {
          // Parse the JSON string and convert date strings back to Date objects
          const parsedProjects = JSON.parse(savedProjects, (key, value) => {
            if (key === 'createdAt' || key === 'updatedAt' || key === 'kickoffDate' || key === 'dueDate' || key === 'startDate' || key === 'endDate') {
              return value ? new Date(value) : null;
            }
            return value;
          });
          
          const existingProject = parsedProjects.find((p: any) => p.id === projectId);
          if (existingProject) {
            // Convert the project to a ProjectPlan format
            const existingPlan: ProjectPlan = {
              id: existingProject.id,
              name: existingProject.name,
              startDate: existingProject.kickoffDate || new Date(),
              endDate: existingProject.dueDate || null,
              activities: existingProject.activities || []
            };
            
            setProjectPlan(existingPlan);
            setSuccessMessage(`Loaded project "${existingProject.name}" for editing`);
          }
        } catch (error) {
          console.error('Error loading projects from localStorage:', error);
        }
      }
    }
  }, [location]);

  // Check for Google OAuth redirect results when the app loads
  useEffect(() => {
    const handleGoogleRedirect = async () => {
      // Check if we're returning from a Google Auth redirect
      if (window.location.hash.includes('access_token')) {
        console.log('Detected Google Auth redirect');
        try {
          // Process the redirect result
          const success = googleCalendarService.checkRedirectResult();
          if (success) {
            console.log('Successfully authenticated with Google after redirect');
            setSuccessMessage('Successfully authenticated with Google Calendar');
            
            // Initialize Google Calendar API
            await googleCalendarService.initialize();
          }
        } catch (error) {
          console.error('Error processing Google Auth redirect:', error);
        }
      }
    };
    
    handleGoogleRedirect();
  }, []);

  const handleActivitySelectionComplete = (activities: ProjectActivity[]) => {
    // Get the most recent project info from localStorage
    const projectId = localStorage.getItem('most_recent_project_id');
    const projectName = localStorage.getItem('most_recent_project_name');
    
    console.log('[App] Retrieved project info from localStorage:', { projectId, projectName });
    
    if (!projectId || !projectName) {
      console.warn('[App] Missing project ID or name from localStorage');
    }
    
    // Update the project plan with the correct name and ID from localStorage
    const updatedProjectPlan = {
      ...projectPlan,
      id: projectId || projectPlan.id,
      name: projectName || projectPlan.name,
      activities: activities
    };
    
    // Calculate timeline with the properly named project plan
    const timelineProjectPlan = calculateProjectTimeline(
      updatedProjectPlan, 
      updatedProjectPlan.startDate || new Date()
    );
    
    console.log('[App] Updated project plan:', timelineProjectPlan);
    
    setProjectPlan(timelineProjectPlan);
    setActiveStep(1);
  };

  const handleUpdatePlan = (plan: ProjectPlan) => {
    console.log('[App] Updating project plan and saving to localStorage:', plan.name);
    
    // Update state
    setProjectPlan(plan);
    
    // Auto-save to localStorage
    const savedProjects = localStorage.getItem(STORAGE_KEY);
    let projects = [];
    
    if (savedProjects) {
      try {
        projects = JSON.parse(savedProjects);
        console.log('[App] Found existing projects:', projects.length);
      } catch (error) {
        console.error('[App] Error parsing saved projects:', error);
        projects = [];
      }
    }
    
    // Get user information from localStorage
    let creator = 'Anonymous User';
    try {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        creator = user.name || 'Anonymous User';
      }
    } catch (error) {
      console.error('Error getting user info:', error);
    }
    
    // Check if this is an existing project
    const existingProjectIndex = projects.findIndex((p: any) => p.id === plan.id);
    
    // Prepare project object for localStorage
    const projectToSave = {
      id: plan.id,
      name: plan.name,
      createdAt: existingProjectIndex >= 0 ? projects[existingProjectIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      kickoffDate: plan.startDate ? plan.startDate.toISOString() : new Date().toISOString(),
      dueDate: plan.endDate ? plan.endDate.toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      budget: existingProjectIndex >= 0 ? projects[existingProjectIndex].budget : 15000,
      status: 'active',
      description: existingProjectIndex >= 0 ? 
        projects[existingProjectIndex].description : 
        `Project plan with ${plan.activities.length} activities`,
      progress: existingProjectIndex >= 0 ? projects[existingProjectIndex].progress : 0,
      client: existingProjectIndex >= 0 ? projects[existingProjectIndex].client : "",
      creator: existingProjectIndex >= 0 ? projects[existingProjectIndex].creator || creator : creator,
      activities: plan.activities
    };
    
    if (existingProjectIndex >= 0) {
      // Update existing project
      projects[existingProjectIndex] = {
        ...projects[existingProjectIndex],
        ...projectToSave,
        name: plan.name, // Ensure we keep the right name
        updatedAt: new Date().toISOString(),
        activities: plan.activities
      };
    } else {
      // Add new project
      projects.unshift(projectToSave);
    }
    
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      console.log('[App] Project saved automatically:', plan.name);
      
      // Save action to audit log
      saveToAuditLog({
        action: 'UPDATE_TIMELINE',
        projectId: plan.id,
        projectName: plan.name,
        user: creator,
        timestamp: new Date().toISOString(),
        details: `Timeline updated with ${plan.activities.length} activities`
      });
    } catch (error) {
      console.error('[App] Error saving project to localStorage:', error);
    }
  };

  const handlePrevious = () => {
    setActiveStep(activeStep - 1);
  };

  const handleComplete = () => {
    // Save the project plan to localStorage
    console.log('Finalizing project plan in localStorage...');
    console.log('Project plan to finalize:', projectPlan);
    
    const savedProjects = localStorage.getItem(STORAGE_KEY);
    console.log('Existing localStorage content:', savedProjects);
    let projects = [];
    
    if (savedProjects) {
      try {
        projects = JSON.parse(savedProjects);
        console.log('Found existing projects:', projects.length);
      } catch (error) {
        console.error('Error parsing saved projects:', error);
        // Initialize as empty array if there's an error
        projects = [];
      }
    } else {
      console.log('No existing projects found in localStorage');
    }
    
    // Get user information from localStorage
    let creator = 'Anonymous User';
    try {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        creator = user.name || 'Anonymous User';
      }
    } catch (error) {
      console.error('Error getting user info:', error);
    }
    
    // Check if this is an existing project
    const existingProjectIndex = projects.findIndex((p: any) => p.id === projectPlan.id);
    console.log('Existing project index:', existingProjectIndex);
    
    // Convert from ProjectPlan to the Project format used in the dashboard
    const projectToSave = {
      id: projectPlan.id,
      name: projectPlan.name, // This will now be the correct name from ActivitySelection
      createdAt: existingProjectIndex >= 0 ? projects[existingProjectIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      kickoffDate: projectPlan.startDate ? projectPlan.startDate.toISOString() : new Date().toISOString(),
      dueDate: projectPlan.endDate ? projectPlan.endDate.toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      budget: existingProjectIndex >= 0 ? projects[existingProjectIndex].budget : 15000, // Use existing budget if available
      status: 'active',
      description: existingProjectIndex >= 0 ? 
        projects[existingProjectIndex].description : 
        `Project plan with ${projectPlan.activities.length} activities`,
      progress: existingProjectIndex >= 0 ? projects[existingProjectIndex].progress : 0,
      client: existingProjectIndex >= 0 ? projects[existingProjectIndex].client : "",
      creator: existingProjectIndex >= 0 ? projects[existingProjectIndex].creator || creator : creator,
      activities: projectPlan.activities
    };
    
    console.log('Project to save:', projectToSave);
    
    if (existingProjectIndex >= 0) {
      // Update existing project but make sure to preserve the name
      projects[existingProjectIndex] = {
        ...projects[existingProjectIndex],
        ...projectToSave,
        name: projectPlan.name, // Ensure we keep the correct name
        updatedAt: new Date().toISOString(),
        // Activities are completely replaced with the new ones
        activities: projectPlan.activities
      };
      console.log('Updated existing project at index:', existingProjectIndex);
    } else {
      // Add new project
      projects.unshift(projectToSave);
      console.log('Added new project, total count now:', projects.length);
    }
    
    // Save updated projects to localStorage - use direct string conversion to ensure proper serialization
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      console.log('Project saved successfully:', projectToSave.name);
      
      // Save to audit log
      saveToAuditLog({
        action: 'FINALIZE_PROJECT',
        projectId: projectToSave.id,
        projectName: projectToSave.name,
        user: creator,
        timestamp: new Date().toISOString(),
        details: `Project finalized with ${projectPlan.activities.length} activities`
      });
      
      // Clean up the temporary storage
      localStorage.removeItem('most_recent_project_id');
      localStorage.removeItem('most_recent_project_name');
      
      // Show success message
      setSuccessMessage(`Project plan "${projectPlan.name}" has been finalized!`);
      
      // Navigate back to home immediately
      navigate('/');
    } catch (error) {
      console.error('Error saving project to localStorage:', error);
      setSuccessMessage(`Error saving project: ${error}`);
    }
  };

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  const steps = ['Project Details', 'Activities & Timeline'];

  const renderStep = () => {
    if (showClientView) {
      return (
        <Box sx={{ mt: 4 }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setShowClientView(false)}
            sx={{ mb: 2, borderRadius: epipheoTheme.shape.borderRadius * 2 }}
          >
            Back to Plan
          </Button>
          <ClientView projectPlan={projectPlan} />
        </Box>
      );
    }

    // We're now using a clearer page-based navigation
    return (
      <>
        {activeStep === 0 ? (
          // Project details page
          <ActivitySelection 
            onComplete={(activities) => {
              handleActivitySelectionComplete(activities);
            }} 
            projectPlan={projectPlan}
            onDirectTimelineAccess={() => {
              setActiveStep(1);
            }}
          />
        ) : (
          // Combined timeline and activities page
          <ActivitiesTimelineView
            projectPlan={projectPlan}
            onUpdatePlan={handleUpdatePlan}
            onPrevious={handlePrevious}
            onComplete={handleComplete}
            onProjectInfoEdit={() => setActiveStep(0)}
          />
        )}
      </>
    );
  };

  return (
    <DevModeProvider>
      <ThemeProvider theme={epipheoTheme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CssBaseline />
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
              <Toolbar>
                <ProjectPlannerLogo />
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  Project Planner
                </Typography>
                
                <IconButton 
                  color="inherit" 
                  component={RouterLink} 
                  to="/" 
                  aria-label="Back to Projects"
                  sx={{ mr: 1 }}
                >
                  <HomeIcon />
                </IconButton>
                
                <IconButton 
                  color="inherit" 
                  component={RouterLink} 
                  to="/admin" 
                  aria-label="Admin Dashboard"
                  sx={{ mr: 1 }}
                >
                  <AdminPanelSettingsIcon />
                </IconButton>
                
                <IconButton
                  onClick={handleUserMenuOpen}
                  size="large"
                  edge="end"
                  aria-label="account menu"
                  aria-controls={open ? 'account-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? 'true' : undefined}
                  color="inherit"
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
              anchorEl={anchorEl}
              id="account-menu"
              open={open}
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
              <Box sx={{ width: '100%', mt: 4 }}>
                <Stepper activeStep={activeStep} alternativeLabel>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
                
                {renderStep()}
              </Box>
            </Container>
            
            <Footer />
          </Box>
          
          {/* Success message for Google Calendar authentication */}
          <Snackbar
            open={!!successMessage}
            autoHideDuration={6000}
            onClose={handleCloseSuccessMessage}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              onClose={handleCloseSuccessMessage}
              severity="success"
              variant="filled"
              sx={{ width: '100%', borderRadius: epipheoTheme.shape.borderRadius * 2 }}
            >
              {successMessage}
            </Alert>
          </Snackbar>
          
          {/* Add the DevModePageIdentifier component */}
          <DevModePageIdentifier page="App" component="Main App" />
        </LocalizationProvider>
      </ThemeProvider>
    </DevModeProvider>
  );
};

export default App; 