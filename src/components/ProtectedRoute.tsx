import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowGuest?: boolean; // Optional prop to allow guest access to some routes
}

/**
 * A wrapper component that protects routes by checking authentication status.
 * Redirects to the login page if the user is not authenticated.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowGuest = false 
}) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // If authentication is still loading, show a loading spinner
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // If user is authenticated or guest access is allowed, render the children
  if (isAuthenticated || allowGuest) {
    return <>{children}</>;
  }

  // Otherwise, redirect to login page, but save the current location so we can
  // redirect back after login
  return (
    <Navigate 
      to="/login" 
      state={{ from: location.pathname }} 
      replace 
    />
  );
};

export default ProtectedRoute; 