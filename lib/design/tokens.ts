import type { CSSProperties } from "react";
import type {
  ColorTokens,
  DesignGenerationOutput,
  GeneratedScreen,
  SpacingTokens,
  TypographyTokens,
} from "@/lib/ai/schemas";
import { defaultColorTokens } from "@/lib/ai/schemas";

export type ResolvedTokens = {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radius: string;
};

const DEFAULT_TYPOGRAPHY: TypographyTokens = {
  display: "26px",
  title: "20px",
  body: "13px",
  caption: "11px",
};

const DEFAULT_SPACING: SpacingTokens = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
};

export function resolveTokens(
  design: DesignGenerationOutput | null,
  screen: GeneratedScreen | null,
): ResolvedTokens {
  const palette = design?.designDirection?.colorPalette;
  const colors: ColorTokens = {
    ...defaultColorTokens(palette),
    ...screen?.colorTokens,
  };

  return {
    colors,
    typography: screen?.typographyTokens ?? DEFAULT_TYPOGRAPHY,
    spacing: screen?.spacingTokens ?? DEFAULT_SPACING,
    radius: screen?.radius ?? "12px",
  };
}

export function tokensToStyle(tokens: ResolvedTokens): CSSProperties {
  return {
    backgroundColor: tokens.colors.background,
    color: tokens.colors.text,
    ["--ds-bg" as string]: tokens.colors.background,
    ["--ds-surface" as string]: tokens.colors.surface,
    ["--ds-primary" as string]: tokens.colors.primary,
    ["--ds-secondary" as string]: tokens.colors.secondary,
    ["--ds-accent" as string]: tokens.colors.accent,
    ["--ds-text" as string]: tokens.colors.text,
    ["--ds-muted" as string]: tokens.colors.muted,
    ["--ds-display" as string]: tokens.typography.display,
    ["--ds-title" as string]: tokens.typography.title,
    ["--ds-body" as string]: tokens.typography.body,
    ["--ds-caption" as string]: tokens.typography.caption,
    ["--ds-space-xs" as string]: tokens.spacing.xs,
    ["--ds-space-sm" as string]: tokens.spacing.sm,
    ["--ds-space-md" as string]: tokens.spacing.md,
    ["--ds-space-lg" as string]: tokens.spacing.lg,
    ["--ds-space-xl" as string]: tokens.spacing.xl,
    ["--ds-radius" as string]: tokens.radius,
  };
}

export function deviceDimensions(device: "mobile" | "tablet" | "desktop") {
  if (device === "tablet") return { width: 768, height: 1024, label: "iPad" };
  if (device === "desktop") return { width: 1280, height: 800, label: "Desktop" };
  return { width: 310, height: 620, label: "iPhone 15" };
}
