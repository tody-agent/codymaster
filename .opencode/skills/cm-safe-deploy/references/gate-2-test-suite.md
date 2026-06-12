# Gate 2 — Test Suite

> Validate behavior, not just syntax.

## Required Coverage Areas
| Category | Purpose |
|---|---|
| Frontend safety | syntax, integrity, corruption checks |
| Backend API | route behavior |
| Business logic | rules, transforms, calculations |
| i18n sync | key parity and drift |
| Integration | workflow coverage when practical |

## Script Convention
```json
{
  "scripts": {
    "test:gate": "vitest run --reporter=verbose"
  }
}
```

## Rule
- `test:gate` must pass with zero failures before later gates
- if tests are missing, that is a setup problem, not a reason to skip the gate

## Integration
Use `cm-quality-gate` when you need parser-based or evidence-focused validation patterns inside the test gate.
