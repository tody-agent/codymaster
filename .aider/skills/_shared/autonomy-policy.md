# Autonomy and Confirmation Policy

Use this policy for planning and execution entry points. The objective is continuous, safe progress with one clear authorization boundary—not repeated confirmation loops.

## Decision Table

| Class | Default decision | Examples |
|---|---|---|
| Read-only or reversible, in-scope | Proceed automatically. | Inspect files, search code, run tests, edit planned files, refactor within acceptance criteria, create a local commit. |
| Clear micro task | Proceed with zero approval when the request itself authorizes the change and no sensitive action is involved. | Fix a typo, rename a local symbol, add one focused test, adjust a small style rule. |
| Meaningful implementation with a plan | Request one approval at the plan-to-execution boundary. Approval creates scoped execution authorization. | Add a feature across files, migrate a component, change an internal API. |
| Scope-changing ambiguity | Ask once, state the ambiguity, recommend an option, and give the default that will be used if the user delegates the choice. | Choosing between incompatible data models or adding an unrequested integration. |
| Destructive or irreversible action | Require explicit approval for the specific action, even when a plan was approved. | Delete data, force-push, reset history, remove an environment, irreversible migration. |
| Production deployment | Require explicit approval immediately before deploying to production. Preserve existing deploy safety gates. | Release, publish, production database migration, traffic cutover. |
| Secret or payment action | Require explicit approval and never expose secret material. | Rotate credentials, use a paid API, purchase a service, initiate or refund a payment. |
| External communication | Require explicit approval for the audience and message. | Send email, post publicly, message a customer, submit a third-party form. |

## Scoped Execution Authorization

Plan approval authorizes the stated outcome, files/components, acceptance criteria, and ordinary read-only or reversible implementation actions needed to deliver them. It includes tests, local edits, non-destructive dependency operations, refactoring inside scope, and verification. Execute that scope through verification without per-step or per-batch re-approval.

Authorization does not cover a material change to outcome, architecture, affected system, cost, audience, or risk class. When evidence requires such a change, pause once with the evidence, a recommendation, and a default. Obtain revised authorization before continuing outside the original scope.

Approval is not transferable to destructive or irreversible actions, production deployment, secret or payment actions, or external communication. Those actions always retain their explicit approval gates. Existing security, identity, quality, and deployment gates remain in force.

## Status and Pause Semantics

Progress reports are non-blocking status updates. After a batch or milestone, report what changed, verification evidence, and what is next, then continue inside the authorized scope.

Pause only when evidence shows one of these conditions:

- a blocker prevents safe progress after reasonable in-scope attempts;
- ambiguity would materially change scope or the approved plan;
- an action belongs to an explicit-approval class in the decision table;
- verification invalidates the plan and requires a material revision.

Do not turn project-level selection, execution-mode selection, task boundaries, batches, routine tool calls, or status updates into approval checkpoints.

## Consistent User Wording

- Plan boundary: “Approve this plan to authorize implementation through verification within the stated scope.”
- Ambiguity: “I recommend **A** because …; if you delegate the choice, I’ll use **A**.”
- Status: “Completed **X**; verification: **Y**. Continuing with **Z**.”
- Sensitive action: “This next action is **[destructive / production deploy / secret or payment / external communication]** and is outside the standing authorization. Approve this specific action?”
