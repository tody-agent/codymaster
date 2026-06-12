import { describe, it, expect } from 'vitest';
import type { PartyHandoff, PartyRound } from '../src/handoff/contracts';
import { HANDOFF_FILENAMES } from '../src/handoff/contracts';

function makeRound(persona: PartyRound['persona'], verdict?: PartyRound['verdict']): PartyRound {
  return {
    persona,
    output: `${persona} output`,
    verdict,
    ts: '2026-05-07T10:00:00Z',
  };
}

function makeHandoff(rounds: PartyRound[], final?: string): PartyHandoff {
  return {
    schema: 'party@1',
    emitted_at: '2026-05-07T10:00:00Z',
    emitted_by: 'cm-execution',
    data: {
      topic: 'Add output compression',
      rounds,
      final,
    },
  };
}

describe('PartyHandoff schema', () => {
  it('maps to party.json filename', () => {
    expect(HANDOFF_FILENAMES['party@1']).toBe('party.json');
  });

  it('accepts a full architect → engineer → reviewer cycle', () => {
    const h = makeHandoff(
      [makeRound('architect'), makeRound('engineer'), makeRound('reviewer', 'pass')],
      'shipped',
    );
    expect(h.data.rounds).toHaveLength(3);
    expect(h.data.rounds[2].verdict).toBe('pass');
    expect(h.data.final).toBe('shipped');
  });

  it('supports a security round when needed', () => {
    const h = makeHandoff([
      makeRound('architect'),
      makeRound('engineer'),
      makeRound('security', 'pass'),
      makeRound('reviewer', 'pass'),
    ]);
    expect(h.data.rounds.map(r => r.persona)).toContain('security');
  });

  it('supports revise loops up to 2', () => {
    const h = makeHandoff([
      makeRound('architect'),
      makeRound('engineer'),
      makeRound('reviewer', 'revise'),
      makeRound('engineer'),
      makeRound('reviewer', 'pass'),
    ]);
    const reviewerRounds = h.data.rounds.filter(r => r.persona === 'reviewer');
    expect(reviewerRounds).toHaveLength(2);
    expect(reviewerRounds[1].verdict).toBe('pass');
  });

  it('keeps back-compat with legacy `personas` field', () => {
    const legacy: PartyHandoff = {
      schema: 'party@1',
      emitted_at: '2026-05-07T10:00:00Z',
      emitted_by: 'cm-execution',
      data: {
        topic: 'legacy',
        rounds: [],
        personas: [{ name: 'engineer', verdict: 'ok', key_points: ['done'] }],
      },
    };
    expect(legacy.data.personas?.[0].name).toBe('engineer');
  });
});
