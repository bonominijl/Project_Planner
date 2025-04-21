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
        <rect width="32" height="32" rx="6" fill={theme.palette.primary.main} />
        <path 
          d="M8 7L13 12M13 20L8 25M19 7L24 12M24 20L19 25M16 4L16 28M6 16H26" 
          stroke="white" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path
          d="M22 16A6 6 0 1110 16"
          stroke="#2CE5D8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </Box>
  );
};

export default ProjectPlannerLogo; 