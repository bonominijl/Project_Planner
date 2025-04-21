import React, { useState } from 'react';
import {
  Box,
  Typography,
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
  Card,
  CardContent,
  Menu,
  MenuItem,
  alpha,
  Badge,
  LinearProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import WarningIcon from '@mui/icons-material/Warning';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import { format } from 'date-fns';

import { ProjectPlan, ProjectActivity } from '../types/projectTypes';
import { BudgetTemplate, TemplateStage } from '../data/budgetTemplates';
import { defaultActivities } from '../types/projectTypes';
import { ensureValidDate } from '../utils/dateUtils';

interface StageActivityListProps {
  projectPlan: ProjectPlan;
  onUpdateActivity: (updatedActivity: ProjectActivity) => void;
}

// Define a new interface for the stage data
interface StageData {
  id: string;
  name: string;
  description?: string;
  isMilestone?: boolean;
  activities: ProjectActivity[];
  completionPercentage: number;
}

type ActivityStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed';

const StageActivityList: React.FC<StageActivityListProps> = ({ 
  projectPlan, 
  onUpdateActivity 
}) => {
  const theme = useTheme();
  const [expandedStage, setExpandedStage] = useState<string | false>(false);
  const [activityMenuAnchor, setActivityMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeActivity, setActiveActivity] = useState<ProjectActivity | null>(null);

  // Group activities by stage
  const getStageActivities = (): StageData[] => {
    // Check if the project has a budget template with stages
    if (!projectPlan.budgetTemplate || !projectPlan.budgetTemplate.stages) {
      return [{ 
        id: 'default', 
        name: 'Project Activities', 
        activities: projectPlan.activities.map(activity => ({
          ...activity,
          startDate: ensureValidDate(activity.startDate),
          endDate: ensureValidDate(activity.endDate)
        })),
        completionPercentage: getStageCompletionPercentage(projectPlan.activities)
      }];
    }

    // Map stage activities to actual project activities
    return projectPlan.budgetTemplate.stages.map(stage => {
      const stageActivities = projectPlan.activities
        .filter(activity => 
          stage.activities.some(templateActivity => templateActivity.id === activity.type)
        )
        .map(activity => ({
          ...activity,
          startDate: ensureValidDate(activity.startDate),
          endDate: ensureValidDate(activity.endDate)
        }));
      
      return {
        id: stage.id,
        name: stage.name,
        description: stage.description,
        isMilestone: stage.isMilestone,
        activities: stageActivities,
        completionPercentage: getStageCompletionPercentage(stageActivities)
      };
    });
  };

  const getStageCompletionPercentage = (activities: ProjectActivity[]) => {
    if (!activities.length) return 0;
    const completedActivities = activities.filter(a => a.status === 'completed').length;
    return Math.round((completedActivities / activities.length) * 100);
  };

  const handleStageChange = (stageId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedStage(isExpanded ? stageId : false);
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
      const updatedActivity = {
        ...activeActivity,
        status
      };
      onUpdateActivity(updatedActivity);
    }
    handleActivityMenuClose();
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

  const stages = getStageActivities();

  // Render activity date range only if both dates are valid
  const renderActivityDateRange = (activity: ProjectActivity) => {
    const startDate = ensureValidDate(activity.startDate);
    const endDate = ensureValidDate(activity.endDate);

    if (!startDate) return null;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <ScheduleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="body2">
          {format(startDate, "MMM d, yyyy")}
          {endDate && 
            <>
              <ArrowRightAltIcon sx={{ mx: 0.5, fontSize: 16 }} />
              {format(endDate, "MMM d, yyyy")}
            </>
          }
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Project Activities
      </Typography>

      {stages.map((stage, index) => (
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
              <Badge 
                badgeContent={stage.completionPercentage}
                color="primary"
                showZero
                max={100}
                sx={{ 
                  '& .MuiBadge-badge': { 
                    position: 'static',
                    transform: 'none',
                    mr: 2,
                    bgcolor: stage.completionPercentage === 100 ? theme.palette.success.main : theme.palette.primary.main
                  } 
                }}
              >
                <Typography sx={{ fontWeight: 600, mr: 1 }}>
                  Stage {index + 1}:
                </Typography>
              </Badge>
              <Typography sx={{ fontWeight: 500 }}>
                {stage.name}
              </Typography>
              {stage.isMilestone && (
                <Chip 
                  label="Milestone" 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                  sx={{ height: 24, ml: 2 }}
                />
              )}
              <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                <Tooltip title="Completion percentage">
                  <Box sx={{ width: 100, mr: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={stage.completionPercentage} 
                      color={stage.completionPercentage === 100 ? "success" : "primary"}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
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
            {stage.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                {stage.description}
              </Typography>
            )}
            
            <List disablePadding>
              {stage.activities.map((activity, actIndex) => (
                <Card 
                  key={activity.type}
                  sx={{ 
                    mb: 2, 
                    borderLeft: `4px solid ${getStatusColor(activity.status)}`,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[2]
                    }
                  }}
                >
                  <CardContent sx={{ pb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        {getActivityName(activity.type)}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip
                          label={activity.status.replace('_', ' ')}
                          color={
                            activity.status === 'completed' ? 'success' :
                            activity.status === 'in_progress' ? 'primary' :
                            activity.status === 'delayed' ? 'error' : 'default'
                          }
                          icon={getStatusIcon(activity.status)}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
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
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                      {renderActivityDateRange(activity)}
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {activity.duration} business day{activity.duration !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      
                      {activity.revisions > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {activity.revisions} revision{activity.revisions !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Activity status menu */}
      <Menu
        anchorEl={activityMenuAnchor}
        open={Boolean(activityMenuAnchor)}
        onClose={handleActivityMenuClose}
        sx={{ '& .MuiMenuItem-root': { minWidth: 150 } }}
      >
        <MenuItem onClick={() => handleMarkActivityStatus('not_started')}>
          <ListItemIcon>
            <PendingIcon fontSize="small" sx={{ color: theme.palette.grey[500] }} />
          </ListItemIcon>
          <ListItemText>Not Started</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMarkActivityStatus('in_progress')}>
          <ListItemIcon>
            <PlayArrowIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
          </ListItemIcon>
          <ListItemText>In Progress</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMarkActivityStatus('completed')}>
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
          </ListItemIcon>
          <ListItemText>Completed</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMarkActivityStatus('delayed')}>
          <ListItemIcon>
            <WarningIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
          </ListItemIcon>
          <ListItemText>Delayed</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default StageActivityList; 