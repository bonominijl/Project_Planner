import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Slider,
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
import { budgetTemplates, BudgetTemplate } from '../data/budgetTemplates';
import { addBusinessDays, differenceInBusinessDays } from 'date-fns';

export interface ProjectInfo {
  projectName: string;
  kickoffDate: Date;
  dueDate: Date;
  budget: number;
  clientReviewDays: number;
  selectedTemplate: BudgetTemplate;
}

interface ProjectInfoFormProps {
  onSubmit: (projectInfo: ProjectInfo) => void;
}

const MIN_BUDGET = 8000;
const MAX_BUDGET = 20000;
const DEFAULT_BUDGET = 10000;
const BUDGET_STEP = 1000;

const ProjectInfoForm: React.FC<ProjectInfoFormProps> = ({ onSubmit }) => {
  const theme = useTheme();
  const today = new Date();
  
  // Setup initial kickoff date (next business day) and due date (20 business days from kickoff)
  let kickoffDate = addBusinessDays(today, 1);
  let dueDate = addBusinessDays(kickoffDate, 22); // Default to $10k template duration
  
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    projectName: '',
    kickoffDate,
    dueDate,
    budget: DEFAULT_BUDGET,
    clientReviewDays: 2,
    selectedTemplate: budgetTemplates[0] // Default to $10k template
  });
  
  const [errors, setErrors] = useState({
    projectName: false,
    kickoffDate: false,
    dueDate: false
  });
  
  const handleInputChange = (field: keyof ProjectInfo, value: any) => {
    // Special handling for budget to select the appropriate template
    if (field === 'budget') {
      const template = budgetTemplates.find(t => t.budgetAmount === value) || 
        budgetTemplates.reduce((prev, curr) => {
          return Math.abs(curr.budgetAmount - value) < Math.abs(prev.budgetAmount - value) 
            ? curr 
            : prev;
        });
      
      setProjectInfo(prev => ({
        ...prev,
        [field]: value,
        selectedTemplate: template
      }));
    } else {
      setProjectInfo(prev => ({
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
      projectName: !projectInfo.projectName.trim(),
      kickoffDate: !projectInfo.kickoffDate,
      dueDate: !projectInfo.dueDate || 
               projectInfo.dueDate <= projectInfo.kickoffDate
    };
    
    setErrors(newErrors);
    
    if (Object.values(newErrors).some(error => error)) {
      return; // Don't submit if there are errors
    }
    
    onSubmit(projectInfo);
  };
  
  // Calculate recommended due date based on template and review days
  const calculateRecommendedDueDate = () => {
    const { selectedTemplate, kickoffDate, clientReviewDays } = projectInfo;
    const totalReviewDays = clientReviewDays * 2; // Assume 2 review periods
    const totalDays = selectedTemplate.totalDays + totalReviewDays;
    return addBusinessDays(kickoffDate, totalDays);
  };
  
  const recommendedDueDate = calculateRecommendedDueDate();
  const daysAvailable = differenceInBusinessDays(projectInfo.dueDate, projectInfo.kickoffDate);
  const daysNeeded = differenceInBusinessDays(recommendedDueDate, projectInfo.kickoffDate);
  const isScheduleTight = daysAvailable < daysNeeded;
  
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
              value={projectInfo.projectName}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
              fullWidth
              error={errors.projectName}
              helperText={errors.projectName ? "Project name is required" : ""}
              placeholder="Enter your project name"
            />
            
            <DatePicker
              label="Kickoff Date"
              value={projectInfo.kickoffDate}
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
              value={projectInfo.dueDate}
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
              value={projectInfo.clientReviewDays}
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
            Project Budget
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              ${projectInfo.budget.toLocaleString()}
            </Typography>
            <Tooltip title="Select your budget to determine the project scope and activities">
              <IconButton size="small" sx={{ ml: 1 }}>
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Slider
            value={projectInfo.budget}
            min={MIN_BUDGET}
            max={MAX_BUDGET}
            step={BUDGET_STEP}
            marks={budgetTemplates.map(template => ({
              value: template.budgetAmount,
              label: `$${template.budgetAmount/1000}K`
            }))}
            onChange={(_, value) => handleInputChange('budget', value)}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `$${value.toLocaleString()}`}
            sx={{ mb: 4 }}
          />
          
          <Card variant="outlined" sx={{ mb: 3, borderRadius: theme.shape.borderRadius }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                {projectInfo.selectedTemplate.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {projectInfo.selectedTemplate.description}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="body2">
                <strong>Estimated Duration:</strong> {projectInfo.selectedTemplate.totalDays} business days
              </Typography>
              <Typography variant="body2">
                <strong>Total with Reviews:</strong> {projectInfo.selectedTemplate.totalDays + (projectInfo.clientReviewDays * 2)} business days
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
          Generate Project Plan
        </Button>
      </Box>
    </Paper>
  );
};

export default ProjectInfoForm; 