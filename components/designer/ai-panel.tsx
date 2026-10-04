"use client";

import {
  AlertCircle,
  Compass,
  LayoutTemplate,
  Loader2,
  Sparkles,
  UserRound,
  Workflow,
  Wand2,
} from "lucide-react";
import { AiMessage } from "./ai-message";
import { useDesigner } from "./designer-context";

const actions = [
  { id: "ui", label: "Generate UI", icon: LayoutTemplate },
  { id: "refine", label: "Refine", icon: Wand2 },
  { id: "persona", label: "Persona", icon: UserRound },
  { id: "flow", label: "User Flow", icon: Workflow },
  { id: "ux", label: "Analyze UX", icon: Sparkles },
  { id: "inspo", label: "Explore Inspiration", icon: Compass },
] as const;

export function AiPanel() {
  const {
    prompt,
    setPrompt,
    generateUi,
    refineDesign,
    createPersona,
    createUserFlow,
    analyzeUx,
    applyImprovements,
    exploreInspiration,
    messages,
    insights,
    designData,
    uxReasoning,
    inspiration,
    quality,
    isLoading,
    error,
  } = useDesigner();

  function run(id: (typeof actions)[number]["id"]) {
    if (isLoading) return;
    if (id === "ui") generateUi();
    if (id === "refine") refineDesign(prompt);
    if (id === "persona") createPersona();
    if (id === "flow") createUserFlow();
    if (id === "ux") analyzeUx();
    if (id === "inspo") exploreInspiration();
  }

  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col border-l border-white/8 bg-[#070814]/90 backdrop-blur-xl">
      <div className="border-b border-white/8 px-5 py-4">
        <p className="font-display text-lg text-white">AI Designer</p>
        <p className="mt-1 text-[13px] text-white/45">
          {designData ? "Refine with natural language or regenerate." : "Describe what you want to design."}
        </p>
      </div>

      <div className="border-b border-white/8 px-5 py-4">
        <label className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-white/35">
          {designData ? "Brief or refinement" : "What should we design?"}
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          rows={3}
          aria-label="Design brief or refinement instruction"
          placeholder={
            designData
              ? "e.g. Make the CTA more prominent, add an empty state…"
              : "e.g. Design a food delivery app for college students"
          }
          className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3 text-[13px] leading-6 text-white outline-none ring-violet-400/40 placeholder:text-white/30 focus:ring-2 disabled:opacity-60"
        />

        {error && (
          <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 text-[12px] text-red-200" role="alert">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {actions.map((action) => {
            const Icon = action.icon;
            const isPrimary = action.id === "ui";
            const disabled =
              isLoading ||
              ((action.id === "refine" || action.id === "ux") && !designData);
            return (
              <button
                key={action.id}
                type="button"
                disabled={disabled}
                onClick={() => run(action.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  isPrimary
                    ? "border-violet-400/40 bg-violet-500/20 text-white hover:bg-violet-500/30"
                    : "border-white/10 bg-white/4 text-white/70 hover:border-violet-400/40 hover:bg-violet-500/15 hover:text-white"
                }`}
              >
                {isPrimary && isLoading ? (
                  <Loader2 size={12} className="animate-spin text-violet-300" />
                ) : (
                  <Icon size={12} />
                )}
                {isPrimary && isLoading ? "Generating…" : action.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4" aria-live="polite">
        {messages.map((message) => (
          <AiMessage key={message.id} role={message.role} text={message.text} />
        ))}

        {insights.includes("persona") && designData?.persona && (
          <section className="rounded-2xl border border-white/10 bg-white/4 p-3.5">
            <p className="text-[10px] tracking-[0.18em] text-violet-200/70">PERSONA</p>
            <p className="mt-1 text-[13px] font-medium text-white">
              {designData.persona.name} · {designData.persona.age} · {designData.persona.role}
            </p>
            <p className="mt-1 text-[12px] leading-5 text-white/60">{designData.persona.bio}</p>
          </section>
        )}

        {insights.includes("flow") && designData?.userFlow && (
          <section className="rounded-2xl border border-white/10 bg-white/4 p-3.5">
            <p className="text-[10px] tracking-[0.18em] text-violet-200/70">
              USER FLOW · {designData.userFlow.title}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-white/70">
              {designData.userFlow.steps.map((step, i, arr) => (
                <span key={`${step}-${i}`} className="flex items-center gap-1">
                  <span className="rounded-md bg-white/8 px-2 py-1">{step}</span>
                  {i < arr.length - 1 && <span className="text-white/25">→</span>}
                </span>
              ))}
            </div>
          </section>
        )}

        {insights.includes("direction") && designData?.designDirection && (
          <section className="rounded-2xl border border-white/10 bg-white/4 p-3.5">
            <p className="text-[10px] tracking-[0.18em] text-violet-200/70">DESIGN DIRECTION</p>
            <p className="mt-1 text-[12px] leading-5 text-white/55">
              {designData.designDirection.theme}: {designData.designDirection.notes}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {Object.entries(designData.designDirection.colorPalette).map(([name, hex]) => (
                <div key={name} className="flex items-center gap-1 text-[11px]">
                  <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: hex }} />
                  <span className="text-[10px] text-white/40">{hex}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {insights.includes("ux") && uxReasoning && (
          <section className="rounded-2xl border border-white/10 bg-white/4 p-3.5">
            <p className="text-[10px] tracking-[0.18em] text-violet-200/70">UX REASONING</p>
            <p className="mt-1 text-[12px] text-white/70">Task: {uxReasoning.primaryTask}</p>
            <p className="mt-1 text-[12px] text-white/55">Nav: {uxReasoning.navigationModel}</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-white/50">
              {uxReasoning.accessibility.slice(0, 4).map((a) => <li key={a}>{a}</li>)}
            </ul>
          </section>
        )}

        {insights.includes("inspiration") && (
          <section className="rounded-2xl border border-white/10 bg-white/4 p-3.5">
            <p className="text-[10px] tracking-[0.18em] text-violet-200/70">INSPIRATION</p>
            {inspiration.loading ? (
              <p className="mt-2 text-[12px] text-white/50">Researching references…</p>
            ) : inspiration.data?.available ? (
              <div className="mt-2 space-y-2">
                {inspiration.data.references.slice(0, 3).map((ref) => (
                  <div key={ref.id} className="rounded-lg border border-white/8 bg-black/20 p-2">
                    <p className="text-[12px] font-medium text-white">{ref.name}</p>
                    {ref.macrostructure && (
                      <p className="text-[11px] text-violet-200/70">{ref.macrostructure}</p>
                    )}
                    {ref.rationale && (
                      <p className="mt-1 text-[11px] text-white/45 line-clamp-2">{ref.rationale}</p>
                    )}
                    {ref.thumbnailUrl && (
                      <div
                        role="img"
                        aria-label={`Reference: ${ref.name}`}
                        className="mt-2 h-16 w-full rounded bg-cover bg-top"
                        style={{ backgroundImage: `url(${ref.thumbnailUrl})` }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[12px] text-white/45">
                {inspiration.error || "Research unavailable — using design reasoning only."}
              </p>
            )}
          </section>
        )}

        {insights.includes("quality") && quality && (
          <section className="rounded-2xl border border-white/10 bg-white/4 p-3.5">
            <p className="text-[10px] tracking-[0.18em] text-violet-200/70">QUALITY REVIEW</p>
            <p className="mt-1 text-[12px] text-white/60">{quality.summary}</p>
            {quality.findings.slice(0, 4).map((f) => (
              <div key={f.id} className="mt-2 rounded-lg bg-white/5 p-2 text-[11px]">
                <span className="text-violet-200/80 uppercase">{f.severity}</span>
                <p className="text-white/75">{f.finding}</p>
                <p className="text-white/45">{f.recommendation}</p>
              </div>
            ))}
            {quality.findings.some((f) => f.severity === "high") && (
              <button
                type="button"
                disabled={isLoading}
                onClick={() => applyImprovements()}
                className="mt-3 w-full rounded-full border border-violet-400/40 bg-violet-500/20 px-3 py-2 text-[11px] text-white hover:bg-violet-500/30 disabled:opacity-50"
              >
                Apply improvements
              </button>
            )}
          </section>
        )}
      </div>
    </aside>
  );
}
