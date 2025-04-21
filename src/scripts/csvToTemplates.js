/**
 * Script to convert budget CSV files to JSON templates
 * 
 * This script reads CSV files from the src/data/Budget Reference directory
 * and converts them to the format needed for budgetTemplates.json
 */

const fs = require('fs');
const path = require('path');

// List of activities to show on the calendar
const visibleActivities = [
  'kickoff',
  'scripting_handoff_01',
  'beats_01',
  'story_plan_01',
  'story_plan_01_client_review',
  'review_call_story_plan_01',
  'scripting_handoff_02',
  'beats_02',
  'story_plan_02',
  'story_plan_02_client_review',
  'review_call_story_plan_02',
  'scripting_handoff_03',
  'beats_03',
  'production_plan_01',
  'client_review',
  'review_call_production_plan_01',
  'handoff_04_beats_04',
  'production_plan_02',
  'client_review_production_plan_02',
  'review_call_production_plan_02',
  'animation_01',
  'music_composition',
  'sound_design_draft_01',
  'client_review_draft_01',
  'review_call_draft_01',
  'final'
];

// Map CSV activity names to standardized IDs
const activityNameToId = {
  'Kickoff': 'kickoff',
  'KO call': 'kickoff',
  'Scripting 01 + Verbal Beats': 'scripting_handoff_01',
  'CD Handoffs': 'scripting_handoff_02',
  'Beats 01 / Mood Boards': 'beats_01',
  'Beats 01': 'beats_01',
  'Story Plan 01': 'story_plan_01',
  'Story Plan 01 Review Call': 'review_call_story_plan_01',
  'Scripting 02 + Verbal Beats': 'scripting_handoff_02',
  'Scripting 02': 'scripting_handoff_02',
  'Beats 02': 'beats_02',
  'Story Plan 02': 'story_plan_02',
  'Story Plan 02 Review Call': 'review_call_story_plan_02',
  'Scripting 03': 'scripting_handoff_03',
  'Beats 03': 'beats_03',
  'Production Plan 01': 'production_plan_01',
  'Production Plan 01 Review Call': 'review_call_production_plan_01',
  'Beats 04': 'handoff_04_beats_04',
  'Production Plan 02': 'production_plan_02',
  'Production Plan 02 Review Call': 'review_call_production_plan_02',
  'Animation 01': 'animation_01',
  'Music Composition 01': 'music_composition',
  'Sound Design 01': 'sound_design_draft_01',
  'Animation 01 Review Call': 'review_call_draft_01',
  'Full Draft 01 Delivery': 'client_review_draft_01',
  'Final Delivery': 'final'
};

// Resource type mapping
const resourceTypeMap = {
  'Client Pre-KO': 'project_manager',
  'Research/Prep': 'researcher',
  'KO call': 'project_manager',
  'Kickoff Meeting': 'project_manager',
  'Scripting 01 + Verbal Beats': 'writer',
  'CD Handoffs': 'creative_director',
  'Beats 01 / Mood Boards': 'illustrator',
  'Beats 01': 'illustrator',
  'Story Plan 01': 'project_manager',
  'Story Plan 01 Review Call': 'project_manager',
  'Scripting 02 + Verbal Beats': 'writer',
  'Scripting 02': 'writer',
  'Beats 02': 'illustrator',
  'Story Plan 02': 'project_manager',
  'Story Plan 02 Review Call': 'project_manager',
  'Scripting 03': 'writer',
  'Beats 03': 'illustrator',
  'Production Plan 01': 'project_manager',
  'Production Plan 01 Review Call': 'project_manager',
  'Beats 04': 'illustrator',
  'Production Plan 02': 'project_manager',
  'Production Plan 02 Review Call': 'project_manager',
  'Animation 01': 'animator',
  'Music Composition 01': 'sound_designer',
  'Sound Design 01': 'sound_designer',
  'Animation 01 Review Call': 'project_manager',
  'Full Draft 01 Delivery': 'project_manager',
  'Final Delivery': 'project_manager'
};

// Function to convert hours to days (8 hours = 1 day)
function hoursToDays(hours) {
  return Math.ceil(parseFloat(hours) / 8);
}

