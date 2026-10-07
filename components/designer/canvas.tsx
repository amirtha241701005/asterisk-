"use client";

import { Minus, Plus } from "lucide-react";
import { Artboard } from "./artboard";
import { useDesigner } from "./designer-context";

export function Canvas() {
  const { zoom, setZoom } = useDesigner();

  const safeZoom = Math.min(200, Math.max(50, zoom));

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {/* Canvas glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(92,70,200,0.14),transparent_58%)]" />

      {/* Canvas grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Scrollable artboard workspace */}
      <div className="relative min-h-0 flex-1 overflow-auto overscroll-contain">
        <div className="flex min-h-full min-w-full items-start justify-center px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-8">
          <div
            className="shrink-0 origin-top transition-transform duration-200 ease-out"
            style={{
              transform: `scale(${safeZoom / 100})`,
              marginBottom: `${Math.max(0, safeZoom - 100) * 2}px`,
            }}
          >
            <Artboard />
          </div>
        </div>
      </div>

      {/* Zoom control */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-0.5 rounded-xl border border-white/10 bg-[#0a0b16]/85 p-1 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:right-4 sm:top-4">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/8 hover:text-white"
          onClick={() => setZoom(Math.max(50, zoom - 10))}
          aria-label="Zoom out"
        >
          <Minus size={14} />
        </button>

        <button
          type="button"
          className="min-w-[3rem] px-1 text-center text-[11px] text-white/70"
          onClick={() => setZoom(100)}
          aria-label="Reset zoom to 100 percent"
        >
          {safeZoom}%
        </button>

        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/8 hover:text-white"
          onClick={() => setZoom(Math.min(200, zoom + 10))}
          aria-label="Zoom in"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}