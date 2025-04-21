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
  IconButton
} from '@mui/material';
import { 
  Visibility as VisibilityIcon, 
  VisibilityOff as VisibilityOffIcon,
  Email as EmailIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { epipheoTheme } from '../themes/epipheoTheme';

interface LoginFormProps {
  onRegisterClick?: () => void;
  onForgotPasswordClick?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  onRegisterClick, 
  onForgotPasswordClick 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{email?: string; password?: string}>({});
  
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const errors: {email?: string; password?: string} = {};
    let isValid = true;

    // Email validation
    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email address is invalid';
      isValid = false;
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
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
      await login(email, password);
      navigate('/');
    } catch (err) {
      // Error is already handled in the AuthContext
      console.error('Login submission error:', err);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (formErrors.email) {
      setFormErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (formErrors.password) {
      setFormErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onForgotPasswordClick) {
      onForgotPasswordClick();
    } else {
      // If no custom handler is provided, navigate to the forgot password page
      navigate('/forgot-password');
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        width: '100%',
        maxWidth: 400,
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
        Sign In
      </Typography>
      
      <Typography 
        variant="body2" 
        color="textSecondary" 
        align="center" 
        sx={{ mb: 3 }}
      >
        Enter your credentials to access your account
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
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={handleEmailChange}
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
          sx={{ mb: 2 }}
        />
        
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={handlePasswordChange}
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
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ textAlign: 'right', mb: 2 }}>
          <Link
            component="button"
            variant="body2"
            onClick={handleForgotPassword}
            sx={{ 
              color: epipheoTheme.palette.secondary.main,
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            Forgot password?
          </Link>
        </Box>
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{ 
            mt: 2, 
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
          ) : 'Sign In'}
        </Button>
        
        {onRegisterClick && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" display="inline">
              Don't have an account?{' '}
            </Typography>
            <Link
              component="button"
              variant="body2"
              onClick={onRegisterClick}
              sx={{ 
                fontWeight: 600,
                color: epipheoTheme.palette.primary.main,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Sign Up
            </Link>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default LoginForm; 