import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from './AuthProvider';
import googleCalendarService from '../services/GoogleCalendarService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default mock user for development
const mockUser: User = {
  id: 'user-123456789',
  name: 'Test User',
  email: 'test@example.com',
  photoUrl: 'https://via.placeholder.com/150',
  token: 'mock-jwt-token'
};

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing user session on initial load
  useEffect(() => {
    const loadStoredUser = () => {
      setLoading(true);
      try {
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Failed to load stored authentication:', err);
        setError('Authentication restoration failed');
      } finally {
        setLoading(false);
      }
    };

    loadStoredUser();
    
    // Check if we're returning from a Google OAuth redirect
    const checkGoogleAuth = async () => {
      if (window.location.hash.includes('access_token')) {
        try {
          // Process the redirect result
          const success = googleCalendarService.checkRedirectResult();
          if (success) {
            console.log('Detected Google Auth redirect');
            
            // Create a user from the Google account info
            // In a real app, you would get the user info from Google's API
            // For now, we'll create a mock Google user
            const googleUser: User = {
              id: 'google-' + Date.now(),
              name: 'Google User',
              email: 'google.user@example.com',
              photoUrl: 'https://lh3.googleusercontent.com/a/default-user',
              token: window.location.hash.split('access_token=')[1]?.split('&')[0] || ''
            };
            
            setCurrentUser(googleUser);
            localStorage.setItem('auth_user', JSON.stringify(googleUser));
          }
        } catch (err) {
          console.error('Error processing Google Auth redirect:', err);
          setError('Failed to authenticate with Google');
        }
      }
    };
    
    checkGoogleAuth();
  }, []);

  // Login function - in a real app this would make an API call
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simple validation (would be handled by backend)
      if (email !== 'test@example.com' || password !== 'password') {
        throw new Error('Invalid email or password');
      }
      
      // Set user and persist in localStorage
      setCurrentUser(mockUser);
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Google login function
  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if Google API is properly configured
      if (!googleCalendarService.isProperlyConfigured()) {
        setError('Google login is not properly configured. Please check the configuration.');
        setLoading(false);
        return;
      }
      
      // Create a mock Google user even if authentication fails
      // This allows the application to continue working for demos/testing
      const backupGoogleUser = async () => {
        console.log('Creating backup Google user for demo purposes');
        const googleUser: User = {
          id: 'google-' + Date.now(),
          name: 'Google Demo User',
          email: 'demo.user@example.com',
          photoUrl: 'https://lh3.googleusercontent.com/a/default-user',
          token: 'mock-google-token'
        };
        
        setCurrentUser(googleUser);
        localStorage.setItem('auth_user', JSON.stringify(googleUser));
        setLoading(false);
        
        // Show a warning that we're using a demo account
        setError('Using a demo Google account. In production, this would authenticate with a real Google account.');
      };
      
      // Initialize if not already initialized
      if (!googleCalendarService.isInitialized) {
        try {
          await googleCalendarService.initialize();
        } catch (err) {
          console.error('Failed to initialize Google Calendar service:', err);
          // Fall back to the demo user but continue trying to authenticate
          setTimeout(backupGoogleUser, 2000);
        }
      }
      
      // Attempt to authenticate with Google
      try {
        const authSuccess = await googleCalendarService.authenticate();
        
        if (!authSuccess) {
          console.warn('Google authentication was not successful, using backup user');
          // Wait a bit before creating the backup user to allow for redirects
          setTimeout(backupGoogleUser, 1000);
        }
        
        // Note: We don't need to set the user here as it will be handled
        // by the redirect and checkGoogleAuth() in the useEffect
      } catch (err) {
        console.error('Google authentication error:', err);
        // Fall back to the demo user
        backupGoogleUser();
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError('Failed to login with Google. Please try again.');
      setLoading(false);
    }
  };

  // Register function - in a real app this would make an API call
  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a new user based on input
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        photoUrl: 'https://via.placeholder.com/150',
        token: 'mock-jwt-token'
      };
      
      // Set user and persist in localStorage
      setCurrentUser(newUser);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear user data
      setCurrentUser(null);
      localStorage.removeItem('auth_user');
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err.message : 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Validate email
      if (!email || !email.includes('@')) {
        throw new Error('Please provide a valid email address');
      }
      
      // In a real app, this would trigger a password reset email
      console.log(`Password reset email sent to ${email}`);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset password');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (data: Partial<User>) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (!currentUser) {
        throw new Error('No user is currently logged in');
      }
      
      // Update user data
      const updatedUser = {
        ...currentUser,
        ...data
      };
      
      // Set updated user and persist in localStorage
      setCurrentUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!currentUser;

  const value = {
    currentUser,
    loading,
    error,
    login,
    loginWithGoogle,
    register,
    logout,
    resetPassword,
    updateProfile,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC to protect routes
export const withAuthProtection = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
      return <div>Authenticating...</div>;
    }
    
    return isAuthenticated ? <Component {...props} /> : <div>Please login to access this page</div>;
  };
}; 