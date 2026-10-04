export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-violet-300 via-violet-500 to-indigo-700 shadow-[0_0_24px_rgba(124,92,255,0.45)]">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 text-white"
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 1.6 13.4 9l6.9-2.3-4.6 5.3 4.6 5.3-6.9-2.3L12 22.4 10.6 15l-6.9 2.3 4.6-5.3-4.6-5.3L10.6 9 12 1.6Z" />
        </svg>
      </span>
      <span
        className={`text-[12px] font-semibold tracking-[0.22em] text-white ${
          compact ? "hidden sm:inline" : ""
        }`}
      >
        ASTERISK AI
      </span>
    </div>
  );
}
