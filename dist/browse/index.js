"use strict";
/**
 * Browse Hybrid Bridge — public API.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventLog = exports.ErrorCollector = exports.checkEngines = exports.createAdapter = exports.AgentBrowserAdapter = exports.PlaywrightAdapter = void 0;
var playwright_adapter_1 = require("./adapters/playwright-adapter");
Object.defineProperty(exports, "PlaywrightAdapter", { enumerable: true, get: function () { return playwright_adapter_1.PlaywrightAdapter; } });
var agent_browser_adapter_1 = require("./adapters/agent-browser-adapter");
Object.defineProperty(exports, "AgentBrowserAdapter", { enumerable: true, get: function () { return agent_browser_adapter_1.AgentBrowserAdapter; } });
var adapter_factory_1 = require("./adapter-factory");
Object.defineProperty(exports, "createAdapter", { enumerable: true, get: function () { return adapter_factory_1.createAdapter; } });
Object.defineProperty(exports, "checkEngines", { enumerable: true, get: function () { return adapter_factory_1.checkEngines; } });
var error_collector_1 = require("./error-collector");
Object.defineProperty(exports, "ErrorCollector", { enumerable: true, get: function () { return error_collector_1.ErrorCollector; } });
var event_log_1 = require("./event-log");
Object.defineProperty(exports, "EventLog", { enumerable: true, get: function () { return event_log_1.EventLog; } });
