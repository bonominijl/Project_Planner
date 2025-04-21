import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Chip,
  useTheme,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip as MuiTooltip,
  LinearProgress,
  CircularProgress,
  Stack
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import RepeatIcon from '@mui/icons-material/Repeat';
import EventIcon from '@mui/icons-material/Event';
import format from 'date-fns/format';
import isWeekend from 'date-fns/isWeekend';
import isValid from 'date-fns/isValid';
import parse from 'date-fns/parse';

interface Holiday {
  id: string;
  name: string;
  date: Date;
  repeatsAnnually: boolean;
  description?: string;
}

// Interface for the filtered holidays with displayDate
interface DisplayHoliday extends Omit<Holiday, 'date'> {
  displayDate: Date;
  date: Date;
}

interface HolidayManagerProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const HolidayManager: React.FC<HolidayManagerProps> = ({ onSuccess, onError }) => {
  const theme = useTheme();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState<Partial<Holiday>>({
    name: '',
    date: new Date(),
    description: '',
    repeatsAnnually: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Load holidays from storage on component mount
  useEffect(() => {
    const loadHolidays = async () => {
      try {
        setIsLoading(true);
        const savedHolidays = localStorage.getItem('companyHolidays');
        if (savedHolidays) {
          const parsedHolidays = JSON.parse(savedHolidays);
          // Convert string dates back to Date objects
          const holidaysWithDates = parsedHolidays.map((holiday: any) => ({
            ...holiday,
            date: new Date(holiday.date)
          }));
          setHolidays(holidaysWithDates);
        } else {
          // Set default US holidays if none exist
          setHolidays(getDefaultHolidays());
        }
      } catch (error) {
        console.error('Failed to load holidays:', error);
        onError("Failed to load holidays. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadHolidays();
  }, [onError]);

  const getDefaultHolidays = (): Holiday[] => {
    const currentYear = new Date().getFullYear();
    return [
      {
        id: '1',
        name: "New Year's Day",
        date: new Date(currentYear, 0, 1),
        repeatsAnnually: true,
        description: 'First day of the year'
      },
      {
        id: '2',
        name: "Memorial Day",
        date: new Date(currentYear, 4, getLastMondayOfMonth(currentYear, 4)),
        repeatsAnnually: true,
        description: 'Last Monday in May'
      },
      {
        id: '3',
        name: "Independence Day",
        date: new Date(currentYear, 6, 4),
        repeatsAnnually: true,
        description: 'Fourth of July'
      },
      {
        id: '4',
        name: "Labor Day",
        date: new Date(currentYear, 8, getFirstMondayOfMonth(currentYear, 8)),
        repeatsAnnually: true,
        description: 'First Monday in September'
      },
      {
        id: '5',
        name: "Thanksgiving Day",
        date: new Date(currentYear, 10, getFourthThursdayOfMonth(currentYear, 10)),
        repeatsAnnually: true,
        description: 'Fourth Thursday in November'
      },
      {
        id: '6',
        name: "Christmas Day",
        date: new Date(currentYear, 11, 25),
        repeatsAnnually: true,
        description: 'December 25th'
      }
    ];
  };

  // Helper function to get the first Monday of a month
  const getFirstMondayOfMonth = (year: number, month: number): number => {
    const date = new Date(year, month, 1);
    const day = date.getDay();
    return day === 1 ? 1 : (day === 0 ? 2 : 9 - day);
  };

  // Helper function to get the last Monday of a month
  const getLastMondayOfMonth = (year: number, month: number): number => {
    const date = new Date(year, month + 1, 0);
    const day = date.getDay();
    return date.getDate() - day - (day === 1 ? 7 : 0);
  };

  // Helper function to get the fourth Thursday of a month (Thanksgiving)
  const getFourthThursdayOfMonth = (year: number, month: number): number => {
    const date = new Date(year, month, 1);
    const day = date.getDay();
    const firstThursday = (day <= 4) ? (5 - day) : (12 - day);
    return firstThursday + 21; // Add 3 weeks to get to the 4th Thursday
  };

  const handleOpenDialog = (holiday?: Holiday) => {
    if (holiday) {
      setSelectedHoliday(holiday);
      setFormData({
        name: holiday.name,
        date: holiday.date,
        description: holiday.description || '',
        repeatsAnnually: holiday.repeatsAnnually
      });
    } else {
      setSelectedHoliday(null);
      setFormData({
        name: '',
        date: new Date(),
        description: '',
        repeatsAnnually: true
      });
    }
    setErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field if exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date && isValid(date)) {
      setFormData({
        ...formData,
        date
      });
      
      // Clear date error if exists
      if (errors.date) {
        setErrors({
          ...errors,
          date: ''
        });
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Holiday name is required';
    }
    
    if (!formData.date || !isValid(formData.date)) {
      newErrors.date = 'Valid date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveHoliday = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSaving(true);
      
      // Generate a unique ID if it's a new holiday
      const holidayToSave: Holiday = {
        id: selectedHoliday?.id || Date.now().toString(),
        name: formData.name!,
        date: formData.date as Date,
        repeatsAnnually: formData.repeatsAnnually || true,
        description: formData.description
      };
      
      let updatedHolidays;
      
      if (selectedHoliday) {
        // Update existing holiday
        updatedHolidays = holidays.map(h => 
          h.id === selectedHoliday.id ? holidayToSave : h
        );
        onSuccess(`${holidayToSave.name} has been updated`);
      } else {
        // Add new holiday
        updatedHolidays = [...holidays, holidayToSave];
        onSuccess(`${holidayToSave.name} has been added`);
      }
      
      setHolidays(updatedHolidays);
      saveHolidaysToStorage(updatedHolidays);
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save holiday:', error);
      onError('Failed to save holiday. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHoliday = async (holiday: Holiday) => {
    try {
      // In real app, this would be an API call
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedHolidays = holidays.filter(h => h.id !== holiday.id);
      setHolidays(updatedHolidays);
      saveHolidaysToStorage(updatedHolidays);
      onSuccess(`${holiday.name} has been deleted`);
      setDeleteConfirmOpen(false);
      setSelectedHoliday(null);
    } catch (error) {
      console.error('Failed to delete holiday:', error);
      onError('Failed to delete holiday. Please try again.');
    }
  };

  const saveHolidaysToStorage = (holidaysToSave: Holiday[]) => {
    try {
      localStorage.setItem('companyHolidays', JSON.stringify(holidaysToSave));
      onSuccess("Holidays saved successfully");
    } catch (error) {
      onError("Failed to save holidays");
    }
  };

  const getHolidaysForYear = (year: number): DisplayHoliday[] => {
    return holidays.filter(holiday => {
      if (holiday.repeatsAnnually) {
        return true;
      }
      const holidayYear = holiday.date.getFullYear();
      return holidayYear === year;
    }).map(holiday => {
      if (holiday.repeatsAnnually) {
        // Create a new date with the selected year but keep month and day
        const originalDate = holiday.date;
        const updatedDate = new Date(
          year,
          originalDate.getMonth(),
          originalDate.getDate()
        );
        return { ...holiday, displayDate: updatedDate };
      }
      return { ...holiday, displayDate: holiday.date };
    }).sort((a, b) => {
      return a.displayDate.getTime() - b.displayDate.getTime();
    });
  };

  const filteredHolidays = getHolidaysForYear(yearFilter);

  const handleImport = () => {
    // Here we would typically handle file upload and parsing
    // For demo purposes, we'll just add some default holidays
    const defaultHolidays = getDefaultHolidays();
    
    // Merge with existing holidays, avoiding duplicates by name
    const existingNames = holidays.map(h => h.name.toLowerCase());
    const newHolidays = defaultHolidays.filter(h => 
      !existingNames.includes(h.name.toLowerCase())
    );
    
    if (newHolidays.length === 0) {
      onError("No new holidays to import");
      return;
    }
    
    const updatedHolidays = [...holidays, ...newHolidays];
    setHolidays(updatedHolidays);
    saveHolidaysToStorage(updatedHolidays);
    onSuccess(`Imported ${newHolidays.length} holidays`);
  };

  const handleExport = () => {
    // Create a downloadable file with holidays data
    const dataStr = JSON.stringify(holidays, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = 'company-holidays.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    onSuccess("Holidays exported successfully");
  };

  const handleYearChange = (newYear: number) => {
    if (newYear >= 2000 && newYear <= 2100) {
      setYearFilter(newYear);
    }
  };

  const isWeekendDay = (date: Date): boolean => {
    return isWeekend(date);
  };

  const handleOpenDeleteConfirm = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setSelectedHoliday(null);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            Company Holidays
          </Typography>
          <Box>
            <Button
              variant="outlined"
              onClick={handleImport}
              sx={{ mr: 2 }}
            >
              Import Default Holidays
            </Button>
            <Button
              variant="outlined"
              onClick={handleExport}
              sx={{ mr: 2 }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Holiday
            </Button>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Company holidays are used to avoid scheduling project activities on these dates.
        </Alert>

        <Paper 
          elevation={0}
          sx={{
            p: 3,
            borderRadius: theme.shape.borderRadius,
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mr: 2 }}>
              Viewing holidays for year:
            </Typography>
            <TextField
              type="number"
              value={yearFilter}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              variant="outlined"
              size="small"
              sx={{ width: 100 }}
              InputProps={{ inputProps: { min: 2000, max: 2100 } }}
            />
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {isLoading ? (
            <Box sx={{ width: '100%', mt: 4 }}>
              <LinearProgress />
            </Box>
          ) : (
            <>
              {filteredHolidays.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No holidays defined for {yearFilter}
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ mt: 2 }}
                  >
                    Add Holiday
                  </Button>
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredHolidays.map(({ id, name, repeatsAnnually, displayDate, description }) => (
                        <TableRow key={id}>
                          <TableCell>{name}</TableCell>
                          <TableCell>{format(displayDate, 'MMMM d, yyyy (EEEE)')}</TableCell>
                          <TableCell>{description || 'N/A'}</TableCell>
                          <TableCell align="right">
                            <MuiTooltip title="Edit">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleOpenDialog({ id, name, date: displayDate, repeatsAnnually, description }) }
                              >
                                <EditIcon />
                              </IconButton>
                            </MuiTooltip>
                            <MuiTooltip title="Delete">
                              <IconButton 
                                size="small"
                                color="error"
                                onClick={() => handleOpenDeleteConfirm({ id, name, date: displayDate, repeatsAnnually, description }) }
                              >
                                <DeleteIcon />
                              </IconButton>
                            </MuiTooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Paper>

        {/* Holiday Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedHoliday ? 'Edit Holiday' : 'Add Holiday'}
          </DialogTitle>
          <DialogContent>
            <TextField
              label="Holiday Name"
              name="name"
              fullWidth
              value={formData.name || ''}
              onChange={handleInputChange}
              variant="outlined"
              margin="normal"
              required
              error={!!errors.name}
              helperText={errors.name}
            />
            
            <Box sx={{ my: 3 }}>
              <DatePicker
                label="Holiday Date"
                value={formData.date ? new Date(formData.date) : null}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined",
                    error: !!errors.date,
                    helperText: errors.date
                  },
                }}
              />
            </Box>
            
            <TextField
              label="Description (Optional)"
              name="description"
              fullWidth
              value={formData.description || ''}
              onChange={handleInputChange}
              variant="outlined"
              margin="normal"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.repeatsAnnually || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, repeatsAnnually: e.target.checked }))}
                  color="primary"
                />
              }
              label="Repeats Annually"
            />
            
            {formData.date && isWeekendDay(new Date(formData.date)) && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This date falls on a weekend. Weekend days are typically non-working days.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveHoliday}
              variant="contained"
              color="primary"
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={handleCloseDeleteConfirm}>
          <DialogTitle component="div">
            Confirm Delete
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the holiday "{selectedHoliday?.name}"?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteConfirm}>Cancel</Button>
            <Button 
              onClick={() => handleDeleteHoliday(selectedHoliday!)} 
              color="error" 
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default HolidayManager; 