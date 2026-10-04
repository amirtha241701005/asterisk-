import type { DesignGenerationOutput, DesignQualityReport, UxReasoning } from "@/lib/ai/schemas";
import type { InspirationResult, InspoReference } from "@/lib/inspo/types";

export type Tool = "select" | "frame" | "text" | "shape" | "component";
export type DeviceType = "mobile" | "tablet" | "desktop";

export type ScreenKind =
  | "home"
  | "explore"
  | "product"
  | "checkout"
  | "detail"
  | "profile"
  | "settings"
  | "dashboard"
  | "search"
  | "onboarding"
  | "custom";

export type ScreenItem = {
  id: string;
  name: string;
  kind: ScreenKind;
};

export type LayerItem = {
  id: string;
  name: string;
  type: string;
};

export type AiInsight =
  | "persona"
  | "flow"
  | "direction"
  | "ux"
  | "inspiration"
  | "quality";

export type ChatMessage = {
  id: string;
  role: "ai" | "user";
  text: string;
};

export type InspirationState = {
  data: InspirationResult | null;
  selectedReference?: InspoReference;
  loading: boolean;
  error?: string;
};

export type DesignerState = {
  projectName: string;
  screens: ScreenItem[];
  activeScreenId: string;
  selectedLayerId: string | null;
  layers: LayerItem[];
  tool: Tool;
  zoom: number;
  device: DeviceType;
  previewMode: boolean;
  prompt: string;
  generated: boolean;
  insights: AiInsight[];
  messages: ChatMessage[];
  designData: DesignGenerationOutput | null;
  uxReasoning: UxReasoning | null;
  inspiration: InspirationState;
  quality: DesignQualityReport | null;
  isLoading: boolean;
  error: string | null;
};
