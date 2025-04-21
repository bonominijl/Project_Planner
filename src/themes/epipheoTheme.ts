import { createTheme } from '@mui/material/styles';

// Epipheo color scheme (original)
const epipheoColors = {
  primary: {
    main: '#FF6B00',      // Orange color from Epipheo's CTAs as primary
    light: '#FF9A4D',
    dark: '#CC5500',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#2CE5D8',      // Teal/turquoise color from Epipheo's logo
    light: '#6EEEE5',
    dark: '#00B5A9',
    contrastText: '#000000',
  },
  background: {
    default: '#FFFFFF',   // White - for main backgrounds
    paper: '#F8F9FA',     // Light gray - for paper elements
  },
  text: {
    primary: '#333333',   // Near black - for most text
    secondary: '#666666', // Medium gray - for secondary text
    disabled: '#9e9e9e',  // Light gray - for disabled text
  },
  success: {
    main: '#2e7d32',      // Green - for success states
    light: '#4caf50',
    dark: '#1b5e20',
  },
  warning: {
    main: '#ed6c02',      // Orange - for warning states
    light: '#ff9800',
    dark: '#e65100',
  },
  error: {
    main: '#d32f2f',      // Red - for error states
    light: '#ef5350',
    dark: '#c62828',
  },
  info: {
    main: '#0288d1',      // Blue - for information states
    light: '#03a9f4',
    dark: '#01579b',
  },
};

// Create the epipheoTheme with both named and default export
export const epipheoTheme = createTheme({
  palette: {
    primary: epipheoColors.primary,
    secondary: epipheoColors.secondary,
    error: epipheoColors.error,
    warning: epipheoColors.warning,
    info: epipheoColors.info,
    success: epipheoColors.success,
    background: {
      default: epipheoColors.background.default,
      paper: epipheoColors.background.paper,
    },
    text: {
      primary: epipheoColors.text.primary,
      secondary: epipheoColors.text.secondary,
      disabled: epipheoColors.text.disabled,
    },
  },
  shape: {
    borderRadius: 4,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '2px',
          padding: '8px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          '&:hover': {
            boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
          },
          '.dashboard-component &': {
            borderRadius: '20px',
          },
        },
        containedPrimary: {
          backgroundColor: epipheoColors.primary.main,
          '&:hover': {
            backgroundColor: epipheoColors.primary.dark,
          },
        },
        containedSecondary: {
          backgroundColor: epipheoColors.secondary.main,
          '&:hover': {
            backgroundColor: epipheoColors.secondary.dark,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '2px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-2px)',
          },
          '.dashboard-card &': {
            borderRadius: '12px',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: epipheoColors.primary.main,
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: epipheoColors.primary.main,
            color: epipheoColors.primary.contrastText,
            '&:hover': {
              backgroundColor: epipheoColors.primary.dark,
            },
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '2px',
          },
          '.dashboard-input &': {
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '2px',
          '.dashboard-chip &': {
            borderRadius: '16px',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          borderRadius: '2px',
          marginRight: '2px',
          '.dashboard-tabs &': {
            borderRadius: '20px 20px 0 0',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '2px',
          '.dashboard-dialog &': {
            borderRadius: '16px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '2px',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          borderRadius: '2px',
        },
        inputRoot: {
          borderRadius: '2px',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          borderRadius: '2px',
        },
        filled: {
          borderRadius: '2px',
        },
        standard: {
          borderRadius: '2px',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: '2px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '2px',
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiAlert-root': {
            borderRadius: '2px',
          },
        },
      },
    },
  },
});

// Also export as default for easier imports
export default epipheoTheme; 