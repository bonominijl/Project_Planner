import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Link,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { Email as EmailIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { epipheoTheme } from '../themes/epipheoTheme';
import Footer from '../components/Footer';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { resetPassword, loading, error } = useAuth();
  const navigate = useNavigate();
  
  const validateEmail = (): boolean => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email address is invalid');
      return false;
    }
    setEmailError(null);
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) {
      return;
    }
    
    try {
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Password reset error:', err);
      // Error is handled in the AuthContext
    }
  };
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError(null);
    }
  };
  
  const handleBackToLogin = () => {
    navigate('/login');
  };
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#f5f5f7'
    }}>
      <Container 
        component="main" 
        maxWidth="sm" 
        sx={{ 
          flex: 1,
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          py: 4
        }}
      >
        <Box 
          sx={{ 
            width: '100%', 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 700, 
              color: epipheoTheme.palette.primary.main,
              textAlign: 'center'
            }}
          >
            Epipheo Project Planner
          </Typography>
        </Box>
        
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
          {isSubmitted ? (
            <Box>
              <Alert 
                severity="success"
                sx={{ mb: 3, borderRadius: epipheoTheme.shape.borderRadius }}
              >
                Password reset instructions have been sent to your email.
              </Alert>
              
              <Typography variant="body1" paragraph>
                Please check your inbox for instructions on how to reset your password. 
                If you don't receive the email within a few minutes, check your spam folder.
              </Typography>
              
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleBackToLogin}
                sx={{ mt: 2 }}
              >
                Back to Login
              </Button>
            </Box>
          ) : (
            <>
              <Typography 
                variant="h5" 
                component="h2" 
                gutterBottom 
                align="center"
                sx={{ fontWeight: 700 }}
              >
                Reset Your Password
              </Typography>
              
              <Typography 
                variant="body2" 
                color="textSecondary" 
                align="center" 
                sx={{ mb: 3 }}
              >
                Enter your email address and we'll send you instructions to reset your password.
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
                  error={!!emailError}
                  helperText={emailError}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  sx={{ 
                    mt: 1, 
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
                  ) : 'Send Reset Instructions'}
                </Button>
                
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    startIcon={<ArrowBackIcon />}
                    component={RouterLink}
                    to="/login"
                    sx={{ textTransform: 'none' }}
                  >
                    Back to Login
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Paper>
      </Container>
      
      <Footer />
    </Box>
  );
};

export default ForgotPasswordPage; 