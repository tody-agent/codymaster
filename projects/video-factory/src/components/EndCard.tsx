// src/components/EndCard.tsx
import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../lib/theme";

export const EndCard: React.FC<{ cta: string }> = ({ cta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scale bounce
  const scale = spring({ fps, frame, config: theme.animation.springFast });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.colors.bgVoid,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          padding: "60px 100px",
          borderRadius: "40px",
          backgroundColor: theme.colors.accent,
          boxShadow: `0 0 100px ${theme.colors.glowPurple}`,
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "72px",
            fontWeight: 900,
            color: "#FFF",
            margin: 0,
            textTransform: "uppercase",
          }}
        >
          {cta}
        </h2>
      </div>
    </AbsoluteFill>
  );
};
