---
name: cm-video-factory
description: Private Code-to-Video Engine using Remotion React, TTS (ElevenLabs/OpenAI), and Content Mastery. Creates pure VibeCoding-style animations for TikTok/Shorts/Reels automatically.
---

# CM Video Factory v2.0 — Mass Video Production Engine (Private)

A self-hosted, batch-capable video factory built on **Remotion React** (code-to-video).
Scripts → TTS → Subtitles → Render → Policy Check → Publish.

Dual format: **9:16 vertical** (TikTok/Shorts/Reels) + **16:9 horizontal** (YouTube).
Dual language: **Vietnamese** (VieNeu-TTS) + **English** (ElevenLabs/OpenAI).

Spiritual twin of `cm-content-factory`, focused on Short-Form + Long-Form video at scale.

---

## Core Philosophy

- **Video is Math, Not Art.** React components define every frame. JSON scripts define every word.
- **VibeCoding Aesthetic.** Dark SaaS visuals, cyan `#00F0FF` glow, `Fira Code`, engineering UI motifs.
- **Content Mastery DNA.** Every script uses SB7, Cialdini, Hook Formulas. No boring "Hello guys" intros.
- **Batch-First.** One command renders 10+ videos overnight. Queue, progress, retry, resume.
- **Policy-Safe.** Built-in guardrails prevent shadowbans, demonetization, and content strikes.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  📹 CM VIDEO FACTORY v2.0                    │
│            Batch Code-to-Video Production Engine             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐  │
│  │  SCRIPT  │──▶│   TTS    │──▶│ SUBTITLE │──▶│ RENDER │  │
│  │ Generator│   │  Engine  │   │ @remotion/│   │ Engine │  │
│  │ (JSON)   │   │ VieNeu + │   │ captions  │   │ Batch  │  │
│  │ CM hooks │   │ ElevenL  │   │ SRT+JSON  │   │ Queue  │  │
│  └──────────┘   └──────────┘   └──────────┘   └────────┘  │
│       │              │              │              │        │
│  ┌────┴──────────────┴──────────────┴──────────────┴────┐  │
│  │              🎛️ FORMAT ROUTER                         │  │
│  │   ┌─────────────┐          ┌──────────────┐          │  │
│  │   │  VERTICAL   │          │  HORIZONTAL  │          │  │
│  │   │  9:16       │          │  16:9        │          │  │
│  │   │  1080×1920  │          │  1920×1080   │          │  │
│  │   │  TikTok     │          │  YouTube     │          │  │
│  │   │  Reels      │          │  Facebook    │          │  │
│  │   │  Shorts     │          │              │          │  │
│  │   └─────────────┘          └──────────────┘          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              🛡️ POLICY COMPLIANCE ENGINE              │  │
│  │  Content scan | AI labeling | Upload throttle | Hash │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              📊 BATCH QUEUE MANAGER                   │  │
│  │  queue.json | progress.json | retry logic | cron     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
# 1. Setup Remotion project (one-time)
cd video-factory && npm install

# 2. Generate single video (interactive)
node scripts/pipeline.js --script scripts-input/video_01.json --format tiktok

# 3. Batch render (queue-based)
node scripts/batch-runner.js --queue queue.json --batch-size 5

# 4. Resume interrupted batch
node scripts/batch-runner.js --queue queue.json --resume

