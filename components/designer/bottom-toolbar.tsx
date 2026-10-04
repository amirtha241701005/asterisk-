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

const tools: { id: Tool; label: string; icon: typeof MousePointer2 }[] = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "frame", label: "Frame", icon: Square },
  { id: "text", label: "Text", icon: Type },
  { id: "shape", label: "Shape", icon: Shapes },
  { id: "component", label: "Component", icon: Component },
];

const devices: { id: DeviceType; icon: typeof Smartphone }[] = [
  { id: "mobile", icon: Smartphone },
  { id: "tablet", icon: Tablet },
  { id: "desktop", icon: Monitor },
];

export function BottomToolbar() {
  const { tool, setTool, zoom, setZoom, device, setDevice, previewMode, setPreviewMode, generated } =
    useDesigner();

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-2 rounded-full border border-white/10 bg-[#0a0b16]/85 px-2 py-1.5 shadow-[0_16px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="flex items-center">
          {tools.map((item) => {
            const Icon = item.icon;
            const active = tool === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                disabled={!generated && item.id !== "select"}
                onClick={() => setTool(item.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] disabled:opacity-40 ${
                  active ? "bg-violet-500/20 text-white" : "text-white/50 hover:text-white"
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1">
          {devices.map((d) => {
            const Icon = d.icon;
            return (
              <button
                key={d.id}
                type="button"
                title={d.id}
                onClick={() => setDevice(d.id)}
                className={`rounded-full p-2 ${device === d.id ? "bg-violet-500/20 text-white" : "text-white/50"}`}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="rounded-full px-3 py-1.5 text-[12px] text-white/70 hover:bg-white/8"
          onClick={() => setZoom(100)}
        >
          {zoom}%
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!generated}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] text-white/60 hover:bg-white/8 disabled:opacity-40"
            onClick={() => setPreviewMode(!previewMode)}
            title="Toggle preview mode (hides selection chrome)"
          >
            {previewMode ? <EyeOff size={14} /> : <Eye size={14} />}
            Preview
          </button>
          <button
            type="button"
            disabled
            title="Export coming soon — JSON export via copy from API response for now"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-2 text-[12px] text-white/35"
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
