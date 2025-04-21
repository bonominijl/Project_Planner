import React from 'react';
import { Box, Container, Link, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ProjectPlannerLogo from './ProjectPlannerLogo';
import { Link as RouterLink } from 'react-router-dom';

const Footer: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 1, 
        px: 2, 
        mt: 'auto', 
        backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800],
        borderTop: `1px solid ${theme.palette.divider}`
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ProjectPlannerLogo size={20} />
            <Typography variant="body2" color="text.primary" sx={{ ml: 1 }}>
              Project Planner © {new Date().getFullYear()}
            </Typography>
          </Box>
          <Box>
            <Link component={RouterLink} to="/license" color="inherit">
              <Typography variant="body2" color="text.secondary">
                Open Source Licenses
              </Typography>
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 