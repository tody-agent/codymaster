"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastToProject = broadcastToProject;
exports.broadcastAll = broadcastAll;
exports.initWsHub = initWsHub;
const ws_1 = require("ws");
const event_bus_1 = require("./event-bus");
const HEARTBEAT_INTERVAL = 15000;
const MAX_BUFFER = 100;
const clients = new Set();
function send(client, event) {
    if (client.ws.readyState !== ws_1.WebSocket.OPEN)
        return;
    client.buffer.push(event);
    if (client.buffer.length > MAX_BUFFER) {
        client.buffer.shift();
    }
    client.ws.send(JSON.stringify(event));
}
function broadcastToProject(projectId, event) {
    for (const client of clients) {
        if (client.projectId === projectId) {
            send(client, event);
        }
    }
}
function broadcastAll(event) {
    for (const client of clients) {
        send(client, event);
    }
}
function initWsHub(server) {
    const wss = new ws_1.WebSocketServer({ server, path: '/ws' });
    wss.on('connection', (ws) => {
        const client = { ws, buffer: [], alive: true };
        clients.add(client);
        ws.on('message', (raw) => {
            let msg;
            try {
                msg = JSON.parse(raw.toString());
            }
            catch (_a) {
                return;
            }
            if (msg.action === 'subscribe' && msg.projectId) {
                client.projectId = msg.projectId;
                ws.send(JSON.stringify({ type: 'subscribed', projectId: msg.projectId }));
            }
            else if (msg.action === 'unsubscribe') {
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
    event_bus_1.eventBus.on('task', (event) => {
        if ('projectId' in event) {
            broadcastToProject(event.projectId, event);
        }
    });
    event_bus_1.eventBus.on('activity', (event) => {
        if ('activity' in event && event.activity.projectId) {
            broadcastToProject(event.activity.projectId, event);
        }
    });
    event_bus_1.eventBus.on('agent', (event) => {
        broadcastAll(event);
    });
}
