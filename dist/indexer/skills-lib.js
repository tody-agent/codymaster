"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_FOLDER_MAP = exports.WEB_FRONTEND_EXTENSIONS = exports.FRONTEND_BONUS_SKILLS = exports.FRONTEND_PACKAGES = exports.COMBO_SKILLS_MAP = exports.SKILLS_MAP = void 0;
exports.parseSettingsGradleModules = parseSettingsGradleModules;
exports.hasWebFrontendFiles = hasWebFrontendFiles;
exports.resolveWorkspaces = resolveWorkspaces;
exports.readGemfile = readGemfile;
exports.readPackageJson = readPackageJson;
exports.readDenoJson = readDenoJson;
exports.getDenoImportNames = getDenoImportNames;
exports.getAllPackageNames = getAllPackageNames;
exports.detectTechnologies = detectTechnologies;
exports.detectCombos = detectCombos;
exports.detectAgents = detectAgents;
exports.parseSkillPath = parseSkillPath;
exports.getInstalledSkillNames = getInstalledSkillNames;
exports.collectSkills = collectSkills;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_os_1 = require("node:os");
var skills_map_1 = require("./skills-map");
Object.defineProperty(exports, "SKILLS_MAP", { enumerable: true, get: function () { return skills_map_1.SKILLS_MAP; } });
Object.defineProperty(exports, "COMBO_SKILLS_MAP", { enumerable: true, get: function () { return skills_map_1.COMBO_SKILLS_MAP; } });
Object.defineProperty(exports, "FRONTEND_PACKAGES", { enumerable: true, get: function () { return skills_map_1.FRONTEND_PACKAGES; } });
Object.defineProperty(exports, "FRONTEND_BONUS_SKILLS", { enumerable: true, get: function () { return skills_map_1.FRONTEND_BONUS_SKILLS; } });
Object.defineProperty(exports, "WEB_FRONTEND_EXTENSIONS", { enumerable: true, get: function () { return skills_map_1.WEB_FRONTEND_EXTENSIONS; } });
Object.defineProperty(exports, "AGENT_FOLDER_MAP", { enumerable: true, get: function () { return skills_map_1.AGENT_FOLDER_MAP; } });
const skills_map_2 = require("./skills-map");
// ── Internal Constants ───────────────────────────────────────
const AGENT_FOLDER_ENTRIES = Object.entries(skills_map_2.AGENT_FOLDER_MAP);
const SCAN_SKIP_DIRS = new Set([
    "node_modules",
    ".git",
    "vendor",
    ".next",
    "dist",
    "build",
    ".output",
    ".nuxt",
    ".svelte-kit",
    "__pycache__",
    ".cache",
    "coverage",
    ".turbo",
    ".terraform",
    "var",
    "bin",
    "obj",
    ".vs",
]);
const GRADLE_SCAN_ROOT_FILES = [
    "build.gradle.kts",
    "build.gradle",
    "settings.gradle.kts",
    "settings.gradle",
    "gradle/libs.versions.toml",
];
const DOTNET_SCAN_ROOT_FILES = [
    "global.json",
    "NuGet.Config",
    "Directory.Build.props",
    "Directory.Packages.props",
];
// ── Gradle Scanning ──────────────────────────────────────────
function parseSettingsGradleModules(content) {
    const modules = [];
    const includeRe = /include\s*\(?\s*([^)]+)/g;
    let includeMatch;
    while ((includeMatch = includeRe.exec(content)) !== null) {
        const args = includeMatch[1];
        const quotedRe = /['"]([^'"]+)['"]/g;
        let quotedMatch;
        while ((quotedMatch = quotedRe.exec(args)) !== null) {
            modules.push(quotedMatch[1].replace(/^:/, "").replace(/:/g, "/"));
        }
    }
    return modules;
}
const _gradleCache = new Map();
function gradleLayoutCandidatePaths(projectDir) {
    const cached = _gradleCache.get(projectDir);
    if (cached)
        return cached;
    const candidates = [];
    const seen = new Set();
    function add(filePath) {
        if (!seen.has(filePath)) {
            candidates.push(filePath);
            seen.add(filePath);
        }
    }
    for (const f of GRADLE_SCAN_ROOT_FILES) {
        add((0, node_path_1.join)(projectDir, f));
    }
    let entries;
    try {
        entries = (0, node_fs_1.readdirSync)(projectDir, { withFileTypes: true });
    }
    catch (_a) {
        entries = [];
    }
    for (const e of entries) {
        if (!e.isDirectory() || e.name.startsWith(".") || SCAN_SKIP_DIRS.has(e.name))
            continue;
        for (const g of ["build.gradle.kts", "build.gradle"]) {
            add((0, node_path_1.join)(projectDir, e.name, g));
        }
    }
    for (const settingsFile of ["settings.gradle.kts", "settings.gradle"]) {
        const settingsPath = (0, node_path_1.join)(projectDir, settingsFile);
        let content;
        try {
            content = (0, node_fs_1.readFileSync)(settingsPath, "utf-8");
        }
        catch (_b) {
            continue;
        }
        for (const modulePath of parseSettingsGradleModules(content)) {
            for (const g of ["build.gradle.kts", "build.gradle"]) {
                add((0, node_path_1.join)(projectDir, modulePath, g));
            }
        }
        break;
    }
    _gradleCache.set(projectDir, candidates);
    return candidates;
}
// ── .NET Scanning ────────────────────────────────────────────
const _dotNetCache = new Map();
function dotNetLayoutCandidatePaths(projectDir) {
    const cached = _dotNetCache.get(projectDir);
    if (cached)
        return cached;
    const candidates = [];
    const seen = new Set();
    function add(filePath) {
        if (!seen.has(filePath)) {
            candidates.push(filePath);
            seen.add(filePath);
        }
    }
    for (const f of DOTNET_SCAN_ROOT_FILES) {
        add((0, node_path_1.join)(projectDir, f));
    }
    function scan(dir, depth) {
        if (depth > 2)
            return;
        let entries;
        try {
            entries = (0, node_fs_1.readdirSync)(dir, { withFileTypes: true });
        }
        catch (_a) {
            return;
        }
        for (const e of entries) {
            if (e.isFile()) {
                const lower = e.name.toLowerCase();
                if (lower.endsWith(".sln") || lower.endsWith(".csproj") || lower.endsWith(".fsproj")) {
                    add((0, node_path_1.join)(dir, e.name));
                }
            }
            else if (e.isDirectory() && !e.name.startsWith(".") && !SCAN_SKIP_DIRS.has(e.name)) {
                scan((0, node_path_1.join)(dir, e.name), depth + 1);
            }
        }
    }
    scan(projectDir, 0);
    _dotNetCache.set(projectDir, candidates);
    return candidates;
}
function resolveConfigFileContentPaths(projectDir, config) {
    if (config.scanGradleLayout) {
        return gradleLayoutCandidatePaths(projectDir);
    }
    if (config.scanDotNetLayout) {
        return dotNetLayoutCandidatePaths(projectDir);
    }
    return (config.files || []).map((f) => (0, node_path_1.join)(projectDir, f));
}
// ── Frontend File Scanning ───────────────────────────────────
function hasWebFrontendFiles(projectDir, maxDepth = 3) {
    function scan(dir, depth) {
        let entries;
        try {
            entries = (0, node_fs_1.readdirSync)(dir, { withFileTypes: true });
        }
        catch (_a) {
            return false;
        }
        for (const entry of entries) {
            if (entry.isFile()) {
                const name = entry.name;
                if (name.endsWith(".blade.php"))
                    return true;
                const dot = name.lastIndexOf(".");
                if (dot !== -1 && skills_map_2.WEB_FRONTEND_EXTENSIONS.has(name.slice(dot)))
                    return true;
            }
            else if (entry.isDirectory() && depth < maxDepth) {
                if (SCAN_SKIP_DIRS.has(entry.name) || entry.name.startsWith("."))
                    continue;
                if (scan((0, node_path_1.join)(dir, entry.name), depth + 1))
                    return true;
            }
        }
        return false;
    }
    return scan(projectDir, 0);
}
// ── Workspace Resolution ──────────────────────────────────────
function parsePnpmWorkspaceYaml(content) {
    const lines = content.split("\n");
    const patterns = [];
    let inPackages = false;
    for (const raw of lines) {
        const line = raw.trim();
        if (line === "packages:" || line === "packages :") {
            inPackages = true;
            continue;
        }
        if (inPackages) {
            if (line.startsWith("- ")) {
                patterns.push(line
                    .slice(2)
                    .trim()
                    .replace(/^['"]|['"]$/g, ""));
            }
            else if (line !== "" && !line.startsWith("#")) {
                break;
            }
        }
    }
    return patterns;
}
function expandWorkspacePatterns(projectDir, patterns) {
    const dirs = [];
    for (const pattern of patterns) {
        if (pattern.includes("*")) {
            const parent = (0, node_path_1.join)(projectDir, pattern.replace(/\/?\*.*$/, ""));
            let entries;
            try {
                entries = (0, node_fs_1.readdirSync)(parent, { withFileTypes: true });
            }
            catch (_a) {
                continue;
            }
            for (const entry of entries) {
                if (!entry.isDirectory() || SCAN_SKIP_DIRS.has(entry.name) || entry.name.startsWith("."))
                    continue;
                const wsDir = (0, node_path_1.join)(parent, entry.name);
                if ((0, node_fs_1.existsSync)((0, node_path_1.join)(wsDir, "package.json")) ||
                    (0, node_fs_1.existsSync)((0, node_path_1.join)(wsDir, "deno.json")) ||
                    (0, node_fs_1.existsSync)((0, node_path_1.join)(wsDir, "deno.jsonc"))) {
                    dirs.push(wsDir);
                }
            }
        }
        else {
            const wsDir = (0, node_path_1.join)(projectDir, pattern);
            if ((0, node_fs_1.existsSync)((0, node_path_1.join)(wsDir, "package.json")) ||
                (0, node_fs_1.existsSync)((0, node_path_1.join)(wsDir, "deno.json")) ||
                (0, node_fs_1.existsSync)((0, node_path_1.join)(wsDir, "deno.jsonc"))) {
                dirs.push(wsDir);
            }
        }
    }
    return dirs;
}
function resolveWorkspaces(projectDir, preloaded) {
    const pnpmPath = (0, node_path_1.join)(projectDir, "pnpm-workspace.yaml");
    if ((0, node_fs_1.existsSync)(pnpmPath)) {
        try {
            const content = (0, node_fs_1.readFileSync)(pnpmPath, "utf-8");
            const patterns = parsePnpmWorkspaceYaml(content);
            if (patterns.length > 0) {
                return expandWorkspacePatterns(projectDir, patterns).filter((d) => (0, node_path_1.resolve)(d) !== (0, node_path_1.resolve)(projectDir));
            }
        }
        catch (_a) { }
    }
    const pkg = (preloaded === null || preloaded === void 0 ? void 0 : preloaded.pkg) !== undefined ? preloaded.pkg : readPackageJson(projectDir);
    if (pkg) {
        const ws = pkg.workspaces;
        const patterns = Array.isArray(ws)
            ? ws
            : Array.isArray(ws === null || ws === void 0 ? void 0 : ws.packages)
                ? ws.packages
                : null;
        if (patterns && patterns.length > 0) {
            return expandWorkspacePatterns(projectDir, patterns).filter((d) => (0, node_path_1.resolve)(d) !== (0, node_path_1.resolve)(projectDir));
        }
    }
    const denoJson = (preloaded === null || preloaded === void 0 ? void 0 : preloaded.denoJson) !== undefined ? preloaded.denoJson : readDenoJson(projectDir);
    if (denoJson === null || denoJson === void 0 ? void 0 : denoJson.workspace) {
        const members = Array.isArray(denoJson.workspace) ? denoJson.workspace : [];
        if (members.length > 0) {
            return expandWorkspacePatterns(projectDir, members).filter((d) => (0, node_path_1.resolve)(d) !== (0, node_path_1.resolve)(projectDir));
        }
    }
    return [];
}
// ── Detection ─────────────────────────────────────────────────
function readGemfile(dir) {
    const gemfilePath = (0, node_path_1.join)(dir, "Gemfile");
    if (!(0, node_fs_1.existsSync)(gemfilePath))
        return [];
    try {
        const content = (0, node_fs_1.readFileSync)(gemfilePath, "utf-8");
        const gems = [];
        const gemRegex = /^\s*gem\s+['"]([^'"]+)['"]/gm;
        let match;
        while ((match = gemRegex.exec(content)) !== null) {
            gems.push(match[1]);
        }
        return gems;
    }
    catch (_a) {
        return [];
    }
}
function readPackageJson(dir) {
    try {
        return JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.join)(dir, "package.json"), "utf-8"));
    }
    catch (_a) {
        return null;
    }
}
function readDenoJson(dir) {
    for (const name of ["deno.json", "deno.jsonc"]) {
        try {
            return JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.join)(dir, name), "utf-8"));
        }
        catch (_a) {
            continue;
        }
    }
    return null;
}
function getDenoImportNames(denoJson) {
    if (!(denoJson === null || denoJson === void 0 ? void 0 : denoJson.imports))
        return [];
    return Object.values(denoJson.imports)
        .filter((s) => typeof s === "string" && (s.startsWith("npm:") || s.startsWith("jsr:")))
        .map((specifier) => {
        const bare = specifier.replace(/^(?:npm|jsr):/, "");
        if (bare.startsWith("@")) {
            return bare.replace(/^(@[^/]+\/[^@]+).*$/, "$1");
        }
        return bare.replace(/@.*$/, "");
    });
}
function getAllPackageNames(pkg) {
    if (!pkg)
        return [];
    return [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.devDependencies || {}),
    ];
}
function detectTechnologiesInDir(dir, { skipFrontendFiles = false, pkg: preloadedPkg, denoJson: preloadedDeno, } = {}) {
    const pkg = preloadedPkg !== undefined ? preloadedPkg : readPackageJson(dir);
    const allPackages = getAllPackageNames(pkg);
    const deno = preloadedDeno !== undefined ? preloadedDeno : readDenoJson(dir);
    const denoImports = getDenoImportNames(deno);
    const allDepsSet = denoImports.length > 0 ? new Set([...allPackages, ...denoImports]) : new Set(allPackages);
    const allDepsArray = denoImports.length > 0 ? [...allDepsSet] : allPackages;
    let gemNames;
    const detected = [];
    const fileContentCache = new Map();
    const existsCache = new Map();
    function cachedRead(filePath) {
        if (fileContentCache.has(filePath))
            return fileContentCache.get(filePath);
        let content = null;
        try {
            content = (0, node_fs_1.readFileSync)(filePath, "utf-8");
        }
        catch (_a) { }
        fileContentCache.set(filePath, content);
        if (content !== null)
            existsCache.set(filePath, true);
        return content;
    }
    function cachedExists(filePath) {
        if (existsCache.has(filePath))
            return existsCache.get(filePath);
        const result = (0, node_fs_1.existsSync)(filePath);
        existsCache.set(filePath, result);
        return result;
    }
    for (const tech of skills_map_2.SKILLS_MAP) {
        let found = false;
        if (tech.detect.packages) {
            found = tech.detect.packages.some((p) => allDepsSet.has(p));
        }
        if (!found && tech.detect.packagePatterns) {
            found = tech.detect.packagePatterns.some((pattern) => allDepsArray.some((p) => pattern.test(p)));
        }
        if (!found && tech.detect.configFiles) {
            found = tech.detect.configFiles.some((f) => cachedExists((0, node_path_1.join)(dir, f)));
        }
        if (!found && tech.detect.gems) {
            if (gemNames === undefined)
                gemNames = readGemfile(dir);
            found = tech.detect.gems.some((g) => gemNames.includes(g));
        }
        if (!found && tech.detect.configFileContent) {
            const configs = Array.isArray(tech.detect.configFileContent)
                ? tech.detect.configFileContent
                : [tech.detect.configFileContent];
            for (const cfg of configs) {
                const paths = resolveConfigFileContentPaths(dir, cfg);
                const { patterns } = cfg;
                for (const filePath of paths) {
                    const content = cachedRead(filePath);
                    if (content === null)
                        continue;
                    if (patterns.some((p) => content.includes(p))) {
                        found = true;
                        break;
                    }
                }
                if (found)
                    break;
            }
        }
        if (found) {
            detected.push(tech);
        }
    }
    const isFrontendByPackages = allDepsArray.some((p) => skills_map_2.FRONTEND_PACKAGES.has(p));
    const isFrontendByFiles = isFrontendByPackages || skipFrontendFiles ? false : hasWebFrontendFiles(dir);
    return { detected, isFrontendByPackages, isFrontendByFiles };
}
function detectTechnologies(projectDir) {
    const pkg = readPackageJson(projectDir);
    const denoJson = readDenoJson(projectDir);
    const root = detectTechnologiesInDir(projectDir, { pkg, denoJson });
    const seenIds = new Map(root.detected.map((t) => [t.id, t]));
    let isFrontend = root.isFrontendByPackages || root.isFrontendByFiles;
    const workspaceDirs = resolveWorkspaces(projectDir, { pkg, denoJson });
    for (const wsDir of workspaceDirs) {
        const ws = detectTechnologiesInDir(wsDir, { skipFrontendFiles: isFrontend });
        for (const tech of ws.detected) {
            if (!seenIds.has(tech.id)) {
                seenIds.set(tech.id, tech);
            }
        }
        if (ws.isFrontendByPackages || ws.isFrontendByFiles) {
            isFrontend = true;
        }
    }
    const detected = [...seenIds.values()];
    const detectedIds = detected.map((t) => t.id);
    const combos = detectCombos(detectedIds);
    return { detected, isFrontend, combos };
}
function detectCombos(detectedIds) {
    const idSet = detectedIds instanceof Set ? detectedIds : new Set(detectedIds);
    return skills_map_2.COMBO_SKILLS_MAP.filter((combo) => combo.requires.every((id) => idSet.has(id)));
}
// ── Agent Detection ─────────────────────────────────────────
function detectAgents(home = (0, node_os_1.homedir)()) {
    const agents = ["universal"];
    for (const [folder, agentName] of AGENT_FOLDER_ENTRIES) {
        if ((0, node_fs_1.existsSync)((0, node_path_1.join)(home, folder, "skills"))) {
            agents.push(agentName);
        }
    }
    return agents;
}
function parseSkillPath(skill) {
    if (skill.startsWith("http")) {
        return { repo: skill, skillName: "", full: skill };
    }
    const parts = skill.split("/");
    return {
        repo: parts.slice(0, 2).join("/"),
        skillName: parts.slice(2).join("/"),
        full: skill,
    };
}
// ── Installed Skills Detection ───────────────────────────────
function getInstalledSkillNames(projectDir) {
    try {
        const lock = JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.join)(projectDir, "skills-lock.json"), "utf-8"));
        if ((lock === null || lock === void 0 ? void 0 : lock.skills) && typeof lock.skills === "object") {
            return new Set(Object.keys(lock.skills));
        }
    }
    catch (_a) { }
    try {
        const entries = (0, node_fs_1.readdirSync)((0, node_path_1.join)(projectDir, ".agents", "skills"), { withFileTypes: true });
        return new Set(entries.filter((e) => e.isDirectory()).map((e) => e.name));
    }
    catch (_b) { }
    return new Set();
}
function collectSkills({ detected, isFrontend, combos = [], installedNames = null, }) {
    const skillMap = new Map();
    const skills = [];
    function addSkill(skill, source) {
        const existing = skillMap.get(skill);
        if (!existing) {
            const installed = installedNames
                ? installedNames.has(parseSkillPath(skill).skillName)
                : false;
            const entry = { skill, sources: [source], installed };
            skillMap.set(skill, entry);
            skills.push(entry);
        }
        else if (!existing.sources.includes(source)) {
            existing.sources.push(source);
        }
    }
    for (const tech of detected) {
        for (const skill of tech.skills) {
            addSkill(skill, tech.name);
        }
    }
    for (const combo of combos) {
        for (const skill of combo.skills) {
            addSkill(skill, combo.name);
        }
    }
    if (isFrontend) {
        for (const skill of skills_map_2.FRONTEND_BONUS_SKILLS) {
            addSkill(skill, "Frontend");
        }
    }
    return skills;
}
