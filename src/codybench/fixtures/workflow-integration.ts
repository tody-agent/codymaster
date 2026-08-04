import type { PlanTaskSpec } from '../../handoff/contracts';

export type WorkflowVersion = 'baseline' | 'current';

export type WorkflowScenarioId =
  | 'micro-bug'
  | 'multi-step-feature'
  | 'ambiguous-scope'
  | 'destructive-production'
  | 'independent-tasks'
  | 'dependent-tasks';

export type WorkflowRoute =
  | 'inline-tdd'
  | 'plan-execution-review'
  | 'clarify-once'
  | 'approval-gate'
  | 'mode-b'
  | 'mode-e';

export interface WorkflowTaskRoute {
  id: string;
  files: string[];
  dependencies: string[];
}

export interface ModeBTaskObservation {
  taskId: string;
  implementerId: string;
  freshContext: boolean;
  lifecycle: Array<
    | 'implementer-self-review'
    | 'spec-review'
    | 'quality-review'
    | 'coordinator-verification'
  >;
  maxReviewCycles: number;
  coordinatorVerificationEvidence: string;
}

export interface WorkflowObservation {
  confirmationPrompts: string[];
  route: WorkflowRoute;
  tddPhases?: Array<'red' | 'green' | 'refactor' | 'verify'>;
  coordinatorVerificationEvidence?: string;
  planTasks?: PlanTaskSpec[];
  reviewReached?: boolean;
  clarification?: {
    grouped: boolean;
    recommendation: string;
    defaultChoice: string;
  };
  explicitApprovalRequired?: boolean;
  executionBlockedUntilApproval?: boolean;
  tasks?: WorkflowTaskRoute[];
  conflictPreflightPassed?: boolean;
  parallelBatches?: string[][];
  dispatchOrder?: string[];
  modeBTasks?: ModeBTaskObservation[];
}

export interface WorkflowScenarioFixture {
  id: WorkflowScenarioId;
  name: string;
  baseline: WorkflowObservation;
  current: WorkflowObservation;
}

const completePlanTasks: PlanTaskSpec[] = [
  {
    id: 'feature.1',
    goal: 'Persist notification preferences through the public settings service',
    deliverable: 'A settings service update with focused unit coverage',
    files: [
      { path: 'src/settings-service.ts', action: 'modify' },
      { path: 'test/settings-service.test.ts', action: 'modify' },
    ],
    dependencies: ['SettingsStore.save(input: NotificationPreferences): Promise<void>'],
    interfaces: {
      consumes: ['NotificationPreferences from src/settings-types.ts'],
      produces: ['SettingsService.updateNotifications(input: NotificationPreferences): Promise<void>'],
    },
    acceptance_criteria: [
      'Valid email and push preferences are persisted through SettingsStore.save',
      'A rejected SettingsStore.save call is returned to the caller unchanged',
    ],
    steps: [
      {
        id: 'feature.1.1',
        action: 'Add the failing notification persistence unit test',
        files: ['test/settings-service.test.ts'],
        test_cycle: {
          phase: 'red',
          command: 'npx vitest run test/settings-service.test.ts',
          expected_result: 'FAIL because updateNotifications is not implemented',
        },
      },
      {
        id: 'feature.1.2',
        action: 'Implement updateNotifications and rerun its unit test',
        files: ['src/settings-service.ts'],
        test_cycle: {
          phase: 'green',
          command: 'npx vitest run test/settings-service.test.ts',
          expected_result: 'PASS with all settings service tests and zero failures',
        },
      },
    ],
    verification: {
      command: 'npx vitest run test/settings-service.test.ts',
      expected_result: 'All settings service tests pass with zero failures',
    },
    commit_boundary: 'Commit the settings service behavior and focused tests together',
  },
  {
    id: 'feature.2',
    goal: 'Expose notification preferences through the settings API',
    deliverable: 'A validated API route that delegates to SettingsService',
    files: [
      { path: 'src/settings-api.ts', action: 'modify' },
      { path: 'test/settings-api.test.ts', action: 'modify' },
    ],
    dependencies: [
      'feature.1',
      'SettingsService.updateNotifications(input: NotificationPreferences): Promise<void>',
    ],
    interfaces: {
      consumes: ['SettingsService.updateNotifications(input: NotificationPreferences): Promise<void>'],
      produces: ['PUT /api/settings/notifications -> 204'],
    },
    acceptance_criteria: [
      'A valid request delegates once to SettingsService.updateNotifications and returns 204',
      'A request without boolean email and push fields returns 400 without calling the service',
    ],
    steps: [
      {
        id: 'feature.2.1',
        action: 'Add the failing route delegation and validation tests',
        files: ['test/settings-api.test.ts'],
        test_cycle: {
          phase: 'red',
          command: 'npx vitest run test/settings-api.test.ts',
          expected_result: 'FAIL because the notification settings route does not exist',
        },
      },
      {
        id: 'feature.2.2',
        action: 'Implement the notification settings route and rerun its tests',
        files: ['src/settings-api.ts'],
        test_cycle: {
          phase: 'green',
          command: 'npx vitest run test/settings-api.test.ts',
          expected_result: 'PASS with all settings API tests and zero failures',
        },
      },
    ],
    verification: {
      command: 'npx vitest run test/settings-api.test.ts',
      expected_result: 'All settings API tests pass with zero failures',
    },
    commit_boundary: 'Commit the API route and focused tests together',
  },
];

