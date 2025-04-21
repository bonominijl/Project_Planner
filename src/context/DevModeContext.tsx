import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Key for storing dev mode setting in localStorage
const DEV_MODE_STORAGE_KEY = 'epipheo-dev-mode';

interface DevModeContextType {
  isDevMode: boolean;
  toggleDevMode: () => void;
}

const DevModeContext = createContext<DevModeContextType>({
  isDevMode: false,
  toggleDevMode: () => {}
});

export const useDevMode = () => useContext(DevModeContext);

interface DevModeProviderProps {
  children: ReactNode;
}

export const DevModeProvider: React.FC<DevModeProviderProps> = ({ children }) => {
  const [isDevMode, setIsDevMode] = useState<boolean>(false);

  // Load dev mode state from localStorage on mount
  useEffect(() => {
    try {
      const savedDevMode = localStorage.getItem(DEV_MODE_STORAGE_KEY);
      if (savedDevMode) {
        setIsDevMode(JSON.parse(savedDevMode));
      }
    } catch (err) {
      console.error('Error loading dev mode state from localStorage:', err);
    }
  }, []);

  // Save dev mode state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(DEV_MODE_STORAGE_KEY, JSON.stringify(isDevMode));
    } catch (err) {
      console.error('Error saving dev mode state to localStorage:', err);
    }
  }, [isDevMode]);

  // Add keyboard shortcut (Ctrl+Shift+D) to toggle dev mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        toggleDevMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleDevMode = () => {
    setIsDevMode(prev => !prev);
  };

  return (
    <DevModeContext.Provider value={{ isDevMode, toggleDevMode }}>
      {children}
      
      {/* Dev Mode Indicator */}
      {isDevMode && (
        <div 
          style={{
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            padding: '8px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#00ff00',
            fontSize: '12px',
            fontFamily: 'monospace',
            borderRadius: '4px',
            zIndex: 9999,
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}
        >
          DEV MODE ACTIVE 🛠️
        </div>
      )}
    </DevModeContext.Provider>
  );
};

export default DevModeProvider; 