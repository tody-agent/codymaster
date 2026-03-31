// src/components/TitleCard.tsx
import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../lib/theme";

export const TitleCard: React.FC<{ title: string; hook: string }> = ({ title, hook }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance animation: scale up + fade in
  const scale = spring({ fps, frame, config: theme.animation.springDefault });
  const opacity = Math.min(1, frame / 15);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.colors.bgDeep,
        padding: "0 80px",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "40px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "80px",
            fontWeight: 800,
            color: theme.colors.primary,
            textShadow: `0 0 40px ${theme.colors.glowCyan}`,
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: "48px",
            fontWeight: 500,
            color: theme.colors.textPrimary,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {hook}
        </p>
      </div>
    </AbsoluteFill>
  );
};
