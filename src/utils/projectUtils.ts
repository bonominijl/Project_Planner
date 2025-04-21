import { 
  ProjectPlan,
  ProjectActivity,
  ActivityType
} from '../types/projectTypes';
import { 
  calculateEndDate,
  adjustToBusinessDay,
  ensureValidDate
} from './dateUtils';

/**
 * Calculates the timeline for all activities in a project
 * @param plan The project plan with activities
 * @param startDate The project start date
 * @returns Updated project plan with start/end dates for all activities
 */
export const calculateProjectTimeline = (plan: ProjectPlan, startDate: Date): ProjectPlan => {
  // Ensure start date is valid
  const validStartDate = ensureValidDate(startDate);
  if (!validStartDate) {
    return plan;
  }

  const updatedPlan = { ...plan };
  const activityMap = new Map<ActivityType, ProjectActivity>();
  
  // Initial pass - setup the activity map
  updatedPlan.activities.forEach(activity => {
    activityMap.set(activity.type, { 
      ...activity,
      // Ensure activity dates are valid
      startDate: ensureValidDate(activity.startDate),
      endDate: ensureValidDate(activity.endDate)
    });
  });
  
  // Sort activities based on dependencies while trying to maintain user-defined order
  const sortedActivities = maintainOrderAndDependencies(updatedPlan.activities);
  
  // Calculate dates for each activity in order
  let currentDate = new Date(validStartDate);
  currentDate = adjustToBusinessDay(currentDate);
  
  sortedActivities.forEach(activity => {
    const updatedActivity = { ...activity };
    
    // Find the latest end date from dependencies
    if (activity.type && getActivityDependencies(activity.type)) {
      const dependencies = getActivityDependencies(activity.type);
      if (dependencies && dependencies.length > 0) {
        dependencies.forEach(depType => {
          const dep = activityMap.get(depType);
          if (dep && dep.endDate) {
            const depEndDate = new Date(dep.endDate);
            if (depEndDate > currentDate) {
              currentDate = new Date(depEndDate);
            }
          }
        });
      }
    }
    
    // Set start date to current date
    updatedActivity.startDate = new Date(currentDate);
    
    // Calculate end date based on duration
    updatedActivity.endDate = calculateEndDate(currentDate, updatedActivity.duration);
    
    // Update in the map
    activityMap.set(updatedActivity.type, updatedActivity);
    
    // Move current date to the end of this activity
    if (updatedActivity.endDate) {
      currentDate = new Date(updatedActivity.endDate);
    }
  });
  
  // Update activities in the plan while preserving original order
  const updatedActivities = updatedPlan.activities.map(activity => 
    activityMap.get(activity.type) || activity
  );
  updatedPlan.activities = updatedActivities;
  
  // Set project end date to the latest activity end date
  updatedPlan.startDate = validStartDate;
  updatedPlan.endDate = findLatestEndDate(updatedPlan.activities);
  
  return updatedPlan;
};

/**
 * Gets the dependencies for a specific activity type
 * @param activityType The activity type to get dependencies for
 * @returns Array of activity types that this activity depends on
 */
export const getActivityDependencies = (activityType: ActivityType): ActivityType[] => {
  // Define a complete mapping of all activity types to their dependencies
  const activityDependencies: Record<ActivityType, ActivityType[]> = {
    // Original activities
    scriptwriting: [],
    storyboarding: ['scriptwriting'],
    voiceover: ['scriptwriting'],
    animation: ['storyboarding', 'voiceover'],
    sound_design: ['animation'],
    feedback_review: ['animation', 'sound_design'],
    revisions: ['feedback_review'],
    final_delivery: ['revisions'],
    
    // Discovery activities
    kickoff_meeting: [],
    client_interview: ['kickoff_meeting'],
    research: ['client_interview'],
    
    // Additional creative activities
    voice_talent: ['scriptwriting'],
    style_frames: ['scriptwriting'],
    character_design: ['style_frames'],
    
    // Additional production activities
    advanced_animation: ['animation', 'character_design'],
    color_grading: ['animation'],
    custom_music: ['sound_design']
  };
  
  return activityDependencies[activityType] || [];
};

/**
 * Finds the latest end date from all activities
 * @param activities List of project activities
 * @returns The latest end date or null if no end dates are set
 */
