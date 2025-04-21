import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  useTheme,
  Grid,
  Divider,
  Alert
} from '@mui/material';
import { 
  eachDayOfInterval,
  format,
  isWeekend,
  addDays,
  isSameDay,
  differenceInDays
} from 'date-fns';

import { 
  ProjectPlan,
  ProjectActivity,
  defaultActivities
} from '../types/projectTypes';
import { ensureValidDate } from '../utils/dateUtils';

interface GanttViewProps {
  projectPlan: ProjectPlan;
}

const GanttView: React.FC<GanttViewProps> = ({ projectPlan }) => {
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);

  // Ensure valid project dates
  const projectStartDate = ensureValidDate(projectPlan.startDate);
  const projectEndDate = ensureValidDate(projectPlan.endDate);

  // Filter activities to only show those with visibleOnCalendar=true
  const visibleActivities = projectPlan.activities.filter(activity => {
    // If the activity has a defined visibleOnCalendar property, use it
    // Otherwise default to showing the activity (backward compatibility)
    return activity.visibleOnCalendar !== false;
  }).map(activity => {
    // Ensure all activity dates are valid
    return {
      ...activity,
      startDate: ensureValidDate(activity.startDate),
      endDate: ensureValidDate(activity.endDate)
    };
  }).filter(activity => activity.startDate && activity.endDate);

  // If there's no start or end date, we can't display a Gantt chart
  if (!projectStartDate || !projectEndDate) {
    return (
      <Box sx={{ mt: 2, p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Please set a project start date to view the Gantt chart
        </Typography>
      </Box>
    );
  }

  // Generate array of all days in the project duration
  let projectDays: Date[] = [];
  let businessDays: Date[] = [];
  
  try {
    projectDays = eachDayOfInterval({
      start: projectStartDate,
      end: projectEndDate
    });
    
    // Get only business days for our display
    businessDays = projectDays.filter(day => !isWeekend(day));
    
    // If we have no business days (unlikely but possible), show error
    if (businessDays.length === 0) {
      throw new Error("No business days found in the project timeline");
    }
  } catch (e) {
    setError(`Error calculating project days: ${e instanceof Error ? e.message : "Unknown error"}`);
    
    // If we catch an error, provide a basic fallback
    if (projectDays.length === 0) {
      projectDays = [projectStartDate, addDays(projectStartDate, 5)];
      businessDays = projectDays;
    }
  }

  // Calculate width for each day cell
  const dayCellWidth = 40; // Width in pixels

  // Get label for each activity
  const getActivityName = (activityType: string) => {
    const activity = defaultActivities.find(a => a.id === activityType);
    return activity ? activity.name : activityType;
  };

  // Get color based on status
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

  // Calculate position for activity bar
  const getActivityBarPosition = (activity: ProjectActivity) => {
    if (!activity.startDate || !activity.endDate || !projectStartDate) {
      return { left: 0, width: 0 };
    }

    try {
      // No need to create new Date objects since we already validated them
      const activityStart = activity.startDate;
      const activityEnd = activity.endDate;
      
      // Calculate days from project start to activity start
      const startOffset = differenceInDays(activityStart, projectStartDate);
      
      // Calculate width based on activity duration
      const durationDays = differenceInDays(activityEnd, activityStart) + 1;
      
      // Adjust for weekends
      let businessDaysOffset = 0;
      let currentDate = new Date(projectStartDate);
      
      for (let i = 0; i < startOffset; i++) {
        currentDate = addDays(currentDate, 1);
        if (!isWeekend(currentDate)) {
          businessDaysOffset++;
        }
      }

      return {
        left: businessDaysOffset * dayCellWidth,
        width: activity.duration * dayCellWidth
      };
    } catch (e) {
      // If error calculating position, return a default
      console.error("Error calculating activity position:", e);
      return { left: 0, width: dayCellWidth };
    }
  };

  return (
    <Paper elevation={0} sx={{ mt: 3, p: 2, overflowX: 'auto' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box>
        <Grid container>
          {/* Left sidebar with activity names */}
          <Grid item sx={{ width: 200, minWidth: 200, pr: 2, borderRight: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ height: 60, display: 'flex', alignItems: 'flex-end', pb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Activities
              </Typography>
            </Box>
            
            {visibleActivities.map((activity) => (
              <Box 
                key={activity.type} 
                sx={{ 
                  height: 50, 
                  display: 'flex', 
                  alignItems: 'center',
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}
              >
                <Typography 
                  variant="body2" 
                  noWrap
                  sx={{ 
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%'
                  }}
                >
                  {getActivityName(activity.type)}
                </Typography>
              </Box>
            ))}
          </Grid>

          {/* Timeline grid */}
          <Grid item xs sx={{ overflowX: 'auto' }}>
            <Box sx={{ position: 'relative' }}>
              {/* Header with dates */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  height: 60
                }}
              >
                {businessDays.map((day, index) => (
                  <Box 
                    key={index}
                    sx={{ 
                      width: dayCellWidth, 
                      minWidth: dayCellWidth, 
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      pb: 1,
                      borderRight: index < businessDays.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                      backgroundColor: isSameDay(day, new Date()) ? theme.palette.action.hover : 'transparent'
                    }}
                  >
                    <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
                      {format(day, 'dd')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(day, 'MMM')}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Rows for each activity */}
              <Box sx={{ position: 'relative' }}>
                {visibleActivities.map((activity, index) => (
                  <Box 
                    key={activity.type}
                    sx={{ 
                      height: 50, 
                      width: businessDays.length * dayCellWidth,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      position: 'relative'
                    }}
                  >
                    {/* Activity bar */}
                    {activity.startDate && activity.endDate && (
                      <Box 
                        sx={{ 
                          position: 'absolute',
                          height: 30,
                          top: 10,
                          backgroundColor: getStatusColor(activity.status),
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '0.75rem',
                          ...getActivityBarPosition(activity)
                        }}
                      >
                        {activity.duration} day{activity.duration !== 1 ? 's' : ''}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default GanttView; 