import { addDays, isWeekend, differenceInBusinessDays, parseISO, isValid } from 'date-fns';

/**
 * Adds the specified number of business days to a date
 * @param date The starting date
 * @param days Number of business days to add
 * @returns A new date with the business days added
 */
export const addBusinessDays = (date: Date, days: number): Date => {
  let daysAdded = 0;
  let currentDate = new Date(date);
  
  while (daysAdded < days) {
    currentDate = addDays(currentDate, 1);
    if (!isWeekend(currentDate)) {
      daysAdded++;
    }
  }
  
  return currentDate;
};

/**
 * Calculates the end date given a start date and duration in business days
 * @param startDate The starting date
 * @param durationInBusinessDays Duration in business days
 * @returns The calculated end date
 */
export const calculateEndDate = (startDate: Date, durationInBusinessDays: number): Date => {
  return addBusinessDays(startDate, durationInBusinessDays);
};

/**
 * Checks if a date is a business day (Monday-Friday)
 * @param date The date to check
 * @returns True if the date is a business day
 */
export const isBusinessDay = (date: Date): boolean => {
  return !isWeekend(date);
};

/**
 * Calculates the total duration of a project in business days
 * @param startDate Project start date
 * @param endDate Project end date
 * @returns Number of business days
 */
export const calculateBusinessDaysDuration = (startDate: Date, endDate: Date): number => {
  return differenceInBusinessDays(endDate, startDate);
};

/**
 * Adjusts a date to the next business day if it falls on a weekend
 * @param date The date to adjust
 * @returns The adjusted date (same date if already a business day)
 */
export const adjustToBusinessDay = (date: Date): Date => {
  let adjustedDate = new Date(date);
  
  while (isWeekend(adjustedDate)) {
    adjustedDate = addDays(adjustedDate, 1);
  }
  
  return adjustedDate;
};

/**
 * Safely parses a date from various formats and ensures it's a valid business day
 * @param dateInput Date input (can be string, Date object, timestamp, etc.)
 * @param fallbackDate Fallback date to use if parsing fails
 * @param adjustToBusinessDays Whether to adjust weekend dates to business days
 * @returns A valid Date object or null if parsing fails and no fallback provided
 */
export const ensureValidDate = (
  dateInput: any, 
  fallbackDate?: Date, 
  adjustToBusinessDays: boolean = true
): Date | null => {
  let result: Date | null = null;
  
  try {
    if (dateInput === null || dateInput === undefined) {
      result = fallbackDate || null;
    } else if (dateInput instanceof Date) {
      if (isValid(dateInput)) {
        result = new Date(dateInput);
      } else {
        result = fallbackDate || null;
      }
    } else if (typeof dateInput === 'string') {
      // Try to parse ISO string
      const parsedDate = parseISO(dateInput);
      if (isValid(parsedDate)) {
        result = parsedDate;
      } else {
        // Try to parse as timestamp
        const timestamp = Date.parse(dateInput);
        if (!isNaN(timestamp)) {
          result = new Date(timestamp);
        } else {
          result = fallbackDate || null;
        }
      }
    } else if (typeof dateInput === 'number') {
      // Handle timestamp
      const date = new Date(dateInput);
      if (isValid(date)) {
        result = date;
      } else {
        result = fallbackDate || null;
      }
    } else {
      result = fallbackDate || null;
    }
    
    // Adjust to business day if needed
    if (result && adjustToBusinessDays && isWeekend(result)) {
      result = adjustToBusinessDay(result);
    }
    
    return result;
  } catch (error) {
    console.error('Error ensuring valid date:', error);
    return fallbackDate || null;
  }
}; 