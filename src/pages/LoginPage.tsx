import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Divider,
  Stack,
  CircularProgress
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { epipheoTheme } from '../themes/epipheoTheme';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import Footer from '../components/Footer';

const LoginPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const { currentUser, loading: authLoading, error: authError, isAuthenticated, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect to home if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleToggleView = () => {
    setIsLoginView(!isLoginView);
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleGuestAccess = () => {
    // For demo purposes, navigate to the main app without authentication
    navigate('/');
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      await loginWithGoogle();
      
      // If no redirect happens after 5 seconds, reset the loading state
      // (This handles cases where Google auth fails silently)
      setTimeout(() => {
        setGoogleLoading(false);
      }, 5000);
    } catch (error) {
      console.error('Google login error:', error);
      setError('Failed to login with Google. Please try again.');
      setGoogleLoading(false);
    }
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
          <Typography 
            variant="body1" 
            color="text.secondary"
            textAlign="center"
            sx={{ maxWidth: 400 }}
          >
            {isLoginView 
              ? 'Sign in to manage your production projects' 
              : 'Create an account to get started with project planning'}
          </Typography>
        </Box>
        
        {isLoginView ? (
          <LoginForm 
            onRegisterClick={handleToggleView}
            onForgotPasswordClick={handleForgotPassword}
          />
        ) : (
          <RegisterForm onLoginClick={handleToggleView} />
        )}
        
        <Box sx={{ width: '100%', maxWidth: 400, mt: 3 }}>
          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Stack spacing={2} width="100%" alignItems="center">
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  startIcon={googleLoading ? <CircularProgress size={20} /> : <GoogleIcon />}
                  onClick={handleGoogleLogin}
                  disabled={loading || googleLoading}
                  sx={{ 
                    py: 1.2,
                    borderRadius: 2,
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    backgroundColor: 'white',
                    color: 'text.primary',
                    borderColor: 'divider',
                    '&:hover': {
                      backgroundColor: 'grey.50',
                      borderColor: 'grey.400'
                    }
                  }}
                >
                  {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
                </Button>
              </Stack>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="text"
                fullWidth
                size="large"
                onClick={handleGuestAccess}
                sx={{ 
                  py: 1.2,
                  color: epipheoTheme.palette.text.secondary
                }}
              >
                Continue as Guest
              </Button>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              By signing in, you agree to our{' '}
              <a 
                href="/terms"
                style={{ 
                  color: epipheoTheme.palette.primary.main,
                  textDecoration: 'none'
                }}
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a 
                href="/privacy"
                style={{ 
                  color: epipheoTheme.palette.primary.main,
                  textDecoration: 'none'
                }}
              >
                Privacy Policy
              </a>.
            </Typography>
          </Box>
        </Box>
      </Container>
      
      <Footer />
    </Box>
  );
};

export default LoginPage; 