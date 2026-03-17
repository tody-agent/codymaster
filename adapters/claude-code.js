/**
 * Converts a Universal SKILL.md into Claude Code format.
 * Claude Code uses customized .claude file configurations or project-level prompts.
 */

export function buildClaudePrompt(skillMeta, context) {
    return `
# Skill: ${skillMeta.name}
${skillMeta.description}

Context values:
${context.join('\n')}

INSTRUCTIONS:
You are equipped with this skill. Execute it strictly when the user invokes the corresponding command.
    `;
}
