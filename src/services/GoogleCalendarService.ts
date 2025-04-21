// Google Calendar API Integration
import { CustomActivity } from '../components/ActivitySelection';

// Add type declarations for Google API libraries
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

/**
 * Google Calendar API Configuration
 * 
 * STEP-BY-STEP SETUP GUIDE:
 * 
 * 1. Go to Google Cloud Console: https://console.cloud.google.com/
 * 
 * 2. Create a new project:
 *    - Click on the project dropdown at the top of the page
 *    - Click "New Project"
 *    - Enter a name like "Epipheo Project Planner"
 *    - Click "Create"
 * 
 * 3. Enable the Google Calendar API:
 *    - Go to "APIs & Services" > "Library"
 *    - Search for "Google Calendar API"
 *    - Click on it and click "Enable"
 * 
 * 4. Configure the OAuth consent screen:
 *    - Go to "APIs & Services" > "OAuth consent screen"
 *    - Select "External" user type (if not in an organization)
 *    - Fill in the required app information:
 *      - App name: "Epipheo Project Planner"
 *      - User support email: Your email
 *      - Developer contact information: Your email
 *    - Click "Save and Continue"
 *    - On the scopes page, click "Add or Remove Scopes"
 *    - Add the scope: https://www.googleapis.com/auth/calendar
 *    - Click "Save and Continue"
 *    - Add test users if needed for developmentAccess blocked: This app's request is invalid

bonominijl@gmail.com
You can't sign in because this app sent an invalid request. You can try again later, or contact the developer about this issue. Learn more about this error
If you are a developer of this app, see error details.
Error 400: redirect_uri_mismatch
 *    - Click "Save and Continue" then "Back to Dashboard"
 * 
 * 5. Create OAuth 2.0 credentials:
 *    - Go to "APIs & Services" > "Credentials"
 *    - Click "Create Credentials" > "OAuth client ID"
 *    - Application type: "Web application"
 *    - Name: "Epipheo Project Planner Web Client"
 *    - Authorized JavaScript origins:
 *      - For local development: http://localhost:3000
 *      - For production: add your production URL
 *    - Authorized redirect URIs:
 *      - For local development: http://localhost:3000
 *      - For production: add your production URL
 *    - Click "Create"
 * 
 * 6. Get your Client ID:
 *    - After creation, a modal will display your Client ID
 *    - Copy the Client ID (NOT the client secret)
 *    - Paste it as the CLIENT_ID value below
 */

// Replace this with your Google OAuth client ID (NOT the client secret)
// If you get a 401 error or "invalid_client" error, check that you're using the correct client ID
const CLIENT_ID = '336193663789-ephf3o09r2cj8i4pvdoue6mqndqnbsip.apps.googleusercontent.com'; // ← Replace with your actual client ID
const API_KEY = ''; // We don't need an API key for this OAuth implementation
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
// Updated scope to allow writing to calendar
const SCOPES = 'https://www.googleapis.com/auth/calendar';

// Interface for availability search results
interface AvailabilitySlot {
  start: Date;
  end: Date;
  duration: number; // in minutes
}

class GoogleCalendarService {
  private tokenClient: any = null;
  private gapi: any = null;
  private initialized = false;
  private initializing = false;
  private isGoogleApiLoaded = false;
  private isConfigured = (CLIENT_ID as string) !== '' && (CLIENT_ID as string) !== 'YOUR_CLIENT_ID_HERE';
  private accessToken: string | null = null;
  private scriptLoadError = false;

  /**
   * Check if Google Calendar is properly configured
   */
  isProperlyConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Check if the service has been initialized
   */
  get isInitialized(): boolean {
    return this.initialized;
  }

