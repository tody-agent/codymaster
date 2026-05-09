import type { Request, Response } from 'express';

const metrics: Record<string, number> = {
  cm_tasks_running: 0,
  cm_dispatch_total: 0,
  cm_dispatch_duration_seconds_sum: 0,
  cm_dispatch_duration_seconds_count: 0,
  cm_backend_errors_total: 0,
  cm_requests_total: 0,
};

export function incMetric(name: string, value: number = 1): void {
  if (name in metrics) {
    metrics[name] += value;
  }
}

export function setMetric(name: string, value: number): void {
  metrics[name] = value;
}

export function metricsHandler(_req: Request, res: Response): void {
  let output = '';
  for (const [key, value] of Object.entries(metrics)) {
    output += `# TYPE ${key} counter\n`;
    output += `${key} ${value}\n`;
  }
  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.send(output);
}
