"use client";

import { useDesigner } from "./designer-context";

export function ScreenList() {
  const { screens, activeScreenId, selectScreen, generated } = useDesigner();

  if (!generated || !screens.length) {
    return (
      <div>
        <p className="mb-2 px-1 text-[10px] font-medium tracking-[0.18em] text-white/40">SCREENS</p>
        <p className="px-1 text-[12px] text-white/35">Screens appear after generation.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 px-1 text-[10px] font-medium tracking-[0.18em] text-white/40">SCREENS</p>
      <div className="space-y-0.5">
        {screens.map((screen) => {
          const active = screen.id === activeScreenId;
          return (
            <button
              key={screen.id}
              type="button"
              onClick={() => selectScreen(screen.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] ${
                active ? "bg-white/8 text-white" : "text-white/55 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              <span
                className={`h-8 w-6 rounded-[4px] border ${
                  active ? "border-violet-400/50 bg-violet-500/20" : "border-white/10 bg-white/5"
                }`}
              />
              {screen.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
