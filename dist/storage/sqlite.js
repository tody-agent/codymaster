"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DASHBOARD_DB_PATH = void 0;
exports.getDashboardDb = getDashboardDb;
exports.closeDashboardDb = closeDashboardDb;
exports.runMigrations = runMigrations;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
// ─── Constants ──────────────────────────────────────────────────────────────
exports.DASHBOARD_DB_PATH = path_1.default.join(os_1.default.homedir(), '.codymaster', 'dashboard.db');
// ─── Connection Cache ───────────────────────────────────────────────────────
const dbCache = new Map();
function getDashboardDb(dbPath) {
    const resolvedPath = dbPath !== null && dbPath !== void 0 ? dbPath : exports.DASHBOARD_DB_PATH;
    if (dbCache.has(resolvedPath))
        return dbCache.get(resolvedPath);
    const dir = path_1.default.dirname(resolvedPath);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    const db = new better_sqlite3_1.default(resolvedPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    runMigrations(db);
    dbCache.set(resolvedPath, db);
    return db;
}
function closeDashboardDb(dbPath) {
    const resolvedPath = dbPath !== null && dbPath !== void 0 ? dbPath : exports.DASHBOARD_DB_PATH;
    const db = dbCache.get(resolvedPath);
    if (db) {
        try {
            db.close();
        }
        catch ( /* already closed */_a) { /* already closed */ }
        dbCache.delete(resolvedPath);
    }
}
// ─── Migrations ─────────────────────────────────────────────────────────────
const INIT_SQL = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT,
  agents TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_type TEXT CHECK(assignee_type IN ('member','agent')),
  assignee_id TEXT,
  status TEXT NOT NULL CHECK(status IN
    ('backlog','queued','claimed','running','review','done',
     'failed','cancelled','timeout')),
  priority TEXT CHECK(priority IN ('low','medium','high','urgent')),
  ord INTEGER NOT NULL DEFAULT 0,
  pinned_session_id TEXT,
  prior_session_id TEXT,
  prior_workdir TEXT,
  current_workdir TEXT,
  failure_reason TEXT,
  error_message TEXT,
  conversation_id TEXT UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_conversation ON tasks(conversation_id);

CREATE TABLE IF NOT EXISTS task_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_task_messages_task ON task_messages(task_id, id);

CREATE TABLE IF NOT EXISTS running_processes (
  task_id TEXT PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
  pid INTEGER NOT NULL,
  pgid INTEGER,
  started_at TEXT NOT NULL,
  host TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  project_id TEXT,
  task_id TEXT,
  actor_type TEXT,
  actor_id TEXT,
  meta TEXT,
  created_at TEXT NOT NULL
);
`;
function runMigrations(db) {
    db.exec(INIT_SQL);
}
