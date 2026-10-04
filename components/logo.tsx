export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center">
      <img
        src="/arquo-logo.png"
        alt="ARQUO"
        className={`h-auto w-auto object-contain ${compact ? "max-w-[140px]" : "max-w-[190px]"
          }`}
      />
    </div>
  );
}