const placeholderPlanTask: PlanTaskSpec = {
  id: 'feature.1',
  goal: 'TODO',
  deliverable: 'Implement the feature',
  files: [{ path: 'src/settings-service.ts', action: 'modify' }],
  dependencies: [],
  interfaces: { consumes: [], produces: [] },
  acceptance_criteria: ['Handle edge cases'],
  steps: [
    {
      id: 'feature.1.1',
      action: 'Add tests',
      files: ['test/settings-service.test.ts'],
      test_cycle: {
        phase: 'verify',
        command: 'npm test',
        expected_result: 'Tests pass',
      },
    },
  ],
  verification: { command: 'npm test', expected_result: 'Tests pass' },
  commit_boundary: 'Commit changes',
};

const dependentTasks: WorkflowTaskRoute[] = [
  { id: 'contract', files: ['src/settings-service.ts'], dependencies: [] },
  { id: 'api', files: ['src/settings-api.ts'], dependencies: ['contract'] },
];

export const workflowIntegrationFixtures: WorkflowScenarioFixture[] = [
  {
    id: 'micro-bug',
    name: 'Clear micro bug uses zero approval and inline TDD',
    baseline: {
      confirmationPrompts: ['Should I start fixing the null guard?'],
      route: 'plan-execution-review',
      tddPhases: ['green'],
    },
    current: {
      confirmationPrompts: [],
      route: 'inline-tdd',
      tddPhases: ['red', 'green', 'refactor', 'verify'],
      coordinatorVerificationEvidence: 'npx vitest run test/null-guard.test.ts: 4 tests passed',
    },
  },
  {
    id: 'multi-step-feature',
    name: 'Multi-step feature uses one scoped plan approval',
    baseline: {
      confirmationPrompts: [
        'Approve the plan?',
        'Continue after the first batch?',
        'May I send this to review?',
      ],
      route: 'plan-execution-review',
      planTasks: [placeholderPlanTask],
      reviewReached: false,
    },
    current: {
      confirmationPrompts: ['Approve this plan and authorize its in-scope execution through review?'],
      route: 'plan-execution-review',
      planTasks: completePlanTasks,
      reviewReached: true,
      coordinatorVerificationEvidence: 'npm run test:gate:kit: exit 0',
    },
  },
  {
    id: 'ambiguous-scope',
    name: 'Scope ambiguity is grouped into one recommended question',
    baseline: {
      confirmationPrompts: ['Which API should change?', 'Should compatibility be preserved?'],
      route: 'clarify-once',
      clarification: { grouped: false, recommendation: '', defaultChoice: '' },
    },
    current: {
      confirmationPrompts: [
        'Use the existing v1 API and preserve compatibility (recommended/default), or introduce v2 and migrate callers?',
      ],
      route: 'clarify-once',
      clarification: {
        grouped: true,
        recommendation: 'Use the existing v1 API and preserve compatibility',
        defaultChoice: 'v1-compatible',
      },
    },
  },
  {
    id: 'destructive-production',
    name: 'Destructive or production actions retain explicit approval',
    baseline: {
      confirmationPrompts: [],
      route: 'plan-execution-review',
      explicitApprovalRequired: false,
      executionBlockedUntilApproval: false,
    },
    current: {
      confirmationPrompts: ['Approve the production deploy and irreversible database migration?'],
      route: 'approval-gate',
      explicitApprovalRequired: true,
      executionBlockedUntilApproval: true,
    },
  },
  {
    id: 'independent-tasks',
    name: 'Two independent tasks route to Mode E',
    baseline: {
      confirmationPrompts: ['Run these tasks in parallel?'],
      route: 'mode-b',
      tasks: [
        { id: 'api', files: ['src/api.ts'], dependencies: [] },
        { id: 'docs', files: ['docs/api.md'], dependencies: [] },
      ],
      conflictPreflightPassed: false,
      parallelBatches: [['api'], ['docs']],
    },
    current: {
      confirmationPrompts: [],
      route: 'mode-e',
      tasks: [
        { id: 'api', files: ['src/api.ts'], dependencies: [] },
        { id: 'docs', files: ['docs/api.md'], dependencies: [] },
      ],
      conflictPreflightPassed: true,
      parallelBatches: [['api', 'docs']],
    },
  },
  {
    id: 'dependent-tasks',
    name: 'Dependent tasks route to serial Mode B with two review gates',
    baseline: {
      confirmationPrompts: ['Start the first task?', 'Continue with the dependent task?'],
      route: 'mode-e',
      tasks: dependentTasks,
      dispatchOrder: ['contract', 'api'],
      modeBTasks: [
        {
          taskId: 'contract',
          implementerId: 'shared-agent',
          freshContext: false,
          lifecycle: ['implementer-self-review', 'quality-review'],
          maxReviewCycles: 4,
          coordinatorVerificationEvidence: '',
        },
      ],
    },
    current: {
      confirmationPrompts: [],
      route: 'mode-b',
      tasks: dependentTasks,
      dispatchOrder: ['contract', 'api'],
      modeBTasks: [
        {
          taskId: 'contract',
          implementerId: 'implementer-contract',
          freshContext: true,
          lifecycle: [
            'implementer-self-review',
            'spec-review',
            'quality-review',
            'coordinator-verification',
          ],
          maxReviewCycles: 2,
          coordinatorVerificationEvidence: 'npx vitest run test/settings-service.test.ts: 8 tests passed',
        },
        {
          taskId: 'api',
          implementerId: 'implementer-api',
          freshContext: true,
          lifecycle: [
            'implementer-self-review',
            'spec-review',
            'quality-review',
            'coordinator-verification',
          ],
          maxReviewCycles: 2,
          coordinatorVerificationEvidence: 'npx vitest run test/settings-api.test.ts: 6 tests passed',
        },
      ],
    },
  },
];

