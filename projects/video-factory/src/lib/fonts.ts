// src/lib/fonts.ts — Font loading for Remotion
import { staticFile } from "remotion";

// Google Fonts loaded via @import in global CSS or staticFile
export const fontFamilies = {
  code: "Fira Code",
  ui: "Inter",
  vietnamese: "Be Vietnam Pro",
};

/**
 * CSS @font-face declarations for Remotion rendering.
 * These get injected into the composition via a style tag.
 */
export const fontStyles = `
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600;700&family=Inter:wght@400;500;600;700;800;900&family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap');
`;
