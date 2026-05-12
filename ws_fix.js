const fs = require('fs');
const filepath = 'src/realtime/ws-hub.ts';
let content = fs.readFileSync(filepath, 'utf8');

const search = `  wss.on('connection', (ws: WebSocket) => {`;
const replace = `  wss.on('connection', (ws: WebSocket, req) => {
    // Basic auth via query token matching the dashboard token
    const url = new URL(req.url || '', \`http://\${req.headers.host}\`);
    const token = url.searchParams.get('token');
    if (process.env.CM_DASHBOARD_TOKEN && token !== process.env.CM_DASHBOARD_TOKEN) {
        // Just note that if CM_DASHBOARD_TOKEN was auto-generated in dashboard.ts, it's already written to process.env there
    }
`;

// Wait, the token generated in dashboard.ts is just a local variable!
// Let's modify dashboard.ts to write it to process.env.CM_DASHBOARD_TOKEN if it isn't there
