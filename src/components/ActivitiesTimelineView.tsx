import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  Chip,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  alpha,
  Snackbar,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewTimelineIcon from '@mui/icons-material/ViewTimeline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { format, differenceInBusinessDays } from 'date-fns';

import { ProjectPlan, ProjectActivity } from '../types/projectTypes';
import { calculateProjectTimeline } from '../utils/projectUtils';
import StageActivityList from './StageActivityList';
import GanttView from './GanttView';
import CalendarView from './CalendarView';
import TemplatePreview from './TemplatePreview';
import { useDevMode } from '../context/DevModeContext';

interface ActivitiesTimelineViewProps {
  projectPlan: ProjectPlan;
  onUpdatePlan: (plan: ProjectPlan) => void;
  onPrevious: () => void;
  onComplete: () => void;
  onProjectInfoEdit?: () => void;
}

type ViewMode = 'list' | 'gantt' | 'calendar';

const ActivitiesTimelineView: React.FC<ActivitiesTimelineViewProps> = ({
  projectPlan,
  onUpdatePlan,
  onPrevious,
  onComplete,
  onProjectInfoEdit
}) => {
  const theme = useTheme();
  const { isDevMode } = useDevMode();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showTemplateOverview, setShowTemplateOverview] = useState(false);
  
  // Compute project statistics
  const totalActivities = projectPlan.activities.length;
  const completedActivities = projectPlan.activities.filter(a => a.status === 'completed').length;
  const inProgressActivities = projectPlan.activities.filter(a => a.status === 'in_progress').length;
  const delayedActivities = projectPlan.activities.filter(a => a.status === 'delayed').length;
  const completionPercentage = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
  
  const projectDuration = projectPlan.startDate && projectPlan.endDate
    ? differenceInBusinessDays(projectPlan.endDate, projectPlan.startDate) + 1
    : 0;
  
  const handleUpdateActivity = (updatedActivity: ProjectActivity) => {
    try {
      // Update the activity in the project plan
      const updatedActivities = projectPlan.activities.map(activity => {
        if (activity.type === updatedActivity.type) {
          return updatedActivity;
        }
        return activity;
      });
      
      // Recalculate timeline with updated activity
      const updatedPlan = calculateProjectTimeline({
        ...projectPlan,
        activities: updatedActivities
      }, projectPlan.startDate || new Date());
      
      onUpdatePlan(updatedPlan);
      setSuccessMessage(`Updated ${updatedActivity.type} status to ${updatedActivity.status.replace('_', ' ')}`);
    } catch (error) {
      setErrorMessage("Error updating activity: " + (error instanceof Error ? error.message : "Unknown error"));
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
  
  const renderMainView = () => {
    // Use a key to force re-render when activities change
    const renderKey = JSON.stringify(projectPlan.activities.map(a => ({ 
      id: a.type, 
      status: a.status, 
      start: a.startDate?.getTime(),
      end: a.endDate?.getTime() 
    })));
    
    switch (viewMode) {
      case 'gantt':
        return <GanttView key={renderKey} projectPlan={projectPlan} />;
      case 'calendar':
        // Only show the calendar view here if the template overview with calendar is not shown
        return !showTemplateOverview ? <CalendarView key={renderKey} projectPlan={projectPlan} /> : null;
      default:
        return null; // List view is shown separately below
    }
  };
  
  // Filter visible activities to only show those with visibleOnCalendar=true or undefined
  const getVisibleActivities = () => {
    return projectPlan.activities.filter(activity => {
      return activity.visibleOnCalendar !== false;
    });
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
            backgroundColor: 'blue',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontWeight: 'bold',
            zIndex: 9999,
            boxShadow: theme.shadows[3],
            opacity: 0.9
          }}
        >
          PAGE: ACTIVITIES_TIMELINE
        </Box>
      )}

      {/* Project Header */}
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
            SECTION: PROJECT_HEADER
          </Box>
        )}
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
            {projectPlan.creator && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Created by: {projectPlan.creator}
              </Typography>
            )}
          </Box>
          <Box>
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

        {/* Project Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
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
            </Paper>
          </Grid>
          
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
                {completedActivities}/{totalActivities}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {inProgressActivities} in progress, {delayedActivities} delayed
              </Typography>
            </Paper>
          </Grid>
          
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
                {projectPlan.endDate ? differenceInBusinessDays(projectPlan.endDate, new Date()) : 0} days
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {projectPlan.endDate && format(projectPlan.endDate, 'MMM d, yyyy')}
              </Typography>
            </Paper>
          </Grid>
          
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
                ${projectPlan.budget?.toLocaleString() || '0'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {projectPlan.budgetTemplate?.name || 'Standard Package'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* View toggles */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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

          <Button
            variant="outlined"
            color="primary"
            onClick={() => setShowTemplateOverview(!showTemplateOverview)}
            startIcon={<InfoOutlinedIcon />}
            sx={{ 
              borderRadius: theme.shape.borderRadius * 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {showTemplateOverview ? 'Hide Template Overview' : 'Show Template Overview'}
          </Button>
        </Box>

        {/* Template Preview (collapsible) */}
        {showTemplateOverview && projectPlan.budgetTemplate && (
          <Box sx={{ mt: 2, mb: 3 }}>
            {isDevMode && (
              <Box 
                sx={{
                  backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                  border: `1px dashed ${theme.palette.secondary.main}`,
                  p: 1,
                  mb: 2,
                  borderRadius: theme.shape.borderRadius,
                  fontSize: '0.8rem',
                  fontFamily: 'monospace'
                }}
              >
                SECTION: TEMPLATE_PREVIEW
              </Box>
            )}
            <Divider sx={{ mb: 3 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Project Timeline Overview
            </Typography>
            
            {/* Calendar View - Always shown in the template overview */}
            <Box sx={{ height: '300px', mb: 4 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Project Calendar View
              </Typography>
              <CalendarView projectPlan={projectPlan} />
            </Box>
            
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Project Stages & Activities
            </Typography>
            <TemplatePreview 
              template={projectPlan.budgetTemplate} 
              clientReviewDays={projectPlan.clientReviewDays || 2} 
            />
          </Box>
        )}
      </Paper>

      {/* Timeline View */}
      {viewMode !== 'list' && (
        <Box sx={{ mt: 3, mb: 4, position: 'relative' }}>
          {isDevMode && (
            <Box 
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: alpha(theme.palette.warning.main, 0.9),
                color: 'white',
                padding: '2px 8px',
                borderRadius: theme.shape.borderRadius,
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                zIndex: 1
              }}
            >
              SECTION: TIMELINE_VIEW_{viewMode.toUpperCase()}
            </Box>
          )}
          {renderMainView()}
        </Box>
      )}

      {/* Stages and Activities Section */}
      <Box sx={{ mb: 4 }}>
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
              SECTION: STAGE_ACTIVITIES
            </Box>
          )}
          <StageActivityList 
            projectPlan={projectPlan}
            onUpdateActivity={handleUpdateActivity}
          />
        </Paper>
      </Box>

      {/* Footer Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, mb: 5 }}>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<ArrowBackIcon />}
          onClick={onPrevious}
          sx={{ 
            borderRadius: theme.shape.borderRadius * 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Back to Dashboard
        </Button>
        <Button
          variant="contained"
          color="primary"
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
    </Box>
  );
};

export default ActivitiesTimelineView; 