/**
 * Browse Hybrid Bridge — public API.
 */

export type {
  BrowserAdapter,
  SessionOpts,
  A11ySnapshot,
  A11yNode,
  ConsoleEntry,
  NetworkEntry,
  BrowserError,
  ErrorType,
  ErrorSeverity,
  EngineInfo,
} from './adapters/types';

export { PlaywrightAdapter } from './adapters/playwright-adapter';
export { AgentBrowserAdapter } from './adapters/agent-browser-adapter';
export { createAdapter, checkEngines, type EngineName, type AdapterFactoryResult } from './adapter-factory';
export { ErrorCollector } from './error-collector';
export { EventLog, type EventLogEntry, type EventFilter, type EventCategory } from './event-log';
