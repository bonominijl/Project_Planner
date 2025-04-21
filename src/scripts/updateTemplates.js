/**
 * Script to update existing budgetTemplates.json file with visibleOnCalendar property
 */

const fs = require('fs');
const path = require('path');

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

// Path to budgetTemplates.json file
const templatesPath = path.join(__dirname, '../data/budgetTemplates.json');

// Read the existing file
let templates;
try {
  const fileContent = fs.readFileSync(templatesPath, 'utf8');
  templates = JSON.parse(fileContent);
} catch (err) {
  console.error('Error reading templates file:', err);
  process.exit(1);
}

// Update templates to include stages and activities with visibleOnCalendar
templates.forEach(template => {
  // Add stages if they don't exist
  if (!template.stages) {
    template.stages = [
      {
        id: 'planning',
        name: 'Planning',
        description: 'Initial project planning and discovery phase',
        activities: [],
        isMilestone: false
      },
      {
        id: 'pre_production',
        name: 'Pre-Production',
        description: 'Script and visual development phase',
        activities: [],
        isMilestone: true
      },
      {
        id: 'production',
        name: 'Production',
        description: 'Animation, sound design, and final delivery',
        activities: [],
        isMilestone: true
      }
    ];
  }
  
  // Update all activities with visibleOnCalendar property
  template.stages.forEach(stage => {
    stage.activities.forEach(activity => {
      if (activity.id) {
        // Add visibleOnCalendar property if not already present
        if (activity.visibleOnCalendar === undefined) {
          activity.visibleOnCalendar = visibleActivities.includes(activity.id);
        }
      }
    });
  });
});

// Write the updated file
try {
  fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2));
  console.log(`Updated ${templatesPath} with visibleOnCalendar property`);
} catch (err) {
  console.error('Error writing updated templates file:', err);
  process.exit(1);
} 