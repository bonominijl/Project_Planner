import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Stack,
  Tooltip,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  FormControlLabel,
  Checkbox,
  Avatar,
  InputAdornment,
  Grid,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Email as EmailIcon
} from '@mui/icons-material';

// Define the User interface
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'manager' | 'user' | 'client';
  isActive: boolean;
  department?: string;
  lastLogin?: Date;
}

// Define the props interface to match AdminDashboard expectations
export interface UserManagerProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const UserManager: React.FC<UserManagerProps> = ({ onSuccess, onError }) => {
  // State for storing users
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Form error state
  const [formErrors, setFormErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  }>({});

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showPassword, setShowPassword] = useState(false);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users whenever the search term, role filter, or users change
  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, users]);

  // Mock function to load users
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // For now, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      const mockUsers: User[] = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          role: 'admin',
          isActive: true,
          department: 'Management',
          lastLogin: new Date(2023, 3, 15)
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          role: 'manager',
          isActive: true,
          department: 'Production',
          lastLogin: new Date(2023, 4, 20)
        },
        {
          id: '3',
          firstName: 'Mike',
          lastName: 'Johnson',
          email: 'mike.johnson@example.com',
          role: 'user',
          isActive: true,
          department: 'Creative',
          lastLogin: new Date(2023, 4, 18)
        },
        {
          id: '4',
          firstName: 'Sarah',
          lastName: 'Williams',
          email: 'sarah.williams@example.com',
          role: 'user',
          isActive: false,
          department: 'Production',
          lastLogin: new Date(2023, 1, 10)
        },
        {
          id: '5',
          firstName: 'Robert',
          lastName: 'Brown',
          email: 'robert.brown@clientcompany.com',
          role: 'client',
          isActive: true,
          lastLogin: new Date(2023, 4, 5)
        }
      ];
      
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load users:', error);
      onError('Failed to load users');
      setIsLoading(false);
    }
  };

  // Filter users based on search term and role filter
  const filterUsers = () => {
    let filtered = [...users];
    
    // Apply search filter
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.firstName.toLowerCase().includes(lowerCaseSearch) ||
        user.lastName.toLowerCase().includes(lowerCaseSearch) ||
        user.email.toLowerCase().includes(lowerCaseSearch) ||
        (user.department && user.department.toLowerCase().includes(lowerCaseSearch))
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    setFilteredUsers(filtered);
  };

  // Save all users
  const saveUsers = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      
      // Here you would save to your backend
      // const response = await fetch('/api/users', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(users)
      // });
      
      onSuccess('Users saved successfully');
      setIsSaving(false);
    } catch (error) {
      console.error('Failed to save users:', error);
      onError('Failed to save users');
      setIsSaving(false);
    }
  };

  // Open the dialog to add a new user
  const handleAddUser = () => {
    setCurrentUser({
      id: `user_${Date.now()}`,
      firstName: '',
      lastName: '',
      email: '',
      role: 'user',
      isActive: true
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  // Open the dialog to edit an existing user
  const handleEditUser = (user: User) => {
    setCurrentUser({ ...user });
    setFormErrors({});
    setDialogOpen(true);
  };

  // Handle closing the dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentUser(null);
  };

  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (user: User) => {
    setCurrentUser(user);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCurrentUser(null);
  };

  // Validate the user form
  const validateForm = (): boolean => {
    const errors: {
      firstName?: string;
      lastName?: string;
      email?: string;
      role?: string;
    } = {};
    
    // Check first name
    if (!currentUser?.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    // Check last name
    if (!currentUser?.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    // Check email
    if (!currentUser?.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(currentUser.email)) {
      errors.email = 'Email is invalid';
    }
    
    // Check for duplicate email (only for new users)
    const existingUser = users.find(u => 
      u.email === currentUser?.email && u.id !== currentUser?.id
    );
    
    if (existingUser) {
      errors.email = 'Email is already in use';
    }
    
    // Check role
    if (!currentUser?.role) {
      errors.role = 'Role is required';
    }
    
    setFormErrors(errors);
    
    return Object.keys(errors).length === 0;
  };

  // Save the current user
  const saveUser = () => {
    if (!currentUser) return;
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Check if we're editing an existing user or adding a new one
    const existingIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (existingIndex >= 0) {
      // Update existing user
      const updatedUsers = [...users];
      updatedUsers[existingIndex] = { ...currentUser };
      setUsers(updatedUsers);
      onSuccess(`User "${currentUser.firstName} ${currentUser.lastName}" updated successfully`);
    } else {
      // Add new user
      setUsers([...users, currentUser]);
      onSuccess(`User "${currentUser.firstName} ${currentUser.lastName}" added successfully`);
    }
    
    // Close the dialog
    setDialogOpen(false);
    setCurrentUser(null);
  };

  // Delete the current user
  const deleteUser = () => {
    if (!currentUser) return;
    
    const updatedUsers = users.filter(u => u.id !== currentUser.id);
    setUsers(updatedUsers);
    onSuccess(`User "${currentUser.firstName} ${currentUser.lastName}" deleted successfully`);
    
    // Close the dialog
    setDeleteDialogOpen(false);
    setCurrentUser(null);
  };

  // Update a field in the current user
  const updateUserField = <K extends keyof User>(field: K, value: User[K]) => {
    if (!currentUser) return;
    
    setCurrentUser({
      ...currentUser,
      [field]: value
    });
  };

  // Handle search term changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Handle role filter changes
  const handleRoleFilterChange = (event: SelectChangeEvent) => {
    setRoleFilter(event.target.value);
  };

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get color for role chip
  const getRoleColor = (role: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'primary';
      case 'user':
        return 'success';
      case 'client':
        return 'info';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6">User Management</Typography>
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<SaveIcon />}
              onClick={saveUsers}
              disabled={isSaving}
              sx={{ mr: 2 }}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<PersonAddIcon />}
              onClick={handleAddUser}
            >
              Add User
            </Button>
          </Box>
        </Stack>

        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search users..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="role-filter-label">Filter by Role</InputLabel>
                <Select
                  labelId="role-filter-label"
                  value={roleFilter}
                  label="Filter by Role"
                  onChange={handleRoleFilterChange}
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="admin">Administrators</MenuItem>
                  <MenuItem value="manager">Managers</MenuItem>
                  <MenuItem value="user">Users</MenuItem>
                  <MenuItem value="client">Clients</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {filteredUsers.length === 0 ? (
          <Alert severity="info">
            No users found matching your search criteria.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          {getInitials(user.firstName, user.lastName)}
                        </Avatar>
                        <Typography>
                          {user.firstName} {user.lastName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role.charAt(0).toUpperCase() + user.role.slice(1)} 
                        color={getRoleColor(user.role)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{user.department || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.isActive ? 'Active' : 'Inactive'} 
                        color={user.isActive ? 'success' : 'default'} 
                        variant={user.isActive ? 'filled' : 'outlined'}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleEditUser(user)} size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleOpenDeleteDialog(user)} size="small">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Dialog for adding/editing a user */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle component="div">
          {currentUser && users.some(u => u.id === currentUser.id)
            ? 'Edit User'
            : 'Add New User'
          }
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                fullWidth
                value={currentUser?.firstName || ''}
                onChange={(e) => updateUserField('firstName', e.target.value)}
                error={!!formErrors.firstName}
                helperText={formErrors.firstName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                fullWidth
                value={currentUser?.lastName || ''}
                onChange={(e) => updateUserField('lastName', e.target.value)}
                error={!!formErrors.lastName}
                helperText={formErrors.lastName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email Address"
                fullWidth
                type="email"
                value={currentUser?.email || ''}
                onChange={(e) => updateUserField('email', e.target.value)}
                error={!!formErrors.email}
                helperText={formErrors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.role}>
                <InputLabel id="user-role-label">Role</InputLabel>
                <Select
                  labelId="user-role-label"
                  value={currentUser?.role || ''}
                  label="Role"
                  onChange={(e) => updateUserField('role', e.target.value as User['role'])}
                >
                  <MenuItem value="admin">Administrator</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="client">Client</MenuItem>
                </Select>
                {formErrors.role && <FormHelperText>{formErrors.role}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Department"
                fullWidth
                value={currentUser?.department || ''}
                onChange={(e) => updateUserField('department', e.target.value)}
                placeholder="Optional"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={currentUser?.isActive || false}
                    onChange={(e) => updateUserField('isActive', e.target.checked)}
                  />
                }
                label="Active User"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={saveUser} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle component="div">Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the user "{currentUser?.firstName} {currentUser?.lastName}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This action cannot be undone. All data associated with this user will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={deleteUser} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManager; 