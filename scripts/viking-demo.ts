import express from 'express';
import { VikingBackend } from '../src/backends/viking-backend';
import { DEFAULT_VIKING_CONFIG } from '../src/backends/viking-http-client';
import chalk from 'chalk';

/**
 * Viking Demo — Hamster-Powered Semantic Search
 * 
 * This script demonstrates the CodyMaster v4.6 integration with OpenViking.
 * It starts a mock OpenViking REST API and then uses CodyMaster's VikingBackend 
 * to perform a semantic search query.
 */

async function runDemo() {
  const PORT = 1933;
  const app = express();
  app.use(express.json());

  console.log(chalk.bold.cyan('\n🐹 CodyMaster v4.6 — OpenViking Integration Demo\n'));

  // ─── Phase 1: Mock OpenViking Server ───────────────────────────────────────
  
  console.log(chalk.dim('  [1/3] Starting Mock OpenViking Server...'));

  // Mock /health endpoint
  app.get('/health', (req, res) => res.json({ status: 'ok', version: '1.2.0' }));

  // Mock /search endpoint (the core of Viking)
  app.post('/search', (req, res) => {
    const { query, limit, workspace } = req.body;
    console.log(chalk.yellow(`        ☁️  Viking Server received search: "${query}" (limit: ${limit}, ws: ${workspace})`));
    
    const mockResults = [
      {
        uri: 'ov://demo-vibe/learnings/lear-882.json',
        score: 0.98,
        content: JSON.stringify({
          what_failed: 'Async fetch timeout on slow networks',
          why_failed: 'Default timeout too short for 3G/4G high-latency spikes',
          how_to_prevent: 'Increase timeout to 30s + implement exponential backoff retry'
        })
      },
      {
        uri: 'ov://demo-vibe/learnings/lear-451.json',
        score: 0.72,
        content: JSON.stringify({
          what_failed: 'Database connection leak in long-running loops',
          why_failed: 'await missing in cleanup block',
          how_to_prevent: 'Use try-finally with await client.close()'
        })
      }
    ];
    
    res.json({ items: mockResults });
  });

  const server = app.listen(PORT);

  // ─── Phase 2: CodyMaster Viking Backend ────────────────────────────────────
  
  console.log(chalk.dim('  [2/3] Initializing CodyMaster VikingBackend...'));
  
  const backend = new VikingBackend({
    host: 'localhost',
    port: PORT,
    workspace: 'demo-vibe',
    timeout: 5000
  });

  // ─── Phase 3: Perform Semantic Search ──────────────────────────────────────
  
  console.log(chalk.bold('  [3/3] Performing Semantic Search Query (Async Pipeline)...\n'));
  
  const query = 'network latency issues';
  console.log(chalk.white(`        Query: "${query}"`));
  
  // Use the native ASYNC extra searchAll instead of the SYNC wrapper
  // This bypasses the blockUntil spin-loop for a clean demo.
  const results = await backend.searchAll(query, 5);

  if (results.length > 0) {
    console.log(chalk.green(`\n    ✅ FOUND ${results.length} RELEVANT MEMORIES VIA VIKING:\n`));
    
    results.forEach((r, idx) => {
      const content = JSON.parse(r.content || '{}');
      console.log(chalk.bold(`    ${idx + 1}. ${chalk.cyan(content.what_failed)}`));
      console.log(chalk.dim(`       Why: ${content.why_failed}`));
      console.log(chalk.dim(`       Fix: ${chalk.white(content.how_to_prevent)}`));
      console.log(chalk.italic.magenta(`       Vector Similarity: ${Math.round((r.score || 0) * 100)}%\n`));
    });
  } else {
    console.log(chalk.red('    ❌ No results found.'));
  }

  // ─── Cleanup ───────────────────────────────────────────────────────────────
  
  console.log(chalk.dim('  Demo complete. Shutting down...'));
  server.close();
  process.exit(0);
}

runDemo().catch(err => {
  console.error(chalk.red('\n  🛑 Demo Failed:'), err);
  process.exit(1);
});
