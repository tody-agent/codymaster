const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const I18N_DIR = path.resolve(__dirname, '../public/i18n');
const EN_DIR = path.join(I18N_DIR, 'en');
const TARGET_LANGS = {
    'vi': 'Vietnamese',
    'zh': 'Simplified Chinese',
    'ru': 'Russian',
    'ko': 'Korean',
    'hi': 'Hindi'
};

const BATCH_SIZE = 15;
const MAX_CONCURRENT_AGENTS = 5;

// Run terminal command silently and return stdout
function runGeminiCommand(prompt) {
    return new Promise((resolve) => {
        const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`');
        const cmd = `gemini -y -o json -p "${escapedPrompt}"`;
        
        exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Gemini CLI Error:`, stderr || error.message);
            }
            
            const output = stdout || stderr;
            if (!output) {
                return resolve(null);
            }

            try {
                const jsonStart = output.indexOf('{\n  "session_id":');
                if (jsonStart !== -1) {
                    const jsonStr = output.substring(jsonStart);
                    const parsed = JSON.parse(jsonStr);
                    return resolve(parsed.response);
                }
            } catch (e) {
                console.error("Failed to parse JSON output:", e.message);
            }
            
            resolve(output);
        });
    });
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to call LLM for translation
async function translateBatchWithLLM(keys, enData, toLangFull) {
    const inputObj = {};
    keys.forEach(k => inputObj[k] = enData[k]);
    
    const prompt = `You are an expert technical translator working inside a cm-content-factory pipeline.
Translate the values of the following JSON object into ${toLangFull}. 
Rules:
1. Keep the JSON keys EXACTLY identical.
2. Keep any {{variables}} or HTML tags intact.
3. Keep the tone professional but persuasive (for a landing page).
4. Return ONLY valid JSON. Absolutely no markdown blocks, no \`\`\`json, no preamble. Just raw JSON starting with { and ending with }.

JSON to translate:
${JSON.stringify(inputObj)}`;

    const responseText = await runGeminiCommand(prompt);
    if (!responseText) return null;
    
    try {
        let cleanText = responseText.trim();
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            cleanText = jsonMatch[0];
        } else {
            return null;
        }
        
        return JSON.parse(cleanText);
    } catch (e) {
        return null;
    }
}

async function processTranslations() {
    if (!fs.existsSync(EN_DIR)) return;
    
    // Create an array of tasks
    const allTasks = [];
    
    const namespaces = fs.readdirSync(EN_DIR).filter(f => f.endsWith('.json'));
    
    for (const [langCode, langName] of Object.entries(TARGET_LANGS)) {
        const langDir = path.join(I18N_DIR, langCode);
        
        for (const nsFile of namespaces) {
            const enPath = path.join(EN_DIR, nsFile);
            const targetFile = path.join(langDir, nsFile);
            
            if (!fs.existsSync(targetFile)) continue;
            
            const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
            const targetData = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
            const keysToTranslate = [];
            
            for (const key of Object.keys(enData)) {
                const tarVal = targetData[key];
                const enVal = enData[key];
                
                let needsTranslation = false;
                
                if (tarVal === undefined || tarVal === null || tarVal === "") {
                    needsTranslation = true;
                } else if (tarVal === enVal) {
                    const isNonTranslatable = 
                        /^[0-9\s\.,\-\+\/\(\)\|\!\?\#\%\&\*\=\<\>]+$/.test(tarVal) || 
                        /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/.test(tarVal) ||
                        tarVal.length <= 1 || 
                        tarVal.startsWith("cm-") ||
                        ["CodyMaster", "GitHub", "VND", "USD", "EN", "English", "Vibe Coding", "Gemini", "Claude", "Cursor", "Discord", "中 文", "中文", "हिन्दी", "Русский", "한국어", "Tiếng Việt", "= init()"].includes(tarVal);

                    if (!isNonTranslatable) {
                        needsTranslation = true;
                    }
                }
                
                if (needsTranslation) {
                    keysToTranslate.push(key);
                }
            }
            
            if (keysToTranslate.length === 0) continue;
            
            // Chunk into batches
            for (let i = 0; i < keysToTranslate.length; i += BATCH_SIZE) {
                const batchKeys = keysToTranslate.slice(i, i + BATCH_SIZE);
                allTasks.push({
                    langCode,
                    langName,
                    nsFile,
                    batchKeys,
                    enData,
                    targetFile,
                    targetData
                });
            }
        }
    }
    
    console.log(`\n🚀 Initializing cm-content-factory: ${MAX_CONCURRENT_AGENTS} Agent Dispatcher Pool...`);
    console.log(`📋 Total Batches to Process: ${allTasks.length}`);
    
    let completedCount = 0;
    
    // Execute promises with concurrency limit
    async function processQueue(tasks) {
        // We will process 'MAX_CONCURRENT_AGENTS' at a time
        while (tasks.length > 0) {
            const currentAgents = tasks.splice(0, MAX_CONCURRENT_AGENTS);
            
            await Promise.all(currentAgents.map(async (task) => {
                const resultObj = await translateBatchWithLLM(task.batchKeys, task.enData, task.langName);
                
                if (resultObj) {
                    let hasUpdates = false;
                    for (const k of task.batchKeys) {
                        if (resultObj[k]) {
                            task.targetData[k] = resultObj[k];
                            hasUpdates = true;
                        }
                    }
                    
                    if (hasUpdates) {
                        // Re-read file to avoid race conditions across agents writing the same file
                        const liveData = JSON.parse(fs.readFileSync(task.targetFile, 'utf8'));
                        Object.assign(liveData, task.targetData);
                        fs.writeFileSync(task.targetFile, JSON.stringify(liveData, null, 2), 'utf8');
                    }
                    completedCount++;
                    console.log(`✅ Agent completed batch for [${task.langCode}] ${task.nsFile} (${completedCount} global completions)`);
                } else {
                    console.log(`❌ Agent failed batch for [${task.langCode}] ${task.nsFile}`);
                }
            }));
            
            if (tasks.length > 0) {
                // Add a delay between concurrent batches
                console.log(`  Waiting 10s for next set of agents...`);
                await sleep(10000);
            }
        }
    }
    
    await processQueue([...allTasks]);
}

processTranslations().then(() => {
    console.log("\n🎉 Auto-translation completed with Concurrent Agents!");
}).catch(console.error);
