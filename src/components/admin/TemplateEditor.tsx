import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  useTheme,
  InputAdornment,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tabs,
  Tab,
  Stack,
  Checkbox,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { 
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  ContentCopy as DuplicateIcon
} from '@mui/icons-material';
import { BudgetTemplate, TemplateStage, TemplateActivity, budgetTemplates as allBudgetTemplates } from '../../data/budgetTemplates';
import { ResourceType } from '../../types/projectTypes';

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
      id={`template-tabpanel-${index}`}
      aria-labelledby={`template-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface TemplateEditorProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

// Extended TemplateActivity interface with stageId for internal use
interface ActivityWithStageId extends TemplateActivity {
  stageId: string;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ onSuccess, onError }) => {
  const theme = useTheme();
  const [templates, setTemplates] = useState<BudgetTemplate[]>([]);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [currentActivity, setCurrentActivity] = useState<ActivityWithStageId | null>(null);
  const [currentStage, setCurrentStage] = useState<TemplateStage | null>(null);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

  useEffect(() => {
    // In a real implementation, fetch templates from your backend
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      // Use the imported budgetTemplates from the budgetTemplates.ts file
      // which already has the proper structure with stages and activities
      setTemplates(allBudgetTemplates);
      setSelectedTemplateIndex(0);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching templates:', error);
      onError('Failed to load budget templates');
      setIsLoading(false);
    }
  };

  const handleTemplateChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTemplateIndex(newValue);
  };

  const saveTemplates = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would be an API call
      // For now, we'll just simulate a saving delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Instead of trying to save to a file (which won't work in the browser),
      // we'll log the templates to the console and notify the user
      console.log('Templates to save:', templates);
      
      // In a production app, you would make an API call to save the templates like:
      // await fetch('/api/templates', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(templates)
      // });
      
      onSuccess('Templates saved successfully');
      setIsSaving(false);
    } catch (error) {
      console.error('Failed to save templates:', error);
      onError('Failed to save templates');
      setIsSaving(false);
    }
  };

  const handleAddTemplate = () => {
    setNewTemplateName('');
    setNameDialogOpen(true);
  };

  const createNewTemplate = () => {
    if (!newTemplateName.trim()) {
      onError('Template name cannot be empty');
      return;
    }

    const newTemplate: BudgetTemplate = {
      id: `template_${Date.now()}`,
      name: newTemplateName,
      budgetAmount: 0,
      description: '',
      stages: [],
      totalDays: 0
    };

    setTemplates([...templates, newTemplate]);
    setSelectedTemplateIndex(templates.length);
    setNameDialogOpen(false);
    onSuccess(`Template "${newTemplateName}" created`);
  };

  const handleDuplicateTemplate = () => {
    if (!templates[selectedTemplateIndex]) return;
    setNewTemplateName(`${templates[selectedTemplateIndex].name} (Copy)`);
    setDuplicateDialogOpen(true);
  };

  const duplicateTemplate = () => {
    if (!newTemplateName.trim()) {
      onError('Template name cannot be empty');
      return;
    }

    if (!templates[selectedTemplateIndex]) return;
    
    const sourceTemplate = templates[selectedTemplateIndex];
    const duplicatedTemplate: BudgetTemplate = {
      ...JSON.parse(JSON.stringify(sourceTemplate)),
      id: `template_${Date.now()}`,
      name: newTemplateName
    };

    setTemplates([...templates, duplicatedTemplate]);
    setSelectedTemplateIndex(templates.length);
    setDuplicateDialogOpen(false);
    onSuccess(`Template duplicated as "${newTemplateName}"`);
  };

  const handleDeleteTemplate = () => {
    if (templates.length <= 1) {
      onError('Cannot delete the last template');
      return;
    }

    if (!templates[selectedTemplateIndex]) return;
    
    const templateName = templates[selectedTemplateIndex].name;
    const newTemplates = templates.filter((_, index) => index !== selectedTemplateIndex);
    setTemplates(newTemplates);
    setSelectedTemplateIndex(Math.min(selectedTemplateIndex, newTemplates.length - 1));
    onSuccess(`Template "${templateName}" deleted`);
  };

  const handleAddStage = () => {
    setCurrentStage({
      id: `stage_${Date.now()}`,
      name: '',
      description: '',
      activities: [],
      isMilestone: false
    });
    setStageDialogOpen(true);
  };

  const saveStage = () => {
    if (!currentStage) return;
    if (!templates[selectedTemplateIndex]) return;
    
    if (!currentStage.name.trim()) {
      onError('Stage name cannot be empty');
      return;
    }

    const updatedTemplates = [...templates];
    const templateIndex = selectedTemplateIndex;
    
    // Ensure template exists
    if (!updatedTemplates[templateIndex]) {
      onError('Template not found');
      return;
    }
    
    // Ensure stages array exists
    if (!updatedTemplates[templateIndex].stages) {
      updatedTemplates[templateIndex].stages = [];
    }
    
    const existingStageIndex = updatedTemplates[templateIndex].stages!.findIndex(
      stage => stage.id === currentStage.id
    );
    
    if (existingStageIndex >= 0) {
      // Update existing stage
      if (updatedTemplates[templateIndex] && updatedTemplates[templateIndex].stages) {
        updatedTemplates[templateIndex].stages![existingStageIndex] = {...currentStage};
      }
    } else {
      // Add new stage
      if (updatedTemplates[templateIndex] && updatedTemplates[templateIndex].stages) {
        updatedTemplates[templateIndex].stages!.push({...currentStage});
      }
    }
    
    setTemplates(updatedTemplates);
    setStageDialogOpen(false);
    setCurrentStage(null);
    onSuccess(`Stage "${currentStage.name}" saved`);
  };

  const handleEditStage = (stage: TemplateStage) => {
    setCurrentStage({...stage});
    setStageDialogOpen(true);
  };

  const handleDeleteStage = (stageId: string) => {
    if (!templates[selectedTemplateIndex]) return;
    
    const updatedTemplates = [...templates];
    const templateIndex = selectedTemplateIndex;
    
    // Ensure template exists
    if (!updatedTemplates[templateIndex]) {
      return;
    }
    
    // Ensure stages array exists
    if (!updatedTemplates[templateIndex].stages) {
      return;
    }
    
    updatedTemplates[templateIndex].stages = updatedTemplates[templateIndex].stages?.filter(
      stage => stage.id !== stageId
    ) ?? [];
    
    setTemplates(updatedTemplates);
    onSuccess('Stage deleted');
  };

  const handleAddActivity = (stageId: string) => {
    setCurrentActivity({
      id: `activity_${Date.now()}`,
      name: '',
      description: '',
      durationDays: 1,
      durationHours: 2,
      resourceType: 'project_manager',
      canHaveRevisions: false,
      defaultRevisions: 0,
      visibleOnCalendar: true,
      stageId: stageId
    });
    setActivityDialogOpen(true);
  };

  const saveActivity = () => {
    if (!currentActivity) return;
    if (!templates[selectedTemplateIndex]) return;
    
    if (!currentActivity.name.trim()) {
      onError('Activity name cannot be empty');
      return;
    }

    const updatedTemplates = [...templates];
    const templateIndex = selectedTemplateIndex;
    
    // Ensure template exists
    if (!updatedTemplates[templateIndex]) {
      onError('Template not found');
      return;
    }
    
    // Ensure stages array exists
    if (!updatedTemplates[templateIndex].stages) {
      updatedTemplates[templateIndex].stages = [];
      onError('Stage not found');
      return;
    }
    
    const stageIndex = updatedTemplates[templateIndex].stages!.findIndex(
      stage => stage.id === currentActivity.stageId
    );
    
    if (stageIndex < 0) {
      onError('Stage not found');
      return;
    }
    
    // Ensure stage exists at stageIndex
    if (!updatedTemplates[templateIndex].stages![stageIndex]) {
      onError('Stage not found');
      return;
    }
    
    // Ensure activities array exists
    if (!updatedTemplates[templateIndex].stages![stageIndex].activities) {
      updatedTemplates[templateIndex].stages![stageIndex].activities = [];
    }
    
    // Create a copy without the stageId property which is not part of the TemplateActivity interface
    const { stageId, ...activityWithoutStageId } = currentActivity;
    
    // Check if we're editing an existing activity or adding a new one
    const existingActivityIndex = updatedTemplates[templateIndex].stages![stageIndex].activities!.findIndex(
      activity => activity.id === currentActivity.id
    );
    
    if (existingActivityIndex >= 0) {
      // Update existing activity
      updatedTemplates[templateIndex].stages![stageIndex].activities![existingActivityIndex] = activityWithoutStageId;
    } else {
      // Add new activity
      updatedTemplates[templateIndex].stages![stageIndex].activities!.push(activityWithoutStageId);
    }
    
    setTemplates(updatedTemplates);
    setActivityDialogOpen(false);
    setCurrentActivity(null);
    onSuccess(`Activity "${currentActivity.name}" saved`);
  };

  const handleEditActivity = (activity: TemplateActivity, stageId: string) => {
    setCurrentActivity({...activity, stageId});
    setActivityDialogOpen(true);
  };

  const handleDeleteActivity = (stageId: string, activityId: string) => {
    if (!templates[selectedTemplateIndex]) return;
    
    const updatedTemplates = [...templates];
    const templateIndex = selectedTemplateIndex;
    
    // Ensure template exists
    if (!updatedTemplates[templateIndex]) {
      return;
    }
    
    // Ensure stages array exists
    if (!updatedTemplates[templateIndex].stages) {
      return;
    }
    
    const stageIndex = updatedTemplates[templateIndex].stages!.findIndex(
      stage => stage.id === stageId
    );
    
    if (stageIndex < 0) {
      onError('Stage not found');
      return;
    }
    
    // Ensure stage exists at stageIndex
    if (!updatedTemplates[templateIndex].stages![stageIndex]) {
      return;
    }
    
    // Ensure activities array exists
    if (!updatedTemplates[templateIndex].stages![stageIndex].activities) {
      return;
    }
    
    updatedTemplates[templateIndex].stages![stageIndex].activities! = 
      updatedTemplates[templateIndex].stages![stageIndex].activities!.filter(
        activity => activity.id !== activityId
      );
    
    setTemplates(updatedTemplates);
    onSuccess('Activity deleted');
  };

  const handleUpdateTemplateBudget = (field: 'budgetAmount', value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;
    if (!templates[selectedTemplateIndex]) return;
    
    const updatedTemplates = [...templates];
    updatedTemplates[selectedTemplateIndex][field] = numValue;
    setTemplates(updatedTemplates);
  };

  const handleUpdateTemplateName = (value: string) => {
    if (!templates[selectedTemplateIndex]) return;
    
    const updatedTemplates = [...templates];
    updatedTemplates[selectedTemplateIndex].name = value;
    setTemplates(updatedTemplates);
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  const selectedTemplate = templates[selectedTemplateIndex];
  if (!selectedTemplate) {
    return <Alert severity="error">No template selected</Alert>;
  }

  return (
    <Box>
      <Paper sx={{ mb: 3, p: 2 }}>
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">Budget Templates</Typography>
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<SaveIcon />}
              onClick={saveTemplates}
              disabled={isSaving}
              sx={{ mr: 1 }}
            >
              {isSaving ? 'Saving...' : 'Save All Templates'}
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />}
              onClick={handleAddTemplate}
              sx={{ mr: 1 }}
            >
              New Template
            </Button>
          </Box>
        </Stack>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={selectedTemplateIndex} 
            onChange={handleTemplateChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            {templates.map((template, index) => (
              <Tab key={template.id} label={template.name} />
            ))}
          </Tabs>
        </Box>
      </Paper>

      {selectedTemplate && (
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Template Settings</Typography>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField 
                label="Template Name"
                fullWidth
                value={selectedTemplate.name}
                onChange={(e) => handleUpdateTemplateName(e.target.value)}
              />
              <TextField
                label="Budget Amount ($)"
                fullWidth
                type="number"
                value={selectedTemplate.budgetAmount}
                onChange={(e) => handleUpdateTemplateBudget('budgetAmount', e.target.value)}
                InputProps={{ inputProps: { min: 0 } }}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={selectedTemplate.description}
                onChange={(e) => {
                  const updatedTemplates = [...templates];
                  if (updatedTemplates[selectedTemplateIndex]) {
                    updatedTemplates[selectedTemplateIndex].description = e.target.value;
                    setTemplates(updatedTemplates);
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<DuplicateIcon />}
                  onClick={handleDuplicateTemplate}
                >
                  Duplicate
                </Button>
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteTemplate}
                  disabled={templates.length <= 1}
                >
                  Delete Template
                </Button>
              </Box>
            </Stack>
          </Paper>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Stages & Activities</Typography>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />}
                onClick={handleAddStage}
              >
                Add Stage
              </Button>
            </Box>
            
            {!selectedTemplate.stages || selectedTemplate.stages.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No stages defined yet. Click "Add Stage" to get started.
              </Alert>
            ) : (
              selectedTemplate.stages.map((stage) => (
                <Accordion key={stage.id} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                      <Typography variant="subtitle1">{stage.name}</Typography>
                      <Chip 
                        label={`${stage.activities ? stage.activities.length : 0} ${stage.activities && stage.activities.length === 1 ? 'Activity' : 'Activities'}`} 
                        size="small" 
                        color="primary"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Button 
                        size="small" 
                        startIcon={<EditIcon />}
                        onClick={() => handleEditStage(stage)}
                      >
                        Edit Stage
                      </Button>
                      <Button 
                        size="small" 
                        color="error" 
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteStage(stage.id)}
                      >
                        Delete Stage
                      </Button>
                      <Button 
                        size="small" 
                        color="primary" 
                        startIcon={<AddIcon />}
                        onClick={() => handleAddActivity(stage.id)}
                      >
                        Add Activity
                      </Button>
                    </Box>
                    
                    {!stage.activities || stage.activities.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No activities in this stage. Click "Add Activity" to create one.
                      </Typography>
                    ) : (
                      <List>
                        {stage.activities.map((activity) => (
                          <React.Fragment key={activity.id}>
                            <ListItem>
                              <ListItemText
                                primary={activity.name}
                                secondary={
                                  <React.Fragment>
                                    <Typography variant="body2" component="span" display="block">
                                      {activity.description}
                                    </Typography>
                                    <Stack direction="row" spacing={1} mt={1}>
                                      <Chip size="small" label={`${activity.durationDays} days`} />
                                      <Chip 
                                        size="small" 
                                        label={activity.resourceType === 'project_manager' ? 'Project Manager' : 'Resource Type'} 
                                        color={activity.resourceType === 'project_manager' ? 'primary' : 'secondary'}
                                      />
                                      {activity.visibleOnCalendar && 
                                        <Chip 
                                          size="small" 
                                          icon={<VisibilityIcon fontSize="small" />} 
                                          label="Calendar" 
                                          color="info"
                                        />
                                      }
                                    </Stack>
                                  </React.Fragment>
                                }
                                secondaryTypographyProps={{ component: 'div' }}
                              />
                              <ListItemSecondaryAction>
                                <IconButton 
                                  edge="end" 
                                  aria-label="edit"
                                  onClick={() => handleEditActivity(activity, stage.id)}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton 
                                  edge="end" 
                                  aria-label="delete"
                                  onClick={() => handleDeleteActivity(stage.id, activity.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                            <Divider component="li" />
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </Paper>
        </Box>
      )}

      {/* Dialog for adding/editing an activity */}
      <Dialog 
        open={activityDialogOpen} 
        onClose={() => setActivityDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle component="div">
          {currentActivity && templates[selectedTemplateIndex] && templates[selectedTemplateIndex].stages ? 
           (templates[selectedTemplateIndex].stages?.some(stage => 
            stage.activities && stage.activities.some(a => a.id === currentActivity?.id)
           )
            ? 'Edit Activity'
            : 'Add New Activity')
            : 'Add New Activity'
          }
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Activity Name"
              fullWidth
              value={currentActivity?.name || ''}
              onChange={(e) => setCurrentActivity(prev => prev ? {...prev, name: e.target.value} : prev)}
              error={currentActivity ? currentActivity.name === '' : false}
              helperText={currentActivity ? (currentActivity.name === '' ? 'Activity name is required' : '') : ''}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={currentActivity?.description || ''}
              onChange={(e) => setCurrentActivity(prev => prev ? {...prev, description: e.target.value} : prev)}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Duration (Days)"
                type="number"
                fullWidth
                value={currentActivity?.durationDays || 1}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value > 0) {
                    setCurrentActivity(prev => prev ? {...prev, durationDays: value} : prev);
                  }
                }}
                InputProps={{ inputProps: { min: 1 } }}
              />
              <TextField
                label="Duration (Hours)"
                type="number"
                fullWidth
                value={currentActivity?.durationHours || 2}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 0) {
                    setCurrentActivity(prev => prev ? {...prev, durationHours: value} : prev);
                  }
                }}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Stack>
            <FormControl fullWidth>
              <InputLabel>Resource Type</InputLabel>
              <Select
                value={currentActivity?.resourceType || 'project_manager'}
                label="Resource Type"
                onChange={(e) => setCurrentActivity(prev => prev ? 
                  {...prev, resourceType: e.target.value as ResourceType} : prev
                )}
              >
                <MenuItem value="project_manager">Project Manager</MenuItem>
                <MenuItem value="project_manager">Resource Type</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={currentActivity?.canHaveRevisions || false}
                  onChange={(e) => setCurrentActivity(prev => prev ? 
                    {...prev, canHaveRevisions: e.target.checked} : prev
                  )}
                />
              }
              label="Allow Revisions"
            />
            {currentActivity?.canHaveRevisions && (
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Default Revisions"
                  type="number"
                  fullWidth
                  value={currentActivity?.defaultRevisions || 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 0) {
                      setCurrentActivity(prev => prev ? {...prev, defaultRevisions: value} : prev);
                    }
                  }}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Stack>
            )}
            <FormControlLabel
              control={
                <Checkbox
                  checked={currentActivity?.visibleOnCalendar || false}
                  onChange={(e) => setCurrentActivity(prev => prev ? 
                    {...prev, visibleOnCalendar: e.target.checked} : prev
                  )}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ mr: 1 }}>Visible on Calendar</Typography>
                  {currentActivity?.visibleOnCalendar ? 
                    <VisibilityIcon fontSize="small" color="primary" /> : 
                    <VisibilityOffIcon fontSize="small" color="action" />
                  }
                </Box>
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivityDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveActivity} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for adding/editing a stage */}
      <Dialog 
        open={stageDialogOpen} 
        onClose={() => setStageDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle component="div">
          {currentStage && templates[selectedTemplateIndex] && templates[selectedTemplateIndex].stages ? 
           (templates[selectedTemplateIndex].stages?.some(s => s.id === currentStage?.id)
            ? 'Edit Stage'
            : 'Add New Stage')
            : 'Add New Stage'
          }
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Stage Name"
            fullWidth
            value={currentStage?.name || ''}
            onChange={(e) => setCurrentStage(prev => prev ? {...prev, name: e.target.value} : prev)}
            error={currentStage ? currentStage.name === '' : false}
            helperText={currentStage ? (currentStage.name === '' ? 'Stage name is required' : '') : ''}
            sx={{ mt: 1 }}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={currentStage?.description || ''}
            onChange={(e) => setCurrentStage(prev => prev ? {...prev, description: e.target.value} : prev)}
            sx={{ mt: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={currentStage?.isMilestone || false}
                onChange={(e) => setCurrentStage(prev => prev ? {...prev, isMilestone: e.target.checked} : prev)}
              />
            }
            label="Is Milestone"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStageDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveStage} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for adding a new template */}
      <Dialog 
        open={nameDialogOpen} 
        onClose={() => setNameDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle component="div">New Template</DialogTitle>
        <DialogContent>
          <TextField
            label="Template Name"
            fullWidth
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            error={newTemplateName === ''}
            helperText={newTemplateName === '' ? 'Template name is required' : ''}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNameDialogOpen(false)}>Cancel</Button>
          <Button onClick={createNewTemplate} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for duplicating a template */}
      <Dialog 
        open={duplicateDialogOpen} 
        onClose={() => setDuplicateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle component="div">Duplicate Template</DialogTitle>
        <DialogContent>
          <TextField
            label="New Template Name"
            fullWidth
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            error={newTemplateName === ''}
            helperText={newTemplateName === '' ? 'Template name is required' : ''}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicateDialogOpen(false)}>Cancel</Button>
          <Button onClick={duplicateTemplate} variant="contained">Duplicate</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateEditor; 