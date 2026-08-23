import { WebSocketServer, WebSocket } from 'ws';
import type { Server, IncomingMessage } from 'http';
import { eventBus, type DomainEvent } from './event-bus';
import crypto from 'crypto';

const HEARTBEAT_INTERVAL = 15_000;
const MAX_BUFFER = 100;

interface Client {
  ws: WebSocket;
  projectId?: string;
  buffer: DomainEvent[];
  alive: boolean;
}

const clients = new Set<Client>();

function send(client: Client, event: DomainEvent): void {
  if (client.ws.readyState !== WebSocket.OPEN) return;
  client.buffer.push(event);
  if (client.buffer.length > MAX_BUFFER) {
    client.buffer.shift();
  }
  client.ws.send(JSON.stringify(event));
}

export function broadcastToProject(projectId: string, event: DomainEvent): void {
  for (const client of clients) {
    if (client.projectId === projectId) {
      send(client, event);
    }
  }
}

export function broadcastAll(event: DomainEvent): void {
  for (const client of clients) {
    send(client, event);
  }
}

export function initWsHub(server: Server, token?: string): void {
  // If the environment dictates we should have a token but it's falsy, we should fail closed.
  // However, `token` is historically optional (e.g., local dev). If it IS configured, we must compare securely.

  // To avoid recomputing the expected hash on every connection, compute it once.
  const hashWant = token ? crypto.createHash('sha256').update(token).digest() : null;

  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
    // Fail-closed: when a token is configured, every WS client must present a
    // matching ?token=… query param or the connection is rejected.
    if (hashWant) {
      let provided = '';
      try {
        provided = new URL(request.url || '', 'http://localhost').searchParams.get('token') || '';
      } catch { /* malformed URL → provided stays empty → rejected below */ }

      const hashProvided = crypto.createHash('sha256').update(provided).digest();

      if (!crypto.timingSafeEqual(hashWant, hashProvided)) {
        ws.close(1008, 'unauthorized');
        return;
      }
    }

    const client: Client = { ws, buffer: [], alive: true };
    clients.add(client);

    ws.on('message', (raw: Buffer) => {
      let msg: { action?: string; projectId?: string };
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.action === 'subscribe' && msg.projectId) {
        client.projectId = msg.projectId;
        ws.send(JSON.stringify({ type: 'subscribed', projectId: msg.projectId }));
      } else if (msg.action === 'unsubscribe') {
        client.projectId = undefined;
        ws.send(JSON.stringify({ type: 'unsubscribed' }));
      }
    });

    ws.on('pong', () => {
      client.alive = true;
    });

    ws.on('close', () => {
      clients.delete(client);
    });

    ws.on('error', () => {
      clients.delete(client);
    });
  });

  const heartbeat = setInterval(() => {
    for (const client of clients) {
      if (!client.alive) {
        client.ws.terminate();
        clients.delete(client);
        continue;
      }
      client.alive = false;
      client.ws.ping();
    }
  }, HEARTBEAT_INTERVAL);

  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  eventBus.on('task', (event: DomainEvent) => {
    if ('projectId' in event) {
      broadcastToProject(event.projectId, event);
    }
  });

  eventBus.on('activity', (event: DomainEvent) => {
    if ('activity' in event && event.activity.projectId) {
      broadcastToProject(event.activity.projectId, event);
    }
  });

  eventBus.on('agent', (event: DomainEvent) => {
    broadcastAll(event);
  });
}
