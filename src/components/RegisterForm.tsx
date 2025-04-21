import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Alert, 
  Link, 
  CircularProgress,
  InputAdornment,
  IconButton,
  Grid,
  Divider,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { 
  Visibility as VisibilityIcon, 
  VisibilityOff as VisibilityOffIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { epipheoTheme } from '../themes/epipheoTheme';

interface RegisterFormProps {
  onLoginClick?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onLoginClick }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});
  
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const errors: {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      terms?: string;
    } = {};
    let isValid = true;

    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
      isValid = false;
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
      isValid = false;
    }

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email address is invalid';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must include uppercase, lowercase, and numbers';
      isValid = false;
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    // Terms agreement validation
    if (!agreeToTerms) {
      errors.terms = 'You must agree to the terms and conditions';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`;
      await register(formData.email, formData.password, fullName);
      navigate('/');
    } catch (err) {
      // Error is already handled in the AuthContext
      console.error('Registration error:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAgreeToTerms(e.target.checked);
    if (formErrors.terms) {
      setFormErrors(prev => ({ ...prev, terms: undefined }));
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        width: '100%',
        maxWidth: 500,
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}
    >
      <Typography 
        variant="h5" 
        component="h1" 
        gutterBottom 
        align="center"
        sx={{ fontWeight: 700, color: epipheoTheme.palette.primary.main }}
      >
        Create Account
      </Typography>
      
      <Typography 
        variant="body2" 
        color="textSecondary" 
        align="center" 
        sx={{ mb: 3 }}
      >
        Fill in your details to create a new account
      </Typography>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: epipheoTheme.shape.borderRadius }}
        >
          {error}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              id="firstName"
              label="First Name"
              name="firstName"
              autoComplete="given-name"
              autoFocus
              value={formData.firstName}
              onChange={handleInputChange}
              error={!!formErrors.firstName}
              helperText={formErrors.firstName}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              autoComplete="family-name"
              value={formData.lastName}
              onChange={handleInputChange}
              error={!!formErrors.lastName}
              helperText={formErrors.lastName}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleInputChange}
              error={!!formErrors.password}
              helperText={formErrors.password}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreeToTerms}
                  onChange={handleTermsChange}
                  color="primary"
                  name="agreeToTerms"
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{' '}
                  <Link 
                    href="/terms" 
                    target="_blank" 
                    rel="noopener"
                    sx={{ 
                      color: epipheoTheme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Terms and Conditions
                  </Link>
                </Typography>
              }
            />
            {formErrors.terms && (
              <Typography 
                variant="caption" 
                color="error" 
                sx={{ display: 'block', mt: -1, ml: 2 }}
              >
                {formErrors.terms}
              </Typography>
            )}
          </Grid>
        </Grid>
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{ 
            mt: 3, 
            mb: 2,
            py: 1.5,
            position: 'relative',
            fontWeight: 600,
            borderRadius: epipheoTheme.shape.borderRadius
          }}
        >
          {loading ? (
            <CircularProgress 
              size={24} 
              sx={{ 
                color: epipheoTheme.palette.primary.contrastText,
                position: 'absolute'
              }} 
            />
          ) : 'Sign Up'}
        </Button>
        
        {onLoginClick && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" display="inline">
              Already have an account?{' '}
            </Typography>
            <Link
              component="button"
              variant="body2"
              onClick={onLoginClick}
              sx={{ 
                fontWeight: 600,
                color: epipheoTheme.palette.primary.main,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Sign In
            </Link>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default RegisterForm; 