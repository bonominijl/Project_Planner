import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  Grid,
  IconButton,
  Tooltip,
  Alert
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
  getDay
} from 'date-fns';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';

import {
  ProjectPlan,
  ProjectActivity,
  defaultActivities
} from '../types/projectTypes';
import { ensureValidDate } from '../utils/dateUtils';

interface CalendarViewProps {
  projectPlan: ProjectPlan;
}

const CalendarView: React.FC<CalendarViewProps> = ({ projectPlan }) => {
  const theme = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  
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

  // Helper to get relevant project date for initially showing the calendar
  const getRelevantDate = (): Date => {
    if (projectPlan.startDate) {
      const validDate = ensureValidDate(projectPlan.startDate);
      if (validDate) return validDate;
    }
    return new Date();
  };
  
  // Set current month to project start date or today if not available
  useEffect(() => {
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
    if (!day) return [];
    
    return visibleActivities.filter(activity => {
      if (!activity.startDate || !activity.endDate) return false;
      
      // Ensure we're working with Date objects
      const activityStart = activity.startDate;
      const activityEnd = activity.endDate;
      
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
                  {getActivitiesForDay(day).map((activity, i) => (
                    <Tooltip 
                      key={`${activity.type}-${i}`} 
                      title={`${getActivityName(activity.type)} - ${activity.status.replace('_', ' ')}`}
                      arrow
                    >
                      <Box
                        sx={{
                          backgroundColor: getStatusColor(activity.status),
                          color: 'white',
                          p: 0.5,
                          borderRadius: 1,
                          mb: 0.5,
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {getActivityName(activity.type)}
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
              </Box>
            )}
          </Grid>
        ))}
      </Grid>
    ));
  };

  return (
    <Paper elevation={0} sx={{ mt: 3, p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
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
    </Paper>
  );
};

export default CalendarView; 