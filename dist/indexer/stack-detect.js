"use strict";
/**
 * Stack Detection Engine — scan a project root for ecosystem signals
 * (package.json, pyproject.toml, Cargo.toml, go.mod, Gemfile) and emit
 * a token-light suggestion list.
 *
 * Output is intentionally compact — designed to be embedded into the
 * agent context at session start without bloating the budget.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectStack = detectStack;
exports.renderStackMarkdown = renderStackMarkdown;
exports.writeProjectSkills = writeProjectSkills;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const FRAMEWORK_TO_SKILLS = {
    react: ['cm-design-system'],
    next: ['cm-design-system', 'cm-safe-deploy'],
    vue: ['cm-design-system'],
    svelte: ['cm-design-system'],
    vite: ['cm-design-system'],
    express: ['cm-safe-deploy'],
    fastify: ['cm-safe-deploy'],
    vitest: ['cm-tdd'],
    jest: ['cm-tdd'],
    playwright: ['cm-browse'],
    django: ['cm-safe-deploy'],
    flask: ['cm-safe-deploy'],
    fastapi: ['cm-safe-deploy'],
    pytest: ['cm-tdd'],
    rails: ['cm-safe-deploy'],
    rspec: ['cm-tdd'],
    axum: ['cm-safe-deploy'],
    actix: ['cm-safe-deploy'],
    gin: ['cm-safe-deploy'],
    echo: ['cm-safe-deploy'],
};
const KIND_DEFAULT_SKILLS = {
    node: ['cm-tdd', 'cm-clean-code', 'cm-quality-gate'],
    python: ['cm-tdd', 'cm-clean-code', 'cm-quality-gate'],
    rust: ['cm-tdd', 'cm-clean-code', 'cm-quality-gate'],
    go: ['cm-tdd', 'cm-clean-code', 'cm-quality-gate'],
    ruby: ['cm-tdd', 'cm-clean-code', 'cm-quality-gate'],
    unknown: ['cm-quality-gate'],
};
function readText(p) {
    try {
        if (!fs_1.default.existsSync(p))
            return null;
        return fs_1.default.readFileSync(p, 'utf8');
    }
    catch (_a) {
        return null;
    }
}
function safeParseJson(s) {
    if (!s)
        return null;
    try {
        return JSON.parse(s);
    }
    catch (_a) {
        return null;
    }
}
function detectNode(root) {
    var _a, _b;
    const pkg = safeParseJson(readText(path_1.default.join(root, 'package.json')));
    if (!pkg)
        return [];
    const deps = Object.assign(Object.assign({}, ((_a = pkg.dependencies) !== null && _a !== void 0 ? _a : {})), ((_b = pkg.devDependencies) !== null && _b !== void 0 ? _b : {}));
    const out = [];
    const map = [
        ['react', 'react'],
        ['next', 'next'],
        ['vue', 'vue'],
        ['svelte', 'svelte'],
        ['vite', 'vite'],
        ['express', 'express'],
        ['fastify', 'fastify'],
        ['vitest', 'vitest'],
        ['jest', 'jest'],
        ['@playwright/test', 'playwright'],
    ];
    for (const [pkgName, fwId] of map) {
        if (deps[pkgName]) {
            out.push({ id: fwId, source: 'package.json', version: String(deps[pkgName]) });
        }
    }
    return out;
}
function detectPython(root) {
    const out = [];
    const py = readText(path_1.default.join(root, 'pyproject.toml'));
    const req = readText(path_1.default.join(root, 'requirements.txt'));
    const blob = `${py !== null && py !== void 0 ? py : ''}\n${req !== null && req !== void 0 ? req : ''}`;
    const map = [
        [/\bdjango\b/i, 'django'],
        [/\bflask\b/i, 'flask'],
        [/\bfastapi\b/i, 'fastapi'],
        [/\bpytest\b/i, 'pytest'],
    ];
    for (const [re, id] of map) {
        if (re.test(blob)) {
            out.push({ id, source: py ? 'pyproject.toml' : 'requirements.txt' });
        }
    }
    return out;
}
function detectRust(root) {
    const c = readText(path_1.default.join(root, 'Cargo.toml'));
    if (!c)
        return [];
    const out = [];
    if (/\baxum\s*=/.test(c))
        out.push({ id: 'axum', source: 'Cargo.toml' });
    if (/\bactix-web\s*=/.test(c))
        out.push({ id: 'actix', source: 'Cargo.toml' });
    return out;
}
function detectGo(root) {
    const m = readText(path_1.default.join(root, 'go.mod'));
    if (!m)
        return [];
    const out = [];
    if (/gin-gonic\/gin/.test(m))
        out.push({ id: 'gin', source: 'go.mod' });
    if (/labstack\/echo/.test(m))
        out.push({ id: 'echo', source: 'go.mod' });
    return out;
}
function detectRuby(root) {
    const g = readText(path_1.default.join(root, 'Gemfile'));
    if (!g)
        return [];
    const out = [];
    if (/['"]rails['"]/.test(g))
        out.push({ id: 'rails', source: 'Gemfile' });
    if (/['"]rspec['"]/.test(g))
        out.push({ id: 'rspec', source: 'Gemfile' });
    return out;
}
function detectStack(root) {
    var _a;
    const kinds = [];
    if (fs_1.default.existsSync(path_1.default.join(root, 'package.json')))
        kinds.push('node');
    if (fs_1.default.existsSync(path_1.default.join(root, 'pyproject.toml')) ||
        fs_1.default.existsSync(path_1.default.join(root, 'requirements.txt')))
        kinds.push('python');
    if (fs_1.default.existsSync(path_1.default.join(root, 'Cargo.toml')))
        kinds.push('rust');
    if (fs_1.default.existsSync(path_1.default.join(root, 'go.mod')))
        kinds.push('go');
    if (fs_1.default.existsSync(path_1.default.join(root, 'Gemfile')))
        kinds.push('ruby');
    if (kinds.length === 0)
        kinds.push('unknown');
    const frameworks = [
        ...detectNode(root),
        ...detectPython(root),
        ...detectRust(root),
        ...detectGo(root),
        ...detectRuby(root),
    ];
    const suggested = new Set();
    for (const k of kinds)
        for (const s of KIND_DEFAULT_SKILLS[k])
            suggested.add(s);
    for (const f of frameworks)
        for (const s of (_a = FRAMEWORK_TO_SKILLS[f.id]) !== null && _a !== void 0 ? _a : [])
            suggested.add(s);
    return {
        root,
        kinds,
        frameworks,
        suggested_skills: [...suggested].sort(),
        generated_at: new Date().toISOString(),
    };
}
/**
 * Render the stack report as a token-light Markdown block suitable for
 * `.cm/project-skills.md`. Caller is responsible for writing it.
 */
function renderStackMarkdown(r) {
    const lines = [];
    lines.push('# Project Stack');
    lines.push('');
    lines.push(`Generated: ${r.generated_at}`);
    lines.push('');
    lines.push(`Ecosystems: ${r.kinds.join(', ')}`);
    if (r.frameworks.length) {
        lines.push('');
        lines.push('Frameworks:');
        for (const f of r.frameworks) {
            const v = f.version ? ` (${f.version})` : '';
            lines.push(`- ${f.id}${v}  [${f.source}]`);
        }
    }
    if (r.suggested_skills.length) {
        lines.push('');
        lines.push('Suggested skills:');
        for (const s of r.suggested_skills)
            lines.push(`- ${s}`);
    }
    lines.push('');
    return lines.join('\n');
}
function writeProjectSkills(root, r) {
    const dir = path_1.default.join(root, '.cm');
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    const file = path_1.default.join(dir, 'project-skills.md');
    fs_1.default.writeFileSync(file, renderStackMarkdown(r), 'utf8');
    return file;
}
