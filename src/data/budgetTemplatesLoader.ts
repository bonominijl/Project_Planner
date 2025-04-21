import { ResourceType } from '../types/projectTypes';
import budgetTemplatesData from './budgetTemplates.json';

export interface TemplateActivity {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  durationHours: number;
  resourceType: ResourceType;
  canHaveRevisions: boolean;
  defaultRevisions: number;
  visibleOnCalendar?: boolean;
}

export interface TemplateStage {
  id: string;
  name: string;
  description: string;
  activities: TemplateActivity[];
  isMilestone: boolean;
}

export interface BudgetTemplate {
  id: string;
  name: string;
  budgetAmount: number;
  description: string;
  stages?: TemplateStage[];
  totalDays: number;
}

// Extract the templates array from the JSON data with proper typing
export const budgetTemplates: BudgetTemplate[] = budgetTemplatesData as BudgetTemplate[];

// Helper function to get a template by budget amount
export const getTemplateByBudget = (budget: number): BudgetTemplate => {
  const exactMatch = budgetTemplates.find(template => template.budgetAmount === budget);
  if (exactMatch) {
    return exactMatch;
  }
  
  // If no exact match, find the template with the closest budget
  return budgetTemplates.reduce((prev, curr) => {
    return Math.abs(curr.budgetAmount - budget) < Math.abs(prev.budgetAmount - budget) 
      ? curr 
      : prev;
  });
};

// Helper function to get a template by ID
export const getTemplateById = (id: string): BudgetTemplate | undefined => {
  return budgetTemplates.find(template => template.id === id);
}; 