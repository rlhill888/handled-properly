// Shared between the admin FormBuilder (which edits/previews a theme) and
// the public form-fill page (which must render the same theme for real
// submitters) — kept in one place so the two can never drift apart.

export type BackgroundMode = "banner" | "full";
export type SubmitButtonStyle = "solid" | "outline";
export type PageBackgroundType = "solid" | "gradient";
export type PageBackgroundAnimation = "none" | "gradientShift" | "drift" | "pulse";

export const FONT_OPTIONS = {
  sans: "var(--font-geist-sans), system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "var(--font-geist-mono), monospace",
} as const;

export type FontOption = keyof typeof FONT_OPTIONS;

export type FormTheme = {
  backgroundColor: string;
  pageBackgroundColor: string;
  pageBackgroundType: PageBackgroundType;
  pageBackgroundGradientColor: string;
  pageBackgroundGradientAngle: number;
  pageBackgroundAnimation: PageBackgroundAnimation;
  fontSize: number;
  cardOpacity: number;
  backgroundImage: string | null;
  backgroundMode: BackgroundMode;
  bannerHeight: number;
  questionBackgroundColor: string;
  titleFont: FontOption;
  titleColor: string;
  titleSize: number;
  titleMarginBottom: number;
  descriptionFont: FontOption;
  descriptionColor: string;
  descriptionSize: number;
  descriptionMarginBottom: number;
  submitButtonFont: FontOption;
  submitButtonBackgroundColor: string;
  submitButtonStyle: SubmitButtonStyle;
};

export const DEFAULT_THEME: FormTheme = {
  backgroundColor: "#f5f5f5",
  pageBackgroundColor: "#f5f5f5",
  pageBackgroundType: "solid",
  pageBackgroundGradientColor: "#e5e5e5",
  pageBackgroundGradientAngle: 135,
  pageBackgroundAnimation: "none",
  fontSize: 14,
  cardOpacity: 1,
  backgroundImage: null,
  backgroundMode: "banner",
  bannerHeight: 140,
  questionBackgroundColor: "#ffffff",
  titleFont: "sans",
  titleColor: "#0a0a0a",
  titleSize: 24,
  titleMarginBottom: 0,
  descriptionFont: "sans",
  descriptionColor: "#000000",
  descriptionSize: 16,
  descriptionMarginBottom: 0,
  submitButtonFont: "sans",
  submitButtonBackgroundColor: "#111827",
  submitButtonStyle: "solid",
};

export function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Shared by every submit-button rendering (the public page and both admin
// previews) so its look can never drift between them the way the rest of
// the surface used to before FormRenderSurface — "outline" reuses the same
// background-color field as its border/text accent rather than needing a
// separate color just for that mode.
export function getSubmitButtonStyle(theme: FormTheme): {
  fontFamily: string;
  backgroundColor: string;
  color: string;
  border: string;
} {
  const fontFamily = FONT_OPTIONS[theme.submitButtonFont];

  if (theme.submitButtonStyle === "outline") {
    return {
      fontFamily,
      backgroundColor: "transparent",
      color: theme.submitButtonBackgroundColor,
      border: `2px solid ${theme.submitButtonBackgroundColor}`,
    };
  }

  return {
    fontFamily,
    backgroundColor: theme.submitButtonBackgroundColor,
    color: "#ffffff",
    border: "none",
  };
}

// Shared by every full-viewport page-background rendering (the public
// page's .page and loading overlay, and the admin's full-screen preview) —
// same reasoning as getSubmitButtonStyle above. A gradient reuses
// pageBackgroundColor as its first stop, so a solid color chosen before
// switching to "gradient" carries over rather than being lost.
export function getPageBackgroundStyle(theme: FormTheme): {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
} {
  if (theme.pageBackgroundType === "gradient") {
    return {
      backgroundImage: `linear-gradient(${theme.pageBackgroundGradientAngle}deg, ${theme.pageBackgroundColor}, ${theme.pageBackgroundGradientColor})`,
      backgroundSize: theme.pageBackgroundAnimation === "none" ? undefined : "200% 200%",
    };
  }

  return { backgroundColor: theme.pageBackgroundColor };
}

// Global (non-CSS-module) class names defined in globals.css — animating a
// background needs actual @keyframes, which inline styles can't reference
// reliably, so this maps the theme value to a plain class instead. Each one
// is a no-op unless the visitor's OS allows motion (globals.css gates them
// behind prefers-reduced-motion).
const PAGE_BACKGROUND_ANIMATION_CLASS: Record<PageBackgroundAnimation, string> = {
  none: "",
  gradientShift: "formPageBg-gradientShift",
  drift: "formPageBg-drift",
  pulse: "formPageBg-pulse",
};

export function getPageBackgroundAnimationClass(theme: FormTheme): string {
  return PAGE_BACKGROUND_ANIMATION_CLASS[theme.pageBackgroundAnimation] ?? "";
}
