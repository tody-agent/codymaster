# YouTube Content Policy Rules — CM Video Factory

> Last reviewed: 2026-03-30  
> Source: YouTube Community Guidelines, YouTube Partner Program policies, YouTube AI disclosure requirements

## ✅ MUST DO

### AI Content Disclosure
- **MANDATORY**: Toggle AI disclosure in Creator Studio for "realistic" AI content
- "Realistic" = could be mistaken for real footage/audio
- Code animations, text overlays, and stylized visuals are generally EXEMPT
- BUT: AI voice synthesis MUST be disclosed
- Label: "Made with AI tools" or "AI-generated voice"

### Monetization Requirements (YPP)
- Content must demonstrate **significant human creative direction**
- Human involvement: script writing, editing decisions, creative concept, voice-over
- AI can assist but cannot be the sole creator
- Each video must provide unique value (not mass-templated)

### Upload Cadence
- **Recommended**: 1-2 videos per day for Shorts
- **Long-form**: 2-4 per week (consistency > frequency)
- **Cooldown**: 6 hours between uploads
- Consistent schedule > burst posting

### SEO Best Practices
- Unique title per video (not templated)
- Compelling thumbnail (human-designed or human-curated)
- Detailed description with relevant keywords
- Upload SRT subtitle file (not just auto-generated)
- Tags: 5-15 relevant tags per video

## ❌ BANNED — Strike/Demonetization Risk

### Content Violations
- Hate speech, harassment, or bullying
- Misleading content (deceptive editing, fake contexts)
- Child safety violations
- Harmful or dangerous content
- Spam, deceptive practices, or scams

### AI-Specific Violations
- **Undisclosed realistic AI content**: face/voice cloning without label
- **Unauthorized likeness**: AI-generating real people without consent
- **Mass-produced "AI slop"**: Templated, repetitive, zero-human-value content
- **Misleading AI thumbnails**: Thumbnails that imply real events
- **AI content impersonating real news**: Synthetic news broadcasts

### Monetization Killers
- **Repetitive content**: Same structure/template video after video
- **Reused content**: Re-uploading others' content (even with AI modifications)
- **No educational/entertainment value**: Pure algorithmic content farming
- **Misleading metadata**: Clickbait that doesn't deliver

## ⚠️ DEMONETIZATION SIGNALS

These don't strike but **lose monetization**:

1. **Template repetition**: YouTube's classifier detects identical structures
2. **Low viewer retention**: If 70%+ viewers leave before 30%, content quality flag
3. **Bot-like posting patterns**: Perfectly timed posts suggest automation
4. **Identical descriptions**: Copy-paste descriptions across videos
5. **No engagement**: Zero comments/likes suggests non-human audience
6. **Audio-only abuse**: Static image + AI voice = low-quality flag

## 🛡️ For VibeCoding Videos Specifically

Our videos are **code animations** (not realistic AI content), so:
- ✅ AI disclosure for TTS voice is required
- ✅ Visual animations don't need "realistic content" toggle
- ✅ Each video has unique script, unique code examples = passes uniqueness
- ✅ Human creative direction: topic selection, script writing, editing, hook design
- ⚠️ Vary visual templates across batches (don't use same component 20x)

## 🛡️ Policy Guard Implementation

```json
{
  "youtube_policy_config": {
    "max_daily_uploads": 2,
    "cooldown_between_posts_hours": 6,
    "ai_disclosure_required": true,
    "monetization_check": true,
    "require_human_value": true,
    "srt_upload_required": true,
    "thumbnail_required": true,
    "min_retention_target_percent": 40,
    "max_consecutive_same_template": 3,
    "unique_title_required": true,
    "unique_description_required": true,
    "tag_range": [5, 15],
    "content_scan_enabled": true
  }
}
```
