# Gates 4-5 — Build Verification and Dist Verification

> Validate the artifact you are actually about to ship.

## Gate 4 — Build
- run the production build
- confirm exit status is clean
- capture final warnings or errors

## Gate 5 — Dist
- verify expected dist assets exist
- verify entry files and output structure are sane
- confirm deployment target receives the right artifact shape

## Rule
Passing tests is not enough. The built artifact must also be validated.
