# Voice CRO — Conversion Rate Optimization via Audio

> Use audio strategically to increase engagement and conversions. Trigger-based, per-page, config-driven.

---

## What is Voice CRO?

Voice CRO uses pre-recorded audio (sales pitch, social proof, expertise showcase) to:
1. **Interrupt scroll patterns** with a bottom sheet offer
2. **Build trust** through human voice (more personal than text)
3. **Guide users to CTA** after listening

### Flow

```
User lands on page
     │
     ├─ Time trigger (e.g., 15s)  ─┐
     │                              ├─ BOTH met → Show Bottom Sheet
     └─ Scroll trigger (e.g., 25%) ─┘
                                         │
                                    "🔊 Nghe Ngay" or "Để Sau"
                                         │
                                    ┌─────┴─────┐
                                    │           │
                              Play Intro    Dismiss
                              (30s MP3)    (sessionStorage)
                                    │
                               Intro Done
                                    │
                              "Nghe Tiếp?"
                                    │
                              ┌─────┴─────┐
                              │           │
                         Play Full    Show CTA
                         (2min MP3)
                              │
                         Full Done
                              │
                         Show CTA + Thank You
```

---

## Config Pattern

```javascript
const CONFIG = {
    '/': {
        delay: 20000,              // ms before time trigger
        scroll: 0.30,              // scroll % threshold
        audio: [
            '/audio/homepage-intro.mp3',  // Part 1: short introduction
            '/audio/homepage-full.mp3'    // Part 2: full pitch
        ],
        sheetIcon: '🎧',          // Bottom sheet emoji
        sheetText: 'Bạn muốn nghe giới thiệu nhanh?',
        ctaText: 'Đặt Lịch Ngay', // CTA button text
        ctaHref: '#dat-lich'       // CTA link
    },
    '/product-page.html': {
        delay: 15000,
        scroll: 0.25,
        audio: ['/audio/product-intro.mp3', '/audio/product-full.mp3'],
        sheetIcon: '💆',
        sheetText: 'Nghe tư vấn nhanh từ chuyên gia',
        ctaText: 'Mua Ngay',
        ctaHref: '#buy',
        // Optional: interaction trigger
        checkboxTrigger: {
            selector: '.check-item input[type=checkbox]',
            minChecked: 2
        }
    }
};
```

### Config Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `delay` | number | ✅ | Milliseconds before time trigger fires |
| `scroll` | number | ✅ | Scroll percentage (0-1) threshold |
| `audio` | string[] | ✅ | [intro.mp3, full.mp3] URLs |
| `sheetIcon` | string | ✅ | Emoji for bottom sheet |
| `sheetText` | string | ✅ | Bottom sheet message |
| `ctaText` | string | ✅ | CTA button label |
| `ctaHref` | string | ✅ | CTA link target |
| `checkboxTrigger` | object | ❌ | Interaction-based trigger |

---

## Trigger System

### Dual-Condition Trigger (Time + Scroll)

```javascript
function initTrigger(cfg) {
    if (isDismissed()) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let timeReady = false;
    let scrollReady = false;
    let triggered = false;

    const tryTrigger = () => {
        if (triggered) return;
        if (timeReady && scrollReady) {
            triggered = true;
            showBottomSheet(cfg);
        }
    };

    // Time trigger
    setTimeout(() => { timeReady = true; tryTrigger(); }, cfg.delay);

    // Scroll trigger
    const onScroll = () => {
        const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        if (pct >= cfg.scroll) {
            scrollReady = true;
            window.removeEventListener('scroll', onScroll);
            tryTrigger();
        }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // check immediately
}
```

### Interaction Trigger (Checkbox)

```javascript
if (cfg.checkboxTrigger) {
    const checkboxes = document.querySelectorAll(cfg.checkboxTrigger.selector);
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const checked = document.querySelectorAll(
                cfg.checkboxTrigger.selector + ':checked'
            ).length;
            if (checked >= cfg.checkboxTrigger.minChecked) {
                triggered = true;
                showBottomSheet(cfg);
            }
        });
    });
}
```

---

## Session Management

```javascript
const STATE_KEY = 'voiceCroDismissed';

function isDismissed() {
    try { return sessionStorage.getItem(STATE_KEY) === '1'; }
    catch { return false; }
}

function setDismissed() {
    try { sessionStorage.setItem(STATE_KEY, '1'); }
    catch { /* noop */ }
}
```

**Using `sessionStorage`:** Dismissed state resets when tab closes. User sees the offer again next session.
**Using `localStorage`:** Persistent. Use if you want "show once per user" behavior.

---

## Analytics Tracking

```javascript
const STATS_KEY = 'voiceCroStats';

function trackStat(event) {
    try {
        const stats = JSON.parse(localStorage.getItem(STATS_KEY) || '{}');
        const page = window.location.pathname;
        if (!stats[page]) stats[page] = {};
        stats[page][event] = (stats[page][event] || 0) + 1;
        stats[page].lastSeen = Date.now();
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch { /* noop */ }
}

// Track: 'shown', 'listen', 'listenFull', 'dismissed', 'ctaClick'
```

**For production:** Replace localStorage with server-side analytics (GA4 events, PostHog, etc.)

---

## Best Practices

### Trigger Timing

| Page Type | Recommended Delay | Recommended Scroll |
|-----------|------------------|--------------------|
| Homepage | 20-25s | 30% |
| Service page | 12-18s | 20-30% |
| Blog/article | 25-30s | 40% |
| Course/product | 15-20s | 25% |
| Checkout | ❌ Don't trigger | ❌ Don't trigger |

### Audio Script Guidelines

| Part | Duration | Content |
|------|----------|---------|
| **Intro** | 15-30s | Hook + value prop + "nghe thêm?" |
| **Full** | 60-120s | Problem → Solution → Social proof → CTA |

### Don'ts

- ❌ Don't autoplay audio
- ❌ Don't show on checkout/payment pages
- ❌ Don't block page interaction while playing
- ❌ Don't trigger if another audio system is active (TTS reader)
- ❌ Don't trigger for `prefers-reduced-motion` users
- ❌ Don't trigger more than once per session
