/**
 * Handoff JSON contracts for the sprint flow (v2.0).
 *
 * Each sprint phase emits a typed handoff JSON under `.cm/handoff/`.
 * Downstream skills read the predecessor's handoff to pick up cold,
 * eliminating re-derivation cost.
 *
 * Schema versioning: every contract has a `schema: "<name>@<n>"` field.
 * Bump @n on breaking change; readers should reject unknown majors.
 */

export type HandoffSchema =
  | 'intent@1'
  | 'plan@1'
  | 'exec@1'
  | 'review@1'
  | 'quality@1'
  | 'retro@1'
  | 'party@1';

export interface HandoffEnvelope<T> {
  schema: HandoffSchema;
  emitted_at: string; // ISO timestamp
  emitted_by: string; // skill name (e.g., "cm-planning")
  data: T;
}

export interface IntentHandoff {
  schema: 'intent@1';
  emitted_at: string;
  emitted_by: string;
  data: {
    problem: string;
    success_criteria: string[];
    constraints: string[];
    options_considered: Array<{ name: string; tradeoff: string }>;
    chosen_option?: string;
  };
}

export interface PlanFileSpec {
  path: string;
  action: 'create' | 'modify' | 'delete';
}

export interface PlanTaskInterfaces {
  consumes: string[];
  produces: string[];
}

export interface PlanStepTestCycle {
  phase: 'red' | 'green' | 'refactor' | 'verify';
  command: string;
  expected_result: string;
}

export interface PlanTaskStep {
  id: string;
  /** One concrete action sized for roughly 2–5 minutes. */
  action: string;
  files: string[];
  test_cycle: PlanStepTestCycle;
}

/** A self-contained deliverable that can pass or fail review independently. */
export interface PlanTaskSpec {
  id: string;
  goal: string;
  deliverable: string;
  files: PlanFileSpec[];
  dependencies: string[];
  interfaces: PlanTaskInterfaces;
  acceptance_criteria: string[];
  steps: PlanTaskStep[];
  verification: {
    command: string;
    expected_result: string;
  };
  commit_boundary: string;
}

export interface PlanHandoff {
  schema: 'plan@1';
  emitted_at: string;
  emitted_by: string;
  data: {
    goal: string;
    decisions: string[];
    first_tasks: string[]; // task IDs e.g. ["1.1", "1.2", "1.3"]
    /**
     * Execution-ready task payload. Optional so existing plan@1 handoffs that
     * only contain `first_tasks` remain readable.
     */
    task_specs?: PlanTaskSpec[];
    openspec_path?: string;
    risks?: string[];
  };
}

export interface ExecHandoff {
  schema: 'exec@1';
  emitted_at: string;
  emitted_by: string;
  data: {
    completed_tasks: string[];
    pending_tasks: string[];
    files_changed: string[];
    test_status: 'pass' | 'fail' | 'partial' | 'skipped';
    notes?: string[];
  };
}

export interface ReviewHandoff {
  schema: 'review@1';
  emitted_at: string;
  emitted_by: string;
  data: {
    verdict: 'approve' | 'request_changes' | 'block';
    findings: Array<{
      severity: 'info' | 'warn' | 'error' | 'critical';
      file?: string;
      line?: number;
      message: string;
    }>;
    must_fix_count: number;
  };
}

export interface QualityHandoff {
  schema: 'quality@1';
  emitted_at: string;
  emitted_by: string;
  data: {
    gates_passed: string[];
    gates_failed: string[];
    vibecoding_score?: number; // 0..100, populated when index runs
    safe_to_ship: boolean;
    evidence: Record<string, string>; // gate name -> evidence pointer
  };
}

export interface RetroHandoff {
  schema: 'retro@1';
  emitted_at: string;
  emitted_by: string;
  data: {
    sprint_id: string;
    learnings: Array<{
      type: 'pitfall' | 'preference' | 'pattern' | 'fact';
      scope: string; // e.g. "deploy", "ui", "test"
      note: string;
    }>;
    duration_minutes?: number;
  };
}

export type PartyPersona = 'engineer' | 'reviewer' | 'architect' | 'security' | 'pm';

export interface PartyRound {
  persona: PartyPersona;
  output: string;
  verdict?: 'pass' | 'revise' | 'block';
  ts: string;
}

export interface PartyHandoff {
  schema: 'party@1';
  emitted_at: string;
  emitted_by: string;
  data: {
    topic: string;
    /**
     * Sequential persona rotation. Each round captures one persona's
     * output for the same task; reviewer verdicts gate further rounds.
     * cm-execution Mode F (party) writes this in order.
     */
    rounds: PartyRound[];
    /** Final synthesized output after all rounds settle. */
    final?: string;
    /**
     * @deprecated kept for back-compat with earlier party@1 emitters.
     * New code should populate `rounds` instead.
     */
    personas?: Array<{
      name: PartyPersona;
      verdict: string;
      key_points: string[];
    }>;
    consensus?: string;
  };
}

export type AnyHandoff =
  | IntentHandoff
  | PlanHandoff
  | ExecHandoff
  | ReviewHandoff
  | QualityHandoff
  | RetroHandoff
  | PartyHandoff;

export const HANDOFF_FILENAMES: Record<HandoffSchema, string> = {
  'intent@1': 'intent.json',
  'plan@1': 'plan.json',
  'exec@1': 'exec.json',
  'review@1': 'review.json',
  'quality@1': 'quality.json',
  'retro@1': 'retro.json',
  'party@1': 'party.json',
};
