import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Breadcrumbs,
  Link,
  ThemeProvider,
  CssBaseline
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { epipheoTheme } from '../themes/epipheoTheme';
import HomeIcon from '@mui/icons-material/Home';
import ArticleIcon from '@mui/icons-material/Article';
import Footer from './Footer';

const LicensePage: React.FC = () => {
  return (
    <ThemeProvider theme={epipheoTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Container maxWidth="md" sx={{ my: 4, flex: 1 }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
            <Link 
              component={RouterLink} 
              to="/"
              underline="hover" 
              color="inherit"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Home
            </Link>
            <Typography
              sx={{ display: 'flex', alignItems: 'center' }}
              color="text.primary"
            >
              <ArticleIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              License
            </Typography>
          </Breadcrumbs>
          
          <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              MIT License
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Copyright (c) {new Date().getFullYear()} Josh Bonomini
            </Typography>
            
            <Typography variant="body1" paragraph sx={{ mt: 3 }}>
              Permission is hereby granted, free of charge, to any person obtaining a copy
              of this software and associated documentation files (the "Software"), to deal
              in the Software without restriction, including without limitation the rights
              to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
              copies of the Software, and to permit persons to whom the Software is
              furnished to do so, subject to the following conditions:
            </Typography>
            
            <Typography variant="body1" paragraph>
              The above copyright notice and this permission notice shall be included in all
              copies or substantial portions of the Software.
            </Typography>
            
            <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
              THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
              IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
              AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
              LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
              OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
              SOFTWARE.
            </Typography>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                About This Project
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The Epipheo Project Planner is an open-source tool created by Josh Bonomini to help
                manage and organize project timelines and resources. It is made available under
                the MIT License, allowing for free use, modification, and distribution.
              </Typography>
            </Box>
            
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Link component={RouterLink} to="/" color="primary">
                Return to Project Planner
              </Link>
            </Box>
          </Paper>
        </Container>
        
        <Footer />
      </Box>
    </ThemeProvider>
  );
};

export default LicensePage; 