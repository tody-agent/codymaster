"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incMetric = incMetric;
exports.setMetric = setMetric;
exports.metricsHandler = metricsHandler;
const metrics = {
    cm_tasks_running: 0,
    cm_dispatch_total: 0,
    cm_dispatch_duration_seconds_sum: 0,
    cm_dispatch_duration_seconds_count: 0,
    cm_backend_errors_total: 0,
    cm_requests_total: 0,
};
function incMetric(name, value = 1) {
    if (name in metrics) {
        metrics[name] += value;
    }
}
function setMetric(name, value) {
    metrics[name] = value;
}
function metricsHandler(_req, res) {
    let output = '';
    for (const [key, value] of Object.entries(metrics)) {
        output += `# TYPE ${key} counter\n`;
        output += `${key} ${value}\n`;
    }
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.send(output);
}
