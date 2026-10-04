"use client";

export function AiMessage({
  role,
  text,
}: {
  role: "ai" | "user";
  text: string;
}) {
  const isAi = role === "ai";
  return (
    <div
      className={`rounded-2xl px-3.5 py-3 text-[13px] leading-6 ${
        isAi
          ? "border border-violet-400/20 bg-violet-500/10 text-white/85"
          : "bg-white/6 text-white/70"
      }`}
    >
      <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-white/35">
        {isAi ? "AI" : "You"}
      </p>
      {text.split("\n").map((line, index) => (
        <p key={`${index}-${line.slice(0, 12)}`}>{line || "\u00a0"}</p>
      ))}
    </div>
  );
}
