import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Button,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  Pagination,
  FormControl,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import { format } from 'date-fns';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';

// Audit log entry interface
interface AuditLogEntry {
  id: string;
  action: string;
  projectId: string;
  projectName: string;
  user: string;
  timestamp: string;
  details?: string;
}

// Storage key for audit log
const AUDIT_LOG_KEY = 'project_planner_audit_log';

// Action type to color mapping
const actionColors: Record<string, string> = {
  CREATE_PROJECT: 'success',
  UPDATE_PROJECT: 'primary',
  UPDATE_TIMELINE: 'info',
  FINALIZE_PROJECT: 'secondary',
  DELETE_PROJECT: 'error'
};

// Sort directions
type Order = 'asc' | 'desc';

// List of sortable fields
type SortField = 'timestamp' | 'action' | 'user' | 'projectName';

const AuditLogViewer: React.FC = () => {
  const theme = useTheme();
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [filteredLog, setFilteredLog] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<SortField>('timestamp');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load audit log from localStorage
  const loadAuditLog = () => {
    setLoading(true);
    setError(null);
    
    try {
      const storedLog = localStorage.getItem(AUDIT_LOG_KEY);
      if (storedLog) {
        const parsedLog = JSON.parse(storedLog);
        setAuditLog(parsedLog);
      } else {
        setAuditLog([]);
      }
    } catch (error) {
      console.error('Error loading audit log:', error);
      setError('Failed to load audit log. Please try again.');
      setAuditLog([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadAuditLog();
  }, []);

  // Apply filters and sorting whenever dependencies change
  useEffect(() => {
    let result = [...auditLog];
    
    // Apply action filter
    if (actionFilter !== 'all') {
      result = result.filter(entry => entry.action === actionFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        entry => 
          entry.projectName.toLowerCase().includes(lowerSearchTerm) ||
          entry.user.toLowerCase().includes(lowerSearchTerm) ||
          (entry.details && entry.details.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let valueA: string | number = '';
      let valueB: string | number = '';
      
      switch (orderBy) {
        case 'timestamp':
          valueA = new Date(a.timestamp).getTime();
          valueB = new Date(b.timestamp).getTime();
          break;
        case 'action':
          valueA = a.action;
          valueB = b.action;
          break;
        case 'user':
          valueA = a.user;
          valueB = b.user;
          break;
        case 'projectName':
          valueA = a.projectName;
          valueB = b.projectName;
          break;
      }
      
      const comparison = typeof valueA === 'number' 
        ? valueA - (valueB as number)
        : (valueA as string).localeCompare(valueB as string);
        
      return order === 'asc' ? comparison : -comparison;
    });
    
    setFilteredLog(result);
  }, [auditLog, searchTerm, actionFilter, order, orderBy]);

  // Handle sort request
  const handleRequestSort = (property: SortField) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Get page data
  const getPageData = () => {
    const startIndex = (page - 1) * rowsPerPage;
    return filteredLog.slice(startIndex, startIndex + rowsPerPage);
  };

  // Get unique actions for filtering
  const getUniqueActions = () => {
    const actions = new Set<string>();
    auditLog.forEach(entry => actions.add(entry.action));
    return Array.from(actions);
  };

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
  };

  // Export audit log as JSON file
  const handleExportLog = () => {
    try {
      const jsonStr = JSON.stringify(auditLog, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting audit log:', error);
      setError('Failed to export audit log. Please try again.');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Audit Log
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View a history of actions performed in the project planner.
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Action Type</InputLabel>
            <Select
              value={actionFilter}
              label="Action Type"
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <MenuItem value="all">All Actions</MenuItem>
              {getUniqueActions().map(action => (
                <MenuItem key={action} value={action}>
                  {action.replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box>
            <Tooltip title="Clear Filters">
              <IconButton onClick={handleClearFilters} size="small" sx={{ mr: 1 }}>
                <ClearIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Refresh Log">
              <IconButton onClick={loadAuditLog} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleExportLog}
            disabled={auditLog.length === 0}
          >
            Export Log
          </Button>
        </Box>
      </Paper>
      
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'timestamp'}
                  direction={orderBy === 'timestamp' ? order : 'asc'}
                  onClick={() => handleRequestSort('timestamp')}
                >
                  Timestamp
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'action'}
                  direction={orderBy === 'action' ? order : 'asc'}
                  onClick={() => handleRequestSort('action')}
                >
                  Action
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'projectName'}
                  direction={orderBy === 'projectName' ? order : 'asc'}
                  onClick={() => handleRequestSort('projectName')}
                >
                  Project
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'user'}
                  direction={orderBy === 'user' ? order : 'asc'}
                  onClick={() => handleRequestSort('user')}
                >
                  User
                </TableSortLabel>
              </TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Loading audit log...
                </TableCell>
              </TableRow>
            ) : filteredLog.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No log entries found
                </TableCell>
              </TableRow>
            ) : (
              getPageData().map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.action.replace(/_/g, ' ')}
                      size="small"
                      color={actionColors[entry.action] as any || "default"}
                    />
                  </TableCell>
                  <TableCell>{entry.projectName}</TableCell>
                  <TableCell>{entry.user}</TableCell>
                  <TableCell>{entry.details || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Total entries: {filteredLog.length}
        </Typography>
        
        <Pagination
          count={Math.ceil(filteredLog.length / rowsPerPage)}
          page={page}
          onChange={handleChangePage}
          color="primary"
        />
      </Box>
    </Box>
  );
};

export default AuditLogViewer; 