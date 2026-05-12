const fs = require('fs');
const filepath = 'public/dashboard/app.js';
let content = fs.readFileSync(filepath, 'utf8');

const search = `  async function fetchJSON(url, opts) {
    const res = await fetch(url, opts);`;

const replace = `  async function fetchJSON(url, opts) {
    opts = opts || {};
    opts.headers = opts.headers || {};
    const tokenParams = new URLSearchParams(window.location.search);
    const token = tokenParams.get('token') || localStorage.getItem('cm-dashboard-token') || '';
    if (token) {
      opts.headers['Authorization'] = 'Bearer ' + token;
      localStorage.setItem('cm-dashboard-token', token);
    }
    const res = await fetch(url, opts);`;

if(content.includes(search)) {
    content = content.replace(search, replace);

    // Also patch WS connection
    const wsSearch = `    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = \`\${protocol}//\${location.host}/ws\`;
    ws = new WebSocket(wsUrl);`;

    const wsReplace = `    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const tokenParams = new URLSearchParams(window.location.search);
    const token = tokenParams.get('token') || localStorage.getItem('cm-dashboard-token') || '';
    const wsUrl = \`\${protocol}//\${location.host}/ws\` + (token ? \`?token=\${token}\` : '');
    ws = new WebSocket(wsUrl);`;

    content = content.replace(wsSearch, wsReplace);

    fs.writeFileSync(filepath, content);
    console.log("Patched successfully");
} else {
    console.log("Could not find search block");
}
