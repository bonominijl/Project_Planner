import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  IconButton,
  Tooltip,
  Collapse,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Stack,
  DialogContentText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PendingIcon from '@mui/icons-material/Pending';
import WarningIcon from '@mui/icons-material/Warning';
import { BudgetTemplate, TemplateStage, TemplateActivity } from '../data/budgetTemplates';
import { addBusinessDays, differenceInBusinessDays, startOfDay, parseISO, isValid, isWeekend } from 'date-fns';
import { format } from 'date-fns';
import { ensureValidDate } from '../utils/dateUtils';

// New type for activity status
type ActivityStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed';

// Extended activity interface for editable version
interface EditableActivity extends TemplateActivity {
  status?: ActivityStatus;
  startDate?: Date;
  endDate?: Date;
}

// Extended stage interface for editable version
interface EditableStage extends TemplateStage {
  activities: EditableActivity[];
  status?: string;
}

interface TemplatePreviewProps {
  template: BudgetTemplate;
  clientReviewDays: number;
  projectStartDate?: Date;
  onUpdateTemplate?: (updatedTemplate: BudgetTemplate, updatedStartDate?: Date) => void;
  editable?: boolean;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ 
  template, 
  clientReviewDays, 
  projectStartDate,
  onUpdateTemplate,
  editable = false
}) => {
  const theme = useTheme();
  const [expandedStage, setExpandedStage] = useState<string | false>(false);
  
  // State for menu anchors
  const [activityMenuAnchor, setActivityMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedActivity, setSelectedActivity] = useState<EditableActivity | null>(null);
  const [selectedStage, setSelectedStage] = useState<EditableStage | null>(null);
  
  // State for edit dialogs
  const [editStatusDialogOpen, setEditStatusDialogOpen] = useState(false);
  const [editDateDialogOpen, setEditDateDialogOpen] = useState(false);
  const [dateChangeConfirmOpen, setDateChangeConfirmOpen] = useState(false);
  
  // State for new values
  const [newStatus, setNewStatus] = useState<ActivityStatus>('not_started');
  const [newStartDate, setNewStartDate] = useState<Date | null>(null);
  const [daysDiff, setDaysDiff] = useState<number>(0);
  const [adjustFutureDates, setAdjustFutureDates] = useState(true);

  const handleStageChange = (stageId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedStage(isExpanded ? stageId : false);
  };
  
  // Format resource type for display
  const formatResourceType = (resourceType: string) => {
    return resourceType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Handle opening the activity menu
  const handleActivityMenuOpen = (event: React.MouseEvent<HTMLElement>, activity: EditableActivity, stage: EditableStage) => {
    console.log('[handleActivityMenuOpen] Opening menu for activity:', activity.id, 'Raw data:', activity);

    // --- Ensure startDate is a Date object before setting state ---
    let activityWithDateObject = { ...activity };
    
    // Use the new ensureValidDate utility
    if (activity.startDate) {
      const validDate = ensureValidDate(activity.startDate);
      if (validDate) {
        activityWithDateObject.startDate = validDate;
        console.log('[handleActivityMenuOpen] Converted to valid Date:', validDate.toISOString());
      } else {
        console.warn('[handleActivityMenuOpen] Could not convert to valid Date:', activity.startDate);
        activityWithDateObject.startDate = undefined;
      }
    } else {
      console.log('[handleActivityMenuOpen] Activity has no startDate.');
    }
    // --- End Date object ensuring ---

    setActivityMenuAnchor(event.currentTarget);
    setSelectedActivity(activityWithDateObject); // Set the potentially corrected activity
    setSelectedStage(stage);
  };

  // Handle closing the activity menu
  const handleActivityMenuClose = () => {
    setActivityMenuAnchor(null);
  };

  // Handle opening the status edit dialog
  const handleEditStatus = () => {
    if (selectedActivity) {
      setNewStatus(selectedActivity.status || 'not_started');
      setEditStatusDialogOpen(true);
    } else {
        console.error('[handleEditStatus] Cannot open dialog, selectedActivity is null.');
    }
    handleActivityMenuClose();
  };

  // Handle opening the date edit dialog
  const handleEditDate = () => {
    if (selectedActivity) {
      // Use the (potentially corrected) startDate from state, or fallback to project start date or today
      let initialDate: Date;
      
      // Try to get date from activity
      const activityDate = ensureValidDate(selectedActivity.startDate);
      
      if (activityDate) {
        initialDate = activityDate;
      } else if (projectStartDate && isValid(projectStartDate)) {
        // If activity has no start date but project has a start date, calculate an estimated start date
        const stageIndex = template.stages?.findIndex(stage => stage.id === selectedStage?.id) ?? -1;
        if (stageIndex >= 0 && template.stages) {
          const actIndex = template.stages[stageIndex].activities.findIndex(act => act.id === selectedActivity.id);
          if (actIndex >= 0) {
            // Calculate offset from project start based on preceding activities
            let offset = 0;
            for (let s = 0; s < stageIndex; s++) {
              offset += template.stages[s].activities.reduce((sum, act) => sum + act.durationDays, 0);
            }
            for (let a = 0; a < actIndex; a++) {
              offset += template.stages[stageIndex].activities[a].durationDays;
            }
            
            initialDate = addBusinessDays(projectStartDate, offset);
            console.log('[handleEditDate] Calculated estimated start date:', initialDate.toISOString());
          } else {
            initialDate = new Date(projectStartDate);
            console.log('[handleEditDate] Using project start date:', initialDate.toISOString());
          }
        } else {
          initialDate = new Date(); // Fallback to today
        }
      } else {
        initialDate = new Date(); // Fallback to today
      }
      
      // Adjust to business day is already handled by ensureValidDate
      
      setNewStartDate(initialDate);
      console.log('[handleEditDate] Initializing DatePicker with:', initialDate.toISOString());
      setEditDateDialogOpen(true);
    } else {
      console.error('[handleEditDate] Cannot open dialog, selectedActivity is null.');
    }
    handleActivityMenuClose();
  };

  // Handle saving the new status
  const handleSaveStatus = () => {
    if (selectedActivity && selectedStage && onUpdateTemplate) {
      const updatedTemplate = { ...template };
      
      // Find the stage and activity to update
      const stageIndex = updatedTemplate.stages?.findIndex(stage => stage.id === selectedStage.id) ?? -1;
      if (stageIndex >= 0 && updatedTemplate.stages) {
        const activityIndex = updatedTemplate.stages[stageIndex].activities.findIndex(
          activity => activity.id === selectedActivity.id
        );
        
        if (activityIndex >= 0) {
          // Update the activity with the new status
          const updatedActivity = {
            ...updatedTemplate.stages[stageIndex].activities[activityIndex],
            status: newStatus
          } as EditableActivity;
          
          updatedTemplate.stages[stageIndex].activities[activityIndex] = updatedActivity;
          
          // Call the update function
          onUpdateTemplate(updatedTemplate);
        }
      }
    }
    
    setEditStatusDialogOpen(false);
  };

  // Handle date change confirmation dialog
  const handleStartDateChange = (date: Date | null) => {
    if (date && selectedActivity) {
      // Ensure we have a fresh Date object for the *new* date and it's a business day
      const newDate = ensureValidDate(date) || new Date();
      
      setNewStartDate(newDate);

      // --- Start Date Handling --- 
      let effectiveStartDate: Date | null = ensureValidDate(selectedActivity.startDate);
      
      if (!effectiveStartDate) {
        console.warn('[handleStartDateChange] No valid start date found in activity. Trying project start date.');
        
        // Try to get a valid start date from project start date
        if (projectStartDate && isValid(projectStartDate) && selectedStage && template.stages) {
          try {
            const stageIndex = template.stages.findIndex(stage => stage.id === selectedStage.id);
            if (stageIndex >= 0) {
              const actIndex = template.stages[stageIndex].activities.findIndex(act => act.id === selectedActivity.id);
              if (actIndex >= 0) {
                // Calculate where this activity should be based on project start
                let offset = 0;
                // Sum durations of preceding activities
                for (let s = 0; s < stageIndex; s++) {
                  if (template.stages[s] && template.stages[s].activities) {
                    offset += template.stages[s].activities.reduce((sum, act) => sum + act.durationDays, 0);
                  }
                }
                for (let a = 0; a < actIndex; a++) {
                  if (template.stages[stageIndex].activities[a]) {
                    offset += template.stages[stageIndex].activities[a].durationDays;
                  }
                }
                
                effectiveStartDate = addBusinessDays(projectStartDate, offset);
                console.log('[handleStartDateChange] Created effective start date from project start:', effectiveStartDate.toISOString());
              }
            }
          } catch (error) {
            console.error('[handleStartDateChange] Error calculating from project start date:', error);
          }
        }

        // If we still don't have a valid date, use today as fallback
        if (!effectiveStartDate) {
          effectiveStartDate = new Date();
          console.log('[handleStartDateChange] Using today as fallback:', effectiveStartDate.toISOString());
        }
      }
      
      // Calculate the day difference using the effectiveStartDate
      if (effectiveStartDate) {
        try {
          // Normalize both dates to UTC midnight strings (YYYY-MM-DD)
          const oldDateStr = effectiveStartDate.toISOString().split('T')[0];
          const newDateStr = newDate.toISOString().split('T')[0];

          // Parse the date strings back into Date objects at UTC midnight
          const cleanOldDate = parseISO(oldDateStr + 'T00:00:00Z');
          const cleanNewDate = parseISO(newDateStr + 'T00:00:00Z');

          // Use differenceInBusinessDays on the cleaned dates
          const diff = differenceInBusinessDays(cleanNewDate, cleanOldDate);
          setDaysDiff(diff);

          console.log('[handleStartDateChange] Day difference calculated:', diff);
          console.log('[handleStartDateChange] Old date (cleaned):', cleanOldDate.toISOString());
          console.log('[handleStartDateChange] New date (cleaned):', cleanNewDate.toISOString());
        } catch (error) {
          console.error('[handleStartDateChange] Error calculating day difference:', error);
          setDaysDiff(0);
        }
      } else {
        // If no effective start date exists after checking/parsing
        console.warn('[handleStartDateChange] Unable to calculate a valid date difference. Using duration as fallback.');
        // Setting diff based on the duration as fallback
        const durationDiff = selectedActivity.durationDays > 0 ? selectedActivity.durationDays : 1;
        setDaysDiff(durationDiff);
      }

      // Always show the confirmation dialog when changing dates
      setDateChangeConfirmOpen(true);
    }
  };

  // Process the date change with user choice about adjusting future dates
  const processSaveDate = (date: Date | null, adjustFuture: boolean) => {
    if (date && selectedActivity && selectedStage && onUpdateTemplate) {
      // Ensure we have a proper Date object and it's a business day
      const newDate = ensureValidDate(date) || new Date();
      
      console.log(`Processing date change with adjustFuture=${adjustFuture}, daysDiff=${daysDiff}`);
      console.log(`New date: ${newDate.toISOString()}`);
      
      const updatedTemplate = { ...template };
      
      // Find the stage and activity to update
      const stageIndex = updatedTemplate.stages?.findIndex(stage => stage.id === selectedStage.id) ?? -1;
      if (stageIndex >= 0 && updatedTemplate.stages) {
        const activityIndex = updatedTemplate.stages[stageIndex].activities.findIndex(
          activity => activity.id === selectedActivity.id
        );
        
        if (activityIndex >= 0) {
          // Use the pre-calculated day difference
          const daysDifference = daysDiff;
          
          console.log(`Updating activity start date. Difference: ${daysDifference} days`);
          
          // Update all activities with their new dates
          if (adjustFuture) {
            // First set the selected activity's start date
            const activityEndDate = addBusinessDays(newDate, selectedActivity.durationDays - 1);
            console.log(`Setting activity ${selectedActivity.name} start date to ${newDate.toISOString()}, end date to ${activityEndDate.toISOString()}`);
            
            updatedTemplate.stages[stageIndex].activities[activityIndex] = {
              ...updatedTemplate.stages[stageIndex].activities[activityIndex],
              startDate: newDate,
              endDate: activityEndDate
            } as EditableActivity;
            
            // Then adjust all subsequent activities sequentially
            let adjustActivities = false;
            let currentEndDate = activityEndDate; // Start from the end of the current activity
            
            for (let s = 0; s < updatedTemplate.stages.length; s++) {
              if (updatedTemplate.stages[s] && updatedTemplate.stages[s].activities) {
                for (let a = 0; a < updatedTemplate.stages[s].activities.length; a++) {
                  // Skip until we reach the activity we just modified
                  if (!adjustActivities) {
                    if (s === stageIndex && a === activityIndex) {
                      adjustActivities = true;
                    }
                    continue;
                  }
                  
                  // Adjust all subsequent activities
                  const activity = updatedTemplate.stages[s].activities[a] as EditableActivity;
                  // Calculate new start date based on previous activity end date
                  const newStartDate = addBusinessDays(currentEndDate, 1);
                  const newEndDate = addBusinessDays(newStartDate, activity.durationDays - 1);
                  
                  console.log(`Adjusting subsequent activity ${activity.name || activity.id}:`);
                  console.log(`  New start: ${newStartDate.toISOString()}`);
                  console.log(`  New end: ${newEndDate.toISOString()}`);
                  
                  updatedTemplate.stages[s].activities[a] = {
                    ...activity,
                    startDate: newStartDate,
                    endDate: newEndDate
                  };
                  
                  // Update current end date for next activity
                  currentEndDate = newEndDate;
                }
              }
            }
          } else {
            // Only update the selected activity
            const activityEndDate = addBusinessDays(newDate, selectedActivity.durationDays - 1);
            console.log(`Setting activity ${selectedActivity.name} start date to ${newDate.toISOString()}, end date to ${activityEndDate.toISOString()}`);
            
            updatedTemplate.stages[stageIndex].activities[activityIndex] = {
              ...updatedTemplate.stages[stageIndex].activities[activityIndex],
              startDate: newDate,
              endDate: activityEndDate
            } as EditableActivity;
          }
          
          // Call the update function immediately with a cloned template to ensure proper updates
          console.log('Calling onUpdateTemplate with updated dates');
          // Force a deep copy to ensure React detects the changes
          const clonedTemplate = JSON.parse(JSON.stringify(updatedTemplate));
          onUpdateTemplate(clonedTemplate, adjustFuture ? undefined : projectStartDate);
        }
      }
    }
    
    setEditDateDialogOpen(false);
    setDateChangeConfirmOpen(false);
  };

  // Handle closing the date dialog
  const handleDateDialogClose = () => {
    setEditDateDialogOpen(false);
    setDateChangeConfirmOpen(false);
  };

  // Get status color
  const getStatusColor = (status: ActivityStatus) => {
    switch (status) {
      case 'completed':
        return theme.palette.success.main;
      case 'in_progress':
        return theme.palette.primary.main;
      case 'delayed':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[400];
    }
  };

  // Get status icon
  const getStatusIcon = (status: ActivityStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon fontSize="small" />;
      case 'in_progress':
        return <PlayArrowIcon fontSize="small" />;
      case 'delayed':
        return <WarningIcon fontSize="small" />;
      default:
        return <PendingIcon fontSize="small" />;
    }
  };
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: theme.shape.borderRadius * 2,
        mb: 4,
        backgroundColor: theme.palette.background.paper
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Project Timeline Overview
        </Typography>
        <Chip 
          icon={<AccessTimeIcon fontSize="small" />}
          label={`${template.totalDays + (clientReviewDays * 2)} business days total`}
          color="primary"
          variant="outlined"
        />
      </Box>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Based on your {template.name.toLowerCase()} budget, we recommend the following project timeline. 
        This includes {template.totalDays} days for project work and {clientReviewDays * 2} days for client reviews.
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      {(template.stages || []).map((stage, index) => (
        <Accordion 
          key={stage.id}
          expanded={expandedStage === stage.id}
          onChange={handleStageChange(stage.id)}
          elevation={0}
          sx={{ 
            mb: 2, 
            '&:before': { display: 'none' },
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: `${theme.shape.borderRadius}px !important`,
            overflow: 'hidden'
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              backgroundColor: stage.isMilestone ? 
                alpha(theme.palette.primary.main, 0.05) : 
                'transparent'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Typography sx={{ fontWeight: 600, mr: 2 }}>
                Stage {index + 1}: {stage.name}
              </Typography>
              {stage.isMilestone && (
                <Chip 
                  label="Milestone" 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                  sx={{ height: 24 }}
                />
              )}
              <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                <Tooltip title="Total days for this stage">
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    <ScheduleIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {stage.activities.reduce((sum, activity) => sum + activity.durationDays, 0)} days
                    </Typography>
                  </Box>
                </Tooltip>
                <Tooltip title="Number of activities">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {stage.activities.length} activities
                    </Typography>
                  </Box>
                </Tooltip>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
              {stage.description}
            </Typography>
            
            <List disablePadding>
              {stage.activities.map((activity, actIndex) => {
                const editableActivity = activity as EditableActivity;
                return (
                  <React.Fragment key={activity.id}>
                    {actIndex > 0 && <Divider component="li" />}
                    <ListItem 
                      alignItems="flex-start" 
                      sx={{ py: 1.5 }}
                      secondaryAction={
                        editable && (
                          <IconButton 
                            edge="end" 
                            aria-label="edit activity"
                            onClick={(e) => handleActivityMenuOpen(e, editableActivity, stage as EditableStage)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        )
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {activity.name}
                            </Typography>
                            {editableActivity.status && (
                              <Chip
                                icon={getStatusIcon(editableActivity.status)}
                                label={editableActivity.status.replace('_', ' ')}
                                size="small"
                                sx={{ 
                                  ml: 1,
                                  height: 24,
                                  backgroundColor: alpha(getStatusColor(editableActivity.status), 0.1),
                                  color: getStatusColor(editableActivity.status),
                                  borderColor: getStatusColor(editableActivity.status)
                                }}
                                variant="outlined"
                              />
                            )}
                            <Tooltip title={activity.description}>
                              <IconButton size="small" sx={{ ml: 0.5, p: 0.5 }}>
                                <InfoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        }
                        secondary={
                          <Typography component="div" variant="body2" color="text.secondary">
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                              {editableActivity.startDate && (
                                <Chip
                                  icon={<ScheduleIcon fontSize="small" />}
                                  label={format(new Date(editableActivity.startDate), 'MMM d, yyyy')}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 24 }}
                                />
                              )}
                              <Chip
                                icon={<AccessTimeIcon fontSize="small" />}
                                label={`${activity.durationDays} day${activity.durationDays !== 1 ? 's' : ''}`}
                                size="small"
                                variant="outlined"
                                sx={{ height: 24 }}
                              />
                              <Chip
                                icon={<ScheduleIcon fontSize="small" />}
                                label={`${activity.durationHours} hour${activity.durationHours !== 1 ? 's' : ''}`}
                                size="small"
                                variant="outlined"
                                sx={{ height: 24 }}
                              />
                              <Chip
                                icon={<PersonIcon fontSize="small" />}
                                label={formatResourceType(activity.resourceType)}
                                size="small"
                                variant="outlined"
                                sx={{ height: 24 }}
                              />
                              {activity.canHaveRevisions && activity.defaultRevisions > 0 && (
                                <Chip
                                  label={`${activity.defaultRevisions} revision${activity.defaultRevisions !== 1 ? 's' : ''}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 24 }}
                                />
                              )}
                            </Box>
                          </Typography>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Activity Options Menu */}
      <Menu
        anchorEl={activityMenuAnchor}
        open={Boolean(activityMenuAnchor)}
        onClose={handleActivityMenuClose}
      >
        <MenuItem onClick={handleEditStatus}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="inherit">Edit Status</Typography>
        </MenuItem>
        <MenuItem onClick={handleEditDate}>
          <ListItemIcon>
            <ScheduleIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="inherit">Edit Start Date</Typography>
        </MenuItem>
      </Menu>

      {/* Edit Status Dialog */}
      <Dialog open={editStatusDialogOpen} onClose={() => setEditStatusDialogOpen(false)}>
        <DialogTitle>Update Activity Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="status-select-label">Status</InputLabel>
            <Select
              labelId="status-select-label"
              value={newStatus}
              label="Status"
              onChange={(e: SelectChangeEvent) => setNewStatus(e.target.value as ActivityStatus)}
            >
              <MenuItem value="not_started">Not Started</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="delayed">Delayed</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveStatus} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Date Dialog */}
      <Dialog open={editDateDialogOpen && !dateChangeConfirmOpen} onClose={handleDateDialogClose}>
        <DialogTitle>Update Start Date</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={newStartDate}
                onChange={handleStartDateChange}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDateDialogClose}>Cancel</Button>
          <Button 
            onClick={() => processSaveDate(newStartDate, false)} 
            variant="contained" 
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Date Change Confirmation Dialog */}
      <Dialog open={dateChangeConfirmOpen} onClose={handleDateDialogClose}>
        <DialogTitle>Date Change Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You've changed the start date of {selectedActivity?.name} to {newStartDate ? format(newStartDate, 'MMM d, yyyy') : ''}.
            {newStartDate && isWeekend(newStartDate) && 
              " Note: This date falls on a weekend and will be adjusted to the next business day."}
            How would you like to handle subsequent activities?
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <FormControl component="fieldset">
              <Stack spacing={2}>
                <Button 
                  onClick={() => processSaveDate(newStartDate, true)}
                  variant="outlined"
                  fullWidth
                >
                  Adjust all future activities sequentially
                </Button>
                <Button 
                  onClick={() => processSaveDate(newStartDate, false)}
                  variant="outlined"
                  fullWidth
                >
                  Only change this activity's start date
                </Button>
              </Stack>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDateDialogClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

// Helper function to create alpha colors
function alpha(color: string, opacity: number) {
  return color + Math.round(opacity * 255).toString(16).padStart(2, '0');
}

export default TemplatePreview; 