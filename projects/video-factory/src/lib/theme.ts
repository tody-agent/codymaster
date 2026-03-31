// src/lib/theme.ts — VibeCoding Design Tokens
// All visual components MUST use these tokens. No hardcoded colors.

export const theme = {
  colors: {
    // Core palette
    primary: "#00F0FF",      // Cyan glow
    secondary: "#FF007F",    // Hot pink
    accent: "#8B5CF6",       // Electric purple
    success: "#22C55E",      // Green
    warning: "#F59E0B",      // Amber
    error: "#EF4444",        // Red

    // Backgrounds (dark mode only)
    bgVoid: "#0A0A0A",       // Deepest black
    bgDeep: "#050B14",       // Navy undertone
    bgSurface: "#111827",    // Card surfaces
    bgElevated: "#1F2937",   // Elevated elements

    // Text
    textPrimary: "#FFFFFF",
    textSecondary: "#9CA3AF",
    textMuted: "#6B7280",

    // Glow effects
    glowCyan: "rgba(0, 240, 255, 0.4)",
    glowPink: "rgba(255, 0, 127, 0.3)",
    glowPurple: "rgba(139, 92, 246, 0.3)",
  },

  fonts: {
    code: "'Fira Code', 'JetBrains Mono', monospace",
    ui: "'Inter', -apple-system, sans-serif",
    vietnamese: "'Be Vietnam Pro', 'Inter', sans-serif",
  },

  // 9:16 vertical (TikTok/Shorts/Reels) — PRIMARY
  tiktok: {
    width: 1080,
    height: 1920,
    fps: 30,
    safeZone: { top: 150, bottom: 200, left: 40, right: 40 },
  },

  // 16:9 horizontal (YouTube) — FUTURE
  youtube: {
    width: 1920,
    height: 1080,
    fps: 30,
    safeZone: { top: 40, bottom: 60, left: 60, right: 60 },
  },

  animation: {
    springFast: { damping: 20, mass: 0.5, stiffness: 200 },
    springDefault: { damping: 15, mass: 1, stiffness: 120 },
    springSlow: { damping: 25, mass: 1.5, stiffness: 80 },
  },
} as const;

export type Theme = typeof theme;
