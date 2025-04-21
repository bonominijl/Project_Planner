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
  visibleOnCalendar: boolean;
  startDate?: Date;
  endDate?: Date;
  status?: 'not_started' | 'in_progress' | 'completed' | 'delayed';
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

// Define the simplified template that comes from the JSON file
interface SimplifiedBudgetTemplate {
  id: string;
  name: string;
  budgetAmount: number;
  description: string;
  totalDays: number;
}

// Define template activities
const discoveryActivities: TemplateActivity[] = [
  {
    id: 'kickoff_meeting',
    name: 'Kickoff Meeting',
    description: 'Initial meeting to align on project goals and expectations',
    durationDays: 1,
    durationHours: 2,
    resourceType: 'project_manager',
    canHaveRevisions: false,
    defaultRevisions: 0,
    visibleOnCalendar: true
  },
  {
    id: 'client_interview',
    name: 'Client Interview',
    description: 'In-depth interview to understand client needs and vision',
    durationDays: 1,
    durationHours: 3,
    resourceType: 'creative_director',
    canHaveRevisions: false,
    defaultRevisions: 0,
    visibleOnCalendar: true
  },
  {
    id: 'research',
    name: 'Research & Discovery',
    description: 'Research into target audience, competition, and industry trends',
    durationDays: 2,
    durationHours: 8,
    resourceType: 'writer',
    canHaveRevisions: false,
    defaultRevisions: 0,
    visibleOnCalendar: true
  }
];

const creativeActivities: TemplateActivity[] = [
  {
    id: 'scriptwriting',
    name: 'Scriptwriting',
    description: 'Developing the script for the explainer video',
    durationDays: 3,
    durationHours: 6,
    resourceType: 'writer',
    canHaveRevisions: true,
    defaultRevisions: 2,
    visibleOnCalendar: true
  },
  {
    id: 'storyboarding',
    name: 'Storyboarding',
    description: 'Creating visual storyboards based on the approved script',
    durationDays: 4,
    durationHours: 6,
    resourceType: 'illustrator',
    canHaveRevisions: true,
    defaultRevisions: 1,
    visibleOnCalendar: true
  },
  {
    id: 'voice_talent',
    name: 'Voice Talent Selection',
    description: 'Selecting and directing voice talent for narration',
    durationDays: 1,
    durationHours: 4,
    resourceType: 'voiceover_artist',
    canHaveRevisions: true,
    defaultRevisions: 1,
    visibleOnCalendar: true
  }
];

const productionActivities: TemplateActivity[] = [
  {
    id: 'animation',
    name: 'Animation Production',
    description: 'Creating the animation based on approved storyboards',
    durationDays: 5,
    durationHours: 8,
    resourceType: 'animator',
    canHaveRevisions: true,
    defaultRevisions: 2,
    visibleOnCalendar: true
  },
  {
    id: 'sound_design',
    name: 'Sound Design',
    description: 'Creating and adding sound effects and music',
    durationDays: 2,
    durationHours: 6,
    resourceType: 'sound_designer',
    canHaveRevisions: true,
    defaultRevisions: 1,
    visibleOnCalendar: true
  },
  {
    id: 'revisions',
    name: 'Final Revisions',
    description: 'Final round of revisions based on client feedback',
    durationDays: 3,
    durationHours: 6,
    resourceType: 'animator',
    canHaveRevisions: false,
    defaultRevisions: 0,
    visibleOnCalendar: true
  },
  {
    id: 'final_delivery',
    name: 'Final Delivery',
    description: 'Finalizing and delivering the completed video',
    durationDays: 1,
    durationHours: 4,
    resourceType: 'project_manager',
    canHaveRevisions: false,
    defaultRevisions: 0,
    visibleOnCalendar: true
  }
];

// Enhanced activities for larger budgets
const enhancedCreativeActivities: TemplateActivity[] = [
  ...creativeActivities,
  {
    id: 'style_frames',
    name: 'Style Frames',
    description: 'Detailed visual style frames to establish the look and feel',
    durationDays: 2,
    durationHours: 8,
    resourceType: 'illustrator',
    canHaveRevisions: true,
    defaultRevisions: 1,
    visibleOnCalendar: true
  },
  {
    id: 'character_design',
    name: 'Character Design',
    description: 'Creating custom characters for the animation',
    durationDays: 3,
    durationHours: 6,
    resourceType: 'illustrator',
    canHaveRevisions: true,
    defaultRevisions: 1,
    visibleOnCalendar: true
  }
];

const enhancedProductionActivities: TemplateActivity[] = [
  ...productionActivities,
  {
    id: 'advanced_animation',
    name: 'Advanced Animation Effects',
    description: 'Creating complex animation sequences and special effects',
    durationDays: 3,
    durationHours: 8,
    resourceType: 'animator',
    canHaveRevisions: true,
    defaultRevisions: 1,
    visibleOnCalendar: true
  },
  {
    id: 'color_grading',
    name: 'Color Grading & Post-Production',
    description: 'Professional color grading and post-production enhancements',
    durationDays: 2,
    durationHours: 6,
    resourceType: 'animator',
    canHaveRevisions: true,
    defaultRevisions: 1,
    visibleOnCalendar: true
  }
];

// Premium activities for top-tier budgets
const premiumProductionActivities: TemplateActivity[] = [
  ...enhancedProductionActivities,
  {
    id: 'custom_music',
    name: 'Custom Music Composition',
    description: 'Original music composition for the video',
    durationDays: 3,
    durationHours: 8,
    resourceType: 'sound_designer',
    canHaveRevisions: true,
    defaultRevisions: 1,
    visibleOnCalendar: true
  }
];

// Map the JSON templates to the full BudgetTemplate format with stages
export const budgetTemplates: BudgetTemplate[] = budgetTemplatesData as BudgetTemplate[];

// Helper function to get a template by budget amount
export const getTemplateByBudget = (budget: number): BudgetTemplate => {
  // Find the exact match first
  const exactMatch = budgetTemplates.find(t => t.budgetAmount === budget);
  if (exactMatch) return exactMatch;
  
  // Find the closest match if no exact match
  return budgetTemplates.reduce((prev, curr) => {
    return Math.abs(curr.budgetAmount - budget) < Math.abs(prev.budgetAmount - budget) 
      ? curr 
      : prev;
  });
};

// Helper to decide whether an activity should be shown on the calendar
export const isActivityVisibleOnCalendar = (activityId: string): boolean => {
  // List of activities to show on the calendar
  const visibleActivities = [
    'kickoff',
    'kickoff_meeting',
    'ko_call',
    'scripting_handoff_01',
    'scripting_01',
    'beats_01',
    'story_plan_01',
    'story_plan_01_client_review',
    'review_call_story_plan_01',
    'scripting_handoff_02',
    'scripting_02',
    'beats_02',
    'story_plan_02',
    'story_plan_02_client_review',
    'review_call_story_plan_02',
    'scripting_handoff_03',
    'scripting_03',
    'beats_03',
    'production_plan_01',
    'client_review',
    'review_call_production_plan_01',
    'handoff_04_beats_04',
    'beats_04',
    'production_plan_02',
    'client_review_production_plan_02',
    'review_call_production_plan_02',
    'animation_01',
    'music_composition',
    'music_composition_01',
    'sound_design_draft_01',
    'sound_design_01',
    'client_review_draft_01',
    'review_call_draft_01',
    'animation_01_review_call',
    'final',
    'final_delivery'
  ];
  
  return visibleActivities.includes(activityId);
}; 