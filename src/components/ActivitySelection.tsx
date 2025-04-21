import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Button,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  styled,
  alpha,
  Chip,
  Avatar,
  Badge,
  Select,
  MenuItem,
  InputLabel,
  OutlinedInput,
  useTheme,
  CircularProgress,
  Alert,
  Snackbar,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { 
  ActivityType,
  ActivityDefinition,
  ProjectActivity,
  defaultActivities,
  ResourceType,
  ProjectPlan
} from '../types/projectTypes';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import LoopIcon from '@mui/icons-material/Loop';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import SettingsIcon from '@mui/icons-material/Settings';
import ReorderIcon from '@mui/icons-material/Reorder';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewTimelineIcon from '@mui/icons-material/ViewTimeline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { v4 as uuidv4 } from 'uuid';
import ProjectInfoForm, { ProjectInfo } from './ProjectInfoForm';
import TemplatePreview from './TemplatePreview';
import CalendarView from './CalendarView';
import GanttView from './GanttView';
import { format, addBusinessDays, differenceInBusinessDays } from 'date-fns';
import { 
  BudgetTemplate, 
  TemplateStage, 
  TemplateActivity, 
  getTemplateByBudget, 
  budgetTemplates 
} from '../data/budgetTemplates';
import { useNavigate } from 'react-router-dom';
import { useDevMode } from '../context/DevModeContext';
import DevModePageIdentifier from './DevModePageIdentifier';

// Storage key for local storage
const STORAGE_KEY = 'project_planner_projects';
const AUDIT_LOG_KEY = 'project_planner_audit_log';

// Create a type for custom activities
export type CustomActivity = {
  id: string;
  name: string;
  description: string;
  duration: number;
  hoursPerDay: number;
  revisions: number;
  dependencies: string[];
  canHaveRevisions: boolean;
  resourceType: string;
};

interface ActivitySelectionProps {
  onComplete: (activities: ProjectActivity[]) => void;
  projectPlan?: ProjectPlan;
  onDirectTimelineAccess?: () => void; // New prop for direct timeline access
}

// Styled components for modern UI
const ActivityCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex', 
  flexDirection: 'column',
  borderRadius: theme.shape.borderRadius * 1.5,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: theme.shadows[4]
  }
}));

const SelectedActivityCard = styled(ActivityCard)(({ theme }) => ({
  borderLeft: `4px solid ${theme.palette.primary.main}`,
}));

const AvailableActivityCard = styled(ActivityCard)(({ theme }) => ({
  borderLeft: `4px solid ${theme.palette.grey[300]}`,
  opacity: 0.9,
  '&:hover': {
    opacity: 1,
    borderLeft: `4px solid ${theme.palette.primary.light}`,
  }
}));

const ActivityHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

const ReorderControls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
  top: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1,
}));

const StyledInputField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius,
  }
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: 'none',
  padding: theme.spacing(1, 2.5)
}));

const InfoChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  fontSize: '0.75rem',
  height: 28,
  marginRight: theme.spacing(1),
  fontWeight: 500,
}));

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

// Add type for view mode
type ViewMode = 'list' | 'gantt' | 'calendar';

