import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { hostGuard, requireDashboardToken } from '../src/middleware/dashboard-auth';
import { readContinuityState } from '../src/continuity';

// Minimal Express req/res/next doubles for middleware unit tests.
function mockRes() {
  return {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function run(mw: any, headers: Record<string, string>) {
  let nextCalled = false;
  const res = mockRes();
  mw({ headers } as any, res as any, () => { nextCalled = true; });
  return { res, nextCalled };
}

describe('dashboard-auth: hostGuard (DNS-rebinding defense)', () => {
  const guard = hostGuard();

  it('allows loopback hosts', () => {
    for (const host of ['127.0.0.1:7777', 'localhost:7777', 'localhost', '127.0.0.1']) {
      const { nextCalled } = run(guard, { host });
      expect(nextCalled, host).toBe(true);
    }
  });

  it('rejects non-loopback Host header with 403', () => {
    for (const host of ['evil.com', 'attacker.example:7777', '192.168.1.5:7777']) {
      const { res, nextCalled } = run(guard, { host });
      expect(nextCalled, host).toBe(false);
      expect(res.statusCode).toBe(403);
    }
  });
});

describe('dashboard-auth: requireDashboardToken', () => {
  const TOKEN = 'a'.repeat(48);
  const mw = requireDashboardToken(TOKEN);

  it('accepts the correct bearer token', () => {
    const { nextCalled } = run(mw, { authorization: `Bearer ${TOKEN}` });
    expect(nextCalled).toBe(true);
  });

  it('rejects a missing token with 401', () => {
    const { res, nextCalled } = run(mw, {});
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it('rejects a wrong token with 401', () => {
    const { res, nextCalled } = run(mw, { authorization: 'Bearer wrong' });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it('rejects an empty or falsy configured token (fail-closed)', () => {
    // If the server initializes with an empty token by mistake, it should fail immediately
    expect(() => requireDashboardToken('')).toThrow('requireDashboardToken must be initialized with a valid token');
  });

  it('safely handles timing-safe equality checks of differing lengths', () => {
    // The previous token was 'a'.repeat(48). We pass a token of different length to ensure
    // it doesn't throw a length mismatch exception from crypto.timingSafeEqual.
    const { res, nextCalled } = run(mw, { authorization: `Bearer ${'a'.repeat(47)}` });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });
});

describe('continuity: phase enum validation (XSS hardening)', () => {
  function withTempProject(content: string): ReturnType<typeof readContinuityState> {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-cont-'));
    const cmDir = path.join(dir, '.cm');
    fs.mkdirSync(cmDir, { recursive: true });
    fs.writeFileSync(path.join(cmDir, 'CONTINUITY.md'), content);
    try {
      return readContinuityState(dir);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  it('keeps a valid phase value', () => {
    const state = withTempProject('Current Phase: executing\n');
    expect(state?.currentPhase).toBe('executing');
  });

  it('coerces a malicious/unknown phase to idle (no script smuggling)', () => {
    const state = withTempProject('Current Phase: <img src=x onerror=alert(1)>\n');
    expect(state?.currentPhase).toBe('idle');
  });
});
