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
  Circle,
  RectangleHorizontal,
  Minus,
  CreditCard,
  MousePointer,
  FormInput,
  Badge,
  UserCircle,
  List,
  ChevronUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useDesigner } from "./designer-context";
import type { DeviceType, Tool } from "./types";

const tools: {
  id: Tool;
  label: string;
  icon: typeof MousePointer2;
}[] = [
    {
      id: "select",
      label: "Select",
      icon: MousePointer2,
    },
    {
      id: "frame",
      label: "Frame",
      icon: Square,
    },
    {
      id: "text",
      label: "Text",
      icon: Type,
    },
    {
      id: "shape",
      label: "Shape",
      icon: Shapes,
    },
    {
      id: "component",
      label: "Component",
      icon: Component,
    },
  ];

const devices: {
  id: DeviceType;
  label: string;
  icon: typeof Smartphone;
}[] = [
    {
      id: "mobile",
      label: "Mobile",
      icon: Smartphone,
    },
    {
      id: "tablet",
      label: "Tablet",
      icon: Tablet,
    },
    {
      id: "desktop",
      label: "Desktop",
      icon: Monitor,
    },
  ];

const shapes = [
  {
    id: "rectangle",
    label: "Rectangle",
    icon: Square,
  },
  {
    id: "rounded",
    label: "Rounded Rectangle",
    icon: RectangleHorizontal,
  },
  {
    id: "circle",
    label: "Circle",
    icon: Circle,
  },
  {
    id: "pill",
    label: "Pill",
    icon: RectangleHorizontal,
  },
  {
    id: "line",
    label: "Line",
    icon: Minus,
  },
];

const components = [
  {
    id: "button",
    label: "Button",
    icon: MousePointer,
  },
  {
    id: "card",
    label: "Card",
    icon: CreditCard,
  },
  {
    id: "input",
    label: "Input",
    icon: FormInput,
  },
  {
    id: "badge",
    label: "Badge",
    icon: Badge,
  },
  {
    id: "avatar",
    label: "Avatar",
    icon: UserCircle,
  },
  {
    id: "list",
    label: "List",
    icon: List,
  },
];

type MenuType = "frame" | "shape" | "component";

