/** Local illustration set supplied with the mock. Keep the assignment deterministic so
 * a roadmap retains the same visual identity as the catalogue grows. */
const COVER_IMAGES = [
  "/anh2.svg",
  "/anh3.svg",
  "/anh4.svg",
  "/anh5.svg",
  "/anh6.svg",
  "/anh7.svg",
  "/anh8.svg",
  "/anh9.svg",
];

export const PAGE_ILLUSTRATIONS = {
  dashboard: "/anh1.jfif",
  explore: "/anh2.svg",
  paths: "/anh3.svg",
  practice: "/anh4.svg",
  workspace: "/anh8.svg",
} as const;

export function contentIllustration(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }
  return COVER_IMAGES[Math.abs(hash) % COVER_IMAGES.length];
}
