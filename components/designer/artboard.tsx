"use client";

import { getActiveScreen } from "@/lib/ai/schemas";
import { deviceDimensions, resolveTokens, tokensToStyle } from "@/lib/design/tokens";
import { DesignRenderer } from "./design-renderer";
import { useDesigner } from "./designer-context";

export function Artboard() {
  const {
    screens,
    activeScreenId,
    generated,
    designData,
    device,
    selectedLayerId,
    selectLayer,
    previewMode,
    isLoading,
    error,
  } = useDesigner();

  const dims = deviceDimensions(device);
  const screen = screens.find((s) => s.id === activeScreenId);
  const generatedScreen = getActiveScreen(designData, activeScreenId);
  const tokens = resolveTokens(designData, generatedScreen);

  if (!generated || !designData || !generatedScreen) {
    return (
      <div className="flex flex-col items-center">
        <div className="mb-3 flex items-center gap-2 text-[11px] text-white/40">
          <span className="rounded-full border border-white/10 px-2 py-0.5">{dims.label}</span>
          <span>Artboard</span>
        </div>
        <div className="relative rounded-[36px] border border-white/12 bg-black p-2 shadow-[0_40px_80px_-24px_rgba(0,0,0,0.85)]">
          <div
            className="flex items-center justify-center overflow-hidden rounded-[28px] bg-[#0c0a18] text-center"
            style={{ width: dims.width, height: dims.height }}
          >
            {isLoading ? (
              <div className="space-y-3 px-8" role="status" aria-live="polite">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-400" />
                <p className="text-[13px] text-white/50">Analyzing brief and generating design…</p>
              </div>
            ) : error ? (
              <div className="px-8" role="alert">
                <p className="text-[13px] text-red-300">{error}</p>
              </div>
            ) : (
              <div className="px-8">
                <p className="font-display text-lg text-white/80">Ready to design</p>
                <p className="mt-2 text-[13px] text-white/45">
                  Enter a brief in AI Designer and click Generate UI.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const displayName = generatedScreen.title || screen?.name || "Screen";

  return (
    <div className="flex flex-col items-center">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-[11px] text-white/40">
        <span className="rounded-full border border-white/10 px-2 py-0.5">{dims.label}</span>
        <span>{displayName}</span>
        {generatedScreen.purpose && (
          <span className="rounded-full bg-white/5 px-2 py-0.5">{generatedScreen.purpose}</span>
        )}
        <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-100">Generated</span>
      </div>
      <div
        className="relative rounded-[36px] border border-white/12 bg-black p-2 shadow-[0_40px_80px_-24px_rgba(0,0,0,0.85),0_0_80px_rgba(124,92,255,0.12)]"
        style={device === "desktop" ? { width: dims.width + 16 } : undefined}
      >
        {device === "mobile" && (
          <div className="absolute left-1/2 top-3 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black/80" />
        )}
        <div
          className="overflow-hidden rounded-[28px]"
          style={{
            width: dims.width,
            height: dims.height,
            ...tokensToStyle(tokens),
          }}
        >
          <DesignRenderer
            screen={generatedScreen}
            tokens={tokens}
            selectedId={previewMode ? null : selectedLayerId}
            onSelect={previewMode ? undefined : selectLayer}
          />
        </div>
      </div>
    </div>
  );
}
