import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // picsum.photos stands in for real course/roadmap cover thumbnails until there's a
    // backend/CMS to source them from — see src/lib/placeholder-image.ts.
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
  },
};

export default nextConfig;
