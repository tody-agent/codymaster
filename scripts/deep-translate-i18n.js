/**
 * Deep Translation v3 — Uses raw Gemini CLI output (no -o json)
 * Processes one language at a time, one namespace at a time
 */
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const I18N_DIR = path.resolve(__dirname, '../public/i18n');
const LANGS = {
    'vi': 'Vietnamese',
    'zh': 'Simplified Chinese',
    'ru': 'Russian',
    'ko': 'Korean',
    'hi': 'Hindi'
};
const SKIP_RE = /^(cm-|cro-|CodyMaster|GitHub|Discord|CLI|API|TDD|AGENTS\.md|CONTINUITY\.md|Node\.js|REST|GraphQL|StoryBrand|VitePress|Tailwind|Figma|Unsplash|StackBlitz|PostgreSQL|= init\(\)|Loki Mode|Cody Master|Gemini|Claude|Cursor|Cialdini|Firebase|Supabase|Cloudflare|VS Code|Antigravity|OpenCode|Windsurf)$/;

function isSkippable(val) {
    if (typeof val !== 'string') return true;
    if (val.length <= 2) return true;
    if (/^[0-9\s.,\-+\/()!?#%&*=<>~|]+$/.test(val)) return true;
    if (val.startsWith("cm-") || val.startsWith("cro-")) return true;
    if (SKIP_RE.test(val)) return true;
    // Pure emoji
    if (/^[\p{Emoji}\s]+$/u.test(val)) return true;
    return false;
}

function collectUntranslated(en, target, prefix) {
    const items = [];
    for (const key in en) {
        const fp = prefix ? `${prefix}.${key}` : key;
        const ev = en[key], tv = target?.[key];
        if (typeof ev === 'object' && ev !== null && !Array.isArray(ev)) {
            if (typeof tv === 'object' && tv !== null)
                items.push(...collectUntranslated(ev, tv, fp));
        } else if (Array.isArray(ev) && Array.isArray(tv)) {
            for (let i = 0; i < ev.length && i < tv.length; i++) {
                if (typeof ev[i] === 'string') {
                    if (ev[i] === tv[i] && !isSkippable(ev[i]))
                        items.push({ path: `${fp}[${i}]`, value: ev[i] });
                } else if (typeof ev[i] === 'object' && typeof tv[i] === 'object') {
                    items.push(...collectUntranslated(ev[i], tv[i], `${fp}[${i}]`));
                }
            }
        } else if (typeof ev === 'string') {
            if (ev === tv && !isSkippable(ev))
                items.push({ path: fp, value: ev });
        }
    }
    return items;
}

function setAtPath(obj, pathStr, value) {
    const parts = pathStr.replace(/\[(\d+)\]/g, '.$1').split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const k = parts[i];
        if (cur[k] === undefined) cur[k] = /^\d+$/.test(parts[i+1]) ? [] : {};
        cur = cur[k];
    }
    cur[parts[parts.length - 1]] = value;
}

function runGemini(prompt) {
    return new Promise((resolve) => {
        // Use -y to skip confirmation, no -o json
        const child = execFile('gemini', ['-y', '-p', prompt], 
            { maxBuffer: 1024 * 1024 * 100, timeout: 120000 },
            (error, stdout, stderr) => {
                if (error) {
                    console.error(`  CLI err: ${error.message?.substring(0, 80)}`);
                    return resolve(null);
                }
                resolve(stdout || stderr || null);
            });
    });
}

function extractJSON(text) {
    if (!text) return null;
    // Try to find JSON block in markdown code fence
    const fenceMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
    if (fenceMatch) {
        try { return JSON.parse(fenceMatch[1]); } catch (e) {}
    }
    // Try to find raw JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try { return JSON.parse(jsonMatch[0]); } catch (e) {}
    }
    return null;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
    const namespaces = ['common', 'home', 'personas', 'skills', 'pages', 'vs'];
    
    // Process only the specified language or all
    const targetLang = process.argv[2]; // e.g., "vi"
    const langsToProcess = targetLang ? { [targetLang]: LANGS[targetLang] } : LANGS;
    
    let totalUpdated = 0, totalFailed = 0;
    
    for (const [lc, ln] of Object.entries(langsToProcess)) {
        console.log(`\n🌍 Processing ${ln} (${lc})...`);
        
        for (const ns of namespaces) {
            const enPath = path.join(I18N_DIR, 'en', `${ns}.json`);
            const tPath = path.join(I18N_DIR, lc, `${ns}.json`);
            if (!fs.existsSync(tPath)) continue;
            
            const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
            const tData = JSON.parse(fs.readFileSync(tPath, 'utf8'));
            const items = collectUntranslated(enData, tData, '');
            
            if (items.length === 0) {
                console.log(`  ⏭️ [${ns}] No untranslated strings`);
                continue;
            }
            
            // Process in chunks of 50
            for (let i = 0; i < items.length; i += 50) {
                const chunk = items.slice(i, i + 50);
                const inputObj = {};
                chunk.forEach(it => { inputObj[it.path] = it.value; });
                
                const prompt = `Translate the JSON values below to ${ln}. Keep the keys EXACTLY identical. Keep brand names (CodyMaster, GitHub, etc.) and technical terms in English. Keep HTML tags and {{variables}} intact. Return ONLY the translated JSON object, nothing else.

${JSON.stringify(inputObj, null, 2)}`;
                
                console.log(`  ⏳ [${ns}] Translating ${chunk.length} strings (batch ${Math.floor(i/50)+1})...`);
                
                const response = await runGemini(prompt);
                const result = extractJSON(response);
                
                if (result) {
                    // Re-read to avoid race conditions
                    const liveData = JSON.parse(fs.readFileSync(tPath, 'utf8'));
                    let updates = 0;
                    
                    for (const [dp, tv] of Object.entries(result)) {
                        if (tv && typeof tv === 'string') {
                            setAtPath(liveData, dp, tv);
                            updates++;
                        }
                    }
                    
                    if (updates > 0) {
                        fs.writeFileSync(tPath, JSON.stringify(liveData, null, 2), 'utf8');
                        totalUpdated += updates;
                    }
                    console.log(`  ✅ [${ns}] ${updates}/${chunk.length} applied`);
                } else {
                    totalFailed += chunk.length;
                    console.log(`  ❌ [${ns}] Failed to parse response`);
                    if (response) console.log(`     Response preview: ${response.substring(0, 200)}`);
                }
                
                await sleep(2000);
            }
        }
    }
    
    console.log(`\n🏁 DONE: ${totalUpdated} translations applied, ${totalFailed} failed`);
}

main().catch(console.error);
