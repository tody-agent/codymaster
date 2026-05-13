# TTS Engine — SpeechSynthesis API Reference

> The browser's built-in text-to-speech engine. Zero dependencies, works offline on most devices.

---

## API Quick Reference

```javascript
const synth = window.speechSynthesis;

// Core methods
synth.speak(utterance)     // Start speaking
synth.pause()              // Pause
synth.resume()             // Resume
synth.cancel()             // Stop all (⚠️ triggers onerror!)
synth.getVoices()          // Returns SpeechSynthesisVoice[]

// Properties
synth.speaking             // boolean — currently speaking?
synth.paused               // boolean — currently paused?
synth.pending              // boolean — utterances in queue?

// Events
synth.onvoiceschanged      // Fires when voice list changes
```

### SpeechSynthesisUtterance

```javascript
const u = new SpeechSynthesisUtterance(text);
u.lang   = 'vi-VN';        // BCP-47 language tag
u.voice  = voiceObject;     // SpeechSynthesisVoice
u.rate   = 1.0;             // 0.1 — 10 (normal = 1.0)
u.pitch  = 1.0;             // 0 — 2 (normal = 1.0)
u.volume = 1.0;             // 0 — 1

// Events
u.onstart    = fn;          // Speaking started
u.onend      = fn;          // Finished speaking this utterance
u.onerror    = fn(event);   // Error occurred (event.error = string)
u.onpause    = fn;          // Paused
u.onresume   = fn;          // Resumed
u.onboundary = fn(event);   // Word/sentence boundary (event.charIndex)
```

---

## Content Extraction Pattern

```javascript
function extractCoreText(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container || !container.textContent.trim()) return '';

    const clone = container.cloneNode(true);

    // STRIP non-content elements
    clone.querySelectorAll([
        // Navigation & structure
        'nav, footer, header, aside',
        // Media (cannot be spoken)
        'img, video, audio, iframe, svg, figure, canvas',
        // Scripts & styles
        'script, style, noscript',
        // Hidden elements
        '[aria-hidden="true"], [hidden], .sr-only',
        // Site-specific noise (customize per project)
        '.cta-box, .tags, .related-posts, .comments',
        '.advertisement, .promo, .popup'
    ].join(', ')).forEach(el => el.remove());

    return clone.innerText
        .replace(/\n{3,}/g, '\n\n')   // collapse excess newlines
        .replace(/\s{2,}/g, ' ')       // collapse excess spaces
        .trim();
}
```

**Customization:** The strip selector should be adapted per project. Common additions:
- Blog: `.blog-cta-box, .blog-tags, .blog-related`
- E-commerce: `.add-to-cart, .price-compare, .reviews-count`
- Docs: `.sidebar-nav, .edit-on-github, .breadcrumb`

---

## Chunking Strategy

### Why Chunk?

Browsers have hard limits on utterance text length:
- **Chrome**: ~5000 chars (silently fails beyond)
- **Safari**: ~4000 chars
- **Firefox**: ~3000 chars
- **Safe maximum**: **2500 chars**

### Sentence-Aware Splitting

```javascript
function splitIntoChunks(text, maxLen = 2500) {
    const chunks = [];
    const sentences = text.split(/(?<=[.!?。？！\n])\s+/);
    let current = '';

    for (const sentence of sentences) {
        if ((current + ' ' + sentence).length > maxLen && current) {
            chunks.push(current.trim());
            current = sentence;
        } else {
            current += (current ? ' ' : '') + sentence;
        }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
}
```

### Chunk Chaining

```javascript
function buildUtterances(chunks, voice, rate = 1.0) {
    return chunks.map((chunk, i) => {
        const u = new SpeechSynthesisUtterance(chunk);
        u.lang = 'vi-VN'; // set per project
        u.rate = rate;
        u.pitch = 1.0;
        if (voice) u.voice = voice;

        u.onend = () => {
            if (i < chunks.length - 1) {
                currentIdx = i + 1;
                synth.speak(utterances[currentIdx]);
                updateProgress();
            } else {
                stopReading(); // last chunk done
            }
        };

        u.onerror = (e) => {
            // synth.cancel() fires onerror with 'canceled'
            if (e.error === 'canceled' || e.error === 'interrupted') return;
            stopReading();
        };

        return u;
    });
}
```

---

## Voice Selection

### Strategy

```javascript
function getVoice(langCode = 'vi-VN') {
    const voices = speechSynthesis.getVoices();
    const prefix = langCode.split('-')[0]; // 'vi'

    // 1. Exact match + local (fastest, works offline)
    const local = voices.find(v => v.lang === langCode && v.localService);
    if (local) return local;

    // 2. Exact match (may be network/higher quality)
    const exact = voices.find(v => v.lang === langCode);
    if (exact) return exact;

    // 3. Language prefix match
    const prefix_match = voices.find(v => v.lang.startsWith(prefix));
    if (prefix_match) return prefix_match;

    // 4. null = browser default
    return null;
}
```

### Voices Loading (Async)

On some browsers (Chrome), `getVoices()` returns empty until loaded:

```javascript
if (synth.getVoices().length === 0) {
    synth.addEventListener('voiceschanged', function onVoices() {
        synth.removeEventListener('voiceschanged', onVoices);
        // Now voices are available
    });
}
```

---

## Chrome Keep-Alive

> **The #1 TTS bug:** Chrome stops `SpeechSynthesis` after ~15 seconds of continuous speech. No error is thrown. Audio simply stops.

### Fix

```javascript
let keepAliveTimer = null;

function startKeepAlive() {
    stopKeepAlive();
    keepAliveTimer = setInterval(() => {
        if (synth.speaking && !synth.paused) {
            synth.pause();
            synth.resume();
        }
    }, 10000); // every 10 seconds
}

function stopKeepAlive() {
    if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
    }
}
```

**Always start keep-alive when speaking, stop when done.**

---

## Rate & Pitch Guide

| Rate | Feel | Use Case |
|------|------|----------|
| 0.7 | Very slow | Elderly users, complex medical content |
| 0.85 | Slow | Educational, foreign language |
| 1.0 | Normal | General content |
| 1.2 | Slightly fast | News, light reading |
| 1.5 | Fast | Familiar content, power users |
| 2.0 | Very fast | Scanning, speed reading |

**Default recommendation:** `1.0` for general, `0.9` for specialized/medical content.

---

## Browser Support

| Browser | SpeechSynthesis | Voices | Keep-Alive Needed |
|---------|----------------|--------|-------------------|
| Chrome | ✅ | Network + Local | ✅ Yes (pause/resume) |
| Safari | ✅ | Local only | ❌ No |
| Firefox | ✅ | Local only | ❌ No |
| Edge | ✅ | Network + Local | ✅ Yes (same as Chrome) |
| Mobile Chrome | ✅ | Limited | ✅ Yes |
| Mobile Safari | ✅ | Good vi-VN | ❌ No |

---

## Error Handling Matrix

| Error | Cause | Recovery |
|-------|-------|----------|
| `canceled` | `synth.cancel()` called | Ignore (expected) |
| `interrupted` | New utterance replaced current | Ignore (expected) |
| `audio-busy` | Another utterance playing | Wait and retry |
| `network` | Network voice unavailable | Fall back to local voice |
| `synthesis-unavailable` | TTS engine not available | Show "Not supported" message |
| `synthesis-failed` | Voice failed to synthesize | Try different voice or skip chunk |
| `not-allowed` | User hasn't interacted | Require button click first |
