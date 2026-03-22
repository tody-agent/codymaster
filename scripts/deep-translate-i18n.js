/**
 * Deep Translation v4 — Uses free Google Translate REST endpoint
 * Extremely fast, no API keys needed, bypasses Gemini CLI completely
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const I18N_DIR = path.resolve(__dirname, '../public/i18n');
const LANGS = {
    'ru': 'ru',
    'ko': 'ko',
    'hi': 'hi'
};

const SKIP_RE = /^(cm-|cro-|CodyMaster|GitHub|Discord|CLI|API|TDD|AGENTS\.md|CONTINUITY\.md|Node\.js|REST|GraphQL|StoryBrand|VitePress|Tailwind|Figma|Unsplash|StackBlitz|PostgreSQL|= init\(\)|Loki Mode|Cody Master|Gemini|Claude|Cursor|Cialdini|Firebase|Supabase|Cloudflare|VS Code|Antigravity|OpenCode|Windsurf)$/i;

function isSkippable(val) {
    if (typeof val !== 'string') return true;
    if (val.length <= 2) return true;
    if (/^[0-9\s.,\-+\/()!?#%&*=<>~|]+$/.test(val)) return true;
    if (val.startsWith("cm-") || val.startsWith("cro-")) return true;
    if (SKIP_RE.test(val)) return true;
    if (/^[\p{Emoji}\s]+$/u.test(val)) return true;
    return false;
}

const BRANDS = [
  "CodyMaster", "GitHub", "Discord", "Gemini", "Claude", "Cursor",
  "Tailwind", "Figma", "Unsplash", "StackBlitz"
];

function protectBrands(text) {
  let res = text;
  BRANDS.forEach((b, i) => {
    // Regex boundary so we only replace full words if possible
    res = res.split(b).join(`__B${i}__`);
  });
  // Also protect {{variables}}
  res = res.replace(/\{\{([^}]+)\}\}/g, '__VAR_$1__');
  return res;
}

function restoreBrands(text) {
  let res = text;
  BRANDS.forEach((b, i) => {
    res = res.split(`__B${i}__`).join(b);
  });
  res = res.replace(/__VAR_([^_]+)__/g, '{{$1}}');
  return res;
}

function translateText(text, targetLang) {
    return new Promise((resolve, reject) => {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json && json[0]) {
                        const translated = json[0].map(x => x[0]).join('');
                        resolve(translated);
                    } else {
                        resolve(text);
                    }
                } catch (e) {
                    resolve(text);
                }
            });
        }).on('error', (err) => {
            resolve(text); // Fallback to original
        });
    });
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

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
    const namespaces = ['common', 'home', 'personas', 'skills', 'pages', 'vs'];
    const targetLang = process.argv[2];
    const langsToProcess = targetLang ? { [targetLang]: LANGS[targetLang] } : LANGS;
    
    let totalUpdated = 0;
    
    for (const [lc, lnCode] of Object.entries(langsToProcess)) {
        console.log(`\n🌍 Processing ${lc}...`);
        
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
            
            console.log(`  ⏳ [${ns}] Translating ${items.length} strings...`);
            let updates = 0;
            const liveData = JSON.parse(fs.readFileSync(tPath, 'utf8'));
            
            for (let i = 0; i < items.length; i++) {
                const { path: dp, value: ev } = items[i];
                const protectedText = protectBrands(ev);
                const translatedProtected = await translateText(protectedText, lnCode);
                const finalStr = restoreBrands(translatedProtected);
                
                if (finalStr && finalStr !== ev) {
                    setAtPath(liveData, dp, finalStr);
                    updates++;
                }
                
                // Add a small progress indicator
                if (i > 0 && i % 20 === 0) {
                    process.stdout.write(`.` );
                }
            }
            console.log(`\n  ✅ [${ns}] ${updates}/${items.length} applied`);
            
            if (updates > 0) {
                fs.writeFileSync(tPath, JSON.stringify(liveData, null, 2), 'utf8');
                totalUpdated += updates;
            }
            
            await sleep(1000);
        }
    }
    
    console.log(`\n🏁 DONE: ${totalUpdated} translations applied`);
}

main().catch(console.error);
