import { describe, it, expect, beforeEach } from 'vitest';
import { abortChain, ChainExecution } from '../src/skill-chain';

describe('skill-chain', () => {
  describe('abortChain', () => {
    let mockExecution: ChainExecution;

    beforeEach(() => {
      mockExecution = {
        id: 'test-exec-1',
        chainId: 'chain-1',
        chainName: 'Test Chain',
        projectId: 'proj-1',
        taskTitle: 'Test Task',
        agent: 'test-agent',
        status: 'running',
        currentStepIndex: 1,
        startedAt: new Date(Date.now() - 10000).toISOString(),
        updatedAt: new Date(Date.now() - 5000).toISOString(),
        steps: [
          {
            index: 0,
            skill: 'skill-1',
            description: 'Completed Step',
            condition: 'always',
            optional: false,
            status: 'completed',
            startedAt: new Date(Date.now() - 10000).toISOString(),
            completedAt: new Date(Date.now() - 8000).toISOString(),
            output: 'Success',
          },
          {
            index: 1,
            skill: 'skill-2',
            description: 'Running Step',
            condition: 'always',
            optional: false,
            status: 'running',
            startedAt: new Date(Date.now() - 8000).toISOString(),
          },
          {
            index: 2,
            skill: 'skill-3',
            description: 'Pending Step',
            condition: 'always',
            optional: false,
            status: 'pending',
          },
          {
            index: 3,
            skill: 'skill-4',
            description: 'Failed Step',
            condition: 'always',
            optional: false,
            status: 'failed',
            startedAt: new Date(Date.now() - 10000).toISOString(),
            completedAt: new Date(Date.now() - 8000).toISOString(),
            error: 'Some error'
          },
          {
            index: 4,
            skill: 'skill-5',
            description: 'Skipped Step',
            condition: 'always',
            optional: true,
            status: 'skipped',
            completedAt: new Date(Date.now() - 8000).toISOString(),
          }
        ],
      };
    });

    it('should mark execution as aborted and set completion timestamps', () => {
      const originalUpdatedAt = mockExecution.updatedAt;
      abortChain(mockExecution);

      expect(mockExecution.status).toBe('aborted');
      expect(mockExecution.completedAt).toBeDefined();
      expect(mockExecution.updatedAt).not.toBe(originalUpdatedAt);

      // updatedAt and completedAt should be very close to each other
      expect(mockExecution.updatedAt).toBe(mockExecution.completedAt);
    });

    it('should mark pending and running steps as skipped and set completion timestamps', () => {
      abortChain(mockExecution);

      const runningStep = mockExecution.steps[1];
      const pendingStep = mockExecution.steps[2];

      expect(runningStep.status).toBe('skipped');
      expect(runningStep.completedAt).toBeDefined();
      expect(runningStep.completedAt).toBe(mockExecution.completedAt); // Use the timestamp generated in abortChain

      expect(pendingStep.status).toBe('skipped');
      expect(pendingStep.completedAt).toBeDefined();
      expect(pendingStep.completedAt).toBe(mockExecution.completedAt);
    });

    it('should not modify completed, failed, or already skipped steps', () => {
      const originalCompletedStep = { ...mockExecution.steps[0] };
      const originalFailedStep = { ...mockExecution.steps[3] };
      const originalSkippedStep = { ...mockExecution.steps[4] };

      abortChain(mockExecution);

      expect(mockExecution.steps[0]).toEqual(originalCompletedStep);
      expect(mockExecution.steps[3]).toEqual(originalFailedStep);
      expect(mockExecution.steps[4]).toEqual(originalSkippedStep);
    });

    it('should set the output of skipped steps to the reason if provided', () => {
      const reason = 'User requested abort';
      abortChain(mockExecution, reason);

      const runningStep = mockExecution.steps[1];
      const pendingStep = mockExecution.steps[2];

      expect(runningStep.output).toBe(`Aborted: ${reason}`);
      expect(pendingStep.output).toBe(`Aborted: ${reason}`);
    });

    it('should not set output on skipped steps if no reason is provided', () => {
      abortChain(mockExecution);

      const runningStep = mockExecution.steps[1];
      const pendingStep = mockExecution.steps[2];

      expect(runningStep.output).toBeUndefined();
      expect(pendingStep.output).toBeUndefined();
    });
  });
});
