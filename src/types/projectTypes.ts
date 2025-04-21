// Define the activities available in the project
import { BudgetTemplate } from '../data/budgetTemplates';

export type ActivityType = 
  | 'scriptwriting'
  | 'storyboarding'
  | 'voiceover'
  | 'animation'
  | 'sound_design'
  | 'feedback_review'
  | 'revisions'
  | 'final_delivery'
  | 'kickoff_meeting'
  | 'client_interview'
  | 'research'
  | 'voice_talent'
  | 'style_frames'
  | 'character_design'
  | 'advanced_animation'
  | 'color_grading'
  | 'custom_music';

// Define resource types for assignment
export type ResourceType =
  | 'writer'
  | 'designer'
  | 'voice_artist'
  | 'animator'
  | 'sound_engineer'
  | 'project_manager'
  | 'creative_director'
  | 'illustrator'
  | 'voiceover_artist'
  | 'sound_designer';

// Data for each activity type
export interface ActivityDefinition {
  id: ActivityType;
  name: string;
  description: string;
  defaultDuration: number; // in business days
  defaultHoursDuration?: number; // in hours
  canHaveRevisions: boolean;
  defaultRevisions: number;
  dependencies?: ActivityType[];
  defaultResourceType?: ResourceType; // default resource type for this activity
}

// The project activity with user-defined parameters
export interface ProjectActivity {
  type: ActivityType;
  duration: number; // in business days
  hoursDuration?: number; // in hours (more granular time estimation)
  revisions: number;
  startDate: Date | null;
  endDate: Date | null;
  originalEndDate?: Date | null; // Track the original planned end date before delays
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  assignedResource?: string;
  resourceType?: ResourceType; // Type of resource needed for this activity
  googleCalendarEventId?: string; // ID of the Google Calendar event if synchronized
  visibleOnCalendar?: boolean; // Controls whether this activity appears on calendar views
}

// The overall project plan
export interface ProjectPlan {
  id: string;
  name: string;
  projectName?: string; // Client-facing project name
  description?: string;
  startDate: Date | null;
  endDate: Date | null;
  originalEndDate?: Date | null; // Track original planned end date before delays
  activities: ProjectActivity[];
  client?: string;
  projectManager?: string;
  creator?: string; // Track who created the project
  googleCalendarId?: string; // ID of the Google Calendar for this project
  teamMembers?: { name: string; resourceType: ResourceType; email?: string }[];
  budget?: number; // Project budget
  clientReviewDays?: number; // Number of days for client review
  budgetTemplate?: BudgetTemplate; // Budget template for the project
}

// Default activity definitions
export const defaultActivities: ActivityDefinition[] = [
  {
    id: 'scriptwriting',
    name: 'Script Writing',
    description: 'Create the script for the explainer video',
    defaultDuration: 5,
    defaultHoursDuration: 20, // Assuming 4 hours per day on average
    canHaveRevisions: true,
    defaultRevisions: 2,
    defaultResourceType: 'writer'
  },
  {
    id: 'storyboarding',
    name: 'Storyboarding',
    description: 'Create visual storyboards based on the script',
    defaultDuration: 3,
    defaultHoursDuration: 18, // Assuming 6 hours per day on average
    canHaveRevisions: true,
    defaultRevisions: 2,
    dependencies: ['scriptwriting'],
    defaultResourceType: 'designer'
  },
  {
    id: 'voiceover',
    name: 'Voice Over Recording',
    description: 'Record the voice over for the video',
    defaultDuration: 2,
    defaultHoursDuration: 6, // Assuming 3 hours per day on average
    canHaveRevisions: true,
    defaultRevisions: 1,
    dependencies: ['scriptwriting'],
    defaultResourceType: 'voice_artist'
  },
  {
    id: 'animation',
    name: 'Animation',
    description: 'Animate the video based on storyboards',
    defaultDuration: 7,
    defaultHoursDuration: 42, // Assuming 6 hours per day on average
    canHaveRevisions: true,
    defaultRevisions: 2,
    dependencies: ['storyboarding', 'voiceover'],
    defaultResourceType: 'animator'
  },
  {
    id: 'sound_design',
    name: 'Sound Design',
    description: 'Add music and sound effects to the video',
    defaultDuration: 2,
    defaultHoursDuration: 10, // Assuming 5 hours per day on average
    canHaveRevisions: true,
    defaultRevisions: 1,
    dependencies: ['animation'],
    defaultResourceType: 'sound_engineer'
  },
  {
    id: 'feedback_review',
    name: 'Feedback Review',
    description: 'Review client feedback',
    defaultDuration: 1,
    defaultHoursDuration: 3, // Assuming 3 hours for this task
    canHaveRevisions: false,
    defaultRevisions: 0,
    dependencies: ['animation', 'sound_design'],
    defaultResourceType: 'project_manager'
  },
  {
    id: 'revisions',
    name: 'Revisions',
    description: 'Make revisions based on feedback',
    defaultDuration: 3,
    defaultHoursDuration: 15, // Assuming 5 hours per day on average
    canHaveRevisions: true,
    defaultRevisions: 0,
    dependencies: ['feedback_review'],
    defaultResourceType: 'animator' // Could vary based on what needs revision
  },
  {
    id: 'final_delivery',
    name: 'Final Delivery',
    description: 'Deliver the final video',
    defaultDuration: 1,
    defaultHoursDuration: 2, // Assuming 2 hours for this task
    canHaveRevisions: false,
    defaultRevisions: 0,
    dependencies: ['revisions'],
    defaultResourceType: 'project_manager'
  },
]; 