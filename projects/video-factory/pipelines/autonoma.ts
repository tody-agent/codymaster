// pipelines/autonoma.ts — Main God-Mode Orchestrator
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Import Agents
import { plannerAgent } from './agents/planner.js';
import { researcherAgent } from './agents/researcher.js';
import { scripterAgent } from './agents/scripter.js';
import { nlmAgent } from './agents/nlm.js';
import { ttsEngine } from './agents/tts.js';
import { renderer } from './agents/renderer.js';
import { publisherAgent } from './agents/publisher.js';
import { policyChecker } from './utils/policy-checker.js';

interface AutonomaConfig {
  ideas: string[];
  theme?: string;
  format?: 'tiktok' | 'youtube';
  language?: 'vi' | 'en';
}

/**
 * Autonoma Engine - The entry point for the entire autonomous video factory pipeline.
 * Usage: npx tsx pipelines/autonoma.ts "Top 5 AI Tools" "How to setup Remotion"
 */
async function runFactory(ideas: string[]) {
  console.log(`\n🚀 [Autonoma] Starting Video Factory for ${ideas.length} ideas...`);
  
  if (ideas.length === 0) {
    console.log("❌ No ideas provided. Pass ideas as arguments.");
    process.exit(1);
  }

  for (const idea of ideas) {
    try {
        console.log(`\n======================================================`);
        console.log(`🎬 PROCESSING IDEA: "${idea}"`);
        console.log(`======================================================\n`);

        // Phase 1: Planning
        console.log(`[1] 📝 Planning outline and hook formulas...`);
        const plan = await plannerAgent.generatePlan(idea);
        console.log(`  └─ Plan generated: Hook is "${plan.hook}"`);

        // Phase 2: Research
        console.log(`[2] 🔍 Researching accurate data and trends...`);
        const context = await researcherAgent.deepSearch(plan);
        console.log(`  └─ Research complete.`);

        // Phase 3: Script Writing
        console.log(`[3] ✍️ Writing Remotion JSON Script...`);
        const script = await scripterAgent.generateScript(plan, context);
        
        // Phase 3.5: Policy Check
        const policyStatus = policyChecker.check(script);
        if (!policyStatus.valid) {
          throw new Error(`Policy check failed: ${policyStatus.errors.join(', ')}`);
        }
        
        if (!fs.existsSync(path.join(ROOT_DIR, 'scripts-input'))) {
          fs.mkdirSync(path.join(ROOT_DIR, 'scripts-input'), { recursive: true });
        }
        fs.writeFileSync(path.join(ROOT_DIR, 'scripts-input', `${script.id}.json`), JSON.stringify(script, null, 2));
        console.log(`  └─ Script saved: scripts-input/${script.id}.json`);

        // Phase 4: NotebookLM (Knowledge & Audio Overview) - Parallel
        console.log(`[4] 🧠 Uploading to NotebookLM + Generating Audio Outline...`);
        await nlmAgent.process(script);
        console.log(`  └─ NotebookLM processing started.`);

        // Phase 5: TTS (Text-to-Speech)
        console.log(`[5] 🎙️ Generating TTS Audio tracks...`);
        const audioPath = await ttsEngine.generateAudio(script);
        console.log(`  └─ TTS Audio generated: ${audioPath}`);

        // Phase 6: Render (Remotion)
        console.log(`[6] 🎞️ Rendering video payload with Remotion...`);
        const videoPath = await renderer.renderTikTok(script.id);
        console.log(`  └─ Render completed: ${videoPath}`);

        // Phase 7: Publisher
        console.log(`[7] 📤 Auto-uploading via Agent-Browser...`);
        await publisherAgent.upload({ videoPath, script });
        console.log(`  └─ Published successfully! 🎉\n`);
    } catch (error) {
        console.error(`❌ [Autonoma Error] Failed processing idea "${idea}":`, error);
    }
  }

  console.log(`\n✅ [Autonoma] Factory run completed.`);
}

// CLI Execution
const args = process.argv.slice(2);
const ideas = args.length > 0 ? args : ["Building an AI Video Factory in 5 mins"];
runFactory(ideas).catch(console.error);
