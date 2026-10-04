export type InspoReference = {
  id: string;
  slug?: string;
  name: string;
  url?: string;
  screenshotUrl?: string;
  thumbnailUrl?: string;
  macrostructure?: string;
  visualHierarchy?: string;
  palette: string[];
  typography: string[];
  spacing?: string;
  components: string[];
  interactions: string[];
  tone?: string;
  rationale?: string;
};

export type InspoDesignSystem = {
  source?: string;
  colors: string[];
  typography: string[];
  spacing?: string[];
  radius?: string[];
  shadows?: string[];
};

export type InspirationResult = {
  available: boolean;
  query: string;
  references: InspoReference[];
  components: string[];
  designSystem?: InspoDesignSystem;
  summary: string;
  toolsInvoked: string[];
  error?: string;
};
