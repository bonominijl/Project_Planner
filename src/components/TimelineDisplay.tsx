import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Divider,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  Alert,
  Snackbar,
  Avatar,
  Chip,
  Tooltip,
  CircularProgress,
  styled,
  alpha,
  Drawer,
  Tab,
  Tabs,
  Badge,
  Menu,
  ListItemIcon,
  ListItemText,
  List,
  ListItem,
  AlertTitle
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addBusinessDays, differenceInBusinessDays, startOfDay, parseISO, isValid } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { styled as muiStyled, useTheme as muiUseTheme } from '@mui/material/styles';
import { 
  ChevronLeft as ChevronLeftIcon, 
  CalendarMonth as CalendarMonthIcon, 
  ViewList as ViewListIcon, 
  ViewTimeline as ViewTimelineIcon, 
  EventNote as EventNoteIcon,
  Event as EventIcon,
  Edit as EditIcon, 
  Close as CloseIcon, 
  Visibility as VisibilityIcon, 
  Share as ShareIcon, 
  ContentCopy as ContentCopyIcon, 
  PlayArrow as PlayArrowIcon, 
  CheckCircle as CheckCircleIcon, 
  Warning as WarningIcon, 
  Pending as PendingIcon, 
  MoreVert as MoreVertIcon, 
  Timeline as TimelineIcon,
  ArrowRightAlt as ArrowRightAltIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { calculateEndDate } from '../utils/dateUtils';
import GanttView from './GanttView';
import CalendarView from './CalendarView';
import googleCalendarService from '../services/GoogleCalendarService';
import TemplatePreview from './TemplatePreview';
import { useDevMode } from '../context/DevModeContext';
import DevModePageIdentifier from './DevModePageIdentifier';
import { BudgetTemplate, TemplateActivity, TemplateStage } from '../data/budgetTemplates';
import { findLatestEndDate, calculateProjectTimeline } from '../utils/projectUtils';
import { ProjectPlan, ProjectActivity, defaultActivities, ActivityDefinition } from '../types/projectTypes';

// Define the status type to match the ProjectActivity
type ActivityStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed';
type ViewMode = 'list' | 'gantt' | 'calendar' | 'overview';

interface TimelineDisplayProps {
  projectPlan: ProjectPlan;
  onUpdatePlan: (plan: ProjectPlan) => void;
  onPrevious: () => void;
  onComplete: () => void;
  onProjectInfoEdit?: () => void;
}

// Styled components for modern UI
const StyledViewToggle = muiStyled(ToggleButtonGroup)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
  '& .MuiToggleButton-root': {
    border: 'none',
    padding: theme.spacing(1, 2),
    textTransform: 'none',
    fontWeight: 500,
    '&.Mui-selected': {
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
      color: theme.palette.primary.main,
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.2),
      }
    }
  }
}));

const ActivityCard = muiStyled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 1.5,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4]
  }
}));

const ActionButton = muiStyled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: 'none',
  padding: theme.spacing(1, 2.5)
}));

const StatusChip = muiStyled(Chip)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.75rem',
  height: 24
}));

// Storage key for local storage - must match the one in App.tsx and ActivitySelection.tsx
const STORAGE_KEY = 'project_planner_projects';

