// pipelines/agents/scheduler.ts
import fs from 'fs';
import path from 'path';
import { QueueJob, BatchQueue } from '../../src/lib/types';

export const scheduler = {
  loadQueue(): BatchQueue | null {
    const queuePath = path.resolve(process.cwd(), 'queue', 'progress.json');
    if (fs.existsSync(queuePath)) {
      return JSON.parse(fs.readFileSync(queuePath, 'utf-8'));
    }
    return null;
  },

  getNextJob(): QueueJob | null {
    const queue = this.loadQueue();
    if (!queue) return null;
    return queue.jobs.find(j => j.status === 'queued') || null;
  },

  updateJobStatus(jobId: string, status: QueueJob['status']) {
    console.log(`[Scheduler] Job ${jobId} -> ${status}`);
    // Update queue file implementation here
  }
};
