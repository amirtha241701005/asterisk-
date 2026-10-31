"use client";

import { useEffect, useState } from "react";

import { useDesigner } from "./designer-context";

const STORAGE_PREFIX = "arquo-editor-state:";

function getDeletedIds(
  screenId: string,
): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }

  try {
    const raw = window.localStorage.getItem(
      `${STORAGE_PREFIX}${screenId}`,
    );

    if (!raw) {
      return new Set();
    }

    const parsed = JSON.parse(raw);

    return new Set(
      Array.isArray(parsed?.deletedIds)
        ? parsed.deletedIds
        : [],
    );
  } catch {
    return new Set();
  }
}

export function LayersPanel() {
  const {
    layers,
    selectedLayerId,
    selectLayer,
    generated,
    activeScreenId,
  } = useDesigner();

  const [deletedIds, setDeletedIds] =
    useState<Set<string>>(new Set());

  useEffect(() => {
    if (!activeScreenId) {
      setDeletedIds(new Set());
      return;
    }

    setDeletedIds(
      getDeletedIds(activeScreenId),
    );
  }, [activeScreenId]);

  useEffect(() => {
    const handleEditorStateChange = (
      event: Event,
    ) => {
      const customEvent =
        event as CustomEvent<{
          screenId?: string;
        }>;

      if (
        customEvent.detail?.screenId !==
        activeScreenId
      ) {
        return;
      }

      setDeletedIds(
        getDeletedIds(activeScreenId),
      );
    };

    window.addEventListener(
      "arquo-editor-state-change",
      handleEditorStateChange,
    );

    return () => {
      window.removeEventListener(
        "arquo-editor-state-change",
        handleEditorStateChange,
      );
    };
  }, [activeScreenId]);

  if (!generated) {
    return (
      <div>
        <p className="mb-2 px-1 text-[10px] font-medium tracking-[0.18em] text-white/40">
          LAYERS
        </p>

        <p className="px-1 text-[12px] text-white/35">
          Layers sync with generated screens.
        </p>
      </div>
    );
  }

  const visibleLayers = layers.filter(
    (layer) => !deletedIds.has(layer.id),
  );

  return (
    <div>
      <p className="mb-2 px-1 text-[10px] font-medium tracking-[0.18em] text-white/40">
        LAYERS
      </p>

      <div
        className="space-y-0.5"
        role="listbox"
        aria-label="Layers"
      >
        {visibleLayers.map(
          (layer, index) => {
            const active =
              layer.id === selectedLayerId;

            /*
             * Generated AI components can occasionally
             * have duplicate IDs. React keys must still
             * be unique, so combine the ID with the
             * item's position in this layer list.
             */
            const uniqueKey =
              `${layer.id}-${index}`;

            return (
              <button
                key={uniqueKey}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() =>
                  selectLayer(layer.id)
                }
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left ${active
                    ? "bg-violet-500/15"
                    : "hover:bg-white/5"
                  }`}
              >
                <span
                  className={`text-[13px] ${active
                      ? "text-white"
                      : "text-white/60"
                    }`}
                >
                  {layer.name}
                </span>

                <span className="text-[10px] uppercase tracking-wide text-white/30">
                  {layer.type}
                </span>
              </button>
            );
          },
        )}

        {visibleLayers.length === 0 && (
          <p className="px-1 py-2 text-[11px] text-white/25">
            No layers on this screen.
          </p>
        )}
      </div>
    </div>
  );
}