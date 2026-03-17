/**
 * Normalize various YouTube URL formats to a video ID,
 * then return an embed URL.
 */
function normalizeYoutubeUrl(input: string): string {
  if (!input) return input;
  let cleaned = input.trim();

  // Already a bare ID (11 chars, no slashes)
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleaned)) return cleaned;

  try {
    const url = new URL(cleaned);
    // youtube.com/watch?v=ID
    if (url.searchParams.has("v")) return url.searchParams.get("v")!;
    // youtu.be/ID
    if (url.hostname === "youtu.be") return url.pathname.slice(1);
    // youtube.com/embed/ID or /shorts/ID
    const match = url.pathname.match(/\/(embed|shorts)\/([a-zA-Z0-9_-]+)/);
    if (match) return match[2];
  } catch {
    // not a URL
  }

  return cleaned;
}

export function getYoutubeEmbedUrl(idOrUrl: string): string {
  const id = normalizeYoutubeUrl(idOrUrl);
  return `https://www.youtube.com/embed/${id}`;
}
