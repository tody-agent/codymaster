// src/compositions/TikTokVideo.tsx
import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Sequence, useVideoConfig, getInputProps, staticFile } from "remotion";
import { VideoScript, VideoScene } from "../lib/types";
import { theme } from "../lib/theme";
import { DarkTerminal } from "../components/DarkTerminal";
import { VsCodeGlow } from "../components/VsCodeGlow";
import { TitleCard } from "../components/TitleCard";
import { EndCard } from "../components/EndCard";
import { BouncingSubtitle } from "../components/BouncingSubtitle";

export const TikTokVideo: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const [script, setScript] = useState<VideoScript | null>(null);
  const inputProps = getInputProps() as { script?: VideoScript };

  useEffect(() => {
    if (inputProps.script) {
      setScript(inputProps.script);
    } else {
      // Fallback sample for Studio Mode
      setScript({
        id: "sample-01",
        title: "How to Build an Agent",
        hook: "Did you know you can build an AI agent in 5 minutes?",
        language: "en",
        duration_target: 30,
        format: "tiktok",
        cta: "Follow for more AI tutorials!",
        scenes: [
          { time_start: 0, duration: 3, text: "Did you know you can build an AI agent in 5 minutes?", visual: "TitleCard" },
          { time_start: 3, duration: 5, text: "Here is the code to do it.", visual: "VsCodeGlow", props: { code: "console.log('Hello AI');" } },
          { time_start: 8, duration: 4, text: "And then you just run it.", visual: "DarkTerminal", props: { command: "npm start" } },
          { time_start: 12, duration: 3, text: "Follow for more AI tutorials!", visual: "EndCard" }
        ]
      });
    }
  }, [inputProps.script]);

  if (!script) {
    return <AbsoluteFill style={{ backgroundColor: theme.colors.bgVoid }} />;
  }

  const renderVisual = (scene: VideoScene) => {
    switch (scene.visual) {
      case "TitleCard":
        return <TitleCard title={script.title} hook={script.hook} />;
      case "VsCodeGlow":
        return <VsCodeGlow code={(scene.props?.code as string) || "// Code here"} />;
      case "DarkTerminal":
        return <DarkTerminal command={(scene.props?.command as string) || "run agent"} />;
      case "EndCard":
        return <EndCard cta={script.cta} />;
      default:
        return <TitleCard title="Missing Visual" hook={scene.text} />;
    }
  };

  const audioFile = `audio/${script.id}.mp3`;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.bgVoid, fontFamily: theme.fonts.ui }}>

      {script.scenes.map((scene, i) => {
        const fromFrame = Math.floor(scene.time_start * fps);
        const durationFrames = Math.floor(scene.duration * fps);
        
        return (
          <Sequence key={i} from={fromFrame} durationInFrames={durationFrames}>
            {renderVisual(scene)}
            <BouncingSubtitle text={scene.text} />
          </Sequence>
        );
      })}

      {/* Primary TTS Audio Track dynamically set via script.id */}
      {script.id !== "sample-01" && (
        <Audio src={staticFile(audioFile)} />
      )}
    </AbsoluteFill>
  );
};
