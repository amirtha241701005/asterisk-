"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  PanelLeft,
  Sparkles,
  X,
  PenLine,
  LayoutTemplate,
} from "lucide-react";
import { AiPanel } from "./ai-panel";
import { BottomToolbar } from "./bottom-toolbar";
import { Canvas } from "./canvas";
import { DesignerProvider } from "./designer-context";
import { LeftSidebar } from "./left-sidebar";
import { Logo } from "../logo";

function ShellInner() {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [wireframeMode, setWireframeMode] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#05060f] text-white">
      {/* ------------------------------------------------------------------ */}
      {/* WIREFRAME MODE                                                     */}
      {/* ------------------------------------------------------------------ */}

      <style jsx global>{`
        /*
         * ARQUO WIREFRAME MODE
         *
         * The generated information architecture stays intact.
         * Only the visual language changes.
         *
         * Wireframe palette:
         *   #ffffff  - canvas
         *   #f1f5f9  - light blocks
         *   #e2e8f0  - medium blocks
         *   #94a3b8  - structural borders
         *   #475569  - structural text/lines
         */

        .arquo-wireframe {
          --wf-white: #ffffff;
          --wf-light: #f8fafc;
          --wf-block: #e2e8f0;
          --wf-block-dark: #cbd5e1;
          --wf-border: #94a3b8;
          --wf-text: #475569;
          --wf-dark: #334155;
        }

        /* --------------------------------------------------------------- */
        /* EVERYTHING INSIDE THE PHONE BECOMES GRAYSCALE                   */
        /* --------------------------------------------------------------- */

        .arquo-wireframe,
        .arquo-wireframe * {
          color: var(--wf-text) !important;
          border-color: var(--wf-border) !important;
          box-shadow: none !important;
          text-shadow: none !important;
        }

        /*
         * Remove every generated background, including inline styles,
         * gradients and accent colours.
         */
        .arquo-wireframe [data-layer-id],
        .arquo-wireframe [data-layer-id] *,
        .arquo-wireframe [data-layer-id]::before,
        .arquo-wireframe [data-layer-id]::after {
          background-image: none !important;
        }

        /* Main screen */
        .arquo-wireframe
          div.flex.h-full.flex-col.overflow-hidden {
          background: var(--wf-white) !important;
          background-color: var(--wf-white) !important;
          color: var(--wf-text) !important;
        }

        /* Every generated layer starts white */
        .arquo-wireframe [data-layer-id] {
          background: var(--wf-white) !important;
          background-color: var(--wf-white) !important;
        }

        /* --------------------------------------------------------------- */
        /* HIDE REAL TEXT                                                    */
        /* --------------------------------------------------------------- */

        /*
         * Real generated copy should NOT appear in a wireframe.
         *
         * We hide the actual text visually and replace it with neutral
         * structural bars using CSS pseudo-elements.
         */

        .arquo-wireframe [data-layer-id] h1,
        .arquo-wireframe [data-layer-id] h2,
        .arquo-wireframe [data-layer-id] h3,
        .arquo-wireframe [data-layer-id] h4,
        .arquo-wireframe [data-layer-id] p,
        .arquo-wireframe [data-layer-id] label {
          color: transparent !important;
          background: transparent !important;
          background-color: transparent !important;
          font-size: 0 !important;
          line-height: 0 !important;
        }

        /*
         * Headline placeholder.
         */
        .arquo-wireframe [data-layer-id] h1 {
          position: relative;
          min-height: 22px;
        }

        .arquo-wireframe [data-layer-id] h1::after {
          content: "XXXXXX XXXXXX";
          display: block;
          width: 72%;
          height: 15px;
          border-radius: 3px;
          background: var(--wf-block-dark);
          font-size: 0;
        }

        /*
         * Secondary text placeholder.
         */
        .arquo-wireframe [data-layer-id] p {
          min-height: 10px;
        }

        .arquo-wireframe [data-layer-id] p::after {
          content: "XXXXXX XXXXXX XXXXXX";
          display: block;
          width: 78%;
          height: 7px;
          margin-top: 2px;
          border-radius: 2px;
          background: var(--wf-block);
          font-size: 0;
        }

        /* --------------------------------------------------------------- */
        /* HEADER                                                            */
        /* --------------------------------------------------------------- */

        .arquo-wireframe [data-layer-id] header {
          background: var(--wf-white) !important;
          background-color: var(--wf-white) !important;
          border-color: transparent !important;
        }

        /*
         * Header avatar/logo becomes a plain gray circle.
         */
        .arquo-wireframe [data-layer-id] header div.flex.h-10.w-10 {
          background: var(--wf-block) !important;
          background-color: var(--wf-block) !important;
          color: transparent !important;
          border: 0 !important;
        }

        /* --------------------------------------------------------------- */
        /* CARDS / SECTIONS                                                  */
        /* --------------------------------------------------------------- */

        .arquo-wireframe [data-layer-id] section {
          background: var(--wf-white) !important;
          background-color: var(--wf-white) !important;
          background-image: none !important;
          border-color: var(--wf-border) !important;
          box-shadow: none !important;
        }

        /*
         * Card interior blocks become neutral gray.
         */
        .arquo-wireframe [data-layer-id] section > div {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
        }

        /* --------------------------------------------------------------- */
        /* LISTS                                                             */
        /* --------------------------------------------------------------- */

        .arquo-wireframe [data-layer-id] .min-w-0 {
          background: transparent !important;
        }

        /*
         * List avatars become gray squares/circles.
         */
        .arquo-wireframe [data-layer-id] .h-10.w-10 {
          background: var(--wf-block) !important;
          background-color: var(--wf-block) !important;
          color: transparent !important;
          border: 0 !important;
        }

        /*
         * List title.
         */
        .arquo-wireframe [data-layer-id] .truncate {
          color: transparent !important;
          background: var(--wf-block-dark) !important;
          background-color: var(--wf-block-dark) !important;
          height: 7px !important;
          width: 55% !important;
          border-radius: 2px !important;
          font-size: 0 !important;
        }

        /*
         * List metadata/tag.
         */
        .arquo-wireframe [data-layer-id] .shrink-0 {
          color: transparent !important;
        }

        /* --------------------------------------------------------------- */
        /* BUTTONS                                                           */
        /* --------------------------------------------------------------- */

        .arquo-wireframe [data-layer-id] button {
          background: var(--wf-block) !important;
          background-color: var(--wf-block) !important;
          background-image: none !important;
          border: 1px solid var(--wf-border) !important;
          color: transparent !important;
          box-shadow: none !important;
          font-size: 0 !important;
          min-height: 42px;
        }

        .arquo-wireframe [data-layer-id] button::after {
          content: "XXXXXXXX";
          display: block;
          width: 40%;
          height: 7px;
          margin: auto;
          border-radius: 2px;
          background: var(--wf-text);
          font-size: 0;
        }

        /* --------------------------------------------------------------- */
        /* INPUTS / SELECTS                                                  */
        /* --------------------------------------------------------------- */

        .arquo-wireframe [data-layer-id] input,
        .arquo-wireframe [data-layer-id] select,
        .arquo-wireframe [data-layer-id] textarea {
          background: var(--wf-white) !important;
          background-color: var(--wf-white) !important;
          color: transparent !important;
          border: 1px solid var(--wf-border) !important;
          box-shadow: none !important;
        }

        /*
         * The current renderer represents inputs as divs rather than actual
         * input elements, so also target those rounded field containers.
         */
        .arquo-wireframe [data-layer-id] .rounded-2xl.border {
          background: var(--wf-white) !important;
          background-color: var(--wf-white) !important;
          box-shadow: none !important;
        }

        /* --------------------------------------------------------------- */
        /* NAVIGATION                                                        */
        /* --------------------------------------------------------------- */

        .arquo-wireframe [data-layer-id] nav {
          background: var(--wf-light) !important;
          background-color: var(--wf-light) !important;
          background-image: none !important;
          border: 1px solid var(--wf-border) !important;
          box-shadow: none !important;
        }

        /*
         * Navigation labels become little structural bars.
         */
        .arquo-wireframe [data-layer-id] nav span {
          display: block;
          width: 24px;
          height: 6px;
          margin: auto;
          border-radius: 2px;
          background: var(--wf-block-dark) !important;
          color: transparent !important;
          font-size: 0 !important;
        }

        /* --------------------------------------------------------------- */
        /* TABS                                                             */
        /* --------------------------------------------------------------- */

        .arquo-wireframe [data-layer-id] [class*="rounded-full"] {
          background: var(--wf-block) !important;
          background-color: var(--wf-block) !important;
          color: transparent !important;
          border-color: var(--wf-border) !important;
          box-shadow: none !important;
        }

        /* --------------------------------------------------------------- */
        /* BADGES                                                           */
        /* --------------------------------------------------------------- */

        .arquo-wireframe [data-layer-id] .inline-flex.rounded-full {
          background: var(--wf-block) !important;
          background-color: var(--wf-block) !important;
          color: transparent !important;
          border: 0 !important;
        }

        /* --------------------------------------------------------------- */
        /* AVATARS                                                          */
        /* --------------------------------------------------------------- */

        .arquo-wireframe [data-layer-id] .h-11.w-11 {
          background: var(--wf-block) !important;
          background-color: var(--wf-block) !important;
          color: transparent !important;
          border: 0 !important;
        }

        /* --------------------------------------------------------------- */
        /* IMAGE / MEDIA                                                    */
        /* --------------------------------------------------------------- */

        .arquo-wireframe [data-layer-id] .h-36 {
          background: var(--wf-block) !important;
          background-color: var(--wf-block) !important;
          background-image: none !important;
          border: 1px dashed var(--wf-border) !important;
          color: transparent !important;
        }

        .arquo-wireframe [data-layer-id] .h-36 span {
          color: transparent !important;
        }

        /* --------------------------------------------------------------- */
        /* CHARTS                                                           */
        /* --------------------------------------------------------------- */

        .arquo-wireframe [data-layer-id] .h-20 {
          background: var(--wf-white) !important;
          background-color: var(--wf-white) !important;
        }

        .arquo-wireframe [data-layer-id] .h-full.rounded-t-md {
          background: var(--wf-block-dark) !important;
          background-color: var(--wf-block-dark) !important;
        }

        /* --------------------------------------------------------------- */
        /* PROGRESS BARS                                                    */
        /* --------------------------------------------------------------- */

        .arquo-wireframe [data-layer-id] .h-2 {
          background: var(--wf-block) !important;
          background-color: var(--wf-block) !important;
        }

        .arquo-wireframe [data-layer-id] .h-2 > div {
          background: var(--wf-block-dark) !important;
          background-color: var(--wf-block-dark) !important;
        }

        /* --------------------------------------------------------------- */
        /* FORM                                                              */
        /* --------------------------------------------------------------- */

        .arquo-wireframe [data-layer-id] form {
          background: var(--wf-white) !important;
          background-color: var(--wf-white) !important;
          border-color: var(--wf-border) !important;
          box-shadow: none !important;
        }

        /* --------------------------------------------------------------- */
        /* DIVIDERS                                                         */
        /* --------------------------------------------------------------- */

        .arquo-wireframe [data-layer-id] .h-px {
          background: var(--wf-border) !important;
          background-color: var(--wf-border) !important;
        }

        /* --------------------------------------------------------------- */
        /* SELECTION                                                        */
        /* --------------------------------------------------------------- */

        /*
         * Selected elements should remain visible, but the selection
         * indicator is grayscale too.
         */
        .arquo-wireframe [data-layer-id].rounded-\\[18px\\] {
          outline: 2px solid #475569 !important;
          outline-offset: 2px;
          box-shadow: none !important;
        }
      `}</style>

      {/* ------------------------------------------------------------------ */}
      {/* DESKTOP LEFT SIDEBAR                                               */}
      {/* ------------------------------------------------------------------ */}

      <div className="hidden h-full xl:flex">
        <LeftSidebar />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN EDITOR                                                        */}
      {/* ------------------------------------------------------------------ */}

      <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-3 py-2 xl:hidden">
          <button
            type="button"
            className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/8 hover:text-white"
            onClick={() => setLeftOpen(true)}
            aria-label="Open screens"
          >
            <PanelLeft size={18} />
          </button>

          <Logo compact />

          <button
            type="button"
            className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/8 hover:text-white"
            onClick={() => setRightOpen(true)}
            aria-label="Open AI Designer"
          >
            <Sparkles size={18} />
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* DESIGN / WIREFRAME TOGGLE                                        */}
        {/* ---------------------------------------------------------------- */}

        <div className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2">
          <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-white/10 bg-[#0b0c18]/95 p-1 shadow-2xl backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setWireframeMode(false)}
              aria-pressed={!wireframeMode}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all ${!wireframeMode
                  ? "bg-violet-500/20 text-white shadow-sm"
                  : "text-white/45 hover:bg-white/5 hover:text-white/75"
                }`}
            >
              <PenLine size={13} />
              Design
            </button>

            <button
              type="button"
              onClick={() => setWireframeMode(true)}
              aria-pressed={wireframeMode}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all ${wireframeMode
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/45 hover:bg-white/5 hover:text-white/75"
                }`}
            >
              <LayoutTemplate size={13} />
              Wireframe
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* CANVAS                                                            */}
        {/* ---------------------------------------------------------------- */}

        <div
          className={`min-h-0 flex-1 ${wireframeMode ? "arquo-wireframe" : ""
            }`}
          data-wireframe-mode={wireframeMode ? "true" : "false"}
        >
          <Canvas />
        </div>

        {/* Floating editor toolbar */}
        <BottomToolbar />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* DESKTOP AI PANEL                                                    */}
      {/* ------------------------------------------------------------------ */}

      <div className="hidden h-full xl:flex">
        <AiPanel />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MOBILE LEFT SIDEBAR                                                 */}
      {/* ------------------------------------------------------------------ */}

      <AnimatePresence>
        {leftOpen && (
          <motion.div
            className="fixed inset-0 z-40 xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label="Close screens"
              onClick={() => setLeftOpen(false)}
            />

            <motion.div
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              className="relative h-full w-[240px]"
            >
              <LeftSidebar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* MOBILE AI PANEL                                                     */}
      {/* ------------------------------------------------------------------ */}

      <AnimatePresence>
        {rightOpen && (
          <motion.div
            className="fixed inset-0 z-40 xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label="Close AI Designer"
              onClick={() => setRightOpen(false)}
            />

            <motion.div
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 24, opacity: 0 }}
              className="relative ml-auto h-full w-[min(360px,100%)]"
            >
              <button
                type="button"
                className="absolute right-3 top-3 z-10 rounded-full p-1 text-white/50 transition-colors hover:bg-white/8 hover:text-white"
                onClick={() => setRightOpen(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>

              <AiPanel />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DesignerShell() {
  return (
    <DesignerProvider>
      <ShellInner />
    </DesignerProvider>
  );
}