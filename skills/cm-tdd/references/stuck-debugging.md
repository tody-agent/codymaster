# Stuck / Debugging

> Use when the TDD loop stalls.

## When Stuck
- simplify the failing scenario
- isolate one behavior
- verify the test harness itself
- reduce mocks
- use `cm-debugging` if the root cause is unclear

## Escalation
- if repeated failures do not clarify the issue
- if you cannot produce a meaningful failing test
- if the system under test is too tangled to isolate quickly

## Rule
When blocked, simplify before expanding.
