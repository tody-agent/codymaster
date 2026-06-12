# Implementation Checklist: Browse Hybrid Bridge

**Estimated:** 2-3 tuần (M)
**Priority:** High
**Dependencies:** agent-browser (`npm i -g agent-browser`)

---

## Phase 1: Foundation (Tuần 1)

### 1.1 Adapter Interface & Types
- [ ] Tạo `src/browse/adapters/types.ts`
- [ ] Define `BrowserAdapter` interface
- [ ] Define `A11ySnapshot`, `BrowserError`, `SessionOpts` types
- [ ] Define `ConsoleEntry`, `NetworkEntry` types
- [ ] Unit test: types compile, interface contract

### 1.2 Playwright Adapter (Extract)
- [ ] Tạo `src/browse/adapters/playwright-adapter.ts`
- [ ] Extract existing Playwright logic từ `BrowseDaemon`
- [ ] Implement `BrowserAdapter` interface
- [ ] Wrap: navigate, click, fill, screenshot, console, network
- [ ] Implement `getSnapshot()` using `page.accessibility.snapshot()`
- [ ] Unit test: PlaywrightAdapter mock session

### 1.3 ErrorCollector
- [ ] Tạo `src/browse/error-collector.ts`
- [ ] Implement error classification (js-error, network-fail, console-error, a11y-violation, timeout)
- [ ] Implement severity mapping (critical, error, warning, info)
- [ ] Implement dedup logic
- [ ] Implement `exportJSON()` method
- [ ] Unit test: classification, dedup, export

### 1.4 EventLog (Upgrade Ring Buffer)
- [ ] Tạo `src/browse/event-log.ts`
- [ ] Replace RingBuffer với EventLog class
- [ ] Add filter by type, severity, time range
- [ ] Add export to JSON
- [ ] Max 1000 entries (configurable)
- [ ] Unit test: push, filter, export, overflow

### Verification Phase 1
```bash
npm run test:gate -- --filter browse
```
- [ ] All new tests pass
- [ ] Existing tests still pass (no regression)

---

## Phase 2: Agent-Browser Integration (Tuần 1-2)

### 2.1 Agent-Browser Adapter
- [ ] Tạo `src/browse/adapters/agent-browser-adapter.ts`
- [ ] Implement `isAvailable()` — check `agent-browser --version`
- [ ] Implement `startSession()` — `agent-browser open <url>`
- [ ] Implement `navigate()` — `agent-browser navigate <url>`
- [ ] Implement `click()` — `agent-browser click @eN`
- [ ] Implement `fill()` — `agent-browser fill @eN "value"`
- [ ] Implement `screenshot()` — `agent-browser screenshot`
- [ ] Implement `getSnapshot()` — parse a11y tree output
- [ ] Implement `getConsole()` — `agent-browser console`
- [ ] Implement `getNetwork()` — `agent-browser network`
- [ ] Implement `startRecording()` / `stopRecording()` — video
- [ ] Implement `closeSession()` — `agent-browser close`
- [ ] Unit test: mock CLI calls, parse outputs

### 2.2 Adapter Selection Logic
- [ ] Tạo `src/browse/adapter-factory.ts`
- [ ] Implement: auto-detect agent-browser availability
- [ ] Implement: `--engine` flag override
- [ ] Implement: fallback chain (agent-browser → playwright)
- [ ] Log which adapter selected on startup
- [ ] Unit test: selection logic, fallback behavior

### 2.3 Install Check
- [ ] Add `cm browse doctor` command — check agent-browser installed
- [ ] Add install hint: `npm i -g agent-browser && agent-browser install`
- [ ] Add to `cm doctor` output

### Verification Phase 2
```bash
# Install agent-browser
npm i -g agent-browser && agent-browser install

# Test adapter
cm browse start --engine agent-browser
cm browse snapshot
cm browse errors
```
- [ ] agent-browser adapter works
- [ ] Fallback to playwright works when agent-browser missing
- [ ] `--engine` flag overrides correctly

---

## Phase 3: BrowseDaemon Upgrade (Tuần 2)

