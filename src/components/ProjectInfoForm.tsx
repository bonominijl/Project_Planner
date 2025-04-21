import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Divider,
  Grid,
  InputAdornment,
  Card,
  CardContent,
  Tooltip,
  IconButton,
  useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { BudgetTemplate, getTemplateByBudget, budgetTemplates } from '../data/budgetTemplates';
import { addBusinessDays, differenceInBusinessDays } from 'date-fns';

export interface ProjectInfo {
  projectName: string;
  kickoffDate: Date;
  dueDate: Date;
  budget: number;
  clientReviewDays: number;
  selectedTemplate: BudgetTemplate;
}

type ProjectInfoFormProps = {
  onSubmit: (formData: ProjectInfo) => void;
  initialData?: ProjectInfo;
  onChangeDetected?: (hasChanges: boolean) => void;
};

// Budget constants
const BUDGET_OPTIONS = budgetTemplates.map(template => template.budgetAmount);
const MIN_BUDGET = Math.min(...BUDGET_OPTIONS);
const MAX_BUDGET = Math.max(...BUDGET_OPTIONS);
const DEFAULT_BUDGET = 10000; // Standard package

const ProjectInfoForm: React.FC<ProjectInfoFormProps> = ({ 
  onSubmit, 
  initialData,
  onChangeDetected 
}) => {
  const theme = useTheme();
  const today = new Date();
  
  const [formData, setFormData] = useState<ProjectInfo>(() => initialData || {
    projectName: '',
    kickoffDate: new Date(),
    dueDate: new Date(addBusinessDays(new Date(), 22)),
    budget: 10000,
    clientReviewDays: 2,
    selectedTemplate: budgetTemplates[0],
  });
  
  // Initialize form data when initialData changes
  useEffect(() => {
    if (initialData) {
      console.log('Setting initial form data:', initialData.projectName);
      setFormData(initialData);
    }
  }, [initialData]);
  
  // Check for changes when formData changes
  useEffect(() => {
    if (initialData && onChangeDetected) {
      const hasChanges = 
        formData.projectName !== initialData.projectName ||
        formData.budget !== initialData.budget ||
        formData.clientReviewDays !== initialData.clientReviewDays ||
        (formData.kickoffDate && initialData.kickoffDate && 
          formData.kickoffDate.getTime() !== initialData.kickoffDate.getTime()) ||
        (formData.dueDate && initialData.dueDate && 
          formData.dueDate.getTime() !== initialData.dueDate.getTime());
      
      onChangeDetected(hasChanges);
    }
  }, [formData, initialData, onChangeDetected]);
  
  const [errors, setErrors] = useState({
    projectName: false,
    kickoffDate: false,
    dueDate: false
  });
  
  const handleInputChange = (field: keyof ProjectInfo, value: any) => {
    // Special handling for budget to select the appropriate template
    if (field === 'budget') {
      const template = getTemplateByBudget(value) || budgetTemplates[0];
      
      setFormData(prev => ({
        ...prev,
        [field]: value,
        selectedTemplate: template
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error for the field
    if (field in errors) {
      setErrors(prev => ({
        ...prev,
        [field]: false
      }));
    }
  };
  
  const handleSubmit = () => {
    // Validate inputs
    const newErrors = {
      projectName: !formData.projectName.trim(),
      kickoffDate: !formData.kickoffDate,
      dueDate: !formData.dueDate || 
               formData.dueDate <= formData.kickoffDate
    };
    
    setErrors(newErrors);
    
    if (Object.values(newErrors).some(error => error)) {
      return; // Don't submit if there are errors
    }
    
    onSubmit(formData);
  };
  
  // Calculate recommended due date based on template and review days
  const calculateRecommendedDueDate = () => {
    const { selectedTemplate, kickoffDate, clientReviewDays } = formData;
    const totalReviewDays = clientReviewDays * 2; // Assume 2 review periods
    const totalDays = selectedTemplate.totalDays + totalReviewDays;
    return addBusinessDays(kickoffDate, totalDays);
  };
  
  const recommendedDueDate = calculateRecommendedDueDate();
  const daysAvailable = differenceInBusinessDays(formData.dueDate, formData.kickoffDate);
  const daysNeeded = differenceInBusinessDays(recommendedDueDate, formData.kickoffDate);
  const isScheduleTight = daysAvailable < daysNeeded;
  
  useEffect(() => {
    // Update the recommended due date when kickoff date, template, or review days change
    const newRecommendedDueDate = calculateRecommendedDueDate();
    
    // Always update the due date when kickoff date or template changes
    // This ensures that the "Due in X days" displayed on the dashboard is accurate
    setFormData(prev => ({
      ...prev,
      dueDate: newRecommendedDueDate
    }));
    
  }, [formData.kickoffDate, formData.selectedTemplate, formData.clientReviewDays]);
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 4, 
        borderRadius: theme.shape.borderRadius * 2,
        mb: 4,
        backgroundColor: theme.palette.background.paper
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Project Details
      </Typography>
      
      <Grid container spacing={4}>
        {/* Left column - Basic project info */}
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            <TextField
              label="Project Name"
              value={formData.projectName}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
              fullWidth
              error={errors.projectName}
              helperText={errors.projectName ? "Project name is required" : ""}
              placeholder="Enter your project name"
            />
            
            <DatePicker
              label="Kickoff Date"
              value={formData.kickoffDate}
              onChange={(date) => handleInputChange('kickoffDate', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: errors.kickoffDate,
                  helperText: errors.kickoffDate ? "Valid kickoff date is required" : ""
                }
              }}
            />
            
            <DatePicker
              label="Due Date"
              value={formData.dueDate}
              onChange={(date) => handleInputChange('dueDate', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: errors.dueDate,
                  helperText: errors.dueDate ? 
                    "Due date must be after kickoff date" : 
                    isScheduleTight ? 
                    `Warning: Schedule is tight. You need ${daysNeeded} business days but have ${daysAvailable}.` : ""
                }
              }}
            />
            
            <TextField
              label="Client Review Time (days per review)"
              type="number"
              value={formData.clientReviewDays}
              onChange={(e) => handleInputChange('clientReviewDays', Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1, max: 10 }}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="This is the number of business days the client needs for each review cycle.">
                      <IconButton size="small">
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }}
            />
          </Stack>
        </Grid>
        
        {/* Right column - Budget and template info */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            Project Package
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              ${formData.budget.toLocaleString()}
            </Typography>
            <Tooltip title="Select a package to determine your project scope and activities">
              <IconButton size="small" sx={{ ml: 1 }}>
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          
          <FormControl fullWidth sx={{ mb: 4 }}>
            <InputLabel id="budget-package-label">Project Package</InputLabel>
            <Select
              labelId="budget-package-label"
              id="budget-package-select"
              value={formData.budget}
              label="Project Package"
              onChange={(e) => handleInputChange('budget', e.target.value)}
            >
              {budgetTemplates.map((template) => (
                <MenuItem key={template.id} value={template.budgetAmount}>
                  {template.name} - ${template.budgetAmount.toLocaleString()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Card variant="outlined" sx={{ mb: 3, borderRadius: 0 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                {formData.selectedTemplate.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {formData.selectedTemplate.description}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="body2">
                <strong>Estimated Duration:</strong> {formData.selectedTemplate.totalDays} business days
              </Typography>
              <Typography variant="body2">
                <strong>Total with Reviews:</strong> {formData.selectedTemplate.totalDays + (formData.clientReviewDays * 2)} business days
              </Typography>
            </CardContent>
          </Card>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Recommended due date: {recommendedDueDate.toLocaleDateString()}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => handleInputChange('dueDate', recommendedDueDate)}
              size="small"
            >
              Use Recommended
            </Button>
          </Box>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 4 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          onClick={handleSubmit}
          sx={{ 
            px: 4, 
            py: 1.5, 
            borderRadius: theme.shape.borderRadius * 2,
            fontWeight: 600,
            textTransform: 'none'
          }}
        >
          Continue to Activities
        </Button>
      </Box>
    </Paper>
  );
};

export default ProjectInfoForm; 