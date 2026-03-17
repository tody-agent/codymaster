import express from 'express';
import chalk from 'chalk';

export function launchDashboard(port: number = 3455) {
  const app = express();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>CodyMaster Skills Dashboard</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0d1117; color: #c9d1d9; padding: 40px; }
        h1 { color: #58a6ff; }
        .card { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 20px; margin-bottom: 20px; }
        .status-running { color: #3fb950; font-weight: bold; }
        .status-queue { color: #d29922; font-weight: bold; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      </style>
    </head>
    <body>
      <h1>🧠 CodyMaster - Dashboard</h1>
      <div class="grid">
        <div class="card">
          <h2>Super Agent Status</h2>
          <p>Status: <span class="status-running">● Planning & Dispatching</span></p>
          <p>Active Task: <i>Migrating legacy user database</i></p>
        </div>
        <div class="card">
          <h2>Subagent Fleet</h2>
          <ul>
            <li>Subagent 1 (DB Builder): <span class="status-running">● Executing</span> \`schema.sql\`</li>
            <li>Subagent 2 (API Routes): <span class="status-running">● Executing</span> \`users.ts\`</li>
            <li>Subagent 3 (Frontend UI): <span class="status-queue">Pending...</span></li>
          </ul>
        </div>
      </div>
      <div class="card">
        <h2>Logs & Memory Activity</h2>
        <pre style="color: #8b949e;">[10:44] Super Agent initialized workspace.
[10:45] Compiled "cm-clean-architecture" universal skill into Cursor rules.
[10:45] Dispatched 3 subagents for parallel execution.
[10:46] Subagent 1 merged changes...</pre>
      </div>
    </body>
    </html>
  `;

  app.get('/', (req, res) => {
    res.send(htmlContent);
  });

  app.listen(port, () => {
    console.log(chalk.cyan(`\n🚀 CodyMaster Dashboard launched at http://localhost:${port}`));
    console.log(chalk.gray(`Press Ctrl+C to stop the dashboard server.`));
  });
}
