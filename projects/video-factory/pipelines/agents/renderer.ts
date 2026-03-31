import { execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export const renderer = {
  async renderTikTok(scriptId: string): Promise<string> {
    console.log(`[Renderer] Triggering Remotion render for script "${scriptId}" (TikTok 9:16)...`);
    
    // Create output directory if it doesn't exist
    const outputDir = path.resolve(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.resolve(outputDir, `${scriptId}.mp4`);
    const scriptPath = path.resolve(process.cwd(), 'scripts-input', `${scriptId}.json`);
    
    // Read the script content to pass it as stringified JSON directly through the CLI
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    const scriptObj = JSON.parse(scriptContent);
    const durationFrames = Math.max(30, Math.ceil(scriptObj.duration_target * 30));
    
    // Props are passed as an argument directly, no need for bash escaping
    const props = JSON.stringify({ script: scriptObj });
    
    // Run remotion render limiting the frame range so we don't end up with a black trailing screen
    console.log(`[Renderer] Executing remotion render command for ${durationFrames} frames...`);
    execFileSync('npx', [
      'remotion', 
      'render', 
      'src/index.ts', 
      'TikTokVideo', 
      `--frames=0-${durationFrames - 1}`, 
      '--props', 
      props, 
      outputPath
    ], { stdio: 'inherit' });
    
    console.log(`[Renderer] Render complete. Output path: ${outputPath}`);
    
    return outputPath;
  }
};
