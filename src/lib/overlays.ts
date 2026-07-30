export const OVERLAY_REGISTRY = {
  anniversary: "/overlays/frame-ornate.svg",
} as const;

export type OverlayKey = keyof typeof OVERLAY_REGISTRY;

export function loadOverlayImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
