/**
 * Converts a Universal SKILL.md into Cursor / Windsurf / Cline format.
 * These typically rely on `.cursorrules` or `.windsurfrules` files in the workspace.
 */

export function buildCursorRules(skillMeta, context) {
    return `
# @Rule: ${skillMeta.name}
Description: ${skillMeta.description}

Rules:
1. Always follow the universal skill format.
2. Context injected:
${context.join('\n')}
    `;
}
