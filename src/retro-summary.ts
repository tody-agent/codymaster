/**
 * Aggregate `.cm/operational-learnings.jsonl` for `cm retro summary`.
 */

import fs from 'fs';

export interface RetroEntry {
  ts: string;
  tool: string;
  note: string;
}

export function loadRetroEntries(filePath: string): RetroEntry[] {
  if (!fs.existsSync(filePath)) return [];
  const out: RetroEntry[] = [];
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try {
      const o = JSON.parse(t) as Partial<RetroEntry>;
      if (typeof o.ts === 'string' && typeof o.note === 'string') {
        out.push({
          ts: o.ts,
          tool: typeof o.tool === 'string' ? o.tool : 'unknown',
          note: o.note,
        });
      }
    } catch {
      /* skip malformed line */
    }
  }
  return out;
}

export function filterSince(entries: RetroEntry[], sinceIso: string): RetroEntry[] {
  const t0 = new Date(sinceIso).getTime();
  if (Number.isNaN(t0)) return entries;
  return entries.filter((e) => new Date(e.ts).getTime() >= t0);
}

export function countByTool(entries: RetroEntry[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const e of entries) {
    m[e.tool] = (m[e.tool] || 0) + 1;
  }
  return m;
}

export function formatRetroMarkdown(entries: RetroEntry[], byTool: Record<string, number>): string {
  const lines: string[] = ['# Retro summary', '', `**Total entries:** ${entries.length}`, ''];
  lines.push('## By tool');
  for (const [tool, n] of Object.entries(byTool).sort((a, b) => b[1] - a[1])) {
    lines.push(`- **${tool}:** ${n}`);
  }
  lines.push('', '## Entries (chronological)');
  for (const e of entries.sort((a, b) => a.ts.localeCompare(b.ts))) {
    lines.push(`- \`${e.ts}\` [${e.tool}] ${e.note}`);
  }
  return lines.join('\n');
}

export function formatRetroJson(entries: RetroEntry[], byTool: Record<string, number>): string {
  return JSON.stringify(
    {
      total: entries.length,
      by_tool: byTool,
      entries: entries.sort((a, b) => a.ts.localeCompare(b.ts)),
    },
    null,
    2
  );
}
