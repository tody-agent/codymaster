/**
 * Converts a Universal SKILL.md into Google Antigravity (Gemini) format.
 * Antigravity relies on `<skills>` blocks in system prompts and explicitly
 * supports subagent dispatch via the `browser_subagent` or custom endpoints.
 */

export function buildAntigravityPrompt(skillMeta, context) {
    return `
<skills>
  - ${skillMeta.name}: ${skillMeta.description}
  To execute, consider using subagents for maximum speed.
  ${context.join('\n')}
</skills>
    `;
}
