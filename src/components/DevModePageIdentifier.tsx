import React from 'react';
import { Box, Chip, useTheme } from '@mui/material';
import { useDevMode } from '../context/DevModeContext';

interface PageIdentifierProps {
  page: string;
  component?: string;
}

const DevModePageIdentifier: React.FC<PageIdentifierProps> = ({ 
  page, 
  component 
}) => {
  const { isDevMode } = useDevMode();
  const theme = useTheme();

  // Don't render anything if not in dev mode
  if (!isDevMode) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 60, // Above the footer
        right: 10,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        padding: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 2,
        backdropFilter: 'blur(4px)',
        boxShadow: theme.shadows[4],
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        }
      }}
    >
      <Chip
        label={`Page: ${page}`}
        color="primary"
        size="small"
        sx={{ 
          fontWeight: 'bold',
          color: 'white',
          borderColor: 'white'
        }}
        variant="outlined"
      />
      
      {component && (
        <Chip
          label={`Component: ${component}`}
          color="secondary"
          size="small"
          sx={{ 
            fontWeight: 'bold',
            color: 'white',
            borderColor: 'white'
          }}
          variant="outlined"
        />
      )}
    </Box>
  );
};

export default DevModePageIdentifier; 