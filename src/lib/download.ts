/**
 * Download an image from a data URL or remote URL (e.g. Vercel Blob).
 * Fetches remote URLs into a blob so cross-origin `download` attributes work.
 */
export async function downloadImage(src: string, filename: string) {
  let href = src;
  let objectUrl: string | null = null;

  try {
    if (!src.startsWith("data:")) {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Download failed (${response.status})`);
      }
      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);
      href = objectUrl;
    }

    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}