type MenuPosition = {
  left: number;
  bottom: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function BottomToolbar() {
  const designer = useDesigner() as any;

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
  } = designer;

  const addText = designer.addText;
  const addShape = designer.addShape;
  const addComponent = designer.addComponent;

  const [openMenu, setOpenMenu] = useState<MenuType | null>(null);
  const [menuPosition, setMenuPosition] =
    useState<MenuPosition | null>(null);

  const closeMenu = () => {
    setOpenMenu(null);
    setMenuPosition(null);
  };

  useEffect(() => {
    if (!openMenu) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    const handleResize = () => {
      closeMenu();
    };

    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleResize);
    };
  }, [openMenu]);

  const openDropdown = (
    menu: MenuType,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();

    const menuWidth =
      menu === "frame" ? 192 : 208;

    const center = rect.left + rect.width / 2;

    const left = clamp(
      center - menuWidth / 2,
      8,
      window.innerWidth - menuWidth - 8,
    );

    const bottom = window.innerHeight - rect.top + 10;

    setMenuPosition({
      left,
      bottom,
    });

    setOpenMenu(
      openMenu === menu ? null : menu,
    );
  };

  const handleText = () => {
    closeMenu();
    setTool("text");

    if (generated && addText) {
      addText();
    }
  };

  const handleShape = (shape: string) => {
    closeMenu();
    setTool("shape");

    if (generated && addShape) {
      addShape(shape);
    }
  };

  const handleComponent = (component: string) => {
    closeMenu();
    setTool("component");

    if (generated && addComponent) {
      addComponent(component);
    }
  };

  const handleFrame = (nextDevice: DeviceType) => {
    closeMenu();
    setTool("frame");
    setDevice(nextDevice);
  };

  const renderMenu = () => {
    if (
      !openMenu ||
      !menuPosition ||
      typeof document === "undefined"
    ) {
      return null;
    }

    const menu =
      openMenu === "frame"
        ? (
          <div
            data-arquo-toolbar-menu
            className="fixed z-[10000] w-48 rounded-xl border border-white/10 bg-[#10111c] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.75)]"
            style={{
              left: menuPosition.left,
              bottom: menuPosition.bottom,
            }}
          >
            <p className="px-2.5 pb-1.5 pt-1 text-[9px] font-semibold tracking-[0.16em] text-white/30">
              FRAME SIZE
            </p>

            {devices.map((item) => {
              const Icon = item.icon;
              const active = device === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    handleFrame(item.id)
                  }
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-[12px] transition-colors ${active
                    ? "bg-violet-500/15 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  <Icon
                    size={15}
                    strokeWidth={1.8}
                  />

                  <span className="flex-1">
                    {item.label}
                  </span>

                  {active && (
                    <span className="text-[9px] text-violet-300">
                      ACTIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )
        : openMenu === "shape"
          ? (
            <div
              data-arquo-toolbar-menu
              className="fixed z-[10000] w-52 rounded-xl border border-white/10 bg-[#10111c] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.75)]"
              style={{
                left: menuPosition.left,
                bottom: menuPosition.bottom,
              }}
            >
              <p className="px-2.5 pb-1.5 pt-1 text-[9px] font-semibold tracking-[0.16em] text-white/30">
                SHAPES
              </p>

              {shapes.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      handleShape(item.id)
                    }
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-[12px] text-white/60 transition-colors hover:bg-violet-500/10 hover:text-white"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5">
                      <Icon
                        size={15}
                        strokeWidth={1.8}
                      />
                    </div>

                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )
          : (
            <div
              data-arquo-toolbar-menu
              className="fixed z-[10000] w-52 rounded-xl border border-white/10 bg-[#10111c] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.75)]"
              style={{
                left: menuPosition.left,
                bottom: menuPosition.bottom,
              }}
            >
              <p className="px-2.5 pb-1.5 pt-1 text-[9px] font-semibold tracking-[0.16em] text-white/30">
                COMPONENTS
              </p>

              {components.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      handleComponent(item.id)
                    }
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-[12px] text-white/60 transition-colors hover:bg-violet-500/10 hover:text-white"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5">
                      <Icon
                        size={15}
                        strokeWidth={1.8}
                      />
                    </div>

                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          );

    return createPortal(menu, document.body);
  };

  return (
    <>
      {renderMenu()}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[100] px-2 pb-2 sm:px-4 sm:pb-3">
        <div className="pointer-events-auto mx-auto flex w-fit max-w-[calc(100%-0.5rem)] items-center rounded-2xl border border-white/10 bg-[#0a0b16]/98 p-1.5 shadow-[0_16px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <div className="flex max-w-full items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">


            {/* FRAME */}

            <button
              type="button"
              disabled={!generated}
              title="Frame"
              aria-label="Frame"
              aria-expanded={openMenu === "frame"}
              onClick={(event) => {
                setTool("frame");
                openDropdown("frame", event);
              }}
              className={`flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-2.5 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-30 sm:px-3 ${openMenu === "frame"
                ? "bg-violet-500/20 text-white"
                : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
            >
              <Square
                size={14}
                strokeWidth={1.8}
              />

              <span className="hidden md:inline">
                Frame
              </span>

              <ChevronUp
                size={12}
                className={`transition-transform ${openMenu === "frame"
                  ? "rotate-180"
                  : ""
                  }`}
              />
            </button>

            {/* TEXT */}

            <button
              type="button"
              disabled={!generated}
              title="Add text"
              aria-label="Add text"
              onClick={handleText}
              className={`flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-2.5 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-30 sm:px-3 ${tool === "text"
                ? "bg-violet-500/20 text-white"
                : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
            >
              <Type
                size={14}
                strokeWidth={1.8}
              />

              <span className="hidden md:inline">
                Text
              </span>
            </button>

            {/* SHAPE */}

            <button
              type="button"
              disabled={!generated}
              title="Shape"
              aria-label="Shape"
              aria-expanded={openMenu === "shape"}
              onClick={(event) => {
                setTool("shape");
                openDropdown("shape", event);
              }}
              className={`flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-2.5 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-30 sm:px-3 ${openMenu === "shape"
                ? "bg-violet-500/20 text-white"
                : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
            >
              <Shapes
                size={14}
                strokeWidth={1.8}
              />

              <span className="hidden md:inline">
                Shape
              </span>

              <ChevronUp
                size={12}
                className={`transition-transform ${openMenu === "shape"
                  ? "rotate-180"
                  : ""
                  }`}
              />
            </button>

            {/* COMPONENT */}

            <button
              type="button"
              disabled={!generated}
              title="Component"
              aria-label="Component"
              aria-expanded={
                openMenu === "component"
              }
              onClick={(event) => {
                setTool("component");
                openDropdown(
                  "component",
                  event,
                );
              }}
              className={`flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-2.5 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-30 sm:px-3 ${openMenu === "component"
                ? "bg-violet-500/20 text-white"
                : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
            >
              <Component
                size={14}
                strokeWidth={1.8}
              />

              <span className="hidden md:inline">
                Component
              </span>

              <ChevronUp
                size={12}
                className={`transition-transform ${openMenu === "component"
                  ? "rotate-180"
                  : ""
                  }`}
              />
            </button>

            {/* DIVIDER */}

            <div className="mx-1 h-6 w-px shrink-0 bg-white/10" />

            {/* DEVICE SHORTCUTS */}

            <div className="flex shrink-0 items-center gap-0.5">
              {devices.map((item) => {
                const Icon = item.icon;
                const active =
                  device === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    title={item.label}
                    aria-label={`Preview ${item.label}`}
                    onClick={() => {
                      closeMenu();
                      setDevice(item.id);
                    }}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${active
                      ? "bg-violet-500/20 text-white"
                      : "text-white/45 hover:bg-white/5 hover:text-white"
                      }`}
                  >
                    <Icon
                      size={14}
                      strokeWidth={1.8}
                    />
                  </button>
                );
              })}
            </div>

            {/* ZOOM */}

            <button
              type="button"
              title="Reset zoom"
              aria-label={`Reset zoom to 100%. Current zoom is ${zoom}%`}
              onClick={() => setZoom(100)}
              className="flex h-9 min-w-[48px] shrink-0 items-center justify-center rounded-xl px-2 text-[11px] text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              {zoom}%
            </button>

            <div className="mx-1 h-6 w-px shrink-0 bg-white/10" />

            {/* PREVIEW */}

            <button
              type="button"
              disabled={!generated}
              title="Toggle preview mode"
              aria-label="Toggle preview mode"
              onClick={() =>
                setPreviewMode(!previewMode)
              }
              className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-2.5 text-[12px] text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 sm:px-3"
            >
              {previewMode ? (
                <EyeOff
                  size={14}
                  strokeWidth={1.8}
                />
              ) : (
                <Eye
                  size={14}
                  strokeWidth={1.8}
                />
              )}

              <span className="hidden sm:inline">
                Preview
              </span>
            </button>

            {/* EXPORT */}

            <button
              type="button"
              disabled
              title="Export coming soon"
              aria-label="Export"
              className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white/5 px-2.5 text-[12px] text-white/25 disabled:cursor-not-allowed sm:px-3"
            >
              <Download
                size={14}
                strokeWidth={1.8}
              />

              <span className="hidden sm:inline">
                Export
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}