### 3.1 Refactor BrowseDaemon
- [ ] Update `src/browse-server.ts`
- [ ] Inject adapter via constructor
- [ ] Replace direct Playwright calls → adapter calls
- [ ] Replace RingBuffer → EventLog
- [ ] Keep all existing endpoints backward compatible

### 3.2 New Endpoints
- [ ] `GET /errors` — query ErrorCollector, filterable
- [ ] `GET /a11y-snapshot` — return adapter.getSnapshot()
- [ ] `POST /record/start` — adapter.startRecording()
- [ ] `POST /record/stop` — adapter.stopRecording(), return path
- [ ] `GET /engine` — return { name, version, capabilities }

### 3.3 Error Integration
- [ ] Wire ErrorCollector into adapter events
- [ ] Console errors → ErrorCollector
- [ ] Network failures → ErrorCollector
- [ ] Page crashes → ErrorCollector (severity: critical)

### Verification Phase 3
```bash
cm browse start --engine agent-browser
# Test all endpoints
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:17395/errors
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:17395/a11y-snapshot
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:17395/engine
```
- [ ] All new endpoints return valid data
- [ ] Old endpoints still work unchanged
- [ ] ErrorCollector captures errors

---

## Phase 4: CLI Commands (Tuần 2-3)

### 4.1 New CLI Commands
- [ ] `cm browse errors [--type <type>] [--severity <sev>]` — list errors
- [ ] `cm browse snapshot` — show a11y tree
- [ ] `cm browse record start` / `cm browse record stop`
- [ ] `cm browse engine` — show current engine info
- [ ] `cm browse doctor` — check dependencies

### 4.2 Update Existing Commands
- [ ] `cm browse start --engine <agent-browser|playwright>`
- [ ] `cm qa-visual` — use new engine, show errors if any
- [ ] `cm canary` — integrate ErrorCollector for smoke tests

### 4.3 Update Command Registry
- [ ] Update `src/cli/command-registry.ts` — register new commands
- [ ] Update help text

### Verification Phase 4
```bash
cm browse start --engine agent-browser
cm browse errors
cm browse snapshot
cm browse engine
cm browse doctor
cm qa-visual --url http://localhost:3000
```
- [ ] All commands work
- [ ] Help text correct
- [ ] Error output useful

---

## Phase 5: Testing & Documentation (Tuần 3)

### 5.1 Integration Tests
- [ ] Tạo `test/browse-hybrid.test.ts`
- [ ] Test: full session lifecycle (start → navigate → snapshot → errors → close)
- [ ] Test: adapter fallback
- [ ] Test: error collector end-to-end
- [ ] Test: backward compatibility (existing qa-visual flow)

### 5.2 Update Documentation
- [ ] Update `docs/browse-daemon.md` — add agent-browser section
- [ ] Update `cm-browse/SKILL.md` — add new commands
- [ ] Update `AGENTS.md` — mention hybrid bridge
- [ ] Add troubleshooting: agent-browser issues

### 5.3 Quality Gate
- [ ] `npm run test:gate` — 0 failures
- [ ] `npm run build` — success
- [ ] Manual test: full flow with agent-browser
- [ ] Manual test: fallback to playwright
- [ ] Manual test: backward compat (old scripts still work)

### Verification Phase 5
```bash
npm run test:gate
npm run build
cm qa-visual --url http://localhost:3000
```
- [ ] All tests pass
- [ ] Build succeeds
- [ ] No regression in existing functionality

---

## Post-Implementation

### Update Continuity
- [ ] Update `.cm/CONTINUITY.md` — mark complete
- [ ] Record learnings if any

### Potential Future Enhancements (Out of Scope)
- Visual regression testing (screenshot diff)
- Accessibility audit (WCAG violations)
- Performance metrics (LCP, FID, CLS)
- Multi-tab support
- Cloud browser support (AWS AgentCore)

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| agent-browser CLI changes API | Pin version, parse output defensively |
| agent-browser not installed | Auto-fallback to Playwright + install hint |
| a11y snapshot too large | Paginate, filter by role/type |
| Video recording disk space | Configurable output dir, auto-cleanup |
| Breaking existing users | All old endpoints/commands unchanged |
