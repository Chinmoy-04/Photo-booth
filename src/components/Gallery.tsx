"use client";

import { downloadImage } from "@/lib/download";

interface GalleryProps {
  photos: string[];
  onClear?: () => void;
  shared?: boolean;
  emptyMessage?: string;
}

export function Gallery({
  photos,
  onClear,
  shared = false,
  emptyMessage,
}: GalleryProps) {
  if (photos.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-surface-border bg-[#FAF6F0]/50 p-8 text-center text-sm text-ink-muted">
        {emptyMessage ??
          (shared
            ? "Portraits you take together will appear here for both of you to download."
            : "Your session portraits will appear here.")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink">
          {shared ? "Shared gallery" : "Session gallery"} ({photos.length})
        </h2>
        {!shared && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="cursor-pointer text-xs uppercase tracking-[0.15em] text-secondary underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo, index) => (
          <div
            key={`${photo.slice(-24)}-${index}`}
            className="overflow-hidden rounded-sm border border-surface-border bg-[#FAF6F0]"
          >
            <img
              src={photo}
              alt={`Captured portrait ${index + 1}`}
              className="aspect-[7/6] w-full object-cover"
            />
            <div className="p-2">
              <button
                type="button"
                onClick={() => {
                  void downloadImage(
                    photo,
                    `anniversary-photo-${Date.now()}.png`
                  );
                }}
                className="w-full cursor-pointer rounded-sm border border-surface-border py-2 text-xs font-medium uppercase tracking-[0.12em] text-ink transition duration-200 hover:border-secondary hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