const ActivitySelection: React.FC<ActivitySelectionProps> = ({ onComplete, projectPlan, onDirectTimelineAccess }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isDevMode } = useDevMode();
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [originalProjectInfo, setOriginalProjectInfo] = useState<ProjectInfo | null>(null);
  const [projectModified, setProjectModified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [projectSaved, setProjectSaved] = useState(false);
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null);
  // Add view mode state
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  
  // Initialize with existing project data when projectPlan is provided
  useEffect(() => {
    if (projectPlan) {
      const initialData = getInitialProjectInfo();
      if (initialData) {
        console.log('Loading existing project data:', initialData.projectName);
        // Ensure kickoffDate is never null
        const safeInitialData = {
          ...initialData,
          kickoffDate: initialData.kickoffDate || new Date()
        } as ProjectInfo;
        
        setProjectInfo(safeInitialData);
        setOriginalProjectInfo(safeInitialData);
        setProjectModified(false);
        setCurrentStep(0); // Ensure we're on the project info step
      }
    }
  }, [projectPlan]);
  
  // Function to check if project has been modified
  const checkForChanges = (newInfo: ProjectInfo) => {
    if (!originalProjectInfo) return true; // If no original data, treat as modified
    
    // Compare relevant fields
    const hasChanges = 
      newInfo.projectName !== originalProjectInfo.projectName ||
      newInfo.budget !== originalProjectInfo.budget ||
      newInfo.clientReviewDays !== originalProjectInfo.clientReviewDays ||
      newInfo.kickoffDate.getTime() !== originalProjectInfo.kickoffDate.getTime() ||
      newInfo.dueDate.getTime() !== originalProjectInfo.dueDate.getTime();
    
    setProjectModified(hasChanges);
    return hasChanges;
  };
  
  const handleErrorClose = () => {
    setErrorMessage(null);
  };
  
  const handleSuccessClose = () => {
    setSuccessMessage(null);
  };
  
  const handleProjectInfoSubmit = (info: ProjectInfo) => {
    setProjectInfo(info);
    
    // Check if this is an update to an existing project
    if (projectPlan?.id) {
      checkForChanges(info);
      
      if (checkForChanges(info)) {
        setSuccessMessage(`Project details updated for ${info.projectName}`);
      } else {
        setSuccessMessage(`No changes detected for ${info.projectName}`);
      }
    } else {
      setSuccessMessage(`Project plan created for ${info.projectName}`);
    }
    
    // Create a basic project plan now and save it to localStorage
    const projectId = projectPlan?.id || uuidv4();
    const now = new Date();
    
    // Create a simple project with empty activities
    const initialProject = {
      id: projectId,
      name: info.projectName,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      kickoffDate: info.kickoffDate.toISOString(),
      dueDate: info.dueDate.toISOString(),
      budget: info.budget,
      clientReviewDays: info.clientReviewDays,
      status: 'active',
      description: `Project plan using ${info.selectedTemplate.name} template`,
      progress: 0,
      client: "",
      creator: localStorage.getItem('auth_user') ? JSON.parse(localStorage.getItem('auth_user') || '{}').name : 'Anonymous User',
      activities: []
    };
    
    // Save to localStorage
    const savedProjects = localStorage.getItem(STORAGE_KEY);
    let projects = [];
    
    if (savedProjects) {
      try {
        projects = JSON.parse(savedProjects);
      } catch (error) {
        console.error('Error parsing saved projects:', error);
        projects = [];
      }
    }
    
    // Check if project already exists
    const existingIndex = projects.findIndex((p: any) => p.id === projectId);
    
    if (existingIndex !== -1) {
      // Update existing project
      projects[existingIndex] = {
        ...projects[existingIndex],
        ...initialProject,
        createdAt: projects[existingIndex].createdAt, // Preserve original creation date
        creator: projects[existingIndex].creator || initialProject.creator // Preserve creator if exists
      };
    } else {
      // Add new project
      projects.unshift(initialProject);
    }
    
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      console.log(`Project "${info.projectName}" saved to localStorage with ID: ${projectId}`);
      
      // Save project ID and name for later reference
      localStorage.setItem('most_recent_project_id', projectId);
      localStorage.setItem('most_recent_project_name', info.projectName);
      
      setSavedProjectId(projectId);
      setProjectSaved(true);
    } catch (error) {
      console.error('Error saving project to localStorage:', error);
      setErrorMessage(`Error saving project: ${error}`);
    }
    
    // Move to the next step
    setCurrentStep(1);
  };

  // Function to save the project plan to localStorage
  const saveProjectPlan = (activities: ProjectActivity[], info: ProjectInfo): string | null => {
    console.log('Saving project plan to localStorage...', info.projectName);
    
    const savedProjects = localStorage.getItem(STORAGE_KEY);
    let projects = [];
    
    if (savedProjects) {
      try {
        projects = JSON.parse(savedProjects);
        console.log('Found existing projects:', projects.length);
      } catch (error) {
        console.error('Error parsing saved projects:', error);
        projects = [];
      }
    }
    
    // Check if we are updating an existing project
    const existingProjectId = projectPlan?.id || null;
    let projectId = existingProjectId;
    
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
    
    // Create a project object
    const projectToSave = {
      id: projectId || uuidv4(), // Use existing ID or create a new one
      name: info.projectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      kickoffDate: info.kickoffDate.toISOString(),
      dueDate: info.dueDate.toISOString(),
      budget: info.budget,
      clientReviewDays: info.clientReviewDays,
      status: 'active',
      description: `Project plan using ${info.selectedTemplate.name} template with ${activities.length} activities`,
      progress: 0,
      client: "",
      creator: creator,
      activities: activities
    };
    
    // If updating existing project
    if (existingProjectId) {
      console.log('Updating existing project:', existingProjectId);
      // Find the index of the existing project
      const existingIndex = projects.findIndex((p: any) => p.id === existingProjectId);
      
      if (existingIndex !== -1) {
        // Preserve creation date and creator from existing project
        projectToSave.createdAt = projects[existingIndex].createdAt;
        projectToSave.creator = projects[existingIndex].creator || creator;
        // Update the project at its existing position
        projects[existingIndex] = projectToSave;
        console.log('Updated existing project at index:', existingIndex);
      } else {
        // Project ID exists but not found in localStorage (rare case)
        projectId = projectToSave.id; // Get the id we just created
        projects.unshift(projectToSave);
        console.log('Project ID exists but not found in storage, adding as new');
      }
    } else {
      // This is a new project, add to beginning of array
      projectId = projectToSave.id; // Get the id we just created
      projects.unshift(projectToSave);
      console.log('Added new project with ID:', projectId);
    }
    
    // Save updated projects to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      console.log('Project saved successfully:', projectToSave.name);
      
      // Save latest action to audit log
      saveToAuditLog({
        action: existingProjectId ? 'UPDATE_PROJECT' : 'CREATE_PROJECT',
        projectId: projectToSave.id,
        projectName: projectToSave.name,
        user: creator,
        timestamp: new Date().toISOString(),
        details: `Project ${existingProjectId ? 'updated' : 'created'} with ${activities.length} activities`
      });
      
      // Return the saved project ID
      return projectId;
    } catch (error) {
      console.error('Error saving project to localStorage:', error);
      setErrorMessage(`Error saving project: ${error}`);
      return null;
    }
  };
  
  const handleViewDashboard = () => {
    // Navigate to the dashboard
    navigate('/');
  };
  
  const handleGenerateTimeline = () => {
    if (!projectInfo) {
      setErrorMessage("Please complete project information first");
      return;
    }
    
    setIsLoading(true);
    
    // Convert template activities to project activities
    const projectActivities = convertTemplateToProjectActivities(
      projectInfo.selectedTemplate,
      projectInfo.kickoffDate,
      projectInfo.clientReviewDays
    );
    
    // Save the project immediately
    try {
      // Save and get project ID
      const projectId = saveProjectPlan(projectActivities, projectInfo);
      
      if (projectId) {
        console.log(`Project saved with ID: ${projectId} and name: ${projectInfo.projectName}`);
        setSuccessMessage(`Project "${projectInfo.projectName}" has been ${projectPlan?.id ? 'updated' : 'saved'}!`);
        
        // Update the App component state with the correct data
        localStorage.setItem('most_recent_project_id', projectId);
        localStorage.setItem('most_recent_project_name', projectInfo.projectName);
        
        // Pass activities to App component to continue with timeline
        onComplete(projectActivities);
      } else {
        setErrorMessage("Failed to save project. Please try again.");
      }
    } catch (error) {
      console.error('Error saving project:', error);
      setErrorMessage('Failed to save project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Convert template activities to project activities with proper dates
  const convertTemplateToProjectActivities = (
    template: BudgetTemplate,
    kickoffDate: Date,
    clientReviewDays: number
  ): ProjectActivity[] => {
    const activities: ProjectActivity[] = [];
    let currentDate = new Date(kickoffDate);
    
    // Process each stage
    template.stages?.forEach((stage, stageIndex) => {
      // Add a client review after each milestone stage except the first one
      if (stageIndex > 0 && stage.isMilestone) {
        const reviewStartDate = new Date(currentDate);
        const reviewEndDate = addBusinessDays(reviewStartDate, clientReviewDays);
        
        activities.push({
          type: 'feedback_review' as ActivityType,
          duration: clientReviewDays,
          hoursDuration: clientReviewDays * 4, // Assuming 4 hours per day for review
          revisions: 0,
          startDate: reviewStartDate,
          endDate: reviewEndDate,
          status: 'not_started',
          resourceType: 'client' as ResourceType
        });
        
        // Move current date past the review
        currentDate = new Date(reviewEndDate);
      }
      
      // Add activities for this stage
      stage.activities.forEach(activity => {
        const activityStartDate = new Date(currentDate);
        const activityEndDate = addBusinessDays(activityStartDate, activity.durationDays);
        
        activities.push({
          type: activity.id as ActivityType,
          duration: activity.durationDays,
          hoursDuration: activity.durationHours,
          revisions: activity.defaultRevisions,
          startDate: activityStartDate,
          endDate: activityEndDate,
          status: 'not_started',
          resourceType: activity.resourceType as ResourceType
        });
        
        // Move current date past this activity
        currentDate = new Date(activityEndDate);
      });
    });
    
    return activities;
  };
  
  // Get initial project info from projectPlan if it exists
  const getInitialProjectInfo = () => {
    if (projectPlan) {
      // Get budget information from the project plan or localStorage
      let budget = 10000; // Default budget
      let clientReviewDays = 2; // Default review days
      
      // Try to get more detailed info from localStorage
      const savedProjects = localStorage.getItem(STORAGE_KEY);
      if (savedProjects && projectPlan.id) {
        try {
          const projects = JSON.parse(savedProjects);
          const existingProject = projects.find((p: any) => p.id === projectPlan.id);
          if (existingProject) {
            budget = existingProject.budget || budget;
            clientReviewDays = existingProject.clientReviewDays || clientReviewDays;
            
            console.log('Found existing project data:', existingProject.name);
            
            return {
              projectName: existingProject.name,
              kickoffDate: new Date(existingProject.kickoffDate),
              dueDate: new Date(existingProject.dueDate),
              budget: budget,
              clientReviewDays: clientReviewDays,
              selectedTemplate: getTemplateByBudget(budget) || budgetTemplates[0]
            };
          }
        } catch (error) {
          console.error('Error parsing saved projects:', error);
        }
      }
      
      // Using null-safe check for startDate
      const safeStartDate = projectPlan.startDate instanceof Date ? projectPlan.startDate : new Date();
      // Using null-safe check for endDate
      const safeEndDate = projectPlan.endDate instanceof Date ? 
                          projectPlan.endDate : 
                          new Date(addBusinessDays(safeStartDate, 22));
      
      return {
        projectName: projectPlan.name,
        kickoffDate: safeStartDate,
        dueDate: safeEndDate,
        budget: budget,
        clientReviewDays: clientReviewDays,
        selectedTemplate: getTemplateByBudget(budget) || budgetTemplates[0]
      };
    }
    return null;
  };
  
  // Add view mode change handler
  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: ViewMode | null,
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };
  
  // Add function to render the correct view based on viewMode
  const renderView = () => {
    if (!projectInfo) return null;
    
    // Create a temporary project plan for the views
    const tempProjectPlan: ProjectPlan = {
      id: projectPlan?.id || 'temp-id',
      name: projectInfo.projectName,
      startDate: projectInfo.kickoffDate,
      endDate: projectInfo.dueDate,
      activities: convertTemplateToProjectActivities(
        projectInfo.selectedTemplate, 
        projectInfo.kickoffDate, 
        projectInfo.clientReviewDays
      ),
      budgetTemplate: projectInfo.selectedTemplate,
      clientReviewDays: projectInfo.clientReviewDays,
      budget: projectInfo.budget
    };
    
    switch (viewMode) {
      case 'gantt':
        return <GanttView projectPlan={tempProjectPlan} />;
      case 'calendar':
        return <CalendarView projectPlan={tempProjectPlan} />;
      case 'list':
        return (
          <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: theme.shape.borderRadius, bgcolor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom>Activity List</Typography>
            {tempProjectPlan.activities.map((activity, index) => (
              <Box 
                key={activity.type + index} 
                sx={{ 
                  p: 2, 
                  mb: 1, 
                  borderLeft: `3px solid ${theme.palette.primary.main}`,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: theme.shape.borderRadius
                }}
              >
                <Typography variant="subtitle1">
                  {defaultActivities.find(a => a.id === activity.type)?.name || activity.type}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {activity.startDate && format(activity.startDate, 'MMM d')} - {activity.endDate && format(activity.endDate, 'MMM d, yyyy')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activity.duration} business days
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        );
      default:
        return <CalendarView projectPlan={tempProjectPlan} />;
    }
  };

  // Add a new function to handle template updates just before the renderView function
  const handleTemplateUpdate = (updatedTemplate: BudgetTemplate, updatedStartDate?: Date) => {
    if (!projectInfo) return;
    
    // Create a copy of the current projectInfo with all required properties
    const updatedProjectInfo: ProjectInfo = { 
      projectName: projectInfo.projectName,
      kickoffDate: updatedStartDate || projectInfo.kickoffDate,
      dueDate: projectInfo.dueDate,
      budget: projectInfo.budget,
      clientReviewDays: projectInfo.clientReviewDays,
      selectedTemplate: updatedTemplate
    };
    
    // Update the project info state
    setProjectInfo(updatedProjectInfo);
    
    // Mark the project as modified
    setProjectModified(true);
    
    // Set a success message
    setSuccessMessage('Activities updated successfully');
  };

  return (
    <Box sx={{ mt: 4 }}>
      {/* Dev Mode Page Identifier */}
      {isDevMode && (
        <Box 
          sx={{
            position: 'fixed',
            top: '70px',
            right: '10px',
            backgroundColor: 'red',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontWeight: 'bold',
            zIndex: 9999,
            boxShadow: theme.shadows[3],
            opacity: 0.9
          }}
        >
          PAGE: PROJECT_CONFIG [{currentStep === 0 ? 'DETAILS' : 'ACTIVITIES'}]
        </Box>
      )}

      {/* Main Content */}
      {currentStep === 0 && (
        <Box>
          {isDevMode && (
            <Box 
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                border: `1px dashed ${theme.palette.primary.main}`,
                p: 1,
                mb: 2,
                borderRadius: theme.shape.borderRadius,
                fontSize: '0.8rem',
                fontFamily: 'monospace'
              }}
            >
              SECTION: PROJECT_INFO_FORM
            </Box>
          )}
          <ProjectInfoForm 
            onSubmit={handleProjectInfoSubmit} 
            initialData={projectInfo as ProjectInfo | undefined}
            onChangeDetected={(hasChanges) => setProjectModified(hasChanges)}
          />
        </Box>
      )}
      
      {/* Restructured Template Preview with distinct sections */}
      {currentStep === 1 && projectInfo && (
        <>
          {/* SECTION 1: Project Summary */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              borderRadius: theme.shape.borderRadius * 2,
              mb: 4,
              backgroundColor: theme.palette.background.paper,
              position: 'relative'
            }}
          >
            {isDevMode && (
              <Box 
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  backgroundColor: alpha(theme.palette.info.main, 0.9),
                  color: 'white',
                  padding: '2px 8px',
                  borderTopRightRadius: theme.shape.borderRadius * 2,
                  borderBottomLeftRadius: theme.shape.borderRadius,
                  fontSize: '0.7rem',
                  fontFamily: 'monospace'
                }}
              >
                SECTION: PROJECT_SUMMARY
              </Box>
            )}
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Project Summary
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Typography variant="body1" color="text.secondary">
                <strong>Kickoff Date:</strong> {format(projectInfo.kickoffDate, 'MMM d, yyyy')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                <strong>Due Date:</strong> {format(projectInfo.dueDate, 'MMM d, yyyy')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                <strong>Budget:</strong> ${projectInfo.budget.toLocaleString()}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                <strong>Client Review Time:</strong> {projectInfo.clientReviewDays} days per review
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {/* Project Stats */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* Completion Percentage */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    height: '100%', 
                    borderRadius: theme.shape.borderRadius * 1.5,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Completion
                  </Typography>
                  {/* Calculate completion based on template activities */}
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    0%
                  </Typography>
                  <Box sx={{ mt: 1, width: '100%', height: 4, backgroundColor: alpha(theme.palette.primary.main, 0.2), borderRadius: 2 }}>
                    <Box 
                      sx={{ 
                        height: '100%', 
                        width: '0%', 
                        backgroundColor: theme.palette.primary.main,
                        borderRadius: 2
                      }} 
                    />
                  </Box>
                </Paper>
              </Grid>
              
              {/* Activities Count */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    height: '100%', 
                    borderRadius: theme.shape.borderRadius * 1.5 
                  }}
                >
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Activities
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {projectInfo.selectedTemplate.stages?.reduce(
                      (sum, stage) => sum + stage.activities.length, 0
                    ) || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    0 in progress, 0 delayed
                  </Typography>
                </Paper>
              </Grid>
              
              {/* Time Left */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    height: '100%', 
                    borderRadius: theme.shape.borderRadius * 1.5 
                  }}
                >
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Time Left
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {differenceInBusinessDays(projectInfo.dueDate, new Date())} days
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {format(projectInfo.dueDate, 'MMM d, yyyy')}
                  </Typography>
                </Paper>
              </Grid>
              
              {/* Budget */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    height: '100%', 
                    borderRadius: theme.shape.borderRadius * 1.5 
                  }}
                >
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Budget
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    ${projectInfo.budget.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {projectInfo.selectedTemplate.name}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            
            <Box sx={{ mb: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Review the activities below that will be included in your project plan. 
                Click "{projectPlan?.id ? 'Update Project Plan' : 'Create Timeline'}" when ready to {projectPlan?.id ? 'update your project' : 'create your timeline'}.
              </Alert>
            </Box>
          </Paper>
          
          {/* SECTION 2: View Toggles and Timeline Visualization */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              borderRadius: theme.shape.borderRadius * 2,
              mb: 4,
              backgroundColor: theme.palette.background.paper,
              position: 'relative'
            }}
          >
            {isDevMode && (
              <Box 
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  backgroundColor: alpha(theme.palette.warning.main, 0.9),
                  color: 'white',
                  padding: '2px 8px',
                  borderTopRightRadius: theme.shape.borderRadius * 2,
                  borderBottomLeftRadius: theme.shape.borderRadius,
                  fontSize: '0.7rem',
                  fontFamily: 'monospace'
                }}
              >
                SECTION: TIMELINE_VIEW
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, m: 0 }}>
                Project Timeline
              </Typography>
              
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                aria-label="view mode"
                sx={{
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
                }}
              >
                <ToggleButton value="list" aria-label="list view">
                  <ViewListIcon sx={{ mr: 1 }} /> List
                </ToggleButton>
                <ToggleButton value="gantt" aria-label="gantt view">
                  <ViewTimelineIcon sx={{ mr: 1 }} /> Gantt
                </ToggleButton>
                <ToggleButton value="calendar" aria-label="calendar view">
                  <CalendarMonthIcon sx={{ mr: 1 }} /> Calendar
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            
            {/* Timeline View with fixed height */}
            <Box sx={{ height: '550px', mb: 2, overflow: 'auto' }}>
              {renderView()}
            </Box>
          </Paper>
          
          {/* SECTION 3: Timeline Overview with Stages and Activities */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              borderRadius: theme.shape.borderRadius * 2,
              mb: 4,
              backgroundColor: theme.palette.background.paper,
              position: 'relative'
            }}
          >
            {isDevMode && (
              <Box 
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  backgroundColor: alpha(theme.palette.success.main, 0.9),
                  color: 'white',
                  padding: '2px 8px',
                  borderTopRightRadius: theme.shape.borderRadius * 2,
                  borderBottomLeftRadius: theme.shape.borderRadius,
                  fontSize: '0.7rem',
                  fontFamily: 'monospace'
                }}
              >
                SECTION: TIMELINE_OVERVIEW
              </Box>
            )}
            
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Timeline Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This is an overview of all project stages and activities based on your selected template.
            </Typography>
            
            <TemplatePreview 
              template={projectInfo.selectedTemplate} 
              clientReviewDays={projectInfo.clientReviewDays}
              projectStartDate={projectInfo.kickoffDate}
              onUpdateTemplate={handleTemplateUpdate}
              editable={true}
            />
          </Paper>
          
          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => setCurrentStep(0)}
              sx={{ 
                borderRadius: theme.shape.borderRadius * 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 'none',
                padding: theme.spacing(1, 2.5)
              }}
            >
              Back to Project Details
            </Button>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              {projectPlan?.id && !projectModified && onDirectTimelineAccess ? (
                <>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={onDirectTimelineAccess}
                    sx={{ 
                      borderRadius: theme.shape.borderRadius * 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      boxShadow: 'none',
                      padding: theme.spacing(1, 2.5)
                    }}
                  >
                    View Timeline
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <KeyboardArrowRightIcon />}
                    onClick={handleGenerateTimeline}
                    disabled={isLoading}
                    sx={{ 
                      borderRadius: theme.shape.borderRadius * 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      boxShadow: 'none',
                      padding: theme.spacing(1, 2.5)
                    }}
                  >
                    {isLoading ? 'Saving...' : projectPlan?.id ? 'Update Project Plan' : 'Create Timeline'}
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <KeyboardArrowRightIcon />}
                  onClick={handleGenerateTimeline}
                  disabled={isLoading}
                  sx={{ 
                    borderRadius: theme.shape.borderRadius * 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: 'none',
                    padding: theme.spacing(1, 2.5)
                  }}
                >
                  {isLoading ? 'Saving...' : projectPlan?.id ? 'Update Project Plan' : 'Create Timeline'}
                </Button>
              )}
            </Box>
          </Box>
        </>
      )}
      
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

      {/* Dev Mode Identifier */}
      <DevModePageIdentifier page="ActivitySelection" component="Project Activities" />
    </Box>
  );
};

export default ActivitySelection; 