import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { useDevMode } from '../context/DevModeContext';

interface DevModeIndicatorProps {
  pageName: string;
  componentPath?: string;
}

const DevModeIndicator: React.FC<DevModeIndicatorProps> = ({ pageName, componentPath }) => {
  const { isDevMode } = useDevMode();

  if (!isDevMode) return null;

  return (
    <Box 
      sx={{
        position: 'fixed',
        top: 10,
        right: 10,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 1,
        borderRadius: 1,
      }}
    >
      <Chip 
        label={`Page: ${pageName}`} 
        color="primary" 
        size="small"
        sx={{ fontWeight: 'bold' }}
      />
      {componentPath && (
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'white', 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}
        >
          {componentPath}
        </Typography>
      )}
    </Box>
  );
};

export default DevModeIndicator; 