const TimelineDisplay: React.FC<TimelineDisplayProps> = ({ 
  projectPlan,
  onUpdatePlan, 
  onPrevious,
  onComplete,
  onProjectInfoEdit
}) => {
  const theme = muiUseTheme();
  const [editActivityDialogOpen, setEditActivityDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ProjectActivity | null>(null);
  const [projectStartDate, setProjectStartDate] = useState<Date | null>(
    projectPlan.startDate || new Date()
  );
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCalendarSyncing, setIsCalendarSyncing] = useState(false);
  const [calendarSyncDialogOpen, setCalendarSyncDialogOpen] = useState(false);
  const [activityMenuAnchor, setActivityMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeActivity, setActiveActivity] = useState<ProjectActivity | null>(null);
  
  // New state for Google Calendar sync
  const [googleCalendarSynced, setGoogleCalendarSynced] = useState(!!projectPlan.googleCalendarId);
  
  // New state for auto-save
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveMessage, setAutoSaveMessage] = useState<string | null>(null);
  
  // Add sharing state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [clientViewDialogOpen, setClientViewDialogOpen] = useState(false);
  
  // Filter visible activities to only show those with visibleOnCalendar=true or undefined
  const getVisibleActivities = () => {
    return projectPlan.activities.filter(activity => {
      // If the activity has a defined visibleOnCalendar property, use it
      // Otherwise default to showing the activity (backward compatibility)
      return activity.visibleOnCalendar !== false;
    });
  };
  
  // Compute project statistics
  const totalActivities = projectPlan.activities.length;
  const completedActivities = projectPlan.activities.filter(a => a.status === 'completed').length;
  const inProgressActivities = projectPlan.activities.filter(a => a.status === 'in_progress').length;
  const delayedActivities = projectPlan.activities.filter(a => a.status === 'delayed').length;
  const completionPercentage = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
  
  const projectDuration = projectPlan.startDate && projectPlan.endDate
    ? differenceInBusinessDays(projectPlan.endDate, projectPlan.startDate) + 1
    : 0;
  
  // Updated form type definition
  const [editForm, setEditForm] = useState<{
    duration: number;
    revisions: number;
    status: ActivityStatus;
  }>({
    duration: 0,
    revisions: 0,
    status: 'not_started'
  });
  
  // Auto-save function to save the project plan to localStorage
  const saveProjectToLocalStorage = (plan: ProjectPlan) => {
    setIsSaving(true);
    setAutoSaveMessage("Saving changes...");
    
    setTimeout(() => {
      try {
        const savedProjects = localStorage.getItem(STORAGE_KEY);
        let projects = [];
        
        if (savedProjects) {
          projects = JSON.parse(savedProjects);
        }
        
        // Check if project already exists
        const existingProjectIndex = projects.findIndex((p: any) => p.id === plan.id);
        
        // Create project object in the format used by the dashboard
        const projectToSave = {
          id: plan.id,
          name: plan.name,
          createdAt: existingProjectIndex >= 0 ? 
            projects[existingProjectIndex].createdAt : 
            new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          kickoffDate: plan.startDate ? plan.startDate.toISOString() : new Date().toISOString(),
          dueDate: plan.endDate ? plan.endDate.toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          budget: existingProjectIndex >= 0 ? projects[existingProjectIndex].budget : 15000,
          status: 'active',
          description: existingProjectIndex >= 0 ? 
            projects[existingProjectIndex].description : 
            `Project plan with ${plan.activities.length} activities`,
          progress: existingProjectIndex >= 0 ? 
            projects[existingProjectIndex].progress : 0,
          client: existingProjectIndex >= 0 ? 
            projects[existingProjectIndex].client : "",
          activities: plan.activities
        };
        
        if (existingProjectIndex >= 0) {
          // Update existing project
          projects[existingProjectIndex] = {
            ...projects[existingProjectIndex],
            ...projectToSave,
            updatedAt: new Date().toISOString(),
            activities: plan.activities
          };
        } else {
          // Add new project
          projects.unshift(projectToSave);
        }
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        console.log("Project auto-saved:", plan.name);
        setAutoSaveMessage("All changes saved");
        
        // Hide the message after a delay
        setTimeout(() => {
          setAutoSaveMessage(null);
        }, 2000);
      } catch (error) {
        console.error("Error auto-saving project:", error);
        setErrorMessage("Error auto-saving your changes. Your work might not be saved.");
      }
      setIsSaving(false);
    }, 500); // Small delay to ensure UI responsiveness
  };
  
  // Enhanced onUpdatePlan function that also saves to localStorage
  const handleUpdatePlanWithAutoSave = (updatedPlan: ProjectPlan) => {
    // Call the original onUpdatePlan
    onUpdatePlan(updatedPlan);
    
    // Auto-save to localStorage
    saveProjectToLocalStorage(updatedPlan);
  };
  
  useEffect(() => {
    // Make sure start date is properly set when component mounts or projectPlan changes
    if (!projectPlan.startDate && projectStartDate) {
      try {
        const updatedPlan = calculateProjectTimeline({...projectPlan}, projectStartDate);
        handleUpdatePlanWithAutoSave(updatedPlan);
      } catch (error) {
        setErrorMessage("Error calculating timeline: " + (error instanceof Error ? error.message : "Unknown error"));
      }
    }
  }, [projectPlan, projectStartDate]);
  
  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setProjectStartDate(date);
      try {
        const updatedPlan = calculateProjectTimeline({...projectPlan}, date);
        handleUpdatePlanWithAutoSave(updatedPlan);
      } catch (error) {
        setErrorMessage("Error updating timeline: " + (error instanceof Error ? error.message : "Unknown error"));
      }
    }
  };
  
  const handleEditActivity = (activity: ProjectActivity) => {
    setEditingActivity(activity);
    setEditForm({
      duration: activity.duration,
      revisions: activity.revisions,
      status: activity.status
    });
    setEditActivityDialogOpen(true);
  };
  
  const handleCloseEditDialog = () => {
    setEditActivityDialogOpen(false);
    setEditingActivity(null);
  };
  
  const handleSaveActivity = () => {
    if (editingActivity) {
      try {
        // Update the activity in the project plan
        const updatedActivities = projectPlan.activities.map(activity => {
          if (activity.type === editingActivity.type) {
            return {
              ...activity,
              duration: editForm.duration,
              revisions: editForm.revisions,
              status: editForm.status,
            };
          }
          return activity;
        });
        
        // Recalculate timeline with updated activity
        const updatedPlan = calculateProjectTimeline({
          ...projectPlan,
          activities: updatedActivities
        }, projectPlan.startDate || new Date());
        
        handleUpdatePlanWithAutoSave(updatedPlan);
        setSuccessMessage(`Updated ${getActivityName(editingActivity.type)}`);
        handleCloseEditDialog();
      } catch (error) {
        setErrorMessage("Error saving activity: " + (error instanceof Error ? error.message : "Unknown error"));
      }
    }
  };
  
  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: ViewMode | null,
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };
  
  const handleErrorClose = () => {
    setErrorMessage(null);
  };
  
  const handleSuccessClose = () => {
    setSuccessMessage(null);
  };
  
  const getActivityName = (activityType: string) => {
    const activity = defaultActivities.find(a => a.id === activityType);
    return activity ? activity.name : activityType;
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return theme.palette.grey[400];
      case 'in_progress':
        return theme.palette.primary.main;
      case 'completed':
        return theme.palette.success.main;
      case 'delayed':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[400];
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started':
        return <PendingIcon fontSize="small" />;
      case 'in_progress':
        return <PlayArrowIcon fontSize="small" />;
      case 'completed':
        return <CheckCircleIcon fontSize="small" />;
      case 'delayed':
        return <WarningIcon fontSize="small" />;
      default:
        return <PendingIcon fontSize="small" />;
    }
  };

  const handleActivityMenuOpen = (event: React.MouseEvent<HTMLElement>, activity: ProjectActivity) => {
    setActivityMenuAnchor(event.currentTarget);
    setActiveActivity(activity);
  };

  const handleActivityMenuClose = () => {
    setActivityMenuAnchor(null);
    setActiveActivity(null);
  };

  const handleMarkActivityStatus = (status: ActivityStatus) => {
    if (activeActivity) {
      const updatedActivities = projectPlan.activities.map(activity => {
        if (activity.type === activeActivity.type) {
          return {
            ...activity,
            status
          };
        }
        return activity;
      });
      
      // Recalculate timeline with updated activity
      const updatedPlan = calculateProjectTimeline({
        ...projectPlan,
        activities: updatedActivities
      }, projectPlan.startDate || new Date());
      
      handleUpdatePlanWithAutoSave(updatedPlan);
      setSuccessMessage(`Updated ${getActivityName(activeActivity.type)} status to ${status.replace('_', ' ')}`);
    }
    handleActivityMenuClose();
  };
  
  // New function to handle Google Calendar sync
  const handleSyncWithGoogleCalendar = async () => {
    setCalendarSyncDialogOpen(true);
  };

  // Handle Google Calendar auth and sync
  const handleConfirmCalendarSync = async () => {
    if (!projectPlan.activities || projectPlan.activities.length === 0) {
      setErrorMessage("No activities to sync with Google Calendar");
      setCalendarSyncDialogOpen(false);
      return;
    }

    setIsAuthenticating(true);
    try {
      // Check if Google Calendar is properly configured
      if (!googleCalendarService.isProperlyConfigured()) {
        setErrorMessage("Google Calendar is not configured. Please set up your CLIENT_ID in GoogleCalendarService.ts");
        setIsAuthenticating(false);
        setCalendarSyncDialogOpen(false);
        return;
      }

      // Initialize and authenticate Google Calendar API
      console.log("Initializing Google Calendar API...");
      setSuccessMessage("Initializing Google Calendar API...");
      await googleCalendarService.initialize();
      
      console.log("Authenticating with Google Calendar...");
      setSuccessMessage("Authenticating with Google Calendar...");
      const authenticated = await googleCalendarService.authenticate();
      
      if (!authenticated) {
        console.error("Failed to authenticate with Google Calendar");
        setErrorMessage("Failed to authenticate with Google Calendar. Please try again or check console for errors.");
        setIsAuthenticating(false);
        setCalendarSyncDialogOpen(false);
        return;
      }

      console.log("Successfully authenticated with Google Calendar");
      setSuccessMessage("Successfully authenticated with Google Calendar");
      setIsCalendarSyncing(true);
      
      // Get available calendars
      console.log("Fetching available calendars...");
      setSuccessMessage("Fetching available calendars...");
      const calendars = await googleCalendarService.listCalendars();
      console.log("Available calendars:", calendars);
      
      // Create events for each activity
      const updatedActivities = [...projectPlan.activities];
      let calendarId = projectPlan.googleCalendarId || 'primary';
      console.log(`Using calendar ID: ${calendarId}`);
      
      setSuccessMessage("Creating calendar events...");
      for (let i = 0; i < updatedActivities.length; i++) {
        const activity = updatedActivities[i];
        
        if (!activity.startDate || !activity.endDate) {
          console.log(`Skipping activity ${activity.type} - no dates set`);
          continue;
        }
        
        // Convert activity to format needed by Google Calendar
        const customActivity = {
          id: activity.type,
          name: getActivityName(activity.type),
          description: `Project: ${projectPlan.name || 'Untitled Project'}`,
          duration: activity.duration,
          hoursPerDay: activity.hoursDuration || 8,
          revisions: activity.revisions,
          dependencies: [],
          canHaveRevisions: activity.revisions > 0,
          resourceType: activity.resourceType || 'project_manager'
        };
        
        try {
          console.log(`Creating/updating event for ${customActivity.name}...`);
          setSuccessMessage(`Creating event for ${customActivity.name}...`);
          // Create or update calendar event
          let eventId = activity.googleCalendarEventId;
          
          if (!eventId) {
            // Schedule new event
            eventId = await googleCalendarService.scheduleActivity(
              customActivity,
              activity.startDate,
              activity.endDate
            );
            
            console.log(`Created event with ID: ${eventId}`);
            
            // Update activity with event ID
            updatedActivities[i] = {
              ...activity,
              googleCalendarEventId: eventId
            };
          } else {
            console.log(`Activity already has event ID: ${eventId}`);
            // TODO: Update existing event (not implemented in current service)
          }
        } catch (activityError) {
          console.error(`Error scheduling activity ${activity.type}:`, activityError);
          setErrorMessage(`Error scheduling activity ${getActivityName(activity.type)}`);
        }
      }
      
      // Update project plan with Google Calendar info
      const updatedPlan: ProjectPlan = {
        ...projectPlan,
        activities: updatedActivities,
        googleCalendarId: calendarId
      };
      
      handleUpdatePlanWithAutoSave(updatedPlan);
      setGoogleCalendarSynced(true);
      setSuccessMessage("Successfully synchronized with Google Calendar");
    } catch (error) {
      console.error("Error syncing with Google Calendar:", error);
      setErrorMessage("Error syncing with Google Calendar: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsAuthenticating(false);
      setIsCalendarSyncing(false);
      setCalendarSyncDialogOpen(false);
    }
  };
  
  // (Helper function - place near other helpers)
  const dateReviver = (key: string, value: any) => {
    // List of keys expected to be dates
    const dateKeys = ['startDate', 'endDate', 'originalEndDate', 'createdAt', 'updatedAt', 'kickoffDate', 'dueDate'];
    if (dateKeys.includes(key) && typeof value === 'string') {
        const parsed = parseISO(value);
        // Return Date object if valid, otherwise return original string or null maybe?
        // Returning original value might be safer if parsing fails unexpectedly
        if (isValid(parsed)) return parsed;
        else console.warn(`[dateReviver] Failed to parse date string for key '${key}':`, value);
    }
    return value;
  };

  // Function to render the list view of activities
  const renderActivityList = () => {
    // Get only the activities that should be visible on the calendar
    const visibleActivities = getVisibleActivities();
    
    return (
      <Box>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Activities ({visibleActivities.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Completed">
              <Chip 
                icon={<CheckCircleIcon fontSize="small" />} 
                label={visibleActivities.filter(a => a.status === 'completed').length}
                size="small"
                color="success"
                variant="outlined"
              />
            </Tooltip>
            <Tooltip title="In Progress">
              <Chip 
                icon={<PlayArrowIcon fontSize="small" />} 
                label={visibleActivities.filter(a => a.status === 'in_progress').length}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Tooltip>
            <Tooltip title="Delayed">
              <Chip 
                icon={<WarningIcon fontSize="small" />} 
                label={visibleActivities.filter(a => a.status === 'delayed').length}
                size="small"
                color="error"
                variant="outlined"
              />
            </Tooltip>
          </Box>
        </Box>
        
        {visibleActivities.map((activity) => (
          <ActivityCard key={activity.type}>
            <CardContent sx={{ pb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {getActivityName(activity.type)}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <StatusChip
                    label={activity.status.replace('_', ' ')}
                    color={
                      activity.status === 'completed' ? 'success' :
                      activity.status === 'in_progress' ? 'primary' :
                      activity.status === 'delayed' ? 'error' : 'default'
                    }
                    icon={getStatusIcon(activity.status)}
                    size="small"
                  />
                  
                  <IconButton 
                    size="small" 
                    onClick={(e) => handleActivityMenuOpen(e, activity)}
                    sx={{ ml: 1 }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EventIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {activity.startDate && isValid(activity.startDate) ? format(activity.startDate, "MMM d, yyyy") : 'No date'}
                      {activity.endDate && activity.startDate && isValid(activity.startDate) && isValid(activity.endDate) &&
                        <>
                          <ArrowRightAltIcon sx={{ mx: 0.5, fontSize: 16 }} />
                          {format(activity.endDate, "MMM d, yyyy")}
                        </>
                      }
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {activity.duration} business day{activity.duration !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  {activity.resourceType && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {activity.resourceType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Typography>
                    </Box>
                  )}
                  {activity.revisions > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {/* Using a different icon for revisions if needed, or just text */}
                      <Tooltip title="Revisions included">
                         <Chip size="small" label={`${activity.revisions} revision${activity.revisions !== 1 ? 's' : ''}`} variant="outlined" sx={{height: 24}} />
                      </Tooltip>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </ActivityCard>
        ))}

        {/* Activity Action Menu */} 
        <Menu
          anchorEl={activityMenuAnchor}
          open={Boolean(activityMenuAnchor)}
          onClose={handleActivityMenuClose}
        >
          <MenuItem onClick={() => handleMarkActivityStatus('in_progress')} disabled={activeActivity?.status === 'in_progress'}>
            <ListItemIcon><PlayArrowIcon fontSize="small" color="primary" /></ListItemIcon>
            <ListItemText>Mark as In Progress</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleMarkActivityStatus('completed')} disabled={activeActivity?.status === 'completed'}>
            <ListItemIcon><CheckCircleIcon fontSize="small" color="success" /></ListItemIcon>
            <ListItemText>Mark as Completed</ListItemText>
          </MenuItem>
           <MenuItem onClick={() => handleMarkActivityStatus('delayed')} disabled={activeActivity?.status === 'delayed'}>
            <ListItemIcon><WarningIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Mark as Delayed</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleMarkActivityStatus('not_started')} disabled={activeActivity?.status === 'not_started'}>
            <ListItemIcon><PendingIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Mark as Not Started</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { if (activeActivity) handleEditActivity(activeActivity); handleActivityMenuClose(); }}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Edit Details</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    );
  };
  
  // In the renderView function, add a new case for the timeline overview
  const renderView = () => {
    // Use a key to force re-render when activities change
    const renderKey = JSON.stringify(projectPlan.activities.map(a => ({ 
      id: a.type, 
      status: a.status, 
      start: a.startDate?.getTime(),
      end: a.endDate?.getTime() 
    })));
    
    switch (viewMode) {
      case 'gantt':
        return <GanttView key={renderKey} projectPlan={{...projectPlan, activities: getVisibleActivities()}} />;
      case 'calendar':
        return <CalendarView key={renderKey} projectPlan={projectPlan} />;
      case 'overview':
        return renderTimelineOverview();
      default:
        return renderActivityList();
    }
  };

  // Import activities from the template with their updated status and dates
  const importActivitiesFromTemplate = (template: BudgetTemplate) => {
    console.log("[importActivitiesFromTemplate] Starting import and recalculation...");

    // --- Create a deep copy AND parse dates robustly ---
    let updatedPlan: ProjectPlan;
    try {
        // Use JSON parse with reviver for top-level dates
        const currentPlanString = JSON.stringify(projectPlan);
        updatedPlan = JSON.parse(currentPlanString, dateReviver);

        // *** Explicitly parse dates within the activities array AFTER main parse ***
        if (updatedPlan.activities && Array.isArray(updatedPlan.activities)) {
            updatedPlan.activities = updatedPlan.activities.map(activity => {
                // Explicitly type parsedActivity as ProjectActivity
                const parsedActivity: ProjectActivity = { ...activity }; 
                const keysToParse: (keyof ProjectActivity)[] = ['startDate', 'endDate', 'originalEndDate'];

                keysToParse.forEach(key => {
                    const value = parsedActivity[key];
                    let finalValue: Date | null = null; // Variable to hold the final parsed date or null

                    if (value) { // Check if the key exists and has a value
                        if (typeof value === 'string') {
                            try {
                                const parsedDate = parseISO(value);
                                if (isValid(parsedDate)) {
                                    finalValue = parsedDate;
                                } else {
                                    console.warn(`[Import Post-Parse] Invalid date string for '${key}' in activity ${parsedActivity.type}: ${value}`);
                                }
                            } catch (e) {
                                 console.error(`[Import Post-Parse] Error parsing date string for '${key}' in activity ${parsedActivity.type}: ${value}`, e);
                            }
                        } else if (value instanceof Date) {
                             if (isValid(value)) {
                                 finalValue = value; // Already a valid Date
                             } else {
                                console.warn(`[Import Post-Parse] Invalid Date object for '${key}' in activity ${parsedActivity.type}`);
                             }
                        } else {
                            // Try converting from other types (e.g., number/timestamp)
                             try {
                                const dateFromOtherType = new Date(value as any); 
                                if(isValid(dateFromOtherType)) {
                                    finalValue = dateFromOtherType;
                                } else {
                                    console.warn(`[Import Post-Parse] Could not convert value for '${key}' from type ${typeof value} to valid Date in activity ${parsedActivity.type}`);
                                }
                             } catch (e) {
                                  console.error(`[Import Post-Parse] Error converting value for '${key}' from type ${typeof value}`, e);
                             }
                        }
                    } 
                    // else: value is null or undefined, finalValue remains null

                    // --- Explicit Assignment --- 
                    // Assign finalValue (Date | null) to the specific property
                    switch (key) {
                        case 'startDate':
                            parsedActivity.startDate = finalValue;
                            break;
                        case 'endDate':
                            parsedActivity.endDate = finalValue;
                            break;
                        case 'originalEndDate':
                            parsedActivity.originalEndDate = finalValue;
                            break;
                        // No default needed as keysToParse is constrained
                    }
                });
                return parsedActivity;
            });
        } else {
            console.warn("[Import Post-Parse] updatedPlan.activities is missing or not an array.");
            updatedPlan.activities = []; // Ensure activities is an array
        }

    } catch (e) {
        console.error("[Import] Failed to parse or process projectPlan JSON:", e);
        setErrorMessage("Failed to load project data correctly.");
        return; // Stop execution if parsing fails
    }
    // --- End Date Parsing ---


    const activityMap = new Map<string, ProjectActivity>();
    updatedPlan.activities.forEach(activity => {
        activityMap.set(activity.type, activity); // Use the parsed activity
    });


    let anyStructuralChanges = false; // Track if status, duration etc changed

    // 1. Merge non-date structural data from template into the activity map
    template.stages?.forEach(stage => {
      stage.activities.forEach(templateActivity => {
        const activityId = templateActivity.id;
        const existingActivity = activityMap.get(activityId);
        if (existingActivity) {
          let changed = false;
          const workingActivity = { ...existingActivity };
          // Update status, duration, hours, revisions etc. (NO DATES HERE)
          if (templateActivity.status && workingActivity.status !== templateActivity.status) { workingActivity.status = templateActivity.status as ActivityStatus; changed = true; console.log(`[Import Merge] Activity ${activityId} status -> ${templateActivity.status}`); }
          if (templateActivity.durationDays && workingActivity.duration !== templateActivity.durationDays) { workingActivity.duration = templateActivity.durationDays; changed = true; console.log(`[Import Merge] Activity ${activityId} duration -> ${templateActivity.durationDays}`); }
          if (templateActivity.durationHours && workingActivity.hoursDuration !== templateActivity.durationHours) { workingActivity.hoursDuration = templateActivity.durationHours; changed = true; console.log(`[Import Merge] Activity ${activityId} hours -> ${templateActivity.durationHours}`);}
          // ... other non-date fields
          if(changed) {
              anyStructuralChanges = true;
              activityMap.set(activityId, workingActivity);
          }
        }
      });
    });

    // 2. Decide whether to recalculate dates:
    // - If project start date is missing/invalid
    // - OR if any structural changes occurred (like duration)
    // - OR if any activity is *still* missing a valid start date after parsing
    const currentProjectStartDate = updatedPlan.startDate && isValid(updatedPlan.startDate) ? updatedPlan.startDate : null;
    const activitiesMissingDates = updatedPlan.activities.some(a => !a.startDate || !isValid(a.startDate));
    const needsRecalculation = anyStructuralChanges || !currentProjectStartDate || activitiesMissingDates;


    if (needsRecalculation) {
        console.log(`[Import] Recalculating all activity dates. Reason: Structural changes=${anyStructuralChanges}, Project start date valid=${!!currentProjectStartDate}, Activities missing/invalid dates=${activitiesMissingDates}`);

        let orderedActivities = Array.from(activityMap.values());
        // TODO: Implement proper sorting based on dependencies if needed

        // Perform the sequential calculation using the PARSED start date
        const activitiesWithCalculatedDates = calculateSequentialActivityDates(orderedActivities, currentProjectStartDate);

        updatedPlan.activities = activitiesWithCalculatedDates; // Update activities with newly calculated dates
    } else {
        console.log("[Import] No structural changes or missing dates detected that require full date recalculation. Using existing parsed dates.");
        // Use activities as parsed earlier
        updatedPlan.activities = Array.from(activityMap.values());
    }


    // 3. Update project's overall end date based on the potentially recalculated dates
    const latestDate = findLatestEndDate(updatedPlan.activities);
    // Update end date logic (ensure originalEndDate is handled correctly)
      if (latestDate) {
          const currentEndDate = updatedPlan.endDate && isValid(updatedPlan.endDate) ? updatedPlan.endDate : null;
          // Check if the latest calculated date is different from the current valid end date
          if (!currentEndDate || latestDate.getTime() !== currentEndDate.getTime()) {
              // Store the *previous* valid end date as original, but only if originalEndDate isn't set yet
              if (!updatedPlan.originalEndDate && currentEndDate) {
                  updatedPlan.originalEndDate = new Date(currentEndDate.getTime());
                  console.log(`[Import] Stored original end date: ${updatedPlan.originalEndDate.toISOString()}`);
              }
              updatedPlan.endDate = latestDate;
              console.log(`[Import] Updated project end date to ${latestDate.toISOString()}`);
          }
      } else {
          // Handle case where no valid end date could be found (e.g., no activities)
          updatedPlan.endDate = null;
          console.warn("[Import] No valid latest end date found for activities.");
      }

    // 4. Save the potentially updated plan
    console.log(`[Import] Saving updated plan.`);
    handleUpdatePlanWithAutoSave(updatedPlan);
    setSuccessMessage("Project timeline updated/recalculated");

    // Force re-render (existing logic)
    const currentView = viewMode;
    setViewMode(currentView === 'list' ? 'calendar' : 'list');
    setTimeout(() => {
      setViewMode(currentView);
      console.log(`[Import] Reset view to ${currentView} to force refresh`);
    }, 100);
  };

  // (Helper function needed - place near other helpers or inside the component)
  const calculateSequentialActivityDates = (
    activities: ProjectActivity[],
    projectStartDate: Date | null
  ): ProjectActivity[] => {
    if (!projectStartDate) {
      console.warn('[calculateSequentialActivityDates] Project start date is missing, cannot calculate activity dates.');
      // Return activities without dates or with existing ones? Decide based on desired behavior.
      // For now, return as is, but ideally, prompt user or handle gracefully.
      return activities.map(act => ({ ...act, startDate: null, endDate: null }));
    }

    let currentStartDate = new Date(projectStartDate.getTime()); // Start with the project start date
    const calculatedActivities: ProjectActivity[] = [];

    console.log(`[calculateSequentialActivityDates] Starting calculation with project start date: ${currentStartDate.toISOString()}`);

    for (const activity of activities) {
      const calculatedActivity = { ...activity }; // Copy the activity

      // --- Assign Start Date ---
      calculatedActivity.startDate = new Date(currentStartDate.getTime()); // Assign the current start date

      // --- Calculate End Date ---
      // Ensure duration is a positive number
      const duration = Math.max(1, calculatedActivity.duration || 1);
      calculatedActivity.endDate = addBusinessDays(calculatedActivity.startDate, duration - 1);

      console.log(`[calculateSequentialActivityDates] Activity: ${activity.type}, Duration: ${duration}`);
      console.log(`  Calculated Start: ${calculatedActivity.startDate.toISOString()}`);
      console.log(`  Calculated End: ${calculatedActivity.endDate.toISOString()}`);


      // --- Update Start Date for the *next* activity ---
      // Next activity starts the business day after the current one ends
      currentStartDate = addBusinessDays(calculatedActivity.endDate, 1);

      calculatedActivities.push(calculatedActivity);
    }

    console.log('[calculateSequentialActivityDates] Finished calculating dates for all activities.');
    return calculatedActivities;
  };

  // Add a modified version of the TemplatePreview component that handles activity editing
  const renderTimelineOverview = () => {
    // Create a BudgetTemplate-compatible format from the project plan
    const projectTemplate: BudgetTemplate = {
      id: projectPlan.id,
      name: projectPlan.name,
      description: projectPlan.description || '',
      budgetAmount: projectPlan.budget || 0,
      totalDays: projectPlan.activities.reduce((sum, activity) => sum + activity.duration, 0),
      stages: generateStagesFromActivities(projectPlan.activities)
  };
  
  return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Timeline Overview
        </Typography>
        <TemplatePreview 
          template={projectTemplate}
          clientReviewDays={projectPlan.clientReviewDays || 2}
          projectStartDate={projectPlan.startDate || new Date()}
          onUpdateTemplate={(updatedTemplate) => importActivitiesFromTemplate(updatedTemplate)}
          editable={true}
        />
      </Box>
    );
  };

  // Helper function to generate stages from project activities
  const generateStagesFromActivities = (activities: ProjectActivity[]): TemplateStage[] => {
    // For simplicity, put all activities in a single stage
    // In a real implementation, you might want to group them by stage
    const activityTemplates: TemplateActivity[] = activities.map(activity => {
      return {
        id: activity.type,
        name: getActivityName(activity.type),
        description: getActivityDescription(activity.type),
        durationDays: activity.duration,
        durationHours: activity.hoursDuration || activity.duration * 8,
        resourceType: activity.resourceType || 'animator',
        canHaveRevisions: activity.revisions > 0,
        defaultRevisions: activity.revisions,
        visibleOnCalendar: activity.visibleOnCalendar !== false,
        startDate: activity.startDate ? new Date(activity.startDate) : undefined,
        endDate: activity.endDate ? new Date(activity.endDate) : undefined,
        status: activity.status
      };
    });

    return [{
      id: 'main-stage',
      name: 'Production Activities',
      description: 'All activities in the project',
      activities: activityTemplates,
      isMilestone: false
    }];
  };

  // Add a helper function to get activity descriptions
  const getActivityDescription = (activityType: string): string => {
    const activity = defaultActivities.find(a => a.id === activityType);
    return activity ? activity.description : 'Activity description not available';
  };

  // Add functions for sharing
  const handleOpenShareDialog = () => {
    // Generate a shareable link - in a real app, this would be a proper URL
    const link = `${window.location.origin}/client-view/${projectPlan.id}`;
    setShareLink(link);
    setShareDialogOpen(true);
    setLinkCopied(false);
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleOpenClientView = () => {
    setClientViewDialogOpen(true);
  };

  const handleCloseShareDialog = () => {
    setShareDialogOpen(false);
  };

  const handleCloseClientViewDialog = () => {
    setClientViewDialogOpen(false);
  };
  
  const { isDevMode } = useDevMode();
  
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Project Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          borderRadius: theme.shape.borderRadius * 2,
          mb: 4,
          backgroundColor: theme.palette.background.paper 
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {projectPlan.projectName || projectPlan.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {projectPlan.startDate && projectPlan.endDate && (
                <>
                  {format(projectPlan.startDate, 'MMM d, yyyy')} - {format(projectPlan.endDate, 'MMM d, yyyy')}
                  <span style={{ margin: '0 8px' }}>•</span>
                  {projectDuration} business days
                </>
              )}
            </Typography>
            {projectPlan.originalEndDate && projectPlan.endDate && 
              projectPlan.originalEndDate.getTime() !== projectPlan.endDate.getTime() && (
              <Typography variant="body2" sx={{ 
                mt: 1, 
                color: theme.palette.warning.main,
                display: 'flex',
                alignItems: 'center'
              }}>
                <WarningIcon fontSize="small" sx={{ mr: 0.5 }} />
                Original delivery date: {format(projectPlan.originalEndDate, 'MMM d, yyyy')} 
                <span style={{ margin: '0 4px' }}>•</span>
                {differenceInBusinessDays(projectPlan.endDate, projectPlan.originalEndDate) > 0 ? 
                  `Delayed by ${differenceInBusinessDays(projectPlan.endDate, projectPlan.originalEndDate)} business day(s)` : 
                  `Expedited by ${differenceInBusinessDays(projectPlan.originalEndDate, projectPlan.endDate)} business day(s)`}
              </Typography>
            )}
            {projectPlan.creator && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Created by: {projectPlan.creator}
              </Typography>
            )}
            </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
                  variant="outlined"
                  color="primary"
              startIcon={<ShareIcon />}
              onClick={handleOpenShareDialog}
              sx={{ 
                borderRadius: theme.shape.borderRadius * 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Share
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<VisibilityIcon />}
              onClick={handleOpenClientView}
              sx={{ 
                borderRadius: theme.shape.borderRadius * 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Client View
            </Button>
          </Box>
        </Box>

        {/* Project Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, height: '100%', borderRadius: theme.shape.borderRadius * 1.5 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Completion
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {completionPercentage}%
                </Typography>
                <Box sx={{ mt: 1, width: '100%', height: 4, backgroundColor: alpha(theme.palette.primary.main, 0.2), borderRadius: 2 }}>
                  <Box 
        sx={{ 
                      height: '100%', 
                      width: `${completionPercentage}%`, 
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: 2
                    }} 
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, height: '100%', borderRadius: theme.shape.borderRadius * 1.5 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Activities
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {completedActivities}/{totalActivities}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {getVisibleActivities().length} visible in timeline
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, height: '100%', borderRadius: theme.shape.borderRadius * 1.5 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Time Left
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {projectPlan.endDate ? differenceInBusinessDays(projectPlan.endDate, new Date()) : 0} days
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {projectPlan.endDate && format(projectPlan.endDate, 'MMM d, yyyy')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, height: '100%', borderRadius: theme.shape.borderRadius * 1.5 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Overall Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {delayedActivities > 0 ? (
                    <StatusChip 
                      label="Attention Needed" 
                      color="warning" 
                      size="small" 
                      icon={<WarningIcon />} 
                    />
                  ) : completionPercentage === 100 ? (
                    <StatusChip 
                      label="Completed" 
                      color="success" 
                      size="small" 
                      icon={<CheckCircleIcon />} 
                    />
                  ) : completionPercentage > 0 ? (
                    <StatusChip 
                      label="In Progress" 
                      color="primary" 
                      size="small" 
                      icon={<PlayArrowIcon />} 
                    />
                  ) : (
                    <StatusChip 
                      label="Not Started" 
                      color="default" 
                      size="small" 
                      icon={<PendingIcon />} 
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {delayedActivities > 0 && `${delayedActivities} delayed ${delayedActivities === 1 ? 'activity' : 'activities'}`}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* View toggles */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <StyledViewToggle
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="view mode"
            sx={{ ml: 'auto' }}
          >
            <ToggleButton value="list" aria-label="list view">
              <Tooltip title="List View">
                <ViewListIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="gantt" aria-label="gantt view">
              <Tooltip title="Gantt View">
                <ViewTimelineIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="calendar" aria-label="calendar view">
              <Tooltip title="Calendar View">
                <CalendarMonthIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="overview" aria-label="timeline overview">
              <Tooltip title="Timeline Overview">
                <ViewTimelineIcon />
              </Tooltip>
            </ToggleButton>
          </StyledViewToggle>
        </Box>
      </Paper>
        
      {/* Timeline View */}
      <Box sx={{ mt: 3, mb: 4 }}>
        {renderView()}
      </Box>

      {/* Footer Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, mb: 5 }}>
        <Button
            variant="outlined" 
            color="inherit"
            onClick={onPrevious}
          sx={{ 
            borderRadius: theme.shape.borderRadius * 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Back to Project Plan
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained" 
            onClick={onComplete}
            sx={{ 
              borderRadius: theme.shape.borderRadius * 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Finalize Plan
          </Button>
        </Box>
      </Box>

      {/* Project Activities Configuration Section */}
      <Divider sx={{ my: 5 }}>
        <Chip label="Project Activities Configuration" />
      </Divider>

      <Box sx={{ mb: 4 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            borderRadius: theme.shape.borderRadius * 2,
            mb: 4,
            backgroundColor: theme.palette.background.paper 
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Project Activities
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Review and modify the activities in your project. Changes will automatically update the timeline above.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {onProjectInfoEdit && (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={onProjectInfoEdit}
                  sx={{ 
                    borderRadius: theme.shape.borderRadius * 2,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Edit Project Details
                </Button>
              )}
            </Box>
          </Box>

          {/* Show the BudgetTemplate of the project if available */}
          {projectPlan.budgetTemplate && (
            <TemplatePreview 
              template={projectPlan.budgetTemplate} 
              clientReviewDays={projectPlan.clientReviewDays || 2} 
            />
          )}

          {/* Activities List with Ability to Edit */}
          <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
            Project Activities Timeline
          </Typography>
          {renderActivityList()}
      </Paper>
      </Box>

      {/* Sharing Dialog */}
      <Dialog
        open={shareDialogOpen}
        onClose={handleCloseShareDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share Project Plan</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" paragraph>
              Share this link with your client or team members to give them access to the project timeline.
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={shareLink}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCopyLink}
                    startIcon={<ContentCopyIcon />}
                    sx={{
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      height: '56px'
                    }}
                  >
                    {linkCopied ? 'Copied!' : 'Copy'}
                  </Button>
                )
              }}
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
              Note: Anyone with this link can view but not edit the project timeline.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseShareDialog} color="inherit">
            Close
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<VisibilityIcon />}
            onClick={() => {
              handleCloseShareDialog();
              handleOpenClientView();
            }}
          >
            Preview Client View
          </Button>
        </DialogActions>
      </Dialog>

      {/* Client View Dialog - In a real app, this would be a separate page/route */}
      <Dialog
        open={clientViewDialogOpen}
        onClose={handleCloseClientViewDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Client View - {projectPlan.projectName || projectPlan.name}</Typography>
            <Button onClick={handleCloseClientViewDialog} color="inherit">
              Close
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              {projectPlan.projectName || projectPlan.name} - Project Timeline
            </Typography>
            <Typography variant="body1" paragraph>
              {projectPlan.startDate && projectPlan.endDate && (
                <>
                  {format(projectPlan.startDate, 'MMMM d, yyyy')} - {format(projectPlan.endDate, 'MMMM d, yyyy')}
                </>
              )}
            </Typography>
            {projectPlan.originalEndDate && projectPlan.endDate && 
              projectPlan.originalEndDate.getTime() !== projectPlan.endDate.getTime() && (
              <Typography variant="body2" sx={{
                mb: 2,
                color: theme.palette.warning.main,
                display: 'flex',
                alignItems: 'center'
              }}>
                <WarningIcon fontSize="small" sx={{ mr: 0.5 }} />
                Original delivery date: {format(projectPlan.originalEndDate, 'MMMM d, yyyy')}
                {differenceInBusinessDays(projectPlan.endDate, projectPlan.originalEndDate) > 0 && (
                  <Chip 
                    size="small" 
                    label={`${differenceInBusinessDays(projectPlan.endDate, projectPlan.originalEndDate)} day delay`}
                    color="warning"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
            )}
            {projectPlan.creator && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Created by: {projectPlan.creator}
              </Typography>
            )}
            <Box sx={{ my: 3 }}>
              <Typography variant="h6" gutterBottom>
                Project Progress: {completionPercentage}% Complete
              </Typography>
              <Box sx={{ mt: 1, width: '100%', height: 8, backgroundColor: alpha(theme.palette.primary.main, 0.2), borderRadius: 4 }}>
                <Box 
                  sx={{ 
                    height: '100%', 
                    width: `${completionPercentage}%`, 
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: 4
                  }} 
                />
              </Box>
            </Box>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Upcoming Milestones:
              </Typography>
              {getVisibleActivities()
                .filter(activity => activity.status !== 'completed')
                .slice(0, 3)
                .map(activity => (
                  <Box key={activity.type} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        backgroundColor: 
                          activity.status === 'in_progress' ? theme.palette.primary.main : 
                          activity.status === 'delayed' ? theme.palette.warning.main :
                          theme.palette.grey[400],
                        mr: 2
                      }} 
                    />
                    <Box>
                      <Typography variant="body1">
                        {getActivityName(activity.type.toString())}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {activity.startDate && format(activity.startDate, 'MMM d')} - {activity.endDate && format(activity.endDate, 'MMM d, yyyy')}
                      </Typography>
                    </Box>
                  </Box>
                ))}
            </Box>
            
            {/* Simplified Gantt for client view */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Timeline Overview:
              </Typography>
              <Box sx={{ height: '300px', mt: 2 }}>
                <CalendarView 
                  projectPlan={{
                    ...projectPlan,
                    activities: getVisibleActivities()
                  }}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
      
      {/* Edit Activity Dialog */}
      <Dialog 
        open={editActivityDialogOpen} 
        onClose={handleCloseEditDialog}
        PaperProps={{
          sx: { borderRadius: theme.shape.borderRadius * 1.5 }
        }}
      >
        <DialogTitle component="div" sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Edit Activity
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {editingActivity && (
            <Box sx={{ pt: 1, width: 400, maxWidth: '100%' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                {getActivityName(editingActivity.type)}
              </Typography>
              
              <TextField
                label="Duration (business days)"
                type="number"
                fullWidth
                margin="normal"
                value={editForm.duration}
                onChange={(e) => setEditForm({...editForm, duration: Math.max(1, parseInt(e.target.value) || 0)})}
                InputProps={{ inputProps: { min: 1 } }}
              />
              
              {editingActivity.revisions !== undefined && (
                <TextField
                  label="Number of Revisions"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={editForm.revisions}
                  onChange={(e) => setEditForm({...editForm, revisions: Math.max(0, parseInt(e.target.value) || 0)})}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              )}
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  value={editForm.status}
                  label="Status"
                  onChange={(e) => setEditForm({...editForm, status: e.target.value as ActivityStatus})}
                >
                  <MenuItem value="not_started">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PendingIcon fontSize="small" sx={{ mr: 1, color: theme.palette.grey[500] }} />
                      Not Started
                    </Box>
                  </MenuItem>
                  <MenuItem value="in_progress">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PlayArrowIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                      In Progress
                    </Box>
                  </MenuItem>
                  <MenuItem value="completed">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: theme.palette.success.main }} />
                      Completed
                    </Box>
                  </MenuItem>
                  <MenuItem value="delayed">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WarningIcon fontSize="small" sx={{ mr: 1, color: theme.palette.error.main }} />
                      Delayed
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseEditDialog} color="inherit" sx={{ textTransform: 'none', fontWeight: 500 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveActivity} 
            variant="contained" 
            color="primary"
            sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Google Calendar Sync Dialog */}
      <Dialog 
        open={calendarSyncDialogOpen} 
        onClose={() => !isAuthenticating && !isCalendarSyncing && setCalendarSyncDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: theme.shape.borderRadius * 1.5 }
        }}
      >
        <DialogTitle component="div" sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Sync with Google Calendar
          </Typography>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ pt: 1, width: 450, maxWidth: '100%' }}>
            {!googleCalendarService.isProperlyConfigured() ? (
              <>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <AlertTitle>Google Calendar Not Configured</AlertTitle>
                  You need to complete the Google Calendar API setup before using this feature.
                </Alert>
                
                <Typography variant="body1" paragraph>
                  To set up Google Calendar integration:
                </Typography>
                
                <Box component="ol" sx={{ pl: 2 }}>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      Create a Google Cloud project and enable the Google Calendar API
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      Configure the OAuth consent screen
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      Create OAuth 2.0 credentials and get your Client ID
                    </Typography>
                  </Box>
                  <Box component="li">
                    <Typography variant="body2">
                      Update the CLIENT_ID in <code>src/services/GoogleCalendarService.ts</code>
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
                  Detailed setup instructions are available in the comments at the top of the GoogleCalendarService.ts file.
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body1" paragraph>
                  This will create calendar events for all project activities. You'll need to authorize access to your Google Calendar.
                </Typography>
                
                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.light, 0.1), borderRadius: theme.shape.borderRadius, mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.primary.main }}>
                    Events will be created with:
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    <Box component="li" sx={{ mb: 0.5 }}>
                      <Typography variant="body2">
                        Activity name and details
                      </Typography>
                    </Box>
                    <Box component="li" sx={{ mb: 0.5 }}>
                      <Typography variant="body2">
                        Start and end dates based on the project timeline
                      </Typography>
                    </Box>
                    <Box component="li">
                      <Typography variant="body2">
                        Resource assignments when applicable
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </>
            )}
            
            {(isAuthenticating || isCalendarSyncing) && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                <Typography variant="body2">
                  {isAuthenticating ? 'Authenticating with Google...' : 'Syncing calendar events...'}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setCalendarSyncDialogOpen(false)} 
            color="inherit"
            disabled={isAuthenticating || isCalendarSyncing}
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            {!googleCalendarService.isProperlyConfigured() ? 'Close' : 'Cancel'}
          </Button>
          {googleCalendarService.isProperlyConfigured() && (
            <Button 
              onClick={handleConfirmCalendarSync} 
              variant="contained" 
              color="primary"
              disabled={isAuthenticating || isCalendarSyncing}
              startIcon={<EventIcon />}
              sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
            >
              {isAuthenticating ? 'Authenticating...' : 
                isCalendarSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Error and Success messages */}
      <Snackbar 
        open={!!errorMessage} 
        autoHideDuration={6000} 
        onClose={handleErrorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleErrorClose} 
          severity="error" 
          variant="filled"
          sx={{ width: '100%', borderRadius: theme.shape.borderRadius * 2 }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={4000} 
        onClose={handleSuccessClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSuccessClose} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%', borderRadius: theme.shape.borderRadius * 2 }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* DevMode Identifier */}
      <DevModePageIdentifier page="TimelineDisplay" component="Project Timeline" />
    </Box>
  );
};

export default TimelineDisplay; 