# 5. Preview in browser (hot reload)
npx remotion studio
```

---

## 7-Phase Execution Pipeline

### Phase 1: 🔬 RESEARCH
Scrape documentation, GitHub repos, URLs. Build knowledge base per topic.
Uses `cm-cro-methodology` to identify pain points for maximum hook impact.

### Phase 2: ✍️ SCRIPT (JSON)
AI generates strictly-keyed JSON scripts. One JSON = one video.

```json
{
  "id": "video_042",
  "title": "Debug mệt mỏi?",
  "hook": "99% Dev tốn thanh xuân để debug vì bỏ qua quy tắc này.",
  "hook_formula": "data_shock",
  "language": "vi",
  "duration_target": 45,
  "format": "tiktok",
  "scenes": [
    {
      "time_start": 0,
      "duration": 3.5,
      "text": "99% Dev tốn thanh xuân để debug vì...",
      "visual": "TerminalCrashView",
      "props": { "error": "SIGSEGV", "animation": "glitch" }
    },
    {
      "time_start": 3.5,
      "duration": 5,
      "text": "Với Cody Master, lỗi tự phơi bày trong 2 giây.",
      "visual": "CodeGlowView",
      "props": { "code": "cm-debugging --trace", "highlight": true }
    }
  ],
  "cta": "Click link ở Bio để cài đặt miễn phí.",
  "hashtags": ["#vibecoding", "#devtools", "#codymaster"],
  "metadata": {
    "ai_generated": true,
    "ai_disclosure": "Video created with AI-assisted animation and voice synthesis"
  }
}
```

### Phase 3: 🎙️ TTS (Voice Synthesis)

**TTS Engine Router** — auto-detect language → best engine:

| Language | Primary Engine | Fallback | Voice Cloning |
|----------|---------------|----------|---------------|
| Vietnamese | VieNeu-TTS 0.5B | OpenAI TTS | ✅ (3-5s ref) |
| English | ElevenLabs multilingual_v2 | OpenAI TTS | ✅ (paid) |

```python
# Vietnamese TTS (VieNeu-TTS SDK)
from vieneu import Vieneu
tts = Vieneu()
audio = tts.infer(text="Xin chào, đây là VibeCoding Academy")
tts.save(audio, "audio_vi.wav")
```

```bash
# English TTS (ElevenLabs via infsh CLI)
infsh app run elevenlabs/tts --input '{
  "text": "Welcome to the VibeCoding revolution.",
  "voice": "george",
  "model": "eleven_multilingual_v2",
  "stability": 0.5,
  "similarity_boost": 0.8
}'
```

**Outputs:**
- `audio.mp3` — Final audio track
- `audio.json` — Word-level timestamps (for subtitle sync)
- `audio.srt` — Standard SRT file (for YouTube upload)

### Phase 4: 📝 SUBTITLE ENGINE (`@remotion/captions`)

Uses official Remotion captions package for frame-perfect sync:

```typescript
import { parseSrt, createTikTokStyleCaptions } from "@remotion/captions";

// Parse SRT from TTS output
const captions = parseSrt({ input: srtContent });

// Create TikTok-style word-by-word highlights
const { pages } = createTikTokStyleCaptions({
  captions,
  combineTokensWithinMilliseconds: 800,
});

// Render in React component
const SubtitleOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = (frame / fps) * 1000; // ms

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: 40 }}>
      {pages.map((page) => (
        <CaptionPage key={page.startMs} page={page} currentTime={currentTime} />
      ))}
    </AbsoluteFill>
  );
};
```

### Phase 5: 🎨 RENDER (Remotion)

**Dual-format compositions:**

```typescript
// Root.tsx — Two compositions for two formats
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="TikTokVideo"
      component={TikTokComposition}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={durationFromAudio}
    />
    <Composition
      id="YouTubeVideo"
      component={YouTubeComposition}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={durationFromAudio}
    />
  </>
);
```

**Render commands:**
```bash
# TikTok vertical (9:16)
npx remotion render src/index.ts TikTokVideo out/tiktok_video_042.mp4

# YouTube horizontal (16:9)
npx remotion render src/index.ts YouTubeVideo out/youtube_video_042.mp4

# Benchmark optimal concurrency first
npx remotion benchmark --composition TikTokVideo
```

**Remotion Performance Rules (from remotion-dev/skills):**
- ✅ All animations driven by `useCurrentFrame()` — never `useEffect`/`setInterval`
- ✅ Memoize expensive computations with `useMemo`/`useCallback`
- ✅ Avoid GPU-heavy CSS (`filter: blur()`, `drop-shadow()`) in components
- ✅ Use `npx remotion benchmark` to find optimal `--concurrency`
- ✅ Video duration = `getAudioDurationInSeconds()` + 2s bumper
- ✅ Use `--log=verbose` to identify slow frames

### Phase 6: 🛡️ POLICY CHECK

**Pre-publish compliance scan** (runs automatically before upload):

```yaml
POLICY_GATES:
  platform_limits:
    tiktok:
      max_daily_uploads: 3
      cooldown_hours: 4
      required_labels: ["AI-generated"]
      hashtag_range: [3, 7]
    youtube:
      max_daily_uploads: 2
      cooldown_hours: 6
      required_disclosure: true    # Creator Studio AI toggle
      monetization_check: true     # Must show human creative value
    reels:
      max_daily_uploads: 3
      cooldown_hours: 4

  content_rules:
    min_visual_uniqueness: 70     # % difference between consecutive videos
    banned_content_scan: true     # Check for hate speech, misleading claims
    no_unauthorized_cloning: true # No cloning real people without consent
    no_mass_duplicate: true       # Each video visually distinct
