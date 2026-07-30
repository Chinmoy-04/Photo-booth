"use client";

interface CountdownOverlayProps {
  count: number | null;
}

export function CountdownOverlay({ count }: CountdownOverlayProps) {
  if (count === null) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/30">
      <span
        key={count}
        className="animate-countdown-pop font-display text-8xl font-bold text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-9xl"
      >
        {count}
      </span>
    </div>
  );
}
