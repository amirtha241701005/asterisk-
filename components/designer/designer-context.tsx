"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getScreens } from "@/lib/ai/schemas";
import type {
  DesignGenerationOutput,
  DesignQualityReport,
  GeneratedComponent,
  UxReasoning,
} from "@/lib/ai/schemas";

import type { InspirationResult } from "@/lib/inspo/types";

import type {
  AiInsight,
  ChatMessage,
  DesignerState,
  DeviceType,
  LayerItem,
  ScreenItem,
  Tool,
} from "./types";

type EditorComponentType =
  | "button"
  | "card"
  | "input"
  | "badge"
  | "avatar"
  | "list";

type EditorShapeType =
  | "rectangle"
  | "rounded"
  | "circle"
  | "pill"
  | "line";

type DesignerContextValue = DesignerState & {
  setPrompt: (value: string) => void;
  setTool: (tool: Tool) => void;
  setZoom: (zoom: number) => void;
  setDevice: (device: DeviceType) => void;
  setPreviewMode: (on: boolean) => void;
  selectScreen: (id: string) => void;
  selectLayer: (id: string | null) => void;

  addText: () => void;
  addShape: (shape: EditorShapeType) => void;
  addComponent: (type: EditorComponentType) => void;
  updateComponentProps: (
    id: string,
    props: Record<string, unknown>,
  ) => void;

  generateUi: () => Promise<void>;
  refineDesign: (instruction: string) => Promise<void>;
  createPersona: () => void;
  createUserFlow: () => void;
  analyzeUx: () => Promise<void>;
  applyImprovements: () => Promise<void>;
  exploreInspiration: () => Promise<void>;
};

const initialMessages: ChatMessage[] = [
  {
    id: "ai-welcome",
    role: "ai",
    text: "Describe what you want to design. I'll analyze the brief, research relevant patterns, reason about UX, and generate a complete multi-screen interface.",
  },
];

const DesignerContext =
  createContext<DesignerContextValue | null>(null);

function appendInsight(
  list: AiInsight[],
  insight: AiInsight,
) {
  return list.includes(insight)
    ? list
    : [...list, insight];
}

function componentsToLayers(
  components: {
    id: string;
    name: string;
    type: string;
  }[],
): LayerItem[] {
  return components.map((c) => ({
    id: c.id,
    name: c.name || c.id,
    type:
      c.type === "search" ||
        c.type === "tabbar" ||
        c.type === "navigation"
        ? "Component"
        : c.type === "categories" ||
          c.type === "feed" ||
          c.type === "list" ||
          c.type === "grid"
          ? "Auto Layout"
          : "Frame",
  }));
}

function screensFromDesign(
  design: DesignGenerationOutput,
): ScreenItem[] {
  return getScreens(design).map((s) => ({
    id: s.id,
    name: s.name,
    kind: s.kind,
  }));
}