  private loadGapiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        console.log('GAPI already loaded');
        resolve();
        return;
      }

      // Check if script is already in the document
      if (document.getElementById('gapi-script')) {
        console.log('GAPI script tag already exists, waiting for load');
        setTimeout(() => resolve(), 100);
        return;
      }

      console.log('Loading GAPI script');
      const script = document.createElement('script');
      script.id = 'gapi-script';
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('GAPI script loaded successfully');
        resolve();
      };
      
      script.onerror = (error) => {
        console.error('Error loading GAPI script:', error);
        console.warn('Continuing without Google API integration');
        // Resolve instead of reject to allow app to continue
        resolve();
      };
      
      document.body.appendChild(script);
    });
  }

  private loadGisScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2) {
        console.log('GIS already loaded');
        resolve();
        return;
      }

      // Check if script is already in the document
      if (document.getElementById('gis-script')) {
        console.log('GIS script tag already exists, waiting for load');
        setTimeout(() => resolve(), 100);
        return;
      }

      console.log('Loading GIS script');
      const script = document.createElement('script');
      script.id = 'gis-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('GIS script loaded successfully');
        resolve();
      };
      
      script.onerror = (error) => {
        console.error('Error loading GIS script:', error);
        console.warn('Continuing without Google Identity Services integration');
        // Resolve instead of reject to allow app to continue
        resolve();
      };
      
      document.body.appendChild(script);
    });
  }

  /**
   * Initialize Google API client
   */
  async initialize(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.initialized || this.initializing) {
        console.log('Google Calendar Service already initialized or initializing');
        resolve();
        return;
      }

      // Check if required configuration exists
      if (!CLIENT_ID || !API_KEY) {
        console.warn('Google Calendar API is not configured. Missing API_KEY or CLIENT_ID.');
        this.isConfigured = false;
        this.initialized = true;
        resolve();
        return;
      }

      this.isConfigured = true;
      this.initializing = true;

      try {
        // Initialize with retry mechanism
        this.initializeWithRetry(resolve);
      } catch (error) {
        console.error('Error in initialize:', error);
        this.initialized = true; // Mark as initialized to prevent further attempts
        this.initializing = false;
        resolve(); // Resolve anyway to not block the app
      }
    });
  }

  /**
   * Initialize with retry mechanism
   */
  private async initializeWithRetry(resolve: (value: void | PromiseLike<void>) => void, retryCount = 0): Promise<void> {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds
    
    try {
      console.log(`Initialization attempt ${retryCount + 1}/${MAX_RETRIES + 1}`);
      
      // Load GAPI script
      await this.loadGapiScript();
      
      // Load GAPI client
      if (window.gapi) {
        await new Promise<void>((resolveGapi) => {
          window.gapi.load('client', {
            callback: () => {
              console.log('GAPI client loaded');
              resolveGapi();
            },
            onerror: (error: any) => {
              console.error('Error loading GAPI client:', error);
              resolveGapi(); // Still resolve to continue
            },
          });
        });
      } else {
        console.warn('GAPI not available, skipping client initialization');
      }
      
      // Initialize GAPI client
      if (window.gapi?.client) {
        try {
          await window.gapi.client.init({});
          console.log('GAPI client initialized');
        } catch (error) {
          console.error('Error initializing GAPI client:', error);
          // Continue despite error
        }
      }
      
      // Load GIS script
      await this.loadGisScript();
      
      // Initialize the token client if GIS loaded successfully
      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        try {
          this.tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (tokenResponse: any) => {
              if (tokenResponse && tokenResponse.access_token) {
                this.accessToken = tokenResponse.access_token;
                window.gapi.client.setToken(tokenResponse);
              }
            },
          });
          
          this.gapi = window.gapi;
          this.isGoogleApiLoaded = true;
          this.initialized = true;
          this.initializing = false;
          console.log('All Google API components initialized successfully');
          resolve();
        } catch (error) {
          console.error('Error initializing tokenClient:', error);
          
          if (retryCount < MAX_RETRIES) {
            console.log(`Retrying initialization (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            setTimeout(() => {
              this.initializeWithRetry(resolve, retryCount + 1);
            }, RETRY_DELAY);
          } else {
            console.warn('Max retries reached. Continuing without complete initialization.');
            this.initialized = true;
            this.initializing = false;
            resolve();
          }
        }
      } else {
        console.warn('Google Identity Services not available after loading');
        this.initialized = true;
        this.initializing = false;
        resolve();
      }
    } catch (error) {
      console.error('Error during initialization:', error);
      
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying initialization in ${RETRY_DELAY/1000} seconds...`);
        setTimeout(() => {
          this.initializeWithRetry(resolve, retryCount + 1);
        }, RETRY_DELAY);
      } else {
        console.warn('Max retries reached. Continuing without complete initialization.');
        this.initialized = true;
        this.initializing = false;
        resolve();
      }
    }
  }

  /**
   * Authenticate with Google
   */
  async authenticate(): Promise<boolean> {
    if (!this.initialized) {
      try {
        await this.initialize();
      } catch (error) {
        console.error('Failed to initialize Google service:', error);
        // Continue anyway - we'll try direct OAuth flow
      }
    }

    // If not configured, return false immediately
    if (!this.isConfigured) {
      console.warn('Cannot authenticate: Google Calendar API is not configured');
      return false;
    }

    try {
      // Check if we already have a token
      if (this.accessToken) {
        return true;
      }
      
      // Check for token in URL (after redirect back from Google)
      const urlParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = urlParams.get('access_token');
      if (accessToken) {
        console.log('Found access token in URL after redirect');
        this.accessToken = accessToken;
        const expiresIn = parseInt(urlParams.get('expires_in') || '3600', 10);
        const tokenObj = {
          access_token: accessToken,
          expires_in: expiresIn,
          scope: urlParams.get('scope') || SCOPES,
          token_type: urlParams.get('token_type') || 'Bearer'
        };
        
        // Only try to use gapi if it's available
        if (window.gapi && window.gapi.client) {
          window.gapi.client.setToken(tokenObj);
        }
        
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        return true;
      }
      
      // Use direct OAuth flow
      return new Promise<boolean>((resolve) => {
        try {
          const redirectUri = window.location.origin; // Just use the origin without any path
          
          // Save current path before redirect
          const currentPath = window.location.pathname + window.location.search;
          localStorage.setItem('googleAuthReturnPath', currentPath);
          
          // Try token client first if available
          if (this.tokenClient) {
            try {
              console.log('Using token client for authentication');
              this.tokenClient.requestAccessToken({ prompt: 'consent' });
              return false; // We're redirecting, so we won't reach here
            } catch (tokenError) {
              console.error('Failed to use token client, falling back to direct URL:', tokenError);
              // Continue to fallback method
            }
          } else {
            console.log('Token client not available, using direct OAuth URL');
          }
          
          // Fallback to direct URL method
          const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(SCOPES)}`;
          
          console.log('Redirecting to Google authentication...');
          console.log('Using redirect URI:', redirectUri);
          
          // Redirect to Google's OAuth page
          window.location.href = authUrl;
          
          // We won't reach here until after redirect back
          return false;
        } catch (error) {
          console.error('Error initiating OAuth flow:', error);
          resolve(false);
        }
      });
    } catch (error) {
      console.error('Error in authenticate:', error);
      return false;
    }
  }

  /**
   * Check if we were redirected back from Google auth
   * This should be called when the app initializes
   */
  checkRedirectResult(): boolean {
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = urlParams.get('access_token');
    
    if (accessToken) {
      console.log('Handling redirect result from Google authentication');
      this.accessToken = accessToken;
      const expiresIn = parseInt(urlParams.get('expires_in') || '3600', 10);
      const tokenObj = {
        access_token: accessToken,
        expires_in: expiresIn,
        scope: urlParams.get('scope') || SCOPES,
        token_type: urlParams.get('token_type') || 'Bearer'
      };
      
      // Initialize GAPI if needed
      if (window.gapi && window.gapi.client) {
        window.gapi.client.setToken(tokenObj);
      }
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      
      // Return to the previous path if available
      const returnPath = localStorage.getItem('googleAuthReturnPath');
      if (returnPath && returnPath !== window.location.pathname + window.location.search) {
        window.location.href = returnPath;
      }
      
      return true;
    }
    
    return false;
  }

  // List available calendars
  async listCalendars(): Promise<any[]> {
    try {
      const response = await this.gapi.client.calendar.calendarList.list();
      return response.result.items;
    } catch (error) {
      console.error('Error listing calendars:', error);
      return [];
    }
  }

  // Find available time slots based on resource type
  async findAvailableTimeSlots(
    resourceType: string,
    startDate: Date,
    endDate: Date,
    durationHours: number,
    specificCalendarIds?: string[]
  ): Promise<AvailabilitySlot[]> {
    try {
      // Get calendars matching the resource type (using description or summary as filter)
      const calendars = await this.listCalendars();
      
      let calendarIds: string[];
      
      if (specificCalendarIds && specificCalendarIds.length > 0) {
        calendarIds = specificCalendarIds;
      } else {
        const resourceCalendars = calendars.filter(calendar => 
          calendar.description?.includes(resourceType) || 
          calendar.summary?.includes(resourceType)
        );
        
        if (resourceCalendars.length === 0) {
          console.warn(`No calendars found matching resource type: ${resourceType}`);
          return [];
        }
        
        calendarIds = resourceCalendars.map(cal => cal.id);
      }
      
      // Get busy times for all matching calendars
      const busyTimesRequest = {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: calendarIds.map(calId => ({ id: calId })),
      };
      
      const busyTimesResponse = await this.gapi.client.calendar.freebusy.query(busyTimesRequest);
      const calendarsData = busyTimesResponse.result.calendars;
      
      // Collect all busy periods
      const busyPeriods: {start: Date, end: Date}[] = [];
      for (const calendarId in calendarsData) {
        if (calendarsData[calendarId].busy) {
          calendarsData[calendarId].busy.forEach((period: any) => {
            busyPeriods.push({
              start: new Date(period.start),
              end: new Date(period.end)
            });
          });
        }
      }
      
      // Find free slots (this is a simple implementation; more complex logic may be needed)
      const availableSlots: AvailabilitySlot[] = [];
      const durationMs = durationHours * 60 * 60 * 1000;
      
      // Start with work hours (9 AM - 5 PM) on each day
      let currentDate = new Date(startDate);
      currentDate.setHours(9, 0, 0, 0);
      
      while (currentDate < endDate) {
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(17, 0, 0, 0);
        
        let slotStart = new Date(currentDate);
        
        while (slotStart < dayEnd && slotStart.getTime() + durationMs <= dayEnd.getTime()) {
          const slotEnd = new Date(slotStart.getTime() + durationMs);
          
          // Check if the slot overlaps with any busy period
          const isOverlapping = busyPeriods.some(period => 
            (slotStart >= period.start && slotStart < period.end) || 
            (slotEnd > period.start && slotEnd <= period.end) ||
            (slotStart <= period.start && slotEnd >= period.end)
          );
          
          if (!isOverlapping) {
            availableSlots.push({
              start: new Date(slotStart),
              end: new Date(slotEnd),
              duration: durationHours * 60
            });
          }
          
          // Move to next slot (30-minute intervals)
          slotStart = new Date(slotStart.getTime() + 30 * 60 * 1000);
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(9, 0, 0, 0);
      }
      
      return availableSlots;
    } catch (error) {
      console.error('Error finding available time slots:', error);
      return [];
    }
  }

  // Schedule an activity on Google Calendar
  async scheduleActivity(activity: CustomActivity, startDate: Date, endDate: Date): Promise<string> {
    try {
      const event = {
        summary: activity.name,
        description: `Project activity: ${activity.description || activity.name}\nResource: ${activity.resourceType}`,
        start: {
          dateTime: startDate.toISOString(),
        },
        end: {
          dateTime: endDate.toISOString(),
        },
        colorId: '2', // Color coding for project activities
      };

      const response = await this.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });

      return response.result.id;
    } catch (error) {
      console.error('Error scheduling activity:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const googleCalendarService = new GoogleCalendarService();
export default googleCalendarService; 