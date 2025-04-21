import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  Card,
  CardContent,
  Divider,
  Stack,
  Chip
} from '@mui/material';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  isSameDay,
  getDay,
  differenceInDays
} from 'date-fns';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import InfoIcon from '@mui/icons-material/Info';
import { useDevMode } from '../context/DevModeContext';
import DevModePageIdentifier from './DevModePageIdentifier';

import {
  ProjectPlan,
  ProjectActivity,
  defaultActivities
} from '../types/projectTypes';

interface ClientViewProps {
  projectPlan: ProjectPlan;
}

const ClientView: React.FC<ClientViewProps> = ({ projectPlan }) => {
  const theme = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  
  const { isDevMode } = useDevMode();
  
  // Helper to get relevant project date for initially showing the calendar
  const getRelevantDate = (): Date => {
    if (projectPlan.startDate) {
      return projectPlan.startDate;
    }
    return new Date();
  };
  
  // Set current month to project start date or today if not available
  React.useEffect(() => {
    try {
      setCurrentMonth(startOfMonth(getRelevantDate()));
    } catch (e) {
      setError(`Error setting calendar view: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }, [projectPlan.startDate]);

  // Navigate to previous month
  const handlePrevMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Navigate to current month
  const handleToday = () => {
    setCurrentMonth(startOfMonth(new Date()));
  };

  // Get days to display in calendar grid
  const getDaysArray = (): (Date | null)[] => {
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(monthStart);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

      // Get day of week for the first day (0 = Sunday, 1 = Monday, etc.)
      const startDay = getDay(monthStart);
      
      // Add leading empty days to align first day correctly
      const leadingEmptyDays = Array(startDay).fill(null);
      
      return [...leadingEmptyDays, ...days];
    } catch (e) {
      setError(`Error generating calendar: ${e instanceof Error ? e.message : "Unknown error"}`);
      return [];
    }
  };

  // Get activities for a specific day
  const getActivitiesForDay = (day: Date | null) => {
    if (!day || !projectPlan.activities) return [];
    
    return projectPlan.activities.filter(activity => {
      if (!activity.startDate || !activity.endDate) return false;
      
      // Check if day falls between start and end dates inclusive
      const activityStart = new Date(activity.startDate);
      const activityEnd = new Date(activity.endDate);
      
      return day >= activityStart && day <= activityEnd;
    });
  };

  // Get activity name from type
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

  // Get delay information if activity is delayed
  const getDelayInfo = (activity: ProjectActivity) => {
    if (activity.status !== 'delayed' || !activity.originalEndDate || !activity.endDate) {
      return null;
    }
    
    const originalEnd = new Date(activity.originalEndDate);
    const currentEnd = new Date(activity.endDate);
    const delayDays = differenceInDays(currentEnd, originalEnd);
    
    if (delayDays <= 0) return null;
    
    return {
      days: delayDays,
      impact: delayDays > 5 ? 'high' : delayDays > 2 ? 'medium' : 'low'
    };
  };

  // Render the days of the week header
  const renderDaysOfWeek = () => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <Grid container>
        {daysOfWeek.map((day, index) => (
          <Grid 
            item 
            key={index} 
            xs={12/7}
            sx={{ 
              p: 1, 
              textAlign: 'center',
              borderBottom: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.grey[100]
            }}
          >
            <Typography variant="subtitle2">{day}</Typography>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Render calendar days
  const renderDays = () => {
    const daysArray = getDaysArray();
    
    // Organize days into rows of 7
    const rows: Array<Array<Date | null>> = [];
    let cells: Array<Date | null> = [];
    
    daysArray.forEach((day, i) => {
      if (i > 0 && i % 7 === 0) {
        rows.push(cells);
        cells = [];
      }
      cells.push(day);
    });
    
    // Add any remaining days
    if (cells.length > 0) {
      while (cells.length < 7) {
        cells.push(null); // Pad with empty cells to complete the week
      }
      rows.push(cells);
    }
    
    return rows.map((row, rowIndex) => (
      <Grid container key={rowIndex}>
        {row.map((day, index) => (
          <Grid 
            item 
            key={index} 
            xs={12/7}
            sx={{ 
              height: 120, 
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: day && isToday(day) ? theme.palette.action.hover : 'transparent',
              opacity: day && !isSameMonth(day, currentMonth) ? 0.4 : 1,
              position: 'relative'
            }}
          >
            {day && (
              <Box>
                <Box sx={{ p: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: isToday(day) ? 'bold' : 'normal',
                      color: isToday(day) ? theme.palette.primary.main : 'inherit'
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>
                </Box>
                
                <Box sx={{ px: 0.5, overflow: 'hidden' }}>
                  {getActivitiesForDay(day).map((activity, i) => {
                    const delayInfo = getDelayInfo(activity);
                    
                    return (
                      <Tooltip 
                        key={`${activity.type}-${i}`} 
                        title={
                          <React.Fragment>
                            <Typography variant="subtitle2">
                              {getActivityName(activity.type)}
                            </Typography>
                            <Typography variant="body2">
                              Status: {activity.status.replace('_', ' ')}
                            </Typography>
                            {activity.originalEndDate && (
                              <Typography variant="body2">
                                Original Due: {format(new Date(activity.originalEndDate), 'MMM d, yyyy')}
                              </Typography>
                            )}
                            {delayInfo && (
                              <Typography variant="body2" color="error">
                                Delayed by {delayInfo.days} day{delayInfo.days !== 1 ? 's' : ''}
                              </Typography>
                            )}
                          </React.Fragment>
                        }
                        arrow
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: getStatusColor(activity.status),
                            color: 'white',
                            p: 0.5,
                            borderRadius: 1,
                            mb: 0.5,
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            border: activity.originalEndDate && activity.endDate && 
                                   new Date(activity.originalEndDate).getTime() !== new Date(activity.endDate).getTime() 
                                  ? `1px dashed ${theme.palette.error.main}` 
                                  : 'none'
                          }}
                        >
                          <Typography variant="caption" sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {getActivityName(activity.type)}
                          </Typography>
                          {delayInfo && (
                            <InfoIcon sx={{ fontSize: '0.875rem', ml: 0.5 }} />
                          )}
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Grid>
        ))}
      </Grid>
    ));
  };

  // Render legend for the calendar
  const renderLegend = () => (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Legend</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" gutterBottom>Status Colors:</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip 
                sx={{ backgroundColor: theme.palette.grey[400], color: 'white' }} 
                label="Not Started" 
                size="small" 
              />
              <Chip 
                sx={{ backgroundColor: theme.palette.primary.main, color: 'white' }} 
                label="In Progress" 
                size="small" 
              />
              <Chip 
                sx={{ backgroundColor: theme.palette.success.main, color: 'white' }} 
                label="Completed" 
                size="small" 
              />
              <Chip 
                sx={{ backgroundColor: theme.palette.error.main, color: 'white' }} 
                label="Delayed" 
                size="small" 
              />
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" gutterBottom>Indicators:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box 
                sx={{ 
                  border: `1px dashed ${theme.palette.error.main}`, 
                  width: 16, 
                  height: 16, 
                  borderRadius: 1, 
                  mr: 1 
                }} 
              />
              <Typography variant="body2">Changed from original schedule</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon sx={{ fontSize: '1rem', mr: 1, color: theme.palette.grey[500] }} />
              <Typography variant="body2">Hover for delay information</Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // Render project summary information
  const renderProjectSummary = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Project Overview</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Project Name:</Typography>
            <Typography variant="body1" gutterBottom>
              {projectPlan.name || "Untitled Project"}
            </Typography>
            
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Original Timeline:</Typography>
            <Typography variant="body1" gutterBottom>
              {projectPlan.startDate ? format(new Date(projectPlan.startDate), 'MMM d, yyyy') : 'TBD'} - 
              {projectPlan.originalEndDate ? format(new Date(projectPlan.originalEndDate), 'MMM d, yyyy') : 'TBD'}
            </Typography>
            
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Current Timeline:</Typography>
            <Typography variant="body1" gutterBottom>
              {projectPlan.startDate ? format(new Date(projectPlan.startDate), 'MMM d, yyyy') : 'TBD'} - 
              {projectPlan.endDate ? format(new Date(projectPlan.endDate), 'MMM d, yyyy') : 'TBD'}
            </Typography>
            
            {projectPlan.creator && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>Project Manager:</Typography>
                <Typography variant="body1" gutterBottom>
                  {projectPlan.creator}
                </Typography>
              </>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Status Summary:</Typography>
            <Box sx={{ mt: 1 }}>
              {['not_started', 'in_progress', 'completed', 'delayed'].map(status => {
                const count = projectPlan.activities.filter(a => a.status === status).length;
                return (
                  <Box key={status} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: getStatusColor(status), 
                        mr: 1 
                      }} 
                    />
                    <Typography variant="body2">
                      {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}:
                      {' '}{count} {count === 1 ? 'activity' : 'activities'}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
            
            {projectPlan.endDate && projectPlan.originalEndDate && (
              new Date(projectPlan.endDate).getTime() !== new Date(projectPlan.originalEndDate).getTime() && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Project completion date has changed from the original timeline by {
                      differenceInDays(new Date(projectPlan.endDate), new Date(projectPlan.originalEndDate))
                    } days.
                  </Typography>
                </Alert>
              )
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Typography variant="h4" gutterBottom align="center" sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
        Epipheo Project Plan
      </Typography>
      <Typography variant="subtitle1" gutterBottom align="center" sx={{ mb: 4 }}>
        Client Review Calendar
      </Typography>
      
      {renderProjectSummary()}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{format(currentMonth, 'MMMM yyyy')}</Typography>
        
        <Box>
          <IconButton onClick={handlePrevMonth} aria-label="previous month">
            <ChevronLeftIcon />
          </IconButton>
          
          <IconButton onClick={handleToday} aria-label="today" sx={{ mx: 1 }}>
            <TodayIcon />
          </IconButton>
          
          <IconButton onClick={handleNextMonth} aria-label="next month">
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>
      
      {renderDaysOfWeek()}
      {renderDays()}
      {renderLegend()}
      
      {/* Dev Mode Identifier */}
      <DevModePageIdentifier page="ClientView" component="Client Timeline View" />
    </Box>
  );
};

export default ClientView; 