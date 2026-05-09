import type { AgentBackend, ExecOptions, AgentResult, AgentMessage } from '../agent/backend';
import type { EventBus } from '../realtime/event-bus';
import { prepareWorkdir, writeGcMeta } from './workdir';

export interface RunTaskOpts {
  backend: AgentBackend;
  taskId: string;
  projectId: string;
  prompt: string;
  execOpts: ExecOptions;
  eventBus: EventBus;
  priorWorkdir?: string;
  pinnedSessionId?: string;
}

export async function runTask(opts: RunTaskOpts): Promise<AgentResult> {
  const {
    backend,
    taskId,
    projectId,
    prompt,
    execOpts,
    eventBus,
    priorWorkdir,
    pinnedSessionId,
  } = opts;

  const projectShort = projectId.slice(0, 8);
  const taskShort = taskId.slice(0, 8);

  const workdir = priorWorkdir ?? prepareWorkdir(projectShort, taskShort);

  const resolvedOpts: ExecOptions = {
    ...execOpts,
    cwd: workdir,
    resumeSessionId: pinnedSessionId ?? execOpts.resumeSessionId,
  };

  const session = await backend.execute(prompt, resolvedOpts);

  let lastSessionId: string | undefined = pinnedSessionId;

  const messageLoop = (async () => {
    for await (const msg of session.messages) {
      emitAgentMessage(eventBus, taskId, projectId, msg);
      if (msg.type === 'text' && msg.sessionId) {
        lastSessionId = msg.sessionId;
      }
    }
  })();

  const [result] = await Promise.all([session.result, messageLoop]);

  if (lastSessionId && !result.sessionId) {
    result.sessionId = lastSessionId;
  }

  writeGcMeta(projectShort, taskShort, {
    taskId,
    projectId,
    completedAt: new Date().toISOString(),
  });

  return result;
}

function emitAgentMessage(
  eventBus: EventBus,
  taskId: string,
  projectId: string,
  msg: AgentMessage,
): void {
  eventBus.emitTask({
    type: 'task.message',
    taskId,
    projectId,
    data: { message: msg },
  });
}
