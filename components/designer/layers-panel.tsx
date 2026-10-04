"use client";

import { useDesigner } from "./designer-context";

export function LayersPanel() {
  const { layers, selectedLayerId, selectLayer, generated } = useDesigner();

  if (!generated) {
    return (
      <div>
        <p className="mb-2 px-1 text-[10px] font-medium tracking-[0.18em] text-white/40">LAYERS</p>
        <p className="px-1 text-[12px] text-white/35">Layers sync with generated screens.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 px-1 text-[10px] font-medium tracking-[0.18em] text-white/40">LAYERS</p>
      <div className="space-y-0.5" role="listbox" aria-label="Layers">
        {layers.map((layer) => {
          const active = layer.id === selectedLayerId;
          return (
            <button
              key={layer.id}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => selectLayer(layer.id)}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left ${
                active ? "bg-violet-500/15" : "hover:bg-white/5"
              }`}
            >
              <span className={`text-[13px] ${active ? "text-white" : "text-white/60"}`}>
                {layer.name}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-white/30">{layer.type}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
