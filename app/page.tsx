"use client";

import dynamic from "next/dynamic";

const DesignerShell = dynamic(
  () =>
    import("@/components/designer/designer-shell").then(
      (mod) => mod.DesignerShell,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen items-center justify-center bg-[#05060f] text-[13px] text-white/40">
        Opening studio…
      </div>
    ),
  },
);

export default function Home() {
  return <DesignerShell />;
}
