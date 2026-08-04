---
title: Workflow Integration Benchmark
description: Reproducible fixtures for planning quality, confirmation policy, execution routing, safety, and Mode B lifecycle behavior.
keywords: codybench workflow integration planning confirmation mode b mode e
robots: index, follow
---

# Workflow Integration Benchmark

The `workflow-integration` CodyBench suite is a deterministic regression benchmark for the planning, autonomy, and subagent lifecycle contracts. Run it with:

```bash
cm bench --suite workflow-integration --runs 1
```

It evaluates typed baseline and current observations without network access or model credentials. Current scoring is independently grounded in the shipped planning skill, autonomy policy, `/plan` and `/build` commands, execution-mode references, and all 14 platform copies. For Mode B, it also executes `orchestrateModeB` with two dependent rich-plan tasks and a deterministic harness, proving the real coordinator orders fresh implementers, spec review, quality review, and final verification. The baseline is a deliberately encoded representation of pre-upgrade behavior patterns, not an aggregate of historical production transcripts.

## Scenario results

| Scenario | Baseline confirmations | Current confirmations | Current invariant |
|---|---:|---:|---|
| Clear micro bug | 1 | 0 | Inline RED → GREEN → VERIFY with fresh evidence |
| Multi-step feature | 3 | 1 | One plan approval authorizes execution through review |
| Ambiguous scope | 2 | 1 | One grouped question with recommendation and default |
| Destructive/production action | 0 | 1 | Explicit approval gate blocks execution until approved |
| Two independent tasks | 1 | 0 | Mode E after file/dependency conflict pre-flight |
| Dependent tasks | 2 | 0 | Serial Mode B with fresh implementers and two review gates |
| **Total** | **9** | **3** | Normal multi-step flow never exceeds one confirmation |

The current fixture also requires every rich plan task to include exact file actions, named consumed/produced interfaces, literal acceptance criteria, step-level test commands and expected results, coordinator verification, and a commit boundary. Placeholder language makes the benchmark fail.

For Mode B, each task must record a fresh implementer, implementer self-review, spec review before quality review, a maximum of two fix/re-review cycles, and coordinator-owned verification evidence. Distinct task IDs must use distinct initial implementer sessions.

The executable Mode B probe additionally reports `actual_mode_b_tasks_completed`, `actual_mode_b_distinct_implementers`, `actual_mode_b_lifecycle_coverage_pct`, and `actual_mode_b_coordinator_verification_pct`. A probe or artifact-contract failure enters the combined violations and lowers `deterministic_checks_passed_pct` and the top-level score even if the static fixture is internally consistent.

## Metrics

Deterministic metrics are exact for the committed fixtures:

- confirmation prompt counts;
- complete rich-plan task percentage;
- Mode B lifecycle coverage;
- Mode B/Mode E routing accuracy;
- explicit safety-approval coverage;
- invariant pass percentage.

`interaction_turn_proxy` approximates conversational overhead as scenario starts plus confirmation prompts. `lifecycle_event_proxy` counts recorded TDD and review events. These two values are proxies only: they do not claim measured token usage, API latency, model quality, or wall-clock duration. Live model runs require a separate, nondeterministic evaluation and must not replace this CI guard.