export const findLatestEndDate = (activities: ProjectActivity[]): Date | null => {
  let latestDate: Date | null = null;
  
  activities.forEach(activity => {
    if (activity.endDate) {
      if (!latestDate || activity.endDate > latestDate) {
        latestDate = new Date(activity.endDate);
      }
    }
  });
  
  return latestDate;
};

/**
 * Sorts activities based on dependencies while attempting to maintain user-defined order
 * @param activities The activities to sort
 * @returns Sorted array of activities
 */
export const maintainOrderAndDependencies = (activities: ProjectActivity[]): ProjectActivity[] => {
  // Create a dependency graph for topological sorting
  const graph: Map<ActivityType, Set<ActivityType>> = new Map();
  const activityMap = new Map<ActivityType, ProjectActivity>();
  
  // Initialize the graph with empty dependency sets
  activities.forEach(activity => {
    graph.set(activity.type, new Set());
    activityMap.set(activity.type, activity);
  });
  
  // Populate the dependency graph
  activities.forEach(activity => {
    const dependencies = getActivityDependencies(activity.type);
    dependencies.forEach(depType => {
      // Only add dependencies that exist in our activity list
      if (activityMap.has(depType)) {
        const dependents = graph.get(activity.type);
        if (dependents) {
          dependents.add(depType);
        }
      }
    });
  });
  
  // Find activities with no dependencies (in the current set)
  const noDepActivities: ActivityType[] = [];
  graph.forEach((deps, actType) => {
    if (deps.size === 0) {
      noDepActivities.push(actType);
    }
  });
  
  // Create a result array that will hold activities in a valid order
  const result: ProjectActivity[] = [];
  const resultTypes = new Set<ActivityType>();
  
  // First add activities with no dependencies in their original order
  activities.forEach(activity => {
    if (noDepActivities.includes(activity.type) && !resultTypes.has(activity.type)) {
      result.push(activity);
      resultTypes.add(activity.type);
    }
  });
  
  // Now add the rest of the activities in their original order, but only if their dependencies are met
  let lastSize = 0;
  
  // Keep trying to add activities until we can't add any more
  while (resultTypes.size > lastSize) {
    lastSize = resultTypes.size;
    
    activities.forEach(activity => {
      // Skip if already added
      if (resultTypes.has(activity.type)) {
        return;
      }
      
      // Check if all dependencies are met
      const dependencies = getActivityDependencies(activity.type);
      const allDependenciesMet = dependencies.every(dep => 
        !activityMap.has(dep) || resultTypes.has(dep)
      );
      
      if (allDependenciesMet) {
        result.push(activity);
        resultTypes.add(activity.type);
      }
    });
  }
  
  // If we couldn't add all activities, fall back to the original dependency-based sort
  if (resultTypes.size < activities.length) {
    return sortActivitiesByDependencies(activities);
  }
  
  return result;
};

/**
 * Sorts activities based on their dependencies
 * @param activities The activities to sort
 * @returns Sorted array of activities
 */
export const sortActivitiesByDependencies = (activities: ProjectActivity[]): ProjectActivity[] => {
  const result: ProjectActivity[] = [];
  const visited: Set<ActivityType> = new Set();
  const temp: Set<ActivityType> = new Set();
  
  // Create map of activities for easy lookup
  const activityMap = new Map<ActivityType, ProjectActivity>();
  activities.forEach(activity => {
    activityMap.set(activity.type, activity);
  });
  
  // Helper function for topological sort
  const visit = (activityType: ActivityType) => {
    if (temp.has(activityType)) {
      // Cycle detected, can't resolve dependencies
      return;
    }
    
    if (visited.has(activityType)) {
      return;
    }
    
    temp.add(activityType);
    
    const dependencies = getActivityDependencies(activityType);
    dependencies.forEach(depType => {
      visit(depType);
    });
    
    temp.delete(activityType);
    visited.add(activityType);
    
    const activity = activityMap.get(activityType);
    if (activity) {
      result.push(activity);
    }
  };
  
  // Start visit from each activity
  activities.forEach(activity => {
    if (!visited.has(activity.type)) {
      visit(activity.type);
    }
  });
  
  return result;
}; 