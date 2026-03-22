const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');

const TARGET_LANGS = {
    'vi': 'Vietnamese'
};

const readmeStr = fs.readFileSync(path.join(__dirname, '../README.md'), 'utf8');

function runGeminiCommand(prompt, langCode) {
    return new Promise((resolve) => {
        const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`');
        const cmd = `gemini -y -o json -p "${escapedPrompt}"`;
        exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Exec error:`, stderr || error.message);
            }
            
            const output = stdout || stderr;
            if (!output) {
                return resolve(null);
            }

            try {
                // Find the JSON part. It starts with { and contains session_id
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

async function translate() {
    // Split readme into ~100 line chunks
    const lines = readmeStr.split('\n');
    const CHUNK_SIZE = 100;
    const chunks = [];
    for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
        chunks.push(lines.slice(i, i + CHUNK_SIZE).join('\n'));
    }

    for (const [code, lang] of Object.entries(TARGET_LANGS)) {
        console.log(`Translating README to ${lang} (${code}) in ${chunks.length} chunks...`);
        let finalMd = '';
        let failed = false;

        for (let i = 0; i < chunks.length; i++) {
            console.log(`  Processing chunk ${i + 1}/${chunks.length}...`);
            const prompt = `Translate the following markdown text accurately into ${lang}. 
Rules:
1. DO NOT translate any code blocks, URLs, HTML tags, or markdown formatting characters.
2. DO NOT translate the names of tools, files, or brand names (e.g. 'CodyMaster', 'cm-ux-master', 'Pencil.dev').
3. Preserve the exact layout and structure, including the mermaid graphs and emojis.
4. Return ONLY the translated markdown, nothing else, no comments or conversational preamble.
5. In the language switcher at the top, make sure it stays exactly like this: [English](README.md) | [Tiếng Việt](README-vi.md) | [中文](README-zh.md) | [Русский](README-ru.md) | [한국어](README-ko.md) | [हिन्दी](README-hi.md)

Text to translate (Part ${i+1}):
\n${chunks[i]}`;

            const output = await runGeminiCommand(prompt, code);
            if (output && !output.includes('RESOURCE_EXHAUSTED') && !output.includes('Too Many Requests')) {
                let clean = output.trim();
                
                if (clean.startsWith('```markdown')) clean = clean.substring(11);
                else if (clean.startsWith('```md')) clean = clean.substring(5);
                else if (clean.startsWith('```')) clean = clean.substring(3);
                if (clean.endsWith('```')) clean = clean.substring(0, clean.length - 3);
                
                finalMd += clean.trim() + '\n\n';
                
                // Add a small delay between chunks to avoid rate limit
                await sleep(5000);
            } else {
                console.error(`  ❌ Failed on chunk ${i + 1}. Error: ${output?.substring(0, 100)}...`);
                fs.writeFileSync(path.join(__dirname, `../failure-${code}-chunk${i+1}.log`), output || 'NO OUTPUT', 'utf8');
                failed = true;
                break;
            }
        }

        if (!failed && finalMd.length > 2000) {
            fs.writeFileSync(path.join(__dirname, `../README-${code}.md`), finalMd.trim(), 'utf8');
            console.log(`✅ Saved README-${code}.md`);
        } else if (!failed) {
            console.log(`❌ Output too short for ${code}. Translation might have failed.`);
            fs.writeFileSync(path.join(__dirname, `../failure-${code}.log`), finalMd, 'utf8');
        }
    }
}

translate().then(() => console.log('Done'));
