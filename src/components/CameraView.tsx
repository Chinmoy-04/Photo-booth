"use client";

import { FILTER_PRESETS, type FilterKey } from "@/lib/filters";

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  filterKey: FilterKey;
  overlaySrc: string;
  isReady: boolean;
}

export function CameraView({
  videoRef,
  filterKey,
  overlaySrc,
  isReady,
}: CameraViewProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-xl ring-1 ring-rose-200/50">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
        style={{
          filter: FILTER_PRESETS[filterKey],
          transform: "scaleX(-1)",
        }}
      />
      {isReady && (
        <img
          src={overlaySrc}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      )}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white/80">
          Starting camera…
        </div>
      )}
    </div>
  );
}
