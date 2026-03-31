// src/components/DarkTerminal.tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../lib/theme";

export const DarkTerminal: React.FC<{ command: string }> = ({ command }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Typewriter effect calculating how many chars to show based on frame
  const charsPerFrame = 2; // Type speed
  const visibleChars = Math.min(command.length, Math.floor(frame * charsPerFrame));
  const displayedCommand = command.substring(0, visibleChars);
  const showCursor = Math.floor(frame / 15) % 2 === 0;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.colors.bgVoid,
        padding: "40px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          backgroundColor: theme.colors.bgDeep,
          borderRadius: "24px",
          overflow: "hidden",
          border: `1px solid ${theme.colors.bgElevated}`,
          boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 40px ${theme.colors.glowCyan}`,
        }}
      >
        {/* Terminal Header */}
        <div
          style={{
            backgroundColor: theme.colors.bgSurface,
            padding: "20px 30px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            borderBottom: `1px solid ${theme.colors.bgElevated}`,
          }}
        >
          <div style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: theme.colors.error }} />
          <div style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: theme.colors.warning }} />
          <div style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: theme.colors.success }} />
          <div
            style={{
              marginLeft: "10px",
              fontFamily: theme.fonts.ui,
              fontSize: "20px",
              color: theme.colors.textMuted,
              fontWeight: 500,
            }}
          >
            codymaster@agent: ~
          </div>
        </div>

        {/* Terminal Body */}
        <div style={{ padding: "40px" }}>
          <div
            style={{
              fontFamily: theme.fonts.code,
              fontSize: "36px",
              color: theme.colors.primary,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              textShadow: `0 0 10px ${theme.colors.glowCyan}`,
            }}
          >
            <span style={{ color: theme.colors.textSecondary }}>$</span> {displayedCommand}
            {showCursor && (
              <span
                style={{
                  display: "inline-block",
                  width: "20px",
                  height: "40px",
                  backgroundColor: theme.colors.primary,
                  marginLeft: "10px",
                  verticalAlign: "middle",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
