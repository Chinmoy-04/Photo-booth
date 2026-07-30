"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { ConnectionState, RoomEvent, Track } from "livekit-client";
import { AmbientOrbs } from "@/components/AmbientOrbs";
import { CaptureControls } from "@/components/CaptureControls";
import { CountdownOverlay } from "@/components/CountdownOverlay";
import { DualCameraView } from "@/components/DualCameraView";
import { FilterSelector } from "@/components/FilterSelector";
import { Gallery } from "@/components/Gallery";
import { LogoutButton } from "@/components/LogoutButton";
import { CursorBloom } from "@/components/MagneticButton";
import { useCountdown } from "@/hooks/useCountdown";
import { captureDualFrame, captureLocalSnapshot, composeDualFromImages, loadBitmapFromUrl } from "@/lib/captureFrame";
import { FILTER_PRESETS, type FilterKey } from "@/lib/filters";
import { playShutterSound } from "@/lib/shutterSound";
import {
  createCaptureId,
  decodeRoomMessage,
  encodeCaptureFailedMessage,
  encodeCaptureRequestMessage,
  encodeFilterMessage,
  encodePhotoMessage,
  encodeSessionClearedMessage,
} from "@/lib/room";
import {
  loadOverlayImage,
  OVERLAY_REGISTRY,
  type OverlayKey,
} from "@/lib/overlays";

const DEFAULT_OVERLAY: OverlayKey = "anniversary";
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "";

function getCameraHelpMessage(): string | null {
  if (typeof window === "undefined") return null;
  if (!window.isSecureContext) {
    return "Camera needs HTTPS on phones. Open this page via the secure tunnel link (not the raw Wi‑Fi IP), or use a deployed Vercel URL.";
  }
  return null;
}

interface SharedPhotoboothProps {
  token: string;
  room: string;
  identity: string;
  sessionId: string;
  onLeave: () => void;
}

function addPhotoUnique(prev: string[], url: string): string[] {
  if (prev.includes(url)) return prev;
  return [url, ...prev];
}

