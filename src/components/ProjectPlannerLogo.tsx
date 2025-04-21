import React from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface ProjectPlannerLogoProps {
  size?: number;
}

const ProjectPlannerLogo: React.FC<ProjectPlannerLogoProps> = ({ size = 32 }) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main circle background */}
        <circle cx="16" cy="16" r="15" fill={theme.palette.primary.main} />
        
        {/* Calendar/project board grid */}
        <path 
          d="M8 10H24M8 16H24M8 22H24M12 7V25M18 7V25" 
          stroke="white" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
        />
        
        {/* Checkmark in one cell */}
        <path 
          d="M14 14L15.5 15.5L17.5 13.5" 
          stroke={theme.palette.secondary.main} 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* Timeline/progress bar */}
        <path 
          d="M10 20H22" 
          stroke={theme.palette.secondary.main} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
        
        {/* Milestone marker */}
        <circle cx="19" cy="20" r="2" fill="white" />
      </svg>
    </Box>
  );
};

export default ProjectPlannerLogo; 