```

**What gets checked:**
1. Script text scanned for banned keywords/topics
2. Visual uniqueness hash compared to last N renders
3. Upload rate verified against platform daily limits
4. AI disclosure metadata injected into file
5. Hashtag count validated (3-7 range)

### Phase 7: 🚀 PUBLISH (Optional)

Multi-platform upload via APIs:
- YouTube Shorts/Long-form → YouTube Data API v3
- TikTok → TikTok Creator API
- Facebook/Instagram Reels → Graph API

Auto-applies: title, description, hashtags, AI disclosure labels, thumbnail.

---

## Batch Queue Manager

For mass production, use the queue system:

```json
// queue.json
{
  "batch_id": "batch_2026_03_30",
  "created_at": "2026-03-30T09:00:00Z",
  "config": {
    "formats": ["tiktok", "youtube"],
    "language": "vi",
    "tts_engine": "vieneu",
    "concurrency": 1,
    "retry_max": 3
  },
  "jobs": [
    {
      "id": "job_001",
      "script": "scripts-input/video_01.json",
      "status": "queued",
      "attempts": 0,
      "outputs": []
    },
    {
      "id": "job_002",
      "script": "scripts-input/video_02.json",
      "status": "queued",
      "attempts": 0,
      "outputs": []
    }
  ]
}
```

```json
// progress.json (auto-generated)
{
  "batch_id": "batch_2026_03_30",
  "total": 10,
  "completed": 3,
  "failed": 0,
  "in_progress": 1,
  "queued": 6,
  "estimated_remaining_minutes": 42,
  "last_updated": "2026-03-30T09:25:00Z"
}
```

**CLI:**
```bash
# Start batch (processes sequentially)
node scripts/batch-runner.js --queue queue.json

# Resume after interruption
node scripts/batch-runner.js --queue queue.json --resume

# Status check
node scripts/batch-runner.js --queue queue.json --status

# Schedule via cron (every day at 2 AM)
echo "0 2 * * * cd /path/to/video-factory && node scripts/batch-runner.js --queue queue.json --resume" | crontab -
```

---

## Component Library (VibeCoding Aesthetic)

| Component | Visual Effect | Format | Use Case |
|-----------|--------------|--------|----------|
| `DarkTerminal` | MacOS-style window, typing animation, syntax colors | Both | bash commands, workflows |
| `VsCodeGlow` | Sleek IDE editor with neon-blue shadow | Both | Code demonstrations |
| `BouncingSubtitle` | TikTok-style bold text, word-by-word bounce | 9:16 | ALL spoken words (mandatory) |
| `StatCounter` | Rapidly spinning numbers in glassmorphic card | Both | Hook metrics ("10x", "200 articles") |
| `SplitScreen` | Top: Concept / Bottom: Code | 16:9 | Before/after, comparisons |
| `CodeDiff` | Side-by-side diff with green/red highlights | 16:9 | Showing improvements |
| `FloatingCard` | Glassmorphic card with parallax hover | Both | Feature callouts |
| `ProgressRing` | Animated circular progress indicator | Both | Stats, completion metrics |

**Strict Styling Rules:**
- ❌ NEVER use light mode components
- Primary brand: Cyan `#00F0FF`
- Secondary: Hot Pink `#FF007F`
- Accent: Electric Purple `#8B5CF6`
- Background: Void Black `#0A0A0A` → Deep Navy `#050B14`
- Font: `Fira Code` (code), `Inter` (UI text), `Be Vietnam Pro` (Vietnamese text)
- All animations: `interpolate()` + `spring()` — NEVER CSS transitions

---

## Hook & Persuasion Framework

Before writing Video JSON, select one:

### Short-Form (0-60s) — TikTok/Shorts/Reels
| Phase | Time | Goal |
|-------|------|------|
| **HOOK** | 0:00 - 0:03 | Extreme curiosity gap. Fast cut. Zero intro. |
| **AGITATE** | 0:03 - 0:15 | Visualize common pain (red errors, spaghetti code) |
| **SOLUTION** | 0:15 - 0:45 | Enter CodyMaster. Drop code. Make it glow. |
| **CTA** | 0:45 - 0:60 | Grand Slam Offer. "Lấy miễn phí tại bio". |

