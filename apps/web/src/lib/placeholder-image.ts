/**
 * Deterministic placeholder cover photo for a course/roadmap card — stands in for a real
 * thumbnail until there's a backend/CMS to upload and source one from. Same `seed` always
 * resolves to the same image, so a given course keeps a stable cover across renders.
 */
export function placeholderCoverUrl(seed: string, width = 480, height = 240) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}
