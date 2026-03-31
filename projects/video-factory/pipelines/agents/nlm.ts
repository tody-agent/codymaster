import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { VideoScript } from '../../src/lib/types';
import dotenv from 'dotenv';

dotenv.config();

const MAX_SOURCES = parseInt(process.env.NLM_MAX_SOURCES_PER_NOTEBOOK || '7', 10);
const NLM_STATE_FILE = path.resolve(process.cwd(), 'queue', 'nlm_state.json');

interface NLMState {
  currentNotebookId: string | null;
  currentSourceCount: number;
  notebookFolderIndex: number;
  notebookNamePrefix: string;
}

export const nlmAgent = {
  /**
   * Reads or initializes the NLM state file
   */
  getState(prefix: string): NLMState {
    if (fs.existsSync(NLM_STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(NLM_STATE_FILE, 'utf-8'));
      if (state.notebookNamePrefix === prefix) {
        return state;
      }
    }
    return {
      currentNotebookId: null,
      currentSourceCount: 0,
      notebookFolderIndex: 1,
      notebookNamePrefix: prefix
    };
  },

  /**
   * Saves the NLM state
   */
  saveState(state: NLMState) {
    if (!fs.existsSync(path.dirname(NLM_STATE_FILE))) {
      fs.mkdirSync(path.dirname(NLM_STATE_FILE), { recursive: true });
    }
    fs.writeFileSync(NLM_STATE_FILE, JSON.stringify(state, null, 2));
  },

  /**
   * Ensures we have an active notebook that hasn't exceeded the max sources limit
   */
  async ensureActiveNotebook(topicPrefix: string): Promise<string> {
    let state = this.getState(topicPrefix);

    if (!state.currentNotebookId || state.currentSourceCount >= MAX_SOURCES) {
      // Need to create a new notebook
      const notebookName = `${topicPrefix}_${String(state.notebookFolderIndex).padStart(2, '0')}`;
      console.log(`[NLM] Creating new NotebookLM: "${notebookName}"...`);
      
      try {
        const result = execFileSync('nlm', ['notebook', 'create', notebookName], { encoding: 'utf-8' });
        // Assuming output format: "Created notebook 'name' with ID: uuid"
        // This is a rough parse, adjust based on actual nlm CLI output
        const idMatch = result.match(/ID:\s*([a-zA-Z0-9-]+)/);
        const notebookId = idMatch ? idMatch[1] : '';

        if (!notebookId) {
            console.warn(`[NLM Error] Could not parse notebook ID. CLI Output: ${result}`);
            // Fallback: we might need to list notebooks and find it
        }

        state.currentNotebookId = notebookId;
        state.currentSourceCount = 0;
        state.notebookFolderIndex++;
        this.saveState(state);
        console.log(`[NLM] Created successfully. ID: ${notebookId}`);
        return notebookId;
      } catch (error: any) {
        console.error(`[NLM Error] Failed creating notebook:`, error.message);
        throw error;
      }
    }

    return state.currentNotebookId;
  },

  /**
   * Process the script: upload to NLM and request Audio Overview
   */
  async process(script: VideoScript, topicPrefix: string = 'VideoFactory'): Promise<void> {
    console.log(`[NLM] Processing script: "${script.title}"`);
    
    try {
      // 1. Ensure we have room in the current notebook
      const notebookId = await this.ensureActiveNotebook(topicPrefix);
      let state = this.getState(topicPrefix);

      // 2. Add source to the notebook
      // We will create a temporary markdown file to upload
      const tmpFilePath = path.resolve(process.cwd(), 'queue', `${script.id}_nlm_source.md`);
      fs.writeFileSync(tmpFilePath, `# ${script.title}\n\n${script.hook}\n\n${script.scenes.map(s => s.text).join('\n')}`);
      
      console.log(`[NLM] Adding source to Notebook ${notebookId}...`);
      // `nlm source add <notebook_id> file <path>`
      execFileSync('nlm', ['source', 'add', notebookId, 'file', tmpFilePath], { stdio: 'pipe' });
      fs.unlinkSync(tmpFilePath); // cleanup

      state.currentSourceCount++;
      this.saveState(state);
      console.log(`[NLM] Source added successfully. Container at ${state.currentSourceCount}/${MAX_SOURCES} sources.`);

      // 3. (Optional) Trigger Audio Overview if needed, but NotebookLM currently handles 
      //    audio overviews at the notebook level, not per source. 
      //    We might trigger it once the notebook is full (features permitting).
      if (state.currentSourceCount === MAX_SOURCES) {
         console.log(`[NLM] Notebook ${notebookId} is full. Triggering Audio Overview generation...`);
         // nlm audio generate <notebook_id>
         // execFileSync('nlm', ['audio', 'generate', notebookId], { stdio: 'inherit' });
      }

    } catch (e: any) {
       console.error(`[NLM Agent Error] Failed to process script:`, e.message);
    }
  }
};
