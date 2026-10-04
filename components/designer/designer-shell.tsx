"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PanelLeft, Sparkles, X } from "lucide-react";
import { AiPanel } from "./ai-panel";
import { BottomToolbar } from "./bottom-toolbar";
import { Canvas } from "./canvas";
import { DesignerProvider } from "./designer-context";
import { LeftSidebar } from "./left-sidebar";
import { Logo } from "../logo";

function ShellInner() {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#05060f] text-white">
      <div className="hidden xl:flex">
        <LeftSidebar />
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-white/8 px-3 py-2 xl:hidden">
          <button
            type="button"
            className="rounded-lg p-2 text-white/70 hover:bg-white/8"
            onClick={() => setLeftOpen(true)}
            aria-label="Open screens"
          >
            <PanelLeft size={18} />
          </button>
          <Logo compact />
          <button
            type="button"
            className="rounded-lg p-2 text-white/70 hover:bg-white/8"
            onClick={() => setRightOpen(true)}
            aria-label="Open AI Designer"
          >
            <Sparkles size={18} />
          </button>
        </div>
        <Canvas />
        <BottomToolbar />
      </div>

      <div className="hidden xl:flex">
        <AiPanel />
      </div>

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
                className="absolute right-3 top-3 z-10 rounded-full p-1 text-white/50"
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
