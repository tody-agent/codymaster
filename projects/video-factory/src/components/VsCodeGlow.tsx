// src/components/VsCodeGlow.tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../lib/theme";

export const VsCodeGlow: React.FC<{ code: string }> = ({ code }) => {
  const frame = useCurrentFrame();

  // Scroll effect if code is long
  const scrollY = Math.max(0, (frame - 30) * 2);

  // Very basic syntax highlighting simulation
  const highlightCode = (rawCode: string) => {
    return rawCode.split("\n").map((line, i) => {
      // Colorize common keywords
      let coloredLine = line
        .replace(/\b(import|export|const|let|var|function|return|if|else)\b/g, `<span style="color: ${theme.colors.accent}">$1</span>`)
        .replace(/\b(true|false|null|undefined)\b/g, `<span style="color: ${theme.colors.warning}">$1</span>`)
        .replace(/(['"`].*?['"`])/g, `<span style="color: ${theme.colors.success}">$1</span>`)
        .replace(/(\/\/.*)/g, `<span style="color: ${theme.colors.textMuted}">$1</span>`);

      return (
        <div key={i} style={{ display: "flex", gap: "20px", marginBottom: "8px" }}>
          <span style={{ color: theme.colors.textMuted, width: "30px", textAlign: "right", userSelect: "none" }}>
            {i + 1}
          </span>
          <span dangerouslySetInnerHTML={{ __html: coloredLine }} />
        </div>
      );
    });
  };

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
          maxWidth: "960px",
          height: "1200px",
          backgroundColor: theme.colors.bgDeep,
          borderRadius: "24px",
          overflow: "hidden",
          border: `1px solid ${theme.colors.bgElevated}`,
          boxShadow: `0 20px 80px rgba(0,0,0,0.8), 0 0 50px ${theme.colors.glowPurple}`,
          position: "relative",
        }}
      >
        {/* Editor Tab */}
        <div
          style={{
            backgroundColor: theme.colors.bgSurface,
            padding: "20px 30px",
            borderBottom: `1px solid ${theme.colors.bgElevated}`,
            fontFamily: theme.fonts.ui,
            fontSize: "24px",
            color: theme.colors.textSecondary,
          }}
        >
          agent.ts
        </div>

        {/* Editor Body */}
        <div
          style={{
            padding: "40px 20px",
            fontFamily: theme.fonts.code,
            fontSize: "32px",
            color: theme.colors.textPrimary,
            transform: `translateY(-${scrollY}px)`,
          }}
        >
          {highlightCode(code)}
        </div>
      </div>
    </AbsoluteFill>
  );
};
