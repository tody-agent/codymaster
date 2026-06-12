# TikTok Content Policy Rules — CM Video Factory

> Last reviewed: 2026-03-30  
> Source: TikTok Community Guidelines, TikTok Creator Academy

## ✅ MUST DO

### AI Content Labeling
- **MANDATORY**: Label all AI-generated or AI-modified content
- Use TikTok's built-in AI label tool during upload
- Include "AI-assisted" or "Created with AI tools" in description
- Videos with realistic AI content (deepfakes) MUST be labeled or face removal

### Content Quality
- Each video must be **visually unique** (≥70% different from other uploads)
- Add genuine human creative direction (editing decisions, commentary, selection)
- Show original perspective — don't just auto-generate generic content

### Posting Cadence
- **Recommended**: 1-3 videos per day
- **Maximum safe**: 5 per day (beyond this triggers spam detection)
- **Cooldown**: Minimum 4 hours between posts for algorithmic fairness
- Best times: 7-9 AM, 12-2 PM, 7-10 PM (target audience timezone)

### Hashtags
- Use **3-7 relevant, niche-specific** hashtags
- Mix: 2 broad + 3-5 niche tags
- Good examples: `#devtools`, `#vibecoding`, `#codinglife`, `#learntocode`

## ❌ BANNED — Instant Shadowban Risk

### Content Violations
- Hate speech, discrimination, or harassment
- Misleading medical, financial, or legal claims
- Fake personas impersonating real people
- Content promoting dangerous activities
- Sexually explicit content

### Spam/Manipulation
- Mass-posting identical or near-identical videos
- Using 20+ generic hashtags (`#fyp`, `#foryou`, `#viral` spam)
- Buying or faking engagement (likes, follows, comments)
- Using unauthorized third-party growth tools
- Comment spam or follow-unfollow tactics

### AI-Specific Bans
- AI-generated content of minors
- Deepfakes of real people without consent/label
- AI content designed to defraud or scam
- Synthetic media that impersonates news operations

## ⚠️ SHADOWBAN TRIGGERS (Algorithmic Suppression)

These don't get you banned but **kill your reach**:

1. **Posting frequency spike**: Going from 1/day to 10/day suddenly
2. **Identical audio**: Reusing exact same TTS audio without variation
3. **Template repetition**: Same layout/visual for 5+ consecutive videos
4. **Engagement drop**: If early viewers skip quickly, algorithm deprioritizes
5. **Off-brand hashtags**: Using tags unrelated to content
6. **New account + high volume**: Brand new accounts posting aggressively

## 🛡️ Policy Guard Implementation

```json
{
  "tiktok_policy_config": {
    "max_daily_uploads": 3,
    "cooldown_between_posts_hours": 4,
    "hashtag_range": [3, 7],
    "banned_hashtags": ["#fyp", "#foryou", "#viral", "#trending", "#xyzbca"],
    "min_visual_uniqueness_percent": 70,
    "ai_label_required": true,
    "max_consecutive_same_template": 3,
    "tts_voice_variation": true,
    "content_scan_enabled": true
  }
}
```
