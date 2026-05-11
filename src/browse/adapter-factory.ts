/**
 * AdapterFactory — Auto-detect and select the best available browser adapter.
 * Priority: agent-browser → Playwright (fallback).
 */

import type { BrowserAdapter } from './adapters/types';
import { AgentBrowserAdapter } from './adapters/agent-browser-adapter';
import { PlaywrightAdapter } from './adapters/playwright-adapter';

export type EngineName = 'agent-browser' | 'playwright' | 'auto';

export interface AdapterFactoryResult {
  adapter: BrowserAdapter;
  engine: string;
  fallback: boolean;
}

/**
 * Create the best available adapter.
 * @param preferred - 'auto' (default), 'agent-browser', or 'playwright'
 */
export async function createAdapter(preferred: EngineName = 'auto'): Promise<AdapterFactoryResult> {
  // Explicit choice
  if (preferred === 'playwright') {
    const pw = new PlaywrightAdapter();
    if (!(await pw.isAvailable())) {
      throw new Error('Playwright is not available. Run: npx playwright install chromium');
    }
    return { adapter: pw, engine: 'playwright', fallback: false };
  }

  if (preferred === 'agent-browser') {
    const ab = new AgentBrowserAdapter();
    if (!(await ab.isAvailable())) {
      throw new Error(
        'agent-browser is not available. Run: npm i -g agent-browser && agent-browser install',
      );
    }
    return { adapter: ab, engine: 'agent-browser', fallback: false };
  }

  // Auto: try agent-browser first, fallback to playwright
  const ab = new AgentBrowserAdapter();
  if (await ab.isAvailable()) {
    return { adapter: ab, engine: 'agent-browser', fallback: false };
  }

  const pw = new PlaywrightAdapter();
  if (await pw.isAvailable()) {
    console.log('[cm-browse] agent-browser not found, falling back to Playwright');
    return { adapter: pw, engine: 'playwright', fallback: true };
  }

  throw new Error(
    'No browser engine available. Install one:\n' +
    '  npm i -g agent-browser && agent-browser install\n' +
    '  npx playwright install chromium',
  );
}

/**
 * Check which engines are available without creating adapters.
 */
export async function checkEngines(): Promise<{
  'agent-browser': boolean;
  playwright: boolean;
}> {
  const ab = new AgentBrowserAdapter();
  const pw = new PlaywrightAdapter();

  const [abAvail, pwAvail] = await Promise.all([ab.isAvailable(), pw.isAvailable()]);

  return {
    'agent-browser': abAvail,
    playwright: pwAvail,
  };
}
