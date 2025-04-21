import React, { useState } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Snackbar
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { epipheoTheme } from '../themes/epipheoTheme';
import Footer from '../components/Footer';

const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile, loading, error } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    photoUrl: currentUser?.photoUrl || ''
  });
  const [success, setSuccess] = useState<string | null>(null);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle save profile
  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        name: formData.name,
        email: formData.email,
        photoUrl: formData.photoUrl
      });
      setIsEditing(false);
      setSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // Cancel edit - reset form data to original values
      setFormData({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        photoUrl: currentUser?.photoUrl || ''
      });
    }
    setIsEditing(!isEditing);
  };
  
  // Handle back button
  const handleBack = () => {
    navigate(-1);
  };
  
  // Close success alert
  const handleCloseSuccess = () => {
    setSuccess(null);
  };
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      <Container component="main" maxWidth="md" sx={{ flex: 1, py: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={handleBack} 
            sx={{ mr: 2 }}
            aria-label="back"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ fontWeight: 700 }}
          >
            Your Profile
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Paper 
          elevation={2} 
          sx={{ 
            p: 4, 
            borderRadius: 2,
            mb: 4
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'flex-start' },
            mb: 4
          }}>
            <Avatar
              src={currentUser?.photoUrl}
              alt={currentUser?.name || 'User'}
              sx={{
                width: 120,
                height: 120,
                mb: { xs: 2, sm: 0 },
                mr: { sm: 4 },
                bgcolor: epipheoTheme.palette.primary.main
              }}
            >
              {!currentUser?.photoUrl && <PersonIcon sx={{ fontSize: 60 }} />}
            </Avatar>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" gutterBottom>
                {currentUser?.name || 'User'}
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  mb: 1
                }}
              >
                <EmailIcon sx={{ mr: 1, fontSize: 18, opacity: 0.7 }} />
                {currentUser?.email || 'No email available'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Member since {new Date().toLocaleDateString()}
              </Typography>
              
              <Button
                variant={isEditing ? "outlined" : "contained"}
                color={isEditing ? "secondary" : "primary"}
                startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
                onClick={toggleEditMode}
                sx={{ mt: 2 }}
                disabled={loading}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          {isEditing ? (
            <Box component="form" noValidate>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Profile Picture URL"
                    name="photoUrl"
                    value={formData.photoUrl}
                    onChange={handleInputChange}
                    helperText="Enter a URL for your profile picture"
                  />
                </Grid>
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveProfile}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    Save Changes
                  </Button>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Full Name
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={9}>
                  <Typography variant="body1">
                    {currentUser?.name || 'Not provided'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={9}>
                  <Typography variant="body1">
                    {currentUser?.email || 'Not provided'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    User ID
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={9}>
                  <Typography variant="body1">
                    {currentUser?.id || 'Not available'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
        
        <Paper 
          elevation={2} 
          sx={{ 
            p: 4, 
            borderRadius: 2
          }}
        >
          <Typography variant="h6" gutterBottom>
            Account Settings
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={() => navigate('/change-password')}
            >
              Change Password
            </Button>
            
            <Button 
              variant="outlined" 
              color="error"
              sx={{ ml: 2 }}
            >
              Delete Account
            </Button>
          </Box>
        </Paper>
      </Container>
      
      <Footer />
      
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSuccess} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfilePage; 