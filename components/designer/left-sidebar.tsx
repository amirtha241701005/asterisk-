"use client";

import { Logo } from "../logo";
import { LayersPanel } from "./layers-panel";
import { ScreenList } from "./screen-list";
import { useDesigner } from "./designer-context";

export function LeftSidebar() {
  const { projectName } = useDesigner();

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-white/8 bg-[#070814]/90 backdrop-blur-xl">
      <div className="border-b border-white/8 px-4 py-4">
        <Logo />
        <p className="mt-4 truncate text-[13px] text-white/80">{projectName}</p>
        <p className="text-[11px] text-white/35">Local prototype</p>
      </div>
      <div className="flex-1 space-y-8 overflow-y-auto px-3 py-5">
        <ScreenList />
        <LayersPanel />
      </div>
    </aside>
  );
}
