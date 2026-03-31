// src/components/BouncingSubtitle.tsx
import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../lib/theme";

export const BouncingSubtitle: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Simple pop-in animation for each subtitle chunk
  const scale = spring({ fps, frame, config: theme.animation.springFast });

  return (
    <div
      style={{
        position: "absolute",
        bottom: theme.tiktok.safeZone.bottom + 100,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        padding: "0 60px",
        zIndex: 100,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: "20px 40px",
          borderRadius: "20px",
          border: `2px solid ${theme.colors.primary}`,
          boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 20px ${theme.colors.glowCyan}`,
        }}
      >
        <span
          style={{
            fontFamily: theme.fonts.ui,
            fontSize: "56px",
            fontWeight: 800,
            color: "#FFF",
            textAlign: "center",
            display: "block",
            lineHeight: 1.2,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};
