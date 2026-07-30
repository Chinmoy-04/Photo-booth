interface CaptureOptions {
  video: HTMLVideoElement;
  overlayImage?: HTMLImageElement | null;
  filterCss?: string;
  mirror?: boolean;
}

/** Dual portrait print size — slightly wider than square for two side-by-side tiles. */
export const CAPTURE_WIDTH = 1400;
export const CAPTURE_HEIGHT = 1200;

function drawCoverTile(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  options: { filterCss: string; mirror: boolean }
) {
  const sw = video.videoWidth;
  const sh = video.videoHeight;
  const scale = Math.max(dw / sw, dh / sh);
  const rw = dw / scale;
  const rh = dh / scale;
  const sx = (sw - rw) / 2;
  const sy = (sh - rh) / 2;

  ctx.save();
  ctx.filter = options.filterCss;

  if (options.mirror) {
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, rw, rh, 0, 0, dw, dh);
  } else {
    ctx.drawImage(video, sx, sy, rw, rh, dx, dy, dw, dh);
  }

  ctx.restore();
}

export function captureFrame({
  video,
  overlayImage = null,
  filterCss = "none",
  mirror = true,
}: CaptureOptions): string {
  const canvas = document.createElement("canvas");
  canvas.width = CAPTURE_WIDTH;
  canvas.height = CAPTURE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context");

  drawCoverTile(ctx, video, 0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT, {
    filterCss,
    mirror,
  });

  ctx.filter = "none";

  if (overlayImage) {
    ctx.drawImage(overlayImage, 0, 0, canvas.width, canvas.height);
  }

  return canvas.toDataURL("image/png");
}

interface DualCaptureOptions {
  localVideo: HTMLVideoElement | null;
  remoteVideo: HTMLVideoElement | null;
  overlayImage?: HTMLImageElement | null;
  filterCss?: string;
  localMirror?: boolean;
}

function isVideoReady(video: HTMLVideoElement | null): video is HTMLVideoElement {
  return !!video && video.videoWidth > 0 && video.videoHeight > 0;
}

export function captureDualFrame({
  localVideo,
  remoteVideo,
  overlayImage = null,
  filterCss = "none",
  localMirror = true,
}: DualCaptureOptions): string {
  const hasLocal = isVideoReady(localVideo);
  const hasRemote = isVideoReady(remoteVideo);

  if (!hasLocal && !hasRemote) {
    throw new Error("No camera feeds ready to capture");
  }

  if (hasLocal && !hasRemote) {
    return captureFrame({
      video: localVideo,
      overlayImage,
      filterCss,
      mirror: localMirror,
    });
  }

  if (!hasLocal && hasRemote) {
    return captureFrame({
      video: remoteVideo,
      overlayImage,
      filterCss,
      mirror: false,
    });
  }

  const canvas = document.createElement("canvas");
  canvas.width = CAPTURE_WIDTH;
  canvas.height = CAPTURE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context");

  const tileWidth = CAPTURE_WIDTH / 2;

  drawCoverTile(ctx, localVideo!, 0, 0, tileWidth, CAPTURE_HEIGHT, {
    filterCss,
    mirror: localMirror,
  });

  drawCoverTile(
    ctx,
    remoteVideo!,
    tileWidth,
    0,
    tileWidth,
    CAPTURE_HEIGHT,
    { filterCss, mirror: false }
  );

  ctx.filter = "none";

  if (overlayImage) {
    ctx.drawImage(overlayImage, 0, 0, canvas.width, canvas.height);
  }

  return canvas.toDataURL("image/png");
}
