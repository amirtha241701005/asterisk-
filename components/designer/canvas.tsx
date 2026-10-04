"use client";

import { Minus, Plus } from "lucide-react";
import { Artboard } from "./artboard";
import { useDesigner } from "./designer-context";

export function Canvas() {
  const { zoom, setZoom } = useDesigner();

  return (
    <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(92,70,200,0.16),transparent_55%)]" />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative flex flex-1 items-center justify-center overflow-hidden pb-20 pt-8">
        <div
          className="origin-center"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <Artboard />
        </div>
      </div>
      <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur-xl">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
          onClick={() => setZoom(zoom - 10)}
          aria-label="Zoom out"
        >
          <Minus size={14} />
        </button>
        <span className="min-w-[3rem] text-center text-[11px] text-white/70">
          {zoom}%
        </span>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
          onClick={() => setZoom(zoom + 10)}
          aria-label="Zoom in"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
