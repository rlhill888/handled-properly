// Shared between the admin FormBuilder (which edits/previews a theme) and
// the public form-fill page (which must render the same theme for real
// submitters) — kept in one place so the two can never drift apart.

export type BackgroundMode = "banner" | "full";

export const FONT_OPTIONS = {
  sans: "var(--font-geist-sans), system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "var(--font-geist-mono), monospace",
} as const;

export type FontOption = keyof typeof FONT_OPTIONS;

export type FormTheme = {
  backgroundColor: string;
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
};

export const DEFAULT_THEME: FormTheme = {
  backgroundColor: "#f5f5f5",
  fontSize: 14,
  cardOpacity: 1,
  backgroundImage: null,
  backgroundMode: "banner",
  bannerHeight: 140,
  questionBackgroundColor: "#ffffff",
  titleFont: "sans",
  titleColor: "#ffffff",
  titleSize: 24,
  titleMarginBottom: 0,
  descriptionFont: "sans",
  descriptionColor: "#000000",
  descriptionSize: 16,
  descriptionMarginBottom: 0,
};

export function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
