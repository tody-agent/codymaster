import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Test the backend Bash Runner (dockit-runner.sh)

describe('CM DocKit Runner (Backend Scripts)', () => {
  let tempProjectDir: string;
  let dockitRunnerPath: string;

  beforeAll(() => {
    // Create a temporary mock project
    tempProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dockit-test-'));
    dockitRunnerPath = path.resolve(__dirname, '../scripts/dockit-runner.sh');
    // Ensure scripts have execute permission
    execSync(`chmod +x ${dockitRunnerPath}`);
  });

  afterAll(() => {
    // Cleanup
    fs.rmSync(tempProjectDir, { recursive: true, force: true });
  });

  it('should plan tasks correctly via dry-run and initialize progress file', () => {
    // Run the script in dry-run mode
    const cmd = `bash ${dockitRunnerPath} -p ${tempProjectDir} -t all --dry-run`;
    let output = '';
    try {
      output = execSync(cmd, { encoding: 'utf-8' });
    } catch (e: any) {
      output = e.stdout || e.message;
    }
    
    // Verify execution output contains plans
    expect(output).toContain('Task Plan (dry-run)');
    expect(output).toContain('Total: 12 tasks'); // Expecting 12 planned tasks for type=all
    
    // Verify that the _progress.json file was created during initialization
    const progressFile = path.join(tempProjectDir, 'docs', '_progress.json');
    expect(fs.existsSync(progressFile)).toBe(true);
    
    // Verify JSON structure and DAG paths
    const progressData = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
    expect(progressData).toHaveProperty('tasks');
    expect(Array.isArray(progressData.tasks)).toBe(true);

    const tasks = progressData.tasks;
    
    // 1. Initial Analysis Task
    const analysisTask = tasks.find((t: any) => t.id === 'analysis');
    expect(analysisTask).toBeDefined();
    expect(analysisTask.depends_on).toBe(null); // Phase 0
    
    // 2. Tech Architecture Tasks depend on analysis
    const archTask = tasks.find((t: any) => t.id === 'architecture');
    expect(archTask).toBeDefined();
    expect(archTask.depends_on).toBe('analysis');

    // 3. SOP Tasks depend on analysis (or personas)
    const sopTask = tasks.find((t: any) => t.id === 'sop-index');
    expect(sopTask).toBeDefined();
    expect(sopTask.depends_on).toBe('personas'); // when type=all
  });
});