### Long-Form (3-15min) — YouTube
| Phase | Time | Goal |
|-------|------|------|
| **HOOK** | 0:00 - 0:30 | Pattern interrupt + "Stay to the end for..." |
| **CONTEXT** | 0:30 - 2:00 | Problem landscape. Why this matters NOW. |
| **DEEP DIVE** | 2:00 - 10:00 | Step-by-step demonstration with code |
| **PROOF** | 10:00 - 12:00 | Results, metrics, before/after |
| **CTA** | Last 30s | Subscribe + comment + link in description |

### 12 Hook Formulas
1. **Data Shock** — "99% Dev fail vì bỏ qua điều này"
2. **Contrarian** — "Đừng học React. Đây là lý do."
3. **Future Pacing** — "Trong 60 giây, bạn sẽ viết code nhanh gấp 10x"
4. **Story Open** — "Tháng trước, tôi mất 3 ngày debug..."
5. **Authority** — "Sau 10 năm code, đây là bí mật duy nhất"
6. **Curiosity Gap** — "Có 1 công cụ mà Google engineers dùng mà bạn chưa biết"
7. **Fear** — "AI sẽ thay thế developer? Chỉ nếu bạn không biết điều này"
8. **Social Proof** — "200+ engineers đã chuyển sang workflow này"
9. **Challenge** — "Thử debug trong 2 giây challenge"
10. **Comparison** — "Junior vs Senior: cùng 1 bug, khác nhau 10x tốc độ"
11. **Reveal** — "Công cụ bí mật đằng sau 50 dự án production"
12. **Empathy** — "Mình biết cảm giác code 12 tiếng mà không ra gì"

---

## Platform Policy Summary

### TikTok — What Gets You Shadowbanned
- ❌ Mass-posting identical/near-identical content
- ❌ Using 20+ generic hashtags (#fyp, #foryou spam)
- ❌ Unlabeled AI-generated realistic content
- ❌ Third-party tools for fake engagement
- ❌ Posting frequency > 5/day without variation
- ✅ Post 1-3 original videos/day with authentic engagement
- ✅ Use 3-5 niche-specific hashtags
- ✅ Label AI content using TikTok's built-in tools

### YouTube — What Prevents Monetization
- ❌ Mass-produced templated AI content ("AI slop")
- ❌ Undisclosed realistic AI-generated content
- ❌ Unauthorized voice/face cloning
- ❌ Misleading titles/thumbnails
- ✅ Show human creative direction in every video
- ✅ Use AI disclosure toggle in Creator Studio
- ✅ Add unique commentary, editing, educational value
- ✅ Each video must demonstrate significant human involvement

---

## Guidelines for Downstream Agents

1. **Never hardcode strings** in React components. All text from JSON/SRT for perfect TTS sync.
2. **Animations = math.** Use `interpolate()` and `spring()`. 30FPS = `frame / 30` seconds.
3. **Audio drives duration.** Video length = `getAudioDurationInSeconds()` + 2s end-bumper.
4. **Memoize everything.** `useMemo`/`useCallback` on all expensive computations.
5. **No GPU CSS.** Avoid `filter: blur()`, `drop-shadow()` in rendered components.
6. **Benchmark concurrency.** Run `npx remotion benchmark` before batch renders.
7. **Policy-first.** Run policy check before ANY upload. No exceptions.
8. **License check.** VieNeu-TTS-0.5B = Apache 2.0 (commercial OK). VieNeu-TTS-0.3B = CC BY-NC 4.0 (non-commercial only).

---

## Future Roadmap

- **v2.1:** VieNeu-TTS voice cloning integration (clone user's voice from 5s sample)
- **v2.2:** Remotion Lambda for parallel cloud rendering (10x speed)
- **v2.3:** AI Avatar mode via `bytedance/omnihuman-1-5` lipsync
- **v2.4:** Auto A/B testing — render 2 hook variants, publish both, track engagement
- **v3.0:** Full `inference.sh` integration — text-to-video AI scenes (Veo 3, Seedance)

---

## Usage Triggers

Use when the user states:
- "Start the video factory", "Create a TikTok/Shorts for this code"
- "Run the Remotion pipeline", "Make a VibeCoding video"
- "Generate a hook script for X", "Batch render videos"
- "Render YouTube video", "Create 9:16 vertical video"
- "tạo video hàng loạt", "render video tiktok"
- "video factory batch", "create video from script"