async function clearSessionPhotos(sessionId: string) {
  await fetch(`/api/photos?session=${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
}

function PhotoboothSession({
  room,
  identity,
  sessionId,
  onLeave,
}: {
  room: string;
  identity: string;
  sessionId: string;
  onLeave: () => void;
}) {
  const roomContext = useRoomContext();
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const cameraTracks = useTracks([Track.Source.Camera], {
    onlySubscribed: false,
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const wipedRef = useRef(false);
  const pendingTilesRef = useRef(
    new Map<
      string,
      {
        resolve: (url: string) => void;
        reject: (error: Error) => void;
        timeoutId: ReturnType<typeof setTimeout>;
      }
    >()
  );

  const { count, isRunning, start, cancel } = useCountdown(3);
  const [filterKey, setFilterKey] = useState<FilterKey>("warm");
  const filterKeyRef = useRef<FilterKey>("warm");
  filterKeyRef.current = filterKey;
  const [photos, setPhotos] = useState<string[]>([]);
  const [overlayImage, setOverlayImage] = useState<HTMLImageElement | null>(
    null
  );
  const [overlayError, setOverlayError] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraHelp, setCameraHelp] = useState<string | null>(null);

  const localTrack = cameraTracks.find((track) => track.participant.isLocal);
  const remoteTrack = cameraTracks.find((track) => !track.participant.isLocal);
  const partnerConnected = !!remoteTrack?.publication?.track;
  const isConnected = connectionState === ConnectionState.Connected;
  const hasLocalCamera =
    !!localTrack?.publication?.track ||
    localParticipant.isCameraEnabled ||
    (localVideoRef.current?.videoWidth ?? 0) > 0;
  const isCameraReady = hasLocalCamera;

  useEffect(() => {
    setCameraHelp(getCameraHelpMessage());
  }, []);

  useEffect(() => {
    if (!isConnected || hasLocalCamera) return;

    const timer = window.setTimeout(() => {
      setCameraHelp((prev) => {
        if (prev) return prev;
        return "Camera is not available. Allow camera permission for this site, then refresh. On phones, the page must be opened over HTTPS.";
      });
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [isConnected, hasLocalCamera]);

  useEffect(() => {
    let cancelled = false;
    setOverlayError(null);
    loadOverlayImage(OVERLAY_REGISTRY[DEFAULT_OVERLAY])
      .then((img) => {
        if (!cancelled) setOverlayImage(img);
      })
      .catch(() => {
        if (!cancelled) {
          setOverlayError(
            "Could not load the frame overlay. Photos will capture without it."
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchSessionPhotos = useCallback(async () => {
    const response = await fetch(
      `/api/photos?session=${encodeURIComponent(sessionId)}`
    );
    if (!response.ok) return;
    const data = (await response.json()) as { photos?: string[] };
    if (data.photos) {
      setPhotos(data.photos);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSessionPhotos();
  }, [fetchSessionPhotos]);

  useEffect(() => {
    const waitForVideo = async (video: HTMLVideoElement | null) => {
      if (!video) return null;
      for (let i = 0; i < 10; i++) {
        if (video.videoWidth > 0 && video.videoHeight > 0) return video;
        await new Promise((r) => setTimeout(r, 100));
      }
      return video.videoWidth > 0 ? video : null;
    };

    const fulfillCapture = (captureId: string, url: string) => {
      const pending = pendingTilesRef.current.get(captureId);
      if (!pending) return;
      clearTimeout(pending.timeoutId);
      pendingTilesRef.current.delete(captureId);
      pending.resolve(url);
    };

    const failCapture = (captureId: string, reason: string) => {
      const pending = pendingTilesRef.current.get(captureId);
      if (!pending) return;
      clearTimeout(pending.timeoutId);
      pendingTilesRef.current.delete(captureId);
      pending.reject(new Error(reason));
    };

    /** Partner builds the final photo so phones never canvas-read remote WebRTC. */
    const handleCaptureRequest = async (
      captureId: string,
      initiatorTileUrl: string
    ) => {
      try {
        playShutterSound();
        const localVideo = await waitForVideo(localVideoRef.current);
        if (!localVideo) {
          throw new Error("Partner camera is not ready");
        }

        const partnerSnapshot = captureLocalSnapshot(localVideo, {
          filterCss: FILTER_PRESETS[filterKeyRef.current],
          mirror: true,
        });

        const [initiatorImage, partnerImage, overlay] = await Promise.all([
          loadBitmapFromUrl(initiatorTileUrl),
          loadBitmapFromUrl(partnerSnapshot),
          loadOverlayImage(OVERLAY_REGISTRY[DEFAULT_OVERLAY]).catch(() => null),
        ]);

        const framed = composeDualFromImages({
          localImage: initiatorImage,
          remoteImage: partnerImage,
          overlayImage: overlay,
        });

        const blob = await (await fetch(framed)).blob();
        const formData = new FormData();
        formData.append("file", blob, `anniversary-${Date.now()}.png`);
        formData.append("session", sessionId);

        const response = await fetch("/api/photos", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error("Final upload failed");

        const { url } = (await response.json()) as { url: string };
        setPhotos((prev) => addPhotoUnique(prev, url));
        await roomContext.localParticipant.publishData(
          encodePhotoMessage(url, captureId),
          { reliable: true }
        );
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : "Partner capture failed";
        try {
          await roomContext.localParticipant.publishData(
            encodeCaptureFailedMessage(captureId, reason),
            { reliable: true }
          );
        } catch {
          /* initiator will time out */
        }
      }
    };

    const handleData = (payload: Uint8Array) => {
      const message = decodeRoomMessage(
        payload instanceof Uint8Array ? payload : new Uint8Array(payload)
      );
      if (!message) return;
      if (message.type === "photo_added") {
        setPhotos((prev) => addPhotoUnique(prev, message.url));
        if (message.captureId) {
          fulfillCapture(message.captureId, message.url);
        }
      }
      if (message.type === "session_cleared") {
        setPhotos([]);
      }
      if (message.type === "filter_changed") {
        setFilterKey(message.filter);
      }
      if (message.type === "capture_request") {
        void handleCaptureRequest(
          message.captureId,
          message.initiatorTileUrl
        );
      }
      if (message.type === "capture_failed") {
        failCapture(message.captureId, message.reason);
      }
    };

    roomContext.on(RoomEvent.DataReceived, handleData);
    return () => {
      roomContext.off(RoomEvent.DataReceived, handleData);
      pendingTilesRef.current.forEach((pending) => {
        clearTimeout(pending.timeoutId);
      });
      pendingTilesRef.current.clear();
    };
  }, [roomContext, sessionId]);

  /** When a partner joins, share the current filter so both start matched. */
  useEffect(() => {
    if (!partnerConnected || !isConnected) return;

    void roomContext.localParticipant
      .publishData(encodeFilterMessage(filterKeyRef.current), {
        reliable: true,
      })
      .catch(() => {
        /* ignore publish errors while connecting */
      });
  }, [partnerConnected, isConnected, roomContext]);

  const shareFilter = useCallback(
    async (key: FilterKey) => {
      setFilterKey(key);
      try {
        await roomContext.localParticipant.publishData(
          encodeFilterMessage(key),
          { reliable: true }
        );
      } catch {
        /* partner may reconnect later */
      }
    },
    [roomContext]
  );

  const wipeIfLastParticipant = useCallback(async () => {
    if (wipedRef.current) return;
    const othersStillHere = roomContext.remoteParticipants.size > 0;
    if (othersStillHere) return;

    wipedRef.current = true;
    try {
      await roomContext.localParticipant.publishData(
        encodeSessionClearedMessage(),
        { reliable: true }
      );
    } catch {
      /* room may already be disconnecting */
    }
    try {
      await clearSessionPhotos(sessionId);
    } catch {
      /* best-effort cleanup */
    }
  }, [roomContext, sessionId]);

  const handleLeave = useCallback(async () => {
    await wipeIfLastParticipant();
    onLeave();
  }, [onLeave, wipeIfLastParticipant]);

  useEffect(() => {
    const onUnload = () => {
      if (wipedRef.current) return;
      if (roomContext.remoteParticipants.size > 0) return;
      wipedRef.current = true;
      const url = `/api/photos?session=${encodeURIComponent(sessionId)}`;
      void fetch(url, { method: "DELETE", keepalive: true });
    };

    window.addEventListener("pagehide", onUnload);
    return () => window.removeEventListener("pagehide", onUnload);
  }, [roomContext, sessionId]);

  const uploadAndSharePhoto = useCallback(
    async (dataUrl: string) => {
      setIsUploading(true);
      setCaptureError(null);

      try {
        const blob = await (await fetch(dataUrl)).blob();
        const formData = new FormData();
        formData.append("file", blob, `anniversary-${Date.now()}.png`);
        formData.append("session", sessionId);

        const response = await fetch("/api/photos", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const { url } = (await response.json()) as { url: string };
        setPhotos((prev) => addPhotoUnique(prev, url));

        await roomContext.localParticipant.publishData(
          encodePhotoMessage(url),
          { reliable: true }
        );
      } catch {
        setCaptureError(
          "Photo captured but could not be shared. Check Blob storage configuration."
        );
      } finally {
        setIsUploading(false);
      }
    },
    [sessionId, roomContext]
  );

  const waitForPartnerPhoto = useCallback((captureId: string) => {
    return new Promise<string>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        pendingTilesRef.current.delete(captureId);
        reject(new Error("Partner did not finish the photo in time"));
      }, 15000);

      pendingTilesRef.current.set(captureId, { resolve, reject, timeoutId });
    });
  }, []);

  const uploadInitiatorTile = useCallback(
    async (dataUrl: string, captureId: string) => {
      const blob = await (await fetch(dataUrl)).blob();
      const formData = new FormData();
      formData.append("file", blob, `tile-${captureId}.jpg`);
      formData.append("session", sessionId);
      formData.append("kind", "tile");
      formData.append("captureId", `${captureId}init`);

      const response = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Could not upload your snapshot");
      }
      const { url } = (await response.json()) as { url: string };
      return url;
    },
    [sessionId]
  );

  const handleCaptureComplete = useCallback(() => {
    void (async () => {
      const localVideo = localVideoRef.current;

      try {
        playShutterSound();
        setIsUploading(true);
        setCaptureError(null);

        if (!partnerConnected) {
          const dataUrl = captureDualFrame({
            localVideo,
            remoteVideo: null,
            overlayImage,
            filterCss: FILTER_PRESETS[filterKey],
            localMirror: true,
          });
          await uploadAndSharePhoto(dataUrl);
          return;
        }

        if (!localVideo || localVideo.videoWidth <= 0) {
          throw new Error("Your camera is not ready");
        }

        const captureId = createCaptureId();
        const photoPromise = waitForPartnerPhoto(captureId);
        const localSnapshot = captureLocalSnapshot(localVideo, {
          filterCss: FILTER_PRESETS[filterKey],
          mirror: true,
        });
        const initiatorTileUrl = await uploadInitiatorTile(
          localSnapshot,
          captureId
        );

        await roomContext.localParticipant.publishData(
          encodeCaptureRequestMessage(captureId, initiatorTileUrl),
          { reliable: true }
        );

        const finalUrl = await photoPromise;
        setPhotos((prev) => addPhotoUnique(prev, finalUrl));
        setIsUploading(false);
      } catch (error) {
        setIsUploading(false);
        setCaptureError(
          error instanceof Error
            ? error.message
            : "Could not capture photo. Make sure both cameras are ready."
        );
      }
    })();
  }, [
    overlayImage,
    filterKey,
    partnerConnected,
    uploadAndSharePhoto,
    roomContext,
    waitForPartnerPhoto,
    uploadInitiatorTile,
  ]);

  const handleCapture = useCallback(() => {
    if (!isCameraReady || isRunning || isUploading) return;
    start(handleCaptureComplete);
  }, [isCameraReady, isRunning, isUploading, start, handleCaptureComplete]);

  return (
    <div className="relative z-[2] mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-lg font-semibold uppercase tracking-[0.22em] text-secondary sm:text-xl sm:tracking-[0.26em]">
            Happy Anniversary
          </p>
          <h1 className="mt-2 font-display text-2xl text-ink sm:text-3xl">
            Room: {room}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            You&apos;re connected as{" "}
            <span className="font-medium text-ink">{identity}</span>
            {partnerConnected
              ? " · Partner connected"
              : " · Waiting for partner…"}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-ink-soft">
            Session photos clear when everyone leaves
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm sm:gap-3">
          <Link
            href="/home"
            className="rounded-sm border border-surface-border bg-[#FAF6F0]/95 px-3 py-2 text-xs uppercase tracking-[0.15em] text-secondary shadow-sm transition hover:border-secondary hover:bg-[#FAF6F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            Home
          </Link>
          <button
            type="button"
            onClick={() => {
              void handleLeave();
            }}
            className="rounded-sm border border-surface-border bg-[#FAF6F0]/95 px-3 py-2 text-xs uppercase tracking-[0.15em] text-secondary shadow-sm transition hover:border-secondary hover:bg-[#FAF6F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            Leave room
          </button>
          <LogoutButton className="rounded-sm border border-surface-border bg-[#FAF6F0]/95 px-3 py-2 text-xs uppercase tracking-[0.15em] text-secondary shadow-sm transition hover:border-secondary hover:bg-[#FAF6F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:opacity-50" />
        </div>
      </header>

      {!isConnected && (
        <div className="mb-6 border border-surface-border bg-[#FAF6F0]/90 px-4 py-3 text-sm text-ink-muted">
          Connecting to the shared room…
        </div>
      )}

      {cameraHelp && (
        <div
          role="status"
          className="mb-6 border border-secondary/40 bg-[#FAF6F0]/95 px-4 py-3 text-sm text-ink"
        >
          {cameraHelp}
        </div>
      )}

      {overlayError && (
        <div className="mb-6 border border-surface-border bg-[#FAF6F0]/90 px-4 py-3 text-sm text-ink-muted">
          {overlayError}
        </div>
      )}

      {captureError && (
        <div
          role="alert"
          className="mb-6 border border-red-900/30 bg-[#FAF6F0]/90 px-4 py-3 text-sm text-red-900"
        >
          {captureError}
        </div>
      )}

      <div className="relative mb-6">
        <DualCameraView
          localTrack={localTrack}
          remoteTrack={remoteTrack}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          filterKey={filterKey}
          partnerConnected={partnerConnected}
          overlaySrc={OVERLAY_REGISTRY[DEFAULT_OVERLAY]}
        />
        <CountdownOverlay count={count} />
      </div>

      <div className="mb-8 space-y-6">
        <FilterSelector
          selected={filterKey}
          onChange={(key) => {
            void shareFilter(key);
          }}
          disabled={isRunning || isUploading}
        />
        <CaptureControls
          onCapture={handleCapture}
          onCancelCountdown={cancel}
          isCountingDown={isRunning}
          disabled={!isCameraReady || !isConnected || isUploading}
        />
        {isUploading && (
          <p className="text-center text-sm text-secondary">
            Sharing photo with your partner…
          </p>
        )}
      </div>

      <Gallery
        photos={photos}
        shared
        emptyMessage="Photos from this session appear here for both of you. Download any you want to keep — they are cleared when the last person leaves."
      />
    </div>
  );
}

export function SharedPhotobooth({
  token,
  room,
  identity,
  sessionId,
  onLeave,
}: SharedPhotoboothProps) {
  if (!LIVEKIT_URL) {
    return (
      <main className="antique-stage">
        <AmbientOrbs />
        <CursorBloom />
        <div className="relative z-[2] mx-auto max-w-lg px-6 py-16 text-center text-ink">
          <p>
            LiveKit is not configured. Add{" "}
            <code className="border border-surface-border bg-[#FAF6F0] px-1">
              NEXT_PUBLIC_LIVEKIT_URL
            </code>{" "}
            to your environment variables.
          </p>
        </div>
      </main>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={LIVEKIT_URL}
      connect
      video={{
        facingMode: "user",
        resolution: { width: 1280, height: 720 },
      }}
      audio={false}
      data-lk-theme="default"
      className="antique-stage"
    >
      <AmbientOrbs />
      <CursorBloom />
      <RoomAudioRenderer />
      <PhotoboothSession
        room={room}
        identity={identity}
        sessionId={sessionId}
        onLeave={onLeave}
      />
    </LiveKitRoom>
  );
}
