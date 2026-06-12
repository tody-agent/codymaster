# Gate 1 — Syntax Validation

> Fast fail before slow tests. Catch parse and compile issues early.

## Use When
- every deploy path
- especially frontend-heavy projects where one syntax error can white-screen production

## Common Commands
| Stack | Command |
|---|---|
| Vanilla JS | `node -c path/to/app.js` |
| TypeScript | `npx tsc --noEmit` |
| Python | `python -m py_compile app.py` |
| Go | `go vet ./...` |

## Why This Gate Exists
- syntax checks are cheaper than test suites
- they produce precise failure locations
- they prevent wasting time on later gates when the build is already invalid

## Rule
If syntax fails, do not proceed to test or build gates.
