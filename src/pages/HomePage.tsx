import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Paper, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  ThemeProvider,
  InputAdornment,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  Tooltip,
  CircularProgress,
  CardHeader,
  Avatar,
  Stack,
  Badge,
  FormControl,
  InputLabel,
  Select,
  ListItemIcon,
  AppBar,
  Toolbar,
  SvgIcon,
  CssBaseline
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  AccessTime as TimeIcon,
  AttachMoney as BudgetIcon,
  Assignment as AssignmentIcon,
  Star as StarIcon,
  Archive as ArchiveIcon,
  Sort as SortIcon,
  ContentCopy as ContentCopyIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  AccountCircle as AccountCircleIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { format, isAfter, differenceInDays } from 'date-fns';
import { epipheoTheme } from '../themes/epipheoTheme';
import Footer from '../components/Footer';
import ProjectPlannerLogo from '../components/ProjectPlannerLogo';
import { useAuth } from '../auth/AuthContext';
import { useDevMode } from '../context/DevModeContext';
import DevModePageIdentifier from '../components/DevModePageIdentifier';

// Extended User interface to fix type errors
interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  token?: string;
  role?: string;
  displayName?: string;
}

// Project interface
interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  kickoffDate: Date;
  dueDate: Date;
  budget: number;
  status: 'active' | 'completed' | 'archived';
  description?: string;
  client?: string;
  creator?: string;
  progress?: number;
  starred?: boolean;
  activities?: any[]; // Add activities field to match what's saved in App.tsx
}

// Styled components
const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -3,
    top: -3,
  },
}));

const ProjectCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4]
  },
  position: 'relative',
  overflow: 'visible',
  borderRadius: theme.shape.borderRadius * 2,
}));

// Storage key for local storage
const STORAGE_KEY = 'project_planner_projects';

// Status filter options
type StatusFilter = 'all' | 'active' | 'completed' | 'archived';

// Sort options
type SortOption = 'name' | 'dueDate' | 'budget' | 'progress';

const HomePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isDevMode } = useDevMode();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectClient, setNewProjectClient] = useState('');
  const [alert, setAlert] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [actionAnchorEl, setActionAnchorEl] = useState<{ [key: string]: HTMLElement | null }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sortOption, setSortOption] = useState<string>('newest');
  
  // User menu state
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
  const userMenuOpen = Boolean(userMenuAnchorEl);
  const { currentUser, isAuthenticated, logout } = useAuth();

  // User menu handlers
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };
  
  const handleProfileClick = () => {
    navigate('/profile');
    handleUserMenuClose();
  };
  
  const handleLoginClick = () => {
    navigate('/login');
    handleUserMenuClose();
  };
  
  const handleLogoutClick = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
    handleUserMenuClose();
  };
  
  // Add a direct force refresh method that can be called on demand
  const forceRefreshProjects = () => {
    console.log('[HomePage] Force refreshing projects');
    const savedProjects = localStorage.getItem(STORAGE_KEY);
    
    if (savedProjects) {
      try {
        // Parse JSON and convert dates
        const parsedProjects = JSON.parse(savedProjects);
        
        const projectsWithDates = parsedProjects.map((project: any) => ({
          ...project,
          createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
          updatedAt: project.updatedAt ? new Date(project.updatedAt) : new Date(),
          kickoffDate: project.kickoffDate ? new Date(project.kickoffDate) : new Date(),
          dueDate: project.dueDate ? new Date(project.dueDate) : new Date(),
          activities: project.activities && Array.isArray(project.activities) ? 
            project.activities.map((activity: any) => ({
              ...activity,
              startDate: activity.startDate ? new Date(activity.startDate) : null,
              endDate: activity.endDate ? new Date(activity.endDate) : null,
            })) : []
        }));
        
        if (projectsWithDates.length > 0) {
          console.log('[HomePage] Force refresh found projects:', projectsWithDates.length);
          // Sort by most recently updated first
          projectsWithDates.sort((a: Project, b: Project) => b.updatedAt.getTime() - a.updatedAt.getTime());
          setProjects(projectsWithDates);
        }
      } catch (error) {
        console.error('[HomePage] Error during force refresh:', error);
      }
    }
  };
  
  // Add button ref for clicks
  const refreshButtonRef = React.useRef<HTMLButtonElement>(null);
  
  // Setup effect to force refresh when component is mounted
  useEffect(() => {
    // Force refresh on mount
    forceRefreshProjects();
    
    // Simulate button click on mount for consistent behavior
    const refreshTimer = setTimeout(() => {
      if (refreshButtonRef.current) {
        refreshButtonRef.current.click();
      }
    }, 500);
    
    return () => clearTimeout(refreshTimer);
  }, []);
  
  // Save projects to localStorage whenever they change
  useEffect(() => {
    // Only save if we have projects and after initial load
    if (projects.length > 0) {
      console.log('Saving projects to localStorage, count:', projects.length);
      
      // Convert Date objects to strings for storage
      const projectsToSave = projects.map(project => ({
        ...project,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        kickoffDate: project.kickoffDate.toISOString(),
        dueDate: project.dueDate.toISOString(),
      }));
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projectsToSave));
    }
  }, [projects]);
  
  // Apply filters and sorting
  useEffect(() => {
    let result = [...projects];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(project => project.status === statusFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'dueDate':
          return a.dueDate.getTime() - b.dueDate.getTime();
        case 'budget':
          return b.budget - a.budget;
        case 'progress':
          return (b.progress || 0) - (a.progress || 0);
        default:
          return 0;
      }
    });
    
    setFilteredProjects(result);
  }, [projects, searchTerm, statusFilter, sortBy]);
  
  const handleOpenSortMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSortAnchorEl(event.currentTarget);
  };
  
  const handleCloseSortMenu = () => {
    setSortAnchorEl(null);
  };
  
  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    handleCloseSortMenu();
  };
  
  const handleOpenFilterMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleCloseFilterMenu = () => {
    setFilterAnchorEl(null);
  };
  
  const handleStatusFilterChange = (status: StatusFilter) => {
    setStatusFilter(status);
    handleCloseFilterMenu();
  };
  
  const handleOpenActionMenu = (event: React.MouseEvent<HTMLButtonElement>, projectId: string) => {
    setActionAnchorEl({
      ...actionAnchorEl,
      [projectId]: event.currentTarget
    });
  };
  
  const handleCloseActionMenu = (projectId: string) => {
    setActionAnchorEl({
      ...actionAnchorEl,
      [projectId]: null
    });
  };
  
  const handleCreateNewProject = () => {
    // Navigate directly to the create page without showing a dialog
    navigate('/create');
  };
  
  const handleDialogCreateProject = () => {
    if (!newProjectName.trim()) {
      setAlert({
        type: 'error',
        message: 'Project name cannot be empty'
      });
      return;
    }
    
    // Close the dialog
    setNewProjectDialogOpen(false);
    
    // Navigate to create page with the project name
    const encodedName = encodeURIComponent(newProjectName);
    navigate(`/create?name=${encodedName}`);
    
    // Reset the form
    setNewProjectName('');
    setNewProjectDescription('');
    setNewProjectClient('');
  };
  
  const handleDeleteProject = () => {
    if (!selectedProject) return;
    
    setIsLoading(true);
    
    setTimeout(() => {
      setProjects(projects.filter(project => project.id !== selectedProject.id));
      setDeleteDialogOpen(false);
      setSelectedProject(null);
      setAlert({
        type: 'success',
        message: `Project "${selectedProject.name}" deleted successfully!`
      });
      setIsLoading(false);
    }, 600);
  };
  
  const handleArchiveProject = (project: Project) => {
    setIsLoading(true);
    
    setTimeout(() => {
      const updatedProjects = projects.map(p => 
        p.id === project.id ? { ...p, status: 'archived' as const, updatedAt: new Date() } : p
      );
      setProjects(updatedProjects);
      setAlert({
        type: 'success',
        message: `Project "${project.name}" archived successfully!`
      });
      setIsLoading(false);
      handleCloseActionMenu(project.id);
    }, 600);
  };
  
  const handleCompleteProject = (project: Project) => {
    setIsLoading(true);
    
    setTimeout(() => {
      const updatedProjects = projects.map(p => 
        p.id === project.id ? { ...p, status: 'completed' as const, updatedAt: new Date(), progress: 100 } : p
      );
      setProjects(updatedProjects);
      setAlert({
        type: 'success',
        message: `Project "${project.name}" marked as completed!`
      });
      setIsLoading(false);
      handleCloseActionMenu(project.id);
    }, 600);
  };
  
  const handleToggleStarred = (project: Project) => {
    const updatedProjects = projects.map(p => 
      p.id === project.id ? { ...p, starred: !p.starred } : p
    );
    setProjects(updatedProjects);
    handleCloseActionMenu(project.id);
  };
  
  const handleCloseAlert = () => {
    setAlert(null);
  };
  
  const getDaysRemaining = (dueDate: Date) => {
    const days = differenceInDays(dueDate, new Date());
    return days;
  };
  
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return theme.palette.primary.main;
      case 'completed':
        return theme.palette.success.main;
      case 'archived':
        return theme.palette.text.secondary;
      default:
        return theme.palette.text.secondary;
    }
  };
  
  const getStatusLabel = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'archived':
        return 'Archived';
      default:
        return 'Unknown';
    }
  };
  
  const getDueDateColor = (dueDate: Date, status: Project['status']) => {
    if (status === 'completed' || status === 'archived') {
      return theme.palette.text.secondary;
    }
    
    const daysRemaining = getDaysRemaining(dueDate);
    
    if (daysRemaining < 0) {
      return theme.palette.error.main;
    } else if (daysRemaining <= 7) {
      return theme.palette.warning.main;
    } else {
      return theme.palette.success.main;
    }
  };
  
  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const handleDuplicateProject = (projectId: string) => {
    const projectToDuplicate = projects.find(p => p.id === projectId);
    if (projectToDuplicate) {
      const duplicatedProject = {
        ...projectToDuplicate,
        id: `${projectToDuplicate.id}-copy-${Date.now()}`,
        name: `${projectToDuplicate.name} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        starred: false
      };
      
      setProjects(prevProjects => [duplicatedProject, ...prevProjects]);
      
      // Show success alert
      setAlert({
        type: 'success',
        message: `Project "${duplicatedProject.name}" created successfully!`
      });
    }
    
    // Reset the action menu state to close all menus
    setActionAnchorEl({});
  };
  
  return (
    <ThemeProvider theme={epipheoTheme}>
      <CssBaseline />
      
      {/* Dev Mode Indicator for Page */}
      {isDevMode && (
        <Box
          sx={{
            position: 'fixed',
            top: 10,
            right: 10,
            zIndex: 9999,
            bgcolor: 'purple',
            color: 'white',
            p: 1,
            borderRadius: 1,
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: 3,
            opacity: 0.9,
          }}
        >
          PAGE: HOME_PAGE
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="sticky" sx={{ bgcolor: theme.palette.primary.main }}>
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <ProjectPlannerLogo />
              <Typography variant="h6" component="div" sx={{ ml: 2 }}>
                Project Planner
              </Typography>
            </Box>

            {/* Add dev mode identifier for the app bar */}
            {isDevMode && (
              <Chip 
                label="SECTION: HEADER_NAV" 
                size="small" 
                sx={{ 
                  mr: 2, 
                  bgcolor: 'info.main', 
                  color: 'white',
                  border: '1px dashed white'
                }} 
              />
            )}

            {/* Add admin link */}
            <IconButton 
              color="inherit" 
              component={Link} 
              to="/admin" 
              aria-label="Admin Dashboard"
              sx={{ mr: 1 }}
            >
              <AdminPanelSettingsIcon />
            </IconButton>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                color="inherit"
                startIcon={<HomeIcon />}
                component={Link}
                to="/"
                sx={{ mr: 1 }}
              >
                Home
              </Button>

              {/* User menu */}
              <Box>
                <Tooltip title="Account settings">
                  <IconButton
                    onClick={handleUserMenuOpen}
                    size="small"
                    sx={{ ml: 1 }}
                    aria-controls={userMenuOpen ? 'account-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={userMenuOpen ? 'true' : undefined}
                  >
                    {isAuthenticated ? (
                      <Avatar 
                        sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main }}
                      >
                        {(currentUser as ExtendedUser)?.displayName ? 
                          getInitials((currentUser as ExtendedUser).displayName as string) : 
                          <AccountCircleIcon />
                        }
                      </Avatar>
                    ) : (
                      <AccountCircleIcon />
                    )}
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={userMenuAnchorEl}
                  id="account-menu"
                  open={userMenuOpen}
                  onClose={handleUserMenuClose}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      overflow: 'visible',
                      filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                      mt: 1.5,
                      '& .MuiAvatar-root': {
                        width: 32,
                        height: 32,
                        ml: -0.5,
                        mr: 1,
                      },
                      '&:before': {
                        content: '""',
                        display: 'block',
                        position: 'absolute',
                        top: 0,
                        right: 14,
                        width: 10,
                        height: 10,
                        bgcolor: 'background.paper',
                        transform: 'translateY(-50%) rotate(45deg)',
                        zIndex: 0,
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  {isAuthenticated ? (
                    <>
                      <MenuItem onClick={handleProfileClick}>
                        <ListItemIcon>
                          <PersonIcon fontSize="small" />
                        </ListItemIcon>
                        Profile
                      </MenuItem>
                      <Divider />
                      <MenuItem onClick={handleLogoutClick}>
                        <ListItemIcon>
                          <LogoutIcon fontSize="small" />
                        </ListItemIcon>
                        Logout
                      </MenuItem>
                    </>
                  ) : (
                    <MenuItem onClick={handleLoginClick}>
                      <ListItemIcon>
                        <LoginIcon fontSize="small" />
                      </ListItemIcon>
                      Login
                    </MenuItem>
                  )}
                </Menu>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
          {/* Projects Header with Search, Filter, and Sort */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
            {/* Add dev mode identifier for projects header */}
            {isDevMode && (
              <Chip 
                label="SECTION: PROJECTS_HEADER" 
                size="small" 
                sx={{ 
                  mr: 2, 
                  mb: 1, 
                  bgcolor: 'success.main', 
                  color: 'white',
                  border: '1px dashed white'
                }} 
              />
            )}
            
            <Typography variant="h4" component="h1" sx={{ flexGrow: 1, mb: { xs: 2, sm: 0 } }}>
              My Projects
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', mr: 2 }}>
                <TextField
                  placeholder="Search projects..."
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: theme.shape.borderRadius * 4 }
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={handleOpenFilterMenu}
                  aria-controls="filter-menu"
                  aria-haspopup="true"
                  size="medium"
                  sx={{ 
                    borderRadius: theme.shape.borderRadius * 4,
                    borderColor: theme.palette.divider,
                    color: 'text.primary',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                    }
                  }}
                >
                  {statusFilter === 'all' ? 'All Projects' : getStatusLabel(statusFilter)}
                </Button>
                <Menu
                  id="filter-menu"
                  anchorEl={filterAnchorEl}
                  keepMounted
                  open={Boolean(filterAnchorEl)}
                  onClose={handleCloseFilterMenu}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                  }}
                  PaperProps={{
                    sx: { 
                      borderRadius: theme.shape.borderRadius,
                      boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <MenuItem 
                    onClick={() => handleStatusFilterChange('all')}
                    selected={statusFilter === 'all'}
                  >
                    All Projects
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleStatusFilterChange('active')}
                    selected={statusFilter === 'active'}
                  >
                    Active
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleStatusFilterChange('completed')}
                    selected={statusFilter === 'completed'}
                  >
                    Completed
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleStatusFilterChange('archived')}
                    selected={statusFilter === 'archived'}
                  >
                    Archived
                  </MenuItem>
                </Menu>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<SortIcon />}
                  onClick={handleOpenSortMenu}
                  aria-controls="sort-menu"
                  aria-haspopup="true"
                  size="medium"
                  sx={{ 
                    borderRadius: theme.shape.borderRadius * 4,
                    borderColor: theme.palette.divider,
                    color: 'text.primary',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                    }
                  }}
                >
                  Sort: {sortBy === 'name' ? 'Name' : 
                          sortBy === 'dueDate' ? 'Due Date' :
                          sortBy === 'budget' ? 'Budget' : 'Progress'}
                </Button>
                <Menu
                  id="sort-menu"
                  anchorEl={sortAnchorEl}
                  keepMounted
                  open={Boolean(sortAnchorEl)}
                  onClose={handleCloseSortMenu}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                  }}
                  PaperProps={{
                    sx: { 
                      borderRadius: theme.shape.borderRadius,
                      boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <MenuItem 
                    onClick={() => handleSortChange('name')}
                    selected={sortBy === 'name'}
                  >
                    Name
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleSortChange('dueDate')}
                    selected={sortBy === 'dueDate'}
                  >
                    Due Date
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleSortChange('budget')}
                    selected={sortBy === 'budget'}
                  >
                    Budget
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleSortChange('progress')}
                    selected={sortBy === 'progress'}
                  >
                    Progress
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
          </Box>
          
          {filteredProjects.length === 0 ? (
            <Paper 
              sx={{ 
                p: 5, 
                textAlign: 'center', 
                bgcolor: 'background.default',
                borderRadius: theme.shape.borderRadius * 2,
                border: `1px dashed ${theme.palette.divider}`,
                boxShadow: 'none'
              }}
            >
              <Box sx={{ mb: 3 }}>
                <AssignmentIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5 }} />
              </Box>
              <Typography variant="h5" gutterBottom color="text.primary" fontWeight="medium">
                No projects found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                {searchTerm 
                  ? `No projects match your search "${searchTerm}"`
                  : statusFilter !== 'all'
                    ? `No ${statusFilter} projects found`
                    : 'Create a new project to get started planning your next video production!'
                }
              </Typography>
              {!searchTerm && statusFilter === 'all' && (
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={handleCreateNewProject}
                  sx={{ 
                    borderRadius: theme.shape.borderRadius * 2,
                    px: 3
                  }}
                >
                  Create New Project
                </Button>
              )}
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {filteredProjects.map(project => (
                <Grid item xs={12} md={6} lg={4} key={project.id}>
                  <ProjectCard>
                    {project.starred && (
                      <Box 
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          zIndex: 1
                        }}
                      >
                        <Tooltip title="Starred Project">
                          <StyledBadge color="warning">
                            <StarIcon color="warning" fontSize="small" />
                          </StyledBadge>
                        </Tooltip>
                      </Box>
                    )}
                    
                    <CardHeader
                      avatar={
                        <Tooltip title={project.client || 'No client specified'}>
                          <Avatar 
                            sx={{ 
                              bgcolor: theme.palette.primary.main,
                              width: 40,
                              height: 40
                            }}
                          >
                            {getInitials(project.client)}
                          </Avatar>
                        </Tooltip>
                      }
                      action={
                        <IconButton 
                          aria-label="project actions"
                          onClick={(e) => handleOpenActionMenu(e, project.id)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      }
                      title={
                        <Typography variant="subtitle1" component="h3" fontWeight="medium" noWrap>
                          {project.name}
                        </Typography>
                      }
                      subheader={
                        <Chip 
                          label={getStatusLabel(project.status)} 
                          size="small"
                          sx={{ 
                            backgroundColor: `${getStatusColor(project.status)}20`,
                            color: getStatusColor(project.status),
                            fontWeight: 500,
                            height: 24,
                            borderRadius: theme.shape.borderRadius * 2
                          }}
                        />
                      }
                    />
                    
                    <Menu
                      id={`action-menu-${project.id}`}
                      anchorEl={actionAnchorEl[project.id]}
                      keepMounted
                      open={Boolean(actionAnchorEl[project.id])}
                      onClose={() => handleCloseActionMenu(project.id)}
                      PaperProps={{
                        sx: { 
                          borderRadius: theme.shape.borderRadius,
                          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)'
                        }
                      }}
                    >
                      <MenuItem
                        component={Link}
                        to={`/create?projectId=${project.id}`}
                        onClick={() => handleCloseActionMenu(project.id)}
                      >
                        <EditIcon fontSize="small" sx={{ mr: 1 }} />
                        View/Edit
                      </MenuItem>
                      <MenuItem onClick={() => handleToggleStarred(project)}>
                        <StarIcon fontSize="small" sx={{ mr: 1 }} />
                        {project.starred ? 'Unstar' : 'Star'}
                      </MenuItem>
                      {project.status === 'active' && (
                        <MenuItem onClick={() => handleCompleteProject(project)}>
                          <CheckIcon fontSize="small" sx={{ mr: 1 }} />
                          Mark Complete
                        </MenuItem>
                      )}
                      {project.status !== 'archived' && (
                        <MenuItem onClick={() => handleArchiveProject(project)}>
                          <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
                          Archive
                        </MenuItem>
                      )}
                      <Divider />
                      <MenuItem 
                        onClick={() => {
                          setSelectedProject(project);
                          setDeleteDialogOpen(true);
                          handleCloseActionMenu(project.id);
                        }}
                        sx={{ color: theme.palette.error.main }}
                      >
                        <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                        Delete
                      </MenuItem>
                    </Menu>
                    
                    <CardContent sx={{ pt: 0, pb: 1, flexGrow: 1 }}>
                      {project.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 2, 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            height: '42px'
                          }}
                        >
                          {project.description}
                        </Typography>
                      )}
                      
                      <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TimeIcon 
                            fontSize="small" 
                            sx={{ color: getDueDateColor(project.dueDate, project.status), mr: 1 }} 
                          />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: getDueDateColor(project.dueDate, project.status),
                              fontWeight: 500 
                            }}
                          >
                            {project.status === 'completed' 
                              ? `Completed on ${format(project.updatedAt, 'MMM d, yyyy')}`
                              : project.status === 'archived'
                                ? `Archived on ${format(project.updatedAt, 'MMM d, yyyy')}`
                                : isAfter(project.dueDate, new Date())
                                  ? `Due in ${getDaysRemaining(project.dueDate)} days`
                                  : 'Overdue'
                            }
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BudgetIcon 
                            fontSize="small" 
                            sx={{ color: theme.palette.text.secondary, mr: 1 }} 
                          />
                          <Typography variant="body2" color="text.secondary">
                            ${project.budget.toLocaleString()}
                          </Typography>
                        </Box>
                        
                        {project.creator && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon 
                              fontSize="small" 
                              sx={{ color: theme.palette.text.secondary, mr: 1 }} 
                            />
                            <Typography variant="body2" color="text.secondary">
                              {project.creator}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                    
                    <Box sx={{ px: 2, pb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                          Progress:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {project.progress || 0}%
                        </Typography>
                      </Box>
                      <Box 
                        sx={{ 
                          width: '100%', 
                          height: 6, 
                          backgroundColor: theme.palette.grey[100],
                          borderRadius: 3,
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: `${project.progress || 0}%`, 
                            height: '100%', 
                            backgroundColor: 
                              project.progress === 100 
                                ? theme.palette.success.main 
                                : theme.palette.primary.main,
                            borderRadius: 3,
                            transition: 'width 0.5s ease-in-out'
                          }} 
                        />
                      </Box>
                    </Box>
                    
                    <Divider />
                    
                    <CardActions>
                      <Button 
                        size="small" 
                        component={Link}
                        to={`/create?projectId=${project.id}`}
                        sx={{ flexGrow: 1 }}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </ProjectCard>
                </Grid>
              ))}
            </Grid>
          )}
          
          {/* New Project Dialog */}
          <Dialog 
            open={newProjectDialogOpen} 
            onClose={() => setNewProjectDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ pb: 1 }}>Create New Project</DialogTitle>
            <DialogContent>
              <Box component="form" onSubmit={(e) => { e.preventDefault(); handleDialogCreateProject(); }}>
                <TextField
                  autoFocus
                  margin="dense"
                  id="project-name"
                  label="Project Name"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  sx={{ mb: 2 }}
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setNewProjectDialogOpen(false)} color="inherit">
                Cancel
              </Button>
              <Button 
                onClick={handleDialogCreateProject} 
                variant="contained"
                disabled={isLoading}
              >
                Create Project
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: { borderRadius: theme.shape.borderRadius * 2 }
            }}
          >
            <DialogTitle>Delete Project</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete the project "{selectedProject?.name}"? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button 
                onClick={() => setDeleteDialogOpen(false)}
                sx={{ 
                  borderRadius: theme.shape.borderRadius * 4,
                  px: 3
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteProject} 
                color="error" 
                variant="contained"
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ 
                  borderRadius: theme.shape.borderRadius * 4,
                  px: 3
                }}
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Success alert */}
          <Snackbar
            open={!!alert}
            autoHideDuration={6000}
            onClose={handleCloseAlert}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            {alert !== null ? (
              <Alert 
                onClose={handleCloseAlert} 
                severity={alert.type} 
                sx={{ 
                  width: '100%',
                  borderRadius: theme.shape.borderRadius * 2
                }}
              >
                {alert.message}
              </Alert>
            ) : undefined}
          </Snackbar>
        </Container>
        <Footer />
        <DevModePageIdentifier page="HomePage" component="Project Dashboard" />
      </Box>
    </ThemeProvider>
  );
};

export default HomePage; 