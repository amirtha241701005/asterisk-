"use client";

import {
  Download,
  Eye,
  EyeOff,
  MousePointer2,
  Square,
  Type,
  Component,
  Shapes,
  Smartphone,
  Tablet,
  Monitor,
} from "lucide-react";
import { useDesigner } from "./designer-context";
import type { DeviceType, Tool } from "./types";

const tools: {
  id: Tool;
  label: string;
  icon: typeof MousePointer2;
}[] = [
    { id: "select", label: "Select", icon: MousePointer2 },
    { id: "frame", label: "Frame", icon: Square },
    { id: "text", label: "Text", icon: Type },
    { id: "shape", label: "Shape", icon: Shapes },
    { id: "component", label: "Component", icon: Component },
  ];

const devices: {
  id: DeviceType;
  label: string;
  icon: typeof Smartphone;
}[] = [
    { id: "mobile", label: "Mobile", icon: Smartphone },
    { id: "tablet", label: "Tablet", icon: Tablet },
    { id: "desktop", label: "Desktop", icon: Monitor },
  ];

export function BottomToolbar() {
  const {
    tool,
    setTool,
    zoom,
    setZoom,
    device,
    setDevice,
    previewMode,
    setPreviewMode,
    generated,
  } = useDesigner();

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 px-3 sm:px-4">
      <div className="pointer-events-auto mx-auto flex w-fit max-w-full items-center rounded-2xl border border-white/10 bg-[#0a0b16]/90 p-1.5 shadow-[0_16px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="flex max-w-full items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Tools */}
          <div className="flex shrink-0 items-center gap-0.5">
            {tools.map((item) => {
              const Icon = item.icon;
              const active = tool === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  aria-label={item.label}
                  disabled={!generated && item.id !== "select"}
                  onClick={() => setTool(item.id)}
                  className={`flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-2.5 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-30 sm:px-3 ${active
                      ? "bg-violet-500/20 text-white"
                      : "text-white/50 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  <Icon size={14} strokeWidth={1.8} />

                  <span className="hidden md:inline">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="mx-1 h-6 w-px shrink-0 bg-white/10" />

          {/* Device selector */}
          <div className="flex shrink-0 items-center gap-0.5">
            {devices.map((item) => {
              const Icon = item.icon;
              const active = device === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  aria-label={`Preview ${item.label}`}
                  onClick={() => setDevice(item.id)}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${active
                      ? "bg-violet-500/20 text-white"
                      : "text-white/45 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  <Icon size={14} strokeWidth={1.8} />
                </button>
              );
            })}
          </div>

          {/* Zoom */}
          <button
            type="button"
            title="Reset zoom"
            aria-label={`Reset zoom to 100%. Current zoom is ${zoom}%`}
            onClick={() => setZoom(100)}
            className="flex h-9 min-w-[48px] shrink-0 items-center justify-center rounded-xl px-2 text-[11px] text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            {zoom}%
          </button>

          {/* Divider */}
          <div className="mx-1 h-6 w-px shrink-0 bg-white/10" />

          {/* Preview */}
          <button
            type="button"
            disabled={!generated}
            title="Toggle preview mode"
            aria-label="Toggle preview mode"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-2.5 text-[12px] text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 sm:px-3"
          >
            {previewMode ? (
              <EyeOff size={14} strokeWidth={1.8} />
            ) : (
              <Eye size={14} strokeWidth={1.8} />
            )}

            <span className="hidden sm:inline">
              Preview
            </span>
          </button>

          {/* Export */}
          <button
            type="button"
            disabled
            title="Export coming soon"
            aria-label="Export"
            className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white/5 px-2.5 text-[12px] text-white/25 disabled:cursor-not-allowed sm:px-3"
          >
            <Download size={14} strokeWidth={1.8} />

            <span className="hidden sm:inline">
              Export
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}