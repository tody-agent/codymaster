#!/bin/bash
# ============================================================
# CM Video Factory — Sample Pipeline (End-to-End Demo)
# ============================================================
# Prerequisites:
#   - Node.js 18+, npm
#   - Python 3.10+ (for VieNeu-TTS)
#   - Remotion project set up (npm install in video-factory/)
#   - ElevenLabs API key or VieNeu-TTS installed
# ============================================================

set -euo pipefail

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS_INPUT="$PROJECT_DIR/scripts-input"
OUTPUT_DIR="$PROJECT_DIR/output"
AUDIO_DIR="$PROJECT_DIR/audio"

log() { echo -e "${CYAN}[VIDEO-FACTORY]${NC} $1"; }
success() { echo -e "${GREEN}[✅ DONE]${NC} $1"; }
warn() { echo -e "${YELLOW}[⚠️ WARN]${NC} $1"; }
error() { echo -e "${RED}[❌ ERROR]${NC} $1"; }

# ============================================================
# STEP 1: Validate Script JSON
# ============================================================
log "Phase 1: Validating script..."

SCRIPT_FILE="${1:-$SCRIPTS_INPUT/sample_video.json}"

if [ ! -f "$SCRIPT_FILE" ]; then
  error "Script file not found: $SCRIPT_FILE"
  echo "Usage: ./sample-pipeline.sh [path/to/script.json]"
  exit 1
fi

# Extract metadata
VIDEO_ID=$(python3 -c "import json; print(json.load(open('$SCRIPT_FILE'))['id'])")
LANGUAGE=$(python3 -c "import json; print(json.load(open('$SCRIPT_FILE'))['language'])")
FORMAT=$(python3 -c "import json; print(json.load(open('$SCRIPT_FILE'))['format'])")

log "Video ID: $VIDEO_ID | Language: $LANGUAGE | Format: $FORMAT"

# ============================================================
# STEP 2: Generate TTS Audio
# ============================================================
log "Phase 2: Generating TTS audio..."

mkdir -p "$AUDIO_DIR"

