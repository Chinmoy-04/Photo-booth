"use client";

import { useEffect } from "react";
import { TrackReference } from "@livekit/components-react";
import { FILTER_PRESETS, type FilterKey } from "@/lib/filters";

interface DualCameraViewProps {
  localTrack?: TrackReference;
  remoteTrack?: TrackReference;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  filterKey: FilterKey;
  partnerConnected: boolean;
  overlaySrc: string;
}

function useAttachTrack(
  trackRef: TrackReference | undefined,
  videoRef: React.RefObject<HTMLVideoElement>
) {
  useEffect(() => {
    const track = trackRef?.publication?.track;
    const element = videoRef.current;
    if (!track || !element) return;

    track.attach(element);
    void element.play().catch(() => {
      /* iOS may need a later user gesture */
    });

    return () => {
      track.detach(element);
    };
  }, [trackRef, videoRef]);
}

export function DualCameraView({
  localTrack,
  remoteTrack,
  localVideoRef,
  remoteVideoRef,
  filterKey,
  partnerConnected,
  overlaySrc,
}: DualCameraViewProps) {
  useAttachTrack(localTrack, localVideoRef);
  useAttachTrack(remoteTrack, remoteVideoRef);

  return (
    <div className="relative mx-auto aspect-[7/6] w-full max-w-xl overflow-hidden rounded-sm bg-black ring-1 ring-surface-border sm:max-w-2xl">
      <div className="absolute inset-0 grid grid-cols-2">
        <div className="relative min-h-0 min-w-0 overflow-hidden border-r border-white/10 bg-black">
          <span className="absolute left-2 top-2 z-10 rounded-sm bg-black/55 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-white sm:left-3 sm:top-3 sm:text-xs">
            You
          </span>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              filter: FILTER_PRESETS[filterKey],
              transform: "scaleX(-1)",
            }}
          />
        </div>

        <div className="relative min-h-0 min-w-0 overflow-hidden bg-black">
          <span className="absolute left-2 top-2 z-10 rounded-sm bg-black/55 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-white sm:left-3 sm:top-3 sm:text-xs">
            Partner
          </span>
          {partnerConnected ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: FILTER_PRESETS[filterKey] }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-white/70">
              Waiting for your partner to join…
            </div>
          )}
        </div>
      </div>

      <img
        src={overlaySrc}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] h-full w-full object-fill"
      />
    </div>
  );
}
