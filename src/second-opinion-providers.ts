/**
 * Redaction + secondary-model review for `cm second-opinion`.
 */

const SYSTEM =
  'You are a senior reviewer. List risks, bugs, and missing tests. Be concise. Do not restate the entire diff.';

export function redactDiffForReview(text: string, maxLen = 120_000): string {
  let t = text.slice(0, maxLen);
  t = t.replace(
    /^(\s*(?:#\s*)?(?:API_KEY|API_SECRET|SECRET|PASSWORD|ACCESS_TOKEN|AUTH_TOKEN|BEARER|Authorization)\s*[:=]\s*)\S+.*$/gim,
    '$1[REDACTED]'
  );
  t = t.replace(
    /\b(sk-[a-zA-Z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|ghp_[A-Za-z0-9]{36,}|gho_[A-Za-z0-9]{36,}|AKIA[0-9A-Z]{16})\b/g,
    '[REDACTED_TOKEN]'
  );
  return t;
}

export async function reviewWithOpenAI(diffText: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not set');
  const model = process.env.CM_SECOND_OPINION_MODEL || 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `Review this diff:\n\n${diffText}` },
      ],
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? '';
}

export async function reviewWithAnthropic(diffText: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set');
  const model = process.env.CM_ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM,
      messages: [{ role: 'user', content: `Review this diff:\n\n${diffText}` }],
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const block = data.content?.find((c) => c.type === 'text');
  return block?.text ?? '';
}
