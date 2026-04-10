/**
 * Shared loader for `.cm/config.yaml` — storage, browse daemon, guardian, canary.
 * Uses the `yaml` package; unknown keys are ignored.
 */

import fs from 'fs';
import path from 'path';
import { parseDocument } from 'yaml';
import type { VikingConfig } from './backends/viking-http-client';

export interface CmBrowseConfig {
  port?: number;
  host?: string;
  token?: string;
}

export interface CmGuardianConfig {
  whitelist_prefixes?: string[];
  freeze_roots?: string[];
}

export interface CmCanaryConfig {
  browse_port?: number;
  token?: string;
}

export interface CmConfig {
  storage?: {
    backend?: string;
    viking?: Partial<VikingConfig>;
  };
  browse?: CmBrowseConfig;
  guardian?: CmGuardianConfig;
  canary?: CmCanaryConfig;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

/** Scalars only (e.g. storage.backend may be unquoted in YAML). */
function scalarStr(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'string') return v.trim() || undefined;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return undefined;
}

function num(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  return undefined;
}

function strArray(v: unknown): string[] | undefined {
  if (Array.isArray(v)) {
    const a = v.map((x) => String(x).trim()).filter(Boolean);
    return a.length ? a : undefined;
  }
  if (typeof v === 'string') {
    const a = v.split(',').map((s) => s.trim()).filter(Boolean);
    return a.length ? a : undefined;
  }
  return undefined;
}

export function loadCmConfig(projectPath: string): CmConfig {
  const configPath = path.join(projectPath, '.cm', 'config.yaml');
  if (!fs.existsSync(configPath)) return {};
  try {
    const doc = parseDocument(fs.readFileSync(configPath, 'utf8'));
    const root = doc.toJSON();
    const o = asRecord(root);
    if (!o) return {};

    const out: CmConfig = {};

    const storageRaw = asRecord(o.storage);
    if (storageRaw) {
      out.storage = { backend: scalarStr(storageRaw.backend) };
      const vikingRaw = asRecord(storageRaw.viking);
      if (vikingRaw) {
        const viking: Partial<VikingConfig> = {};
        const h = str(vikingRaw.host);
        const ws = str(vikingRaw.workspace);
        const p = num(vikingRaw.port);
        const t = num(vikingRaw.timeout);
        if (h !== undefined) viking.host = h;
        if (ws !== undefined) viking.workspace = ws;
        if (p !== undefined) viking.port = p;
        if (t !== undefined) viking.timeout = t;
        if (Object.keys(viking).length) out.storage.viking = viking;
      }
    }

    const browseRaw = asRecord(o.browse);
    if (browseRaw) {
      out.browse = {
        port: num(browseRaw.port),
        host: str(browseRaw.host),
        token: str(browseRaw.token),
      };
    }

    const guardianRaw = asRecord(o.guardian);
    if (guardianRaw) {
      out.guardian = {
        whitelist_prefixes: strArray(guardianRaw.whitelist_prefixes),
        freeze_roots: strArray(guardianRaw.freeze_roots),
      };
    }

    const canaryRaw = asRecord(o.canary);
    if (canaryRaw) {
      out.canary = {
        browse_port: num(canaryRaw.browse_port),
        token: str(canaryRaw.token),
      };
    }

    return out;
  } catch {
    return {};
  }
}