// Parse CSV from the given file path
function parseCSV(filePath) {
  // Read file content and split into lines
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').map(line => line.trim()).filter(line => line !== '');

  // Initialize structures for collecting data
  const stages = {
    'PLANNING': [],
    'PRE-PRODUCTION': [],
    'PRODUCTION': []
  };
  
  let currentStage = null;
  let totalHours = 0;
  
  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cols = line.split(',').map(col => col.trim());
    
    // Check if this is a stage header
    if (cols[0] === 'PLANNING' || cols[0] === 'PRE-PRODUCTION' || cols[0] === 'PRODUCTION') {
      currentStage = cols[0];
      continue;
    }
    
    // Special case: PRODUCTION HOUSE / COMPANY MEETINGS are part of PRODUCTION
    if (cols[0] === 'PRODUCTION HOUSE / COMPANY MEETINGS' || cols[0] === 'COMPANY MEETINGS') {
      currentStage = 'PRODUCTION';
      continue;
    }
    
    // Skip headers, empty rows, or total rows
    if (!cols[0] || cols[0] === 'Total Hours' || !cols[1] || isNaN(parseFloat(cols[1]))) {
      continue;
    }
    
    // Activity name is in first column, hours in second column
    const activityName = cols[0];
    
    // Skip rows that are just numbers or have no name
    if (!isNaN(parseFloat(activityName)) || !activityName) {
      continue;
    }
    
    // Parse hours
    const hours = parseFloat(cols[1]);
    
    // Skip activities with zero or negative hours
    if (isNaN(hours) || hours <= 0) continue;
    
    totalHours += hours;
    
    // Generate ID for the activity
    let activityId = activityNameToId[activityName] || activityName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    
    // Create activity object
    const activity = {
      id: activityId,
      name: activityName,
      description: `${activityName}`,
      durationDays: hoursToDays(hours),
      durationHours: hours,
      resourceType: resourceTypeMap[activityName] || 'team_member',
      canHaveRevisions: activityName.toLowerCase().includes('review'),
      defaultRevisions: activityName.toLowerCase().includes('review') ? 1 : 0,
      visibleOnCalendar: visibleActivities.includes(activityId)
    };
    
    if (currentStage && stages[currentStage]) {
      stages[currentStage].push(activity);
    }
  }
  
  // Calculate total days
  const totalDays = Math.ceil(totalHours / 8);
  
  return { stages, totalHours, totalDays };
}

// Process all CSV files
function processCSVFiles() {
  const baseDir = path.join(__dirname, '../data/Budget Reference');
  const files = fs.readdirSync(baseDir).filter(file => file.endsWith('.csv'));
  
  const templates = [];
  
  for (const file of files) {
    const filePath = path.join(baseDir, file);
    const budgetMatch = file.match(/(\d+\.?\d*)k/i);
    if (!budgetMatch) continue;
    
    const budgetAmount = parseFloat(budgetMatch[1]) * 1000;
    const templateName = `${budgetAmount.toLocaleString()} Package`;
    
    console.log(`Processing ${file} for budget ${budgetAmount}`);
    
    // Parse CSV and get stages and hours
    const { stages, totalHours, totalDays } = parseCSV(filePath);
    
    // Check if we have any activities
    const hasActivities = Object.values(stages).some(activities => activities.length > 0);
    
    if (!hasActivities) {
      console.warn(`No activities found in ${file}`);
      continue;
    }
    
    // Convert stages to template format
    const templateStages = [];
    
    if (stages['PLANNING'].length > 0) {
      templateStages.push({
        id: 'planning',
        name: 'Planning',
        description: 'Initial project planning and discovery phase',
        activities: stages['PLANNING'],
        isMilestone: false
      });
    }
    
    if (stages['PRE-PRODUCTION'].length > 0) {
      templateStages.push({
        id: 'pre_production',
        name: 'Pre-Production',
        description: 'Script and visual development phase',
        activities: stages['PRE-PRODUCTION'],
        isMilestone: true
      });
    }
    
    if (stages['PRODUCTION'].length > 0) {
      templateStages.push({
        id: 'production',
        name: 'Production',
        description: 'Animation, sound design, and final delivery',
        activities: stages['PRODUCTION'],
        isMilestone: true
      });
    }
    
    // Create template object
    const template = {
      id: `budget_${budgetAmount}`,
      name: templateName,
      budgetAmount: budgetAmount,
      description: `A ${budgetAmount.toLocaleString()} package with comprehensive production services.`,
      stages: templateStages,
      totalDays: totalDays
    };
    
    templates.push(template);
  }
  
  // Sort templates by budget amount
  templates.sort((a, b) => a.budgetAmount - b.budgetAmount);
  
  return templates;
}

// Main execution
try {
  const templates = processCSVFiles();
  
  // Write templates to JSON file
  const outputPath = path.join(__dirname, '../data/budgetTemplates.json');
  fs.writeFileSync(outputPath, JSON.stringify(templates, null, 2));
  
  console.log(`Converted ${templates.length} budget templates to ${outputPath}`);
} catch (error) {
  console.error('Error processing templates:', error);
} 