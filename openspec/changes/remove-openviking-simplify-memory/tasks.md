# Implementation Checklist

- [x] 1.1 Add a failing test for `getBackend()` deprecation behavior when `storage.backend: viking`
- [x] 1.2 Implement the deprecation warning in runtime code
- [x] 2.1 Remove OpenViking auto-install from `install.sh`
- [x] 2.2 Remove OpenViking auto-install from `scripts/postinstall.js`
- [x] 3.1 Update config template comments and top-level README messaging
- [x] 3.2 Update supporting docs and skill guidance to match the new support statement
- [x] 4.1 Run targeted verification and capture any residual follow-up
- [x] 4.2 Update legacy `skills/cm-content-factory/landing/` copy and docs to remove remaining OpenViking product claims
- [x] 4.3 Verify the landing/demo surface now tells the same SQLite + Smart Spine story as the main docs
- [x] 5.1 Remove the remaining OpenViking runtime backend, demo, and dedicated tests
- [x] 5.2 Convert legacy `viking` configs into a warning + SQLite fallback path
- [x] 5.3 Re-run the full repo gate after removing the runtime backend files
