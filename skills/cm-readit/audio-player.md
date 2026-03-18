# Audio Player — Pre-Recorded MP3 Patterns

> For when you have pre-recorded audio files (sales pitch, podcast, guide) instead of generating speech from text.

---

## API Quick Reference

```javascript
const audio = new Audio('/path/to/file.mp3');

// Core methods
audio.play()               // Returns Promise (may reject: autoplay policy)
audio.pause()
audio.load()               // Reload source

// Properties
audio.src                  // Source URL
audio.currentTime          // Current position (seconds)
audio.duration             // Total duration (NaN until loaded)
audio.paused               // boolean
audio.ended                // boolean
audio.volume               // 0.0 — 1.0
audio.playbackRate         // 0.25 — 4.0
audio.preload              // 'none' | 'metadata' | 'auto'

// Events
audio.onplay = fn;
audio.onpause = fn;
audio.onended = fn;
audio.onerror = fn;
audio.ontimeupdate = fn;   // Fires during playback (~4x/second)
audio.onloadedmetadata = fn; // duration now available
audio.oncanplay = fn;      // Enough data to start playing
```

---

## Patterns

### Simple Play/Pause Toggle

```javascript
let audio = null;
let isPlaying = false;

function play(src) {
    if (!audio) audio = new Audio(src);
    
    const promise = audio.play();
    if (promise) {
        promise
            .then(() => { isPlaying = true; updateUI(); })
            .catch(() => { isPlaying = false; updateUI(); });
    }
}

function togglePause() {
    if (!audio) return;
    if (audio.paused) {
        audio.play();
        isPlaying = true;
    } else {
        audio.pause();
        isPlaying = false;
    }
    updateUI();
}

function stop() {
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio = null;
    }
    isPlaying = false;
    updateUI();
}
```

### Progress Tracking

```javascript
function startProgressTracking(audioEl, barEl) {
    const update = () => {
        if (!audioEl || !barEl) return;
        if (audioEl.duration) {
            barEl.style.width = (audioEl.currentTime / audioEl.duration * 100) + '%';
        }
        if (!audioEl.paused && !audioEl.ended) {
            requestAnimationFrame(update);
        }
    };
    
    audioEl.addEventListener('play', () => requestAnimationFrame(update));
    requestAnimationFrame(update);
}
```

### 2-Part Audio Flow (Intro → Full)

```javascript
function playIntro(cfg) {
    playingPart = 1;
    showPlayer();
    
    playAudio(cfg.audio[0], () => {
        // Intro done → offer full version
        showNextButton();
        updateLabel('Bạn muốn nghe thêm?');
    });
}

function playFull(cfg) {
    playingPart = 2;
    hideNextButton();
    
    playAudio(cfg.audio[1], () => {
        // Full done → show CTA
        updateLabel('Cảm ơn bạn đã lắng nghe!');
        showCTA();
    });
}
```

---

## Preload Strategies

| Strategy | Value | When to Use |
|----------|-------|------------|
| `none` | Don't preload | Default. Save bandwidth. Load on demand. |
| `metadata` | Load duration/size | When showing duration in UI |
| `auto` | Preload full file | Small files (<500KB) that will definitely play |

**Recommendation:** Always default to `'none'`. Only preload when user has indicated intent to listen.

---

## Autoplay Policy

> ⚠️ All modern browsers block autoplay of audio without user interaction.

**Rule:** NEVER try to autoplay. Always require a user gesture (click/tap) before first `audio.play()`.

```javascript
// ❌ WRONG: This will be blocked
window.onload = () => new Audio('/intro.mp3').play();

// ✅ CORRECT: User initiates
button.addEventListener('click', () => {
    new Audio('/intro.mp3').play();
});
```

---

## Error Handling

```javascript
audio.addEventListener('error', (e) => {
    switch (audio.error?.code) {
        case MediaError.MEDIA_ERR_ABORTED:
            // User aborted — ignore
            break;
        case MediaError.MEDIA_ERR_NETWORK:
            // Network error — show retry
            showRetryButton();
            break;
        case MediaError.MEDIA_ERR_DECODE:
            // Decode error — file corrupted
            showError('File audio bị lỗi');
            break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            // Format not supported
            showError('Trình duyệt không hỗ trợ');
            break;
    }
});
```

---

## Format Support

| Format | Chrome | Safari | Firefox | Edge |
|--------|--------|--------|---------|------|
| MP3 | ✅ | ✅ | ✅ | ✅ |
| AAC | ✅ | ✅ | ✅ | ✅ |
| OGG | ✅ | ❌ | ✅ | ✅ |
| WAV | ✅ | ✅ | ✅ | ✅ |
| WebM | ✅ | ❌ | ✅ | ✅ |

**Recommendation:** Use **MP3** for maximum compatibility. 128kbps is sufficient for voice.

---

## File Size Guidelines

| Content Type | Duration | Recommended Bitrate | Approx. Size |
|-------------|----------|-------------------|--------------|
| Voice only | 30s | 64 kbps | ~240 KB |
| Voice + ambient | 60s | 128 kbps | ~960 KB |
| High quality | 2 min | 192 kbps | ~2.8 MB |

**Rule of thumb:** Keep audio files under **1 MB** for mobile users. Split long content into intro + full.
