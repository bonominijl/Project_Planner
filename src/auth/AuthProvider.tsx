import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  token?: string;
}

// Auth Context interface
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (provider: 'google') => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

// Create the Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock authentication for development
const mockAuthDelay = 1000; // ms

const mockGoogleUser: User = {
  id: 'google-123456789',
  name: 'Demo User',
  email: 'demo@example.com',
  photoUrl: 'https://lh3.googleusercontent.com/a/default-user',
  token: 'mock-auth-token'
};

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      try {
        // In a real app, we would check for an existing token in localStorage/cookies
        // and validate it with the backend
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        setError('Failed to restore authentication session');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Mock Google OAuth login
  const login = async (provider: 'google') => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, we would initiate Google OAuth flow here
      // For now, we'll just simulate a successful login after a delay
      await new Promise(resolve => setTimeout(resolve, mockAuthDelay));
      
      if (provider === 'google') {
        setUser(mockGoogleUser);
        localStorage.setItem('auth_user', JSON.stringify(mockGoogleUser));
        navigate('/');
      } else {
        throw new Error('Unsupported authentication provider');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    
    try {
      // In a real app, we would handle token revocation, etc.
      // For now, just clear the user state
      await new Promise(resolve => setTimeout(resolve, mockAuthDelay / 2));
      
      setUser(null);
      localStorage.removeItem('auth_user');
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to log out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Determine if the user is authenticated
  const isAuthenticated = !!user;

  // Provide the auth context to child components
  const value = {
    user,
    loading,
    error,
    login,
    logout,
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

// Protected route component
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    
    useEffect(() => {
      if (!loading && !isAuthenticated) {
        navigate('/login');
      }
    }, [isAuthenticated, loading, navigate]);
    
    if (loading) {
      return <div>Loading authentication...</div>;
    }
    
    return isAuthenticated ? <Component {...props} /> : null;
  };
};

export default AuthProvider; 