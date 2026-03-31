// src/Root.tsx — Remotion Root: registers all compositions
import React from "react";
import { Composition } from "remotion";
import { TikTokVideo } from "./compositions/TikTokVideo";
import { theme } from "./lib/theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Primary: 9:16 Vertical (TikTok / Shorts / Reels) */}
      <Composition
        id="TikTokVideo"
        component={TikTokVideo}
        width={theme.tiktok.width}
        height={theme.tiktok.height}
        fps={theme.tiktok.fps}
        durationInFrames={30 * 60} // default 60s, overridden by props
        defaultProps={{
          scriptPath: "scripts-input/sample.json",
        }}
      />

      {/* Future: 16:9 Horizontal (YouTube long-form) */}
      {/* <Composition
        id="YouTubeVideo"
        component={YouTubeVideo}
        width={theme.youtube.width}
        height={theme.youtube.height}
        fps={theme.youtube.fps}
        durationInFrames={30 * 300}
        defaultProps={{
          scriptPath: "scripts-input/sample.json",
        }}
      /> */}
    </>
  );
};
