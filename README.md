# Epipheo Project Planner

A web application tool for creating project completion plans, schedules, and calendars for Epipheo video projects. This tool helps project managers plan activities like feedback reviews, revisions, animation, voice-overs, etc., and generates a comprehensive timeline from start to finish.

## Features

- Select required project activities from a pre-defined list
- Configure duration and revisions for each activity
- Automatically calculate project timeline based on dependencies
- View and modify the timeline as project needs change
- Update project plans when customers need additional revisions or miss deadlines
- (Future) Integration with Google Calendar for resource scheduling

## Installation

1. Clone this repository
2. Install dependencies:

```bash
cd Epipheo-Project-Planner
npm install
```

3. Start the development server:

```bash
npm start
```

The application will open in your browser at http://localhost:3000

## Usage

1. **Select Activities**: Choose which activities are required for your project. Default activities include scriptwriting, storyboarding, voice-over recording, animation, sound design, feedback review, revisions, and final delivery.

2. **Configure Timeline**: Set the start date for your project and adjust the duration and number of revisions for each activity. The application will automatically calculate the timeline based on activity dependencies.

3. **Modify Timeline**: As the project progresses, you can update activity status and adjust durations/revisions to keep the timeline up-to-date.

## Built With

- React
- TypeScript
- Material UI
- date-fns for date manipulation

## Future Enhancements

- Google Calendar integration
- Resource availability checking
- Email notifications for upcoming deadlines
- Client portal for timeline viewing

## License

This project is licensed under the MIT License. 