function applyGeneration(
  design: DesignGenerationOutput,
  extras: {
    uxReasoning?: UxReasoning | null;
    inspiration?: InspirationResult | null;
    quality?: DesignQualityReport | null;
  } = {},
) {
  const screenList = screensFromDesign(design);
  const first = getScreens(design)[0];

  return {
    design,
    screens: screenList,
    activeScreenId: first?.id ?? "home",
    layers: first
      ? componentsToLayers(first.components)
      : [],
    uxReasoning:
      extras.uxReasoning ??
      design.uxReasoning ??
      null,
    inspiration:
      extras.inspiration ?? null,
    quality:
      extras.quality ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/* EDITOR COMPONENT CREATION                                                  */
/* -------------------------------------------------------------------------- */

function createEditorComponent(
  type: "text" | "shape" | EditorComponentType,
  shapeType?: EditorShapeType,
): GeneratedComponent {
  const id = `editor-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const base = {
    id,
    name: "",
    children: [],
    interactions: [],
    states: [],
    activeState: "default" as const,
  };

  switch (type) {
    case "text":
      return {
        ...base,
        type: "text",
        name: "Text",
        accessibilityLabel: "Text layer",
        props: {
          title: "New Text",
          label: "New Text",
        },
      };

    case "shape": {
      const shape = shapeType ?? "rectangle";

      const shapeNames: Record<EditorShapeType, string> = {
        rectangle: "Rectangle",
        rounded: "Rounded Rectangle",
        circle: "Circle",
        pill: "Pill",
        line: "Line",
      };

      return {
        ...base,
        type: "card",
        name: shapeNames[shape],
        accessibilityLabel: `${shapeNames[shape]} shape`,
        props: {
          title: "",
          editorKind: "shape",
          shapeType: shape,
          width: shape === "circle" ? 120 : shape === "line" ? 180 : 160,
          height: shape === "circle" ? 120 : shape === "line" ? 3 : 100,
        },
      };
    }

    case "button":
      return {
        ...base,
        type: "button",
        name: "Button",
        accessibilityLabel: "Button",
        props: {
          label: "Button",
          actionText: "Button",
        },
      };

    case "card":
      return {
        ...base,
        type: "card",
        name: "Card",
        accessibilityLabel: "Card",
        props: {
          title: "Card Title",
          subtitle: "Card content",
        },
      };

    case "input":
      return {
        ...base,
        type: "input",
        name: "Input",
        accessibilityLabel: "Input field",
        props: {
          label: "Input",
          placeholder: "Enter text...",
        },
      };

    case "badge":
      return {
        ...base,
        type: "badge",
        name: "Badge",
        accessibilityLabel: "Badge",
        props: {
          label: "Badge",
        },
      };

    case "avatar":
      return {
        ...base,
        type: "avatar",
        name: "Avatar",
        accessibilityLabel: "Avatar",
        props: {
          title: "A",
        },
      };

    case "list":
      return {
        ...base,
        type: "list",
        name: "List",
        accessibilityLabel: "List",
        props: {
          title: "List",
          width: 220,
          height: 190,
          items: [
            {
              title: "List Item",
              description: "Supporting information",
            },
            {
              title: "List Item",
              description: "Supporting information",
            },
            {
              title: "List Item 3",
              description: "Supporting information",
            },
          ],
        },
      };
  }
}

export function DesignerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [projectName] =
    useState("Untitled Project");

  const [screens, setScreens] =
    useState<ScreenItem[]>([]);

  const [activeScreenId, setActiveScreenId] =
    useState("");

  const [selectedLayerId, setSelectedLayerId] =
    useState<string | null>(null);

  const [layers, setLayers] =
    useState<LayerItem[]>([]);

  const [tool, setTool] =
    useState<Tool>("select");

  const [zoom, setZoomState] =
    useState(100);

  const [device, setDevice] =
    useState<DeviceType>("mobile");

  const [previewMode, setPreviewMode] =
    useState(false);

  const [prompt, setPrompt] = useState(
    "Design a modern food delivery app for college students.",
  );

  const [generated, setGenerated] =
    useState(false);

  const [insights, setInsights] =
    useState<AiInsight[]>([]);

  const [messages, setMessages] =
    useState(initialMessages);

  const [designData, setDesignData] =
    useState<DesignGenerationOutput | null>(
      null,
    );

  const [uxReasoning, setUxReasoning] =
    useState<UxReasoning | null>(null);

  const [inspiration, setInspiration] =
    useState<DesignerState["inspiration"]>({
      data: null,
      loading: false,
    });

  const [quality, setQuality] =
    useState<DesignQualityReport | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const pushAi = useCallback(
    (
      text: string,
      insight?: AiInsight,
    ) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}-${prev.length}`,
          role: "ai",
          text,
        },
      ]);

      if (insight) {
        setInsights((prev) =>
          appendInsight(
            prev,
            insight,
          ),
        );
      }
    },
    [],
  );

  const syncActiveScreenLayers =
    useCallback(
      (
        design: DesignGenerationOutput,
        screenId: string,
      ) => {
        const screen = getScreens(
          design,
        ).find(
          (s) => s.id === screenId,
        );

        if (screen) {
          setLayers(
            componentsToLayers(
              screen.components,
            ),
          );
        }
      },
      [],
    );

  const selectScreen = useCallback(
    (id: string) => {
      setActiveScreenId(id);

      if (designData) {
        syncActiveScreenLayers(
          designData,
          id,
        );
      }

      setSelectedLayerId(null);
    },
    [
      designData,
      syncActiveScreenLayers,
    ],
  );

  /* ---------------------------------------------------------------------- */
  /* ADD EDITOR COMPONENT                                                   */
  /* ---------------------------------------------------------------------- */

  const addEditorComponent =
    useCallback(
      (
        component: GeneratedComponent,
        message: string,
      ) => {
        if (
          !designData ||
          !activeScreenId
        ) {
          pushAi(
            "Generate a design first before adding elements.",
          );
          return;
        }

        const currentScreens =
          getScreens(designData);

        const targetScreen =
          currentScreens.find(
            (screen) =>
              screen.id ===
              activeScreenId,
          );

        if (!targetScreen) {
          pushAi(
            "Select a screen before adding an element.",
          );
          return;
        }

        const updatedScreens =
          currentScreens.map(
            (screen) =>
              screen.id ===
                activeScreenId
                ? {
                  ...screen,
                  components: [
                    ...screen.components,
                    component,
                  ],
                }
                : screen,
          );

        const updatedDesign: DesignGenerationOutput =
        {
          ...designData,
          screens: updatedScreens,
          screen: updatedScreens[0],
        };

        setDesignData(
          updatedDesign,
        );

        const updatedScreen =
          updatedScreens.find(
            (screen) =>
              screen.id ===
              activeScreenId,
          );

        if (updatedScreen) {
          setLayers(
            componentsToLayers(
              updatedScreen.components,
            ),
          );
        }

        setSelectedLayerId(
          component.id,
        );

        setTool("select");

        pushAi(message);
      },
      [
        designData,
        activeScreenId,
        pushAi,
      ],
    );

  const addText = useCallback(
    () => {
      addEditorComponent(
        createEditorComponent(
          "text",
        ),
        "Added a text layer to the active screen.",
      );
    },
    [addEditorComponent],
  );

  const addShape = useCallback(
    (shape: EditorShapeType) => {
      addEditorComponent(
        createEditorComponent("shape", shape),
        `Added a ${shape} shape to the active screen.`,
      );
    },
    [addEditorComponent],
  );

  const addComponent = useCallback(
    (
      type: EditorComponentType,
    ) => {
      addEditorComponent(
        createEditorComponent(type),
        `Added a ${type} component to the active screen.`,
      );
    },
    [addEditorComponent],
  );

  const updateComponentProps = useCallback(
    (
      id: string,
      props: Record<string, unknown>,
    ) => {
      setDesignData((previous) => {
        if (!previous) return previous;

        const updatedScreens = getScreens(previous).map((screen) => ({
          ...screen,
          components: screen.components.map((component) =>
            component.id === id
              ? {
                ...component,
                props: {
                  ...(component.props ?? {}),
                  ...props,
                },
              }
              : component,
          ),
        }));

        return {
          ...previous,
          screens: updatedScreens,
          screen:
            updatedScreens.find(
              (screen) => screen.id === activeScreenId,
            ) ?? updatedScreens[0],
        };
      });
    },
    [activeScreenId],
  );

  /* ---------------------------------------------------------------------- */
  /* GENERATION                                                             */
  /* ---------------------------------------------------------------------- */

  const generateUi = useCallback(
    async () => {
      if (
        isLoading ||
        !prompt.trim()
      ) {
        return;
      }

      setIsLoading(true);
      setError(null);

      const userPrompt = prompt;

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: "user",
          text: userPrompt,
        },
      ]);

      try {
        const res = await fetch(
          "/api/design",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              prompt: userPrompt,
            }),
          },
        );

        const json =
          await res.json();

        if (
          !res.ok ||
          !json.success
        ) {
          throw new Error(
            json.error ||
            "Failed to generate design",
          );
        }

        const applied =
          applyGeneration(
            json.data,
            {
              uxReasoning:
                json.uxReasoning,
              inspiration:
                json.inspiration,
            },
          );

        setDesignData(
          applied.design,
        );

        setScreens(
          applied.screens,
        );

        setActiveScreenId(
          applied.activeScreenId,
        );

        setLayers(
          applied.layers,
        );

        setUxReasoning(
          applied.uxReasoning,
        );

        setInspiration({
          data:
            applied.inspiration,
          loading: false,
        });

        setQuality(null);
        setSelectedLayerId(null);
        setTool("select");
        setGenerated(true);

        const summary =
          `Generated ${applied.screens.length} screen(s) for ${applied.design.persona.name}.
Theme: ${applied.design.designDirection.theme}.
${applied.design.designDirection.notes}`;

        pushAi(summary);

        setInsights([
          "persona",
          "flow",
          "direction",
          "ux",
          "inspiration",
        ]);
      } catch (
      err: unknown
      ) {
        const message =
          err instanceof Error
            ? err.message
            : "Error generating design.";

        setError(message);

        pushAi(
          `Generation error: ${message}`,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      isLoading,
      prompt,
      pushAi,
    ],
  );

  /* ---------------------------------------------------------------------- */
  /* REFINEMENT                                                             */
  /* ---------------------------------------------------------------------- */

  const refineDesignFn =
    useCallback(
      async (
        instruction: string,
      ) => {
        if (
          isLoading ||
          !instruction.trim() ||
          !designData
        ) {
          if (!designData) {
            pushAi(
              "Generate a design first, then refine it with natural language.",
            );
          }

          return;
        }

        setIsLoading(true);
        setError(null);

        setMessages((prev) => [
          ...prev,
          {
            id: `user-${Date.now()}`,
            role: "user",
            text: instruction,
          },
        ]);

        try {
          const res =
            await fetch(
              "/api/design/refine",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify(
                  {
                    instruction,
                    targetScreenId: activeScreenId,
                    design:
                      designData,
                  },
                ),
              },
            );

          const json =
            await res.json();

          if (
            !res.ok ||
            !json.success
          ) {
            throw new Error(
              json.error ||
              "Refinement failed",
            );
          }

          // Safety net: a refinement response may contain only the edited
          // screen. Merge it into the current design before applying anything,
          // so an incomplete API response can never delete the other screens.
          const originalScreens = getScreens(designData);
          const returnedScreens = getScreens(json.data as DesignGenerationOutput);
          const returnedTarget = returnedScreens.find(
            (screen) => screen.id === activeScreenId,
          );

          if (!returnedTarget) {
            throw new Error(
              "Refinement did not return the selected screen. Your existing design was kept unchanged.",
            );
          }

          const returnedById = new Map(
            returnedScreens.map((screen) => [screen.id, screen]),
          );
          const mergedScreens = originalScreens.map(
            (screen) => returnedById.get(screen.id) ?? screen,
          );

          const mergedDesign: DesignGenerationOutput = {
            ...designData,
            ...(json.data as DesignGenerationOutput),
            screens: mergedScreens,
            screen:
              mergedScreens.find((screen) => screen.id === activeScreenId) ??
              mergedScreens[0],
          };

          const applied =
            applyGeneration(
              mergedDesign,
            );

          setDesignData(
            applied.design,
          );

          setScreens(
            applied.screens,
          );

          setActiveScreenId(
            (prev) =>
              applied.screens.some(
                (s) => s.id === prev,
              )
                ? prev
                : applied.activeScreenId,
          );

          syncActiveScreenLayers(
            applied.design,
            activeScreenId ||
            applied.activeScreenId,
          );

          if (
            applied.design
              .uxReasoning
          ) {
            setUxReasoning(
              applied.design
                .uxReasoning,
            );
          }

          setQuality(null);
          setSelectedLayerId(null);
          setTool("select");

          pushAi(
            `Refined: ${instruction}`,
          );
        } catch (
        err: unknown
        ) {
          const message =
            err instanceof Error
              ? err.message
              : "Refinement failed.";

          setError(message);

          pushAi(
            `Refinement error: ${message}`,
          );
        } finally {
          setIsLoading(false);
        }
      },
      [
        isLoading,
        designData,
        activeScreenId,
        pushAi,
        syncActiveScreenLayers,
      ],
    );

  /* ---------------------------------------------------------------------- */
  /* PERSONA                                                                */
  /* ---------------------------------------------------------------------- */

  const createPersona =
    useCallback(() => {
      if (!designData?.persona) {
        pushAi(
          "Generate a design first to see the persona.",
        );
        return;
      }

      const p =
        designData.persona;

      pushAi(
        `Persona: ${p.name}, ${p.age}, ${p.role}. ${p.bio}
Goals: ${p.goals.join(", ")}
Pain points: ${p.painPoints.join(", ")}`,
        "persona",
      );
    }, [
      designData,
      pushAi,
    ]);

  /* ---------------------------------------------------------------------- */
  /* USER FLOW                                                              */
  /* ---------------------------------------------------------------------- */

  const createUserFlow =
    useCallback(() => {
      if (!designData?.userFlow) {
        pushAi(
          "Generate a design first to see the user flow.",
        );
        return;
      }

      const f =
        designData.userFlow;

      pushAi(
        `User Flow (${f.title}): ${f.steps.join(" → ")}`,
        "flow",
      );
    }, [
      designData,
      pushAi,
    ]);

  /* ---------------------------------------------------------------------- */
  /* UX ANALYSIS                                                            */
  /* ---------------------------------------------------------------------- */

  const analyzeUx =
    useCallback(async () => {
      if (!designData) {
        pushAi(
          "Generate a design first to see UX analysis.",
        );
        return;
      }

      if (uxReasoning) {
        pushAi(
          `UX Analysis
Primary task: ${uxReasoning.primaryTask}
Navigation: ${uxReasoning.navigationModel}
IA: ${uxReasoning.informationArchitecture.join(" · ")}
Accessibility: ${uxReasoning.accessibility.join("; ")}
Responsive: ${uxReasoning.responsiveBehavior}`,
          "ux",
        );
      } else if (
        designData.requirements
          ?.length
      ) {
        const reqList =
          designData.requirements
            .map(
              (r) =>
                `• ${r.title} (${r.priority}): ${r.description}`,
            )
            .join("\n");

        pushAi(
          `UX Requirements:\n${reqList}`,
          "ux",
        );
      }

      setIsLoading(true);
      setError(null);

      try {
        const res =
          await fetch(
            "/api/design/quality",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                design:
                  designData,
                uxReasoning,
              }),
            },
          );

        const json =
          await res.json();

        if (
          !res.ok ||
          !json.success
        ) {
          throw new Error(
            json.error ||
            "Quality analysis failed",
          );
        }

        setQuality(
          json.data,
        );

        setInsights((prev) =>
          appendInsight(
            prev,
            "quality",
          ),
        );

        pushAi(
          `Quality review: ${json.data.summary}`,
        );
      } catch (
      err: unknown
      ) {
        const message =
          err instanceof Error
            ? err.message
            : "Quality analysis failed.";

        setError(message);

        pushAi(
          `Quality analysis error: ${message}`,
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      uxReasoning,
      designData,
      pushAi,
    ]);

  /* ---------------------------------------------------------------------- */
  /* IMPROVEMENTS                                                           */
  /* ---------------------------------------------------------------------- */

  const applyImprovements =
    useCallback(async () => {
      if (!designData) {
        pushAi(
          "Generate a design first.",
        );
        return;
      }

      const highFindings =
        quality?.findings.filter(
          (f) =>
            f.severity ===
            "high",
        ) ?? [];

      if (
        !highFindings.length
      ) {
        pushAi(
          "Run Analyze UX to review quality, or no high-severity issues to apply.",
        );
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res =
          await fetch(
            "/api/design/improve",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                design:
                  designData,
                uxReasoning,
                findings:
                  highFindings,
              }),
            },
          );

        const json =
          await res.json();

        if (
          !res.ok ||
          !json.success
        ) {
          throw new Error(
            json.error ||
            "Failed to apply improvements",
          );
        }

        const applied =
          applyGeneration(
            json.data,
          );

        setDesignData(
          applied.design,
        );

        setScreens(
          applied.screens,
        );

        setActiveScreenId(
          (prev) =>
            applied.screens.some(
              (s) => s.id === prev,
            )
              ? prev
              : applied.activeScreenId,
        );

        syncActiveScreenLayers(
          applied.design,
          activeScreenId ||
          applied.activeScreenId,
        );

        if (
          applied.design
            .uxReasoning
        ) {
          setUxReasoning(
            applied.design
              .uxReasoning,
          );
        }

        setQuality(null);
        setSelectedLayerId(null);
        setTool("select");

        pushAi(
          "Applied improvements for high-severity quality findings.",
        );
      } catch (
      err: unknown
      ) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to apply improvements.";

        setError(message);

        pushAi(
          `Improvement error: ${message}`,
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      designData,
      quality,
      uxReasoning,
      activeScreenId,
      pushAi,
      syncActiveScreenLayers,
    ]);

  /* ---------------------------------------------------------------------- */
  /* INSPIRATION                                                            */
  /* ---------------------------------------------------------------------- */

  const exploreInspiration =
    useCallback(async () => {
      const brief =
        uxReasoning
          ? `${prompt}
Primary task: ${uxReasoning.primaryTask}`
          : prompt;

      if (!brief.trim()) {
        return;
      }

      setInspiration(
        (prev) => ({
          ...prev,
          loading: true,
          error: undefined,
        }),
      );

      try {
        const res =
          await fetch(
            "/api/inspiration",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                brief,
              }),
            },
          );

        const json =
          await res.json();

        if (
          !res.ok ||
          !json.success
        ) {
          throw new Error(
            json.error ||
            "Inspiration unavailable",
          );
        }

        const data =
          json.data as InspirationResult;

        setInspiration({
          data,
          loading: false,
        });

        setInsights((prev) =>
          appendInsight(
            prev,
            "inspiration",
          ),
        );

        if (!data.available) {
          pushAi(
            "Inspiration research unavailable — continuing with Asterisk's design reasoning.",
            "inspiration",
          );
          return;
        }

        const refSummary =
          data.references
            .slice(0, 3)
            .map(
              (r) =>
                `• ${r.name}${r.macrostructure
                  ? ` (${r.macrostructure})`
                  : ""
                }`,
            )
            .join("\n");

        pushAi(
          `Inspiration research (${data.toolsInvoked.join(", ")}):
${refSummary}

${data.summary}`,
          "inspiration",
        );
      } catch (
      err: unknown
      ) {
        const message =
          err instanceof Error
            ? err.message
            : "Inspiration unavailable";

        setInspiration({
          data: null,
          loading: false,
          error: message,
        });

        pushAi(
          message,
          "inspiration",
        );
      }
    }, [
      prompt,
      uxReasoning,
      pushAi,
    ]);

  /* ---------------------------------------------------------------------- */
  /* ZOOM                                                                   */
  /* ---------------------------------------------------------------------- */

  const setZoom =
    useCallback(
      (next: number) => {
        setZoomState(
          Math.min(
            200,
            Math.max(
              50,
              Math.round(next),
            ),
          ),
        );
      },
      [],
    );

  /* ---------------------------------------------------------------------- */
  /* CONTEXT VALUE                                                           */
  /* ---------------------------------------------------------------------- */

  const value =
    useMemo<DesignerContextValue>(
      () => ({
        projectName,
        screens,
        activeScreenId,
        selectedLayerId,
        layers,
        tool,
        zoom,
        device,
        previewMode,
        prompt,
        generated,
        insights,
        messages,
        designData,
        uxReasoning,
        inspiration,
        quality,
        isLoading,
        error,

        setPrompt,
        setTool,
        setZoom,
        setDevice,
        setPreviewMode,

        selectScreen,
        selectLayer:
          setSelectedLayerId,

        addText,
        addShape,
        addComponent,
        updateComponentProps,

        generateUi,
        refineDesign:
          refineDesignFn,
        createPersona,
        createUserFlow,
        analyzeUx,
        applyImprovements,
        exploreInspiration,
      }),
      [
        projectName,
        screens,
        activeScreenId,
        selectedLayerId,
        layers,
        tool,
        zoom,
        device,
        previewMode,
        prompt,
        generated,
        insights,
        messages,
        designData,
        uxReasoning,
        inspiration,
        quality,
        isLoading,
        error,

        selectScreen,
        generateUi,
        refineDesignFn,
        createPersona,
        createUserFlow,
        analyzeUx,
        applyImprovements,
        exploreInspiration,

        addText,
        addShape,
        addComponent,
        updateComponentProps,
        setZoom,
      ],
    );

  return (
    <DesignerContext.Provider
      value={value}
    >
      {children}
    </DesignerContext.Provider>
  );
}

export function useDesigner() {
  const ctx = useContext(
    DesignerContext,
  );

  if (!ctx) {
    throw new Error(
      "useDesigner must be used inside DesignerProvider",
    );
  }

  return ctx;
}