# Extract all scene text and concatenate
FULL_TEXT=$(python3 -c "
import json
script = json.load(open('$SCRIPT_FILE'))
text = ' '.join([s['text'] for s in script['scenes']])
print(text)
")

if [ "$LANGUAGE" = "vi" ]; then
  log "Using VieNeu-TTS for Vietnamese..."
  python3 -c "
from vieneu import Vieneu
tts = Vieneu()
audio = tts.infer(text=\"$FULL_TEXT\")
tts.save(audio, '$AUDIO_DIR/${VIDEO_ID}.wav')
print('TTS complete: $AUDIO_DIR/${VIDEO_ID}.wav')
" 2>/dev/null || {
    warn "VieNeu-TTS not available, falling back to OpenAI TTS..."
    # Fallback: OpenAI TTS via Node.js
    node -e "
const { OpenAI } = require('openai');
const fs = require('fs');
const client = new OpenAI();
(async () => {
  const mp3 = await client.audio.speech.create({
    model: 'tts-1-hd',
    voice: 'nova',
    input: \`$FULL_TEXT\`,
  });
  const buffer = Buffer.from(await mp3.arrayBuffer());
  fs.writeFileSync('$AUDIO_DIR/${VIDEO_ID}.mp3', buffer);
  console.log('OpenAI TTS complete: $AUDIO_DIR/${VIDEO_ID}.mp3');
})();
"
  }
else
  log "Using ElevenLabs for English..."
  infsh app run elevenlabs/tts --input "{
    \"text\": \"$FULL_TEXT\",
    \"voice\": \"george\",
    \"model\": \"eleven_multilingual_v2\",
    \"output_format\": \"mp3_44100_192\"
  }" 2>/dev/null || {
    warn "ElevenLabs not available, falling back to OpenAI TTS..."
    node -e "
const { OpenAI } = require('openai');
const fs = require('fs');
const client = new OpenAI();
(async () => {
  const mp3 = await client.audio.speech.create({
    model: 'tts-1-hd',
    voice: 'onyx',
    input: \`$FULL_TEXT\`,
  });
  const buffer = Buffer.from(await mp3.arrayBuffer());
  fs.writeFileSync('$AUDIO_DIR/${VIDEO_ID}.mp3', buffer);
  console.log('OpenAI TTS complete');
})();
"
  }
fi

success "Audio generated for $VIDEO_ID"

# ============================================================
# STEP 3: Generate Subtitles (SRT)
# ============================================================
log "Phase 3: Generating subtitles..."

# In production, use @remotion/captions with word-level timestamps
# For demo, create basic SRT from scene data
python3 -c "
import json

script = json.load(open('$SCRIPT_FILE'))
srt_lines = []

for i, scene in enumerate(script['scenes'], 1):
    start = scene['time_start']
    end = start + scene['duration']
    
    start_h = int(start // 3600)
    start_m = int((start % 3600) // 60)
    start_s = int(start % 60)
    start_ms = int((start % 1) * 1000)
    
    end_h = int(end // 3600)
    end_m = int((end % 3600) // 60)
    end_s = int(end % 60)
    end_ms = int((end % 1) * 1000)
    
    srt_lines.append(f'{i}')
    srt_lines.append(f'{start_h:02d}:{start_m:02d}:{start_s:02d},{start_ms:03d} --> {end_h:02d}:{end_m:02d}:{end_s:02d},{end_ms:03d}')
    srt_lines.append(scene['text'])
    srt_lines.append('')

with open('$AUDIO_DIR/${VIDEO_ID}.srt', 'w') as f:
    f.write('\n'.join(srt_lines))

print(f'SRT generated: $AUDIO_DIR/${VIDEO_ID}.srt')
"

success "Subtitles generated"

# ============================================================
# STEP 4: Render Video with Remotion
# ============================================================
log "Phase 4: Rendering video..."

mkdir -p "$OUTPUT_DIR"

COMPOSITION="TikTokVideo"
if [ "$FORMAT" = "youtube" ]; then
  COMPOSITION="YouTubeVideo"
fi

cd "$PROJECT_DIR"

log "Rendering $COMPOSITION for $VIDEO_ID..."

npx remotion render src/index.ts "$COMPOSITION" \
  "$OUTPUT_DIR/${VIDEO_ID}_${FORMAT}.mp4" \
  --props "$SCRIPT_FILE" \
  --log=info \
  2>&1 | while read -r line; do
    echo -e "${CYAN}  [REMOTION]${NC} $line"
  done

success "Video rendered: $OUTPUT_DIR/${VIDEO_ID}_${FORMAT}.mp4"

# ============================================================
# STEP 5: Policy Check
# ============================================================
log "Phase 5: Running policy compliance check..."

python3 -c "
import json

script = json.load(open('$SCRIPT_FILE'))
issues = []

# Check AI disclosure
meta = script.get('metadata', {})
if not meta.get('ai_generated', False):
    issues.append('CRITICAL: ai_generated must be true')
if not meta.get('ai_disclosure'):
    issues.append('WARNING: Missing ai_disclosure text')

# Check hashtags
tags = script.get('hashtags', [])
if len(tags) < 3:
    issues.append('WARNING: Too few hashtags (min 3)')
if len(tags) > 7:
    issues.append('WARNING: Too many hashtags (max 7)')

banned = {'#fyp', '#foryou', '#viral', '#trending'}
for tag in tags:
    if tag.lower() in banned:
        issues.append(f'CRITICAL: Banned hashtag: {tag}')

if issues:
    for issue in issues:
        print(f'  ⚠️  {issue}')
else:
    print('  ✅ All policy checks passed!')
"

success "Policy check complete"

# ============================================================
# SUMMARY
# ============================================================
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ VIDEO FACTORY PIPELINE COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Video ID:    ${CYAN}$VIDEO_ID${NC}"
echo -e "  Format:      ${CYAN}$FORMAT${NC}"
echo -e "  Language:    ${CYAN}$LANGUAGE${NC}"
echo -e "  Audio:       ${CYAN}$AUDIO_DIR/${VIDEO_ID}.*${NC}"
echo -e "  Subtitles:   ${CYAN}$AUDIO_DIR/${VIDEO_ID}.srt${NC}"
echo -e "  Output:      ${CYAN}$OUTPUT_DIR/${VIDEO_ID}_${FORMAT}.mp4${NC}"
echo ""
echo -e "  Next: Upload to platform (manual or via API)"
echo ""
