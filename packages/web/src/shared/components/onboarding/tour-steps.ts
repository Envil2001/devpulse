import type { Step } from 'react-joyride';

export const TOUR_START_PATH = '/';

export interface TourDefinition {
  id: string;
  path: string;
  steps: Step[];
}

const target = (name: string): string => `[data-tour="${name}"]`;

export const TOURS: readonly TourDefinition[] = [
  {
    id: 'dashboard',
    path: '/',
    steps: [
      {
        id: 'sidebar',
        target: target('sidebar'),
        title: 'Navigation',
        content: 'Move between the dashboard, projects, sessions, earnings and settings.',
        placement: 'right-start',
        isFixed: true,
      },
      {
        id: 'period-switcher',
        target: target('period-switcher'),
        title: 'Time range',
        content: 'Pick a period. Every number and chart on this page updates to match.',
        placement: 'bottom-end',
      },
      {
        id: 'stats-overview',
        target: target('stats-overview'),
        title: 'Period summary',
        content: 'Active time, focus score, number of sessions and your most-used language.',
        placement: 'bottom',
      },
      {
        id: 'system-status',
        target: target('system-status'),
        title: 'System status',
        content: 'Monitor your workspace health: tracked sessions, VS Code extension status, and data sync.',
        placement: 'bottom',
      },
      {
        id: 'ai-roi',
        target: target('ai-roi'),
        title: 'AI Assistance & ROI',
        content:
          'Track how AI tools (Copilot, Claude, Aider) boost your coding speed and how many hours you save.',
        placement: 'bottom',
      },
      {
        id: 'comparison',
        target: target('comparison'),
        title: 'Period comparison',
        content: 'Compare your current productivity with the previous period to see your progress.',
        placement: 'top',
      },
      {
        id: 'activity-chart',
        target: target('activity-chart'),
        title: 'Activity chart',
        content: 'How your coding time is distributed across the selected period.',
        placement: 'top',
      },
      {
        id: 'heatmap',
        target: target('heatmap'),
        title: 'Activity heatmap',
        content: 'A year-long visual heatmap of your coding consistency, streaks and active days.',
        placement: 'top',
      },
      {
        id: 'recent-sessions',
        target: target('recent-sessions'),
        title: 'Recent sessions',
        content: 'Your latest tracked sessions at a glance.',
        placement: 'top',
      },
      {
        id: 'terminal-activity',
        target: target('terminal-activity'),
        title: 'Terminal activity',
        content:
          'Commands you ran in the selected period, with run count, average duration and success rate. Filter by tests, builds, lint, installs or git.',
        placement: 'top',
      },
      {
        id: 'ai-worklog',
        target: target('ai-worklog'),
        title: 'AI worklog',
        content:
          'Pick a date range and a format — daily log, standup or client report — then generate a day-by-day summary of your work. It needs an AI provider key, which you can add in Settings.',
        placement: 'top',
      },
      {
        id: 'breakdown',
        target: target('breakdown'),
        title: 'Branches and languages',
        content: 'See which branches and languages take most of your time.',
        placement: 'top',
      },
      {
        id: 'done',
        target: 'body',
        title: "You're all set",
        content: 'Every page has its own short tour. You can replay them all from Settings.',
        placement: 'center',
      },
    ],
  },
  {
    id: 'projects',
    path: '/projects',
    steps: [
      {
        id: 'projects-search',
        target: target('projects-search'),
        title: 'Find a project',
        content: 'Search by name or remote URL. The counter shows how many repositories match.',
        placement: 'bottom-start',
      },
      {
        id: 'projects-list',
        target: target('projects-list'),
        title: 'Your repositories',
        content:
          'Every repository tracked by the VS Code extension appears here. Open one to see its active time, focus score and sessions.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'sessions',
    path: '/sessions',
    steps: [
      {
        id: 'sessions-summary',
        target: target('sessions-summary'),
        title: 'Session totals',
        content: 'Totals across your tracked sessions.',
        placement: 'bottom',
      },
      {
        id: 'sessions-filters',
        target: target('sessions-filters'),
        title: 'Search and filter',
        content: 'Search by project or branch, or narrow the log down to a single project.',
        placement: 'bottom-start',
      },
      {
        id: 'sessions-columns',
        target: target('sessions-columns'),
        title: 'Session log',
        content:
          'Each row shows when a session started, its project and branch, how long it lasted and its focus score.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'earnings',
    path: '/earnings',
    steps: [
      {
        id: 'earnings-rate',
        target: target('earnings-rate'),
        title: 'Set your rate',
        content:
          'Choose hourly or monthly, pick a currency and save. Monthly rates are converted using a 160-hour month.',
        placement: 'bottom-start',
      },
      {
        id: 'earnings-summary',
        target: target('earnings-summary'),
        title: 'What your focus is worth',
        content:
          'Earnings for the last 7 and 30 days are your active coding hours multiplied by your hourly rate.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'settings',
    path: '/settings',
    steps: [
      {
        id: 'api-keys',
        target: target('api-keys'),
        title: 'API keys',
        content: 'Create and manage the API keys used to connect your tools to DevPulse.',
        placement: 'bottom',
      },
      {
        id: 'settings-timezone',
        target: target('settings-timezone'),
        title: 'Timezone',
        content:
          'Used to calculate daily sessions and metrics, so set it to where you actually work.',
        placement: 'top',
      },
      {
        id: 'settings-openai',
        target: target('settings-openai'),
        title: 'OpenAI key',
        content: "Add your own key to enable AI summaries. It's only used for your own requests.",
        placement: 'top',
      },
      {
        id: 'settings-tour',
        target: target('settings-tour'),
        title: 'Replay the tour',
        content: 'Reset all page tours here whenever you want a refresher.',
        placement: 'top',
      },
    ],
  },
];

export function findTourByPath(pathname: string): TourDefinition | undefined {
  return TOURS.find((tour) => tour.path === pathname);
}

export function findTourById(id: string): TourDefinition | undefined {
  return TOURS.find((tour) => tour.id === id);
}
