import { VideoScript } from '../../src/lib/types';
import path from 'path';
import { execFileSync } from 'child_process';
import fs from 'fs';

export const ttsEngine = {
  async generateAudio(script: VideoScript): Promise<string> {
    console.log(`[TTS] Generating Neural TTS audio via edge-tts for script "${script.id}"...`);
    
    const publicAudioDir = path.resolve(process.cwd(), 'public', 'audio');
    if (!fs.existsSync(publicAudioDir)) {
      fs.mkdirSync(publicAudioDir, { recursive: true });
    }
    
    // Concatenate all scenes to form the voiceover text
    const fullText = script.scenes.map(s => s.text).join(". \n");
    
    const outputPath = path.resolve(publicAudioDir, `${script.id}.mp3`);
    
    // Write the text to a temp file to avoid issues with special characters in CLI arguments
    const tempTextPath = path.resolve(publicAudioDir, `${script.id}_temp.txt`);
    fs.writeFileSync(tempTextPath, fullText, 'utf8');

    try {
        console.log(`[TTS] Using edge-tts with voice 'vi-VN-HoaiMyNeural'`);
        execFileSync('edge-tts', [
          '--voice', 'vi-VN-HoaiMyNeural',
          '-f', tempTextPath,
          '--write-media', outputPath
        ]);
    } catch (e) {
        console.log(`[TTS] edge-tts not found or failed, falling back to macOS say...`);
        try {
          execFileSync('say', [
            '-v', 'Linh',
            '-o', `${outputPath}.wav`,
            '--data-format=LEF32@44100',
            fullText
          ]);
        } catch (fallbackErr) {
          // If 'Linh' voice is not installed, fallback to default voice
          execFileSync('say', [
            '-o', `${outputPath}.wav`,
            '--data-format=LEF32@44100',
            fullText
          ]);
        }
        fs.unlinkSync(tempTextPath);
        return `audio/${script.id}.mp3.wav`; 
    }
    
    // Clean up temporary text file
    fs.unlinkSync(tempTextPath);
    
    console.log(`[TTS] Audio generated and saved to ${outputPath}`);
    
    // Return relative path string to be used inside Remotion
    return `audio/${script.id}.mp3`;
  }
};
